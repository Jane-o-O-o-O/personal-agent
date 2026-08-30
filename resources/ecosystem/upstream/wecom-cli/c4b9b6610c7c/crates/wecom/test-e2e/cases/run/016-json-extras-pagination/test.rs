#[tokio::test]
async fn run() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // Page 1: has_more=true
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"departments\":[{\"id\":\"1\"}],\"has_more\":true,\"next_cursor\":\"c2\"}",
            "error": null,
        })))
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    // Page 2: has_more=false (last page)
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"departments\":[{\"id\":\"2\"}],\"has_more\":false}",
            "error": null,
        })))
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    // page_count=2 is passed via --json, should be extracted by apply_extras
    let result = client
        .run(hr_dept_list_argv(&["--json", r#"{"page_count": 2}"#]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "json-extras pagination");

    // Assert 2 NDJSON lines (one per page)
    let output = buf.contents();
    let lines: Vec<&str> = output.trim().lines().collect();
    assert_eq!(lines.len(), 2, "expected 2 NDJSON lines, got: {output}");
    for line in &lines {
        let _: Value = serde_json::from_str(line).unwrap();
    }
}
