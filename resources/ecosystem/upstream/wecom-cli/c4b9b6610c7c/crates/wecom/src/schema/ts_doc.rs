use indexmap::IndexMap;
use serde_json::Value;

use super::types::*;

/// 缩进：每级 2 空格。
fn indent(depth: usize) -> String {
    "  ".repeat(depth)
}

/// TypeScript 代码生成器。
///
/// 遍历 schema 的过程中累积被引用到的 `$ref` 依赖名（[`deps`](Self::deps)）。
/// 把 `deps` 收进结构体后，各递归方法的签名无需透传 `&mut Vec<String>`；
/// 依赖图的展开由 [`schema_decls`] 在本模块内统一驱动。
#[derive(Default)]
struct TsPrinter {
    deps: Vec<String>,
}

/// 将 JsonSchema 转换为 TypeScript interface/type 声明。
/// 返回 (ts_code, deps)，其中 deps 是被引用到的其他 schema 名称。
pub fn schema_to_ts(name: &str, schema: &JsonSchema) -> (String, Vec<String>) {
    let mut p = TsPrinter::default();
    let mut ts = String::new();

    // 声明前的 JSDoc（description + 未识别属性）
    push_jsdoc(&mut ts, 0, schema);

    match schema.schema_type.as_deref() {
        Some("object") => {
            // interface 体与多行内联对象共用 fields_block 渲染。
            let ap = p.ap_val_type(schema.additional_properties.as_deref());
            ts.push_str(&format!(
                "interface {name} {}",
                p.fields_block(schema, 0, ap)
            ));
        }
        _ => {
            // 非 object 类型，生成 type alias
            ts.push_str(&format!("type {name} = {};", p.type_expr(schema, 0)));
        }
    }

    (ts, p.deps)
}

/// 给定一组根类型名（`roots`）与「名字 → [`JsonSchema`]」查找表（`schemas`），
/// 递归展开所有传递依赖，产出自包含的 TypeScript 声明集合（每个被引用到的
/// 命名 schema 一段，按发现顺序排列、去重）。
///
/// 这是「单条声明生成」([`schema_to_ts`]) 之上的「依赖图遍历」入口：调用方
/// （如 `service::doc`）只需给出根类型名，无需再自行处理 `deps` 队列。
pub fn schema_decls(schemas: &IndexMap<String, JsonSchema>, mut roots: Vec<String>) -> Vec<String> {
    let mut decls = vec![];
    let mut index = 0;

    while index < roots.len() {
        if let Some(schema) = schemas.get(&roots[index]) {
            let (decl, deps) = schema_to_ts(&roots[index], schema);
            for dep in deps {
                if !roots.contains(&dep) {
                    roots.push(dep);
                }
            }
            decls.push(decl);
        }
        index += 1;
    }

    decls
}

/// 判断该 schema 本身是否为「指向本地文件路径的 string」。
/// 即 type=string（或未指定 type 但带有文件相关 directive）且含有以下任一 directive：
/// - `upload_media = true`
/// - `octet_stream = true`
/// - `file_save = <...>`
fn is_file_path_string(schema: &JsonSchema) -> bool {
    let d = &schema.directives;
    let has_file_directive =
        d.upload_media.is_some() || d.octet_stream.is_some() || d.file_save.is_some();

    if !has_file_directive {
        return false;
    }

    // type 未指定时也视作 string（保持与原逻辑兼容）
    matches!(schema.schema_type.as_deref(), Some("string") | None)
}

/// 判断是否应当在该 schema 的 JSDoc 中输出「@note 指向本地文件路径」。
/// 支持以下两种情况：
/// 1. schema 本身是带有文件 directive 的 string；
/// 2. schema 是 array，且其 items 是带有文件 directive 的 string。
fn should_show_file_path_note(schema: &JsonSchema) -> bool {
    if is_file_path_string(schema) {
        return true;
    }

    if schema.schema_type.as_deref() == Some("array")
        && let Some(items) = &schema.items
    {
        return is_file_path_string(items.as_ref());
    }

    false
}

/// 收集一个 schema 的 JSDoc 文本行（description + 未识别属性的 @tag）。
/// 返回空 Vec 表示没有可展示的注释内容。
fn jsdoc_lines(schema: &JsonSchema) -> Vec<String> {
    let mut lines = vec![];

    if let Some(desc) = &schema.description {
        lines.extend(desc.split('\n').map(|s| s.to_string()));
    }

    // 将未识别的 schema 属性以 @tag 形式追加
    let mut extra_lines = vec![];

    if should_show_file_path_note(schema) {
        extra_lines.push("@note 指向本地文件路径".to_string());
    }

    if let Some(default) = &schema.default {
        extra_lines.push(format!("@default {}", default));
    }

    // 剩余未识别的属性
    for (key, val) in schema.extra.iter() {
        let val_str = match val {
            Value::String(s) => s.clone(),
            other => other.to_string(),
        };
        extra_lines.push(format!("@{} {}", key, val_str));
    }

    if !extra_lines.is_empty() {
        if !lines.is_empty() {
            lines.push(String::new());
        }
        lines.extend(extra_lines);
    }

    lines
}

/// 生成块级 JSDoc 注释，包含 description 和未识别的 schema 属性。
/// `depth` 控制缩进层级（顶层为 0，属性级别为 1，依此类推）。
/// 如果没有任何内容则不输出。
fn push_jsdoc(out: &mut String, depth: usize, schema: &JsonSchema) {
    let lines = jsdoc_lines(schema);
    if lines.is_empty() {
        return;
    }

    let pad = indent(depth);
    if lines.len() == 1 {
        out.push_str(&format!("{pad}/** {} */\n", lines[0]));
    } else {
        let joined = lines
            .iter()
            .map(|line| {
                if line.is_empty() {
                    format!("{pad} *")
                } else {
                    format!("{pad} * {line}")
                }
            })
            .collect::<Vec<String>>()
            .join("\n");
        out.push_str(&format!("{pad}/**\n{joined}\n{pad} */\n"));
    }
}

/// 生成内联 JSDoc 前缀（用于内联对象字面量的属性，需保持单行）。
/// 多行内容压缩为以空格分隔的单行 `/** ... */ `；无内容时返回空串。
fn inline_jsdoc(schema: &JsonSchema) -> String {
    let lines = jsdoc_lines(schema);
    if lines.is_empty() {
        return String::new();
    }
    let text = lines
        .into_iter()
        .filter(|l| !l.is_empty())
        .collect::<Vec<_>>()
        .join(" ");
    format!("/** {text} */ ")
}

impl TsPrinter {
    /// 将 JsonSchema 转换为 TypeScript 类型表达式（不含声明关键字）。
    ///
    /// `depth` 为该类型表达式所在行的缩进层级（每级 2 空格），用于内联对象
    /// 多行展开时计算子属性与右花括号的缩进。
    fn type_expr(&mut self, schema: &JsonSchema, depth: usize) -> String {
        // 枚举值优先
        if !schema.enum_values.is_empty() {
            let variants: Vec<_> = schema.enum_values.iter().map(|v| v.to_string()).collect();
            return variants.join(" | ");
        }

        // $ref 引用
        if let Some(ref_name) = &schema.schema_ref {
            self.deps.push(ref_name.clone());
            return ref_name.clone();
        }

        // oneOf → 联合类型
        if !schema.one_of.is_empty() {
            let variants: Vec<_> = schema
                .one_of
                .iter()
                .map(|v| self.type_expr(v, depth))
                .collect();
            return variants.join(" | ");
        }

        match schema.schema_type.as_deref() {
            Some("string") => "string".to_string(),
            Some("number" | "integer") => "number".to_string(),
            Some("boolean") => "boolean".to_string(),
            Some("null") => "null".to_string(),
            Some("array") => schema.items.as_ref().map_or_else(
                || "unknown[]".to_string(),
                |items| {
                    // 数组不增加缩进层级：`[]` 直接追加到内层类型之后。
                    let inner = self.type_expr(items, depth);
                    if inner.contains('|') && !inner.starts_with('{') {
                        format!("({inner})[]")
                    } else {
                        format!("{inner}[]")
                    }
                },
            ),
            Some("object") => self.object_expr(schema, depth),
            _ => "unknown".to_string(),
        }
    }

    /// 将 object 类型的 schema 转换为 TS 类型表达式。
    ///
    /// 当对象含多个属性、或任一属性带有 JSDoc、或存在 additionalProperties 时，
    /// 渲染为带缩进的多行字面量（复用 [`fields_block`](Self::fields_block)）以提升
    /// 可读性；简单的单属性无注释对象保持单行内联。
    fn object_expr(&mut self, schema: &JsonSchema, depth: usize) -> String {
        let ap = self.ap_val_type(schema.additional_properties.as_deref());

        let visible: Vec<(&String, &std::sync::Arc<JsonSchema>)> =
            schema.visible_properties().collect();

        if visible.is_empty() {
            // 无可见具名属性 → Record
            return format!("Record<string, {}>", ap.unwrap_or("unknown".to_string()));
        }

        let has_doc = visible.iter().any(|(_, p)| !jsdoc_lines(p).is_empty());
        let multiline = visible.len() > 1 || has_doc || ap.is_some();

        if !multiline {
            // 单行内联：`{ /** doc */ key: type }`
            let (key, prop) = visible[0];
            let opt = if schema.required.contains(key) {
                ""
            } else {
                "?"
            };
            return format!(
                "{{ {}{}{}: {} }}",
                inline_jsdoc(prop),
                key,
                opt,
                self.type_expr(prop, depth)
            );
        }

        self.fields_block(schema, depth, ap)
    }

    /// 渲染对象的字段块 `{\n <属性@depth+1> \n<indent(depth)>}`。
    ///
    /// 这是 interface 体与多行内联对象的**唯一**共用渲染入口：每个属性附块级
    /// JSDoc，子属性缩进 `depth+1`，右花括号回到 `depth`。`ap` 为调用方已解析的
    /// additionalProperties 值类型（避免重复解析与重复收集依赖）。
    fn fields_block(&mut self, schema: &JsonSchema, depth: usize, ap: Option<String>) -> String {
        let inner = depth + 1;
        let pad = indent(inner);

        let mut body = String::from("{\n");
        for (key, prop) in schema.visible_properties() {
            let opt = if schema.required.contains(key) {
                ""
            } else {
                "?"
            };
            push_jsdoc(&mut body, inner, prop);
            body.push_str(&format!(
                "{pad}{key}{opt}: {};\n",
                self.type_expr(prop, inner)
            ));
        }
        if let Some(val_type) = ap {
            body.push_str(&format!("{pad}[key: string]: {val_type};\n"));
        }
        body.push_str(&format!("{}}}", indent(depth)));
        body
    }

    /// 提取 additionalProperties 的值类型字符串。
    /// 返回 None 表示无有效的 additionalProperties。
    fn ap_val_type(&mut self, ap: Option<&AdditionalProperties>) -> Option<String> {
        match ap {
            Some(AdditionalProperties::Schema(obj_schema)) => {
                Some(self.type_expr(obj_schema.as_ref(), 0))
            }
            Some(AdditionalProperties::Enabled(true)) => Some("unknown".to_string()),
            _ => None,
        }
    }
}

/// 测试适配器：保留自由函数调用面（`schema_type_to_ts(schema, &mut deps, depth)`），
/// 内部委托给 [`TsPrinter::type_expr`]，并把收集到的依赖回写到 `deps`。
#[cfg(test)]
fn schema_type_to_ts(schema: &JsonSchema, deps: &mut Vec<String>, depth: usize) -> String {
    let mut p = TsPrinter {
        deps: std::mem::take(deps),
    };
    let s = p.type_expr(schema, depth);
    *deps = p.deps;
    s
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：ts_doc（JSON Schema → TypeScript 转换器）
    //!
    //! ### 关键接口
    //! - [schema_to_ts] — 将单个 JsonSchema 转换为 TypeScript interface/type 声明，返回 (ts_code, deps)
    //! - [schema_decls] — 给定根类型名与 schema 表，递归展开依赖图，产出全部声明
    //! - [TsPrinter::type_expr] — 将 JsonSchema 转换为 TS 类型表达式（不含声明关键字）
    //! - [TsPrinter::fields_block] — interface 体与多行内联对象共用的字段块渲染器
    //! - [push_jsdoc] — 为 schema 生成 JSDoc 注释块（description + extra）
    //!
    //! ### 关键分支与异常路径
    //! - enum 值优先于 type/$ref → 直接展开为字面量联合
    //! - $ref 在类型表达式中优先于 type → 返回引用名称并收集依赖
    //! - oneOf → 递归展联合；items 含联合时加括号 `(T|U)[]`
    //! - object 无 properties → 内联为 `Record<string, ...>`；单属性无注释 → 单行 `{ ... }`；
    //!   多属性 / 带注释 / 有 additionalProperties → 多行展开
    //! - schema_decls：依赖去重、缺失名忽略、按发现顺序排列
    //! - x-wecom-hidden 属性在 interface / 内联对象渲染时被过滤（不影响单行/多行判定）
    //!
    //! ### 上下游交互
    //! - 上游：`service::doc` 调用 [schema_decls]；helper `--doc` 调用 [schema_to_ts]
    //! - 下游：依赖 `types.rs` 中的 [JsonSchema] / [AdditionalProperties] 数据结构

    use std::sync::Arc;

    use indexmap::IndexMap;
    use serde_json::json;

    use super::*;
    use crate::schema::{JsonSchemaWecomDirectives, WecomBoolValue};

    fn s(t: &str) -> JsonSchema {
        JsonSchema {
            schema_type: Some(t.to_string()),
            ..Default::default()
        }
    }

    // ── schema_decls（依赖图遍历入口） ──

    /// P0：[schema_decls] 从根类型递归展开传递依赖并生成全部声明
    /// 条件：Post 引用 Author，Author 引用 Profile，根为 ["Post"]
    /// 断言：返回 3 段声明，按发现顺序包含 Post / Author / Profile
    #[test]
    fn schema_decls_expands_transitive_deps() {
        let mut schemas: IndexMap<String, JsonSchema> = IndexMap::new();
        let obj_with_ref = |field: &str, ref_name: &str| {
            let mut props = IndexMap::new();
            props.insert(
                field.to_string(),
                Arc::new(JsonSchema {
                    schema_ref: Some(ref_name.to_string()),
                    ..Default::default()
                }),
            );
            JsonSchema {
                schema_type: Some("object".to_string()),
                properties: props,
                required: vec![field.to_string()],
                ..Default::default()
            }
        };
        schemas.insert("Post".to_string(), obj_with_ref("author", "Author"));
        schemas.insert("Author".to_string(), obj_with_ref("profile", "Profile"));
        schemas.insert("Profile".to_string(), s("object"));

        let decls = schema_decls(&schemas, vec!["Post".to_string()]);
        assert_eq!(decls.len(), 3);
        assert!(decls[0].contains("interface Post"));
        assert!(decls[1].contains("interface Author"));
        assert!(decls[2].contains("interface Profile"));
    }

    /// P1：[schema_decls] 对依赖去重、忽略表中不存在的名字
    /// 条件：两个根都引用同一个 Shared，且根列表含一个不存在的 Missing
    /// 断言：Shared 只生成一次，Missing 被静默跳过
    #[test]
    fn schema_decls_dedups_and_ignores_missing() {
        let mut schemas: IndexMap<String, JsonSchema> = IndexMap::new();
        let ref_to = |ref_name: &str| {
            let mut props = IndexMap::new();
            props.insert(
                "x".to_string(),
                Arc::new(JsonSchema {
                    schema_ref: Some(ref_name.to_string()),
                    ..Default::default()
                }),
            );
            JsonSchema {
                schema_type: Some("object".to_string()),
                properties: props,
                required: vec!["x".to_string()],
                ..Default::default()
            }
        };
        schemas.insert("A".to_string(), ref_to("Shared"));
        schemas.insert("B".to_string(), ref_to("Shared"));
        schemas.insert("Shared".to_string(), s("object"));

        let decls = schema_decls(
            &schemas,
            vec!["A".to_string(), "B".to_string(), "Missing".to_string()],
        );
        // A, B, Shared —— Shared 只出现一次；Missing 被忽略。
        assert_eq!(decls.len(), 3);
        assert_eq!(
            decls
                .iter()
                .filter(|d| d.contains("interface Shared"))
                .count(),
            1
        );
    }

    /// P2：[schema_decls] 空根列表返回空集合
    /// 条件：roots 为空
    /// 断言：返回空 Vec
    #[test]
    fn schema_decls_empty_roots() {
        let schemas: IndexMap<String, JsonSchema> = IndexMap::new();
        assert!(schema_decls(&schemas, vec![]).is_empty());
    }

    // ── 基本类型 ──

    /// P0：string 基本类型转换为 TypeScript type alias
    /// 条件：schema 的 type 为 "string"
    /// 断言：生成 "type Name = string;" 且无依赖
    #[test]
    fn primitive_string() {
        let (ts, deps) = schema_to_ts("Name", &s("string"));
        assert_eq!(ts, "type Name = string;");
        assert!(deps.is_empty());
    }

    /// P0：number 基本类型转换为 TypeScript
    /// 条件：schema 的 type 为 "number"
    /// 断言：生成 "type Age = number;"
    #[test]
    fn primitive_number() {
        let (ts, _) = schema_to_ts("Age", &s("number"));
        assert_eq!(ts, "type Age = number;");
    }

    /// P1：integer 类型映射为 TypeScript 的 number
    /// 条件：schema 的 type 为 "integer"
    /// 断言：生成 "type Count = number;"
    #[test]
    fn primitive_integer() {
        let (ts, _) = schema_to_ts("Count", &s("integer"));
        assert_eq!(ts, "type Count = number;");
    }

    /// P1：boolean 基本类型转换为 TypeScript
    /// 条件：schema 的 type 为 "boolean"
    /// 断言：生成 "type Flag = boolean;"
    #[test]
    fn primitive_boolean() {
        let (ts, _) = schema_to_ts("Flag", &s("boolean"));
        assert_eq!(ts, "type Flag = boolean;");
    }

    /// P1：[schema_to_ts] null 基本类型转换为 TypeScript
    /// 条件：schema 的 type 为 "null"
    /// 断言：生成 "type Nothing = null;"
    #[test]
    fn primitive_null() {
        let (ts, _) = schema_to_ts("Nothing", &s("null"));
        assert_eq!(ts, "type Nothing = null;");
    }

    /// P1：未知/缺失类型回退为 unknown
    /// 条件：使用默认 JsonSchema（无 type）
    /// 断言：生成 "type Any = unknown;"
    #[test]
    fn unknown_type() {
        let (ts, _) = schema_to_ts("Any", &JsonSchema::default());
        assert_eq!(ts, "type Any = unknown;");
    }

    // ── enum ──

    /// P0：enum 值展开为 TypeScript 联合类型
    /// 条件：schema 包含三个枚举值："a"、"b"、1
    /// 断言：生成联合类型 "a" | "b" | 1
    #[test]
    fn enum_values() {
        let schema = JsonSchema {
            enum_values: vec![json!("a"), json!("b"), json!(1)],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Status", &schema);
        assert_eq!(ts, r#"type Status = "a" | "b" | 1;"#);
    }

    // ── $ref ──

    /// P0：$ref 引用转换为 TypeScript 类型别名
    /// 条件：schema 通过 $ref 引用 "UserInfo"
    /// 断言：生成 "type Alias = UserInfo;" 且 deps 包含 "UserInfo"
    #[test]
    fn ref_type() {
        let schema = JsonSchema {
            schema_ref: Some("UserInfo".to_string()),
            ..Default::default()
        };
        let (ts, deps) = schema_to_ts("Alias", &schema);
        assert_eq!(ts, "type Alias = UserInfo;");
        assert_eq!(deps, vec!["UserInfo"]);
    }

    // ── oneOf ──

    /// P0：oneOf 联合类型转换为 TS 联合表达式
    /// 条件：oneOf 含 string 和 number 两个变体
    /// 断言：生成 "type Mixed = string | number;"
    #[test]
    fn one_of() {
        let schema = JsonSchema {
            one_of: vec![Arc::new(s("string")), Arc::new(s("number"))],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Mixed", &schema);
        assert_eq!(ts, "type Mixed = string | number;");
    }

    /// P1：包含 $ref 引用的 oneOf 联合类型转换
    /// 条件：oneOf 中一个变体为 string，另一个通过 $ref 引用 "Foo"
    /// 断言：生成联合类型，deps 中收集到 "Foo"
    #[test]
    fn one_of_with_ref() {
        let schema = JsonSchema {
            one_of: vec![
                Arc::new(s("string")),
                Arc::new(JsonSchema {
                    schema_ref: Some("Foo".to_string()),
                    ..Default::default()
                }),
            ],
            ..Default::default()
        };
        let (ts, deps) = schema_to_ts("Bar", &schema);
        assert_eq!(ts, "type Bar = string | Foo;");
        assert_eq!(deps, vec!["Foo"]);
    }

    // ── array ──

    /// P0：[schema_to_ts] 带 items 的数组转换为 TypeScript 数组类型
    /// 条件：array schema 的 items 为 string
    /// 断言：生成 "type Names = string[];"
    #[test]
    fn array_with_items() {
        let schema = JsonSchema {
            schema_type: Some("array".to_string()),
            items: Some(Arc::new(s("string"))),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Names", &schema);
        assert_eq!(ts, "type Names = string[];");
    }

    /// P1：[schema_to_ts] 无 items 的数组回退为 unknown[]
    /// 条件：array schema 未指定 items
    /// 断言：生成 "type List = unknown[];"
    #[test]
    fn array_without_items() {
        let (ts, _) = schema_to_ts("List", &s("array"));
        assert_eq!(ts, "type List = unknown[];");
    }

    /// P1：items 为联合类型的数组转换为嵌套括号形式
    /// 条件：array 的 items 为 oneOf(string, number)
    /// 断言：生成 "type Values = (string | number)[];"
    #[test]
    fn array_with_union_items() {
        let schema = JsonSchema {
            schema_type: Some("array".to_string()),
            items: Some(Arc::new(JsonSchema {
                one_of: vec![Arc::new(s("string")), Arc::new(s("number"))],
                ..Default::default()
            })),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Values", &schema);
        assert_eq!(ts, "type Values = (string | number)[];");
    }

    // ── object (interface) ──

    /// P0：带 required 和 optional 属性的 object 转换为 interface
    /// 条件：object 有 name(必填) 和 age(可选)
    /// 断言：生成 interface，name 无 ?，age 有 ?
    #[test]
    fn object_interface() {
        let mut properties = IndexMap::new();
        properties.insert("name".to_string(), Arc::new(s("string")));
        properties.insert("age".to_string(), Arc::new(s("number")));

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            required: vec!["name".to_string()],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("User", &schema);
        assert_eq!(ts, "interface User {\n  name: string;\n  age?: number;\n}");
    }

    /// P1：[fields_block] interface 渲染过滤 x-wecom-hidden 属性
    /// 条件：object 含 name(string) 与 secret(string, x-wecom-hidden=true)
    /// 断言：生成的 interface 仅含 name 字段，不含 secret
    #[test]
    fn object_interface_skips_hidden_property() {
        let mut properties = IndexMap::new();
        properties.insert("name".to_string(), Arc::new(s("string")));
        properties.insert(
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
            properties,
            required: vec!["name".to_string()],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("User", &schema);
        assert_eq!(ts, "interface User {\n  name: string;\n}");
    }

    /// P1：[object_expr] 内联对象隐藏属性后按可见属性数判定单行布局
    /// 条件：作为属性的嵌套 object 含 x(number) 与 secret(string, hidden)，仅 x 可见
    /// 断言：可见属性仅 1 个且无注释 → 渲染为单行 `{ x: number }`（secret 不出现）
    #[test]
    fn inline_object_skips_hidden_keeps_single_line() {
        let mut inner_props = IndexMap::new();
        inner_props.insert("x".to_string(), Arc::new(s("number")));
        inner_props.insert(
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
        let inner = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: inner_props,
            required: vec!["x".to_string()],
            ..Default::default()
        };

        let mut deps = vec![];
        let ts = schema_type_to_ts(&inner, &mut deps, 0);
        assert_eq!(ts, "{ x: number }");
    }

    /// P1：无 properties 的空 object 转换为空 interface
    /// 条件：object schema 无任何属性
    /// 断言：生成 "interface Empty {\n}"
    #[test]
    fn object_empty_record() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Empty", &schema);
        assert_eq!(ts, "interface Empty {\n}");
    }

    // ── object (内联类型表达式) ──

    /// P1：无 properties 的内联 object 回退为 Record<string, unknown>
    /// 条件：object schema 无 properties，用于嵌套位置（schema_type_to_ts）
    /// 断言：生成 "Record<string, unknown>"
    #[test]
    fn inline_object_empty() {
        // 作为属性的嵌套 object（无 properties）→ Record
        let mut deps = vec![];
        let result = schema_type_to_ts(&s("object"), &mut deps, 0);
        assert_eq!(result, "Record<string, unknown>");
    }

    /// P1：带属性的內联 object 转换为内联类型表达式
    /// 条件：object schema 包含一个必填属性 x: number，用于嵌套位置
    /// 断言：生成 "{ x: number }"
    #[test]
    fn inline_object_with_properties() {
        let mut properties = IndexMap::new();
        properties.insert("x".to_string(), Arc::new(s("number")));

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            required: vec!["x".to_string()],
            ..Default::default()
        };
        let mut deps = vec![];
        let result = schema_type_to_ts(&schema, &mut deps, 0);
        assert_eq!(result, "{ x: number }");
    }

    /// P1：[object_to_ts] 带 description 的内联 object 属性附带单行 JSDoc 前缀
    /// 条件：内联 object 含必填属性 file_path: string，其 description 为「本地路径」
    /// 断言：生成 "{ /** 本地路径 */ file_path: string }"
    #[test]
    fn inline_object_property_carries_jsdoc() {
        let mut properties = IndexMap::new();
        properties.insert(
            "file_path".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("string".to_string()),
                description: Some("本地路径".to_string()),
                ..Default::default()
            }),
        );
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            required: vec!["file_path".to_string()],
            ..Default::default()
        };
        let mut deps = vec![];
        let result = schema_type_to_ts(&schema, &mut deps, 0);
        assert_eq!(result, "{\n  /** 本地路径 */\n  file_path: string;\n}");
    }

    /// P1：[object_to_ts] 数组元素为带注释对象时按缩进多行展开
    /// 条件：interface 含 files: DownloadItem[]，元素对象有带注释的 file_path/size
    /// 断言：嵌套对象多行展开，子属性缩进 4 空格，右花括号缩进 2 空格后接 `[];`
    #[test]
    fn nested_object_array_multiline_indented() {
        let mut item_props = IndexMap::new();
        item_props.insert(
            "file_path".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("string".to_string()),
                description: Some("本地路径".to_string()),
                ..Default::default()
            }),
        );
        item_props.insert("size".to_string(), Arc::new(s("integer")));
        let item = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: item_props,
            required: vec!["file_path".to_string(), "size".to_string()],
            ..Default::default()
        };

        let mut props = IndexMap::new();
        props.insert(
            "files".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("array".to_string()),
                items: Some(Arc::new(item)),
                ..Default::default()
            }),
        );
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: props,
            required: vec!["files".to_string()],
            ..Default::default()
        };

        let (ts, _) = schema_to_ts("Response", &schema);
        let expected = "interface Response {\n  files: {\n    /** 本地路径 */\n    file_path: string;\n    size: number;\n  }[];\n}";
        assert_eq!(ts, expected);
    }

    // ── additionalProperties ──

    /// P1：[schema_type_to_ts] additionalProperties=true 时生成 Record<string, unknown>
    /// 条件：object 的 additional_properties 为 true
    /// 断言：schema_type_to_ts 返回 Record<string, unknown>
    #[test]
    fn additional_properties_bool_true() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            additional_properties: Some(Box::new(AdditionalProperties::Enabled(true))),
            ..Default::default()
        };
        let mut deps = vec![];
        let result = schema_type_to_ts(&schema, &mut deps, 0);
        assert_eq!(result, "Record<string, unknown>");
    }

    /// P1：additionalProperties=false 时仍生成 Record<string, unknown>
    /// 条件：object 的 additional_properties 为 false
    /// 断言：schema_type_to_ts 返回 Record<string, unknown>（false 无效类型）
    #[test]
    fn additional_properties_bool_false() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            additional_properties: Some(Box::new(AdditionalProperties::Enabled(false))),
            ..Default::default()
        };
        let mut deps = vec![];
        let result = schema_type_to_ts(&schema, &mut deps, 0);
        // false 不生成有效类型，回退到 Record<string, unknown>
        assert_eq!(result, "Record<string, unknown>");
    }

    /// P1：[schema_type_to_ts] 带类型的 additionalProperties 生成对应值的 Record
    /// 条件：object 的 additional_properties 为 Schema("number")
    /// 断言：返回 Record<string, number>
    #[test]
    fn additional_properties_typed() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            additional_properties: Some(Box::new(AdditionalProperties::Schema(Arc::new(s(
                "number",
            ))))),
            ..Default::default()
        };
        let mut deps = vec![];
        let result = schema_type_to_ts(&schema, &mut deps, 0);
        assert_eq!(result, "Record<string, number>");
    }

    /// P1：具名属性 + typed additionalProperties 的内联 object
    /// 条件：object 有 name:string 属性和 additionalProperties:number
    /// 断言：返回 "{ name: string; [key: string]: number }"
    #[test]
    fn properties_with_additional_properties() {
        let mut properties = IndexMap::new();
        properties.insert("name".to_string(), Arc::new(s("string")));

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            required: vec!["name".to_string()],
            additional_properties: Some(Box::new(AdditionalProperties::Schema(Arc::new(s(
                "number",
            ))))),
            ..Default::default()
        };
        let mut deps = vec![];
        let result = schema_type_to_ts(&schema, &mut deps, 0);
        assert_eq!(result, "{\n  name: string;\n  [key: string]: number;\n}");
    }

    /// P1：interface 中 additionalProperties=true 生成索引签名
    /// 条件：object 有 id:number 和 additionalProperties=true
    /// 断言：interface 包含 "[key: string]: unknown"
    #[test]
    fn interface_with_additional_properties() {
        let mut properties = IndexMap::new();
        properties.insert("id".to_string(), Arc::new(s("number")));

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            required: vec!["id".to_string()],
            additional_properties: Some(Box::new(AdditionalProperties::Enabled(true))),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Item", &schema);
        assert_eq!(
            ts,
            "interface Item {\n  id: number;\n  [key: string]: unknown;\n}"
        );
    }

    // ── JSDoc 注释 ──

    /// P1：仅含 description 的 schema 生成单行 JSDoc
    /// 条件：schema 有 description="用户名"，type=string
    /// 断言：TS 代码前有 "/** 用户名 */"
    #[test]
    fn jsdoc_description_only() {
        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            description: Some("用户名".to_string()),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Name", &schema);
        assert_eq!(ts, "/** 用户名 */\ntype Name = string;");
    }

    /// P1：[push_jsdoc] 仅含 extra 的 schema 生成 JSDoc 标签
    /// 条件：schema 有 undefinedProperties minLength=1
    /// 断言：TS 代码前有 "/** @minLength 1 */"
    #[test]
    fn jsdoc_extra_only() {
        let mut extra = IndexMap::new();
        extra.insert("minLength".to_string(), json!(1));

        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            extra,
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Token", &schema);
        assert_eq!(ts, "/** @minLength 1 */\ntype Token = string;");
    }

    /// P1：[push_jsdoc] 同时有 description 和 extra 时的多行 JSDoc
    /// 条件：schema 有 description "备注" 和 maxLength=100
    /// 断言：生成多行 JSDoc，包含描述和 @maxLength 标签
    #[test]
    fn jsdoc_description_and_undefined() {
        let mut extra = IndexMap::new();
        extra.insert("maxLength".to_string(), json!(100));

        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            description: Some("备注".to_string()),
            extra,
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Remark", &schema);
        assert_eq!(
            ts,
            "/**\n * 备注\n *\n * @maxLength 100\n */\ntype Remark = string;"
        );
    }

    /// P1：object 属性的 description 生成属性级别 JSDoc
    /// 条件：object 的 name 属性有 description="姓名"
    /// 断言：interface 中 name 前有 "/** 姓名 */"
    #[test]
    fn jsdoc_on_property() {
        let mut properties = IndexMap::new();
        properties.insert(
            "name".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("string".to_string()),
                description: Some("姓名".to_string()),
                ..Default::default()
            }),
        );

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Person", &schema);
        assert_eq!(ts, "interface Person {\n  /** 姓名 */\n  name?: string;\n}");
    }

    /// P1：undefined_property 字符串值在 JSDoc 中不包裹引号
    /// 条件：undefinedProperties 中 format="date-time"（字符串值）
    /// 断言：生成 "/** @format date-time */"，无多余引号
    #[test]
    fn jsdoc_string_value_not_quoted() {
        let mut extra = IndexMap::new();
        extra.insert("format".to_string(), json!("date-time"));

        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            extra,
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("TS", &schema);
        // String 类型的 undefined_property 值不被 JSON 序列化包裹引号
        assert_eq!(ts, "/** @format date-time */\ntype TS = string;");
    }

    // ── 嵌套 / 复合 ──

    /// P0：嵌套 object 在属性中正确生成内联类型表达式
    /// 条件：address 属性为含 street:string 的嵌套 object
    /// 断言：interface 中 address 类型为 "{ street: string }"
    #[test]
    fn nested_object_in_property() {
        let mut inner_props = IndexMap::new();
        inner_props.insert("street".to_string(), Arc::new(s("string")));

        let mut properties = IndexMap::new();
        properties.insert(
            "address".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("object".to_string()),
                properties: inner_props,
                required: vec!["street".to_string()],
                ..Default::default()
            }),
        );

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("User", &schema);
        assert_eq!(ts, "interface User {\n  address?: { street: string };\n}");
    }

    /// P0：属性中的 $ref 被收集到依赖列表
    /// 条件：info 属性的 schema_ref 为 "UserInfo"
    /// 断言：deps 包含 "UserInfo"，TS 代码中引用该类型
    #[test]
    fn ref_in_property_collects_deps() {
        let mut properties = IndexMap::new();
        properties.insert(
            "info".to_string(),
            Arc::new(JsonSchema {
                schema_ref: Some("UserInfo".to_string()),
                ..Default::default()
            }),
        );

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            ..Default::default()
        };
        let (ts, deps) = schema_to_ts("User", &schema);
        assert_eq!(ts, "interface User {\n  info?: UserInfo;\n}");
        assert_eq!(deps, vec!["UserInfo"]);
    }

    // ── 多行 description JSDoc ──

    /// P1：[push_jsdoc] 多行 description 生成多行 JSDoc 注释
    /// 条件：description 含三行文本 "第一行\n第二行\n第三行"
    /// 断言：每行前带 " * " 的多行 JSDoc 块
    #[test]
    fn jsdoc_multiline_description() {
        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            description: Some("第一行\n第二行\n第三行".to_string()),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Desc", &schema);
        assert_eq!(
            ts,
            "/**\n * 第一行\n * 第二行\n * 第三行\n */\ntype Desc = string;"
        );
    }

    // ── 多个 extra ──

    /// P1：多个 extra 各自生成 @tag 行
    /// 条件：undefinedProperties 含 minLength、maxLength、pattern
    /// 断言：JSDoc 中包含三个 @tag 标签行
    #[test]
    fn jsdoc_multiple_extra() {
        let mut extra = IndexMap::new();
        extra.insert("minLength".to_string(), json!(1));
        extra.insert("maxLength".to_string(), json!(100));
        extra.insert("pattern".to_string(), json!("^[a-z]+$"));

        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            extra,
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Token", &schema);
        assert_eq!(
            ts,
            "/**\n * @minLength 1\n * @maxLength 100\n * @pattern ^[a-z]+$\n */\ntype Token = string;"
        );
    }

    // ── oneOf 嵌套复合类型 ──

    /// P1：oneOf(string | null) 可空联合类型转换
    /// 条件：oneOf 含 string 和 null 两个变体
    /// 断言：生成 "type Nullable = string | null;"
    #[test]
    fn one_of_with_null() {
        let schema = JsonSchema {
            one_of: vec![Arc::new(s("string")), Arc::new(s("null"))],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Nullable", &schema);
        assert_eq!(ts, "type Nullable = string | null;");
    }

    /// P1：oneOf 中包含 enum 子类型的联合类型转换
    /// 条件：oneOf 一个变体为 enum(["a","b"])，另一个为 number
    /// 断言：enum 展开为字面量联合，最终结果为 "a"|"b"|number
    #[test]
    fn one_of_with_enum() {
        let schema = JsonSchema {
            one_of: vec![
                Arc::new(JsonSchema {
                    enum_values: vec![json!("a"), json!("b")],
                    ..Default::default()
                }),
                Arc::new(s("number")),
            ],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Mixed", &schema);
        assert_eq!(ts, r#"type Mixed = "a" | "b" | number;"#);
    }

    // ── array of ref ──

    /// P1：$ref 类型数组生成引用类型数组
    /// 条件：array 的 items 通过 $ref 引用 "Item"
    /// 断言：生成 "type Items = Item[];"，deps 包含 "Item"
    #[test]
    fn array_of_ref() {
        let schema = JsonSchema {
            schema_type: Some("array".to_string()),
            items: Some(Arc::new(JsonSchema {
                schema_ref: Some("Item".to_string()),
                ..Default::default()
            })),
            ..Default::default()
        };
        let (ts, deps) = schema_to_ts("Items", &schema);
        assert_eq!(ts, "type Items = Item[];");
        assert_eq!(deps, vec!["Item"]);
    }

    // ── array of objects ──

    /// P1：内联 object 数组生成内联类型数组
    /// 条件：array 的 items 为含 id:number 的内联 object
    /// 断言：生成 "type Rows = { id: number }[];"
    #[test]
    fn array_of_inline_objects() {
        let mut inner_props = IndexMap::new();
        inner_props.insert("id".to_string(), Arc::new(s("number")));

        let schema = JsonSchema {
            schema_type: Some("array".to_string()),
            items: Some(Arc::new(JsonSchema {
                schema_type: Some("object".to_string()),
                properties: inner_props,
                required: vec!["id".to_string()],
                ..Default::default()
            })),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Rows", &schema);
        assert_eq!(ts, "type Rows = { id: number }[];");
    }

    // ── object with multiple required/optional ──

    /// P1：[schema_to_ts] 全部属性必填的 interface 不带 ? 标记
    /// 条件：object 有 a:string 和 b:number，required 含两者
    /// 断言：interface 中 a 和 b 均 无 ?
    #[test]
    fn object_all_required() {
        let mut properties = IndexMap::new();
        properties.insert("a".to_string(), Arc::new(s("string")));
        properties.insert("b".to_string(), Arc::new(s("number")));

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            required: vec!["a".to_string(), "b".to_string()],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("AllReq", &schema);
        assert_eq!(ts, "interface AllReq {\n  a: string;\n  b: number;\n}");
    }

    /// P1：全部属性可选的 interface 全带 ? 标记
    /// 条件：object 有 x:string 和 y:number，required 为空
    /// 断言：interface 中 x 和 y 均 带 ?
    #[test]
    fn object_all_optional() {
        let mut properties = IndexMap::new();
        properties.insert("x".to_string(), Arc::new(s("string")));
        properties.insert("y".to_string(), Arc::new(s("number")));

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("AllOpt", &schema);
        assert_eq!(ts, "interface AllOpt {\n  x?: string;\n  y?: number;\n}");
    }

    // ── 深层嵌套 ──

    /// P0：三层深层嵌套 object 的内联类型表达式生成
    /// 条件：outer > inner > value 三层嵌套 object，每层一个必填属性
    /// 断言：最外层 interface 中 outer 属性类型为完整嵌套内联表达式
    #[test]
    fn deeply_nested_object() {
        let mut level2_props = IndexMap::new();
        level2_props.insert("value".to_string(), Arc::new(s("string")));

        let mut level1_props = IndexMap::new();
        level1_props.insert(
            "inner".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("object".to_string()),
                properties: level2_props,
                required: vec!["value".to_string()],
                ..Default::default()
            }),
        );

        let mut top_props = IndexMap::new();
        top_props.insert(
            "outer".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("object".to_string()),
                properties: level1_props,
                required: vec!["inner".to_string()],
                ..Default::default()
            }),
        );

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties: top_props,
            required: vec!["outer".to_string()],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Deep", &schema);
        assert_eq!(
            ts,
            "interface Deep {\n  outer: { inner: { value: string } };\n}"
        );
    }

    // ── enum 单值 ──

    /// P0：单值枚举生成字面量 type alias
    /// 条件：enum 仅含一个值 "only"
    /// 断言：生成 "type Single = \"only\";"
    #[test]
    fn enum_single_value() {
        let schema = JsonSchema {
            enum_values: vec![json!("only")],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Single", &schema);
        assert_eq!(ts, r#"type Single = "only";"#);
    }

    // ── enum 优先于 type ──

    /// P0：enum 优先于 schema_type 被使用
    /// 条件：同时有 type="string" 和 enum=["x","y"]
    /// 断言：生成联合类型而非 string
    #[test]
    fn enum_takes_precedence_over_type() {
        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            enum_values: vec![json!("x"), json!("y")],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Priority", &schema);
        assert_eq!(ts, r#"type Priority = "x" | "y";"#);
    }

    // ── ref 优先于 type（在类型表达式中） ──

    /// P1：$ref 在类型表达式中优先于 type
    /// 条件：schema 同时有 type="string" 和 $ref="Other"
    /// 断言：schema_type_to_ts 返回 "Other"（非 "string"）
    #[test]
    fn ref_takes_precedence_in_type_expr() {
        // schema_type_to_ts 中 $ref 优先于 type
        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            schema_ref: Some("Other".to_string()),
            ..Default::default()
        };
        let mut deps = vec![];
        let result = schema_type_to_ts(&schema, &mut deps, 0);
        assert_eq!(result, "Other");
        assert_eq!(deps, vec!["Other"]);
    }

    // ── 多个 ref 依赖在不同属性中 ──

    /// P1：[schema_to_ts] 多个 $ref 依赖在不同属性中同时收集
    /// 条件：object 的 author 属性直接 ref "Author"，tags 属性的 items ref "Tag"
    /// 断言：deps 同时包含 "Author" 和 "Tag"
    #[test]
    fn multiple_ref_deps_in_properties() {
        let mut properties = IndexMap::new();
        properties.insert(
            "author".to_string(),
            Arc::new(JsonSchema {
                schema_ref: Some("Author".to_string()),
                ..Default::default()
            }),
        );
        properties.insert(
            "tags".to_string(),
            Arc::new(JsonSchema {
                schema_type: Some("array".to_string()),
                items: Some(Arc::new(JsonSchema {
                    schema_ref: Some("Tag".to_string()),
                    ..Default::default()
                })),
                ..Default::default()
            }),
        );

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            required: vec!["author".to_string()],
            ..Default::default()
        };
        let (ts, deps) = schema_to_ts("Post", &schema);
        assert_eq!(
            ts,
            "interface Post {\n  author: Author;\n  tags?: Tag[];\n}"
        );
        assert_eq!(deps, vec!["Author", "Tag"]);
    }

    // ── additionalProperties with ref ──

    /// P1：additionalProperties 为 $ref schema 时生成 Record<string, Ref>
    /// 条件：additionalProperties 的 Schema 引用 "Value"
    /// 断言：返回 Record<string, Value>，deps 包含 "Value"
    #[test]
    fn additional_properties_with_ref() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            additional_properties: Some(Box::new(AdditionalProperties::Schema(Arc::new(
                JsonSchema {
                    schema_ref: Some("Value".to_string()),
                    ..Default::default()
                },
            )))),
            ..Default::default()
        };
        let mut deps = vec![];
        let result = schema_type_to_ts(&schema, &mut deps, 0);
        assert_eq!(result, "Record<string, Value>");
        assert_eq!(deps, vec!["Value"]);
    }

    // ── interface with description ──

    /// P1：[schema_to_ts] 带 description 的 object interface 生成 JSDoc 注释
    /// 条件：object 有 description="一个用户" 和 id 属性
    /// 断言：interface 前有 "/** 一个用户 */" JSDoc
    #[test]
    fn interface_with_description() {
        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            description: Some("一个用户".to_string()),
            properties: {
                let mut p = IndexMap::new();
                p.insert("id".to_string(), Arc::new(s("number")));
                p
            },
            required: vec!["id".to_string()],
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("User", &schema);
        assert_eq!(ts, "/** 一个用户 */\ninterface User {\n  id: number;\n}");
    }

    // ── inline object with optional props ──

    /// P1：[schema_type_to_ts] 內联 object 同时包含必填和可选属性
    /// 条件：object 有必填属性 a 和可选属性 b
    /// 断言：生成的内联类型中 a 无 ? 标记，b 带 ? 标记
    #[test]
    fn inline_object_with_optional_and_required() {
        let mut properties = IndexMap::new();
        properties.insert("a".to_string(), Arc::new(s("string")));
        properties.insert("b".to_string(), Arc::new(s("number")));

        let schema = JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            required: vec!["a".to_string()],
            ..Default::default()
        };
        let mut deps = vec![];
        let result = schema_type_to_ts(&schema, &mut deps, 0);
        assert_eq!(result, "{\n  a: string;\n  b?: number;\n}");
    }

    // ── 文件路径 note（upload_media / octet_stream / file_save） ──

    /// P0：[push_jsdoc] 带 upload_media 的 string 生成 "@note 指向本地文件路径"
    /// 条件：schema 是 string，directives.upload_media = Some(true)
    /// 断言：TS 代码前有 "/** @note 指向本地文件路径 */"
    #[test]
    fn jsdoc_file_path_note_upload_media() {
        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            directives: crate::schema::JsonSchemaWecomDirectives {
                upload_media: Some(crate::schema::UploadMediaOptions::default()),
                ..Default::default()
            },
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("File", &schema);
        assert_eq!(ts, "/** @note 指向本地文件路径 */\ntype File = string;");
    }

    /// P0：[push_jsdoc] 带 octet_stream 的 string 生成 "@note 指向本地文件路径"
    /// 条件：schema 是 string，directives.octet_stream.is_some()
    /// 断言：TS 代码前有 "/** @note 指向本地文件路径 */"
    #[test]
    fn jsdoc_file_path_note_octet_stream() {
        let schema = JsonSchema {
            schema_type: Some("string".to_string()),
            directives: crate::schema::JsonSchemaWecomDirectives {
                octet_stream: Some(crate::schema::WecomBoolValue::default()),
                ..Default::default()
            },
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Bin", &schema);
        assert_eq!(ts, "/** @note 指向本地文件路径 */\ntype Bin = string;");
    }

    /// P0：[push_jsdoc] array items 是带 upload_media 的 string 时，array 层也显示 note
    /// 条件：schema 是 array，items 是 string 且 directives.upload_media = Some(true)
    /// 断言：array 类型别名前有 "/** @note 指向本地文件路径 */"
    #[test]
    fn jsdoc_file_path_note_array_of_upload_media_string() {
        let schema = JsonSchema {
            schema_type: Some("array".to_string()),
            items: Some(Arc::new(JsonSchema {
                schema_type: Some("string".to_string()),
                directives: crate::schema::JsonSchemaWecomDirectives {
                    upload_media: Some(crate::schema::UploadMediaOptions::default()),
                    ..Default::default()
                },
                ..Default::default()
            })),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Files", &schema);
        assert_eq!(ts, "/** @note 指向本地文件路径 */\ntype Files = string[];");
    }

    /// P0：[push_jsdoc] array items 是带 octet_stream 的 string 时，array 层也显示 note
    /// 条件：schema 是 array，items 是 string 且 directives.octet_stream.is_some()
    /// 断言：array 类型别名前有 "/** @note 指向本地文件路径 */"
    #[test]
    fn jsdoc_file_path_note_array_of_octet_stream_string() {
        let schema = JsonSchema {
            schema_type: Some("array".to_string()),
            items: Some(Arc::new(JsonSchema {
                schema_type: Some("string".to_string()),
                directives: crate::schema::JsonSchemaWecomDirectives {
                    octet_stream: Some(crate::schema::WecomBoolValue::default()),
                    ..Default::default()
                },
                ..Default::default()
            })),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Bins", &schema);
        assert_eq!(ts, "/** @note 指向本地文件路径 */\ntype Bins = string[];");
    }

    /// P1：[push_jsdoc] array items 是非 string 时不显示 file note
    /// 条件：schema 是 array，items 是 number 且（假设性）带 upload_media
    /// 断言：TS 代码中不含 "@note 指向本地文件路径"
    #[test]
    fn jsdoc_no_file_note_for_array_of_non_string() {
        let schema = JsonSchema {
            schema_type: Some("array".to_string()),
            items: Some(Arc::new(JsonSchema {
                schema_type: Some("number".to_string()),
                directives: crate::schema::JsonSchemaWecomDirectives {
                    upload_media: Some(crate::schema::UploadMediaOptions::default()),
                    ..Default::default()
                },
                ..Default::default()
            })),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Nums", &schema);
        assert!(!ts.contains("@note 指向本地文件路径"));
    }

    /// P1：[push_jsdoc] array 本身无文件 directive 且 items 无文件 directive 时不显示 note
    /// 条件：普通 string[] array
    /// 断言：TS 代码中不含 "@note 指向本地文件路径"
    #[test]
    fn jsdoc_no_file_note_for_plain_string_array() {
        let schema = JsonSchema {
            schema_type: Some("array".to_string()),
            items: Some(Arc::new(s("string"))),
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("Names", &schema);
        assert!(!ts.contains("@note"));
    }

    /// P2：[push_jsdoc] array items 缺失时即使带 array 层 upload_media 也不输出 note
    /// 条件：schema 是 array，items 为 None，自身未带文件 directive
    /// 断言：TS 代码中不含 "@note 指向本地文件路径"
    #[test]
    fn jsdoc_no_file_note_when_array_items_missing() {
        let schema = JsonSchema {
            schema_type: Some("array".to_string()),
            items: None,
            ..Default::default()
        };
        let (ts, _) = schema_to_ts("List", &schema);
        assert!(!ts.contains("@note"));
    }
}
