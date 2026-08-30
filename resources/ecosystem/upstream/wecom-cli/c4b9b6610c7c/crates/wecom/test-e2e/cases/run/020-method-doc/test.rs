#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // Method call endpoint should NOT be called.
    // Not mounting it; if called, wiremock 404 causes assert_cli_ok failure.

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(vec![
            "wecom".into(),
            "hr".into(),
            "department".into(),
            "list".into(),
            "--doc".into(),
        ])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "doc flag");

    assert_stdout_contains(&buf, "Method");
    assert_stdout_contains(&buf, "department.list");
}
