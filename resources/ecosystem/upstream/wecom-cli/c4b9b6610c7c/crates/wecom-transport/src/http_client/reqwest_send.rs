use futures_util::StreamExt;
use tracing::Instrument;

use super::body_guard;
use super::request::{HttpRequest, HttpRequestBody};
use super::response::HttpResponse;
use crate::http::EndpointHttpExt;
use crate::telemetry::contract::http_request as ctr;
use crate::{Error, MaskedHeaders, Result, telemetry};

/// Send an HTTP request via the `reqwest` backend.
///
/// ## Tracing
/// Opens an `http.request` span around the entire call. Deferred fields are
/// recorded as the response arrives or on failure.
///
/// Errors are intentionally **not** auto-logged via `instrument(err)`:
/// `Error::Network` is treated as a retryable signal by `poll_long_task`,
/// so logging at the bottom layer would produce false-positive errors
/// during healthy retry loops.
///
/// The body stream is wrapped with `body_guard::instrument_body` (see
/// [`super::body_guard`]) so
/// `res.body_len` is recorded exactly once when the stream is dropped
/// (normal exhaustion, early cancellation, or error).
pub(crate) async fn reqwest_request(
    client: &reqwest::Client,
    req: HttpRequest<'_>,
) -> Result<HttpResponse> {
    let url = req.endpoint.full_url();
    let headers = req.options.headers.clone();

    // Use injected RequestSpan if provided, otherwise create a new one.
    // The span has all contract fields pre-declared as Empty — backend
    // and endpoint are recorded here (instead of at creation time) so
    // both the injected and self-created paths work identically.
    let span = telemetry::RequestSpan::new().0;

    span.record(ctr::FIELD_BACKEND, "reqwest");
    span.record(ctr::FIELD_ENDPOINT, &url);

    let result = async move {
        let s = tracing::Span::current();
        s.record(
            ctr::FIELD_REQ_HEADERS,
            tracing::field::debug(&MaskedHeaders(&headers)),
        );
        tracing::info!(parent: &s, endpoint = %url, headers = ?MaskedHeaders(&headers), "reqwest request");

        let mut request = client.post(&url).headers(headers);

        // Single materialization point: build (deferred). The envelope wrap is
        // composed into the factory at the pipeline entry, and the first-segment
        // `Range` header is derived by `pipeline_execute` — this chain is a pure
        // pass-through for JSON / multipart bodies.
        let data = req.payload.build().await?;
        request = match data {
            HttpRequestBody::Json(value) => request.json(value.as_ref()),
            HttpRequestBody::Form(form) => request.multipart(form),
        };

        let request = super::shared::finalize_request(request, req.options.timeout)?;
        let started = std::time::Instant::now();

        let result = client.execute(request).await;

        s.record(
            ctr::FIELD_DURATION_HEADERS_MS,
            started.elapsed().as_millis() as u64,
        );

        let response = result.map_err(|e| super::shared::network_error(url.clone(), e))?;

        let status = response.status();
        s.record(ctr::FIELD_RES_STATUS, status.as_u16());

        let headers = response.headers().clone();
        s.record(
            ctr::FIELD_RES_HEADERS,
            tracing::field::debug(&MaskedHeaders(&headers)),
        );
        tracing::info!(
            status = %status.as_u16(),
            endpoint = %url,
            duration_headers_ms = started.elapsed().as_millis() as u64,
            headers = ?MaskedHeaders(&headers),
            "response headers received"
        );

        if !status.is_success() {
            return Err(super::shared::http_status_error(url, status));
        }

        // Map reqwest stream errors to Error::Network. The error is also recorded
        // onto the current span here — the outer match on the final result only
        // catches failures that happen *before* HttpResponse is returned, and
        // the stream produces errors *after* that point. The span is kept alive
        // via `with_span` below until the body is fully consumed.
        let url_for_err = url.clone();
        let mapped = response.bytes_stream().map(move |result| {
            result
                .map_err(|e| {
                    let err = Error::Network {
                        message: format!("Failed to read response stream: {e:#}"),
                        endpoint: url_for_err.clone(),
                        source: e,
                    };
                    tracing::Span::current().record(ctr::FIELD_ERROR, err.to_json().to_string());
                    err
                })
                .inspect_err(|e| tracing::error!(error = %e, "read response stream failed"))
        });
        let stream = body_guard::instrument_body(Box::pin(mapped), s.clone(), started);

        // Keep the span alive via HttpResponse until the body is fully consumed.
        Ok(HttpResponse::new(url, status.as_u16(), headers, stream).with_span(s))
    }
    .instrument(span.clone())
    .await;

    // Record the full Error enum once, covering every failure path within the
    // async block above. Stream errors that surface *after* HttpResponse is
    // returned are recorded inline at their raise site (see the `mapped` closure).
    if let Err(e) = &result {
        span.record(ctr::FIELD_ERROR, e.to_json().to_string());
    }

    result
}

#[cfg(test)]
mod tests {
    //! ## Module summary: reqwest_send (the reqwest backend's raw HTTP
    //! transmission function [reqwest_request])
    //!
    //! ### Key interfaces
    //! - [reqwest_request] — send one [HttpRequest] with a `reqwest::Client`,
    //!   returning the raw [HttpResponse] (endpoint / status / headers /
    //!   streaming body)
    //!
    //! ### Key branches and error paths
    //! - HttpRequestBody::Json → sent as an application/json body
    //! - HttpRequestBody::Form → sent as multipart/form-data
    //! - payload goes through the single materialization point: build
    //!   (deferred); the envelope wrap is composed at the pipeline entry and
    //!   the first-segment Range header is derived by `pipeline_execute`
    //! - req.headers = Some(map) → those headers are attached to the outbound request
    //! - req.headers = None → no extra headers attached; the request still succeeds
    //! - req.options.timeout = Some(t) with a slow response > t → Error::Network
    //!   (reqwest timeout)
    //! - 2xx response → HttpResponse (status/headers passed through, no
    //!   Content-Type discrimination)
    //! - non-2xx response → Error::Http (correct status and endpoint)
    //! - unreachable host → Error::Network
    //! - the response body is exposed to upper layers via bytes_stream and can
    //!   be read out completely
    //!
    //! ### Upstream/downstream
    //! - upstream: [HttpRequest](crate::HttpRequest) calls this function on the
    //!   reqwest backend
    //! - downstream: non-2xx reqwest::Response maps to [Error::Http]; reqwest
    //!   send failures map to [Error::Network]

    use std::borrow::Cow;

    use futures_util::StreamExt;
    use serde_json::json;
    use wiremock::matchers::{header, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    use super::*;
    use crate::http_client::request::{HttpRequest, HttpRequestPayload};
    use crate::{Endpoint, Error};

    // ── 测试 helper ─────────────────────────────────────────────

    /// 构造一个用于测试的 reqwest::Client（不加任何特殊配置）。
    fn make_client() -> reqwest::Client {
        reqwest::Client::new()
    }

    /// 构造一个携带自定义超时的 reqwest::Client。
    fn make_client_with_timeout(timeout: std::time::Duration) -> reqwest::Client {
        reqwest::Client::builder().timeout(timeout).build().unwrap()
    }

    use crate::http::HttpEndpoint;

    /// 构造 HTTP `Endpoint`。
    fn ep(base: &str, p: &str) -> Endpoint {
        let http = HttpEndpoint::new(p).with_base_url(base);
        Endpoint::new().with(http)
    }

    /// 测试期间共享的 [`HttpClient`]：`reqwest_request` 不会真正读取它，
    /// 但 [`HttpRequest`] 结构持有 `&dyn HttpClient` 字段，需要一个稳定引用。
    fn dummy_client() -> &'static reqwest::Client {
        use std::sync::OnceLock;
        static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
        CLIENT.get_or_init(reqwest::Client::new)
    }

    /// 用 JSON payload 构造一个 HttpRequest（不设置 headers / timeout）。
    ///
    /// 注意：`reqwest_request` 不依赖 `http_client` 字段，但 `HttpRequest` 结构
    /// 自身仍含该字段，构造时填入测试共享的 dummy client。
    fn make_json_req<'a>(
        endpoint: &'a Endpoint,
        payload: &'a serde_json::Value,
    ) -> HttpRequest<'a> {
        HttpRequest::new(
            dummy_client(),
            Cow::Borrowed(endpoint),
            HttpRequestPayload::json(payload.clone()),
        )
    }

    /// 用 multipart Form payload 构造一个 HttpRequest（不设置 headers / timeout）。
    fn make_form_req(endpoint: &Endpoint, form: HttpRequestPayload) -> HttpRequest<'_> {
        HttpRequest::new(dummy_client(), Cow::Borrowed(endpoint), form)
    }

    /// 把 `HttpResponse` 的 body 全部读出来，便于断言。
    async fn drain_body(resp: HttpResponse) -> Vec<u8> {
        let mut stream = resp.bytes_stream();
        let mut buf = Vec::new();
        while let Some(chunk) = stream.next().await {
            buf.extend_from_slice(&chunk.unwrap());
        }
        buf
    }

    // ── happy path：JSON payload ────────────────────────────────

    /// P0：[reqwest_request] JSON payload 成功时返回 HttpResponse，status / body 透传
    /// 条件：Mock 服务器对 POST /api/json 返回 200 + JSON body
    /// 断言：返回 HttpResponse.status == 200，endpoint 含 /api/json，body 字节内容匹配
    #[tokio::test]
    async fn json_payload_happy_path_returns_raw_response() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/api/json"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": "{\"status\":\"ok\"}",
            })))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/json");
        let payload = json!({"query": "test"});
        let req = make_json_req(&endpoint, &payload);

        let resp = reqwest_request(&client, req).await.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
        assert!(resp.endpoint().contains("/api/json"));

        let bytes = drain_body(resp).await;
        let value: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(value["result"], "{\"status\":\"ok\"}");
    }

    /// P0：[reqwest_request] 响应 headers 透传给 HttpResponse
    /// 条件：Mock 返回 200 + Content-Type: text/csv + 自定义 X-Echo header
    /// 断言：HttpResponse.headers() 含上述两个 header（不做 JSON/二进制判别，纯透传）
    #[tokio::test]
    async fn response_headers_are_passed_through() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/api/csv"))
            .respond_with(
                ResponseTemplate::new(200)
                    .set_body_bytes(b"col1,col2\nval1,val2".to_vec())
                    .insert_header("Content-Type", "text/csv")
                    .insert_header("X-Echo", "yes"),
            )
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/csv");
        let payload = json!({});
        let req = make_json_req(&endpoint, &payload);

        let resp = reqwest_request(&client, req).await.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
        assert_eq!(
            resp.headers()
                .get("Content-Type")
                .and_then(|v| v.to_str().ok()),
            Some("text/csv")
        );
        assert_eq!(
            resp.headers().get("X-Echo").and_then(|v| v.to_str().ok()),
            Some("yes")
        );
    }

    // ── happy path：multipart Form payload ──────────────────────

    /// P0：[reqwest_request] multipart Form payload 成功时正常发送并返回 HttpResponse
    /// 条件：Mock 服务器对 POST /upload 返回 200 + JSON body
    /// 断言：返回 HttpResponse.status == 200，body 内容可读（JSON 字节流）
    #[tokio::test]
    async fn form_payload_happy_path() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/upload"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "file_id": "abc123",
            })))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/upload");
        let form = HttpRequestPayload::form(|| async {
            Ok(reqwest::multipart::Form::new().text("field", "value"))
        });
        let req = make_form_req(&endpoint, form);

        let resp = reqwest_request(&client, req).await.unwrap();
        assert_eq!(resp.status().as_u16(), 200);

        let bytes = drain_body(resp).await;
        let value: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(value["file_id"], "abc123");
    }

    // ── headers 透传 ────────────────────────────────────────────

    /// P0：[reqwest_request] req.headers = Some(map) 时这些 header 被发到 wire 上
    /// 条件：HttpRequest.headers 含 X-Custom-Token: secret123，Mock 用 header matcher 校验
    /// 断言：Mock expect(1) 满足（说明 header 真的到了服务端）
    #[tokio::test]
    async fn json_with_headers_sends_headers_on_wire() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/api/authed"))
            .and(header("x-custom-token", "secret123"))
            .respond_with(ResponseTemplate::new(200).set_body_string("ok"))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/authed");
        let payload = json!({});
        let mut req = make_json_req(&endpoint, &payload);
        let mut hdrs = reqwest::header::HeaderMap::new();
        hdrs.insert(
            reqwest::header::HeaderName::from_static("x-custom-token"),
            reqwest::header::HeaderValue::from_static("secret123"),
        );
        req.options.headers = hdrs;

        let resp = reqwest_request(&client, req).await.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
    }

    /// P1：[reqwest_request] req.options.headers = Some(map) 含多个 header 时全部发到 wire 上
    /// 条件：headers = {x-a: 1, x-b: 2}，Mock 同时校验两个 header
    /// 断言：Mock expect(1) 满足，请求成功返回
    #[tokio::test]
    async fn json_with_multiple_headers_all_sent() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/api/multi"))
            .and(header("x-a", "1"))
            .and(header("x-b", "2"))
            .respond_with(ResponseTemplate::new(200).set_body_string("ok"))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/multi");
        let payload = json!({});
        let mut req = make_json_req(&endpoint, &payload);
        let mut hdrs = reqwest::header::HeaderMap::new();
        hdrs.insert(
            reqwest::header::HeaderName::from_static("x-a"),
            reqwest::header::HeaderValue::from_static("1"),
        );
        hdrs.insert(
            reqwest::header::HeaderName::from_static("x-b"),
            reqwest::header::HeaderValue::from_static("2"),
        );
        req.options.headers = hdrs;

        let resp = reqwest_request(&client, req).await.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
    }

    /// P1：[reqwest_request] req.headers = None 时请求仍能正常发送（unwrap_or_default）
    /// 条件：HttpRequest.headers 为 None
    /// 断言：请求成功，HttpResponse.status == 200
    #[tokio::test]
    async fn json_with_no_headers_still_succeeds() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/api/no_hdrs"))
            .respond_with(ResponseTemplate::new(200).set_body_string("ok"))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/no_hdrs");
        let payload = json!({});
        let req = make_json_req(&endpoint, &payload);

        let resp = reqwest_request(&client, req).await.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
    }

    /// P1：[reqwest_request] multipart 请求也能正确携带自定义 header
    /// 条件：form payload + headers = {x-extra: extra-val}
    /// 断言：Mock header matcher 校验通过，请求成功
    #[tokio::test]
    async fn form_with_headers_sends_headers_on_wire() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/upload/headers"))
            .and(header("x-extra", "extra-val"))
            .respond_with(ResponseTemplate::new(200).set_body_string("ok"))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/upload/headers");
        let form = HttpRequestPayload::form(|| async {
            Ok(reqwest::multipart::Form::new().text("field", "value"))
        });
        let mut req = make_form_req(&endpoint, form);
        let mut hdrs = reqwest::header::HeaderMap::new();
        hdrs.insert(
            reqwest::header::HeaderName::from_static("x-extra"),
            reqwest::header::HeaderValue::from_static("extra-val"),
        );
        req.options.headers = hdrs;

        let resp = reqwest_request(&client, req).await.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
    }

    // ── HTTP 错误（非 2xx） ────────────────────────────────────

    /// P0：[reqwest_request] 响应 500 时返回 Error::Http
    /// 条件：Mock 对 POST /api/fail 返回 500
    /// 断言：错误类型为 Error::Http，status == 500，endpoint 含 /api/fail
    #[tokio::test]
    async fn http_500_returns_http_error() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/api/fail"))
            .respond_with(ResponseTemplate::new(500))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/fail");
        let payload = json!({});
        let req = make_json_req(&endpoint, &payload);

        let err = reqwest_request(&client, req).await.unwrap_err();
        match &err {
            Error::Http {
                status, endpoint, ..
            } => {
                assert_eq!(*status, 500);
                assert!(endpoint.contains("/api/fail"));
            }
            other => panic!("Expected Error::Http, got: {other:?}"),
        }
    }

    /// P1：[reqwest_request] 响应 404 时返回 Error::Http（任意非 2xx 都映射）
    /// 条件：Mock 对 POST /api/missing 返回 404
    /// 断言：错误类型为 Error::Http，status == 404
    #[tokio::test]
    async fn http_404_returns_http_error() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/api/missing"))
            .respond_with(ResponseTemplate::new(404))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/missing");
        let payload = json!({});
        let req = make_json_req(&endpoint, &payload);

        let err = reqwest_request(&client, req).await.unwrap_err();
        assert!(matches!(err, Error::Http { status: 404, .. }));
    }

    /// P1：[reqwest_request] multipart 请求遇到 413 时返回 Error::Http
    /// 条件：Mock 对 multipart 上传返回 413
    /// 断言：Error::Http，status == 413
    #[tokio::test]
    async fn form_http_413_returns_http_error() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/upload/big"))
            .respond_with(ResponseTemplate::new(413))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/upload/big");
        let form = HttpRequestPayload::form(|| async {
            Ok(reqwest::multipart::Form::new().text("f", "v"))
        });
        let req = make_form_req(&endpoint, form);

        let err = reqwest_request(&client, req).await.unwrap_err();
        assert!(matches!(err, Error::Http { status: 413, .. }));
    }

    // ── 网络错误 ────────────────────────────────────────────────

    /// P0：[reqwest_request] 目标主机不可达时返回 Error::Network
    /// 条件：绑定本地端口后立即释放，向该端口发请求；client 设 200ms 超时避免长时间挂起
    /// 断言：错误类型为 Error::Network
    #[tokio::test]
    async fn unreachable_host_returns_network_error() {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        drop(listener);

        let client = make_client_with_timeout(std::time::Duration::from_millis(200));

        let endpoint = ep(&format!("http://127.0.0.1:{port}"), "/unreachable");
        let payload = json!({});
        let req = make_json_req(&endpoint, &payload);

        let err = reqwest_request(&client, req).await.unwrap_err();
        assert!(
            matches!(err, Error::Network { .. }),
            "expected Error::Network, got: {err:?}"
        );
    }

    // ── timeout ────────────────────────────────────────────────

    /// P0：[reqwest_request] req.options.timeout 设置后慢响应触发 Error::Network（reqwest timeout）
    /// 条件：Mock 延迟 2s 响应，req.options.timeout = Some(100ms)
    /// 断言：错误类型为 Error::Network
    #[tokio::test]
    async fn request_timeout_triggers_network_error() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/api/slow"))
            .respond_with(
                ResponseTemplate::new(200)
                    .set_body_string("ok")
                    .set_delay(std::time::Duration::from_secs(2)),
            )
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/slow");
        let payload = json!({});
        let mut req = make_json_req(&endpoint, &payload);
        req.options.timeout = Some(std::time::Duration::from_millis(100));

        let err = reqwest_request(&client, req).await.unwrap_err();
        assert!(
            matches!(err, Error::Network { .. }),
            "expected Error::Network (timeout), got: {err:?}"
        );
    }

    /// P1：[reqwest_request] req.options.timeout 设置足够长时慢响应正常完成
    /// 条件：Mock 延迟 200ms，req.options.timeout = Some(5s)
    /// 断言：请求成功返回，status == 200
    #[tokio::test]
    async fn request_timeout_long_enough_succeeds() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/api/slow_ok"))
            .respond_with(
                ResponseTemplate::new(200)
                    .set_body_string("ok")
                    .set_delay(std::time::Duration::from_millis(200)),
            )
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/slow_ok");
        let payload = json!({});
        let mut req = make_json_req(&endpoint, &payload);
        req.options.timeout = Some(std::time::Duration::from_secs(5));

        let resp = reqwest_request(&client, req).await.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
    }

    /// P1：[reqwest_request] 不设置 timeout 时慢响应正常完成
    /// 条件：Mock 延迟 200ms，req.options.timeout = None
    /// 断言：请求成功返回
    #[tokio::test]
    async fn no_timeout_slow_request_succeeds() {
        let server = MockServer::start().await;
        let client = make_client();

        Mock::given(method("POST"))
            .and(path("/api/slow_ok2"))
            .respond_with(
                ResponseTemplate::new(200)
                    .set_body_string("ok")
                    .set_delay(std::time::Duration::from_millis(200)),
            )
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/slow_ok2");
        let payload = json!({});
        let req = make_json_req(&endpoint, &payload);

        let resp = reqwest_request(&client, req).await.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
    }

    // ── body 流式读取 ───────────────────────────────────────────

    /// P1：[reqwest_request] 响应 body 通过 bytes_stream 完整透传
    /// 条件：Mock 返回 200 + 较大 body（多 chunk 不保证，至少能完整读出）
    /// 断言：drain 后的字节内容与服务端发送的内容相等
    #[tokio::test]
    async fn body_stream_can_be_drained_completely() {
        let server = MockServer::start().await;
        let client = make_client();

        let payload_str = "abcdefghijklmnopqrstuvwxyz0123456789".repeat(100);
        let body_for_mock = payload_str.clone();

        Mock::given(method("POST"))
            .and(path("/api/big"))
            .respond_with(ResponseTemplate::new(200).set_body_string(body_for_mock))
            .expect(1)
            .mount(&server)
            .await;

        let endpoint = ep(&server.uri(), "/api/big");
        let payload = json!({});
        let req = make_json_req(&endpoint, &payload);

        let resp = reqwest_request(&client, req).await.unwrap();
        let bytes = drain_body(resp).await;
        assert_eq!(String::from_utf8(bytes).unwrap(), payload_str);
    }
}
