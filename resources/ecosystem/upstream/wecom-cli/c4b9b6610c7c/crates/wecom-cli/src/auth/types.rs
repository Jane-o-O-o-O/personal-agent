//! 鉴权域数据类型：Bot 凭据、凭据总账、授权材料（来源内聚于枚举变体）。

use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

/// 企业微信机器人凭据（botid + secret）。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bot {
    pub id: String,
    pub secret: String,
    pub create_time: u64,
}

impl Bot {
    /// Create a new Bot with `create_time` set to the current timestamp.
    pub fn new(id: String, secret: String) -> Self {
        let create_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        Self {
            id,
            secret,
            create_time,
        }
    }
}

/// 本地凭据总账：bot 信息与 Bearer token 共存于同一加密文件，保证原子更新。
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Credentials {
    pub bot: Option<Bot>,
    pub token: Option<String>,
}

/// 解析后的授权材料：Bearer token 及其来源（同源语义内聚于变体）。
///
/// - `Env`：`WECOM_CLI_ACCESS_TOKEN` 环境变量。token 必然存在（空串在解析时视为未设置）；
///   无配套 bot，不参与 853004 静默刷新。
/// - [`Credentials`](Self::Credentials)：本地凭据文件 `credentials.enc`
///   （`auth init` 引导换取）的完整内容。token 与 bot 出自同一次读盘的
///   同一结构体（同源），853004 时方可用其 botid+signature 静默刷新；
///   `token` 为 `None` 表示文件仅有 bot 凭据。
///
/// 未授权（文件与 env 均无内容）经 `Option<ResolvedAuthorization>` 的
/// `None` 表达，不占变体。命名不称 `ResolvedToken`，正因授权信息不一定
/// 含 token。
#[derive(Debug, Clone)]
pub enum ResolvedAuthorization {
    /// `WECOM_CLI_ACCESS_TOKEN` 环境变量（非空）。
    Env { token: String },
    /// 本地凭据文件 `credentials.enc` 的完整内容（同源 token + bot）。
    Credentials(Credentials),
}

impl ResolvedAuthorization {
    /// 当前生效的 Bearer token（凭据文件仅有 bot 凭据时为 `None`）。
    pub fn token(&self) -> Option<&str> {
        match self {
            Self::Env { token } => Some(token),
            Self::Credentials(creds) => creds.token.as_deref(),
        }
    }

    /// 853004 时可参与静默刷新的同源 bot 凭据：仅文件来源携带；
    /// env 来源（无配套 bot）为 `None`。
    pub fn refreshable_bot(&self) -> Option<&Bot> {
        match self {
            Self::Env { .. } => None,
            Self::Credentials(creds) => creds.bot.as_ref(),
        }
    }
}
