#[tokio::test]
async fn run() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // Page 1: has_more=true
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "departments": [{"id": "1"}],
                "has_more": true,
                "next_cursor": "cursor_1"
            }))),
        )
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    // Page 2: has_more=false (last page, server has no more data)
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "departments": [{"id": "2"}],
                "has_more": false
            }))),
        )
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    // Request 5 pages, but server only has 2
    let result = client
        .run(hr_dept_list_argv(&[
            "--page-count",
            "5",
            "--page-delay",
            "1",
        ]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "page-count-exceeds");

    // stdout should have only 2 lines (early termination)
    let output = buf.contents();
    let lines: Vec<&str> = output.trim().lines().collect();
    assert_eq!(lines.len(), 2, "expected 2 NDJSON lines, got: {output}");

    for line in &lines {
        let _: Value = serde_json::from_str(line).unwrap();
    }
}
