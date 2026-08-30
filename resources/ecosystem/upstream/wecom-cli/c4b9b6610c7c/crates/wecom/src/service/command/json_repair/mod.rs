//! Lenient JSON parsing for CLI-supplied payloads.
//!
//! Pipeline: strict `serde_json` → candidate enumeration with unified
//! scoring. Quote-repair forks (terminate vs escape at each unescaped
//! quote inside a string value — the search core lives in [`enumerate`])
//! and `jsonrepair-rs` both contribute candidates; only strict-valid JSON
//! survives. The schema merely ranks candidates by declared keys
//! ([`scoring`]) — it never vetoes (types / `enum` /
//! `additionalProperties` / `required` are all left to the backend).
//! Failures return a plain `String` reason (never an [`crate::Error`]) so
//! the caller can attach user-facing context exactly once. Every repair
//! emits a `json_repair` telemetry event tagged with the strategy that
//! produced it; the raw input is never reported.

mod enumerate;
mod scoring;

use std::cmp::Reverse;

use serde_json::Value;

use self::enumerate::{Budgets, Candidate, Source, enumerate_quote_candidates};
use self::scoring::declared_key_hits;
use crate::schema::JsonSchema;
use crate::telemetry::{self, contract as ctr};

// ── JSON parsing ──────────────────────────────────────────

/// Repair strategy reported on `json_repair` events: quote-repair fork
/// candidate (unescaped quotes escaped into the string body).
const STRATEGY_UNESCAPED_QUOTES: &str = "unescaped_quotes";

/// Repair strategy reported on `json_repair` events: jsonrepair-rs candidate.
const STRATEGY_JSONREPAIR: &str = "jsonrepair";

/// Unified scoring key: ① declared keys desc → ② undeclared keys asc →
/// ③ escapes asc → ④ quote-repair before jsonrepair.
type ScoreKey = (Reverse<usize>, usize, usize, u8);

/// Parse a request body tolerantly, returning the **raw** repair reason
/// (a plain `String`) on failure — not an [`crate::Error`].
///
/// Emits `json_repair` telemetry on the repair path. Callers attach their
/// own user-facing context (`--json` body vs `--set` value) around the
/// returned `String`. Keeping the error un-wrapped here is what lets the
/// sole `Error::Validation` wrap happen once at the top, avoiding
/// double-wrapping like `Validation("... {Validation}")`.
pub(super) fn repair_json(
    json: &str,
    schema: Option<&JsonSchema>,
) -> std::result::Result<Value, String> {
    repair_json_inner(json, schema, Budgets::default())
}

fn repair_json_inner(
    json: &str,
    schema: Option<&JsonSchema>,
    budgets: Budgets,
) -> std::result::Result<Value, String> {
    // Fast path: valid JSON parses directly and emits no telemetry.
    if let Ok(value) = serde_json::from_str(json) {
        return Ok(value);
    }
    tracing::debug!("standard JSON parse failed, attempting repair");

    let score = |candidate: &Candidate| -> ScoreKey {
        let (known, unknown) = match schema {
            Some(schema) => declared_key_hits(&candidate.value, schema),
            None => (0, 0),
        };
        (
            Reverse(known),
            unknown,
            candidate.escapes,
            candidate.source.rank(),
        )
    };

    // Stream quote-repair candidates, keeping only the best-scoring one;
    // a budget overrun truncates the enumeration but keeps what was found.
    let mut enumeration = enumerate_quote_candidates(json, budgets);
    if schema.is_none() {
        // Scoring keys ① / ② are constant without a schema, so ③ (escapes
        // asc) alone ranks the quote candidates — exactly the order the
        // frontier is popped in, which is what makes bounding lossless.
        enumeration.bound_by_escapes();
    }
    let mut best: Option<(ScoreKey, Candidate)> = None;
    let mut quote_count = 0usize;
    for candidate in &mut enumeration {
        quote_count += 1;
        let key = score(&candidate);
        consider(&mut best, key, candidate);
    }
    if enumeration.truncated() {
        tracing::warn!(
            found = quote_count,
            "quote-repair enumeration budget exceeded, scoring partial candidates"
        );
    }

    let mut candidate_count = quote_count;
    let mut failure = None;
    match jsonrepair_rs::jsonrepair_value(json) {
        Ok(value) => {
            candidate_count += 1;
            let candidate = Candidate {
                value,
                // Tie on escape count with the *incumbent* quote candidate
                // (the only ones scored so far) so ③ never decides against
                // it and the source tiebreak ④ picks the conservative
                // rewrite. Taking the global minimum instead would let
                // jsonrepair overtake a quote candidate that won on ① / ②.
                escapes: best.as_ref().map_or(0, |(_, incumbent)| incumbent.escapes),
                source: Source::Jsonrepair,
            };
            let key = score(&candidate);
            consider(&mut best, key, candidate);
        }
        Err(err) => failure = Some(err.to_string()),
    }

    // `best` is empty only when no quote candidate survived and jsonrepair
    // failed too — the one combination in which a repair can fail, and the
    // one in which `failure` is guaranteed to be set.
    let Some((_, best)) = best else {
        telemetry::emit(
            ctr::json_repair::KIND,
            &serde_json::json!({
                ctr::json_repair::FIELD_OUTCOME: ctr::json_repair::OUTCOME_ERR_REPAIR,
            }),
        );
        return Err(failure.unwrap_or_else(|| "无法修复为合法 JSON".to_string()));
    };
    let strategy = match best.source {
        Source::QuoteRepair => STRATEGY_UNESCAPED_QUOTES,
        Source::Jsonrepair => STRATEGY_JSONREPAIR,
    };
    tracing::info!(strategy, "JSON repaired successfully");
    emit_json_repair_success(strategy, candidate_count);
    Ok(best.value)
}

/// Fold a candidate into the incumbent. Only a strictly lower key wins, so
/// ties keep the earlier candidate — enumeration order first, the
/// jsonrepair candidate last.
fn consider(best: &mut Option<(ScoreKey, Candidate)>, key: ScoreKey, candidate: Candidate) {
    if best.as_ref().is_none_or(|(incumbent, _)| key < *incumbent) {
        *best = Some((key, candidate));
    }
}

/// Emit an `ok_repaired` event. `strategy` distinguishes the quote-repair
/// fork candidate from the jsonrepair candidate on the wire; `candidates`
/// records how many strict-valid candidates entered scoring (`>= 2` means
/// genuine ambiguity arbitration happened). The raw input is never
/// reported.
fn emit_json_repair_success(strategy: &str, candidates: usize) {
    telemetry::emit(
        ctr::json_repair::KIND,
        &serde_json::json!({
            ctr::json_repair::FIELD_OUTCOME: ctr::json_repair::OUTCOME_OK_REPAIRED,
            ctr::json_repair::FIELD_STRATEGY: strategy,
            ctr::json_repair::FIELD_CANDIDATES: candidates,
        }),
    );
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：json_repair（--json / --set 值的候选式宽容解析与统一打分编排）
    //!
    //! ### 关键接口
    //! - [repair_json] — 合法 JSON 快路径；否则枚举引号修复候选 + jsonrepair 候选，统一打分取最优
    //! - [consider] — 严格更小才替换 incumbent，平分保留先出现者（枚举序第一、jsonrepair 最后）
    //! - [emit_json_repair_success] — ok_repaired 事件（strategy / candidates，绝不上报原文）
    //!
    //! ### 关键分支与异常路径
    //! - repair_json：合法 → 直接返回且不发射遥测；有候选 → 打分取第一并上报 ok_repaired；
    //!   无候选 → Err 并上报 err_repair；strategy 字段区分 unescaped_quotes / jsonrepair；
    //!   原文及其派生信息（长度、摘要）一律不上报
    //! - 打分顺序：① 声明键数降序 ② 未声明键数升序 ③ 转义数升序 ④ 引号修复优先于 jsonrepair；
    //!   schema 不做类型 / enum / additionalProperties / required 否决
    //! - 无 schema 时开启分支限界（[super::enumerate::QuoteCandidates::bound_by_escapes]）：
    //!   ① ② 退化为常量，③ 即搜索序，限界无损
    //! - jsonrepair 候选：转义数取**当前最优**引号候选的转义数，平分时由来源次序让位给保守改写
    //! - 预算截断（候选数 / 探索数 / 排队数）保留已找到候选继续打分，候选为空时仅剩 jsonrepair 候选
    //!
    //! ### 已知能力边界（非缺陷，两条路都救不了，最终由后台报错）
    //! - key 内的未转义引号：引号路径在 key 严格校验处即淘汰，jsonrepair 会改坏结构
    //! - 「缺逗号」与「正文含未转义引号」同时出现：两种修复动作互相排斥
    //! - schema 打分只识别 properties / oneOf / additionalProperties（anyOf / allOf 退化为无 schema 启发式）
    //!
    //! ### 上下游交互
    //! - 上游：[super::super::assemble::assemble_payload] 解析 --json 体，
    //!   [super::super::assemble::resolve_set_value] 解析 --set 的 object / array 值
    //! - 下游：依赖 [super::enumerate]（引号候选枚举）、[super::scoring]（声明键打分）、
    //!   [crate::telemetry]、jsonrepair-rs
    use std::sync::{Arc, Mutex};

    use indexmap::IndexMap;
    use serde_json::json;
    use tracing_subscriber::prelude::*;

    use super::*;
    use crate::schema::AdditionalProperties;
    use crate::telemetry::{CaptureScope, ClientEvent, EventExt, TelemetryLayer};

    /// 测试 helper：以当前 subscriber 注册 emit 的 callsite 并重建 interest 缓存，
    /// 消除并行测试间 callsite 惰性注册导致的 never 污染竞态（完整机理见
    /// crate::telemetry::event_capture 测试模块中的同名 helper）。
    ///
    /// 使用时机：`set_default` 之后、`CaptureScope::new()` 之前；热身事件不进入断言。
    fn warm_up_emit_callsite() {
        telemetry::emit("test_warmup", &json!({}));
        tracing::callsite::rebuild_interest_cache();
    }

    /// 测试 helper：构造一个 object 类型 schema，properties 含给定字段名（均为 string 类型）。
    fn schema_with(keys: &[&str]) -> JsonSchema {
        let mut properties = IndexMap::new();
        for &k in keys {
            properties.insert(
                k.to_string(),
                Arc::new(JsonSchema {
                    schema_type: Some("string".to_string()),
                    ..Default::default()
                }),
            );
        }
        JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            ..Default::default()
        }
    }

    /// 测试 helper：构造一个 object 类型 schema，properties 为给定的 (字段名, type) 对。
    fn schema_with_typed(fields: &[(&str, &str)]) -> JsonSchema {
        let mut properties = IndexMap::new();
        for &(k, ty) in fields {
            properties.insert(
                k.to_string(),
                Arc::new(JsonSchema {
                    schema_type: Some(ty.to_string()),
                    ..Default::default()
                }),
            );
        }
        JsonSchema {
            schema_type: Some("object".to_string()),
            properties,
            ..Default::default()
        }
    }

    /// 测试 helper：构造 message send 的 schema（chat_id + text_content.text 均必填，
    /// 两层 additionalProperties 均为 false），复现真实消息发送接口的约束形态。
    fn message_send_schema() -> JsonSchema {
        let text_content = JsonSchema {
            schema_type: Some("object".into()),
            properties: IndexMap::from([(
                "text".into(),
                Arc::new(JsonSchema {
                    schema_type: Some("string".into()),
                    ..Default::default()
                }),
            )]),
            required: vec!["text".into()],
            additional_properties: Some(Box::new(AdditionalProperties::Enabled(false))),
            ..Default::default()
        };
        JsonSchema {
            schema_type: Some("object".into()),
            properties: IndexMap::from([
                (
                    "chat_id".into(),
                    Arc::new(JsonSchema {
                        schema_type: Some("string".into()),
                        ..Default::default()
                    }),
                ),
                ("text_content".into(), Arc::new(text_content)),
            ]),
            required: vec!["chat_id".into(), "text_content".into()],
            additional_properties: Some(Box::new(AdditionalProperties::Enabled(false))),
            ..Default::default()
        }
    }

    /// 测试 helper：构造同名 string 属性出现在多个上下文的 schema。
    ///
    /// `content` 同时是根对象与 `extra` 子对象的属性，复现真实 discovery schema 中
    /// `userid` / `content` / `text` 这类高频重名字段。
    fn duplicated_property_schema() -> JsonSchema {
        serde_json::from_value(json!({
            "type": "object",
            "properties": {
                "content": {"type": "string"},
                "chat_id": {"type": "string"},
                "extra": {"type": "object", "properties": {
                    "content": {"type": "string"},
                    "note": {"type": "string"}
                }}
            }
        }))
        .unwrap()
    }

    // ── repair_json：快路径与主场景 ──

    /// P0：[repair_json] 合法 JSON 直接解析成功
    /// 条件：输入标准 JSON {"a":1}
    /// 断言：返回 Value {"a":1}
    #[test]
    fn repair_json_valid() {
        let v = repair_json(r#"{"a":1}"#, None).unwrap();
        assert_json_diff::assert_json_eq!(v, json!({"a": 1}));
    }

    /// P0：[repair_json] 修复原型的三组未转义引号 + 紧贴值尾
    /// 条件：message send schema，text 正文含三组未转义 ASCII 双引号且末组紧贴值尾
    /// 断言：修复为合法 JSON，正文引号全部转义，结构字段不受影响
    #[test]
    fn repair_json_fixes_prototype_unescaped_quotes() {
        let raw =
            r#"{"chat_id":"wr001","text_content":{"text":"跟进"25年12月后上线"的"系统单量进度""}}"#;
        assert!(serde_json::from_str::<Value>(raw).is_err());
        let repaired = repair_json(raw, Some(&message_send_schema())).unwrap();
        assert_json_diff::assert_json_eq!(
            repaired,
            json!({"chat_id": "wr001", "text_content": {"text": "跟进\"25年12月后上线\"的\"系统单量进度\""}})
        );
    }

    /// P0：[repair_json] 同一输入配不同 schema 得到不同的正确读法（schema 排序不可省）
    /// 条件：输入 {"a":"say ","b":"fake""}，分别配 {a,b} 与 {a} 两种 schema
    /// 断言：{a,b} → 双字段读法（b 的值以引号结尾）；{a} → 单字段读法（b 被吞入 a 的正文）
    #[test]
    fn repair_json_schema_ranks_ambiguous_candidates() {
        let raw = r#"{"a":"say ","b":"fake""}"#;
        let two_fields = repair_json(raw, Some(&schema_with(&["a", "b"]))).unwrap();
        assert_json_diff::assert_json_eq!(two_fields, json!({"a": "say ", "b": "fake\""}));
        let one_field = repair_json(raw, Some(&schema_with(&["a"]))).unwrap();
        assert_json_diff::assert_json_eq!(one_field, json!({"a": "say \",\"b\":\"fake\""}));
    }

    /// P1：[repair_json] 无 schema 时按转义最少启发式取双字段读法
    /// 条件：同一输入 {"a":"say ","b":"fake""}，不提供 schema
    /// 断言：选择转义数最少的候选（两个字段，b 的值以引号结尾）
    #[test]
    fn repair_json_without_schema_prefers_fewest_escapes() {
        let raw = r#"{"a":"say ","b":"fake""}"#;
        let repaired = repair_json(raw, None).unwrap();
        assert_json_diff::assert_json_eq!(repaired, json!({"a": "say ", "b": "fake\""}));
    }

    // ── repair_json：语料矩阵 ──

    /// P1：[repair_json] 各引号形态语料表全部修复正确
    /// 条件：1~3 组引号 × 值尾 / 中间 / 嵌套 / 扁平兄弟键 / 含冒号 / 奇数引号 / emoji / 英文
    /// 断言：每组输入修复后均为期望的合法 JSON，正文引号原样保留
    #[test]
    fn repair_json_quote_shape_corpus() {
        let nested = message_send_schema();
        let flat = schema_with(&["text", "chat_id"]);
        let cases: &[(&JsonSchema, &str, Value)] = &[
            // 2 组引号 + 紧贴值尾
            (
                &nested,
                r#"{"chat_id":"w","text_content":{"text":"跟进"25年12月"的"进度""}}"#,
                json!({"chat_id": "w", "text_content": {"text": "跟进\"25年12月\"的\"进度\""}}),
            ),
            // 1 组引号在中间
            (
                &nested,
                r#"{"chat_id":"w","text_content":{"text":"跟进"25年12月"的进度"}}"#,
                json!({"chat_id": "w", "text_content": {"text": "跟进\"25年12月\"的进度"}}),
            ),
            // 1 组引号 + 紧贴值尾
            (
                &nested,
                r#"{"chat_id":"w","text_content":{"text":"跟进"25年12月""}}"#,
                json!({"chat_id": "w", "text_content": {"text": "跟进\"25年12月\""}}),
            ),
            // 2 组引号在中间
            (
                &nested,
                r#"{"chat_id":"w","text_content":{"text":"请看"A"和"B"的对比"}}"#,
                json!({"chat_id": "w", "text_content": {"text": "请看\"A\"和\"B\"的对比"}}),
            ),
            // 嵌套对象内引号收尾 + 后续兄弟键
            (
                &nested,
                r#"{"text_content":{"text":"上线"进度""},"chat_id":"w"}"#,
                json!({"text_content": {"text": "上线\"进度\""}, "chat_id": "w"}),
            ),
            // 扁平字段引号收尾 + 后续兄弟键
            (
                &flat,
                r#"{"text":"上线"进度"","chat_id":"w"}"#,
                json!({"text": "上线\"进度\"", "chat_id": "w"}),
            ),
            // 奇数个引号
            (
                &nested,
                r#"{"chat_id":"w","text_content":{"text":"跟进"25年12月的进度"}}"#,
                json!({"chat_id": "w", "text_content": {"text": "跟进\"25年12月的进度"}}),
            ),
            // 引号后紧跟冒号
            (
                &nested,
                r#"{"chat_id":"w","text_content":{"text":"标题"进度":已完成"}}"#,
                json!({"chat_id": "w", "text_content": {"text": "标题\"进度\":已完成"}}),
            ),
            // emoji 正文
            (
                &nested,
                r#"{"chat_id":"w","text_content":{"text":"进度"✅完成"请查收"}}"#,
                json!({"chat_id": "w", "text_content": {"text": "进度\"✅完成\"请查收"}}),
            ),
            // 英文正文 1 组引号在中间
            (
                &nested,
                r#"{"chat_id":"w","text_content":{"text":"follow "Q4 launch" plan"}}"#,
                json!({"chat_id": "w", "text_content": {"text": "follow \"Q4 launch\" plan"}}),
            ),
        ];
        for (schema, raw, expected) in cases {
            assert!(serde_json::from_str::<Value>(raw).is_err(), "input: {raw}");
            let repaired = repair_json(raw, Some(schema)).unwrap();
            assert_json_diff::assert_json_eq!(repaired, expected.clone());
        }
    }

    /// P1：[repair_json] 引号修复候选必须压倒 jsonrepair 的静默改坏输出
    /// 条件：{"text":"跟进"25年12月""}（jsonrepair-rs 会把正文片段 "25年12月" 改坏成 key）
    /// 断言：结果为引号修复形态，且不等于 jsonrepair-rs 的改坏基线
    #[test]
    fn repair_json_rejects_jsonrepair_silent_corruption() {
        let raw = r#"{"text":"跟进"25年12月""}"#;
        let repaired = repair_json(raw, Some(&schema_with(&["text"]))).unwrap();
        assert_json_diff::assert_json_eq!(repaired, json!({"text": "跟进\"25年12月\""}));
        if let Ok(baseline) = jsonrepair_rs::jsonrepair_value(raw) {
            assert_ne!(repaired, baseline, "must not take the corrupted output");
        }
    }

    /// P1：[repair_json] 顶层数组打分平分时偏向保守的引号修复候选
    /// 条件：["a "quote""]（jsonrepair-rs 会把一个元素拆成两个）
    /// 断言：结果为单元素数组 ["a \"quote\""]
    #[test]
    fn repair_json_array_tie_prefers_quote_candidate() {
        let raw = r#"["a "quote""]"#;
        let repaired = repair_json(raw, None).unwrap();
        assert_json_diff::assert_json_eq!(repaired, json!(["a \"quote\""]));
    }

    /// P1：[repair_json] 缺逗号输入由 jsonrepair 候选正确胜出（不被引号修复劫持）
    /// 条件：{"a": "x" "b": "y"}（成员之间缺逗号，与引号无关），schema 声明 a 与 b
    /// 断言：结果等于 jsonrepair-rs 基线的双字段读法
    #[test]
    fn repair_json_missing_comma_prefers_jsonrepair() {
        let raw = r#"{"a": "x" "b": "y"}"#;
        let baseline = jsonrepair_rs::jsonrepair_value(raw).expect("jsonrepair baseline");
        assert_json_diff::assert_json_eq!(baseline, json!({"a": "x", "b": "y"}));
        let repaired = repair_json(raw, Some(&schema_with(&["a", "b"]))).unwrap();
        assert_json_diff::assert_json_eq!(repaired, baseline);
    }

    /// P1：[repair_json] 标量类型与 schema 不符不否决候选
    /// 条件：{"count":"3","note":"x""}，schema 声明 count 为 integer、note 为 string
    /// 断言：仍能修复为 {"count":"3","note":"x\""}（类型校验交后台）
    #[test]
    fn repair_json_type_mismatch_still_repairs() {
        let raw = r#"{"count":"3","note":"x""}"#;
        let schema = schema_with_typed(&[("count", "integer"), ("note", "string")]);
        let repaired = repair_json(raw, Some(&schema)).unwrap();
        assert_json_diff::assert_json_eq!(repaired, json!({"count": "3", "note": "x\""}));
    }

    /// P1：[repair_json] required 缺失不报错（必填校验交后台）
    /// 条件：schema 必填 chat_id + text_content，输入仅有 text_content 且正文含未转义引号
    /// 断言：修复成功，不报错
    #[test]
    fn repair_json_ignores_missing_required() {
        let raw = r#"{"text_content":{"text":"提醒"隐患"整改"}}"#;
        let repaired = repair_json(raw, Some(&message_send_schema())).unwrap();
        assert_json_diff::assert_json_eq!(
            repaired,
            json!({"text_content": {"text": "提醒\"隐患\"整改"}})
        );
    }

    /// P1：[repair_json] 同名属性出现在多个上下文时仍产出候选
    /// 条件：content 同属根对象与 extra 子对象的 schema，输入 content 含未转义引号
    /// 断言：content 在兄弟键 chat_id 前收尾（值以引号结尾），chat_id 保持独立
    #[test]
    fn repair_json_duplicated_property_names_repair() {
        let raw = r#"{"content":"hi"there","chat_id":"w"}"#;
        let repaired = repair_json(raw, Some(&duplicated_property_schema())).unwrap();
        assert_json_diff::assert_json_eq!(
            repaired,
            json!({"content": "hi\"there", "chat_id": "w"})
        );
    }

    /// P1：[repair_json] 未知键与 additionalProperties=false 不否决候选
    /// 条件：schema 仅声明 text 且 additionalProperties=false，输入夹带未知键 unknown
    /// 断言：text 引号被修复，unknown 保持独立字段
    #[test]
    fn repair_json_unknown_keys_do_not_veto() {
        let mut schema = schema_with(&["text"]);
        schema.additional_properties = Some(Box::new(AdditionalProperties::Enabled(false)));
        let raw = r#"{"text":"a "quote"","unknown":true}"#;
        let repaired = repair_json(raw, Some(&schema)).unwrap();
        assert_json_diff::assert_json_eq!(
            repaired,
            json!({"text": "a \"quote\"", "unknown": true})
        );
    }

    /// P1：[repair_json] 宽松语法（无引号键 / 单引号）由 jsonrepair 候选胜出
    /// 条件：无引号键 {a:1} 与单引号 {text:'legacy'}
    /// 断言：均修复为对应的合法 JSON
    #[test]
    fn repair_json_legacy_syntax_uses_jsonrepair() {
        assert_json_diff::assert_json_eq!(repair_json(r#"{a:1}"#, None).unwrap(), json!({"a": 1}));
        assert_json_diff::assert_json_eq!(
            repair_json("{text:'legacy'}", Some(&schema_with(&["text"]))).unwrap(),
            json!({"text": "legacy"})
        );
    }

    /// P1：[repair_json] 合法输入原样解析，不因 schema 存在而引入新门禁
    /// 条件：合法 JSON 含类型与 schema 不符的字段、未知键、已转义引号与弯引号
    /// 断言：输入原样返回（schema 校验不归本函数）
    #[test]
    fn repair_json_valid_input_is_not_gated_by_schema() {
        let schema = schema_with(&["text"]);
        let raw = r#"{"text":123,"extra":true}"#;
        assert_json_diff::assert_json_eq!(
            repair_json(raw, Some(&schema)).unwrap(),
            json!({"text": 123, "extra": true})
        );
        let valid = r#"{"text":"keep \"escaped\" and “curly quotes”"}"#;
        assert_eq!(
            repair_json(valid, Some(&schema)).unwrap(),
            serde_json::from_str::<Value>(valid).unwrap()
        );
    }

    // ── repair_json：保守性与拒绝路径 ──

    /// P2：[repair_json] 修复时保留既有转义与内联容器、弯引号
    /// 条件：text 值内分别混有已转义引号 + 未转义引号、内联 {} / [] 容器、} ] 与弯引号
    /// 断言：已转义内容原样保留，仅未转义引号被补转义，容器结构不被误判为收尾
    #[test]
    fn repair_json_preserves_escapes_and_inline_containers() {
        let schema = schema_with(&["text", "next"]);
        let cases = [
            (
                r#"{"text":"keep \"escaped\" and "raw" quotes\\path\n","next":"ok"}"#,
                json!({"text": "keep \"escaped\" and \"raw\" quotes\\path\n", "next": "ok"}),
            ),
            (
                r#"{"text":"example {"nested":["a", "b"]} and "quoted"","next":"ok"}"#,
                json!({"text": "example {\"nested\":[\"a\", \"b\"]} and \"quoted\"", "next": "ok"}),
            ),
            (
                r#"{"text":"keep } ] and “curly quotes”, "raw" too","next":"ok"}"#,
                json!({"text": "keep } ] and “curly quotes”, \"raw\" too", "next": "ok"}),
            ),
        ];
        for (raw, expected) in cases {
            assert!(serde_json::from_str::<Value>(raw).is_err());
            let repaired = repair_json(raw, Some(&schema)).unwrap();
            assert_json_diff::assert_json_eq!(repaired, expected);
        }
    }

    /// P2：[repair_json] 结构性损坏的输入正确报错
    /// 条件：尾逗号 + 引号、花括号方括号混用的 "{:]"
    /// 断言：全部返回 Err（不臆造修复）
    #[test]
    fn repair_json_rejects_structural_garbage() {
        let schema = schema_with(&["text"]);
        assert!(repair_json(r#"{"text":"a "quote"",}"#, Some(&schema)).is_err());
        assert!(repair_json("{:]", None).is_err());
    }

    /// P2：[repair_json] 空输入无法修复
    /// 条件：输入空串，分别不提供与提供 schema
    /// 断言：均返回 Err（枚举无候选，jsonrepair 兜底同样失败）
    #[test]
    fn repair_json_rejects_empty_input() {
        assert!(repair_json("", None).is_err());
        assert!(repair_json("", Some(&schema_with(&["text"]))).is_err());
    }

    /// P2：[repair_json] 截断输入由 jsonrepair 候选兜底闭合
    /// 条件：未闭合的字符串值与悬挂反斜杠（引号修复路径无法产出候选）
    /// 断言：jsonrepair 候选胜出，分别修复为闭合字符串与去除反斜杠的值
    #[test]
    fn repair_json_truncated_string_uses_jsonrepair() {
        let schema = schema_with(&["text"]);
        assert_json_diff::assert_json_eq!(
            repair_json(r#"{"text":"unterminated"#, Some(&schema)).unwrap(),
            json!({"text": "unterminated"})
        );
        assert_json_diff::assert_json_eq!(
            repair_json(r#"{"text":"dangling\"#, Some(&schema)).unwrap(),
            json!({"text": "dangling"})
        );
    }

    /// P1：[repair_json] 顶层数组的元素对象内引号修复
    /// 条件：输入 [{"text":"a "quote""}]，schema 声明 text
    /// 断言：修复为单元素数组，元素 text 引号转义
    #[test]
    fn repair_json_top_level_array_of_objects_repairs() {
        let raw = r#"[{"text":"a "quote""}]"#;
        assert_json_diff::assert_json_eq!(
            repair_json(raw, Some(&schema_with(&["text"]))).unwrap(),
            json!([{"text": "a \"quote\""}])
        );
    }

    /// P1：[repair_json] 数组 items 的 oneOf 分支与 map 值内引号端到端修复
    /// 条件：rows 为 oneOf 数组、labels 为 additionalProperties map，两处 string
    ///       叶子均含未转义引号
    /// 断言：rows[1].text 与 labels.custom.label 的引号均被转义修复
    #[test]
    fn repair_json_repairs_array_items_and_map_values() {
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
        let raw =
            r#"{"rows":[null,{"text":"a "quote""}],"labels":{"custom":{"label":"b "quote""}}}"#;
        assert_json_diff::assert_json_eq!(
            repair_json(raw, Some(&schema)).unwrap(),
            json!({
                "rows": [null, {"text": "a \"quote\""}],
                "labels": {"custom": {"label": "b \"quote\""}}
            })
        );
    }

    /// P1：[repair_json] 未声明的 string 成员被吞入前一个 string 正文
    /// 条件：schema 仅声明 text 且 additionalProperties=false，输入夹带完整的
    ///       unknown 成员（"未声明键视为正文"打分设计的直接推论：吞并候选的
    ///       undeclared 计数为 0，排序先于独立候选）
    /// 断言：unknown 不保留为独立字段，整段被吞入 text 正文
    #[test]
    fn repair_json_undeclared_member_is_absorbed_into_text() {
        let mut schema = schema_with(&["text"]);
        schema.additional_properties = Some(Box::new(AdditionalProperties::Enabled(false)));
        let raw = r#"{"text":"a "quote"","unknown":"must not become text"}"#;
        assert_json_diff::assert_json_eq!(
            repair_json(raw, Some(&schema)).unwrap(),
            json!({"text": "a \"quote\"\",\"unknown\":\"must not become text"})
        );
    }

    /// P1：[repair_json] 仅含未声明键的输入也修复引号
    /// 条件：{"unknown":"a "quote""}，分别配不含 unknown 的 schema 与不提供 schema
    /// 断言：均修复为 {"unknown":"a \"quote\""}（未知键不否决）
    #[test]
    fn repair_json_unknown_key_only_input_repairs() {
        let text_schema = schema_with(&["text"]);
        let raw = r#"{"unknown":"a "quote""}"#;
        for schema in [None, Some(&text_schema)] {
            assert_json_diff::assert_json_eq!(
                repair_json(raw, schema).unwrap(),
                json!({"unknown": "a \"quote\""})
            );
        }
    }

    /// P1：[repair_json] 兄弟子对象共享属性名时仍产出候选
    /// 条件：left 与 right 子对象均声明 text，输入 {"left":{"text":"a "quote"","next":1}}
    /// 断言：left.text 引号被转义、next 保持独立
    #[test]
    fn repair_json_shared_property_name_across_siblings_repairs() {
        let schema: JsonSchema = serde_json::from_value(json!({
            "type": "object", "properties": {
                "left": {"type": "object", "properties": {
                    "text": {"type": "string"}, "next": {"type": "integer"}
                }},
                "right": {"type": "object", "properties": {
                    "text": {"type": "string"}, "other": {"type": "integer"}
                }}
            }
        }))
        .unwrap();
        let raw = r#"{"left":{"text":"a "quote"","next":1}}"#;
        assert_json_diff::assert_json_eq!(
            repair_json(raw, Some(&schema)).unwrap(),
            json!({"left": {"text": "a \"quote\"", "next": 1}})
        );
    }

    /// P2：[repair_json] 无 schema 时按转义最少启发式修复 message send 原型
    /// 条件：原型三组未转义引号，不提供 schema
    /// 断言：修复结果与带 schema 一致（吞并候选需更多转义，自然落选）
    #[test]
    fn repair_json_without_schema_repairs_prototype() {
        let raw =
            r#"{"chat_id":"wr001","text_content":{"text":"跟进"25年12月后上线"的"系统单量进度""}}"#;
        assert_json_diff::assert_json_eq!(
            repair_json(raw, None).unwrap(),
            json!({"chat_id": "wr001", "text_content": {"text": "跟进\"25年12月后上线\"的\"系统单量进度\""}})
        );
    }

    /// P2：[repair_json] 候选超限时降级为仅 jsonrepair 候选
    /// 条件：候选上限强制为 0；{a:1}（jsonrepair 可修复）与
    ///       {"text":"a "quote""}（jsonrepair 报错）
    /// 断言：前者退化为 jsonrepair 基线 {a:1}；后者跟随基线返回 Err；
    ///       正常上限下则是引号修复结果（不 panic）
    #[test]
    fn repair_json_candidate_cap_degrades_to_jsonrepair() {
        let no_candidates = Budgets {
            candidates: 0,
            ..Budgets::default()
        };
        let legacy = r#"{a:1}"#;
        let baseline = jsonrepair_rs::jsonrepair_value(legacy).expect("jsonrepair baseline");
        assert_json_diff::assert_json_eq!(
            repair_json_inner(legacy, None, no_candidates).unwrap(),
            baseline
        );
        let raw = r#"{"text":"a "quote""}"#;
        let schema = schema_with(&["text"]);
        assert!(repair_json_inner(raw, Some(&schema), no_candidates).is_err());
        assert_json_diff::assert_json_eq!(
            repair_json(raw, Some(&schema)).unwrap(),
            json!({"text": "a \"quote\""})
        );
    }

    /// P2：[enumerate_quote_candidates] 候选数超限截断时保留已找到的有效候选
    /// 条件：{"a":"say ","b":"fake""} 可枚举出两个 strict-valid 候选，强制候选上限为 1
    /// 断言：枚举器产出 1 个候选后标记 truncated()=true；该候选是最佳优先序下
    ///       转义最少的双字段读法，修复结果取它而非降级 jsonrepair
    ///       （截断态下拿到的是搜索序第一名，未必等于全量枚举的打分冠军——
    ///       同一输入配 schema {a} 的全量结果见 repair_json_schema_ranks_ambiguous_candidates）
    #[test]
    fn repair_json_candidate_cap_keeps_partial_candidates() {
        let one_candidate = Budgets {
            candidates: 1,
            ..Budgets::default()
        };
        let raw = r#"{"a":"say ","b":"fake""}"#;
        let mut enumeration = enumerate_quote_candidates(raw, one_candidate);
        let candidates: Vec<_> = enumeration.by_ref().collect();
        assert_eq!(candidates.len(), 1, "cap 1 yields exactly one candidate");
        assert_eq!(
            candidates[0].escapes, 1,
            "best-first yields ③ optimum first"
        );
        assert!(
            enumeration.truncated(),
            "cap 1 must truncate a two-candidate enumeration"
        );
        let schema = schema_with(&["a"]);
        let partial = repair_json_inner(raw, Some(&schema), one_candidate).unwrap();
        assert_json_diff::assert_json_eq!(partial, json!({"a": "say ", "b": "fake\""}));
    }

    /// P1：[repair_json] 两条修复策略的成功事件可通过 strategy 判别字段区分
    /// 条件：先经引号修复 `{"text":"a "quote"","next":"json"}`，再走 legacy `{a:1}`
    /// 断言：两次均上报 ok_repaired，且 strategy 字段均非空且互不相同
    #[test]
    fn repair_json_telemetry_distinguishes_repair_strategy() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();

        let collected: Arc<Mutex<Vec<ClientEvent>>> = Arc::new(Mutex::new(Vec::new()));
        let c = collected.clone();

        let scope = CaptureScope::new();
        scope.on_event(move |ev: ClientEvent| {
            c.lock().unwrap().push(ev);
        });

        let _enter = scope.span().enter();
        let _ = repair_json(
            r#"{"text":"a "quote"","next":"json"}"#,
            Some(&schema_with(&["text", "next"])),
        );
        let _ = repair_json(r#"{a:1}"#, None);
        drop(_enter);

        let snaps: Vec<ClientEvent> = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 2);
        for snap in &snaps {
            assert_eq!(snap.kind, ctr::json_repair::KIND);
            assert_json_diff::assert_json_eq!(
                snap.payload[ctr::json_repair::FIELD_OUTCOME],
                json!(ctr::json_repair::OUTCOME_OK_REPAIRED)
            );
        }
        let strategies: Vec<&Value> = snaps
            .iter()
            .map(|snap| {
                snap.payload
                    .get(ctr::json_repair::FIELD_STRATEGY)
                    .expect("json_repair event must carry a strategy discriminator")
            })
            .collect();
        assert!(
            strategies.iter().all(|strategy| !strategy.is_null()),
            "both repair strategies must report a strategy discriminator, got: {strategies:?}"
        );
        assert_ne!(strategies[0], strategies[1]);
    }

    /// P1：[repair_json] 合法 JSON 不发射遥测事件（非 repair 路径不上报）
    /// 条件：输入合法 JSON
    /// 断言：CaptureScope 没有收到任何事件
    #[test]
    fn repair_json_telemetry_no_event_on_valid() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();

        let collected: Arc<Mutex<Vec<ClientEvent>>> = Arc::new(Mutex::new(Vec::new()));
        let c = collected.clone();

        let scope = CaptureScope::new();
        scope.on_event(move |ev: ClientEvent| {
            c.lock().unwrap().push(ev);
        });

        let _enter = scope.span().enter();
        let _ = repair_json(r#"{"a":1}"#, None);
        drop(_enter);

        let snaps: Vec<ClientEvent> = std::mem::take(&mut *collected.lock().unwrap());
        assert!(snaps.is_empty(), "合法 JSON 不应发射遥测事件");
    }

    /// P1：[repair_json] 修复后 JSON 发射 ok_repaired 遥测事件并携带候选数
    /// 条件：输入可修复的非标准 JSON
    /// 断言：CaptureScope 收到 kind="json_repair"、outcome="ok_repaired" 的事件，
    ///       payload 携带 candidates，且不含 input / output 等任何原文相关字段
    #[test]
    fn repair_json_telemetry_ok_repaired() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();

        let collected: Arc<Mutex<Vec<ClientEvent>>> = Arc::new(Mutex::new(Vec::new()));
        let c = collected.clone();

        let scope = CaptureScope::new();
        scope.on_event(move |ev: ClientEvent| {
            c.lock().unwrap().push(ev);
        });

        let _enter = scope.span().enter();
        let _ = repair_json(r#"{a:1}"#, None);
        drop(_enter);

        let snaps: Vec<ClientEvent> = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, ctr::json_repair::KIND);
        assert_json_diff::assert_json_eq!(
            snaps[0].payload[ctr::json_repair::FIELD_OUTCOME],
            json!(ctr::json_repair::OUTCOME_OK_REPAIRED)
        );
        assert!(
            snaps[0].payload.get("input").is_none()
                && snaps[0].payload.get("output").is_none()
                && snaps[0].payload.get("input_len").is_none()
                && snaps[0].payload.get("input_digest").is_none(),
            "nothing derived from the raw input must be reported"
        );
        let candidates = snaps[0].payload[ctr::json_repair::FIELD_CANDIDATES]
            .as_u64()
            .expect("ok_repaired must report the candidate count");
        assert!(
            candidates >= 1,
            "candidates must be >= 1, got: {candidates}"
        );
    }

    /// P1：[repair_json] 修复失败时发射 err_repair 遥测事件
    /// 条件：输入不可修复的残缺 JSON
    /// 断言：CaptureScope 收到 kind="json_repair"、outcome="err_repair" 的事件，
    ///       且不含任何原文相关字段
    #[test]
    fn repair_json_telemetry_err_repair() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();

        let collected: Arc<Mutex<Vec<ClientEvent>>> = Arc::new(Mutex::new(Vec::new()));
        let c = collected.clone();

        let scope = CaptureScope::new();
        scope.on_event(move |ev: ClientEvent| {
            c.lock().unwrap().push(ev);
        });

        let _enter = scope.span().enter();
        let _ = repair_json("{:]", None);
        drop(_enter);

        let snaps: Vec<ClientEvent> = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, ctr::json_repair::KIND);
        assert_json_diff::assert_json_eq!(
            snaps[0].payload[ctr::json_repair::FIELD_OUTCOME],
            json!(ctr::json_repair::OUTCOME_ERR_REPAIR)
        );
        assert!(
            snaps[0].payload.get("input").is_none()
                && snaps[0].payload.get("input_len").is_none()
                && snaps[0].payload.get("input_digest").is_none(),
            "nothing derived from the raw input must be reported"
        );
    }
}
