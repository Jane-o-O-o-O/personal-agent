#[tokio::test]
async fn run() {
    use wiremock::matchers::header;

    let server = MockServer::start().await;
    let transport = Transport::from(HttpTransportBackend::default());

    Mock::given(method("POST"))
        .and(path("/cgi-bin/auth"))
        .and(header("x-custom-auth", "bearer test-token"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(http_api_response(&json!({"authenticated": true}))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let mut extra = reqwest::header::HeaderMap::new();
    extra.insert(
        reqwest::header::HeaderName::from_static("x-custom-auth"),
        reqwest::header::HeaderValue::from_static("bearer test-token"),
    );

    let payload = json!({});
    let result = transport
        .invoke(ep(&server.uri(), "/cgi-bin/auth"), payload)
        .headers(&extra)
        .await
        .unwrap()
        .into_result()
        .unwrap();

    assert_json_eq!(result, json!({"authenticated": true}));
}
