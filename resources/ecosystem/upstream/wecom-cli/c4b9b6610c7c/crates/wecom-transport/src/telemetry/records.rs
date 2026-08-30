//! Structured record types delivered through the capture mechanism.
//!
//! Provides [`HttpRequestRecord`] (span-close record), [`CapturedBody`]
//! (body content), [`CaptureSpanId`] (correlation id), and internal
//! field-builders used by [`TraceLayer`](super::capture::TraceLayer).

use std::borrow::Cow;

use serde::{Deserialize, Serialize};

// ════════════════════════════════════════════════════════════════
// CaptureSpanId
// ════════════════════════════════════════════════════════════════

/// Stable identifier for a captured outbound span.
///
/// Unique within the lifetime of a single tracing subscriber. It can be
/// used to correlate data across different callbacks.
///
/// **Stability scope**: subscriber-local. Do NOT persist across
/// processes or compare ids produced by different subscribers. The
/// underlying source is `tracing::span::Id::into_u64()` but consumers
/// must not depend on this representation — the newtype may change
/// internals in the future.
#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct CaptureSpanId(pub(crate) u64);

impl CaptureSpanId {
    /// Borrow the raw 64-bit value. Useful for hashing into custom maps
    /// or for opaque log output.
    pub fn as_u64(self) -> u64 {
        self.0
    }
}

// ════════════════════════════════════════════════════════════════
// Record types
// ════════════════════════════════════════════════════════════════

/// Serialize `Option<HeaderMap>` as `Option<BTreeMap<&str, &str>>`.
fn serialize_header_map_opt<S: serde::Serializer>(
    hdrs: &Option<reqwest::header::HeaderMap>,
    s: S,
) -> Result<S::Ok, S::Error> {
    match hdrs {
        None => s.serialize_none(),
        Some(map) => {
            let pairs: std::collections::BTreeMap<&str, &str> = map
                .iter()
                .filter_map(|(name, value)| Some((name.as_str(), value.to_str().ok()?)))
                .collect();
            pairs.serialize(s)
        }
    }
}

/// Deserialize `Option<HeaderMap>` from `Option<BTreeMap<String, String>>`.
fn deserialize_header_map_opt<'de, D: serde::Deserializer<'de>>(
    d: D,
) -> Result<Option<reqwest::header::HeaderMap>, D::Error> {
    let opt: Option<std::collections::BTreeMap<String, String>> = Option::deserialize(d)?;
    Ok(opt.map(|pairs| {
        let mut map = reqwest::header::HeaderMap::new();
        for (k, v) in pairs {
            if let (Ok(name), Ok(value)) = (
                reqwest::header::HeaderName::from_bytes(k.as_bytes()),
                reqwest::header::HeaderValue::from_str(&v),
            ) {
                map.insert(name, value);
            }
        }
        map
    }))
}

/// Record of a single outbound HTTP request span, delivered through
/// [`CaptureScope::on_request`](super::capture::CaptureScope::on_request).
///
/// All timing values are in milliseconds. Sensitive header values are
/// already masked. Error is a structured JSON value on failure, `None`
/// on success.
///
/// `Default` is intentionally not implemented — a zero-filled record
/// is not valid data.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpRequestRecord {
    /// Stable id of this outbound span; matches the `span_id` of any
    /// [`CapturedBody`] events emitted on the same span.
    pub span_id: CaptureSpanId,
    /// Backend identifier: `"reqwest"`.
    pub backend: String,
    /// Request URL.
    pub endpoint: String,
    /// Action name. `None` for generic HTTP requests.
    pub action: Option<String>,
    /// Request headers (sensitive values already masked by
    /// [`MaskedHeaders`](crate::MaskedHeaders)).
    /// `None` if no request headers were recorded on the span.
    #[serde(
        serialize_with = "serialize_header_map_opt",
        deserialize_with = "deserialize_header_map_opt"
    )]
    pub req_headers: Option<reqwest::header::HeaderMap>,
    /// HTTP response status code.
    pub res_status: u16,
    /// Response headers (sensitive values already masked).
    /// `None` if no response headers were recorded on the span.
    #[serde(
        serialize_with = "serialize_header_map_opt",
        deserialize_with = "deserialize_header_map_opt"
    )]
    pub res_headers: Option<reqwest::header::HeaderMap>,
    /// Total bytes consumed from the response body.
    pub res_body_len: u64,
    /// Time-to-headers in milliseconds.
    pub duration_headers_ms: u64,
    /// Time-to-body-end in milliseconds.
    pub duration_total_ms: u64,
    /// Error message (empty on success). Stored as structured JSON.
    pub error: Option<serde_json::Value>,
}

// ════════════════════════════════════════════════════════════════
// CapturedBody
// ════════════════════════════════════════════════════════════════

/// Body content delivered to push-style callbacks.
///
/// `body` uses `Cow<'a, str>` for flexible ownership.
///
/// [`CapturedBody::span_id`] matches [`HttpRequestRecord::span_id`] for the
/// same outbound call — use it to join body content with the span record.
#[non_exhaustive]
#[derive(Serialize, Deserialize)]
pub struct CapturedBody<'a> {
    /// Join key — same value as `HttpRequestRecord::span_id` for this
    /// outbound call.
    pub span_id: CaptureSpanId,
    /// Always `"http"`. All captured spans are HTTP requests.
    pub kind: &'static str,
    /// Request or response body content.
    pub body: Cow<'a, str>,
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：HttpRequestRecord / CaptureSpanId / CapturedBody（捕获机制的数据记录类型）
    //!
    //! ### 关键接口
    //! - [HttpRequestRecord] — HTTP 请求 span 关闭时传递的记录结构
    //! - [CaptureSpanId] — span 稳定标识符，关联 body 事件和 span 记录
    //! - [CapturedBody] — body 调试事件传递的 body 内容
    //!
    //! ### 关键分支与异常路径
    //! - 字段访问 → 所有值正确可读
    //! - 序列化 → header 序列化为 JSON 对象，header=None 时为 null
    //! - round-trip → 序列化再反序列化后所有字段保留
    //! - SpanId round-trip → as_u64() 返回原始值
    //! - SpanId 相等性 → 相同值相等，不同值不等
    //!
    //! ### 上下游交互
    //! - 上游：TraceLayer 在 span 关闭时构造 HttpRequestRecord
    //! - 下游：用户回调接收 HttpRequestRecord / CapturedBody 进行处理

    use super::*;

    /// P0：[HttpRequestRecord] 字段访问器返回正确的值
    /// 条件：构造含已知值的 HttpRequestRecord
    /// 断言：span_id、endpoint、res_status、duration_total_ms 等字段值匹配，error 为 None
    #[test]
    fn http_record_accessors() {
        let snap = HttpRequestRecord {
            span_id: CaptureSpanId(1),
            backend: "reqwest".into(),
            endpoint: "https://example.com/api".into(),
            action: None,
            req_headers: None,
            res_status: 200,
            res_headers: None,
            res_body_len: 100,
            duration_headers_ms: 5,
            duration_total_ms: 10,
            error: None,
        };
        assert_eq!(snap.span_id, CaptureSpanId(1));
        assert_eq!(snap.endpoint, "https://example.com/api");
        assert_eq!(snap.res_status, 200);
        assert_eq!(snap.duration_total_ms, 10);
        assert!(snap.error.is_none());
    }

    /// P0：[HttpRequestRecord] 序列化为合法 JSON，header 呈现为键值 map
    /// 条件：构造含 req_headers、res_headers 全部字段的 HttpRequestRecord
    /// 断言：JSON 中 header 为对象格式（content-type/application/json），None 时序列化为 null
    #[test]
    fn http_record_serializes_to_json() {
        use reqwest::header::{HeaderMap, HeaderName, HeaderValue};

        let mut req_hdrs = HeaderMap::new();
        req_hdrs.insert(
            HeaderName::from_static("content-type"),
            HeaderValue::from_static("application/json"),
        );
        let mut res_hdrs = HeaderMap::new();
        res_hdrs.insert(
            HeaderName::from_static("x-custom"),
            HeaderValue::from_static("bar"),
        );

        let snap = HttpRequestRecord {
            span_id: CaptureSpanId(1),
            backend: "reqwest".into(),
            endpoint: "https://example.com/api".into(),
            action: None,
            req_headers: Some(req_hdrs),
            res_status: 200,
            res_headers: Some(res_hdrs),
            res_body_len: 100,
            duration_headers_ms: 5,
            duration_total_ms: 10,
            error: None,
        };

        let json = serde_json::to_value(&snap).expect("should serialize to JSON");

        assert_eq!(json["backend"], "reqwest");
        assert_eq!(json["endpoint"], "https://example.com/api");
        assert_eq!(json["res_status"], 200);
        assert_eq!(json["req_headers"]["content-type"], "application/json");
        assert_eq!(json["res_headers"]["x-custom"], "bar");

        // Headers are None → serialized as null
        let snap_none = HttpRequestRecord {
            span_id: CaptureSpanId(2),
            backend: "reqwest".into(),
            endpoint: "https://example.com/svc".into(),
            action: None,
            req_headers: None,
            res_status: 200,
            res_headers: None,
            res_body_len: 50,
            duration_headers_ms: 3,
            duration_total_ms: 7,
            error: None,
        };
        let json_none = serde_json::to_value(&snap_none).expect("should serialize");
        assert!(json_none["req_headers"].is_null());
        assert!(json_none["res_headers"].is_null());
    }

    /// P1：[HttpRequestRecord] JSON round-trip 保留所有字段
    /// 条件：构造含 header、error 等全部字段的 HttpRequestRecord，序列化后反序列化
    /// 断言：原始和恢复后的 span_id、backend、endpoint、header 值等全部一致
    #[test]
    fn http_record_serde_round_trip() {
        use reqwest::header::{HeaderMap, HeaderName, HeaderValue};

        let mut req_hdrs = HeaderMap::new();
        req_hdrs.insert(
            HeaderName::from_static("content-type"),
            HeaderValue::from_static("application/json"),
        );

        let original = HttpRequestRecord {
            span_id: CaptureSpanId(42),
            backend: "reqwest".into(),
            endpoint: "https://api.example.com/v1".into(),
            action: None,
            req_headers: Some(req_hdrs),
            res_status: 201,
            res_headers: None,
            res_body_len: 512,
            duration_headers_ms: 15,
            duration_total_ms: 25,
            error: Some(serde_json::json!("timeout")),
        };

        let json = serde_json::to_string(&original).expect("serialize");
        let restored: HttpRequestRecord = serde_json::from_str(&json).expect("deserialize");

        assert_eq!(original.span_id, restored.span_id);
        assert_eq!(original.backend, restored.backend);
        assert_eq!(original.endpoint, restored.endpoint);
        assert_eq!(original.res_status, restored.res_status);
        assert_eq!(original.res_body_len, restored.res_body_len);
        assert_eq!(original.duration_headers_ms, restored.duration_headers_ms);
        assert_eq!(original.duration_total_ms, restored.duration_total_ms);
        assert_eq!(original.error, restored.error);
        // HeaderMap round-trip
        let orig_ct = original.req_headers.as_ref().unwrap()["content-type"]
            .to_str()
            .unwrap();
        let rest_ct = restored.req_headers.as_ref().unwrap()["content-type"]
            .to_str()
            .unwrap();
        assert_eq!(orig_ct, rest_ct);
        assert!(restored.res_headers.is_none());
    }

    /// P1：[CaptureSpanId] as_u64() 返回原始值
    /// 条件：创建 CaptureSpanId(12345)
    /// 断言：as_u64() 返回 12345，与同值 CaptureSpanId 相等
    #[test]
    fn capture_span_id_roundtrip() {
        let id = CaptureSpanId(12345);
        assert_eq!(id.as_u64(), 12345);
        assert_eq!(id, CaptureSpanId(12345));
    }

    /// P1：[CaptureSpanId] 相同值相等，不同值不等
    /// 条件：创建 CaptureSpanId(1) 和 CaptureSpanId(2)
    /// 断言：相同值 assert_eq 通过，不同值 assert_ne 通过
    #[test]
    fn capture_span_id_equality() {
        assert_eq!(CaptureSpanId(1), CaptureSpanId(1));
        assert_ne!(CaptureSpanId(1), CaptureSpanId(2));
    }
}
