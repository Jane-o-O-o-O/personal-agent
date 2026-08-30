#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    let client = build_test_client(&server.uri());

    let services = client.list_services().await.unwrap();
    assert_eq!(services.len(), 1);
    assert_eq!(services[0].name, "hr");
}
