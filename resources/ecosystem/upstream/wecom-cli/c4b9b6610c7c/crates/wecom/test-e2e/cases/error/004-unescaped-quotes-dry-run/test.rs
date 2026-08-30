#[tokio::test]
async fn run() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // This mock should never be hit in dry-run mode
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{}",
            "error": null,
        })))
        .expect(0)
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    // Unescaped ASCII quotes inside the `id` string value must be repaired
    // (strategy: unescaped_quotes) before the payload is previewed.
    let argv: Vec<String> = vec![
        "wecom",
        "hr",
        "department",
        "list",
        "--dry-run",
        "--json",
        r#"{"id":"跟进"25年12月后上线"的"系统单量进度""}"#,
    ]
    .into_iter()
    .map(String::from)
    .collect();

    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(
        &result,
        &buf,
        "dry-run with unescaped quotes in --json body",
    );

    let output = buf.contents();
    assert!(
        output.contains("=== Dry Run ==="),
        "dry-run output should contain '=== Dry Run ===', got: {output}"
    );
    assert!(
        output.contains(r#"跟进\"25年12月后上线\"的\"系统单量进度\""#),
        "dry-run payload should keep the repaired quotes escaped, got: {output}"
    );
}
