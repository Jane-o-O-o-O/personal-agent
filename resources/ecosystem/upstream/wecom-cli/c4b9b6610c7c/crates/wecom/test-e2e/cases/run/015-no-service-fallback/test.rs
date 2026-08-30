#[tokio::test]
async fn run() {
    use wiremock::matchers::{body_json, method, path};
    use wiremock::{Mock, ResponseTemplate};

    let server = wiremock::MockServer::start().await;

    // catalog：包含 hr 服务（不含 "notexist"）
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_body()))
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let argv: Vec<String> = vec!["wecom", "notexist", "foobar"]
        .into_iter()
        .map(String::from)
        .collect();

    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;

    // 无匹配 service → 回退 clap 默认错误
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

    // clap 应识别 `notexist` 为无效子命令
    assert!(
        msg.contains("notexist"),
        "error message should mention 'notexist':\n{msg}"
    );
    // 不应混入 catalog 中的其他 service
    assert!(
        !msg.contains("hr"),
        "error message leaked unrelated service name 'hr':\n{msg}"
    );
}
