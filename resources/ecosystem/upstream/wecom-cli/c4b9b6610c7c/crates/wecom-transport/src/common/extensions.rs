//! Type-indexed per-request extension bag — arbitrary caller-defined config
//! threaded from Transport defaults and request builders down to
//! TransportBackend::execute.
//!
//! # 约定（CONVENTIONS）
//!
//! - **敏感值**：`Extensions` 的 `Debug` 会逐值输出 `Debug`。敏感配置
//!   （token、密钥）的值类型必须自行实现脱敏 `Debug`（如输出
//!   `"<redacted>"`），思路对齐 [`MaskedHeaders`](crate::MaskedHeaders)。
//! - **不可序列化**：袋内值可含回调 / 句柄，`Extensions` 整体不可序列化；
//!   不要把 `Extensions` 放进任何 serde 结构。
//! - **同型多值**：同一 `TypeId` 后写覆盖先写。需要「同型多值」时以
//!   `Vec<T>` / map newtype 为值类型。

use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::fmt::Debug;
use std::sync::Arc;

/// A value storable in [`Extensions`]. Blanket-implemented — no manual impl.
///
/// Any `'static` type that is `Debug + Send + Sync` qualifies; `Clone` is
/// **not** required (the bag shares entries via `Arc`).
pub trait Extension: Any + Debug + Send + Sync + 'static {
    /// Return the value as `&dyn Any` for typed downcasts.
    fn as_any(&self) -> &dyn Any;
}

impl<T: Any + Debug + Send + Sync + 'static> Extension for T {
    fn as_any(&self) -> &dyn Any {
        self
    }
}

/// Type-indexed bag of arbitrary request-scoped configuration.
///
/// Cheap to clone (Arc-shared entries). Merge semantics: per-TypeId override
/// (later layer wins). One value per type — to stack multiple values of the
/// "same kind", store a `Vec<T>` / map newtype as the value.
///
/// # Example
///
/// ```rust
/// #[derive(Debug)]
/// pub struct RetryConfig { pub max_retries: u32 }
///
/// let mut ext = wecom_transport::Extensions::new();
/// ext.insert(RetryConfig { max_retries: 3 });
/// assert_eq!(ext.get::<RetryConfig>().unwrap().max_retries, 3);
/// ```
#[derive(Clone, Default)]
pub struct Extensions {
    map: HashMap<TypeId, Arc<dyn Extension>>,
}

impl Extensions {
    /// Create an empty bag.
    pub fn new() -> Self {
        Self::default()
    }

    /// True when the bag holds no entries.
    pub fn is_empty(&self) -> bool {
        self.map.is_empty()
    }

    /// Number of entries in the bag.
    pub fn len(&self) -> usize {
        self.map.len()
    }

    /// Insert (or replace) a value keyed by its concrete type.
    ///
    /// Same-type re-insert overrides the previous value (last wins) and
    /// returns the previously stored value, if any.
    pub fn insert<T>(&mut self, value: T) -> Option<Arc<dyn Extension>>
    where
        T: Any + Debug + Send + Sync + 'static,
    {
        self.map.insert(TypeId::of::<T>(), Arc::new(value))
    }

    /// Builder-style insert. Same-type re-insert overrides (last wins).
    #[must_use]
    pub fn with<T>(mut self, value: T) -> Self
    where
        T: Any + Debug + Send + Sync + 'static,
    {
        self.insert(value);
        self
    }

    /// Typed read. Custom transports call this in `execute`.
    ///
    /// Returns `None` when no value of the given concrete type is present.
    pub fn get<T>(&self) -> Option<&T>
    where
        T: Any + Send + Sync + 'static,
    {
        self.map
            .get(&TypeId::of::<T>())
            .and_then(|arc| arc.as_ref().as_any().downcast_ref::<T>())
    }

    /// Whether a value of the given concrete type is present.
    pub fn contains<T>(&self) -> bool
    where
        T: Any + Send + Sync + 'static,
    {
        self.map.contains_key(&TypeId::of::<T>())
    }

    /// Remove and return the value of the given concrete type, if any.
    pub fn remove<T>(&mut self) -> Option<Arc<dyn Extension>>
    where
        T: Any + Send + Sync + 'static,
    {
        self.map.remove(&TypeId::of::<T>())
    }

    /// Merge `other` into `self`; per-TypeId, `other` wins.
    ///
    /// This is the「叠加」语义：逐层调用即逐层覆盖。Entries are shared via
    /// `Arc` — no deep copy.
    pub fn extend(&mut self, other: &Extensions) {
        for (k, v) in &other.map {
            self.map.insert(*k, Arc::clone(v));
        }
    }
}

impl Debug for Extensions {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_set().entries(self.map.values()).finish()
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：Extensions（TypeId 索引能力袋）
    //!
    //! ### 关键接口
    //! - [Extensions::insert] / [Extensions::get] — 按具体类型插入 / 读取
    //! - [Extensions::with] — builder 风格插入
    //! - [Extensions::extend] — 合并语义（other 覆盖同型）
    //! - [Extensions::remove] / [Extensions::contains] — 删除 / 判断存在
    //!
    //! ### 关键分支与异常路径
    //! - 同 TypeId 后写覆盖先写
    //! - 空袋 is_empty / len == 0
    //! - Clone 后袋内值 Arc 共享
    //! - 非 Clone 值类型（仅 Debug + Send + Sync）可存入读取
    //!
    //! ### 上下游交互
    //! - 上游：TransportBuilder / Transport 默认袋与 wecom crate 的 CliRun /
    //!   请求 builder 通过 `extension()` / `extensions()` 注入
    //! - 下游：自定义 TransportBackend 在 `execute` 中
    //!   `options.extensions.get::<T>()` 读取

    use super::*;

    /// P0：[Extensions::insert] / [Extensions::get] 同型值往返可读
    /// 条件：插入 `#[derive(Debug)] struct MockVal(u32)` 后按同类型读取
    /// 断言：get 返回的引用值正确（字段为 42）
    #[test]
    fn insert_then_get_roundtrip() {
        let mut ext = Extensions::new();
        ext.insert(MockVal(42));
        assert_eq!(ext.get::<MockVal>().unwrap().0, 42);
    }

    /// P0：[Extensions::insert] 同 TypeId 后写覆盖先写
    /// 条件：连续插入两个 MockVal（值 1 与 2），再按同类型读取
    /// 断言：get 返回值为后插入的 2
    #[test]
    fn insert_same_type_overrides() {
        let mut ext = Extensions::new();
        ext.insert(MockVal(1));
        ext.insert(MockVal(2));
        assert_eq!(ext.get::<MockVal>().unwrap().0, 2);
    }

    /// P0：[Extensions::default] 空袋 is_empty 且 len == 0
    /// 条件：调用 [Extensions::default]
    /// 断言：is_empty() 为 true，len() == 0
    #[test]
    fn default_is_empty() {
        let ext = Extensions::default();
        assert!(ext.is_empty());
        assert_eq!(ext.len(), 0);
    }

    /// P1：[Extensions::extend] other 覆盖同型、保留异型
    /// 条件：self 含 MockVal(1) 与 MockStr("self")，other 含 MockVal(2) 与
    ///       MockNum(7)；执行 extend
    /// 断言：MockVal 为 2（被覆盖）、MockStr 仍在、MockNum 为 7
    #[test]
    fn extend_merges_and_overrides() {
        let mut self_ext = Extensions::new();
        self_ext.insert(MockVal(1));
        self_ext.insert(MockStr("self".to_string()));

        let mut other = Extensions::new();
        other.insert(MockVal(2));
        other.insert(MockNum(7));

        self_ext.extend(&other);
        assert_eq!(self_ext.get::<MockVal>().unwrap().0, 2);
        assert_eq!(self_ext.get::<MockStr>().unwrap().0, "self");
        assert_eq!(self_ext.get::<MockNum>().unwrap().0, 7);
        assert_eq!(self_ext.len(), 3);
    }

    /// P1：[Extensions::clone] 克隆后袋内值 Arc 共享
    /// 条件：以 `Arc<String>` 为值插入并克隆袋，分别从两袋
    ///       `get::<Arc<String>>()` 取引用
    /// 断言：两引用 Arc::ptr_eq 成立（未深拷贝）
    #[test]
    fn clone_shares_arcs() {
        let mut ext = Extensions::new();
        let shared = Arc::new("hello".to_string());
        ext.insert(Arc::clone(&shared));

        let cloned = ext.clone();
        assert!(Arc::ptr_eq(
            cloned.get::<Arc<String>>().unwrap(),
            ext.get::<Arc<String>>().unwrap()
        ));
    }

    /// P1：[Extensions::remove] 删除后 get / contains 均为空
    /// 条件：插入 MockVal(3) 后 remove::<MockVal>()
    /// 断言：remove 返回 Some，随后 contains::<MockVal>() 为 false、get 为 None
    #[test]
    fn remove_removes_entry() {
        let mut ext = Extensions::new();
        ext.insert(MockVal(3));
        assert!(ext.remove::<MockVal>().is_some());
        assert!(!ext.contains::<MockVal>());
        assert!(ext.get::<MockVal>().is_none());
        assert!(ext.is_empty());
    }

    /// P1：[Extensions::contains] 未插入的类型返回 false、已插入返回 true
    /// 条件：仅插入 MockVal，查询 MockVal 与 MockNum
    /// 断言：contains::<MockVal>() 为 true，contains::<MockNum>() 为 false
    #[test]
    fn contains_detects_type_presence() {
        let mut ext = Extensions::new();
        ext.insert(MockVal(1));
        assert!(ext.contains::<MockVal>());
        assert!(!ext.contains::<MockNum>());
    }

    /// P2：[Extensions::Debug] 输出包含 entry 的 Debug 值
    /// 条件：插入 MockStr("abc") 后格式化
    /// 断言：Debug 字符串包含 "abc"
    #[test]
    fn debug_includes_entry_values() {
        let mut ext = Extensions::new();
        ext.insert(MockStr("abc".to_string()));
        let dbg = format!("{ext:?}");
        assert!(dbg.contains("abc"), "got: {dbg}");
    }

    /// P2：[Extensions::insert] 非 Clone 值类型可存入并读取
    /// 条件：插入 `#[derive(Debug)] struct NonCloneVal(u32)`（无 Clone）
    /// 断言：get::<NonCloneVal>() 返回 Some 且值正确
    #[test]
    fn non_clone_value_is_supported() {
        let mut ext = Extensions::new();
        ext.insert(NonCloneVal(9));
        assert_eq!(ext.get::<NonCloneVal>().unwrap().0, 9);
    }

    // ── test fixtures ──

    #[derive(Debug)]
    struct MockVal(u32);
    #[derive(Debug)]
    struct MockStr(String);
    #[derive(Debug)]
    struct MockNum(u64);
    #[derive(Debug)]
    struct NonCloneVal(u32);
}
