#[tokio::test]
async fn run() {
    // Bind a port then immediately drop the listener
    let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    let port = listener.local_addr().unwrap().port();
    drop(listener);

    let buf = SharedBuf::new();
    let client = build_test_client(&format!("http://127.0.0.1:{port}"));

    let argv: Vec<String> = vec!["wecom", "schema", "list"]
        .into_iter()
        .map(String::from)
        .collect();

    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert!(result.is_err(), "expected error for unreachable server");
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 1, "network error should have exit_code 1");
}
