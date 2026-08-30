use serde_json::Value;

use super::types::JsonSchema;

/// Generate a [`JsonSchema`] from any Rust type that derives
/// [`schemars::JsonSchema`].
///
/// This lets callers describe parameters / responses with a plain Rust
/// struct (and `#[derive(schemars::JsonSchema)]`) instead of hand-writing a
/// JSON Schema literal.
///
/// The produced schema is **self-contained**:
/// - Nested types are inlined (no `$ref` / `$defs`), so the single returned
///   [`JsonSchema`] can be consumed directly by the CLI argument builder and
///   the TypeScript doc generator.
/// - Nullable type unions (`["string", "null"]`) generated for `Option<T>`
///   fields are collapsed to their inner type (`"string"`), keeping CLI flags
///   strongly typed.
pub fn schema_for_type<T: schemars::JsonSchema>() -> JsonSchema {
    let generator = schemars::generate::SchemaSettings::draft07()
        .with(|s| s.inline_subschemas = true)
        .into_generator();
    let schema = generator.into_root_schema_for::<T>();
    let mut value = serde_json::to_value(&schema).unwrap_or_default();
    normalize_nullable(&mut value);
    serde_json::from_value(value).unwrap_or_default()
}

/// Collapse `Option<T>`-style nullable type unions and strip schemars-only
/// metadata (`$schema`, `title`).
///
/// - schemars represents an optional field as `"type": ["<inner>", "null"]`.
///   Our [`JsonSchema`] only models a single `type` string, so we rewrite a
///   `[X, "null"]` union back to `X` (and leave genuine multi-type unions as an
///   array, which [`JsonSchema`] then tolerates as `None`).
/// - `$schema` / `title` are derive artifacts (dialect URI and type name) that
///   would otherwise leak into `--doc` / `--schema` output, so we drop them.
fn normalize_nullable(value: &mut Value) {
    match value {
        Value::Object(map) => {
            map.remove("$schema");
            map.remove("title");

            if let Some(Value::Array(arr)) = map.get_mut("type") {
                let non_null: Vec<Value> = arr
                    .iter()
                    .filter(|v| v.as_str() != Some("null"))
                    .cloned()
                    .collect();
                match non_null.len() {
                    1 => {
                        map.insert("type".to_string(), non_null.into_iter().next().unwrap());
                    }
                    n if n > 1 => {
                        map.insert("type".to_string(), Value::Array(non_null));
                    }
                    _ => {}
                }
            }
            for v in map.values_mut() {
                normalize_nullable(v);
            }
        }
        Value::Array(arr) => {
            for v in arr.iter_mut() {
                normalize_nullable(v);
            }
        }
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：derive（Rust 类型 → JsonSchema 派生）
    //!
    //! ### 关键接口
    //! - [schema_for_type] — 将派生了 schemars::JsonSchema 的 Rust 类型转为本项目 JsonSchema
    //!
    //! ### 关键分支与异常路径
    //! - 必填字段 → 出现在 required 列表
    //! - Option<T> 字段 → type 由 ["T","null"] 折叠为 "T"，且不在 required 中
    //! - 文档注释 → 转为属性 description
    //! - $schema / title 等派生产物 → 被剥离，不污染输出
    //!
    //! ### 上下游交互
    //! - 上游：[HelperMeta] 的 with_request/with_response 构建器调用本模块
    //! - 下游：依赖 schemars 生成器与 serde_json 转换

    use schemars::JsonSchema as SchemarsJsonSchema;
    use serde_json::json;

    use super::*;

    #[derive(SchemarsJsonSchema)]
    #[allow(dead_code)]
    struct Sample {
        /// the required name
        name: String,
        /// optional note
        note: Option<String>,
        count: u32,
    }

    /// P0：[schema_for_type] 将结构体转换为 object 类型 schema
    /// 条件：Sample 含 name/note/count 三个字段
    /// 断言：schema_type 为 "object"，三个属性均存在
    #[test]
    fn struct_becomes_object_schema() {
        let schema = schema_for_type::<Sample>();
        assert_eq!(schema.schema_type.as_deref(), Some("object"));
        assert!(schema.properties.contains_key("name"));
        assert!(schema.properties.contains_key("note"));
        assert!(schema.properties.contains_key("count"));
    }

    /// P1：[schema_for_type] 必填字段进入 required、可选字段不进入
    /// 条件：name/count 为必填，note 为 Option
    /// 断言：required 含 name 与 count，不含 note
    #[test]
    fn required_fields_collected() {
        let schema = schema_for_type::<Sample>();
        assert!(schema.required.contains(&"name".to_string()));
        assert!(schema.required.contains(&"count".to_string()));
        assert!(!schema.required.contains(&"note".to_string()));
    }

    /// P1：[schema_for_type] Option<String> 字段的 nullable 类型被折叠为 string
    /// 条件：note 字段类型为 Option<String>
    /// 断言：note 属性的 schema_type 为 "string"
    #[test]
    fn nullable_type_collapsed_to_inner() {
        let schema = schema_for_type::<Sample>();
        let note = schema.properties.get("note").unwrap();
        assert_eq!(note.schema_type.as_deref(), Some("string"));
    }

    /// P1：[schema_for_type] 文档注释转换为属性 description
    /// 条件：name 字段带有文档注释 "the required name"
    /// 断言：name 属性 description 为 "the required name"
    #[test]
    fn doc_comment_becomes_description() {
        let schema = schema_for_type::<Sample>();
        let name = schema.properties.get("name").unwrap();
        assert_eq!(name.description.as_deref(), Some("the required name"));
    }

    /// P2：[normalize_nullable] 多类型联合（非单纯 null）时保留为数组
    /// 条件：type 为 ["string","number","null"]
    /// 断言：null 被移除，其余保留为数组 ["string","number"]
    #[test]
    fn normalize_keeps_multi_type_union() {
        let mut v = json!({ "type": ["string", "number", "null"] });
        normalize_nullable(&mut v);
        assert_eq!(v["type"], json!(["string", "number"]));
    }

    /// P2：[schema_for_type] 剥离 schemars 派生的 $schema 与 title 噪声
    /// 条件：对 Sample 生成 schema
    /// 断言：序列化结果不含 $schema / title 键
    #[test]
    fn strips_schema_and_title_artifacts() {
        let schema = schema_for_type::<Sample>();
        let value = serde_json::to_value(&schema).unwrap();
        assert!(value.get("$schema").is_none());
        assert!(value.get("title").is_none());
    }
}
