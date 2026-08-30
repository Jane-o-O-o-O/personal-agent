// Process-level：硬链接别名的威胁模型收口（deny 纯字符串比对语义）。
//
// deny 为纯路径形状比对：硬链接别名 `alias.rsa` 的字符串路径在 roots 内且
// 不命中任何 deny 形状 → 放行（防同 UID 本地攻击者不属威胁模型）。同名的
// `id_rsa` 形状仍按路径命中 `**/id_rsa` 拒绝。
#[cfg(all(unix, feature = "custom-endpoint"))]
#[test]
fn run() {
    let cwd = tempfile::tempdir().unwrap();
    let cfg_dir = tempfile::tempdir().unwrap();
    let fake_home = tempfile::tempdir().unwrap();
    seed_credentials(cfg_dir.path());

    #[allow(clippy::disallowed_methods)] // 测试夹具：伪造凭据 + 硬链接别名。
    {
        std::fs::create_dir_all(fake_home.path().join(".ssh")).unwrap();
        std::fs::write(fake_home.path().join(".ssh/id_rsa"), b"fake-private-key").unwrap();
        std::fs::write(cwd.path().join("note.txt"), b"note").unwrap();
        // 硬链接别名：cwd 与伪造 HOME 同为临时目录（同文件系统）。
        std::fs::hard_link(
            fake_home.path().join(".ssh/id_rsa"),
            cwd.path().join("alias.rsa"),
        )
        .unwrap();
        // 形状命中样本：cwd 内直接命名 id_rsa（内容无关）。
        std::fs::write(cwd.path().join("id_rsa"), b"fake-key-by-name").unwrap();
    }

    let rt = tokio::runtime::Runtime::new().unwrap();
    let (server_url, mocks, upload, _server) = rt.block_on(async {
        let mut server = Server::new_async().await;
        let mocks = setup_sandbox_mocks(&mut server).await;
        // 上传链路：① 对照组与 ② 别名各命中 1 次（③ 在 resolve 阶段被拒）。
        let upload = server
            .mock("POST", "/file/upload")
            .expect(2)
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(api_response(&json!({ "media_id": "M_OK" })))
            .create_async()
            .await;
        (server.url(), mocks, upload, server)
    });

    let run_wecom = |args: &[&str]| {
        assert_cmd::Command::cargo_bin("wecom-cli")
            .unwrap()
            .current_dir(cwd.path())
            .env("WECOM_CLI_BASE_URL", &server_url)
            .env("WECOM_CLI_CONFIG_DIR", cfg_dir.path())
            .env("HOME", fake_home.path())
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
    let upload_media = |path: &std::path::Path| {
        let media = json!({ "media": path.to_string_lossy() }).to_string();
        run_wecom(&["files", "send", "--json", &media])
    };

    // ① 对照：cwd 内正常文件上传 → 允许
    upload_media(&cwd.path().join("note.txt")).success();

    // ② 硬链接别名 → 纯字符串比对不命中任何 deny 形状 → 放行
    // （接受的残留风险：同 UID 本地攻击者不在威胁模型内）
    upload_media(&cwd.path().join("alias.rsa")).success();

    // ③ 形状命中：cwd 内直接命名 id_rsa → `**/id_rsa` 形状拒绝
    let out = upload_media(&cwd.path().join("id_rsa"))
        .failure()
        .get_output()
        .clone();
    let text = combined(&out);
    assert!(text.contains("安全策略保护"), "combined = {text}");

    // 上传端点仅 ①② 命中 2 次。
    rt.block_on(async {
        upload.assert_async().await;
    });
    drop(mocks);
}
