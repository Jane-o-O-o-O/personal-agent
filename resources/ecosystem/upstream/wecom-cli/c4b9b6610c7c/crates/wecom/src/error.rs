use serde_json::json;
use thiserror::Error;
use wecom_error::WecomError;
// Transport error codes (E_NETWORK / E_HTTP / E_PARSE) are owned
// by the `wecom-transport` crate. This crate carries its errors (like any
// other capability-bearing error) via `Error::Wrapped`.
//
// Error code range: 893000 - 893999, this crate uses 893000 - 893099.

// Shared category codes — single source of truth in `wecom_error::codes`.
// `E_VALIDATION` / `E_IO` / `E_PERMISSION` are shared with `wecom-fs`;
// `E_CONFIG_CLIENT` backs `MessageError::config` / [`Error::config`].
pub use wecom_error::codes::{E_CONFIG_CLIENT, E_IO, E_PERMISSION, E_VALIDATION};
use wecom_transport::trunc_display;
// Method / service not found error code.
pub const E_SUBCMD: i64 = 893002;
/// CLI output error code (help, version, usage error).
pub const E_CLI: i64 = 893004;
/// Catch-all error code for wecom-layer failures.
///
/// Single source of truth lives in [`wecom_error::codes`] — shared by every
/// crate.
pub use wecom_error::codes::E_OTHER;

/// 后台接口返回该错误码时，视为参数/用法错误并展示当前命令的 help。
///
/// 该错误码表示「参数/用法问题」（如存在未知字段），`CliRun::execute` 会
/// 渲染当前叶子子命令的 help，并以 [`Error::CliOutput`]（exit code 2）返回，
/// 与正常 help/用法错误走同一条处理路径。
pub const ERRCODE_SHOW_HELP: i64 = 10021;

/// Errors returned by the wecom library.
#[derive(Error, Debug)]
#[non_exhaustive]
pub enum Error {
    /// Capability-carrying wrapper for errors retained behind a trait object.
    ///
    /// Transport-layer errors (network, HTTP, parse, API, …) arrive here via
    /// [`From<wecom_transport::Error>`]; higher-layer errors round-tripping
    /// through transport callbacks arrive nested inside
    /// [`wecom_transport::Error::Wrapped`]. Either way the payload keeps its
    /// full [`WecomError`] capability set, so `code()` / `error_type()` /
    /// `to_json()` / `render()` delegate straight through — no downcast
    /// required for rendering or reporting.
    ///
    /// When the concrete type is genuinely needed (handing an error back into
    /// a transport callback, or matching a transport variant structurally),
    /// recover it via [`WecomError::as_any`] / [`WecomError::into_any`].
    Wrapped(Box<dyn WecomError>),

    /// Pre-rendered CLI output (e.g. `--help`, `--version`, or usage error).
    ///
    /// The lib never writes this itself — callers decide how to display it.
    /// - `code` is `0` for help / version, `2` for usage errors.
    /// - `message` is the already-rendered, ready-to-display text (ANSI-colored
    ///   when the caller enabled `force_color`).
    /// - `source` carries the original [`clap::Error`] for usage errors so that
    ///   downstream code can introspect `ErrorKind` / context if needed; it is
    ///   `None` for non-clap-originated CLI output.
    CliOutput {
        code: i32,
        message: String,
        #[source]
        source: Option<clap::Error>,
    },
}

impl From<std::io::Error> for Error {
    /// Raw I/O errors are carried by [`wecom_fs::Error::Io`] (the I/O taxonomy
    /// owner), wrapped capability-preserving.
    fn from(e: std::io::Error) -> Self {
        Error::Wrapped(Box::new(wecom_fs::Error::from(e)))
    }
}

impl From<wecom_fs::Error> for Error {
    /// Fs errors share this crate's taxonomy and codes (the `E_VALIDATION` /
    /// `E_PERMISSION` / `E_IO` constants in `wecom_error::codes` are theirs),
    /// so they are wrapped capability-preserving — no variant-by-variant
    /// flattening, and future fs variants keep their codes for free.
    fn from(e: wecom_fs::Error) -> Self {
        Error::Wrapped(Box::new(e))
    }
}

impl From<wecom_transport::Error> for Error {
    /// Carry a transport error as an [`Error::Wrapped`] payload. Higher-layer
    /// errors that round-tripped through the transport arrive as
    /// [`wecom_transport::Error::Wrapped`] and simply nest one level
    /// deeper — capabilities delegate through the whole chain unchanged, so
    /// no `downcast` is needed for rendering / reporting. Recover the concrete
    /// type with [`WecomError::as_any`] when structural inspection is
    /// genuinely required.
    fn from(e: wecom_transport::Error) -> Self {
        Error::Wrapped(Box::new(e))
    }
}

impl Error {
    /// Input validation failed (missing required field, empty method path, …).
    ///
    /// Carried by a wrapped [`wecom_error::MessageError`] (`ValidationError`
    /// / `E_VALIDATION`).
    #[must_use]
    pub fn validation(message: impl Into<String>) -> Self {
        Error::Wrapped(Box::new(wecom_error::MessageError::validation(message)))
    }

    /// Client / builder configuration error (invalid access token, unknown
    /// transport type, malformed config file, …).
    ///
    /// Carried by a wrapped [`wecom_error::MessageError`] (`ConfigError` /
    /// `E_CONFIG_CLIENT`).
    #[must_use]
    pub fn config(message: impl Into<String>) -> Self {
        Error::Wrapped(Box::new(wecom_error::MessageError::config(message)))
    }

    /// Create an I/O error (a wrapped [`wecom_fs::Error::Io`]) with the
    /// `context` followed by the error reason.
    ///
    /// Produces messages like `"Failed to open /path: No such file (os error 2)"`.
    #[must_use]
    pub fn io(context: impl std::fmt::Display, source: std::io::Error) -> Self {
        Error::Wrapped(Box::new(wecom_fs::Error::io(context, source)))
    }

    /// Catch-all for errors that don't fit the other constructors: wraps the
    /// payload in [`wecom_error::OtherError`] behind [`Error::Wrapped`]
    /// (`UnknownError` / `E_OTHER`).
    ///
    /// The concrete `Box<dyn Error>` parameter keeps call sites unambiguous.
    #[must_use]
    pub fn other(payload: Box<dyn std::error::Error + Send + Sync>) -> Self {
        Error::Wrapped(Box::new(wecom_error::OtherError(payload)))
    }

    /// Convert this error into a structured JSON [`Value`](serde_json::Value).
    ///
    /// - `Wrapped` → delegates to the payload's own `to_json` (a
    ///   `wecom_transport::Error` payload produces its per-variant shape;
    ///   `Api` returns the raw server body).
    /// - `CliOutput` → `{"error": {"code": …, "message": …}}`.
    /// - All other variants → structured JSON with `type`, `message`, `code`.
    #[must_use]
    pub fn to_json(&self) -> serde_json::Value {
        match self {
            Error::Wrapped(inner) => inner.to_json(),

            Error::CliOutput {
                code,
                message,
                source,
                ..
            } => json!({
                "error": {
                    "type": "CliOutput",
                    "code": self.code(),
                    "message": wecom_transport::trunc_display(message, 100),
                    "kind": source.as_ref().and_then(|e| e.kind().as_str()),
                    "exit_code": code,
                },
            }),
        }
    }

    /// Render the error as a ready-to-display string.
    ///
    /// - `Wrapped` → delegates to the payload's own `render` (a
    ///   `wecom_transport::Error` payload renders its per-variant JSON;
    ///   `Api` returns the raw body).
    /// - `CliOutput` → returns the pre-rendered `message` as-is
    ///   (the `source` clap error is intentionally ignored — the rendered
    ///   text already contains all user-facing information).
    #[must_use]
    pub fn render(&self) -> String {
        match self {
            Error::Wrapped(inner) => inner.render(),
            Error::CliOutput { message, .. } => message.clone(),
        }
    }

    /// Suggested process exit code.
    ///
    /// - `CliOutput` → its `code` field (`0` for help/version, `2` for usage error).
    /// - All other variants → `1`.
    #[must_use]
    pub fn exit_code(&self) -> i32 {
        match self {
            Error::CliOutput { code, .. } => *code,
            _ => 1,
        }
    }

    /// Category error code for this variant.
    ///
    /// Returns one of the `E_*` constants. For [`Error::Wrapped`] this
    /// delegates to the payload's own `code` — a `wecom_transport::Error`
    /// payload maps each inner variant to `E_NETWORK` / `E_HTTP` / `E_PARSE` /
    /// `E_OTHER`, and [`wecom_transport::Error::Api`] passes the
    /// backend error code through directly (defaults to 0).
    #[must_use]
    pub fn code(&self) -> i64 {
        match self {
            Error::Wrapped(inner) => inner.code(),
            Error::CliOutput { source, .. } => match source.as_ref().map(|e| e.kind()) {
                Some(clap::error::ErrorKind::InvalidSubcommand) => E_SUBCMD,
                _ => E_CLI,
            },
        }
    }

    #[must_use]
    pub fn message(&self) -> String {
        match self {
            Error::Wrapped(inner) => inner.message(),
            Error::CliOutput { message, .. } => message.clone(),
        }
    }
}

impl WecomError for Error {
    fn code(&self) -> i64 {
        Error::code(self)
    }

    fn message(&self) -> String {
        Error::message(self)
    }

    fn error_type(&self) -> &'static str {
        match self {
            Error::Wrapped(inner) => inner.error_type(),
            Error::CliOutput { .. } => "CliOutput",
        }
    }

    // The `CliOutput` variant embeds both a numeric exit code and a
    // pre-rendered message, neither of which matches the trait's 3-key
    // default shape, so we delegate to the inherent implementation.
    fn to_json(&self) -> serde_json::Value {
        Error::to_json(self)
    }

    // `CliOutput` renders as the caller-supplied message verbatim
    // (already colored), so the inherent `render` is preserved.
    fn render(&self) -> String {
        Error::render(self)
    }

    fn exit_code(&self) -> i32 {
        Error::exit_code(self)
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn into_any(self: Box<Self>) -> Box<dyn std::any::Any> {
        self
    }
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let code = self.code();
        match self {
            // Transparent passthrough: the payload already renders its own
            // `[code=…]` tail; appending another one would stack duplicates.
            Error::Wrapped(inner) => write!(f, "{inner}"),
            Error::CliOutput {
                code: exit_code,
                message,
                source,
            } => {
                let message = trunc_display(message, 100);
                let kind = source.as_ref().and_then(|e| e.kind().as_str());
                let kind_display = kind.unwrap_or("?");
                write!(
                    f,
                    "CliOutput: {message} [code={code}, exit={exit_code}, kind={kind_display}]"
                )
            }
        }
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：Error（统一错误类型）
    //!
    //! ### 关键接口
    //! - [Error::to_json] — 将错误转换为结构化 JSON Value（Wrapped 委托负载
    //!   自身的 to_json，transport 负载保持其各变体形状）
    //! - [Error::render] — 将错误渲染为可展示字符串（JSON 或预渲染消息）；
    //!   对 JSON 变体内部调用 [to_json] 后格式化
    //! - [Error::exit_code] — 返回建议的进程退出码（CliOutput 用自身 code，其余为 1）
    //! - [Error::code] — 返回该错误对应的 893xxx 分类码（Wrapped 委托负载 code：
    //!   transport 子变体映射到 E_NETWORK/E_HTTP/E_PARSE/E_OTHER，Api 直接透传后台错误码）
    //! - `From<std::io::Error> for Error` — 将 io::Error 装箱为 Wrapped(fs Io 变体)
    //! - `From<wecom_transport::Error> for Error` — 装箱为 Wrapped 变体（保留
    //!   完整能力集）；经 [crate::util::to_transport_error] 往返的 wecom::Error
    //!   负载嵌套为 Wrapped(Wrapped(inner))，能力沿链逐级委托（无 downcast）
    //!
    //! ### 关键分支与异常路径
    //! - From<transport>：一律装箱为 Error::Wrapped；code/type/message 经委托透传
    //! - to_json：Wrapped 委托负载；CliOutput 返回结构化 JSON（含 code/type/字段）
    //! - render：Wrapped 委托负载 render；CliOutput 直接返回预渲染 message（忽略 source）；其余调用 to_json → to_string_pretty
    //! - exit_code：CliOutput 返回 code 字段，其他变体统一返回 1
    //! - code：Wrapped 内的 Api 直接透传后台错误码（无则默认 0）；Other 负载兜底 E_OTHER
    //! - From impl：io::Error / wecom_fs::Error 装箱为 Wrapped（fs 承载 Io/Permission 分类）
    //! - Validation：CLI 用户输入校验失败；Config：ClientBuilder 配置 / 环境变量 / 配置文件格式错误
    //!
    //! ### 上下游交互
    //! - 上游：整个 wecom crate 各模块通过 `?` 操作符产生 Error；CliOutput 由 [crate::client::run] 在 clap 解析失败时构造，并把原始 `clap::Error` 放入 `source`
    //! - 下游：依赖 wecom_transport::Error / wecom_fs::Error（Wrapped 负载的主要来源）、clap::Error（CliOutput.source 字段）

    use assert_json_diff::assert_json_eq;
    use serde_json::Value;
    // 传输层分类码由 transport crate 拥有，测试断言直接从其引入。
    use wecom_transport::{E_HTTP, E_PARSE};

    use super::*;

    // ── 码段范围门禁 ──

    /// P0：本 crate 分配的专属码全部落在 wecom 码段（893000-893099）内
    ///
    /// 与 [`wecom_error::codes::range::WECOM`] 保持一致；`E_OTHER` 是
    /// 全 workspace 共享的兜底码（893999），不在 crate 专属段内，故排除。
    /// wecom 新增专属错误码时若落在段外，本测试失败而非静默越界。
    #[test]
    fn crate_owned_codes_stay_in_wecom_range() {
        let owned = [
            E_VALIDATION,
            E_SUBCMD,
            E_IO,
            E_CLI,
            E_CONFIG_CLIENT,
            E_PERMISSION,
        ];
        let range = wecom_error::codes::range::WECOM;
        for code in owned {
            assert!(
                range.contains(&code),
                "wecom-owned code {code} escapes range {range:?}"
            );
        }
        // 共享兜底码不受 crate 专属段约束（此处仅为「确实共享」的防回归断言）
        assert_eq!(E_OTHER, 893999);
    }

    // ── render() ──

    /// P0：Validation 错误的 render 输出包含正确的类型、消息和错误码
    /// 条件：创建 Error::validation("field is required")
    /// 断言：JSON 结构为 {"error": {"type":"ValidationError","code":893001,"message":"field is required"}}
    #[test]
    fn render_validation() {
        let e = Error::validation("field is required");
        let v: Value = serde_json::from_str(&e.render()).unwrap();
        assert_json_eq!(
            v,
            json!({
                "error": {
                    "type": "ValidationError",
                    "code": E_VALIDATION,
                    "message": "field is required"
                }
            })
        );
    }

    /// P0：Config 错误的 render 输出包含正确的类型、消息和错误码
    /// 条件：创建 Error::config("invalid transport type")
    /// 断言：JSON 结构为 {"error": {"type":"ConfigError","code":893005,"message":"invalid transport type"}}
    #[test]
    fn render_config() {
        let e = Error::config("invalid transport type");
        let v: Value = serde_json::from_str(&e.render()).unwrap();
        assert_json_eq!(
            v,
            json!({
                "error": {
                    "type": "ConfigError",
                    "code": E_CONFIG_CLIENT,
                    "message": "invalid transport type"
                }
            })
        );
    }

    /// P0：Permission 错误（Wrapped 包裹 fs 变体）的 render 输出包含正确的类型、消息和错误码
    /// 条件：由 wecom_fs::Error::Permission("路径超出沙箱") 转换
    /// 断言：JSON 结构为 {"error": {"type":"PermissionError","code":893006,"message":"路径超出沙箱"}}
    #[test]
    fn render_permission() {
        let e: Error = wecom_fs::Error::Permission("路径超出沙箱".into()).into();
        let v: Value = serde_json::from_str(&e.render()).unwrap();
        assert_json_eq!(
            v,
            json!({
                "error": {
                    "type": "PermissionError",
                    "code": E_PERMISSION,
                    "message": "路径超出沙箱"
                }
            })
        );
    }

    /// P1：网络错误（Wrapped 包裹的 transport Other）的 render 输出包含原始消息
    /// 条件：创建 Wrapped(transport::Error::other("connection refused"))
    /// 断言：render 结果的 message 字段匹配 "connection refused"
    #[test]
    fn render_network() {
        let e = Error::Wrapped(Box::new(wecom_transport::Error::other(
            "connection refused".into(),
        )));
        let v: Value = serde_json::from_str(&e.render()).unwrap();
        assert_json_eq!(
            v["error"]["message"],
            serde_json::json!("connection refused")
        );
    }

    /// P1：HTTP 错误的 render 输出包含类型、状态码和 endpoint
    /// 条件：创建 Wrapped(transport::Error::Http)，status=404，endpoint 为 example.com/api
    /// 断言：JSON 结构为 {"error":{"type":"HTTPError","code":893102,"message":"not found","endpoint":"https://example.com/api","status":404}}
    #[test]
    fn render_http() {
        let e = Error::Wrapped(Box::new(wecom_transport::Error::Http {
            message: "not found".into(),
            endpoint: "https://example.com/api".into(),
            status: 404,
        }));
        let v: Value = serde_json::from_str(&e.render()).unwrap();
        assert_json_eq!(
            v,
            json!({
                "error": {
                    "type": "HTTPError",
                    "code": E_HTTP,
                    "message": "not found",
                    "endpoint": "https://example.com/api",
                    "status": 404
                }
            })
        );
    }

    /// P1：API 错误的 render 直接返回原始响应体
    /// 条件：创建 Wrapped(transport::Error::Api)，body 含 errcode 和 errmsg
    /// 断言：render 结果等于原始 body JSON
    #[test]
    fn render_api_returns_body() {
        let body = serde_json::json!({"errcode":40001,"errmsg":"invalid credential"});
        let e = Error::Wrapped(Box::new(wecom_transport::Error::Api {
            message: "invalid credential".into(),
            action: "test".into(),
            code: Some(40001),
            body: Box::new(body.clone()),
        }));
        let rendered: Value = serde_json::from_str(&e.render()).unwrap();
        assert_json_eq!(rendered, body);
    }

    /// P0：IO 错误（Wrapped 包裹 fs 变体）的 render 输出包含 type、message 和 kind
    /// 条件：由 wecom_fs::Error::Io 转换，message 为 "disk full"
    /// 断言：JSON 中 type 为 IOError，message 和 kind 匹配
    #[test]
    fn render_io() {
        let e: Error = wecom_fs::Error::Io {
            message: "disk full".into(),
            source: std::io::Error::other("disk full"),
        }
        .into();
        let v: Value = serde_json::from_str(&e.render()).unwrap();
        assert_json_eq!(v["error"]["type"], serde_json::json!("IOError"));
        assert_json_eq!(v["error"]["message"], serde_json::json!("disk full"));
        assert_json_eq!(v["error"]["kind"], serde_json::json!("Other"));
    }

    /// P1：解析错误的 render 输出包含类型、错误码、消息、endpoint 和 body
    /// 条件：创建 Wrapped(transport::Error::Parse)，消息为 "missing field 'media_id'"
    /// 断言：JSON 结构含 type=ParseError, code=893103, endpoint, body
    #[test]
    fn render_parse() {
        let e = Error::Wrapped(Box::new(wecom_transport::Error::Parse {
            message: "missing field 'media_id'".into(),
            endpoint: "test".into(),
            body: Box::new(serde_json::json!({"unexpected":"data"})),
            source: None,
        }));
        let v: Value = serde_json::from_str(&e.render()).unwrap();
        assert_json_eq!(
            v,
            json!({
                "error": {
                    "type": "ParseError",
                    "code": E_PARSE,
                    "message": "missing field 'media_id'",
                    "endpoint": "test",
                    "body": {"unexpected": "data"}
                }
            })
        );
    }

    /// P1：Wrapped 包裹的 transport Other 错误的 render 输出含 type=UnknownError
    /// 条件：创建 Wrapped(transport::Error::other("something went wrong"))
    /// 断言：message 匹配，且 type 为 UnknownError
    #[test]
    fn render_other() {
        let e = Error::Wrapped(Box::new(wecom_transport::Error::other(
            "something went wrong".into(),
        )));
        let v: Value = serde_json::from_str(&e.render()).unwrap();
        assert_json_eq!(
            v["error"]["message"],
            serde_json::json!("something went wrong")
        );
        assert_json_eq!(v["error"]["type"], serde_json::json!("UnknownError"));
    }

    /// P1：CliOutput 错误直接返回预渲染消息
    /// 条件：创建 Error::CliOutput 含 code=0 和 version 消息
    /// 断言：render 直接返回原始 message 字符串
    #[test]
    fn render_cli_output_returns_message_as_is() {
        let e = Error::CliOutput {
            code: 0,
            message: "wecom 1.0.0".into(),
            source: None,
        };
        assert_eq!(e.render(), "wecom 1.0.0");
    }

    /// P1：[Error::render] 对 CliOutput 仅返回预渲染 message，忽略 source 中的 clap::Error
    /// 条件：构造一个携带 `Some(clap::Error)` 的 Error::CliOutput，message 为预渲染文本
    /// 断言：render 输出严格等于 message（不混入 clap::Error 文案），且 std::error::Error::source 暴露原 clap 错误
    #[test]
    fn render_cli_output_ignores_clap_source() {
        use std::error::Error as _;
        let clap_err = clap::Error::raw(clap::error::ErrorKind::InvalidValue, "raw clap message\n");
        let e = Error::CliOutput {
            code: 2,
            message: "pre-rendered usage error".into(),
            source: Some(clap_err),
        };
        assert_eq!(e.render(), "pre-rendered usage error");
        // source 应可被 std::error::Error::source 透出，便于上层自省 ErrorKind
        let src = e.source().expect("CliOutput.source should be exposed");
        assert!(src.is::<clap::Error>());
    }

    // ── exit_code() ──

    /// P0：CliOutput 错误返回其自身携带的退出码
    /// 条件：分别创建 code=0（帮助/版本）和 code=2（用法错误）的 CliOutput
    /// 断言：exit_code 分别为 0 和 2
    #[test]
    fn exit_code_cli_output() {
        assert_eq!(
            Error::CliOutput {
                code: 0,
                message: String::new(),
                source: None,
            }
            .exit_code(),
            0
        );
        assert_eq!(
            Error::CliOutput {
                code: 2,
                message: String::new(),
                source: None,
            }
            .exit_code(),
            2
        );
    }

    /// P1：[Error::exit_code] 非 CliOutput 错误统一返回退出码 1
    /// 条件：分别创建 Validation 和 Wrapped(transport::Other) 错误
    /// 断言：exit_code 均为 1
    #[test]
    fn exit_code_non_cli_output_is_1() {
        assert_eq!(Error::validation("x").exit_code(), 1);
        assert_eq!(
            Error::Wrapped(Box::new(wecom_transport::Error::other("x".into()))).exit_code(),
            1
        );
    }

    // ── code() ──

    /// P0：[Error::code] 顶层变体与 fs 包裹错误返回各自的分类码
    /// 条件：分别构造 Validation / Config / CliOutput / Other，以及 fs 包裹的 Permission / Io
    /// 断言：code() 分别返回对应分类码
    #[test]
    fn code_top_level_variants() {
        assert_eq!(Error::validation("x").code(), E_VALIDATION);
        assert_eq!(Error::config("x").code(), E_CONFIG_CLIENT);
        assert_eq!(
            Error::from(wecom_fs::Error::Permission("x".into())).code(),
            E_PERMISSION
        );
        assert_eq!(Error::from(std::io::Error::other("x")).code(), E_IO);
        assert_eq!(
            Error::CliOutput {
                code: 0,
                message: String::new(),
                source: None,
            }
            .code(),
            E_CLI
        );
        assert_eq!(Error::other("x".into()).code(), E_OTHER);
    }

    /// P0：[Error::code] Wrapped 包裹的 transport 子变体经委托映射到正确分类码
    /// 条件：分别构造 Wrapped(Http) / Wrapped(Parse) / Wrapped(Api) / Wrapped(Other)
    /// 断言：code() 分别返回 E_HTTP / E_PARSE / 透传后台错误码 / E_OTHER
    #[test]
    fn code_wrapped_transport_variants() {
        assert_eq!(
            Error::Wrapped(Box::new(wecom_transport::Error::Http {
                message: "x".into(),
                endpoint: "http://e".into(),
                status: 500,
            }))
            .code(),
            E_HTTP
        );
        assert_eq!(
            Error::Wrapped(Box::new(wecom_transport::Error::Parse {
                message: "x".into(),
                endpoint: "/e".into(),
                body: Box::new(serde_json::Value::Null),
                source: None,
            }))
            .code(),
            E_PARSE
        );
        // Api should pass through the backend error code directly.
        assert_eq!(
            Error::Wrapped(Box::new(wecom_transport::Error::Api {
                message: "x".into(),
                action: "/a".into(),
                code: Some(40001),
                body: Box::new(serde_json::Value::Null),
            }))
            .code(),
            40001
        );
        // Api with no code defaults to 0.
        assert_eq!(
            Error::Wrapped(Box::new(wecom_transport::Error::Api {
                message: "x".into(),
                action: "/a".into(),
                code: None,
                body: Box::new(serde_json::Value::Null),
            }))
            .code(),
            0
        );
        assert_eq!(
            Error::Wrapped(Box::new(wecom_transport::Error::other("x".into()))).code(),
            E_OTHER
        );
    }

    // ── From impls ──

    /// P0：std::io::Error 经 From 装箱为 Wrapped（负载为 fs Io 变体）
    /// 条件：创建 NotFound 类型的 io::Error 并通过 .into() 转换
    /// 断言：结果为 Wrapped，code == E_IO，message 为原 io::Error 消息
    #[test]
    fn from_io_error() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "no such file");
        let e: Error = io_err.into();
        assert!(matches!(e, Error::Wrapped(_)));
        assert_eq!(e.code(), E_IO);
        assert_eq!(e.exit_code(), 1);
        assert_eq!(e.message(), "no such file");
    }

    // ── to_json() ──

    /// P0：[Error::to_json] Validation 错误返回正确的 type、message 和 code
    /// 条件：Error::validation("field is required")
    /// 断言：to_json() 含 type=ValidationError、code=E_VALIDATION、message 透传
    #[test]
    fn to_json_validation() {
        let e = Error::validation("field is required");
        assert_eq!(
            e.to_json(),
            json!({
                "error": {
                    "type": "ValidationError",
                    "code": E_VALIDATION,
                    "message": "field is required"
                }
            })
        );
    }

    /// P0：[Error::to_json] Config 错误返回正确的 type、message 和 code
    /// 条件：Error::config("invalid transport type")
    /// 断言：to_json() 含 type=ConfigError、code=E_CONFIG_CLIENT、message 透传
    #[test]
    fn to_json_config() {
        let e = Error::config("invalid transport type");
        assert_eq!(
            e.to_json(),
            json!({
                "error": {
                    "type": "ConfigError",
                    "code": E_CONFIG_CLIENT,
                    "message": "invalid transport type"
                }
            })
        );
    }

    /// P0：[Error::to_json] Permission 错误（fs 包裹）返回正确的 type、message 和 code
    /// 条件：由 wecom_fs::Error::Permission 转换
    /// 断言：to_json() 的 error 对象含 PermissionError 类型、消息与 code
    #[test]
    fn to_json_permission() {
        let e: Error = wecom_fs::Error::Permission("路径超出沙箱".into()).into();
        assert_eq!(
            e.to_json(),
            json!({
                "error": {
                    "type": "PermissionError",
                    "code": E_PERMISSION,
                    "message": "路径超出沙箱"
                }
            })
        );
    }

    /// P0：[Error::to_json] IO 错误（fs 包裹）返回正确的 type、message、code 和 kind
    /// 条件：由含 io::ErrorKind 的 fs Io 变体转换
    /// 断言：to_json() 含 IOError 类型、消息、code 与 kind
    #[test]
    fn to_json_io() {
        let e: Error = wecom_fs::Error::Io {
            message: "disk full".into(),
            source: std::io::Error::other("disk full"),
        }
        .into();
        assert_eq!(
            e.to_json(),
            json!({
                "error": {
                    "type": "IOError",
                    "code": E_IO,
                    "message": "disk full",
                    "kind": "Other",
                }
            })
        );
    }

    /// P1：[Error::to_json] Other 错误返回正确的 code、message 和 type
    /// 条件：构造 Error::other(自定义错误)
    /// 断言：to_json() 含 OtherError 类型、消息与 code
    #[test]
    fn to_json_other() {
        let e = Error::other("something went wrong".into());
        assert_eq!(
            e.to_json(),
            json!({
                "error": {
                    "type": "UnknownError",
                    "code": E_OTHER,
                    "message": "something went wrong"
                }
            })
        );
    }

    /// P1：[Error::to_json] CliOutput 返回 code、message 和 type
    /// 条件：Error::CliOutput { code:2, message:"usage error", source:None }
    /// 断言：to_json() 含 type=CliOutput、code=E_CLI、exit_code=2、message、kind=null
    #[test]
    fn to_json_cli_output() {
        let e = Error::CliOutput {
            code: 2,
            message: "usage error".into(),
            source: None,
        };
        assert_eq!(
            e.to_json(),
            json!({
                "error": {
                    "type": "CliOutput",
                    "code": E_CLI,
                    "exit_code": 2,
                    "message": "usage error",
                    "kind": null
                }
            })
        );
    }

    /// P1：[Error::to_json] Wrapped(Http) 委托负载 to_json，保留 type=HTTPError
    /// 条件：构造 Wrapped(Http) 变体
    /// 断言：to_json() 委托负载且 type 保持 HTTPError
    #[test]
    fn to_json_wrapped_http() {
        let e = Error::Wrapped(Box::new(wecom_transport::Error::Http {
            message: "not found".into(),
            endpoint: "https://example.com/api".into(),
            status: 404,
        }));
        assert_eq!(
            e.to_json(),
            json!({
                "error": {
                    "type": "HTTPError",
                    "code": E_HTTP,
                    "message": "not found",
                    "endpoint": "https://example.com/api",
                    "status": 404
                }
            })
        );
    }

    /// P1：[Error::to_json] Wrapped(Api) 委托负载 to_json，返回原始 body
    /// 条件：构造 Wrapped(Api) 变体
    /// 断言：to_json() 返回负载原始 body
    #[test]
    fn to_json_wrapped_api_returns_body() {
        let body = serde_json::json!({"errcode": 40001, "errmsg": "invalid credential"});
        let e = Error::Wrapped(Box::new(wecom_transport::Error::Api {
            message: "invalid credential".into(),
            action: "test".into(),
            code: Some(40001),
            body: Box::new(body.clone()),
        }));
        let rendered = e.to_json();
        assert_eq!(rendered, body);
    }

    // ── CliOutput to_json truncation ──

    /// P1：[Error::to_json] CliOutput 多行消息只保留首行并标记
    /// 条件：Error::CliOutput，message = "usage error\nmore details\nand more"
    /// 断言：to_json 中 message 字段为 "usage error\n[TRUNC]"
    #[test]
    fn to_json_cli_output_trunc_multiline() {
        let e = Error::CliOutput {
            code: 2,
            message: "usage error\nmore details\nand more".into(),
            source: None,
        };
        assert_eq!(
            e.to_json(),
            json!({
                "error": {
                    "type": "CliOutput",
                    "code": E_CLI,
                    "exit_code": 2,
                    "message": "usage error\n[TRUNC]",
                    "kind": null
                }
            })
        );
    }

    /// P1：[Error::to_json] CliOutput 单行超 100 字符消息截断并标记
    /// 条件：Error::CliOutput，message = "X"×101（单行）
    /// 断言：message 以 [TRUNC] 结尾，总长度为 100 + len("[TRUNC]")
    #[test]
    fn to_json_cli_output_trunc_long() {
        let long = "X".repeat(101);
        let e = Error::CliOutput {
            code: 2,
            message: long,
            source: None,
        };
        let v = e.to_json();
        let msg = v["error"]["message"].as_str().unwrap();
        assert!(msg.ends_with("[TRUNC]"));
        assert_eq!(msg.len(), 100 + "[TRUNC]".len());
        assert!(v["error"]["kind"].is_null());
    }

    // ── render() for top-level Other ──

    /// P1：[Error::render] 顶层 Error::Other 输出包含 type=UnknownError
    /// 条件：构造 Error::other("unexpected failure")
    /// 断言：render 输出 JSON 含 UnknownError type 和正确的 code
    #[test]
    fn render_top_level_other() {
        let e = Error::other("unexpected failure".into());
        let v: Value = serde_json::from_str(&e.render()).unwrap();
        assert_json_eq!(v["error"]["type"], serde_json::json!("UnknownError"));
        assert_json_eq!(
            v["error"]["message"],
            serde_json::json!("unexpected failure")
        );
        assert_json_eq!(v["error"]["code"], serde_json::json!(E_OTHER));
    }

    // ── message() ──

    /// P0：[Error::message] 所有变体返回正确的 message 字符串
    /// 条件：分别构造 Validation / Config / Permission / Io / CliOutput / Other
    /// 断言：各变体 message() 均返回构造时的 message
    #[test]
    fn message_all_variants() {
        assert_eq!(
            Error::validation("invalid input").message(),
            "invalid input"
        );
        assert_eq!(Error::config("bad config").message(), "bad config");
        assert_eq!(
            Error::from(wecom_fs::Error::Permission("denied".into())).message(),
            "denied"
        );
        assert_eq!(
            Error::io("disk error", std::io::Error::other("e")).message(),
            "disk error: e"
        );
        assert_eq!(
            Error::CliOutput {
                code: 0,
                message: "cli msg".into(),
                source: None,
            }
            .message(),
            "cli msg"
        );
        assert_eq!(Error::other("other error".into()).message(), "other error");
    }

    /// P1：[Error::message] Wrapped 变体委托负载 message
    /// 条件：构造 Wrapped(transport Http 错误)
    /// 断言：message() 委托负载消息
    #[test]
    fn message_wrapped_variant() {
        let e = Error::Wrapped(Box::new(wecom_transport::Error::Http {
            message: "not found".into(),
            endpoint: "/api".into(),
            status: 404,
        }));
        assert_eq!(e.message(), "not found");
    }

    // ── Error::io() 构造器 ──

    /// P0：[Error::io] 便利构造器生成带 context 前缀的 Wrapped(fs Io) 错误
    /// 条件：Error::io("ctx", io::Error)
    /// 断言：生成的错误消息含 "ctx" 前缀，code == E_IO
    #[test]
    fn io_constructor_with_context() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "no such file");
        let e = Error::io("Failed to open /path", io_err);
        assert!(matches!(e, Error::Wrapped(_)));
        assert_eq!(e.message(), "Failed to open /path: no such file");
        assert_eq!(e.code(), E_IO);
    }

    // ── Display impl ──

    /// P0：[Error::Display] Validation 变体格式化包含类型名、消息和错误码
    /// 条件：Error::validation("field required")
    /// 断言：Display 含 "ValidationError"、"field required"、code=893001
    #[test]
    fn display_validation() {
        let e = Error::validation("field required");
        let s = format!("{e}");
        assert!(s.contains("ValidationError"));
        assert!(s.contains("field required"));
        assert!(s.contains("code=893001"));
    }

    /// P0：[Error::Display] Config 变体格式化包含类型名、消息和错误码
    /// 条件：Error::config("bad transport")
    /// 断言：Display 含 "ConfigError"、"bad transport"、code=893005
    #[test]
    fn display_config() {
        let e = Error::config("bad transport");
        let s = format!("{e}");
        assert!(s.contains("ConfigError"));
        assert!(s.contains("bad transport"));
        assert!(s.contains("code=893005"));
    }

    /// P0：[Error::Display] Permission 错误（fs 包裹）格式化透传负载 Display
    /// 条件：由 wecom_fs::Error::Permission 转换并格式化
    /// 断言：to_string() 含 PermissionError 与消息
    #[test]
    fn display_permission() {
        let e: Error = wecom_fs::Error::Permission("path denied".into()).into();
        let s = format!("{e}");
        assert!(s.contains("PermissionError"));
        assert!(s.contains("path denied"));
    }

    /// P0：[Error::Display] Io 错误（fs 包裹）格式化透传负载 Display
    /// 条件：由含 io::ErrorKind 的 fs Io 变体转换并格式化
    /// 断言：to_string() 含消息与 kind
    #[test]
    fn display_io() {
        let e: Error = wecom_fs::Error::Io {
            message: "write failed".into(),
            source: std::io::Error::new(std::io::ErrorKind::PermissionDenied, "denied"),
        }
        .into();
        let s = format!("{e}");
        assert!(s.contains("IoError"));
        assert!(s.contains("write failed"));
        assert!(s.contains("kind=PermissionDenied"));
    }

    /// P1：[Error::Display] CliOutput 变体格式化包含消息、code、exit_code 和 kind
    /// 条件：Error::CliOutput { code:2, message:"usage error", source:None }
    /// 断言：Display 含 "CliOutput"、"usage error"、code=893004、exit=2、kind=?
    #[test]
    fn display_cli_output() {
        let e = Error::CliOutput {
            code: 2,
            message: "usage error".into(),
            source: None,
        };
        let s = format!("{e}");
        assert!(s.contains("CliOutput"));
        assert!(s.contains("usage error"));
        assert!(s.contains("code=893004"));
        assert!(s.contains("exit=2"));
        assert!(s.contains("kind=?"));
    }

    /// P1：[Error::Display] CliOutput 携带 clap source 时显示其 kind
    /// 条件：CliOutput { source: Some(clap::Error::raw(InvalidSubcommand)) }
    /// 断言：Display 含 "kind=unrecognized subcommand"
    #[test]
    fn display_cli_output_with_clap_source() {
        let clap_err = clap::Error::raw(clap::error::ErrorKind::InvalidSubcommand, "no such cmd");
        let e = Error::CliOutput {
            code: 2,
            message: "unknown subcommand".into(),
            source: Some(clap_err),
        };
        let s = format!("{e}");
        assert!(s.contains("kind=unrecognized subcommand"));
    }

    /// P1：[Error::Display] UnknownError 变体包含消息和 code
    /// 条件：Error::other("unexpected")
    /// 断言：Display 含 "UnknownError"、"unexpected"、code=893999
    #[test]
    fn display_other() {
        let e = Error::other("unexpected".into());
        let s = format!("{e}");
        assert!(s.contains("UnknownError"));
        assert!(s.contains("unexpected"));
        assert!(s.contains("code=893999"));
    }

    /// P1：[Error::Display] Wrapped 变体透明透传负载 Display（不叠加 code 尾巴）
    /// 条件：构造 Wrapped(transport Other 错误) 并格式化
    /// 断言：to_string() 委托负载 Display
    #[test]
    fn display_wrapped() {
        let e = Error::Wrapped(Box::new(wecom_transport::Error::other(
            "inner error".into(),
        )));
        let s = format!("{e}");
        assert!(s.contains("inner error"));
    }

    // ── From<wecom_transport::Error> ──

    /// P1：[From] wecom_transport::Error 自动装箱为 Error::Wrapped
    /// 条件：将 wecom_transport::Error 经 ? 或 From 转为 wecom::Error
    /// 断言：结果为 Error::Wrapped，能力委托不变
    #[test]
    fn from_transport_error() {
        let transport_err = wecom_transport::Error::other("wrapped".into());
        let e: Error = transport_err.into();
        assert!(matches!(e, Error::Wrapped(_)));
        assert_eq!(e.message(), "wrapped");
    }

    /// P0：[From<wecom_transport::Error>] 经 to_transport_error 装箱的 fs Permission 错误往返后能力不变
    /// 条件：fs Permission 错误（经 From 包为 Wrapped）经 crate::util::to_transport_error
    ///       装箱为 transport::Wrapped 后再经 From 转回
    /// 断言：结果为 Error::Wrapped(_)，code() == E_PERMISSION，to_json 恢复 PermissionError 结构
    #[test]
    fn from_transport_round_tripped_permission_keeps_capability() {
        let original: Error = wecom_fs::Error::Permission("路径超出沙箱".into()).into();
        let round_tripped: Error = crate::util::to_transport_error(original).into();
        // 不还原变体；Wrapped 链逐级委托全部能力。
        assert!(matches!(round_tripped, Error::Wrapped(_)));
        assert_eq!(round_tripped.code(), E_PERMISSION);
        assert_eq!(
            round_tripped.to_json(),
            json!({
                "error": {
                    "type": "PermissionError",
                    "code": E_PERMISSION,
                    "message": "路径超出沙箱"
                }
            })
        );
        assert_eq!(round_tripped.message(), "路径超出沙箱");
    }

    /// P0：[From<wecom_transport::Error>] 经 to_transport_error 装箱的 Io 错误往返后能力不变且 message 无重复 code 尾巴
    /// 条件：Error::Io 经 crate::util::to_transport_error 装箱为 transport::Wrapped 后再经 From 转回
    /// 断言：code() == E_IO，message() 为原始消息（不含 Display 的 [code=…] 后缀）
    #[test]
    fn from_transport_round_tripped_io_keeps_capability() {
        let original = Error::io(
            "Failed to open /tmp/x",
            std::io::Error::new(std::io::ErrorKind::NotFound, "no such file"),
        );
        let round_tripped: Error = crate::util::to_transport_error(original).into();
        assert_eq!(round_tripped.code(), E_IO);
        assert_eq!(
            round_tripped.message(),
            "Failed to open /tmp/x: no such file"
        );
        assert_eq!(round_tripped.to_json()["error"]["type"], "IOError");
    }

    /// P0：[From<wecom_transport::Error>] Wrapped 负载经 to_transport_error downcast 恢复为具体 transport 错误
    /// 条件：Error::Wrapped(Http) 经 to_transport_error 向下转型拆包为 Http，再经 From 转回
    /// 断言：code() == E_HTTP，且 as_any 可恢复出 Http { status: 404 } 具体变体
    #[test]
    fn from_transport_round_tripped_transport_variant() {
        let original = Error::Wrapped(Box::new(wecom_transport::Error::Http {
            message: "not found".into(),
            endpoint: "https://example.com/api".into(),
            status: 404,
        }));
        let round_tripped: Error = crate::util::to_transport_error(original).into();
        assert!(matches!(round_tripped, Error::Wrapped(_)));
        assert_eq!(round_tripped.code(), E_HTTP);
        // downcast 恢复：具体 transport 变体（含 status 字段）仍可结构化访问。
        let Error::Wrapped(inner) = &round_tripped else {
            panic!("expected Wrapped, got: {round_tripped:?}");
        };
        let recovered = inner
            .as_any()
            .downcast_ref::<wecom_transport::Error>()
            .expect("payload should recover as wecom_transport::Error");
        assert!(
            matches!(recovered, wecom_transport::Error::Http { status: 404, .. }),
            "expected Http 404, got: {recovered:?}"
        );
    }

    /// P1：[From<wecom_transport::Error>] transport::Other 内的外部负载能力按 E_OTHER 透传
    /// 条件：transport::Other 内装箱 io::Error（外部错误），经 From 转换
    /// 断言：结果为 Error::Wrapped(_)，code() == E_OTHER，message 透传
    #[test]
    fn from_transport_foreign_other_payload_delegates() {
        let foreign = wecom_transport::Error::other(Box::new(std::io::Error::other("disk full")));
        let e: Error = foreign.into();
        assert!(matches!(e, Error::Wrapped(_)));
        assert_eq!(e.code(), E_OTHER);
        assert_eq!(e.message(), "disk full");
    }

    // ── CliOutput code 分支 ──

    /// P2：[Error::code] CliOutput 子命令错误返回 E_SUBCMD
    /// 条件：CliOutput { source: Some(clap::Error::raw(InvalidSubcommand)) }
    /// 断言：code() == E_SUBCMD
    #[test]
    fn code_cli_output_subcommand() {
        let clap_err = clap::Error::raw(
            clap::error::ErrorKind::InvalidSubcommand,
            "no such subcommand",
        );
        let e = Error::CliOutput {
            code: 2,
            message: "unknown subcommand".into(),
            source: Some(clap_err),
        };
        assert_eq!(e.code(), E_SUBCMD);
    }

    // ── code: CliOutput with non-subcommand error kind ──

    /// P2：[Error::code] CliOutput 携带 None source 时返回 E_CLI（非子命令错误）
    /// 条件：source 为 None
    /// 断言：code() == E_CLI
    #[test]
    fn code_cli_output_without_clap_source_returns_e_cli() {
        let e = Error::CliOutput {
            code: 0,
            message: "version info".into(),
            source: None,
        };
        assert_eq!(e.code(), E_CLI);
    }

    // ── WecomError trait equivalence ──
    /// P0：[WecomError] code / message / to_json / render / exit_code 与 inherent 完全等价
    ///
    /// 覆盖全部变体，锁定 trait 实现与 inherent 方法行为一致。
    #[test]
    fn wecom_error_trait_matches_inherent_methods() {
        use wecom_error::WecomError;

        let cases: Vec<Error> = vec![
            Error::validation("bad"),
            Error::config("cfg"),
            wecom_fs::Error::Permission("denied".into()).into(),
            Error::CliOutput {
                code: 2,
                message: "usage".into(),
                source: None,
            },
            Error::other("wrapped".into()),
            Error::Wrapped(Box::new(wecom_transport::Error::Http {
                message: "h".into(),
                endpoint: "/e".into(),
                status: 500,
            })),
        ];

        for e in &cases {
            assert_eq!(WecomError::code(e), Error::code(e), "code drift on {e:?}");
            assert_eq!(
                WecomError::message(e),
                Error::message(e),
                "message drift on {e:?}"
            );
            assert_eq!(
                WecomError::to_json(e),
                Error::to_json(e),
                "to_json drift on {e:?}"
            );
            assert_eq!(
                WecomError::render(e),
                Error::render(e),
                "render drift on {e:?}"
            );
            assert_eq!(
                WecomError::exit_code(e),
                Error::exit_code(e),
                "exit_code drift on {e:?}"
            );
        }
    }

    /// P0：[WecomError::error_type] 各变体均有稳定字面量
    #[test]
    fn wecom_error_error_type_stable_labels() {
        use wecom_error::WecomError;

        assert_eq!(Error::validation("x").error_type(), "ValidationError");
        assert_eq!(
            Error::from(wecom_fs::Error::Permission("x".into())).error_type(),
            "PermissionError"
        );
        assert_eq!(Error::config("x").error_type(), "ConfigError");
        assert_eq!(
            Error::CliOutput {
                code: 0,
                message: "m".into(),
                source: None,
            }
            .error_type(),
            "CliOutput"
        );
        assert_eq!(Error::other("x".into()).error_type(), "UnknownError");
        // Wrapped 委托负载自身的标签，与 to_json 内层标签一致。
        assert_eq!(
            Error::Wrapped(Box::new(wecom_transport::Error::Config("x".into()))).error_type(),
            "ConfigError"
        );
    }
}
