//! Transport trait definitions — open extension points.
//!
//! This module defines the trait shape for transport backends.
//! The built-in implementation is [`HttpTransportBackend`](crate::HttpTransportBackend);
//! external crates may supply their own.

use std::any::Any;
use std::borrow::Cow;
use std::fmt::Debug;
use std::future::Future;
use std::pin::Pin;

use crate::http_client::HttpRequestPayload;
use crate::{Endpoint, ExecuteOutput, HttpResponse, RequestOptions, Result};

// ── Transport trait ──────────────────────────────────────────

/// Transport backend abstraction.
///
/// Custom transports only need to implement [`execute`](TransportBackend::execute).
///
/// # Object safety
///
/// This trait returns `Pin<Box<dyn Future>>` (instead of RPITIT) so it is
/// **dyn-compatible**. This enables [`crate::Transport`] to hold an
/// `Arc<dyn TransportBackend>` for dynamic dispatch.
pub trait TransportBackend: Debug + Send + Sync + Any {
    /// Execute a request and return a unified [`TransportResponse`].
    ///
    /// Accepts both JSON and multipart form payloads via [`HttpRequestPayload`]
    /// (lazy materialization happens in the sending chain). Implementations
    /// that only support JSON should build the payload and reject non-JSON
    /// by matching [`HttpRequestBody`](crate::HttpRequestBody).
    fn execute<'a>(
        &'a self,
        endpoint: Cow<'a, Endpoint>,
        payload: HttpRequestPayload,
        options: RequestOptions,
    ) -> Pin<Box<dyn Future<Output = Result<TransportResponse>> + Send + 'a>>;

    /// Human-readable label for logging. Default: `"unknown"`.
    fn name(&self) -> &str {
        "unknown"
    }
}

// ── Boxed backend: forwarding impl ───────────────────────────

impl TransportBackend for Box<dyn TransportBackend> {
    fn execute<'a>(
        &'a self,
        endpoint: Cow<'a, Endpoint>,
        payload: HttpRequestPayload,
        options: RequestOptions,
    ) -> Pin<Box<dyn Future<Output = Result<TransportResponse>> + Send + 'a>> {
        (**self).execute(endpoint, payload, options)
    }

    fn name(&self) -> &str {
        (**self).name()
    }
}

// ── TransportResponse ────────────────────────────────────────

/// Unified transport-level response covering both JSON and binary payloads.
///
/// Business code always handles both variants, eliminating the need to match
/// on transport type.
#[derive(Debug)]
pub enum TransportResponse {
    /// JSON business response with extracted `result` and `extra` side-channel fields.
    Json(ExecuteOutput),
    /// Binary response (file download etc.), carrying the raw [`HttpResponse`].
    Binary(HttpResponse),
}

impl TransportResponse {
    /// Extract [`ExecuteOutput`] from a JSON response, or return
    /// [`Error::Parse`](crate::Error::Parse) for a binary response.
    pub fn into_json(self) -> Result<ExecuteOutput> {
        match self {
            Self::Json(output) => Ok(output),
            Self::Binary(resp) => Err(crate::Error::Parse {
                message: "Expected JSON response, got binary".into(),
                endpoint: resp.endpoint().to_string(),
                body: Box::new(serde_json::Value::Null),
                source: None,
            }),
        }
    }

    /// Extract the business `result` field from a JSON response, or return
    /// [`Error::Parse`](crate::Error::Parse) for a binary response.
    pub fn into_result(self) -> Result<serde_json::Value> {
        self.into_json().map(|o| o.result)
    }

    /// Extract the raw [`HttpResponse`] from a binary response, or return
    /// [`Error::Parse`](crate::Error::Parse) for a JSON response.
    pub fn into_binary(self) -> Result<HttpResponse> {
        match self {
            Self::Binary(resp) => Ok(resp),
            Self::Json(_output) => Err(crate::Error::Parse {
                message: "Expected binary response, got JSON".into(),
                endpoint: String::new(),
                body: Box::new(serde_json::Value::Null),
                source: None,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：TransportResponse（统一传输层响应）
    //!
    //! ### 关键接口
    //! - [TransportResponse::into_json] — 提取 Json 输出或对 Binary 报错
    //! - [TransportResponse::into_result] — 提取业务 result 字段
    //! - [TransportResponse::into_binary] — 提取原始响应或对 Json 报错
    //!
    //! ### 关键分支与异常路径
    //! - Binary 响应调 into_json/into_result → Error::Parse
    //! - Json 响应调 into_binary → Error::Parse
    //!
    //! ### 上下游交互
    //! - 上游：TransportBackend::execute 产出 TransportResponse
    //! - 下游：业务层通过 into_result 取业务 JSON

    use std::borrow::Cow;
    use std::future::Future;
    use std::pin::Pin;

    use indexmap::IndexMap;

    use super::*;
    use crate::http_client::{ByteStream, HttpRequestPayload};
    use crate::{Endpoint, ExecuteOutput, RequestOptions};

    fn json_output() -> TransportResponse {
        TransportResponse::Json(ExecuteOutput {
            result: serde_json::json!({"ok": true}),
            extra: IndexMap::new(),
        })
    }

    fn binary_output() -> TransportResponse {
        let body: ByteStream = Box::pin(futures_util::stream::empty());
        let resp = HttpResponse::new(
            "http://x/file",
            200,
            reqwest::header::HeaderMap::new(),
            body,
        );
        TransportResponse::Binary(resp)
    }

    /// 测试夹具：返回固定 Json 响应的可装箱后端。
    #[derive(Debug)]
    struct BoxableBackend;

    impl TransportBackend for BoxableBackend {
        fn execute<'a>(
            &'a self,
            _endpoint: Cow<'a, Endpoint>,
            _payload: HttpRequestPayload,
            _options: RequestOptions,
        ) -> Pin<Box<dyn Future<Output = Result<TransportResponse>> + Send + 'a>> {
            Box::pin(async move {
                Ok(TransportResponse::Json(ExecuteOutput {
                    result: serde_json::json!({"boxed": true}),
                    extra: IndexMap::new(),
                }))
            })
        }

        fn name(&self) -> &str {
            "boxable"
        }
    }

    /// P0：[TransportResponse::into_result] Json 响应提取 result
    /// 条件：Json(ExecuteOutput { result: {"ok":true} })
    /// 断言：返回 {"ok": true}
    #[test]
    fn into_result_extracts_json_result() {
        let out = json_output().into_result().unwrap();
        assert_json_diff::assert_json_eq!(out, serde_json::json!({"ok": true}));
    }

    /// P1：[TransportResponse::into_json] Binary 响应返回 Parse 错误
    /// 条件：Binary 响应
    /// 断言：返回 Err(Error::Parse)
    #[test]
    fn into_json_on_binary_returns_parse_error() {
        let res = binary_output().into_json();
        assert!(matches!(res, Err(crate::Error::Parse { .. })));
    }

    /// P1：[TransportResponse::into_binary] Json 响应返回 Parse 错误
    /// 条件：Json 响应
    /// 断言：返回 Err(Error::Parse)
    #[test]
    fn into_binary_on_json_returns_parse_error() {
        let res = json_output().into_binary();
        assert!(matches!(res, Err(crate::Error::Parse { .. })));
    }

    /// P0：[TransportResponse::into_binary] Binary 响应返回原始 HttpResponse
    /// 条件：Binary 响应
    /// 断言：返回 Ok(HttpResponse)
    #[test]
    fn into_binary_extracts_response() {
        let res = binary_output().into_binary();
        assert!(res.is_ok());
    }

    /// P0：[TransportBackend] `Box<dyn TransportBackend>` 转发 execute 到内部后端
    /// 条件：Box::new(BoxableBackend) 作为 backend 调用 execute(Json payload)
    /// 断言：返回 Ok(Json)，result 为 {"boxed": true}
    #[tokio::test]
    async fn boxed_backend_forwards_execute() {
        let backend: Box<dyn TransportBackend> = Box::new(BoxableBackend);
        let resp = backend
            .execute(
                Cow::Owned(Endpoint::new()),
                HttpRequestPayload::json(serde_json::json!({})),
                RequestOptions::default(),
            )
            .await
            .unwrap();
        let out = resp.into_json().unwrap();
        assert_json_diff::assert_json_eq!(out.result, serde_json::json!({"boxed": true}));
    }

    /// P0：[TransportBackend] `Box<dyn TransportBackend>` 转发 name 到内部后端
    /// 条件：Box::new(BoxableBackend) 调用 name
    /// 断言：返回内部后端的 "boxable"
    #[test]
    fn boxed_backend_forwards_name() {
        let backend: Box<dyn TransportBackend> = Box::new(BoxableBackend);
        assert_eq!(backend.name(), "boxable");
    }
}
