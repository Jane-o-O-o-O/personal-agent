//! schema 指令标记探测：递归遍历器（`$ref` 经 schemas 解析、循环引用按
//! 访问集合剪枝），供 multipart / 下载形态判定使用。

use std::collections::HashSet;

use indexmap::IndexMap;

use crate::schema;

/// 递归判断 schema 是否声明了 `x-wecom-octet-stream: true` 的字段。
pub fn check_has_octet_stream(
    schemas: &IndexMap<String, schema::JsonSchema>,
    schema: &schema::JsonSchema,
) -> bool {
    has_marker(
        schemas,
        schema,
        &mut HashSet::new(),
        &|d: &schema::JsonSchemaWecomDirectives| d.octet_stream.is_some(),
    )
}

/// 统一的 schema 遍历器：命中任意满足 `pred` 的节点即返回 true。
///
/// `$ref` 经 `schemas` 解析；循环引用按访问集合剪枝（存在性判定单调，
/// 重复分支无需重访）。
///
/// 下钻剪枝与 [`collect_directives`](super::collect_directives) 保持一致：
/// `oneOf` / `enum` 非空或缺少 `type` 的节点不产生指令，此处同样不再
/// 下钻。若两边规则漂移，会出现「判定为 multipart 却物化不出文件字段」
/// 的错位——整单以无文件的 multipart 形态发出。
fn has_marker(
    schemas: &IndexMap<String, schema::JsonSchema>,
    schema: &schema::JsonSchema,
    visited: &mut HashSet<String>,
    pred: &dyn Fn(&schema::JsonSchemaWecomDirectives) -> bool,
) -> bool {
    if pred(&schema.directives) {
        return true;
    }
    if let Some(name) = &schema.schema_ref
        && visited.insert(name.clone())
        && let Some(target) = schemas.get(name)
        && has_marker(schemas, target, visited, pred)
    {
        return true;
    }
    // 剪枝对齐 collect_directives::walk_node：oneOf / enum 短路、无 type
    // 不进入子节点。
    if !schema.one_of.is_empty() || !schema.enum_values.is_empty() {
        return false;
    }
    if schema.schema_type.is_none() {
        return false;
    }
    schema
        .properties
        .values()
        .any(|c| has_marker(schemas, c, visited, pred))
        || schema
            .items
            .as_ref()
            .is_some_and(|items| has_marker(schemas, items, visited, pred))
        || match schema.additional_properties.as_deref() {
            Some(schema::AdditionalProperties::Schema(s)) => has_marker(schemas, s, visited, pred),
            _ => false,
        }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：marker（schema 指令标记探测）
    //!
    //! ### 关键接口
    //! - [check_has_octet_stream] — 递归检查 `x-wecom-octet-stream` 标记
    //!
    //! ### 关键分支与异常路径
    //! - 顶层标记、properties 嵌套、items 嵌套、$ref 解析四种命中路径
    //! - 无标记 → false；$ref 目标缺失 → false；循环 $ref → 剪枝不死循环
    //! - oneOf / enum / 无 type 节点 → 剪枝不下钻（与 collect_directives 一致）
    //!
    //! ### 上下游交互
    //! - 上游：[crate::service::execute]（multipart 判定）、[crate::service::doc]（--doc 下载形态）
    //! - 下游：读 [schema::JsonSchema] 的 directives 与 schema_ref

    use std::sync::Arc;

    use super::*;
    use crate::schema::{JsonSchema, WecomBoolValue};

    fn schemas(entries: Vec<(&str, JsonSchema)>) -> IndexMap<String, JsonSchema> {
        entries
            .into_iter()
            .map(|(k, v)| (k.to_string(), v))
            .collect()
    }

    fn make_schema() -> JsonSchema {
        JsonSchema {
            schema_type: Some("object".into()),
            ..Default::default()
        }
    }

    /// octet_stream 标记恒位于 string 叶子（文件路径字段），与生产 schema 形状一致。
    fn with_octet_stream() -> JsonSchema {
        JsonSchema {
            schema_type: Some("string".into()),
            directives: schema::JsonSchemaWecomDirectives {
                octet_stream: Some(WecomBoolValue::default()),
                ..Default::default()
            },
            ..Default::default()
        }
    }

    /// P1：空 schema 无 octet_stream 标记时返回 false
    #[test]
    fn no_marker() {
        assert!(!check_has_octet_stream(&schemas(vec![]), &make_schema()));
    }

    /// P0：顶层 schema 直接标记 octet_stream 时返回 true
    #[test]
    fn direct_octet_stream() {
        assert!(check_has_octet_stream(
            &schemas(vec![]),
            &with_octet_stream()
        ));
    }

    /// P0：嵌套在 properties / items / additionalProperties 中的 octet_stream 标记均可检出
    #[test]
    fn nested_octet_stream() {
        let s = schemas(vec![]);

        let mut prop = make_schema();
        prop.properties
            .insert("data".into(), Arc::new(with_octet_stream()));
        assert!(check_has_octet_stream(&s, &prop));

        let array = JsonSchema {
            schema_type: Some("array".into()),
            items: Some(Arc::new(with_octet_stream())),
            ..Default::default()
        };
        assert!(check_has_octet_stream(&s, &array));

        let mut ap = make_schema();
        ap.additional_properties = Some(Box::new(schema::AdditionalProperties::Schema(Arc::new(
            with_octet_stream(),
        ))));
        assert!(check_has_octet_stream(&s, &ap));
    }

    /// P0：oneOf / enum / 无 type 的节点不再下钻（与 collect_directives 剪枝对齐——
    ///      这些位置的指令不会被收集，检出只会造成「无文件字段的 multipart」错位）
    #[test]
    fn pruned_branches_not_detected() {
        let s = schemas(vec![]);

        // oneOf 分支内的标记：collect 在 oneOf 非空时短路返回，marker 同样剪枝
        let mut one_of = make_schema();
        one_of.one_of.push(Arc::new(with_octet_stream()));
        assert!(!check_has_octet_stream(&s, &one_of));

        // enum 非空的节点：collect 短路返回
        let mut with_enum = make_schema();
        with_enum.enum_values = vec![serde_json::json!("a")];
        with_enum
            .properties
            .insert("data".into(), Arc::new(with_octet_stream()));
        assert!(!check_has_octet_stream(&s, &with_enum));

        // 无 type 的容器节点：collect 不进入其子节点
        let typeless = JsonSchema {
            properties: {
                let mut m = indexmap::IndexMap::new();
                m.insert("data".into(), Arc::new(with_octet_stream()));
                m
            },
            ..Default::default()
        };
        assert!(!check_has_octet_stream(&s, &typeless));
    }

    /// P1：深层嵌套属性中无 octet_stream 标记时返回 false
    #[test]
    fn deep_no_marker() {
        let mut s = make_schema();
        let mut child = make_schema();
        child.properties.insert("x".into(), Arc::new(make_schema()));
        s.properties.insert("data".into(), Arc::new(child));
        assert!(!check_has_octet_stream(&schemas(vec![]), &s));
    }

    /// P0：$ref 经 schemas 解析后命中目标内的标记
    #[test]
    fn ref_resolved_marker_hit() {
        let s = schemas(vec![("Res", with_octet_stream())]);
        let r = JsonSchema {
            schema_ref: Some("Res".into()),
            ..Default::default()
        };
        assert!(check_has_octet_stream(&s, &r));
    }

    /// P1：$ref 目标缺失时返回 false
    #[test]
    fn missing_ref_target_is_false() {
        let s = schemas(vec![]);
        let r = JsonSchema {
            schema_ref: Some("Missing".into()),
            ..Default::default()
        };
        assert!(!check_has_octet_stream(&s, &r));
    }

    /// P1：循环 $ref 安全剪枝，不死循环
    #[test]
    fn circular_ref_terminates() {
        let a = JsonSchema {
            schema_ref: Some("B".into()),
            ..Default::default()
        };
        let b = JsonSchema {
            schema_ref: Some("A".into()),
            ..Default::default()
        };
        let s = schemas(vec![("A", a), ("B", b)]);
        let r = JsonSchema {
            schema_ref: Some("A".into()),
            ..Default::default()
        };
        assert!(!check_has_octet_stream(&s, &r));
    }

    /// P0：marker 判定与 [collect_directives](super::collect_directives) 收集结论一致
    ///
    /// 回归锁定：历史上两套遍历规则各自漂移——marker 不解 $ref（收集了文件字段却按
    /// JSON 发送）、marker 下钻 oneOf（multipart=true 但零文件字段）。两侧必须同真同假。
    #[test]
    fn marker_consistent_with_collect_directives() {
        use crate::directive::{Directive, collect_directives};

        let collected = |schemas: &IndexMap<String, JsonSchema>,
                         schema: &JsonSchema,
                         data: &serde_json::Value| {
            collect_directives(schemas, schema, data, std::path::Path::new("/tmp"))
                .iter()
                .any(|d| matches!(d, Directive::UploadMultipart { .. }))
        };

        // 平铺 properties：marker 检出 ⇔ 指令被收集
        let mut flat = make_schema();
        flat.properties
            .insert("media".into(), Arc::new(with_octet_stream()));
        let data = serde_json::json!({"media": "/tmp/x.png"});
        let s = schemas(vec![]);
        assert!(check_has_octet_stream(&s, &flat));
        assert!(collected(&s, &flat, &data));

        // $ref 包装：两侧都解析
        let s = schemas(vec![("Req", flat)]);
        let r = JsonSchema {
            schema_ref: Some("Req".into()),
            ..Default::default()
        };
        assert!(check_has_octet_stream(&s, &r));
        assert!(collected(&s, &r, &data));

        // oneOf 内的标记：两侧都剪枝，同假
        let mut one_of = make_schema();
        one_of.one_of.push(Arc::new(with_octet_stream()));
        assert_eq!(
            check_has_octet_stream(&s, &one_of),
            collected(&s, &one_of, &data),
            "oneOf 分支必须同真同假"
        );

        // 无 type 容器内的标记：两侧同假
        let typeless = JsonSchema {
            properties: {
                let mut m = IndexMap::new();
                m.insert("media".into(), Arc::new(with_octet_stream()));
                m
            },
            ..Default::default()
        };
        assert_eq!(
            check_has_octet_stream(&s, &typeless),
            collected(&s, &typeless, &data),
            "无 type 节点必须同真同假"
        );
    }
}
