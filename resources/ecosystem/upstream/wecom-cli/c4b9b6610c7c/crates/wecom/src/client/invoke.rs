use super::Client;
use crate::{Error, Result};

/// Request builder returned by [`Client::invoke`].
///
/// Implements [`IntoFuture`] so it can be `.await`-ed directly.
/// Use `.headers()` or `.header()` to attach custom HTTP headers
/// before sending.
///
/// # Examples
/// ```rust,no_run
/// # use wecom::Client;
/// # async fn example(client: &Client, payload: serde_json::Value) -> Result<(), Box<dyn std::error::Error>> {
/// // No extra headers — just await
/// let val = client.invoke(&["contact", "users", "get"], payload.clone()).await?;
///
/// // With extra headers
/// let val = client
///     .invoke(&["contact", "users", "get"], payload)
///     .header("x-custom", "value")
///     .await?;
/// # let _ = val;
/// # Ok(())
/// # }
/// ```
pub struct ClientInvokeRequest<'a> {
    client: &'a Client,
    path: Vec<String>,
    payload: serde_json::Value,
    header_error: Option<Error>,
    options: wecom_transport::RequestOptions,
}

wecom_transport::impl_request_builder!(
    ClientInvokeRequest<'a>,
    +options,
    error_type = Error,
    error_wrapper = Error::other,
);

impl<'a> ClientInvokeRequest<'a> {
    /// Execute the client invoke request.
    ///
    /// This is called automatically when you `.await` the [`ClientInvokeRequest`],
    /// but can also be invoked explicitly if needed.
    ///
    /// Delegates to [`execute_output`](Self::execute_output), extracting only
    /// the `result` field.
    pub async fn execute(self) -> Result<serde_json::Value> {
        self.execute_output().await.map(|o| o.result)
    }

    /// Execute the client invoke request, returning the complete
    /// [`wecom_transport::ExecuteOutput`] including side-channel `extra` fields.
    ///
    /// This is the full version of [`execute`](Self::execute); prefer this when
    /// you need access to server-side extra fields (e.g. `display_result`).
    ///
    pub async fn execute_output(self) -> Result<wecom_transport::ExecuteOutput> {
        if let Some(e) = self.header_error {
            return Err(e);
        }

        let path_refs: Vec<&str> = self.path.iter().map(|s| s.as_str()).collect();
        let method = self
            .client
            .method_with_options(&path_refs, &self.options)
            .await?;
        self.client
            .transport()
            .invoke(method.endpoint(), self.payload)
            .with_options(self.options)
            .await
            .map_err(Error::from)?
            .into_json()
            .map_err(Error::from)
    }
}

impl<'a> std::future::IntoFuture for ClientInvokeRequest<'a> {
    type Output = Result<serde_json::Value>;
    type IntoFuture =
        std::pin::Pin<Box<dyn std::future::Future<Output = Self::Output> + Send + 'a>>;

    fn into_future(self) -> Self::IntoFuture {
        Box::pin(self.execute())
    }
}

impl Client {
    /// Look up a method by path and invoke it in one step.
    ///
    /// Returns a [`ClientInvokeRequest`] that can be `.await`-ed directly
    /// or customised with `.headers()` / `.header()` before sending.
    ///
    /// Combines [`method`](Self::method) + transport invoke into a
    /// single convenience call. Directives, pagination, and output-writing
    /// logic are all bypassed — exactly one request is sent and the parsed
    /// [`serde_json::Value`] is returned directly.
    ///
    /// # Example
    /// ```rust,no_run
    /// # use wecom::Client;
    /// # async fn example(client: &Client) -> Result<(), Box<dyn std::error::Error>> {
    /// // Simple call
    /// let data = client
    ///     .invoke(
    ///         &["contact", "users", "get"],
    ///         serde_json::json!({"userid": "alice"}),
    ///     )
    ///     .await?;
    ///
    /// // With custom headers
    /// let data = client
    ///     .invoke(
    ///         &["contact", "users", "get"],
    ///         serde_json::json!({"userid": "alice"}),
    ///     )
    ///     .header("x-custom", "value")
    ///     .await?;
    /// # let _ = data;
    /// # Ok(())
    /// # }
    /// ```
    pub fn invoke(&self, path: &[&str], payload: serde_json::Value) -> ClientInvokeRequest<'_> {
        ClientInvokeRequest {
            client: self,
            path: path.iter().map(|s| s.to_string()).collect(),
            payload,
            header_error: None,
            options: wecom_transport::RequestOptions::default(),
        }
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：Client invoke（编程式 API 调用）
    //!
    //! ### 关键接口
    //! - [Client::invoke] — 通过路径切片 + payload 一步调用并返回 JSON
    //!
    //! ### 关键分支与异常路径
    //! - invoke 路径无效 → 透传 method() 的 Err
    //! - invoke 网络不可达 → 透传 invoke() 的 Err
    //!
    //! ### 上下游交互
    //! - 上游：外部调用方直接使用 Client::invoke 作为入口
    //! - 下游：委托 [Client::method] 解析路径，再委托 Transport::invoke 发送请求

    use super::*;

    // ── helpers ──

    /// Build a sandboxed Client backed by `root` as config_dir.
    fn build_client(root: &std::path::Path) -> Client {
        Client::builder().config_dir(root).build().unwrap()
    }

    // ── Client::invoke ──

    /// P1：[Client::invoke] 路径无效时透传 method() 的错误
    /// 条件：传入空路径 &[]，payload 为空对象
    /// 断言：返回 Err，错误信息包含 "至少需要两段"
    #[tokio::test]
    async fn invoke_with_invalid_path_returns_error() {
        let tmp = tempfile::TempDir::new().unwrap();
        let client = build_client(tmp.path());
        let err = client.invoke(&[], serde_json::json!({})).await.unwrap_err();
        assert!(
            err.to_string().contains("至少需要两段"),
            "unexpected error: {err}"
        );
    }

    /// P0：[Client::invoke] 网络不可达时透传 invoke() 的错误
    /// 条件：缓存中存在 "svc" 服务（base_url 指向 127.0.0.1:1），传入有效路径
    /// 断言：返回 Err（网络错误），错误可格式化为字符串
    #[tokio::test]
    async fn invoke_unreachable_host_returns_error() {
        let tmp = tempfile::TempDir::new().unwrap();
        // Seed a service whose base_url points to an unreachable port.
        let cache_dir = tmp.path().join("cache");
        std::fs::create_dir_all(&cache_dir).unwrap();
        let schema = serde_json::json!({
            "description": "unreachable",
            "base_url": "http://127.0.0.1:1/",
            "methods": {
                "ping": {
                    "http_method": "GET",
                    "path": "/ping"
                }
            },
            "resources": {}
        });
        let file = cache_dir.join(format!(
            "service_{}.json",
            crate::fs::sanitize_filename("unreachable")
        ));
        #[allow(clippy::disallowed_methods)] // Test helper: write fixture outside sandbox
        std::fs::write(file, serde_json::to_string(&schema).unwrap()).unwrap();

        let client = build_client(tmp.path());
        let err = client
            .invoke(&["unreachable", "ping"], serde_json::json!({}))
            .await
            .unwrap_err();
        let msg = err.to_string();
        assert!(!msg.is_empty(), "error message should not be empty");
    }

    // ── ClientInvokeRequest::timeout ──

    /// P0：[ClientInvokeRequest::timeout] timeout() 正确设置 timeout 字段
    /// 条件：创建 ClientInvokeRequest 后调用 .timeout(Duration::from_secs(30))
    /// 断言：timeout 字段为 Some(30s)
    #[test]
    fn invoke_timeout_sets_field() {
        let tmp = tempfile::TempDir::new().unwrap();
        let client = build_client(tmp.path());
        let req = client
            .invoke(&["svc", "method"], serde_json::json!({}))
            .timeout(std::time::Duration::from_secs(30));
        assert_eq!(
            req.options.wire.timeout,
            Some(std::time::Duration::from_secs(30))
        );
    }

    /// P0：[ClientInvokeRequest::timeout] timeout 默认为 None
    /// 条件：创建 ClientInvokeRequest 不调用 timeout()
    /// 断言：timeout 字段为 None
    #[test]
    fn invoke_timeout_default_none() {
        let tmp = tempfile::TempDir::new().unwrap();
        let client = build_client(tmp.path());
        let req = client.invoke(&["svc", "method"], serde_json::json!({}));
        assert!(req.options.wire.timeout.is_none());
    }

    /// P1：[ClientInvokeRequest::timeout] timeout() 和 headers() 可链式调用
    /// 条件：先 timeout(10s) 再 headers(&map)
    /// 断言：timeout 和 headers 均正确设置
    #[test]
    fn invoke_timeout_and_headers_chain() {
        let tmp = tempfile::TempDir::new().unwrap();
        let client = build_client(tmp.path());
        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-chain"),
            reqwest::header::HeaderValue::from_static("val"),
        );
        let req = client
            .invoke(&["svc", "method"], serde_json::json!({}))
            .timeout(std::time::Duration::from_secs(10))
            .headers(&extra);
        assert_eq!(
            req.options.wire.timeout,
            Some(std::time::Duration::from_secs(10))
        );
        assert!(!req.options.wire.headers.is_empty());
    }

    /// P1：[ClientInvokeRequest::execute_output] 非法 header 名称导致立即返回错误
    /// 条件：invoke 后调用 .header("", "value")（空名称非法）
    /// 断言：execute_output() 返回 Err，且错误消息非空
    #[tokio::test]
    async fn execute_output_returns_header_error_immediately() {
        let tmp = tempfile::TempDir::new().unwrap();
        let client = build_client(tmp.path());
        let req = client
            .invoke(&["svc", "method"], serde_json::json!({}))
            .header("", "value");
        let err = req.execute_output().await.unwrap_err();
        assert!(!err.to_string().is_empty());
    }

    // ── ClientInvokeRequest::extension ──

    /// 测试夹具：invoke 扩展袋用例。
    #[derive(Debug, PartialEq)]
    struct InvExt(u32);

    /// P1：[ClientInvokeRequest::extension] 请求级扩展值写入 options
    /// 条件：client.invoke() 后调用 .extension(InvExt(2))
    /// 断言：req.options.extensions.get::<InvExt>() 为 Some(2)
    #[test]
    fn invoke_request_level_extension_written_to_options() {
        let tmp = tempfile::TempDir::new().unwrap();
        let client = build_client(tmp.path());
        let req = client
            .invoke(&["svc", "method"], serde_json::json!({}))
            .extension(InvExt(2));
        assert_eq!(req.options.extensions.get::<InvExt>(), Some(&InvExt(2)));
    }
}
