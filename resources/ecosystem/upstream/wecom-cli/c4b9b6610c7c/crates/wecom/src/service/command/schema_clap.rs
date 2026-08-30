use std::collections::HashSet;
use std::str::FromStr;

use serde_json::{Number, Value};

use crate::schema::JsonSchema;
use crate::{Error, Result};

/// Convert a [`JsonSchema`] into a list of `clap::Arg`.
/// Returns `None` if the schema is not an object type.
pub(crate) fn build_args_from_schema(schema: &JsonSchema) -> Option<Vec<clap::Arg>> {
    if schema.schema_type.as_deref() != Some("object") {
        return None;
    }

    let required_set: HashSet<&str> = schema.required.iter().map(|s| s.as_str()).collect();
    let mut args = vec![];

    for (name, prop) in schema.visible_properties() {
        let mut arg = clap::Arg::new(name)
            .long(to_kebab_case(name))
            .alias(name)
            .help_heading("参数");

        let mut desc_parts = vec![];
        if let Some(desc) = &prop.description {
            desc_parts.push(desc.to_string());
        }
        if required_set.contains(name.as_str()) {
            desc_parts.push("[必填]".to_string());
        }
        if let Some(default) = &prop.default {
            desc_parts.push(format!("[默认: {}]", default));
        }
        if !desc_parts.is_empty() {
            arg = arg.help(desc_parts.join(" "));
        }

        match prop.schema_type.as_deref() {
            Some("string") => {
                arg = arg.value_name("str");
            }
            Some("number") => {
                arg = arg.value_name("num");
            }
            Some("integer") => {
                arg = arg.value_name("int");
            }
            Some("object") => {
                arg = arg.value_name("json");
            }
            Some("boolean") => {
                arg = arg
                    .action(clap::ArgAction::SetTrue)
                    .value_parser(clap::value_parser!(bool));
            }
            Some("array") => {
                // Scalar arrays accept repeated / delimiter-split values; arrays of
                // objects/arrays are taken as a single JSON blob (`json_array`).
                let item_type = scalar_array_item_type(prop);
                arg = arg.value_name(match item_type {
                    Some("string") => "str",
                    Some("number") => "num",
                    Some("integer") => "int",
                    _ => "json_array",
                });
                if item_type.is_some() {
                    arg = arg.num_args(0..).action(clap::ArgAction::Append);
                }
            }
            _ => {
                arg = arg.value_name("json");
            }
        }

        args.push(arg);
    }

    Some(args)
}

/// Convert `camelCase` or `snake_case` to `kebab-case`.
pub(crate) fn to_kebab_case(name: &str) -> String {
    let mut result = String::with_capacity(name.len() + 4);
    for ch in name.chars() {
        if ch == '_' {
            // snake_case separator → hyphen
            if !result.is_empty() && !result.ends_with('-') {
                result.push('-');
            }
        } else if ch.is_ascii_uppercase() {
            // camelCase boundary → hyphen + lowercase
            if !result.is_empty() && !result.ends_with('-') {
                result.push('-');
            }
            result.push(ch.to_ascii_lowercase());
        } else {
            result.push(ch);
        }
    }
    result
}

/// Return the scalar item type (`"string"` / `"number"` / `"integer"`) when
/// `prop` is an array of CLI-friendly scalars; `None` otherwise (non-arrays and
/// arrays of objects/arrays, which take the `json_array` whole-JSON path).
///
/// Single source of truth shared by both directions so the arg definition and
/// the match read-back can never drift apart:
/// - [`build_args_from_schema`] uses it to decide `num_args` / `value_name`;
/// - [`matches_to_value`] uses it to decide `get_many` + per-item parsing.
fn scalar_array_item_type(prop: &JsonSchema) -> Option<&str> {
    if prop.schema_type.as_deref() != Some("array") {
        return None;
    }
    match prop.items.as_ref().and_then(|i| i.schema_type.as_deref()) {
        t @ Some("string" | "number" | "integer") => t,
        _ => None,
    }
}

/// Parse a raw CLI string into a typed `serde_json::Value` based on the schema type.
///
/// 失败时返回**纯 [`String`] 原因**（不含 [`Error`] 包装），由调用方
/// [`matches_to_value`] 统一附加 `--<flag>` 上下文并包一次 `Error::Validation`，
/// 避免出现 `Validation("... {Validation}")` 的重复包裹。
fn parse_scalar(raw: &str, schema_type: Option<&str>) -> std::result::Result<Value, String> {
    match schema_type {
        Some("string") => Ok(Value::String(raw.to_string())),
        Some("number" | "integer") => Number::from_str(raw)
            .map(Value::Number)
            .map_err(|e| format!("`{raw}` 不是有效的数值: {e}")),
        _ => {
            serde_json::from_str::<Value>(raw).map_err(|e| format!("`{raw}` 不是合法的 JSON: {e}"))
        }
    }
}

/// Split an input string by the given delimiters (any-match = split).
/// Trailing/leading/consecutive delimiters produce empty fragments which are discarded.
fn split_by_delimiters(input: &str, delimiters: &[&str]) -> Vec<String> {
    if delimiters.is_empty() {
        return vec![input.to_string()];
    }
    let mut out = Vec::new();
    let mut buf = String::new();
    let mut rest = input;
    'outer: while !rest.is_empty() {
        for d in delimiters {
            if rest.starts_with(*d) {
                if !buf.is_empty() {
                    out.push(std::mem::take(&mut buf));
                }
                rest = &rest[d.len()..];
                continue 'outer;
            }
        }
        let ch = rest.chars().next().unwrap();
        buf.push(ch);
        rest = &rest[ch.len_utf8()..];
    }
    if !buf.is_empty() {
        out.push(buf);
    }
    out
}

/// Extract CLI argument values into a `serde_json::Map` based on a [`JsonSchema`].
pub(crate) fn matches_to_value(
    schema: &JsonSchema,
    matches: &clap::ArgMatches,
) -> Result<serde_json::Map<String, Value>> {
    let mut result = serde_json::Map::new();
    if schema.schema_type.as_deref() != Some("object") {
        return Ok(result);
    }

    for (name, prop) in schema.visible_properties() {
        let schema_type = prop.schema_type.as_deref();

        // Boolean — flag accessor.
        if schema_type == Some("boolean") {
            if matches.get_flag(name) {
                result.insert(name.to_string(), Value::Bool(true));
            }
            continue;
        }

        // Array of scalars — multiple values via `get_many`, split by delimiters.
        if let Some(item_type) = scalar_array_item_type(prop) {
            if let Some(values) = matches.get_many::<String>(name) {
                let delimiters: Vec<&str> = prop
                    .directives
                    .value_delimiters
                    .iter()
                    .map(|s| s.as_str())
                    .filter(|s| !s.is_empty())
                    .collect();
                let arr = values
                    .flat_map(|v| split_by_delimiters(v, &delimiters))
                    .map(|piece| {
                        parse_scalar(&piece, Some(item_type)).map_err(|e| {
                            Error::validation(format!("--{} 值无效: {e}", to_kebab_case(name)))
                        })
                    })
                    .collect::<Result<Vec<_>>>()?;
                result.insert(name.to_string(), Value::Array(arr));
            }
            continue;
        }

        // All other types (incl. arrays of objects) — single value via `get_one`.
        if let Some(raw) = matches.get_one::<String>(name) {
            let value = parse_scalar(raw, schema_type)
                .map_err(|e| Error::validation(format!("--{} 值无效: {e}", to_kebab_case(name))))?;
            result.insert(name.to_string(), value);
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：JsonSchema ↔ clap 双向桥接（生成 Arg / 回读 matches）
    //!
    //! ### 关键接口
    //! - [build_args_from_schema] — 将 JsonSchema 转为 clap::Arg 列表
    //! - [matches_to_value] — 将 clap::ArgMatches 按 schema 回读为 JSON Map
    //! - [split_by_delimiters] — 按多分隔符切分输入字符串（任意匹配即切，丢弃空片段）
    //! - [parse_scalar] — 按 schema type 将原始字符串解析为 typed Value
    //! - [scalar_array_item_type] — 判定数组是否为标量数组并返回其 item 类型
    //! - [to_kebab_case] — 将 camelCase/snake_case 转为 kebab-case
    //!
    //! ### 关键分支与异常路径
    //! - 非 object schema → build_args_from_schema 返回 None；matches_to_value 返回空 Map
    //! - 标量数组（string/number/integer items）→ num_args(0..)+Append；回读走 get_many 逐项 parse
    //! - 非标量数组（object/array items）→ value_name=json_array；回读走 get_one 整体 JSON 解析
    //! - array 分隔符由 `x-wecom-value-delimiter` 指令控制（字符串数组，每个元素一个分隔符）
    //! - split_by_delimiters：空分隔符列表时返回原串；连续/首尾分隔符产生空片段被丢弃
    //! - split_by_delimiters：任意分隔符匹配即切，不区分优先级
    //! - x-wecom-hidden 属性不生成 Arg（经 [JsonSchema::visible_properties] 过滤）
    //! - parse_scalar：number/integer 非法 → Err；无 type 时按 JSON 解析，非法 JSON → Err
    //!
    //! ### 上下游交互
    //! - 上游：build.rs::build_service_cmd 调 build_args_from_schema；
    //!   assemble.rs::assemble_payload 调 matches_to_value
    //! - 下游：依赖 [JsonSchema]、clap、serde_json

    use assert_json_diff::assert_json_eq;

    use super::*;

    // ── to_kebab_case ──

    /// P0：camelCase 转换为 kebab-case
    /// 条件：输入 "pageSize"
    /// 断言：输出 "page-size"
    #[test]
    fn camel_case() {
        assert_eq!(to_kebab_case("pageSize"), "page-size");
    }

    /// P0：snake_case 转换为 kebab-case
    /// 条件：输入 "page_size"
    /// 断言：输出 "page-size"
    #[test]
    fn snake_case() {
        assert_eq!(to_kebab_case("page_size"), "page-size");
    }

    /// P1：已全小写的字符串保持不变
    /// 条件：输入 "name"
    /// 断言：输出仍为 "name"
    #[test]
    fn already_lowercase() {
        assert_eq!(to_kebab_case("name"), "name");
    }

    /// P1：全大写字符串转换为 kebab-case
    /// 条件：输入 "HTTP"
    /// 断言：每个字母间插入连字符，输出 "h-t-t-p"
    #[test]
    fn all_uppercase() {
        assert_eq!(to_kebab_case("HTTP"), "h-t-t-p");
    }

    /// P1：混合 camelCase 和下划线的字符串
    /// 条件：输入 "myField_name"
    /// 断言：正确转换为 "my-field-name"
    #[test]
    fn mixed_camel_and_underscore() {
        assert_eq!(to_kebab_case("myField_name"), "my-field-name");
    }

    /// P1：首字母大写的 camelCase 转换
    /// 条件：输入 "AccessToken"
    /// 断言：转换为 "access-token"
    #[test]
    fn leading_uppercase() {
        assert_eq!(to_kebab_case("AccessToken"), "access-token");
    }

    /// P1：空字符串输入
    /// 条件：输入 ""
    /// 断言：返回空字符串
    #[test]
    fn empty_string() {
        assert_eq!(to_kebab_case(""), "");
    }

    /// P1：单字符输入的 kebab-case 转换
    /// 条件：输入 "a" 和 "A"
    /// 断言："a" 不变，"A" 转为小写 "a"
    #[test]
    fn single_char() {
        assert_eq!(to_kebab_case("a"), "a");
        assert_eq!(to_kebab_case("A"), "a");
    }

    /// P1：连续下划线处理
    /// 条件：输入包含双下划线 "__" 的字符串 "a__b"
    /// 断言：不产生多余连字符，输出 "a-b"
    #[test]
    fn consecutive_underscores() {
        assert_eq!(to_kebab_case("a__b"), "a-b");
    }

    // ── build_args_from_schema ──

    /// P1：非 object 类型 schema 返回 None
    /// 条件：schema 类型为 "string"
    /// 断言：build_args_from_schema 返回 None
    #[test]
    fn non_object_schema_returns_none() {
        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            ..Default::default()
        };
        assert!(build_args_from_schema(&schema).is_none());
    }

    /// P1：无类型字段的 schema 返回 None
    /// 条件：使用默认 JsonSchema（无 type 字段）
    /// 断言：build_args_from_schema 返回 None
    #[test]
    fn no_type_schema_returns_none() {
        let schema = JsonSchema::default();
        assert!(build_args_from_schema(&schema).is_none());
    }

    /// P1：空 object 类型 schema 返回空参数列表
    /// 条件：schema 类型为 "object" 且无 properties
    /// 断言：返回的 args 列表为空
    #[test]
    fn empty_object_schema_returns_empty_args() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        assert!(args.is_empty());
    }

    /// P0：含 string 属性的 object schema 正确解析
    /// 条件：object 包含一个 string 类型的 "name" 属性
    /// 断言：生成 1 个参数，id 为 "name"
    #[test]
    fn object_with_string_property() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "name".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        description: Some("User name".to_string()),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        assert_eq!(args.len(), 1);
        assert_eq!(args[0].get_id(), "name");
    }

    /// P1：[build_args_from_schema] x-wecom-hidden 属性不生成 Arg
    /// 条件：object 含 visible(string) 与 secret(string, x-wecom-hidden=true) 两个属性
    /// 断言：仅生成 1 个参数，id 为 "visible"，无 "secret"
    #[test]
    fn hidden_property_is_not_built_into_arg() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "visible".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        ..Default::default()
                    }),
                );
                m.insert(
                    "secret".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        directives: crate::schema::JsonSchemaWecomDirectives {
                            hidden: Some(crate::schema::WecomBoolValue::default()),
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        let ids: Vec<String> = args.iter().map(|a| a.get_id().to_string()).collect();
        assert_eq!(ids, vec!["visible".to_string()]);
    }

    /// P0：包含多种类型属性的 object schema
    /// 条件：包含 string/integer/number/boolean/array/object 六种属性
    /// 断言：生成 6 个参数
    #[test]
    fn object_with_multiple_types() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "name".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("string".to_string()),
                        ..Default::default()
                    }),
                );
                m.insert(
                    "age".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("integer".to_string()),
                        ..Default::default()
                    }),
                );
                m.insert(
                    "score".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("number".to_string()),
                        ..Default::default()
                    }),
                );
                m.insert(
                    "active".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("boolean".to_string()),
                        ..Default::default()
                    }),
                );
                m.insert(
                    "tags".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(std::sync::Arc::new(JsonSchema {
                            schema_type: Some("string".to_string()),
                            ..Default::default()
                        })),
                        ..Default::default()
                    }),
                );
                m.insert(
                    "meta".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("object".to_string()),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        assert_eq!(args.len(), 6);
    }

    /// P1：数组元素为非基本类型时使用 json_array 作为值名
    /// 条件：array 的 items 为 object 类型而非基本类型
    /// 断言：仍正确生成 1 个参数
    #[test]
    fn array_without_typed_items_uses_json_array() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "items".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(std::sync::Arc::new(JsonSchema {
                            schema_type: Some("object".to_string()),
                            ..Default::default()
                        })),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        assert_eq!(args.len(), 1);
    }

    // ── 数组 value_delimiter 行为 ──

    /// P1：[build_args_from_schema] 字符串数组不设置 value_delimiter
    /// 条件：schema 定义 tags 为 string 数组，输入 --tags a,b
    /// 断言：--tags a,b 被当作单个值 "a,b"（不会被逗号分割）
    #[test]
    fn string_array_no_value_delimiter() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "tags".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(std::sync::Arc::new(JsonSchema {
                            schema_type: Some("string".to_string()),
                            ..Default::default()
                        })),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        let cmd = clap::Command::new("test").args(args);
        let matches = cmd.try_get_matches_from(["test", "--tags", "a,b"]).unwrap();
        let values: Vec<&str> = matches
            .get_many::<String>("tags")
            .unwrap()
            .map(|s| s.as_str())
            .collect();
        assert_eq!(
            values,
            vec!["a,b"],
            "string array should not split by comma"
        );
    }

    /// P1：[build_args_from_schema] 数字数组可通过 x-wecom-value-delimiter 指定分隔符
    /// 条件：schema 定义 ids 为 number 数组且指定 `x-wecom-value-delimiter: ","`，输入 --ids 1,2
    /// 断言：--ids 1,2 被逗号分割为两个值 "1", "2"
    #[test]
    fn number_array_has_value_delimiter() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "ids".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(std::sync::Arc::new(JsonSchema {
                            schema_type: Some("number".to_string()),
                            ..Default::default()
                        })),
                        directives: crate::schema::JsonSchemaWecomDirectives {
                            value_delimiters: vec![",".to_string()],
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        let cmd = clap::Command::new("test").args(args);
        let matches = cmd.try_get_matches_from(["test", "--ids", "1,2"]).unwrap();
        let result = matches_to_value(&schema, &matches).unwrap();
        assert_json_eq!(result["ids"], serde_json::json!([1, 2]));
    }

    /// P1：[build_args_from_schema] 整数数组可通过 x-wecom-value-delimiter 指定分隔符
    /// 条件：schema 定义 ids 为 integer 数组且指定 `x-wecom-value-delimiter: [","]`，输入 --ids 1,2,3
    /// 断言：--ids 1,2,3 被逗号分割为三个值 [1,2,3]
    #[test]
    fn integer_array_has_value_delimiter() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "ids".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(std::sync::Arc::new(JsonSchema {
                            schema_type: Some("integer".to_string()),
                            ..Default::default()
                        })),
                        directives: crate::schema::JsonSchemaWecomDirectives {
                            value_delimiters: vec![",".to_string()],
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        let cmd = clap::Command::new("test").args(args);
        let matches = cmd
            .try_get_matches_from(["test", "--ids", "1,2,3"])
            .unwrap();
        let result = matches_to_value(&schema, &matches).unwrap();
        assert_json_eq!(result["ids"], serde_json::json!([1, 2, 3]));
    }

    // ── parse_scalar ──

    /// P0：[parse_scalar] 将字符串解析为 String 类型 Value
    /// 条件：schema_type 为 "string"
    /// 断言：返回 Value::String("hello")
    #[test]
    fn parse_scalar_string() {
        let v = parse_scalar("hello", Some("string")).unwrap();
        assert_json_eq!(v, serde_json::json!("hello"));
    }

    /// P0：[parse_scalar] 将数字字符串解析为 Number 类型 Value
    /// 条件：schema_type 为 "number"，输入 "42"
    /// 断言：返回 json!(42)
    #[test]
    fn parse_scalar_number() {
        let v = parse_scalar("42", Some("number")).unwrap();
        assert_json_eq!(v, serde_json::json!(42));
    }

    /// P0：[parse_scalar] 将整数字符串解析为 Number 类型 Value
    /// 条件：schema_type 为 "integer"，输入 "100"
    /// 断言：返回 json!(100)
    #[test]
    fn parse_scalar_integer() {
        let v = parse_scalar("100", Some("integer")).unwrap();
        assert_json_eq!(v, serde_json::json!(100));
    }

    /// P0：[parse_scalar] 将浮点数字符串解析为 Number 类型 Value
    /// 条件：schema_type 为 "number"，输入 "1.21"
    /// 断言：返回 json!(1.21)
    #[test]
    fn parse_scalar_float() {
        let v = parse_scalar("1.21", Some("number")).unwrap();
        assert_json_eq!(v, serde_json::json!(1.21));
    }

    /// P1：[parse_scalar] 对非法 number 字符串返回错误
    /// 条件：schema_type 为 "number"，输入 "abc"
    /// 断言：返回 Err
    #[test]
    fn parse_scalar_invalid_number() {
        let err = parse_scalar("abc", Some("number"));
        assert!(err.is_err());
    }

    /// P1：[parse_scalar] 对非法 integer 字符串返回错误
    /// 条件：schema_type 为 "integer"，输入 "not_a_number"
    /// 断言：返回 Err
    #[test]
    fn parse_scalar_invalid_integer() {
        let err = parse_scalar("not_a_number", Some("integer"));
        assert!(err.is_err());
    }

    /// P1：[parse_scalar] 无类型（None）时将 "null" 解析为 JSON null
    /// 条件：schema_type 为 None，输入 "null"
    /// 断言：返回 Value::Null
    #[test]
    fn parse_scalar_json_null() {
        let v = parse_scalar("null", None).unwrap();
        assert!(v.is_null());
    }

    /// P1：[parse_scalar] 无类型时将 JSON object 字符串解析为 Object
    /// 条件：schema_type 为 None，输入 r#"{"a":1}"#
    /// 断言：返回 json!({"a": 1})
    #[test]
    fn parse_scalar_json_object() {
        let v = parse_scalar(r#"{"a":1}"#, None).unwrap();
        assert_json_eq!(v, serde_json::json!({"a": 1}));
    }

    /// P1：[parse_scalar] 无类型时将 JSON array 字符串解析为 Array
    /// 条件：schema_type 为 None，输入 "[1,2,3]"
    /// 断言：返回 json!([1, 2, 3])
    #[test]
    fn parse_scalar_json_array() {
        let v = parse_scalar("[1,2,3]", None).unwrap();
        assert_json_eq!(v, serde_json::json!([1, 2, 3]));
    }

    /// P1：[parse_scalar] 无类型时将 "true" 解析为 JSON boolean
    /// 条件：schema_type 为 None，输入 "true"
    /// 断言：返回 Value::Bool(true)
    #[test]
    fn parse_scalar_json_bool() {
        let v = parse_scalar("true", None).unwrap();
        assert_json_eq!(v, serde_json::json!(true));
    }

    /// P1：[parse_scalar] 对非法 JSON 字符串返回错误
    /// 条件：schema_type 为 None，输入 "{bad}"
    /// 断言：返回 Err
    #[test]
    fn parse_scalar_invalid_json() {
        let err = parse_scalar("{bad}", None);
        assert!(err.is_err());
    }

    // ── matches_to_value ──

    fn make_test_object_schema(props: &[(&str, &str)]) -> JsonSchema {
        let mut schema = JsonSchema {
            schema_type: Some("object".into()),
            ..Default::default()
        };
        for &(name, schema_type) in props {
            let prop = JsonSchema {
                schema_type: Some(schema_type.to_string()),
                ..Default::default()
            };
            schema
                .properties
                .insert(name.to_string(), std::sync::Arc::new(prop));
        }
        schema
    }

    /// P1：[matches_to_value] 对非 object 类型 schema 返回空结果
    /// 条件：schema 类型为 "string"，提供了 --name 参数
    /// 断言：返回空的 Map（非 object schema 不处理参数）
    #[test]
    fn matches_to_value_non_object_schema_returns_empty() {
        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            ..Default::default()
        };

        let cmd = clap::Command::new("test").arg(clap::arg!(--name <NAME>));
        let matches = cmd
            .try_get_matches_from(vec!["test", "--name", "alice"])
            .unwrap();

        let result = matches_to_value(&schema, &matches).unwrap();
        assert!(result.is_empty());
    }

    /// P1：[matches_to_value] 在布尔标志未提供时不包含该字段
    /// 条件：schema 有 boolean 类型 "active" 字段，未传 --active
    /// 断言：结果中不含 "active" 键
    #[test]
    fn matches_to_value_boolean_flag_absent_not_included() {
        let schema = make_test_object_schema(&[("active", "boolean")]);
        let cmd = clap::Command::new("test").arg(clap::arg!(--active));
        let matches = cmd.clone().try_get_matches_from(vec!["test"]).unwrap();

        let result = matches_to_value(&schema, &matches).unwrap();
        assert!(!result.contains_key("active"));
    }

    /// P0：[matches_to_value] 在布尔标志提供时包含 true 值
    /// 条件：schema 有 boolean 类型 "active" 字段，传入 --active
    /// 断言：结果中 "active" 为 Value::Bool(true)
    #[test]
    fn matches_to_value_boolean_flag_present_included_as_true() {
        let schema = make_test_object_schema(&[("active", "boolean")]);
        let cmd = clap::Command::new("test").arg(clap::arg!(--active));
        let matches = cmd
            .clone()
            .try_get_matches_from(vec!["test", "--active"])
            .unwrap();

        let result = matches_to_value(&schema, &matches).unwrap();
        assert_eq!(result.get("active"), Some(&Value::Bool(true)));
    }

    /// P1：[matches_to_value] 对空 properties 的 object schema 返回空 Map
    /// 条件：schema 类型为 "object" 但无 properties
    /// 断言：返回空的 Map
    #[test]
    fn matches_to_value_empty_properties_returns_empty_map() {
        let schema = JsonSchema {
            schema_type: Some("object".into()),
            ..Default::default()
        };

        let cmd = clap::Command::new("test");
        let matches = cmd.try_get_matches_from(vec!["test"]).unwrap();

        let result = matches_to_value(&schema, &matches).unwrap();
        assert!(result.is_empty());
    }

    /// P0：[matches_to_value] 标量数组按 items 类型逐项 parse 为 typed Array
    /// 条件：ids 为 integer 数组（value_delimiter=","），输入 --ids 1,2,3
    /// 断言：结果中 "ids" 为 json!([1, 2, 3])（数字而非字符串）
    #[test]
    fn matches_to_value_scalar_array_parsed_per_item() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "ids".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(std::sync::Arc::new(JsonSchema {
                            schema_type: Some("integer".to_string()),
                            ..Default::default()
                        })),
                        directives: crate::schema::JsonSchemaWecomDirectives {
                            value_delimiters: vec![",".to_string()],
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        let cmd = clap::Command::new("test").args(args);
        let matches = cmd
            .try_get_matches_from(["test", "--ids", "1,2,3"])
            .unwrap();

        let result = matches_to_value(&schema, &matches).unwrap();
        assert_json_eq!(result["ids"], serde_json::json!([1, 2, 3]));
    }

    /// P2：[matches_to_value] 标量值定型失败时错误带参数名且不重复包裹
    /// 条件：schema 定义 pageSize 为 integer，输入 --page-size abc（无法解析为数字）
    /// 断言：消息含 "--page-size" 参数标识与 "不是有效的数值" 原因，
    ///       且不出现内层 Error 的 "ValidationError:" / "[code=" 重复包裹
    #[test]
    fn matches_to_value_scalar_error_is_complete_and_not_double_wrapped() {
        let schema = make_test_object_schema(&[("pageSize", "integer")]);
        let args = build_args_from_schema(&schema).unwrap();
        let cmd = clap::Command::new("test").args(args);
        let matches = cmd
            .try_get_matches_from(["test", "--page-size", "abc"])
            .unwrap();
        let err = matches_to_value(&schema, &matches).unwrap_err();
        let msg = err.message();
        assert!(msg.contains("--page-size"), "应指明出错参数，got: {msg}");
        assert!(msg.contains("不是有效的数值"), "应说明具体原因，got: {msg}");
        assert!(
            !msg.contains("ValidationError:") && !msg.contains("[code="),
            "不应重复包裹内层 Error 的 Display，got: {msg}"
        );
    }

    // ── split_by_delimiters ──

    /// P0：[split_by_delimiters] 空的 delimiter 列表时返回原字符串
    /// 条件：delimiters 为空 vec![]
    /// 断言：返回 vec![input]
    #[test]
    fn split_by_delimiters_empty() {
        let result = split_by_delimiters("a,b", &[]);
        assert_eq!(result, vec!["a,b"]);
    }

    /// P0：[split_by_delimiters] 单个分隔符正确切分
    /// 条件：delimiters = ["，"]，input = "1,2,3"
    /// 断言：返回 ["1","2","3"]
    #[test]
    fn split_by_delimiters_single_comma() {
        let result = split_by_delimiters("1,2,3", &[","]);
        assert_eq!(result, vec!["1", "2", "3"]);
    }

    /// P0：[split_by_delimiters] 多个分隔符正确切分（含中文标点）
    /// 条件：delimiters = ["，","；",",",";"]，input = "1，2；3,4"
    /// 断言：返回 ["1","2","3","4"]
    #[test]
    fn split_by_delimiters_multi_cn() {
        let delims: &[&str] = &["，", "；", ",", ";"];
        let result = split_by_delimiters("1，2；3,4", delims);
        assert_eq!(result, vec!["1", "2", "3", "4"]);
    }

    /// P1：[split_by_delimiters] 多字符分隔符
    /// 条件：delimiters = ["::"]，input = "1::2::3"
    /// 断言：返回 ["1","2","3"]
    #[test]
    fn split_by_delimiters_multi_char() {
        let result = split_by_delimiters("1::2::3", &["::"]);
        assert_eq!(result, vec!["1", "2", "3"]);
    }

    /// P1：[split_by_delimiters] 任意匹配：先注册的多字符分隔符命中即切
    /// 条件：delimiters = ["::", ":"]，input = "1::2:3"
    /// 断言："::" 先被检中，返回 ["1","2","3"]
    #[test]
    fn split_by_delimiters_longest_match_first() {
        let delims: &[&str] = &["::", ":"];
        let result = split_by_delimiters("1::2:3", delims);
        assert_eq!(result, vec!["1", "2", "3"]);
    }

    /// P1：[split_by_delimiters] 连续分隔符丢弃空片段
    /// 条件：delimiters = ["，"]，input = "1,,2"
    /// 断言：空片段被丢弃，返回 ["1","2"]
    #[test]
    fn split_by_delimiters_consecutive_dropped() {
        let result = split_by_delimiters("1,,2", &[","]);
        assert_eq!(result, vec!["1", "2"]);
    }

    /// P1：[split_by_delimiters] 首尾分隔符丢弃空片段
    /// 条件：delimiters = ["，"]，input = ",1,2,"
    /// 断言：首尾空片段被丢弃，返回 ["1","2"]
    #[test]
    fn split_by_delimiters_trailing_leading_dropped() {
        let result = split_by_delimiters(",1,2,", &[","]);
        assert_eq!(result, vec!["1", "2"]);
    }

    /// P2：[split_by_delimiters] 无匹配分隔符时返回原串
    /// 条件：delimiters = ["，"]，input = "hello"
    /// 断言：返回 ["hello"]
    #[test]
    fn split_by_delimiters_no_match() {
        let result = split_by_delimiters("hello", &[","]);
        assert_eq!(result, vec!["hello"]);
    }

    /// P1：[split_by_delimiters] 单个元素（无分隔符）
    /// 条件：delimiters = ["，"]，input = "42"
    /// 断言：返回 ["42"]
    #[test]
    fn split_by_delimiters_single_element() {
        let result = split_by_delimiters("42", &[","]);
        assert_eq!(result, vec!["42"]);
    }

    // ── matches_to_value with delimiters ──

    /// P0：[matches_to_value] 多分隔符数组合并中文分隔符
    /// 条件：integer 数组 value_delimiters=["，","；","，"，";"]，输入 --ids 1，2；3,4
    /// 断言：解析后为 json!([1,2,3,4])
    #[test]
    fn matches_to_value_multi_delimiter_cn() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "ids".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(std::sync::Arc::new(JsonSchema {
                            schema_type: Some("integer".to_string()),
                            ..Default::default()
                        })),
                        directives: crate::schema::JsonSchemaWecomDirectives {
                            value_delimiters: vec![
                                ",".to_string(),
                                "，".to_string(),
                                ";".to_string(),
                                "；".to_string(),
                                "::".to_string(),
                            ],
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        let cmd = clap::Command::new("test").args(args);
        let matches = cmd
            .try_get_matches_from(["test", "--ids", "1，2；3,4::5"])
            .unwrap();
        let result = matches_to_value(&schema, &matches).unwrap();
        assert_json_eq!(result["ids"], serde_json::json!([1, 2, 3, 4, 5]));
    }

    /// P0：[matches_to_value] Append 与分隔符切分叠加
    /// 条件：integer 数组 value_delimiters=["，"]，输入 --ids 1,2 --ids 3
    /// 断言：Append 与切分叠加，结果为 json!([1,2,3])
    #[test]
    fn matches_to_value_append_and_split_combined() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "ids".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(std::sync::Arc::new(JsonSchema {
                            schema_type: Some("integer".to_string()),
                            ..Default::default()
                        })),
                        directives: crate::schema::JsonSchemaWecomDirectives {
                            value_delimiters: vec![",".to_string()],
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        let cmd = clap::Command::new("test").args(args);
        let matches = cmd
            .try_get_matches_from(["test", "--ids", "1,2", "--ids", "3"])
            .unwrap();
        let result = matches_to_value(&schema, &matches).unwrap();
        assert_json_eq!(result["ids"], serde_json::json!([1, 2, 3]));
    }

    /// P1：[matches_to_value] 字符串数组启用分隔符后也切分
    /// 条件：string 数组 value_delimiters=["，"]，输入 --tags a,b
    /// 断言：切分为 json!(["a","b"])
    #[test]
    fn matches_to_value_string_array_with_delimiter() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "tags".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(std::sync::Arc::new(JsonSchema {
                            schema_type: Some("string".to_string()),
                            ..Default::default()
                        })),
                        directives: crate::schema::JsonSchemaWecomDirectives {
                            value_delimiters: vec![",".to_string()],
                            ..Default::default()
                        },
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        let cmd = clap::Command::new("test").args(args);
        let matches = cmd.try_get_matches_from(["test", "--tags", "a,b"]).unwrap();
        let result = matches_to_value(&schema, &matches).unwrap();
        assert_json_eq!(result["tags"], serde_json::json!(["a", "b"]));
    }

    /// P1：[matches_to_value] 未设置分隔符时字符串数组不切分
    /// 条件：string 数组无 value_delimiters（默认空），输入 --tags a,b
    /// 断言：--tags a,b 被当作单个值 "a,b"
    #[test]
    fn matches_to_value_string_array_no_delimiter() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert(
                    "tags".to_string(),
                    std::sync::Arc::new(JsonSchema {
                        schema_type: Some("array".to_string()),
                        items: Some(std::sync::Arc::new(JsonSchema {
                            schema_type: Some("string".to_string()),
                            ..Default::default()
                        })),
                        ..Default::default()
                    }),
                );
                m
            },
            ..Default::default()
        };
        let args = build_args_from_schema(&schema).unwrap();
        let cmd = clap::Command::new("test").args(args);
        let matches = cmd.try_get_matches_from(["test", "--tags", "a,b"]).unwrap();
        let result = matches_to_value(&schema, &matches).unwrap();
        assert_json_eq!(result["tags"], serde_json::json!(["a,b"]));
    }
}
