use std::sync::{Arc, Mutex};

use tracing_subscriber::prelude::*;
use wecom_transport::telemetry::{CaptureSpanId, HttpRequestRecord};

/// Collect spans into a Vec through on_request
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
async fn http_single_scope_captures_fields() {
    let subscriber =
        tracing_subscriber::Registry::default().with(wecom_transport::telemetry::TraceLayer);
    let _guard = tracing::subscriber::set_default(subscriber);

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/capture-test"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                {"ok": true}
            ))),
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
            ep(&server.uri(), "/cgi-bin/capture-test"),
            json!({"test": "capture"}),
        )
        .await
        .unwrap();

    drop(_enter);

    let snaps = std::mem::take(&mut *snaps_arc.lock().unwrap());
    assert_eq!(snaps.len(), 1);

    let snap = &snaps[0];
    assert!(snap.span_id.as_u64() > 0, "span_id should be non-zero");
    assert_eq!(snap.backend, "reqwest");
    assert!(snap.endpoint.contains("/cgi-bin/capture-test"));
    assert_eq!(snap.res_status, 200);
    assert!(snap.res_body_len > 0);
    assert!(snap.duration_total_ms >= snap.duration_headers_ms);
    assert!(snap.error.is_none());
}

#[tokio::test]
async fn on_request_fires_once_per_span() {
    let subscriber =
        tracing_subscriber::Registry::default().with(wecom_transport::telemetry::TraceLayer);
    let _guard = tracing::subscriber::set_default(subscriber);

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/once"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                {"ok": true}
            ))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let transport = Transport::from(HttpTransportBackend::default());

    warm_up_request_span(&server.uri()).await;
    let scope = wecom_transport::telemetry::CaptureScope::new();
    let count: Arc<Mutex<usize>> = Default::default();
    let c = count.clone();
    scope.on_request(move |_s: HttpRequestRecord| {
        *c.lock().unwrap() += 1;
    });
    let _enter = scope.span().enter();
    transport
        .invoke(ep(&server.uri(), "/cgi-bin/once"), json!({}))
        .await
        .unwrap();
    drop(_enter);

    assert_eq!(*count.lock().unwrap(), 1);
}

#[tokio::test]
async fn outside_scope_request_is_dropped() {
    let subscriber =
        tracing_subscriber::Registry::default().with(wecom_transport::telemetry::TraceLayer);
    let _guard = tracing::subscriber::set_default(subscriber);

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/outside-scope"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                {"ok": true}
            ))),
        )
        .expect(1)
        .mount(&server)
        .await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/inside-scope"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                {"ok": true}
            ))),
        )
        .expect(1)
        .mount(&server)
        .await;

    warm_up_request_span(&server.uri()).await;
    let scope = wecom_transport::telemetry::CaptureScope::new();
    let snaps_arc = collect_spans(&scope);
    let transport = Transport::from(HttpTransportBackend::default());

    // Outside scope
    transport
        .invoke(ep(&server.uri(), "/cgi-bin/outside-scope"), json!({}))
        .await
        .unwrap();

    // Inside scope
    let _enter = scope.span().enter();
    transport
        .invoke(ep(&server.uri(), "/cgi-bin/inside-scope"), json!({}))
        .await
        .unwrap();
    drop(_enter);

    let snaps = std::mem::take(&mut *snaps_arc.lock().unwrap());
    assert_eq!(snaps.len(), 1);
}

#[tokio::test]
async fn parallel_scopes_strict_isolation() {
    let subscriber =
        tracing_subscriber::Registry::default().with(wecom_transport::telemetry::TraceLayer);
    let _guard = tracing::subscriber::set_default(subscriber);

    let server = MockServer::start().await;
    for i in 0..4 {
        Mock::given(method("POST"))
            .and(path(format!("/cgi-bin/scope-{i}")))
            .respond_with(
                ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                    {"scope": i}
                ))),
            )
            .expect(1)
            .mount(&server)
            .await;
    }

    let base = server.uri();
    warm_up_request_span(&base).await;
    let mut handles = Vec::new();
    for i in 0..4 {
        let base = base.clone();
        let h = tokio::spawn(async move {
            let transport = Transport::from(HttpTransportBackend::default());
            let scope = wecom_transport::telemetry::CaptureScope::new();
            let snaps_arc = collect_spans(&scope);
            let _enter = scope.span().enter();
            transport
                .invoke(
                    ep(&base, &format!("/cgi-bin/scope-{i}")),
                    json!({"scope": i}),
                )
                .await
                .unwrap();
            drop(_enter);
            std::mem::take(&mut *snaps_arc.lock().unwrap())
        });
        handles.push(h);
    }

    for (i, h) in handles.into_iter().enumerate() {
        let snaps = h.await.unwrap();
        assert_eq!(snaps.len(), 1, "scope {i} expected 1 record");
        let eps: Vec<String> = snaps.iter().map(|s| s.endpoint.clone()).collect();
        assert!(
            eps.iter()
                .any(|e| e.contains(&format!("/cgi-bin/scope-{i}"))),
            "scope {i}: no endpoint matching /cgi-bin/scope-{i} in {eps:?}"
        );
    }
}

#[tokio::test]
async fn scope_without_layer_is_noop() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/no-layer"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                {"ok": true}
            ))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let transport = Transport::from(HttpTransportBackend::default());

    let scope = wecom_transport::telemetry::CaptureScope::new();
    let snaps_arc = collect_spans(&scope);
    let _enter = scope.span().enter();
    transport
        .invoke(ep(&server.uri(), "/cgi-bin/no-layer"), json!({}))
        .await
        .unwrap();
    drop(_enter);

    assert!(snaps_arc.lock().unwrap().is_empty());
}

#[tokio::test]
async fn attach_works_with_custom_span_name() {
    let subscriber =
        tracing_subscriber::Registry::default().with(wecom_transport::telemetry::TraceLayer);
    let _guard = tracing::subscriber::set_default(subscriber);

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/attach-test"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                {"ok": true}
            ))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let transport = Transport::from(HttpTransportBackend::default());

    warm_up_request_span(&server.uri()).await;
    // Use attach() with a custom span name — NOT "wecom_http_capture"
    let business_span = tracing::info_span!("chat_stream", model = "gpt-4");
    let scope = wecom_transport::telemetry::CaptureScope::attach(&business_span);
    let snaps_arc = collect_spans(&scope);

    // Enter the caller span for the HTTP request
    let _enter = business_span.enter();
    transport
        .invoke(
            ep(&server.uri(), "/cgi-bin/attach-test"),
            json!({"test": "attach"}),
        )
        .await
        .unwrap();
    drop(_enter);

    let snaps = std::mem::take(&mut *snaps_arc.lock().unwrap());
    assert_eq!(snaps.len(), 1);
    let snap = &snaps[0];
    assert_eq!(snap.backend, "reqwest");
    assert!(snap.endpoint.contains("/cgi-bin/attach-test"));
}

#[tokio::test]
async fn on_request_last_wins_e2e() {
    let subscriber =
        tracing_subscriber::Registry::default().with(wecom_transport::telemetry::TraceLayer);
    let _guard = tracing::subscriber::set_default(subscriber);

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/last-wins"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                {"ok": true}
            ))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let transport = Transport::from(HttpTransportBackend::default());

    let scope = wecom_transport::telemetry::CaptureScope::new();
    let first: Arc<Mutex<usize>> = Default::default();
    let second: Arc<Mutex<usize>> = Default::default();
    let f1 = first.clone();
    let s2 = second.clone();
    scope.on_request(move |_: HttpRequestRecord| {
        *f1.lock().unwrap() += 1;
    });
    scope.on_request(move |_: HttpRequestRecord| {
        *s2.lock().unwrap() += 1;
    });

    let _enter = scope.span().enter();
    transport
        .invoke(ep(&server.uri(), "/cgi-bin/last-wins"), json!({}))
        .await
        .unwrap();
    drop(_enter);

    assert_eq!(*first.lock().unwrap(), 0, "first callback should not fire");
    assert_eq!(*second.lock().unwrap(), 1, "second callback should fire");
}

#[tokio::test]
async fn on_request_span_id_is_valid() {
    let subscriber =
        tracing_subscriber::Registry::default().with(wecom_transport::telemetry::TraceLayer);
    let _guard = tracing::subscriber::set_default(subscriber);

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/span-id"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                {"ok": true}
            ))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let transport = Transport::from(HttpTransportBackend::default());

    warm_up_request_span(&server.uri()).await;
    let scope = wecom_transport::telemetry::CaptureScope::new();

    let span_ids: Arc<Mutex<Vec<CaptureSpanId>>> = Default::default();
    let si = span_ids.clone();

    scope.on_request(move |s: HttpRequestRecord| {
        si.lock().unwrap().push(s.span_id);
    });

    let _enter = scope.span().enter();
    transport
        .invoke(
            ep(&server.uri(), "/cgi-bin/span-id"),
            json!({"test": "span"}),
        )
        .await
        .unwrap();
    drop(_enter);

    let span_ids = span_ids.lock().unwrap();

    assert!(!span_ids.is_empty(), "on_request should have fired");
    assert!(span_ids[0].as_u64() > 0, "span_id should be non-zero");
}

#[tokio::test]
async fn on_request_not_called_when_unregistered() {
    let subscriber =
        tracing_subscriber::Registry::default().with(wecom_transport::telemetry::TraceLayer);
    let _guard = tracing::subscriber::set_default(subscriber);

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/no-callback"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                {"ok": true}
            ))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let transport = Transport::from(HttpTransportBackend::default());

    // Scope with NO on_request registered
    warm_up_request_span(&server.uri()).await;
    let scope = wecom_transport::telemetry::CaptureScope::new();
    let _enter = scope.span().enter();
    let result = transport
        .invoke(ep(&server.uri(), "/cgi-bin/no-callback"), json!({}))
        .await;
    drop(_enter);

    // Should not panic, should not crash
    assert!(result.is_ok());
}

#[tokio::test]
async fn scope_drop_without_callbacks_is_no_op() {
    let subscriber =
        tracing_subscriber::Registry::default().with(wecom_transport::telemetry::TraceLayer);
    let _guard = tracing::subscriber::set_default(subscriber);

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/cgi-bin/noop"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!(
                {"ok": true}
            ))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let transport = Transport::from(HttpTransportBackend::default());

    let scope = wecom_transport::telemetry::CaptureScope::new();
    // Register callbacks, then let scope drop without using them
    scope.on_request(|_s: HttpRequestRecord| {
        unreachable!("should not fire after scope is dropped");
    });
    // Drop scope before any request — should not panic
    drop(scope);

    // Make a request outside any scope — should not crash
    transport
        .invoke(ep(&server.uri(), "/cgi-bin/noop"), json!({}))
        .await
        .unwrap();
}
