//! HTTP transport layer — reqwest backend, wire protocol, and long-task polling.
//!
//! Internal modules:
//! - `endpoint`   — [`HttpEndpoint`] capability (path, base_url, envelope, range_size).
//! - `envelope`   — request/response envelope strategy ([`RequestEnvelope`] /
//!   [`ResponseEnvelope`] and built-ins).
//! - `polling`    — long-task polling for HTTP transport.
//! - `protocol`   — API protocol parsing
//!   ([`protocol::ApiResponse`] / [`protocol::ApiErrorInfo`]).
//! - `request`    — execute pipeline helpers (envelope application, ranged download, polling, decoding).
//! - `resumable`  — HTTP Range resumption download.

pub(crate) mod endpoint;
pub mod envelope;
mod polling;
pub(crate) mod protocol;
pub(super) mod request;
pub(crate) mod resumable;

use std::borrow::Cow;
use std::pin::Pin;
use std::sync::Arc;

pub use endpoint::{EndpointHttpExt, HttpEndpoint};
pub use envelope::{GatewayRes, PassthroughReq, RequestEnvelope, ResponseEnvelope};
pub use request::{apply_request_envelope, compute_ranged, with_request_envelope};

use crate::http_client::{HttpClient, HttpRequest, HttpRequestPayload};
use crate::traits::{TransportBackend, TransportResponse};
use crate::{
    Endpoint, IntoCowEndpoint, IntoHttpRequestPayload, RequestOptions, Result, TransportBuilder,
    TransportRequest,
};

/// HTTP transport — wraps a backend ([`HttpClient`]).
///
/// Build requests via [`.post()`](Self::post) (raw HTTP) or
/// [`.invoke()`](Self::invoke) (with protocol handling + long-task polling).
///
/// `base_url` is the transport-level default:
/// when an [`Endpoint`]'s [`HttpEndpoint`] has `None` for this field,
/// the transport's value is used. Per-request overrides are set via
/// [`HttpEndpoint::with_base_url`].
///
/// Per-transport configuration (headers, timeout, etc.) lives on
/// [`crate::Transport`], not here. Wrap with [`crate::Transport::from`] or
/// [`crate::Transport::new`] to configure.
///
/// Cheap to clone — the underlying client is `Arc`-shared.
#[derive(Clone)]
pub struct HttpTransportBackend {
    /// HTTP 后端（发送抽象：reqwest，动态分发）。
    pub(crate) http_client: Arc<dyn HttpClient>,
    /// Transport-level default: used when [`HttpEndpoint::base_url`] is `None`.
    pub(crate) base_url: String,
}

impl Default for HttpTransportBackend {
    fn default() -> Self {
        Self {
            http_client: Arc::new(reqwest::Client::new()),
            base_url: String::new(),
        }
    }
}

impl std::fmt::Debug for HttpTransportBackend {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut s = f.debug_struct("HttpTransportBackend");
        s.field("http_client", &self.http_client);
        s.field("base_url", &self.base_url);
        s.finish()
    }
}

impl HttpTransportBackend {
    /// Convenience entry point for the deferred-error builder.
    pub fn builder() -> TransportBuilder<Self> {
        TransportBuilder::new(Self::default())
    }

    /// Construct with a custom [`HttpClient`] and transport-level default `base_url`.
    ///
    /// Headers can be added after construction by wrapping in a [`crate::Transport`]
    /// and calling [`crate::Transport::with_header`] / [`crate::Transport::with_headers`].
    pub fn new(http_client: impl HttpClient + 'static) -> Self {
        Self {
            http_client: Arc::new(http_client),
            base_url: String::new(),
        }
    }

    /// Return a reference to the current HTTP backend.
    pub fn http_client(&self) -> &dyn HttpClient {
        self.http_client.as_ref()
    }

    /// The shared `Arc` handle to the underlying [`HttpClient`].
    ///
    /// Exposed for [`pipeline_execute`](crate::backend::pipeline::pipeline_execute)
    /// (which may clone the handle into a `'static` resumable stream).
    pub fn http_client_arc(&self) -> &Arc<dyn HttpClient> {
        &self.http_client
    }

    /// Consuming setter: replace the underlying [`HttpClient`].
    ///
    /// For custom backends defined in other crates that **embed** an
    /// `HttpTransportBackend` (e.g. a custom backend defined in another crate);
    /// in-crate configuration goes through [`TransportBuilder`] instead.
    #[must_use]
    pub fn with_http_client(mut self, client: impl HttpClient + 'static) -> Self {
        self.http_client = Arc::new(client);
        self
    }

    /// Transport-level default base_url. Used when [`HttpEndpoint::base_url`] is `None`.
    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    /// Consuming setter: set the transport-level default `base_url`.
    /// See [`with_http_client`](Self::with_http_client) for when to use this.
    #[must_use]
    pub fn with_base_url(mut self, url: impl Into<String>) -> Self {
        self.base_url = url.into();
        self
    }

    /// Build a raw HTTP request (no protocol-layer wrapping).
    ///
    /// Accepts JSON values, or a [`HttpRequestPayload`] (multipart forms must be
    /// wrapped via [`HttpRequestPayload::form`] so they stay replayable).
    /// Per-request options (headers, timeout) are set on the returned
    /// [`HttpRequest`] via its builder methods.
    pub fn post<'a, E, P>(&'a self, endpoint: E, payload: P) -> HttpRequest<'a>
    where
        E: IntoCowEndpoint<'a>,
        P: IntoHttpRequestPayload,
    {
        HttpRequest::new(
            &*self.http_client,
            endpoint.into_cow_endpoint(),
            payload.into_http_request_payload(),
        )
    }

    /// Build a protocol-level HTTP request that handles ApiResponse parsing,
    /// long-task polling, and `result` field extraction.
    ///
    /// `.await` returns [`TransportResponse`].
    pub fn invoke<'a, E, P>(&'a self, endpoint: E, payload: P) -> TransportRequest<'a>
    where
        E: IntoCowEndpoint<'a>,
        P: IntoHttpRequestPayload,
    {
        let endpoint = endpoint.into_cow_endpoint();
        let payload = payload.into_http_request_payload();

        TransportRequest {
            backend: self as &(dyn crate::traits::TransportBackend + 'static),
            endpoint,
            payload,
            header_error: None,
            options: RequestOptions::default(),
        }
    }
}

// ── Per-backend builder configuration ──────────────────────────

impl TransportBuilder<HttpTransportBackend> {
    /// Set transport-level default `base_url`.
    #[must_use]
    pub fn base_url(self, url: impl Into<String>) -> Self {
        self.map_backend(|mut b| {
            b.base_url = url.into();
            b
        })
    }

    /// Set the HTTP client.
    #[must_use]
    pub fn http_client(self, c: impl HttpClient + 'static) -> Self {
        self.map_backend(|mut b| {
            b.http_client = Arc::new(c);
            b
        })
    }
}

impl TransportBackend for HttpTransportBackend {
    fn execute<'a>(
        &'a self,
        endpoint: Cow<'a, Endpoint>,
        payload: HttpRequestPayload,
        options: RequestOptions,
    ) -> Pin<Box<dyn Future<Output = Result<TransportResponse>> + Send + 'a>> {
        Box::pin(async move {
            // Resolve endpoint defaults (transport-level base_url),
            // then run the unified protocol pipeline.
            let endpoint = request::resolve_endpoint_defaults(self, endpoint);
            let defaults = request::PollDefaults {
                base_url: &self.base_url,
            };
            request::pipeline_execute(
                self.http_client.clone(),
                &endpoint,
                payload,
                options,
                defaults,
            )
            .await
        })
    }

    fn name(&self) -> &str {
        "http"
    }
}

#[allow(clippy::needless_update)]
#[cfg(test)]
mod tests {
    //! ## 模块摘要：http（HttpTransportBackend 顶层 API）
    //!
    //! ### 关键接口
    //! - [HttpTransportBackend::default] — 默认构造 HttpTransportBackend（reqwest 后端）
    //! - [HttpTransportBackend::post] — 构建 HTTP 请求（JSON 或 multipart），endpoint 接受 &Endpoint 或 Endpoint
    //! - [HttpTransportBackend::invoke] — 协议层封装，自动合并 transport.headers
    //!
    //! ### 关键分支与异常路径
    //! - post 接受 IntoCowEndpoint（&Endpoint 走 Borrowed，Endpoint 走 Owned，Cow<Endpoint> 原样透传）
    //! - post 接受 IntoHttpRequestPayload：Value/&Value 走 JSON 工厂路径；HttpRequestPayload 幂等透传（裸 Form 须经 HttpRequestPayload::form）
    //!
    //! ### 上下游交互
    //! - 上游：调用方通过 [HttpTransportBackend::post] 构建请求
    //! - 下游：返回的 [http_client::HttpRequest] 被 `IntoFuture` 驱动至 [HttpClient::send_request]

    use std::borrow::Cow;

    use super::*;
    use crate::Endpoint;
    use crate::http::HttpEndpoint;

    fn make_transport() -> HttpTransportBackend {
        HttpTransportBackend::default()
    }

    /// 测试用 helper：构造一个 HTTP `Endpoint`。
    fn ep(base: &str, path: &str) -> Endpoint {
        let http = HttpEndpoint::new(path).with_service(base);
        Endpoint::new().with(http)
    }

    /// P0：[HttpTransportBackend::http_client] 默认后端是 Reqwest
    /// 条件：默认构造的 HttpTransportBackend
    /// 断言：http_client().name() 为 "reqwest"
    #[test]
    fn default_client_is_reqwest() {
        let transport = make_transport();
        assert_eq!(transport.http_client().name(), "reqwest");
    }

    /// P0：[HttpTransportBackend::post] 接受 `&Endpoint`，HttpRequest 内部存储 Cow::Borrowed
    /// 条件：以引用形式传入 endpoint（JSON payload）
    /// 断言：HttpRequest::endpoint 为 Cow::Borrowed
    #[test]
    fn post_accepts_borrowed_endpoint() {
        let transport = make_transport();
        let endpoint = ep("https://x.com", "/p");
        let payload = serde_json::json!({});
        let req = transport.post(&endpoint, &payload);
        assert!(matches!(req.endpoint, Cow::Borrowed(_)));
    }

    /// P0：[HttpTransportBackend::post] 接受 owned `Endpoint`，HttpRequest 内部存储 Cow::Owned
    /// 条件：以所有权形式传入 endpoint（JSON payload）
    /// 断言：HttpRequest::endpoint 为 Cow::Owned
    #[test]
    fn post_accepts_owned_endpoint() {
        let transport = make_transport();
        let payload = serde_json::json!({});
        let req = transport.post(ep("https://x.com", "/p"), &payload);
        assert!(matches!(req.endpoint, Cow::Owned(_)));
    }

    // ── payload 工厂形态 ──

    /// P0：[HttpTransportBackend::post] 接受 `&Value`，构造 Json 工厂且内容一致
    /// 条件：以引用形式传入 payload
    /// 断言：build 产出 HttpRequestBody::Json 且值一致
    #[tokio::test]
    async fn post_accepts_borrowed_value() {
        use crate::http_client::HttpRequestBody;
        let transport = make_transport();
        let endpoint = ep("https://x.com", "/p");
        let payload = serde_json::json!({"a": 1});
        let req = transport.post(&endpoint, &payload);
        match req.payload.build().await.unwrap() {
            HttpRequestBody::Json(value) => assert_eq!(value.as_ref(), &payload),
            other => panic!("expected Json payload, got {other:?}"),
        }
    }

    /// P0：[HttpTransportBackend::post] 接受 owned `Value`，构造 Json 工厂且内容一致
    /// 条件：以所有权形式传入 payload
    /// 断言：build 产出 HttpRequestBody::Json 且值一致
    #[tokio::test]
    async fn post_accepts_owned_value() {
        use crate::http_client::HttpRequestBody;
        let transport = make_transport();
        let endpoint = ep("https://x.com", "/p");
        let payload = serde_json::json!({"a": 1});
        let req = transport.post(&endpoint, payload.clone());
        match req.payload.build().await.unwrap() {
            HttpRequestBody::Json(value) => assert_eq!(value.as_ref(), &payload),
            other => panic!("expected Json payload, got {other:?}"),
        }
    }

    /// P0：[HttpTransportBackend::post] 接受 `HttpRequestPayload` 幂等透传
    /// 条件：直接传入工厂
    /// 断言：build 产出 Json 且值一致
    #[tokio::test]
    async fn post_accepts_payload_factory() {
        use crate::http_client::{HttpRequestBody, HttpRequestPayload};
        let transport = make_transport();
        let endpoint = ep("https://x.com", "/p");
        let payload = serde_json::json!({"a": 1});
        let req = transport.post(&endpoint, HttpRequestPayload::json(payload.clone()));
        match req.payload.build().await.unwrap() {
            HttpRequestBody::Json(value) => assert_eq!(value.as_ref(), &payload),
            other => panic!("expected Json payload, got {other:?}"),
        }
    }

    // ── invoke() 路径的 transport.headers 合并语义 ──

    /// P0：[Transport::invoke] transport 级 headers 在 invoke() 路径上自动并入 wire 请求
    /// 条件：transport 含 x-base=base-val；无需额外调用 .headers()
    /// 断言：wire 请求中包含 x-base=base-val（验证 Transport::invoke() 自动合并 headers）
    #[tokio::test]
    async fn invoke_merges_transport_headers_into_wire_request() {
        use wiremock::matchers::{method, path};
        use wiremock::{Match, Mock, MockServer, Request, ResponseTemplate};

        struct TransportHeaderMatcher;
        impl Match for TransportHeaderMatcher {
            fn matches(&self, request: &Request) -> bool {
                request.headers.get("x-base").and_then(|v| v.to_str().ok()) == Some("base-val")
            }
        }

        let server = MockServer::start().await;
        let transport = {
            let uri = server.uri();
            make_transport_with_header("x-base", "base-val", &uri)
        };

        Mock::given(method("POST"))
            .and(path("/invoke-merge"))
            .and(TransportHeaderMatcher)
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{\"ok\":true}"
            })))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/invoke-merge");
        let payload = serde_json::json!({});
        let _ = transport.invoke(&endpoint, &payload).await.unwrap();
    }

    /// P0：[Transport::invoke] 同时提供 transport 级 headers 与 request 级 .headers，二者均被发送
    /// 条件：transport 含 x-base；invoke 后 .headers 追加 x-extra
    /// 断言：wire 请求同时包含 x-base 与 x-extra
    #[tokio::test]
    async fn invoke_combines_transport_headers_and_request_level_headers() {
        use wiremock::matchers::{header, method, path};
        use wiremock::{Mock, MockServer, ResponseTemplate};

        let server = MockServer::start().await;
        let transport = {
            let uri = server.uri();
            make_transport_with_header("x-base", "base-val", &uri)
        };

        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-extra"),
            reqwest::header::HeaderValue::from_static("extra-val"),
        );

        Mock::given(method("POST"))
            .and(path("/invoke-combine"))
            .and(header("x-base", "base-val"))
            .and(header("x-extra", "extra-val"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{\"ok\":true}"
            })))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/invoke-combine");
        let payload = serde_json::json!({});
        let _ = transport
            .invoke(&endpoint, &payload)
            .headers(&extra)
            .await
            .unwrap();
    }

    // ── HttpTransportBackend::new / with_client ──

    /// P0：[HttpTransportBackend::default] 默认构造的 backend，client 为 Reqwest 实现
    /// 条件：以 Default 构造
    /// 断言：http_client() 为 Reqwest 默认实现
    #[test]
    fn default_constructs_with_reqwest_client() {
        let transport = HttpTransportBackend::default();
        assert_eq!(transport.http_client().name(), "reqwest");
    }

    /// P1：[HttpTransportBackend::with_base_url] 设置 transport 级默认 base_url 且保留 http_client
    /// 条件：默认 backend 链式 with_base_url("https://x.com")
    /// 断言：base_url() 为 "https://x.com"，http_client() 仍为 Reqwest
    #[test]
    fn with_base_url_sets_default_and_preserves_client() {
        let backend = HttpTransportBackend::default().with_base_url("https://x.com");
        assert_eq!(backend.base_url(), "https://x.com");
        assert_eq!(backend.http_client().name(), "reqwest");
    }

    /// P1：[HttpTransportBackend::with_http_client] 替换底层 HttpClient 且保留 base_url
    /// 条件：先 with_base_url 再 with_http_client(新的 reqwest client)
    /// 断言：base_url() 保持 "https://x.com"，http_client() 为 Reqwest
    #[test]
    fn with_http_client_replaces_client_and_preserves_base_url() {
        let backend = HttpTransportBackend::default()
            .with_base_url("https://x.com")
            .with_http_client(reqwest::Client::new());
        assert_eq!(backend.base_url(), "https://x.com");
        assert_eq!(backend.http_client().name(), "reqwest");
    }

    /// P1：[HttpTransportBackend] 可通过 From/Into 转为 [`crate::Transport`]
    /// 条件：将 HttpTransportBackend 通过 .into() 包装到 Transport
    /// 断言：name 为 "http"
    #[test]
    fn http_transport_into_transport_enum() {
        use crate::Transport;
        let transport: Transport = HttpTransportBackend::default().into();
        assert_eq!(transport.name(), "http");
    }

    use std::sync::Arc;

    use serde_json::json;

    use crate::{PollCallback, PollEvent, Transport};

    fn make_transport_with_header(
        name: &'static str,
        value: &'static str,
        base_url: &str,
    ) -> Transport {
        HttpTransportBackend::builder()
            .base_url(base_url)
            .header(name, value)
            .build()
            .expect("valid header name/value")
    }

    // ── Builder 链（不发请求） ──

    /// P0：[TransportRequest::headers] 链式调用把 headers 写入 self
    #[test]
    fn builder_headers_appends_to_self() {
        let transport = HttpTransportBackend::default();
        let endpoint = ep("https://x.com", "/p");
        let payload = json!({});
        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-extra"),
            reqwest::header::HeaderValue::from_static("v"),
        );
        let req = transport.invoke(&endpoint, &payload).headers(&extra);
        let hdrs = req.get_headers();
        assert_eq!(hdrs.get("x-extra").unwrap(), "v");
    }

    /// P0：[TransportRequest::header] 单 header 追加
    #[test]
    fn builder_header_appends_single() {
        let transport = HttpTransportBackend::default();
        let endpoint = ep("https://x.com", "/p");
        let payload = json!({});
        let req = transport
            .invoke(&endpoint, &payload)
            .header("x-one", "1")
            .header("x-two", "2");
        let hdrs = req.get_headers();
        assert_eq!(hdrs.get("x-one").unwrap(), "1");
        assert_eq!(hdrs.get("x-two").unwrap(), "2");
    }

    /// P1：[TransportRequest::timeout] 设置请求级 timeout 写入 self
    #[test]
    fn builder_timeout_sets_self_timeout() {
        let transport = HttpTransportBackend::default();
        let endpoint = ep("https://x.com", "/p");
        let payload = json!({});
        let req = transport
            .invoke(&endpoint, &payload)
            .timeout(std::time::Duration::from_secs(7));
        assert_eq!(req.get_timeout(), Some(std::time::Duration::from_secs(7)));
    }

    /// P1：[TransportRequest::on_poll] 注册回调存入 on_poll
    #[test]
    fn builder_on_poll_registers_callback() {
        let transport = HttpTransportBackend::default();
        let endpoint = ep("https://x.com", "/p");
        let payload = json!({});
        let req = transport.invoke(&endpoint, &payload).on_poll(|_ev| {});
        assert!(req.get_on_poll().is_some());
    }

    /// P1：[TransportRequest::on_poll_arc] 透传外部 Arc<PollCallback>
    #[test]
    fn builder_on_poll_arc_registers_callback() {
        let transport = HttpTransportBackend::default();
        let endpoint = ep("https://x.com", "/p");
        let payload = json!({});
        let cb: PollCallback = Arc::new(|_ev: &PollEvent<'_>| {});
        let req = transport.invoke(&endpoint, &payload).on_poll_arc(cb);
        assert!(req.get_on_poll().is_some());
    }
}
