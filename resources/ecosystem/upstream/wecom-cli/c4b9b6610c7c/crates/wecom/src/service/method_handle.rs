use std::future::IntoFuture;
use std::sync::Arc;

use super::{
    MethodSchemaInfo, RequestInfo, RunOptions, doc, execute, preview, remote_doc, schema_util,
};
use crate::client::EndpointKey;
use crate::schema::JsonSchema;
use crate::{Client, Error, Result, directive, registry};

/// Handle representing a specific API method.
///
/// Contains all context needed to invoke `run()` without extra parameters.
#[derive(Debug)]
pub struct MethodHandle<'c> {
    pub(crate) client: &'c Client,
    pub(crate) service_schema: Arc<registry::ServiceSchema>,
    pub(crate) method_name: String,
    pub(crate) method_path_segments: Vec<String>,
    pub(crate) schema: registry::MethodSchema,
}

impl MethodHandle<'_> {
    /// Method name (last path segment).
    pub fn name(&self) -> &str {
        &self.method_name
    }

    /// Full method path, e.g. `["contact", "users", "list"]`.
    pub fn path(&self) -> &[String] {
        &self.method_path_segments
    }

    /// HTTP method (GET, POST, etc.).
    pub fn http_method(&self) -> &str {
        &self.schema.http_method
    }

    /// Fully resolved URL for this method, combining the service base URL
    /// (or the client-level override) with the method path.
    pub fn url(&self) -> String {
        format!(
            "{}/{}",
            self.base_url().unwrap_or("").trim_end_matches('/'),
            self.schema.path.trim_start_matches('/')
        )
    }

    /// Effective base URL for this method.
    ///
    /// Falls back: method `base_url` → service `base_url` → `None`.
    pub fn base_url(&self) -> Option<&str> {
        self.schema
            .base_url
            .as_deref()
            .or(self.service_schema.base_url.as_deref())
    }

    /// Derive an [`wecom_transport::Endpoint`] for this method.
    ///
    /// Base capabilities（请求信封）来自 endpoint catalog 的 `ServiceMethod`
    /// 默认；仅 HTTP path（schema 派生）、range_size 与 base_url（schema /
    /// service 覆盖）在此覆写。
    pub fn endpoint(&self) -> wecom_transport::Endpoint {
        let mut ep = self
            .client
            .resolve_builtin_endpoint(EndpointKey::ServiceMethod)
            .map::<wecom_transport::HttpEndpoint>(|h| {
                h.with_path_derived(self.schema.path.as_str())
                    .with_range_size(self.range_size())
            });
        if let Some(url) = self.base_url() {
            ep = ep.map::<wecom_transport::HttpEndpoint>(|h| h.with_base_url(url.to_string()));
        }
        ep
    }

    /// Method description.
    pub fn description(&self) -> Option<&str> {
        self.schema.description.as_deref()
    }

    /// The `id` to use in a remote doc request, or `None` when remote doc is
    /// not in effect for this method (either `remote_doc` resolves to false,
    /// or no `id` is declared — both fall back to local rendering).
    ///
    /// Effective `remote_doc` value: method → parent resources → service
    /// → `false` (nearest `Some` wins), and the method must declare an `id`.
    pub fn remote_doc_id(&self) -> Option<&str> {
        let segs: Vec<&str> = self.method_path_segments[1..]
            .iter()
            .map(String::as_str)
            .collect();
        remote_doc::resolve_remote_doc_id(&self.service_schema, &segs)
    }

    /// Resolve the request JSON Schema for this method (if any).
    pub fn request_schema(&self) -> Option<JsonSchema> {
        schema_util::resolve_schema_ref(&self.service_schema.schemas, &self.schema.request)
    }

    /// Effective Range chunk size, if this method opts into ranged download.
    ///
    /// Returns `Some(size)` only when `range_size` is present and `> 0`;
    /// `None` / `Some(0)` are filtered out (single-shot download).
    pub fn range_size(&self) -> Option<u64> {
        self.schema.range_size.filter(|&s| s > 0)
    }

    /// Execute the API call with full [`RunOptions`].
    ///
    /// Response data is written via the [`CliRunOutput`](crate::CliRunOutput)
    /// obtained from [`options.run`](RunOptions::run).
    pub async fn run(&self, options: RunOptions<'_>) -> Result<()> {
        execute::execute_and_output(self, options).await
    }

    /// Build an invoke request for this API method.
    ///
    /// Returns a [`MethodInvokeRequest`] that can be `.await`-ed directly
    /// or customised with `.headers()` / `.header()` before sending.
    ///
    /// Unlike [`run`](MethodHandle::run), this bypasses all directive, pagination, and
    /// output-writing logic. Exactly one request is sent and the parsed
    /// [`serde_json::Value`] is returned.
    ///
    /// # Examples
    /// ```rust,no_run
    /// # fn example(method: &wecom::MethodHandle<'_>) -> Result<(), Box<dyn std::error::Error>> {
    /// # async fn run(method: &wecom::MethodHandle<'_>) -> Result<(), Box<dyn std::error::Error>> {
    /// // Direct await (no extra headers)
    /// let value = method.invoke(serde_json::json!({"userid": "alice"})).await?;
    /// println!("{}", value["name"]);
    ///
    /// // With custom headers
    /// let value = method
    ///     .invoke(serde_json::json!({"userid": "alice"}))
    ///     .header("x-custom", "value")
    ///     .await?;
    /// # let _ = value;
    /// # Ok(())
    /// # }
    /// # Ok(())
    /// # }
    /// ```
    pub fn invoke(&self, payload: serde_json::Value) -> MethodInvokeRequest<'_> {
        // 构造期就把 endpoint 派生出来并 move 进 TransportRequest，所有 setter
        // 通过 inner 直接操作底层 builder，无需在外层暂存 headers/timeout/on_poll。
        let endpoint = self.endpoint();
        let inner = self.client.transport().invoke(endpoint, payload);
        MethodInvokeRequest { inner }
    }

    /// Generate method documentation (Markdown).
    ///
    /// Returns a [`StyledStr`](clap::builder::StyledStr) that embeds ANSI
    /// styling.  Use `.ansi()` to render with colour or `Display` to
    /// strip escape codes.
    pub fn doc(&self) -> clap::builder::StyledStr {
        doc::gen_method_doc(
            self.client.bin_name(),
            &self.path_refs(),
            &self.service_schema,
            &self.schema,
        )
    }

    /// Generate method JSON Schema.
    pub fn schema(&self) -> MethodSchemaInfo {
        doc::gen_schema_doc(&self.path_refs(), &self.service_schema, &self.schema)
    }

    /// Generate TypeScript declarations for this method.
    pub fn ts_declarations(&self) -> Option<String> {
        doc::gen_method_ts(&self.service_schema, &self.schema)
    }

    /// Preview the requests that would be sent, without actually sending them.
    ///
    /// Returns one [`RequestInfo`] per media upload + one for the main request.
    pub fn preview(&self, payload: &mut serde_json::Value) -> Result<Vec<RequestInfo>> {
        let http_method = self.parse_http_method()?;
        let request_schema = self.request_schema();
        let (directives, multipart) = self.collect_directives(payload, request_schema.as_ref());

        preview::build_request_infos(
            self.client,
            &http_method,
            &self.url(),
            payload,
            &directives,
            multipart,
        )
    }

    // ── Internal helpers ────────────────────────────────────

    pub(crate) fn parse_http_method(&self) -> Result<reqwest::Method> {
        reqwest::Method::from_bytes(self.schema.http_method.as_bytes())
            .map_err(|e| Error::other(format!("Invalid HTTP method: {}", e).into()))
    }

    fn collect_directives<'a>(
        &'a self,
        payload: &serde_json::Value,
        request_schema: Option<&'a JsonSchema>,
    ) -> (Vec<directive::Directive<'a>>, bool) {
        if let Some(schema) = request_schema {
            let directives = directive::collect_directives(
                &self.service_schema.schemas,
                schema,
                payload,
                self.client.cwd(),
            );
            let multipart = directive::check_has_octet_stream(&self.service_schema.schemas, schema);
            (directives, multipart)
        } else {
            (vec![], false)
        }
    }

    fn path_refs(&self) -> Vec<&str> {
        self.method_path_segments
            .iter()
            .map(|s| s.as_str())
            .collect()
    }
}

/// Request builder returned by [`MethodHandle::invoke`].
///
/// Implements [`IntoFuture`] so it can be `.await`-ed directly.
/// Use `.headers()` or `.header()` to attach custom HTTP headers
/// before sending.
///
/// # Examples
/// ```rust,no_run
/// # fn example(method: &wecom::MethodHandle<'_>, payload: serde_json::Value) -> Result<(), Box<dyn std::error::Error>> {
/// # async fn run(method: &wecom::MethodHandle<'_>, payload: serde_json::Value) -> Result<(), Box<dyn std::error::Error>> {
/// // No extra headers — just await
/// let val = method.invoke(payload.clone()).await?;
///
/// // With extra headers
/// let val = method.invoke(payload)
///     .header("x-trace-id", "abc123")
///     .await?;
/// # let _ = val;
/// # Ok(())
/// # }
/// # Ok(())
/// # }
/// ```
pub struct MethodInvokeRequest<'a> {
    /// 直接持有底层 [`wecom_transport::TransportRequest`]——所有 setter
    /// （`headers` / `header` / `header_sensitive` / `timeout` / `on_poll`
    /// 等）转发到 inner，自身不持有 headers/timeout/on_poll 等字段。
    inner: wecom_transport::TransportRequest<'a>,
}

impl<'a> MethodInvokeRequest<'a> {
    /// 附加额外 HTTP headers（透传给底层 [`wecom_transport::TransportRequest`]）。
    #[must_use]
    pub fn headers(mut self, headers: &reqwest::header::HeaderMap) -> Self {
        self.inner = self.inner.headers(headers);
        self
    }

    /// 追加单个 HTTP header（透传）。
    ///
    /// 错误延迟到 `.await`：非法 header name/value 会被存入底层 builder。
    #[must_use]
    pub fn header<N, V>(self, name: N, value: V) -> Self
    where
        N: wecom_transport::IntoHeaderName,
        V: wecom_transport::IntoHeaderValue,
    {
        self.header_sensitive(name, value, false)
    }

    /// 追加单个 HTTP header，可选标记为 sensitive（透传）。
    #[must_use]
    pub fn header_sensitive<N, V>(mut self, name: N, value: V, sensitive: bool) -> Self
    where
        N: wecom_transport::IntoHeaderName,
        V: wecom_transport::IntoHeaderValue,
    {
        self.inner = self.inner.header_sensitive(name, value, sensitive);
        self
    }

    /// 设置请求级 timeout（透传）。
    #[must_use]
    pub fn timeout(mut self, timeout: std::time::Duration) -> Self {
        self.inner = self.inner.timeout(timeout);
        self
    }

    /// 插入一个调用方自定义配置值到扩展袋（透传）。
    ///
    /// 语义与 [`wecom_transport::TransportRequest::extension`] 完全一致：
    /// 按 TypeId 键控，同型后写覆盖先写。
    #[must_use]
    pub fn extension<T>(mut self, value: T) -> Self
    where
        T: std::any::Any + std::fmt::Debug + Send + Sync + 'static,
    {
        self.inner = self.inner.extension(value);
        self
    }

    /// 批量合并外部扩展袋（透传，传入方逐 TypeId 覆盖）。
    #[must_use]
    pub fn extensions(mut self, ext: &wecom_transport::Extensions) -> Self {
        self.inner = self.inner.extensions(ext);
        self
    }

    /// 借用当前扩展袋（透传）。
    pub fn get_extensions(&self) -> &wecom_transport::Extensions {
        self.inner.get_extensions()
    }

    /// 注册长任务轮询期间的"轮回调"（透传）。
    ///
    /// 语义与 [`wecom_transport::TransportRequest::on_poll`] 完全一致：
    /// 仅在长任务轮询期间，每完成一轮 fetch 触发一次（`result` 缺失也触发）；
    /// 终态那一轮不触发。可作"接口仍在运行"的心跳信号。
    #[must_use]
    pub fn on_poll<F>(mut self, f: F) -> Self
    where
        F: Fn(&wecom_transport::PollEvent<'_>) + Send + Sync + 'static,
    {
        self.inner = self.inner.on_poll(f);
        self
    }

    /// Execute the method invoke request.
    ///
    /// This is called automatically when you `.await` the [`MethodInvokeRequest`],
    /// but can also be invoked explicitly if needed.
    pub async fn execute(self) -> Result<serde_json::Value> {
        self.execute_output().await.map(|o| o.result)
    }

    /// Execute the method invoke request, returning the complete
    /// [`wecom_transport::ExecuteOutput`] including side-channel `extra` fields.
    ///
    /// This is the full version of [`execute`](Self::execute); prefer this when
    /// you need access to server-side extra fields (e.g. `display_result`).
    pub async fn execute_output(self) -> Result<wecom_transport::ExecuteOutput> {
        self.inner
            .execute()
            .await
            .map_err(Error::from)?
            .into_json()
            .map_err(Error::from)
    }
}

impl<'a> IntoFuture for MethodInvokeRequest<'a> {
    type Output = Result<serde_json::Value>;
    type IntoFuture =
        std::pin::Pin<Box<dyn std::future::Future<Output = Self::Output> + Send + 'a>>;

    fn into_future(self) -> Self::IntoFuture {
        Box::pin(self.execute())
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：MethodHandle（API 方法句柄）
    //!
    //! ### 关键接口
    //! - [name] — 返回方法名（路径最后一段）
    //! - [path] — 返回完整方法路径段
    //! - [http_method] — 返回 HTTP 方法字符串
    //! - [description] — 返回方法描述（Option）
    //! - [url] — 拼接 base_url 和方法 path 得到完整 URL
    //! - [parse_http_method] — 解析 HTTP 方法为 reqwest::Method
    //! - [request_schema] — 解析请求 JSON Schema
    //! - [collect_directives] — 收集指令列表和 multipart 标记
    //! - [invoke] — 返回 MethodInvokeRequest 构建器，支持自定义 headers，跳过 directives/pagination
    //! - [MethodInvokeRequest] — 请求构建器，是 [`wecom_transport::TransportRequest`]
    //!   的零成本 newtype，所有 setter（`headers` / `header` / `header_sensitive` /
    //!   `timeout` / `on_poll`）一行透传到 inner；保留 newtype 仅为 (1) 名字承载
    //!   语义、(2) 把错误类型对齐到 [`crate::Error`]
    //!
    //! ### 关键分支与异常路径
    //! - base_url 尾部斜杠 + path 前导斜杠 → 自动去重避免双斜杠
    //! - schema 中 request 为 None → request_schema() 返回 None
    //! - parse_http_method 遇非法方法名 → 返回 Err
    //! - collect_directives 无 request_schema → 返回空 directives
    //! - invoke 返回 MethodInvokeRequest，直接 .await 或附加 headers 后 .await
    //! - invoke header_error / 网络 / 解析错误 → 透传 Error（具体行为由
    //!   [`wecom_transport::TransportRequest`] 单测 + e2e 用例覆盖）
    //!
    //! ### 上下游交互
    //! - 上游：[handler::handle_service_cmd] 构造 MethodHandle 并调用其方法
    //! - 下游：依赖 [registry::ServiceSchema]/[MethodSchema]、[directive] 模块

    use wecom_transport::EndpointHttpExt;

    use super::*;
    use crate::registry;

    /// Build an isolated [Client] for unit tests.
    fn build_isolated_client() -> Client {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().to_path_buf();
        std::mem::forget(tmp);
        Client::builder().config_dir(&dir).build().unwrap()
    }

    static TEST_CLIENT: std::sync::LazyLock<Client> =
        std::sync::LazyLock::new(build_isolated_client);

    fn make_test_method_handle(
        base_url: &str,
        method_path: Vec<String>,
        schema_path: &str,
        http_method_str: &str,
    ) -> MethodHandle<'static> {
        let service_schema = Arc::new(registry::ServiceSchema {
            description: None,
            skills: vec![],
            base_url: Some(base_url.to_string()),
            schemas: indexmap::IndexMap::new(),
            id: None,
            remote_doc: None,
            resource_tree: registry::ServiceResource {
                methods: indexmap::IndexMap::new(),
                resources: indexmap::IndexMap::new(),
                ..Default::default()
            },
        });

        let method_schema = registry::MethodSchema {
            description: None,
            http_method: http_method_str.to_string(),
            path: schema_path.to_string(),
            path_alias: None,
            request: None,
            response: None,
            ..Default::default()
        };

        MethodHandle {
            client: &TEST_CLIENT,
            service_schema,
            method_name: method_path.last().cloned().unwrap_or_default(),
            method_path_segments: method_path,
            schema: method_schema,
        }
    }

    /// 测试夹具：扩展袋值。
    #[derive(Debug, PartialEq)]
    struct InvokeExt(u32);

    /// P1：[MethodHandle::invoke] transport 默认扩展袋种子化，extension/extensions 转发生效
    /// 条件：transport 构建期 extension(InvokeExt(3))；handle.invoke(json!({}))
    /// 断言：get_extensions() 含 InvokeExt(3)；.extension(InvokeExt(4)) 后覆盖为 4；
    ///       .extensions(&外部袋 InvokeExt(5)) 后覆盖为 5
    #[test]
    fn invoke_seeds_transport_extensions() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().to_path_buf();
        std::mem::forget(tmp);
        let transport: wecom_transport::Transport =
            wecom_transport::HttpTransportBackend::default().into();
        let client = Client::builder()
            .config_dir(&dir)
            .transport(transport.with_extension(InvokeExt(3)))
            .build()
            .unwrap();
        let base = make_test_method_handle(
            "https://api.test",
            vec!["svc".to_string(), "list".to_string()],
            "/list",
            "GET",
        );
        let handle = MethodHandle {
            client: &client,
            service_schema: base.service_schema.clone(),
            method_name: base.method_name.clone(),
            method_path_segments: base.method_path_segments.clone(),
            schema: base.schema.clone(),
        };
        let req = handle.invoke(serde_json::json!({}));
        assert_eq!(req.get_extensions().get::<InvokeExt>(), Some(&InvokeExt(3)));
        let req = req.extension(InvokeExt(4));
        assert_eq!(req.get_extensions().get::<InvokeExt>(), Some(&InvokeExt(4)));
        let mut ext = wecom_transport::Extensions::new();
        ext.insert(InvokeExt(5));
        let req = req.extensions(&ext);
        assert_eq!(req.get_extensions().get::<InvokeExt>(), Some(&InvokeExt(5)));
    }

    /// P0：MethodHandle::name 返回方法路径的最后一段
    /// 条件：方法路径为 ["contact", "users", "list"]
    /// 断言：name() 返回 "list"
    #[test]
    fn method_name_returns_last_segment() {
        let h = make_test_method_handle(
            "https://api.test",
            vec![
                "contact".to_string(),
                "users".to_string(),
                "list".to_string(),
            ],
            "/users/list",
            "GET",
        );
        assert_eq!(h.name(), "list");
    }

    /// P0：MethodHandle::path 返回完整方法路径段
    /// 条件：方法路径为 ["a", "b"]
    /// 断言：path() 长度为 2，各段正确
    #[test]
    fn method_path_returns_all_segments() {
        let h = make_test_method_handle(
            "https://api.test",
            vec!["a".to_string(), "b".to_string()],
            "/b",
            "POST",
        );
        assert_eq!(h.path().len(), 2);
        assert_eq!(h.path()[0], "a");
        assert_eq!(h.path()[1], "b");
    }

    /// P0：MethodHandle::http_method 返回 schema 中的 HTTP 方法
    /// 条件：schema 中 http_method 为 "PATCH"
    /// 断言：返回 "PATCH"
    #[test]
    fn http_method_returns_from_schema() {
        let h = make_test_method_handle(
            "https://api.test",
            vec!["svc".to_string(), "m".to_string()],
            "/m",
            "PATCH",
        );
        assert_eq!(h.http_method(), "PATCH");
    }

    /// P1：MethodHandle::description 在未设置描述时返回 None
    /// 条件：schema 中 description 为 None
    /// 断言：description() 返回 None
    #[test]
    fn description_returns_option_none_when_unset() {
        let h = make_test_method_handle(
            "https://api.test",
            vec!["s".to_string(), "m".to_string()],
            "/m",
            "GET",
        );
        assert_eq!(h.description(), None);
    }

    /// P1：MethodHandle::description 在设置描述时返回 Some
    /// 条件：schema 中 description 为 "List all users"
    /// 断言：description() 返回 Some("List all users")
    #[test]
    fn description_returns_some_when_set() {
        let service_schema = Arc::new(registry::ServiceSchema {
            description: None,
            skills: vec![],
            base_url: Some("https://api.test".to_string()),
            schemas: indexmap::IndexMap::new(),
            id: None,
            remote_doc: None,
            resource_tree: registry::ServiceResource {
                methods: indexmap::IndexMap::new(),
                resources: indexmap::IndexMap::new(),
                ..Default::default()
            },
        });
        let method_schema = registry::MethodSchema {
            description: Some("List all users".to_string()),
            http_method: "GET".to_string(),
            path: "/users".to_string(),
            path_alias: None,
            request: None,
            response: None,
            ..Default::default()
        };
        let h = MethodHandle {
            client: &TEST_CLIENT,
            service_schema,
            method_name: "list".to_string(),
            method_path_segments: vec!["svc".to_string(), "list".to_string()],
            schema: method_schema,
        };
        assert_eq!(h.description(), Some("List all users"));
    }

    /// P0：MethodHandle::remote_doc_id 在 method 声明 remote_doc=true 且带 id 时返回 id
    /// 条件：service schema 中 department.list 声明 remote_doc=true 且带 id
    /// 断言：remote_doc_id() 返回 Some("m-list")
    #[test]
    fn remote_doc_true_when_method_declares() {
        let service_schema: registry::ServiceSchema = serde_json::from_str(
            r#"{
                "base_url": "https://api.test",
                "resources": {
                    "department": {
                        "methods": {
                            "list": {
                                "id": "m-list",
                                "path": "/list",
                                "http_method": "GET",
                                "remote_doc": true
                            }
                        }
                    }
                }
            }"#,
        )
        .unwrap();
        let method_schema =
            service_schema.resource_tree.resources["department"].methods["list"].clone();
        let h = MethodHandle {
            client: &TEST_CLIENT,
            service_schema: Arc::new(service_schema),
            method_name: "list".to_string(),
            method_path_segments: vec![
                "hr".to_string(),
                "department".to_string(),
                "list".to_string(),
            ],
            schema: method_schema,
        };
        assert_eq!(h.remote_doc_id(), Some("m-list"));
    }

    /// P1：MethodHandle::remote_doc_id 在 remote_doc=true 但 method 缺 id 时返回 None
    /// 条件：service schema 中 department.list 声明 remote_doc=true 但无 id
    /// 断言：remote_doc_id() 返回 None（缺 id 视为未配置，回退本地渲染）
    #[test]
    fn remote_doc_false_when_id_missing() {
        let service_schema: registry::ServiceSchema = serde_json::from_str(
            r#"{
                "base_url": "https://api.test",
                "resources": {
                    "department": {
                        "methods": {
                            "list": {
                                "path": "/list",
                                "http_method": "GET",
                                "remote_doc": true
                            }
                        }
                    }
                }
            }"#,
        )
        .unwrap();
        let method_schema =
            service_schema.resource_tree.resources["department"].methods["list"].clone();
        let h = MethodHandle {
            client: &TEST_CLIENT,
            service_schema: Arc::new(service_schema),
            method_name: "list".to_string(),
            method_path_segments: vec![
                "hr".to_string(),
                "department".to_string(),
                "list".to_string(),
            ],
            schema: method_schema,
        };
        assert_eq!(h.remote_doc_id(), None);
    }

    /// P1：MethodHandle::remote_doc_id 在各层均未声明时返回 None
    /// 条件：夹具 schema 不含任何 remote_doc 声明
    /// 断言：remote_doc_id() 返回 None
    #[test]
    fn remote_doc_false_when_unset() {
        let h = make_test_method_handle(
            "https://api.test",
            vec!["svc".to_string(), "list".to_string()],
            "/list",
            "GET",
        );
        assert_eq!(h.remote_doc_id(), None);
    }

    /// P0：MethodHandle::url 正确拼接基础 URL 和路径
    /// 条件：base_url 为 "https://api.example.com"，路径为 "/api/v1/resource"
    /// 断言：URL 以 base_url 开头，以路径结尾
    #[test]
    fn url_combines_base_and_path_trimmed() {
        let h = make_test_method_handle(
            "https://api.example.com",
            vec!["s".to_string(), "m".to_string()],
            "/api/v1/resource",
            "GET",
        );
        let url = h.url();
        assert!(
            url.starts_with("https://api.example.com"),
            "url should start with base, got: {url}"
        );
        assert!(
            url.ends_with("api/v1/resource"),
            "url should contain trimmed path, got: {url}"
        );
    }

    /// P1：MethodHandle::url 处理 base_url 尾部斜杠
    /// 条件：base_url 为 "https://api.example.com/"（带尾部斜杠）
    /// 断言：URL 中不出现双斜杠
    #[test]
    fn url_handles_trailing_slash_in_base_url() {
        let h = make_test_method_handle(
            "https://api.example.com/",
            vec!["s".to_string()],
            "/v1/test",
            "GET",
        );
        let url = h.url();
        // 不应出现双斜杠
        assert_eq!(url, "https://api.example.com/v1/test");
    }

    /// P1：MethodHandle::url 处理路径无前导斜杠
    /// 条件：schema 路径为 "v1/test"（无 / 前缀）
    /// 断言：URL 正确拼接，结果与有前导斜杠时一致
    #[test]
    fn url_handles_no_leading_slash_in_path() {
        let h = make_test_method_handle(
            "https://api.example.com",
            vec!["s".to_string()],
            "v1/test",
            "GET",
        );
        let url = h.url();
        assert_eq!(url, "https://api.example.com/v1/test");
    }

    /// P0：[MethodHandle::parse_http_method] 对合法 HTTP 方法返回 Ok
    /// 条件：schema http_method 分别为 "GET"、"POST"、"PATCH"、"DELETE"
    /// 断言：全部返回 Ok
    #[test]
    fn parse_http_method_valid_methods() {
        for method in &["GET", "POST", "PATCH", "DELETE"] {
            let h =
                make_test_method_handle("https://api.test", vec!["s".to_string()], "/s", method);
            assert!(h.parse_http_method().is_ok(), "expected Ok for {method}");
        }
    }

    /// P1：parse_http_method 对非法 HTTP 方法返回错误
    /// 条件：schema http_method 为 "NOT VALID"
    /// 断言：返回 Err
    #[test]
    fn parse_http_method_invalid_returns_error() {
        let h =
            make_test_method_handle("https://api.test", vec!["s".to_string()], "/s", "NOT VALID");
        assert!(h.parse_http_method().is_err());
    }

    /// P1：request_schema 在无请求 schema 时返回 None
    /// 条件：method schema 中 request 字段为 None
    /// 断言：request_schema() 返回 None
    #[test]
    fn request_schema_none_for_no_request_field() {
        // request is None → resolve returns None
        let h = make_test_method_handle("https://api.test", vec!["s".to_string()], "/s", "GET");
        assert!(h.request_schema().is_none());
    }

    /// P1：collect_directives 在无请求 schema 时返回空集合
    /// 条件：request_schema 为 None，payload 有数据
    /// 断言：directives 为空且 multipart 为 false
    #[test]
    fn collect_directives_with_no_request_schema_is_empty() {
        let h = make_test_method_handle("https://api.test", vec!["s".to_string()], "/s", "GET");
        let payload = serde_json::json!({"key": "value"});
        let (dirs, mp) = h.collect_directives(&payload, None);
        assert!(dirs.is_empty());
        assert!(!mp); // multipart should be false
    }

    /// P1：[MethodHandle::range_size] 缺省时返回 None
    /// 条件：method schema 未设置 range_size
    /// 断言：range_size() 返回 None
    #[test]
    fn range_size_none_when_absent() {
        let h = make_test_method_handle("https://api.test", vec!["s".to_string()], "/s", "GET");
        assert!(h.range_size().is_none());
    }

    /// P0：[MethodHandle::range_size] 声明正整数时返回 Some
    /// 条件：method schema 设置 range_size = 4194304
    /// 断言：range_size() 返回 Some(4194304)
    #[test]
    fn range_size_some_when_declared() {
        let mut h = make_test_method_handle("https://api.test", vec!["s".to_string()], "/s", "GET");
        h.schema.range_size = Some(4194304);
        assert_eq!(h.range_size(), Some(4194304));
    }

    /// P1：[MethodHandle::range_size] 声明 0 时过滤为 None
    /// 条件：method schema 设置 range_size = 0
    /// 断言：range_size() 返回 None（filter > 0 过滤掉 0）
    #[test]
    fn range_size_filtered_when_zero() {
        let mut h = make_test_method_handle("https://api.test", vec!["s".to_string()], "/s", "GET");
        h.schema.range_size = Some(0);
        assert!(h.range_size().is_none());
    }

    // ── invoke / MethodInvokeRequest ──

    /// P0：[MethodHandle::invoke] 返回 MethodInvokeRequest，直接 .await 可发送请求
    /// 条件：base_url 指向本地不存在的端口，传入空 payload
    /// 断言：返回 Err，且错误可正常转换为字符串
    #[tokio::test]
    async fn invoke_unreachable_host_returns_error() {
        let h = make_test_method_handle(
            "http://127.0.0.1:1", // 必然拒绝连接
            vec!["svc".to_string(), "list".to_string()],
            "/list",
            "POST",
        );
        let err = h.invoke(serde_json::json!({})).await.unwrap_err();
        // 只要能拿到错误且可以格式化即可；具体消息依赖 OS
        let msg = err.to_string();
        assert!(!msg.is_empty(), "error message should not be empty");
    }

    /// P0：[MethodInvokeRequest] 所有 setter 链式调用不 panic（冒烟）
    ///
    /// `MethodInvokeRequest` 是 `TransportRequest` 的零成本 newtype——
    /// 所有 setter 一行透传到底层。语义正确性由 [`wecom_transport::TransportRequest`]
    /// 单测 + e2e 用例覆盖；这里只验证调用面齐全、链式签名兼容。
    /// 条件：构造 method handle，同时链式调用 headers/header/header_sensitive/timeout/on_poll
    /// 断言：不 panic（构造期不发请求）
    #[test]
    fn invoke_request_setters_chain_compiles_and_does_not_panic() {
        let h = make_test_method_handle(
            "https://api.test",
            vec!["svc".to_string(), "m".to_string()],
            "/m",
            "POST",
        );
        let mut extra = reqwest::header::HeaderMap::new();
        extra.insert(
            reqwest::header::HeaderName::from_static("x-batch"),
            reqwest::header::HeaderValue::from_static("v"),
        );
        // 同时调用全部 setter，确保签名都还在。返回值 _req 仅持有，构造期不发请求。
        let _req = h
            .invoke(serde_json::json!({"k": "v"}))
            .headers(&extra)
            .header("x-single", "1")
            .header_sensitive("authorization", "Bearer t", true)
            .timeout(std::time::Duration::from_secs(5))
            .on_poll(|_ev: &wecom_transport::PollEvent<'_>| {});
    }

    /// P1：[MethodInvokeRequest] 非法 header 在 `.await` 时短路返回 Err（不真正发起请求）
    ///
    /// 验证 `header_error` 透传链路：透传到底层 builder → execute() 的
    /// `?` 算子触发 `From<wecom_transport::Error> for wecom::Error`。
    /// 条件：invoke 后调用 .header("", "value")（空名称非法）
    /// 断言：`.await` 返回 Err，且错误消息非空
    #[tokio::test]
    async fn invoke_request_invalid_header_short_circuits_on_await() {
        let h = make_test_method_handle(
            "https://api.test",
            vec!["svc".to_string(), "m".to_string()],
            "/m",
            "POST",
        );
        // 空 name 必然触发 deferred header_error
        let err = h
            .invoke(serde_json::json!({}))
            .header("", "value")
            .await
            .unwrap_err();
        assert!(!err.to_string().is_empty());
    }

    // ── MethodHandle::endpoint ──

    /// P0：[MethodHandle::endpoint] 填充 HTTP（base_url + path）字段
    /// 条件：service base_url=https://api.test，method path=/users/list，method_path=["svc","users","list"]
    /// 断言：endpoint.base_url == "https://api.test"，endpoint.path == "/users/list"
    #[test]
    fn endpoint_fills_http_fields() {
        let h = make_test_method_handle(
            "https://api.test",
            vec!["svc".to_string(), "users".to_string(), "list".to_string()],
            "/users/list",
            "GET",
        );
        let ep = h.endpoint();
        assert_eq!(ep.base_url(), "https://api.test");
        assert_eq!(ep.path(), "/users/list");
    }
}
