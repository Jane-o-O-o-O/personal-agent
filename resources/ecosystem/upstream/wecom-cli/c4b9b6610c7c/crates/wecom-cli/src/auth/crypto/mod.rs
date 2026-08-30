//! Crypto utilities for secure credential storage.
//!
//! AES-256-GCM 加密（随机 nonce，输出 `nonce || ciphertext || tag`），
//! 密钥经系统 keyring 持久化、文件回退，详见 [`keystore`]。

mod cipher;
mod keystore;

pub(crate) use keystore::{
    encrypt_data, generate_random_key, load_existing_key, save_key, try_decrypt_data,
};

use std::path::Path;

use wecom_fs::Fs;

use crate::Result;

/// Atomically write `data` (bytes) to `path` (temp file in the same directory → atomic rename).
///
/// 委托 `wecom-fs` 的 [`Fs::atomic_write`]
/// （temp → fsync → rename，persist 前设置权限）。`SandboxedFs::new` 不带根列表
/// 即非沙箱模式：凭据/密钥为 app 内部存储，不经用户沙箱。
pub(crate) async fn atomic_write(path: &Path, data: &[u8], mode: u32) -> Result<()> {
    wecom_fs::SandboxedFs::new()
        .atomic_write(path, data, Some(mode))
        .await?;
    Ok(())
}
