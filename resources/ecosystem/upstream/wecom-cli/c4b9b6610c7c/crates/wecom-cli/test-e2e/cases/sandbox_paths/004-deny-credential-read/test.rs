// Process-level：凭据目录读保护（deny，env-home 基底）+ roots 外读拒绝
// + is_under 大小写折叠分支（④）。
//
// 读 roots = [cwd, 系统临时目录]，读侧拒绝的两种报错文本分别锁定：
//   ② deny 命中（deny 先于 roots 判定）→ 「安全策略保护」
//   ③ roots 越界（非 deny 项）      → 「目标路径超出可访问范围」
//   ④ 折叠分支（.AWS vs .aws）      → macOS/Windows 报 deny；Linux 不折叠、
//                                     fake HOME 在 tmp 读根内 → 落到文件不存在
//
// fixture 时序（防假绿）：伪造 HOME/.ssh/id_rsa 必须先于 CLI 子进程创建——
// deny 规则在子进程启动（SandboxedFs 构造）时编译为形状表。
//
// 全平台运行：②③ 断言在 Windows 同样成立（env-home 基底单基底语义，经
// HOME+USERPROFILE 双写防御覆盖）；④ 按平台分断言。
#[cfg(feature = "custom-endpoint")]
#[test]
fn run() {
    let cwd = tempfile::tempdir().unwrap();
    let cfg_dir = tempfile::tempdir().unwrap();
    let fake_home = tempfile::tempdir().unwrap();
    seed_credentials(cfg_dir.path());

    #[allow(clippy::disallowed_methods)] // 测试夹具：伪造凭据与 cwd 内对照文件。
    {
        std::fs::create_dir_all(fake_home.path().join(".ssh")).unwrap();
        std::fs::write(fake_home.path().join(".ssh/id_rsa"), b"fake-private-key").unwrap();
        std::fs::write(cwd.path().join("note.txt"), b"note").unwrap();
    }

    let rt = tokio::runtime::Runtime::new().unwrap();
    let (server_url, mocks, upload, _server) = rt.block_on(async {
        let mut server = Server::new_async().await;
        let mocks = setup_sandbox_mocks(&mut server).await;
        // 上传链路：仅对照组 ① 命中 1 次（②③ 在 resolve 阶段被拒）。
        let upload = server
            .mock("POST", "/file/upload")
            .expect(1)
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(api_response(&json!({ "media_id": "M_OK" })))
            .create_async()
            .await;
        (server.url(), mocks, upload, server)
    });

    let run_wecom = |args: &[&str]| {
        let mut cmd = assert_cmd::Command::cargo_bin("wecom-cli").unwrap();
        cmd.current_dir(cwd.path())
            .env("WECOM_CLI_BASE_URL", &server_url)
            .env("WECOM_CLI_CONFIG_DIR", cfg_dir.path())
            // 伪造 $HOME：凭据形状 deny 按任意深度匹配，home 位置由子进程 env 决定。
            .env("HOME", fake_home.path());
        // Windows：std::env::home_dir 的 env 语义不确定时以 USERPROFILE 兜底
        #[cfg(windows)]
        cmd.env("USERPROFILE", fake_home.path());
        cmd.args(args).assert()
    };
    let combined = |output: &std::process::Output| {
        format!(
            "{}{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        )
    };
    let upload_media = |path: &std::path::Path| {
        let media = json!({ "media": path.to_string_lossy() }).to_string();
        run_wecom(&["files", "send", "--json", &media])
    };

    // ① 对照：cwd 内文件上传 → 允许
    upload_media(&cwd.path().join("note.txt")).success();

    // ② 伪造 HOME 的 .ssh/id_rsa → deny 命中 → 拒绝
    let out = upload_media(&fake_home.path().join(".ssh/id_rsa"))
        .failure()
        .get_output()
        .clone();
    let text = combined(&out);
    assert!(text.contains("安全策略保护"), "combined = {text}");

    // ③ roots 外普通文件（非 deny）→ 越界 → 拒绝。
    //    目标取测试进程 cwd（crate 目录）——前提：checkout 不在系统临时目录下
    //    （常规 CI / 开发机成立），tmp 读根之外的唯一稳定非 deny 位置。
    let repo_file = std::env::current_dir().unwrap().join("Cargo.toml");
    let out = upload_media(&repo_file).failure().get_output().clone();
    let text = combined(&out);
    assert!(text.contains("目标路径超出可访问范围"), "combined = {text}");

    // ④ is_under 大小写折叠分支：fake HOME 下刻意不存在的 deny 项 .aws 的
    //    大小写变体 .AWS（两侧尾部段均保留 as-is 大小写，普通前缀比对必然
    //    不匹配，仅折叠比对可命中）。
    let out = upload_media(&fake_home.path().join(".AWS/credentials"))
        .failure()
        .get_output()
        .clone();
    let text = combined(&out);
    // macOS / Windows：折叠命中 → deny。
    #[cfg(any(target_os = "macos", windows))]
    assert!(text.contains("安全策略保护"), "combined = {text}");
    // Linux：字节精确不折叠 → deny 不命中；fake HOME 在 tmp 读根内 → 落到
    // 文件不存在（而非越界）。
    #[cfg(all(unix, not(target_os = "macos")))]
    assert!(!text.contains("安全策略保护"), "combined = {text}");

    // 上传端点仅对照组 ① 命中 1 次（②③④ 均在 resolve 阶段被拒）。
    rt.block_on(async {
        upload.assert_async().await;
    });
    drop(mocks);
}
