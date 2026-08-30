use std::borrow::Cow;

use reqwest::header::{HeaderName, HeaderValue};
use serde::Serialize;

use super::envelope::ResponseEnvelope;
use super::protocol;
use crate::http::EndpointHttpExt;
use crate::http_client::HttpClient;
use crate::polling::{LongTaskPollData, PollMode};
use crate::{Endpoint, Error, HttpEndpoint, PollEndpoint, PollEvent, Result, polling};

// ── LongTaskPollData trait ──

impl polling::LongTaskPollData for protocol::ApiResponse {
    fn poll_info(&self) -> Option<polling::LongTaskPollInfo> {
        self.long_task_poll.clone()
    }
}

#[derive(Debug, Serialize)]
struct LongTaskPollRequest {
    method: String,
    payload: String,
}

/// HTTP 长任务轮询的请求级上下文。
///
/// 把发出每一轮轮询请求所需的传输配置聚合为一个结构体，避免
/// [`poll_long_task`] 出现过多参数。仅在 `http` 模块内部使用。
pub(super) struct HttpPollContext<'a> {
    pub(super) http_client: &'a dyn HttpClient,
    pub(super) options: crate::RequestOptions,
    pub(super) poll_mode: PollMode,
    pub(super) base_url: &'a str,
    pub(super) request_endpoint: &'a Endpoint,
    /// Response-side envelope used to parse every poll round's body.
    pub(super) res_envelope: &'a dyn ResponseEnvelope,
}

pub(crate) async fn poll_long_task(
    ctx: &HttpPollContext<'_>,
    taskid: &str,
) -> Result<protocol::ApiResponse> {
    let mut wire = ctx.options.wire.clone();

    // Select poll endpoint based on mode.
    let (poll_endpoint, poll_payload) = match ctx.poll_mode {
        PollMode::TaskQuery => {
            // The in-flight business endpoint may carry a `PollEndpoint`
            // capability (filled by the layer above from its endpoint
            // catalog); fall back to a protocol-level default so the
            // transport stays self-sufficient.
            let mut poll_endpoint = ctx
                .request_endpoint
                .get::<PollEndpoint>()
                .map(|pe| pe.0.clone())
                .unwrap_or_else(|| Endpoint::new().with(HttpEndpoint::new("/task/query")));

            // Fill transport-level defaults so the poll request resolves to
            // the same host as the original request when the capability left
            // them `None`.
            poll_endpoint = poll_endpoint.map::<HttpEndpoint>(|http| {
                let mut http = http;
                if http.base_url().is_none() && !ctx.base_url.is_empty() {
                    http = http.with_base_url(ctx.base_url);
                }
                http
            });

            let payload = LongTaskPollRequest {
                method: "PollClawLongTask".to_string(),
                payload: serde_json::json!({ "taskid": taskid }).to_string(),
            };
            (
                Cow::Owned(poll_endpoint),
                serde_json::to_value(&payload).unwrap_or_default(),
            )
        }
        PollMode::ReuseEndpoint => {
            // Appends X-Long-Poll-TaskId header.
            wire.headers.insert(
                HeaderName::from_static("x-long-poll-taskid"),
                HeaderValue::from_str(taskid).map_err(|e| {
                    Error::other(format!("invalid taskid for X-Long-Poll-TaskId: {e:#}").into())
                })?,
            );
            (Cow::Borrowed(ctx.request_endpoint), serde_json::json!({}))
        }
    };

    tracing::info!(%taskid, poll_mode = ?ctx.poll_mode, "Polling long task start");

    polling::poll_long_task(|| {
        let payload_ref = &poll_payload;
        let poll_endpoint: &Endpoint = &poll_endpoint;

        let wire = wire.clone();
        let on_poll = ctx.options.on_poll.clone();

        async move {
            let request = ctx
                .http_client
                .post(poll_endpoint, payload_ref)
                .with_options(wire);

            // transport 子层返回原始 HttpResponse（流式 body）
            let response = request.await?;

            // 收齐 body + 响应侧信封解析（协议脱壳 + error 校验）。
            let body: serde_json::Value = response.json().await?;
            let data = ctx.res_envelope.decode(&poll_endpoint.full_url(), body)?;

            // 终态判定：终态那一轮回调一律不触发。
            let is_done = matches!(data.poll_info(), Some(info) if info.done == Some(true));

            // 长任务"轮回调"：每完成一轮 fetch 都触发（result 缺失也触发），
            // 用于"长轮询接口仍在运行"的心跳；终态那一轮不触发——终态数据由
            // 上层通过 `TransportRequest::await` 的返回值承载。
            //
            // HTTP 侧的 `result` 字段是 JSON 文本，这里先 parse 成 Value 再借给
            // 事件，使两种 transport 在事件层面对外统一为 `&Value`。parse 失败
            // 视为"本轮无 result"（仍触发心跳）。
            if let Some(cb) = &on_poll
                && !is_done
            {
                let result = data
                    .result
                    .as_deref()
                    .filter(|s| !s.is_empty())
                    .and_then(|s| serde_json::from_str(s).ok());
                let event = PollEvent {
                    taskid,
                    result: result.as_ref(),
                    extra: &data.extra,
                };
                cb(&event);
            }

            Ok(data)
        }
    })
    .await
}

// ── tests ──

#[cfg(test)]
#[allow(clippy::needless_update)]
mod tests {
    //! ## 模块摘要：http/long_task（HTTP 长任务轮询）
    //!
    //! ### 关键接口
    //! - [poll_long_task] — 通过 HTTP 传输方式轮询长任务直到完成
    //!
    //! ### 关键分支与异常路径
    //! - 首次请求即 done=true → 立即返回 ApiResponse
    //! - 多次轮询后 done=true → 循环 POST /task/query 直到完成
    //! - 服务端返回 error 字段（code/message）→ 传播为 Error::Api
    //! - HTTP 非 2xx 状态码 → 传播为 Error::Http
    //! - 响应体非法 JSON → 传播为 Error::Parse
    //!
    //! ### 上下游交互
    //! - 上游：被 [poll_if_long_task](super::request::poll_if_long_task) 在长任务场景中调用
    //! - 下游：依赖 [polling::poll_long_task] 执行通用轮询循环；
    //!   通过 [HttpRequest](crate::HttpRequest) 发送实际 HTTP POST 请求

    use assert_json_diff::assert_json_eq;
    use indexmap::IndexMap;
    use serde_json::json;
    use wiremock::matchers::{body_json, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    use super::*;
    use crate::polling::LongTaskPollData;
    use crate::{Error, HttpClient, HttpTransportBackend};

    /// 辅助函数：创建一个携带 base_url 的 HttpTransportBackend。
    fn build_http_transport(base_url: impl Into<String>) -> HttpTransportBackend {
        HttpTransportBackend {
            http_client: std::sync::Arc::new(reqwest::Client::new()),
            base_url: base_url.into(),
            ..Default::default()
        }
    }

    /// 构造一个空的 HeaderMap（测试中默认调用 poll_long_task 时无附加 header）。
    fn empty_headers() -> reqwest::header::HeaderMap {
        reqwest::header::HeaderMap::new()
    }

    /// 测试 helper：构造一个 `HttpPollContext`（`TaskQuery` 模式）。
    fn ctx_for<'a>(
        http_client: &'a dyn HttpClient,
        headers: reqwest::header::HeaderMap,
        base_url: &'a str,
    ) -> HttpPollContext<'a> {
        // 用于测试的静态 endpoint（不携带 PollEndpoint，走协议级默认回退）。
        static TEST_ENDPOINT: std::sync::LazyLock<Endpoint> =
            std::sync::LazyLock::new(|| Endpoint::new().with(HttpEndpoint::new("/task/query")));
        ctx_for_with(http_client, headers, base_url, &TEST_ENDPOINT)
    }

    /// 测试 helper：构造一个携带指定 `request_endpoint` 的 `HttpPollContext`。
    fn ctx_for_with<'a>(
        http_client: &'a dyn HttpClient,
        headers: reqwest::header::HeaderMap,
        base_url: &'a str,
        request_endpoint: &'a Endpoint,
    ) -> HttpPollContext<'a> {
        HttpPollContext {
            http_client,
            options: crate::RequestOptions {
                wire: crate::WireOptions {
                    headers,
                    timeout: None,
                    ..crate::WireOptions::default()
                },
                on_poll: None,
                ..Default::default()
            },
            base_url,
            request_endpoint,
            poll_mode: PollMode::TaskQuery,
            res_envelope: &crate::http::envelope::GatewayRes,
        }
    }

    /// Test-only request-side envelope (same shape as the WrapPayloadReq in
    /// request.rs; copied locally to avoid cross-module test-fixture coupling).
    #[derive(Debug, Clone, Copy, Default)]
    struct WrapPayloadReq;
    impl crate::http::envelope::RequestEnvelope for WrapPayloadReq {
        fn encode(&self, payload: serde_json::Value) -> serde_json::Value {
            serde_json::json!({ "payload": payload.to_string() })
        }
        fn name(&self) -> &'static str {
            "wrap-payload"
        }
    }

    /// Assert the request carries no Range header (polling is not a segmented
    /// download).
    struct NoRangeHeader;
    impl wiremock::Match for NoRangeHeader {
        fn matches(&self, request: &wiremock::Request) -> bool {
            request.headers.get("range").is_none()
        }
    }

    // ── LongTaskPollData trait 测试 ──

    /// P1：[ApiResponse] ApiResponse 的 long_task_poll 缺失时 poll_info 返回 None
    /// 条件：ApiResponse 的 long_task_poll 字段为 None
    /// 断言：poll_info() 返回 None
    #[test]
    fn poll_info_returns_none_when_absent() {
        let resp = protocol::ApiResponse {
            result: Some("{}".into()),
            error: None,
            taskid: None,
            long_task_poll: None,
            poll_mode: None,
            extra: IndexMap::new(),
        };
        assert!(resp.poll_info().is_none());
    }

    /// P1：[ApiResponse] ApiResponse 的 long_task_poll 存在时 poll_info 返回正确数据
    /// 条件：ApiResponse 包含完整 long_task_poll 信息
    /// 断言：返回的 done、task_timeout、polling_interval_ms 与设定值一致
    #[test]
    fn poll_info_returns_some_when_present() {
        let resp = protocol::ApiResponse {
            result: Some("{}".into()),
            error: None,
            taskid: Some("task_123".into()),
            long_task_poll: Some(polling::LongTaskPollInfo {
                done: Some(false),
                task_timeout: Some(60),
                polling_interval_ms: Some(1000),
                ..Default::default()
            }),
            poll_mode: None,
            extra: IndexMap::new(),
        };
        let info = resp.poll_info().unwrap();
        assert_eq!(info.done, Some(false));
        assert_eq!(info.task_timeout, Some(60));
        assert_eq!(info.polling_interval_ms, Some(1000));
    }

    /// P1：[ApiResponse] ApiResponse 的 long_task_poll.done 为 true 时能正确读取
    /// 条件：long_task_poll.done = true，其余字段为 None
    /// 断言：poll_info().done 等于 Some(true)
    #[test]
    fn poll_info_done_true() {
        let resp = protocol::ApiResponse {
            result: Some(r#"{"data":"ok"}"#.into()),
            error: None,
            taskid: Some("task_456".into()),
            long_task_poll: Some(polling::LongTaskPollInfo {
                done: Some(true),
                task_timeout: None,
                polling_interval_ms: None,
                ..Default::default()
            }),
            poll_mode: None,
            extra: IndexMap::new(),
        };
        let info = resp.poll_info().unwrap();
        assert_eq!(info.done, Some(true));
    }

    // ── poll_long_task 集成测试 ──
    // 注：LongTaskPollRequest 的结构精确断言见下方 `poll_request_has_exactly_two_fields`

    /// P0：[poll_long_task] HTTP 长任务轮询首次即完成的情况
    /// 条件：Mock 服务器首次请求即返回 done=true
    /// 断言：result 包含预期数据，poll_info.done 为 true
    #[tokio::test]
    async fn poll_long_task_immediate_done() {
        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        let expected_body = serde_json::json!({
            "method": "PollClawLongTask",
            "payload": serde_json::json!({ "taskid": "task_001" }).to_string(),
        });

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .and(body_json(&expected_body))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": r#"{"status":"success"}"#,
                "long_task_poll": {
                    "done": true,
                    "task_timeout": 60,
                    "polling_interval_ms": 500
                }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let headers = empty_headers();
        let ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        let result = poll_long_task(&ctx, "task_001").await.unwrap();
        assert_eq!(result.result.as_deref(), Some(r#"{"status":"success"}"#));
        assert!(result.poll_info().unwrap().done == Some(true));
    }

    /// P0：[poll_long_task] HTTP 长任务轮询多次直到完成
    /// 条件：第一次返回 done=false，第二次返回 done=true
    /// 断言：最终 result 包含完成时的数据
    #[tokio::test(start_paused = true)]
    async fn poll_long_task_polls_until_done() {
        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        let expected_body = serde_json::json!({
            "method": "PollClawLongTask",
            "payload": serde_json::json!({ "taskid": "task_002" }).to_string(),
        });

        // 第一次返回未完成（polling_interval_ms=1 使虚拟时钟快速推进）
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .and(body_json(&expected_body))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": null,
                "long_task_poll": {
                    "done": false,
                    "task_timeout": 60,
                    "polling_interval_ms": 1
                }
            })))
            .expect(1)
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // 第二次返回完成
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .and(body_json(&expected_body))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": r#"{"done_data":"hello"}"#,
                "long_task_poll": {
                    "done": true,
                    "task_timeout": 60,
                    "polling_interval_ms": 1
                }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let headers = empty_headers();
        let ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        let result = poll_long_task(&ctx, "task_002").await.unwrap();
        assert_eq!(result.result.as_deref(), Some(r#"{"done_data":"hello"}"#));
    }

    /// P1：[poll_long_task] HTTP 长任务轮询遇到 API 错误时正确传播错误
    /// 条件：Mock 服务器返回包含 error 字段（code=10001）的响应
    /// 断言：错误类型为 Error::Api，message 和 code 匹配
    #[tokio::test]
    async fn poll_long_task_api_error() {
        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "error": {
                    "code": 10001,
                    "message": "task not found"
                }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let headers = empty_headers();
        let ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        let err = poll_long_task(&ctx, "task_bad").await.unwrap_err();
        match &err {
            Error::Api { message, code, .. } => {
                assert_eq!(message, "task not found");
                assert_eq!(*code, Some(10001));
            }
            _ => panic!("Expected Error::Api, got: {err:?}"),
        }
    }

    /// P1：[poll_long_task] HTTP 长任务轮询遇到 HTTP 错误状态码时传播错误
    /// 条件：Mock 服务器返回 500 状态码
    /// 断言：错误类型为 Error::Http 且 status 为 500
    #[tokio::test]
    async fn poll_long_task_http_error() {
        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(500))
            .expect(1)
            .mount(&server)
            .await;

        let headers = empty_headers();
        let ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        let err = poll_long_task(&ctx, "task_500").await.unwrap_err();
        assert!(matches!(err, Error::Http { status: 500, .. }));
    }

    /// P1：[poll_long_task] HTTP 长任务轮询收到无效 JSON 响应时返回 Parse 错误
    /// 条件：Mock 服务器返回 "not json" 非合法 JSON 字符串
    /// 断言：错误类型为 Error::Parse
    #[tokio::test]
    async fn poll_long_task_invalid_json_response() {
        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_string("not json"))
            .expect(1)
            .mount(&server)
            .await;

        let headers = empty_headers();
        let ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        let err = poll_long_task(&ctx, "task_bad_json").await.unwrap_err();
        assert!(matches!(err, Error::Parse { .. }));
    }

    // ── 请求参数结构验证 ──

    /// P1：[poll_long_task] 轮询请求发送到正确的 URL 路径 /task/query
    /// 条件：使用 wiremock path matcher 精确匹配 "/task/query"
    /// 断言：Mock expect(1) 被满足，说明路径拼接正确
    #[tokio::test]
    async fn poll_request_sends_correct_url_path() {
        // 验证请求发往 base_url + "/task/query"
        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/task/query")) // 精确匹配路径
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{}",
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        // 如果路径拼接不对，mock 不会匹配，expect(1) 会导致失败
        let headers = empty_headers();
        let ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        let _ = poll_long_task(&ctx, "test_url").await.unwrap();
    }

    /// P1：base_url 带尾部斜杠时 URL 路径拼接仍然正确
    /// 条件：base_url 以 "/" 结尾，mock 匹配 "/task/query"
    /// 断言：请求成功，路径拼接未出现重复斜杠问题
    #[tokio::test]
    async fn poll_request_sends_correct_url_path_with_trailing_slash() {
        // 验证 base_url 末尾带斜杠时路径拼接仍然正确
        let server = MockServer::start().await;
        let transport = build_http_transport(format!("{}/", server.uri()));

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{}",
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let headers = empty_headers();
        let ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        let _ = poll_long_task(&ctx, "test_slash").await.unwrap();
    }

    /// P0：[poll_long_task] TaskQuery 模式优先使用 request_endpoint 携带的 PollEndpoint
    /// 条件：request_endpoint 携带 PollEndpoint（path=/custom/poll，base_url 为 None）
    /// 断言：轮询请求发往 /custom/poll 而非默认 /task/query；base_url 由 transport 默认回填
    #[tokio::test]
    async fn poll_uses_poll_endpoint_capability() {
        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/custom/poll"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{}",
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let biz_endpoint = Endpoint::new().with(PollEndpoint(
            Endpoint::new().with(HttpEndpoint::new("/custom/poll")),
        ));
        let headers = empty_headers();
        let ctx = ctx_for_with(
            transport.http_client(),
            headers,
            &transport.base_url,
            &biz_endpoint,
        );
        let _ = poll_long_task(&ctx, "task_poll_cap").await.unwrap();
    }

    /// P0: [poll_long_task] TaskQuery-mode poll requests are not
    ///     envelope-wrapped and carry no Range header.
    /// Setup: the PollEndpoint capability endpoint explicitly opts into
    /// WrapPayloadReq + range_size=Some(10).
    /// Assert: the wire body keeps the unwrapped shape (a wrap would add a
    /// nesting level and fail the exact body_json match); no Range header
    /// (a poll request is not a segmented download — it bypasses
    /// `pipeline_execute` and the sending chain never derives Range headers).
    #[tokio::test]
    async fn poll_task_query_not_wrapped_and_no_range_header() {
        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        let expected_body = serde_json::json!({
            "method": "PollClawLongTask",
            "payload": serde_json::json!({ "taskid": "task_no_wrap" }).to_string(),
        });

        Mock::given(method("POST"))
            .and(path("/custom/poll"))
            .and(body_json(&expected_body))
            .and(NoRangeHeader)
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{}",
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let poll_ep = Endpoint::new().with(
            HttpEndpoint::new("/custom/poll")
                .with_req_envelope(WrapPayloadReq)
                .with_range_size(Some(10)),
        );
        let biz_endpoint = Endpoint::new().with(PollEndpoint(poll_ep));
        let headers = empty_headers();
        let ctx = ctx_for_with(
            transport.http_client(),
            headers,
            &transport.base_url,
            &biz_endpoint,
        );
        let _ = poll_long_task(&ctx, "task_no_wrap").await.unwrap();
    }

    /// P0: [poll_long_task] ReuseEndpoint-mode poll requests are not
    ///     envelope-wrapped and carry no Range header.
    /// Setup: the business endpoint itself opts into WrapPayloadReq +
    /// range_size=Some(10); poll_mode = ReuseEndpoint.
    /// Assert: the wire body is the raw `{}`, the x-long-poll-taskid header is
    /// present, and no Range header is sent.
    #[tokio::test]
    async fn poll_reuse_endpoint_not_wrapped_and_no_range_header() {
        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/biz/reuse"))
            .and(body_json(serde_json::json!({})))
            .and(wiremock::matchers::header(
                "x-long-poll-taskid",
                "task_reuse",
            ))
            .and(NoRangeHeader)
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{}",
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let reuse_endpoint = Endpoint::new().with(
            HttpEndpoint::new("/biz/reuse")
                .with_base_url(transport.base_url.clone())
                .with_req_envelope(WrapPayloadReq)
                .with_range_size(Some(10)),
        );
        let headers = empty_headers();
        let mut ctx = ctx_for_with(
            transport.http_client(),
            headers,
            &transport.base_url,
            &reuse_endpoint,
        );
        ctx.poll_mode = PollMode::ReuseEndpoint;
        let _ = poll_long_task(&ctx, "task_reuse").await.unwrap();
    }

    /// P1：轮询请求体恰好只有 method 和 payload 两个字段，且对特殊字符 taskid 仍能正确嵌入
    /// 条件：使用多种 taskid（普通、带特殊字符）构造 LongTaskPollRequest
    /// 断言：序列化后精确匹配 {method:"PollClawLongTask", payload:"{\"taskid\":\"...\"}"}
    #[test]
    fn poll_request_has_exactly_two_fields() {
        for taskid in ["x", "xyz-789", "long_task_id_with_special_chars_!@#"] {
            let req = LongTaskPollRequest {
                method: "PollClawLongTask".to_string(),
                payload: serde_json::json!({ "taskid": taskid }).to_string(),
            };
            let json = serde_json::to_value(&req).unwrap();
            // match 语义：精确匹配完整结构（method 固定 + payload 内嵌 taskid）
            assert_json_eq!(
                json,
                json!({
                    "method": "PollClawLongTask",
                    "payload": serde_json::json!({ "taskid": taskid }).to_string(),
                })
            );
        }
    }

    // ── Headers 传递验证 ──

    /// P0：[poll_long_task] 传入的 headers 正确转发到每一轮轮询请求
    /// 条件：自定义 HeaderMap 中放入 x-only-in-ctx，作为 headers 参数传入 poll_long_task
    /// 断言：wire 请求包含 x-only-in-ctx
    #[tokio::test]
    async fn poll_long_task_uses_ctx_headers() {
        use wiremock::{Match, Request};

        struct OnlyCtxHeaderMatcher;
        impl Match for OnlyCtxHeaderMatcher {
            fn matches(&self, request: &Request) -> bool {
                request
                    .headers
                    .get("x-only-in-ctx")
                    .and_then(|v| v.to_str().ok())
                    == Some("ctx-val")
            }
        }

        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        let mut ctx_headers = reqwest::header::HeaderMap::new();
        ctx_headers.insert(
            reqwest::header::HeaderName::from_static("x-only-in-ctx"),
            reqwest::header::HeaderValue::from_static("ctx-val"),
        );

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .and(OnlyCtxHeaderMatcher)
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{}",
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let ctx = ctx_for(transport.http_client(), ctx_headers, &transport.base_url);
        let _ = poll_long_task(&ctx, "ctx_only_hdr").await.unwrap();
    }

    // ── on_poll 回调 ──

    /// P0：[poll_long_task] on_poll 在每个非终态轮触发，`done=true` 终态不触发
    /// 条件：第 1 轮 result="{\"progress\":50}" done=false；第 2 轮 result="{\"final\":true}" done=true
    /// 断言：on_poll 仅被调用 1 次（第 1 轮），event.result=Some(parsed Value)；
    ///       第 2 轮 result 作为终态由 poll_long_task 返回值承载（不触发 on_poll）
    #[tokio::test(start_paused = true)]
    async fn poll_on_poll_invokes_only_on_progress_not_on_done() {
        use std::sync::{Arc, Mutex};

        use crate::{PollCallback, PollEvent};

        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{\"progress\":50}",
                "long_task_poll": { "done": false, "polling_interval_ms": 1 }
            })))
            .up_to_n_times(1)
            .mount(&server)
            .await;

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{\"done\":true}",
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let hits: Arc<Mutex<Vec<Option<serde_json::Value>>>> = Arc::new(Mutex::new(Vec::new()));
        let hits_cb = hits.clone();
        let cb: PollCallback =
            Arc::new(move |ev: &PollEvent<'_>| hits_cb.lock().unwrap().push(ev.result.cloned()));

        let headers = empty_headers();
        let mut ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        ctx.options.on_poll = Some(cb);
        let final_data = poll_long_task(&ctx, "task_tick_progress").await.unwrap();

        let got = hits.lock().unwrap().clone();
        assert_eq!(got.len(), 1, "on_poll 仅在进度轮触发，终态轮不触发");
        assert_eq!(got[0], Some(serde_json::json!({"progress": 50})));
        assert_eq!(final_data.result.as_deref(), Some("{\"done\":true}"));
    }

    /// P0：[poll_long_task] on_poll 在 result 缺失/为空时仍触发（event.result=None）
    /// 条件：第 1 轮 result 缺失（done=false），第 2 轮 result=""（done=true 终态不触发）
    /// 断言：on_poll 触发 1 次（第 1 轮），event.result=None
    #[tokio::test(start_paused = true)]
    async fn poll_on_poll_invokes_when_result_empty_or_missing() {
        use std::sync::{Arc, Mutex};

        use crate::{PollCallback, PollEvent};

        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        // 第 1 轮：result 缺失
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "long_task_poll": { "done": false, "polling_interval_ms": 1 }
            })))
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // 第 2 轮：result=""，done=true 终态不触发
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "",
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let hits: Arc<Mutex<Vec<Option<serde_json::Value>>>> = Arc::new(Mutex::new(Vec::new()));
        let hits_cb = hits.clone();
        let cb: PollCallback =
            Arc::new(move |ev: &PollEvent<'_>| hits_cb.lock().unwrap().push(ev.result.cloned()));

        let headers = empty_headers();
        let mut ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        ctx.options.on_poll = Some(cb);
        let _ = poll_long_task(&ctx, "task_tick_missing").await.unwrap();

        let got = hits.lock().unwrap().clone();
        assert_eq!(got.len(), 1, "on_poll 在 result 缺失轮也应触发心跳");
        assert!(got[0].is_none(), "result 缺失时 event.result 应为 None");
    }

    /// P1：[poll_long_task] on_poll 在 result="null"（字面 JSON null）时也触发，event.result=Some(Value::Null)
    /// 条件：第 1 轮 result="null"（done=false），第 2 轮 done=true
    /// 断言：on_poll 调用 1 次，event.result.unwrap().is_null()
    #[tokio::test(start_paused = true)]
    async fn poll_on_poll_invokes_when_result_is_json_null_literal() {
        use std::sync::{Arc, Mutex};

        use crate::{PollCallback, PollEvent};

        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "null",
                "long_task_poll": { "done": false, "polling_interval_ms": 1 }
            })))
            .up_to_n_times(1)
            .mount(&server)
            .await;

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let hits: Arc<Mutex<Vec<Option<serde_json::Value>>>> = Arc::new(Mutex::new(Vec::new()));
        let hits_cb = hits.clone();
        let cb: PollCallback =
            Arc::new(move |ev: &PollEvent<'_>| hits_cb.lock().unwrap().push(ev.result.cloned()));

        let headers = empty_headers();
        let mut ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        ctx.options.on_poll = Some(cb);
        let _ = poll_long_task(&ctx, "task_tick_null").await.unwrap();

        let got = hits.lock().unwrap().clone();
        assert_eq!(got.len(), 1);
        let v = got[0]
            .as_ref()
            .expect("event.result should be Some(Value::Null)");
        assert!(v.is_null(), "result=\"null\" 应解析为 Value::Null：{v:?}");
    }

    /// P0：[poll_long_task] `done=true` 首轮即完成时 on_poll 不触发（终态不回调）
    /// 条件：首轮即返回 done=true 且 result 非空
    /// 断言：on_poll 0 次；终态 result 由返回值承载
    #[tokio::test(start_paused = true)]
    async fn poll_on_poll_does_not_invoke_on_done_round() {
        use std::sync::{Arc, Mutex};

        use crate::{PollCallback, PollEvent};

        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{\"final\":true}",
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let hits: Arc<Mutex<u32>> = Arc::new(Mutex::new(0));
        let hits_cb = hits.clone();
        let cb: PollCallback = Arc::new(move |_ev: &PollEvent<'_>| *hits_cb.lock().unwrap() += 1);

        let headers = empty_headers();
        let mut ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        ctx.options.on_poll = Some(cb);
        let data = poll_long_task(&ctx, "task_tick_done_only").await.unwrap();

        assert_eq!(*hits.lock().unwrap(), 0, "done=true 终态不应触发 on_poll");
        assert_eq!(data.result.as_deref(), Some("{\"final\":true}"));
    }

    /// P1：[poll_long_task] 未注册 on_poll 时行为不受影响
    /// 条件：on_poll=None，正常轮询至 done
    /// 断言：正常返回，无 panic
    #[tokio::test(start_paused = true)]
    async fn poll_without_on_poll_works_as_before() {
        let server = MockServer::start().await;
        let transport = build_http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": "{\"ok\":true}",
                "long_task_poll": { "done": true }
            })))
            .expect(1)
            .mount(&server)
            .await;

        let headers = empty_headers();
        let ctx = ctx_for(transport.http_client(), headers, &transport.base_url);
        // ctx.on_poll 默认 None
        let data = poll_long_task(&ctx, "task_no_tick_cb").await.unwrap();
        assert_eq!(data.result.as_deref(), Some("{\"ok\":true}"));
    }
}
