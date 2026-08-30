#[tokio::test]
async fn run() {
    use wiremock::matchers::{body_json, method, path};
    use wiremock::{Mock, ResponseTemplate};

    let server = wiremock::MockServer::start().await;

    // 空 catalog（避免引入额外 service 干扰）
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({ "items": [] }))),
        )
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let argv: Vec<String> = vec!["wecom", "schma"]
        .into_iter()
        .map(String::from)
        .collect();

    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;

    assert!(
        result.is_err(),
        "expected error, got Ok; stdout={}",
        buf.contents()
    );
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 2);

    let msg = match &err {
        wecom::Error::CliOutput { message, .. } => message.clone(),
        other => panic!("expected Error::CliOutput, got {other:?}"),
    };

    // clap 内置单层级相似建议应包含 'schema'
    assert!(
        msg.contains("schema"),
        "error message missing suggestion 'schema':\n{msg}"
    );
}
