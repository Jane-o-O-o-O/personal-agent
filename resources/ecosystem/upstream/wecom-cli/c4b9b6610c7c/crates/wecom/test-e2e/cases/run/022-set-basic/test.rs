#[tokio::test]
async fn run() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // Verify the method is called exactly once (proving --set didn't error out)
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "departments": [{"name": "Engineering"}]
            }))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(hr_dept_list_argv(&["--set", "extra_field=hello"]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "set-basic: --set with valid path=value");

    let v = assert_stdout_json(&buf);
    assert_json_diff::assert_json_eq!(v["departments"], json!([{"name": "Engineering"}]));
}
