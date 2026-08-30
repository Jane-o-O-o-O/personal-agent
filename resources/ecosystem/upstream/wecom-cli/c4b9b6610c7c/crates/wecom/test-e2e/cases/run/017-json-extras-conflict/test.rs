#[tokio::test]
async fn run() {
    use wiremock::matchers::{body_string_contains, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // Page 1: has_more=true. Verify the unextracted page_count reaches the backend.
    // The raw body is {"payload":"{\"id\":\"root\",\"page_count\":3}"}, where the
    // inner JSON string is escaped. The literal substring "page_count" survives
    // JSON escaping and appears in the raw wire bytes.
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .and(body_string_contains("page_count"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"departments\":[{\"id\":\"1\"}],\"has_more\":true,\"next_cursor\":\"c2\"}",
            "error": null,
        })))
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    // Page 2: has_more=false (last page). No body matcher needed — the first mock
    // is already exhausted after matching once, and this catch-all handles page 2.
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

    // CLI --page-count 2 wins over --json page_count=3,
    // but page_count=3 stays in the request payload sent to the backend.
    let result = client
        .run(hr_dept_list_argv(&[
            "--json",
            r#"{"page_count": 3}"#,
            "--page-count",
            "2",
        ]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(
        &result,
        &buf,
        "json-extras conflict: CLI wins, backend receives page_count=3",
    );

    // Assert 2 NDJSON lines (CLI --page-count 2 takes priority, not JSON 3)
    let output = buf.contents();
    let lines: Vec<&str> = output.trim().lines().collect();
    assert_eq!(
        lines.len(),
        2,
        "expected 2 NDJSON lines (CLI --page-count 2 wins over JSON page_count=3), got: {output}"
    );
    for line in &lines {
        let _: Value = serde_json::from_str(line).unwrap();
    }
}
