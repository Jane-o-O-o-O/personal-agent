#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;

    // --help triggers list_services(), so we need a catalog mock
    setup_discovery_mocks(&server).await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let argv: Vec<String> = vec!["wecom", "--help"]
        .into_iter()
        .map(String::from)
        .collect();

    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "--help");
    assert_stdout_contains(&buf, "Usage");
}
