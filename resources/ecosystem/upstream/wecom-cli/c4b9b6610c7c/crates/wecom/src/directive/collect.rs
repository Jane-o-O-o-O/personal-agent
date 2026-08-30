use std::path::Path;

use indexmap::IndexMap;

use super::types::*;
use crate::fs;
use crate::json_path::PathSegment;
use crate::schema::*;
use crate::telemetry::contract::unknown_directive;

#[derive(Debug)]
struct WalkCtx<'a> {
    schemas: &'a IndexMap<String, JsonSchema>,
    cwd: &'a Path,
    directives: Vec<Directive<'a>>,
    unknown_directives: Vec<String>,
}

impl<'a> WalkCtx<'a> {
    fn new(schemas: &'a IndexMap<String, JsonSchema>, cwd: &'a Path) -> Self {
        Self {
            schemas,
            cwd,
            directives: vec![],
            unknown_directives: vec![],
        }
    }

    fn child_key(path: &[PathSegment], key: &str) -> Vec<PathSegment> {
        let mut p = path.to_vec();
        p.push(PathSegment::Key(key.to_string()));
        p
    }

    fn child_index(path: &[PathSegment], index: usize) -> Vec<PathSegment> {
        let mut p = path.to_vec();
        p.push(PathSegment::Index(index));
        p
    }
}

/// Traverse schema + data and collect all directives (file upload, file save, …).
///
/// After the walk, emits a single aggregated `INFO` tracing event for any
/// unknown `x-wecom-*` directive names discovered, via the
/// [`unknown_directive`] wire contract.
pub fn collect_directives<'a>(
    schemas: &'a IndexMap<String, JsonSchema>,
    schema: &'a JsonSchema,
    data: &serde_json::Value,
    cwd: &'a Path,
) -> Vec<Directive<'a>> {
    let mut ctx = WalkCtx::new(schemas, cwd);
    walk_node(&mut ctx, &[], schema, data);

    // Emit a single aggregated event with all unique unknown x-wecom-* directives.
    if !ctx.unknown_directives.is_empty() {
        ctx.unknown_directives.sort();
        ctx.unknown_directives.dedup();
        crate::telemetry::emit(
            unknown_directive::KIND,
            &serde_json::json!({ unknown_directive::FIELD_DIRECTIVES: &ctx.unknown_directives }),
        );
    }

    ctx.directives
}

fn value_type_matches_schema(value: &serde_json::Value, schema_type: &str) -> bool {
    match value {
        serde_json::Value::String(_) => schema_type == "string",
        serde_json::Value::Array(_) => schema_type == "array",
        serde_json::Value::Object(_) => schema_type == "object",
        serde_json::Value::Number(_) => schema_type == "number" || schema_type == "integer",
        serde_json::Value::Bool(_) => schema_type == "boolean",
        serde_json::Value::Null => false,
    }
}

fn walk_node<'a>(
    ctx: &mut WalkCtx<'a>,
    path: &[PathSegment],
    schema: &'a JsonSchema,
    data: &serde_json::Value,
) {
    // Collect unknown x-wecom-* directive names into ctx for per-call
    // aggregated reporting at the end of collect_directives.
    for key in schema.extra.keys().filter(|k| k.starts_with("x-wecom-")) {
        ctx.unknown_directives.push(key.clone());
    }

    // $ref
    if let Some(schema) = schema.schema_ref.as_ref().and_then(|r| ctx.schemas.get(r)) {
        walk_node(ctx, path, schema, data);
    }

    // oneOf
    if !schema.one_of.is_empty() {
        return;
    }

    // enum
    if !schema.enum_values.is_empty() {
        return;
    }

    let Some(schema_type) = &schema.schema_type else {
        return;
    };

    // ── single-item array ↔ value equivalence ──
    //
    // Unwrap: data 是单元素数组且元素类型匹配 schema 类型 → 脱壳，path += [0]
    // 仅对叶子类型生效（string/object/number/boolean）。array schema 的数组层是结构性的，
    // 由 walk_array 自行迭代到底层后由子节点处理。
    if schema_type != "array"
        && let Some(arr) = data.as_array()
        && arr.len() == 1
    {
        let elem = &arr[0];
        if value_type_matches_schema(elem, schema_type) {
            let idx_path = WalkCtx::child_index(path, 0);
            return walk_node(ctx, &idx_path, schema, elem);
        }
    }

    // Wrap: schema 期望 array，data 不是数组但类型匹配 items → 以 items schema 遍历 data，path 不变
    if schema_type == "array"
        && !data.is_array()
        && let Some(items) = &schema.items
        && let Some(items_type) = &items.schema_type
        && value_type_matches_schema(data, items_type)
    {
        return walk_node(ctx, path, items, data);
    }

    match schema_type.as_str() {
        "string" => walk_string(ctx, path, schema, data),
        "array" => walk_array(ctx, path, schema, data),
        "object" => walk_object(ctx, path, schema, data),
        _ => {}
    }
}

fn walk_string<'a>(
    ctx: &mut WalkCtx<'a>,
    path: &[PathSegment],
    schema: &'a JsonSchema,
    data: &serde_json::Value,
) {
    // x-wecom-file-save: { ... } - 保存成独立文件
    if let Some(options) = &schema.directives.file_save {
        ctx.directives.push(Directive::Save {
            path: path.to_vec(),
            options,
        });
    }

    let Some(data) = data.as_str() else {
        return;
    };

    // x-wecom-file-upload: true / { withFilePath: ... } - 上传本地文件为 media
    if let Some(opts) = &schema.directives.upload_media {
        ctx.directives.push(Directive::UploadMedia {
            path: path.to_vec(),
            file_path: fs::absolutize(ctx.cwd, Path::new(data)),
            with_file_path: opts.with_file_path(),
        });
    }

    // x-wecom-octet-stream: true - 通过 multipart 上传本地文件
    if schema.directives.octet_stream.is_some() {
        ctx.directives.push(Directive::UploadMultipart {
            path: path.to_vec(),
            file_path: fs::absolutize(ctx.cwd, Path::new(data)),
        });
    }
}

fn walk_array<'a>(
    ctx: &mut WalkCtx<'a>,
    path: &[PathSegment],
    schema: &'a JsonSchema,
    data: &serde_json::Value,
) {
    let Some(arr) = data.as_array() else {
        return;
    };

    if let Some(item_schema) = &schema.items {
        for (i, item) in arr.iter().enumerate() {
            let item_path = WalkCtx::child_index(path, i);
            walk_node(ctx, &item_path, item_schema.as_ref(), item);
        }
    }
}

fn walk_object<'a>(
    ctx: &mut WalkCtx<'a>,
    path: &[PathSegment],
    schema: &'a JsonSchema,
    data: &serde_json::Value,
) {
    let Some(obj) = data.as_object() else {
        return;
    };

    // properties
    for (key, prop_schema) in &schema.properties {
        if let Some(value) = obj.get(key) {
            let field_path = WalkCtx::child_key(path, key);
            walk_node(ctx, &field_path, prop_schema.as_ref(), value);
        }
    }

    // additional_properties
    if let Some(AdditionalProperties::Schema(ap_schema)) = schema.additional_properties.as_deref() {
        for key in obj
            .keys()
            .filter(|k| !schema.properties.contains_key(k.as_str()))
        {
            if let Some(value) = obj.get(key) {
                let field_path = WalkCtx::child_key(path, key);
                walk_node(ctx, &field_path, ap_schema.as_ref(), value);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：collect（指令收集器）
    //!
    //! ### 关键接口
    //! - [collect_directives] — 遍历 schema + data，收集所有需要特殊处理的指令
    //!
    //! ### 关键分支与异常路径
    //! - $ref 引用 → 解析到目标 schema 后继续遍历
    //! - oneOf / enum 非空 → 短路返回，不收集子节点指令
    //! - string 类型 + 非字符串数据 → 跳过（不产生指令）
    //! - array 类型 → 遍历 items schema 处理每个元素
    //!
    //! ### 上下游交互
    //! - 上游：HTTP 请求构建前调用本模块收集指令
    //! - 下游：依赖 [types::Directive] 枚举、[schema::JsonSchema] 结构体

    use std::sync::Arc;

    use super::*;

    fn make_schemas() -> IndexMap<String, JsonSchema> {
        IndexMap::new()
    }

    // ── empty / no directives ──

    /// P1：[collect_directives] 空 schema 不产生任何指令
    /// 条件：schema 和 data 均为空对象
    /// 断言：返回的指令列表为空
    #[test]
    fn empty_schema_no_directives() {
        let schemas = make_schemas();
        let schema = JsonSchema::default();
        let data = serde_json::json!({});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert!(directives.is_empty());
    }

    /// P1：[collect_directives] 不含指令标记的 object schema 不产生指令
    /// 条件：object schema 有 string 类型 property 但无指令标记
    /// 断言：返回的指令列表为空
    #[test]
    fn object_schema_without_directives() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "name".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let data = serde_json::json!({"name": "hello"});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert!(directives.is_empty());
    }

    // ── upload_media directive ──

    /// P0：[collect_directives] upload_media 指令被正确收集
    /// 条件：string 类型字段标记了 x-wecom-file-upload: true
    /// 断言：返回一个 UploadMedia 指令，file_path 匹配
    #[test]
    fn upload_media_directive_collected() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "file".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        directives: JsonSchemaWecomDirectives {
                            upload_media: Some(crate::schema::UploadMediaOptions::default()),
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let data = serde_json::json!({"file": "/path/to/file.txt"});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 1);
        assert!(
            matches!(&directives[0], Directive::UploadMedia { file_path, .. } if file_path.as_path() == std::path::Path::new("/path/to/file.txt"))
        );
    }

    // ── octet_stream directive ──

    /// P0：[collect_directives] octet_stream 指令被正确收集
    /// 条件：string 类型字段标记了 x-wecom-octet-stream: true
    /// 断言：返回一个 UploadMultipart 指令
    #[test]
    fn octet_stream_directive_collected() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "media".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        directives: JsonSchemaWecomDirectives {
                            octet_stream: Some(WecomBoolValue::default()),
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let data = serde_json::json!({"media": "/path/to/video.mp4"});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 1);
        assert!(matches!(&directives[0], Directive::UploadMultipart { .. }));
    }

    // ── file_save directive ──

    /// P0：[collect_directives] file_save 指令被正确收集
    /// 条件：string 类型字段标记了 x-wecom-file-save 选项
    /// 断言：返回一个 Save 指令，options.file_name 匹配
    #[test]
    fn file_save_directive_collected() {
        let schemas = make_schemas();
        let save_options = crate::schema::FileSaveOptions {
            file_name: Some("output.csv".to_string()),
            content_encoding: None,
        };
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "data".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        directives: JsonSchemaWecomDirectives {
                            file_save: Some(save_options),
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let data = serde_json::json!({"data": "csv content here"});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 1);
        assert!(
            matches!(&directives[0], Directive::Save { options, .. } if options.file_name.as_deref() == Some("output.csv"))
        );
    }

    /// P0：[collect_directives] file_save 指令在数据为 Object 时仍被收集
    /// 条件：string 类型字段标记了 x-wecom-file-save，但数据值为 Object
    /// 断言：返回一个 Save 指令（不因 data.as_str() 提前返回而遗漏）
    #[test]
    fn file_save_directive_collected_for_non_string_data() {
        let schemas = make_schemas();
        let save_options = crate::schema::FileSaveOptions {
            file_name: Some("output.csv".to_string()),
            content_encoding: None,
        };
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "data".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        directives: JsonSchemaWecomDirectives {
                            file_save: Some(save_options),
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        // 数据值为 Object（file_save 的 payload 格式），不是字符串
        // file_save 的收集不应依赖 data 的类型
        let data =
            serde_json::json!({"data": {"content": "csv content here", "file_name": "result.csv"}});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 1);
        assert!(
            matches!(&directives[0], Directive::Save { options, .. } if options.file_name.as_deref() == Some("output.csv"))
        );
    }

    // ── array walk ──

    /// P1：[collect_directives] 数组遍历时为每个元素收集指令
    /// 条件：array schema 的 items 标记了 upload_media，数据含两个字符串元素
    /// 断言：返回 2 个 UploadMedia 指令
    #[test]
    fn array_items_walk_collects_directives() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("array".to_string()),
            items: Some(Arc::new(JsonSchema {
                schema_type: Some("string".to_string()),
                directives: JsonSchemaWecomDirectives {
                    upload_media: Some(crate::schema::UploadMediaOptions::default()),
                    ..Default::default()
                },
                ..Default::default()
            })),
            ..Default::default()
        };
        let data = serde_json::json!(["/a.txt", "/b.txt"]);
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 2);
    }

    // ── $ref resolution ──

    /// P1：[collect_directives] $ref 引用被正确解析为目标 schema 的指令
    /// 条件：property 通过 $ref 引用含 upload_media 标记的 schema
    /// 断言：返回 1 个 UploadMedia 指令
    #[test]
    fn ref_resolves_to_target_schema() {
        let mut schemas = IndexMap::new();
        schemas.insert(
            "FileField".to_string(),
            JsonSchema {
                schema_type: Some("string".to_string()),
                directives: JsonSchemaWecomDirectives {
                    upload_media: Some(crate::schema::UploadMediaOptions::default()),
                    ..Default::default()
                },
                ..Default::default()
            },
        );

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "media".to_string(),
                    Arc::new(JsonSchema {
                        schema_ref: Some("FileField".to_string()),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let data = serde_json::json!({"media": "/file.bin"});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 1);
    }

    // ── non-string data skipped ──

    /// P1：[collect_directives] 非字符串/非单元素数组数据在 string schema 下被跳过
    /// 条件：字段类型为 number 但 schema 为 string 且标记了 upload_media
    /// 断言：返回的指令列表为空
    #[test]
    fn non_string_data_skipped_for_string_schema() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "file".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        directives: JsonSchemaWecomDirectives {
                            upload_media: Some(crate::schema::UploadMediaOptions::default()),
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        // "file" is a number, not a string — should be skipped
        let data = serde_json::json!({"file": 42});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert!(directives.is_empty());
    }

    /// P1：[collect_directives] string schema 收到 single-item array 时提取字符串
    /// 条件：string schema 标记 upload_media，data 是 ["/a.jpg"]
    /// 断言：成功收集到一个 UploadMedia 指令
    #[test]
    fn single_item_array_extracted_for_string_schema() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "file".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        directives: JsonSchemaWecomDirectives {
                            upload_media: Some(crate::schema::UploadMediaOptions::default()),
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let data = serde_json::json!({"file": ["/a.jpg"]});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 1);
        assert!(
            matches!(&directives[0], Directive::UploadMedia { file_path, .. } if file_path.as_path() == std::path::Path::new("/a.jpg"))
        );
    }

    // ── oneOf / enum short-circuit ──

    /// P1：[collect_directives] oneOf 类型的 schema 会短路跳过指令收集
    /// 条件：schema 包含 oneOf 变体列表
    /// 断言：返回的指令列表为空
    #[test]
    fn one_of_short_circuits() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            one_of: vec![Arc::new(JsonSchema {
                schema_type: Some("string".to_string()),
                ..Default::default()
            })],
            ..Default::default()
        };
        let data = serde_json::json!("test");
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert!(directives.is_empty());
    }

    /// P1：[collect_directives] enum 类型的 schema 会短路跳过指令收集
    /// 条件：schema 包含 enum_values 枚举值
    /// 断言：返回的指令列表为空
    #[test]
    fn enum_short_circuits() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            enum_values: vec![serde_json::json!("a"), serde_json::json!("b")],
            ..Default::default()
        };
        let data = serde_json::json!("a");
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert!(directives.is_empty());
    }

    // ── walk_array 自动纠偏：schema 定义为 array，但 data 是单个 string ──

    /// P0：[collect_directives] array schema 收到单个 string 时自动包装为 [string]
    /// 条件：schema 为 array<string>（items 标记 upload_media），data 是单个字符串
    /// 断言：成功收集到一个 UploadMedia 指令
    #[test]
    fn auto_correct_array_schema_single_string_to_array() {
        let schemas = make_schemas();
        // array schema，items 标记了 upload_media
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "files".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(Arc::new(JsonSchema {
                            schema_type: Some("string".to_string()),
                            directives: JsonSchemaWecomDirectives {
                                upload_media: Some(crate::schema::UploadMediaOptions::default()),
                                ..Default::default()
                            },
                            ..Default::default()
                        })),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        // LLM 误传：单个字符串而非数组
        let data = serde_json::json!({"files": "/path/to/file.jpg"});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 1);
        assert!(
            matches!(&directives[0], Directive::UploadMedia { file_path, .. } if file_path.as_path() == std::path::Path::new("/path/to/file.jpg"))
        );
    }

    /// P1：[collect_directives] array schema 收到单元素数组 [string] 正常遍历，不触发纠偏
    /// 条件：schema 为 array<string>，data 是真正的数组
    /// 断言：成功收集到多个 UploadMedia 指令（不影响原有逻辑）
    #[test]
    fn auto_correct_array_schema_normal_array_unaffected() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "files".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(Arc::new(JsonSchema {
                            schema_type: Some("string".to_string()),
                            directives: JsonSchemaWecomDirectives {
                                upload_media: Some(crate::schema::UploadMediaOptions::default()),
                                ..Default::default()
                            },
                            ..Default::default()
                        })),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        // 正常数组 → 不应被纠偏逻辑影响
        let data = serde_json::json!({"files": ["/a.jpg", "/b.pdf"]});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 2);
    }

    /// P1：[collect_directives] array schema 收到非 string 非 [string] 数据 → 不做纠偏
    /// 条件：schema 为 array<string>，data 是对象
    /// 断言：不产生指令
    #[test]
    fn auto_correct_array_schema_object_not_corrected() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "files".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(Arc::new(JsonSchema {
                            schema_type: Some("string".to_string()),
                            directives: JsonSchemaWecomDirectives {
                                upload_media: Some(crate::schema::UploadMediaOptions::default()),
                                ..Default::default()
                            },
                            ..Default::default()
                        })),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        // 对象不应被转换为 array
        let data = serde_json::json!({"files": {"file_path": "/a.jpg"}});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert!(directives.is_empty());
    }

    // ── 等价转换 path 正确性 ──

    /// P0：[collect_directives] unwrap 时 path 带上 index
    /// 条件：data=[string]，schema=string → 脱壳后 path += [0]
    /// 断言：directive path 包含 Index(0)
    #[test]
    fn unwrap_path_includes_index() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "file".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        directives: JsonSchemaWecomDirectives {
                            upload_media: Some(crate::schema::UploadMediaOptions::default()),
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let data = serde_json::json!({"file": ["/a.jpg"]});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 1);
        let Directive::UploadMedia {
            path, file_path, ..
        } = &directives[0]
        else {
            panic!("expected UploadMedia directive");
        };
        assert_eq!(file_path.as_path(), std::path::Path::new("/a.jpg"));
        assert_eq!(path.len(), 2);
        assert!(matches!(&path[0], PathSegment::Key(k) if k == "file"));
        assert!(matches!(&path[1], PathSegment::Index(0)));
    }

    /// P0：[collect_directives] wrap 时 path 不带 index
    /// 条件：data=string，schema=array<string> → 以 items 遍历 data，path 不变
    /// 断言：directive path 只有 field key，没有 Index(0)
    #[test]
    fn wrap_path_no_index() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "files".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(Arc::new(JsonSchema {
                            schema_type: Some("string".to_string()),
                            directives: JsonSchemaWecomDirectives {
                                upload_media: Some(crate::schema::UploadMediaOptions::default()),
                                ..Default::default()
                            },
                            ..Default::default()
                        })),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let data = serde_json::json!({"files": "/a.jpg"});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 1);
        let Directive::UploadMedia {
            path, file_path, ..
        } = &directives[0]
        else {
            panic!("expected UploadMedia directive");
        };
        assert_eq!(file_path.as_path(), std::path::Path::new("/a.jpg"));
        assert_eq!(path.len(), 1);
        assert!(matches!(&path[0], PathSegment::Key(k) if k == "files"));
    }

    /// P1：[collect_directives] 类型不匹配时不纠偏
    /// 条件：schema=array<string>，data=number（类型不匹配）
    /// 断言：不产生指令
    #[test]
    fn no_correction_on_type_mismatch() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "files".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(Arc::new(JsonSchema {
                            schema_type: Some("string".to_string()),
                            directives: JsonSchemaWecomDirectives {
                                upload_media: Some(crate::schema::UploadMediaOptions::default()),
                                ..Default::default()
                            },
                            ..Default::default()
                        })),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        // number 类型与 string 不匹配 → 不纠偏
        let data = serde_json::json!({"files": 42});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert!(directives.is_empty());
    }

    /// P0：[collect_directives] 二维 array schema 的数组层是结构性的，不应被 unwrap 脱壳
    /// 条件：schema=array<array<string>>，data=[["/a.jpg"]]
    /// 断言：只收集 1 个指令，path=[0][0]
    #[test]
    fn two_dimensional_array_not_unwrapped() {
        let schemas = make_schemas();
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "items".to_string(),
                    Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(Arc::new(JsonSchema {
                            schema_type: Some("array".to_string()),
                            items: Some(Arc::new(JsonSchema {
                                schema_type: Some("string".to_string()),
                                directives: JsonSchemaWecomDirectives {
                                    upload_media: Some(
                                        crate::schema::UploadMediaOptions::default(),
                                    ),
                                    ..Default::default()
                                },
                                ..Default::default()
                            })),
                            ..Default::default()
                        })),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let data = serde_json::json!({"items": [["/a.jpg"]]});
        let directives = collect_directives(&schemas, &schema, &data, Path::new("/"));
        assert_eq!(directives.len(), 1);
        let Directive::UploadMedia {
            path, file_path, ..
        } = &directives[0]
        else {
            panic!("expected UploadMedia directive");
        };
        assert_eq!(file_path.as_path(), std::path::Path::new("/a.jpg"));
        assert_eq!(path.len(), 3);
        assert!(matches!(&path[0], PathSegment::Key(k) if k == "items"));
        assert!(matches!(&path[1], PathSegment::Index(0)));
        assert!(matches!(&path[2], PathSegment::Index(0)));
    }
}
