// 本组 E2E 用例基于 [`HttpTransportBackend::post`] —— 协议无关的原始 HTTP 通道。
//
// 在新架构里：
// - [`HttpTransportBackend::post`]：纯 HTTP 透传，不做 ApiResponse 解析、long_task 轮询、
//   error.code 校验，body 始终是 [`HttpResponse`]（含 status / headers / byte stream）。
// - [`HttpTransportBackend::invoke`]：协议层封装，按 Content-Type 区分 JSON / 二进制：
//     - JSON 路径 → 抽 `result` 字段、触发 long_task 轮询、检查 error.code，
//       返回 [`TransportResponse::Json`]
//     - 非 JSON 路径 → 透传 [`TransportResponse::Binary`]
//
// 本组用例对比同一 mock body 下两个入口的行为差异，覆盖：
// - request 拿到的是未经协议解析的"原始信封"
// - request 不会触发 long_task 轮询
// - request 不会把业务 error.code 转成 Error::Api
// - request 仍会传播 HTTP 非 2xx 错误（status 由 HttpResponse 暴露）
// - request 即使 body 不是 JSON 也成功（不解析），只在调用 `.json::<T>()` 时失败
// - request 处理二进制响应（is_json()==false → bytes_stream）

#[tokio::test]
async fn request_returns_unparsed_envelope() {
    let server = MockServer::start().await;
    let http_transport = HttpTransportBackend::default();

    let body = json!({
        "result": "{\"status\":\"ok\"}",
        "taskid": "TASK_RAW_001",
        "long_task_poll": { "done": false, "polling_interval_ms": 1 },
        "extra": 42,
    });

    Mock::given(method("POST"))
        .and(path("/cgi-bin/raw"))
        .respond_with(ResponseTemplate::new(200).set_body_json(body.clone()))
        .expect(1)
        .mount(&server)
        .await;

    let response = http_transport
        .post(ep(&server.uri(), "/cgi-bin/raw"), json!({}))
        .await
        .expect("request should succeed");

    assert!(response.is_json());
    let value: Value = response.json().await.expect("should deserialize as JSON");
    assert_json_eq!(value, body);
}

#[tokio::test]
async fn invoke_extracts_result_request_returns_envelope() {
    let server = MockServer::start().await;
    let http_transport = HttpTransportBackend::default();

    let business = json!({"users": [{"id": 1, "name": "Alice"}]});
    let envelope = http_api_response(&business);

    Mock::given(method("POST"))
        .and(path("/cgi-bin/invoke"))
        .respond_with(ResponseTemplate::new(200).set_body_json(envelope.clone()))
        .expect(1)
        .mount(&server)
        .await;

    Mock::given(method("POST"))
        .and(path("/cgi-bin/raw"))
        .respond_with(ResponseTemplate::new(200).set_body_json(envelope.clone()))
        .expect(1)
        .mount(&server)
        .await;

    // invoke 路径：协议层抽出 result 字段
    let invoke_resp = http_transport
        .invoke(ep(&server.uri(), "/cgi-bin/invoke"), json!({}))
        .await
        .expect("invoke should succeed");
    match invoke_resp {
        TransportResponse::Json(output) => assert_json_eq!(output.result, business),
        TransportResponse::Binary(_) => panic!("Expected Json response from invoke"),
    }

    // request 路径：透传完整信封
    let raw_resp = http_transport
        .post(ep(&server.uri(), "/cgi-bin/raw"), json!({}))
        .await
        .expect("request should succeed");
    let raw_value: Value = raw_resp.json().await.unwrap();
    assert_json_eq!(raw_value, envelope);
}

#[tokio::test]
async fn request_skips_long_task_polling() {
    let server = MockServer::start().await;
    let http_transport = HttpTransportBackend::default();

    Mock::given(method("POST"))
        .and(path("/cgi-bin/raw-task"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(http_long_task_initial_response("TASK_RAW_002", 1)),
        )
        .expect(1)
        .mount(&server)
        .await;

    let resp = http_transport
        .post(ep(&server.uri(), "/cgi-bin/raw-task"), json!({}))
        .await
        .expect("request should not poll long task");
    assert!(resp.is_json());
}

#[tokio::test]
async fn request_does_not_convert_business_error_to_api_error() {
    let server = MockServer::start().await;
    let http_transport = HttpTransportBackend::default();

    let envelope = http_api_error_response(40001, "invalid credential");

    Mock::given(method("POST"))
        .and(path("/cgi-bin/raw-biz-err"))
        .respond_with(ResponseTemplate::new(200).set_body_json(envelope.clone()))
        .expect(1)
        .mount(&server)
        .await;

    let resp = http_transport
        .post(ep(&server.uri(), "/cgi-bin/raw-biz-err"), json!({}))
        .await
        .expect("request should not surface error.code as Error::Api");

    let value: Value = resp.json().await.unwrap();
    assert_json_eq!(value, envelope);
}

#[tokio::test]
async fn request_propagates_http_errors() {
    let server = MockServer::start().await;
    let http_transport = HttpTransportBackend::default();

    Mock::given(method("POST"))
        .and(path("/cgi-bin/raw-500"))
        .respond_with(ResponseTemplate::new(500))
        .expect(1)
        .mount(&server)
        .await;

    let err = http_transport
        .post(ep(&server.uri(), "/cgi-bin/raw-500"), json!({}))
        .await
        .unwrap_err();

    match &err {
        Error::Http { status, .. } => assert_eq!(*status, 500),
        other => panic!("Expected Error::Http, got: {other:?}"),
    }
}

#[tokio::test]
async fn request_invalid_json_only_fails_on_json_call() {
    let server = MockServer::start().await;
    let http_transport = HttpTransportBackend::default();

    Mock::given(method("POST"))
        .and(path("/cgi-bin/raw-bad"))
        .respond_with(ResponseTemplate::new(200).set_body_raw("not json", "application/json"))
        .expect(1)
        .mount(&server)
        .await;

    let resp = http_transport
        .post(ep(&server.uri(), "/cgi-bin/raw-bad"), json!({}))
        .await
        .expect("request should succeed even when body is not valid JSON");

    let err = resp.json::<Value>().await.unwrap_err();
    assert!(matches!(err, Error::Parse { .. }));
}

#[tokio::test]
async fn request_handles_binary_response() {
    let server = MockServer::start().await;
    let http_transport = HttpTransportBackend::default();

    let bin = vec![0x89u8, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]; // PNG magic
    Mock::given(method("POST"))
        .and(path("/cgi-bin/raw-bin"))
        .respond_with(
            ResponseTemplate::new(200)
                .append_header("Content-Type", "image/png")
                .set_body_bytes(bin.clone()),
        )
        .expect(1)
        .mount(&server)
        .await;

    let resp = http_transport
        .post(ep(&server.uri(), "/cgi-bin/raw-bin"), json!({}))
        .await
        .expect("request should succeed for binary path");

    assert!(!resp.is_json());

    use futures_util::StreamExt;
    let mut stream = resp.bytes_stream();
    let mut bytes = Vec::new();
    while let Some(chunk) = stream.next().await {
        bytes.extend_from_slice(&chunk.unwrap());
    }
    assert_eq!(bytes, bin);
}
