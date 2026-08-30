use std::future::IntoFuture;

use indexmap::IndexMap;

use crate::http_client::HttpRequestPayload;
use crate::traits::TransportResponse;
use crate::{Endpoint, Error, RequestOptions, Result};

/// Event emitted after each polling round during long-task execution.
///
/// Fires for every poll round even when the server didn't include a `result`
/// (HTTP empty string), so it can serve as a heartbeat.
///
/// Fields:
/// - `taskid` — the long-task id assigned by the server.
/// - `result` — progress data for this round, already parsed as
///   `serde_json::Value`. `None` when absent.
/// - `extra` — side-channel fields the server attached in this poll round.
///   Empty map when no extra fields are present.
///
/// The final `done=true` round does NOT trigger this event — the terminal
/// data is returned via `.await`.
#[non_exhaustive]
#[derive(Debug)]
pub struct PollEvent<'a> {
    pub taskid: &'a str,
    pub result: Option<&'a serde_json::Value>,
    /// Extra side-channel fields for this poll round.
    /// Empty map when no extra fields are present.
    pub extra: &'a IndexMap<String, serde_json::Value>,
}

impl<'a> PollEvent<'a> {
    /// Construct a new `PollEvent`.
    pub fn new(
        taskid: &'a str,
        result: Option<&'a serde_json::Value>,
        extra: &'a IndexMap<String, serde_json::Value>,
    ) -> Self {
        Self {
            taskid,
            result,
            extra,
        }
    }
}

/// The complete JSON output of a transport call.
///
/// - `result` — the main business payload (same as the former
///   `serde_json::Value` return value).
/// - `extra`  — side-channel fields the server attached beside `result`
///   (opaque key-value bag; the transport layer does **not** interpret
///   or parse the values).
#[derive(Debug, Clone, serde::Serialize)]
pub struct ExecuteOutput {
    /// The main business result, parsed from the API `result` field.
    pub result: serde_json::Value,
    /// Extra side-channel fields, keyed by field name.
    /// Values are raw `Value` as they appear on the wire.
    pub extra: IndexMap<String, serde_json::Value>,
}

/// Callback type paired with [`PollEvent`].
///
/// Uses `Arc<dyn Fn(&PollEvent<'_>) + Send + Sync + 'static>` so callbacks
/// can be shared across `IntoFuture` boundaries.
pub type PollCallback = std::sync::Arc<dyn Fn(&PollEvent<'_>) + Send + Sync + 'static>;

// ── TransportRequest (builder + IntoFuture wrapper) ───────────

/// A transport request that bundles a transport backend reference with
/// request data, providing builder methods and `IntoFuture`.
///
/// This is the single request builder for all transport backends.
/// Created by [`Transport::invoke`](crate::Transport::invoke), or directly by
/// backend-specific `invoke()` methods.
pub struct TransportRequest<'a> {
    /// Transport backend to dispatch to.
    pub(crate) backend: &'a (dyn crate::traits::TransportBackend + 'static),
    /// Common request addressing.
    pub(crate) endpoint: std::borrow::Cow<'a, Endpoint>,
    /// Request payload — 统一工厂（延迟物化，发送链 build）。
    pub(crate) payload: HttpRequestPayload,
    /// ── Builder state (operated on by impl_request_builder!) ──
    pub(crate) header_error: Option<Error>,
    /// Request options.
    pub(crate) options: RequestOptions,
}

crate::impl_request_builder!(TransportRequest<'a>, +options);

impl<'a> std::fmt::Debug for TransportRequest<'a> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("TransportRequest")
            .field("endpoint", &self.endpoint)
            .field("options", &self.options)
            .finish_non_exhaustive()
    }
}

impl<'a> TransportRequest<'a> {
    /// Execute the transport-level request, returning the unified
    /// [`TransportResponse`].
    ///
    /// The caller decides how to handle [`TransportResponse::Json`] vs
    /// [`TransportResponse::Binary`].
    pub fn execute(
        self,
    ) -> impl std::future::Future<Output = Result<TransportResponse>> + Send + 'a {
        let Self {
            backend,
            endpoint,
            payload,
            header_error,
            options,
        } = self;
        async move {
            if let Some(e) = header_error {
                return Err(e);
            }
            backend.execute(endpoint, payload, options).await
        }
    }
}

impl<'a> IntoFuture for TransportRequest<'a> {
    type Output = Result<TransportResponse>;
    type IntoFuture =
        std::pin::Pin<Box<dyn std::future::Future<Output = Self::Output> + Send + 'a>>;

    fn into_future(self) -> Self::IntoFuture {
        Box::pin(async { self.execute().await })
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：invoke（Transport 级别请求 builder）
    //!
    //! ### 关键接口
    //! - [TransportRequest::headers] / [TransportRequest::header] — 操作共享 RequestOptions
    //! - [TransportRequest::timeout] — 操作共享 RequestOptions
    //! - [TransportRequest::on_poll] — 注册长任务"轮回调"（每轮都触发，可作心跳）
    //! - [TransportRequest] 实现 [IntoFuture] — 分发到具体 Transport 后端
    //! - [PollCallback] / [PollEvent] — `Arc<dyn Fn(&PollEvent) + Send + Sync + 'static>`
    //!
    //! ### 关键分支与异常路径
    //! - [IntoFuture] → 调用 `transport.execute(endpoint, payload, options)`（vtable dispatch），
    //!   由具体后端（HttpTransportBackend / 自定义）返回统一的 [TransportResponse]
    //! - 构造期不做语义校验：错误延迟到 `.await` 时由底层抛出
    //! - TransportRequest 直接持有 header_error / options，builder 方法由 impl_request_builder! 生成
    //! - on_poll 仅在长任务轮询时每轮触发（result 缺失也触发）；`done=true` 终态那一轮不触发
    //!
    //! ### 上下游交互
    //! - 上游：外部通过 Transport::invoke() 创建 TransportRequest
    //! - 下游：TransportRequest 在 execute 中构造内层 builder 并执行

    use assert_json_diff::assert_json_eq;
    use serde_json::json;
    use wiremock::matchers::{header, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    use super::*;
    use crate::Transport;
    use crate::http::{HttpEndpoint, HttpTransportBackend};

    /// 测试 helper：构造一个 HTTP `Endpoint`。
    fn ep(base: &str, path: &str) -> Endpoint {
        let http = HttpEndpoint::new(path).with_service(base);
        Endpoint::new().with(http)
    }

    fn http_transport(base_url: impl Into<String>) -> Transport {
        HttpTransportBackend::builder()
            .base_url(base_url)
            .build()
            .expect("infallible: no header set")
    }

    // ── headers / header / timeout (链式 builder, 同步路径) ──

    /// P0：[TransportRequest::headers] 多次链式调用不会 panic，可正常进入 .await 阶段
    /// 条件：连续调用 .headers(&m1).headers(&m2).header("x", "1")
    /// 断言：构造与链式调用本身不 panic（行为正确性由下方端到端用例覆盖）
    #[test]
    fn headers_chain_does_not_panic() {
        let transport = http_transport("http://localhost");
        let payload = json!({});
        let endpoint = ep("http://test", "/x");

        let mut m1 = reqwest::header::HeaderMap::new();
        m1.insert(
            reqwest::header::HeaderName::from_static("x-a"),
            reqwest::header::HeaderValue::from_static("a"),
        );
        let mut m2 = reqwest::header::HeaderMap::new();
        m2.insert(
            reqwest::header::HeaderName::from_static("x-b"),
            reqwest::header::HeaderValue::from_static("b"),
        );

        let _ = transport
            .invoke(&endpoint, &payload)
            .headers(&m1)
            .headers(&m2)
            .header("x-c", "c");
    }

    /// P0：[TransportRequest::timeout] 多次链式调用不会 panic
    /// 条件：连续调用 .timeout(5s).timeout(30s)
    /// 断言：构造与链式调用本身不 panic（覆盖语义由底层 HttpTransportBackend::execute 单测覆盖）
    #[test]
    fn timeout_chain_does_not_panic() {
        let transport = http_transport("http://localhost");
        let payload = json!({});
        let endpoint = ep("http://test", "/x");

        let _ = transport
            .invoke(&endpoint, &payload)
            .timeout(std::time::Duration::from_secs(5))
            .timeout(std::time::Duration::from_secs(30));
    }

    /// P1：[TransportRequest] timeout / headers / header 可任意顺序混合链式
    /// 条件：timeout → headers → header → timeout 混合调用
    /// 断言：构造不 panic
    #[test]
    fn mixed_chain_does_not_panic() {
        let transport = http_transport("http://localhost");
        let payload = json!({});
        let endpoint = ep("http://test", "/x");

        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-chain"),
            reqwest::header::HeaderValue::from_static("v"),
        );

        let _ = transport
            .invoke(&endpoint, &payload)
            .timeout(std::time::Duration::from_secs(10))
            .headers(&extra)
            .header("x-c", "c-val")
            .timeout(std::time::Duration::from_secs(30));
    }

    /// P1：[TransportRequest::header] 非法 header name 时错误延迟到 `.await`
    /// 条件：传入空字符串 "" 作为 header name，随后 .await
    /// 断言：构造期不 panic；.await 返回 Err（错误由底层 HttpTransportBackend::execute 抛出）
    #[tokio::test]
    async fn header_invalid_name_errors_on_await() {
        let server = MockServer::start().await;
        let transport = http_transport(server.uri());

        // mount 一个永远不会被命中的响应——非法 header 应在到达 mock 前就报错
        Mock::given(method("POST"))
            .and(path("/cgi-bin/x"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({"result": "{}"})))
            .expect(0)
            .mount(&server)
            .await;

        let payload = json!({});
        let endpoint = ep(&server.uri(), "/cgi-bin/x");
        let result = transport
            .invoke(&endpoint, &payload)
            .header("", "value")
            .await;
        assert!(result.is_err(), "expected Err for invalid header name");
    }

    /// P1：[TransportRequest::header] 非法 header value 时错误延迟到 `.await`
    /// 条件：传入含 null 字节的 value，随后 .await
    /// 断言：构造期不 panic；.await 返回 Err
    #[tokio::test]
    async fn header_invalid_value_errors_on_await() {
        let server = MockServer::start().await;
        let transport = http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/cgi-bin/x"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({"result": "{}"})))
            .expect(0)
            .mount(&server)
            .await;

        let payload = json!({});
        let endpoint = ep(&server.uri(), "/cgi-bin/x");
        let result = transport
            .invoke(&endpoint, &payload)
            .header("x-name", "\0\0\0invalid")
            .await;
        assert!(result.is_err(), "expected Err for invalid header value");
    }

    // ── IntoFuture: Http 分支 ──

    /// P0：[TransportRequest] Http 分支成功调用并返回 TransportResponse::Json
    /// 条件：构建 Http Transport，Mock 返回 JSON 响应
    /// 断言：.await 返回 TransportResponse::Json，result 内容正确
    #[tokio::test]
    async fn into_future_http_success() {
        let server = MockServer::start().await;
        let transport = http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/cgi-bin/test"))
            .respond_with(
                ResponseTemplate::new(200).set_body_json(json!({"result": "{\"data\":\"ok\"}"})),
            )
            .expect(1)
            .mount(&server)
            .await;

        let payload = json!({"key": "val"});
        let endpoint = ep(&server.uri(), "/cgi-bin/test");
        let result = transport
            .invoke(&endpoint, &payload)
            .await
            .unwrap()
            .into_result()
            .unwrap();
        assert_json_eq!(result, json!({"data": "ok"}));
    }

    /// P0：[TransportRequest::headers] Http 分支：headers() 透传到实际 HTTP 请求
    /// 条件：通过 .headers() 附加 x-custom-auth，mock 用 header() 匹配器校验
    /// 断言：仅当请求带 x-custom-auth: bearer-test 时 mock 才返回 200
    #[tokio::test]
    async fn http_headers_are_sent_on_wire() {
        let server = MockServer::start().await;
        let transport = http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/cgi-bin/test"))
            .and(header("x-custom-auth", "bearer-test"))
            .respond_with(
                ResponseTemplate::new(200).set_body_json(json!({"result": "{\"ok\":true}"})),
            )
            .expect(1)
            .mount(&server)
            .await;

        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-custom-auth"),
            reqwest::header::HeaderValue::from_static("bearer-test"),
        );

        let payload = json!({});
        let endpoint = ep(&server.uri(), "/cgi-bin/test");
        let result = transport
            .invoke(&endpoint, &payload)
            .headers(&extra)
            .await
            .unwrap()
            .into_result()
            .unwrap();
        assert_json_eq!(result, json!({"ok": true}));
    }

    /// P0：[TransportRequest::header] Http 分支：链式 .header() 透传到实际 HTTP 请求
    /// 条件：连续 .header("x-a","1").header("x-b","2")，mock 同时校验两个 header
    /// 断言：请求带 x-a:1 与 x-b:2 时 mock 返回 200
    #[tokio::test]
    async fn http_header_chain_sent_on_wire() {
        let server = MockServer::start().await;
        let transport = http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/cgi-bin/test"))
            .and(header("x-a", "1"))
            .and(header("x-b", "2"))
            .respond_with(
                ResponseTemplate::new(200).set_body_json(json!({"result": "{\"chain\":true}"})),
            )
            .expect(1)
            .mount(&server)
            .await;

        let payload = json!({});
        let endpoint = ep(&server.uri(), "/cgi-bin/test");
        let result = transport
            .invoke(&endpoint, &payload)
            .header("x-a", "1")
            .header("x-b", "2")
            .await
            .unwrap()
            .into_result()
            .unwrap();
        assert_json_eq!(result, json!({"chain": true}));
    }

    // ── on_poll（长任务"轮回调" / 心跳） ──

    /// P0：[TransportRequest::on_poll] HTTP 非轮询请求不触发 on_poll
    /// 条件：mock 首次返回完整 result（无 taskid），注册 on_poll
    /// 断言：请求成功；on_poll 零次调用
    #[tokio::test]
    async fn on_poll_http_non_polling_not_invoked() {
        use std::sync::{Arc, Mutex};

        let server = MockServer::start().await;
        let transport = http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/cgi-bin/test"))
            .respond_with(
                ResponseTemplate::new(200).set_body_json(json!({"result": "{\"ok\":true}"})),
            )
            .expect(1)
            .mount(&server)
            .await;

        let hits = Arc::new(Mutex::new(0u32));
        let hits_cb = hits.clone();

        let payload = json!({});
        let endpoint = ep(&server.uri(), "/cgi-bin/test");
        let result = transport
            .invoke(&endpoint, &payload)
            .on_poll(move |_ev| *hits_cb.lock().unwrap() += 1)
            .await
            .unwrap()
            .into_result()
            .unwrap();

        assert_json_eq!(result, json!({"ok": true}));
        assert_eq!(*hits.lock().unwrap(), 0, "非轮询请求不应触发 on_poll");
    }

    /// P0：[TransportRequest::on_poll] HTTP 长轮询：每轮（含 result 缺席轮）都触发心跳；
    /// 终态不触发；事件 result 字段是 parse 后的 `&Value`。
    /// 条件：首响应 taskid；轮询第 1 轮 result 缺失，第 2 轮 result="{\"progress\":50}"，第 3 轮 done=true
    /// 断言：on_poll 触发 2 次；第 1 次 event.result=None，第 2 次 event.result=Some(Value::Object{progress:50})；
    ///      终态不触发，最终结果由 .await 返回。
    #[tokio::test(start_paused = true)]
    async fn on_poll_http_emits_tick_each_round_including_missing_result() {
        use std::sync::{Arc, Mutex};

        let server = MockServer::start().await;
        let transport = http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/cgi-bin/long"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": null,
                "taskid": "T1",
                "long_task_poll": {"done": false, "task_timeout": 60, "polling_interval_ms": 1}
            })))
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // 第 1 轮：result 缺失（done=false） → on_poll 触发，event.result=None
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "long_task_poll": {"done": false, "polling_interval_ms": 1}
            })))
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // 第 2 轮：result 非空（done=false） → on_poll 触发，event.result 解析成 Value
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": "{\"progress\":50}",
                "long_task_poll": {"done": false, "polling_interval_ms": 1}
            })))
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // 第 3 轮：done=true，终态不触发 on_poll；终态由 .await 返回值承载
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": "{\"final\":true}",
                "long_task_poll": {"done": true}
            })))
            .expect(1)
            .mount(&server)
            .await;

        let events: Arc<Mutex<Vec<Option<serde_json::Value>>>> = Arc::new(Mutex::new(Vec::new()));
        let events_cb = events.clone();

        let payload = json!({});
        let endpoint = ep(&server.uri(), "/cgi-bin/long");
        let result = transport
            .invoke(&endpoint, &payload)
            .on_poll(move |ev: &PollEvent<'_>| {
                events_cb.lock().unwrap().push(ev.result.cloned());
            })
            .await
            .unwrap()
            .into_result()
            .unwrap();

        assert_json_eq!(result, json!({"final": true}));

        let got = events.lock().unwrap().clone();
        assert_eq!(got.len(), 2, "应仅在 2 个非终态轮触发，实际：{got:?}");
        assert!(
            got[0].is_none(),
            "第 1 轮 result 缺失，event.result 应为 None"
        );
        assert_eq!(
            got[1],
            Some(json!({"progress": 50})),
            "第 2 轮 event.result 应为已解析的 Value::Object"
        );
    }

    /// P1：[TransportRequest::on_poll] 多次链式调用，最后一次注册的回调生效（last-one-wins）
    /// 条件：连续 .on_poll(cb_a).on_poll(cb_b)，仅 cb_b 应被触发
    /// 断言：进度轮回调入参以 "B:" 前缀出现一次
    #[tokio::test(start_paused = true)]
    async fn on_poll_last_one_wins() {
        use std::sync::{Arc, Mutex};

        let server = MockServer::start().await;
        let transport = http_transport(server.uri());

        Mock::given(method("POST"))
            .and(path("/cgi-bin/long"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": null,
                "taskid": "T1",
                "long_task_poll": {"done": false, "task_timeout": 60, "polling_interval_ms": 1}
            })))
            .up_to_n_times(1)
            .mount(&server)
            .await;
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": "{\"progress\":1}",
                "long_task_poll": {"done": false, "polling_interval_ms": 1}
            })))
            .up_to_n_times(1)
            .mount(&server)
            .await;
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": "{\"done\":true}",
                "long_task_poll": {"done": true}
            })))
            .expect(1)
            .mount(&server)
            .await;

        let hits = Arc::new(Mutex::new(Vec::<String>::new()));
        let hits_a = hits.clone();
        let hits_b = hits.clone();

        let payload = json!({});
        let endpoint = ep(&server.uri(), "/cgi-bin/long");
        let _ = transport
            .invoke(&endpoint, &payload)
            .on_poll(move |ev: &PollEvent<'_>| {
                hits_a.lock().unwrap().push(format!("A:{:?}", ev.result))
            })
            .on_poll(move |ev: &PollEvent<'_>| {
                hits_b.lock().unwrap().push(format!("B:{:?}", ev.result))
            })
            .await
            .unwrap();

        let got = hits.lock().unwrap().clone();
        assert_eq!(got.len(), 1, "只有最后一个回调被触发一次，实际：{got:?}");
        assert!(got[0].starts_with("B:"), "应由 cb_b 处理，实际：{got:?}");
    }

    /// P0：[TransportRequest::on_poll] 轮询请求使用 backend.base_url，而非 endpoint 自身的 base_url。
    /// 条件：endpoint 指向 server_a，backend.base_url 指向 server_b；首请求命中 server_a，轮询命中 server_b，第 1 轮 done=false 触发 on_poll
    /// 断言：首请求 → server_a；轮询 → server_b；on_poll 触发 1 次
    #[tokio::test(start_paused = true)]
    async fn on_poll_uses_backend_base_url_not_endpoint_base_url() {
        use std::sync::{Arc, Mutex};

        let server_a = MockServer::start().await;
        let server_b = MockServer::start().await;

        // backend.base_url 指向 server_b（轮询应命中 server_b）
        let transport = http_transport(server_b.uri());

        // 首请求 → server_a 返回 taskid
        Mock::given(method("POST"))
            .and(path("/cgi-bin/export"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": null,
                "taskid": "T_DIFF",
                "long_task_poll": {"done": false, "task_timeout": 60, "polling_interval_ms": 1}
            })))
            .expect(1)
            .mount(&server_a)
            .await;

        // 轮询第 1 轮 → server_b 返回 done=false（触发 on_poll）
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": "{\"progress\":42}",
                "long_task_poll": {"done": false, "polling_interval_ms": 1}
            })))
            .up_to_n_times(1)
            .mount(&server_b)
            .await;

        // 轮询第 2 轮 → server_b 返回 done=true（终态）
        Mock::given(method("POST"))
            .and(path("/task/query"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "result": "{\"final\":true}",
                "long_task_poll": {"done": true}
            })))
            .expect(1)
            .mount(&server_b)
            .await;

        let events: Arc<Mutex<Vec<Option<serde_json::Value>>>> = Arc::new(Mutex::new(Vec::new()));
        let events_cb = events.clone();

        // endpoint.base_url 指向 server_a（首请求应命中 server_a）
        let endpoint = ep(&server_a.uri(), "/cgi-bin/export");
        let payload = json!({});
        let result = transport
            .invoke(&endpoint, &payload)
            .on_poll(move |ev: &PollEvent<'_>| {
                events_cb.lock().unwrap().push(ev.result.cloned());
            })
            .await
            .unwrap()
            .into_result()
            .unwrap();

        assert_json_eq!(result, json!({"final": true}));

        let got = events.lock().unwrap().clone();
        assert_eq!(got.len(), 1, "on_poll 应仅在进度轮触发一次，实际：{got:?}");
        assert_eq!(
            got[0],
            Some(json!({"progress": 42})),
            "进度数据应对应 server_b 第 1 轮回包"
        );
    }

    // ── header_sensitive ──

    /// P1：[TransportRequest::header_sensitive] Http 分支链式调用不 panic
    /// 条件：构造 http transport + endpoint，调用 header_sensitive("authorization", "Bearer secret", true)
    /// 断言：不 panic，返回请求对象可丢弃
    #[test]
    fn header_sensitive_http_does_not_panic() {
        let transport = http_transport("http://localhost");
        let endpoint = ep("http://test", "/x");
        let payload = json!({});
        let _ = transport.invoke(&endpoint, &payload).header_sensitive(
            "authorization",
            "Bearer secret",
            true,
        );
    }

    // ── with_options ──

    /// P1：[TransportRequest::with_options] Http 分支构造透传不 panic
    /// 条件：构造 http transport + endpoint，调用 with_options(RequestOptions::default())
    /// 断言：不 panic，返回请求对象可丢弃
    #[test]
    fn with_options_http_does_not_panic() {
        let transport = http_transport("http://localhost");
        let endpoint = ep("http://test", "/x");
        let _ = transport
            .invoke(&endpoint, json!({}))
            .with_options(crate::RequestOptions::default());
    }
}
