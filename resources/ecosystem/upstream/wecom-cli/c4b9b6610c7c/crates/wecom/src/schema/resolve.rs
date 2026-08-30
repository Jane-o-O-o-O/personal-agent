use std::collections::HashSet;
use std::sync::Arc;

use indexmap::IndexMap;
use serde_json::Value;

use super::types;

/// 根据 name 在 schemas 中查找对应的 schema，并深层展开所有 `$ref`。
///
/// 展开语义：
/// - 顶层 `$ref`：沿引用链递归到底，从最深层开始逐层向上覆盖
///   等价于 JS 的 `{ ...schema.$ref.$ref, ...schema.$ref, ...schema }`
/// - 嵌套 `$ref`：递归展开 `one_of`、`properties`、`items` 内部的 `$ref`
/// - 当前 schema 自身的字段始终优先
/// - 通过 visited 集合防止循环引用导致无限递归
pub fn resolve_schema(
    schemas: &IndexMap<String, types::JsonSchema>,
    name: &str,
) -> Option<types::JsonSchema> {
    let schema = schemas.get(name)?;
    let mut visited = HashSet::new();
    Some(resolve_ref(schemas, schema, &mut visited))
}

/// 沿 $ref 链深层展开: { ...$ref.$ref, ...$ref, ...self }
///
/// 除了展开当前 schema 自身的 $ref 外，还递归展开嵌套在
/// `one_of`、`properties`、`items` 中的子 schema 的 $ref。
fn resolve_ref(
    schemas: &IndexMap<String, types::JsonSchema>,
    schema: &types::JsonSchema,
    visited: &mut HashSet<String>,
) -> types::JsonSchema {
    let mut resolved = match &schema.schema_ref {
        None => schema.clone(),
        Some(ref_name) => {
            // 循环引用或找不到 $ref 目标，返回自身（去掉 $ref 标记）
            if visited.contains(ref_name) {
                let mut result = schema.clone();
                result.schema_ref = None;
                return result;
            }

            let Some(ref_schema) = schemas.get(ref_name.as_str()) else {
                return schema.clone();
            };

            // 递归展开被引用 schema 的 $ref（先到达链的最深层）
            visited.insert(ref_name.clone());
            let base = resolve_ref(schemas, ref_schema, visited);
            visited.remove(ref_name);

            // { ...base(展开后的 $ref), ...self }，self 的字段覆盖 base
            let mut merged = json_merge_schema(&base, schema);
            merged.schema_ref = None;
            merged
        }
    };

    // 递归展开 one_of 中每个子 schema 的 $ref
    resolved.one_of = resolved
        .one_of
        .iter()
        .map(|child| Arc::new(resolve_ref(schemas, child, visited)))
        .collect();

    // 递归展开 properties 中每个子 schema 的 $ref
    resolved.properties = resolved
        .properties
        .iter()
        .map(|(key, child)| (key.clone(), Arc::new(resolve_ref(schemas, child, visited))))
        .collect();

    // 递归展开 items 中的 $ref
    if let Some(items) = &resolved.items {
        resolved.items = Some(Arc::new(resolve_ref(schemas, items, visited)));
    }

    resolved
}

/// JSON 合并：`{ ...base, ...overlay }`
///
/// 两个 JsonSchema 序列化后均为 JSON Object，逐 key 合并：
/// - 嵌套 Object（如 properties）：递归逐 key 合并，overlay 的 key 优先
/// - 其他类型（Array / 标量）：overlay 存在则整体替换 base
/// - serde 的 skip_serializing_if 保证默认空值不会出现在序列化结果中，
///   因此 overlay 中出现的 key 一定是用户显式定义的字段
fn json_merge_schema(base: &types::JsonSchema, overlay: &types::JsonSchema) -> types::JsonSchema {
    let base_val = serde_json::to_value(base).unwrap_or_default();
    let overlay_val = serde_json::to_value(overlay).unwrap_or_default();
    let merged = json_merge(base_val, &overlay_val);
    serde_json::from_value(merged).unwrap_or_else(|_| overlay.clone())
}

/// 递归 JSON merge：Object 逐 key 递归合并，非 Object 值 overlay 直接覆盖 base。
fn json_merge(base: Value, overlay: &Value) -> Value {
    match (base, overlay) {
        (Value::Object(mut base_map), Value::Object(overlay_map)) => {
            for (key, overlay_val) in overlay_map {
                let merged_val = base_map.remove(key).map_or_else(
                    || overlay_val.clone(),
                    |base_val| json_merge(base_val, overlay_val),
                );
                base_map.insert(key.clone(), merged_val);
            }
            Value::Object(base_map)
        }
        // 非 Object：overlay 直接覆盖 base
        (_, overlay_val) => overlay_val.clone(),
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：resolve（Schema $ref 深层展开器）
    //!
    //! ### 关键接口
    //! - [resolve_schema] — 根据 name 在 schemas 集合中查找并深层展开所有 `$ref`
    //! - [resolve_ref] — 沿 $ref 链递归展开，合并覆盖语义
    //! - [json_merge_schema] — JsonSchema 级别的 JSON merge
    //! - [json_merge] — Value 级别的递归 JSON merge
    //!
    //! ### 关键分支与异常路径
    //! - 无 $ref → 直接返回 clone
    //! - 单层/链式 $ref → 递归展开后合并 `{ ...base, ...self }`
    //! - 循环引用 → visited 集合检测，返回去掉 $ref 的自身
    //! - $ref 目标不存在 → 返回自身 clone
    //! - 嵌套在 properties/oneOf/items 中的 $ref → 递归展开子 schema
    //! - name 不存在 → 返回 None
    //!
    //! ### 上下游交互
    //! - 上游：[schema] 模块的顶层入口调用 resolve_schema 展开引用
    //! - 下游：依赖 `types.rs` 的 [JsonSchema] 数据结构；输出供 `ts_doc.rs` 使用

    use super::*;

    fn make_schemas(pairs: Vec<(&str, types::JsonSchema)>) -> IndexMap<String, types::JsonSchema> {
        pairs.into_iter().map(|(k, v)| (k.to_string(), v)).collect()
    }

    /// P0：[resolve_schema] 无 $ref 引用的简单 schema 解析
    /// 条件：schema 不包含 $ref，只有 type 和 description
    /// 断言：解析结果保留原始 type 和 description，schema_ref 为 None
    #[test]
    fn resolve_simple_no_ref() {
        let schema = types::JsonSchema {
            schema_type: Some("object".to_string()),
            description: Some("A simple schema".to_string()),
            ..Default::default()
        };
        let schemas = make_schemas(vec![("Foo", schema)]);

        let resolved = resolve_schema(&schemas, "Foo").unwrap();
        assert_eq!(resolved.schema_type.as_deref(), Some("object"));
        assert_eq!(resolved.description.as_deref(), Some("A simple schema"));
        assert!(resolved.schema_ref.is_none());
    }

    /// P0：[resolve_schema] 单层 $ref 引用展开
    /// 条件：Extended schema 通过 $ref 引用 Base schema，且各自有独立 properties
    /// 断言：$ref 被展开为实际字段合并，本地字段优先保留
    #[test]
    fn resolve_single_ref() {
        let base = types::JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "id".to_string(),
                    Arc::new(types::JsonSchema {
                        schema_type: Some("integer".to_string()),
                        ..Default::default()
                    }),
                );
                m
            },
            required: vec!["id".to_string()],
            ..Default::default()
        };

        let referencing = types::JsonSchema {
            schema_ref: Some("Base".to_string()),
            description: Some("Extended schema".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "name".to_string(),
                    Arc::new(types::JsonSchema {
                        schema_type: Some("string".to_string()),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };

        let schemas = make_schemas(vec![("Base", base), ("Extended", referencing)]);
        let resolved = resolve_schema(&schemas, "Extended").unwrap();

        // $ref 已展开
        assert!(resolved.schema_ref.is_none());
        // 本地 description 保留
        assert_eq!(resolved.description.as_deref(), Some("Extended schema"));
        // type 继承自 Base
        assert_eq!(resolved.schema_type.as_deref(), Some("object"));
        // 两个 properties 都存在
        assert!(resolved.properties.contains_key("id"));
        assert!(resolved.properties.contains_key("name"));
        // required 继承
        assert!(resolved.required.contains(&"id".to_string()));
    }

    /// P0：链式 $ref 引用展开（A → B → C）
    /// 条件：三层 schema 链式引用，C 引用 B，B 引用 A
    /// 断言：最终解析结果包含 A 和 B 的所有属性，$ref 被完全展开
    #[test]
    fn resolve_chained_refs() {
        let a = types::JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "a_field".to_string(),
                    Arc::new(types::JsonSchema {
                        schema_type: Some("string".to_string()),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };

        let b = types::JsonSchema {
            schema_ref: Some("A".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "b_field".to_string(),
                    Arc::new(types::JsonSchema {
                        schema_type: Some("number".to_string()),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };

        let c = types::JsonSchema {
            schema_ref: Some("B".to_string()),
            description: Some("C schema".to_string()),
            ..Default::default()
        };

        let schemas = make_schemas(vec![("A", a), ("B", b), ("C", c)]);
        let resolved = resolve_schema(&schemas, "C").unwrap();

        assert!(resolved.schema_ref.is_none());
        assert_eq!(resolved.schema_type.as_deref(), Some("object"));
        assert!(resolved.properties.contains_key("a_field"));
        assert!(resolved.properties.contains_key("b_field"));
    }

    /// P1：循环引用不会导致无限递归或 panic
    /// 条件：A 引用 B，B 又引用 A 形成循环
    /// 断言：resolve_schema 正常返回 Some 结果，不崩溃
    #[test]
    fn resolve_circular_ref_no_panic() {
        let a = types::JsonSchema {
            schema_ref: Some("B".to_string()),
            schema_type: Some("object".to_string()),
            ..Default::default()
        };

        let b = types::JsonSchema {
            schema_ref: Some("A".to_string()),
            ..Default::default()
        };

        let schemas = make_schemas(vec![("A", a), ("B", b)]);
        // 不应死循环或 panic
        let resolved = resolve_schema(&schemas, "A");
        assert!(resolved.is_some());
    }

    /// P1：[resolve_schema] 嵌套在 properties 内部的 $ref 递归展开
    /// 条件：Outer schema 的 property field 通过 $ref 引用 Inner schema
    /// 断言：property 内的 $ref 被深层展开，包含 Inner 的 type 和 description
    #[test]
    fn resolve_nested_property_refs_expanded() {
        // 深层展开：property 内部的 $ref 会被递归展开
        let inner = types::JsonSchema {
            schema_type: Some("string".to_string()),
            description: Some("inner type".to_string()),
            ..Default::default()
        };

        let outer = types::JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "field".to_string(),
                    Arc::new(types::JsonSchema {
                        schema_ref: Some("Inner".to_string()),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };

        let schemas = make_schemas(vec![("Inner", inner), ("Outer", outer)]);
        let resolved = resolve_schema(&schemas, "Outer").unwrap();

        let field = resolved.properties.get("field").unwrap();
        // 深层展开：property 内部的 $ref 已被展开
        assert!(field.schema_ref.is_none());
        assert_eq!(field.schema_type.as_deref(), Some("string"));
        assert_eq!(field.description.as_deref(), Some("inner type"));
    }

    /// P1：oneOf 中子 schema 的 $ref 展开
    /// 条件：Union schema 的 oneOf 包含两个通过 $ref 引用的变体
    /// 断言：oneOf 中每个子 schema 的 $ref 均被正确展开
    #[test]
    fn resolve_one_of_refs_expanded() {
        let variant_a = types::JsonSchema {
            schema_type: Some("string".to_string()),
            description: Some("variant A".to_string()),
            ..Default::default()
        };

        let variant_b = types::JsonSchema {
            schema_type: Some("number".to_string()),
            ..Default::default()
        };

        let schema = types::JsonSchema {
            one_of: vec![
                Arc::new(types::JsonSchema {
                    schema_ref: Some("A".to_string()),
                    ..Default::default()
                }),
                Arc::new(types::JsonSchema {
                    schema_ref: Some("B".to_string()),
                    ..Default::default()
                }),
            ],
            ..Default::default()
        };

        let schemas = make_schemas(vec![("A", variant_a), ("B", variant_b), ("Union", schema)]);
        let resolved = resolve_schema(&schemas, "Union").unwrap();

        assert_eq!(resolved.one_of.len(), 2);
        // oneOf 中的 $ref 已展开
        assert!(resolved.one_of[0].schema_ref.is_none());
        assert_eq!(resolved.one_of[0].schema_type.as_deref(), Some("string"));
        assert_eq!(resolved.one_of[0].description.as_deref(), Some("variant A"));
        assert!(resolved.one_of[1].schema_ref.is_none());
        assert_eq!(resolved.one_of[1].schema_type.as_deref(), Some("number"));
    }

    /// P1：数组 items 中的 $ref 展开能力
    /// 条件：List schema 的 items 字段通过 $ref 引用 Item schema
    /// 断言：items 中的 $ref 被展开，包含 Item 的完整结构
    #[test]
    fn resolve_items_ref_expanded() {
        let item_schema = types::JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = IndexMap::new();
                m.insert(
                    "id".to_string(),
                    Arc::new(types::JsonSchema {
                        schema_type: Some("integer".to_string()),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };

        let array_schema = types::JsonSchema {
            schema_type: Some("array".to_string()),
            items: Some(Arc::new(types::JsonSchema {
                schema_ref: Some("Item".to_string()),
                ..Default::default()
            })),
            ..Default::default()
        };

        let schemas = make_schemas(vec![("Item", item_schema), ("List", array_schema)]);
        let resolved = resolve_schema(&schemas, "List").unwrap();

        let items = resolved.items.as_ref().unwrap();
        // items 中的 $ref 已展开
        assert!(items.schema_ref.is_none());
        assert_eq!(items.schema_type.as_deref(), Some("object"));
        assert!(items.properties.contains_key("id"));
    }

    /// P1：[resolve_schema] 查询不存在的 schema 名称时返回 None
    /// 条件：schemas 集合为空，查询一个不存在的名称
    /// 断言：resolve_schema 返回 None
    #[test]
    fn resolve_not_found_returns_none() {
        let schemas: IndexMap<String, types::JsonSchema> = IndexMap::new();
        assert!(resolve_schema(&schemas, "NonExistent").is_none());
    }
}
