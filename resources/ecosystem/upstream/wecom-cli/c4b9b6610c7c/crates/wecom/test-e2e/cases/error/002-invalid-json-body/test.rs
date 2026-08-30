#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;

    // Return invalid JSON for catalog discovery
    wiremock::Mock::given(wiremock::matchers::method("POST"))
        .and(wiremock::matchers::path("/service/discovery"))
        .and(wiremock::matchers::body_json(serde_json::json!({})))
        .respond_with(
            wiremock::ResponseTemplate::new(200).set_body_string("not valid json at all {{{"),
        )
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let argv: Vec<String> = vec!["wecom", "schema", "list"]
        .into_iter()
        .map(String::from)
        .collect();

    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert!(result.is_err(), "expected error for invalid JSON body");
}
