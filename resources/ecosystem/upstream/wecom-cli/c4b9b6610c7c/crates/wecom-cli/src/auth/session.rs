//! 运行时授权会话：Bearer token 内存缓存 + 853004 静默刷新编排。
//!
//! [`AuthSession`] 是 auth 域唯一的运行时状态持有者：启动时经
//! [`crate::auth::resolve_authorization`] 一次性读入授权材料，之后由
//! `transport::WecomBackend` 在调用时取用（注入 Bearer）；命中 853004
//! 时经 [`AuthSession::refresh`] 用同源 bot 凭据静默换 token（落盘 +
//! 写内存）供调用方重放。

use std::sync::{RwLock, RwLockReadGuard, RwLockWriteGuard};

use wecom_transport::{EndpointHttpExt, Transport};

use super::bootstrap::{BindSource, fetch_auth};
use super::store::{load_credentials, save_credentials};
use super::types::{Bot, ResolvedAuthorization};
use crate::error::Error;

/// 运行时授权会话：生效的授权材料（token + 来源）与刷新串行化。
///
/// 同源语义内聚于 [`ResolvedAuthorization`] 变体：仅
/// [`Credentials`](ResolvedAuthorization::Credentials)（携带同源 bot
/// 凭据）参与 853004 静默刷新；[`Env`](ResolvedAuthorization::Env) 无配套
/// bot，命中 853004 时经 [`RefreshRejection::EnvTokenExpired`] 引导用户
/// 更新环境变量（见 [`Self::refresh`]）。
pub struct AuthSession {
    /// 生效的授权材料（刷新后仅更新 Credentials 变体内的 `token` 字段，来源保持不变）。
    authorization: RwLock<Option<ResolvedAuthorization>>,
    /// 并发刷新合并：同一时刻至多一次换取；后到请求在锁内双检，若并发
    /// 请求已完成刷新则直接复用其结果，不再重复换取（见 [`Self::refresh`]）。
    refresh_lock: tokio::sync::Mutex<()>,
    /// 鉴权引导端点（`transport::build` 时经 [`crate::auth::resolve_auth_endpoint`]
    /// 解析装配——扁平信封 + 抑制注入，token 刷新时复用）。
    auth_endpoint: wecom_transport::Endpoint,
}

// 不输出 bot secret 与缓存 token。
impl std::fmt::Debug for AuthSession {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AuthSession").finish_non_exhaustive()
    }
}

/// 刷新未能产出新 token 的两种结局（区分「不该刷新」与「刷新失败了」）。
#[derive(Debug)]
pub enum RefreshOutcome {
    /// 依授权材料语义判定不应刷新（见 [`RefreshRejection`]）。
    Rejected(RefreshRejection),
    /// 确实尝试了换取但失败（网络 / 后台错误 / 响应缺 token）。
    Failed(Error),
}

/// 刷新不可行的原因（调用方据此决定回传原错误还是替换为友好提示）。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RefreshRejection {
    /// env 来源 token 过期：无配套 bot 无法静默换取，需用户自行更新环境变量。
    EnvTokenExpired,
    /// 无可用的同源 bot 凭据：需重新 `auth init`。
    MissingCredentials,
}

impl RefreshRejection {
    /// 是否应将原始 853004 替换为本提示：
    /// env 来源需引导用户更新变量（`Some`）；缺凭据沿用原始业务错误（`None`）。
    pub fn into_auth_error(self) -> Option<Error> {
        match self {
            Self::EnvTokenExpired => Some(Error::Auth(format!(
                "{} 已过期，请更新该环境变量后重试",
                crate::env::ACCESS_TOKEN
            ))),
            Self::MissingCredentials => None,
        }
    }
}

impl AuthSession {
    pub fn new(
        authorization: Option<ResolvedAuthorization>,
        auth_endpoint: wecom_transport::Endpoint,
    ) -> Self {
        Self {
            authorization: RwLock::new(authorization),
            refresh_lock: tokio::sync::Mutex::new(()),
            auth_endpoint,
        }
    }

    /// 读取当前授权材料（读锁；锁中毒时降级恢复继续使用）。
    fn read_auth(&self) -> RwLockReadGuard<'_, Option<ResolvedAuthorization>> {
        self.authorization.read().unwrap_or_else(|e| e.into_inner())
    }

    /// 写入当前授权材料（写锁；锁中毒时降级恢复继续使用）。
    fn write_auth(&self) -> RwLockWriteGuard<'_, Option<ResolvedAuthorization>> {
        self.authorization
            .write()
            .unwrap_or_else(|e| e.into_inner())
    }

    /// 当前缓存的 Bearer token（未授权或仅有 bot 凭据时为 None）。
    pub fn token(&self) -> Option<String> {
        self.read_auth()
            .as_ref()
            .and_then(|r| r.token().map(str::to_owned))
    }

    /// 写入刷新后的 token（仅 Credentials 变体；env 来源不参与刷新，不会走到）。
    fn store_token(&self, token: &str) {
        if let Some(ResolvedAuthorization::Credentials(creds)) = self.write_auth().as_mut() {
            creds.token = Some(token.to_owned());
        }
    }

    /// 853004 时可参与静默刷新的同源 bot 凭据：仅文件来源携带；
    /// env 来源（无配套 bot）与无授权材料时均为 None。
    pub fn refreshable(&self) -> Option<Bot> {
        self.read_auth().as_ref()?.refreshable_bot().cloned()
    }

    /// 经 botid+signature 重新换取 token：落盘 + 写入内存缓存，返回新 token。
    ///
    /// 刷新裁决完整内聚于本方法（调用方不做前置判断）：
    /// - env 来源 / 无同源 bot 凭据 → [`RefreshOutcome::Rejected`]（不应刷新）；
    /// - 换取链路失败 → [`RefreshOutcome::Failed`]（尝试过但失败）。
    ///
    /// `stale_token` 为本次失败请求所用的 token；锁内双检——若凭据中的 token
    /// 已不同于它，说明并发请求已完成刷新，直接复用、不再重复换取。
    ///
    /// `transport` 为调用方（`WecomBackend`）用触发刷新的请求 options 构造的
    /// 句柄（复用同一连接池与传输配置，且已剥离失效的 Authorization 头）。
    pub async fn refresh(
        &self,
        stale_token: Option<&str>,
        transport: &Transport,
    ) -> std::result::Result<String, RefreshOutcome> {
        let _guard = self.refresh_lock.lock().await;

        // env token 命中 853004：不刷新、不落盘，提示用户自行更新环境变量。
        if matches!(
            self.read_auth().as_ref(),
            Some(ResolvedAuthorization::Env { .. })
        ) {
            return Err(RefreshOutcome::Rejected(RefreshRejection::EnvTokenExpired));
        }

        if let Some(stored) = load_credentials().and_then(|c| c.token)
            && Some(stored.as_str()) != stale_token
        {
            tracing::debug!("token already refreshed by a concurrent request, reusing it");
            self.store_token(&stored);
            return Ok(stored);
        }

        let Some(bot) = self.refreshable() else {
            return Err(RefreshOutcome::Rejected(
                RefreshRejection::MissingCredentials,
            ));
        };

        // 静默刷新复用 Interactive 来源（原始绑定方式未持久化）。
        let resp = fetch_auth(
            transport,
            &bot,
            BindSource::Interactive,
            &self.auth_endpoint,
        )
        .await
        .map_err(RefreshOutcome::Failed)?;
        let token = resp.token.filter(|t| !t.is_empty()).ok_or_else(|| {
            RefreshOutcome::Failed(Error::protocol(
                "token 刷新响应缺少访问令牌",
                self.auth_endpoint.full_url(),
                serde_json::Value::Null,
            ))
        })?;

        // 落盘：bot 凭据保持不变，原子更新 token。
        let mut creds = load_credentials().unwrap_or_default();
        creds.token = Some(token.clone());
        save_credentials(&creds)
            .await
            .map_err(RefreshOutcome::Failed)?;

        self.store_token(&token);
        tracing::info!("access token refreshed (853004) and persisted");
        Ok(token)
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：AuthSession（运行时授权会话）
    //!
    //! ### 关键接口
    //! - [AuthSession::token] — 当前缓存的 Bearer token
    //! - [AuthSession::refreshable] — 853004 时可参与静默刷新的同源 bot 凭据
    //!
    //! ### 关键分支与异常路径
    //! - env 来源 / 无 bot 凭据 → refreshable 为 None（不参与刷新）
    //! - 文件来源携带同源 bot → refreshable 返回该 bot
    //! - 853004 端到端刷新（双检 / 落盘 / 重放）见 transport::tests

    use super::*;
    use crate::auth::bootstrap::auth_endpoint;
    use crate::auth::types::{Credentials, ResolvedAuthorization};

    fn session_with(bot: Option<Bot>, token: Option<&str>) -> AuthSession {
        AuthSession::new(
            Some(ResolvedAuthorization::Credentials(Credentials {
                bot,
                token: token.map(str::to_owned),
            })),
            auth_endpoint("https://qyapi.weixin.qq.com/cgi-bin/aibot/cli/get_cli_config"),
        )
    }

    /// P1：[AuthSession] 无同源 bot 凭据时 refreshable 为 None，token 缓存保持正常
    /// 条件：构造 bot=None、token=Some("cached-token") 的 AuthSession
    /// 断言：refreshable_bot() 为 None；token() == Some("cached-token")
    #[test]
    fn no_bot_credentials_token_cached() {
        let session = session_with(None, Some("cached-token"));
        assert!(session.refreshable().is_none());
        assert_eq!(session.token().as_deref(), Some("cached-token"));
    }

    /// P0：[AuthSession::refreshable] env 来源 token 不参与 853004 刷新
    /// 条件：构造 Env 变体的 ResolvedAuthorization
    /// 断言：refreshable_bot() 为 None（无配套 bot 凭据）
    #[test]
    fn env_token_not_refreshable() {
        let session = AuthSession::new(
            Some(ResolvedAuthorization::Env {
                token: "env-tok".into(),
            }),
            auth_endpoint("https://qyapi.weixin.qq.com/cgi-bin/aibot/cli/get_cli_config"),
        );
        assert!(session.refreshable().is_none());
        assert_eq!(session.token().as_deref(), Some("env-tok"));
    }

    /// P0：[AuthSession::refreshable] 文件来源 token 携带同源 bot 凭据
    /// 条件：构造 Credentials 变体的 ResolvedAuthorization
    /// 断言：refreshable_bot() 返回同源 bot（bot1）
    #[test]
    fn credentials_token_refreshable_with_bot() {
        let session = session_with(Some(Bot::new("bot1".into(), "s1".into())), Some("file-tok"));
        assert_eq!(session.refreshable().map(|b| b.id).as_deref(), Some("bot1"));
    }

    /// P0：[RefreshRejection::into_auth_error] MissingCredentials 不替换错误
    /// 条件：MissingCredentials 调用 into_auth_error()
    /// 断言：返回 None（调用方回传原始业务错误）
    #[test]
    fn missing_credentials_keeps_original_error() {
        assert!(
            RefreshRejection::MissingCredentials
                .into_auth_error()
                .is_none()
        );
    }

    /// P0：[RefreshRejection::into_auth_error] EnvTokenExpired 替换为含变量名的 Auth 提示
    /// 条件：EnvTokenExpired 调用 into_auth_error()
    /// 断言：返回 Some(Error::Auth)，文案含 WECOM_CLI_ACCESS_TOKEN
    #[test]
    fn env_token_expired_replaces_with_auth_hint() {
        let err = RefreshRejection::EnvTokenExpired
            .into_auth_error()
            .expect("env 来源应替换为友好提示");
        match err {
            Error::Auth(msg) => assert!(msg.contains(crate::env::ACCESS_TOKEN)),
            other => panic!("expected Error::Auth, got {other:?}"),
        }
    }

    /// P1：[AuthSession::Debug] 不泄露 bot secret 与缓存 token
    /// 条件：构造含 "super-secret" / "cached-token" 的 AuthSession 并格式化
    /// 断言：Debug 输出不含这两个敏感值
    #[test]
    fn debug_does_not_leak_secrets() {
        let session = session_with(
            Some(Bot::new("bot1".into(), "super-secret".into())),
            Some("cached-token"),
        );
        let dbg = format!("{session:?}");
        assert!(!dbg.contains("super-secret"), "secret 泄露: {dbg}");
        assert!(!dbg.contains("cached-token"), "token 泄露: {dbg}");
    }
}
