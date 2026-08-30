use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, KeyInit};
use base64::prelude::*;

/// 预置加密凭据：`.encryption_key` + `credentials.enc`（AES-256-GCM 加密的
/// `{"bot":null,"token":"test-token"}`），使 CLI 方法调用能注入 Bearer token。
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
// 锁定 WorkspaceFs 的边界：读写同 roots=[cwd, 固定临时目录]（下载默认落盘
// cwd），config_dir 叠加 prefix deny，推荐 deny 表双向生效。
#[cfg(feature = "custom-endpoint")]
#[test]
fn run() {
    let cwd = tempfile::tempdir().unwrap();
    let cfg_dir = tempfile::tempdir().unwrap();
    // “tmp 属 roots 内”的对照样本必须落在 CLI 的固定临时目录 root 下——
    // 不能用 tempfile::tempdir()（macOS 上落在 /var/folders，恰在 root 之外）。
    let outside = tempfile::tempdir_in(pinned_temp_root()).unwrap();
    seed_credentials(cfg_dir.path());

    // 读侧输入：放在固定临时目录下（cwd 之外、roots 之内）。
    #[allow(clippy::disallowed_methods)] // Test fixture: prepare the input file outside any sandbox
    let pic = outside.path().join("pic.bin");
    #[allow(clippy::disallowed_methods)]
    // Test fixture: prepare the input file outside any sandbox
    std::fs::write(&pic, b"fake-image-bytes").unwrap();

    let rt = tokio::runtime::Runtime::new().unwrap();
    let (server_url, _keep) = rt.block_on(async {
        let mut server = Server::new_async().await;

        // discovery：catalog 含 hr 与 files 两个服务。
        let catalog = server
            .mock("POST", "/service/discovery")
            .match_body(Matcher::Json(payload_wrap(&json!({}))))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(api_response(&json!({
                "items": [
                    { "name": "hr", "description": "Human Resources" },
                    { "name": "files", "description": "File transfer" }
                ]
            })))
            .create_async()
            .await;
        let hr = server
            .mock("POST", "/service/discovery")
            .match_body(Matcher::Json(payload_wrap(&json!({"service": "hr"}))))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(hr_service_body(&server.url()))
            .create_async()
            .await;
        // files 服务：send 方法的 media 字段标记 x-wecom-file-upload。
        let files = server
            .mock("POST", "/service/discovery")
            .match_body(Matcher::Json(payload_wrap(&json!({"service": "files"}))))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(api_response(&json!({
                "description": "File transfer service",
                "base_url": server.url(),
                "schemas": {
                    "SendReq": {
                        "type": "object",
                        "properties": {
                            "media": { "type": "string", "x-wecom-file-upload": true }
                        }
                    },
                    "SendRes": { "type": "object" }
                },
                "methods": {
                    "send": {
                        "path": "/send",
                        "http_method": "POST",
                        "request": { "$ref": "SendReq" },
                        "response": { "$ref": "SendRes" }
                    }
                },
                "resources": {}
            })))
            .create_async()
            .await;
        let upload = server
            .mock("POST", "/file/upload")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(api_response(&json!({ "media_id": "M_OK" })))
            .create_async()
            .await;
        let send = setup_method_mock(&mut server, "/send", &api_response(&json!({}))).await;
        let method = setup_method_mock(
            &mut server,
            "/department/list",
            &api_response(&json!({"departments": []})),
        )
        .await;
        (
            server.url(),
            (server, catalog, hr, files, upload, send, method),
        )
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

    // 1. 写 cwd 内（roots 内）：允许
    let ok = cwd.path().join("ok.json");
    run_wecom(&["hr", "department", "list", "--output", ok.to_str().unwrap()]).success();
    assert!(ok.exists());

    // 2. 写固定临时目录（roots 内，读写对称）：允许
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

    // 3. 写 roots 外：拒绝，目标文件未产生。
    //    目标取测试进程 cwd（crate 目录）——前提：checkout 不在系统临时目录下。
    assert_escape(
        &[
            "hr",
            "department",
            "list",
            "--output",
            std::env::current_dir()
                .unwrap()
                .join("escape.json")
                .to_str()
                .unwrap(),
        ],
        &std::env::current_dir().unwrap().join("escape.json"),
    );

    // 4. 写 CLI 配置目录（config_dir 经 prefix deny 屏蔽，deny 压过 allow）：拒绝
    let poison = cfg_dir.path().join("poison.json");
    let assert = run_wecom(&[
        "hr",
        "department",
        "list",
        "--output",
        poison.to_str().unwrap(),
    ]);
    let output = assert.failure().get_output().clone();
    let text = combined(&output);
    assert!(text.contains("安全策略保护"), "combined = {text}");
    assert!(!poison.exists());

    // 5. 读固定临时目录（roots 内）：放行，上传链路走通
    run_wecom(&[
        "files",
        "send",
        "--json",
        &json!({ "media": pic.to_string_lossy() }).to_string(),
    ])
    .success();

    // 6. 读推荐 deny 表内的系统路径（Unix）：拒绝（deny 双向生效，roots 不放大外泄面）
    #[cfg(unix)]
    {
        let assert = run_wecom(&[
            "files",
            "send",
            "--json",
            &json!({ "media": "/etc/hosts" }).to_string(),
        ]);
        let output = assert.failure().get_output().clone();
        let text = combined(&output);
        assert!(text.contains("安全策略保护"), "combined = {text}");
    }
}
