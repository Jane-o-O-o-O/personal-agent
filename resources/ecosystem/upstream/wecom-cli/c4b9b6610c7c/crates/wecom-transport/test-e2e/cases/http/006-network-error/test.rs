#[tokio::test]
async fn run() {
    // Bind a port then immediately drop the listener to ensure connection refused
    let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    let port = listener.local_addr().unwrap().port();
    drop(listener);

    let transport = Transport::from(HttpTransportBackend::default());

    let payload = json!({});
    let base = format!("http://127.0.0.1:{port}");
    let err = transport
        .invoke(ep(&base, "/cgi-bin/test"), payload)
        .await
        .unwrap_err();

    match &err {
        Error::Network { .. } => {} // Expected
        other => panic!("Expected Error::Network, got: {other:?}"),
    }
}
