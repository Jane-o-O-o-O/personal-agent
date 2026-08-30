//! HTTP backend family capability — `path`, `envelope`, `range_size`,
//! and optional `base_url`.
//!
//! Shared by `HttpTransportBackend` (reqwest branch) and `WecomBotTransport`.
//!
//! # Two-layer access contract
//!
//! - [`HttpEndpoint`] — **faithful data accessor**: every getter returns the
//!   raw value (`Option` where the field is optional), never a fallback, so
//!   callers can tell whether a value was explicitly set.
//! - [`EndpointHttpExt`] (on [`Endpoint`]) — **in-bag passthrough with
//!   defaults**: getters return concrete fallback values (`""`, `"/"`,
//!   [`PassthroughReq`], [`GatewayRes`]) for business call sites.
//!
//! The two layers share names (`path()`, `base_url()`, ...) but differ in
//! receiver type (`HttpEndpoint` vs `Endpoint`), so misuse is always a
//! compile error rather than a silent behavior change.

use std::sync::Arc;

use super::envelope::{GatewayRes, PassthroughReq, RequestEnvelope, ResponseEnvelope};
use crate::Endpoint;

/// Fallback strategies used when the endpoint's envelopes are `None`.
static DEFAULT_PASSTHROUGH_REQ: PassthroughReq = PassthroughReq;
static DEFAULT_GATEWAY_RES: GatewayRes = GatewayRes;

/// Normalize an HTTP `path` so it always starts with `'/'`.
///
/// - `""`        → `"/"`
/// - `"foo/bar"` → `"/foo/bar"`
/// - `"/foo"`    → `"/foo"` (passthrough)
pub(crate) fn normalize_path(mut path: String) -> String {
    if !path.starts_with('/') {
        path.insert(0, '/');
    }
    path
}

/// HTTP backend family capability.
///
/// `path` is the only required field. `base_url` is optional — when `None`,
/// the transport backend's defaults are used.
///
/// All fields are private; read/write them via the accessors below.
/// `HttpEndpoint` getters return the raw value (`Option` where optional) —
/// defaults live in [`EndpointHttpExt`] only.
#[derive(Clone)]
pub struct HttpEndpoint {
    /// Guaranteed to start with `'/'` (normalized at construction).
    path: String,
    /// `None` → use [`HttpTransportBackend::base_url`](crate::http::HttpTransportBackend::base_url).
    /// `Some(...)` → explicit override (e.g. per-service base_url from schema).
    base_url: Option<String>,
    /// Request-side envelope (payload wrapping). `None` (default) →
    /// [`PassthroughReq`]: no wrapping.
    req_envelope: Option<Arc<dyn RequestEnvelope>>,
    /// Response-side envelope (body decoding). `None` (default) →
    /// [`GatewayRes`]: standard gateway `result`/`error` envelope parsing.
    res_envelope: Option<Arc<dyn ResponseEnvelope>>,
    /// Ranged-download chunk size (bytes). When set, an eligible binary
    /// download is split into chunks of this size.
    ///
    /// `None` (default) — binary response is streamed as one continuous body.
    /// `Some(n)` where `n > 0` — binary response is fetched in fixed-size
    /// Range segments until the complete resource is obtained.
    /// `Some(0)` — no-op (treated as `None` by the transport backend).
    ///
    /// Only effective for JSON request payloads (multipart cannot be replayed).
    range_size: Option<u64>,
}

impl std::fmt::Debug for HttpEndpoint {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut s = f.debug_struct("HttpEndpoint");
        s.field("path", &self.path)
            .field("base_url", &self.base_url)
            .field("req_envelope", &self.req_envelope_or_default().name())
            .field("res_envelope", &self.res_envelope_or_default().name());
        s.field("range_size", &self.range_size).finish()
    }
}

impl PartialEq for HttpEndpoint {
    fn eq(&self, other: &Self) -> bool {
        self.path == other.path
            && self.base_url == other.base_url
            && self.range_size == other.range_size
            && self.req_envelope_or_default().name() == other.req_envelope_or_default().name()
            && self.res_envelope_or_default().name() == other.res_envelope_or_default().name()
    }
}

impl Eq for HttpEndpoint {}

impl HttpEndpoint {
    // ── Constructors ──

    /// Construct an `HttpEndpoint` with default options.
    ///
    /// `base_url` defaults to `None` — the transport backend will fill it
    /// with its own default at execution time. Use
    /// [`with_base_url`](Self::with_base_url) to set an explicit value for
    /// per-service overrides.
    pub fn new(path: impl Into<String>) -> Self {
        Self {
            path: normalize_path(path.into()),
            base_url: None,
            req_envelope: None,
            res_envelope: None,
            range_size: None,
        }
    }

    /// Construct an `HttpEndpoint` from a full URL, splitting it into
    /// `base_url` (`scheme://host[:port]`) and `path` (including query).
    ///
    /// Falls back to treating the input as a bare path when it is not a
    /// parseable URL.
    ///
    /// ```
    /// use wecom_transport::HttpEndpoint;
    /// let h = HttpEndpoint::from_url("https://api.example.com/cgi-bin/x?a=1");
    /// assert_eq!(h.base_url(), Some("https://api.example.com"));
    /// assert_eq!(h.path(), "/cgi-bin/x?a=1");
    /// ```
    pub fn from_url(url: impl AsRef<str>) -> Self {
        match reqwest::Url::parse(url.as_ref()) {
            Ok(parsed) => {
                let origin = format!(
                    "{}://{}{}",
                    parsed.scheme(),
                    parsed.host_str().unwrap_or_default(),
                    parsed.port().map_or_else(String::new, |p| format!(":{p}")),
                );
                let mut path = parsed.path().to_string();
                if let Some(query) = parsed.query() {
                    path.push('?');
                    path.push_str(query);
                }
                Self::new(path).with_base_url(origin)
            }
            Err(_) => Self::new(url.as_ref()),
        }
    }

    // ── Getters (faithful: return the raw value, never a fallback) ──

    /// The HTTP path, guaranteed to start with `'/'`.
    pub fn path(&self) -> &str {
        &self.path
    }

    /// `base_url`, or `None` when unset (transport-level default applies).
    pub fn base_url(&self) -> Option<&str> {
        self.base_url.as_deref()
    }

    /// The request-side envelope, or `None` when unset (falls back to
    /// [`PassthroughReq`]).
    pub fn req_envelope(&self) -> Option<&dyn RequestEnvelope> {
        self.req_envelope.as_deref()
    }

    /// The response-side envelope, or `None` when unset (falls back to
    /// [`GatewayRes`]).
    pub fn res_envelope(&self) -> Option<&dyn ResponseEnvelope> {
        self.res_envelope.as_deref()
    }

    /// The ranged-download chunk size, or `None` when unset.
    pub fn range_size(&self) -> Option<u64> {
        self.range_size
    }

    /// Resolved request envelope (default [`PassthroughReq`]) — for
    /// [`Debug`] / [`PartialEq`] and the in-module ext impl; not public.
    fn req_envelope_or_default(&self) -> &dyn RequestEnvelope {
        self.req_envelope
            .as_deref()
            .unwrap_or(&DEFAULT_PASSTHROUGH_REQ)
    }

    /// Resolved response envelope (default [`GatewayRes`]) — for
    /// [`Debug`] / [`PartialEq`] and the in-module ext impl; not public.
    fn res_envelope_or_default(&self) -> &dyn ResponseEnvelope {
        self.res_envelope.as_deref().unwrap_or(&DEFAULT_GATEWAY_RES)
    }

    // ── Builder-style setters ──

    /// Replace the HTTP path (normalized at construction).
    #[must_use]
    pub fn with_path(mut self, path: impl Into<String>) -> Self {
        self.path = normalize_path(path.into());
        self
    }

    /// Set `base_url`.
    #[must_use]
    pub fn with_base_url(mut self, url: impl Into<String>) -> Self {
        self.base_url = Some(url.into());
        self
    }

    /// Attach a request-side envelope strategy (defined by the consuming
    /// crate, e.g. `PayloadStringReq`).
    #[must_use]
    pub fn with_req_envelope(mut self, envelope: impl RequestEnvelope + 'static) -> Self {
        self.req_envelope = Some(Arc::new(envelope));
        self
    }

    /// Attach a response-side envelope strategy (defined by the consuming
    /// crate, e.g. `NestedRes`).
    #[must_use]
    pub fn with_res_envelope(mut self, envelope: impl ResponseEnvelope + 'static) -> Self {
        self.res_envelope = Some(Arc::new(envelope));
        self
    }

    /// Set the ranged-download chunk size.
    #[must_use]
    pub fn with_range_size(mut self, size: Option<u64>) -> Self {
        self.range_size = size;
        self
    }

    /// Set `base_url`. Convenience builder for service-level configuration.
    #[must_use]
    pub fn with_service(mut self, base_url: impl Into<String>) -> Self {
        self.base_url = Some(base_url.into());
        self
    }

    // ── Derived / location ──

    /// Derive a new `HttpEndpoint` that replaces only `path`, keeping all other
    /// fields from `self`.
    ///
    /// This is the `&self` (derived) counterpart of the consuming `with_*` builder
    /// family: it clones the receiver and normalizes the given `path` via
    /// `normalize_path`. `base_url`, `envelope`, and `range_size` are carried
    /// over unchanged.
    ///
    /// Designed to be used with [`Endpoint::map`](crate::Endpoint::map):
    ///
    /// ```rust
    /// use wecom_transport::{Endpoint, HttpEndpoint};
    ///
    /// let ep = Endpoint::new().with(HttpEndpoint::new("/cgi/action"));
    /// let new_ep = ep.map::<HttpEndpoint>(|e| e.with_path_derived("/task/query"));
    /// # let _ = new_ep;
    /// ```
    #[must_use]
    pub fn with_path_derived(&self, path: impl Into<String>) -> Self {
        let mut derived = self.clone();
        derived.path = normalize_path(path.into());
        derived
    }

    /// Full URL for reqwest backend: `base_url.trim_end('/') + '/' + path.trim_start('/')`.
    ///
    /// Returns `"/"` + path when base_url is `None`.
    pub fn full_url(&self) -> String {
        let base = self.base_url().unwrap_or("");
        if base.is_empty() {
            return format!("/{}", self.path.trim_start_matches('/'));
        }
        format!(
            "{}/{}",
            base.trim_end_matches('/'),
            self.path.trim_start_matches('/')
        )
    }

    /// `host[:port]` parsed from `base_url`. Returns `None` if `base_url` is
    /// `None` or not a parseable URL with a host segment.
    pub fn host(&self) -> Option<String> {
        let base = self.base_url()?;
        let url = reqwest::Url::parse(base).ok()?;
        let host = url.host_str()?;
        Some(match url.port() {
            Some(port) => format!("{host}:{port}"),
            None => host.to_string(),
        })
    }
}

// ── Extension trait: HTTP accessors on Endpoint ───────────────

/// Extension methods for reading HTTP-specific fields from an [`Endpoint`] bag.
///
/// Import this trait to use them on any `&Endpoint`.
///
/// This is the **defaulting layer**: getters return concrete fallback values
/// (`""`, `"/"`, [`PassthroughReq`], [`GatewayRes`]) when the capability or
/// field is absent. For the faithful `Option`-returning accessors, use the
/// `HttpEndpoint` methods directly (e.g. `ep.get::<HttpEndpoint>()`).
pub trait EndpointHttpExt {
    /// HTTP base URL from the [`HttpEndpoint`] capability, or `""` if absent.
    fn base_url(&self) -> &str;

    /// HTTP CGI path from [`HttpEndpoint`], or `"/"` if absent.
    fn path(&self) -> &str;

    /// Request-side envelope strategy from [`HttpEndpoint`], or
    /// [`PassthroughReq`] if absent.
    fn req_envelope(&self) -> &dyn RequestEnvelope;

    /// Response-side envelope strategy from [`HttpEndpoint`], or
    /// [`GatewayRes`] if absent.
    fn res_envelope(&self) -> &dyn ResponseEnvelope;

    /// Ranged-download chunk size from [`HttpEndpoint`] (no default — `None`
    /// when absent).
    fn range_size(&self) -> Option<u64>;

    /// Full URL from [`HttpEndpoint::full_url`], or `"/"` if absent.
    fn full_url(&self) -> String;

    /// `host[:port]` from [`HttpEndpoint::host`].
    fn host(&self) -> Option<String>;

    /// Builder-style setter: replace the HTTP path.
    #[must_use]
    fn with_path(self, path: impl Into<String>) -> Self
    where
        Self: Sized;

    /// Builder-style setter: set `base_url`.
    #[must_use]
    fn with_base_url(self, url: impl Into<String>) -> Self
    where
        Self: Sized;

    /// Builder-style setter: attach a request-side envelope strategy.
    #[must_use]
    fn with_req_envelope(self, envelope: impl RequestEnvelope + 'static) -> Self
    where
        Self: Sized;

    /// Builder-style setter: attach a response-side envelope strategy.
    #[must_use]
    fn with_res_envelope(self, envelope: impl ResponseEnvelope + 'static) -> Self
    where
        Self: Sized;

    /// Builder-style setter: set the ranged-download chunk size.
    #[must_use]
    fn with_range_size(self, size: Option<u64>) -> Self
    where
        Self: Sized;
}

impl EndpointHttpExt for Endpoint {
    fn base_url(&self) -> &str {
        self.get::<HttpEndpoint>()
            .and_then(|h| h.base_url())
            .unwrap_or("")
    }

    fn path(&self) -> &str {
        self.get::<HttpEndpoint>().map(|h| h.path()).unwrap_or("/")
    }

    fn req_envelope(&self) -> &dyn RequestEnvelope {
        self.get::<HttpEndpoint>()
            .map(|h| h.req_envelope_or_default())
            .unwrap_or(&DEFAULT_PASSTHROUGH_REQ)
    }

    fn res_envelope(&self) -> &dyn ResponseEnvelope {
        self.get::<HttpEndpoint>()
            .map(|h| h.res_envelope_or_default())
            .unwrap_or(&DEFAULT_GATEWAY_RES)
    }

    fn range_size(&self) -> Option<u64> {
        self.get::<HttpEndpoint>().and_then(|h| h.range_size())
    }

    fn full_url(&self) -> String {
        self.get::<HttpEndpoint>()
            .map(|h| h.full_url())
            .unwrap_or_else(|| "/".to_string())
    }

    fn host(&self) -> Option<String> {
        self.get::<HttpEndpoint>().and_then(|h| h.host())
    }

    fn with_path(self, path: impl Into<String>) -> Self {
        upsert_http(self, |h| h.with_path(path))
    }

    fn with_base_url(self, url: impl Into<String>) -> Self {
        upsert_http(self, |h| h.with_base_url(url))
    }

    fn with_req_envelope(self, envelope: impl RequestEnvelope + 'static) -> Self {
        upsert_http(self, |h| h.with_req_envelope(envelope))
    }

    fn with_res_envelope(self, envelope: impl ResponseEnvelope + 'static) -> Self {
        upsert_http(self, |h| h.with_res_envelope(envelope))
    }

    fn with_range_size(self, size: Option<u64>) -> Self {
        upsert_http(self, |h| h.with_range_size(size))
    }
}

/// Shared upsert for the `EndpointHttpExt` `with_*` setters: take the existing
/// [`HttpEndpoint`] out of the bag (or start from `HttpEndpoint::new("")`),
/// apply `f`, and put it back.
fn upsert_http(mut endpoint: Endpoint, f: impl FnOnce(HttpEndpoint) -> HttpEndpoint) -> Endpoint {
    let base = endpoint
        .get::<HttpEndpoint>()
        .cloned()
        .unwrap_or_else(|| HttpEndpoint::new(""));
    endpoint.set(f(base));
    endpoint
}

#[cfg(test)]
mod tests {
    //! ## Module summary: HttpEndpoint + EndpointHttpExt tests
    //!
    //! ### Key interfaces
    //! - [HttpEndpoint] — HTTP backend family capability
    //! - [HttpEndpoint::with_path_derived] — `&self` clone-and-replace only the path, keep other fields
    //! - [EndpointHttpExt] — extension trait for Endpoint HTTP accessors
    //! - [normalize_path] — path normalization helper

    use super::*;
    use crate::http::envelope::RequestEnvelope;

    /// 测试用自定义请求侧信封：把 payload 包进 `{"payload": "<json-string>"}`。
    #[derive(Debug, Clone, Copy, Default)]
    struct WrapPayloadReq;
    impl RequestEnvelope for WrapPayloadReq {
        fn encode(&self, payload: serde_json::Value) -> serde_json::Value {
            serde_json::json!({ "payload": payload.to_string() })
        }
        fn name(&self) -> &'static str {
            "wrap-payload"
        }
    }

    /// Test helper: construct an HTTP `Endpoint`.
    fn http_endpoint(base: &str, path: &str) -> Endpoint {
        let http = HttpEndpoint::new(path).with_service(base);
        Endpoint::new().with(http)
    }

    // ── HttpEndpoint own methods ──

    /// P0：[HttpEndpoint::full_url] 拼接 base_url 与 path
    /// 条件：构造带 base_url 与 path 的 HttpEndpoint
    /// 断言：full_url() == "https://api.example.com/users/list"
    #[test]
    fn http_endpoint_full_url() {
        let h = HttpEndpoint::new("/users/list").with_base_url("https://api.example.com");
        assert_eq!(h.full_url(), "https://api.example.com/users/list");
    }

    /// P0：[HttpEndpoint::host] 显式端口保留
    /// 条件：base_url 含显式端口 "http://10.0.0.1:8080"
    /// 断言：host() == Some("10.0.0.1:8080")
    #[test]
    fn http_endpoint_host_explicit_port() {
        let h = HttpEndpoint::new("/").with_base_url("http://10.0.0.1:8080");
        assert_eq!(h.host(), Some("10.0.0.1:8080".to_string()));
    }

    /// P0：[HttpEndpoint::host] 默认端口（80/443）省略
    /// 条件：base_url 为 https/http 且无显式端口
    /// 断言：host() 不携带默认端口，返回 "api.example.com"
    #[test]
    fn http_endpoint_host_default_port_omitted() {
        let h1 = HttpEndpoint::new("/").with_base_url("https://api.example.com");
        let h2 = HttpEndpoint::new("/").with_base_url("http://api.example.com");
        assert_eq!(h1.host(), Some("api.example.com".to_string()));
        assert_eq!(h2.host(), Some("api.example.com".to_string()));
    }

    /// P0：[HttpEndpoint] 经 Endpoint::with 放入能力袋后可经 get 读回
    /// 条件：Endpoint::new().with(HttpEndpoint::new("/test").with_base_url(...))
    /// 断言：get::<HttpEndpoint>() 返回 base_url 与 path 均正确的能力
    #[test]
    fn http_endpoint_convenience_creates_bag() {
        let ep = Endpoint::new()
            .with(HttpEndpoint::new("/test").with_base_url("https://api.example.com"));
        let http = ep.get::<HttpEndpoint>().unwrap();
        assert_eq!(http.base_url(), Some("https://api.example.com"));
        assert_eq!(http.path(), "/test");
    }

    // ── with_service ──

    /// P0：[HttpEndpoint::with_service] 设置 base_url
    /// 条件：调用 with_service(base_url) 创建 HttpEndpoint
    /// 断言：base_url 已设置，path 不变
    #[test]
    fn with_service_sets_base_url() {
        let h = HttpEndpoint::new("/api/test").with_service("https://svc.example.com");
        assert_eq!(h.path(), "/api/test");
        assert_eq!(h.base_url(), Some("https://svc.example.com"));
    }

    // ── with_path_derived ──

    /// P0：[HttpEndpoint::with_path_derived] replaces path and preserves other fields
    /// 条件：源含 base_url + envelope + range_size
    /// 断言：path 更新为 "/task/query"，其余字段与源一致
    #[test]
    fn with_path_derived_preserves_other_fields() {
        let src = HttpEndpoint::new("/original")
            .with_service("https://api.example.com")
            .with_req_envelope(WrapPayloadReq)
            .with_range_size(Some(4096));

        let derived = src.with_path_derived("/task/query");
        assert_eq!(derived.path(), "/task/query");
        assert_eq!(derived.base_url(), Some("https://api.example.com"));
        assert_eq!(
            derived.req_envelope().map(|e| e.name()),
            Some("wrap-payload")
        );
        assert_eq!(derived.range_size(), Some(4096));
    }

    /// P1：[HttpEndpoint::with_path_derived] normalizes a path without leading slash
    /// 条件：传入 "task/query"
    /// 断言：path 被规范化为 "/task/query"，源对象不受影响
    #[test]
    fn with_path_derived_normalizes_and_leaves_source_intact() {
        let src = HttpEndpoint::new("/original").with_base_url("https://x.com");
        let derived = src.with_path_derived("task/query");
        assert_eq!(derived.path(), "/task/query");
        assert_eq!(src.path(), "/original");
    }

    // ── envelope ──

    /// P0：[HttpEndpoint::req_envelope] 默认 PassthroughReq，设置后可读回
    /// 条件：构造默认 HttpEndpoint；再 with_req_envelope(WrapPayloadReq) 放入 Endpoint 袋
    /// 断言：默认 passthrough；设置后 EndpointHttpExt::req_envelope() 为 wrap-payload
    #[test]
    fn envelope_defaults_to_passthrough_and_readable() {
        let plain = Endpoint::new().with(HttpEndpoint::new("/x"));
        assert_eq!(plain.req_envelope().name(), "passthrough");

        let gateway =
            Endpoint::new().with(HttpEndpoint::new("/x").with_req_envelope(WrapPayloadReq));
        assert_eq!(gateway.req_envelope().name(), "wrap-payload");
    }

    /// P1：[EndpointHttpExt::with_req_envelope] 直接经 Endpoint 袋设置并回读
    /// 条件：Endpoint 袋已含 HttpEndpoint，再链式 .with_req_envelope(WrapPayloadReq)
    /// 断言：req_envelope 为 wrap-payload，其余字段不受影响
    #[test]
    fn endpoint_with_req_envelope_roundtrip() {
        let base = http_endpoint("https://api.example.com", "/x");
        let ep = base.clone().with_req_envelope(WrapPayloadReq);
        assert_eq!(ep.req_envelope().name(), "wrap-payload");
        assert_eq!(ep.base_url(), base.base_url());
        assert_eq!(ep.path(), base.path());
    }

    /// P1：[HttpEndpoint::PartialEq] 相等性按 req/res envelope 策略名比较
    /// 条件：两个仅 req_envelope 不同的 HttpEndpoint；另构造同策略端点
    /// 断言：不同策略不相等；同策略（不同实例）相等
    #[test]
    fn equality_compares_envelope_by_name() {
        let gateway = HttpEndpoint::new("/x").with_req_envelope(WrapPayloadReq);
        let plain = HttpEndpoint::new("/x");
        assert_ne!(plain, gateway);

        let gateway2 = HttpEndpoint::new("/x").with_req_envelope(WrapPayloadReq);
        assert_eq!(gateway, gateway2);
    }

    // ── normalize_path edge cases ──

    /// P1：[normalize_path] covers "", "foo", "/foo", "//foo"
    #[test]
    fn normalize_path_boundary_cases() {
        assert_eq!(normalize_path(String::new()), "/");
        assert_eq!(normalize_path("foo".to_string()), "/foo");
        assert_eq!(normalize_path("/foo".to_string()), "/foo");
        assert_eq!(normalize_path("//foo".to_string()), "//foo");
    }

    // ── EndpointHttpExt: full_url ──

    /// P0：[EndpointHttpExt::full_url] normal join
    #[test]
    fn full_url_joins_base_and_path() {
        let e = http_endpoint("https://api.example.com", "/users/list");
        assert_eq!(e.full_url(), "https://api.example.com/users/list");
    }

    /// P0：[EndpointHttpExt::full_url] trims trailing+leading slashes
    #[test]
    fn full_url_trims_trailing_and_leading_slash() {
        let e = http_endpoint("https://api.example.com/", "/users");
        assert_eq!(e.full_url(), "https://api.example.com/users");
    }

    /// P0：[EndpointHttpExt::full_url] path without leading slash
    #[test]
    fn full_url_adds_slash_when_path_has_no_leading_slash() {
        let e = http_endpoint("https://api.example.com", "users/list");
        assert_eq!(e.path(), "/users/list");
        assert_eq!(e.full_url(), "https://api.example.com/users/list");
    }

    /// P1：[EndpointHttpExt::full_url] empty path → base_url + '/'
    #[test]
    fn full_url_empty_path() {
        let e = http_endpoint("https://x.com", "");
        assert_eq!(e.path(), "/");
        assert_eq!(e.full_url(), "https://x.com/");
    }

    /// P1：[EndpointHttpExt::full_url] preserves query string
    #[test]
    fn full_url_preserves_query_string() {
        let e = http_endpoint("https://x.com", "/cgi/x?a=1&b=2");
        assert_eq!(e.full_url(), "https://x.com/cgi/x?a=1&b=2");
    }

    // ── EndpointHttpExt: host ──

    /// P0：[EndpointHttpExt::host] explicit port preserved
    #[test]
    fn host_explicit_port_is_preserved() {
        let e = http_endpoint("http://10.0.0.1:8080", "/");
        assert_eq!(e.host(), Some("10.0.0.1:8080".to_string()));
    }

    /// P0：[EndpointHttpExt::host] default port omitted
    #[test]
    fn host_default_port_omitted() {
        let e1 = http_endpoint("https://api.example.com", "/");
        let e2 = http_endpoint("http://api.example.com", "/");
        assert_eq!(e1.host(), Some("api.example.com".to_string()));
        assert_eq!(e2.host(), Some("api.example.com".to_string()));
    }

    /// P1：[EndpointHttpExt::host] returns None when URL parse fails
    #[test]
    fn host_returns_none_when_url_parse_fails() {
        let e1 = http_endpoint("not-a-url", "/");
        let e2 = http_endpoint("", "/");
        assert_eq!(e1.host(), None);
        assert_eq!(e2.host(), None);
    }

    /// P1：[EndpointHttpExt::host] returns None when URL has no host
    #[test]
    fn host_returns_none_when_url_has_no_host() {
        let e = http_endpoint("data:text/plain,foo", "/");
        assert_eq!(e.host(), None);
    }

    /// P1：[EndpointHttpExt::host] strips path and query
    #[test]
    fn host_strips_path_and_query() {
        let e = http_endpoint("http://api.example.com:9000/api/v1?foo=bar", "/");
        assert_eq!(e.host(), Some("api.example.com:9000".to_string()));
    }

    /// P2：[EndpointHttpExt::host] IPv6 literal preserves brackets
    #[test]
    fn host_handles_ipv6_literal() {
        let e = http_endpoint("http://[::1]:8080", "/");
        assert_eq!(e.host(), Some("[::1]:8080".to_string()));
    }
}
