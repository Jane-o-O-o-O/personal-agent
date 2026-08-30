//! wecom-cli 自有出网后端：动态 Authorization 注入 + 853004 刷新重放。
//!
//! 本层只做 transport 装饰——授权材料的持有与 853004 静默刷新编排
//! （锁内双检 / 落盘 / 写内存）内聚于 [`crate::auth::AuthSession`]。

use std::borrow::Cow;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use wecom_transport::{
    Endpoint, HttpRequestPayload, RequestOptions, Transport, TransportBackend, TransportResponse,
};

use super::capability::SuppressAuth;
use crate::auth::{AuthSession, RefreshOutcome};

/// token 失效业务错误码（后台下发）：命中后经 botid+signature 静默换 token 并重试。
const TOKEN_EXPIRED_ERRCODE: i64 = 853004;

// ── wecom-cli 自有 transport backend ──────────────────────────

/// wecom-cli 统一出网后端：所有请求都经它转发，负责
/// - 持有 token 即注入 `Authorization: Bearer <token>`（无论端点是否挂
///   [`RequireAuth`](crate::transport::capability::RequireAuth)；无 token 则
///   忽略不注入）；挂 [`RequireAuth`](crate::transport::capability::RequireAuth)
///   的端点在 **前置门禁** 校验：无可用 token 直接报
///   [`Error::Auth`](crate::error::Error::Auth)，请求不发出（内部
///   `skip-auth-check` feature 构建下跳过该门禁，交由后台鉴权兜底）。
///   携带 [`SuppressAuth`] 的端点（换取 token 的引导接口）即使有 token 也不注入；
/// - 捕获 853004（token 失效）→ 委托 [`AuthSession::refresh`] 用同源 bot
///   凭据静默换 token（落盘 + 写内存）→ 重放原请求一次（未注入 token 的
///   请求不参与刷新）。
///
/// 扁平响应等请求/响应封装由 wecom-transport 的 endpoint envelope 驱动，
/// 本层不做特殊分流。
///
/// 所有载荷均可重放：经 [`HttpRequestPayload`] 工厂克隆（Arc 零成本），
/// 重放 = 再次 build。
#[derive(Clone)]
pub(crate) struct WecomBackend {
    /// 底层 HTTP 传输（信封解析 + 长任务轮询路径）。
    inner: Arc<dyn TransportBackend>,
    /// 运行时授权会话（token 缓存 + 853004 静默刷新编排）。
    session: Arc<AuthSession>,
}

// 不输出 bot secret 与缓存 token（AuthSession 的 Debug 同样不落敏感值）。
impl std::fmt::Debug for WecomBackend {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("WecomBackend")
            .field("backend", &self.inner.name())
            .finish_non_exhaustive()
    }
}

impl WecomBackend {
    pub(crate) fn new(inner: Arc<dyn TransportBackend>, session: Arc<AuthSession>) -> Self {
        Self { inner, session }
    }
}

impl TransportBackend for WecomBackend {
    fn execute<'a>(
        &'a self,
        endpoint: Cow<'a, Endpoint>,
        payload: HttpRequestPayload,
        mut options: RequestOptions,
    ) -> Pin<
        Box<
            dyn Future<Output = std::result::Result<TransportResponse, wecom_transport::Error>>
                + Send
                + 'a,
        >,
    > {
        Box::pin(async move {
            // 所有载荷均可重放：clone 工厂（Arc 零成本），重放 = 再次 build。
            let replay_payload = payload.clone();

            // 抑制注入：换取 token 的引导端点即使持有 token 也不携带 Authorization。
            let sent_token = if endpoint.as_ref().get::<SuppressAuth>().is_some() {
                None
            } else {
                let token = self.session.token();

                // 门禁前置：挂 RequireAuth 的端点必须已有可用 token，否则请求不发出。
                #[cfg(not(feature = "skip-auth-check"))]
                if endpoint
                    .as_ref()
                    .get::<super::capability::RequireAuth>()
                    .is_some()
                    && token.is_none()
                {
                    tracing::debug!("endpoint requires auth but no token available");
                    return Err(crate::error::Error::Auth(format!(
                        "该请求需要授权，请先运行 `{} auth init` 登录",
                        env!("CARGO_BIN_NAME")
                    ))
                    .into());
                }

                // 有 token 就注入（无论是否挂 RequireAuth），无 token 则忽略；
                // 记下本次发送值供 853004 刷新去重。
                token.inspect(|token| set_bearer_token(&mut options, token))
            };

            let err = match self
                .inner
                .execute(endpoint.clone(), payload, options.clone())
                .await
            {
                Ok(resp) => return Ok(resp),
                Err(err) => err,
            };

            if !is_token_expired(&err) {
                return Err(err);
            }
            // 未注入 token 的请求不可能因 token 过期失败（无 token / 抑制注入的
            // 引导端点）——不参与刷新，直接返回原错误。
            if sent_token.is_none() {
                tracing::warn!("token expired but no token was sent");
                return Err(err);
            }
            tracing::info!("token expired (853004), attempting silent refresh");

            // 引导请求复用触发刷新的请求的 options（headers / timeout / extensions），
            // 并复用自身（含扁平响应/授权管理）发起——同一连接池与配置。
            // 引导请求不携带业务 token：剥离其中注入的失效 Authorization 头。
            options.headers_mut().remove(reqwest::header::AUTHORIZATION);
            let bootstrap_transport = Transport::new(Arc::new(self.clone()), options.clone());
            match self
                .session
                .refresh(sent_token.as_deref(), &bootstrap_transport)
                .await
            {
                Ok(token) => {
                    tracing::info!("token refreshed, retrying the original request");
                    set_bearer_token(&mut options, &token);
                    // 重放 = 重新走完整流水线：发送链会再次 build。
                    self.inner.execute(endpoint, replay_payload, options).await
                }
                // 不可刷新：env 来源替换为友好提示，其余回传原始业务错误。
                Err(RefreshOutcome::Rejected(reason)) => {
                    tracing::warn!(?reason, "token expired but refresh not applicable");
                    match reason.into_auth_error() {
                        Some(auth_err) => Err(auth_err.into()),
                        None => Err(err),
                    }
                }
                // 刷新本身失败：保持既有行为，回传原始错误并记日志。
                Err(RefreshOutcome::Failed(refresh_err)) => {
                    tracing::warn!(error = %refresh_err, "token refresh failed, returning the original error");
                    Err(err)
                }
            }
        })
    }

    fn name(&self) -> &str {
        self.inner.name()
    }
}

/// 是否为可触发静默刷新的 token 失效错误（ApiError 853004）。
fn is_token_expired(err: &wecom_transport::Error) -> bool {
    matches!(
        err,
        wecom_transport::Error::Api {
            code: Some(TOKEN_EXPIRED_ERRCODE),
            ..
        }
    )
}

/// 在请求选项上覆写 `Authorization: Bearer <token>` 头（标记敏感）。
fn set_bearer_token(options: &mut RequestOptions, token: &str) {
    let Ok(mut value) = reqwest::header::HeaderValue::from_str(&format!("Bearer {token}")) else {
        return;
    };
    value.set_sensitive(true);
    options
        .wire
        .headers
        .insert(reqwest::header::AUTHORIZATION, value);
}

#[cfg(test)]
pub(crate) mod tests {
    //! ## 模块摘要：WecomBackend（出网装饰器）
    //!
    //! ### 关键接口
    //! - [is_token_expired] — 853004 判定
    //! - [set_bearer_token] — Bearer 头覆写（标记敏感）
    //!
    //! ### 关键分支与异常路径
    //! - 853004 命中刷新；其它业务错误码 / code 缺失 / 非 Api 变体不命中
    //! - 端到端注入与刷新重放见 transport::tests

    use super::*;
    use crate::auth::auth_endpoint;
    use crate::auth::types::Credentials;
    use crate::auth::{Bot, ResolvedAuthorization};

    /// 测试构造：按裸 bot/token 组装文件来源的 [`ResolvedAuthorization`]
    /// （生产路径经 `auth::resolve_authorization` 解析）；`auth_endpoint` 为
    /// 鉴权引导端点 URL（经 [`auth_endpoint`] 装配——扁平信封 + 抑制注入）。
    pub(crate) fn new_with_material(
        inner: Arc<dyn TransportBackend>,
        bot: Option<Bot>,
        token: Option<&str>,
        auth_endpoint_url: &str,
    ) -> WecomBackend {
        let session = Arc::new(AuthSession::new(
            Some(ResolvedAuthorization::Credentials(Credentials {
                bot,
                token: token.map(str::to_owned),
            })),
            auth_endpoint(auth_endpoint_url),
        ));
        WecomBackend::new(inner, session)
    }

    fn api_error(code: Option<i64>) -> wecom_transport::Error {
        wecom_transport::Error::Api {
            message: "err".into(),
            action: "test".into(),
            code,
            body: Box::new(serde_json::Value::Null),
        }
    }

    /// P0：[is_token_expired] 853004 命中刷新
    /// 条件：构造 code=853004 的 Api 错误
    /// 断言：is_token_expired() 返回 true
    #[test]
    fn token_expired_errcode_matches() {
        assert!(is_token_expired(&api_error(Some(TOKEN_EXPIRED_ERRCODE))));
    }

    /// P0：[is_token_expired] 其它业务错误码 / code 缺失 / 非 Api 变体均不命中
    /// 条件：分别构造 code=40001、code=None、Error::Other
    /// 断言：is_token_expired() 均返回 false
    #[test]
    fn other_errors_do_not_match() {
        assert!(!is_token_expired(&api_error(Some(40001))));
        assert!(!is_token_expired(&api_error(None)));
        assert!(!is_token_expired(&wecom_transport::Error::other(
            "x".into()
        )));
    }

    /// P0：[set_bearer_token] 写入 Bearer 头且标记敏感
    /// 条件：默认 options 写入 tok-1
    /// 断言：写入后 Authorization == "Bearer tok-1"，且 is_sensitive()
    #[test]
    fn set_bearer_token_marks_sensitive() {
        let mut options = RequestOptions::default();
        set_bearer_token(&mut options, "tok-1");
        let value = options
            .wire
            .headers
            .get(reqwest::header::AUTHORIZATION)
            .unwrap();
        assert_eq!(value.to_str().unwrap(), "Bearer tok-1");
        assert!(value.is_sensitive(), "token 头应标记敏感");
    }

    /// P1：[set_bearer_token] 覆写已有 Authorization 头
    /// 条件：先写 "old" 再写 "new"
    /// 断言：Authorization == "Bearer new"
    #[test]
    fn set_bearer_token_overwrites() {
        let mut options = RequestOptions::default();
        set_bearer_token(&mut options, "old");
        set_bearer_token(&mut options, "new");
        let value = options
            .wire
            .headers
            .get(reqwest::header::AUTHORIZATION)
            .unwrap();
        assert_eq!(value.to_str().unwrap(), "Bearer new");
    }
}
