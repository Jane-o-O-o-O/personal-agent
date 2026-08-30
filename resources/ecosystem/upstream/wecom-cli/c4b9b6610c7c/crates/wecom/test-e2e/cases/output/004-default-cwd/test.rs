#[tokio::test]
#[allow(clippy::disallowed_methods)] // Test fixture: canonicalize for path comparison, not through the sandbox
async fn run() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_bytes(b"default-cwd-test-content".to_vec())
                .append_header("content-type", "application/octet-stream"),
        )
        .expect(1)
        .mount(&server)
        .await;

    let tmp = tempfile::tempdir().unwrap();
    let cwd = tmp.path().join("cwd");
    std::fs::create_dir(&cwd).unwrap();

    let buf = SharedBuf::new();
    let client = wecom::Client::builder()
        .config_dir(tmp.path())
        .cwd(&cwd)
        .transport(build_test_http_transport("test-token", &server.uri()))
        .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
        .workspace_fs(std::sync::Arc::new(
            wecom_fs::SandboxedFs::new()
                .with_write_policy(wecom_fs::Policy::new().with_allowed_dirs(&[cwd.as_path()])),
        ))
        .build()
        .unwrap();

    // 无 --output / --output-dir：默认下载到 cwd。
    let result = client
        .run(hr_dept_list_argv(&[]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "default cwd download");

    let v = assert_stdout_json(&buf);
    let file_path = v["file_path"]
        .as_str()
        .expect("DownloadResult should have file_path");
    let file_canonical =
        std::fs::canonicalize(file_path).unwrap_or_else(|_| std::path::PathBuf::from(file_path));
    let cwd_canonical = cwd.canonicalize().unwrap();
    assert!(
        file_canonical.starts_with(&cwd_canonical),
        "file should be under cwd\n  file: {}\n  cwd:  {}",
        file_canonical.display(),
        cwd_canonical.display(),
    );
}
