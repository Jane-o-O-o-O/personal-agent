use std::sync::Arc;

use super::{MethodHandle, MethodSummary, ServiceSchemaInfo, alias, doc};
use crate::client::Client;
use crate::helpers::Helper;
use crate::registry::{ServiceInfo, ServiceResource, ServiceSchema};
use crate::telemetry::contract::method_alias;
use crate::{Error, Result, telemetry};

/// Handle representing a discovered service.
///
/// Created via [`Client::service()`] which fetches the service description.
/// Carries the catalog [`ServiceInfo`] (canonical name, description, hidden
/// flag, declared aliases) alongside the full schema, so all accessor
/// methods are synchronous since the data is already loaded.
pub struct ServiceHandle<'c> {
    pub(crate) client: &'c Client,
    /// Catalog metadata for this service (canonical name / description /
    /// hidden / alias).
    pub(crate) info: ServiceInfo,
    /// Service name as originally typed by the caller — may be an alias.
    /// [`ServiceHandle::method`] uses it to reconstruct the `method_alias`
    /// telemetry `input`; defaults to the canonical name when the caller
    /// only knows it.
    pub(crate) input_name: String,
    pub(crate) schema: Arc<ServiceSchema>,
}

impl<'c> ServiceHandle<'c> {
    pub(crate) fn new(client: &'c Client, info: ServiceInfo, schema: Arc<ServiceSchema>) -> Self {
        Self {
            input_name: info.name.clone(),
            client,
            info,
            schema,
        }
    }

    /// Set the service name as originally typed by the caller (may be an
    /// alias). Used when alias resolution happened upstream of this handle —
    /// e.g. the CLI dispatch, where clap normalizes the matched subcommand
    /// to the canonical name and the raw argv token is passed separately.
    pub(crate) fn with_input_name(mut self, input_name: &str) -> Self {
        self.input_name = input_name.to_string();
        self
    }

    /// The `id` to use in a remote doc request, or `None` when remote doc is
    /// not in effect for this service (either `remote_doc` resolves to false,
    /// or no `id` is declared — both fall back to local rendering).
    pub fn remote_doc_id(&self) -> Option<&str> {
        if self.schema.remote_doc != Some(true) {
            return None;
        }
        self.schema.id.as_deref()
    }

    /// Service name (canonical, resolved from any alias).
    pub fn name(&self) -> &str {
        &self.info.name
    }

    /// Catalog metadata for this service (canonical name, description,
    /// hidden flag, declared aliases).
    pub fn info(&self) -> &ServiceInfo {
        &self.info
    }

    /// Service description text.
    pub fn description(&self) -> Option<&str> {
        self.schema.description.as_deref()
    }

    /// Skills provided by the backend for this service,
    /// used for user guidance when a method is not found.
    pub fn skills(&self) -> &[String] {
        &self.schema.skills
    }

    /// List all available methods (recursively flattened from the resource tree).
    pub fn methods(&self) -> Vec<MethodHandle<'c>> {
        let mut result = Vec::new();
        collect_method_handles(
            self.client,
            &self.schema,
            &self.schema.resource_tree,
            &[self.info.name.as_str()],
            &mut result,
        );
        result
    }

    /// Get a handle to a specific method by path.
    ///
    /// Before walking the resource tree, attempts path-alias resolution
    /// (the schema's `path_alias` field), so callers don't need to
    /// distinguish alias paths from real command paths.
    ///
    /// Emits a single `method_alias` telemetry event when the resolution
    /// rewrote the input at either alias layer — the service-name alias
    /// (`input_name` differs from the canonical name) or a method-path
    /// alias. `input` preserves the caller's original typing (service
    /// alias included), `resolved` is the fully canonical path, so one
    /// event covers even a both-layers rewrite.
    ///
    /// # Example
    /// ```rust,no_run
    /// # fn example(svc: &wecom::ServiceHandle<'_>) -> Result<(), Box<dyn std::error::Error>> {
    /// let method = svc.method(&["users", "list"])?;
    /// # let _ = method;
    /// # Ok(())
    /// # }
    /// ```
    pub fn method(&self, path: &[&str]) -> Result<MethodHandle<'c>> {
        if path.is_empty() {
            return Err(Error::validation("方法路径不能为空".to_string()))
                .inspect_err(|e| tracing::error!(error = %e, "empty method path"));
        }

        let alias_entries =
            alias::collect_alias_entries(&self.info.name, &self.schema.resource_tree);
        let resolved = alias::resolve_command_path(&alias_entries, path);
        let resolved: Option<Vec<_>> =
            resolved.map(|real| real.iter().map(String::as_str).collect());

        // 命中任一层别名（服务名改写或方法路径改写）即上报，一次方法解析最多
        // 一条事件：input 保留调用方原始输入（含服务别名），resolved 为规范全路径。
        if self.input_name != self.info.name || resolved.is_some() {
            telemetry::emit(
                method_alias::KIND,
                &serde_json::json!({
                    method_alias::FIELD_INPUT: std::iter::once(self.input_name.as_str())
                        .chain(path.iter().copied())
                        .collect::<Vec<_>>()
                        .join(" "),
                    method_alias::FIELD_RESOLVED: std::iter::once(self.info.name.as_str())
                        .chain(resolved.as_deref().unwrap_or(path).iter().copied())
                        .collect::<Vec<_>>()
                        .join(" "),
                }),
            );
        }

        let path = resolved.as_deref().unwrap_or(path);

        let mut resource = &self.schema.resource_tree;
        for &segment in &path[..path.len() - 1] {
            resource = resource.resources.get(segment).ok_or_else(|| {
                Error::other(format!("找不到目标方法 '{}'", path.join(".")).into())
            }).inspect_err(|_| tracing::error!(error = %format!("找不到目标方法 '{}'", path.join(".")), "method not found"))?;
        }

        let method_name = path[path.len() - 1];
        let method = resource.methods.get(method_name).ok_or_else(|| {
            Error::other(format!("找不到目标方法 '{}'", path.join(".")).into())
        }).inspect_err(|_| tracing::error!(error = %format!("找不到目标方法 '{}'", path.join(".")), "method not found"))?;

        let method_path_segments: Vec<_> = std::iter::once(self.info.name.clone())
            .chain(path.iter().copied().map(String::from))
            .collect();

        Ok(MethodHandle {
            client: self.client,
            service_schema: Arc::clone(&self.schema),
            method_name: method_name.to_string(),
            method_path_segments,
            schema: method.clone(),
        })
    }

    /// Look up a helper registered under this service by sub-path.
    ///
    /// The `path` is the command path relative to the service **including the
    /// helper's leaf command name**, e.g. `&["+download"]` resolves to the
    /// helper located at group `["<service>"]` with name `"+download"`.
    pub fn helper(&self, path: &[&str]) -> Option<&dyn Helper> {
        let full_path: Vec<_> = std::iter::once(self.info.name.as_str())
            .chain(path.iter().copied())
            .collect();
        self.client.helper_registry().get_helper(&full_path)
    }

    /// Generate service-level documentation (Markdown).
    ///
    /// Returns a [`StyledStr`](clap::builder::StyledStr) that embeds ANSI
    /// styling.  Use `.ansi()` to render with colour or `Display` to
    /// strip escape codes.
    pub fn doc(&self) -> clap::builder::StyledStr {
        doc::gen_service_doc(self.client.bin_name(), &self.info.name, &self.schema, 1)
    }

    /// Generate service-level schema (JSON).
    pub fn schema(&self) -> ServiceSchemaInfo {
        let methods = self
            .methods()
            .into_iter()
            .map(|h| MethodSummary {
                name: h.path().join("."),
                description: h.description().map(str::to_string),
            })
            .collect();

        ServiceSchemaInfo {
            name: self.info.name.clone(),
            description: self.schema.description.clone(),
            skills: self.schema.skills.clone(),
            methods,
        }
    }
}

/// Recursively collect all methods from a resource tree as `MethodHandle`s.
fn collect_method_handles<'c>(
    client: &'c Client,
    schema: &Arc<ServiceSchema>,
    resource: &ServiceResource,
    prefix: &[&str],
    result: &mut Vec<MethodHandle<'c>>,
) {
    for (name, method) in &resource.methods {
        let mut full_path: Vec<_> = prefix.iter().map(|s| s.to_string()).collect();
        full_path.push(name.clone());
        result.push(MethodHandle {
            client,
            service_schema: Arc::clone(schema),
            method_name: name.clone(),
            method_path_segments: full_path,
            schema: method.clone(),
        });
    }
    for (name, child_resource) in &resource.resources {
        let mut child_prefix = prefix.to_vec();
        child_prefix.push(name.as_str());
        collect_method_handles(client, schema, child_resource, &child_prefix, result);
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：ServiceHandle（服务句柄）
    //!
    //! ### 关键接口
    //! - [ServiceHandle::new] — 构造服务句柄
    //! - [ServiceHandle::name] — 返回服务名
    //! - [ServiceHandle::info] — 返回 catalog 元数据（name/description/hidden/alias）
    //! - [ServiceHandle::description] — 返回服务描述
    //! - [ServiceHandle::method] — 按路径查找方法
    //! - [ServiceHandle::methods] — 返回所有方法的扁平列表
    //! - [ServiceHandle::helper] — 按路径查找 helper
    //!
    //! ### 关键分支与异常路径
    //! - method 空路径 → Err
    //! - method 不存在的资源 → Err
    //! - method 资源存在但方法不存在 → Err
    //! - helper 不存在的路径 → None
    //! - description 未设置 → None
    //! - method 遥测：服务别名或方法别名命中 → 发射一条 method_alias 事件；无改写 → 不发射
    //!
    //! ### 上下游交互
    //! - 上游：[ServiceRegistry] 创建 ServiceHandle 供调用方使用
    //! - 下游：依赖 [Client] 执行 HTTP 请求

    use std::sync::Mutex;

    use tracing_subscriber::prelude::*;

    use super::*;
    use crate::registry;
    use crate::telemetry::{CaptureScope, ClientEvent, EventExt, TelemetryLayer};

    /// Build an isolated [Client] for unit tests.
    fn build_isolated_client() -> Client {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().to_path_buf();
        std::mem::forget(tmp);
        Client::builder().config_dir(&dir).build().unwrap()
    }

    static TEST_CLIENT: std::sync::LazyLock<Client> =
        std::sync::LazyLock::new(build_isolated_client);

    /// 构造仅含 name 的 ServiceInfo 测试夹具
    fn svc_info(name: &str) -> registry::ServiceInfo {
        registry::ServiceInfo {
            name: name.to_string(),
            description: String::new(),
            hidden: false,
            alias: vec![],
        }
    }

    fn svc() -> ServiceHandle<'static> {
        let s = Arc::new(registry::ServiceSchema {
            description: Some("TS".into()),
            skills: vec![],
            base_url: Some("https://a.test/".to_string()),
            schemas: indexmap::IndexMap::new(),
            id: None,
            remote_doc: None,
            resource_tree: registry::ServiceResource {
                methods: {
                    let mut m = indexmap::IndexMap::new();
                    m.insert(
                        "list".into(),
                        registry::MethodSchema {
                            description: Some("L".into()),
                            http_method: "GET".into(),
                            path: "/list".into(),
                            path_alias: None,
                            request: None,
                            response: None,
                            ..Default::default()
                        },
                    );
                    m
                },
                resources: {
                    let mut r = indexmap::IndexMap::new();
                    r.insert(
                        "users".into(),
                        registry::ServiceResource {
                            methods: {
                                let mut m = indexmap::IndexMap::new();
                                m.insert(
                                    "get".into(),
                                    registry::MethodSchema {
                                        description: None,
                                        http_method: "GET".into(),
                                        path: "/u/{i}".into(),
                                        path_alias: None,
                                        request: None,
                                        response: None,
                                        ..Default::default()
                                    },
                                );
                                m
                            },
                            resources: indexmap::IndexMap::new(),
                            ..Default::default()
                        },
                    );
                    r
                },
                ..Default::default()
            },
        });
        ServiceHandle::new(&TEST_CLIENT, svc_info("svc"), s)
    }

    /// P0：[ServiceHandle::name] 返回正确的服务名
    /// 条件：创建名为 "svc" 的 ServiceHandle
    /// 断言：name() 返回 "svc"
    #[test]
    fn service_name_returns_correct_name() {
        assert_eq!(svc().name(), "svc");
    }

    /// P1：[ServiceHandle::info] 返回构造时传入的 catalog 元数据
    /// 条件：以 name="hr"、alias=["human-resources"]、hidden=true 的 ServiceInfo 构造句柄
    /// 断言：info() 的 name/alias/hidden 与传入一致
    #[test]
    fn service_info_returns_catalog_metadata() {
        let info = registry::ServiceInfo {
            name: "hr".to_string(),
            description: "Human Resources".to_string(),
            hidden: true,
            alias: vec!["human-resources".to_string()],
        };
        let s = Arc::new(registry::ServiceSchema::default());
        let h = ServiceHandle::new(&TEST_CLIENT, info, s);

        assert_eq!(h.info().name, "hr");
        assert_eq!(h.info().description, "Human Resources");
        assert!(h.info().hidden);
        assert_eq!(h.info().alias, &["human-resources".to_string()]);
        assert_eq!(h.name(), "hr");
    }

    /// P0：[ServiceHandle::description] 在设置描述时返回 Some
    /// 条件：服务 schema 的 description 为 "TS"
    /// 断言：description() 返回 Some("TS")
    #[test]
    fn service_description_returns_some_when_set() {
        assert_eq!(svc().description(), Some("TS"));
    }

    /// P1：[ServiceHandle::method] 在空路径时返回错误
    /// 条件：传入空路径 &[]
    /// 断言：返回 Err
    #[test]
    fn method_with_empty_path_returns_error() {
        assert!(svc().method(&[]).is_err());
    }

    /// P1：[ServiceHandle::method] 在不存在的资源路径时返回错误
    /// 条件：传入 ["x", "y"]（资源树中无 "x"）
    /// 断言：返回 Err
    #[test]
    fn method_with_bad_resource_returns_error() {
        assert!(svc().method(&["x", "y"]).is_err());
    }

    /// P1：[ServiceHandle::method] 在资源存在但方法不存在时返回错误
    /// 条件：传入 ["users", "del"]（users 资源下无 del 方法）
    /// 断言：返回 Err
    #[test]
    fn method_with_nonexistent_method_returns_error() {
        assert!(svc().method(&["users", "del"]).is_err());
    }

    /// P0：[ServiceHandle::method] 通过名称直接获取顶层方法
    /// 条件：传入 ["list"]（顶层有 list 方法）
    /// 断言：返回 Ok，name() 为 "list"
    #[test]
    fn method_returns_direct_method_by_name() {
        let m = svc().method(&["list"]).unwrap();
        assert_eq!(m.name(), "list");
    }

    /// 测试夹具：构造指定 remote_doc / id 的 service schema 句柄。
    fn svc_with_remote_doc(remote_doc: bool, id: Option<&str>) -> ServiceHandle<'static> {
        let id_field = match id {
            Some(v) => format!("\"id\": \"{v}\","),
            None => String::new(),
        };
        let json = format!(
            r#"{{ {id_field} "base_url": "https://api.test", "remote_doc": {remote_doc} }}"#
        );
        let schema: registry::ServiceSchema = serde_json::from_str(&json).unwrap();
        ServiceHandle::new(&TEST_CLIENT, svc_info("svc"), Arc::new(schema))
    }

    /// P0：[ServiceHandle::remote_doc_id] remote_doc=true 且带 id 时返回 id
    /// 条件：service schema 声明 remote_doc=true、id="svc-x"
    /// 断言：remote_doc_id() == Some("svc-x")
    #[test]
    fn remote_doc_id_returns_id_when_enabled() {
        let h = svc_with_remote_doc(true, Some("svc-x"));
        assert_eq!(h.remote_doc_id(), Some("svc-x"));
    }

    /// P1：[ServiceHandle::remote_doc_id] remote_doc=true 但缺 id 时返回 None
    /// 条件：service schema 声明 remote_doc=true、无 id
    /// 断言：remote_doc_id() == None（缺 id 视为未配置，回退本地渲染）
    #[test]
    fn remote_doc_id_none_when_id_missing() {
        let h = svc_with_remote_doc(true, None);
        assert_eq!(h.remote_doc_id(), None);
    }

    /// P1：[ServiceHandle::remote_doc_id] remote_doc 缺省时返回 None
    /// 条件：service schema 无 remote_doc、带 id
    /// 断言：remote_doc_id() == None
    #[test]
    fn remote_doc_id_none_when_remote_doc_unset() {
        let h = svc_with_remote_doc(false, Some("svc-x"));
        assert_eq!(h.remote_doc_id(), None);
    }

    /// P0：[ServiceHandle::method] 通过路径获取嵌套资源下的方法
    /// 条件：传入 ["users", "get"]（users 资源下有 get 方法）
    /// 断言：返回 Ok，name() 为 "get"
    #[test]
    fn method_returns_nested_resource_method() {
        let m = svc().method(&["users", "get"]).unwrap();
        assert_eq!(m.name(), "get");
    }

    /// P0：[ServiceHandle::methods] 返回资源树中所有方法的扁平列表
    /// 条件：服务有顶层 "list" 方法和嵌套 users 下的 "get" 方法
    /// 断言：结果中同时包含 name 为 "list" 和 "get" 的方法
    #[test]
    fn methods_returns_all_flattened_methods() {
        let b = svc().methods();
        assert!(b.iter().any(|m| m.name() == "list"));
        assert!(b.iter().any(|m| m.name() == "get"));
    }

    /// 构造带 alias 的 contact 服务句柄：
    /// users.search 的 path_alias 为 `/contact/search`。
    fn svc_with_alias() -> ServiceHandle<'static> {
        let mut user_methods = indexmap::IndexMap::new();
        user_methods.insert(
            "search".to_string(),
            registry::MethodSchema {
                description: None,
                http_method: "POST".into(),
                path: "/contact/users/search".into(),
                path_alias: Some(vec!["/contact/search".to_string()]),
                request: None,
                response: None,
                ..Default::default()
            },
        );
        let users = registry::ServiceResource {
            methods: user_methods,
            resources: indexmap::IndexMap::new(),
            ..Default::default()
        };
        let mut top = indexmap::IndexMap::new();
        top.insert("users".into(), users);
        let s = Arc::new(registry::ServiceSchema {
            description: None,
            skills: vec![],
            base_url: Some("https://a.test/".to_string()),
            schemas: indexmap::IndexMap::new(),
            id: None,
            remote_doc: None,
            resource_tree: registry::ServiceResource {
                methods: indexmap::IndexMap::new(),
                resources: top,
                ..Default::default()
            },
        });
        ServiceHandle::new(&TEST_CLIENT, svc_info("contact"), s)
    }

    /// P0：[ServiceHandle::method] alias 路径命中后改走真实路径，返回真实方法 handle
    /// 条件：users.search 声明 alias `/contact/search`；调用 `method(&["search"])`
    /// 断言：返回的 handle name 为 "search"，full path 为 ["contact","users","search"]
    #[test]
    fn method_resolves_alias_to_real_path() {
        let h = svc_with_alias().method(&["search"]).unwrap();
        assert_eq!(h.name(), "search");
        assert_eq!(
            h.path(),
            &[
                "contact".to_string(),
                "users".to_string(),
                "search".to_string()
            ]
        );
    }

    /// P0：[ServiceHandle::method] 真实路径与 alias 共存时仍能正常解析真实路径
    /// 条件：users.search 已声明 alias，但调用方仍传入真实路径 ["users","search"]
    /// 断言：依然返回 search 方法 handle（alias 未屏蔽真实路径）
    #[test]
    fn method_real_path_works_when_alias_exists() {
        let h = svc_with_alias().method(&["users", "search"]).unwrap();
        assert_eq!(h.name(), "search");
    }

    /// P1：[ServiceHandle::method] 既不命中 alias 也不命中真实路径时返回错误
    /// 条件：alias 表内没有 ["unknown"]，真实树里也没有
    /// 断言：返回 Err
    #[test]
    fn method_unknown_path_returns_error_with_alias_table() {
        assert!(svc_with_alias().method(&["unknown"]).is_err());
    }

    // ── method_alias 遥测（统一发射点） ──

    /// 测试 helper：注册共享 emit callsite 并重建 interest 缓存（机理见
    /// crate::telemetry::event_capture 测试模块的同名 helper）。
    /// 使用时机：`set_default` 之后、`CaptureScope::new()` 之前；
    /// 热身事件不进入断言。
    fn warm_up_emit_callsite() {
        crate::telemetry::emit("test_warmup", &serde_json::json!({}));
        tracing::callsite::rebuild_interest_cache();
    }

    /// 构造 CaptureScope 并收集事件到返回的共享 vec
    fn capture_events() -> (CaptureScope, Arc<Mutex<Vec<ClientEvent>>>) {
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev: ClientEvent| {
            c.lock().unwrap().push(ev);
        });
        (scope, collected)
    }

    /// P0：[ServiceHandle::method] 方法路径别名命中时发射 method_alias 事件
    /// 条件：users.search 声明 alias `/contact/search`，以规范服务名调用 method(&["search"])
    /// 断言：捕获一条 method_alias 事件（input="contact search"，resolved="contact users search"）
    #[test]
    fn method_alias_hit_emits_event() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        let (scope, collected) = capture_events();

        let _enter = scope.span().enter();
        let h = svc_with_alias().method(&["search"]).unwrap();
        drop(_enter);

        assert_eq!(h.name(), "search");
        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, method_alias::KIND);
        assert_json_diff::assert_json_eq!(
            snaps[0].payload,
            serde_json::json!({
                method_alias::FIELD_INPUT: "contact search",
                method_alias::FIELD_RESOLVED: "contact users search",
            })
        );
    }

    /// P0：[ServiceHandle::method] 服务别名与方法别名同时命中时合并为一条事件
    /// 条件：input_name="hr-alias"（服务别名），调用 method(&["search"])（方法别名）
    /// 断言：恰好一条事件（input="hr-alias search"，resolved="contact users search"）
    #[test]
    fn service_and_method_alias_hit_emit_single_event() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        let (scope, collected) = capture_events();

        let _enter = scope.span().enter();
        let h = svc_with_alias()
            .with_input_name("hr-alias")
            .method(&["search"])
            .unwrap();
        drop(_enter);

        assert_eq!(h.name(), "search");
        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, method_alias::KIND);
        assert_json_diff::assert_json_eq!(
            snaps[0].payload,
            serde_json::json!({
                method_alias::FIELD_INPUT: "hr-alias search",
                method_alias::FIELD_RESOLVED: "contact users search",
            })
        );
    }

    /// P1：[ServiceHandle::method] 仅服务别名命中（真实方法路径）时仍发射一条事件
    /// 条件：input_name="hr-alias"，调用 method(&["users", "search"])（真实路径，无方法改写）
    /// 断言：一条事件（input="hr-alias users search"，resolved="contact users search"）
    #[test]
    fn service_alias_only_hit_emits_event() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        let (scope, collected) = capture_events();

        let _enter = scope.span().enter();
        let h = svc_with_alias()
            .with_input_name("hr-alias")
            .method(&["users", "search"])
            .unwrap();
        drop(_enter);

        assert_eq!(h.name(), "search");
        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, method_alias::KIND);
        assert_json_diff::assert_json_eq!(
            snaps[0].payload,
            serde_json::json!({
                method_alias::FIELD_INPUT: "hr-alias users search",
                method_alias::FIELD_RESOLVED: "contact users search",
            })
        );
    }

    /// P1：[ServiceHandle::method] 无任何改写时不发射事件
    /// 条件：规范服务名 + 真实路径，调用 method(&["users", "search"])
    /// 断言：未捕获到任何事件
    #[test]
    fn no_rewrite_stays_silent() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        let (scope, collected) = capture_events();

        let _enter = scope.span().enter();
        let h = svc_with_alias().method(&["users", "search"]).unwrap();
        drop(_enter);

        assert_eq!(h.name(), "search");
        assert!(collected.lock().unwrap().is_empty());
    }

    /// P1：[ServiceHandle::helper] 对不存在的 helper 路径返回 None
    /// 条件：传入 ["x", "y"]（无对应 helper）
    /// 断言：返回 None
    #[test]
    fn helper_returns_none_for_nonexistent_path() {
        assert!(svc().helper(&["x", "y"]).is_none());
    }

    /// P0：[ServiceHandle::description] 在未设置描述时返回 None
    /// 条件：服务 schema 的 description 为 None
    /// 断言：description() 返回 None
    #[test]
    fn service_description_returns_none_when_unset() {
        let s = Arc::new(registry::ServiceSchema {
            description: None,
            skills: vec![],
            base_url: Some("https://a.test/".to_string()),
            schemas: indexmap::IndexMap::new(),
            id: None,
            remote_doc: None,
            resource_tree: registry::ServiceResource {
                methods: indexmap::IndexMap::new(),
                resources: indexmap::IndexMap::new(),
                ..Default::default()
            },
        });
        let handle = ServiceHandle::new(&TEST_CLIENT, svc_info("empty"), s);
        assert!(handle.description().is_none());
    }
}
