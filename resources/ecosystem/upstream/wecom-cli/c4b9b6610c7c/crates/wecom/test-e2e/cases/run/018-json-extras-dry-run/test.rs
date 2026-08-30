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

    // dry_run=true is passed via --json, extracted by apply_extras
    let result = client
        .run(hr_dept_list_argv(&["--json", r#"{"dry_run": true}"#]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "dry-run via --json extras");

    let output = buf.contents();
    assert!(
        output.contains("=== Dry Run ==="),
        "dry-run output should contain '=== Dry Run ===', got: {output}"
    );
}
