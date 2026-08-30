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

    // Page 2: has_more=true
    Mock::given(method("POST"))
        .and(path("/department/list"))
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

    // Page 3: has_more=false (last page)
    Mock::given(method("POST"))
        .and(path("/department/list"))
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

    // 无 --output 时纯 JSON 分页不产生任何文件（--output-dir 只管辖下载产物的
    // 语义锁定）：快照默认落盘目录（未配置 default_output_dir 时为进程 cwd）的
    // 文件名集合，运行后必须不变。
    #[allow(clippy::disallowed_methods)] // e2e 断言层直探文件系统
    let before: std::collections::BTreeSet<_> = std::fs::read_dir(client.cwd())
        .unwrap()
        .map(|e| e.unwrap().file_name())
        .collect();

    let result = client
        .run(hr_dept_list_argv(&[
            "--page-count",
            "3",
            "--page-delay",
            "1", // 1ms for fast tests
        ]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "page-all");

    // stdout should have 3 lines of NDJSON
    let output = buf.contents();
    let lines: Vec<&str> = output.trim().lines().collect();
    assert_eq!(lines.len(), 3, "expected 3 NDJSON lines, got: {output}");

    // Each line is valid JSON
    for line in &lines {
        let _: Value = serde_json::from_str(line).unwrap();
    }

    // 分页纯走 stdout，默认落盘目录不产生任何文件
    #[allow(clippy::disallowed_methods)] // e2e 断言层直探文件系统
    {
        let after: std::collections::BTreeSet<_> = std::fs::read_dir(client.cwd())
            .unwrap()
            .map(|e| e.unwrap().file_name())
            .collect();
        assert_eq!(
            before, after,
            "paged JSON without --output must not create any file"
        );
    }
}
