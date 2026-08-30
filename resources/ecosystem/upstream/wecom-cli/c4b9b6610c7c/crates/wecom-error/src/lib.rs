//! Unified capability contract for all error types across the workspace.
//!
//! This crate hosts only the [`WecomError`] trait and the error-code
//! allocation table.  It deliberately depends on nothing but `serde_json`
//! so that low-level crates such as `wecom-fs` can implement the trait
//! without pulling in HTTP / transport / CLI dependencies.
//!
//! The trait is object-safe (`Box<dyn WecomError>` legal): higher layers
//! can receive a marshaled error from a callback boundary and still
//! answer `code()` / `error_type()` / `message()` / `to_json()` /
//! `render()` / `exit_code()` without any downcast.

pub mod codes;

use serde_json::Value;

/// A message-only error with an explicit category code and stable type label.
///
/// Hosts the "basic" error semantics shared across the workspace
/// (validation, configuration, …) so that each crate doesn't define its own
/// isomorphic `Validation(String)` / `Config(String)` variant. The default
/// `to_json` / `render` / `exit_code` of [`WecomError`] already produce the
/// canonical shape for this type; only `Display` adds the `[code=…]` tail.
#[derive(Debug)]
pub struct MessageError {
    code: i64,
    error_type: &'static str,
    message: String,
}

impl MessageError {
    /// Generic constructor — prefer the named category constructors below.
    pub fn new(code: i64, error_type: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            error_type,
            message: message.into(),
        }
    }

    /// Input validation failed (missing required field, empty method path, …).
    pub fn validation(message: impl Into<String>) -> Self {
        Self::new(codes::E_VALIDATION, "ValidationError", message)
    }

    /// Client / builder configuration error (invalid access token, unknown
    /// transport type, malformed config file, …).
    pub fn config(message: impl Into<String>) -> Self {
        Self::new(codes::E_CONFIG_CLIENT, "ConfigError", message)
    }
}

impl std::fmt::Display for MessageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}: {} [code={}]",
            self.error_type, self.message, self.code
        )
    }
}

impl std::error::Error for MessageError {}

impl WecomError for MessageError {
    fn code(&self) -> i64 {
        self.code
    }

    fn message(&self) -> String {
        self.message.clone()
    }

    fn error_type(&self) -> &'static str {
        self.error_type
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn into_any(self: Box<Self>) -> Box<dyn std::any::Any> {
        self
    }
}

/// Catch-all for foreign errors with no [`WecomError`] implementation
/// (reqwest internals, plain strings, `std::io::Error`, …).
///
/// Surfaces as `UnknownError` / [`codes::E_OTHER`] on every channel. Crates
/// wrap it in their `Wrapped` variant via an `Error::other(...)` constructor
/// instead of defining their own `Other` variant.
#[derive(Debug)]
pub struct OtherError(pub Box<dyn std::error::Error + Send + Sync>);

impl std::fmt::Display for OtherError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "UnknownError: {} [code={}]", self.0, codes::E_OTHER)
    }
}

impl std::error::Error for OtherError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        Some(&*self.0)
    }
}

impl WecomError for OtherError {
    fn code(&self) -> i64 {
        codes::E_OTHER
    }

    fn message(&self) -> String {
        self.0.to_string()
    }

    fn error_type(&self) -> &'static str {
        "UnknownError"
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn into_any(self: Box<Self>) -> Box<dyn std::any::Any> {
        self
    }
}

/// Recover the concrete `T` behind a boxed payload when possible, otherwise
/// hand the box to `fallback`.
///
/// `downcast` failure would return `Box<dyn Any>` (no way back to
/// `Box<dyn WecomError>` on stable Rust), so the payload type is probed via
/// `as_any` before the consuming `into_any` — the downcast cannot fail once
/// the probe passes.
pub fn downcast_or<T: WecomError>(
    payload: Box<dyn WecomError>,
    fallback: impl FnOnce(Box<dyn WecomError>) -> T,
) -> T {
    if payload.as_any().is::<T>() {
        let Ok(t) = payload.into_any().downcast::<T>() else {
            unreachable!("payload type verified by as_any");
        };
        *t
    } else {
        fallback(payload)
    }
}

/// Uniform capability contract across every error type in the workspace.
///
/// Implementors keep their own domain-specific variants private; this
/// trait exposes only the six capabilities that downstream consumers
/// (CLI output, structured logging / KV reporting, exit-code selection) actually
/// need.  All five query methods take `&self`, so the trait is object-safe.
pub trait WecomError: std::error::Error + Send + Sync + 'static {
    /// Category error code within the `893000-893999` scheme.
    ///
    /// The value surfaces as `error.code` of the rendered JSON and as
    /// `tool_call.errcode` on the monitoring dashboard.  It MUST be stable
    /// across releases.
    fn code(&self) -> i64;

    /// Human-facing message without the `[code=…]` suffix that `Display`
    /// may append.
    fn message(&self) -> String;

    /// Stable type label used as the `error.type` field of the canonical
    /// JSON representation (e.g. `"ValidationError"`, `"HTTPError"`).
    ///
    /// This is the hook that makes the default `to_json()` implementation
    /// work: each variant's JSON shape only differs in this single string.
    fn error_type(&self) -> &'static str;

    /// Structured JSON representation.
    ///
    /// The default implementation produces the canonical shape shared by
    /// the vast majority of variants.  Override only when the variant
    /// needs extra context fields (`endpoint`, `status`, `kind`, …) or
    /// must pass through a raw server body (see
    /// `wecom_transport::Error::Api`).
    fn to_json(&self) -> Value {
        serde_json::json!({
            "error": {
                "type": self.error_type(),
                "code": self.code(),
                "message": self.message(),
            },
        })
    }

    /// Ready-to-display string.  Defaults to the pretty-printed `to_json`,
    /// falling back to `Display` when serialization fails (which should
    /// never happen in practice).
    fn render(&self) -> String {
        serde_json::to_string_pretty(&self.to_json()).unwrap_or_else(|_| self.to_string())
    }

    /// Suggested process exit code.
    ///
    /// * `0` — help / version output.
    /// * `2` — usage errors (unmatched subcommand, clap parse failure).
    /// * `1` — every other error (the default).
    fn exit_code(&self) -> i32 {
        1
    }

    /// Downcast hook: view this error as [`std::any::Any`] so a caller holding
    /// `&dyn WecomError` can recover the concrete type
    /// (`as_any().downcast_ref::<T>()`).
    ///
    /// Capability methods (`code` / `message` / `to_json` / …) cover almost
    /// every use case; reach for this only when the concrete type is genuinely
    /// required — e.g. handing a transport error back into a transport
    /// callback that demands `wecom_transport::Error` by name.
    ///
    /// The implementation is always the trivial `{ self }` coercion (no
    /// default body can be provided: the coercion requires `Self: Sized`,
    /// which would exclude `dyn WecomError` from calling the method).
    fn as_any(&self) -> &dyn std::any::Any;

    /// Consuming counterpart of [`as_any`](Self::as_any), recovering the
    /// concrete type from a `Box<dyn WecomError>` (`into_any().downcast::<T>()`).
    /// Same trivial `{ self }` body in every implementor.
    fn into_any(self: Box<Self>) -> Box<dyn std::any::Any>;
}

// ── `From<E>` for `Box<dyn WecomError>` ─────────────────────────────
//
// Blanket impl so that `Box<dyn WecomError>::from(any_wecom_error)` just
// works.  Deliberately NOT implementing `WecomError for Box<dyn WecomError>`
// would conflict with this blanket `From`; consumers should go through
// `&*boxed` to recover `&dyn WecomError`.

impl<E: WecomError> From<E> for Box<dyn WecomError> {
    fn from(e: E) -> Self {
        Box::new(e)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Minimal implementor used only in this crate's unit tests.
    #[derive(Debug)]
    struct FakeError {
        code: i64,
        message: &'static str,
    }

    impl std::fmt::Display for FakeError {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "FakeError: {}", self.message)
        }
    }

    impl std::error::Error for FakeError {}

    impl WecomError for FakeError {
        fn code(&self) -> i64 {
            self.code
        }

        fn message(&self) -> String {
            self.message.to_string()
        }

        fn error_type(&self) -> &'static str {
            "FakeError"
        }

        fn as_any(&self) -> &dyn std::any::Any {
            self
        }

        fn into_any(self: Box<Self>) -> Box<dyn std::any::Any> {
            self
        }
    }

    /// P0：[WecomError::to_json] 默认实现产出 {error: {type, code, message}}
    /// 条件：使用默认 to_json 的最小实现
    /// 断言：JSON 形状与字段值正确
    #[test]
    fn default_to_json_shape() {
        let e = FakeError {
            code: 893001,
            message: "boom",
        };
        let json = e.to_json();
        assert_eq!(json["error"]["type"], "FakeError");
        assert_eq!(json["error"]["code"], 893001);
        assert_eq!(json["error"]["message"], "boom");
        // default impl produces only the three canonical keys
        assert_eq!(
            json["error"].as_object().map(|o| o.len()),
            Some(3),
            "default to_json must emit exactly the canonical three keys"
        );
    }

    /// P0：[WecomError::render] 默认实现是 pretty-printed to_json
    /// 条件：使用默认 render
    /// 断言：render 输出可被解析回等价 Json，且缩进为 2 空格
    #[test]
    fn default_render_is_pretty_printed_to_json() {
        let e = FakeError {
            code: 893001,
            message: "boom",
        };
        let rendered = e.render();
        // pretty-printed => starts with `{` and contains a newline+indent
        assert!(rendered.starts_with('{'));
        assert!(rendered.contains("\n  \"error\""));
        // round-trips back to the same shape
        let parsed: serde_json::Value = serde_json::from_str(&rendered).unwrap();
        assert_eq!(parsed, e.to_json());
    }

    /// P0：[WecomError::exit_code] 默认值为 1
    #[test]
    fn default_exit_code_is_one() {
        let e = FakeError {
            code: 1,
            message: "x",
        };
        assert_eq!(e.exit_code(), 1);
    }

    /// P0：Box<dyn WecomError> blanket From 提供
    /// 条件：直接由 FakeError 构造 Box<dyn WecomError>
    /// 断言：code() 委托到内层
    #[test]
    fn boxed_dyn_wecom_error_from_any_implementor() {
        let boxed: Box<dyn WecomError> = FakeError {
            code: 893999,
            message: "wrapped",
        }
        .into();
        assert_eq!(boxed.code(), 893999);
        assert_eq!(boxed.error_type(), "FakeError");
    }

    /// P1：trait 是 object-safe — 可被装箱为 dyn
    #[test]
    fn trait_is_object_safe() {
        fn assert_object_safe(_: &dyn WecomError) {}
        let e = FakeError {
            code: 1,
            message: "x",
        };
        assert_object_safe(&e);
    }

    /// P0：[WecomError::as_any / into_any] 默认实现可向下转型恢复具体类型
    /// 条件：FakeError 分别经 `&dyn WecomError` 与 `Box<dyn WecomError>` 转型
    /// 断言：downcast_ref / downcast 均恢复出原类型且字段值不变
    #[test]
    fn any_downcast_recovers_concrete_type() {
        let e = FakeError {
            code: 893001,
            message: "boom",
        };
        let dyn_ref: &dyn WecomError = &e;
        assert!(dyn_ref.as_any().is::<FakeError>());
        let recovered = dyn_ref.as_any().downcast_ref::<FakeError>().unwrap();
        assert_eq!(recovered.code, 893001);

        let boxed: Box<dyn WecomError> = FakeError {
            code: 893999,
            message: "wrapped",
        }
        .into();
        let recovered = boxed.into_any().downcast::<FakeError>().unwrap();
        assert_eq!(recovered.message, "wrapped");
    }

    /// P0：[MessageError] 分类构造器的 code / type / message / JSON 形状
    /// 条件：分别构造 validation / config
    /// 断言：能力与默认 to_json 形状正确，Display 含 [code=…] 尾巴
    #[test]
    fn message_error_category_constructors() {
        let v = MessageError::validation("field required");
        assert_eq!(v.code(), codes::E_VALIDATION);
        assert_eq!(v.error_type(), "ValidationError");
        assert_eq!(v.message(), "field required");
        assert_eq!(
            v.to_json(),
            serde_json::json!({
                "error": {
                    "type": "ValidationError",
                    "code": codes::E_VALIDATION,
                    "message": "field required",
                }
            })
        );
        assert_eq!(
            v.to_string(),
            format!(
                "ValidationError: field required [code={}]",
                codes::E_VALIDATION
            )
        );

        let c = MessageError::config("bad token");
        assert_eq!(c.code(), codes::E_CONFIG_CLIENT);
        assert_eq!(c.error_type(), "ConfigError");
    }

    /// P0：[downcast_or] 命中具体类型时拆包恢复，未命中时走 fallback
    /// 条件：payload 分别为 MessageError / FakeError
    /// 断言：前者恢复出 MessageError；后者进入 fallback 且负载不丢失
    #[test]
    fn downcast_or_recovers_or_falls_back() {
        let hit: Box<dyn WecomError> = Box::new(MessageError::validation("x"));
        let recovered: MessageError = downcast_or(hit, |_| unreachable!("must recover"));
        assert_eq!(recovered.message(), "x");

        let miss: Box<dyn WecomError> = Box::new(FakeError {
            code: 1,
            message: "foreign",
        });
        let fallen_back = downcast_or(miss, |w| {
            assert_eq!(w.message(), "foreign");
            MessageError::config("fallback")
        });
        assert_eq!(fallen_back.message(), "fallback");
    }

    /// P0：[OtherError] 外部错误负载的 code / type / message / source 行为
    /// 条件：分别包装 io::Error 与 &str
    /// 断言：code == E_OTHER、type 为 UnknownError、message 透传、source 链到内层
    #[test]
    fn other_error_wraps_foreign_payload() {
        let e = OtherError(Box::new(std::io::Error::other("disk full")));
        assert_eq!(e.code(), codes::E_OTHER);
        assert_eq!(e.error_type(), "UnknownError");
        assert_eq!(e.message(), "disk full");
        assert_eq!(
            e.to_json(),
            serde_json::json!({
                "error": {
                    "type": "UnknownError",
                    "code": codes::E_OTHER,
                    "message": "disk full",
                }
            })
        );
        assert!(std::error::Error::source(&e).is_some());
        assert!(e.to_string().contains("disk full"));

        // &str 负载（经 From<&str> for Box<dyn Error>）
        let s = OtherError("plain string".into());
        assert_eq!(s.message(), "plain string");
    }

    /// P0：[OtherError] as_any / into_any 向下转型恢复具体类型
    /// 条件：OtherError 分别经 `&dyn WecomError` 与 `Box<dyn WecomError>` 转型
    /// 断言：downcast_ref / downcast 均恢复出 OtherError
    #[test]
    fn other_error_any_downcast_recovers_concrete_type() {
        let e = OtherError("plain".into());
        let dyn_ref: &dyn WecomError = &e;
        assert!(dyn_ref.as_any().is::<OtherError>());

        let boxed: Box<dyn WecomError> = Box::new(OtherError("plain".into()));
        assert!(boxed.into_any().downcast::<OtherError>().is_ok());
    }

    /// P2：[FakeError] Display 输出包含 message（测试夹具的自描述性校验）
    /// 条件：构造 message="shown" 的 FakeError
    /// 断言：to_string() == "FakeError: shown"
    #[test]
    fn fake_error_display_includes_message() {
        let e = FakeError {
            code: 1,
            message: "shown",
        };
        assert_eq!(e.to_string(), "FakeError: shown");
    }
}
