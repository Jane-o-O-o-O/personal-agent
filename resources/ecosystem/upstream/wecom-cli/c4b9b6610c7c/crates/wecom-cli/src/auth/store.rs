//! 本地凭据总账持久化：bot 信息与 Bearer token 共存于单一加密文件（`credentials.enc`）。

use std::fs;
use std::path::PathBuf;

use crate::Result;
use crate::config::default_home_dir;

use super::crypto;
use super::types::Credentials;

/// Return the file path for the encrypted credentials file.
///
/// 路径受 `WECOM_CLI_CONFIG_DIR` 控制（见 [`default_home_dir`]）。
pub fn credentials_path() -> PathBuf {
    default_home_dir().join("credentials.enc")
}

/// 旧版独立凭据文件（`bot.enc` / `token.enc`）路径。
///
/// 凭据统一存放于 `credentials.enc`；旧文件**不主动清理**——仅由
/// [`crate::auth::legacy_migration`] 在迁移时读取，迁移完成后保留
/// （残留无功能影响：读取全走 `credentials.enc`，同密钥加密无安全差异）。
pub(crate) fn legacy_paths() -> [PathBuf; 2] {
    let dir = default_home_dir();
    [dir.join("bot.enc"), dir.join("token.enc")]
}

/// Read the credentials file. Returns `None` when the file is absent or
/// cannot be decrypted.
#[allow(clippy::disallowed_methods)]
pub fn load_credentials() -> Option<Credentials> {
    let path = credentials_path();
    let data = fs::read(&path).ok()?;
    crypto::try_decrypt_data(&data)
        .inspect_err(
            |e| tracing::warn!(path = %path.display(), error = %e, "failed to decrypt credentials"),
        )
        .ok()
}

/// Encrypt and persist the credentials file.
///
/// bot 与 token 均为空时删除文件（避免残留空凭据文件）。
pub async fn save_credentials(creds: &Credentials) -> Result<()> {
    if creds.bot.is_none() && creds.token.is_none() {
        return clear_credentials();
    }
    let key = crypto::load_existing_key().unwrap_or_else(|| {
        let k = crypto::generate_random_key();
        tracing::info!("generated a new encryption key");
        k
    });
    crypto::save_key(&key).await?;
    let encrypted = crypto::encrypt_data(creds, &key)?;
    crypto::atomic_write(&credentials_path(), &encrypted, 0o600).await?;
    tracing::info!("credentials saved");
    Ok(())
}

/// Remove the credentials file (no-op when absent).
#[allow(clippy::disallowed_methods)]
pub fn clear_credentials() -> Result<()> {
    let path = credentials_path();
    if path.exists() {
        fs::remove_file(&path)?;
        tracing::info!("credentials file removed: {}", path.display());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：store（本地凭据总账持久化）
    //!
    //! ### 关键接口
    //! - [Credentials] — bot 信息与 Bearer token 共存的联合结构（见 [`super::types`]）
    //! - [load_credentials] — 读取凭据文件（缺失/解密失败返回 None）
    //! - [save_credentials] — 加密落盘；bot 与 token 皆空时删除文件
    //! - [clear_credentials] — 删除凭据文件（缺失时 no-op）
    //! - [legacy_paths] — 旧版凭据文件路径（**不主动清理**）
    //!
    //! ### 关键分支与异常路径
    //! - 文件缺失 / 密文损坏 / 密钥不符 → load 返回 None
    //! - bot 与 token 均空 → save 删除文件而非写入
    //! - 独立 `bot.enc` / `token.enc` → 永不主动删除，仅迁移读取
    //!
    //! ### 上下游交互
    //! - 上游：`auth init` 等命令经 [save_credentials] 写入
    //! - 下游：`auth::resolve::resolve_authorization` / `auth::session` 读取

    use base64::prelude::*;

    use super::*;
    use crate::auth::types::Bot;

    /// 在临时 `WECOM_CLI_CONFIG_DIR` 下执行异步闭包（按值传入路径，避免借用跨 await），结束后清理环境变量。
    ///
    /// 使用 `crate::env::TEST_ENV_LOCK` 进程级共享锁，与其它修改全局环境变量的测试互斥。
    async fn with_temp_dir<T, Fut: std::future::Future<Output = T>>(
        f: impl FnOnce(std::path::PathBuf) -> Fut,
    ) -> T {
        let _guard = crate::env::TEST_ENV_LOCK.lock().await;
        let dir = tempfile::tempdir().unwrap();
        // 测试专用：设置/清理全局环境变量（Rust 2024 下为 unsafe）。
        unsafe {
            std::env::set_var("WECOM_CLI_CONFIG_DIR", dir.path());
        }
        let r = f(dir.path().to_path_buf()).await;
        unsafe {
            std::env::remove_var("WECOM_CLI_CONFIG_DIR");
        }
        r
    }

    /// 手动写 `.encryption_key`（base64 编码），使文件 key 就位、隔离 keyring。
    fn write_key(dir: &std::path::Path, key: &[u8; 32]) {
        #[allow(clippy::disallowed_methods)] // 测试写入临时目录。
        std::fs::write(dir.join(".encryption_key"), BASE64_STANDARD.encode(key)).unwrap();
    }

    fn fresh_key() -> [u8; 32] {
        crypto::generate_random_key()
    }

    /// P0：bot + token 保存后可完整读回
    /// 条件：临时目录内就位密钥，保存含 bot 与 token 的凭据
    /// 断言：load 返回的 bot.id 与 token 与保存值一致
    #[tokio::test]
    async fn credentials_save_load_roundtrip() {
        with_temp_dir(|dir| async move {
            write_key(&dir, &fresh_key());
            let bot = Bot::new("bot1".into(), "secret1".into());
            let creds = Credentials {
                bot: Some(bot),
                token: Some("tok-1".into()),
            };
            save_credentials(&creds).await.unwrap();
            let loaded = load_credentials().unwrap();
            assert_eq!(loaded.bot.as_ref().map(|b| b.id.as_str()), Some("bot1"));
            assert_eq!(loaded.token.as_deref(), Some("tok-1"));
        })
        .await;
    }

    /// P0：bot 与 token 均为空时删除凭据文件
    /// 条件：临时目录内保存默认（空）凭据
    /// 断言：credentials.enc 不存在
    #[tokio::test]
    async fn save_empty_creds_deletes_file() {
        with_temp_dir(|dir| async move {
            write_key(&dir, &fresh_key());
            save_credentials(&Credentials::default()).await.unwrap();
            assert!(!dir.join("credentials.enc").exists());
        })
        .await;
    }

    /// P0：bot 与 token 可独立更新互不影响
    /// 条件：先只保存 bot，再只保存 token，两次 save 覆盖
    /// 断言：最终 load 同时包含 bot2 与 tok-2
    #[tokio::test]
    async fn bot_and_token_independent() {
        with_temp_dir(|dir| async move {
            write_key(&dir, &fresh_key());
            let mut c = load_credentials().unwrap_or_default();
            c.bot = Some(Bot::new("bot2".into(), "s2".into()));
            save_credentials(&c).await.unwrap();
            let mut c = load_credentials().unwrap_or_default();
            c.token = Some("tok-2".into());
            save_credentials(&c).await.unwrap();
            let loaded = load_credentials().unwrap();
            assert_eq!(loaded.bot.as_ref().map(|b| b.id.as_str()), Some("bot2"));
            assert_eq!(loaded.token.as_deref(), Some("tok-2"));
        })
        .await;
    }

    /// P0：clear 删除已存在的凭据文件
    /// 条件：保存含 bot 与 token 的凭据后调用 clear_credentials
    /// 断言：credentials.enc 被删除
    #[tokio::test]
    async fn clear_all_deletes_file() {
        with_temp_dir(|dir| async move {
            write_key(&dir, &fresh_key());
            let mut c = load_credentials().unwrap_or_default();
            c.bot = Some(Bot::new("bot4".into(), "s4".into()));
            c.token = Some("tok-4".into());
            save_credentials(&c).await.unwrap();
            clear_credentials().unwrap();
            assert!(!dir.join("credentials.enc").exists());
        })
        .await;
    }

    /// P1：clear 对不存在的文件为 no-op
    /// 条件：未保存任何凭据直接调用 clear_credentials
    /// 断言：返回 Ok，credentials.enc 仍不存在
    #[tokio::test]
    async fn clear_missing_file_noop() {
        with_temp_dir(|dir| async move {
            clear_credentials().unwrap();
            assert!(!dir.join("credentials.enc").exists());
        })
        .await;
    }

    /// P0：无 credentials.enc 时 load 不清除 legacy（迁移失败场景，legacy 是唯一凭据来源）
    /// 条件：预置 bot.enc 与 token.enc，无新凭据文件
    /// 断言：load 返回 None，独立文件**保留**
    #[tokio::test]
    async fn legacy_files_kept_when_no_credentials() {
        with_temp_dir(|dir| async move {
            write_key(&dir, &fresh_key());
            // 预置独立凭据文件（内容任意，仅验证未被清理）。
            #[allow(clippy::disallowed_methods)] // 测试写入临时目录。
            std::fs::write(dir.join("bot.enc"), b"legacy-bot").unwrap();
            #[allow(clippy::disallowed_methods)] // 测试写入临时目录。
            std::fs::write(dir.join("token.enc"), b"legacy-token").unwrap();

            assert!(load_credentials().is_none());
            assert!(dir.join("bot.enc").exists(), "legacy must be kept");
            assert!(dir.join("token.enc").exists(), "legacy must be kept");
        })
        .await;
    }

    /// P0：credentials.enc 已就位时 load/save 也不清理 legacy
    /// 条件：保存新凭据 + 手动放置 legacy 文件
    /// 断言：load 成功，独立文件**保留**
    #[tokio::test]
    async fn legacy_files_kept_even_with_credentials() {
        with_temp_dir(|dir| async move {
            write_key(&dir, &fresh_key());
            let mut c = load_credentials().unwrap_or_default();
            c.bot = Some(Bot::new("bot1".into(), "s1".into()));
            c.token = Some("tok-1".into());
            save_credentials(&c).await.unwrap();

            // save 后手动放置 legacy（模拟迁移完成后仍残留的场景）。
            #[allow(clippy::disallowed_methods)] // 测试写入临时目录。
            std::fs::write(dir.join("bot.enc"), b"legacy-bot").unwrap();
            #[allow(clippy::disallowed_methods)] // 测试写入临时目录。
            std::fs::write(dir.join("token.enc"), b"legacy-token").unwrap();

            assert!(load_credentials().is_some());
            assert!(dir.join("bot.enc").exists(), "legacy must be kept");
            assert!(dir.join("token.enc").exists(), "legacy must be kept");
        })
        .await;
    }

    /// P1：凭据文件缺失时 load 返回 None
    /// 条件：临时目录内未写入任何凭据文件
    /// 断言：load_credentials() 返回 None
    #[tokio::test]
    async fn load_missing_returns_none() {
        with_temp_dir(|_dir| async move {
            assert!(load_credentials().is_none());
        })
        .await;
    }

    /// P1：凭据文件内容损坏时 load 返回 None
    /// 条件：凭据文件写入非法密文
    /// 断言：load_credentials() 返回 None 且不 panic
    #[tokio::test]
    async fn load_corrupted_returns_none() {
        with_temp_dir(|dir| async move {
            write_key(&dir, &fresh_key());
            #[allow(clippy::disallowed_methods)] // 测试写入临时目录。
            std::fs::write(dir.join("credentials.enc"), b"garbage").unwrap();
            assert!(load_credentials().is_none());
        })
        .await;
    }

    /// P1：密钥不符时 token 读取返回 None
    /// 条件：用密钥 A 保存凭据后，将本地密钥替换为密钥 B
    /// 断言：load_credentials() 返回 None（密文无法解密）
    #[tokio::test]
    async fn wrong_key_returns_none() {
        with_temp_dir(|dir| async move {
            let key_a = fresh_key();
            let key_b = fresh_key();
            write_key(&dir, &key_a);
            let mut c = load_credentials().unwrap_or_default();
            c.token = Some("tok-secret".into());
            save_credentials(&c).await.unwrap();

            write_key(&dir, &key_b); // 替换密钥 → 密文无法解密
            assert!(load_credentials().is_none());
        })
        .await;
    }

    /// P1：初始化失败回滚清空凭据
    /// 条件：保存含 bot 与 token 的凭据后，模拟 handle_init 失败执行回滚
    /// 断言：文件删除，bot 与 token 读取均为 None
    #[tokio::test]
    async fn rollback_clears_credentials() {
        with_temp_dir(|dir| async move {
            write_key(&dir, &fresh_key());
            let mut c = load_credentials().unwrap_or_default();
            c.bot = Some(Bot::new("bot5".into(), "s5".into()));
            c.token = Some("tok-5".into());
            save_credentials(&c).await.unwrap();
            // 模拟 handle_init 失败回滚：清空凭据。
            clear_credentials().unwrap();
            assert!(!dir.join("credentials.enc").exists());
            assert!(load_credentials().and_then(|c| c.bot).is_none());
            assert!(load_credentials().and_then(|c| c.token).is_none());
        })
        .await;
    }
}
