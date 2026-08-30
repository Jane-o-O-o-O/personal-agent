#[tokio::test]
async fn run() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // Method call 返回标准响应，无额外字段。
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"status\": \"ok\"}",
            "error": null,
        })))
        .expect(1)
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    // 计数器：记录 on_extra_data 触发次数
    let call_count: Arc<Mutex<u32>> = Arc::new(Mutex::new(0));
    let call_count_cb = call_count.clone();

    let result = client
        .run(hr_dept_list_argv(&[]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .on_extra_data(move |_data| {
            *call_count_cb.lock().unwrap() += 1;
        })
        .await;
    assert_cli_ok(&result, &buf, "on-extra-data empty extra");

    // 断言 CLI 输出正确
    let v = assert_stdout_json(&buf);
    assert_eq!(v["status"], "ok");

    // 断言 on_extra_data 未被触发（extra 为空）
    assert_eq!(
        *call_count.lock().unwrap(),
        0,
        "on_extra_data should NOT fire when extra is empty"
    );
}
