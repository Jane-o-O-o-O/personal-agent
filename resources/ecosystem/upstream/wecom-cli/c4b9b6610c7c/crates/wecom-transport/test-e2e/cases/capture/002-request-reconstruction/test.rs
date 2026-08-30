use std::sync::{Arc, Mutex};

use tracing_subscriber::prelude::*;
use wecom_transport::telemetry::HttpRequestRecord;

/// Collect spans into a Vec through on_request.
fn collect_spans(
    scope: &wecom_transport::telemetry::CaptureScope,
) -> Arc<Mutex<Vec<HttpRequestRecord>>> {
    let collected: Arc<Mutex<Vec<HttpRequestRecord>>> = Default::default();
    let c = collected.clone();
    scope.on_request(move |s: HttpRequestRecord| {
        c.lock().unwrap().push(s);
    });
    collected
}

/// 热身：以当前 subscriber 注册生产 RequestSpan callsite 并重建 interest 缓存。
///
/// `RequestSpan` 是 crate 内部类型、e2e 不可见，故改为向 mock server 的未注册
/// 路径发一次请求（404 可忽略，span 在发送前已创建、mock 计数不受影响）。
/// 机理同为消除 callsite 惰性注册
/// 在并行测试间的 never 污染竞态。使用时机：CaptureScope 创建之前。
async fn warm_up_request_span(base: &str) {
    let _ = Transport::from(HttpTransportBackend::default())
        .invoke(ep(base, "/cgi-bin/callsite-warmup"), json!({}))
        .await;
    tracing::callsite::rebuild_interest_cache();
}

#[tokio::test]
async fn http_request_record_captures_headers_as_headermap() {
    let subscriber =
        tracing_subscriber::Registry::default().with(wecom_transport::telemetry::TraceLayer);
    let _guard = tracing::subscriber::set_default(subscriber);

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/header-test"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(http_api_response(&json!({"ok": true})))
                .insert_header("x-custom-res", "bar"),
        )
        .expect(1)
        .mount(&server)
        .await;

    let transport = Transport::from(HttpTransportBackend::default());

    warm_up_request_span(&server.uri()).await;
    let scope = wecom_transport::telemetry::CaptureScope::new();
    let snaps_arc = collect_spans(&scope);
    let _enter = scope.span().enter();

    transport
        .invoke(
            ep(&server.uri(), "/cgi-bin/header-test"),
            json!({"test": "headers"}),
        )
        .header("x-test-req", "hello")
        .await
        .unwrap();

    drop(_enter);

    let snaps = std::mem::take(&mut *snaps_arc.lock().unwrap());
    assert_eq!(snaps.len(), 1, "expected 1 captured span");

    let snap = &snaps[0];

    // ── Basic fields ──
    assert_eq!(snap.backend, "reqwest");
    assert!(snap.endpoint.contains("/cgi-bin/header-test"));
    assert_eq!(snap.res_status, 200);
    assert!(snap.error.is_none());

    // ── Request headers captured as HeaderMap ──
    let req_hdrs = snap
        .req_headers
        .as_ref()
        .expect("req_headers should be Some");
    let custom_req = req_hdrs
        .get("x-test-req")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    assert_eq!(
        custom_req, "hello",
        "req_headers should contain x-test-req: hello, got: {custom_req:?}"
    );

    // ── Response headers captured as HeaderMap ──
    let res_hdrs = snap
        .res_headers
        .as_ref()
        .expect("res_headers should be Some");
    // wiremock sets content-type: application/json via set_body_json
    let ct = res_hdrs
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    assert!(
        ct.contains("application/json"),
        "res_headers should contain content-type: application/json, got: {ct:?}"
    );
    // Custom response header inserted by mock
    let custom_res = res_hdrs
        .get("x-custom-res")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    assert_eq!(
        custom_res, "bar",
        "res_headers should contain x-custom-res: bar, got: {custom_res:?}"
    );
}
