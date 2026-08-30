//! 鉴权引导：botid+secret 签名调用换取 Bearer token 与端点配置。
//!
//! 签名算法为 `sha256_hex(secret + bot_id + time + nonce)`；返回的 token
//! 由调用方（`auth init`）统一保存至 `credentials.enc`，后续请求经
//! `Authorization: Bearer <token>` 注入。

use std::time::{SystemTime, UNIX_EPOCH};

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_repr::Serialize_repr;
use sha2::{Digest, Sha256};

use crate::{Error, Result};

use super::types::Bot;

// ---------------------------------------------------------------------------
// Endpoint / Cli-Info
// ---------------------------------------------------------------------------

/// 鉴权引导端点（botid+secret 签名调用换取 Bearer token），默认 product/正式环境。
///
/// 解析优先级（高 → 低）：
/// 1. 运行时 `WECOM_CLI_AUTH_ENDPOINT` 环境变量（`custom-endpoint` feature）
/// 2. `config.json` 的 `auth_endpoint`（`custom-endpoint` feature）
/// 3. 编译期 `WECOM_CLI_AUTH_ENDPOINT` 环境变量
/// 4. 本常量兜底
const DEFAULT_AUTH_ENDPOINT: &str = "https://qyapi.weixin.qq.com/cgi-bin/aibot/cli/get_cli_config";

/// 解析并装配鉴权引导端点（优先级见 [`DEFAULT_AUTH_ENDPOINT`]），
/// 再经 [`auth_endpoint`] 装配（扁平信封 + 抑制注入）。
///
/// `cfg` 为调用方已加载（或经 Client 扩展袋注入）的配置，可缺省：
/// `None`（未注入）时跳过 config.json 一级，不报错。
pub fn resolve_auth_endpoint(cfg: Option<&crate::config::ConfigFile>) -> wecom_transport::Endpoint {
    #[cfg(feature = "custom-endpoint")]
    let runtime = crate::config::runtime_endpoint(
        crate::env::AUTH_ENDPOINT,
        cfg.and_then(|c| c.auth_endpoint.as_deref()),
    );
    #[cfg(not(feature = "custom-endpoint"))]
    let runtime = {
        let _ = cfg;
        None
    };
    let resolved = crate::config::resolve_endpoint(
        runtime,
        option_env!("WECOM_CLI_AUTH_ENDPOINT"),
        DEFAULT_AUTH_ENDPOINT,
    );
    auth_endpoint(&resolved)
}

/// 按 URL 装配鉴权引导端点（换取 Bearer token 的专用 Endpoint）——引导端点
/// 的唯一装配原语；产品流程请走 [`resolve_auth_endpoint`]（含 URL 解析），
/// 本函数主要供测试注入 mock URL。
///
/// 使用产品层自定义的 [`FlatRes`](crate::transport::envelope::FlatRes) 扁平
/// 响应信封（整体 JSON body 即业务结果 `{errcode, errmsg, token}`），并挂
/// [`SuppressAuth`](crate::transport::SuppressAuth) 抑制标记——即使持有
/// token 也不携带 Authorization 头（换取 token 的引导请求不得带失效 token，
/// 否则 853004 刷新会自死锁）。
pub fn auth_endpoint(url: &str) -> wecom_transport::Endpoint {
    wecom_transport::Endpoint::new()
        .with(
            wecom_transport::HttpEndpoint::from_url(url)
                .with_res_envelope(crate::transport::FlatRes),
        )
        .with(crate::transport::SuppressAuth)
}

// ---------------------------------------------------------------------------
// Request ID
// ---------------------------------------------------------------------------

/// Generate a request ID in the format: `{prefix}_{timestamp_ms}_{random_hex}`.
fn gen_req_id(prefix: &str) -> String {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let random = generate_random_hex(8);
    format!("{prefix}_{timestamp}_{random}")
}

/// Generate a random hex string of the specified character length.
fn generate_random_hex(length: usize) -> String {
    use rand::RngExt;
    let byte_len = length.div_ceil(2);
    let bytes: Vec<u8> = (0..byte_len).map(|_| rand::rng().random::<u8>()).collect();
    let hex = hex::encode(bytes);
    hex[..length].to_string()
}

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

/// 配置来源
#[derive(Debug, Clone, Copy, Serialize_repr)]
#[repr(u8)]
pub enum BindSource {
    /// Interactive
    Interactive = 1,
    /// QR Code
    Qrcode = 2,
}

#[derive(Debug, Clone, Serialize)]
pub struct FetchAuthRequest {
    pub bot_id: String,
    pub time: u64,
    pub nonce: String,
    pub signature: String,
    pub bind_source: BindSource,
}

impl FetchAuthRequest {
    /// Build a signed request from the given bot credentials
    pub fn build(bot: &Bot, bind_source: BindSource) -> Result<Self> {
        let time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let nonce = gen_req_id("cli");
        let signature = sign(&bot.secret, &bot.id, time, &nonce);

        Ok(Self {
            bot_id: bot.id.clone(),
            time,
            nonce,
            signature,
            bind_source,
        })
    }
}

// ---------------------------------------------------------------------------
// Response
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchAuthResponse {
    #[serde(default)]
    pub errcode: i32,
    pub errmsg: Option<String>,
    /// 鉴权成功后台返回的 Bearer token（后续请求经 Authorization 头携带）。
    #[serde(default)]
    pub token: Option<String>,
    #[serde(flatten)]
    pub extra: IndexMap<String, serde_json::Value>,
}

// ---------------------------------------------------------------------------
// Signature
// ---------------------------------------------------------------------------

/// Compute the request signature.
///
/// Algorithm: `sha256_hex(secret + bot_id + time + nonce)`
/// where `sha256_hex` uses the standard zero-padded lowercase hex format (`%02x`).
pub fn sign(secret: &str, bot_id: &str, time: u64, nonce: &str) -> String {
    let input = format!("{secret}{bot_id}{time}{nonce}");
    sha256_hex(&input)
}

/// Compute the SHA-256 hash of `input` and return it as a lowercase hex string.
fn sha256_hex(input: &str) -> String {
    let hash = Sha256::digest(input.as_bytes());
    let mut result = String::with_capacity(64);
    for byte in hash.iter() {
        result.push_str(&format!("{:02x}", byte));
    }
    result
}

// ---------------------------------------------------------------------------
// API Call
// ---------------------------------------------------------------------------

/// Fetch the auth bootstrap config from the server (signed request), returning
/// the Bearer token for the caller to persist.
///
/// 复用 `Client::transport` 的请求能力；`endpoint` 由调用方经
/// [`resolve_auth_endpoint`] 构造（信封与鉴权抑制标记由它保证）。
///
/// 错误统一返回 [`crate::Error`]：网络/HTTP/解析经三层嵌套
/// `Error::Wecom(wecom::Error::Wrapped(_))`；业务错误（`errcode != 0`）由
/// [`FlatRes`](crate::transport::envelope::FlatRes) 信封层校验并构造
/// `wecom_transport::Error::Api`（消息取后台 errmsg，body 透传原始响应）；
/// 响应格式不符为 transport 层 [`Parse`](wecom_transport::Error::Parse)
/// （含原始 body 与 serde source）。
pub async fn fetch_auth(
    transport: &wecom_transport::Transport,
    bot: &Bot,
    bind_source: BindSource,
    endpoint: &wecom_transport::Endpoint,
) -> Result<FetchAuthResponse> {
    tracing::debug!(bind_source = ?bind_source, "auth bootstrap request");
    let request = FetchAuthRequest::build(bot, bind_source)
        .inspect_err(|e| tracing::error!(error = %e, "build auth bootstrap request failed"))?;

    // 纯字符串字段的结构体序列化失败为意料之外的系统级失败，归入兜底 Other。
    let payload = serde_json::to_value(&request).map_err(|e| Error::Other(e.into()))?;

    let value = transport.invoke(endpoint, &payload).await?.into_result()?;

    let resp = FetchAuthResponse::deserialize(&value).map_err(|e| {
        Error::from(wecom_transport::Error::Parse {
            message: format!("鉴权响应格式异常: {e}"),
            endpoint: wecom_transport::EndpointHttpExt::full_url(endpoint),
            body: Box::new(value),
            source: Some(e),
        })
    })?;

    Ok(resp)
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：bootstrap（鉴权引导：botid+secret 签名换取 Bearer token）
    //!
    //! ### 关键接口
    //! - [sign] — `sha256_hex(secret + bot_id + time + nonce)` 签名算法
    //! - [sha256_hex] — SHA-256 小写零填充 hex
    //! - [FetchAuthRequest::build] — 构建带签名的请求体（time/nonce/signature/bind_source）
    //! - [BindSource] — 绑定来源枚举（Interactive=1 / Qrcode=2，序列化为数字）
    //! - [resolve_auth_endpoint] — 鉴权端点解析（运行时 env > config.json（均限 `custom-endpoint` feature）> 编译期 env > 默认）
    //! - [fetch_auth] — 复用 Client::transport 调用 get_cli_config 换取 Bearer token（未直接单测，走 e2e）
    //!
    //! ### 关键分支与异常路径
    //! - `sha256_hex` 与 C++ 参考实现（`%02x` 小写零填充）一致
    //! - 签名确定性：相同输入 → 相同输出；不同 nonce → 不同签名
    //! - 请求体含 `bind_source`（绑定来源）与 `bot_id`
    //! - 默认端点指向 product/正式环境；`custom-endpoint` feature 下环境变量可覆盖完整 URL
    //! - 引导 Endpoint 用 `FlatRes` 信封：经 `HttpEndpoint::from_url` 组装，整体 body 即结果（信封层校验 errcode），不携带授权

    use std::sync::Mutex;

    use wecom_transport::EndpointHttpExt;

    use crate::config::ConfigFile;

    use super::*;

    // 串行化环境变量测试（WECOM_CLI_AUTH_ENDPOINT 为全局）。
    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn with_env<T>(key: &str, value: Option<&str>, f: impl FnOnce() -> T) -> T {
        let _guard = ENV_LOCK.lock().unwrap();
        // 测试专用：设置/清理全局环境变量（Rust 2024 下为 unsafe）。
        unsafe {
            match value {
                Some(v) => std::env::set_var(key, v),
                None => std::env::remove_var(key),
            }
        }
        let r = f();
        unsafe {
            std::env::remove_var(key);
        }
        r
    }

    // -----------------------------------------------------------------------
    // Signature tests
    // -----------------------------------------------------------------------

    /// P0：sha256_hex 输出与 C++ 参考格式（%02x 小写零填充）一致
    /// 条件：对字符串 "test" 计算 sha256_hex
    /// 断言：输出等于已知的 64 位小写 hex 参考值
    #[test]
    fn sha256_hex_matches_cpp_format() {
        let result = sha256_hex("test");
        // {:02x} format: standard lowercase hex, two digits per byte, zero-padded
        assert_eq!(
            result,
            "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
        );
    }

    /// P0：sign 产生非空签名
    /// 条件：给定 secret/bot_id/time/nonce 调用 sign
    /// 断言：签名字符串非空
    #[test]
    fn sign_produces_non_empty_signature() {
        let sig = sign("my_secret", "bot_123", 1774772074, "abc123");
        assert!(!sig.is_empty());
    }

    /// P0：sign 对相同输入输出确定性结果
    /// 条件：相同 secret/id/time/nonce 调用两次 sign
    /// 断言：两次签名相等
    #[test]
    fn sign_is_deterministic() {
        let a = sign("sec", "id", 100, "nonce");
        let b = sign("sec", "id", 100, "nonce");
        assert_eq!(a, b);
    }

    /// P1：不同输入产生不同签名
    /// 条件：仅 nonce 不同调用两次 sign
    /// 断言：两次签名不相等
    #[test]
    fn sign_changes_with_different_inputs() {
        let a = sign("sec", "id", 100, "nonce1");
        let b = sign("sec", "id", 100, "nonce2");
        assert_ne!(a, b);
    }

    // -----------------------------------------------------------------------
    // Serialization tests
    // -----------------------------------------------------------------------

    /// P0：BindSource 序列化为数字
    /// 条件：分别序列化 Interactive 与 Qrcode
    /// 断言：输出为字符串 "1" 与 "2"
    #[test]
    fn bind_source_serializes_as_number() {
        let json = serde_json::to_string(&BindSource::Interactive).unwrap();
        assert_eq!(json, "1", "Expected number 1, got: {json}");
        let json = serde_json::to_string(&BindSource::Qrcode).unwrap();
        assert_eq!(json, "2", "Expected number 2, got: {json}");
    }

    /// P0：请求体含 `bind_source` 与 `bot_id`
    /// 条件：构造 FetchAuthRequest::build 并序列化为 JSON
    /// 断言：包含 bind_source/bot_id 字段
    #[test]
    fn fetch_auth_request_includes_required_fields() {
        let bot = Bot::new("b".into(), "s".into());
        let req = FetchAuthRequest::build(&bot, BindSource::Interactive).unwrap();
        let json = serde_json::to_value(&req).unwrap();
        assert!(json.get("bind_source").is_some());
        assert!(json.get("bot_id").is_some());
    }

    /// P0：默认端点指向 product/正式环境的引导接口
    /// 条件：未设置 WECOM_CLI_AUTH_ENDPOINT（默认 feature 下 env/config 均不生效）
    /// 断言：resolve_auth_endpoint() 返回默认 product 端点
    #[test]
    fn auth_endpoint_defaults_to_product() {
        with_env("WECOM_CLI_AUTH_ENDPOINT", None, || {
            assert_eq!(
                resolve_auth_endpoint(Some(&ConfigFile::default())).full_url(),
                "https://qyapi.weixin.qq.com/cgi-bin/aibot/cli/get_cli_config"
            );
        });
    }

    /// P1：cfg 未注入（None）时回退默认端点，不报错
    /// 条件：resolve_auth_endpoint(None)
    /// 断言：返回默认 product 端点
    #[test]
    fn auth_endpoint_none_falls_back_to_default() {
        with_env("WECOM_CLI_AUTH_ENDPOINT", None, || {
            assert_eq!(
                resolve_auth_endpoint(None).full_url(),
                "https://qyapi.weixin.qq.com/cgi-bin/aibot/cli/get_cli_config"
            );
        });
    }

    /// P1：环境变量覆盖完整 URL（`custom-endpoint` feature 下生效，优先级最高）
    /// 条件：设置 WECOM_CLI_AUTH_ENDPOINT 为测试端点
    /// 断言：resolve_auth_endpoint() 返回环境变量指定的 URL
    #[cfg(feature = "custom-endpoint")]
    #[test]
    fn auth_endpoint_env_override() {
        with_env(
            "WECOM_CLI_AUTH_ENDPOINT",
            Some("https://example.com/cgi-bin/aibot/cli/get_cli_config"),
            || {
                assert_eq!(
                    resolve_auth_endpoint(Some(&ConfigFile::default())).full_url(),
                    "https://example.com/cgi-bin/aibot/cli/get_cli_config"
                );
            },
        );
    }

    /// P1：config.json 的 auth_endpoint 覆盖默认值（`custom-endpoint` feature 下生效）
    /// 条件：ConfigFile 含 auth_endpoint，env 未设置
    /// 断言：resolve_auth_endpoint() 返回 config 中的 URL
    #[cfg(feature = "custom-endpoint")]
    #[test]
    fn auth_endpoint_config_override() {
        with_env("WECOM_CLI_AUTH_ENDPOINT", None, || {
            let cfg = ConfigFile {
                auth_endpoint: Some("https://config.example.com/auth".to_string()),
                ..Default::default()
            };
            assert_eq!(
                resolve_auth_endpoint(Some(&cfg)).full_url(),
                "https://config.example.com/auth"
            );
        });
    }
}
