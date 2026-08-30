//! Type-indexed capability bag for transport backends.
//!
//! An [`Endpoint`] is a **capability bag** keyed by [`TypeId`]. Each transport
//! backend declares its own capability type and reads it via [`Endpoint::get`]
//! or [`Endpoint::require`].
//!
//! # Built-in capabilities
//!
//! | Capability | Location | Consumer |
//! |---|---|---|
//! | [`HttpEndpoint`](crate::http::HttpEndpoint) | [`crate::http`] | HttpTransportBackend |
//! | [`PollEndpoint`](crate::PollEndpoint) | [`crate::common`] | http polling (TaskQuery mode) |
//!
//! # Reading capability-specific data
//!
//! Import the extension trait for the capability you need:
//!
//! ```rust
//! use wecom_transport::EndpointHttpExt;  // .base_url(), .path(), .full_url(), .host(), …
//! ```
//!
//! Or use the typed API:
//!
//! ```rust
//! use wecom_transport::{Endpoint, HttpEndpoint};
//!
//! let ep = Endpoint::new().with(HttpEndpoint::new("/cgi/action"));
//! let http = ep.get::<HttpEndpoint>().unwrap();
//! let url  = http.full_url();
//! # let _ = url;
//! ```
//!
//! # Constructing endpoints
//!
//! ```rust
//! use wecom_transport::{Endpoint, HttpEndpoint, PassthroughReq};
//!
//! // HTTP-only (base_url from transport default)
//! let ep = Endpoint::new().with(HttpEndpoint::new("/cgi/action"));
//!
//! // HTTP-only with explicit base_url
//! let ep = Endpoint::new().with(
//!     HttpEndpoint::new("/cgi/action").with_base_url("https://api.example.com")
//! );
//!
//! // With a custom request envelope strategy
//! let http = HttpEndpoint::new("/cgi").with_req_envelope(PassthroughReq);
//! let ep = Endpoint::new().with(http);
//! # let _ = ep;
//! ```

use std::any::{Any, TypeId};
use std::borrow::Cow;
use std::collections::HashMap;
use std::fmt::Debug;

// ── EndpointExt trait ────────────────────────────────────────

/// A value that can be stored in the [`Endpoint`] capability bag.
///
/// Automatically implemented for any `Clone + Debug + Send + Sync + 'static`
/// type via a blanket impl — no manual implementation needed.
pub trait EndpointExt: Any + Debug + Send + Sync + 'static {
    fn as_any(&self) -> &dyn Any;
    fn clone_box(&self) -> Box<dyn EndpointExt>;
    /// Convert an owned boxed capability into a boxed `Any`, enabling
    /// type-safe downcast to the concrete `T` inside [`Endpoint::map`].
    fn into_any(self: Box<Self>) -> Box<dyn Any>;
}

impl<T: Any + Debug + Clone + Send + Sync + 'static> EndpointExt for T {
    fn as_any(&self) -> &dyn Any {
        self
    }
    fn clone_box(&self) -> Box<dyn EndpointExt> {
        Box::new(self.clone())
    }
    fn into_any(self: Box<Self>) -> Box<dyn Any> {
        self
    }
}

// ── Endpoint capability bag ──────────────────────────────────

/// Transport-level unified addressing — a type-indexed capability bag.
///
/// Does not prescribe any fields. Each transport backend reads only the
/// capability types it declared, via [`Endpoint::get`] or [`Endpoint::require`].
///
/// For capability-specific accessors (`base_url()`, `full_url()`, …),
/// import the corresponding extension trait:
/// - [`EndpointHttpExt`](crate::http::EndpointHttpExt)
#[derive(Default)]
pub struct Endpoint {
    ext: HashMap<TypeId, Box<dyn EndpointExt>>,
}

impl Clone for Endpoint {
    fn clone(&self) -> Self {
        let mut ext: HashMap<TypeId, Box<dyn EndpointExt>> = HashMap::with_capacity(self.ext.len());
        for (k, v) in &self.ext {
            ext.insert(*k, (**v).clone_box());
        }
        Self { ext }
    }
}

impl Debug for Endpoint {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_set().entries(self.ext.values()).finish()
    }
}

impl Endpoint {
    // ── Capability API ───────────────────────────────────────

    /// Create an empty capability bag. Build up with `.with(...)`.
    pub fn new() -> Self {
        Self::default()
    }

    /// Attach or overwrite a capability (builder style). Same-type
    /// capabilities are replaced (last wins).
    #[must_use]
    pub fn with<T: EndpointExt>(mut self, cap: T) -> Self {
        self.ext.insert(TypeId::of::<T>(), Box::new(cap));
        self
    }

    /// Attach or overwrite a capability in place.
    pub fn set<T: EndpointExt>(&mut self, cap: T) {
        self.ext.insert(TypeId::of::<T>(), Box::new(cap));
    }

    /// Transform a capability of type `T`, returning the updated bag.
    ///
    /// When the capability is present, it is taken out of the bag (owned) and
    /// passed to `f` by value; its return value replaces the old one, and all
    /// other capabilities are kept. When the capability is absent, `f` is not
    /// called and the bag is returned unchanged.
    ///
    /// Pairs with capability-specific derivations such as
    /// [`HttpEndpoint::with_path_derived`](crate::http::HttpEndpoint::with_path_derived):
    ///
    /// ```rust
    /// use wecom_transport::{Endpoint, HttpEndpoint};
    ///
    /// let ep = Endpoint::new().with(HttpEndpoint::new("/cgi/action"));
    /// let new_ep = ep.map::<HttpEndpoint>(|e| e.with_path_derived("/task/query"));
    /// # let _ = new_ep;
    /// ```
    #[must_use]
    pub fn map<T: EndpointExt>(mut self, f: impl FnOnce(T) -> T) -> Self {
        if let Some(cap) = self.ext.remove(&TypeId::of::<T>())
            && let Ok(boxed) = cap.into_any().downcast::<T>()
        {
            self.set(f(*boxed));
        }
        self
    }

    /// Read a capability by type. Returns `None` if absent.
    pub fn get<T: EndpointExt>(&self) -> Option<&T> {
        let b = self.ext.get(&TypeId::of::<T>())?;
        (**b).as_any().downcast_ref::<T>()
    }

    /// Read a **required** capability. Missing → `Error::Config` with
    /// the transport name and the Rust type name of the missing capability.
    pub fn require<T: EndpointExt>(&self, transport: &str) -> crate::Result<&T> {
        self.get::<T>().ok_or_else(|| {
            crate::Error::Config(format!(
                "`{transport}` transport requires endpoint capability `{}`",
                std::any::type_name::<T>()
            ))
        })
    }
}

// ── IntoCowEndpoint ──────────────────────────────────────────

/// Trait for converting various endpoint representations into `Cow<'a, Endpoint>`.
///
/// - `&'a Endpoint`        → `Cow::Borrowed` (zero-copy)
/// - `Endpoint`            → `Cow::Owned`
/// - `Cow<'a, Endpoint>`   → pass-through
///
/// Capability values should be wrapped in an [`Endpoint`] by the caller:
/// `Endpoint::new().with(capability)`.
pub trait IntoCowEndpoint<'a> {
    fn into_cow_endpoint(self) -> Cow<'a, Endpoint>;
}

impl<'a> IntoCowEndpoint<'a> for &'a Endpoint {
    fn into_cow_endpoint(self) -> Cow<'a, Endpoint> {
        Cow::Borrowed(self)
    }
}

impl<'a> IntoCowEndpoint<'a> for Endpoint {
    fn into_cow_endpoint(self) -> Cow<'a, Endpoint> {
        Cow::Owned(self)
    }
}

impl<'a> IntoCowEndpoint<'a> for Cow<'a, Endpoint> {
    fn into_cow_endpoint(self) -> Cow<'a, Endpoint> {
        self
    }
}

// ── Tests ────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    //! ## 模块摘要：common::endpoint（Endpoint 能力袋核心 API）
    //!
    //! ### 关键接口
    //! - [Endpoint::new] / [Endpoint::with] / [Endpoint::get] / [Endpoint::require] / [Endpoint::set] — 能力袋增删改查
    //! - [Endpoint::map] — 就地转换单个能力，保留其余；缺失时 no-op
    //! - [IntoCowEndpoint] — 端点参数零拷贝（借用）/ 拥有 / 透传转换
    //!
    //! ### 关键分支与异常路径
    //! - 仅 HTTP / 多能力端点构造
    //! - 路径规范化：缺前导斜杠自动补 `/`，空路径 → `"/"`
    //! - [Endpoint::require] 能力缺失 → Err(Config)
    //! - req/res envelope 默认 PassthroughReq / GatewayRes；with_req_envelope 仅替换策略
    //! - [Endpoint::set] 原地覆盖；[Endpoint::with] 同类型后者胜出
    //!
    //! ### 上下游交互
    //! - 上游：调用方（wecom、transport e2e helpers 及下游集成方）构造 Endpoint
    //! - 下游：TransportRequest → TransportBackend::execute 消费 Endpoint 做路由

    use super::*;
    use crate::HttpEndpoint;
    use crate::http::EndpointHttpExt;

    /// 第二个能力类型，用于验证袋操作不触碰非目标能力。
    #[derive(Clone, Debug, PartialEq, Eq)]
    struct TestCapability(String);

    /// 测试助手：创建仅含 HTTP 能力的 Endpoint。
    fn http_endpoint(base: &str, path: &str) -> Endpoint {
        let http = HttpEndpoint::new(path).with_base_url(base);
        Endpoint::new().with(http)
    }

    // ── Endpoint::http ──

    /// P0：[Endpoint::http] 构造仅含 HTTP 能力的端点
    /// 条件：创建 base_url + path 的 HTTP-only Endpoint
    /// 断言：base_url() 与 path() 与构造值一致
    #[test]
    fn http_constructs_correct_fields() {
        let e = http_endpoint("https://api.example.com", "/cgi-bin/x");
        assert_eq!(e.base_url(), "https://api.example.com");
        assert_eq!(e.path(), "/cgi-bin/x");
    }

    // ── envelope ──

    /// 测试用自定义请求侧信封：把 payload 包进 `{"payload": "<json-string>"}`。
    #[derive(Debug, Clone, Copy, Default)]
    struct WrapPayloadReq;
    impl crate::http::envelope::RequestEnvelope for WrapPayloadReq {
        fn encode(&self, payload: serde_json::Value) -> serde_json::Value {
            serde_json::json!({ "payload": payload.to_string() })
        }
        fn name(&self) -> &'static str {
            "wrap-payload"
        }
    }

    /// P0：req/res envelope 默认 PassthroughReq / GatewayRes
    /// 条件：构造 HTTP-only 端点与空端点
    /// 断言：req_envelope() / res_envelope() 均为默认策略
    #[test]
    fn envelope_defaults_to_passthrough_and_gateway() {
        let b = http_endpoint("https://x.com", "/p");
        assert_eq!(b.req_envelope().name(), "passthrough");
        assert_eq!(b.res_envelope().name(), "gateway");
        assert_eq!(Endpoint::new().req_envelope().name(), "passthrough");
        assert_eq!(Endpoint::new().res_envelope().name(), "gateway");
    }

    /// P0：with_req_envelope 仅替换策略，base_url 与 path 不变
    /// 条件：对已有端点调用 with_req_envelope(WrapPayloadReq)
    /// 断言：req envelope 为 wrap-payload，res envelope 与 base_url/path 不变
    #[test]
    fn with_req_envelope_sets_strategy_only() {
        let base = http_endpoint("https://x.com", "/service/discovery");
        let wrapped = base.clone().with_req_envelope(WrapPayloadReq);
        assert_eq!(wrapped.req_envelope().name(), "wrap-payload");
        assert_eq!(wrapped.res_envelope().name(), "gateway");
        assert_eq!(wrapped.base_url(), base.base_url());
        assert_eq!(wrapped.path(), base.path());
    }

    /// P1：path 无前导斜杠时自动补齐
    /// 条件：path 传入 "service/discovery"
    /// 断言：path() 规范化为 "/service/discovery"
    #[test]
    fn http_derives_without_leading_slash() {
        let e = http_endpoint("", "service/discovery");
        assert_eq!(e.path(), "/service/discovery");
    }

    /// P1：空 path 规范化为 `"/"`
    /// 条件：path 传入空串
    /// 断言：path() == "/"
    #[test]
    fn http_normalizes_empty_path_to_slash() {
        let e = http_endpoint("", "");
        assert_eq!(e.path(), "/");
    }
    /// P1：path 无前导斜杠时规范化
    /// 条件：path 传入 "foo/bar"
    /// 断言：path() == "/foo/bar"
    #[test]
    fn http_normalizes_path() {
        let http = HttpEndpoint::new("foo/bar").with_base_url("https://x.com");
        let e = Endpoint::new().with(http);
        assert_eq!(e.path(), "/foo/bar");
    }

    // ── IntoCowEndpoint ──

    /// P0：[IntoCowEndpoint] `&Endpoint` → `Cow::Borrowed`
    /// 条件：对 &Endpoint 调用 into_cow_endpoint()
    /// 断言：结果为 Cow::Borrowed
    #[test]
    fn into_cow_endpoint_borrowed() {
        let e = http_endpoint("https://x.com", "/p");
        let cow = (&e).into_cow_endpoint();
        match cow {
            Cow::Borrowed(_) => {}
            Cow::Owned(_) => panic!("&Endpoint should yield Cow::Borrowed"),
        }
    }

    /// P0：[IntoCowEndpoint] `Endpoint` → `Cow::Owned`
    /// 条件：对 Endpoint 值调用 into_cow_endpoint()
    /// 断言：结果为 Cow::Owned
    #[test]
    fn into_cow_endpoint_owned() {
        let e = http_endpoint("https://x.com", "/p");
        let cow = e.into_cow_endpoint();
        match cow {
            Cow::Owned(_) => {}
            Cow::Borrowed(_) => panic!("Endpoint should yield Cow::Owned"),
        }
    }

    /// P0：[IntoCowEndpoint] `Cow::Borrowed` 透传
    /// 条件：传入 Cow::Borrowed 调用 into_cow_endpoint()
    /// 断言：结果仍为 Cow::Borrowed
    #[test]
    fn into_cow_endpoint_passthrough_borrowed() {
        let e = http_endpoint("https://x.com", "/p");
        let cow_in: Cow<'_, Endpoint> = Cow::Borrowed(&e);
        let cow_out = cow_in.into_cow_endpoint();
        match cow_out {
            Cow::Borrowed(_) => {}
            Cow::Owned(_) => panic!("Cow::Borrowed should pass through as Borrowed"),
        }
    }

    /// P0：[IntoCowEndpoint] `Cow::Owned` 透传
    /// 条件：传入 Cow::Owned 调用 into_cow_endpoint()
    /// 断言：结果仍为 Cow::Owned
    #[test]
    fn into_cow_endpoint_passthrough_owned() {
        let e = http_endpoint("https://x.com", "/p");
        let cow_in: Cow<'_, Endpoint> = Cow::Owned(e);
        let cow_out = cow_in.into_cow_endpoint();
        match cow_out {
            Cow::Owned(_) => {}
            Cow::Borrowed(_) => panic!("Cow::Owned should pass through as Owned"),
        }
    }

    // ── Clone ──

    /// P2：[Endpoint] Clone 保留全部能力
    /// 条件：端点含 HttpEndpoint 与 TestCapability 两种能力后 clone
    /// 断言：clone 后的两种能力与原值相等
    #[test]
    fn clone_preserves_capabilities() {
        let e = http_endpoint("https://x.com", "/p").with(TestCapability("c".into()));
        let cloned = e.clone();
        assert_eq!(
            e.get::<HttpEndpoint>(),
            cloned.get::<HttpEndpoint>(),
            "HttpEndpoint should be equal after clone"
        );
        assert_eq!(
            e.get::<TestCapability>(),
            cloned.get::<TestCapability>(),
            "TestCapability should be equal after clone"
        );
    }

    /// P2：[Endpoint] 不同 HttpEndpoint 能力不相等
    /// 条件：构造 path 不同的两个端点
    /// 断言：两者 get::<HttpEndpoint>() 不相等
    #[test]
    fn different_http_endpoints_are_not_equal() {
        let a = http_endpoint("https://x.com", "/a");
        let b = http_endpoint("https://x.com", "/b");
        assert_ne!(a.get::<HttpEndpoint>(), b.get::<HttpEndpoint>());
    }

    // ── Capability access ──

    /// P0：[Endpoint::with/get] 写入读取 round-trip
    /// 条件：with(HttpEndpoint) 后 get::<HttpEndpoint>()
    /// 断言：取回的能力字段与写入一致
    #[test]
    fn with_and_get_roundtrip() {
        let ep = Endpoint::new()
            .with(HttpEndpoint::new("/test").with_base_url("https://api.example.com"));
        let http = ep.get::<HttpEndpoint>().unwrap();
        assert_eq!(http.base_url(), Some("https://api.example.com"));
        assert_eq!(http.path(), "/test");
    }

    /// P0：[Endpoint::require] 能力存在时返回 Ok
    /// 条件：袋中含 HttpEndpoint，以 "test-transport" 调用 require
    /// 断言：返回 Ok 且字段正确
    #[test]
    fn require_returns_ok_when_present() {
        let ep = Endpoint::new()
            .with(HttpEndpoint::new("/test").with_base_url("https://api.example.com"));
        let http = ep.require::<HttpEndpoint>("test-transport").unwrap();
        assert_eq!(http.base_url(), Some("https://api.example.com"));
    }

    /// P0：[Endpoint::require] 能力缺失时返回 Err(Config)
    /// 条件：空袋调用 require::<HttpEndpoint>
    /// 断言：错误信息包含 transport 名与能力类型名
    #[test]
    fn require_returns_config_error_when_missing() {
        let ep = Endpoint::new();
        let err = ep.require::<HttpEndpoint>("test-transport").unwrap_err();
        let msg = format!("{err}");
        assert!(
            msg.contains("test-transport"),
            "error should mention transport name, got: {msg}"
        );
        assert!(
            msg.contains("HttpEndpoint"),
            "error should mention capability type, got: {msg}"
        );
    }

    /// P0：[Endpoint::set] 原地覆盖能力
    /// 条件：set 新 HttpEndpoint 到已有袋
    /// 断言：get 返回新值（base_url/path 更新）
    #[test]
    fn set_overwrites_capability() {
        let mut ep = Endpoint::new()
            .with(HttpEndpoint::new("/old").with_base_url("https://old.example.com"));
        ep.set(HttpEndpoint::new("/new").with_base_url("https://new.example.com"));
        let http = ep.get::<HttpEndpoint>().unwrap();
        assert_eq!(http.base_url(), Some("https://new.example.com"));
    }

    // ── Endpoint::map ──

    /// P0：[Endpoint::map] 转换存在的能力，保留其余
    /// 条件：bag 含 HttpEndpoint + TestCapability，用 with_path_derived 改写 path
    /// 断言：path 更新，base_url 保留，TestCapability 原样保留
    #[test]
    fn map_transforms_present_capability_and_keeps_others() {
        let http = HttpEndpoint::new("/original").with_base_url("https://api.example.com");
        let ep = Endpoint::new()
            .with(http)
            .with(TestCapability("keep".into()))
            .map::<HttpEndpoint>(|h| h.with_path_derived("/task/query"));
        assert_eq!(ep.path(), "/task/query");
        assert_eq!(ep.base_url(), "https://api.example.com");
        assert_eq!(
            ep.get::<TestCapability>(),
            Some(&TestCapability("keep".into())),
            "non-target capability should be preserved"
        );
    }

    /// P1：[Endpoint::map] 目标能力缺失时 no-op
    /// 条件：bag 仅含 TestCapability，对 HttpEndpoint 调用 map
    /// 断言：闭包不执行，HttpEndpoint 仍缺失，TestCapability 原样保留
    #[test]
    fn map_is_noop_when_capability_absent() {
        let ep = Endpoint::new()
            .with(TestCapability("keep".into()))
            .map::<HttpEndpoint>(|h| {
                panic!("closure must not run when capability is absent: {h:?}")
            });
        assert!(ep.get::<HttpEndpoint>().is_none());
        assert_eq!(
            ep.get::<TestCapability>(),
            Some(&TestCapability("keep".into())),
            "non-target capability should be preserved"
        );
    }

    /// P1：[Endpoint::with] 同类型覆盖（后者胜出）
    /// 条件：连续 with 两个同类型 HttpEndpoint
    /// 断言：get 返回第二个（base_url 为 second）
    #[test]
    fn with_overwrites_same_type() {
        let ep = Endpoint::new()
            .with(HttpEndpoint::new("/a").with_base_url("https://first.example.com"))
            .with(HttpEndpoint::new("/b").with_base_url("https://second.example.com"));
        let http = ep.get::<HttpEndpoint>().unwrap();
        assert_eq!(http.base_url(), Some("https://second.example.com"));
    }

    // ── Debug ──

    /// P2：[Endpoint::Debug] 能力袋 debug 输出包含能力信息
    /// 条件：格式化含 HttpEndpoint 的端点 debug 输出
    /// 断言：输出包含 base_url 内容
    #[test]
    fn endpoint_debug_includes_capability_names() {
        let ep = Endpoint::new()
            .with(HttpEndpoint::new("/test").with_base_url("https://api.example.com"));
        let debug_str = format!("{ep:?}");
        assert!(
            debug_str.contains("https://api.example.com"),
            "Debug should include base_url, got: {debug_str}"
        );
    }
}
