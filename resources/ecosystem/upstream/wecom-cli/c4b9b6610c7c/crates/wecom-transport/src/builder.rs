//! Deferred-error builder for [`Transport`].
//!
//! Provides a unified chain to configure both a backend (`B`) and
//! transport-level options (headers, timeout) in a single call chain.
//! Header validation errors are accumulated and surfaced only at
//! [`build()`](TransportBuilder::build).

use std::any::Any;
use std::sync::Arc;

use crate::transport::Transport;
use crate::{Error, IntoHeaderName, IntoHeaderValue, RequestOptions, TransportBackend};

/// Deferred-error builder for [`Transport`].
///
/// Configures both the backend (`B`) and transport-level options in one chain;
/// the first error is captured and surfaced at [`build`](Self::build).
pub struct TransportBuilder<B> {
    backend: B,
    options: RequestOptions,
    build_error: Option<Error>,
}

impl<B> TransportBuilder<B> {
    /// Generic entry point — wrap an already-constructed backend instance.
    ///
    /// External-crate backends (which may carry required runtime deps that
    /// cannot be `Default`) use this to obtain a builder.
    pub fn new(backend: B) -> Self {
        Self {
            backend,
            options: RequestOptions::default(),
            build_error: None,
        }
    }

    /// Backend-configuration escape hatch — public so backends defined in
    /// **other crates** can mount their own strongly-typed setters on
    /// `TransportBuilder<TheirBackend>`.
    ///
    /// No-op if a previous step already recorded an error.
    #[must_use]
    pub fn map_backend(mut self, f: impl FnOnce(B) -> B) -> Self {
        if self.build_error.is_none() {
            self.backend = f(self.backend);
        }
        self
    }
}

// ── Transport-level generic capabilities: available for all backends ──

impl<B: TransportBackend + 'static> TransportBuilder<B> {
    /// Add a request header.
    ///
    /// The first invalid header name or value is recorded and surfaced at
    /// [`build()`](Self::build).
    #[must_use]
    pub fn header(self, name: impl IntoHeaderName, value: impl IntoHeaderValue) -> Self {
        self.header_sensitive(name, value, false)
    }

    /// Like [`header`](Self::header), but marks the value as sensitive for
    /// debug / log output (e.g. auth tokens).
    #[must_use]
    pub fn header_sensitive(
        mut self,
        name: impl IntoHeaderName,
        value: impl IntoHeaderValue,
        sensitive: bool,
    ) -> Self {
        if self.build_error.is_some() {
            return self;
        }
        match (name.try_into_header_name(), value.try_into_header_value()) {
            (Ok(n), Ok(mut v)) => {
                if sensitive {
                    v.set_sensitive(true);
                }
                self.options.wire.headers.insert(n, v);
            }
            (Err(e), _) | (_, Err(e)) => self.build_error = Some(Error::other(e)),
        }
        self
    }

    /// Bulk-add request headers from a [`reqwest::header::HeaderMap`].
    #[must_use]
    pub fn headers(mut self, headers: reqwest::header::HeaderMap) -> Self {
        self.options.wire.headers.extend(
            headers
                .into_iter()
                .filter_map(|(name, value)| name.map(|n| (n, value))),
        );
        self
    }

    /// Set a per-request timeout.
    #[must_use]
    pub fn timeout(mut self, timeout: std::time::Duration) -> Self {
        self.options.wire.timeout = Some(timeout);
        self
    }

    /// Set a build-time default extension value, applied to every request
    /// made through the built transport.
    ///
    /// Same-type values set later via run-level or per-request
    /// `.extension()` override this default (per-TypeId, later layer wins).
    /// Inserting cannot fail, so this stays in the deferred-error style.
    #[must_use]
    pub fn extension<T>(mut self, value: T) -> Self
    where
        T: std::any::Any + std::fmt::Debug + Send + Sync + 'static,
    {
        self.options.extensions.insert(value);
        self
    }

    /// Convert to a type-erased builder with a `Box<dyn TransportBackend>`
    /// backend.
    ///
    /// After boxing, backend-specific setters (e.g. `base_url`)
    /// are unavailable — only the generic public
    /// methods ([`header`](Self::header), [`timeout`](Self::timeout),
    /// [`extension`](Self::extension), [`build`](Self::build), ...) remain,
    /// which is useful for callers that hold the builder without naming a
    /// concrete backend type.
    ///
    /// Options already configured (headers / timeout / extensions) and any
    /// recorded build error are preserved.
    #[must_use]
    pub fn boxed(self) -> TransportBuilder<Box<dyn TransportBackend>> {
        TransportBuilder {
            backend: Box::new(self.backend) as Box<dyn TransportBackend>,
            options: self.options,
            build_error: self.build_error,
        }
    }

    /// The only fallible step — construct the final [`Transport`].
    ///
    /// Returns the first recorded error (from [`header`](Self::header) /
    /// [`header_sensitive`](Self::header_sensitive)), or the finished
    /// [`Transport`] wrapping the configured backend and options.
    pub fn build(self) -> Result<Transport, Error> {
        if let Some(e) = self.build_error {
            return Err(e);
        }
        Ok(Transport::new(Arc::new(self.backend), self.options))
    }
}

// ── Boxed builder: type-erased backend (inverse: unbox) ──

impl TransportBuilder<Box<dyn TransportBackend>> {
    /// Recover the concrete backend type `B` from a boxed builder — the
    /// inverse of [`boxed`](Self::boxed).
    ///
    /// Returns `Some(TransportBuilder<B>)` if the boxed backend is an
    /// instance of `B`, otherwise `None`. Options already configured
    /// (headers / timeout / extensions) and any recorded build error are
    /// preserved.
    ///
    /// After recovery, backend-specific setters (e.g. `base_url`)
    /// become available again.
    #[must_use]
    pub fn unbox<B>(self) -> Option<TransportBuilder<B>>
    where
        B: TransportBackend + 'static,
    {
        let backend: Box<dyn Any> = self.backend;
        let backend = backend.downcast::<B>().ok()?;
        Some(TransportBuilder {
            backend: *backend,
            options: self.options,
            build_error: self.build_error,
        })
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：TransportBuilder（transport 构建器）
    //!
    //! ### 关键接口
    //! - [TransportBuilder::new] — 通用入口，包装已构建的后端
    //! - [TransportBuilder::extension] — 构建期默认扩展值，随每请求透传
    //! - [TransportBuilder::build] — 唯一可失败的步骤，产出 [Transport](crate::Transport)
    //!
    //! ### 关键分支与异常路径
    //! - 构建期扩展值经 `invoke()` 到达 `TransportBackend::execute`（CaptureBackend 验证）
    //!
    //! ### 上下游交互
    //! - 上游：调用方通过 `TransportBackend::builder()` / [TransportBuilder::new] 配置
    //! - 下游：[build](TransportBuilder::build) 产出 [Transport](crate::Transport)

    use std::borrow::Cow;
    use std::future::Future;
    use std::pin::Pin;

    use super::*;
    use crate::http_client::HttpRequestPayload;
    use crate::traits::TransportResponse;
    use crate::{Endpoint, ExecuteOutput, RequestOptions, Result, TransportBackend};

    /// 记录 `execute` 收到 options 的捕获型后端。
    #[derive(Debug)]
    struct CaptureBackend {
        captured: std::sync::Arc<std::sync::Mutex<Option<RequestOptions>>>,
    }

    impl TransportBackend for CaptureBackend {
        fn execute<'a>(
            &'a self,
            _endpoint: Cow<'a, Endpoint>,
            _payload: HttpRequestPayload,
            options: RequestOptions,
        ) -> Pin<Box<dyn Future<Output = Result<TransportResponse>> + Send + 'a>> {
            *self.captured.lock().unwrap() = Some(options);
            Box::pin(async move {
                Ok(TransportResponse::Json(ExecuteOutput {
                    result: serde_json::json!({}),
                    extra: indexmap::IndexMap::new(),
                }))
            })
        }
    }

    /// 测试夹具：扩展袋值。
    #[derive(Debug, PartialEq)]
    struct BExt(u32);

    fn capture_backend() -> (
        CaptureBackend,
        std::sync::Arc<std::sync::Mutex<Option<RequestOptions>>>,
    ) {
        let captured = std::sync::Arc::new(std::sync::Mutex::new(None));
        (
            CaptureBackend {
                captured: captured.clone(),
            },
            captured,
        )
    }

    // ── TransportBuilder::extension ──

    /// P0：[TransportBuilder::extension] 写入构建期 options 扩展袋
    /// 条件：TransportBuilder::new(backend).extension(BExt(2))
    /// 断言：builder.options.extensions.get::<BExt>() 返回 Some(2)
    #[test]
    fn extension_writes_options_bag() {
        let (backend, _) = capture_backend();
        let b = TransportBuilder::new(backend).extension(BExt(2));
        assert_eq!(b.options.extensions.get::<BExt>(), Some(&BExt(2)));
    }

    /// P0：构建期扩展值端到端到达 `execute`
    /// 条件：TransportBuilder::extension(BExt(1)) → build → invoke().await
    /// 断言：execute 收到的 options.extensions.get::<BExt>() 为 Some(1)
    #[tokio::test]
    async fn extension_reaches_execute() {
        let (backend, captured) = capture_backend();
        let transport = TransportBuilder::new(backend)
            .extension(BExt(1))
            .build()
            .unwrap();
        transport
            .invoke(Endpoint::new(), serde_json::json!({}))
            .await
            .unwrap();
        let options = captured.lock().unwrap().take().expect("execute ran");
        assert_eq!(options.extensions.get::<BExt>(), Some(&BExt(1)));
    }

    /// P1：`invoke()` 时构建期默认扩展可被请求级 `.extension()` 覆盖（请求级 > 构建期）
    /// 条件：builder.extension(BExt(1))，请求级 .extension(BExt(2))
    /// 断言：execute 收到 BExt(2)
    #[tokio::test]
    async fn request_level_overrides_build_default() {
        let (backend, captured) = capture_backend();
        let transport = TransportBuilder::new(backend)
            .extension(BExt(1))
            .build()
            .unwrap();
        transport
            .invoke(Endpoint::new(), serde_json::json!({}))
            .extension(BExt(2))
            .await
            .unwrap();
        let options = captured.lock().unwrap().take().expect("execute ran");
        assert_eq!(options.extensions.get::<BExt>(), Some(&BExt(2)));
    }

    // ── map_backend / headers / timeout / header 错误 ──

    /// P0：[TransportBuilder::map_backend] 变换 backend 后成功 build
    /// 条件：map_backend(|b| b)（恒等变换）
    /// 断言：build() 成功，name() 为默认 "unknown"
    #[test]
    fn map_backend_transforms_backend() {
        let (backend, _) = capture_backend();
        let transport = TransportBuilder::new(backend)
            .map_backend(|b| b)
            .build()
            .unwrap();
        assert_eq!(transport.name(), "unknown");
    }

    /// P0：[TransportBuilder::headers] bulk 添加 headers
    /// 条件：传入含 x-trace 的 HeaderMap
    /// 断言：builder.options.wire.headers 含 x-trace
    #[test]
    fn headers_bulk_inserts_headers() {
        let (backend, _) = capture_backend();
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            reqwest::header::HeaderName::from_static("x-trace"),
            reqwest::header::HeaderValue::from_static("abc"),
        );
        let b = TransportBuilder::new(backend).headers(headers);
        assert_eq!(
            b.options
                .wire
                .headers
                .get("x-trace")
                .unwrap()
                .to_str()
                .unwrap(),
            "abc"
        );
    }

    /// P0：[TransportBuilder::timeout] 设置超时
    /// 条件：timeout(30s)
    /// 断言：builder.options.wire.timeout 为 Some(30s)
    #[test]
    fn timeout_sets_wire_timeout() {
        let (backend, _) = capture_backend();
        let b = TransportBuilder::new(backend).timeout(std::time::Duration::from_secs(30));
        assert_eq!(
            b.options.wire.timeout,
            Some(std::time::Duration::from_secs(30))
        );
    }

    /// P1：[TransportBuilder::header] 非法 header value 记录错误并在 build 时返回
    /// 条件：header("x-test", "bad\nvalue")（value 含换行符）
    /// 断言：build() 返回 Err
    #[test]
    fn invalid_header_value_fails_build() {
        let (backend, _) = capture_backend();
        let result = TransportBuilder::new(backend)
            .header("x-test", "bad\nvalue")
            .build();
        assert!(result.is_err());
    }

    /// P1：[TransportBuilder::header_sensitive] 已有错误时后续 header 为 no-op
    /// 条件：先触发非法 header，再 header_sensitive 合法值
    /// 断言：build() 返回 Err（首个错误保留，后续调用不 panic）
    #[test]
    fn header_sensitive_noop_after_error() {
        let (backend, _) = capture_backend();
        let result = TransportBuilder::new(backend)
            .header("x-bad", "bad\nvalue")
            .header_sensitive("x-ok", "ok", true)
            .build();
        assert!(result.is_err());
    }

    /// P1：[TransportBuilder::map_backend] 已有错误时 no-op
    /// 条件：先触发非法 header 记录错误，再 map_backend 恒等变换
    /// 断言：build() 仍返回 Err（首个错误保留，map_backend 不 panic）
    #[test]
    fn map_backend_noop_after_error() {
        let (backend, _) = capture_backend();
        let result = TransportBuilder::new(backend)
            .header("x-bad", "bad\nvalue")
            .map_backend(|b| b)
            .build();
        assert!(result.is_err());
    }

    /// P1：[TransportBuilder::header_sensitive] sensitive=true 标记 value 为敏感
    /// 条件：header_sensitive("x-auth", "secret", true)
    /// 断言：header value is_sensitive() 为 true
    #[test]
    fn header_sensitive_marks_value_sensitive() {
        let (backend, _) = capture_backend();
        let b = TransportBuilder::new(backend).header_sensitive("x-auth", "secret", true);
        let v = b.options.wire.headers.get("x-auth").unwrap();
        assert!(v.is_sensitive());
    }

    // ── Boxed builder（TransportBuilder::boxed）──

    /// P0：[TransportBuilder::boxed] 转换后的 Boxed builder 可 build 出 Transport
    /// 条件：HttpTransportBackend::builder().boxed().build()
    /// 断言：build() 成功，name() 为 "http"
    #[test]
    fn boxed_converts_builder_and_builds() {
        let transport = crate::HttpTransportBackend::builder()
            .boxed()
            .build()
            .unwrap();
        assert_eq!(transport.name(), "http");
    }

    /// P0：[TransportBuilder::boxed] 转换前已配置的通用 options 被保留
    /// 条件：header + timeout + extension 后再 boxed()
    /// 断言：headers / timeout 生效，扩展袋读回构建期默认值
    #[test]
    fn boxed_preserves_configured_options() {
        let transport = crate::HttpTransportBackend::builder()
            .header("x-trace", "abc")
            .timeout(std::time::Duration::from_secs(5))
            .extension(BExt(3))
            .boxed()
            .build()
            .unwrap();
        assert_eq!(transport.headers().get("x-trace").unwrap(), "abc");
        assert_eq!(transport.timeout(), Some(std::time::Duration::from_secs(5)));
        assert_eq!(transport.extensions().get::<BExt>(), Some(&BExt(3)));
    }

    /// P0：[TransportBuilder::boxed] boxed() 后可继续调用通用公共方法
    /// 条件：boxed() 之后再 header + timeout + extension
    /// 断言：headers / timeout 生效，扩展袋读回构建期默认值
    #[test]
    fn boxed_chains_common_methods() {
        let transport = crate::HttpTransportBackend::builder()
            .boxed()
            .header("x-trace", "abc")
            .timeout(std::time::Duration::from_secs(5))
            .extension(BExt(3))
            .build()
            .unwrap();
        assert_eq!(transport.headers().get("x-trace").unwrap(), "abc");
        assert_eq!(transport.timeout(), Some(std::time::Duration::from_secs(5)));
        assert_eq!(transport.extensions().get::<BExt>(), Some(&BExt(3)));
    }

    /// P0：[TransportBuilder::boxed] boxed() 后 header 校验失败仍延迟到 build() 返回
    /// 条件：boxed() 之后再 header("x-bad", "bad\nvalue")（value 含换行符）
    /// 断言：build() 返回 Err
    #[test]
    fn boxed_chains_header_error_after_boxing() {
        let result = crate::HttpTransportBackend::builder()
            .boxed()
            .header("x-bad", "bad\nvalue")
            .build();
        assert!(result.is_err());
    }

    /// P0：[TransportBuilder::boxed] 转换前已记录的 build_error 被保留
    /// 条件：header("x-bad", "bad\nvalue")（value 含换行符）后再 boxed()
    /// 断言：build() 返回 Err
    #[test]
    fn boxed_preserves_build_error() {
        let result = crate::HttpTransportBackend::builder()
            .header("x-bad", "bad\nvalue")
            .boxed()
            .build();
        assert!(result.is_err());
    }

    /// P0：[TransportBuilder::boxed] 任意 backend 可 box 化后使用通用方法
    /// 条件：TransportBuilder::new(CaptureBackend).boxed().build()
    /// 断言：build() 成功，name() 委托为 "unknown"
    #[test]
    fn boxed_forwards_execute_and_name() {
        let (backend, _) = capture_backend();
        let transport = TransportBuilder::new(backend).boxed().build().unwrap();
        assert_eq!(transport.name(), "unknown");
    }

    /// P1：[TransportBuilder::boxed] Boxed builder 上 map_backend 仍可用（恒等变换）
    /// 条件：HttpTransportBackend::builder().boxed().map_backend(|b| b)
    /// 断言：build() 成功，name() 保持 "http"
    #[test]
    fn boxed_map_backend_is_noop_identity() {
        let transport = crate::HttpTransportBackend::builder()
            .boxed()
            .map_backend(|b| b)
            .build()
            .unwrap();
        assert_eq!(transport.name(), "http");
    }

    // ── Unbox（TransportBuilder::unbox）──

    /// P0：[TransportBuilder::unbox] 可恢复原始 backend 类型并继续使用专属方法
    /// 条件：HttpTransportBackend::builder().boxed().unbox::<HttpTransportBackend>()
    /// 断言：返回 Some，可继续调用 base_url() 等 backend 专属方法后 build 成功
    #[test]
    fn unbox_recovers_concrete_backend() {
        let builder = crate::HttpTransportBackend::builder()
            .boxed()
            .unbox::<crate::HttpTransportBackend>()
            .expect("http backend");
        let transport = builder.base_url("https://api.test").build().unwrap();
        assert_eq!(transport.name(), "http");
    }

    /// P0：[TransportBuilder::unbox] 类型不匹配时返回 None
    /// 条件：boxed 的 HttpTransportBackend 尝试 unbox::<CaptureBackend>()
    /// 断言：返回 None
    #[test]
    fn unbox_type_mismatch_returns_none() {
        let builder = crate::HttpTransportBackend::builder().boxed();
        assert!(builder.unbox::<CaptureBackend>().is_none());
    }

    /// P0：[TransportBuilder::unbox] 已配置的 options 在 unbox 后保留
    /// 条件：boxed 前 header + timeout + extension，unbox 后 build
    /// 断言：headers / timeout 生效，扩展袋读回构建期默认值
    #[test]
    fn unbox_preserves_configured_options() {
        let transport = crate::HttpTransportBackend::builder()
            .header("x-trace", "abc")
            .timeout(std::time::Duration::from_secs(5))
            .extension(BExt(3))
            .boxed()
            .unbox::<crate::HttpTransportBackend>()
            .expect("http backend")
            .build()
            .unwrap();
        assert_eq!(transport.headers().get("x-trace").unwrap(), "abc");
        assert_eq!(transport.timeout(), Some(std::time::Duration::from_secs(5)));
        assert_eq!(transport.extensions().get::<BExt>(), Some(&BExt(3)));
    }

    /// P0：[TransportBuilder::unbox] 已记录的 build_error 在 unbox 后保留
    /// 条件：boxed 前非法 header，unbox 后 build
    /// 断言：build() 返回 Err
    #[test]
    fn unbox_preserves_build_error() {
        let result = crate::HttpTransportBackend::builder()
            .header("x-bad", "bad\nvalue")
            .boxed()
            .unbox::<crate::HttpTransportBackend>()
            .expect("http backend")
            .build();
        assert!(result.is_err());
    }

    /// P1：[TransportBuilder::unbox] 自定义 backend 也可恢复
    /// 条件：TransportBuilder::new(CaptureBackend).boxed().unbox::<CaptureBackend>()
    /// 断言：返回 Some，build 成功，name() 委托为 "unknown"
    #[test]
    fn unbox_recovers_custom_backend() {
        let (backend, _) = capture_backend();
        let builder = TransportBuilder::new(backend)
            .boxed()
            .unbox::<CaptureBackend>()
            .expect("custom backend");
        let transport = builder.build().unwrap();
        assert_eq!(transport.name(), "unknown");
    }
}
