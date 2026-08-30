//! 远程文档生成（remote_doc）。
//!
//! 当 discovery schema 中 service / resource / method 任一层级声明
//! `remote_doc: true` 时，对应节点的 `--doc` / `--help` / `--schema` 不由本地
//! 渲染，而是向固定 endpoint（[`EndpointKey::RemoteDoc`]）发送
//! `{ "id": <节点 id>, "type": <doc|help|schema> }`，将返回的文档文本直接
//! 输出到 stdout。
//!
//! ## 生效规则（就近覆盖）
//!
//! method → 父级 resource 链（由近及远）→ service → 默认 `false`；
//! 每层可用 `remote_doc: false` 显式关闭上层开启的远程渲染。
//!
//! ## 请求 / 响应契约
//!
//! - 请求：透传 JSON `{ "id": "...", "type": "doc" | "help" | "schema" }`，
//!   `id` 为目标节点在 schema 中声明的 `id` 字段；endpoint 不携带 base_url，
//!   执行时由 transport 回填默认值。
//! - 响应：gateway 信封，`result` 固定为 `{"doc": <文档文本>}`；形状不符
//!   时报 `Error::Wrapped(Error::Parse)`。

use serde::Deserialize;

use super::alias;
use crate::Result;
use crate::client::{CliRun, EndpointKey};
use crate::registry::ServiceSchema;

/// 远程文档响应 `result` 的固定形状。
#[derive(Debug, Deserialize)]
struct RemoteDocResponse {
    /// 文档文本。
    doc: String,
}

/// 解析 service-relative 路径 `segs` 所指节点的远程文档 `id`。
///
/// 就近覆盖：method → 父级 resource 链 → service；任一层为 `Some` 即覆盖
/// 外层值。返回 `Some(id)` 即代表 `remote_doc` 生效；返回 `None` 表示
/// 回退本地渲染，包括三种情况：
/// - 路径未命中任何已知节点（helper 路径 / 拼写错误 / method 之后还有更深段）；
/// - `remote_doc` 生效值为 `false`；
/// - 节点未声明 `id`（按未配置 remote_doc 处理，不作为错误）。
pub(crate) fn resolve_remote_doc_id<'a>(
    schema: &'a ServiceSchema,
    segs: &[&str],
) -> Option<&'a str> {
    let mut effective = schema.remote_doc;
    let mut node = &schema.resource_tree;
    for (i, seg) in segs.iter().enumerate() {
        if let Some(child) = node.resources.get(*seg) {
            if child.remote_doc.is_some() {
                effective = child.remote_doc;
            }
            node = child;
        } else if i + 1 == segs.len()
            && let Some(method) = node.methods.get(*seg)
        {
            if method.remote_doc.is_some() {
                effective = method.remote_doc;
            }
            return method.id.as_deref().filter(|_| effective.unwrap_or(false));
        } else {
            return None;
        }
    }
    // 命中 resource 或 service 根节点。
    let id = if segs.is_empty() {
        schema.id.as_deref()
    } else {
        node.id.as_deref()
    };
    id.filter(|_| effective.unwrap_or(false))
}

/// alias 感知的 help 路径解析：先经 method alias 映射到真实路径再走
/// [`resolve_remote_doc_id`]；未命中 alias 时按字面路径解析。
pub(crate) fn resolve_remote_doc_id_with_alias<'a>(
    schema: &'a ServiceSchema,
    service_name: &str,
    segs: &[&str],
) -> Option<&'a str> {
    let alias_entries = alias::collect_alias_entries(service_name, &schema.resource_tree);
    if let Some(real) = alias::resolve_command_path(&alias_entries, segs) {
        let real_refs: Vec<_> = real.iter().map(String::as_str).collect();
        resolve_remote_doc_id(schema, &real_refs)
    } else {
        resolve_remote_doc_id(schema, segs)
    }
}

/// 请求远程文档 endpoint，返回文档文本。
///
/// endpoint 固定（[`EndpointKey::RemoteDoc`]），base_url 由 transport 在
/// 执行时回填默认值；run 级请求参数叠加在 transport 默认之上。
pub(crate) async fn fetch_remote_doc(run: &CliRun<'_>, id: &str, doc_type: &str) -> Result<String> {
    tracing::info!(id, doc_type, "fetching remote doc");

    let client = run.get_client();
    let endpoint = client.resolve_builtin_endpoint(EndpointKey::RemoteDoc);

    let result = client
        .transport()
        .invoke(endpoint, serde_json::json!({ "id": id, "type": doc_type }))
        .with_options(run.get_options().clone())
        .execute()
        .await?
        .into_result()?;

    serde_json::from_value::<RemoteDocResponse>(result.clone())
        .map(|resp| resp.doc)
        .map_err(|e| {
            wecom_transport::Error::Parse {
                message: e.to_string(),
                endpoint: "remote_doc".into(),
                body: Box::new(result),
                source: None,
            }
            .into()
        })
        .inspect_err(|e| tracing::warn!(error = %e, "malformed remote doc response"))
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：remote_doc（远程文档生成）
    //!
    //! ### 关键接口
    //! - [resolve_remote_doc_id] — 解析 service-relative 路径节点的 id 与生效 remote_doc（就近覆盖）
    //! - [resolve_remote_doc_id_with_alias] — alias 感知的 help 路径节点解析
    //! - [fetch_remote_doc] — 请求远程文档 endpoint 并解析响应（result 形状不符 → Error::Parse）
    //! - [RemoteDocResponse] — 响应 result 的固定形状 `{"doc": string}`
    //!
    //! ### 关键分支与异常路径
    //! - method / resource / service 三层 remote_doc 就近覆盖
    //! - 路径未命中节点（helper / 拼写错误 / method 非叶子）→ None → 本地渲染
    //! - 响应 result 形状不符 → Error::Wrapped(Error::Parse)
    //!
    //! ### 上下游交互
    //! - 上游：[handler::handle_service_cmd]（--doc/--schema/--help 分派）、
    //!   [CliRun::execute](crate::CliRun)（clap DisplayHelp 拦截）
    //! - 下游：[Client::resolve_builtin_endpoint] + transport invoke

    use super::*;

    /// 测试夹具：三层 remote_doc 覆盖、各节点带 id 的服务 schema。
    ///
    /// - service：id = svc-hr，remote_doc = true
    /// - department（id = res-department，无 remote_doc 覆盖）：
    ///   list（id = m-list，无覆盖，alias /hr/search）→ true；
    ///   local（id = m-local，false）→ false
    /// - plain（id = res-plain，false）：ping（id = m-ping）→ false；
    ///   remote（id = m-remote，true）→ true
    fn remote_doc_schema() -> ServiceSchema {
        serde_json::from_str(
            r#"{
            "id": "svc-hr",
            "base_url": "https://x.com",
            "remote_doc": true,
            "resources": {
                "department": {
                    "id": "res-department",
                    "methods": {
                        "list": {
                            "id": "m-list",
                            "path": "/list",
                            "http_method": "GET",
                            "path_alias": ["/hr/search"]
                        },
                        "local": {
                            "id": "m-local",
                            "path": "/local",
                            "http_method": "GET",
                            "remote_doc": false
                        }
                    }
                },
                "plain": {
                    "id": "res-plain",
                    "remote_doc": false,
                    "methods": {
                        "ping": { "id": "m-ping", "path": "/ping", "http_method": "GET" },
                        "remote": {
                            "id": "m-remote",
                            "path": "/remote",
                            "http_method": "GET",
                            "remote_doc": true
                        }
                    }
                }
            }
        }"#,
        )
        .unwrap()
    }

    /// P0：[resolve_node] service 根节点返回 service 的 id
    /// 条件：segs 为空，service 声明 remote_doc=true 且带 id
    /// 断言：返回 Some("svc-hr")
    #[test]
    fn resolve_node_service_root() {
        let schema = remote_doc_schema();
        assert_eq!(resolve_remote_doc_id(&schema, &[]), Some("svc-hr"));
    }

    /// P0：[resolve_node] method 未覆盖时继承 service 级 true，id 取 method 自身
    /// 条件：department.list 未声明 remote_doc，service 为 true
    /// 断言：返回 Some("m-list")
    #[test]
    fn resolve_node_method_inherits_service_level() {
        let schema = remote_doc_schema();
        assert_eq!(
            resolve_remote_doc_id(&schema, &["department", "list"]),
            Some("m-list")
        );
    }

    /// P0：[resolve_node] resource 声明 remote_doc=false 时返回 None
    /// 条件：plain 声明 remote_doc = false（即使带 id）
    /// 断言：返回 None（回退本地渲染）
    #[test]
    fn resolve_node_resource_level() {
        let schema = remote_doc_schema();
        assert_eq!(resolve_remote_doc_id(&schema, &["plain"]), None);
    }

    /// P1：[resolve_node] 就近覆盖：method true 压 resource false；method false 压 service true
    /// 条件：plain.remote 声明 true；department.local 声明 false
    /// 断言：plain.remote → Some("m-remote")；department.local → None
    #[test]
    fn resolve_node_nearest_override_wins() {
        let schema = remote_doc_schema();
        assert_eq!(
            resolve_remote_doc_id(&schema, &["plain", "remote"]),
            Some("m-remote")
        );
        assert_eq!(
            resolve_remote_doc_id(&schema, &["department", "local"]),
            None
        );
    }

    /// P1：[resolve_node] 未命中节点的路径返回 None
    /// 条件：路径段为 helper（+download）/ 拼写错误（nope）/ method 后接更深段
    /// 断言：均返回 None
    #[test]
    fn resolve_node_unknown_path_returns_none() {
        let schema = remote_doc_schema();
        assert_eq!(resolve_remote_doc_id(&schema, &["+download"]), None);
        assert_eq!(resolve_remote_doc_id(&schema, &["nope"]), None);
        assert_eq!(
            resolve_remote_doc_id(&schema, &["department", "list", "deeper"]),
            None
        );
    }

    /// P1：[resolve_node] 各层缺省 remote_doc 时返回 None
    /// 条件：schema 不含任何 remote_doc 声明
    /// 断言：service 与 method 节点均返回 None
    #[test]
    fn resolve_node_defaults() {
        let schema: ServiceSchema = serde_json::from_str(
            r#"{
                "base_url": "https://x.com",
                "methods": { "ping": { "path": "/ping", "http_method": "GET" } }
            }"#,
        )
        .unwrap();
        assert_eq!(resolve_remote_doc_id(&schema, &[]), None);
        assert_eq!(resolve_remote_doc_id(&schema, &["ping"]), None);
    }

    /// P1：[resolve_node] remote_doc=true 但节点缺 id 时按未配置处理
    /// 条件：service 声明 remote_doc=true，service 与各节点均无 id
    /// 断言：service / method 节点均返回 None（回退本地渲染，不报错）
    #[test]
    fn resolve_node_missing_id_treated_as_unconfigured() {
        let schema: ServiceSchema = serde_json::from_str(
            r#"{
                "base_url": "https://x.com",
                "remote_doc": true,
                "methods": { "ping": { "path": "/ping", "http_method": "GET" } }
            }"#,
        )
        .unwrap();
        assert_eq!(resolve_remote_doc_id(&schema, &[]), None);
        assert_eq!(resolve_remote_doc_id(&schema, &["ping"]), None);
    }

    /// P0：[resolve_help_node] alias 路径解析到真实方法节点
    /// 条件：department.list 声明 alias /hr/search
    /// 断言：segs=["search"] 返回 Some("m-list")
    #[test]
    fn resolve_help_node_resolves_alias() {
        let schema = remote_doc_schema();
        assert_eq!(
            resolve_remote_doc_id_with_alias(&schema, "hr", &["search"]),
            Some("m-list")
        );
    }

    /// P1：[resolve_help_node] helper 路径与未知路径不命中节点
    /// 条件：路径段为 +download / nope
    /// 断言：均返回 None
    #[test]
    fn resolve_help_node_unknown_paths_return_none() {
        let schema = remote_doc_schema();
        assert_eq!(
            resolve_remote_doc_id_with_alias(&schema, "hr", &["+download"]),
            None
        );
        assert_eq!(
            resolve_remote_doc_id_with_alias(&schema, "hr", &["nope"]),
            None
        );
    }

    /// P0：[RemoteDocResponse] 反序列化固定形状 {"doc": string}
    /// 条件：JSON 含 doc 字段（附带多余字段）
    /// 断言：doc 取值为对应文本，多余字段被忽略
    #[test]
    fn response_deserializes_doc_field() {
        let resp: RemoteDocResponse =
            serde_json::from_value(serde_json::json!({ "doc": "remote text", "extra": 1 }))
                .unwrap();
        assert_eq!(resp.doc, "remote text");
    }

    /// P1：[RemoteDocResponse] 缺少 doc 字段时反序列化失败
    /// 条件：JSON = {"text": "x"} / 纯字符串 / 数字
    /// 断言：三种形状均反序列化报错
    #[test]
    fn response_rejects_invalid_shapes() {
        assert!(
            serde_json::from_value::<RemoteDocResponse>(serde_json::json!({ "text": "x" }))
                .is_err()
        );
        assert!(serde_json::from_value::<RemoteDocResponse>(serde_json::json!("text")).is_err());
        assert!(serde_json::from_value::<RemoteDocResponse>(serde_json::json!(42)).is_err());
    }

    // ── fetch_remote_doc ──

    /// 测试夹具：固定返回指定 result 的后端（模拟 remote_doc endpoint 应答）。
    #[derive(Debug)]
    struct StaticBackend {
        result: serde_json::Value,
    }

    impl wecom_transport::TransportBackend for StaticBackend {
        fn execute<'a>(
            &'a self,
            _endpoint: std::borrow::Cow<'a, wecom_transport::Endpoint>,
            _payload: wecom_transport::HttpRequestPayload,
            _options: wecom_transport::RequestOptions,
        ) -> std::pin::Pin<
            Box<
                dyn std::future::Future<
                        Output = std::result::Result<
                            wecom_transport::TransportResponse,
                            wecom_transport::Error,
                        >,
                    > + Send
                    + 'a,
            >,
        > {
            let result = self.result.clone();
            Box::pin(async move {
                Ok(wecom_transport::TransportResponse::Json(
                    wecom_transport::ExecuteOutput {
                        result,
                        extra: indexmap::IndexMap::new(),
                    },
                ))
            })
        }
    }

    /// 测试夹具：以 StaticBackend 为 transport 的隔离 client（leaked tempdir 作 home）。
    fn build_static_client(result: serde_json::Value) -> crate::Client {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().to_path_buf();
        std::mem::forget(tmp);
        crate::Client::builder()
            .config_dir(&root)
            .transport(
                wecom_transport::TransportBuilder::new(StaticBackend { result })
                    .build()
                    .unwrap(),
            )
            .build()
            .unwrap()
    }

    /// P0：[fetch_remote_doc] 远端返回合法 {"doc": ...} 时透出文档文本
    /// 条件：后端 result = {"doc": "REMOTE-TEXT"}
    /// 断言：返回 Ok("REMOTE-TEXT")
    #[tokio::test]
    async fn fetch_remote_doc_returns_doc_text() {
        let client = build_static_client(serde_json::json!({ "doc": "REMOTE-TEXT" }));
        let run = client.run(vec!["wecom".into()]);
        let doc = fetch_remote_doc(&run, "m-list", "help").await.unwrap();
        assert_eq!(doc, "REMOTE-TEXT");
    }

    /// P1：[fetch_remote_doc] 响应 result 形状不符时报 Parse 错误
    /// 条件：后端 result = {"text": "x"}（缺 doc 字段）
    /// 断言：错误经 Wrapped 透传 transport Parse 的结构化 JSON（type=ParseError，
    ///       endpoint="remote_doc"）——以能力断言替代 downcast，避免不可覆盖的
    ///       let-else panic 分支
    #[tokio::test]
    async fn fetch_remote_doc_rejects_malformed_result() {
        let client = build_static_client(serde_json::json!({ "text": "x" }));
        let run = client.run(vec!["wecom".into()]);
        let err = fetch_remote_doc(&run, "m-list", "help").await.unwrap_err();
        let json = err.to_json();
        assert_eq!(json["error"]["type"], "ParseError");
        assert_eq!(json["error"]["endpoint"], "remote_doc");
    }

    /// 测试夹具：固定返回 transport 错误的后端（模拟 wire 层失败）。
    #[derive(Debug)]
    struct FailingBackend;

    impl wecom_transport::TransportBackend for FailingBackend {
        fn execute<'a>(
            &'a self,
            _endpoint: std::borrow::Cow<'a, wecom_transport::Endpoint>,
            _payload: wecom_transport::HttpRequestPayload,
            _options: wecom_transport::RequestOptions,
        ) -> std::pin::Pin<
            Box<
                dyn std::future::Future<
                        Output = std::result::Result<
                            wecom_transport::TransportResponse,
                            wecom_transport::Error,
                        >,
                    > + Send
                    + 'a,
            >,
        > {
            Box::pin(async { Err(wecom_transport::Error::other("backend boom".into())) })
        }
    }

    /// P1：[fetch_remote_doc] wire 请求失败时透传 transport 错误
    /// 条件：后端 execute 返回 Err(Error::Other)
    /// 断言：返回 Err(Error::Wrapped(_))，message() 含 "backend boom"
    #[tokio::test]
    async fn fetch_remote_doc_propagates_backend_error() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().to_path_buf();
        std::mem::forget(tmp);
        let client = crate::Client::builder()
            .config_dir(&root)
            .transport(
                wecom_transport::TransportBuilder::new(FailingBackend)
                    .build()
                    .unwrap(),
            )
            .build()
            .unwrap();
        let run = client.run(vec!["wecom".into()]);
        let err = fetch_remote_doc(&run, "m-list", "help").await.unwrap_err();
        match err {
            crate::Error::Wrapped(inner) => {
                assert!(
                    inner.message().contains("backend boom"),
                    "expect backend error: {inner}"
                );
            }
            other => panic!("expect Wrapped, got {other:?}"),
        }
    }
}
