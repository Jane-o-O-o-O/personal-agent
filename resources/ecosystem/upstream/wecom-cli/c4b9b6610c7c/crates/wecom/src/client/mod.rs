mod builder;
mod catalog;
mod custom_command;
mod invoke;
mod run;
mod upload;

use std::path::{Path, PathBuf};
use std::sync::Arc;

pub use builder::{ClientBuilder, default_private_fs, default_workspace_fs};
pub use catalog::{EndpointCatalog, EndpointKey, PayloadStringReq};
pub use custom_command::CustomCommand;
pub use invoke::ClientInvokeRequest;
pub use run::{CliRun, CliRunOutput, Writer};
pub use upload::ClientUploadMediaRequest;
use wecom_transport::RequestOptions;

use crate::helpers::HelperRegistry;
use crate::{Error, Result, fs, registry, service};

/// The main entry point for the wecom library.
///
/// `Client` owns all runtime state: HTTP client, caches, paths, filesystem
/// capability, and configuration. Create one via [`Client::builder()`].
pub struct Client {
    // -- filesystem capabilities --
    /// CLI 私有状态域（config / token / discovery 缓存）。
    private_fs: Arc<dyn fs::Fs>,
    /// 用户工作区与产物目录域。
    workspace_fs: Arc<dyn fs::Fs>,

    // -- paths --
    cwd: PathBuf,
    config_dir: PathBuf,
    default_output_dir: Option<PathBuf>,

    // -- cli name --
    /// 二进制名（命令名），用于 `--version` / `--help` / `--doc` 输出。
    bin_name: String,

    // -- networking --
    transport: wecom_transport::Transport,

    // -- endpoint catalog --
    /// 内置（非 schema 驱动）endpoint 的集中配置目录。
    endpoints: Arc<EndpointCatalog>,

    // -- runtime (internal) --
    service_cache: tokio::sync::Mutex<registry::ServiceCache>,
    helper_registry: HelperRegistry,

    // -- custom commands --
    custom_commands: Vec<CustomCommand>,
}

// -- Client impl --

impl Client {
    // -- constructors --

    /// Create a [`ClientBuilder`] starting from defaults.
    ///
    /// This is the preferred way to construct a [`Client`] when you need
    /// fine-grained control over configuration.
    #[must_use]
    pub fn builder() -> ClientBuilder {
        ClientBuilder::default()
    }

    // -- filesystem --

    /// Filesystem capability for the CLI's own private state (config, token,
    /// discovery cache).
    ///
    /// Never pass request payloads, response bodies or any other
    /// externally-derived path into this instance — use
    /// [`workspace_fs`](Self::workspace_fs) for those.
    pub fn private_fs(&self) -> &Arc<dyn fs::Fs> {
        &self.private_fs
    }

    /// Filesystem capability for the user workspace and artifact directory —
    /// the only instance that may receive externally-derived paths.
    pub fn workspace_fs(&self) -> &Arc<dyn fs::Fs> {
        &self.workspace_fs
    }

    /// Working directory that anchors relative externally-derived paths
    /// (CLI arguments, model payloads, helper parameters).
    ///
    /// Pinned once at construction (default: the process working
    /// directory); every `fs::absolutize` at a construction boundary
    /// resolves against this fixed base (or a per-run
    /// [`CliRun::cwd`](crate::CliRun::cwd) override), so the anchor cannot
    /// drift mid-run.
    pub fn cwd(&self) -> &Path {
        &self.cwd
    }

    /// Root configuration directory (default `~/.config/wecom`).
    pub fn config_dir(&self) -> &Path {
        &self.config_dir
    }

    /// Directory used for on-disk caches (`<config_dir>/cache`).
    ///
    /// Derived from [`config_dir`](Self::config_dir); cannot be set independently.
    pub fn cache_dir(&self) -> PathBuf {
        self.config_dir.join("cache")
    }

    /// Default output directory for downloaded files, if configured via
    /// [`ClientBuilder::default_output_dir`](crate::ClientBuilder::default_output_dir).
    ///
    /// The value is the faithful configuration (a relative value is
    /// anchored to the working directory at build time). The *effective*
    /// fallback — the working directory when unconfigured — is resolved
    /// at read time by [`CliRun::get_default_output_dir`], so a per-run
    /// [`CliRun::cwd`] override moves the default landing spot as
    /// expected. A per-call output directory (`--output-dir` /
    /// [`RunOptions::output_dir`](crate::RunOptions)) overrides it for a
    /// single invocation.
    pub fn default_output_dir(&self) -> Option<&Path> {
        self.default_output_dir.as_deref()
    }

    /// The binary name (command name) used in `--version` / `--help` /
    /// `--doc` output.
    pub fn bin_name(&self) -> &str {
        &self.bin_name
    }

    // -- networking --

    /// Return the [`wecom_transport::Transport`] handle for the client.
    pub fn transport(&self) -> &wecom_transport::Transport {
        &self.transport
    }

    /// Return the mutable [`wecom_transport::Transport`] handle for the client.
    pub fn transport_mut(&mut self) -> &mut wecom_transport::Transport {
        &mut self.transport
    }

    /// Derive an [`wecom_transport::Endpoint`] using this client's configuration.
    ///
    /// base_url is `None` — the transport fills its
    /// defaults at execution time. Use
    /// [`MethodHandle::endpoint`](crate::service::MethodHandle::endpoint) for
    /// per-service overrides.
    ///
    /// The returned endpoint carries HTTP addressing.
    ///
    /// # Example
    /// ```rust
    /// # fn example(client: &wecom::Client) {
    /// // Service discovery endpoint:
    /// client.endpoint("/service/discovery");
    /// # }
    /// ```
    pub fn endpoint(&self, path: impl Into<String>) -> wecom_transport::Endpoint {
        wecom_transport::Endpoint::new().with(wecom_transport::HttpEndpoint::new(path))
    }

    // -- runtime (internal) --

    /// Returns a reference to the shared [`HelperRegistry`].
    pub fn helper_registry(&self) -> &HelperRegistry {
        &self.helper_registry
    }

    /// Returns the custom commands registered via [`ClientBuilder::command`].
    pub fn custom_commands(&self) -> &[CustomCommand] {
        &self.custom_commands
    }

    // -- programmatic service API --

    /// List all available services from the registry catalog.
    ///
    /// Results are cached after the first fetch; subsequent calls return
    /// the cached list.
    pub async fn list_services(&self) -> Result<Vec<registry::ServiceInfo>> {
        self.list_services_with_options(&RequestOptions::default())
            .await
    }

    /// Get a handle to a specific service by name.
    ///
    /// Fetches the service description (with caching) and returns a
    /// [`service::ServiceHandle`] whose methods are all synchronous.
    ///
    /// # Errors
    /// Returns a validation error (`ValidationError`) if `name` matches no
    /// service in the discovery catalog (checked by exact name first, then
    /// alias).
    ///
    /// # Example
    /// ```rust,no_run
    /// # async fn example(client: &wecom::Client) -> Result<(), Box<dyn std::error::Error>> {
    /// let svc = client.service("contact").await?;
    /// let method = svc.method(&["users", "list"])?;
    /// method.invoke(serde_json::json!({})).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn service(&self, name: &str) -> Result<service::ServiceHandle<'_>> {
        self.service_with_options(name, &RequestOptions::default())
            .await
    }

    /// Get a [`MethodHandle`](crate::service::MethodHandle) directly by path,
    /// e.g. `&["contact", "users", "list"]`.
    ///
    /// This is a convenience shortcut for:
    /// ```rust,no_run
    /// # async fn example(client: &wecom::Client) -> Result<(), Box<dyn std::error::Error>> {
    /// let method = client.service("contact").await?.method(&["users", "list"])?;
    /// # let _ = method;
    /// # Ok(())
    /// # }
    /// ```
    ///
    /// The first element is the service name; the remaining elements are the
    /// method path passed to [`service::ServiceHandle::method`].
    ///
    /// # Errors
    /// Returns a validation error (`ValidationError`) if the path has fewer
    /// than two elements,
    /// the service is not found, or the method path does not exist.
    ///
    /// # Example
    /// ```rust,no_run
    /// # async fn example(client: &wecom::Client) -> Result<(), Box<dyn std::error::Error>> {
    /// let method = client.method(&["contact", "users", "list"]).await?;
    /// method.invoke(serde_json::json!({})).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn method(&self, path: &[&str]) -> Result<service::MethodHandle<'_>> {
        self.method_with_options(path, &RequestOptions::default())
            .await
    }

    // -- internal helpers --

    /// [`list_services`](Self::list_services) 的带请求 options 变体：
    /// discovery 请求会以 `options`（叠加在 transport 默认之上）发出。
    pub(crate) async fn list_services_with_options(
        &self,
        options: &RequestOptions,
    ) -> Result<Vec<registry::ServiceInfo>> {
        let catalog = self
            .service_cache
            .lock()
            .await
            .get_or_fetch_catalog(self, options)
            .await?;
        Ok(catalog.items.clone())
    }

    /// [`service`](Self::service) 的带请求 options 变体：schema 拉取请求
    /// 会以 `options`（叠加在 transport 默认之上）发出。
    pub(crate) async fn service_with_options(
        &self,
        name: &str,
        options: &RequestOptions,
    ) -> Result<service::ServiceHandle<'_>> {
        // 先通过 catalog 解析 alias → 原始 service name
        let catalog = self
            .service_cache
            .lock()
            .await
            .get_or_fetch_catalog(self, options)
            .await?;

        // 先精确匹配 name，再匹配 alias；catalog 未命中视为无效服务名，直接报错
        let info = registry::find_service_by_name(&catalog.items, name)
            .cloned()
            .ok_or_else(|| Error::validation(format!("找不到服务 '{name}'")))
            .inspect_err(|e| tracing::error!(error = %e, "service not found in catalog"))?;

        let schema = self
            .service_cache
            .lock()
            .await
            .get_or_fetch_detail(self, &info.name, options)
            .await?;

        Ok(service::ServiceHandle::new(self, info, schema).with_input_name(name))
    }

    /// [`method`](Self::method) 的带请求 options 变体：schema 拉取请求
    /// 会以 `options`（叠加在 transport 默认之上）发出；返回的
    /// [`service::MethodHandle`] 的业务调用以 transport 默认 options 为基底。
    pub(crate) async fn method_with_options(
        &self,
        path: &[&str],
        options: &RequestOptions,
    ) -> Result<service::MethodHandle<'_>> {
        if path.len() < 2 {
            tracing::error!(path = ?path, "method path too short");
            return Err(Error::validation(format!(
                "方法路径至少需要两段 ([\"<service>\", \"<method>\", ...])，但收到: {:?}",
                path
            )));
        }
        let (service_name, method_path) = path.split_first().unwrap();
        self.service_with_options(service_name, options)
            .await?
            .method(method_path)
    }

    /// Resolve a builtin endpoint from the endpoint catalog, attaching the
    /// catalog's `TaskQuery` poll endpoint as a [`wecom_transport::PollEndpoint`]
    /// capability so `TaskQuery` long-task polling resolves the same way.
    pub(crate) fn resolve_builtin_endpoint(&self, key: EndpointKey) -> wecom_transport::Endpoint {
        let poll = self.endpoints.resolve(EndpointKey::TaskQuery);
        self.endpoints
            .resolve(key)
            .with(wecom_transport::PollEndpoint(poll))
    }
}

impl std::fmt::Debug for Client {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut s = f.debug_struct("Client");
        s.field("private_fs", &self.private_fs)
            .field("workspace_fs", &self.workspace_fs)
            .field("config_dir", &self.config_dir)
            .field("default_output_dir", &self.default_output_dir)
            .field("transport", &self.transport);
        s.finish_non_exhaustive()
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：Client（主入口）
    //!
    //! ### 关键接口
    //! - [Client::method] — 通过路径切片一步获取 MethodHandle
    //!
    //! ### 关键分支与异常路径
    //! - path 长度 < 2 → Err(Validation)
    //! - 服务不存在（缓存未命中且无网络）→ Err
    //! - 服务存在但方法路径不存在 → Err(Validation)
    //! - 正常路径（顶层方法）→ Ok，name() 正确
    //! - 正常路径（嵌套资源方法）→ Ok，name() 正确
    //!
    //! ### 上下游交互
    //! - 上游：外部调用方直接使用 Client 作为入口
    //! - 下游：委托 [ServiceCache] 加载 schema，再委托 [service::ServiceHandle::method] 解析路径

    use std::sync::Mutex;

    use tempfile::TempDir;
    use tracing_subscriber::prelude::*;
    use wecom_transport::EndpointHttpExt;

    use super::*;
    use crate::telemetry::contract::method_alias as ctr_alias;
    use crate::telemetry::{CaptureScope, ClientEvent, EventExt, TelemetryLayer};

    // ── helpers ──

    /// Build a Client backed by `root` as config_dir, cwd and sandbox root.
    fn build_client(root: &std::path::Path) -> Client {
        Client::builder()
            .config_dir(root)
            .cwd(root)
            .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::confined_to(&[
                root,
            ])))
            .workspace_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::confined_to(&[
                root,
            ])))
            .build()
            .unwrap()
    }

    /// Write a minimal service schema JSON into the cache directory so that
    /// `ServiceCache::get_or_fetch_detail` returns it without hitting the network.
    ///
    /// Schema layout:
    /// - top-level method: `list`
    /// - resource `users` with method `get`
    fn seed_service_cache(root: &std::path::Path, service: &str) {
        seed_service_cache_with_aliases(root, service, &[]);
    }

    /// [`seed_service_cache`] 的 alias 变体：catalog 中的服务声明 `aliases`。
    fn seed_service_cache_with_aliases(root: &std::path::Path, service: &str, aliases: &[&str]) {
        let cache_dir = root.join("cache");
        std::fs::create_dir_all(&cache_dir).unwrap();
        let schema = serde_json::json!({
            "description": "test service",
            "base_url": "https://test.example.com/",
            "methods": {
                "list": {
                    "http_method": "GET",
                    "path": "/list"
                }
            },
            "resources": {
                "users": {
                    "methods": {
                        "get": {
                            "http_method": "GET",
                            "path": "/users/{id}"
                        }
                    },
                    "resources": {}
                }
            }
        });
        let file = cache_dir.join(format!("service_{}.json", fs::sanitize_filename(service)));
        #[allow(clippy::disallowed_methods)] // Test helper: write fixture outside sandbox
        std::fs::write(file, serde_json::to_string(&schema).unwrap()).unwrap();

        // Also seed the catalog cache so service_with_options can resolve aliases.
        let catalog = serde_json::json!({
            "items": [{
                "name": service,
                "description": "",
                "hidden": false,
                "alias": aliases
            }]
        });
        let catalog_file = cache_dir.join("catalog.json");
        #[allow(clippy::disallowed_methods)] // Test helper: write fixture outside sandbox
        std::fs::write(catalog_file, serde_json::to_string(&catalog).unwrap()).unwrap();
    }

    // ── Client::method ──

    /// P1：[Client::method] 路径长度为 0 时返回 Err
    /// 条件：传入空切片 &[]
    /// 断言：返回 Err(Validation)，错误信息包含 "至少需要两段"
    #[tokio::test]
    async fn method_with_empty_path_returns_error() {
        let tmp = TempDir::new().unwrap();
        let client = build_client(tmp.path());
        let err = client.method(&[]).await.unwrap_err();
        assert!(
            err.to_string().contains("至少需要两段"),
            "unexpected error: {err}"
        );
    }

    /// P1：[Client::method] 路径长度为 1 时返回 Err
    /// 条件：传入只含服务名的切片 &["svc"]
    /// 断言：返回 Err(Validation)，错误信息包含 "至少需要两段"
    #[tokio::test]
    async fn method_with_single_segment_returns_error() {
        let tmp = TempDir::new().unwrap();
        let client = build_client(tmp.path());
        let err = client.method(&["svc"]).await.unwrap_err();
        assert!(
            err.to_string().contains("至少需要两段"),
            "unexpected error: {err}"
        );
    }

    /// P0：[Client::method] 正常路径获取顶层方法
    /// 条件：缓存中存在 "svc" 服务，顶层有 "list" 方法，传入 &["svc", "list"]
    /// 断言：返回 Ok，MethodHandle::name() 为 "list"
    #[tokio::test]
    async fn method_returns_top_level_method() {
        let tmp = TempDir::new().unwrap();
        seed_service_cache(tmp.path(), "svc");
        let client = build_client(tmp.path());
        let handle = client.method(&["svc", "list"]).await.unwrap();
        assert_eq!(handle.name(), "list");
    }

    /// P0：[Client::method] 正常路径获取嵌套资源下的方法
    /// 条件：缓存中存在 "svc" 服务，users 资源下有 "get" 方法，传入 &["svc", "users", "get"]
    /// 断言：返回 Ok，MethodHandle::name() 为 "get"
    #[tokio::test]
    async fn method_returns_nested_resource_method() {
        let tmp = TempDir::new().unwrap();
        seed_service_cache(tmp.path(), "svc");
        let client = build_client(tmp.path());
        let handle = client.method(&["svc", "users", "get"]).await.unwrap();
        assert_eq!(handle.name(), "get");
    }

    /// P1：[Client::method] 方法路径不存在时返回 Err
    /// 条件：缓存中存在 "svc" 服务，但不存在 "delete" 方法，传入 &["svc", "delete"]
    /// 断言：返回 Err
    #[tokio::test]
    async fn method_with_nonexistent_method_returns_error() {
        let tmp = TempDir::new().unwrap();
        seed_service_cache(tmp.path(), "svc");
        let client = build_client(tmp.path());
        assert!(client.method(&["svc", "delete"]).await.is_err());
    }

    /// P1：[Client::method] 资源路径不存在时返回 Err
    /// 条件：缓存中存在 "svc" 服务，但不存在 "orders" 资源，传入 &["svc", "orders", "list"]
    /// 断言：返回 Err
    #[tokio::test]
    async fn method_with_nonexistent_resource_returns_error() {
        let tmp = TempDir::new().unwrap();
        seed_service_cache(tmp.path(), "svc");
        let client = build_client(tmp.path());
        assert!(client.method(&["svc", "orders", "list"]).await.is_err());
    }

    /// P1：[Client::service] 服务名未命中 catalog 时返回 Err(Validation)
    /// 条件：缓存 catalog 仅含 "svc"，以 "unknown" 调 service()
    /// 断言：返回 Err，错误信息包含 "找不到服务 'unknown'"（不发起 detail 拉取）
    #[tokio::test]
    async fn service_with_unknown_name_returns_validation_error() {
        let tmp = TempDir::new().unwrap();
        seed_service_cache(tmp.path(), "svc");
        let client = build_client(tmp.path());
        let err = client.service("unknown").await.err().unwrap();
        assert!(
            err.to_string().contains("找不到服务 'unknown'"),
            "unexpected error: {err}"
        );
    }

    /// P1：[Client::method] 服务名未命中 catalog 时返回 Err(Validation)
    /// 条件：缓存 catalog 仅含 "svc"，传入 &["unknown", "list"]
    /// 断言：返回 Err，错误信息包含 "找不到服务"（与 method rustdoc 契约一致）
    #[tokio::test]
    async fn method_with_unknown_service_returns_validation_error() {
        let tmp = TempDir::new().unwrap();
        seed_service_cache(tmp.path(), "svc");
        let client = build_client(tmp.path());
        let err = client.method(&["unknown", "list"]).await.err().unwrap();
        assert!(
            err.to_string().contains("找不到服务"),
            "unexpected error: {err}"
        );
    }

    // ── Client::method（method_alias 遥测，SDK 侧 wiring） ──

    /// 测试 helper：注册共享 emit callsite 并重建 interest 缓存（机理见
    /// crate::telemetry::event_capture 测试模块的同名 helper）。
    /// 使用时机：`set_default` 之后、`CaptureScope::new()` 之前；
    /// 热身事件不进入断言。
    fn warm_up_emit_callsite() {
        crate::telemetry::emit("test_warmup", &serde_json::json!({}));
        tracing::callsite::rebuild_interest_cache();
    }

    /// P0：[Client::method] 服务别名命中时发射一条合并 method_alias 事件
    /// 条件：缓存 catalog 中 "hr" 服务声明 alias ["human-resources"]，调 method(&["human-resources", "list"])
    /// 断言：方法解析成功（name()=="list"），且捕获一条 method_alias 事件
    /// （input="human-resources list"，resolved="hr list"）
    #[tokio::test]
    async fn method_via_service_alias_emits_event() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev: ClientEvent| {
            c.lock().unwrap().push(ev);
        });
        let _enter = scope.span().enter();

        let tmp = TempDir::new().unwrap();
        seed_service_cache_with_aliases(tmp.path(), "hr", &["human-resources"]);
        let client = build_client(tmp.path());
        let handle = client.method(&["human-resources", "list"]).await.unwrap();
        drop(_enter);

        assert_eq!(handle.name(), "list");
        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, ctr_alias::KIND);
        assert_json_diff::assert_json_eq!(
            snaps[0].payload,
            serde_json::json!({
                ctr_alias::FIELD_INPUT: "human-resources list",
                ctr_alias::FIELD_RESOLVED: "hr list",
            })
        );
    }

    /// P1：[Client::method] 规范服务名 + 真实路径时不发射 method_alias 事件
    /// 条件：缓存 catalog 中 "hr" 服务声明 alias ["human-resources"]，调 method(&["hr", "list"])
    /// 断言：方法解析成功，且未捕获到任何事件
    #[tokio::test]
    async fn method_via_canonical_path_stays_silent() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev: ClientEvent| {
            c.lock().unwrap().push(ev);
        });
        let _enter = scope.span().enter();

        let tmp = TempDir::new().unwrap();
        seed_service_cache_with_aliases(tmp.path(), "hr", &["human-resources"]);
        let client = build_client(tmp.path());
        let handle = client.method(&["hr", "list"]).await.unwrap();
        drop(_enter);

        assert_eq!(handle.name(), "list");
        assert!(collected.lock().unwrap().is_empty());
    }

    // ── Client::endpoint ──

    /// P0：[Client::endpoint] endpoint 携带 path；base_url 为 None（transport 填入）
    /// 条件：以 base_url=https://api.test 构建 client，调用 client.endpoint("/cgi/x")
    /// 断言：endpoint.path == "/cgi/x"，base_url 为 ""
    #[test]
    fn endpoint_carries_path() {
        let tmp = TempDir::new().unwrap();
        let client = Client::builder().config_dir(tmp.path()).build().unwrap();
        let ep = client.endpoint("/cgi/x");
        // base_url is None on the endpoint — transport fills at execute time
        assert_eq!(ep.base_url(), "");
        assert_eq!(ep.path(), "/cgi/x");
    }

    /// P0：[ClientBuilder::transport] 注入带 base_url 的 transport 并构建成功
    /// 条件：通过 builder 注入带 base_url 的 transport
    /// 断言：构建成功
    #[test]
    fn builder_base_url_succeeds() {
        let tmp = TempDir::new().unwrap();
        let transport = wecom_transport::HttpTransportBackend::builder()
            .base_url("https://api.test")
            .build()
            .unwrap();
        let client = Client::builder()
            .config_dir(tmp.path())
            .transport(transport)
            .build()
            .unwrap();
        // base_url 由 transport 层持有，此处只校验 Client 能正常构建
        let _ = client;
    }

    /// P1：[Client::transport_mut] 返回 Transport 可变引用
    /// 条件：构建 client 后调用 transport_mut()
    /// 断言：返回的引用与 transport() 指向同一地址
    #[test]
    fn transport_mut_returns_mutable_reference() {
        let tmp = TempDir::new().unwrap();
        let mut client = build_client(tmp.path());
        let ptr_imm = client.transport() as *const _;
        let ptr_mut = client.transport_mut() as *const _;
        assert_eq!(ptr_imm, ptr_mut);
    }

    /// P1：[Client::resolve_builtin_endpoint] MediaUpload 默认返回 /file/upload 路径，base_url 为 None
    /// 条件：build_client 创建 client
    /// 断言：endpoint.path 包含 "/file/upload"，base_url 为 ""
    #[test]
    fn resolve_builtin_media_upload_path() {
        let tmp = TempDir::new().unwrap();
        let client = build_client(tmp.path());
        let ep = client.resolve_builtin_endpoint(EndpointKey::MediaUpload);
        assert!(ep.path().contains("/file/upload"));
        // base_url is None (transport fills default)
        assert_eq!(ep.base_url(), "");
    }

    /// P2：[Client::Debug] 格式化输出含 Client 字段
    /// 条件：build_client 创建 client
    /// 断言：format!("{:?}", client) 包含 "Client"
    #[test]
    fn debug_fmt_includes_client_fields() {
        let tmp = TempDir::new().unwrap();
        let client = build_client(tmp.path());
        let debug = format!("{client:?}");
        assert!(debug.contains("Client"));
    }
}
