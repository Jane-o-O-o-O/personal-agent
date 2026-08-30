// Process-level：危险字符路径拒绝（resolve 期统一入口，读/写共用）。
//
// 零宽 / bidi / 控制字符在 resolve 期被 reject_dangerous_chars 拦截；
// Windows 另拒组件内冒号（ADS 流）。对照组锁定 CJK + 空格的合法文件名不误伤。
// 攻击向量用 \u{...} 转义书写，源文件保持可见字符。
#[cfg(feature = "custom-endpoint")]
#[test]
fn run() {
    let cwd = tempfile::tempdir().unwrap();
    let cfg_dir = tempfile::tempdir().unwrap();
    seed_credentials(cfg_dir.path());

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
    let assert_dangerous = |name: &str| {
        let out = run_wecom(&["hr", "department", "list", "--output", name])
            .failure()
            .get_output()
            .clone();
        let text = combined(&out);
        assert!(
            text.contains("路径包含非法字符"),
            "input = {name:?}, combined = {text}"
        );
        assert!(!cwd.path().join(name).exists(), "file created: {name:?}");
    };

    // ① 对照：CJK + 空格文件名 → 允许（父目录经句柄递归创建）
    run_wecom(&[
        "hr",
        "department",
        "list",
        "--output",
        "子目录/报告 v2.json",
    ])
    .success();
    assert!(cwd.path().join("子目录/报告 v2.json").exists());

    // ② 零宽字符 U+200B
    assert_dangerous("report\u{200B}.json");
    // ③ bidi 覆写 U+202E
    assert_dangerous("report\u{202E}.json");
    // ④ 控制字符 \n
    assert_dangerous("rep\nort.json");
    // ⑤（仅 Windows）组件内冒号 → ADS 流
    #[cfg(windows)]
    assert_dangerous("report.txt:stream");
}
