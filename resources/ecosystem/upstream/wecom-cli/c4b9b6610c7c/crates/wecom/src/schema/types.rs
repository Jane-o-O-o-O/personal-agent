use std::sync::Arc;

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use serde_with::{DefaultOnError, serde_as, skip_serializing_none};

use crate::schema::JsonSchemaWecomDirectives;

#[skip_serializing_none]
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct JsonSchema {
    #[serde_as(as = "DefaultOnError")]
    #[serde(rename = "type", default)]
    pub schema_type: Option<String>,

    #[serde_as(as = "DefaultOnError")]
    #[serde(rename = "$ref", default)]
    pub schema_ref: Option<String>,

    #[serde_as(as = "DefaultOnError")]
    #[serde(default)]
    pub description: Option<String>,

    #[serde_as(as = "DefaultOnError")]
    #[serde(rename = "oneOf", default, skip_serializing_if = "Vec::is_empty")]
    pub one_of: Vec<Arc<JsonSchema>>,

    #[serde(
        default,
        deserialize_with = "deserialize_properties_default_on_error",
        serialize_with = "serialize_visible_properties",
        skip_serializing_if = "no_visible_properties"
    )]
    pub properties: IndexMap<String, Arc<JsonSchema>>,

    #[serde_as(as = "DefaultOnError")]
    #[serde(rename = "enum", default, skip_serializing_if = "Vec::is_empty")]
    pub enum_values: Vec<Value>,

    #[serde_as(as = "DefaultOnError")]
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub required: Vec<String>,

    #[serde_as(as = "DefaultOnError")]
    #[serde(rename = "default", default)]
    pub default: Option<Value>,

    #[serde_as(as = "DefaultOnError")]
    #[serde(default)]
    pub items: Option<Arc<JsonSchema>>,

    #[serde_as(as = "DefaultOnError")]
    #[serde(rename = "additionalProperties", default)]
    pub additional_properties: Option<Box<AdditionalProperties>>,

    #[serde(flatten)]
    pub directives: JsonSchemaWecomDirectives,

    #[serde(flatten)]
    pub extra: IndexMap<String, Value>,
}

impl JsonSchema {
    /// 遍历未被 `x-wecom-hidden` 标记隐藏的属性。
    ///
    /// 由 clap-args 与 `--doc` 两条路径共用，使其与 `--schema` 的序列化过滤
    /// （[`serialize_visible_properties`]）保持一致。隐藏属性仍保留在内存结构树中。
    pub(crate) fn visible_properties(&self) -> impl Iterator<Item = (&String, &Arc<JsonSchema>)> {
        self.properties
            .iter()
            .filter(|(_, prop)| prop.directives.hidden.is_none())
    }
}

/// [`JsonSchema::properties`] 的 `skip_serializing_if` 谓词：当全部属性均隐藏
/// （或没有属性）时整体跳过该字段，使全隐藏对象不会输出空的 `"properties": {}`。
fn no_visible_properties(properties: &IndexMap<String, Arc<JsonSchema>>) -> bool {
    properties
        .values()
        .all(|prop| prop.directives.hidden.is_some())
}

/// [`JsonSchema::properties`] 的 `deserialize_with`：复刻结构体其余字段经 `serde_as`
/// 获得的 `DefaultOnError` 容错（畸形的 `properties` → 空 map）。因为 `serde_as`
/// 无法与自定义 `serialize_with` 共存，故在此手动实现。
fn deserialize_properties_default_on_error<'de, D>(
    deserializer: D,
) -> std::result::Result<IndexMap<String, Arc<JsonSchema>>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde_with::DeserializeAs;

    DefaultOnError::<serde_with::Same>::deserialize_as(deserializer)
}

/// [`JsonSchema::properties`] 的 `serialize_with`：仅序列化非隐藏属性，使
/// `x-wecom-hidden` 条目从 `--schema` 输出中消失。
///
/// 因嵌套 schema 复用同一字段序列化器，故递归生效。
fn serialize_visible_properties<S>(
    properties: &IndexMap<String, Arc<JsonSchema>>,
    serializer: S,
) -> std::result::Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    use serde::ser::SerializeMap;

    let mut map = serializer.serialize_map(None)?;
    for (key, prop) in properties
        .iter()
        .filter(|(_, prop)| prop.directives.hidden.is_none())
    {
        map.serialize_entry(key, prop)?;
    }
    map.end()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AdditionalProperties {
    Enabled(bool),
    Schema(Arc<JsonSchema>),
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：types（JsonSchema 数据结构与反序列化）
    //!
    //! ### 关键接口
    //! - [JsonSchema] struct — JSON Schema 的 Rust 表示，支持 [DefaultOnError] 容错反序列化
    //! - [AdditionalProperties] enum — additionalProperties 字段的布尔值或 schema 变体
    //!
    //! ### 关键分支与异常路径
    //! - 各字段类型错误时 [DefaultOnError] 容错为默认空值/None
    //! - 多个字段同时畸形时的批量容错行为
    //! - Arc 包裹的嵌套结构（properties/one_of/items）序列化/反序列化往返
    //! - skip_serializing_none 保证 None 值字段不出现在序列化结果中
    //! - serde(untagged) 处理 AdditionalProperties 的 bool/Schema 分支
    //! - [JsonSchema::visible_properties] 过滤 x-wecom-hidden 属性
    //! - [serialize_visible_properties] 序列化时丢弃 hidden 属性（递归生效于 --schema 输出）
    //! - [no_visible_properties] 全部属性 hidden 时跳过 properties 字段（不输出空 {}）
    //!
    //! ### 上下游交互
    //! - 上游：外部 JSON Schema 数据通过本模块反序列化为 Rust 结构体
    //! - 下游：`resolve.rs` 和 `ts_doc.rs` 消费 JsonSchema 数据结构进行展开和 TS 代码生成

    use assert_json_diff::assert_json_eq;
    use serde_json::json;

    use super::*;
    use crate::schema::WecomBoolValue;

    // ── 正常解析测试 ──

    /// P0：[JsonSchema] 正常字段值的正确解析能力
    /// 条件：包含所有标准字段的合法 JSON Schema 对象
    /// 断言：各字段正确解析为对应 Rust 类型值
    #[test]
    fn normal_fields_parse_correctly() {
        let json = r##"{
            "type": "object",
            "$ref": "#/definitions/Foo",
            "description": "a schema",
            "oneOf": [{ "type": "string" }],
            "properties": { "name": { "type": "string" } },
            "enum": ["a", 1, null],
            "required": ["name"],
            "items": { "type": "integer" },
            "minimum": 0.0,
            "maximum": 100.5,
            "minLength": 1,
            "maxLength": 255,
            "minItems": 0,
            "maxItems": 10,
            "pattern": "^[a-z]+$"
        }"##;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert_eq!(schema.schema_type.as_deref(), Some("object"));
        assert_eq!(schema.schema_ref.as_deref(), Some("#/definitions/Foo"));
        assert_eq!(schema.description.as_deref(), Some("a schema"));
        assert_eq!(schema.one_of.len(), 1);
        assert!(schema.properties.contains_key("name"));
        assert_eq!(schema.enum_values.len(), 3);
        assert_eq!(schema.required, vec!["name"]);
        assert!(schema.items.is_some());
    }

    // ── JsonSchema: DefaultOnError 容错测试 ──

    /// P1：[JsonSchema] type 字段为错误类型时容错为 None
    /// 条件：JSON 中 type 为数字 123 而非字符串
    /// 断言：schema_type 解析为 None
    #[test]
    fn type_wrong_type_falls_back_to_none() {
        let json = r#"{ "type": 123 }"#;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.schema_type.is_none());
    }

    /// P1：$ref 字段为错误类型时容错为 None
    /// 条件：JSON 中 $ref 为布尔值 true 而非字符串
    /// 断言：schema_ref 解析为 None
    #[test]
    fn ref_wrong_type_falls_back_to_none() {
        let json = r#"{ "$ref": true }"#;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.schema_ref.is_none());
    }

    /// P1：description 字段为错误类型时容错为 None
    /// 条件：JSON 中 description 为数组而非字符串
    /// 断言：description 解析为 None
    #[test]
    fn description_wrong_type_falls_back_to_none() {
        let json = r#"{ "description": ["not", "a", "string"] }"#;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.description.is_none());
    }

    /// P1：oneOf 字段为错误类型时容错为空向量
    /// 条件：JSON 中 oneOf 为字符串而非数组
    /// 断言：one_of 解析为空 Vec
    #[test]
    fn one_of_wrong_type_falls_back_to_empty() {
        let json = r#"{ "oneOf": "not_an_array" }"#;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.one_of.is_empty());
    }

    /// P1：properties 字段为错误类型时容错为空 IndexMap
    /// 条件：JSON 中 properties 为字符串而非对象
    /// 断言：properties 解析为空 IndexMap
    #[test]
    fn properties_wrong_type_falls_back_to_empty() {
        let json = r#"{ "properties": "bad" }"#;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.properties.is_empty());
    }

    /// P1：enum 字段为错误类型时容错为空向量
    /// 条件：JSON 中 enum 为数字而非数组
    /// 断言：enum_values 解析为空 Vec
    #[test]
    fn enum_wrong_type_falls_back_to_empty() {
        let json = r#"{ "enum": 42 }"#;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.enum_values.is_empty());
    }

    /// P1：required 字段为错误类型时容错为空向量
    /// 条件：JSON 中 required 为字符串而非数组
    /// 断言：required 解析为空 Vec
    #[test]
    fn required_wrong_type_falls_back_to_empty() {
        let json = r#"{ "required": "name" }"#;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.required.is_empty());
    }

    /// P1：items 字段为错误类型时容错为 None
    /// 条件：JSON 中 items 为数字而非对象
    /// 断言：items 解析为 None
    #[test]
    fn items_wrong_type_falls_back_to_none() {
        let json = r#"{ "items": 42 }"#;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.items.is_none());
    }

    /// P1：additionalProperties 字段为错误类型时容错为 None
    /// 条件：JSON 中 additionalProperties 为字符串 "yes" 而非布尔值或 schema
    /// 断言：additional_properties 解析为 None
    #[test]
    fn additional_properties_wrong_type_falls_back_to_none() {
        let json = r#"{ "additionalProperties": "yes" }"#;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.additional_properties.is_none());
    }

    // ── 多个字段同时畸形 ──

    /// P1：[JsonSchema] 多个字段同时为畸形值时全部容错
    /// 条件：JSON 中几乎所有字段均为错误的类型（数组、数字、布尔值等）
    /// 断言：所有字段均被正确容错为默认空值或 None，不报错
    #[test]
    fn multiple_wrong_fields_all_fall_back() {
        let json = r#"{
            "type": [],
            "$ref": 0,
            "description": true,
            "oneOf": 1,
            "properties": 2,
            "enum": "bad",
            "format": 3,
            "required": 4,
            "items": "x",
            "minimum": "x",
            "maxLength": {},
            "pattern": []
        }"#;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.schema_type.is_none());
        assert!(schema.schema_ref.is_none());
        assert!(schema.description.is_none());
        assert!(schema.one_of.is_empty());
        assert!(schema.properties.is_empty());
        assert!(schema.enum_values.is_empty());
        assert!(schema.required.is_empty());
        assert!(schema.items.is_none());
    }

    // ── Arc 序列化/反序列化往返测试 ──

    /// P1：[JsonSchema] Arc 包裹的嵌套 schema 序列化/反序列化往返
    /// 条件：构建含 Arc 包裹 properties、one_of、items 的 JsonSchema 并序列化再反序列化
    /// 断言：往返后各嵌套字段的 schema_type 保持一致
    #[test]
    fn arc_round_trip() {
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
            one_of: vec![Arc::new(JsonSchema {
                schema_type: Some("number".to_string()),
                ..Default::default()
            })],
            items: Some(Arc::new(JsonSchema {
                schema_type: Some("integer".to_string()),
                ..Default::default()
            })),
            ..Default::default()
        };
        let json = serde_json::to_string(&schema).unwrap();
        let parsed: JsonSchema = serde_json::from_str(&json).unwrap();
        assert_eq!(
            parsed
                .properties
                .get("name")
                .unwrap()
                .schema_type
                .as_deref(),
            Some("string")
        );
        assert_eq!(parsed.one_of[0].schema_type.as_deref(), Some("number"));
        assert_eq!(
            parsed.items.as_ref().unwrap().schema_type.as_deref(),
            Some("integer")
        );
    }

    // ── x-wecom-hidden 过滤 ──

    /// 测试 helper：构造一个含 `visible` 与 `hidden`（标记 x-wecom-hidden）两个属性的 object schema。
    fn schema_with_hidden_prop() -> JsonSchema {
        let mut props = IndexMap::new();
        props.insert(
            "visible".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("string".to_string()),
                ..Default::default()
            }),
        );
        props.insert(
            "secret".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("string".to_string()),
                directives: JsonSchemaWecomDirectives {
                    hidden: Some(WecomBoolValue::default()),
                    ..Default::default()
                },
                ..Default::default()
            }),
        );
        JsonSchema {
            schema_type: Some("object".to_string()),
            properties: props,
            ..Default::default()
        }
    }

    /// P0：[JsonSchema::visible_properties] 过滤掉 x-wecom-hidden 属性
    /// 条件：object schema 含 visible 与 secret(hidden) 两个属性
    /// 断言：迭代结果仅含 "visible"，不含 "secret"
    #[test]
    fn visible_properties_filters_hidden() {
        let schema = schema_with_hidden_prop();
        let keys: Vec<&str> = schema
            .visible_properties()
            .map(|(k, _)| k.as_str())
            .collect();
        assert_eq!(keys, vec!["visible"]);
    }

    /// P0：[serialize_visible_properties] 序列化时丢弃 hidden 属性
    /// 条件：object schema 含 visible 与 secret(hidden)，序列化为 JSON
    /// 断言：properties 仅含 "visible"；x-wecom-hidden 指令一并消失
    #[test]
    fn serialize_drops_hidden_property() {
        let schema = schema_with_hidden_prop();
        let val = serde_json::to_value(&schema).unwrap();
        assert_json_eq!(
            val,
            json!({
                "type": "object",
                "properties": {
                    "visible": { "type": "string" }
                }
            })
        );
    }

    /// P1：[serialize_visible_properties] 嵌套对象内的 hidden 属性也被递归丢弃
    /// 条件：根对象的 visible 属性自身是一个含 hidden 子属性的对象
    /// 断言：嵌套层级的 hidden 子属性同样不出现在序列化结果中
    #[test]
    fn serialize_drops_hidden_property_recursively() {
        let inner = schema_with_hidden_prop();
        let mut props = IndexMap::new();
        props.insert("nested".to_string(), Arc::new(inner));
        let outer = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: props,
            ..Default::default()
        };

        let val = serde_json::to_value(&outer).unwrap();
        assert_json_eq!(
            val,
            json!({
                "type": "object",
                "properties": {
                    "nested": {
                        "type": "object",
                        "properties": {
                            "visible": { "type": "string" }
                        }
                    }
                }
            })
        );
    }

    /// P1：[no_visible_properties] 全部属性 hidden 时跳过 properties 字段
    /// 条件：object schema 仅含一个 hidden 属性
    /// 断言：序列化结果不含 "properties" 键（而非空对象 {}）
    #[test]
    fn serialize_skips_properties_when_all_hidden() {
        let mut props = IndexMap::new();
        props.insert(
            "secret".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("string".to_string()),
                directives: JsonSchemaWecomDirectives {
                    hidden: Some(WecomBoolValue::default()),
                    ..Default::default()
                },
                ..Default::default()
            }),
        );
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: props,
            ..Default::default()
        };

        let val = serde_json::to_value(&schema).unwrap();
        assert!(
            val.get("properties").is_none(),
            "全部属性 hidden 时不应输出 properties 字段，实际：{val}"
        );
    }

    /// P1：x-wecom-hidden 属性可正常反序列化（deserialize 侧不受 serialize 过滤影响）
    /// 条件：JSON 中 secret 属性带 x-wecom-hidden:true
    /// 断言：反序列化后 properties 仍含 secret，且其 directives.hidden.is_some()
    #[test]
    fn deserialize_keeps_hidden_property_in_memory() {
        let json = r##"{
            "type": "object",
            "properties": {
                "visible": { "type": "string" },
                "secret": { "type": "string", "x-wecom-hidden": true }
            }
        }"##;
        let schema: JsonSchema = serde_json::from_str(json).unwrap();
        assert!(schema.properties.contains_key("secret"));
        assert!(
            schema
                .properties
                .get("secret")
                .unwrap()
                .directives
                .hidden
                .is_some()
        );
    }
}
