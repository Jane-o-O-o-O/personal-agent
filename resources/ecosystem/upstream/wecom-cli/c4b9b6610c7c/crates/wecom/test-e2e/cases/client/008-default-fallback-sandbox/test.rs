// 默认回退沙箱：不注入 Fs 实例时 builder 回退为受限 SandboxedFs
// （workspace roots=[cwd, 系统临时目录]，deny=推荐列表+config_dir 形状），
// 锁定"嵌入方不注入也不会退化为全开"的默认安全姿态。
#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;
    setup_method_mock(
        &server,
        "/department/list",
        api_response(&json!({"departments": []})),
    )
    .await;

    let home = tempfile::tempdir().unwrap();
    let cwd = tempfile::tempdir().unwrap();

    // 不调用 private_fs() / workspace_fs()：默认回退受限实例。
    let client = wecom::Client::builder()
        .config_dir(home.path())
        .cwd(cwd.path())
        .transport(build_test_http_transport("test-token", &server.uri()))
        .build()
        .unwrap();

    // 对照：cwd（roots 内）写入 → 允许
    let buf = SharedBuf::new();
    let ok = cwd.path().join("ok.json");
    let result = client
        .run(hr_dept_list_argv(&["--output", ok.to_str().unwrap()]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "default fallback writable cwd");
    // e2e 断言层直探文件系统（验证落盘结果），合法绕过 disallowed_methods。
    #[allow(clippy::disallowed_methods)]
    {
        assert!(ok.exists());
    }

    // 对抗：[cwd, 系统临时目录] 之外 → 拒绝「目标路径超出可访问范围」。
    // 目标取测试进程 cwd（crate 目录）——前提：checkout 不在系统临时目录下。
    let buf = SharedBuf::new();
    let escaped = std::env::current_dir().unwrap().join("escape.json");
    let result = client
        .run(hr_dept_list_argv(&["--output", escaped.to_str().unwrap()]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    let err = result.expect_err("outside-roots output must be rejected");
    let rendered = err.render();
    assert!(
        rendered.contains("目标路径超出可访问范围"),
        "rendered = {rendered}"
    );
    // e2e 断言层直探文件系统（验证沙箱未放行），合法绕过 disallowed_methods。
    #[allow(clippy::disallowed_methods)]
    {
        assert!(!escaped.exists());
    }
}
