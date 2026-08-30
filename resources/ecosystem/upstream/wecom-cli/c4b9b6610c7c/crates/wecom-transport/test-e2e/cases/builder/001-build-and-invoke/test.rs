#[tokio::test]
async fn http_builder_e2e() {
    use wiremock::matchers::header;

    let server = MockServer::start().await;
    let transport = Transport::from(HttpTransportBackend::default())
        .with_header("x-custom", "custom-val")
        .expect("valid header");

    Mock::given(method("POST"))
        .and(path("/cgi-bin/test"))
        .and(header("x-custom", "custom-val"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_api_response(&json!({"ok": true}))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let payload = json!({});
    let result = transport
        .invoke(ep(&server.uri(), "/cgi-bin/test"), payload)
        .await
        .unwrap()
        .into_result()
        .unwrap();

    assert_json_eq!(result, json!({"ok": true}));
}
