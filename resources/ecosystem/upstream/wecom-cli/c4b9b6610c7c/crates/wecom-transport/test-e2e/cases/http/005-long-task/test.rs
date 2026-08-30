#[tokio::test]
async fn run() {
    let server = MockServer::start().await;
    let transport = HttpTransportBackend::builder()
        .base_url(server.uri())
        .build()
        .expect("infallible: no header set");

    // Initial request returns taskid
    Mock::given(method("POST"))
        .and(path("/cgi-bin/export"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(http_long_task_initial_response("TASK_001", 1)),
        )
        .expect(1)
        .mount(&server)
        .await;

    // Poll endpoint returns done
    Mock::given(method("POST"))
        .and(path("/task/query"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(http_long_task_poll_done(
                &json!({"export_url": "https://example.com/file.csv"}),
            )),
        )
        .expect(1)
        .mount(&server)
        .await;

    let payload = json!({"type": "csv"});
    let result = transport
        .invoke(ep(&server.uri(), "/cgi-bin/export"), payload)
        .await
        .unwrap()
        .into_result()
        .unwrap();

    assert_json_eq!(
        result,
        json!({"export_url": "https://example.com/file.csv"})
    );
}
