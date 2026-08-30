// Process-level: the json repair stderr hint is installed in main.rs.
// Library-level cannot test stderr output.

use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, KeyInit};
use base64::prelude::*;

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

#[cfg(feature = "custom-endpoint")]
#[test]
fn run() {
    let (server_url, server_keep, method_keep) =
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let mut server = Server::new_async().await;
            let (_catalog, _hr) = setup_discovery_mocks(&mut server).await;
            let method = setup_method_mock(
                &mut server,
                "/department/list",
                &api_response(&json!({"departments": []})),
            )
            .await;
            let url = server.url();
            std::mem::forget(_catalog);
            std::mem::forget(_hr);
            (url, server, method)
        });
    // Keep the server and method mock alive for the whole test.
    std::mem::forget(server_keep);
    std::mem::forget(method_keep);

    let tmp = tempfile::tempdir().unwrap();
    seed_credentials(tmp.path());

    let output = assert_cmd::Command::cargo_bin("wecom-cli")
        .unwrap()
        .env("WECOM_CLI_BASE_URL", &server_url)
        .env("WECOM_CLI_CONFIG_DIR", tmp.path())
        .args(["hr", "department", "list", "--json", r#"{bad: "value"}"#])
        .output()
        .unwrap();

    assert!(
        output.status.success(),
        "exit should be 0\nstdout: {}\nstderr: {}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("json repair"),
        "stderr 应含 json repair 提示，got: {stderr}"
    );
}

#[cfg(not(feature = "custom-endpoint"))]
#[test]
#[ignore = "requires custom-endpoint feature"]
fn run() {}
