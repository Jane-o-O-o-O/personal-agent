//! Conversion traits for HTTP header names / values.
//!
//! [`IntoHeaderName`] and [`IntoHeaderValue`] let builder methods such as
//! `.header("x-foo", "bar")` accept already-typed [`reqwest::header::HeaderName`]
//! / [`reqwest::header::HeaderValue`] **as well as** `&str` / [`String`]
//! values, with parsing-failure deferred to the call site of `.execute()` /
//! `.await` so chaining stays ergonomic.
//!
//! These traits are the public seam between the builder macros (see
//! [`crate::macros`]) and concrete request types, and are
//! re-exported from the crate root so business code rarely needs to refer
//! to this module directly.

use reqwest::header::{HeaderName, HeaderValue};

/// Generates an `Into*` conversion trait with implementations for the target
/// type itself, `&str`, and `String`.
///
/// # Parameters
///
/// - `$trait_name`  — name of the generated trait (e.g. `IntoHeaderName`).
/// - `$method`      — conversion method on the trait (e.g. `try_into_header_name`).
/// - `$target`      — the target header type (e.g. `HeaderName`).
/// - `$label`       — human-readable label used in error messages (e.g. `"header name"`).
/// - `$doc`         — doc-comment string attached to the trait.
macro_rules! declare_into_header {
    (
        trait $trait_name:ident, method $method:ident,
        target $target:ty, label $label:literal,
        doc $doc:literal $(,)?
    ) => {
        #[doc = $doc]
        ///
        /// Implemented for:
        #[doc = concat!("- [`", stringify!($target), "`] — already valid, returned as-is.")]
        /// - `&str` / [`String`] — parsed at runtime.
        ///
        /// The error type is a boxed [`std::error::Error`] so that this trait
        /// can be used across crates without coupling to any specific error enum.
        pub trait $trait_name: Sized {
            fn $method(self) -> Result<$target, Box<dyn std::error::Error + Send + Sync>>;
        }

        impl $trait_name for $target {
            fn $method(self) -> Result<$target, Box<dyn std::error::Error + Send + Sync>> {
                Ok(self)
            }
        }

        impl $trait_name for &str {
            fn $method(self) -> Result<$target, Box<dyn std::error::Error + Send + Sync>> {
                <$target>::try_from(self)
                    .map_err(|e| format!(concat!("Invalid ", $label, ": {e:#}"), e = e).into())
            }
        }

        impl $trait_name for String {
            fn $method(self) -> Result<$target, Box<dyn std::error::Error + Send + Sync>> {
                <$target>::try_from(self.as_str())
                    .map_err(|e| format!(concat!("Invalid ", $label, ": {e:#}"), e = e).into())
            }
        }
    };
}

declare_into_header! {
    trait IntoHeaderName, method try_into_header_name,
    target HeaderName, label "header name",
    doc "A name that can be converted into a [`HeaderName`].",
}

declare_into_header! {
    trait IntoHeaderValue, method try_into_header_value,
    target HeaderValue, label "header value",
    doc "A value that can be converted into a [`HeaderValue`].",
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：IntoHeaderName / IntoHeaderValue trait
    //!
    //! ### 关键接口
    //! - [try_into_header_name] — 将字符串/HeaderName 转换为 HeaderName
    //! - [try_into_header_value] — 将字符串/HeaderValue 转换为 HeaderValue
    //!
    //! ### 关键分支与异常路径
    //! - 非法 header name（空字符串、含控制字符等）→ 返回 Err
    //! - 非法 header value（含 null 字节等）→ 返回 Err
    //! - &str 和 String 都实现 trait，行为一致
    //!
    //! ### 上下游交互
    //! - 上游：`crate::builder_macros::impl_request_builder!` 宏注入的 header() /
    //!   header_sensitive() 方法使用这两个 trait 解析输入参数
    //! - 下游：`reqwest::header::HeaderName` 和 `reqwest::header::HeaderValue` 是最终类型

    use super::*;

    // ── IntoHeaderName ──

    /// P0：[try_into_header_name] HeaderName 直接返回自身
    /// 条件：传入有效 HeaderName
    /// 断言：try_into_header_name() 返回 Ok(HeaderName)
    #[test]
    fn header_name_direct() {
        let name = reqwest::header::HeaderName::from_static("x-test");
        let result = name.try_into_header_name();
        assert!(result.is_ok());
        assert_eq!(
            result.unwrap(),
            reqwest::header::HeaderName::from_static("x-test")
        );
    }

    /// P0：[try_into_header_name] &str 解析为有效 HeaderName
    /// 条件：传入有效 header 名称字符串 "content-type"
    /// 断言：try_into_header_name() 返回 Ok
    #[test]
    fn header_name_from_str() {
        let result = "content-type".try_into_header_name();
        assert!(result.is_ok());
    }

    /// P1：[try_into_header_name] String 解析为有效 HeaderName
    /// 条件：传入有效 header 名称 String "x-custom"
    /// 断言：try_into_header_name() 返回 Ok
    #[test]
    fn header_name_from_string() {
        let name = String::from("x-custom");
        let result = name.try_into_header_name();
        assert!(result.is_ok());
    }

    /// P1：[try_into_header_name] 非法 header name（空字符串）返回 Err
    /// 条件：传入空字符串 ""
    /// 断言：try_into_header_name() 返回 Err
    #[test]
    fn header_name_invalid_returns_err() {
        let result = "".try_into_header_name();
        assert!(result.is_err());
    }

    // ── IntoHeaderValue ──

    /// P0：[try_into_header_value] HeaderValue 直接返回自身
    /// 条件：传入有效 HeaderValue
    /// 断言：try_into_header_value() 返回 Ok
    #[test]
    fn header_value_direct() {
        let value = reqwest::header::HeaderValue::from_static("test");
        let result = value.try_into_header_value();
        assert!(result.is_ok());
    }

    /// P0：[try_into_header_value] &str 转换为 HeaderValue
    /// 条件：传入有效 header 值字符串 "application/json"
    /// 断言：try_into_header_value() 返回 Ok
    #[test]
    fn header_value_from_str() {
        let result = "application/json".try_into_header_value();
        assert!(result.is_ok());
    }

    /// P1：[IntoHeaderValue::try_into_header_value] String 转换为 HeaderValue
    /// 条件：传入有效 header 值 String "Bearer token"
    /// 断言：try_into_header_value() 返回 Ok
    #[test]
    fn header_value_from_string() {
        let value = String::from("Bearer token");
        let result = value.try_into_header_value();
        assert!(result.is_ok());
    }

    /// P1：[IntoHeaderValue::try_into_header_value] 含 null 字节的 header value 返回 Err
    /// 条件：传入含 null 字节的字符串
    /// 断言：try_into_header_value() 返回 Err
    #[test]
    fn header_value_invalid_returns_err() {
        let result = "bad\0value".try_into_header_value();
        assert!(result.is_err());
    }

    /// P2：[try_into_header_name] 非法 header name（空 String）返回 Err
    /// 条件：传入空 String
    /// 断言：try_into_header_name() 返回 Err
    #[test]
    fn header_name_invalid_string_returns_err() {
        let result = String::new().try_into_header_name();
        assert!(result.is_err());
    }

    /// P2：[try_into_header_value] 含 null 字节的 String header value 返回 Err
    /// 条件：传入含 null 字节的 String "bad\0data"
    /// 断言：try_into_header_value() 返回 Err
    #[test]
    fn header_value_invalid_string_returns_err() {
        let result = String::from("bad\0data").try_into_header_value();
        assert!(result.is_err());
    }
}
