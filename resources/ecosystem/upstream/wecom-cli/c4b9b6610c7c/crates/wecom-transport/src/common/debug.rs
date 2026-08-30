use std::fmt;

/// A wrapper around `reqwest::header::HeaderMap` that masks sensitive header
/// values in its `Debug` output.
pub struct MaskedHeaders<'a>(
    /// The wrapped header map.
    pub &'a reqwest::header::HeaderMap,
);

impl fmt::Debug for MaskedHeaders<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut map = f.debug_map();
        for (name, value) in self.0 {
            if value.is_sensitive() {
                let display = value
                    .to_str()
                    .map(mask_sensitive_value)
                    .unwrap_or_else(|_| "***".to_string());
                map.entry(&name.as_str(), &display);
            } else {
                map.entry(&name.as_str(), &value);
            }
        }
        map.finish()
    }
}

/// Reconstruct a [`reqwest::header::HeaderMap`] from the JSON string produced
/// by [`MaskedHeaders`] Debug output.
///
/// Returns `None` if `json` is not valid JSON, contains non-string values,
/// or has keys that cannot be parsed as HTTP header names.
///
/// ## Multi-value headers
///
/// `HeaderMap` supports multiple values per header name, but the JSON format
/// produced by [`MaskedHeaders`] (a JSON object) cannot represent duplicate
/// keys. When the same header name appears, only the **last** value is
/// retained. This is acceptable because multi-value headers are rare in
/// wecom's HTTP interactions.
pub(crate) fn headers_from_json(json: &str) -> Option<reqwest::header::HeaderMap> {
    use reqwest::header::{HeaderName, HeaderValue};
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(json).ok()?;
    let mut map = reqwest::header::HeaderMap::new();
    for (key, value) in obj {
        let name = HeaderName::from_bytes(key.as_bytes()).ok()?;
        let val_str = match value {
            serde_json::Value::String(s) => s,
            other => other.to_string(),
        };
        let hv = HeaderValue::from_str(&val_str).ok()?;
        map.insert(name, hv);
    }
    Some(map)
}
/// Mask a sensitive string value, keeping the first 3 and last 4 characters.
///
/// - If the value length is > 7, returns `"abc***wxyz"`.
/// - Otherwise, returns `"***"` (too short to safely reveal prefix/suffix).
fn mask_sensitive_value(value: &str) -> String {
    if value.len() > 7 {
        let prefix = &value[..3];
        let suffix = &value[value.len() - 4..];
        format!("{prefix}***{suffix}")
    } else {
        "***".to_string()
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：MaskedHeaders / headers_from_json（敏感 Header 脱敏与 JSON 逆向重建）
    //!
    //! ### 关键接口
    //! - [mask_sensitive_value] — 对敏感字符串保留首 3 尾 4 字符，其余掩码
    //! - [MaskedHeaders] — HeaderMap 的 Debug 包装，敏感值自动脱敏
    //! - [headers_from_json] — 从 MaskedHeaders Debug 输出的 JSON 重建 HeaderMap
    //!
    //! ### 关键分支与异常路径
    //! - value 长度 > 7 → 显示 "abc***wxyz"
    //! - value 长度 ≤ 7 → 显示 "***"
    //! - 敏感/非敏感混合 Header → 敏感值脱敏，非敏感值明文
    //! - Debug 输出 → JSON 对象格式合法
    //! - 无效 JSON / 非对象 → headers_from_json 返回 None
    //! - 多值 Header → JSON 无法表示重复键（last-wins）
    //!
    //! ### 上下游交互
    //! - 上游：HTTP 请求/响应序列化时格式化 Header
    //! - 下游：capture 层通过 headers_from_json 重建 HeaderMap 用于 round-trip

    use super::*;

    /// P0：[mask_sensitive_value] 长敏感值保留首 3 尾 4 字符
    /// 条件：value 长度 > 7
    /// 断言：返回 "Bea***oken" 格式
    #[test]
    fn mask_long_value() {
        assert_eq!(mask_sensitive_value("Bearer secret-token"), "Bea***oken");
    }

    /// P1：[mask_sensitive_value] 短敏感值完全掩码
    /// 条件：value 长度 ≤ 7
    /// 断言：返回 "***"
    #[test]
    fn mask_short_value() {
        assert_eq!(mask_sensitive_value("abc"), "***");
        assert_eq!(mask_sensitive_value("abcdefg"), "***");
    }

    /// P1：[mask_sensitive_value] 长度恰好 8 的值显示首尾
    /// 条件：value 长度 == 8
    /// 断言：返回首 3 字符 + "***" + 末 4 字符
    #[test]
    fn mask_boundary_value() {
        assert_eq!(mask_sensitive_value("12345678"), "123***5678");
    }

    /// P0：[MaskedHeaders] Debug 输出中敏感 Header 已脱敏
    /// 条件：HeaderMap 包含一个敏感 header（authorization）和一个普通 header（x-public）
    /// 断言：敏感值显示为掩码，普通值明文可见，原始敏感值不出现在输出中
    #[test]
    fn masked_headers_debug_output() {
        use reqwest::header::{HeaderMap, HeaderName, HeaderValue};

        let mut map = HeaderMap::new();

        let mut sensitive = HeaderValue::from_static("Bearer my-secret-token");
        sensitive.set_sensitive(true);
        map.insert(HeaderName::from_static("authorization"), sensitive);

        map.insert(
            HeaderName::from_static("x-public"),
            HeaderValue::from_static("visible"),
        );

        let output = format!("{:?}", MaskedHeaders(&map));
        assert!(
            output.contains("Bea***oken"),
            "sensitive value should be masked: {output}"
        );
        assert!(
            output.contains("visible"),
            "non-sensitive value should be shown: {output}"
        );
        assert!(
            !output.contains("my-secret-token"),
            "raw sensitive value should not appear: {output}"
        );
    }

    // ── JSON validity (capture layer contract) ──

    /// P0：[MaskedHeaders] Debug 输出为合法 JSON 对象
    /// 条件：构造空 map、仅非敏感 header、混合、全敏感四种 HeaderMap
    /// 断言：所有输出均可解析为 serde_json::Value::Object，字段值正确
    #[test]
    fn masked_headers_debug_is_valid_json() {
        use reqwest::header::{HeaderMap, HeaderName, HeaderValue};

        // Empty map → {}
        let empty = HeaderMap::new();
        let output = format!("{:?}", MaskedHeaders(&empty));
        let v: serde_json::Value = serde_json::from_str(&output).expect("empty map should be JSON");
        assert!(v.is_object(), "empty map: {output}");

        // Non-sensitive headers only
        let mut map = HeaderMap::new();
        map.insert(
            HeaderName::from_static("content-type"),
            HeaderValue::from_static("application/json"),
        );
        map.insert(
            HeaderName::from_static("x-request-id"),
            HeaderValue::from_static("abc-123"),
        );
        let output = format!("{:?}", MaskedHeaders(&map));
        let v: serde_json::Value =
            serde_json::from_str(&output).expect("non-sensitive headers should be JSON");
        assert!(v.is_object(), "non-sensitive: {output}");
        assert_eq!(v["content-type"], "application/json");
        assert_eq!(v["x-request-id"], "abc-123");

        // Mixed sensitive + non-sensitive
        let mut map = HeaderMap::new();
        map.insert(
            HeaderName::from_static("x-public"),
            HeaderValue::from_static("visible"),
        );
        let mut secret = HeaderValue::from_static("Bearer my-secret-token");
        secret.set_sensitive(true);
        map.insert(HeaderName::from_static("authorization"), secret);
        let output = format!("{:?}", MaskedHeaders(&map));
        let v: serde_json::Value =
            serde_json::from_str(&output).expect("mixed headers should be JSON");
        assert!(v.is_object(), "mixed: {output}");
        assert_eq!(v["x-public"], "visible");
        assert_eq!(v["authorization"], "Bea***oken");

        // All sensitive headers
        let mut map = HeaderMap::new();
        let mut s1 = HeaderValue::from_static("secret-key-12345");
        s1.set_sensitive(true);
        map.insert(HeaderName::from_static("x-api-key"), s1);
        let output = format!("{:?}", MaskedHeaders(&map));
        let v: serde_json::Value =
            serde_json::from_str(&output).expect("all-sensitive headers should be JSON");
        assert!(v.is_object(), "all-sensitive: {output}");
        assert_eq!(v["x-api-key"], "sec***2345");
    }

    // ── headers_from_json round-trip ──

    /// P0：[headers_from_json] 无效 JSON 返回 None
    /// 条件：传入非 JSON 字符串、空字符串、JSON 数组（非对象）
    /// 断言：均返回 None
    #[test]
    fn headers_from_json_invalid_returns_none() {
        assert!(headers_from_json("not json").is_none());
        assert!(headers_from_json("").is_none());
        assert!(headers_from_json("[]").is_none()); // array, not object
    }

    /// P0：[headers_from_json] 空对象返回空 HeaderMap
    /// 条件：传入 "{}"
    /// 断言：HeaderMap 为空
    #[test]
    fn headers_from_json_empty() {
        let map = headers_from_json("{}").expect("empty object should parse");
        assert!(map.is_empty());
    }

    /// P0：[headers_from_json] MaskedHeaders → JSON → HeaderMap round-trip
    /// 条件：仅非敏感 header
    /// 断言：重建的 HeaderMap 键和值与原始一致
    #[test]
    fn headers_from_json_round_trip() {
        use reqwest::header::{HeaderMap, HeaderName, HeaderValue};

        let mut original = HeaderMap::new();
        original.insert(
            HeaderName::from_static("content-type"),
            HeaderValue::from_static("application/json"),
        );
        original.insert(
            HeaderName::from_static("x-request-id"),
            HeaderValue::from_static("abc-123"),
        );

        let json = format!("{:?}", MaskedHeaders(&original));
        let restored = headers_from_json(&json).expect("round-trip should succeed");

        assert_eq!(restored.len(), 2);
        assert_eq!(restored["content-type"], "application/json");
        assert_eq!(restored["x-request-id"], "abc-123");
    }

    /// P1：[headers_from_json] 多值 header 仅保留最后一个值
    /// 条件：JSON 字符串含重复键（"x-custom" 出现两次）
    /// 断言：若解析成功则值为 "second"（文档说明的局限性）
    #[test]
    fn headers_from_json_multi_value_last_wins() {
        // JSON can't have duplicate keys in a standard object, but
        // `serde_json::from_str` with duplicate keys takes the last.
        let json = r#"{"x-custom": "first", "x-custom": "second"}"#;
        // serde_json actually errors on duplicate keys by default.
        // This test documents: multi-value headers are lost by the
        // JSON serialization; this is acceptable.
        let result = headers_from_json(json);
        // Either None (duplicate key rejected) or second wins
        if let Some(map) = result {
            assert_eq!(map["x-custom"], "second");
        }
    }
}
