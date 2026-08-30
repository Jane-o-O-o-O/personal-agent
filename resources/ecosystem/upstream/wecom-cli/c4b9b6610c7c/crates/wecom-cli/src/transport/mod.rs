//! Transport construction and the wecom-cli owned backend.
//!
//! 所有请求统一经本模块的 [`WecomBackend`] 出网，它实现两类跨切面能力：
//! - **authorization**：持有 token 即注入 `Authorization: Bearer <token>`
//!   （无 token 则忽略）；挂 [`capability::RequireAuth`] 的端点先过
//!   门禁——无可用 token 直接报
//!   [`crate::error::Error::Auth`] 且请求不发出。换取 token 的引导端点挂
//!   [`capability::SuppressAuth`] 抑制注入。
//! - **token refresh**：命中 853004 时委托 [`crate::auth::AuthSession`] 经
//!   botid+signature 静默换 token（落盘 + 写内存），随后重放原请求一次。
//!
//! 网关扁平协议（`{errcode, errmsg, results_json}`）由本模块定义
//! （[`envelope::FlatApiResponse`] / [`envelope::NestedRes`]），并经
//! [`endpoint_catalog`] 注入到 Client 的
//! 内置 endpoint 目录。
//!
//! 模块划分：
//! - [`envelope`]：网关扁平协议信封（[`envelope::NestedRes`] / [`envelope::FlatRes`]）
//! - [`capability`]：鉴权能力标记（[`capability::RequireAuth`] 门禁 /
//!   [`capability::SuppressAuth`] 抑制注入；鉴权失败错误见 [`crate::error::Error`]）
//! - [`catalog`]：自建内置 endpoint 目录（[`endpoint_catalog`]）
//! - [`backend`]：wecom-cli 自有出网后端（[`WecomBackend`]）

use std::sync::Arc;

use wecom_transport::{HttpTransportBackend, Transport};

use crate::Result;
use crate::auth;
use crate::config::{self, ConfigFile};

pub(crate) mod backend;
pub(crate) mod capability;
pub(crate) mod catalog;
pub(crate) mod envelope;
#[cfg(test)]
mod tests;

pub(crate) use backend::WecomBackend;
pub(crate) use capability::SuppressAuth;
pub(crate) use catalog::endpoint_catalog;
pub(crate) use envelope::FlatRes;

/// 默认 API base URL。
///
/// 解析优先级（高 → 低）：
/// 1. 运行时 `WECOM_CLI_BASE_URL` 环境变量（`custom-endpoint` feature）
/// 2. `config.json::base_url`（`custom-endpoint` feature）
/// 3. 编译期 `WECOM_CLI_BASE_URL` 环境变量
/// 4. 本常量兜底
pub const DEFAULT_BASE_URL: &str = "https://qyapi.weixin.qq.com/cli";

/// Build a fully-configured HTTP transport.
///
/// Bearer token 经 [`crate::auth::resolve_authorization`] 解析
/// （`WECOM_CLI_ACCESS_TOKEN` 环境变量优先、`credentials.enc` 文件回退，
/// 见 [`crate::auth`]）。
/// 无 token 时不报错：`Authorization` 头由 [`WecomBackend`] 在调用时持有
/// token 即注入（无 token 则忽略）；挂 [`capability::RequireAuth`] 的端点
/// 先过门禁，无 token 时报 [`crate::error::Error::Auth`]。
///
/// 最终 transport 都装饰为 [`WecomBackend`]：
/// - 持有 token 即注入 `Authorization` 头；挂 [`capability::RequireAuth`] 的端点
///   无 token 报错（门禁）；
/// - 网关扁平协议响应整体 body 即结果（[`envelope::NestedRes`] endpoint envelope 驱动）；
/// - 返回 853004（token 失效）时自动重新换取 token、落盘并重试一次。
pub async fn build(cfg: &ConfigFile) -> Result<Transport> {
    // base_url 解析：优先级见 config::resolve_endpoint / DEFAULT_BASE_URL。
    #[cfg(feature = "custom-endpoint")]
    let runtime = config::runtime_endpoint(crate::env::BASE_URL, cfg.base_url.as_deref());
    #[cfg(not(feature = "custom-endpoint"))]
    let runtime = None;

    let base_url =
        config::resolve_endpoint(runtime, option_env!("WECOM_CLI_BASE_URL"), DEFAULT_BASE_URL);

    let builder = HttpTransportBackend::builder().base_url(base_url);
    let builder = config::apply_transport_config(builder, cfg)?;
    let transport = builder.build()?;

    // 鉴权引导端点解析并装配一次（config.json / env，`custom-endpoint` feature
    // 下可覆盖）：同一实例共享给旧版凭据迁移与 WecomBackend（853004 刷新复用）。
    let auth_endpoint = auth::resolve_auth_endpoint(Some(cfg));

    // 旧版凭据（bot.enc/token.enc）自动迁移：无 credentials.enc 时读取旧
    // botid/secret 自动走 auth 引导换取 token 并落盘；失败静默降级
    // （不阻塞启动、不清理旧文件，见 auth::legacy_migration）。
    auth::try_migrate_legacy_credentials(&transport, &auth_endpoint).await?;

    // 初始授权材料一次性读入内存（含授权来源；无 token 但存在 bot 时保留同源
    // bot 供 853004 刷新，见 auth::resolve_authorization）。不烘焙为默认头——由
    // WecomBackend 在调用时按端点能力动态注入。
    let authorization = auth::resolve_authorization();
    let session = Arc::new(auth::AuthSession::new(authorization, auth_endpoint));

    Ok(transport.wrap_backend(|backend| Arc::new(WecomBackend::new(backend, session.clone()))))
}
