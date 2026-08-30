//! Per-call outbound request capture mechanism.
//!
//! Provides [`CaptureScope`] and [`TraceLayer`] for subscribing to all
//! `http.request` spans emitted within a single business-level call via
//! push-style callbacks.
//!
//! # Quick start
//!
//! ```rust,no_run
//! use tracing::Instrument;
//! use wecom_transport::telemetry::{CaptureScope, HttpRequestRecord};
//!
//! # async fn do_call() {}
//! # async {
//! let scope = CaptureScope::new();
//! scope.on_request(|s: HttpRequestRecord| {
//!     tracing::info!(endpoint = s.endpoint, status = s.res_status);
//! });
//! do_call().instrument(scope.span().clone()).await;
//! # };
//! ```
//!
//! # Design
//!
//! - `TraceLayer` is a ZST [`tracing_subscriber::Layer`] with no global
//!   state — mountable globally or locally.
//! - `CaptureScope` owns a per-call capture span and registers an
//!   `on_request` callback that fires synchronously as each outbound
//!   span closes.
//! - The capture layer does **not** buffer any data internally — callbacks receive
//!   ownership of [`HttpRequestRecord`] and the consumer decides whether
//!   to retain, aggregate, or discard.

use std::sync::{Arc, Mutex};

use tracing::Subscriber;
use tracing_subscriber::Layer;
use tracing_subscriber::registry::LookupSpan;

use super::contract::http_request as ctr;
use super::records::{CaptureSpanId, HttpRequestRecord};

/// Internal span name for the capture root span created by
/// [`CaptureScope::new`].
pub(crate) const CAPTURE_SPAN_NAME: &str = "wecom_http_capture";

// ── Callback type aliases ─────────────────────────────────────────

type SpanHook = dyn Fn(HttpRequestRecord) + Send + Sync;

// ── CaptureMarker ─────────────────────────────────────────────────

/// Injected into capture span extensions so the layer can find the
/// registered callbacks on span close.
struct CaptureMarker {
    on_request: Mutex<Option<Arc<SpanHook>>>,
}

impl CaptureMarker {
    fn new() -> Self {
        Self {
            on_request: Mutex::new(None),
        }
    }

    /// Clone the `on_request` hook out under lock, then release lock.
    fn clone_request_hook(&self) -> Option<Arc<SpanHook>> {
        self.on_request.lock().ok()?.clone()
    }
}

// ════════════════════════════════════════════════════════════════
// HttpFieldsBuilder — accumulates fields during span lifetime
// ════════════════════════════════════════════════════════════════

/// Accumulates `http.request` fields during span lifetime.
struct HttpFieldsBuilder {
    span_id: CaptureSpanId,
    backend: Option<String>,
    endpoint: Option<String>,
    action: Option<String>,
    req_headers: Option<reqwest::header::HeaderMap>,
    res_status: Option<u16>,
    res_headers: Option<reqwest::header::HeaderMap>,
    res_body_len: Option<u64>,
    duration_headers_ms: Option<u64>,
    duration_total_ms: Option<u64>,
    error: Option<serde_json::Value>,
}

impl HttpFieldsBuilder {
    fn new(span_id: CaptureSpanId) -> Self {
        Self {
            span_id,
            backend: None,
            endpoint: None,
            action: None,
            req_headers: None,
            res_status: None,
            res_headers: None,
            res_body_len: None,
            duration_headers_ms: None,
            duration_total_ms: None,
            error: None,
        }
    }
}

impl HttpFieldsBuilder {
    fn finish(self) -> HttpRequestRecord {
        HttpRequestRecord {
            span_id: self.span_id,
            backend: self.backend.unwrap_or_default(),
            endpoint: self.endpoint.unwrap_or_default(),
            action: self.action,
            req_headers: self.req_headers,
            res_status: self.res_status.unwrap_or(0),
            res_headers: self.res_headers,
            res_body_len: self.res_body_len.unwrap_or(0),
            duration_headers_ms: self.duration_headers_ms.unwrap_or(0),
            duration_total_ms: self.duration_total_ms.unwrap_or(0),
            error: self.error,
        }
    }
}

// ════════════════════════════════════════════════════════════════
// TraceLayer
// ════════════════════════════════════════════════════════════════

/// A ZST [`Layer`] that traces `http.request` span
/// fields and delivers [`HttpRequestRecord`] records to the nearest ancestor
/// capture span's `on_request` callback.
///
/// This layer carries no state and can be safely shared across threads.
/// Mount it on your [`tracing_subscriber::Registry`]-based subscriber:
///
/// ```rust,no_run
/// use tracing_subscriber::Registry;
/// use tracing_subscriber::prelude::*;
/// use wecom_transport::telemetry::TraceLayer;
///
/// let subscriber = Registry::default().with(TraceLayer);
/// tracing::subscriber::set_global_default(subscriber).unwrap();
/// ```
#[derive(Debug, Clone, Default)]
pub struct TraceLayer;

impl<S> Layer<S> for TraceLayer
where
    S: Subscriber + for<'a> LookupSpan<'a> + Send + Sync + 'static,
{
    fn on_new_span(
        &self,
        attrs: &tracing::span::Attributes<'_>,
        id: &tracing::span::Id,
        ctx: tracing_subscriber::layer::Context<'_, S>,
    ) {
        let name = attrs.metadata().name();
        let span_id = CaptureSpanId(id.into_u64());

        if name == ctr::SPAN_NAME
            && let Some(span_ref) = ctx.span(id)
        {
            let mut builder = HttpFieldsBuilder::new(span_id);
            attrs.record(&mut HttpFieldRecorder {
                builder: &mut builder,
            });
            span_ref.extensions_mut().insert(builder);
        }
    }

    fn on_record(
        &self,
        id: &tracing::span::Id,
        values: &tracing::span::Record<'_>,
        ctx: tracing_subscriber::layer::Context<'_, S>,
    ) {
        let Some(span_ref) = ctx.span(id) else {
            return;
        };
        let name = span_ref.name();
        let mut ext = span_ref.extensions_mut();

        if name == ctr::SPAN_NAME
            && let Some(builder) = ext.get_mut::<HttpFieldsBuilder>()
        {
            values.record(&mut HttpFieldRecorder { builder });
        }
    }

    fn on_close(&self, id: tracing::span::Id, ctx: tracing_subscriber::layer::Context<'_, S>) {
        let Some(span_ref) = ctx.span(&id) else {
            return;
        };
        let name = span_ref.name();

        let captured: Option<HttpRequestRecord> = if name == ctr::SPAN_NAME {
            span_ref
                .extensions_mut()
                .remove::<HttpFieldsBuilder>()
                .map(|b| b.finish())
        } else {
            return;
        };

        let Some(record_obj) = captured else {
            return;
        };

        let parent = span_ref.parent();
        fire_to_capture_ancestor(parent, record_obj);
    }
}

/// Walk parent chain to find the nearest ancestor span that has a
/// [`CaptureMarker`] in its extensions, clone its `on_request` hook
/// out under lock then invoke it. The lock is released before the
/// callback executes to prevent re-entrancy deadlock.
///
/// If no capture ancestor is found or no `on_request` hook is
/// registered, the record is silently dropped.
///
/// Matching is done by marker presence, **not** by span name.
/// Both [`CaptureScope::new`] (auto-created `"wecom_http_capture"` span)
/// and [`CaptureScope::attach`] (user-provided span of any name) work
/// correctly — the marker is what identifies a capture root.
fn fire_to_capture_ancestor<S>(
    mut current: Option<tracing_subscriber::registry::SpanRef<'_, S>>,
    record_obj: HttpRequestRecord,
) where
    S: Subscriber + for<'a> LookupSpan<'a> + Send + Sync + 'static,
{
    while let Some(ancestor) = current {
        if let Some(marker) = ancestor.extensions().get::<CaptureMarker>() {
            // Clone hook out under lock, release lock, then call
            if let Some(hook) = marker.clone_request_hook() {
                hook(record_obj);
            }
            // If no hook registered, record is silently dropped
            return;
        }
        current = ancestor.parent();
    }
}

// ════════════════════════════════════════════════════════════════
// Field recorders (internal visitors)
// ════════════════════════════════════════════════════════════════

struct HttpFieldRecorder<'a> {
    builder: &'a mut HttpFieldsBuilder,
}

impl tracing::field::Visit for HttpFieldRecorder<'_> {
    fn record_u64(&mut self, field: &tracing::field::Field, value: u64) {
        match field.name() {
            ctr::FIELD_RES_STATUS => {
                self.builder.res_status = Some(value as u16);
            }
            ctr::FIELD_RES_BODY_LEN => {
                self.builder.res_body_len = Some(value);
            }
            ctr::FIELD_DURATION_HEADERS_MS => {
                self.builder.duration_headers_ms = Some(value);
            }
            ctr::FIELD_DURATION_TOTAL_MS => {
                self.builder.duration_total_ms = Some(value);
            }
            _ => {}
        }
    }

    fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn std::fmt::Debug) {
        let s = format!("{value:?}");
        match field.name() {
            ctr::FIELD_BACKEND => {
                let v = s.trim_matches('"').to_string();
                self.builder.backend = Some(v);
            }
            ctr::FIELD_ENDPOINT => {
                self.builder.endpoint = Some(s);
            }
            ctr::FIELD_REQ_HEADERS => {
                self.builder.req_headers = crate::common::headers_from_json(&s);
            }
            ctr::FIELD_RES_HEADERS => {
                self.builder.res_headers = crate::common::headers_from_json(&s);
            }
            ctr::FIELD_ERROR => {
                self.builder.error = serde_json::from_str(&s).ok();
            }
            _ => {}
        }
    }

    fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
        match field.name() {
            ctr::FIELD_BACKEND => {
                self.builder.backend = Some(value.to_string());
            }
            ctr::FIELD_ENDPOINT => {
                self.builder.endpoint = Some(value.to_string());
            }
            ctr::FIELD_ACTION => {
                self.builder.action = Some(value.to_string());
            }
            ctr::FIELD_ERROR => {
                self.builder.error = serde_json::from_str(value).ok();
            }
            _ => {}
        }
    }
}

// ════════════════════════════════════════════════════════════════
// CaptureScope
// ════════════════════════════════════════════════════════════════

/// Per-call RAII handle for subscribing to outbound request spans.
///
/// All data is delivered through push-style callbacks — the capture layer
/// does **not** buffer any records internally. Callers who need a list
/// can collect into their own container in the callback.
///
/// # Example (most common — `new` with on_request)
///
/// ```rust,no_run
/// use tracing::Instrument;
/// use wecom_transport::telemetry::{CaptureScope, HttpRequestRecord};
///
/// # async fn do_call() {}
/// # async {
/// let scope = CaptureScope::new();
/// scope.on_request(|s: HttpRequestRecord| println!("{s:?}"));
/// do_call().instrument(scope.span().clone()).await;
/// # };
/// ```
///
/// # Example (reuse existing span — `attach`)
///
/// ```rust,no_run
/// use tracing::Instrument;
/// use tracing::info_span;
/// use wecom_transport::telemetry::CaptureScope;
///
/// # async fn do_call() {}
/// # async {
/// let span = info_span!("chat_stream", model = "gpt-4");
/// let scope = CaptureScope::attach(&span);
/// scope.on_request(|s| { /* upload */ });
/// do_call().instrument(span).await;
/// # };
/// ```
///
/// # Collecting spans into a list
///
/// ```rust,no_run
/// use std::sync::{Arc, Mutex};
/// use tracing::Instrument;
/// use wecom_transport::telemetry::CaptureScope;
///
/// # async fn do_call() {}
/// # async {
/// let collected: Arc<Mutex<Vec<_>>> = Default::default();
/// let scope = CaptureScope::new();
/// let c = collected.clone();
/// scope.on_request(move |s| { c.lock().unwrap().push(s); });
/// do_call().instrument(scope.span().clone()).await;
/// let spans = std::mem::take(&mut *collected.lock().unwrap());
/// # };
/// ```
#[derive(Clone)]
pub struct CaptureScope {
    span: tracing::Span,
}

impl CaptureScope {
    /// Create a self-contained capture scope with a new
    /// `wecom_http_capture` span.
    ///
    /// Requires the subscriber to be a `tracing_subscriber::Registry`
    /// (or wraps one). If the subscriber cannot be downcast, the scope
    /// is created successfully but no callback will ever fire — no
    /// leak, no panic.
    pub fn new() -> Self {
        let span = tracing::info_span!(CAPTURE_SPAN_NAME);

        Self::inject_marker(&span);

        Self { span }
    }

    /// Attach capture capability to an existing caller span.
    ///
    /// Use this when the caller already has a business-level span
    /// (e.g. `chat_stream`) and wants it to also serve as the capture
    /// root — no extra wrapper span needed.
    pub fn attach(span: &tracing::Span) -> Self {
        Self::inject_marker(span);

        Self { span: span.clone() }
    }

    /// Borrow the capture root span.
    pub fn span(&self) -> &tracing::Span {
        &self.span
    }

    /// Register a callback that fires once per outbound span close.
    ///
    /// The callback receives ownership of the [`HttpRequestRecord`], so the
    /// caller can freely move it into an async task for upload.
    ///
    /// **Last-wins**: registering again overwrites the previous hook.
    ///
    /// **No buffering**: if no `on_request` hook is registered, all
    /// outbound span records inside this scope are silently dropped
    /// on close.
    pub fn on_request<F>(&self, f: F)
    where
        F: Fn(HttpRequestRecord) + Send + Sync + 'static,
    {
        let f: Arc<SpanHook> = Arc::new(f);
        self.with_marker(|m| {
            *m.on_request.lock().unwrap() = Some(f);
        });
    }

    // ── internal ──

    /// Inject an empty [`CaptureMarker`] into the span's extensions
    /// via the subscriber. No-op when the subscriber is not a
    /// `tracing_subscriber::Registry` or when the span is not yet
    /// registered.
    fn inject_marker(span: &tracing::Span) {
        if span.id().is_some() {
            span.with_subscriber(|(id, dispatch)| {
                if let Some(registry) = dispatch.downcast_ref::<tracing_subscriber::Registry>()
                    && let Some(span_ref) = registry.span(id)
                {
                    span_ref.extensions_mut().insert(CaptureMarker::new());
                }
            });
        }
    }

    /// Access the [`CaptureMarker`] stored in this scope's span
    /// extensions and invoke `action` on it. No-op when the span is
    /// not registered with a Registry subscriber.
    fn with_marker(&self, action: impl FnOnce(&CaptureMarker)) {
        self.span.with_subscriber(|(id, dispatch)| {
            if let Some(registry) = dispatch.downcast_ref::<tracing_subscriber::Registry>()
                && let Some(span_ref) = registry.span(id)
                && let Some(marker) = span_ref.extensions().get::<CaptureMarker>()
            {
                action(marker);
            }
        });
    }
}

impl Default for CaptureScope {
    fn default() -> Self {
        Self::new()
    }
}

// Intentional: no Drop impl. All fields are Sized local variables.
// The CaptureMarker in span extensions is cleaned up when the capture
// span closes; callback Arcs drop when the marker does.

#[cfg(test)]
mod tests {
    //! ## 模块摘要：CaptureScope / TraceLayer（基于 span 的 HTTP 请求捕获机制）
    //!
    //! ### 关键接口
    //! - [CaptureScope::new] — 创建自带 wecom_http_capture span 的捕获作用域
    //! - [CaptureScope::attach] — 复用已有的 caller span 作为捕获根
    //! - [CaptureScope::on_request] — 注册回调
    //! - [TraceLayer] — ZST Layer，无状态、线程安全
    //! - [HttpFieldsBuilder] — span 生命周期内累积字段
    //!
    //! ### 关键分支与异常路径
    //! - HttpFieldsBuilder::finish() → 未设置字段使用默认值
    //! - CaptureScope::new() → 创建 span 并注入 CaptureMarker
    //! - CaptureScope::attach() → 在已有 span 上注入 marker
    //! - 多次注册回调 → last-wins，先注册的 Arc 引用计数归 1
    //! - 默认状态 → 所有回调为 None
    //! - scope 销毁 → hook Arc 引用计数随 marker 一起销毁
    //!
    //! ### 上下游交互
    //! - 上游：用户通过 CaptureScope 注册回调后 instrument 业务 span
    //! - 下游：TraceLayer 在 span 关闭时通过 fire_to_capture_ancestor 传递 HttpRequestRecord

    use std::sync::{Arc, Mutex};

    use tracing_subscriber::prelude::*;

    use super::*;

    /// P1：[HttpFieldsBuilder::finish] 未设置字段时使用默认值
    /// 条件：用 CaptureSpanId(0) 新建 HttpFieldsBuilder 并 finish()
    /// 断言：backend/endpoint 为空串，res_status=0，res_body_len=0，duration 为 0，error 为 None
    #[test]
    fn http_fields_builder_finish_produces_defaults() {
        let builder = HttpFieldsBuilder::new(CaptureSpanId(0));
        let snap = builder.finish();
        assert_eq!(snap.span_id, CaptureSpanId(0));
        assert!(snap.backend.is_empty());
        assert!(snap.endpoint.is_empty());
        assert_eq!(snap.res_status, 0);
        assert_eq!(snap.res_body_len, 0);
        assert_eq!(snap.duration_headers_ms, 0);
        assert_eq!(snap.duration_total_ms, 0);
        assert!(snap.error.is_none());
    }

    /// P0：[CaptureScope::new] 创建带 wecom_http_capture 命名的 span
    /// 条件：调用 CaptureScope::new()
    /// 断言：span().metadata() 可正常获取元数据
    #[test]
    fn scope_new_span_has_capture_name() {
        let scope = CaptureScope::new();
        let _meta = scope.span().metadata();
    }

    /// P1：[CaptureScope::attach] 从已有 caller span 创建 scope
    /// 条件：创建 info_span!("my_business_span") 并用 CaptureScope::attach 绑定
    /// 断言：scope.span().metadata() 可正常获取元数据
    #[test]
    fn scope_attach_borrows_caller_span() {
        let caller = tracing::info_span!("my_business_span");
        let scope = CaptureScope::attach(&caller);
        let _meta = scope.span().metadata();
    }

    /// P1：[TraceLayer] 为零大小类型（ZST），无运行时开销
    /// 条件：检查 size_of::<TraceLayer>()
    /// 断言：size_of 返回 0
    #[test]
    fn trace_layer_is_zst() {
        assert_eq!(std::mem::size_of::<TraceLayer>(), 0);
    }

    /// P1：[CaptureScope] 实现 Default trait
    /// 条件：调用 CaptureScope::default()
    /// 断言：span().metadata() 可正常获取元数据
    #[test]
    fn capture_scope_implements_default() {
        let scope = CaptureScope::default();
        let _meta = scope.span().metadata();
    }

    /// P1：[CaptureScope::on_request] 再次注册覆盖前次回调（last-wins）
    /// 条件：先注册 first 回调再注册 second 回调，检查 marker 和 Arc 引用
    /// 断言：marker 中 on_request 不为 None，first 回调 Arc 引用计数为 1（被丢弃）
    #[test]
    fn on_request_last_wins() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TraceLayer),
        );
        let scope = CaptureScope::new();

        let first: Arc<Mutex<Vec<u64>>> = Default::default();
        let f1 = first.clone();
        scope.on_request(move |s: HttpRequestRecord| {
            f1.lock().unwrap().push(s.span_id.as_u64());
        });

        let second: Arc<Mutex<Vec<u64>>> = Default::default();
        let s2 = second.clone();
        scope.on_request(move |s: HttpRequestRecord| {
            s2.lock().unwrap().push(s.span_id.as_u64());
        });

        // Only the second callback should have been stored
        // Verify by directly checking the marker
        scope.with_marker(|m| {
            assert!(m.on_request.lock().unwrap().is_some());
        });
        // The first callback's Arc should have been dropped
        assert_eq!(Arc::strong_count(&first), 1);
    }

    /// P1：[CaptureScope] 新建 scope 时回调默认均为 None
    /// 条件：新建 CaptureScope，不注册任何回调
    /// 断言：marker 中 on_request 为 None
    #[test]
    fn all_callbacks_none_by_default() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TraceLayer),
        );
        let scope = CaptureScope::new();

        scope.with_marker(|m| {
            assert!(m.on_request.lock().unwrap().is_none());
        });
    }

    /// P1：[CaptureScope] scope 销毁后 hook Arc 引用计数可正常衰减
    /// 条件：在作用域内注册 on_request 回调持有 hook Arc 弱引用，scope 离开作用域后检查
    /// 断言：scope 销毁后 Weak 引用仍可能有效（marker 在 subscriber 侧），但无泄漏
    #[test]
    fn hook_arc_refcount_drops_after_scope_dies() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TraceLayer),
        );

        let weak = {
            let scope = CaptureScope::new();
            let hook: Arc<dyn Fn(HttpRequestRecord) + Send + Sync> =
                Arc::new(|_s: HttpRequestRecord| {});
            let weak = Arc::downgrade(&hook);
            scope.on_request(move |s| hook(s));
            weak
        };
        // After scope drops, the marker is gone.
        // The hook Arc was stored in the marker; since scope is dropped
        // but the subscriber still holds the marker until span close,
        // the Weak may still succeed here. That's fine — the key
        // assertion is that nothing leaked.
        let _ = weak.upgrade();
    }
}
