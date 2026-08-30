//! Error type for filesystem capability operations.
//!
//! Deliberately fs-scoped: transport, CLI-output and configuration errors
//! belong to higher layers. Embedding crates convert into their own error
//! type (e.g. `wecom::Error`) at the call boundary.

/// Result alias for filesystem capability operations.
pub type Result<T> = std::result::Result<T, Error>;

/// Errors produced by [`crate::Fs`] implementations.
#[derive(Debug)]
#[non_exhaustive]
pub enum Error {
    /// Permission denied (e.g. path outside the sandbox roots, or matched by a
    /// deny rule).
    Permission(String),

    /// I/O errors (filesystem, temp files, etc.).
    Io {
        /// Context-prefixed message (e.g. `"Failed to open /path: ..."`).
        message: String,
        /// The underlying I/O error.
        source: std::io::Error,
    },

    /// Capability-carrying wrapper for errors outside the fs-specific
    /// taxonomy: input validation ([`wecom_error::MessageError`] via
    /// [`Error::validation`]) and foreign catch-alls
    /// ([`wecom_error::OtherError`] via [`Error::other`]).
    Wrapped(Box<dyn wecom_error::WecomError>),
}

impl Error {
    /// Create an `Io` variant with the `context` followed by the error reason.
    ///
    /// Produces messages like `"Failed to open /path: No such file (os error 2)"`.
    #[must_use]
    pub fn io(context: impl std::fmt::Display, source: std::io::Error) -> Self {
        Error::Io {
            message: format!("{context}: {source}"),
            source,
        }
    }

    /// Input validation failed (path is not a directory, non-UTF-8 path, …):
    /// a wrapped [`wecom_error::MessageError`] (`ValidationError` /
    /// `E_VALIDATION`).
    #[must_use]
    pub fn validation(message: impl Into<String>) -> Self {
        Error::Wrapped(Box::new(wecom_error::MessageError::validation(message)))
    }

    /// Catch-all for errors that don't fit the fs-specific variants: wraps the
    /// payload in [`wecom_error::OtherError`] behind [`Error::Wrapped`]
    /// (`UnknownError` / `E_OTHER`).
    #[must_use]
    pub fn other(payload: Box<dyn std::error::Error + Send + Sync>) -> Self {
        Error::Wrapped(Box::new(wecom_error::OtherError(payload)))
    }
}

impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self {
        Error::Io {
            message: e.to_string(),
            source: e,
        }
    }
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::Permission(msg) => write!(f, "PermissionError: {msg}"),
            Error::Io { message, source } => {
                write!(f, "IoError: {message} [kind={:?}]", source.kind())
            }
            // Transparent passthrough: the payload renders its own tail.
            Error::Wrapped(inner) => write!(f, "{inner}"),
        }
    }
}

impl std::error::Error for Error {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Error::Io { source, .. } => Some(source),
            _ => None,
        }
    }
}

impl wecom_error::WecomError for Error {
    fn code(&self) -> i64 {
        match self {
            // `wecom_fs::Error` variants share the `wecom` taxonomy codes
            // (constants defined publicly in [`wecom_error::codes`]).
            Error::Permission(_) => wecom_error::codes::E_PERMISSION,
            Error::Io { .. } => wecom_error::codes::E_IO,
            Error::Wrapped(inner) => inner.code(),
        }
    }

    fn message(&self) -> String {
        match self {
            Error::Permission(m) => m.clone(),
            Error::Io { message, .. } => message.clone(),
            Error::Wrapped(inner) => inner.message(),
        }
    }

    fn error_type(&self) -> &'static str {
        match self {
            Error::Permission(_) => "PermissionError",
            Error::Io { .. } => "IOError",
            Error::Wrapped(inner) => inner.error_type(),
        }
    }

    fn to_json(&self) -> serde_json::Value {
        match self {
            // `kind` 保留 io::ErrorKind 诊断信息——与 `wecom::Error::Io`
            // 的 JSON 形状逐字节一致。
            Error::Io { message, source } => serde_json::json!({
                "error": {
                    "type": "IOError",
                    "code": self.code(),
                    "message": message,
                    "kind": format!("{:?}", source.kind()),
                }
            }),
            Error::Wrapped(inner) => inner.to_json(),
            _ => serde_json::json!({
                "error": {
                    "type": self.error_type(),
                    "code": self.code(),
                    "message": self.message(),
                }
            }),
        }
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn into_any(self: Box<Self>) -> Box<dyn std::any::Any> {
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// P0：[WecomError for wecom_fs::Error] code / message / error_type 分配正确
    /// 条件：构造 Permission / Io 变体与 validation / other 构造器
    /// 断言：code 返回共享码；error_type 与 wecom 层同义
    #[test]
    fn fs_error_wecom_error_mapping() {
        use wecom_error::WecomError;

        let v = Error::validation("bad path");
        assert_eq!(v.code(), wecom_error::codes::E_VALIDATION);
        assert_eq!(v.error_type(), "ValidationError");
        assert_eq!(v.message(), "bad path");

        let p = Error::Permission("denied".into());
        assert_eq!(p.code(), wecom_error::codes::E_PERMISSION);
        assert_eq!(p.error_type(), "PermissionError");

        let io = Error::Io {
            message: "boom".into(),
            source: std::io::Error::other("disk full"),
        };
        assert_eq!(io.code(), wecom_error::codes::E_IO);
        assert_eq!(io.error_type(), "IOError");
        assert_eq!(io.message(), "boom");

        let other = Error::other("wrap".into());
        assert_eq!(other.code(), wecom_error::codes::E_OTHER);
        assert_eq!(other.error_type(), "UnknownError");
    }

    /// P1：[WecomError::to_json] validation 构造器的 JSON 形状
    /// 条件：Error::validation("bad")
    /// 断言：error.code 与 wecom 层一致，保证外部消费方解析无漂移
    #[test]
    fn fs_error_to_json_canonical_shape() {
        use wecom_error::WecomError;
        let v = Error::validation("bad");
        let json = v.to_json();
        assert_eq!(
            json,
            serde_json::json!({
                "error": {
                    "type": "ValidationError",
                    "code": wecom_error::codes::E_VALIDATION,
                    "message": "bad",
                }
            })
        );
    }

    /// P1：[WecomError::exit_code] 默认为 1
    #[test]
    fn fs_error_default_exit_code() {
        use wecom_error::WecomError;
        let v = Error::validation("bad");
        assert_eq!(v.exit_code(), 1);
    }

    /// P0：[WecomError::to_json] Io 变体携带 kind 字段
    /// 条件：构造 Io 变体（PermissionDenied）
    /// 断言：to_json 含 type=IOError、code=E_IO、message 与 kind="PermissionDenied"
    #[test]
    fn fs_error_to_json_io_includes_kind() {
        use wecom_error::WecomError;
        let io = Error::Io {
            message: "write failed".into(),
            source: std::io::Error::new(std::io::ErrorKind::PermissionDenied, "denied"),
        };
        let json = io.to_json();
        assert_eq!(
            json,
            serde_json::json!({
                "error": {
                    "type": "IOError",
                    "code": wecom_error::codes::E_IO,
                    "message": "write failed",
                    "kind": "PermissionDenied",
                }
            })
        );
    }

    /// P1：[std::error::Error::source] 仅 Io 变体暴露底层 io 错误
    /// 条件：分别构造 Io / Permission / Wrapped(validation) 错误
    /// 断言：Io 的 source 为 Some 且 kind 匹配；Permission / Wrapped 为 None
    #[test]
    fn fs_error_source_only_for_io() {
        let io = Error::Io {
            message: "boom".into(),
            source: std::io::Error::new(std::io::ErrorKind::BrokenPipe, "pipe closed"),
        };
        let source = std::error::Error::source(&io).expect("Io carries source");
        let io_source = source
            .downcast_ref::<std::io::Error>()
            .expect("source should be io::Error");
        assert_eq!(io_source.kind(), std::io::ErrorKind::BrokenPipe);

        let p = Error::Permission("denied".into());
        assert!(std::error::Error::source(&p).is_none());

        let v = Error::validation("bad");
        assert!(std::error::Error::source(&v).is_none());
    }

    /// P1：[WecomError for wecom_fs::Error] as_any / into_any 恢复具体类型
    /// 条件：Error 分别经 `&dyn WecomError` 与 `Box<dyn WecomError>` 转型
    /// 断言：downcast_ref / downcast 均恢复出 Error
    #[test]
    fn fs_error_any_downcast_recovers_concrete_type() {
        use wecom_error::WecomError;

        let e = Error::Permission("denied".into());
        let dyn_ref: &dyn WecomError = &e;
        assert!(dyn_ref.as_any().is::<Error>());

        let boxed: Box<dyn WecomError> = Box::new(Error::Permission("d".into()));
        assert!(boxed.into_any().downcast::<Error>().is_ok());
    }
}
