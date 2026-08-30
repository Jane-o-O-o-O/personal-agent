#[tokio::test]
async fn builder_headers_sent_to_server() {
    let server = MockServer::start().await;
    let transport = Transport::from(HttpTransportBackend::default())
        .with_header("x-base-auth", "base-token-123")
        .expect("valid header");

    Mock::given(method("POST"))
        .and(path("/cgi-bin/test"))
        .and(wiremock::matchers::header("x-base-auth", "base-token-123"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!({"ok": true}))),
        )
        .expect(1)
        .mount(&server)
        .await;
    let result = transport
        .invoke(ep(&server.uri(), "/cgi-bin/test"), json!({}))
        .await
        .unwrap()
        .into_result()
        .unwrap();

    assert_json_eq!(result, json!({"ok": true}));
}

#[tokio::test]
async fn builder_and_headers_both_sent() {
    let server = MockServer::start().await;
    let transport = Transport::from(HttpTransportBackend::default())
        .with_header("x-base", "base-val")
        .expect("valid header");

    Mock::given(method("POST"))
        .and(path("/cgi-bin/test"))
        .and(wiremock::matchers::header("x-base", "base-val"))
        .and(wiremock::matchers::header("x-extra", "extra-val"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!({"merged": true}))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let mut extra = reqwest::header::HeaderMap::new();
    extra.insert(
        reqwest::header::HeaderName::from_static("x-extra"),
        reqwest::header::HeaderValue::from_static("extra-val"),
    );
    let result = transport
        .invoke(ep(&server.uri(), "/cgi-bin/test"), json!({}))
        .headers(&extra)
        .await
        .unwrap()
        .into_result()
        .unwrap();

    assert_json_eq!(result, json!({"merged": true}));
}

#[tokio::test]
async fn headers_override_builder_headers() {
    let server = MockServer::start().await;
    let transport = Transport::from(HttpTransportBackend::default())
        .with_header("x-auth", "old-token")
        .expect("valid header");

    Mock::given(method("POST"))
        .and(path("/cgi-bin/test"))
        .and(wiremock::matchers::header("x-auth", "new-token"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(http_api_response(&json!({"overridden": true}))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let mut extra = reqwest::header::HeaderMap::new();
    extra.insert(
        reqwest::header::HeaderName::from_static("x-auth"),
        reqwest::header::HeaderValue::from_static("new-token"),
    );
    let result = transport
        .invoke(ep(&server.uri(), "/cgi-bin/test"), json!({}))
        .headers(&extra)
        .await
        .unwrap()
        .into_result()
        .unwrap();

    assert_json_eq!(result, json!({"overridden": true}));
}

#[tokio::test]
async fn chained_header_calls_all_sent() {
    let server = MockServer::start().await;
    let transport = Transport::from(HttpTransportBackend::default());

    Mock::given(method("POST"))
        .and(path("/cgi-bin/test"))
        .and(wiremock::matchers::header("x-a", "1"))
        .and(wiremock::matchers::header("x-b", "2"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!({"chained": true}))),
        )
        .expect(1)
        .mount(&server)
        .await;
    let result = transport
        .invoke(ep(&server.uri(), "/cgi-bin/test"), json!({}))
        .header("x-a", "1")
        .header("x-b", "2")
        .await
        .unwrap()
        .into_result()
        .unwrap();

    assert_json_eq!(result, json!({"chained": true}));
}
