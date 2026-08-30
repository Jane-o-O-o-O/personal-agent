use std::pin::Pin;

use bytes::Bytes;
use futures_core::Stream;
use futures_util::StreamExt;

use crate::telemetry::contract::http_request as ctr;
use crate::{Error, Result};

/// 异步字节流类型别名，用于流式下载等场景。
pub type ByteStream = Pin<Box<dyn Stream<Item = Result<Bytes>> + Send>>;

/// 原始 HTTP 响应。
///
/// Carries the `http.request` tracing span so that body / `res.body_len`
/// can be recorded after the body is actually consumed.
pub struct HttpResponse {
    pub(crate) endpoint: String,
    pub(crate) status: u16,
    pub(crate) headers: reqwest::header::HeaderMap,
    pub(crate) body: ByteStream,
    /// The physical `http.request` span for this response.  Kept alive here
    /// so that body / `res.body_len` can be recorded in [`Self::json`],
    /// [`Self::text`], and the Drop guard on the body stream.
    pub(crate) span: tracing::Span,
}

impl std::fmt::Debug for HttpResponse {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("HttpResponse")
            .field("endpoint", &self.endpoint)
            .field("status", &self.status)
            .field("headers", &self.headers)
            .finish_non_exhaustive()
    }
}

/// Parsed `Content-Range` header value.
///
/// Format: `bytes {start}-{end}/{total}` or `bytes {start}-{end}/*`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ContentRange {
    pub start: u64,
    pub end: u64,
    /// Total resource length, or `None` for `/*` (unknown).
    pub total: Option<u64>,
}

impl ContentRange {
    /// Parse a `Content-Range` header value.
    ///
    /// Accepts `bytes 0-1023/2048` and `bytes 0-1023/*`.
    /// Returns `None` for any other format.
    pub fn parse(value: &str) -> Option<Self> {
        let value = value.trim();
        let rest = value
            .strip_prefix("bytes")
            .or_else(|| value.strip_prefix("Bytes"))?;
        let rest = rest.trim();

        let (range_part, total_part) = rest.split_once('/')?;
        let (start_str, end_str) = range_part.split_once('-')?;
        let start: u64 = start_str.trim().parse().ok()?;
        let end: u64 = end_str.trim().parse().ok()?;
        let total = if total_part.trim() == "*" {
            None
        } else {
            Some(total_part.trim().parse::<u64>().ok()?)
        };
        Some(Self { start, end, total })
    }
}

impl HttpResponse {
    /// 构造一个原始 HTTP 响应（不带 span）。
    ///
    /// The `span` field defaults to [`tracing::Span::none`] so existing
    /// test call-sites compile unchanged.
    pub fn new(
        endpoint: impl Into<String>,
        status: u16,
        headers: reqwest::header::HeaderMap,
        body: ByteStream,
    ) -> Self {
        Self {
            endpoint: endpoint.into(),
            status,
            headers,
            body,
            span: tracing::Span::none(),
        }
    }

    /// Attach the physical `http.request` span to this response.
    ///
    /// The backend (`reqwest_request`) must call this so
    /// that body / `res.body_len` can be recorded later.
    #[must_use]
    pub fn with_span(mut self, span: tracing::Span) -> Self {
        self.span = span;
        self
    }

    pub fn endpoint(&self) -> &str {
        &self.endpoint
    }

    pub fn status(&self) -> reqwest::StatusCode {
        reqwest::StatusCode::from_u16(self.status).expect("Invalid status code")
    }

    pub fn headers(&self) -> &reqwest::header::HeaderMap {
        &self.headers
    }

    pub fn body(&self) -> &ByteStream {
        &self.body
    }

    /// 根据 Content-Type 判断是否 JSON。
    ///
    /// 规则：
    /// - Content-Type 缺失 → true（默认按 JSON 处理）
    /// - MIME 主类型为 `application/json` → true
    /// - 其余 → false
    pub fn is_json(&self) -> bool {
        let Some(v) = self.headers.get(reqwest::header::CONTENT_TYPE) else {
            return true;
        };
        // HeaderValue 可能含非 UTF-8 字节，先按 lossy 转成 str
        let s = v.to_str().unwrap_or_default();
        // 取 semicolon 前的部分，去掉首尾空白
        let mime = s.split(';').next().unwrap_or("").trim();
        mime.eq_ignore_ascii_case("application/json")
    }

    /// 从 Content-Length 头解析 body 长度。
    ///
    /// 缺失或解析失败返回 `None`。
    pub fn content_length(&self) -> Option<u64> {
        self.headers
            .get(reqwest::header::CONTENT_LENGTH)
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.parse::<u64>().ok())
    }

    /// Parse the `Content-Range` header into [`ContentRange`].
    ///
    /// Returns `None` if the header is absent or malformed.
    pub fn content_range(&self) -> Option<ContentRange> {
        ContentRange::parse(
            self.headers
                .get(reqwest::header::CONTENT_RANGE)
                .and_then(|v| v.to_str().ok())?,
        )
    }

    /// Total length for pre-allocation: `Content-Range` total if present,
    /// else `Content-Length`. `None` when neither is known.
    pub fn total_length(&self) -> Option<u64> {
        self.content_range()
            .and_then(|cr| cr.total)
            .or_else(|| self.content_length())
    }

    /// 消费 self，把 body 收齐后反序列化为 `T`；body 内容由 [`Self::text`]
    /// 回填到关联 span 的 body 字段。
    ///
    /// 失败：
    /// - 网络读取失败 → `Error::Network`
    /// - JSON 解析失败 → `Error::Parse`（已记录到 span 的 `error` 字段）
    pub async fn json<T: serde::de::DeserializeOwned>(self) -> Result<T> {
        let span = self.span.clone();
        let endpoint = self.endpoint.clone();
        let body_str = self.text().await?;
        serde_json::from_str(&body_str)
            .map_err(|e| {
                let err = Error::Parse {
                    message: format!("Parse response failed: {e:#}"),
                    endpoint,
                    body: Box::new(serde_json::Value::String(body_str)),
                    source: Some(e),
                };
                span.record(ctr::FIELD_ERROR, err.to_json().to_string());
                err
            })
            .inspect_err(|e| tracing::error!(error = %e, "deserialize response body failed"))
    }

    /// 反序列化为 `R`，再在 `http.request` span 存活期间运行 `parse`
    /// （仅做业务校验），错误回填到 span 上。
    ///
    /// `body_guard` records `res.body_len` / `duration_total_ms` before
    /// `parse` runs.  If `parse` returns `Err`, the error is recorded on
    /// the span via `FIELD_ERROR` before the span closes, so `on_request`
    /// delivers a complete record.
    ///
    /// This is the preferred way to do post-deserialization protocol
    /// parsing — it keeps the span alive through the parse and eliminates
    /// the need for the caller to manage a separate span handle.
    pub async fn json_parse<R: serde::de::DeserializeOwned, T>(
        self,
        parse: impl FnOnce(R) -> Result<T>,
    ) -> Result<T> {
        let span = self.span.clone();
        let value: R = self.json().await?;
        let result = parse(value);
        if let Err(e) = &result {
            span.record(ctr::FIELD_ERROR, e.to_json().to_string());
        }
        result
    }

    /// 消费 self，把 body 收齐后转换为 UTF-8 字符串，同时把 body 回填到关联的
    /// `http.request` span 的 body 字段（截断由 subscriber 负责）。
    ///
    /// 失败：
    /// - 网络读取失败 → `Error::Network`
    /// - 非 UTF-8 编码 → `Error::Parse`（已记录到 span 的 `error` 字段）
    pub async fn text(self) -> Result<String> {
        let span = self.span.clone();
        let endpoint = self.endpoint.clone();
        let body_bytes = self.collect_body().await?;
        let body = String::from_utf8(body_bytes)
            .map_err(|e| {
                let err = Error::Parse {
                    message: format!("Failed to parse response body as UTF-8: {e:#}"),
                    endpoint: endpoint.clone(),
                    body: Box::new(serde_json::Value::Null),
                    source: None,
                };
                span.record(ctr::FIELD_ERROR, err.to_json().to_string());
                err
            })
            .inspect_err(|e| tracing::error!(error = %e, "response body not valid UTF-8"))?;
        // self.span is dropped after this returns → on_close fires.
        Ok(body)
    }

    /// 消费 self，把 body 当作字节流交给调用方。
    ///
    /// The `res.body_len` guard was already attached by the backend
    /// (`telemetry::instrument_body`), so this method just returns the
    /// inner stream directly.
    pub fn bytes_stream(self) -> ByteStream {
        self.body
    }

    // ── 内部辅助 ──

    /// 收齐 body 所有 chunk 为一个 `Vec<u8>`。
    async fn collect_body(self) -> Result<Vec<u8>> {
        let mut body = self.body;
        let mut buf = Vec::new();
        while let Some(item) = body.next().await {
            let chunk = item?;
            buf.extend_from_slice(&chunk);
        }
        Ok(buf)
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：response（HttpResponse 类型定义）
    //!
    //! ### 关键接口
    //! - [HttpResponse::new] — 构造原始 HTTP 响应
    //! - [HttpResponse::is_json] — 根据 Content-Type 判断是否 JSON
    //! - [HttpResponse::content_length] — 从 Content-Length 头解析 body 长度
    //! - [HttpResponse::json] — 收齐 body 后反序列化为 T
    //! - [HttpResponse::bytes_stream] — 消费 self 拿到字节流
    //!
    //! ### 关键分支与异常路径
    //! - is_json: Content-Type 缺失 → true；application/json → true；其他 → false
    //! - content_length: 缺失 → None；非法值 → None；合法 → Some(u64)
    //! - json: 网络错误 → Error::Network；非法 JSON → Error::Parse
    //! - bytes_stream: 直接返回 ByteStream（消费 self）
    //!
    //! ### 上下游交互
    //! - 上游：[`crate::http_client::reqwest_send`] 构造 [`HttpResponse`]
    //! - 下游：TransportRequest 通过 is_json / json / bytes_stream 消费响应

    use assert_json_diff::assert_json_eq;
    use serde_json::json;

    use super::*;
    use crate::Error;

    /// 构造一个用于测试的 HttpResponse（JSON 类型，body 为一段字节流）
    fn make_json_response(body: &str) -> HttpResponse {
        let bytes = body.as_bytes().to_vec();
        let stream = Box::pin(futures_util::stream::once(
            async move { Ok(Bytes::from(bytes)) },
        ));
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            reqwest::header::CONTENT_TYPE,
            reqwest::header::HeaderValue::from_static("application/json"),
        );
        HttpResponse::new("http://test/json", 200, headers, stream)
    }

    /// 构造一个 Content-Type 非 JSON 的 HttpResponse
    fn make_binary_response(url: &str) -> HttpResponse {
        let empty_stream: ByteStream = Box::pin(futures_util::stream::empty());
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            reqwest::header::CONTENT_TYPE,
            reqwest::header::HeaderValue::from_static("text/csv"),
        );
        HttpResponse::new(url.to_string(), 200, headers, empty_stream)
    }

    // ── HttpResponse::is_json ──

    /// P0：[HttpResponse::is_json] Content-Type 为 application/json 时返回 true
    /// 条件：构造 HttpResponse，headers 含 Content-Type: application/json
    /// 断言：is_json() 返回 true
    #[test]
    fn is_json_returns_true_for_application_json() {
        let resp = make_json_response(r#"{"a":1}"#);
        assert!(resp.is_json());
    }

    /// P0：[HttpResponse::is_json] Content-Type 非 JSON 时返回 false
    /// 条件：构造 HttpResponse，headers 含 Content-Type: text/csv
    /// 断言：is_json() 返回 false
    #[test]
    fn is_json_returns_false_for_non_json() {
        let resp = make_binary_response("http://test/bin");
        assert!(!resp.is_json());
    }

    /// P1：[HttpResponse::is_json] Content-Type 缺失时返回 true（默认按 JSON 处理）
    /// 条件：构造 HttpResponse，不设置 Content-Type
    /// 断言：is_json() 返回 true
    #[test]
    fn is_json_returns_true_when_content_type_missing() {
        let empty_stream: ByteStream = Box::pin(futures_util::stream::empty());
        let headers = reqwest::header::HeaderMap::new();
        let resp = HttpResponse::new("http://test/no_ct", 200, headers, empty_stream);
        assert!(resp.is_json());
    }

    /// P1：[HttpResponse::is_json] Content-Type 含 charset 后缀时仍识别为 JSON
    /// 条件：Content-Type: application/json; charset=utf-8
    /// 断言：is_json() 返回 true
    #[test]
    fn is_json_with_charset_suffix() {
        let bytes = r#"{"a":1}"#.as_bytes().to_vec();
        let stream = Box::pin(futures_util::stream::once(
            async move { Ok(Bytes::from(bytes)) },
        ));
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            reqwest::header::CONTENT_TYPE,
            reqwest::header::HeaderValue::from_static("application/json; charset=utf-8"),
        );
        let resp = HttpResponse::new("http://test/charset", 200, headers, stream);
        assert!(resp.is_json());
    }

    // ── HttpResponse::content_length ──

    /// P0：[HttpResponse::content_length] Content-Length 合法时返回 Some(u64)
    /// 条件：headers 含 Content-Length: 42
    /// 断言：content_length() 返回 Some(42)
    #[test]
    fn content_length_returns_some_for_valid_header() {
        let resp = make_json_response(r#"{"a":1}"#);
        let mut headers = resp.headers.clone();
        headers.insert(
            reqwest::header::CONTENT_LENGTH,
            reqwest::header::HeaderValue::from_static("42"),
        );
        let resp = HttpResponse::new(resp.endpoint, resp.status, headers, resp.body);
        assert_eq!(resp.content_length(), Some(42));
    }

    /// P0：[HttpResponse::content_length] Content-Length 缺失时返回 None
    /// 条件：构造 HttpResponse，不设置 Content-Length
    /// 断言：content_length() 返回 None
    #[test]
    fn content_length_returns_none_when_missing() {
        let resp = make_json_response(r#"{"a":1}"#);
        assert_eq!(resp.content_length(), None);
    }

    /// P1：[HttpResponse::content_length] Content-Length 含非数字字符时返回 None
    /// 条件：Content-Length: "abc"
    /// 断言：content_length() 返回 None
    #[test]
    fn content_length_returns_none_for_invalid_value() {
        let resp = make_json_response(r#"{"a":1}"#);
        let mut headers = resp.headers.clone();
        headers.insert(
            reqwest::header::CONTENT_LENGTH,
            reqwest::header::HeaderValue::from_static("abc"),
        );
        let resp = HttpResponse::new(resp.endpoint, resp.status, headers, resp.body);
        assert_eq!(resp.content_length(), None);
    }

    // ── ContentRange / content_range / total_length ──

    /// P0：[ContentRange::parse] 标准 `bytes 0-1023/2048` 正确解析
    /// 条件：输入 "bytes 0-1023/2048"
    /// 断言：start=0, end=1023, total=Some(2048)
    #[test]
    fn content_range_parse_standard() {
        let cr = ContentRange::parse("bytes 0-1023/2048").unwrap();
        assert_eq!(
            cr,
            ContentRange {
                start: 0,
                end: 1023,
                total: Some(2048)
            }
        );
    }

    /// P0：[ContentRange::parse] `bytes 0-1023/*` total 未知
    /// 条件：输入 "bytes 0-1023/*"
    /// 断言：start=0, end=1023, total=None
    #[test]
    fn content_range_parse_unknown_total() {
        let cr = ContentRange::parse("bytes 0-1023/*").unwrap();
        assert_eq!(cr.start, 0);
        assert_eq!(cr.end, 1023);
        assert!(cr.total.is_none());
    }

    /// P1：[ContentRange::parse] 畸形输入返回 None（不 panic）
    /// 条件：输入 "bytes abc" / "not a range" / "bytes 0-1023"（缺 /）
    /// 断言：返回 None
    #[test]
    fn content_range_parse_malformed_returns_none() {
        assert!(ContentRange::parse("bytes abc").is_none());
        assert!(ContentRange::parse("not a range").is_none());
        assert!(ContentRange::parse("bytes 0-1023").is_none()); // missing /
    }

    /// P0：[HttpResponse::content_range] 有 Content-Range 头时正确解析
    /// 条件：headers 含 Content-Range: bytes 0-9/20
    /// 断言：content_range() 返回 Some(ContentRange{0,9,Some(20)})
    #[test]
    fn response_content_range_returns_parsed() {
        let resp = make_json_response(r#"{"a":1}"#);
        let mut headers = resp.headers.clone();
        headers.insert(
            reqwest::header::CONTENT_RANGE,
            reqwest::header::HeaderValue::from_static("bytes 0-9/20"),
        );
        let resp = HttpResponse::new(resp.endpoint, resp.status, headers, resp.body);
        let cr = resp.content_range().unwrap();
        assert_eq!(
            cr,
            ContentRange {
                start: 0,
                end: 9,
                total: Some(20)
            }
        );
    }

    /// P0：[HttpResponse::total_length] Content-Range total 优先于 Content-Length
    /// 条件：Content-Range total=20, Content-Length=10
    /// 断言：total_length() 返回 Some(20)
    #[test]
    fn total_length_prefers_content_range_total() {
        let resp = make_json_response(r#"{"a":1}"#);
        let mut headers = resp.headers.clone();
        headers.insert(
            reqwest::header::CONTENT_RANGE,
            reqwest::header::HeaderValue::from_static("bytes 0-9/20"),
        );
        headers.insert(
            reqwest::header::CONTENT_LENGTH,
            reqwest::header::HeaderValue::from_static("10"),
        );
        let resp = HttpResponse::new(resp.endpoint, resp.status, headers, resp.body);
        assert_eq!(resp.total_length(), Some(20));
    }

    /// P0：[HttpResponse::total_length] 无 Content-Range 时回退到 Content-Length
    /// 条件：无 Content-Range，Content-Length=42
    /// 断言：total_length() 返回 Some(42)
    #[test]
    fn total_length_falls_back_to_content_length() {
        let resp = make_json_response(r#"{"a":1}"#);
        let mut headers = resp.headers.clone();
        headers.insert(
            reqwest::header::CONTENT_LENGTH,
            reqwest::header::HeaderValue::from_static("42"),
        );
        let resp = HttpResponse::new(resp.endpoint, resp.status, headers, resp.body);
        assert_eq!(resp.total_length(), Some(42));
    }

    /// P1：[HttpResponse::total_length] Content-Range 为 /* 时回退到 Content-Length
    /// 条件：Content-Range: bytes 0-9/*, Content-Length=10
    /// 断言：total_length() 返回 Some(10)
    #[test]
    fn total_length_unknown_total_falls_back_to_content_length() {
        let resp = make_json_response(r#"{"a":1}"#);
        let mut headers = resp.headers.clone();
        headers.insert(
            reqwest::header::CONTENT_RANGE,
            reqwest::header::HeaderValue::from_static("bytes 0-9/*"),
        );
        headers.insert(
            reqwest::header::CONTENT_LENGTH,
            reqwest::header::HeaderValue::from_static("10"),
        );
        let resp = HttpResponse::new(resp.endpoint, resp.status, headers, resp.body);
        assert_eq!(resp.total_length(), Some(10));
    }

    /// P1：[HttpResponse::total_length] 无 Content-Range 且无 Content-Length 时返回 None
    /// 条件：既无 Content-Range 也无 Content-Length
    /// 断言：total_length() 返回 None
    #[test]
    fn total_length_none_when_both_absent() {
        let resp = make_json_response(r#"{"a":1}"#);
        assert!(resp.total_length().is_none());
    }

    // ── HttpResponse::json ──

    /// P0：[HttpResponse::json] 合法 JSON body 反序列化成功
    /// 条件：body 为 r#"{"status":"ok"}"#
    /// 断言：json::<Value>() 返回 Ok({"status":"ok"})
    #[tokio::test]
    async fn json_deserializes_successfully() {
        let resp = make_json_response(r#"{"status":"ok"}"#);
        let value: serde_json::Value = resp.json().await.unwrap();
        assert_json_eq!(value, json!({"status": "ok"}));
    }

    /// P0：[HttpResponse::json] 非法 JSON body 返回 Error::Parse
    /// 条件：body 为 "not json"
    /// 断言：json::<Value>() 返回 Err(Error::Parse)
    #[tokio::test]
    async fn json_invalid_body_returns_parse_error() {
        let resp = make_json_response("not json");
        let err = resp.json::<serde_json::Value>().await.unwrap_err();
        assert!(matches!(err, Error::Parse { .. }));
    }

    /// P1：[HttpResponse::json] 泛型 T 为具体类型时正确反序列化
    /// 条件：body 为 r#"{"file_id":"abc123"}"#，T = serde_json::Value
    /// 断言：反序列化结果正确
    #[tokio::test]
    async fn json_generic_deserialize() {
        #[derive(serde::Deserialize, Debug, PartialEq)]
        struct FileResp {
            file_id: String,
        }
        let resp = make_json_response(r#"{"file_id":"abc123"}"#);
        let v: FileResp = resp.json().await.unwrap();
        assert_eq!(v.file_id, "abc123");
    }

    /// P1：[HttpResponse::json_parse] 反序列化为具体类型后通过 parse 做业务校验
    /// 条件：body 为 r#"{"file_id":"ok","status":200}"#，parse 校验 status
    /// 断言：反序列化 + 校验正确通过
    #[tokio::test]
    async fn json_parse_deserializes_and_validates() {
        #[derive(serde::Deserialize, Debug)]
        struct Info {
            file_id: String,
            status: u16,
        }
        let resp = make_json_response(r#"{"file_id":"ok","status":200}"#);
        let info: Info = resp
            .json_parse(|r: Info| {
                if r.status == 200 {
                    Ok(r)
                } else {
                    Err(Error::other(
                        format!("unexpected status {}", r.status).into(),
                    ))
                }
            })
            .await
            .unwrap();
        assert_eq!(info.file_id, "ok");
        assert_eq!(info.status, 200);
    }

    // ── HttpResponse::text ──

    /// P0：[HttpResponse::text] 合法 UTF-8 body 转换为字符串成功
    /// 条件：body 为 "hello world"
    /// 断言：text() 返回 Ok("hello world")
    #[tokio::test]
    async fn text_returns_string_for_valid_utf8() {
        let resp = make_json_response("hello world");
        let text = resp.text().await.unwrap();
        assert_eq!(text, "hello world");
    }

    /// P0：[HttpResponse::text] 非 UTF-8 body 返回 Error::Parse
    /// 条件：body 包含无效 UTF-8 字节序列
    /// 断言：text() 返回 Err(Error::Parse)
    #[tokio::test]
    async fn text_invalid_utf8_returns_parse_error() {
        // 构造包含无效 UTF-8 字节的响应
        let invalid_utf8 = vec![0xFF, 0xFE, 0x00];
        let stream = Box::pin(futures_util::stream::once(async move {
            Ok(Bytes::from(invalid_utf8))
        }));
        let resp = HttpResponse::new(
            "http://test/invalid-utf8",
            200,
            reqwest::header::HeaderMap::new(),
            stream,
        );

        let err = resp.text().await.unwrap_err();
        assert!(matches!(err, Error::Parse { .. }));
    }

    /// P1：[HttpResponse::text] 空 body 返回空字符串
    /// 条件：body 为空
    /// 断言：text() 返回 Ok("")
    #[tokio::test]
    async fn text_empty_body_returns_empty_string() {
        let empty_stream: ByteStream = Box::pin(futures_util::stream::empty());
        let resp = HttpResponse::new(
            "http://test/empty",
            200,
            reqwest::header::HeaderMap::new(),
            empty_stream,
        );
        let text = resp.text().await.unwrap();
        assert_eq!(text, "");
    }

    /// P1：[HttpResponse::text] 多字节 UTF-8 字符正确处理
    /// 条件：body 包含中文和 emoji 字符
    /// 断言：text() 正确返回包含多字节字符的字符串
    #[tokio::test]
    async fn text_handles_multibyte_characters() {
        let text_content = "你好世界 🌍 emoji 🚀";
        let resp = make_json_response(text_content);
        let result = resp.text().await.unwrap();
        assert_eq!(result, text_content);
    }

    /// P2：[HttpResponse::text] 大文本内容正确处理
    /// 条件：body 包含较长的文本内容
    /// 断言：text() 正确返回完整的长文本
    #[tokio::test]
    async fn text_handles_large_content() {
        let large_text = "a".repeat(10000);
        let resp = make_json_response(&large_text);
        let result = resp.text().await.unwrap();
        assert_eq!(result, large_text);
    }

    // ── HttpResponse::bytes_stream ──

    /// P0：[HttpResponse::bytes_stream] 返回 ByteStream
    /// 条件：构造 HttpResponse 后调用 bytes_stream()
    /// 断言：返回的 stream 可正常消费
    #[tokio::test]
    async fn bytes_stream_returns_ok() {
        let resp = make_binary_response("http://test/stream");
        let mut stream = resp.bytes_stream();
        // empty stream，next() 应返回 None
        let item = stream.next().await;
        assert!(item.is_none());
    }

    /// P1：[HttpResponse::bytes_stream] 流式读取多 chunk 数据
    /// 条件：body stream 含两个 chunk
    /// 断言：bytes_stream() 能拿到两个 chunk 的内容
    #[tokio::test]
    async fn bytes_stream_multiple_chunks() {
        let chunk1 = Bytes::from_static(b"hello");
        let chunk2 = Bytes::from_static(b"world");
        let stream = Box::pin(futures_util::stream::iter(
            vec![Ok(chunk1.clone()), Ok(chunk2.clone())]
                .into_iter()
                .map(|r: Result<Bytes>| r),
        ));
        let resp = HttpResponse::new(
            "http://test/chunks",
            200,
            reqwest::header::HeaderMap::new(),
            stream,
        );
        let mut stream = resp.bytes_stream();
        let c1 = stream.next().await.unwrap().unwrap();
        let c2 = stream.next().await.unwrap().unwrap();
        assert_eq!(c1, chunk1);
        assert_eq!(c2, chunk2);
    }

    // ── HttpResponse Debug ──

    /// P1：[HttpResponse::Debug] 输出包含 endpoint 和 status
    /// 条件：构造 HttpResponse
    /// 断言：Debug 格式化字符串包含 endpoint 值和 status 值
    #[test]
    fn debug_output_contains_fields() {
        let resp = make_json_response(r#"{"a":1}"#);
        let debug = format!("{resp:?}");
        assert!(debug.contains("HttpResponse"));
        assert!(debug.contains("endpoint"));
        assert!(debug.contains("status"));
    }

    // ── getters ──

    /// P1：[HttpResponse::endpoint] getter 返回构造时传入的 endpoint
    /// 条件：make_json_response 构造时 endpoint="http://test/json"
    /// 断言：endpoint() == "http://test/json"
    #[test]
    fn endpoint_getter_returns_value() {
        let resp = make_json_response(r#"{}"#);
        assert_eq!(resp.endpoint(), "http://test/json");
    }

    /// P1：[HttpResponse::status] getter 转为 StatusCode
    /// 条件：make_json_response 构造时 status=200
    /// 断言：status() == StatusCode::OK
    #[test]
    fn status_getter_converts_to_status_code() {
        let resp = make_json_response(r#"{}"#);
        assert_eq!(resp.status(), reqwest::StatusCode::OK);
    }

    /// P1：[HttpResponse::headers] getter 返回 headers 引用
    /// 条件：make_json_response 构造时带 Content-Type header
    /// 断言：headers() 含 Content-Type
    #[test]
    fn headers_getter_returns_headers() {
        let resp = make_json_response(r#"{}"#);
        assert!(resp.headers().contains_key(reqwest::header::CONTENT_TYPE));
    }

    /// P1：[HttpResponse::body] getter 返回 body 引用
    /// 条件：make_json_response 构造含 ByteStream 的响应
    /// 断言：body() 可访问（非 panic）
    #[test]
    fn body_getter_returns_body() {
        let resp = make_json_response(r#"{}"#);
        // Box<dyn Stream> is always present, verify pointer is valid
        let _body = resp.body();
    }

    /// P1：[HttpResponse::with_span] 附着 tracing span
    /// 条件：构造空流 HttpResponse + info_span
    /// 断言：with_span() 可调用（非 panic）
    #[test]
    fn with_span_attaches_span() {
        let empty_stream: ByteStream = Box::pin(futures_util::stream::empty());
        let resp = HttpResponse::new(
            "http://test/span",
            200,
            reqwest::header::HeaderMap::new(),
            empty_stream,
        );
        let span = tracing::info_span!("http.request", "test");
        let _resp = resp.with_span(span);
    }

    // ── json_parse: error path ──

    /// P1：[HttpResponse::json_parse] parse 失败时返回 Err
    /// 条件：parse 闭包返回 Err
    /// 断言：json_parse 返回 Err
    #[tokio::test]
    async fn json_parse_error_path_returns_err() {
        let resp = make_json_response(r#"{"ok":true}"#);
        let result: Result<serde_json::Value> = resp
            .json_parse(|_v: serde_json::Value| Err(Error::other("parse failed".into())))
            .await;
        assert!(result.is_err());
    }
}
