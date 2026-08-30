use std::collections::HashSet;

use super::types::{Helper, HelperMeta};

/// Registry of [`Helper`] implementations.
///
/// Each helper is looked up by its full command path (e.g.
/// `["service", "resource", "action"]`). The registry is owned by the
/// [`Client`](crate::Client) and populated once at build time.
pub struct HelperRegistry {
    entries: Vec<Box<dyn Helper>>,
}

impl HelperRegistry {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
        }
    }

    /// Register an additional helper into the registry.
    ///
    /// 内置 helper 之外的产品层 helper 由调用方（如 CLI 二进制）通过
    /// [`ClientBuilder::helper`](crate::ClientBuilder::helper) 注册，
    /// 最终经本方法进入注册表。
    pub fn register(&mut self, helper: Box<dyn Helper>) {
        self.entries.push(helper);
    }

    /// Look up a helper by its full command path
    /// (e.g. `&["service", "resource", "+action"]`).
    ///
    /// A helper occupies the command-tree position `path() ++ [name]`: its
    /// [`path`](Helper::path) locates the *group node* it lives under, and its
    /// [`name`](HelperMeta::name) is the leaf command name. The lookup therefore
    /// matches when `path()` equals all but the last segment **and** the helper
    /// name equals the last segment.
    pub fn get_helper(&self, path: &[&str]) -> Option<&dyn Helper> {
        let (&name, parent) = path.split_last()?;
        self.entries
            .iter()
            .find(|h| h.about().name == name && h.path() == parent)
            .map(|h| h.as_ref())
    }

    /// Return all helpers whose path matches `prefix` exactly (direct hits)
    /// plus the set of next-level child segment names (for building group sub-commands).
    pub fn get_helpers_in(&self, prefix: &[&str]) -> (Vec<HelperMeta>, HashSet<&'static str>) {
        let mut direct = vec![];
        let mut children = HashSet::new();
        for h in &self.entries {
            let p = h.path();
            if p == prefix {
                direct.push(h.about());
                continue;
            }
            if p.starts_with(prefix) && p.len() > prefix.len() {
                children.insert(p[prefix.len()]);
            }
        }
        (direct, children)
    }
}

impl Default for HelperRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：HelperRegistry（Helper 注册表，按命令路径查找注册的 helper）
    //!
    //! ### 关键接口
    //! - [HelperRegistry::get_helper] — 按完整命令路径查找 helper
    //! - [HelperRegistry::get_helpers_in] — 获取指定 prefix 下的 helper 及其子段
    //!
    //! ### 关键分支与异常路径
    //! - 空注册表 → get_helper 返回 None，get_helpers_in 返回空集
    //! - 相同 group 不同 name → get_helper 正确区分
    //! - 不匹配路径 → 返回 None
    //! - prefix 精确匹配 → direct hit
    //! - prefix 为父级 → children 集合包含下一级段名
    //!
    //! ### 上下游交互
    //! - 上游：Client 构建时填充注册表
    //! - 下游：通过 Helper trait 的 execute() 执行实际的 helper 逻辑

    use serde_json::Value;

    use super::*;
    use crate::Result;
    use crate::helpers::types::{Helper, HelperMeta};

    struct TestHelper {
        path_vec: Vec<&'static str>,
        name: &'static str,
    }

    impl Helper for TestHelper {
        fn path(&self) -> Vec<&'static str> {
            self.path_vec.clone()
        }
        fn about(&self) -> HelperMeta {
            HelperMeta::new(self.name, "A test helper")
        }
        fn execute<'a>(
            &'a self,
            _run: &'a crate::client::CliRun<'a>,
            _params: Value,
        ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<()>> + Send + 'a>> {
            Box::pin(async { Ok(()) })
        }
    }

    /// P1：[HelperRegistry::get_helper] 空注册表 get_helper 查询任意路径均返回 None
    /// 条件：新建空 HelperRegistry
    /// 断言：get_helper(&["svc", "method"]) 返回 None
    #[test]
    fn empty_registry_get_helper_returns_none() {
        let reg = HelperRegistry::new();
        assert!(reg.get_helper(&["svc", "method"]).is_none());
    }

    /// P1：[HelperRegistry::get_helpers_in] 默认注册表（无内置 helper）在空前缀下返回空
    /// 条件：新建默认 HelperRegistry
    /// 断言：顶层无 direct hit，children 为空
    #[test]
    fn default_registry_get_helpers_in_returns_empty() {
        let reg = HelperRegistry::new();
        let (direct, children) = reg.get_helpers_in(&[]);
        assert!(direct.is_empty());
        assert!(children.is_empty());
    }

    // ========== 有 helper 条目的注册表行为 ==========

    /// P1：[HelperRegistry::get_helper] 注册表通过完整命令路径查找 helper 成功
    /// 条件：注册 path=["svc","resource"]、name="action" 的 helper（命令路径为 svc resource action）
    /// 断言：get_helper(["svc","resource","action"]) 返回该 helper 且 name 匹配
    #[test]
    fn registry_get_helper_finds_by_command_path() {
        let mut reg = HelperRegistry::new();
        reg.register(Box::new(TestHelper {
            path_vec: vec!["svc", "resource"],
            name: "action",
        }));

        let found = reg.get_helper(&["svc", "resource", "action"]);
        assert!(found.is_some());
        assert_eq!(found.unwrap().about().name, "action");
    }

    /// P1：[HelperRegistry::get_helper] 同一 group 下按 name 区分不同 helper
    /// 条件：注册 path=["media"] 的两个 helper，name 分别为 "+download"/"+upload"
    /// 断言：按完整命令路径分别命中对应 helper
    #[test]
    fn registry_get_helper_distinguishes_by_name() {
        let mut reg = HelperRegistry::new();
        reg.register(Box::new(TestHelper {
            path_vec: vec!["media"],
            name: "+download",
        }));
        reg.register(Box::new(TestHelper {
            path_vec: vec!["media"],
            name: "+upload",
        }));

        assert_eq!(
            reg.get_helper(&["media", "+download"])
                .unwrap()
                .about()
                .name,
            "+download"
        );
        assert_eq!(
            reg.get_helper(&["media", "+upload"]).unwrap().about().name,
            "+upload"
        );
    }

    /// P1：[HelperRegistry::get_helper] 注册表对不匹配的路径返回 None
    /// 条件：注册 path=["svc","resource"]、name="action" 的 helper
    /// 断言：查询不同路径、缺少 name 的 group 路径或空路径均返回 None
    #[test]
    fn registry_get_helper_returns_none_for_wrong_path() {
        let mut reg = HelperRegistry::new();
        reg.register(Box::new(TestHelper {
            path_vec: vec!["svc", "resource"],
            name: "action",
        }));

        assert!(reg.get_helper(&["svc", "resource", "other"]).is_none());
        assert!(reg.get_helper(&["svc", "resource"]).is_none());
        assert!(reg.get_helper(&[]).is_none());
    }

    /// P1：[HelperRegistry::get_helpers_in] 对精确匹配 prefix 的 helper 返回 direct hit
    /// 条件：注册 path=["svc","action"] 的 helper，prefix 相同
    /// 断言：direct 包含该 helper，children 为空
    #[test]
    fn registry_get_helpers_in_returns_direct_hits() {
        let mut reg = HelperRegistry::new();
        // path 完全等于 prefix 时是 direct hit
        reg.register(Box::new(TestHelper {
            path_vec: vec!["svc", "action"],
            name: "direct_hit",
        }));

        let (direct, children) = reg.get_helpers_in(&["svc", "action"]);
        assert_eq!(direct.len(), 1);
        assert_eq!(direct[0].name, "direct_hit");
        assert!(children.is_empty());
    }

    /// P1：[HelperRegistry::get_helpers_in] 正确返回下一级子段名称集合
    /// 条件：注册三个不同 path 的 helper，前缀为 ["svc"]
    /// 断言：direct 为空，children 含 "users" 和 "config"
    #[test]
    fn registry_get_helpers_in_returns_child_segments() {
        let mut reg = HelperRegistry::new();
        reg.register(Box::new(TestHelper {
            path_vec: vec!["svc", "users", "list"],
            name: "list_users",
        }));
        reg.register(Box::new(TestHelper {
            path_vec: vec!["svc", "users", "get"],
            name: "get_user",
        }));
        reg.register(Box::new(TestHelper {
            path_vec: vec!["svc", "config"],
            name: "config",
        }));

        // prefix=["svc"] → 没有 direct hit (没有 path 恰好等于 ["svc"])
        // children: "users" 和 "config" 是下一级段名
        let (direct, children) = reg.get_helpers_in(&["svc"]);
        assert!(direct.is_empty());
        assert!(children.contains("users"));
        assert!(children.contains("config"));
        assert_eq!(children.len(), 2);
    }

    /// P2：[HelperRegistry::get_helpers_in] get_helpers_in 使用空前缀时返回顶级子段
    /// 条件：注册 path=["svc","action"] 的 helper，prefix=[]
    /// 断言：direct 为空，children 包含 "svc"
    #[test]
    fn registry_get_helpers_in_with_empty_prefix() {
        let mut reg = HelperRegistry::new();
        reg.register(Box::new(TestHelper {
            path_vec: vec!["svc", "action"],
            name: "nested",
        }));

        let (direct, children) = reg.get_helpers_in(&[]);
        assert!(direct.is_empty());
        // "svc" should be a child segment
        assert!(children.contains("svc"));
    }
}
