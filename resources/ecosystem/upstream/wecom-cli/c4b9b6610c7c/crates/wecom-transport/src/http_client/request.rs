use std::borrow::Cow;
use std::future::{Future, IntoFuture};
use std::pin::Pin;
use std::sync::Arc;

use super::response;
use crate::{Endpoint, Error, HttpClient, Result};

/// payload 工厂的产出物（发送层消费的一次性数据）。
///
/// `Form` 持有流式 body 不可克隆——工厂每次 build 产出独立实例。
#[derive(Debug)]
pub enum HttpRequestBody {
    Json(Arc<serde_json::Value>),
    Form(reqwest::multipart::Form),
}

impl std::fmt::Display for HttpRequestBody {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Json(value) => write!(f, "{}", value.as_ref()),
            Self::Form(_) => write!(f, "[multipart/form-data]"),
        }
    }
}

/// payload 工厂构建函数签名（供 [`HttpRequestPayload`] 内部持有）。
type HttpRequestPayloadBuildFn =
    dyn Fn() -> Pin<Box<dyn Future<Output = Result<HttpRequestBody>> + Send>> + Send + Sync;

/// payload 种类标记（构造期已知，零成本）。
///
/// 供 [`compute_ranged`](crate::http::compute_ranged) 的分段下载准入判定使用——
/// 无需物化 payload 即可区分 JSON 与 multipart。仅 crate 内部使用（`kind()`
/// 与 `HttpRequestPayload::new` 同收窄），不参与公开 API。
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub(crate) enum HttpRequestPayloadKind {
    Json,
    Form,
}

/// payload 统一工厂：每次 build 产出全新 [`HttpRequestBody`]。
///
/// JSON（Arc 持有）与 multipart（再次构建闭包，重新打开文件）在同一模型下表达。
/// 工厂可克隆（Arc 零成本）；重放 = clone 工厂 → 再次 build（build 幂等、
/// 无副作用，每次发送恰好物化一次）。
#[derive(Clone)]
pub struct HttpRequestPayload {
    build: Arc<HttpRequestPayloadBuildFn>,
    kind: HttpRequestPayloadKind,
}

impl HttpRequestPayload {
    /// 底层通用构造：`kind` 显式声明工厂种类（供分段下载准入判定）；
    /// multipart 请用 [`HttpRequestPayload::form`] 便捷构造。仅 crate 内部使用。
    pub(crate) fn new<F, Fut>(kind: HttpRequestPayloadKind, build: F) -> Self
    where
        F: Fn() -> Fut + Send + Sync + 'static,
        Fut: Future<Output = Result<HttpRequestBody>> + Send + 'static,
    {
        Self {
            build: Arc::new(move || Box::pin(build())),
            kind,
        }
    }

    /// payload 种类（构造期确定，零成本）。仅 crate 内部使用。
    pub(crate) fn kind(&self) -> HttpRequestPayloadKind {
        self.kind
    }

    /// JSON 构造：构造时一次 `Arc::new`，build 时 `Arc::clone` 重放（零拷贝）。
    pub fn json(value: serde_json::Value) -> Self {
        let value = Arc::new(value);
        Self::new(HttpRequestPayloadKind::Json, move || {
            let value = Arc::clone(&value);
            async move { Ok(HttpRequestBody::Json(value)) }
        })
    }

    /// multipart 便捷构造（闭包每次再次构建表单，重新打开文件）。
    ///
    /// 注意：先调用 `make_form()` 取得 future 再移入 `async move`——
    /// `make_form` 是 `Fn` 闭包（可多次调用），不能在 async 块内被移动。
    pub fn form<F, Fut>(make_form: F) -> Self
    where
        F: Fn() -> Fut + Send + Sync + 'static,
        Fut: Future<Output = Result<reqwest::multipart::Form>> + Send + 'static,
    {
        Self::new(HttpRequestPayloadKind::Form, move || {
            let fut = make_form();
            async move { Ok(HttpRequestBody::Form(fut.await?)) }
        })
    }

    /// 物化 payload（每次调用产出全新实例）。
    pub async fn build(&self) -> Result<HttpRequestBody> {
        (self.build)().await
    }
}

/// Trait for types that can be converted into a [`HttpRequestPayload`]。
///
/// JSON 值（`Value`/`&Value`）直接包装；工厂自身幂等透传。裸
/// `reqwest::multipart::Form` 不实现本 trait——multipart 必须经
/// [`HttpRequestPayload::form`] 包装，保证所有载荷均可参与 token 失效重放。
pub trait IntoHttpRequestPayload {
    fn into_http_request_payload(self) -> HttpRequestPayload;
}

impl IntoHttpRequestPayload for HttpRequestPayload {
    fn into_http_request_payload(self) -> HttpRequestPayload {
        self
    }
}

impl IntoHttpRequestPayload for serde_json::Value {
    fn into_http_request_payload(self) -> HttpRequestPayload {
        HttpRequestPayload::json(self)
    }
}

impl IntoHttpRequestPayload for &serde_json::Value {
    fn into_http_request_payload(self) -> HttpRequestPayload {
        // 构造时一次深拷贝（与现状 `json(self.clone())` 等量）；闭包只 Arc clone。
        HttpRequestPayload::json(self.clone())
    }
}

/// Raw HTTP request builder implementing `IntoFuture`.
///
/// Created via [`HttpTransportBackend::post`](crate::HttpTransportBackend::post).
/// Chain `.headers()`, `.header()`,
/// `.timeout()` or just `.await`.
///
/// The payload is a [`HttpRequestPayload`] (deferred materialization):
/// materialization happens in the sending chain (`reqwest_send`); the
/// envelope wrap is composed into the factory at the pipeline entry (raw
/// posts are never wrapped), and the first-segment `Range` header is derived
/// by `pipeline_execute` from the endpoint's `range_size` (JSON payloads only).
pub struct HttpRequest<'a> {
    pub(crate) http_client: &'a dyn HttpClient,
    pub(crate) endpoint: Cow<'a, Endpoint>,
    pub(crate) payload: HttpRequestPayload,
    pub(crate) header_error: Option<Error>,
    pub(crate) options: crate::WireOptions,
}

crate::impl_request_builder!(HttpRequest<'a>, +wire);

impl<'a> HttpRequest<'a> {
    pub fn new(
        http_client: &'a dyn HttpClient,
        endpoint: Cow<'a, Endpoint>,
        payload: HttpRequestPayload,
    ) -> Self {
        Self {
            http_client,
            endpoint,
            payload,
            header_error: None,
            options: crate::WireOptions::default(),
        }
    }

    /// 可变访问底层 [`WireOptions`](crate::WireOptions) —— 供 pipeline 的
    /// `sign` hook（每轮 fresh 签名）注入鉴权头等。
    pub fn wire_mut(&mut self) -> &mut crate::WireOptions {
        &mut self.options
    }

    /// 可变访问目标 [`Endpoint`] —— 供 pipeline 的 `sign` hook 追加
    /// endpoint 级参数。
    pub fn endpoint_mut(&mut self) -> &mut Cow<'a, Endpoint> {
        &mut self.endpoint
    }

    /// Execute the HTTP request.
    ///
    /// This is called automatically when you `.await` the [`HttpRequest`],
    /// but can also be invoked explicitly if needed.
    pub async fn execute(self) -> Result<response::HttpResponse> {
        if let Some(e) = self.header_error {
            return Err(e);
        }
        self.http_client.send(self).await
    }
}

impl<'a> IntoFuture for HttpRequest<'a> {
    type Output = Result<super::response::HttpResponse>;
    type IntoFuture =
        std::pin::Pin<Box<dyn std::future::Future<Output = Self::Output> + Send + 'a>>;

    fn into_future(self) -> Self::IntoFuture {
        Box::pin(self.execute())
    }
}

#[allow(clippy::needless_update)]
#[cfg(test)]
mod tests {
    //! ## 模块摘要：request（HTTP 请求类型定义）
    //!
    //! ### 关键接口
    //! - [HttpRequest] — HTTP 请求 builder，支持 [IntoFuture]
    //! - [HttpRequest::headers] — 附加额外 HTTP 头
    //! - [HttpRequestPayload] — payload 统一工厂（延迟物化）
    //!
    //! ### 关键分支与异常路径
    //! - [HttpRequest::headers] 传入空 HeaderMap → headers 仍为 None
    //! - [HttpRequest::header] 非法 name/value → header_error 为 Some

    use serde_json::json;
    use wiremock::MockServer;

    use super::*;
    use crate::http::HttpEndpoint;

    /// 测试 helper：构造 HTTP `Endpoint`。
    fn ep(base: &str, path: &str) -> Endpoint {
        let http = HttpEndpoint::new(path).with_base_url(base);
        Endpoint::new().with(http)
    }

    /// 测试 helper：构造 JSON payload 工厂。
    fn json_factory(value: serde_json::Value) -> HttpRequestPayload {
        HttpRequestPayload::json(value)
    }

    // ── HttpRequest::headers ──

    /// P0：headers() 设置非空 headers 后 headers 为 Some 且内容正确
    /// 条件：创建 HttpRequest 后调用 .headers(&non_empty_map)
    /// 断言：headers 为 Some，且包含设置的 header 名和值
    #[test]
    fn headers_sets_headers() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));
        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-extra"),
            reqwest::header::HeaderValue::from_static("val"),
        );

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req.headers(&extra);
        let headers = req.get_headers();
        assert_eq!(headers.len(), 1);
        assert_eq!(headers.get("x-extra").unwrap().to_str().unwrap(), "val");
    }

    /// P1：headers() 设置多个 headers 后内容全部正确
    /// 条件：创建 HttpRequest 后调用 .headers(&map_with_two_entries)
    /// 断言：headers 包含两个 header 且各值正确
    #[test]
    fn headers_sets_multiple_headers_correctly() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));
        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-token"),
            reqwest::header::HeaderValue::from_static("abc123"),
        );
        extra.insert(
            reqwest::header::HeaderName::from_static("x-request-id"),
            reqwest::header::HeaderValue::from_static("req-001"),
        );

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req.headers(&extra);
        let headers = req.get_headers();
        assert_eq!(headers.len(), 2);
        assert_eq!(headers.get("x-token").unwrap().to_str().unwrap(), "abc123");
        assert_eq!(
            headers.get("x-request-id").unwrap().to_str().unwrap(),
            "req-001"
        );
    }

    /// P1：headers() 传入空 HeaderMap 时 headers 保持 None
    /// 条件：创建 HttpRequest 后调用 .headers(&empty_map)
    /// 断言：headers 仍为 None
    #[test]
    fn headers_empty_map_stays_none() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));
        let empty = reqwest::header::HeaderMap::new();

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req.headers(&empty);
        assert!(req.get_headers().is_empty());
    }

    /// P0：headers() 多次调用时 extend 追加而非替换
    /// 条件：先 headers({x-a}) 再 headers({x-b})
    /// 断言：headers 包含 x-a 和 x-b 两个 header
    #[test]
    fn headers_extends_instead_of_replace() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));
        let mut first = reqwest::header::HeaderMap::new();
        first.insert(
            reqwest::header::HeaderName::from_static("x-a"),
            reqwest::header::HeaderValue::from_static("a-val"),
        );
        let mut second = reqwest::header::HeaderMap::new();
        second.insert(
            reqwest::header::HeaderName::from_static("x-b"),
            reqwest::header::HeaderValue::from_static("b-val"),
        );

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req.headers(&first).headers(&second);
        let headers = req.get_headers();
        assert_eq!(headers.len(), 2);
        assert_eq!(headers.get("x-a").unwrap().to_str().unwrap(), "a-val");
        assert_eq!(headers.get("x-b").unwrap().to_str().unwrap(), "b-val");
    }

    // ── HttpRequest::header ──

    /// P0：header() 添加单个 header 到 headers
    /// 条件：创建 HttpRequest 后调用 .header("x-single", "val")
    /// 断言：headers 包含该 header 且值正确
    #[test]
    fn header_adds_single_header() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req.header("x-single", "val");
        assert!(req.header_error.is_none());
        let headers = req.get_headers();
        assert_eq!(headers.len(), 1);
        assert_eq!(headers.get("x-single").unwrap().to_str().unwrap(), "val");
    }

    /// P0：header() 可链式调用多次，追加多个 header
    /// 条件：连续调用 .header("x-a", "1").header("x-b", "2")
    /// 断言：headers 包含两个 header
    #[test]
    fn header_chain_multiple() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req.header("x-a", "1").header("x-b", "2");
        assert!(req.header_error.is_none());
        let headers = req.get_headers();
        assert_eq!(headers.len(), 2);
        assert_eq!(headers.get("x-a").unwrap().to_str().unwrap(), "1");
        assert_eq!(headers.get("x-b").unwrap().to_str().unwrap(), "2");
    }

    /// P1：header() 和 headers() 混合使用时全部追加
    /// 条件：先 header("x-a"), 再 headers({x-b}), 再 header("x-c")
    /// 断言：headers 包含三个 header
    #[test]
    fn header_and_headers_mixed() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));
        let mut batch = reqwest::header::HeaderMap::new();
        batch.insert(
            reqwest::header::HeaderName::from_static("x-b"),
            reqwest::header::HeaderValue::from_static("b-val"),
        );

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req
            .header("x-a", "a-val")
            .headers(&batch)
            .header("x-c", "c-val");
        assert!(req.header_error.is_none());
        let headers = req.get_headers();
        assert_eq!(headers.len(), 3);
        assert_eq!(headers.get("x-a").unwrap().to_str().unwrap(), "a-val");
        assert_eq!(headers.get("x-b").unwrap().to_str().unwrap(), "b-val");
        assert_eq!(headers.get("x-c").unwrap().to_str().unwrap(), "c-val");
    }

    /// P1：header() 非法 header name 时错误延迟存储
    /// 条件：传入空字符串 "" 作为 header name
    /// 断言：header_error 为 Some
    #[test]
    fn header_rejects_invalid_name() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req.header("", "value");
        assert!(req.header_error.is_some());
    }

    /// P1：header() 非法 header value 时错误延迟存储
    /// 条件：传入含 null 字节的 value
    /// 断言：header_error 为 Some
    #[test]
    fn header_rejects_invalid_value() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req.header("x-name", "\0\0\0invalid");
        assert!(req.header_error.is_some());
    }

    /// P1：[HttpRequest::execute] header_error 为 Some 时直接返回 Err
    /// 条件：header 非法 → header_error Some，调用 execute().await
    /// 断言：返回 Err，不发起网络请求
    #[tokio::test]
    async fn execute_returns_header_error() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json!({});

        let req = HttpRequest::new(
            &*transport.http_client,
            Cow::Borrowed(&endpoint),
            HttpRequestPayload::json(payload),
        );
        let req = req.header("", "value");
        let result = req.execute().await;
        assert!(result.is_err());
    }

    // ── HttpRequest::timeout ──

    /// P0：[HttpRequest::timeout] timeout() 正确设置 timeout 字段
    /// 条件：创建 HttpRequest 后调用 .timeout(Duration::from_secs(30))
    /// 断言：timeout 字段为 Some(30s)
    #[test]
    fn timeout_sets_field() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req.timeout(std::time::Duration::from_secs(30));
        assert_eq!(req.get_timeout(), Some(std::time::Duration::from_secs(30)));
    }

    /// P0：[HttpRequest::timeout] timeout 默认为 None
    /// 条件：创建 HttpRequest 不调用 timeout()
    /// 断言：timeout 字段为 None
    #[test]
    fn timeout_default_none() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        assert!(req.get_timeout().is_none());
    }

    /// P1：[HttpRequest::timeout] timeout() 和 headers() 可链式调用
    /// 条件：先 timeout(10s) 再 headers(&map)
    /// 断言：timeout 和 headers 均正确设置
    #[test]
    fn timeout_and_headers_chain() {
        let transport = crate::HttpTransportBackend::default();
        let endpoint = ep("http://test", "/");
        let payload = json_factory(json!({}));
        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-chain"),
            reqwest::header::HeaderValue::from_static("val"),
        );

        let req = HttpRequest::new(&*transport.http_client, Cow::Borrowed(&endpoint), payload);
        let req = req
            .timeout(std::time::Duration::from_secs(10))
            .headers(&extra);
        assert_eq!(req.get_timeout(), Some(std::time::Duration::from_secs(10)));
        assert!(!req.get_headers().is_empty());
    }

    // ── HttpRequest::into_future headers 合并语义 ──

    /// P0：[HttpRequest::into_future] 仅 .headers(...) 设置的 header 会被发送
    /// 条件：transport 只提供 http_client（不含任何 headers）；.headers 追加 x-extra=extra-val
    /// 断言：wire 请求包含 x-extra（transport 级 headers 不由 HttpRequest::execute 自动合并）
    #[tokio::test]
    async fn into_future_sends_only_request_headers() {
        use wiremock::matchers::{method, path};
        use wiremock::{Match, Mock, Request, ResponseTemplate};

        struct ExtraOnlyMatcher;
        impl Match for ExtraOnlyMatcher {
            fn matches(&self, request: &Request) -> bool {
                request.headers.get("x-extra").and_then(|v| v.to_str().ok()) == Some("extra-val")
            }
        }

        let server = MockServer::start().await;
        let transport = crate::HttpTransportBackend::default();

        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-extra"),
            reqwest::header::HeaderValue::from_static("extra-val"),
        );

        Mock::given(method("POST"))
            .and(path("/merge"))
            .and(ExtraOnlyMatcher)
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": "{\"ok\":true}"
            })))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/merge");
        let req = HttpRequest::new(
            &*transport.http_client,
            Cow::Borrowed(&endpoint),
            json_factory(json!({})),
        );
        let _ = req.headers(&extra).await.unwrap();
    }

    /// P1：[HttpRequest::into_future] 不调用 .headers() 时，请求不携带 transport 级 header
    /// 条件：transport.headers 含 x-only；直接通过 HttpRequest::execute 发起请求（跳过 invoke 合并）
    /// 断言：wire 请求中 **不含** x-only——验证 request 子层不自动合并 transport.headers
    #[tokio::test]
    async fn into_future_only_transport_headers() {
        use wiremock::matchers::{method, path};
        use wiremock::{Match, Mock, Request, ResponseTemplate};

        struct NoTransportHeaderMatcher;
        impl Match for NoTransportHeaderMatcher {
            fn matches(&self, request: &Request) -> bool {
                request.headers.get("x-only").is_none()
            }
        }

        let server = MockServer::start().await;
        let mut base_headers = reqwest::header::HeaderMap::new();
        base_headers.insert(
            reqwest::header::HeaderName::from_static("x-only"),
            reqwest::header::HeaderValue::from_static("only-val"),
        );
        let transport = crate::HttpTransportBackend::default();

        Mock::given(method("POST"))
            .and(path("/only"))
            .and(NoTransportHeaderMatcher)
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": "{\"ok\":true}"
            })))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/only");
        let req = HttpRequest::new(
            &*transport.http_client,
            Cow::Borrowed(&endpoint),
            json_factory(json!({})),
        );
        let _ = req.await.unwrap();
    }

    /// P1：[HttpRequest::into_future] .headers() 多次调用为 extend 语义，不会丢失先前 header
    /// 条件：先 .headers({x-first:val1}) 再 .headers({x-second:val2})
    /// 断言：wire 请求同时包含 x-first 和 x-second
    #[tokio::test]
    async fn into_future_extends_multiple_headers() {
        use wiremock::matchers::{method, path};
        use wiremock::{Match, Mock, Request, ResponseTemplate};

        struct BothMatcher;
        impl Match for BothMatcher {
            fn matches(&self, request: &Request) -> bool {
                let first =
                    request.headers.get("x-first").and_then(|v| v.to_str().ok()) == Some("val1");
                let second = request
                    .headers
                    .get("x-second")
                    .and_then(|v| v.to_str().ok())
                    == Some("val2");
                first && second
            }
        }

        let mut first_only = wiremock::http::HeaderMap::new();
        first_only.insert(
            wiremock::http::HeaderName::from_static("x-first"),
            wiremock::http::HeaderValue::from_static("val1"),
        );
        let request = Request {
            url: wiremock::http::Url::parse("http://localhost").unwrap(),
            method: wiremock::http::Method::POST,
            headers: first_only,
            body: Vec::new(),
        };
        assert!(!BothMatcher.matches(&request));

        let server = MockServer::start().await;
        let transport = crate::HttpTransportBackend::default();

        let mut first = reqwest::header::HeaderMap::new();
        first.insert(
            reqwest::header::HeaderName::from_static("x-first"),
            reqwest::header::HeaderValue::from_static("val1"),
        );
        let mut second = reqwest::header::HeaderMap::new();
        second.insert(
            reqwest::header::HeaderName::from_static("x-second"),
            reqwest::header::HeaderValue::from_static("val2"),
        );

        Mock::given(method("POST"))
            .and(path("/override"))
            .and(BothMatcher)
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": "{\"ok\":true}"
            })))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/override");
        let req = HttpRequest::new(
            &*transport.http_client,
            Cow::Borrowed(&endpoint),
            json_factory(json!({})),
        );
        let _ = req.headers(&first).headers(&second).await.unwrap();
    }

    // ── HttpRequestBody ──

    /// P1：[HttpRequestBody::Display] Form 形态显示为 [multipart/form-data]
    /// 条件：构造 HttpRequestBody::Form
    /// 断言：Display 格式化为 "[multipart/form-data]"
    #[test]
    fn display_form_variant() {
        let data = HttpRequestBody::Form(reqwest::multipart::Form::new().text("key", "value"));
        let s = format!("{data}");
        assert_eq!(s, "[multipart/form-data]");
    }

    /// P1：[HttpRequestBody::Display] Json 形态显示为 JSON 字符串
    /// 条件：构造 HttpRequestBody::Json
    /// 断言：Display 格式化为 JSON 内容
    #[test]
    fn display_json_variant() {
        let data = HttpRequestBody::Json(std::sync::Arc::new(json!({"key": "value"})));
        let s = format!("{data}");
        assert_eq!(s, r#"{"key":"value"}"#);
    }

    // ── HttpRequestPayload ──

    /// P0：[HttpRequestPayload::json] build 返回 Arc 持有的 JSON
    /// 条件：构造 json 工厂并 build
    /// 断言：HttpRequestBody::Json 且内容一致
    #[tokio::test]
    async fn payload_json_build() {
        let factory = HttpRequestPayload::json(json!({"a": 1}));
        match factory.build().await.unwrap() {
            HttpRequestBody::Json(value) => assert_eq!(value.as_ref(), &json!({"a": 1})),
            other => panic!("expected Json, got {other:?}"),
        }
    }

    /// P0：[HttpRequestPayload::form] 每次 build 产出独立 Form 实例
    /// 条件：构造 form 工厂（text 字段）；连续 build 两次
    /// 断言：两次均成功；实例指针不同（再次构建而非复用）
    #[tokio::test]
    async fn payload_form_build_produces_independent_forms() {
        let factory = HttpRequestPayload::form(|| async {
            Ok(reqwest::multipart::Form::new().text("key", "value"))
        });
        let first = match factory.build().await.unwrap() {
            HttpRequestBody::Form(form) => form,
            other => panic!("expected Form, got {other:?}"),
        };
        let second = match factory.build().await.unwrap() {
            HttpRequestBody::Form(form) => form,
            other => panic!("expected Form, got {other:?}"),
        };
        assert!(!std::ptr::eq(&first, &second));
    }

    /// P1：[HttpRequestPayload] 工厂返回错误时 build 透传
    /// 条件：工厂恒返回 Err(Error::Other)
    /// 断言：build() 返回该错误
    #[tokio::test]
    async fn payload_build_passthrough_error() {
        let factory = HttpRequestPayload::new(HttpRequestPayloadKind::Json, || async {
            Err::<HttpRequestBody, _>(crate::Error::other("boom".into()))
        });
        let err = factory.build().await.unwrap_err();
        assert_eq!(err.code(), crate::E_OTHER);
        assert_eq!(err.message(), "boom");
    }

    // ── HttpRequestPayloadKind（构造期种类标记）──

    /// P0：[HttpRequestPayload::json] 构造的工厂 kind 为 Json
    /// 条件：json({"a":1}) 构造
    /// 断言：kind() == HttpRequestPayloadKind::Json
    #[test]
    fn payload_factory_kind_json() {
        let factory = HttpRequestPayload::json(json!({"a": 1}));
        assert_eq!(factory.kind(), HttpRequestPayloadKind::Json);
    }

    /// P0：[HttpRequestPayload::form] 构造的工厂 kind 为 Form
    /// 条件：form(|| async { Ok(Form::new()) }) 构造
    /// 断言：kind() == HttpRequestPayloadKind::Form
    #[test]
    fn payload_factory_kind_form() {
        let factory = HttpRequestPayload::form(|| async { Ok(reqwest::multipart::Form::new()) });
        assert_eq!(factory.kind(), HttpRequestPayloadKind::Form);
    }

    /// P0：[HttpRequestPayload::new] 显式 kind 参数生效且闭包可物化 body
    /// 条件：new(HttpRequestPayloadKind::Json, 返回 Json body 的闭包) 构造并 build
    /// 断言：kind() == HttpRequestPayloadKind::Json，build() 返回 Json body
    #[tokio::test]
    async fn payload_factory_new_explicit_kind() {
        let factory = HttpRequestPayload::new(HttpRequestPayloadKind::Json, || async {
            Ok::<HttpRequestBody, crate::Error>(HttpRequestBody::Json(std::sync::Arc::new(json!(
                {}
            ))))
        });
        assert_eq!(factory.kind(), HttpRequestPayloadKind::Json);
        assert!(matches!(
            factory.build().await.unwrap(),
            HttpRequestBody::Json(_)
        ));
    }

    /// P1：[HttpRequestPayload] 克隆共享同一构建闭包（Arc 零成本）
    /// 条件：clone 工厂后两次 build
    /// 断言：两次均成功（克隆不影响构建）
    #[tokio::test]
    async fn payload_clone_shared() {
        let factory = HttpRequestPayload::json(json!({"a": 1}));
        let cloned = factory.clone();
        assert!(cloned.build().await.is_ok());
        assert!(factory.build().await.is_ok());
    }

    /// P0：[HttpRequestPayload::json] 直值构造的工厂重放零拷贝
    /// 条件：json(Value) 构造；连续两次 build
    /// 断言：两次产出指向同一堆分配（零拷贝重放），且值一致
    #[tokio::test]
    async fn payload_json_replay_zero_copy() {
        let factory = HttpRequestPayload::json(json!({"a": 1}));
        let first = match factory.build().await.unwrap() {
            HttpRequestBody::Json(v) => v,
            other => panic!("expected Json, got {other:?}"),
        };
        let second = match factory.build().await.unwrap() {
            HttpRequestBody::Json(v) => v,
            other => panic!("expected Json, got {other:?}"),
        };
        assert!(std::ptr::eq(first.as_ref(), second.as_ref()));
        assert_json_diff::assert_json_eq!(first.as_ref(), &json!({"a": 1}));
    }

    // ── IntoHttpRequestPayload ──

    /// P1：[IntoHttpRequestPayload] 工厂自身幂等透传
    /// 条件：构造 HttpRequestPayload 并调用 into_http_request_payload()
    /// 断言：返回的工厂可正常 build
    #[tokio::test]
    async fn into_http_request_payload_identity() {
        let factory = HttpRequestPayload::json(json!({"a": 1}));
        let same = factory.clone().into_http_request_payload();
        assert!(same.build().await.is_ok());
    }
}
