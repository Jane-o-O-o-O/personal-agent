use rand::RngExt;

/// 将 lib 层错误转换为 transport 层错误：`Wrapped` 负载优先经 `into_any`
/// 向下转型恢复为具体的 `wecom_transport::Error`（拆包保留变体语义，polling
/// 的 `Error::Network` 重试等结构分派点因而继续有效）；无法恢复的负载
/// （以及本层其余变体）装箱为 `Error::Wrapped` 透传。
///
/// `Wrapped`（而非 `Other`）保留负载的完整能力集：错误回流 `crate::Error`
/// 时无需 downcast，`code` / `type` / `message` 沿链逐级委托，用户可见
/// 元信息不丢失。
pub(crate) fn to_transport_error(e: crate::Error) -> wecom_transport::Error {
    match e {
        crate::Error::Wrapped(w) => wecom_error::downcast_or(w, wecom_transport::Error::Wrapped),
        other => wecom_transport::Error::Wrapped(Box::new(other)),
    }
}

/// Generate a random alphanumeric string of the given length.
pub(crate) fn random_str(len: usize) -> String {
    rand::rng()
        .sample_iter(rand::distr::Alphanumeric)
        .take(len)
        .map(|b| b as char)
        .collect()
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：util（通用工具函数）
    //!
    //! ### 关键接口
    //! - [random_str] — Generate a random alphanumeric string of the given length
    //! - [to_transport_error] — lib 层错误 → transport 层错误（Wrapped 负载 downcast 拆包，其余装箱 Wrapped）
    //!
    //! ### 关键分支与异常路径
    //! - len = 0 → empty string
    //! - len > 0 → string of exact length, all chars alphanumeric
    //! - Two calls → distinct strings (probabilistic)
    //! - to_transport_error：Wrapped 负载为具体 transport 错误 → downcast 拆包还原；
    //!   其余 → 装箱为 transport::Wrapped（回流 crate::Error 时经 Wrapped 链逐级委托
    //!   还原能力，见 error.rs 测试）
    //!
    //! ### 上下游交互
    //! - 上游：client::builder (generate_random_id), directive::file_save (random_file_name), fs (collision suffix)；
    //!   service::execute / builtins::upload_media / directive::octet_stream (to_transport_error)
    //! - 下游：rand crate；wecom_transport::Error

    use wecom_error::WecomError;

    use super::*;

    /// P0：[to_transport_error] Wrapped 负载为具体 transport 错误时 downcast 拆包还原
    /// 条件：输入 Error::Wrapped(box(Http 404))
    /// 断言：返回 wecom_transport::Error::Http（原变体保留，不嵌套）
    #[test]
    fn to_transport_error_unwraps_transport_variant() {
        let e = crate::Error::Wrapped(Box::new(wecom_transport::Error::Http {
            message: "not found".into(),
            endpoint: "https://example.com/api".into(),
            status: 404,
        }));
        let t = to_transport_error(e);
        assert!(
            matches!(t, wecom_transport::Error::Http { status: 404, .. }),
            "expected Http 404, got: {t:?}"
        );
    }

    /// P0：[to_transport_error] 非 transport 负载的 Wrapped 原样透传
    /// 条件：输入 Error::Wrapped(box(wecom_fs::Error::validation(..)))
    /// 断言：返回 transport::Wrapped，能力沿链委托可达
    #[test]
    fn to_transport_error_passes_through_foreign_wrapped() {
        let e = crate::Error::Wrapped(Box::new(wecom_fs::Error::validation("bad path")));
        let t = to_transport_error(e);
        // Wrapped 变体沿链委托负载能力，直接对 transport 错误断言即可，
        // 无需 let-else 解构（其 panic 分支结构性不可覆盖）。
        assert!(
            matches!(t, wecom_transport::Error::Wrapped(_)),
            "expected Wrapped, got: {t:?}"
        );
        assert_eq!(t.code(), crate::E_VALIDATION);
        assert_eq!(t.error_type(), "ValidationError");
        assert_eq!(t.message(), "bad path");
    }

    /// P0：[to_transport_error] 本层非 Wrapped 变体装箱为 Wrapped（保留能力，无需 downcast）
    /// 条件：输入 Error::Validation
    /// 断言：返回 wecom_transport::Error::Wrapped，内层 code / error_type 直接委托可达
    #[test]
    fn to_transport_error_wraps_non_transport_variant() {
        let t = to_transport_error(crate::Error::validation("field required"));
        assert!(
            matches!(t, wecom_transport::Error::Wrapped(_)),
            "expected Wrapped, got: {t:?}"
        );
        // 负载实现 WecomError：code/error_type 逐级委托，无需 downcast。
        assert_eq!(t.code(), crate::E_VALIDATION);
        assert_eq!(t.error_type(), "ValidationError");
        assert_eq!(t.message(), "field required");
    }

    /// P0：[random_str] returns a string of the exact requested length
    /// 条件：len = 6
    /// 断言：returned string length == 6
    #[test]
    fn random_str_exact_length() {
        let s = random_str(6);
        assert_eq!(s.len(), 6);
    }

    /// P0：[random_str] returns only alphanumeric characters
    /// 条件：len = 100 (large sample to increase confidence)
    /// 断言：every character is ASCII alphanumeric
    #[test]
    fn random_str_all_alphanumeric() {
        let s = random_str(100);
        assert!(
            s.chars().all(|c| c.is_ascii_alphanumeric()),
            "expected all alphanumeric, got: {s}"
        );
    }

    /// P1：[random_str] returns empty string when len is 0
    /// 条件：len = 0
    /// 断言：returned string is empty
    #[test]
    fn random_str_zero_length() {
        let s = random_str(0);
        assert!(s.is_empty());
    }

    /// P1：[random_str] produces distinct strings on successive calls
    /// 条件：two calls with len = 32
    /// 断言：the two strings differ (collision probability ≈ 0 for 32 alphanumeric chars)
    #[test]
    fn random_str_uniqueness() {
        let a = random_str(32);
        let b = random_str(32);
        assert_ne!(a, b, "two random strings of length 32 should differ");
    }

    /// P1：[random_str] works for various lengths used in the codebase
    /// 条件：len ∈ {6, 8, 32} (client id suffix, fs collision suffix, file name)
    /// 断言：each returned string has the correct length and is alphanumeric
    #[test]
    fn random_str_codebase_lengths() {
        for &len in &[6, 8, 32] {
            let s = random_str(len);
            assert_eq!(s.len(), len, "length mismatch for len={len}");
            assert!(
                s.chars().all(|c| c.is_ascii_alphanumeric()),
                "non-alphanumeric char in random_str({len}): {s}"
            );
        }
    }
}
