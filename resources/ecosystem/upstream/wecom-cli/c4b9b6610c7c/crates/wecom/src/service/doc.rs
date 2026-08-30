use std::fmt::Write;

use clap::builder::StyledStr;

use super::{MethodSchemaInfo, output};
use crate::registry::*;
use crate::service::schema_util;
use crate::{directive, schema};

/// ANSI bold + underline style for section headings.
const HEADING: anstyle::Style = anstyle::Style::new().bold().underline();

pub(super) fn gen_service_doc(
    bin_name: &str,
    name: &str,
    schema: &ServiceSchema,
    heading_level: usize,
) -> StyledStr {
    let mut out = StyledStr::new();

    let h1 = "#".repeat(heading_level);
    let h2 = "#".repeat(heading_level + 1);

    let _ = write!(out, "{h1} Service - {HEADING}{name}{HEADING:#}");

    if let Some(desc) = &schema.description {
        let _ = write!(out, "\n\n{desc}");
    }

    let _ = write!(
        out,
        "\n\n{h2} {HEADING}Usage{HEADING:#}\n\n```bash\n{} {} [resource] <method> [options]\n```",
        bin_name, name
    );

    let mut tree = vec![];
    gen_resource_tree(&mut tree, &schema.resource_tree, 0);
    if !tree.is_empty() {
        let _ = write!(
            out,
            "\n\n{h2} {HEADING}Resource Tree{HEADING:#}\n\n{}",
            tree.join("\n")
        );
    }

    let schemas = schema.schemas.keys().cloned().collect::<Vec<String>>();
    let decls = schema::schema_decls(&schema.schemas, schemas);
    if !decls.is_empty() {
        let _ = write!(
            out,
            "\n\n{h2} {HEADING}Declarations{HEADING:#}\n\n```ts\n{}\n```",
            decls.join("\n\n")
        );
    }

    out
}

pub(super) fn gen_schema_doc(
    path: &[&str],
    schema: &ServiceSchema,
    method: &MethodSchema,
) -> MethodSchemaInfo {
    let is_download = schema_util::resolve_schema_ref(&schema.schemas, &method.response)
        .as_ref()
        .map(|s| directive::check_has_octet_stream(&schema.schemas, s))
        == Some(true);

    let (response, schemas) = if is_download {
        // Replace the original response schema with the built-in download result.
        let schemas = schema_util::resolve_schema_refs(&schema.schemas, &method.request, &None);
        let mut schemas = serde_json::to_value(&schemas).unwrap_or_default();
        if let Some(map) = schemas.as_object_mut() {
            map.insert(
                "WeComCliDownloadRes".to_string(),
                output::DownloadResult::json_schema(),
            );
        }
        (
            serde_json::json!({ "$ref": "WeComCliDownloadRes" }),
            schemas,
        )
    } else {
        (
            serde_json::to_value(&method.response).unwrap_or_default(),
            serde_json::to_value(schema_util::resolve_schema_refs(
                &schema.schemas,
                &method.request,
                &method.response,
            ))
            .unwrap_or_default(),
        )
    };

    MethodSchemaInfo {
        method: path.join("."),
        description: method.description.clone(),
        request: serde_json::to_value(&method.request).ok(),
        response,
        schemas,
    }
}

pub(super) fn gen_method_doc(
    bin_name: &str,
    path: &[&str],
    schema: &ServiceSchema,
    method: &MethodSchema,
) -> StyledStr {
    let mut out = StyledStr::new();

    let joined = path.join(".");
    let _ = write!(out, "# Method - {HEADING}{joined}{HEADING:#}");

    if let Some(desc) = &method.description {
        let _ = write!(out, "\n\n{desc}");
    }

    let mut usage = format!("{bin_name} {}", path.join(" "));
    if method.request.is_some() {
        usage.push_str(" --json <request_body>");
    }
    let _ = write!(
        out,
        "\n\n## {HEADING}Usage{HEADING:#}\n\n```bash\n{usage}\n```"
    );

    if let Some(ts) = gen_method_ts(schema, method) {
        let _ = write!(
            out,
            "\n\n## {HEADING}Declarations{HEADING:#}\n\n```ts\n{ts}\n```"
        );
    }

    out
}

pub(super) fn gen_method_ts(schema: &ServiceSchema, method: &MethodSchema) -> Option<String> {
    let mut exports = vec![];
    let mut refs = vec![];

    // Collect request schema reference
    if let Some(name) = method.request.as_ref().and_then(|r| r.schema_ref.as_ref()) {
        exports.push(format!("  {} as RequestBody,", name));
        refs.push(name.clone());
    }

    // Check if the response is an octet-stream (file download)
    let is_download = schema_util::resolve_schema_ref(&schema.schemas, &method.response)
        .as_ref()
        .map(|s| directive::check_has_octet_stream(&schema.schemas, s))
        == Some(true);

    // Collect response schema reference (or use download result type)
    if is_download {
        exports.push("  WeComCliDownloadRes as Response,".to_string());
    } else if let Some(name) = method.response.as_ref().and_then(|r| r.schema_ref.as_ref()) {
        exports.push(format!("  {} as Response,", name));
        refs.push(name.clone());
    }

    if exports.is_empty() {
        return None;
    }

    // Generate TypeScript declarations for all referenced schemas
    let mut decls = schema::schema_decls(&schema.schemas, refs);

    // Append built-in download result interface when response is octet-stream
    if is_download {
        decls.push(output::DownloadResult::ts_doc());
    }

    // Prepend the export block
    decls.insert(0, format!("export {{\n{}\n}};", exports.join("\n")));

    Some(decls.join("\n\n"))
}

fn gen_resource_tree(tree: &mut Vec<String>, resource: &ServiceResource, indent_level: usize) {
    let indent = "  ".repeat(indent_level);
    for (name, method) in resource.methods.iter() {
        let req = method
            .request
            .as_ref()
            .and_then(|r| r.schema_ref.as_ref())
            .map_or(String::new(), |name| format!("req: {name}"));
        let res = method
            .response
            .as_ref()
            .and_then(|r| r.schema_ref.as_ref())
            .map_or("unknown", |name| name.as_str());
        let mut decl = format!("`{name}({req}): {res}`");
        if let Some(desc) = &method.description {
            decl.push_str(&format!(": {}", desc));
        }
        tree.push(format!("{}- {}", indent, decl));
    }
    for (name, resource) in resource.resources.iter() {
        tree.push(format!("{}- {}", indent, name));
        gen_resource_tree(tree, resource, indent_level + 1);
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：doc（文档与 TypeScript 生成）
    //!
    //! ### 关键接口
    //! - [gen_service_doc] — 生成服务级 Markdown 文档
    //! - [gen_method_doc] — 生成方法级 Markdown 文档
    //! - [gen_schema_doc] — 生成 MethodSchemaInfo（含 octet-stream 下载替换）
    //! - [gen_method_ts] — 生成方法 TypeScript 声明
    //!
    //! ### 关键分支与异常路径
    //! - response 为 octet-stream → 替换为内置 DownloadResult schema
    //! - 无 request/response 引用 → gen_method_ts 返回 None
    //! - StyledStr::Display → strip ANSI；StyledStr::ansi() → 保留 ANSI
    //!
    //! ### 上下游交互
    //! - 上游：[ServiceHandle::doc]/[ServiceHandle::schema]、[MethodHandle::doc]/[MethodHandle::schema]/[MethodHandle::ts_declarations] 调用本模块
    //! - 下游：依赖 [schema::schema_decls] 做 TypeScript 依赖图展开与转换；
    //!   下载响应形状来自 [output::DownloadResult] 派生的 ts_doc / json_schema

    use std::sync::Arc;

    use indexmap::IndexMap;

    use super::*;
    use crate::registry::{MethodSchema, SchemaRef, ServiceResource, ServiceSchema};

    fn make_simple_service_schema() -> ServiceSchema {
        let mut methods = IndexMap::new();
        methods.insert(
            "list".to_string(),
            MethodSchema {
                path: "/department/list".to_string(),
                http_method: "POST".to_string(),
                path_alias: None,
                description: Some("List departments".to_string()),
                request: Some(SchemaRef {
                    schema_ref: Some("DeptListReq".to_string()),
                }),
                response: Some(SchemaRef {
                    schema_ref: Some("DeptListRes".to_string()),
                }),
                ..Default::default()
            },
        );
        methods.insert(
            "create".to_string(),
            MethodSchema {
                path: "/department/create".to_string(),
                http_method: "POST".to_string(),
                path_alias: None,
                description: None,
                request: None,
                response: None,
                ..Default::default()
            },
        );

        let mut schemas = IndexMap::new();
        schemas.insert(
            "DeptListReq".to_string(),
            crate::schema::JsonSchema {
                schema_type: Some("object".to_string()),
                properties: {
                    let mut props = IndexMap::new();
                    props.insert(
                        "id".to_string(),
                        Arc::new(crate::schema::JsonSchema {
                            schema_type: Some("string".to_string()),
                            ..Default::default()
                        }),
                    );
                    props
                },
                ..Default::default()
            },
        );
        schemas.insert(
            "DeptListRes".to_string(),
            crate::schema::JsonSchema {
                schema_type: Some("object".to_string()),
                ..Default::default()
            },
        );

        ServiceSchema {
            id: None,
            base_url: Some("https://api.example.com".to_string()),
            description: Some("HR service".to_string()),
            skills: vec![],
            remote_doc: None,
            schemas,
            resource_tree: ServiceResource {
                methods,
                resources: IndexMap::new(),
                ..Default::default()
            },
        }
    }

    // ── gen_service_doc ──

    /// P0：gen_service_doc 生成基本服务文档
    /// 条件：使用简单服务 schema，heading_level=1
    /// 断言：纯文本输出包含服务名、描述、Usage 和 Resource Tree 段落
    #[test]
    fn gen_service_doc_basic() {
        let schema = make_simple_service_schema();
        let doc = gen_service_doc("wecom", "hr", &schema, 1).to_string();

        assert!(doc.contains("# Service - hr"));
        assert!(doc.contains("HR service"));
        assert!(doc.contains("Usage"));
        assert!(doc.contains("Resource Tree"));
    }

    /// P1：gen_service_doc 返回的 StyledStr 包含 ANSI 转义码
    /// 条件：调用 .ansi() 渲染
    /// 断言：文档中包含 ANSI 转义序列（bold + underline）
    #[test]
    fn gen_service_doc_with_color() {
        let schema = make_simple_service_schema();
        let doc = gen_service_doc("wecom", "hr", &schema, 1)
            .ansi()
            .to_string();

        // Should contain ANSI escape codes (bold and underline)
        assert!(
            doc.contains("\x1b["),
            "expected ANSI escape codes in: {doc}"
        );
        // Reset sequence
        assert!(doc.contains("\x1b[0m") || doc.contains("\x1b["));
    }

    /// P1：gen_service_doc 根据 heading_level 生成不同级别的标题
    /// 条件：heading_level=2
    /// 断言：服务标题为 ##，Usage 为 ###
    #[test]
    fn gen_service_doc_heading_level() {
        let schema = make_simple_service_schema();
        let doc = gen_service_doc("wecom", "hr", &schema, 2).to_string();
        assert!(doc.contains("## Service - hr"));
        assert!(doc.contains("### Usage"));
    }

    // ── gen_method_doc ──

    /// P0：gen_method_doc 对有 request schema 的方法生成完整文档
    /// 条件：方法有 request schema（"list" 方法）
    /// 断言：纯文本输出包含方法路径、描述、--json 标记和 Declarations 段落
    #[test]
    fn gen_method_doc_with_request() {
        let schema = make_simple_service_schema();
        let method = schema.resource_tree.methods.get("list").unwrap();

        let doc =
            gen_method_doc("wecom", &["hr", "department", "list"], &schema, method).to_string();

        assert!(doc.contains("# Method - hr.department.list"));
        assert!(doc.contains("List departments"));
        assert!(doc.contains("--json"));
        assert!(doc.contains("Declarations"));
    }

    /// P1：gen_method_doc 对无 request schema 的方法生成不含 --json 的文档
    /// 条件：方法无 request schema（"create" 方法）
    /// 断言：包含方法路径但不包含 --json 标记
    #[test]
    fn gen_method_doc_without_request() {
        let schema = make_simple_service_schema();
        let method = schema.resource_tree.methods.get("create").unwrap();

        let doc =
            gen_method_doc("wecom", &["hr", "department", "create"], &schema, method).to_string();

        assert!(doc.contains("# Method - hr.department.create"));
        assert!(!doc.contains("--json"));
    }

    // ── gen_schema_doc ──

    /// P0：gen_schema_doc 返回正确的 MethodSchemaInfo 结构
    /// 条件：使用 "list" 方法（有 request/response schema）
    /// 断言：method 为 "department.list"，有 description，request 存在，schemas 为对象
    #[test]
    fn gen_schema_doc_returns_method_schema_info() {
        let schema = make_simple_service_schema();
        let method = schema.resource_tree.methods.get("list").unwrap();

        let info = gen_schema_doc(&["department", "list"], &schema, method);

        assert_eq!(info.method, "department.list");
        assert_eq!(info.description.as_deref(), Some("List departments"));
        assert!(info.request.is_some());
        assert!(info.schemas.is_object());
    }

    // ── gen_method_ts ──

    /// P0：gen_method_ts 对有 schema 引用的方法生成 TypeScript 声明
    /// 条件：方法有 request 和 response schema 引用（"list" 方法）
    /// 断言：返回 Some，包含 export、RequestBody 和 Response
    #[test]
    fn gen_method_ts_with_refs() {
        let schema = make_simple_service_schema();
        let method = schema.resource_tree.methods.get("list").unwrap();

        let ts = gen_method_ts(&schema, method);
        assert!(ts.is_some());
        let ts = ts.unwrap();
        assert!(ts.contains("export {"));
        assert!(ts.contains("RequestBody"));
        assert!(ts.contains("Response"));
    }

    /// P1：gen_method_ts 对无 schema 引用的方法返回 None
    /// 条件：方法无 request 和 response schema（"create" 方法）
    /// 断言：返回 None
    #[test]
    fn gen_method_ts_no_refs_returns_none() {
        let schema = make_simple_service_schema();
        let method = schema.resource_tree.methods.get("create").unwrap();

        let ts = gen_method_ts(&schema, method);
        assert!(ts.is_none());
    }

    // ── StyledStr rendering ──

    /// P0：[gen_service_doc] 的 Display（strip ANSI）输出不含转义码
    /// 条件：调用 .to_string()（Display trait）
    /// 断言：输出中不含 \x1b
    #[test]
    fn styled_str_display_strips_ansi() {
        let schema = make_simple_service_schema();
        let plain = gen_service_doc("wecom", "hr", &schema, 1).to_string();
        assert!(!plain.contains("\x1b"));
    }

    /// P0：[gen_service_doc] 的 .ansi() 输出保留转义码
    /// 条件：调用 .ansi().to_string()
    /// 断言：输出中包含 \x1b
    #[test]
    fn styled_str_ansi_preserves_codes() {
        let schema = make_simple_service_schema();
        let colored = gen_service_doc("wecom", "hr", &schema, 1)
            .ansi()
            .to_string();
        assert!(colored.contains("\x1b"));
    }
}
