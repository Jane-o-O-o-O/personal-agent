#[tokio::test]
async fn run() {
    let server = MockServer::start().await;
    let transport = Transport::from(HttpTransportBackend::default());

    Mock::given(method("POST"))
        .and(path("/cgi-bin/test"))
        .respond_with(ResponseTemplate::new(200).set_body_json(http_api_response(
            &json!({"users": [{"id": 1, "name": "Alice"}]}),
        )))
        .expect(1)
        .mount(&server)
        .await;

    let payload = json!({"department_id": "root"});
    let result = transport
        .invoke(ep(&server.uri(), "/cgi-bin/test"), payload)
        .await
        .unwrap()
        .into_result()
        .unwrap();

    assert_json_eq!(result, json!({"users": [{"id": 1, "name": "Alice"}]}));
}
