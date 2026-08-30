// Process-level：`..` 注入逃逸（文件写 + 目录写入口）。
//
// 相对路径在入口边界 absolutize 锚定 cwd（纯拼接不折叠），`normalize_path`
// 逻辑折叠后越界者在 roots 判定处拒绝。`--output-dir` 为全局参数，走
// WriteDir 分支，与 `--output` 同链路——显式声明即走沙箱校验。
#[cfg(feature = "custom-endpoint")]
#[test]
fn run() {
    let cwd = tempfile::tempdir().unwrap();
    let cfg_dir = tempfile::tempdir().unwrap();
    seed_credentials(cfg_dir.path());
    // 越界基准：系统临时目录的上一级（读写 roots=[cwd, tmp]，tmp 内不算越界）。
    // cwd 是 temp_dir 的直接子目录，`../../x` 折叠后落在 beyond。
    let beyond = std::env::temp_dir()
        .parent()
        .expect("temp_dir must have a parent")
        .to_path_buf();

    let rt = tokio::runtime::Runtime::new().unwrap();
    let (server_url, _mocks, _method, _server) = rt.block_on(async {
        let mut server = Server::new_async().await;
        let mocks = setup_discovery_mocks(&mut server).await;
        let method = setup_method_mock(
            &mut server,
            "/department/list",
            &api_response(&json!({"departments": []})),
        )
        .await;
        (server.url(), mocks, method, server)
    });

    let run_wecom = |args: &[&str]| {
        assert_cmd::Command::cargo_bin("wecom-cli")
            .unwrap()
            .current_dir(cwd.path())
            .env("WECOM_CLI_BASE_URL", &server_url)
            .env("WECOM_CLI_CONFIG_DIR", cfg_dir.path())
            .args(args)
            .assert()
    };
    let combined = |output: &std::process::Output| {
        format!(
            "{}{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        )
    };
    let assert_escape = |args: &[&str], escaped: &std::path::Path| {
        let out = run_wecom(args).failure().get_output().clone();
        let text = combined(&out);
        assert!(
            text.contains("目标路径超出可访问范围"),
            "args = {args:?}, combined = {text}"
        );
        assert!(!escaped.exists(), "escape produced: {}", escaped.display());
    };

    // ① 对照：roots 内部折叠（sub/../ok.json → ok.json）→ 放行
    run_wecom(&["hr", "department", "list", "--output", "sub/../ok.json"]).success();
    assert!(cwd.path().join("ok.json").exists());

    // ② 折叠越出 tmp（文件写）
    assert_escape(
        &["hr", "department", "list", "--output", "../../escape.json"],
        &beyond.join("escape.json"),
    );
    // ③ 深层折叠越界（a 无需存在，折叠为纯逻辑运算）
    assert_escape(
        &[
            "hr",
            "department",
            "list",
            "--output",
            "a/../../../escape2.json",
        ],
        &beyond.join("escape2.json"),
    );
    // ④ 目录写入口（WriteDir 分支）越界：显式 --output-dir 即走沙箱校验，拒绝
    assert_escape(
        &[
            "hr",
            "department",
            "list",
            "--output-dir",
            "../../escape-dir",
        ],
        &beyond.join("escape-dir"),
    );
}
