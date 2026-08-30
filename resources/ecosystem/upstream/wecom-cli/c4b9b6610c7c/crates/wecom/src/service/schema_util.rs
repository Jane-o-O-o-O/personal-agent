use std::collections::HashMap;

use indexmap::IndexMap;

use crate::registry::SchemaRef;
use crate::schema;

pub(super) fn resolve_schema_ref(
    schemas: &IndexMap<String, schema::JsonSchema>,
    schema_ref: &Option<SchemaRef>,
) -> Option<schema::JsonSchema> {
    let Some(schema_ref) = schema_ref else {
        return None;
    };
    let schema_name = schema_ref.schema_ref.as_ref()?;
    schema::resolve_schema(schemas, schema_name)
}

pub(super) fn resolve_schema_refs(
    schemas: &IndexMap<String, schema::JsonSchema>,
    request: &Option<SchemaRef>,
    response: &Option<SchemaRef>,
) -> HashMap<String, schema::JsonSchema> {
    let mut refs = HashMap::new();

    for schema_ref in [request, response].into_iter().flatten() {
        if let Some(name) = &schema_ref.schema_ref {
            collect_schema_refs(schemas, name, &mut refs);
        }
    }

    refs
}

fn collect_schema_refs(
    schemas: &IndexMap<String, schema::JsonSchema>,
    name: &str,
    refs: &mut HashMap<String, schema::JsonSchema>,
) {
    if refs.contains_key(name) {
        return;
    }

    let Some(schema) = schemas.get(name) else {
        return;
    };

    refs.insert(name.to_string(), schema.clone());
    collect_refs_from_schema(schemas, schema, refs);
}

fn collect_refs_from_schema(
    schemas: &IndexMap<String, schema::JsonSchema>,
    schema: &schema::JsonSchema,
    refs: &mut HashMap<String, schema::JsonSchema>,
) {
    if let Some(ref_name) = &schema.schema_ref {
        collect_schema_refs(schemas, ref_name, refs);
    }

    for (_, child) in schema.visible_properties() {
        collect_refs_from_schema(schemas, child.as_ref(), refs);
    }

    for child in &schema.one_of {
        collect_refs_from_schema(schemas, child.as_ref(), refs);
    }

    if let Some(items) = &schema.items {
        collect_refs_from_schema(schemas, items.as_ref(), refs);
    }

    if let Some(schema::AdditionalProperties::Schema(child)) =
        schema.additional_properties.as_deref()
    {
        collect_refs_from_schema(schemas, child.as_ref(), refs);
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：schema_util（Schema 引用解析）
    //!
    //! ### 关键接口
    //! - [resolve_schema_ref] — 根据 $ref 解析单个 schema 定义
    //! - [resolve_schema_refs] — 递归收集所有依赖的 schema 定义
    //!
    //! ### 关键分支与异常路径
    //! - schema_ref 为 None → 返回 None
    //! - SchemaRef 内部 schema_ref 为 None → 返回 None
    //! - 引用的 name 不在 schemas 中 → 返回 None
    //! - 循环引用（A→B→A）→ 安全处理不无限循环
    //!
    //! ### 上下游交互
    //! - 上游：[MethodHandle::request_schema]、[doc::gen_schema_doc] 调用 resolve_schema_ref/refs
    //! - 下游：依赖 [schema::resolve_schema] 做实际的 schema 名称查找

    use super::*;
    use crate::registry::SchemaRef;

    fn make_schemas() -> IndexMap<String, schema::JsonSchema> {
        let mut schemas = IndexMap::new();
        schemas.insert(
            "Req".to_string(),
            schema::JsonSchema {
                schema_type: Some("object".to_string()),
                properties: {
                    let mut m = IndexMap::new();
                    m.insert(
                        "nested".to_string(),
                        std::sync::Arc::new(schema::JsonSchema {
                            schema_ref: Some("Nested".to_string()),
                            ..Default::default()
                        }),
                    );
                    m
                },
                ..Default::default()
            },
        );
        schemas.insert(
            "Nested".to_string(),
            schema::JsonSchema {
                schema_type: Some("object".to_string()),
                ..Default::default()
            },
        );
        schemas.insert(
            "Res".to_string(),
            schema::JsonSchema {
                schema_type: Some("object".to_string()),
                ..Default::default()
            },
        );
        schemas
    }

    // ── resolve_schema_ref ──

    /// P1：resolve_schema_ref 对 None 引用返回 None
    /// 条件：传入 &None
    /// 断言：返回 None
    /// P1：resolve_schema_ref 对 None 输入返回 None
    /// 条件：schema_ref 为 None
    /// 断言：返回 None
    #[test]
    fn resolve_none_ref() {
        let schemas = make_schemas();
        assert!(resolve_schema_ref(&schemas, &None).is_none());
    }

    /// P1：resolve_schema_ref 对 schema_ref 为 None 的 SchemaRef 返回 None
    /// 条件：SchemaRef 存在但 schema_ref 字段为 None
    /// 断言：返回 None
    /// P1：SchemaRef 内部 schema_ref 为 None 时返回 None
    /// 条件：SchemaRef { schema_ref: None }
    /// 断言：resolve_schema_ref 返回 None
    #[test]
    fn resolve_ref_with_no_schema_ref() {
        let schemas = make_schemas();
        let sr = Some(SchemaRef { schema_ref: None });
        assert!(resolve_schema_ref(&schemas, &sr).is_none());
    }

    /// P0：resolve_schema_ref 成功解析已注册的 schema 引用
    /// 条件：引用名为 "Req" 的 schema
    /// 断言：返回 Some，schema_type 为 "object"
    /// P0：resolve_schema_ref 找到匹配 schema
    /// 条件：schemas 中有 "Req" 定义，schema_ref 引用 "Req"
    /// 断言：返回 Some(schema)，type 为 object
    #[test]
    fn resolve_ref_found() {
        let schemas = make_schemas();
        let sr = Some(SchemaRef {
            schema_ref: Some("Req".to_string()),
        });
        let result = resolve_schema_ref(&schemas, &sr);
        assert!(result.is_some());
        assert_eq!(result.unwrap().schema_type.as_deref(), Some("object"));
    }

    /// P1：resolve_schema_ref 对不存在的 schema 引用返回 None
    /// 条件：引用名为 "Unknown" 的 schema（未注册）
    /// 断言：返回 None
    /// P1：resolve_schema_ref 对不存在的引用返回 None
    /// 条件：schema_ref 引用 "Unknown"（不在 schemas 中）
    /// 断言：返回 None
    #[test]
    fn resolve_ref_not_found() {
        let schemas = make_schemas();
        let sr = Some(SchemaRef {
            schema_ref: Some("Unknown".to_string()),
        });
        assert!(resolve_schema_ref(&schemas, &sr).is_none());
    }

    // ── resolve_schema_refs ──

    /// P0：resolve_schema_refs 递归收集所有依赖 schema
    /// 条件：request 引用 Req，Req 内嵌套引用 Nested；response 引用 Res
    /// 断言：结果包含 Req、Res 和 Nested
    /// P0：resolve_schema_refs 递归收集所有引用的 schema（含嵌套引用）
    /// 条件：request 引用 "Req"（内部引用 "Nested"），response 引用 "Res"
    /// 断言：结果包含 "Req"、"Res"、"Nested" 三者
    #[test]
    fn resolve_schema_refs_collects_all() {
        let schemas = make_schemas();
        let req = Some(SchemaRef {
            schema_ref: Some("Req".to_string()),
        });
        let res = Some(SchemaRef {
            schema_ref: Some("Res".to_string()),
        });
        let refs = resolve_schema_refs(&schemas, &req, &res);

        assert!(refs.contains_key("Req"));
        assert!(refs.contains_key("Res"));
        // "Nested" is referenced from within "Req"
        assert!(refs.contains_key("Nested"));
    }

    /// P1：request/response 均为 None 时返回空 map
    /// 条件：request=None, response=None
    /// 断言：resolve_schema_refs 返回空 HashMap
    /// P1：resolve_schema_refs 在 request 和 response 均为 None 时返回空集合
    /// 条件：request 和 response 都传入 &None
    /// 断言：返回空的 HashMap
    #[test]
    fn resolve_schema_refs_with_nones() {
        let schemas = make_schemas();
        let refs = resolve_schema_refs(&schemas, &None, &None);
        assert!(refs.is_empty());
    }

    /// P2：resolve_schema_refs 安全处理循环引用而不无限循环
    /// 条件："A" 引用 "B"，"B" 又引用 "A" 形成循环
    /// 断言：正确返回包含 "A" 和 "B" 的结果，不会死循环
    #[test]
    fn resolve_schema_refs_handles_circular_safely() {
        let mut schemas = IndexMap::new();
        schemas.insert(
            "A".to_string(),
            schema::JsonSchema {
                schema_type: Some("object".to_string()),
                properties: {
                    let mut m = IndexMap::new();
                    m.insert(
                        "b".to_string(),
                        std::sync::Arc::new(schema::JsonSchema {
                            schema_ref: Some("B".to_string()),
                            ..Default::default()
                        }),
                    );
                    m
                },
                ..Default::default()
            },
        );
        schemas.insert(
            "B".to_string(),
            schema::JsonSchema {
                schema_type: Some("object".to_string()),
                properties: {
                    let mut m = IndexMap::new();
                    m.insert(
                        "a".to_string(),
                        std::sync::Arc::new(schema::JsonSchema {
                            schema_ref: Some("A".to_string()),
                            ..Default::default()
                        }),
                    );
                    m
                },
                ..Default::default()
            },
        );

        let req = Some(SchemaRef {
            schema_ref: Some("A".to_string()),
        });
        // Should not infinite loop
        let refs = resolve_schema_refs(&schemas, &req, &None);
        assert!(refs.contains_key("A"));
        assert!(refs.contains_key("B"));
    }
}
