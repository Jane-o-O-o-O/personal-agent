#[tokio::test]
async fn run() {
    // dry-run 不命中方法端点，仅需 discovery。
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    let tmp = tempfile::tempdir().unwrap();
    let outside = tempfile::tempdir().unwrap();

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

    // A. --dry-run + 越界 --output-dir：与实际执行同一道 WriteDir 门禁，拒绝。
    let err = client
        .run(hr_dept_list_argv(&[
            "--dry-run",
            "--output-dir",
            outside.path().to_str().unwrap(),
        ]))
        .output(wecom::CliRunOutput::new(SharedBuf::new()))
        .await
        .expect_err("out-of-roots --output-dir must be rejected even in dry-run");
    assert!(
        err.render().contains("目标路径超出可访问范围"),
        "err = {}",
        err.render()
    );

    // B. --dry-run + roots 内 --output-dir：正常产出预览，不落盘、不建目录。
    let in_roots = tmp.path().join("out");
    let buf = SharedBuf::new();
    let result = client
        .run(hr_dept_list_argv(&[
            "--dry-run",
            "--output-dir",
            in_roots.to_str().unwrap(),
        ]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "dry-run with in-roots --output-dir");
    assert!(
        buf.contents().contains("=== Dry Run ==="),
        "dry-run preview expected, got: {}",
        buf.contents()
    );
    #[allow(clippy::disallowed_methods)] // e2e 断言层直探文件系统
    {
        assert!(
            !in_roots.exists(),
            "dry-run must not materialize the output dir"
        );
    }
}
