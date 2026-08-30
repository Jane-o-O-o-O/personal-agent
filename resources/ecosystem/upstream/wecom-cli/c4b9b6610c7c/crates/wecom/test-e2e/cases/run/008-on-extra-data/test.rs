#[tokio::test]
async fn run() {
    use indexmap::IndexMap;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // Method call 返回正常 result + 额外字段 custom_extra。
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"status\": \"ok\"}",
            "error": null,
            "custom_extra": "hello",
        })))
        .expect(1)
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    // 通过 on_extra_data 回调捕获服务端额外数据
    let captured: Arc<Mutex<Vec<IndexMap<String, serde_json::Value>>>> =
        Arc::new(Mutex::new(Vec::new()));
    let captured_cb = captured.clone();

    let result = client
        .run(hr_dept_list_argv(&[]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .on_extra_data(move |data| {
            captured_cb.lock().unwrap().push(data.clone());
        })
        .await;
    assert_cli_ok(&result, &buf, "on-extra-data single page");

    // 断言 CLI 输出正确
    let v = assert_stdout_json(&buf);
    assert_eq!(v["status"], "ok");

    // 断言 on_extra_data 回调正确触发并收到正确数据
    let captured = captured.lock().unwrap();
    assert_eq!(captured.len(), 1, "on_extra_data should fire exactly once");
    assert_eq!(
        captured[0].get("custom_extra"),
        Some(&json!("hello")),
        "extra data should contain custom_extra: \"hello\""
    );
}
