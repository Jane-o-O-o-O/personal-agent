//! Telemetry-aware serde adapters that mirror `serde_with`'s fallback/skip
//! semantics while emitting structured events on every hit.
//!
//! Three adapters are provided as drop-in replacements:
//!
//! | Adapter                | Replaces              | Event kind               |
//! |------------------------|-----------------------|--------------------------|
//! | [`EmitDefaultOnError`] | `DefaultOnError`      | `schema_parse_error`     |
//! | [`EmitVecSkipError`]   | `VecSkipError`        | `schema_parse_error`     |
//! | [`EmitMapSkipError`]   | `MapSkipError`        | `schema_parse_error`     |
//!
//! All three buffer the input as `serde_json::Value` (INVARIANT: discovery
//! schema is always deserialized from serde_json — see
//! `registry/cache.rs`), then re-run the inner adapter on the buffered value.
//! On failure they fall back to `Default` / skip the element, emit a single
//! `schema_parse_error` telemetry point (field label only, for aggregation),
//! and log the diagnostic details via `tracing::warn!`.

use std::fmt;
use std::hash::Hash;
use std::marker::PhantomData;

use indexmap::IndexMap;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde_with::{DeserializeAs, Same, SerializeAs};

use crate::telemetry::contract::schema_parse_error as ctr;

// ── FieldLabel ─────────────────────────────────────────────────────

/// A zero-sized marker carrying a stable label for a schema fallback/skip field.
///
/// Used as the first generic parameter `L` of the `Emit*` adapters so that
/// every `telemetry::emit` payload includes a stable, low-cardinality field
/// identifier (e.g. `"MethodSchema.request"`) — no PII risk.
pub(crate) trait FieldLabel {
    /// Stable `Type.field` label, e.g. `"MethodSchema.request"`.
    const LABEL: &'static str;
}

/// Define zero-sized [`FieldLabel`] markers in a batch.
///
/// ```text
/// use crate::telemetry::schema_field_labels;
///
/// schema_field_labels! {
///     MethodSchemaRequest => "MethodSchema.request",
///     ServiceCatalogItems => "ServiceCatalog.items",
/// }
/// ```
macro_rules! schema_field_labels {
    ($($name:ident => $label:literal),+ $(,)?) => {
        $(
            #[derive(Debug)]
            pub(crate) struct $name;
            impl $crate::telemetry::FieldLabel for $name {
                const LABEL: &'static str = $label;
            }
        )+
    };
}
pub(crate) use schema_field_labels;

// ── helpers ─────────────────────────────────────────────────────────

/// Emit `schema_parse_error` telemetry + log diagnostic details via `tracing::warn!`.
///
/// `detail` provides the extra context for the log message (error message,
/// skipped count, etc.) — it is NOT included in the telemetry payload.
fn emit_parse_error<L: FieldLabel>(detail: &dyn fmt::Display) {
    tracing::warn!(
        field = L::LABEL,
        error = %detail,
        "schema parse error",
    );
    super::emit(
        ctr::KIND,
        &serde_json::json!({ ctr::FIELD_FIELD: L::LABEL }),
    );
}

// ── EmitDefaultOnError ──────────────────────────────────────────────

/// Telemetry-aware drop-in replacement for `serde_with::DefaultOnError`.
///
/// On deserialization failure it emits `schema_parse_error` + logs the error
/// via `tracing::warn!`, then falls back to `T::default()` — byte-for-byte
/// identical fallback behavior to `DefaultOnError`, plus observability.
pub(crate) struct EmitDefaultOnError<L, TAs = Same>(PhantomData<(L, TAs)>);

impl<'de, L, T, TAs> DeserializeAs<'de, T> for EmitDefaultOnError<L, TAs>
where
    L: FieldLabel,
    T: Default,
    TAs: for<'a> DeserializeAs<'a, T>,
{
    fn deserialize_as<D>(deserializer: D) -> Result<T, D::Error>
    where
        D: Deserializer<'de>,
    {
        // INVARIANT: discovery schema 恒由 serde_json 反序列化（见 registry/cache.rs）。
        // 若未来引入非 self-describing deserializer，需用 serde::__private::de::Content 兜底。
        let content = serde_json::Value::deserialize(deserializer)?;

        match TAs::deserialize_as(&content) {
            Ok(value) => Ok(value),
            Err(err) => {
                emit_parse_error::<L>(&err);
                Ok(T::default())
            }
        }
    }
}

impl<L, T, TAs> SerializeAs<T> for EmitDefaultOnError<L, TAs>
where
    T: Serialize,
{
    fn serialize_as<S>(source: &T, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        source.serialize(serializer)
    }
}

// ── EmitVecSkipError ────────────────────────────────────────────────

/// Telemetry-aware drop-in replacement for `serde_with::VecSkipError`.
///
/// Buffers the input as a JSON array, tries each element through the inner
/// adapter, and skips malformed ones. If any elements are skipped, emits
/// `schema_parse_error` + logs via `tracing::warn!` (aggregated: one event
/// total regardless of how many elements were skipped).
///
/// **Non-array input** propagates an error upward (matching `VecSkipError`
/// behavior) — there is no outer `DefaultOnError` guard on `ServiceCatalog.items`.
pub(crate) struct EmitVecSkipError<L, TAs = Same>(PhantomData<(L, TAs)>);

impl<'de, L, T, TAs> DeserializeAs<'de, Vec<T>> for EmitVecSkipError<L, TAs>
where
    L: FieldLabel,
    TAs: for<'a> DeserializeAs<'a, T>,
{
    fn deserialize_as<D>(deserializer: D) -> Result<Vec<T>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let content = serde_json::Value::deserialize(deserializer)?;
        let arr = match content {
            serde_json::Value::Array(arr) => arr,
            _ => {
                return Err(serde::de::Error::custom(
                    "invalid type: expected a sequence",
                ));
            }
        };

        let mut out = Vec::with_capacity(arr.len());
        let mut skipped = 0u32;
        let mut first_error: Option<String> = None;
        for element in &arr {
            match TAs::deserialize_as(element) {
                Ok(v) => out.push(v),
                Err(e) => {
                    skipped += 1;
                    first_error.get_or_insert_with(|| e.to_string());
                }
            }
        }
        if skipped > 0 {
            let detail = format!(
                "{} element(s) skipped, first error: {}",
                skipped,
                first_error.as_deref().unwrap_or(""),
            );
            emit_parse_error::<L>(&detail);
        }
        Ok(out)
    }
}

impl<L, T, TAs> SerializeAs<Vec<T>> for EmitVecSkipError<L, TAs>
where
    T: Serialize,
{
    fn serialize_as<S>(source: &Vec<T>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        source.serialize(serializer)
    }
}

// ── EmitMapSkipError ────────────────────────────────────────────────

/// Telemetry-aware drop-in replacement for `serde_with::MapSkipError`
/// (targets `IndexMap` specifically, matching our schema types).
///
/// Buffers the input as a JSON object, tries each key-value pair through
/// the inner key/value adapters, and skips malformed entries. If any entries
/// are skipped, emits `schema_parse_error` + logs via `tracing::warn!`
/// (aggregated: one event total).
///
/// **Non-object input** propagates an error upward. When nested inside
/// [`EmitDefaultOnError`] this is caught and results in a
/// `schema_parse_error` event + empty map — matching the combined
/// semantics of `DefaultOnError<MapSkipError<_,_>>`.
pub(crate) struct EmitMapSkipError<L, KAs = Same, VAs = Same>(PhantomData<(L, KAs, VAs)>);

impl<'de, L, K, V, KAs, VAs> DeserializeAs<'de, IndexMap<K, V>> for EmitMapSkipError<L, KAs, VAs>
where
    L: FieldLabel,
    K: Eq + Hash,
    KAs: for<'a> DeserializeAs<'a, K>,
    VAs: for<'a> DeserializeAs<'a, V>,
{
    fn deserialize_as<D>(deserializer: D) -> Result<IndexMap<K, V>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let content = serde_json::Value::deserialize(deserializer)?;
        let obj = match content {
            serde_json::Value::Object(obj) => obj,
            _ => return Err(serde::de::Error::custom("invalid type: expected a map")),
        };

        let mut out = IndexMap::with_capacity(obj.len());
        let mut skipped = 0u32;
        let mut first_error: Option<String> = None;
        for (key, value) in obj {
            let k = KAs::deserialize_as(serde_json::Value::String(key));
            let v = VAs::deserialize_as(&value);
            match (k, v) {
                (Ok(k), Ok(v)) => {
                    out.insert(k, v);
                }
                (Err(e), _) | (Ok(_), Err(e)) => {
                    skipped += 1;
                    first_error.get_or_insert_with(|| e.to_string());
                }
            }
        }
        if skipped > 0 {
            let detail = format!(
                "{} entry(ies) skipped, first error: {}",
                skipped,
                first_error.as_deref().unwrap_or(""),
            );
            emit_parse_error::<L>(&detail);
        }
        Ok(out)
    }
}

impl<L, K, V, KAs, VAs> SerializeAs<IndexMap<K, V>> for EmitMapSkipError<L, KAs, VAs>
where
    K: Serialize,
    V: Serialize,
{
    fn serialize_as<S>(source: &IndexMap<K, V>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        source.serialize(serializer)
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：serde_fallback（遥测感知的 serde 容错适配器）
    //!
    //! ### 关键接口
    //! - [EmitDefaultOnError] — DefaultOnError + emit + tracing::warn!
    //! - [EmitVecSkipError] — VecSkipError + 聚合 emit + tracing::warn!
    //! - [EmitMapSkipError] — MapSkipError + 聚合 emit + tracing::warn!
    //! - [FieldLabel] — 字段标签 trait（schema_field_labels! 宏实现）
    //!
    //! ### 关键分支与异常路径
    //! - 合法值 → 正常返回，无遥测
    //! - 类型错误 → EmitDefaultOnError 回退默认值 + emit schema_parse_error
    //! - 数组/Map 含坏元素 → EmitVecSkipError/EmitMapSkipError 跳过坏元素 + emit
    //! - 非数组/非 Map 输入 → 向上传播 Err
    //! - 序列化 → 直接委托（无副作用）
    //! - 嵌套组合 → EmitDefaultOnError<EmitMapSkipError> 两层 kind 相同但触发时机不同
    //!
    //! ### 上下游交互
    //! - 上游：#[serde_as(as = "EmitDefaultOnError<Label>")] 注解在 registry/types.rs
    //! - 下游：telemetry::emit 发射到 CaptureScope → agent 统一透传
    //! - 日志：tracing::warn! 输出诊断详情

    use std::sync::{Arc, Mutex};

    use indexmap::IndexMap;
    use serde::{Deserialize, Serialize};
    use serde_with::{DeserializeAs, Same, serde_as};
    use tracing_subscriber::prelude::*;

    use super::*;
    use crate::telemetry::contract::schema_parse_error as tctr;
    use crate::telemetry::{CaptureScope, ClientEvent, EventExt, TelemetryLayer};

    // ── test labels ─────────────────────────────────────────────────

    schema_field_labels! {
        TestLabel     => "TestType.test_field",
        VecLabel      => "TestType.vec_field",
        MapLabel      => "TestType.map_field",
    }

    // ── test structs (for SerializeAs round-trip) ────────────────────

    #[serde_as]
    #[derive(Debug, PartialEq, Serialize, Deserialize)]
    struct TestStruct {
        #[serde_as(as = "EmitDefaultOnError<TestLabel>")]
        #[serde(default)]
        value: String,
    }

    #[serde_as]
    #[derive(Debug, PartialEq, Serialize, Deserialize)]
    struct VecStruct {
        #[serde_as(as = "EmitVecSkipError<VecLabel>")]
        #[serde(default)]
        items: Vec<i32>,
    }

    #[serde_as]
    #[derive(Debug, PartialEq, Serialize, Deserialize)]
    struct MapStruct {
        #[serde_as(as = "EmitMapSkipError<MapLabel>")]
        #[serde(default)]
        entries: IndexMap<String, i32>,
    }

    // ════════════════════════════════════════════════════════════════
    // schema_field_labels! 宏
    // ════════════════════════════════════════════════════════════════

    /// P1：[schema_field_labels!] 生成的类型实现 FieldLabel 且 LABEL 正确
    /// 条件：宏定义 `Foo => "Bar.baz"`
    /// 断言：Foo::LABEL == "Bar.baz"
    #[test]
    fn field_label_macro_generates_correct_label() {
        assert_eq!(TestLabel::LABEL, "TestType.test_field");
        assert_eq!(VecLabel::LABEL, "TestType.vec_field");
        assert_eq!(MapLabel::LABEL, "TestType.map_field");
    }

    // ════════════════════════════════════════════════════════════════
    // EmitDefaultOnError — DeserializeAs
    // ════════════════════════════════════════════════════════════════

    /// 测试 helper：注册共享 emit callsite 并重建 interest 缓存（机理见
    /// crate::telemetry::event_capture 测试模块的同名 helper）。
    /// 使用时机：`set_default` 之后、`CaptureScope::new()` 之前；
    /// 热身事件不进入断言。
    fn warm_up_emit_callsite() {
        crate::telemetry::emit("test_warmup", &serde_json::json!({}));
        tracing::callsite::rebuild_interest_cache();
    }

    /// P0：[EmitDefaultOnError] 合法值正常反序列化
    /// 条件：输入 JSON 字符串 "hello"
    /// 断言：返回 String "hello"
    #[test]
    fn default_on_error_valid_value() {
        let input = serde_json::json!("hello");
        let v: String = EmitDefaultOnError::<TestLabel>::deserialize_as(&input).unwrap();
        assert_eq!(v, "hello");
    }

    /// P0：[EmitDefaultOnError] 类型错误时回退默认值
    /// 条件：输入 JSON 数字 42 反序列化为 String
    /// 断言：返回空字符串 ""（String::default()）
    #[test]
    fn default_on_error_wrong_type_falls_back() {
        let input = serde_json::json!(42);
        let v: String = EmitDefaultOnError::<TestLabel>::deserialize_as(&input).unwrap();
        assert_eq!(v, "");
    }

    /// P0：[EmitDefaultOnError] Option<String> 为 null 时正常返回 None
    /// 条件：输入 JSON null 反序列化为 Option<String>
    /// 断言：返回 None（非回退路径）
    #[test]
    fn default_on_error_option_null_is_none() {
        let input = serde_json::json!(null);
        let v: Option<String> = EmitDefaultOnError::<TestLabel>::deserialize_as(&input).unwrap();
        assert!(v.is_none());
    }

    /// P1：[EmitDefaultOnError] 类型错误时发射 schema_parse_error 遥测事件
    /// 条件：输入数字 42 反序列化为 String，用 CaptureScope 捕获
    /// 断言：收到 1 条 kind="schema_parse_error"、field="TestType.test_field"
    #[test]
    fn default_on_error_emits_telemetry() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev| c.lock().unwrap().push(ev));

        let _enter = scope.span().enter();
        let _v: String =
            EmitDefaultOnError::<TestLabel>::deserialize_as(&serde_json::json!(42)).unwrap();
        drop(_enter);

        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, tctr::KIND);
        assert_json_diff::assert_json_eq!(
            snaps[0].payload[tctr::FIELD_FIELD],
            serde_json::json!("TestType.test_field")
        );
    }

    /// P1：[EmitDefaultOnError] 合法值不发射遥测事件
    /// 条件：输入合法 JSON 字符串
    /// 断言：CaptureScope 没有收到任何事件
    #[test]
    fn default_on_error_no_telemetry_on_valid() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev| c.lock().unwrap().push(ev));

        let _enter = scope.span().enter();
        let _v: String =
            EmitDefaultOnError::<TestLabel>::deserialize_as(&serde_json::json!("ok")).unwrap();
        drop(_enter);

        assert!(collected.lock().unwrap().is_empty());
    }

    /// P1：[EmitDefaultOnError] 反序列化 i32 成功
    /// 条件：输入 JSON 数字 42 反序列化为 i32
    /// 断言：返回 42
    #[test]
    fn default_on_error_i32_valid() {
        let input = serde_json::json!(42);
        let v: i32 = EmitDefaultOnError::<TestLabel>::deserialize_as(&input).unwrap();
        assert_eq!(v, 42);
    }

    /// P1：[EmitDefaultOnError] i32 类型错误时回退为 0
    /// 条件：输入字符串 "x" 反序列化为 i32
    /// 断言：返回 0
    #[test]
    fn default_on_error_i32_wrong_type_falls_back_to_zero() {
        let input = serde_json::json!("x");
        let v: i32 = EmitDefaultOnError::<TestLabel>::deserialize_as(&input).unwrap();
        assert_eq!(v, 0);
    }

    // ════════════════════════════════════════════════════════════════
    // EmitDefaultOnError — SerializeAs
    // ════════════════════════════════════════════════════════════════

    /// P1：[EmitDefaultOnError] SerializeAs 正常序列化
    /// 条件：TestStruct { value: "hi" }
    /// 断言：JSON 为 {"value":"hi"}
    #[test]
    fn default_on_error_serialize_as() {
        let s = TestStruct { value: "hi".into() };
        let json = serde_json::to_value(&s).unwrap();
        assert_json_diff::assert_json_eq!(json["value"], serde_json::json!("hi"));
    }

    /// P1：[EmitDefaultOnError] SerializeAs + DeserializeAs round-trip
    /// 条件：TestStruct 序列化为 JSON 再反序列化
    /// 断言：round-trip 后值相等
    #[test]
    fn default_on_error_round_trip() {
        let original = TestStruct {
            value: "roundtrip".into(),
        };
        let json = serde_json::to_value(&original).unwrap();
        let restored: TestStruct = serde_json::from_value(json).unwrap();
        assert_eq!(original, restored);
    }

    // ════════════════════════════════════════════════════════════════
    // EmitVecSkipError — DeserializeAs
    // ════════════════════════════════════════════════════════════════

    /// P0：[EmitVecSkipError] 全部元素合法时全部收集
    /// 条件：输入 [1, 2, 3]
    /// 断言：返回 vec![1, 2, 3]
    #[test]
    fn vec_skip_all_valid() {
        let input = serde_json::json!([1, 2, 3]);
        let v: Vec<i32> = EmitVecSkipError::<VecLabel>::deserialize_as(&input).unwrap();
        assert_eq!(v, vec![1, 2, 3]);
    }

    /// P0：[EmitVecSkipError] 部分元素坏时跳过坏元素
    /// 条件：输入 [1, "x", 3] 反序列化为 Vec<i32>
    /// 断言：返回 vec![1, 3]（"x" 被跳过）
    #[test]
    fn vec_skip_skips_bad_elements() {
        let input = serde_json::json!([1, "x", 3]);
        let v: Vec<i32> = EmitVecSkipError::<VecLabel>::deserialize_as(&input).unwrap();
        assert_eq!(v, vec![1, 3]);
    }

    /// P1：[EmitVecSkipError] 全部元素坏时返回空数组
    /// 条件：输入 ["x", "y", "z"] 反序列化为 Vec<i32>
    /// 断言：返回空 vec![]
    #[test]
    fn vec_skip_all_bad_returns_empty() {
        let input = serde_json::json!(["x", "y", "z"]);
        let v: Vec<i32> = EmitVecSkipError::<VecLabel>::deserialize_as(&input).unwrap();
        assert!(v.is_empty());
    }

    /// P1：[EmitVecSkipError] 跳过元素时发射 schema_parse_error 遥测
    /// 条件：输入含 2 个坏元素
    /// 断言：收到 1 条事件，field 正确
    #[test]
    fn vec_skip_emits_telemetry() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev| c.lock().unwrap().push(ev));

        let _enter = scope.span().enter();
        let _v: Vec<i32> =
            EmitVecSkipError::<VecLabel>::deserialize_as(&serde_json::json!([1, "x", "y"]))
                .unwrap();
        drop(_enter);

        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, tctr::KIND);
        assert_json_diff::assert_json_eq!(
            snaps[0].payload[tctr::FIELD_FIELD],
            serde_json::json!("TestType.vec_field")
        );
    }

    /// P1：[EmitVecSkipError] 全部合法时不发射遥测
    /// 条件：输入 [1, 2, 3]，全部可解析
    /// 断言：CaptureScope 零事件
    #[test]
    fn vec_skip_no_telemetry_on_all_valid() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev| c.lock().unwrap().push(ev));

        let _enter = scope.span().enter();
        let _v: Vec<i32> =
            EmitVecSkipError::<VecLabel>::deserialize_as(&serde_json::json!([1, 2, 3])).unwrap();
        drop(_enter);

        assert!(collected.lock().unwrap().is_empty());
    }

    /// P1：[EmitVecSkipError] 非数组输入返回 Err
    /// 条件：输入 JSON 字符串 "not_an_array"
    /// 断言：deserialize_as 返回 Err（保持 VecSkipError 语义）
    #[test]
    fn vec_skip_non_array_returns_err() {
        let input = serde_json::json!("not_an_array");
        let result: Result<Vec<i32>, _> = EmitVecSkipError::<VecLabel>::deserialize_as(&input);
        assert!(result.is_err());
    }

    // ════════════════════════════════════════════════════════════════
    // EmitVecSkipError — SerializeAs (via struct round-trip)
    // ════════════════════════════════════════════════════════════════

    /// P1：[EmitVecSkipError] SerializeAs + DeserializeAs round-trip
    /// 条件：VecStruct { items: [1, 2, 3] } 序列化再反序列化
    /// 断言：round-trip 后值相等
    #[test]
    fn vec_skip_round_trip() {
        let original = VecStruct {
            items: vec![1, 2, 3],
        };
        let json = serde_json::to_value(&original).unwrap();
        let restored: VecStruct = serde_json::from_value(json).unwrap();
        assert_eq!(original, restored);
    }

    // ════════════════════════════════════════════════════════════════
    // EmitMapSkipError — DeserializeAs
    // ════════════════════════════════════════════════════════════════

    /// P0：[EmitMapSkipError] 全部条目合法时全部收集
    /// 条件：输入 {"a": 1, "b": 2}
    /// 断言：IndexMap 含两个条目
    #[test]
    fn map_skip_all_valid() {
        let input = serde_json::json!({"a": 1, "b": 2});
        let v: IndexMap<String, i32> =
            EmitMapSkipError::<MapLabel>::deserialize_as(&input).unwrap();
        assert_eq!(v.len(), 2);
        assert_eq!(v["a"], 1);
        assert_eq!(v["b"], 2);
    }

    /// P0：[EmitMapSkipError] 部分条目坏时跳过坏条目
    /// 条件：输入 {"a": 1, "b": "x", "c": 3}
    /// 断言：IndexMap 含 "a" 和 "c", 不含 "b"
    #[test]
    fn map_skip_skips_bad_entries() {
        let input = serde_json::json!({"a": 1, "b": "x", "c": 3});
        let v: IndexMap<String, i32> =
            EmitMapSkipError::<MapLabel>::deserialize_as(&input).unwrap();
        assert_eq!(v.len(), 2);
        assert_eq!(v["a"], 1);
        assert!(v.get("b").is_none());
        assert_eq!(v["c"], 3);
    }

    /// P1：[EmitMapSkipError] 全部条目坏时返回空 map
    /// 条件：输入 {"a": "x", "b": "y"} 反序列化为 IndexMap<String, i32>
    /// 断言：IndexMap 为空
    #[test]
    fn map_skip_all_bad_returns_empty() {
        let input = serde_json::json!({"a": "x", "b": "y"});
        let v: IndexMap<String, i32> =
            EmitMapSkipError::<MapLabel>::deserialize_as(&input).unwrap();
        assert!(v.is_empty());
    }

    /// P1：[EmitMapSkipError] 跳过条目时发射 schema_parse_error 遥测
    /// 条件：输入含 1 个坏条目
    /// 断言：收到 1 条事件，field 正确
    #[test]
    fn map_skip_emits_telemetry() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev| c.lock().unwrap().push(ev));

        let _enter = scope.span().enter();
        let _v: IndexMap<String, i32> =
            EmitMapSkipError::<MapLabel>::deserialize_as(&serde_json::json!({"a": 1, "b": "x"}))
                .unwrap();
        drop(_enter);

        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, tctr::KIND);
        assert_json_diff::assert_json_eq!(
            snaps[0].payload[tctr::FIELD_FIELD],
            serde_json::json!("TestType.map_field")
        );
    }

    /// P1：[EmitMapSkipError] 全部合法时不发射遥测
    /// 条件：输入全部可解析
    /// 断言：CaptureScope 零事件
    #[test]
    fn map_skip_no_telemetry_on_all_valid() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev| c.lock().unwrap().push(ev));

        let _enter = scope.span().enter();
        let _v: IndexMap<String, i32> =
            EmitMapSkipError::<MapLabel>::deserialize_as(&serde_json::json!({"a": 1, "b": 2}))
                .unwrap();
        drop(_enter);

        assert!(collected.lock().unwrap().is_empty());
    }

    /// P1：[EmitMapSkipError] 非对象输入返回 Err
    /// 条件：输入 JSON 数组 [1, 2]
    /// 断言：deserialize_as 返回 Err（保持 MapSkipError 语义）
    #[test]
    fn map_skip_non_object_returns_err() {
        let input = serde_json::json!([1, 2]);
        let result: Result<IndexMap<String, i32>, _> =
            EmitMapSkipError::<MapLabel>::deserialize_as(&input);
        assert!(result.is_err());
    }

    // ════════════════════════════════════════════════════════════════
    // EmitMapSkipError — SerializeAs (via struct round-trip)
    // ════════════════════════════════════════════════════════════════

    /// P1：[EmitMapSkipError] SerializeAs + DeserializeAs round-trip
    /// 条件：MapStruct { entries: {"a": 1} } 序列化再反序列化
    /// 断言：round-trip 后值相等
    #[test]
    fn map_skip_round_trip() {
        let mut entries = IndexMap::new();
        entries.insert("a".to_string(), 1);
        let original = MapStruct { entries };
        let json = serde_json::to_value(&original).unwrap();
        let restored: MapStruct = serde_json::from_value(json).unwrap();
        assert_eq!(original, restored);
    }

    // ════════════════════════════════════════════════════════════════
    // 嵌套组合 — EmitDefaultOnError<EmitMapSkipError>
    // ════════════════════════════════════════════════════════════════

    /// P1：[嵌套] 外层非 map 时 EmitDefaultOnError 兜底回退空 map
    /// 条件：输入字符串 "garbage" 作为 IndexMap
    /// 断言：返回空 IndexMap，收到 1 条 schema_parse_error（外层 label）
    #[test]
    fn nested_outside_not_a_map_falls_back() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev| c.lock().unwrap().push(ev));

        let _enter = scope.span().enter();
        let v: IndexMap<String, i32> = EmitDefaultOnError::<
            MapLabel,
            EmitMapSkipError<MapLabel, Same, Same>,
        >::deserialize_as(&serde_json::json!("garbage"))
        .unwrap();
        drop(_enter);

        assert!(v.is_empty());

        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, tctr::KIND);
        assert_json_diff::assert_json_eq!(
            snaps[0].payload[tctr::FIELD_FIELD],
            serde_json::json!("TestType.map_field")
        );
    }

    /// P1：[嵌套] 内层部分条目坏时仅发射一次（内层聚合 emit）
    /// 条件：外层是合法 map，但里面有一个坏条目
    /// 断言：返回不含坏条目的 IndexMap，收到 1 条事件（内层 skip 触发）
    #[test]
    fn nested_inner_skip_emits_once() {
        let _guard = tracing::subscriber::set_default(
            tracing_subscriber::Registry::default().with(TelemetryLayer::new()),
        );
        warm_up_emit_callsite();
        let collected: Arc<Mutex<Vec<ClientEvent>>> = Default::default();
        let c = collected.clone();
        let scope = CaptureScope::new();
        scope.on_event(move |ev| c.lock().unwrap().push(ev));

        let _enter = scope.span().enter();
        let v: IndexMap<String, i32> =
            EmitDefaultOnError::<MapLabel, EmitMapSkipError<MapLabel, Same, Same>>::deserialize_as(
                &serde_json::json!({"a": 1, "b": "x"}),
            )
            .unwrap();
        drop(_enter);

        assert_eq!(v.len(), 1);
        assert_eq!(v["a"], 1);

        let snaps = std::mem::take(&mut *collected.lock().unwrap());
        assert_eq!(snaps.len(), 1);
        assert_eq!(snaps[0].kind, tctr::KIND);
    }
}
