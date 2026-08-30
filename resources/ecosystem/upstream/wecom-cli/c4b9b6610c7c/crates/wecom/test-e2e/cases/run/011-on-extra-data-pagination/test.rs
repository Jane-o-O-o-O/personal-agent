#[tokio::test]
async fn run() {
    use indexmap::IndexMap;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // Page 1: has_more=true，带 extra page: "1"。
    // 先 mount，相同默认 priority(5) 时插入顺序优先；
    // up_to_n_times(1) 匹配一次后自动跳过。
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"departments\":[{\"id\":\"1\"}],\"has_more\":true,\"next_cursor\":\"c2\"}",
            "error": null,
            "page": "1",
        })))
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    // Page 2: has_more=false（末页），带 extra page: "2"。
    // 第一页 mock 已消耗，第二页请求命中此 mock。
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"departments\":[{\"id\":\"2\"}],\"has_more\":false}",
            "error": null,
            "page": "2",
        })))
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    // 捕获每页的 extra 数据
    let captured: Arc<Mutex<Vec<IndexMap<String, serde_json::Value>>>> =
        Arc::new(Mutex::new(Vec::new()));
    let captured_cb = captured.clone();

    let result = client
        .run(hr_dept_list_argv(&[
            "--page-count",
            "2",
            "--page-delay",
            "1",
        ]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .on_extra_data(move |data| {
            captured_cb.lock().unwrap().push(data.clone());
        })
        .await;
    assert_cli_ok(&result, &buf, "on-extra-data pagination");

    // 断言分页输出了 2 行 NDJSON
    let output = buf.contents();
    let lines: Vec<&str> = output.trim().lines().collect();
    assert_eq!(lines.len(), 2, "expected 2 NDJSON lines, got: {output}");
    for line in &lines {
        let _: Value = serde_json::from_str(line).unwrap();
    }

    // 断言 on_extra_data 每页各触发一次且数据正确
    let captured = captured.lock().unwrap();
    assert_eq!(
        captured.len(),
        2,
        "on_extra_data should fire once per page, got: {captured:?}"
    );
    assert_eq!(
        captured[0].get("page"),
        Some(&json!("1")),
        "page 1 extra should contain page: 1"
    );
    assert_eq!(
        captured[1].get("page"),
        Some(&json!("2")),
        "page 2 extra should contain page: 2"
    );
}
