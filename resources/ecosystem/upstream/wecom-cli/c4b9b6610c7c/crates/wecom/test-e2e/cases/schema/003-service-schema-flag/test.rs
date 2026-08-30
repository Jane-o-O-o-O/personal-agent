#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(vec!["wecom".into(), "hr".into(), "--schema".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "hr --schema");

    let v = assert_stdout_json(&buf);
    assert_eq!(v["name"], "hr");
    assert!(!v["methods"].as_array().unwrap().is_empty());
}
