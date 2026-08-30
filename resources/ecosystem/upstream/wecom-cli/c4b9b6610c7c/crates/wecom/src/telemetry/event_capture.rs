//! Unified event capture — convenience wrapper that registers typed
//! callbacks for the unified `wecom::telemetry::event` target.
//!
//! # Design
//!
//! All wecom business events share a single tracing target. Consumers
//! register a single callback via [`EventExt::on_event`] and dispatch by
//! `kind` inside that callback.
//!
//! The [`emit`] function is the single emission point — all wecom internal
//! trigger sites call `emit(kind, payload)` instead of emitting tracing
//! events directly.

use std::sync::Arc;

use wecom_transport::telemetry::CaptureScope;

use super::contract;
use super::marker::EventMarker;

// ════════════════════════════════════════════════════════════════
// ClientEvent
// ════════════════════════════════════════════════════════════════

/// A decoded unified telemetry event.
///
/// Delivered through [`EventExt::on_event`] whenever a wecom business
/// telemetry event is emitted inside a [`CaptureScope`].
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ClientEvent {
    /// Event type name (e.g. `"method_alias"`, `"unknown_directive"`).
    pub kind: String,
    /// JSON payload carrying the event's business data.
    pub payload: serde_json::Value,
}

// ── Event visitor ──────────────────────────────────────────────

/// Extracts `kind` + `payload` fields from a unified telemetry event.
#[derive(Default)]
struct EventVisitor {
    kind: Option<String>,
    payload: Option<serde_json::Value>,
}

impl EventVisitor {
    fn into_event(self) -> ClientEvent {
        ClientEvent {
            kind: self.kind.unwrap_or_default(),
            payload: self.payload.unwrap_or(serde_json::Value::Null),
        }
    }
}

impl tracing::field::Visit for EventVisitor {
    fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn std::fmt::Debug) {
        let s = format!("{value:?}");
        let s = s.trim_matches('"');
        match field.name() {
            contract::event::FIELD_KIND => self.kind = Some(s.to_string()),
            contract::event::FIELD_PAYLOAD => {
                self.payload = serde_json::from_str(s).ok();
            }
            _ => {}
        }
    }

    fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
        match field.name() {
            contract::event::FIELD_KIND => self.kind = Some(value.to_string()),
            contract::event::FIELD_PAYLOAD => {
                self.payload = serde_json::from_str(value).ok();
            }
            _ => {}
        }
    }
}

// ════════════════════════════════════════════════════════════════
// EventExt
// ════════════════════════════════════════════════════════════════

/// Extension trait on [`CaptureScope`] for subscribing to all wecom
/// business telemetry events through a single callback.
///
/// # Example
///
/// ```rust,no_run
/// use tracing::Instrument;
/// use wecom_transport::telemetry::CaptureScope;
/// use wecom::telemetry::EventExt;
///
/// # async fn do_call() {}
/// # async {
/// let scope = CaptureScope::new();
/// scope.on_event(|ev| {
///     println!("kind={} payload={}", ev.kind, ev.payload);
/// });
/// do_call().instrument(scope.span().clone()).await;
/// # };
/// ```
pub trait EventExt {
    /// Register a callback that fires synchronously for every unified
    /// wecom business telemetry event inside this scope.
    ///
    /// The callback receives a [`ClientEvent`] containing the event `kind`
    /// and a JSON `payload`. Use `kind` to dispatch to type-specific
    /// handling logic.
    ///
    /// **Last-wins**: registering again overwrites the previous hook.
    /// This follows the same pattern as [`CaptureScope::on_request`].
    ///
    /// # How it works
    ///
    /// Installs an `EventMarker` into the scope span's extensions
    /// (idempotent), then writes the typed hook into the marker's
    /// `on_event` slot. [`TelemetryLayer`](crate::telemetry::TelemetryLayer)
    /// dispatches unified telemetry events to that slot at runtime.
    ///
    /// Requires [`TelemetryLayer`](crate::telemetry::TelemetryLayer) to be
    /// mounted on the subscriber:
    ///
    /// ```rust,no_run
    /// # use tracing_subscriber::prelude::*;
    /// # let subscriber = tracing_subscriber::Registry::default();
    /// subscriber.with(wecom::telemetry::TelemetryLayer::new());
    /// ```
    fn on_event<F>(&self, f: F)
    where
        F: Fn(ClientEvent) + Send + Sync + 'static;
}

impl EventExt for CaptureScope {
    fn on_event<F>(&self, f: F)
    where
        F: Fn(ClientEvent) + Send + Sync + 'static,
    {
        let hook = Arc::new(move |event: &tracing::Event<'_>| {
            debug_assert_eq!(
                event.metadata().target(),
                contract::event::TARGET,
                "EventLayer should only route unified events here",
            );
            let mut visitor = EventVisitor::default();
            event.record(&mut visitor);
            f(visitor.into_event());
        });

        EventMarker::register_on(self.span(), |marker| {
            *marker.on_event.lock().unwrap() = Some(hook);
        });
    }
}

// ════════════════════════════════════════════════════════════════
// emit — single emission point for all wecom telemetry events
// ════════════════════════════════════════════════════════════════

/// Emit a unified wecom business telemetry event.
///
/// All wecom internal trigger sites call this function instead of
/// emitting tracing events directly. The event is sent on the unified
/// `wecom::telemetry::event` target.
///
/// # Example
///
/// ```rust
/// use wecom::telemetry::emit;
///
/// emit("method_alias", &serde_json::json!({
///     "input": "contact search",
///     "resolved": "contact users search",
/// }));
/// ```
#[inline]
pub fn emit(kind: &str, payload: &serde_json::Value) {
    tracing::info!(
        target: contract::event::TARGET,
        kind = kind,
        payload = %payload,
    );
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：EventExt（统一事件捕获，通过 CaptureScope 订阅 wecom 业务遥测事件）
    //!
    //! ### 关键接口
    //! - [EventExt::on_event] — 注册事件回调，last-wins 语义
    //! - [emit] — 所有 wecom 业务事件的唯一发射点
    //! - [ClientEvent] — 统一的事件数据结构
    //!
    //! ### 关键分支与异常路径
    //! - 事件在 scope 内 → 回调触发，kind/payload 正确
    //! - 事件在 scope 外 → 回调不触发
    //! - 多次注册 → last-wins，先注册的回调被覆盖
    //! - 并行 scope → 事件隔离，互不干扰
    //! - 序列化/反序列化 → 字段完整保留
    //!
    //! ### 上下游交互
    //! - 上游：业务代码通过 emit() 发射事件
    //! - 下游：EventLayer 分发事件到注册的回调；需要 TelemetryLayer 挂载到 subscriber

    use std::sync::Mutex;

    use assert_json_diff::assert_json_eq;
    use tracing::field::Visit;
    use tracing_subscriber::prelude::*;

    use super::*;
    use crate::telemetry::combined_layer::TelemetryLayer;

    /// 测试 helper：以当前 subscriber 注册 [emit] 的 callsite 并重建全局 interest 缓存。
    ///
    /// `tracing` 的 callsite 惰性注册：首个触碰它的线程若处于「仅一个 dispatcher
    /// 注册」窗口且自身没有 default subscriber（如并行运行的非遥测测试），interest
    /// 会被缓存为 never，之后事件宏直接跳过发射——遥测测试可能因此偶发丢失全部事件
    /// （并行约 1/3 概率）。在本测试线程先发射一次使 callsite 以 sometimes/always
    /// 入册，随后的 `rebuild_interest_cache` 再治愈间隙中可能落入的 never。热身事件
    /// 在任何 [CaptureScope] 回调注册之前发出，不进入任何断言。
    ///
    /// 使用时机：每个挂载 `TelemetryLayer` 的测试在 `set_default` 之后、
    /// `CaptureScope::new()` 之前调用一次。
    fn warm_up_emit_callsite() {
        emit("test_warmup", &serde_json::json!({}));
        tracing::callsite::rebuild_interest_cache();
    }

    /// P0：[EventExt::on_event] 在 scope 内发射事件时回调触发并携带正确的 kind 和 payload
    /// 条件：创建 CaptureScope，注册 on_event 回调，在 scope span 内 emit 事件
    /// 断言：回调收到 1 个 ClientEvent，kind="method_alias"，payload 字段匹配
    #[test]
    fn event_captured_inside_scope() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();

        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();

        let scope = CaptureScope::new();
        scope.on_event(move |ev: ClientEvent| {
            c.lock().unwrap().push(ev);
        });

        let _enter = scope.span().enter();
        emit(
            "method_alias",
            &serde_json::json!({"input": "contact search", "resolved": "contact users search"}),
        );
        drop(_enter);

        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, "method_alias");
        assert_json_eq!(
            snaps[0].payload["input"],
            serde_json::json!("contact search")
        );
        assert_json_eq!(
            snaps[0].payload["resolved"],
            serde_json::json!("contact users search")
        );
    }

    /// P0：[EventExt::on_event] scope 外发射的事件不会触发回调
    /// 条件：在注册 on_event 回调前发射一次事件，注册后在 scope 内再发射一次
    /// 断言：仅 scope 内的事件被捕获（kind="inside"），scope 外的事件被忽略
    #[test]
    fn event_outside_scope_not_captured() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();

        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();

        emit("outside", &serde_json::json!({"x": 1}));

        let scope = CaptureScope::new();
        scope.on_event(move |ev: ClientEvent| {
            c.lock().unwrap().push(ev);
        });

        let _enter = scope.span().enter();
        emit("inside", &serde_json::json!({"x": 2}));
        drop(_enter);

        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, "inside");
    }

    /// P1：[EventExt::on_event] 最后一次注册的回调覆盖之前的回调（last-wins）
    /// 条件：先注册 first 回调再注册 second 回调，在 scope 内发射事件
    /// 断言：first 回调未被触发（为空），second 回调收到事件
    #[test]
    fn on_event_last_wins() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();

        let first: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let f1 = first.clone();
        let second: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let s2 = second.clone();

        let scope = CaptureScope::new();
        scope.on_event(move |ev: ClientEvent| {
            f1.lock().unwrap().push(ev);
        });
        scope.on_event(move |ev: ClientEvent| {
            s2.lock().unwrap().push(ev);
        });

        let _enter = scope.span().enter();
        emit("test", &serde_json::json!({"x": 1}));
        drop(_enter);

        assert!(first.lock().unwrap().is_empty());
        assert_eq!(second.lock().unwrap().len(), 1);
    }

    /// P1：[EventExt::on_event] 并行 scope 之间事件隔离，互不干扰
    /// 条件：创建两个 CaptureScope A 和 B，各自注册回调并在各自 span 内发射不同事件
    /// 断言：A 仅收到 "scope-a" 事件，B 仅收到 "scope-b" 事件
    #[test]
    fn event_isolated_across_scopes() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();

        let a_collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let b_collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let ca = a_collected.clone();
        let cb = b_collected.clone();

        let scope_a = CaptureScope::new();
        let scope_b = CaptureScope::new();
        scope_a.on_event(move |ev: ClientEvent| {
            ca.lock().unwrap().push(ev);
        });
        scope_b.on_event(move |ev: ClientEvent| {
            cb.lock().unwrap().push(ev);
        });

        let _ea = scope_a.span().enter();
        emit("scope-a", &serde_json::json!({"x": 1}));
        drop(_ea);

        let _eb = scope_b.span().enter();
        emit("scope-b", &serde_json::json!({"x": 2}));
        drop(_eb);

        let snaps_a = std::mem::take(&mut *a_collected.lock().unwrap());
        let snaps_b = std::mem::take(&mut *b_collected.lock().unwrap());
        assert_eq!(snaps_a.len(), 1);
        assert_eq!(snaps_a[0].kind, "scope-a");
        assert_eq!(snaps_b.len(), 1);
        assert_eq!(snaps_b[0].kind, "scope-b");
    }

    /// P1：[ClientEvent] 序列化为 JSON 时字段正确
    /// 条件：创建含 kind="method_alias" 和 payload 字段的 ClientEvent
    /// 断言：JSON 中 kind 和 payload.input 值匹配
    #[test]
    fn client_event_serializes() {
        let ev = ClientEvent {
            kind: "method_alias".into(),
            payload: serde_json::json!({"input": "contact search", "resolved": "contact users search"}),
        };
        let json = serde_json::to_value(&ev).expect("serialize");
        assert_json_eq!(json["kind"], serde_json::json!("method_alias"));
        assert_json_eq!(
            json["payload"]["input"],
            serde_json::json!("contact search")
        );
    }

    /// P1：[ClientEvent] JSON 序列化/反序列化 round-trip 字段完整
    /// 条件：创建 ClientEvent，序列化为 JSON 字符串再反序列化
    /// 断言：kind 和 payload 字段与原值一致
    #[test]
    fn client_event_serde_round_trip() {
        let original = ClientEvent {
            kind: "test".into(),
            payload: serde_json::json!({"x": [1, 2, 3]}),
        };
        let json_str = serde_json::to_string(&original).expect("serialize");
        let restored: ClientEvent = serde_json::from_str(&json_str).expect("deserialize");
        assert_eq!(original.kind, restored.kind);
        assert_json_eq!(original.payload, restored.payload);
    }

    /// 构造一个具有指定名称的 tracing field，供 EventVisitor 单测使用。
    fn field(name: &'static str) -> tracing::field::Field {
        let _guard = tracing::subscriber::set_default(tracing_subscriber::Registry::default());
        let span = tracing::info_span!(
            "visitor_fields",
            kind = "x",
            payload = "y",
            other = "z",
            other2 = "w"
        );
        let metadata = span.metadata().expect("span metadata present");
        metadata
            .fields()
            .field(name)
            .unwrap_or_else(|| panic!("field {name} not found"))
    }

    /// P1：[EventVisitor::record_str] 记录 kind 与 payload 字段
    /// 条件：通过 record_str 写入 kind="method_alias" 与 payload 为 JSON 字符串
    /// 断言：into_event 后 kind 与 payload 正确解析
    #[test]
    fn event_visitor_records_kind_and_payload_via_str() {
        let mut visitor = EventVisitor::default();
        visitor.record_str(&field("kind"), "method_alias");
        visitor.record_str(&field("payload"), r#"{"a":1}"#);
        let ev = visitor.into_event();
        assert_eq!(ev.kind, "method_alias");
        assert_json_eq!(ev.payload, serde_json::json!({"a": 1}));
    }

    /// P1：[EventVisitor::record_debug] 记录 kind 与 payload 字段
    /// 条件：通过 record_debug 写入 kind（&str）与 payload（DisplayValue，Debug 委托 Display）
    /// 断言：into_event 后 kind 与 payload 正确解析
    #[test]
    fn event_visitor_records_kind_and_payload_via_debug() {
        let mut visitor = EventVisitor::default();
        visitor.record_debug(&field("kind"), &"method_alias");
        let value = serde_json::json!({"a":1});
        let payload = tracing::field::display(&value);
        visitor.record_debug(&field("payload"), &payload);
        let ev = visitor.into_event();
        assert_eq!(ev.kind, "method_alias");
        assert_json_eq!(ev.payload, serde_json::json!({"a": 1}));
    }

    /// P2：[EventVisitor] 未知字段被忽略
    /// 条件：通过 record_str / record_debug 写入非 kind/payload 字段
    /// 断言：into_event 后 kind 为空串、payload 为 Null
    #[test]
    fn event_visitor_ignores_unknown_fields() {
        let mut visitor = EventVisitor::default();
        visitor.record_str(&field("other"), "value");
        visitor.record_debug(&field("other2"), &"value2");
        let ev = visitor.into_event();
        assert_eq!(ev.kind, "");
        assert_eq!(ev.payload, serde_json::Value::Null);
    }

    /// P2：[EventVisitor::record_str] 非 JSON payload 回退为 None
    /// 条件：record_str 写入 payload 为非法 JSON 字符串 "not-json"
    /// 断言：into_event 后 payload 为 Null（解析失败回退）
    #[test]
    fn event_visitor_non_json_payload_falls_back_to_null() {
        let mut visitor = EventVisitor::default();
        visitor.record_str(&field("payload"), "not-json");
        let ev = visitor.into_event();
        assert_eq!(ev.payload, serde_json::Value::Null);
    }

    /// P2：[EventVisitor::into_event] 未记录任何字段时使用默认值
    /// 条件：构造 default EventVisitor 后直接 into_event
    /// 断言：kind 为空串、payload 为 Null
    #[test]
    fn event_visitor_defaults_when_empty() {
        let visitor = EventVisitor::default();
        let ev = visitor.into_event();
        assert_eq!(ev.kind, "");
        assert_eq!(ev.payload, serde_json::Value::Null);
    }
}
