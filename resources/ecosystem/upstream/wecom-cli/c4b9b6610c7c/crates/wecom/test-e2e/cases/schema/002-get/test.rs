#[tokio::test]
async fn run() {
    use wiremock::matchers::{body_json, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;

    // service_with_options 先拉取 catalog 以解析 alias
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_body()))
        .expect(1)
        .mount(&server)
        .await;

    // Service detail mock for schema get
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({"service": "hr"})))
        .respond_with(ResponseTemplate::new(200).set_body_json(hr_service_body(&server.uri())))
        .expect(1)
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(vec![
            "wecom".into(),
            "schema".into(),
            "get".into(),
            "hr.department.list".into(),
        ])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "schema get");

    let v = assert_stdout_json(&buf);
    let method_str = v["method"].as_str().unwrap();
    assert!(
        method_str.contains("department.list"),
        "method should contain 'department.list', got: {method_str}"
    );
    assert!(v["request"].is_object());
    assert!(v["response"].is_object());
}
