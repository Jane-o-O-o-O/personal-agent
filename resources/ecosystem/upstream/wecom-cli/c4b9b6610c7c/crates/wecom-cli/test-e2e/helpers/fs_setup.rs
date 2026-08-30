// Used by config tests gated behind feature flags.
#![allow(dead_code)]

use std::path::Path;

/// Write a `config.json` file in the given directory.
pub fn setup_config_json(dir: &Path, config: &serde_json::Value) {
    #[allow(clippy::disallowed_methods)]
    // Test fixture: writing to tempdir, not through CLI sandbox.
    std::fs::write(
        dir.join("config.json"),
        serde_json::to_string_pretty(config).unwrap(),
    )
    .unwrap();
}

/// 预置加密凭据：`.encryption_key` + `credentials.enc`（AES-256-GCM 加密的
/// `{"bot":null,"token":"test-token"}`），使 CLI 方法调用能注入 Bearer token。
#[cfg(feature = "custom-endpoint")]
pub fn seed_credentials(dir: &Path) {
    use aes_gcm::aead::Aead;
    use aes_gcm::{Aes256Gcm, KeyInit};
    use base64::prelude::*;

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
