use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, KeyInit};
use base64::prelude::*;

/// 与 `main.rs` 的 `pinned_temp_dir()` 同口径的测试侧取值（bin crate 内部不可被
/// 集成测试 import，此处保持同构的小段重复）。
#[cfg(all(feature = "custom-endpoint", unix))]
fn pinned_temp_root() -> std::path::PathBuf {
    std::path::PathBuf::from("/tmp")
}

/// Windows：账户的 LocalAppData\Temp（Known Folder API，不受 TMP/TEMP 影响）。
#[cfg(all(feature = "custom-endpoint", windows))]
fn pinned_temp_root() -> std::path::PathBuf {
    dirs::data_local_dir().unwrap().join("Temp")
}

/// 预置加密凭据：`.encryption_key` + `credentials.enc`（AES-256-GCM 加密的
/// `{"bot":null,"token":"test-token"}`），使 CLI 方法调用能注入 Bearer token。
#[cfg(feature = "custom-endpoint")]
fn seed_credentials(dir: &std::path::Path) {
    let key: [u8; 32] = *b"0123456789abcdef0123456789abcdef";
    #[allow(clippy::disallowed_methods)] // 测试写入临时目录。
    std::fs::write(dir.join(".encryption_key"), BASE64_STANDARD.encode(key)).unwrap();

    let cipher = Aes256Gcm::new_from_slice(&key).unwrap();
    let nonce_bytes: [u8; 12] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    let mut out = nonce_bytes.to_vec();
    let nonce = aes_gcm::Nonce::from(nonce_bytes);
    let ciphertext = cipher
        .encrypt(&nonce, br#"{"bot":null,"token":"test-token"}"#.as_slice())
        .unwrap();
    out.extend(ciphertext);
    #[allow(clippy::disallowed_methods)] // 测试写入临时目录。
    std::fs::write(dir.join("credentials.enc"), out).unwrap();
}

// Process-level: main.rs 的 PrivateFs / WorkspaceFs 双实例接线只在真实二进制入口生效。
//
// 多组断言共享一个 mock server：后续调用命中第 1 次写入的
// discovery 缓存（CLI 私有域路径，间接验证 PrivateFs 实例可用），
// 且路径拒绝发生在方法请求之前（method mock 仅前两次放行命中）。
#[cfg(feature = "custom-endpoint")]
#[test]
fn run() {
    let cwd = tempfile::tempdir().unwrap();
    let cfg_dir = tempfile::tempdir().unwrap();
    // “tmp 属 roots 内”的对照样本必须落在 CLI 的固定临时目录 root 下——
    // 不能用 tempfile::tempdir()（macOS 上落在 /var/folders，恰在 root 之外）。
    let outside = tempfile::tempdir_in(pinned_temp_root()).unwrap();
    seed_credentials(cfg_dir.path());

    let rt = tokio::runtime::Runtime::new().unwrap();
    let (server_url, _keep) = rt.block_on(async {
        let mut server = Server::new_async().await;
        let (catalog, hr) = setup_discovery_mocks(&mut server).await;
        let method = setup_method_mock(
            &mut server,
            "/department/list",
            &api_response(&json!({"departments": []})),
        )
        .await;
        (server.url(), (server, catalog, hr, method))
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

    // 1. cwd 内写（external）：允许
    run_wecom(&["hr", "department", "list", "--output", "./ok.json"]).success();
    assert!(cwd.path().join("ok.json").exists());

    // 2. 固定临时目录内写（external，tmp 属默认 roots）：允许
    let in_tmp = outside.path().join("in-tmp.json");
    run_wecom(&[
        "hr",
        "department",
        "list",
        "--output",
        in_tmp.to_str().unwrap(),
    ])
    .success();
    assert!(in_tmp.exists());

    // 3. roots 外写（external）：拒绝，目标文件未产生。
    //    目标取测试进程 cwd（crate 目录）——前提：checkout 不在系统临时目录下。
    let escaped = std::env::current_dir().unwrap().join("escaped.json");
    let assert = run_wecom(&[
        "hr",
        "department",
        "list",
        "--output",
        escaped.to_str().unwrap(),
    ]);
    let output = assert.failure().get_output().clone();
    let combined = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        combined.contains("目标路径超出可访问范围"),
        "combined = {combined}"
    );
    assert!(!escaped.exists());

    // 3. 内置 denylist（Unix）：/etc 下写被拒绝，目标文件未产生
    #[cfg(unix)]
    {
        let denied = "/etc/wecom-sandbox-probe.json";
        let assert = run_wecom(&["hr", "department", "list", "--output", denied]);
        let output = assert.failure().get_output().clone();
        let combined = format!(
            "{}{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        assert!(combined.contains("安全策略保护"), "combined = {combined}");
        assert!(!Path::new(denied).exists());
    }

    // 4. 内置 denylist（Windows）：SystemRoot 下写被拒绝，目标文件未产生
    #[cfg(windows)]
    {
        // 不硬编码 C:\Windows：SystemRoot 指向真实 Windows 目录（CI 机器可能非常规盘符），
        // 硬编码会落到 roots 拒绝（报错文本不符）而响亮失败。
        let root = std::env::var("SystemRoot").unwrap_or_else(|_| r"C:\Windows".to_string());
        let denied = format!(r"{root}\wecom-sandbox-probe.json");
        let assert = run_wecom(&["hr", "department", "list", "--output", &denied]);
        let output = assert.failure().get_output().clone();
        let combined = format!(
            "{}{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        assert!(combined.contains("安全策略保护"), "combined = {combined}");
        assert!(!Path::new(&denied).exists());
    }
}
