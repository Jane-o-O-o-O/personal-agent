#[tokio::test]
async fn run() {
    let server = MockServer::start().await;

    let transport = Transport::from(HttpTransportBackend::default());

    let binary_data = vec![0x89, 0x50, 0x4E, 0x47]; // PNG magic bytes

    Mock::given(method("POST"))
        .and(path("/cgi-bin/download"))
        .respond_with(
            ResponseTemplate::new(200)
                .append_header("Content-Type", "image/png")
                .set_body_bytes(binary_data.clone()),
        )
        .expect(1)
        .mount(&server)
        .await;

    let payload = json!({"file_id": "F001"});

    let response = transport
        .invoke(ep(&server.uri(), "/cgi-bin/download"), &payload)
        .await
        .unwrap();

    match response {
        TransportResponse::Binary(resp) => {
            use futures_util::StreamExt;
            let mut stream = resp.bytes_stream();
            let mut bytes = Vec::new();
            while let Some(chunk) = stream.next().await {
                bytes.extend_from_slice(&chunk.unwrap());
            }
            assert_eq!(bytes, binary_data);
        }
        TransportResponse::Json(_) => panic!("Expected Binary response, got JSON"),
    }
}
