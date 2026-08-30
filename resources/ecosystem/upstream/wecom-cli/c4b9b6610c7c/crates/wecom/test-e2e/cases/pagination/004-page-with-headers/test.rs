#[tokio::test]
async fn run() {
    use wiremock::matchers::{header, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;

    // Discovery mocks do NOT require header matchers — discovery calls
    // go through transport directly and do not carry CliRun-level headers.
    setup_discovery_mocks(&server).await;

    // Page 1: has_more=true, requires x-custom header
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .and(header("x-custom", "val1"))
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

    // Page 2: has_more=true, requires x-custom header
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .and(header("x-custom", "val1"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "departments": [{"id": "2"}],
                "has_more": true,
                "next_cursor": "cursor_2"
            }))),
        )
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    // Page 3: has_more=false (last page), requires x-custom header
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .and(header("x-custom", "val1"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "departments": [{"id": "3"}],
                "has_more": false
            }))),
        )
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(hr_dept_list_argv(&[
            "--page-count",
            "3",
            "--page-delay",
            "1", // 1ms for fast tests
        ]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .header("x-custom", "val1")
        .await;
    assert_cli_ok(&result, &buf, "page-with-headers");

    // stdout should have 3 lines of NDJSON
    let output = buf.contents();
    let lines: Vec<&str> = output.trim().lines().collect();
    assert_eq!(lines.len(), 3, "expected 3 NDJSON lines, got: {output}");

    // Each line is valid JSON
    for line in &lines {
        let _: Value = serde_json::from_str(line).unwrap();
    }
}
