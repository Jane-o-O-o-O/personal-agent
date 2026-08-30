//! Shared helpers for the reqwest-based request path.
//!
//! These small helpers centralize request finalization and error mapping
//! reused by the HTTP backend. Keeping a single source of truth here
//! ensures the `Error::Other` / `Error::Network` / `Error::Http` wire
//! messages stay identical across call sites.

use std::time::Duration;

use crate::Error;

/// Apply an optional per-request timeout and build the [`reqwest::Request`].
///
/// Build failures are mapped to [`Error::other`] with a stable message so
/// both backends report the same text.
pub(crate) fn finalize_request(
    builder: reqwest::RequestBuilder,
    timeout: Option<Duration>,
) -> crate::Result<reqwest::Request> {
    let builder = match timeout {
        Some(t) => builder.timeout(t),
        None => builder,
    };
    builder
        .build()
        .map_err(|e| Error::other(format!("Failed to build request: {e}").into()))
        .inspect_err(|e| tracing::error!(error = %e, "build request failed"))
}

/// Map a `reqwest` execute/transport failure to [`Error::Network`].
///
/// `Error::Network` is treated as a retryable signal by the long-task
/// polling loop, so callers map send failures through this helper.
pub(crate) fn network_error(endpoint: String, source: reqwest::Error) -> Error {
    let e = Error::Network {
        message: format!("Request failed: {source:#}"),
        endpoint,
        source,
    };
    tracing::error!(error = %e, "network request failed");
    e
}

/// Build an [`Error::Http`] for a non-2xx response status.
pub(crate) fn http_status_error(endpoint: String, status: reqwest::StatusCode) -> Error {
    let e = Error::Http {
        message: format!("HTTP request failed with status: {status}"),
        endpoint,
        status: status.as_u16(),
    };
    tracing::error!(error = %e, "HTTP status error");
    e
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：shared（HTTP 后端共享工具函数）
    //!
    //! ### 关键接口
    //! - [finalize_request] — 应用超时并构建 reqwest::Request
    //! - [network_error] — 将 reqwest 错误映射为 Error::Network
    //! - [http_status_error] — 为非 2xx 状态码构造 Error::Http
    //!
    //! ### 关键分支与异常路径
    //! - finalize_request：有/无超时；build 失败返回 Error::Other
    //! - network_error：错误消息包含请求失败文本和 endpoint
    //! - http_status_error：错误消息包含 HTTP 状态码

    use std::time::Duration;

    use reqwest::StatusCode;

    use super::*;

    // ── finalize_request ──

    /// P1：[finalize_request] 无超时时正常构建请求
    /// 条件：合法的 GET 请求，无超时
    /// 断言：返回 Ok(Request)
    #[test]
    fn finalize_request_without_timeout_builds_ok() {
        let client = reqwest::Client::new();
        let builder = client.get("http://localhost:0/health");
        let result = finalize_request(builder, None);
        assert!(result.is_ok());
    }

    /// P1：[finalize_request] 有超时时正常构建请求
    /// 条件：合法的 GET 请求，超时 30s
    /// 断言：返回 Ok(Request)
    #[test]
    fn finalize_request_with_timeout_builds_ok() {
        let client = reqwest::Client::new();
        let builder = client.get("http://localhost:0/health");
        let result = finalize_request(builder, Some(Duration::from_secs(30)));
        assert!(result.is_ok());
    }

    /// P1：[finalize_request] build 失败映射为 Error::other
    /// 条件：非法 header value（含换行符）导致 build 失败
    /// 断言：返回 Err(Error::other)，code == E_OTHER，且消息含 "Failed to build request"
    #[test]
    fn finalize_request_build_failure_maps_to_other() {
        let client = reqwest::Client::new();
        let builder = client
            .get("http://localhost:0/health")
            .header("x-bad", "bad\nvalue");
        let result = finalize_request(builder, None);
        match result {
            Err(e) => {
                assert_eq!(e.code(), crate::E_OTHER);
                assert!(e.message().contains("Failed to build request"));
            }
            ok => panic!("expected Error::other, got {ok:?}"),
        }
    }

    // ── network_error ──

    /// P1：[network_error] 生成包含 endpoint 和错误消息的 Error::Network
    /// 条件：endpoint="http://e/api"，source 为 reqwest 超时错误
    /// 断言：matches Error::Network，endpoint 和 message 正确
    #[tokio::test]
    async fn network_error_includes_endpoint_and_message() {
        let src = reqwest::Client::new()
            .get("http://0.0.0.0:1")
            .timeout(Duration::from_millis(1))
            .send()
            .await
            .unwrap_err();
        let err = network_error("http://e/api".into(), src);
        assert!(matches!(err, Error::Network { .. }));
        if let Error::Network {
            message, endpoint, ..
        } = &err
        {
            assert!(message.contains("Request failed"));
            assert_eq!(endpoint, "http://e/api");
        }
    }

    // ── http_status_error ──

    /// P1：[http_status_error] 生成包含状态码和 endpoint 的 Error::Http
    /// 条件：endpoint="http://e/api"，status=503
    /// 断言：matches Error::Http，status=503，message 含 503
    #[test]
    fn http_status_error_includes_status_and_endpoint() {
        let err = http_status_error("http://e/api".into(), StatusCode::SERVICE_UNAVAILABLE);
        assert!(matches!(err, Error::Http { .. }));
        if let Error::Http {
            message,
            endpoint,
            status,
        } = &err
        {
            assert!(message.contains("503"));
            assert_eq!(endpoint, "http://e/api");
            assert_eq!(*status, 503u16);
        }
    }
}
