// Process-level：symlink 逃逸对抗（写侧 + 读侧）与合法 symlink 对照。
//
// 防御链路：`resolve_real_path` 跟随 symlink 到真实落点 → deny/roots 判定。
// 读 roots = [cwd, 固定临时目录]：symlink 落点在 tmp 内属合法读根（放行对照），
// 落点在 deny 目录内仍拦截；写 roots = [cwd]：symlink 落点在 cwd 外一律拒绝。
// 读侧与 005 的硬链接分属两条独立机制：symlink 在路径解析层判定，
// 硬链接别名则按自身路径字符串判定（deny 为纯字符串比对）。
//
// 全部 fixture 先于 CLI 子进程创建（deny 规则在子进程启动时编译）。
//
/// 与 `main.rs` 的 `pinned_temp_dir()` 同口径的测试侧取值（bin crate 内部不可被
/// 集成测试 import，此处保持同构的小段重复）。
#[cfg(all(unix, feature = "custom-endpoint"))]
fn pinned_temp_root() -> std::path::PathBuf {
    std::path::PathBuf::from("/tmp")
}

#[cfg(all(unix, feature = "custom-endpoint"))]
#[test]
fn run() {
    let cwd = tempfile::tempdir().unwrap();
    let cfg_dir = tempfile::tempdir().unwrap();
    // “symlink 落点在 tmp 读根内”的对照样本必须落在 CLI 的固定临时目录 root
    // 下——不能用 tempfile::tempdir()（macOS 上落在 /var/folders，恰在 root 之外）。
    let outside = tempfile::tempdir_in(pinned_temp_root()).unwrap();
    seed_credentials(cfg_dir.path());

    #[allow(clippy::disallowed_methods)] // 测试夹具：准备沙箱外/内文件与符号链接。
    {
        std::fs::create_dir_all(cwd.path().join("real/sub")).unwrap();
        std::fs::write(cwd.path().join("note.txt"), b"note").unwrap();
        std::fs::write(outside.path().join("secret.bin"), b"outside-bytes").unwrap();
        // 目录级 symlink：逃逸（落点在 roots 外）/ 落 deny / roots 内合法。
        // 逃逸目标取测试进程 cwd（crate 目录）——前提：checkout 不在系统临时目录下。
        std::os::unix::fs::symlink(
            std::env::current_dir().unwrap(),
            cwd.path().join("link-out"),
        )
        .unwrap();
        std::os::unix::fs::symlink(cfg_dir.path(), cwd.path().join("link-cfg")).unwrap();
        std::os::unix::fs::symlink(cwd.path().join("real"), cwd.path().join("link-in")).unwrap();
        // 文件级 symlink（读侧攻击向量）。
        std::os::unix::fs::symlink(
            outside.path().join("secret.bin"),
            cwd.path().join("link-file-out"),
        )
        .unwrap();
        std::os::unix::fs::symlink(
            cfg_dir.path().join("credentials.enc"),
            cwd.path().join("link-file-cfg"),
        )
        .unwrap();
    }

    let rt = tokio::runtime::Runtime::new().unwrap();
    let (server_url, mocks, method, _server) = rt.block_on(async {
        let mut server = Server::new_async().await;
        let mocks = setup_sandbox_mocks(&mut server).await;
        // 上传链路：对照组 ⑤ 与读根放行组 ⑥ 各命中 1 次（deny 组在 resolve 阶段被拒）。
        let upload = server
            .mock("POST", "/file/upload")
            .expect(2)
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
        (server.url(), (mocks, upload), method, server)
    });
    let (mocks, upload) = mocks;

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

    // ① 对照：cwd 内真实子目录写入 → 允许
    run_wecom(&["hr", "department", "list", "--output", "real/sub/ok.json"]).success();
    assert!(cwd.path().join("real/sub/ok.json").exists());

    // ② 对照：roots 内 symlink（link-in → real）写入 → 放行（合法 symlink 不误伤）
    run_wecom(&[
        "hr",
        "department",
        "list",
        "--output",
        "link-in/sub/ok2.json",
    ])
    .success();
    assert!(cwd.path().join("real/sub/ok2.json").exists());

    // ③ 写侧：symlink → roots 外目录（repo）→ 拒绝
    let out = run_wecom(&[
        "hr",
        "department",
        "list",
        "--output",
        "link-out/escape.json",
    ])
    .failure()
    .get_output()
    .clone();
    let text = combined(&out);
    assert!(text.contains("目标路径超出可访问范围"), "combined = {text}");
    assert!(
        !std::env::current_dir()
            .unwrap()
            .join("escape.json")
            .exists()
    );

    // ④ 写侧：symlink → config_dir（deny） → 拒绝
    let out = run_wecom(&[
        "hr",
        "department",
        "list",
        "--output",
        "link-cfg/poison.json",
    ])
    .failure()
    .get_output()
    .clone();
    let text = combined(&out);
    assert!(text.contains("安全策略保护"), "combined = {text}");
    assert!(!cfg_dir.path().join("poison.json").exists());

    // ⑤ 读侧对照：cwd 内真实文件上传 → 允许
    let media = json!({ "media": cwd.path().join("note.txt").to_string_lossy() }).to_string();
    run_wecom(&["files", "send", "--json", &media]).success();

    // ⑥ 读侧对照：symlink → 系统临时目录内文件 → 放行（落点在默认读根内，合法 symlink 不误伤）
    let media = json!({ "media": cwd.path().join("link-file-out").to_string_lossy() }).to_string();
    run_wecom(&["files", "send", "--json", &media]).success();

    // ⑦ 读侧：symlink → deny 目录内文件 → 拒绝
    let media = json!({ "media": cwd.path().join("link-file-cfg").to_string_lossy() }).to_string();
    let out = run_wecom(&["files", "send", "--json", &media])
        .failure()
        .get_output()
        .clone();
    let text = combined(&out);
    assert!(text.contains("安全策略保护"), "combined = {text}");

    // 上传端点共命中 2 次（⑤ cwd 对照 + ⑥ tmp 读根放行）。
    rt.block_on(async {
        upload.assert_async().await;
    });
    drop((mocks, method));
}
