#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    setup_method_mock(
        &server,
        "/department/list",
        api_response(&json!({
            "departments": [{"id": "1", "name": "Engineering"}]
        })),
    )
    .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let cli_run = client
        .run(vec!["hr".into(), "department".into(), "list".into()])
        .output(wecom::CliRunOutput::new(buf.clone()));

    let svc = client.service("hr").await.unwrap();
    let method = svc.method(&["department", "list"]).unwrap();

    let result = method
        .run(wecom::RunOptions {
            run: &cli_run,
            payload: json!({"id": "root"}),
            ..wecom::RunOptions::new(&cli_run)
        })
        .await;
    assert_cli_ok(&result, &buf, "programmatic method call");

    let v = assert_stdout_json(&buf);
    assert!(v["departments"].is_array());
    assert_eq!(v["departments"].as_array().unwrap().len(), 1);
}
