#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    setup_method_mock(
        &server,
        "/department/list",
        api_response(&json!({"departments": []})),
    )
    .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(hr_dept_list_argv(&["--json", r#"{bad: "value"}"#]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;

    // {bad: "value"} is repaired by jsonrepair-rs (unquoted key gets quoted).
    assert_cli_ok(&result, &buf, "json repair succeeds for unquoted key");

    let _ = assert_stdout_json(&buf);
}
