// Process-level：config_dir 落在 roots 内仍被 deny 屏蔽（deny 恒胜 allow）。
//
// main.rs 的工作区接线：roots 读写同=[cwd]，deny = recommended + config_dir。
// config_dir 故意置于 cwd 内——root 包含 deny 项不会重新放行，读写双向均拒绝；
// PrivateFs（roots=[config_dir]，deny 不含 config_dir）的缓存读写不受影响
// （第二次调用走 discovery 缓存间接验证）。
#[cfg(feature = "custom-endpoint")]
#[test]
fn run() {
    let cwd = tempfile::tempdir().unwrap();
    let cfg = cwd.path().join("cfg");
    #[allow(clippy::disallowed_methods)] // 测试夹具：在 cwd 内预置配置目录与凭据。
    {
        std::fs::create_dir_all(&cfg).unwrap();
    }
    seed_credentials(&cfg);

    let rt = tokio::runtime::Runtime::new().unwrap();
    let (server_url, mocks, upload, method, _server) = rt.block_on(async {
        let mut server = Server::new_async().await;
        let mocks = setup_sandbox_mocks(&mut server).await;
        // 读侧攻击在 resolve 阶段被拒：上传端点 0 次命中。
        let upload = server
            .mock("POST", "/file/upload")
            .expect(0)
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(api_response(&json!({ "media_id": "M_OK" })))
            .create_async()
            .await;
        let method = setup_method_mock(
            &mut server,
            "/department/list",
            &api_response(&json!({"departments": []})),
        )
        .await;
        (server.url(), mocks, upload, method, server)
    });

    let run_wecom = |args: &[&str]| {
        assert_cmd::Command::cargo_bin("wecom-cli")
            .unwrap()
            .current_dir(cwd.path())
            .env("WECOM_CLI_BASE_URL", &server_url)
            .env("WECOM_CLI_CONFIG_DIR", &cfg)
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

    // ① 对照：cwd 其他位置写入 → 允许（discovery 缓存经 PrivateFs 正常写入 cfg/cache）
    run_wecom(&["hr", "department", "list", "--output", "./ok.json"]).success();
    assert!(cwd.path().join("ok.json").exists());

    // ② 写侧：--output 直指 roots 内的 config_dir → deny 恒胜 allow → 拒绝
    let poison = cfg.join("poison.json");
    let out = run_wecom(&[
        "hr",
        "department",
        "list",
        "--output",
        poison.to_str().unwrap(),
    ])
    .failure()
    .get_output()
    .clone();
    let text = combined(&out);
    assert!(text.contains("安全策略保护"), "combined = {text}");
    assert!(!poison.exists());

    // ③ 读侧：上传 config_dir 内既有文件（凭据）→ 拒绝
    let media = json!({ "media": cfg.join("credentials.enc").to_string_lossy() }).to_string();
    let out = run_wecom(&["files", "send", "--json", &media])
        .failure()
        .get_output()
        .clone();
    let text = combined(&out);
    assert!(text.contains("安全策略保护"), "combined = {text}");

    // 上传端点 0 次命中（③ 在 resolve 阶段被拒）。
    rt.block_on(async {
        upload.assert_async().await;
    });
    drop((mocks, method));
}
