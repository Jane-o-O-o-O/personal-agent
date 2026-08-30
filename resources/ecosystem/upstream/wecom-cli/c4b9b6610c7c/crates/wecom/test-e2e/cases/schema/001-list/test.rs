#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(vec!["wecom".into(), "schema".into(), "list".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "schema list");

    let v = assert_stdout_json(&buf);
    let arr = v.as_array().expect("output should be array");
    assert_eq!(arr.len(), 1);
    assert_eq!(arr[0]["name"], "hr");
    assert!(!arr[0]["methods"].as_array().unwrap().is_empty());
}
