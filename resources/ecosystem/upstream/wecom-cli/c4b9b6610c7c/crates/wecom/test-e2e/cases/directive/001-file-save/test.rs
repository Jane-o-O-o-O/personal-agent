/// Service with a method whose **response** schema has `x-wecom-file-save` on a field.
///
/// Service "exportsvc" → resource "report" → method "get"
/// - response schema has `data` (string, x-wecom-file-save base64→output.csv) + `other` (string)
fn file_save_service_body(service_base_url: &str) -> serde_json::Value {
    api_response(&json!({
        "description": "Export service with file-save directive",
        "base_url": service_base_url,
        "schemas": {
            "ReportGetReq": {
                "type": "object",
                "properties": {
                    "id": { "type": "string", "description": "Report ID" }
                }
            },
            "ReportGetRes": {
                "type": "object",
                "properties": {
                    "data": {
                        "type": "string",
                        "description": "Base64 encoded file content",
                        "x-wecom-file-save": {
                            "fileName": "output.csv",
                            "contentEncoding": "base64"
                        }
                    },
                    "other": {
                        "type": "string",
                        "description": "Other metadata"
                    }
                }
            }
        },
        "methods": {},
        "resources": {
            "report": {
                "methods": {
                    "get": {
                        "path": "/report/get",
                        "http_method": "POST",
                        "description": "Get a report",
                        "request": { "$ref": "ReportGetReq" },
                        "response": { "$ref": "ReportGetRes" }
                    }
                },
                "resources": {}
            }
        }
    }))
}

fn file_save_catalog_body() -> serde_json::Value {
    api_response(&json!({
        "items": [
            { "name": "exportsvc", "description": "Export service" }
        ]
    }))
}

#[tokio::test]
async fn run() {
    use wiremock::matchers::{body_json, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;

    // Discovery: catalog
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(file_save_catalog_body()))
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    // Discovery: exportsvc service detail with x-wecom-file-save directive
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({"service": "exportsvc"})))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(file_save_service_body(&server.uri())),
        )
        .up_to_n_times(1)
        .expect(1)
        .mount(&server)
        .await;

    // Method call: return JSON with base64 data field.
    // "aGVsbG8=" is base64 for "hello".
    Mock::given(method("POST"))
        .and(path("/report/get"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "data": "aGVsbG8=",
                "other": "metadata-value"
            }))),
        )
        .expect(1)
        .mount(&server)
        .await;

    let tmp = tempfile::tempdir().unwrap();

    let buf = SharedBuf::new();
    let client = wecom::Client::builder()
        .config_dir(tmp.path())
        .cwd(tmp.path())
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
                .with_write_policy(wecom_fs::Policy::new().with_allowed_dirs(&[tmp.path()])),
        ))
        .build()
        .unwrap();

    let result = client
        .run(vec![
            "wecom".into(),
            "exportsvc".into(),
            "report".into(),
            "get".into(),
            "--id".into(),
            "report-001".into(),
        ])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "file-save e2e");

    // CLI stdout: `data` field should be replaced with file path, `other` unchanged.
    let v = assert_stdout_json(&buf);
    assert_eq!(
        v["other"], "metadata-value",
        "other field should be unchanged"
    );
    let data_path = v["data"]
        .as_str()
        .expect("data should be replaced with file path");
    assert!(
        data_path.contains("output.csv"),
        "data field should contain output.csv, got: {data_path}"
    );

    // 无 --output-dir：x-wecom-file-save 产物默认落盘 cwd（缺省分支的端到端锁定）。
    // Canonicalize both sides: the fs layer returns resolved real paths
    // (on macOS the tempdir /var base is symlinked to /private/var).
    #[allow(clippy::disallowed_methods)]
    {
        let expected_dir = tmp.path().canonicalize().unwrap();
        let actual_dir = std::path::Path::new(data_path)
            .parent()
            .map(|p| p.canonicalize().unwrap());
        assert_eq!(
            actual_dir.as_deref(),
            Some(expected_dir.as_path()),
            "file-save artifact must land under the default output dir (cwd): {data_path}"
        );
    }

    // FS: output.csv should exist with decoded content "hello".
    let content = assert_file_exists(std::path::Path::new(data_path));
    assert_eq!(
        content, "hello",
        "file content should be base64-decoded 'hello'"
    );
}
