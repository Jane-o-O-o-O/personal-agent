#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    setup_method_mock(
        &server,
        "/department/list",
        api_response(&json!({
            "departments": [
                {"id": "1", "name": "Engineering"},
                {"id": "2", "name": "Marketing"}
            ]
        })),
    )
    .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(hr_dept_list_argv(&[]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "method call via run");

    let v = assert_stdout_json(&buf);
    assert!(v["departments"].is_array());
    assert_eq!(v["departments"].as_array().unwrap().len(), 2);
}
