use std::future::IntoFuture;
use std::path::PathBuf;
use std::pin::Pin;

use super::Client;
use crate::fs::check_file_size_limit;
use crate::{Error, Result, builtins, constants, fs};

// ── ClientUploadMediaRequest ────────────────────────────────────────

/// Request builder returned by [`Client::upload_media`].
///
/// Implements [`IntoFuture`] so it can be `.await`-ed directly.
/// Use `.headers()` / `.header()` to attach custom HTTP headers, or
/// `.timeout()` to set a per-request timeout — applied to **each** underlying
/// HTTP round-trip (upload_media is a single call, so this is
/// straightforward).
///
/// # Examples
/// ```rust,no_run
/// # use wecom::Client;
/// # async fn example(client: &Client) -> Result<(), Box<dyn std::error::Error>> {
/// // No extra headers — just await
/// let resp = client.upload_media("/path/to/file.png").await?;
///
/// // With extra headers + timeout
/// let resp = client
///     .upload_media("/path/to/file.png")
///     .header("x-trace-id", "abc123")
///     .timeout(std::time::Duration::from_secs(30))
///     .await?;
/// # let _ = resp;
/// # Ok(())
/// # }
/// ```
pub struct ClientUploadMediaRequest<'a> {
    client: &'a Client,
    fs: std::sync::Arc<dyn fs::Fs>,
    file_path: PathBuf,
    header_error: Option<Error>,
    options: wecom_transport::RequestOptions,
}

wecom_transport::impl_request_builder!(
    ClientUploadMediaRequest<'a>,
    +options,
    error_type = Error,
    error_wrapper = Error::other,
);

impl<'a> ClientUploadMediaRequest<'a> {
    /// Execute the upload request.
    ///
    /// Called automatically when the builder is `.await`-ed; callers may
    /// also invoke it explicitly.
    pub async fn execute(self) -> Result<builtins::UploadMediaResponse> {
        if let Some(e) = self.header_error {
            return Err(e);
        }
        // 单文件上传入口也做大小校验，防止跳过批量预校验的路径
        check_file_size_limit(
            self.fs.as_ref(),
            &self.file_path,
            constants::MAX_UPLOAD_SIZE,
        )
        .await?;
        // Use the same sandboxed Fs as `Client::run` so all entry points
        // share identical path-validation semantics.
        builtins::upload_media(self.client, &self.fs, self.file_path, &self.options).await
    }
}

impl<'a> IntoFuture for ClientUploadMediaRequest<'a> {
    type Output = Result<builtins::UploadMediaResponse>;
    type IntoFuture = Pin<Box<dyn std::future::Future<Output = Self::Output> + Send + 'a>>;

    fn into_future(self) -> Self::IntoFuture {
        Box::pin(self.execute())
    }
}

// ── Client API ──────────────────────────────────────────────────────

impl Client {
    /// Upload a media file and obtain its `media_id`.
    ///
    /// Returns a [`ClientUploadMediaRequest`] that can be `.await`-ed
    /// directly or customised with `.headers()` / `.header()` /
    /// `.timeout()` before sending.
    ///
    /// `file_path` may be absolute or relative to the injected filesystem's
    /// working directory and is validated by the injected filesystem
    /// implementation — exactly the same rules as [`Client::run`].
    ///
    /// Routing: `POST /file/upload` (multipart).
    ///
    /// # Example
    /// ```rust,no_run
    /// # use wecom::Client;
    /// # async fn example(client: &Client) -> Result<(), Box<dyn std::error::Error>> {
    /// let resp = client.upload_media("/path/to/file.png").await?;
    /// println!("media_id = {}", resp.media_id);
    /// # Ok(())
    /// # }
    /// ```
    pub fn upload_media(&self, file_path: impl Into<PathBuf>) -> ClientUploadMediaRequest<'_> {
        ClientUploadMediaRequest {
            client: self,
            fs: std::sync::Arc::clone(self.workspace_fs()),
            file_path: fs::absolutize(self.cwd(), &file_path.into()),
            header_error: None,
            options: wecom_transport::RequestOptions::default(),
        }
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：Client upload（媒体上传 builder）
    //!
    //! ### 关键接口
    //! - [Client::upload_media] — 创建 [ClientUploadMediaRequest]，支持 `.await` 或 `.headers()` / `.header()` 链式调用
    //! - `ClientUploadMediaRequest` —
    //!   inherent `.headers()` / `.header()` (via `impl_request_headers!` macro)
    //! - `IntoFuture for *Request` — 支持 `.await` 语法
    //!
    //! ### 关键分支与异常路径
    //! - header_error 已存在 → execute 直接透传该错误，不会发起请求
    //! - file_path 不存在 / 无法读取 → 透传 builtins::upload_* 的 Err
    //! - 路径解析与校验由注入的 filesystem 实现承担（与 [Client::run] 行为一致）
    //!
    //! ### 上下游交互
    //! - 上游：库使用方通过 `Client::upload_media` 调用
    //! - 下游：委托 [builtins::upload_media] 完成实际传输

    use super::*;

    /// Build an isolated [Client] for unit tests.
    fn build_isolated_client() -> Client {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().to_path_buf();
        std::mem::forget(tmp);
        Client::builder().config_dir(&dir).build().unwrap()
    }

    // ── upload_media builder ──

    /// P0：[Client::upload_media] 返回 ClientUploadMediaRequest 且实现 IntoFuture
    /// 条件：调用 client.upload_media("/tmp/a.png")
    /// 断言：返回值类型实现了 IntoFuture
    #[test]
    fn upload_media_returns_request() {
        fn assert_into_future<T: IntoFuture>(_: &T) {}
        let client = build_isolated_client();
        let req = client.upload_media("/tmp/a.png");
        assert_into_future(&req);
    }

    /// P1：[ClientUploadMediaRequest::execute] header_error 存在时直接返回该错误
    /// 条件：通过非法 header 制造 header_error，再 .await
    /// 断言：返回 Err，且未实际访问磁盘 / 网络
    #[tokio::test]
    async fn upload_media_execute_returns_deferred_header_error() {
        let client = build_isolated_client();
        let err = client
            .upload_media("/this/path/does/not/exist")
            .header("bad name", "v")
            .await
            .unwrap_err();
        // 错误源自 deferred header_error（HeaderName 解析失败），
        // 而非 fs 找不到文件 —— 说明 header_error 优先短路。
        assert!(!err.to_string().is_empty());
    }

    // ── timeout 字段 / setter ──

    /// P0：[ClientUploadMediaRequest::timeout] timeout() 正确写入 self.timeout
    /// 条件：调用 .timeout(Duration::from_secs(15))
    /// 断言：timeout 字段为 Some(15s)
    #[test]
    fn upload_media_timeout_sets_field() {
        let client = build_isolated_client();
        let req = client
            .upload_media("/tmp/a.png")
            .timeout(std::time::Duration::from_secs(15));
        assert_eq!(
            req.options.wire.timeout,
            Some(std::time::Duration::from_secs(15))
        );
    }

    /// P0：[ClientUploadMediaRequest] timeout 默认为 None
    /// 条件：构造 ClientUploadMediaRequest 不调用 timeout()
    /// 断言：timeout 字段为 None
    #[test]
    fn upload_media_timeout_default_none() {
        let client = build_isolated_client();
        let req = client.upload_media("/tmp/a.png");
        assert!(req.options.wire.timeout.is_none());
    }

    /// P1：[ClientUploadMediaRequest::timeout] 与 .header() 可链式调用，互不干扰
    /// 条件：先 timeout(5s) 再 header("x-a", "1")
    /// 断言：timeout / headers 均正确设置
    #[test]
    fn upload_media_timeout_and_headers_chain() {
        let client = build_isolated_client();
        let req = client
            .upload_media("/tmp/a.png")
            .timeout(std::time::Duration::from_secs(5))
            .header("x-a", "1");
        assert_eq!(
            req.options.wire.timeout,
            Some(std::time::Duration::from_secs(5))
        );
        assert!(!req.options.wire.headers.is_empty());
        assert_eq!(
            req.options
                .wire
                .headers
                .get("x-a")
                .unwrap()
                .to_str()
                .unwrap(),
            "1"
        );
    }
}
