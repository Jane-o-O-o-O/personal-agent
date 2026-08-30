use serde::{Deserialize, Serialize};
use serde_with::{DefaultOnError, serde_as, skip_serializing_none};

#[skip_serializing_none]
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct JsonSchemaWecomDirectives {
    #[serde(
        rename = "x-wecom-file-upload",
        default,
        deserialize_with = "deser_upload_media_opt"
    )]
    pub upload_media: Option<UploadMediaOptions>,

    #[serde(
        rename = "x-wecom-octet-stream",
        default,
        deserialize_with = "deser_wecom_bool_opt"
    )]
    pub octet_stream: Option<WecomBoolValue>,

    #[serde_as(as = "DefaultOnError")]
    #[serde(rename = "x-wecom-file-save", default)]
    pub file_save: Option<FileSaveOptions>,

    #[serde(
        rename = "x-wecom-confirm",
        default,
        deserialize_with = "deser_wecom_bool_opt"
    )]
    pub need_confirm: Option<WecomBoolValue>,

    #[serde(
        rename = "x-wecom-hidden",
        default,
        deserialize_with = "deser_wecom_bool_opt"
    )]
    pub hidden: Option<WecomBoolValue>,

    /// 数组 CLI 输入的分隔符集合。对 string/number/integer 数组生效。
    ///
    /// 字符串数组，每个元素为一个分隔符（允许多字符）。为空时不做分隔符拆分
    /// （仅通过 `--flag v1 --flag v2` 传多值）。
    #[serde(
        rename = "x-wecom-value-delimiter",
        default,
        skip_serializing_if = "Vec::is_empty"
    )]
    pub value_delimiters: Vec<String>,
}

// ── x-wecom-file-upload types ──

/// Options for `x-wecom-file-upload`. Either a boolean or an object.
///
/// | JSON                         | Meaning                                      |
/// |------------------------------|----------------------------------------------|
/// | `true`                       | upload media, `withFilePath` = `false`     |
/// | `false`                      | no upload (→ `None`)                         |
/// | `{"withFilePath": false}`    | upload media, don't forward file path      |
/// | `{"withFilePath": true}`     | upload media, forward file path            |
#[skip_serializing_none]
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UploadMediaOptions {
    /// When `true`, include the local file path in the forwarded payload.
    #[serde_as(as = "DefaultOnError")]
    #[serde(default, rename = "withFilePath")]
    pub with_file_path: Option<bool>,
}

impl UploadMediaOptions {
    /// Returns the value of `with_file_path`, defaulting to `false`.
    pub fn with_file_path(&self) -> bool {
        self.with_file_path.unwrap_or(false)
    }
}

// ── deserializer macro (false → None, true → Some(default), object → Some(parsed)) ──

macro_rules! deser_bool_opt {
    ($name:ident, $ty:ty) => {
        fn $name<'de, D: serde::Deserializer<'de>>(
            deserializer: D,
        ) -> Result<Option<$ty>, D::Error> {
            let v = serde_json::Value::deserialize(deserializer)?;
            Ok(match v {
                serde_json::Value::Bool(false) => None,
                serde_json::Value::Bool(true) => Some(<$ty>::default()),
                serde_json::Value::Object(map) => {
                    Some(serde_json::from_value(serde_json::Value::Object(map)).unwrap_or_default())
                }
                _ => None,
            })
        }
    };
}

deser_bool_opt!(deser_upload_media_opt, UploadMediaOptions);
deser_bool_opt!(deser_wecom_bool_opt, WecomBoolValue);

// ── wecom-bool value type ──

/// Value of boolean directives (`x-wecom-octet-stream`, `x-wecom-confirm`,
/// `x-wecom-hidden`): wraps a JSON object for future extension fields.
///
/// An empty object serializes as `true`.
/// `false` is represented as `None` at the `Option` level.
///
/// | JSON      | Meaning                        |
/// |-----------|--------------------------------|
/// | `true`    | enabled                        |
/// | `false`   | disabled (→ `None`)            |
/// | `{ ... }` | enabled, with extension fields |
#[derive(Debug, Clone, Default)]
pub struct WecomBoolValue(serde_json::Map<String, serde_json::Value>);

impl Serialize for WecomBoolValue {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        if self.0.is_empty() {
            serializer.serialize_bool(true)
        } else {
            self.0.serialize(serializer)
        }
    }
}

impl<'de> Deserialize<'de> for WecomBoolValue {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let v = serde_json::Value::deserialize(deserializer)?;
        match v {
            serde_json::Value::Bool(true) => Ok(Self::default()),
            serde_json::Value::Object(map) => Ok(Self(map)),
            _ => Err(serde::de::Error::custom(
                "expected bool or object for wecom directive",
            )),
        }
    }
}

#[skip_serializing_none]
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FileSaveOptions {
    #[serde_as(as = "DefaultOnError")]
    #[serde(default, rename = "fileName")]
    pub file_name: Option<String>,

    #[serde_as(as = "DefaultOnError")]
    #[serde(default, rename = "contentEncoding")]
    pub content_encoding: Option<String>,
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：directive（Wecom JSON Schema 扩展指令）
    //!
    //! ### 关键接口
    //! - [JsonSchemaWecomDirectives] struct — 企业微信 Schema 扩展指令（upload_media / octet_stream / file_save / need_confirm / hidden / value_delimiters）
    //! - [FileSaveOptions] struct — x-wecom-file-save 指令的选项（fileName / contentEncoding）
    //!
    //! ### 关键分支与异常路径
    //! - 各字段类型错误时容错为 None（DefaultOnError / 自定义 deser_wecom_bool_opt）
    //! - x-wecom-value-delimiter 为标准 Vec<String> 反序列化，不含容错；空串过滤由使用端处理
    //! - [skip_serializing_none] 保证 None 值字段不出现在序列化结果中
    //! - [FileSaveOptions] 中 content_encoding 为 None 时不序列化
    //! - serde(untagged) 处理 AdditionalProperties 的 bool/Schema 分支（在 types.rs）
    //!
    //! ### 上下游交互
    //! - 上游：外部 JSON Schema 中的 x-wecom-* 扩展字段经本模块反序列化为 Rust 结构体
    //! - 下游：`types.rs` 的 [JsonSchema] 通过 `#[serde(flatten)]` 嵌入 [JsonSchemaWecomDirectives]

    use assert_json_diff::{assert_json_eq, assert_json_include};
    use serde_json::json;

    use super::*;

    /// P0：[JsonSchemaWecomDirectives] 包含所有字段的完整指令反序列化
    /// 条件：JSON 包含所有四个指令字段
    /// 断言：各字段正确解析为对应值
    #[test]
    fn deserialize_full_directives() {
        let raw = json!({
            "x-wecom-file-upload": true,
            "x-wecom-octet-stream": true,
            "x-wecom-file-save": {"fileName": "report.pdf", "contentEncoding": "base64"},
            "x-wecom-confirm": true,
            "x-wecom-hidden": true
        });
        let d: JsonSchemaWecomDirectives = serde_json::from_value(raw).unwrap();
        assert!(d.upload_media.is_some());
        assert!(d.octet_stream.is_some());
        assert!(d.file_save.is_some());
        let fs = d.file_save.unwrap();
        assert_eq!(fs.file_name, Some("report.pdf".to_string()));
        assert_eq!(fs.content_encoding, Some("base64".to_string()));
        assert!(d.need_confirm.is_some());
        assert!(d.hidden.is_some());
    }

    /// P1：[JsonSchemaWecomDirectives] 空 JSON 对象反序列化为全 None 指令
    /// 条件：JSON 为空对象 {}
    /// 断言：所有字段均为 None
    #[test]
    fn deserialize_minimal_directives() {
        let raw = json!({});
        let d: JsonSchemaWecomDirectives = serde_json::from_value(raw).unwrap();
        assert!(d.upload_media.is_none());
        assert!(d.octet_stream.is_none());
        assert!(d.file_save.is_none());
        assert!(d.need_confirm.is_none());
        assert!(d.hidden.is_none());
    }

    /// P1：[JsonSchemaWecomDirectives] 容错机制处理非法类型（42 / "not_a_bool" → None）
    /// 条件：x-wecom-file-upload="not_a_bool"，x-wecom-octet-stream=42
    /// 断言：upload_media 与 octet_stream 均被容错为 None
    #[test]
    fn deserialize_tolerates_invalid_types() {
        // 错误类型 → None（upload_media 由 deser_upload_media_opt 容错，octet_stream 由 deser_wecom_bool_opt 容错）
        let raw = json!({
            "x-wecom-file-upload": "not_a_bool",
            "x-wecom-octet-stream": 42
        });
        let d: JsonSchemaWecomDirectives = serde_json::from_value(raw).unwrap();
        // 畸形值被容错为 None
        assert!(d.upload_media.is_none());
        assert!(d.octet_stream.is_none());
    }

    /// P0：[JsonSchemaWecomDirectives] boolean directive 的 Object 值被当成 true
    /// 条件：octet_stream / need_confirm / hidden 字段传入 object 值
    /// 断言：各字段为 Some（即 true），且 Object 内容可被还原
    #[test]
    fn deserialize_object_as_true_for_bool_directives() {
        let raw = json!({
            "x-wecom-octet-stream": {"future_opt": "val"},
            "x-wecom-confirm": {},
            "x-wecom-hidden": {"level": 1}
        });
        let d: JsonSchemaWecomDirectives = serde_json::from_value(raw).unwrap();
        assert!(d.octet_stream.is_some());
        assert!(d.need_confirm.is_some());
        assert!(d.hidden.is_some());
        // Object 往返：非空 object 原样还原，空 object 序列化为 true
        let val = serde_json::to_value(&d).unwrap();
        assert_json_eq!(val["x-wecom-octet-stream"], json!({"future_opt": "val"}));
        assert_json_eq!(val["x-wecom-confirm"], json!(true));
        assert_json_eq!(val["x-wecom-hidden"], json!({"level": 1}));
    }

    /// P0：[JsonSchemaWecomDirectives] boolean directive 的 false 值解析为 None
    /// 条件：octet_stream / need_confirm / hidden 字段传入 false
    /// 断言：各字段为 None（与未传参一致）
    #[test]
    fn deserialize_false_is_none_for_bool_directives() {
        let raw = json!({
            "x-wecom-octet-stream": false,
            "x-wecom-confirm": false,
            "x-wecom-hidden": false
        });
        let d: JsonSchemaWecomDirectives = serde_json::from_value(raw).unwrap();
        assert!(d.octet_stream.is_none());
        assert!(d.need_confirm.is_none());
        assert!(d.hidden.is_none());
    }

    /// P1：[JsonSchemaWecomDirectives] 序列化往返后字段保持不变
    /// 条件：构建包含部分字段的 JsonSchemaWecomDirectives 实例并序列化
    /// 断言：序列化结果包含正确的字段值，None 值的字段不出现（skip_serializing_none）
    #[test]
    fn serialize_roundtrip_preserves_fields() {
        let d = JsonSchemaWecomDirectives {
            upload_media: Some(UploadMediaOptions {
                with_file_path: Some(true),
            }),
            octet_stream: Some(WecomBoolValue::default()),
            file_save: Some(FileSaveOptions {
                file_name: Some("f.txt".to_string()),
                content_encoding: None,
            }),
            need_confirm: None,
            hidden: None,
            value_delimiters: vec![],
        };
        let val = serde_json::to_value(&d).unwrap();
        assert_json_include!(
            actual: val,
            expected: json!({
                "x-wecom-file-upload": {"withFilePath": true},
                "x-wecom-octet-stream": true,
                "x-wecom-file-save": {"fileName": "f.txt"}
            })
        );
        // need_confirm 为 None 时不应出现（skip_serializing_none）
        assert!(val.get("x-wecom-confirm").is_none());
    }
}
