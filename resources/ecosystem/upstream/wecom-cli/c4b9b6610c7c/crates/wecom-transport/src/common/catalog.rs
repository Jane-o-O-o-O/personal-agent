//! Generic override catalog for built-in endpoints.
//!
//! [`EndpointCatalog`] collects hard-coded endpoints (media transfer, service
//! discovery, long-task polling, …) into a single table that callers can
//! override per key or transform wholesale. Keys are domain-specific: each
//! downstream crate defines its own enum implementing [`CatalogKey`], which
//! supplies the full key set and the built-in default [`Endpoint`] per key.
//! Un-overridden keys fall back to [`CatalogKey::builtin_default`], keeping
//! default behavior identical to the previous hard-coded values.

use std::collections::HashMap;
use std::hash::Hash;

use super::Endpoint;

/// Key type of an [`EndpointCatalog`]: identifies the built-in endpoints of a
/// domain and provides their built-in defaults.
pub trait CatalogKey: Copy + Eq + Hash + 'static {
    /// All keys, in declaration order; traversed by
    /// [`EndpointCatalog::map_all`].
    const ALL: &'static [Self];

    /// Built-in default capability bag for this key.
    ///
    /// `base_url` is typically left unset — the
    /// transport fills in its defaults at execution time.
    fn builtin_default(self) -> Endpoint;
}

/// Centralized override catalog for built-in endpoints.
///
/// Stores only overrides; un-overridden keys resolve to
/// [`CatalogKey::builtin_default`].
#[derive(Clone)]
pub struct EndpointCatalog<K: CatalogKey> {
    overrides: HashMap<K, Endpoint>,
}

impl<K: CatalogKey> Default for EndpointCatalog<K> {
    fn default() -> Self {
        Self {
            overrides: HashMap::new(),
        }
    }
}

impl<K: CatalogKey> EndpointCatalog<K> {
    /// Capability bag for `key`: the override if present, else the built-in
    /// default.
    pub fn resolve(&self, key: K) -> Endpoint {
        self.overrides
            .get(&key)
            .cloned()
            .unwrap_or_else(|| key.builtin_default())
    }

    /// Replace the capability bag for one key (builder style).
    #[must_use]
    pub fn with(mut self, key: K, ep: Endpoint) -> Self {
        self.overrides.insert(key, ep);
        self
    }

    /// Transform one key: apply `f` to the current bag (override or built-in
    /// default) and write the result back into the override table.
    #[must_use]
    pub fn map(mut self, key: K, f: impl FnOnce(Endpoint) -> Endpoint) -> Self {
        let ep = self.resolve(key);
        self.overrides.insert(key, f(ep));
        self
    }

    /// Configure all keys at once: apply the same transform to every key in
    /// [`CatalogKey::ALL`].
    #[must_use]
    pub fn map_all(mut self, f: impl Fn(K, Endpoint) -> Endpoint) -> Self {
        for &key in K::ALL {
            let ep = self.resolve(key);
            self.overrides.insert(key, f(key, ep));
        }
        self
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：EndpointCatalog（泛型内置 endpoint 覆写目录）
    //!
    //! ### 关键接口
    //! - [EndpointCatalog::resolve] — 命中覆写或回退 [CatalogKey::builtin_default]
    //! - [EndpointCatalog::with] / [EndpointCatalog::map] — 逐 key 覆写 / 变换
    //! - [EndpointCatalog::map_all] — 遍历 [CatalogKey::ALL] 全量 key 一次性变换
    //!
    //! ### 关键分支与异常路径
    //! - 未覆写 → 回退内建默认（默认行为零变化）
    //! - map 在「覆写或默认」之上变换，未覆写 key 也会被写回覆写表
    //! - map_all 遍历 [CatalogKey::ALL] 全量 key
    //!
    //! ### 上下游交互
    //! - 上游：各下游 crate 的 key 枚举（wecom 的 EndpointKey）与 Client / 自定义后端
    //! - 下游：[Endpoint] 能力袋（[CatalogKey::builtin_default] 提供内建默认）

    use std::cell::RefCell;

    use super::*;
    use crate::http::{EndpointHttpExt, HttpEndpoint};

    /// Test key enum: two keys with distinct built-in paths.
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
    enum TestKey {
        Alpha,
        Beta,
    }

    impl CatalogKey for TestKey {
        const ALL: &'static [TestKey] = &[TestKey::Alpha, TestKey::Beta];

        fn builtin_default(self) -> Endpoint {
            match self {
                TestKey::Alpha => Endpoint::new().with(HttpEndpoint::new("/alpha")),
                TestKey::Beta => Endpoint::new().with(HttpEndpoint::new("/beta")),
            }
        }
    }

    /// P0：[EndpointCatalog::resolve] 未覆写时回退内建默认
    /// 条件：默认 catalog，resolve(Alpha)
    /// 断言：path == "/alpha"（来自 builtin_default），base_url 为空
    #[test]
    fn resolve_falls_back_to_builtin_default() {
        let catalog = EndpointCatalog::<TestKey>::default();
        let ep = catalog.resolve(TestKey::Alpha);
        assert_eq!(ep.path(), "/alpha");
        assert_eq!(ep.base_url(), "");
    }

    /// P0：[EndpointCatalog::resolve] 命中覆写时返回覆写值
    /// 条件：with(Alpha, 自定义 path) 后 resolve(Alpha)
    /// 断言：返回覆写的能力袋（path == "/custom/alpha"）
    #[test]
    fn resolve_prefers_override() {
        let catalog = EndpointCatalog::<TestKey>::default().with(
            TestKey::Alpha,
            Endpoint::new().with(HttpEndpoint::new("/custom/alpha")),
        );
        let ep = catalog.resolve(TestKey::Alpha);
        assert_eq!(ep.path(), "/custom/alpha");
    }

    /// P0：[EndpointCatalog::map] 在默认袋上变换（无需先覆写）
    /// 条件：默认 catalog，map(Alpha, with_path_derived("/alpha/v2"))
    /// 断言：resolve(Alpha).path == "/alpha/v2"，Beta 仍为内建默认
    #[test]
    fn map_transforms_default_bag() {
        let catalog = EndpointCatalog::<TestKey>::default().map(TestKey::Alpha, |ep| {
            ep.map::<HttpEndpoint>(|h| h.with_path_derived("/alpha/v2"))
        });
        assert_eq!(catalog.resolve(TestKey::Alpha).path(), "/alpha/v2");
        assert_eq!(catalog.resolve(TestKey::Beta).path(), "/beta");
    }

    /// P0：[EndpointCatalog::map_all] 遍历全量 key
    /// 条件：默认 catalog，map_all 统计 key 数并把全部 path 改成 "/all"
    /// 断言：遍历到 CatalogKey::ALL 全部 key；每个 key resolve 的 path 均为 "/all"
    #[test]
    fn map_all_iterates_all_keys() {
        // `map_all` 的闭包是 `Fn`（不可变捕获），用 RefCell 记录访问的 key。
        let seen = RefCell::new(Vec::new());
        let catalog = EndpointCatalog::<TestKey>::default().map_all(|key, ep| {
            seen.borrow_mut().push(key);
            ep.map::<HttpEndpoint>(|h| h.with_path_derived("/all"))
        });
        let seen = seen.into_inner();
        assert_eq!(seen.len(), TestKey::ALL.len());
        for &key in TestKey::ALL {
            assert!(seen.contains(&key), "map_all 未遍历到 {key:?}");
            assert_eq!(catalog.resolve(key).path(), "/all");
        }
    }

    /// P1：[EndpointCatalog::with] 单点覆写不影响其他 key
    /// 条件：with(Beta, 自定义) 后 resolve(Alpha) 与 resolve(Beta)
    /// 断言：仅 Beta 被覆写，Alpha 仍为内建默认
    #[test]
    fn with_overrides_single_key_only() {
        let catalog = EndpointCatalog::<TestKey>::default().with(
            TestKey::Beta,
            Endpoint::new().with(HttpEndpoint::new("/beta/v2")),
        );
        assert_eq!(catalog.resolve(TestKey::Beta).path(), "/beta/v2");
        assert_eq!(catalog.resolve(TestKey::Alpha).path(), "/alpha");
    }
}
