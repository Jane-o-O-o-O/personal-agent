#[cfg(feature = "custom-endpoint")]
#[tokio::test]
async fn run_custom_base_url() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(vec!["wecom".into(), "schema".into(), "list".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "custom base_url");
}

#[cfg(not(feature = "custom-endpoint"))]
#[test]
fn run_custom_base_url() {}
