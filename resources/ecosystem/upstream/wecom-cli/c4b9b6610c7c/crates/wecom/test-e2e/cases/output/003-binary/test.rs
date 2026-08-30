#[tokio::test]
async fn run() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    let binary_content = b"fake binary content for testing";

    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_bytes(binary_content.to_vec())
                .append_header("content-type", "application/octet-stream")
                .append_header(
                    "content-disposition",
                    r#"attachment; filename="report.xlsx""#,
                ),
        )
        .expect(1)
        .mount(&server)
        .await;

    let tmp = tempfile::tempdir().unwrap();
    let out_dir = tmp.path().join("out");

    let buf = SharedBuf::new();
    let client = wecom::Client::builder()
        .config_dir(tmp.path())
        .transport(build_test_http_transport("test-token", &server.uri()))
        .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
        .workspace_fs(std::sync::Arc::new(
            wecom_fs::SandboxedFs::new()
                .with_write_policy(wecom_fs::Policy::new().with_allowed_dirs(&[tmp.path()])),
        ))
        .build()
        .unwrap();

    let result = client
        .run(hr_dept_list_argv(&[
            "--output-dir",
            out_dir.to_str().unwrap(),
        ]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "binary download to output-dir");

    let v = assert_download_result(&buf, "application/octet-stream");
    let file_path_str = v["file_path"].as_str().unwrap();
    let file_path = std::path::PathBuf::from(file_path_str);
    assert_eq!(
        file_path.file_name().unwrap(),
        "report.xlsx",
        "file name should come from Content-Disposition: {file_path_str}"
    );
    // Canonicalize both sides: the fs layer returns resolved real paths
    // (on macOS the tempdir /var base is symlinked to /private/var).
    #[allow(clippy::disallowed_methods)]
    {
        let expected_dir = out_dir.canonicalize().unwrap();
        let actual_dir = file_path.parent().map(|p| p.canonicalize().unwrap());
        assert_eq!(
            actual_dir.as_deref(),
            Some(expected_dir.as_path()),
            "file should land under --output-dir: {file_path_str}"
        );
    }
    assert_eq!(v["size"], binary_content.len() as u64);

    // FS: verify file content
    #[allow(clippy::disallowed_methods)]
    let saved = std::fs::read(&file_path).unwrap();
    assert_eq!(saved, binary_content);
}
