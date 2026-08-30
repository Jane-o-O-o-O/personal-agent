//! Builder-shaped macros for request types.
//!
//! Provides a single declarative macro [`impl_request_builder!`](crate::impl_request_builder)
//! that injects
//! a uniform builder surface into any struct used as an HTTP request
//! builder, with optional `+options` / `+wire` capability switches.
//!
//! # Generated surface
//!
//! Headers (always emitted; require fields `headers: Option<HeaderMap>` and
//! `header_error: Option<$error_ty>`):
//! - `get_headers` / `get_headers_mut`
//! - `headers` (batch merge from `&HeaderMap`)
//! - `header` / `header_sensitive` (single header, deferred error)
//!
//! `+options` (requires field `options: crate::RequestOptions`):
//! - `timeout` — set the per-request timeout.
//! - `on_poll` — register a `Fn(&PollEvent<'_>) + Send + Sync + 'static`
//!   callback for long-task polling.
//! - `on_poll_arc` — `#[doc(hidden)]` cross-layer setter.
//! - `extension` — insert a caller-defined config value into the extension
//!   bag (per-TypeId override, later layer wins).
//! - `extensions` — merge another `Extensions` bag.
//! - `get_extensions` — borrow the extension bag.
//! - `with_options` — merge another `RequestOptions`.
//!
//! `+wire` (requires field `options: crate::WireOptions`):
//! - `timeout` — set the per-request timeout.
//! - `with_options` — merge another `WireOptions`.
//!
//! # Header semantics
//!
//! Header errors are **deferred**: `.header()` and `.header_sensitive()`
//! return `Self`, not `Result`, so callers can chain freely. The first error
//! is stored in `header_error` and surfaced when the request is executed
//! (`.await` / `.execute()` / `.build()`). This mirrors
//! `reqwest::RequestBuilder`.
//!
//! # Usage
//!
//! ```text
//! // Headers only (default error type = wecom_transport::Error):
//! impl_request_builder!(Builder);
//!
//! // +options (headers, timeout, on_poll):
//! impl_request_builder!(TransportRequest<'a>, +options);
//!
//! // +wire (headers, timeout, no on_poll):
//! impl_request_builder!(HttpRequest<'a>, +wire);
//!
//! // Custom error type for cross-crate usage:
//! impl_request_builder!(
//!     ClientInvokeRequest<'a>,
//!     +options,
//!     error_type = Error,
//!     error_wrapper = Error::other,
//! );
//! ```
//!
//! # Error type
//!
//! The `header_error` field type is `Option<$error_ty>`. When not specified,
//! defaults to `$crate::Error` with wrapper `$crate::Error::other`.
//! Custom error types must implement `std::error::Error + Send + Sync + 'static`.

/// Inject a uniform builder surface into a request type.
///
/// See the module-level documentation in `crate::macros` for the
/// full description of generated methods, field requirements, and feature
/// flags. The grammar is:
///
/// ```text
/// impl_request_builder!(
///     <Type>[<'lt,...>],
///     [+options | +wire]
///     [error_type = <ErrTy>, error_wrapper = <ErrPath>]
/// );
/// ```
#[macro_export]
macro_rules! impl_request_builder {
    // ──────────────────────────────────────────────────────────────────
    //   Internal blocks
    // ──────────────────────────────────────────────────────────────────

    // Headers: flat `self.headers: Option<HeaderMap>` pattern.
    (@headers_block [$($generics:tt)*] $error_wrapper:path) => {
        impl $($generics)* {
            #[allow(dead_code)]
            pub fn get_headers(&self) -> Option<&reqwest::header::HeaderMap> {
                self.headers.as_ref()
            }

            #[allow(dead_code)]
            pub fn get_headers_mut(&mut self) -> &mut reqwest::header::HeaderMap {
                self.headers.get_or_insert_with(reqwest::header::HeaderMap::new)
            }

            #[must_use]
            pub fn headers(mut self, headers: &reqwest::header::HeaderMap) -> Self {
                if !headers.is_empty() {
                    let target = self
                        .headers
                        .get_or_insert_with(reqwest::header::HeaderMap::new);
                    for (k, v) in headers.iter() {
                        target.insert(k.clone(), v.clone());
                    }
                }
                self
            }

            #[must_use]
            pub fn header(
                self,
                name: impl $crate::IntoHeaderName,
                value: impl $crate::IntoHeaderValue,
            ) -> Self {
                self.header_sensitive(name, value, false)
            }

            #[must_use]
            pub fn header_sensitive(
                mut self,
                name: impl $crate::IntoHeaderName,
                value: impl $crate::IntoHeaderValue,
                sensitive: bool,
            ) -> Self {
                if self.header_error.is_some() {
                    return self;
                }
                let name = match name.try_into_header_name() {
                    Ok(n) => n,
                    Err(e) => {
                        self.header_error = Some($error_wrapper(e));
                        return self;
                    }
                };
                let mut value = match value.try_into_header_value() {
                    Ok(v) => v,
                    Err(e) => {
                        self.header_error = Some($error_wrapper(e));
                        return self;
                    }
                };
                if sensitive {
                    value.set_sensitive(true);
                }
                self.headers
                    .get_or_insert_with(reqwest::header::HeaderMap::new)
                    .insert(name, value);
                self
            }
        }
    };

    // Headers: `self.options: RequestOptions` (via `self.options.wire.headers`).
    (@headers_block_options [$($generics:tt)*] $error_wrapper:path) => {
        impl $($generics)* {
            #[allow(dead_code)]
            pub fn get_headers(&self) -> &reqwest::header::HeaderMap {
                self.options.headers()
            }
            #[allow(dead_code)]
            pub fn get_headers_mut(&mut self) -> &mut reqwest::header::HeaderMap {
                self.options.headers_mut()
            }
            #[must_use]
            pub fn headers(mut self, headers: &reqwest::header::HeaderMap) -> Self {
                if !headers.is_empty() {
                    for (k, v) in headers.iter() {
                        self.options.wire.headers.insert(k.clone(), v.clone());
                    }
                }
                self
            }
            #[must_use]
            pub fn header(
                self,
                name: impl $crate::IntoHeaderName,
                value: impl $crate::IntoHeaderValue,
            ) -> Self {
                self.header_sensitive(name, value, false)
            }
            #[must_use]
            pub fn header_sensitive(
                mut self,
                name: impl $crate::IntoHeaderName,
                value: impl $crate::IntoHeaderValue,
                sensitive: bool,
            ) -> Self {
                if self.header_error.is_some() {
                    return self;
                }
                let n = match name.try_into_header_name() {
                    Ok(n) => n,
                    Err(e) => {
                        self.header_error = Some($error_wrapper(e));
                        return self;
                    }
                };
                let mut v = match value.try_into_header_value() {
                    Ok(v) => v,
                    Err(e) => {
                        self.header_error = Some($error_wrapper(e));
                        return self;
                    }
                };
                if sensitive {
                    v.set_sensitive(true);
                }
                self.options.wire.headers.insert(n, v);
                self
            }
        }
    };

    // Headers: `self.options: WireOptions` (via `self.options.headers` directly).
    (@headers_block_wire [$($generics:tt)*] $error_wrapper:path) => {
        impl $($generics)* {
            #[allow(dead_code)]
            pub fn get_headers(&self) -> &reqwest::header::HeaderMap {
                &self.options.headers
            }
            #[allow(dead_code)]
            pub fn get_headers_mut(&mut self) -> &mut reqwest::header::HeaderMap {
                &mut self.options.headers
            }
            #[must_use]
            pub fn headers(mut self, headers: &reqwest::header::HeaderMap) -> Self {
                if !headers.is_empty() {
                    for (k, v) in headers.iter() {
                        self.options.headers.insert(k.clone(), v.clone());
                    }
                }
                self
            }
            #[must_use]
            pub fn header(
                self,
                name: impl $crate::IntoHeaderName,
                value: impl $crate::IntoHeaderValue,
            ) -> Self {
                self.header_sensitive(name, value, false)
            }
            #[must_use]
            pub fn header_sensitive(
                mut self,
                name: impl $crate::IntoHeaderName,
                value: impl $crate::IntoHeaderValue,
                sensitive: bool,
            ) -> Self {
                if self.header_error.is_some() {
                    return self;
                }
                let n = match name.try_into_header_name() {
                    Ok(n) => n,
                    Err(e) => {
                        self.header_error = Some($error_wrapper(e));
                        return self;
                    }
                };
                let mut v = match value.try_into_header_value() {
                    Ok(v) => v,
                    Err(e) => {
                        self.header_error = Some($error_wrapper(e));
                        return self;
                    }
                };
                if sensitive {
                    v.set_sensitive(true);
                }
                self.options.headers.insert(n, v);
                self
            }
        }
    };

    // +options block: timeout / on_poll / with_options via RequestOptions.
    (@options_block [$($generics:tt)*]) => {
        impl $($generics)* {
            #[allow(dead_code)]
            pub fn get_options(&self) -> &$crate::RequestOptions {
                &self.options
            }
            #[allow(dead_code)]
            pub fn get_timeout(&self) -> Option<std::time::Duration> {
                self.options.timeout()
            }
            #[allow(dead_code)]
            pub fn get_on_poll(&self) -> Option<&$crate::PollCallback> {
                self.options.on_poll.as_ref()
            }
            #[allow(dead_code)]
            pub fn get_extensions(&self) -> &$crate::Extensions {
                &self.options.extensions
            }
            #[must_use]
            pub fn with_options(mut self, options: $crate::RequestOptions) -> Self {
                for (k, v) in options.wire.headers.iter() {
                    self.options.wire.headers.insert(k.clone(), v.clone());
                }
                if options.wire.timeout.is_some() {
                    self.options.wire.timeout = options.wire.timeout;
                }
                if options.on_poll.is_some() {
                    self.options.on_poll = options.on_poll;
                }
                self.options.extensions.extend(&options.extensions);
                self
            }

            #[must_use]
            pub fn timeout(mut self, t: std::time::Duration) -> Self {
                self.options.wire.timeout = Some(t);
                self
            }

            #[must_use]
            pub fn on_poll<F>(mut self, f: F) -> Self
            where
                F: Fn(&$crate::PollEvent<'_>) + Send + Sync + 'static,
            {
                self.options.on_poll = Some(std::sync::Arc::new(f));
                self
            }

            #[doc(hidden)]
            #[must_use]
            pub fn on_poll_arc(mut self, cb: $crate::PollCallback) -> Self {
                self.options.on_poll = Some(cb);
                self
            }

            #[must_use]
            pub fn extension<T>(mut self, value: T) -> Self
            where
                T: std::any::Any + std::fmt::Debug + Send + Sync + 'static,
            {
                self.options.extensions.insert(value);
                self
            }

            #[must_use]
            pub fn extensions(mut self, ext: &$crate::Extensions) -> Self {
                self.options.extensions.extend(ext);
                self
            }

        }
    };

    // +wire block: timeout / with_options via WireOptions (no on_poll).
    (@wire_block [$($generics:tt)*]) => {
        impl $($generics)* {
            #[allow(dead_code)]
            pub fn get_options(&self) -> &$crate::WireOptions {
                &self.options
            }
            #[allow(dead_code)]
            pub fn get_timeout(&self) -> Option<std::time::Duration> {
                self.options.timeout
            }
            #[must_use]
            pub fn with_options(mut self, options: $crate::WireOptions) -> Self {
                for (k, v) in options.headers.iter() {
                    self.options.headers.insert(k.clone(), v.clone());
                }
                if options.timeout.is_some() {
                    self.options.timeout = options.timeout;
                }
                self
            }

            #[must_use]
            pub fn timeout(mut self, t: std::time::Duration) -> Self {
                self.options.timeout = Some(t);
                self
            }

        }
    };

    // ──────────────────────────────────────────────────────────────────
    //   Public entry arms — (with/without lifetimes) × (+options/+wire) × (default/custom error)
    // ──────────────────────────────────────────────────────────────────

    // ── Headers only ──

    // With lifetimes, default error
    ($name:ident < $($lt:lifetime),+ > $(,)?) => {
        $crate::impl_request_builder!(
            @headers_block [< $($lt),+ > $name< $($lt),+ >] $crate::Error::other
        );
    };
    // With lifetimes, custom error
    ($name:ident < $($lt:lifetime),+ >, error_type = $error_ty:ty, error_wrapper = $error_wrapper:path $(,)?) => {
        $crate::impl_request_builder!(
            @headers_block [< $($lt),+ > $name< $($lt),+ >] $error_wrapper
        );
    };
    // Without lifetimes, default error
    ($name:ident $(,)?) => {
        $crate::impl_request_builder!(@headers_block [$name] $crate::Error::other);
    };
    // Without lifetimes, custom error
    ($name:ident, error_type = $error_ty:ty, error_wrapper = $error_wrapper:path $(,)?) => {
        $crate::impl_request_builder!(@headers_block [$name] $error_wrapper);
    };

    // ── +options ──

    // With lifetimes, default error
    ($name:ident < $($lt:lifetime),+ >, +options $(,)?) => {
        $crate::impl_request_builder!(
            @headers_block_options [< $($lt),+ > $name< $($lt),+ >] $crate::Error::other
        );
        $crate::impl_request_builder!(@options_block [< $($lt),+ > $name< $($lt),+ >]);
    };
    // With lifetimes, custom error
    ($name:ident < $($lt:lifetime),+ >, +options, error_type = $error_ty:ty, error_wrapper = $error_wrapper:path $(,)?) => {
        $crate::impl_request_builder!(
            @headers_block_options [< $($lt),+ > $name< $($lt),+ >] $error_wrapper
        );
        $crate::impl_request_builder!(@options_block [< $($lt),+ > $name< $($lt),+ >]);
    };
    // Without lifetimes, default error
    ($name:ident, +options $(,)?) => {
        $crate::impl_request_builder!(@headers_block_options [$name] $crate::Error::other);
        $crate::impl_request_builder!(@options_block [$name]);
    };
    // Without lifetimes, custom error
    ($name:ident, +options, error_type = $error_ty:ty, error_wrapper = $error_wrapper:path $(,)?) => {
        $crate::impl_request_builder!(@headers_block_options [$name] $error_wrapper);
        $crate::impl_request_builder!(@options_block [$name]);
    };

    // ── +wire ──

    // With lifetimes, default error
    ($name:ident < $($lt:lifetime),+ >, +wire $(,)?) => {
        $crate::impl_request_builder!(
            @headers_block_wire [< $($lt),+ > $name< $($lt),+ >] $crate::Error::other
        );
        $crate::impl_request_builder!(@wire_block [< $($lt),+ > $name< $($lt),+ >]);
    };
    // With lifetimes, custom error
    ($name:ident < $($lt:lifetime),+ >, +wire, error_type = $error_ty:ty, error_wrapper = $error_wrapper:path $(,)?) => {
        $crate::impl_request_builder!(
            @headers_block_wire [< $($lt),+ > $name< $($lt),+ >] $error_wrapper
        );
        $crate::impl_request_builder!(@wire_block [< $($lt),+ > $name< $($lt),+ >]);
    };
    // Without lifetimes, default error
    ($name:ident, +wire $(,)?) => {
        $crate::impl_request_builder!(@headers_block_wire [$name] $crate::Error::other);
        $crate::impl_request_builder!(@wire_block [$name]);
    };
    // Without lifetimes, custom error
    ($name:ident, +wire, error_type = $error_ty:ty, error_wrapper = $error_wrapper:path $(,)?) => {
        $crate::impl_request_builder!(@headers_block_wire [$name] $error_wrapper);
        $crate::impl_request_builder!(@wire_block [$name]);
    };
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：macros（统一 request-builder 宏）
    //!
    //! ### 关键接口
    //! - [impl_request_builder!] — 单一宏，按需启用 +options / +wire，
    //!   始终注入 headers / header / header_sensitive / get_headers /
    //!   get_headers_mut；可指定自定义 error_type + error_wrapper
    //!
    //! ### 关键分支与异常路径
    //! - 仅 headers（无 flags）：HeadersOnlyStruct 没有 timeout / on_poll 方法
    //! - +options：注入 timeout / on_poll / on_poll_arc /
    //!   extension / extensions / get_extensions；多次调用后写覆盖前写
    //! - +wire：注入 timeout，无 on_poll
    //! - 非法 header name/value → header_error 延迟存储；只保留第一个错误
    //! - header_sensitive(true) 标记 value.is_sensitive() 为 true
    //!
    //! ### 上下游交互
    //! - 上游：`Builder` / `HttpRequest` / `TransportRequest`
    //!   及 wecom crate 中的 builder 类型
    //! - 下游：依赖 `crate::IntoHeaderName` / `crate::IntoHeaderValue` /
    //!   `crate::PollCallback` / `crate::PollEvent` / `crate::RequestOptions` /
    //!   `crate::WireOptions`

    // ── headers-only struct ──

    use indexmap::IndexMap;

    /// Dummy struct that uses `impl_request_builder!` with headers-only.
    struct HeadersOnlyStruct {
        headers: Option<reqwest::header::HeaderMap>,
        header_error: Option<crate::Error>,
    }
    crate::impl_request_builder!(HeadersOnlyStruct);

    fn make_headers_only() -> HeadersOnlyStruct {
        HeadersOnlyStruct {
            headers: None,
            header_error: None,
        }
    }

    /// P0：[impl_request_builder!] headers() 和 header() 方法正常工作
    /// 条件：调用 .headers(&extra) 后链式调用 .header("x-single", "v")
    /// 断言：header_error 为 None，headers 包含 x-test 和 x-single 两个 header
    #[test]
    fn headers_and_header_work() {
        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-test"),
            reqwest::header::HeaderValue::from_static("val"),
        );
        let s = make_headers_only().headers(&extra).header("x-single", "v");
        assert!(s.header_error.is_none());
        let hdrs = s.headers.unwrap();
        assert_eq!(hdrs.get("x-test").unwrap().to_str().unwrap(), "val");
        assert_eq!(hdrs.get("x-single").unwrap().to_str().unwrap(), "v");
    }

    /// P1：[impl_request_builder!] header() 非法 name 时错误延迟存储到 header_error
    /// 条件：调用 .header("", "value") 传入空字符串作为 header name
    /// 断言：header_error 为 Some，headers 仍为 None
    #[test]
    fn header_defers_invalid_name_error() {
        let s = make_headers_only().header("", "value");
        assert!(s.header_error.is_some());
        assert!(s.headers.is_none());
    }

    /// P1：[impl_request_builder!] header() 非法 value 时错误延迟存储到 header_error
    /// 条件：调用 .header("x-name", "\0\0\0invalid") 传入含 null byte 的 value
    /// 断言：header_error 为 Some
    #[test]
    fn header_defers_invalid_value_error() {
        let s = make_headers_only().header("x-name", "\0\0\0invalid");
        assert!(s.header_error.is_some());
    }

    /// P1：[impl_request_builder!] header() 多次非法调用只保留第一个错误
    /// 条件：先调用 .header("", "value1") 产生 name 错误，再调用 .header("x-valid", "\0bad") 产生 value 错误
    /// 断言：header_error 为 Some，错误消息包含 "header name"
    #[test]
    fn header_keeps_first_error_only() {
        let s = make_headers_only()
            .header("", "value1")
            .header("x-valid", "\0bad");
        assert!(s.header_error.is_some());
        let msg = s.header_error.unwrap().to_string();
        assert!(
            msg.contains("header name"),
            "error should be about name, got: {msg}"
        );
    }

    // ── header_sensitive ──

    /// P0：[impl_request_builder!] header_sensitive(sensitive=true) 标记 value 为 sensitive
    /// 条件：调用 .header_sensitive("authorization", "Bearer token", true)
    /// 断言：headers 包含 authorization，其 value.is_sensitive() 为 true
    #[test]
    fn header_sensitive_marks_value_sensitive() {
        let s = make_headers_only().header_sensitive("authorization", "Bearer token", true);
        assert!(s.header_error.is_none());
        let val = s.headers.unwrap().get("authorization").unwrap().clone();
        assert!(val.is_sensitive(), "value should be marked sensitive");
    }

    /// P0：[impl_request_builder!] header_sensitive(sensitive=false) 不标记 value 为 sensitive
    /// 条件：调用 .header_sensitive("x-public", "visible", false)
    /// 断言：headers 包含 x-public，其 value.is_sensitive() 为 false
    #[test]
    fn header_sensitive_false_keeps_non_sensitive() {
        let s = make_headers_only().header_sensitive("x-public", "visible", false);
        assert!(s.header_error.is_none());
        let val = s.headers.unwrap().get("x-public").unwrap().clone();
        assert!(!val.is_sensitive(), "value should not be marked sensitive");
    }

    /// P1：[impl_request_builder!] header_sensitive 非法 name 时错误延迟存储
    /// 条件：调用 .header_sensitive("", "value", true) 传入空字符串作为 name
    /// 断言：header_error 为 Some，headers 仍为 None
    #[test]
    fn header_sensitive_defers_invalid_name_error() {
        let s = make_headers_only().header_sensitive("", "value", true);
        assert!(s.header_error.is_some());
        assert!(s.headers.is_none());
    }

    /// P1：[impl_request_builder!] header_sensitive 非法 value 时错误延迟存储
    /// 条件：调用 .header_sensitive("x-name", "\0\0\0invalid", true) 传入含 null byte 的 value
    /// 断言：header_error 为 Some
    #[test]
    fn header_sensitive_defers_invalid_value_error() {
        let s = make_headers_only().header_sensitive("x-name", "\0\0\0invalid", true);
        assert!(s.header_error.is_some());
    }

    /// P1：[impl_request_builder!] header_sensitive 可与 header/headers 链式调用
    /// 条件：链式调用 .header("x-a", "1").header_sensitive("x-secret", "s", true)
    /// 断言：两个 header 都存在，x-a 不敏感，x-secret 敏感
    #[test]
    fn header_sensitive_chains_with_header() {
        let s = make_headers_only()
            .header("x-a", "1")
            .header_sensitive("x-secret", "s", true);
        assert!(s.header_error.is_none());
        let hdrs = s.headers.unwrap();
        assert_eq!(hdrs.len(), 2);
        assert!(!hdrs.get("x-a").unwrap().is_sensitive());
        assert!(hdrs.get("x-secret").unwrap().is_sensitive());
    }

    // ── get_headers / get_headers_mut ──

    /// P0：[impl_request_builder!] get_headers() 初始返回 None
    /// 条件：创建 HeadersOnlyStruct 后不设置任何 header
    /// 断言：get_headers() 返回 None
    #[test]
    fn get_headers_returns_none_initially() {
        let s = make_headers_only();
        assert!(s.get_headers().is_none());
    }

    /// P0：[impl_request_builder!] get_headers() 在设置 header 后返回 Some
    /// 条件：调用 .header("x-a", "1") 设置一个 header
    /// 断言：get_headers() 返回 Some，且 x-a 值为 "1"
    #[test]
    fn get_headers_returns_some_after_header() {
        let s = make_headers_only().header("x-a", "1");
        let hdrs = s.get_headers().unwrap();
        assert_eq!(hdrs.get("x-a").unwrap(), "1");
    }

    /// P0：[impl_request_builder!] get_headers_mut() 允许直接插入 header
    /// 条件：通过 get_headers_mut() 直接插入 x-direct header
    /// 断言：get_headers() 返回 x-direct，值为 "val"
    #[test]
    fn get_headers_mut_allows_direct_insert() {
        let mut s = make_headers_only();
        s.get_headers_mut().insert(
            reqwest::header::HeaderName::from_static("x-direct"),
            reqwest::header::HeaderValue::from_static("val"),
        );
        let hdrs = s.get_headers().unwrap();
        assert_eq!(hdrs.get("x-direct").unwrap(), "val");
    }

    /// P1：[impl_request_builder!] get_headers_mut() 多次调用不会重置已有 headers
    /// 条件：通过 get_headers_mut() 两次插入不同 header
    /// 断言：get_headers() 返回两个 header，总量为 2
    #[test]
    fn get_headers_mut_preserves_existing() {
        let mut s = make_headers_only();
        s.get_headers_mut().insert(
            reqwest::header::HeaderName::from_static("x-first"),
            reqwest::header::HeaderValue::from_static("1"),
        );
        s.get_headers_mut().insert(
            reqwest::header::HeaderName::from_static("x-second"),
            reqwest::header::HeaderValue::from_static("2"),
        );
        assert_eq!(s.get_headers().unwrap().len(), 2);
    }

    // ── +wire struct (WireOptions: timeout, no on_poll) ──

    /// Dummy struct that uses `impl_request_builder!` with +wire.
    struct WireStruct {
        header_error: Option<crate::Error>,
        options: crate::WireOptions,
    }
    crate::impl_request_builder!(WireStruct, +wire);

    fn make_wire_struct() -> WireStruct {
        WireStruct {
            header_error: None,
            options: crate::WireOptions::default(),
        }
    }

    /// P0：[impl_request_builder! +wire] timeout() 设置 timeout 字段
    /// 条件：调用 .timeout(Duration::from_secs(5))
    /// 断言：options.timeout 为 Some(Duration::from_secs(5))
    #[test]
    fn wire_timeout_sets_field() {
        let s = make_wire_struct().timeout(std::time::Duration::from_secs(5));
        assert_eq!(s.options.timeout, Some(std::time::Duration::from_secs(5)));
    }

    /// P0：[impl_request_builder! +wire] timeout 默认为 None
    /// 条件：创建 WireStruct 后不设置 timeout
    /// 断言：options.timeout 为 None
    #[test]
    fn wire_timeout_default_none() {
        assert!(make_wire_struct().options.timeout.is_none());
    }

    /// P1：[impl_request_builder! +wire] timeout() 多次调用后写覆盖前写
    /// 条件：先调用 .timeout(5s) 再调用 .timeout(10s)
    /// 断言：options.timeout 为 Some(Duration::from_secs(10))
    #[test]
    fn wire_timeout_overrides_previous() {
        let s = make_wire_struct()
            .timeout(std::time::Duration::from_secs(5))
            .timeout(std::time::Duration::from_secs(10));
        assert_eq!(s.options.timeout, Some(std::time::Duration::from_secs(10)));
    }

    /// P1：[impl_request_builder! +wire] timeout() 与 header/headers 链式调用
    /// 条件：链式调用 .timeout(5s).headers(&extra).header("x-single", "v")
    /// 断言：timeout 为 5s，headers 包含 x-test 和 x-single
    #[test]
    fn wire_timeout_and_headers_chain() {
        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-test"),
            reqwest::header::HeaderValue::from_static("val"),
        );
        let s = make_wire_struct()
            .timeout(std::time::Duration::from_secs(5))
            .headers(&extra)
            .header("x-single", "v");
        assert!(s.header_error.is_none());
        assert_eq!(s.options.timeout, Some(std::time::Duration::from_secs(5)));
        assert_eq!(s.options.headers.get("x-test").unwrap(), "val");
        assert_eq!(s.options.headers.get("x-single").unwrap(), "v");
    }

    /// P1：[impl_request_builder! +wire] with_options() 合并外部 WireOptions
    /// 条件：先设置 header("x-existing", "v")，再用 with_options 合并含 x-ext 和 timeout=3s 的外部 opts
    /// 断言：x-existing 和 x-ext 都存在，timeout 为 3s
    #[test]
    fn wire_with_options_merges() {
        let mut opts = crate::WireOptions::default();
        opts.headers.insert(
            reqwest::header::HeaderName::from_static("x-ext"),
            reqwest::header::HeaderValue::from_static("ext-val"),
        );
        opts.timeout = Some(std::time::Duration::from_secs(3));

        let s = make_wire_struct()
            .header("x-existing", "v")
            .with_options(opts);

        assert!(s.header_error.is_none());
        assert_eq!(s.options.timeout, Some(std::time::Duration::from_secs(3)));
        assert_eq!(s.options.headers.get("x-existing").unwrap(), "v");
        assert_eq!(s.options.headers.get("x-ext").unwrap(), "ext-val");
    }

    /// P0：[impl_request_builder! +wire] get_options() 返回引用
    /// 条件：设置 timeout 为 7s 后调用 get_options()
    /// 断言：返回的引用中 timeout 为 Some(Duration::from_secs(7))
    #[test]
    fn wire_get_options_returns_ref() {
        let s = make_wire_struct().timeout(std::time::Duration::from_secs(7));
        assert_eq!(
            s.get_options().timeout,
            Some(std::time::Duration::from_secs(7))
        );
    }

    /// P0：[impl_request_builder! +wire] get_timeout() 返回 timeout
    /// 条件：设置 timeout 为 7s 后调用 get_timeout()
    /// 断言：返回 Some(Duration::from_secs(7))
    #[test]
    fn wire_get_timeout() {
        let s = make_wire_struct().timeout(std::time::Duration::from_secs(7));
        assert_eq!(s.get_timeout(), Some(std::time::Duration::from_secs(7)));
    }

    // ── +options struct (RequestOptions: timeout + on_poll) ──

    /// Dummy struct that uses `impl_request_builder!` with +options.
    struct OptionsStruct {
        header_error: Option<crate::Error>,
        options: crate::RequestOptions,
    }
    crate::impl_request_builder!(OptionsStruct, +options);

    fn make_options_struct() -> OptionsStruct {
        OptionsStruct {
            header_error: None,
            options: crate::RequestOptions::default(),
        }
    }

    /// P0：[impl_request_builder! +options] timeout() 设置 timeout
    /// 条件：调用 .timeout(Duration::from_secs(5))
    /// 断言：options.timeout() 返回 Some(Duration::from_secs(5))
    #[test]
    fn options_timeout_sets_field() {
        let s = make_options_struct().timeout(std::time::Duration::from_secs(5));
        assert_eq!(s.options.timeout(), Some(std::time::Duration::from_secs(5)));
    }

    /// P0：[impl_request_builder! +options] on_poll() 把闭包包成 Arc 写入 self.options.on_poll
    /// 条件：调用 .on_poll(move |_ev| *hits.lock().unwrap() += 1) 并手动触发回调
    /// 断言：闭包被执行，计数从 0 变为 1
    #[test]
    fn options_on_poll_wraps_closure_into_arc() {
        use std::sync::{Arc, Mutex};
        let hits = Arc::new(Mutex::new(0u32));
        let hits_cb = hits.clone();
        let s = make_options_struct().on_poll(move |_ev| *hits_cb.lock().unwrap() += 1);
        let cb = s.options.on_poll.expect("on_poll should be Some");
        let ev = crate::PollEvent {
            taskid: "t1",
            result: None,
            extra: &IndexMap::new(),
        };
        cb(&ev);
        assert_eq!(*hits.lock().unwrap(), 1);
    }

    /// P0：[impl_request_builder! +options] on_poll 默认为 None
    /// 条件：创建 OptionsStruct 后不设置 on_poll
    /// 断言：options.on_poll 为 None
    #[test]
    fn options_on_poll_default_none() {
        assert!(make_options_struct().options.on_poll.is_none());
    }

    /// P1：[impl_request_builder! +options] 多次 on_poll() 后写覆盖先写
    /// 条件：连续两次 .on_poll(...)，前一个闭包递增 hits_a，后一个递增 hits_b
    /// 断言：触发回调后 hits_a 仍为 0（被覆盖），hits_b 为 1（后写生效）
    #[test]
    fn options_on_poll_last_one_wins() {
        use std::sync::{Arc, Mutex};
        let hits_a = Arc::new(Mutex::new(0u32));
        let hits_b = Arc::new(Mutex::new(0u32));
        let a = hits_a.clone();
        let b = hits_b.clone();
        let s = make_options_struct()
            .on_poll(move |_| *a.lock().unwrap() += 1)
            .on_poll(move |_| *b.lock().unwrap() += 1);
        let cb = s.options.on_poll.expect("on_poll should be Some");
        let ev = crate::PollEvent {
            taskid: "t1",
            result: None,
            extra: &IndexMap::new(),
        };
        cb(&ev);
        assert_eq!(*hits_a.lock().unwrap(), 0, "前一个回调应被覆盖");
        assert_eq!(*hits_b.lock().unwrap(), 1, "后一个回调应生效");
    }

    /// P1：[impl_request_builder! +options] on_poll_arc() 直接接受外部 PollCallback
    /// 条件：预先构造 Arc<PollCallback>，通过 on_poll_arc() 传入
    /// 断言：触发回调后计数从 0 变为 1
    #[test]
    fn options_on_poll_arc_accepts_existing_callback() {
        use std::sync::{Arc, Mutex};
        let hits = Arc::new(Mutex::new(0u32));
        let hits_cb = hits.clone();
        let cb: crate::PollCallback =
            std::sync::Arc::new(move |_ev: &crate::PollEvent<'_>| *hits_cb.lock().unwrap() += 1);
        let s = make_options_struct().on_poll_arc(cb);
        let stored = s.options.on_poll.expect("on_poll should be Some");
        let ev = crate::PollEvent {
            taskid: "t1",
            result: None,
            extra: &IndexMap::new(),
        };
        stored(&ev);
        assert_eq!(*hits.lock().unwrap(), 1);
    }

    /// P1：[impl_request_builder! +options] 四类 setter 全部可链式
    /// 条件：链式调用 .timeout(5s).headers(&batch).header("x-a", "1").on_poll(|_|{})
    /// 断言：timeout 为 5s，x-batch 和 x-a header 存在，on_poll 为 Some
    #[test]
    fn options_struct_composes_all_setters() {
        let mut batch = reqwest::header::HeaderMap::new();
        batch.insert(
            reqwest::header::HeaderName::from_static("x-batch"),
            reqwest::header::HeaderValue::from_static("b-val"),
        );
        let s = make_options_struct()
            .timeout(std::time::Duration::from_secs(5))
            .headers(&batch)
            .header("x-a", "1")
            .on_poll(|_| {});
        assert!(s.header_error.is_none());
        assert_eq!(s.options.timeout(), Some(std::time::Duration::from_secs(5)));
        assert_eq!(s.options.headers().get("x-batch").unwrap(), "b-val");
        assert_eq!(s.options.headers().get("x-a").unwrap(), "1");
        assert!(s.options.on_poll.is_some());
    }

    /// P1：[impl_request_builder! +options] with_options() 合并外部 RequestOptions
    /// 条件：先设置 header("x-existing", "v")，再用 with_options 合并含 x-ext header、timeout=3s 和 on_poll 的外部 opts
    /// 断言：x-existing 和 x-ext 都存在，timeout 为 3s，on_poll 为 Some
    #[test]
    fn options_with_options_merges() {
        let mut opts = crate::RequestOptions::default();
        opts.wire.headers.insert(
            reqwest::header::HeaderName::from_static("x-ext"),
            reqwest::header::HeaderValue::from_static("ext-val"),
        );
        opts.wire.timeout = Some(std::time::Duration::from_secs(3));
        let cb: crate::PollCallback = std::sync::Arc::new(|_ev| {});
        opts.on_poll = Some(cb.clone());

        let s = make_options_struct()
            .header("x-existing", "v")
            .with_options(opts);

        assert!(s.header_error.is_none());
        assert_eq!(s.options.timeout(), Some(std::time::Duration::from_secs(3)));
        assert_eq!(s.options.headers().get("x-existing").unwrap(), "v");
        assert_eq!(s.options.headers().get("x-ext").unwrap(), "ext-val");
        assert!(s.options.on_poll.is_some());
    }

    /// P1：[impl_request_builder! +options] on_poll only 形态（模拟 CliRun 场景）
    /// 条件：直接构造 OptionsStruct，通过方法设 headers、header、on_poll、on_poll_arc
    /// 断言：所有字段正确设置，无 error
    #[test]
    fn options_on_poll_only_form_works() {
        let mut batch = reqwest::header::HeaderMap::new();
        batch.insert(
            reqwest::header::HeaderName::from_static("x-batch"),
            reqwest::header::HeaderValue::from_static("b"),
        );
        let cb: crate::PollCallback = std::sync::Arc::new(|_ev: &crate::PollEvent<'_>| {});

        let s = OptionsStruct {
            header_error: None,
            options: crate::RequestOptions::default(),
        };
        let s = s
            .headers(&batch)
            .header("x-a", "1")
            .on_poll(|_ev| {})
            .on_poll_arc(cb);
        assert!(s.header_error.is_none());
        assert_eq!(s.options.headers().get("x-batch").unwrap(), "b");
        assert_eq!(s.options.headers().get("x-a").unwrap(), "1");
        assert!(s.options.on_poll.is_some());
    }

    // ── +options extension bag ──

    /// P0：[impl_request_builder! +options] extension() 写入扩展袋并读回
    /// 条件：调用 .extension(ExtVal(1))
    /// 断言：get_extensions().get::<ExtVal>() 返回 Some(1)
    #[test]
    fn options_extension_inserts_into_bag() {
        let s = make_options_struct().extension(ExtVal(1));
        assert_eq!(s.get_extensions().get::<ExtVal>(), Some(&ExtVal(1)));
    }

    /// P1：[impl_request_builder! +options] extension() 同型后写覆盖先写
    /// 条件：连续 .extension(ExtVal(1)) 与 .extension(ExtVal(2))
    /// 断言：get_extensions().get::<ExtVal>() 返回 Some(2)
    #[test]
    fn options_extension_last_one_wins() {
        let s = make_options_struct()
            .extension(ExtVal(1))
            .extension(ExtVal(2));
        assert_eq!(s.get_extensions().get::<ExtVal>(), Some(&ExtVal(2)));
    }

    /// P0：[impl_request_builder! +options] with_options 合并时扩展袋随动
    /// 条件：外部 opts 袋含 ExtVal(1)，调用 .with_options(opts)
    /// 断言：get_extensions().get::<ExtVal>() 返回 Some(1)
    #[test]
    fn options_with_options_merges_extensions() {
        let mut opts = crate::RequestOptions::default();
        opts.extensions.insert(ExtVal(1));
        let s = make_options_struct().with_options(opts);
        assert_eq!(s.get_extensions().get::<ExtVal>(), Some(&ExtVal(1)));
    }

    /// P1：[impl_request_builder! +options] with_options 传入方覆盖同型
    /// 条件：先 .extension(ExtVal(1))，再 with_options 合并含 ExtVal(2) 的 opts
    /// 断言：get_extensions().get::<ExtVal>() 返回 Some(2)
    #[test]
    fn options_with_options_overrides_same_type() {
        let s = make_options_struct().extension(ExtVal(1));
        let mut opts = crate::RequestOptions::default();
        opts.extensions.insert(ExtVal(2));
        let s = s.with_options(opts);
        assert_eq!(s.get_extensions().get::<ExtVal>(), Some(&ExtVal(2)));
    }

    /// P1：[impl_request_builder! +options] extensions 合并外部袋
    /// 条件：外部袋含 ExtVal(1) 与 ExtStr("a")，调用 .extensions(&ext)
    /// 断言：两类型均可读回，且原袋未被消费
    #[test]
    fn options_extensions_merges_bag() {
        let mut ext = crate::Extensions::new();
        ext.insert(ExtVal(1));
        ext.insert(ExtStr("a".to_string()));
        let s = make_options_struct().extensions(&ext);
        assert_eq!(s.get_extensions().get::<ExtVal>(), Some(&ExtVal(1)));
        assert_eq!(s.get_extensions().get::<ExtStr>().unwrap().0, "a");
        assert!(ext.contains::<ExtVal>(), "source bag should be untouched");
    }

    /// P1：[impl_request_builder! +options] get_extensions 返回引用
    /// 条件：.extension(ExtVal(5)) 后调用 get_extensions()
    /// 断言：返回的引用中 get::<ExtVal>() 为 Some(5)
    #[test]
    fn options_get_extensions_returns_ref() {
        let s = make_options_struct().extension(ExtVal(5));
        assert_eq!(s.get_extensions().get::<ExtVal>(), Some(&ExtVal(5)));
    }

    /// P2：[impl_request_builder! +options] 默认袋为空
    /// 条件：make_options_struct() 不设置任何扩展
    /// 断言：get_extensions().is_empty() 为 true
    #[test]
    fn options_extensions_default_empty() {
        assert!(make_options_struct().get_extensions().is_empty());
    }

    /// 测试夹具：+options 扩展袋用例。
    #[derive(Debug, PartialEq)]
    struct ExtVal(u32);

    /// 测试夹具：+options 扩展袋用例（字符串值）。
    #[derive(Debug)]
    struct ExtStr(String);
}
