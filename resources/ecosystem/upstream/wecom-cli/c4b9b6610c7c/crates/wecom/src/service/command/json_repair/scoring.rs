//! Schema-based candidate scoring for [`super::repair_json`].
//!
//! The schema merely *ranks* strict-valid candidates by declared keys —
//! it never vetoes: types, `enum`, `additionalProperties` and `required`
//! are all left to the backend. Only `properties` / `oneOf` /
//! `additionalProperties: Schema` contribute. If the backend ever emits
//! `anyOf` / `allOf` (the schema model has no such fields; they land in
//! the catch-all `extra`), declared-key counting degrades to zero, which
//! is exactly the no-schema "fewest escapes" heuristic.

use serde_json::Value;

use crate::schema::{AdditionalProperties, JsonSchema};

// ── Candidate scoring ─────────────────────────────────────

/// Count object keys declared vs undeclared by the schema, descending via
/// `properties` / `oneOf` / `additionalProperties: Schema`. Types, `enum`
/// and `required` are intentionally ignored: the schema only ranks
/// candidates, it never vetoes them.
pub(super) fn declared_key_hits(value: &Value, schema: &JsonSchema) -> (usize, usize) {
    let mut hits = (0, 0);
    walk_keys(value, &[schema], &mut hits);
    hits
}

fn walk_keys(value: &Value, schemas: &[&JsonSchema], hits: &mut (usize, usize)) {
    let mut expanded: Vec<&JsonSchema> = Vec::with_capacity(schemas.len());
    for schema in schemas {
        collect_branches(schema, &mut expanded);
    }
    match value {
        Value::Object(map) => {
            for (key, child) in map {
                let mut child_schemas: Vec<&JsonSchema> = Vec::new();
                for schema in &expanded {
                    if let Some(property) = schema.properties.get(key) {
                        child_schemas.push(property.as_ref());
                    }
                }
                if child_schemas.is_empty() {
                    for schema in &expanded {
                        if let Some(AdditionalProperties::Schema(additional)) =
                            schema.additional_properties.as_deref()
                        {
                            child_schemas.push(additional.as_ref());
                        }
                    }
                }
                if child_schemas.is_empty() {
                    hits.1 += 1;
                } else {
                    hits.0 += 1;
                }
                walk_keys(child, &child_schemas, hits);
            }
        }
        Value::Array(items) => {
            let item_schemas: Vec<&JsonSchema> = expanded
                .iter()
                .filter_map(|schema| schema.items.as_deref())
                .collect();
            for item in items {
                walk_keys(item, &item_schemas, hits);
            }
        }
        _ => {}
    }
}

/// Flatten a schema with its transitive `oneOf` branches so a key declared
/// in any branch counts as declared.
fn collect_branches<'a>(schema: &'a JsonSchema, out: &mut Vec<&'a JsonSchema>) {
    out.push(schema);
    for branch in &schema.one_of {
        collect_branches(branch, out);
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：scoring（schema 声明键打分，只排序不否决）
    //!
    //! ### 关键接口
    //! - [declared_key_hits] / [walk_keys] / [collect_branches] — 递归统计声明 / 未声明键
    //!
    //! ### 关键分支与异常路径
    //! - properties 命中 → 声明；未命中但 additionalProperties: Schema 存在 → 声明（动态键）；
    //!   否则未声明；oneOf 分支键并集均算声明；数组经 items 下潜；类型 / enum / required
    //!   全程不参与
    //!
    //! ### 上下游交互
    //! - 上游：[super::repair_json_inner] 的候选打分闭包
    //! - 下游：[JsonSchema]（properties / oneOf / items / additionalProperties）

    use serde_json::json;

    use super::*;

    /// P2：[declared_key_hits] 递归统计 properties / oneOf / additionalProperties 声明键
    /// 条件：schema 中 text 在 items 的 oneOf 分支、label 在 additionalProperties schema、
    ///       输入另含动态键 custom 与未声明键 extra
    /// 断言：声明键 5（rows、text、labels、custom 动态键、label）、未声明键 1（extra）
    #[test]
    fn declared_key_hits_covers_unions_and_maps() {
        let schema: JsonSchema = serde_json::from_value(json!({
            "type": "object",
            "properties": {
                "rows": {"type": "array", "items": {"oneOf": [
                    {"type": "null"},
                    {"type": "object", "properties": {
                        "text": {"oneOf": [{"type": "null"}, {"type": "string"}]}
                    }}
                ]}},
                "labels": {"type": "object", "additionalProperties": {
                    "type": "object", "properties": {"label": {"type": "string"}}
                }}
            }
        }))
        .unwrap();
        let value = json!({
            "rows": [null, {"text": "a"}],
            "labels": {"custom": {"label": "b"}},
            "extra": 1
        });
        assert_eq!(declared_key_hits(&value, &schema), (5, 1));
    }

    // ── repair_json 遥测 ──
}
