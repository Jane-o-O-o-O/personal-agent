fn octet_stream_service_body(service_base_url: &str) -> serde_json::Value {
    api_response(&json!({
        "description": "File service with multipart upload",
        "base_url": service_base_url,
        "schemas": {
            "DocUploadReq": {
                "type": "object",
                "properties": {
                    "file": {
                        "type": "string",
                        "x-wecom-octet-stream": true
                    },
                    "name": { "type": "string" }
                }
            },
            "DocUploadRes": {
                "type": "object",
                "properties": {
                    "ok": { "type": "boolean" }
                }
            }
        },
        "methods": {},
        "resources": {
            "doc": {
                "methods": {
                    "upload": {
                        "path": "/doc/upload",
                        "http_method": "POST",
                        "request": { "$ref": "DocUploadReq" },
                        "response": { "$ref": "DocUploadRes" }
                    }
                },
                "resources": {}
            }
        }
    }))
}

#[tokio::test]
async fn run() {
    use wiremock::matchers::{body_string_contains, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;

    // Discovery
    let catalog_body = api_response(&json!({
        "items": [{ "name": "filesvc", "description": "File service" }]
    }));
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_body))
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(octet_stream_service_body(&server.uri())),
        )
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    // Method call: verify multipart body
    Mock::given(method("POST"))
        .and(path("/doc/upload"))
        .and(body_string_contains(r#"name="file""#))
        .and(body_string_contains("fake-pdf-content"))
        .and(body_string_contains(r#"name="name""#))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "ok": true
            }))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let tmp = tempfile::tempdir().unwrap();
    let doc_path = tmp.path().join("doc.pdf");
    #[allow(clippy::disallowed_methods)]
    std::fs::write(&doc_path, b"fake-pdf-content").unwrap();

    let buf = SharedBuf::new();
    let client = wecom::Client::builder()
        .config_dir(tmp.path())
        .transport(
            wecom::transport::HttpTransportBackend::builder()
                .base_url(server.uri())
                .header_sensitive("Authorization", "Bearer test-token", true)
                .build()
                .expect("add header"),
        )
        .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
        .workspace_fs(std::sync::Arc::new(
            wecom_fs::SandboxedFs::new()
                .with_read_policy(wecom_fs::Policy::new().with_allowed_dirs(&[tmp.path()])),
        ))
        .build()
        .unwrap();

    let result = client
        .run(vec![
            "wecom".into(),
            "filesvc".into(),
            "doc".into(),
            "upload".into(),
            "--file".into(),
            doc_path.to_str().unwrap().into(),
            "--name".into(),
            "my-document".into(),
        ])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "multipart upload e2e");

    let v = assert_stdout_json(&buf);
    assert_eq!(v["ok"], true);
}
