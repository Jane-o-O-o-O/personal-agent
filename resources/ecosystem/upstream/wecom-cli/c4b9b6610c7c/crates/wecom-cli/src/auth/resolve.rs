//! 授权材料解析：env 优先、凭据文件 `credentials.enc` 回退。

use super::store::load_credentials;
use super::types::ResolvedAuthorization;

/// 解析当前生效的授权材料：`WECOM_CLI_ACCESS_TOKEN` 环境变量优先
/// （首尾空白会剥离，空白串视为未设置），缺省回退
/// `credentials.enc`；文件来源连同同源 bot 凭据一并返回（同一次读盘解析）。
///
/// 文件来源但无 token 时 `token()` 为 `None`（保留同源 bot 供 853004 刷新）；
/// 文件不存在 / 解密失败 / 文件与 env 均无内容时返回 `None`（未授权）；
/// 凭据文件存在但 bot 与 token 皆为空时同样视为未授权。
pub fn resolve_authorization() -> Option<ResolvedAuthorization> {
    // 环境变量覆盖优先，否则回退凭据文件。
    if let Some(token) = std::env::var(crate::env::ACCESS_TOKEN)
        .ok()
        .map(|t| t.trim().to_owned())
        .filter(|t| !t.is_empty())
    {
        return Some(ResolvedAuthorization::Env { token });
    }
    // 空凭据（bot/token 皆为 None）等同未授权：折叠为 None，保证
    // `Option::is_some()` 可直接作为「已授权」判据。
    load_credentials()
        .filter(|c| c.bot.is_some() || c.token.is_some())
        .map(ResolvedAuthorization::Credentials)
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：授权材料解析（resolve_authorization）
    //!
    //! ### 关键接口
    //! - [ResolvedAuthorization] — 授权材料及其来源（Env / Credentials，见 [`super::types`]）
    //! - [resolve_authorization] — env 优先、文件回退的授权材料解析
    //!
    //! ### 关键分支与异常路径
    //! - `WECOM_CLI_ACCESS_TOKEN` 非空 → 来源 Env，覆盖文件 token（首尾空白剥离）
    //! - `WECOM_CLI_ACCESS_TOKEN` 为空串/空白串 → 视为未设置，回退文件
    //! - 文件仅有 bot 无 token → token 为 None，保留同源 bot 供 853004 刷新
    //! - 文件与 env 均无内容 → None（未授权）

    use super::*;
    use crate::auth::store::{load_credentials, save_credentials};
    use crate::auth::types::{Bot, Credentials};

    /// 在隔离凭据目录内就位随机密钥（.encryption_key 文件）。
    fn write_temp_key(dir: &std::path::Path) {
        use base64::prelude::*;
        #[allow(clippy::disallowed_methods)] // 测试写入临时目录。
        std::fs::write(
            dir.join(".encryption_key"),
            BASE64_STANDARD.encode(super::super::crypto::generate_random_key()),
        )
        .unwrap();
    }

    async fn save(dir_creds: Credentials) {
        save_credentials(&dir_creds).await.unwrap();
    }

    /// P0：WECOM_CLI_ACCESS_TOKEN 覆盖凭据文件 token，来源为 Env
    /// 条件：设置 WECOM_CLI_ACCESS_TOKEN=env-tok，隔离凭据目录（无凭据文件）
    /// 断言：resolve_authorization() 返回 token=Some(env-tok)、source=Env
    #[tokio::test]
    async fn env_token_overrides_file_token() {
        let _guard = crate::env::TEST_ENV_LOCK.lock().await;
        let dir = tempfile::tempdir().unwrap();
        unsafe {
            std::env::set_var(crate::env::CONFIG_DIR, dir.path());
            std::env::set_var(crate::env::ACCESS_TOKEN, "env-tok");
        }
        let r = resolve_authorization();
        unsafe {
            std::env::remove_var(crate::env::ACCESS_TOKEN);
            std::env::remove_var(crate::env::CONFIG_DIR);
        }
        let r = r.expect("env token should resolve");
        assert_eq!(r.token(), Some("env-tok"));
        assert!(matches!(r, ResolvedAuthorization::Env { .. }));
    }

    /// P1：环境变量为空串时回退凭据文件（无凭据 → None）
    /// 条件：WECOM_CLI_ACCESS_TOKEN=""，隔离凭据目录（无凭据文件）
    /// 断言：resolve_authorization() == None（空环境变量不生效，走回退路径）
    #[tokio::test]
    async fn empty_env_token_falls_back_to_file() {
        let _guard = crate::env::TEST_ENV_LOCK.lock().await;
        let dir = tempfile::tempdir().unwrap();
        unsafe {
            std::env::set_var(crate::env::CONFIG_DIR, dir.path());
            std::env::set_var(crate::env::ACCESS_TOKEN, "");
        }
        let r = resolve_authorization();
        unsafe {
            std::env::remove_var(crate::env::ACCESS_TOKEN);
            std::env::remove_var(crate::env::CONFIG_DIR);
        }
        assert!(r.is_none());
    }

    /// P0：未设置环境变量时来源为 Credentials，并携带同源 bot 凭据
    /// 条件：隔离凭据目录内就位密钥并保存 bot+token，未设置 WECOM_CLI_ACCESS_TOKEN
    /// 断言：resolve_authorization() 返回 token=Some(file-tok)、bot=Some(bot1)
    #[tokio::test]
    async fn file_token_source_is_credentials() {
        let _guard = crate::env::TEST_ENV_LOCK.lock().await;
        let dir = tempfile::tempdir().unwrap();
        unsafe {
            std::env::set_var(crate::env::CONFIG_DIR, dir.path());
            std::env::remove_var(crate::env::ACCESS_TOKEN);
        }
        write_temp_key(dir.path());
        let mut creds = load_credentials().unwrap_or_default();
        creds.bot = Some(Bot::new("bot1".into(), "s1".into()));
        creds.token = Some("file-tok".into());
        save(creds).await;

        let r = resolve_authorization();
        unsafe {
            std::env::remove_var(crate::env::CONFIG_DIR);
        }
        let r = r.expect("file token should resolve");
        assert_eq!(r.token(), Some("file-tok"));
        match r {
            ResolvedAuthorization::Credentials(creds) => {
                assert_eq!(creds.bot.map(|b| b.id).as_deref(), Some("bot1"));
            }
            other => panic!("expected Credentials source, got {other:?}"),
        }
    }

    /// P1：环境变量为空白串时回退凭据文件（无凭据 → None）
    /// 条件：WECOM_CLI_ACCESS_TOKEN="  \n"，隔离凭据目录（无凭据文件）
    /// 断言：resolve_authorization() == None（空白环境变量不生效，走回退路径）
    #[tokio::test]
    async fn whitespace_env_token_falls_back_to_file() {
        let _guard = crate::env::TEST_ENV_LOCK.lock().await;
        let dir = tempfile::tempdir().unwrap();
        unsafe {
            std::env::set_var(crate::env::CONFIG_DIR, dir.path());
            std::env::set_var(crate::env::ACCESS_TOKEN, "  \n");
        }
        let r = resolve_authorization();
        unsafe {
            std::env::remove_var(crate::env::ACCESS_TOKEN);
            std::env::remove_var(crate::env::CONFIG_DIR);
        }
        assert!(r.is_none());
    }

    /// P1：环境变量 token 的首尾空白被剥离
    /// 条件：WECOM_CLI_ACCESS_TOKEN="  env-tok \n"，隔离凭据目录（无凭据文件）
    /// 断言：resolve_authorization() 返回 token=Some(env-tok)（无首尾空白）、source=Env
    #[tokio::test]
    async fn env_token_is_trimmed() {
        let _guard = crate::env::TEST_ENV_LOCK.lock().await;
        let dir = tempfile::tempdir().unwrap();
        unsafe {
            std::env::set_var(crate::env::CONFIG_DIR, dir.path());
            std::env::set_var(crate::env::ACCESS_TOKEN, "  env-tok \n");
        }
        let r = resolve_authorization();
        unsafe {
            std::env::remove_var(crate::env::ACCESS_TOKEN);
            std::env::remove_var(crate::env::CONFIG_DIR);
        }
        let r = r.expect("env token should resolve");
        assert_eq!(r.token(), Some("env-tok"));
        assert!(matches!(r, ResolvedAuthorization::Env { .. }));
    }

    /// P1：凭据文件存在但 bot 与 token 皆为空 → None（未授权）
    /// 条件：隔离凭据目录内就位密钥并保存空凭据，未设置 WECOM_CLI_ACCESS_TOKEN
    /// 断言：resolve_authorization() 返回 None
    #[tokio::test]
    async fn empty_credentials_resolve_to_none() {
        let _guard = crate::env::TEST_ENV_LOCK.lock().await;
        let dir = tempfile::tempdir().unwrap();
        unsafe {
            std::env::set_var(crate::env::CONFIG_DIR, dir.path());
            std::env::remove_var(crate::env::ACCESS_TOKEN);
        }
        write_temp_key(dir.path());
        save(Credentials::default()).await;

        let r = resolve_authorization();
        unsafe {
            std::env::remove_var(crate::env::CONFIG_DIR);
        }
        assert!(r.is_none(), "空凭据应折叠为 None（未授权）");
    }

    /// P0：凭据文件仅有 bot 无 token 时 token 为 None，但保留同源 bot 供刷新
    /// 条件：隔离凭据目录内保存仅含 bot 的凭据，未设置 WECOM_CLI_ACCESS_TOKEN
    /// 断言：resolve_authorization() 返回 token=None、source=Credentials{ bot: Some(bot1) }
    #[tokio::test]
    async fn credentials_without_token_keeps_bot() {
        let _guard = crate::env::TEST_ENV_LOCK.lock().await;
        let dir = tempfile::tempdir().unwrap();
        unsafe {
            std::env::set_var(crate::env::CONFIG_DIR, dir.path());
            std::env::remove_var(crate::env::ACCESS_TOKEN);
        }
        write_temp_key(dir.path());
        let mut creds = load_credentials().unwrap_or_default();
        creds.bot = Some(Bot::new("bot1".into(), "s1".into()));
        save(creds).await;

        let r = resolve_authorization();
        unsafe {
            std::env::remove_var(crate::env::CONFIG_DIR);
        }
        let r = r.expect("bot-only credentials should resolve");
        assert!(r.token().is_none(), "无 token 时应为 None");
        match r {
            ResolvedAuthorization::Credentials(creds) => {
                assert_eq!(creds.bot.map(|b| b.id).as_deref(), Some("bot1"));
            }
            other => panic!("expected Credentials source, got {other:?}"),
        }
    }
}
