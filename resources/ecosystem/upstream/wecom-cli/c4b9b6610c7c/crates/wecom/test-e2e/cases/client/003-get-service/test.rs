#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    let client = build_test_client(&server.uri());

    let svc = client.service("hr").await.unwrap();
    let method = svc.method(&["department", "list"]).unwrap();
    assert_eq!(method.name(), "list");
}
