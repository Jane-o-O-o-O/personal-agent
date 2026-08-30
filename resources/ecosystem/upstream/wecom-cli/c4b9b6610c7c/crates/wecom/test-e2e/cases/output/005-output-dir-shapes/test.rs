#[tokio::test]
async fn run() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    let binary_content = b"output-dir shapes";

    // 方法 mock 不限次数：A 分支在请求发出前被门禁拦截，B 分支正常命中。
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
        .mount(&server)
        .await;

    let tmp = tempfile::tempdir().unwrap();

    let client = wecom::Client::builder()
        .config_dir(tmp.path())
        .cwd(tmp.path())
        .transport(build_test_http_transport("test-token", &server.uri()))
        .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
        .workspace_fs(std::sync::Arc::new(
            wecom_fs::SandboxedFs::new()
                .with_write_policy(wecom_fs::Policy::new().with_allowed_dirs(&[tmp.path()])),
        ))
        .build()
        .unwrap();

    // A. --output-dir 指向已存在的「文件」：WriteDir 校验拒绝，请求不发出。
    #[allow(clippy::disallowed_methods)] // e2e 夹具：直接落盘造出形状样本
    std::fs::write(tmp.path().join("not-a-dir"), b"x").unwrap();
    let err = client
        .run(hr_dept_list_argv(&[
            "--output-dir",
            tmp.path().join("not-a-dir").to_str().unwrap(),
        ]))
        .output(wecom::CliRunOutput::new(SharedBuf::new()))
        .await
        .expect_err("--output-dir pointing at a file must be rejected");
    assert!(
        err.render().contains("无效目录路径"),
        "err = {}",
        err.render()
    );

    // B. --output-dir 为多级不存在的目录：逐层创建后落盘成功。
    let nested = tmp.path().join("a/b/c");
    let buf = SharedBuf::new();
    let result = client
        .run(hr_dept_list_argv(&[
            "--output-dir",
            nested.to_str().unwrap(),
        ]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "nested nonexistent output-dir is created");

    let v = assert_download_result(&buf, "application/octet-stream");
    let file_path = std::path::PathBuf::from(v["file_path"].as_str().unwrap());
    #[allow(clippy::disallowed_methods)] // e2e 断言层直探文件系统
    {
        assert_eq!(
            file_path.parent().map(|p| p.canonicalize().unwrap()),
            Some(nested.canonicalize().unwrap()),
            "file must land under the created nested dir: {}",
            file_path.display()
        );
        assert_eq!(std::fs::read(&file_path).unwrap(), binary_content);
    }
}
