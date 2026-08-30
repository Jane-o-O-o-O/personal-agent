//! Aggregated per-request parameters — wire-level (headers, timeout)
//! plus protocol-level (poll callback).
//!
//! # Layers
//!
//! - [`WireOptions`] — "what goes on the HTTP wire". Backend / raw-HTTP layer
//!   owns and reads only this. `on_poll` does **not** belong here.
//! - [`RequestOptions`] — extends [`WireOptions`] with long-task polling
//!   callbacks. Transport / protocol layer owns and reads both.
//!
//! Every request builder in the chain that uses `+options` in
//! [`impl_request_builder!`](crate::impl_request_builder!) will automatically
//! expose `with_options(RequestOptions)` and individual per-field setters.
//!
//! # Adding a new wire parameter
//!
//! 1. Add the field to [`WireOptions`].
//! 2. Optionally add a convenience setter in the `@options_block` macro arm.
//!
//! Backend code accesses parameters via `req.options.wire.<field>`; transport
//! code accesses both `options.wire.<field>` and `options.on_poll`.

use std::time::Duration;

use reqwest::header::HeaderMap;

use crate::{Extensions, PollCallback};

// ── WireOptions ──────────────────────────────────────────────────────

/// Pure wire-level per-request configuration.
///
/// These are the parameters that ultimately land on an HTTP request —
/// headers and timeouts. Backend (`HttpRequest`) reads *only* from this
/// struct; transport-level concepts like long-task polling are NOT here.
#[derive(Clone, Default)]
pub struct WireOptions {
    /// Extra per-request HTTP headers. Empty by default.
    pub headers: HeaderMap,

    /// Per-request timeout for the HTTP round-trip.
    pub timeout: Option<Duration>,
}

impl std::fmt::Debug for WireOptions {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut s = f.debug_struct("WireOptions");
        s.field("headers", &crate::MaskedHeaders(&self.headers));
        s.field("timeout", &self.timeout);
        s.finish()
    }
}

// ── RequestOptions ───────────────────────────────────────────────────

/// Per-request configuration for transport / protocol layers.
///
/// Contains the wire-level params ([`WireOptions`]) plus protocol-level
/// extensions like the long-task polling callback.
#[derive(Clone, Default)]
pub struct RequestOptions {
    /// Wire-level parameters (headers / timeout).
    pub wire: WireOptions,

    /// Long-task polling heartbeat callback.
    pub on_poll: Option<PollCallback>,

    /// 任意调用方配置能力袋；逐层 merge，自定义后端在 `execute` 中读取。
    pub extensions: Extensions,
}

impl std::fmt::Debug for RequestOptions {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("RequestOptions")
            .field("wire", &self.wire)
            .field("on_poll", &self.on_poll.as_ref().map(|_| "<callback>"))
            .field("extensions", &self.extensions)
            .finish()
    }
}

// ── Accessors — hide the `wire` indirection ──

impl RequestOptions {
    /// Per-request HTTP headers (empty if none were set).
    pub fn headers(&self) -> &HeaderMap {
        &self.wire.headers
    }

    /// Mutable reference to the header map for batch-append.
    pub fn headers_mut(&mut self) -> &mut HeaderMap {
        &mut self.wire.headers
    }

    /// Per-request timeout, if any.
    pub fn timeout(&self) -> Option<Duration> {
        self.wire.timeout
    }

    /// 调用方自定义配置袋（只读）。
    pub fn extensions(&self) -> &Extensions {
        &self.extensions
    }

    /// 调用方自定义配置袋（可变，批量追加）。
    pub fn extensions_mut(&mut self) -> &mut Extensions {
        &mut self.extensions
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：RequestOptions / WireOptions（请求参数聚合）
    //!
    //! ### 关键接口
    //! - [RequestOptions::headers] / [RequestOptions::headers_mut] — 读取/修改附加 HTTP 头
    //! - [RequestOptions::timeout] — 读取超时
    //! - [RequestOptions::extensions] / [RequestOptions::extensions_mut] — 读取/修改扩展袋
    //! - [WireOptions::default] — 空 headers、无超时
    //!
    //! ### 关键分支与异常路径
    //! - Debug 实现挂载自定义 value（MaskedHeaders / callback）。
    //!
    //! ### 上下游交互
    //! - 上游：wecom crate 通过 RequestOptions 配置单次请求
    //! - 下游：HttpTransportBackend 读取 wire 层参数

    use reqwest::header::{AUTHORIZATION, HeaderValue};

    use super::*;

    // ── RequestOptions::headers ──

    /// P0：[RequestOptions::headers] 默认返回空 HeaderMap
    /// 条件：构造 RequestOptions::default()
    /// 断言：headers() 为空
    #[test]
    fn request_options_headers_default_empty() {
        let opts = RequestOptions::default();
        assert!(opts.headers().is_empty());
    }

    /// P0：[RequestOptions::headers_mut] 可插入并读取自定义头
    /// 条件：构造 default 后插入 Authorization: Bearer token
    /// 断言：headers() 能读取到 Bearer token
    #[test]
    fn request_options_headers_mut_insert_and_read() {
        let mut opts = RequestOptions::default();
        opts.headers_mut()
            .insert(AUTHORIZATION, HeaderValue::from_static("Bearer token"));
        assert_eq!(opts.headers().get(AUTHORIZATION).unwrap(), "Bearer token");
    }

    // ── RequestOptions::timeout ──

    /// P0：[RequestOptions::timeout] 默认无超时
    /// 条件：构造 RequestOptions::default()
    /// 断言：timeout() 为 None
    #[test]
    fn request_options_timeout_default_none() {
        let opts = RequestOptions::default();
        assert!(opts.timeout().is_none());
    }

    /// P1：[RequestOptions::timeout] 设置后返回对应值
    /// 条件：构造 timeout=Some(30s)
    /// 断言：timeout() == Some(30s)
    #[test]
    fn request_options_timeout_set() {
        let opts = RequestOptions {
            wire: WireOptions {
                timeout: Some(Duration::from_secs(30)),
                ..Default::default()
            },
            ..Default::default()
        };
        assert_eq!(opts.timeout(), Some(Duration::from_secs(30)));
    }

    // ── Debug ──

    /// P1：[WireOptions::Debug] 包含 headers 和 timeout 字段
    /// 条件：构造 WireOptions::default() 并格式化
    /// 断言：输出含 "WireOptions"、"headers"、"timeout"
    #[test]
    fn wire_options_debug_includes_headers_and_timeout() {
        let opts = WireOptions::default();
        let dbg = format!("{opts:?}");
        assert!(dbg.contains("WireOptions"));
        assert!(dbg.contains("headers"));
        assert!(dbg.contains("timeout"));
    }

    /// P1：[RequestOptions::Debug] 包含 wire 和 on_poll 字段
    /// 条件：构造 RequestOptions::default() 并格式化
    /// 断言：输出含 "RequestOptions"、"wire"、"on_poll"
    #[test]
    fn request_options_debug_includes_wire_and_on_poll() {
        let opts = RequestOptions::default();
        let dbg = format!("{opts:?}");
        assert!(dbg.contains("RequestOptions"));
        assert!(dbg.contains("wire"));
        assert!(dbg.contains("on_poll"));
    }

    /// P2：[RequestOptions::Debug] on_poll 为 Some 时显示 <callback>
    /// 条件：构造 on_poll=Some(Arc::new(callback))
    /// 断言：输出含 "<callback>"
    #[test]
    fn request_options_debug_with_callback() {
        let opts = RequestOptions {
            on_poll: Some(std::sync::Arc::new(|_| {})),
            ..Default::default()
        };
        let dbg = format!("{opts:?}");
        assert!(dbg.contains("<callback>"));
    }

    // ── RequestOptions::extensions ──

    /// P0：[RequestOptions::default] 扩展袋为空
    /// 条件：RequestOptions::default()
    /// 断言：extensions().is_empty() 为 true
    #[test]
    fn request_options_extensions_default_empty() {
        let opts = RequestOptions::default();
        assert!(opts.extensions().is_empty());
    }

    /// P0：[RequestOptions::extensions_mut] 可变访问可插入并读回
    /// 条件：extensions_mut().insert(42u32) 后 extensions().get::<u32>()
    /// 断言：get 返回 Some(42)
    #[test]
    fn request_options_extensions_mut_insert_and_read() {
        let mut opts = RequestOptions::default();
        opts.extensions_mut().insert(42u32);
        assert_eq!(opts.extensions().get::<u32>(), Some(&42));
    }

    /// P1：[RequestOptions::Debug] 包含 extensions 字段
    /// 条件：格式化 RequestOptions::default()
    /// 断言：Debug 输出含 "extensions"
    #[test]
    fn request_options_debug_includes_extensions() {
        let opts = RequestOptions::default();
        let dbg = format!("{opts:?}");
        assert!(dbg.contains("extensions"));
    }
}
