#[tokio::test]
async fn run() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;

    // Return empty catalog so clap processes the arg_required_else_help rule.
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({ "items": [] }))),
        )
        .mount(&server)
        .await;

    let client = build_test_client(&server.uri());

    let result = client.run(vec!["wecom".into()]).await;
    assert!(result.is_err());

    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 2);
}
