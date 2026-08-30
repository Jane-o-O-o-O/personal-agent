//! `path_alias` 解析与映射的纯逻辑层。
//!
//! ## 模块定位
//!
//! `MethodSchema::path_alias` 在 schema 中以 **URL 路径** 形态声明（如
//! `/contact/search`），表示某个方法可以在 CLI 上以另一条命令路径调用，
//! 但**不显示在 help 中**。
//!
//! 本模块负责把这些 URL 形态的 alias 翻译成 CLI 命令路径，并提供：
//! - [`alias_path_to_segments`] — 解析单个 alias 字符串；
//! - [`collect_alias_entries`] — 递归 schema 收集所有 alias 映射；
//! - [`resolve_command_path`] — 把命令路径段尝试解析为真实 method 路径。
//!
//! 上层使用方：
//! - [`super::service_handle::ServiceHandle`]：暴露 `alias_entries` /
//!   `resolve_command_path` 的便捷方法；
//! - [`super::command`]：在构建 clap 命令树时为 alias 注入隐藏子命令；
//! - [`super::handler`]：在分发 method 调用前用 alias 重写命令路径。
//!
//! 所有命令路径段都是 **service-relative**——不含 service name 段。

use crate::registry::ServiceResource;

/// 一组 `(alias_command_path, real_command_path)`。
///
/// 两侧都是 service-relative 命令路径段；同一方法可以注册多个 alias，
/// 因此这里直接返回 `Vec` 而不是 map。
pub(crate) type AliasEntries = Vec<(Vec<String>, Vec<String>)>;

/// 把单个 `path_alias` 字符串（URL 形态，如 `/contact/search`）解析为
/// **service-relative** 命令路径段。
///
/// 规则：
/// - 去掉前导 / 尾随的 `/`；
/// - 按 `/` 切分；
/// - 跳过空段（连续斜杠）；
/// - 若第一段恰好是 service 名，则剥掉（典型情形：alias 与 `path` 同源、
///   都包含 service 名前缀）；
/// - 返回空 `Vec` 表示该 alias 不可用（如全空字符串、仅含 service 名）。
pub(crate) fn alias_path_to_segments(alias_path: &str, service_name: &str) -> Vec<String> {
    let mut segments: Vec<String> = alias_path
        .split('/')
        .filter(|s| !s.is_empty())
        .map(String::from)
        .collect();
    if segments.first().map(String::as_str) == Some(service_name) {
        segments.remove(0);
    }
    segments
}

/// 递归遍历 resource 树，为每个 method 上声明的 `path_alias` 产出
/// `(alias_command_path, real_command_path)` 二元组。
///
/// 两侧都是 **service-relative**（不含 service name 段）。
pub(crate) fn collect_alias_entries(service_name: &str, root: &ServiceResource) -> AliasEntries {
    let mut out = Vec::new();
    let mut stack: Vec<String> = Vec::new();
    walk(service_name, root, &mut stack, &mut out);
    out
}

fn walk(
    service_name: &str,
    resource: &ServiceResource,
    path_stack: &mut Vec<String>,
    out: &mut AliasEntries,
) {
    for (name, method) in &resource.methods {
        let Some(aliases) = method.path_alias.as_ref() else {
            continue;
        };
        let mut real = path_stack.clone();
        real.push(name.clone());
        for alias_path in aliases {
            let alias_segs = alias_path_to_segments(alias_path, service_name);
            if alias_segs.is_empty() {
                continue;
            }
            // 完全相同的别名直接忽略——映射到自身没有意义。
            if alias_segs == real {
                continue;
            }
            out.push((alias_segs, real.clone()));
        }
    }
    for (name, child) in &resource.resources {
        path_stack.push(name.clone());
        walk(service_name, child, path_stack, out);
        path_stack.pop();
    }
}

/// 在 `entries` 中按完整匹配查找 `path` 对应的真实命令路径。
///
/// 返回 `None` 表示 `path` 不是任何 alias，调用方应继续把 `path`
/// 当作真实命令路径处理。
pub(crate) fn resolve_command_path<'a>(
    entries: &'a AliasEntries,
    path: &[&str],
) -> Option<&'a [String]> {
    if path.is_empty() {
        return None;
    }
    entries
        .iter()
        .find(|(alias, _)| {
            alias.len() == path.len() && alias.iter().zip(path).all(|(a, p)| a == *p)
        })
        .map(|(_, real)| real.as_slice())
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：alias（path_alias 解析）
    //!
    //! ### 关键接口
    //! - [alias_path_to_segments] — URL 路径 → service-relative 命令路径段
    //! - [collect_alias_entries] — 遍历 schema 收集 (alias, real) 二元组
    //! - [resolve_command_path] — 根据 entries 把命令路径映射回真实路径
    //!
    //! ### 关键分支与异常路径
    //! - alias 为空 / 仅有斜杠 → 返回空段 vec，被上层过滤丢弃
    //! - alias 首段等于 service 名 → 剥掉首段
    //! - alias 段与真实路径相同 → 被忽略，避免无意义自环
    //! - resolve_command_path 入参为空 → None
    //!
    //! ### 上下游交互
    //! - 上游：[super::service_handle::ServiceHandle]、[super::command]、
    //!   [super::handler] 通过本模块完成所有 alias 相关运算
    //! - 下游：仅依赖 [crate::registry::ServiceResource]

    use indexmap::IndexMap;

    use super::*;
    use crate::registry::{MethodSchema, ServiceResource};

    fn make_method(path: &str, aliases: Option<Vec<&str>>) -> MethodSchema {
        MethodSchema {
            description: None,
            http_method: "GET".into(),
            path: path.into(),
            path_alias: aliases.map(|v| v.into_iter().map(String::from).collect()),
            request: None,
            response: None,
            ..Default::default()
        }
    }

    /// P0：[alias_path_to_segments] 标准用例（剥掉 service 名前缀）
    /// 条件：alias = "/contact/search"，service = "contact"
    /// 断言：返回 ["search"]
    #[test]
    fn parse_alias_strips_leading_service_segment() {
        assert_eq!(
            alias_path_to_segments("/contact/search", "contact"),
            vec!["search".to_string()]
        );
    }

    /// P0：[alias_path_to_segments] 多层 alias 解析
    /// 条件：alias = "/contact/v2/search"，service = "contact"
    /// 断言：返回 ["v2","search"]
    #[test]
    fn parse_alias_multi_segment() {
        assert_eq!(
            alias_path_to_segments("/contact/v2/search", "contact"),
            vec!["v2".to_string(), "search".to_string()]
        );
    }

    /// P1：[alias_path_to_segments] 首段不是 service 名时全量保留
    /// 条件：alias = "/foo/bar"，service = "contact"
    /// 断言：返回 ["foo","bar"]
    #[test]
    fn parse_alias_keeps_when_first_segment_not_service() {
        assert_eq!(
            alias_path_to_segments("/foo/bar", "contact"),
            vec!["foo".to_string(), "bar".to_string()]
        );
    }

    /// P1：[alias_path_to_segments] 连续/尾部斜杠被规整
    /// 条件：alias = "//contact//search/"
    /// 断言：返回 ["search"]
    #[test]
    fn parse_alias_collapses_extra_slashes() {
        assert_eq!(
            alias_path_to_segments("//contact//search/", "contact"),
            vec!["search".to_string()]
        );
    }

    /// P1：[alias_path_to_segments] 仅含 service 名 → 空 vec
    /// 条件：alias = "/contact"，service = "contact"
    /// 断言：返回空 vec
    #[test]
    fn parse_alias_only_service_name_returns_empty() {
        assert!(alias_path_to_segments("/contact", "contact").is_empty());
    }

    /// P1：[alias_path_to_segments] 空字符串 → 空 vec
    /// 条件：alias = ""
    /// 断言：返回空 vec
    #[test]
    fn parse_alias_empty_returns_empty() {
        assert!(alias_path_to_segments("", "contact").is_empty());
    }

    fn build_schema() -> ServiceResource {
        // 模拟 contact 服务：
        //   contact
        //   └── users
        //       └── search   (alias: /contact/search)
        let mut users_methods = IndexMap::new();
        users_methods.insert(
            "search".to_string(),
            make_method("/contact/users/search", Some(vec!["/contact/search"])),
        );
        let users = ServiceResource {
            methods: users_methods,
            resources: IndexMap::new(),
            ..Default::default()
        };
        let mut top_resources = IndexMap::new();
        top_resources.insert("users".to_string(), users);
        ServiceResource {
            methods: IndexMap::new(),
            resources: top_resources,
            ..Default::default()
        }
    }

    /// P0：[collect_alias_entries] 把嵌套 method 的 alias 正确映射到真实路径
    /// 条件：contact.users.search 上声明 alias /contact/search
    /// 断言：返回唯一一条 (["search"], ["users","search"])
    #[test]
    fn collect_entries_maps_alias_to_real_path() {
        let entries = collect_alias_entries("contact", &build_schema());
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].0, vec!["search".to_string()]);
        assert_eq!(
            entries[0].1,
            vec!["users".to_string(), "search".to_string()]
        );
    }

    /// P1：[collect_alias_entries] 自环 alias 被忽略
    /// 条件：method 真实路径 ["users","search"]，alias 也指向 /contact/users/search
    /// 断言：返回空
    #[test]
    fn collect_entries_skips_self_alias() {
        let mut users_methods = IndexMap::new();
        users_methods.insert(
            "search".to_string(),
            make_method("/contact/users/search", Some(vec!["/contact/users/search"])),
        );
        let users = ServiceResource {
            methods: users_methods,
            resources: IndexMap::new(),
            ..Default::default()
        };
        let mut top = IndexMap::new();
        top.insert("users".to_string(), users);
        let root = ServiceResource {
            methods: IndexMap::new(),
            resources: top,
            ..Default::default()
        };
        let entries = collect_alias_entries("contact", &root);
        assert!(entries.is_empty());
    }

    /// P1：[collect_alias_entries] 同一 method 多 alias 全部展开
    /// 条件：search 同时声明 /contact/search 和 /contact/find
    /// 断言：entries 含两条
    #[test]
    fn collect_entries_supports_multiple_aliases_per_method() {
        let mut users_methods = IndexMap::new();
        users_methods.insert(
            "search".to_string(),
            make_method(
                "/contact/users/search",
                Some(vec!["/contact/search", "/contact/find"]),
            ),
        );
        let users = ServiceResource {
            methods: users_methods,
            resources: IndexMap::new(),
            ..Default::default()
        };
        let mut top = IndexMap::new();
        top.insert("users".to_string(), users);
        let root = ServiceResource {
            methods: IndexMap::new(),
            resources: top,
            ..Default::default()
        };
        let entries = collect_alias_entries("contact", &root);
        assert_eq!(entries.len(), 2);
        assert!(
            entries
                .iter()
                .any(|(a, _)| a == &vec!["search".to_string()])
        );
        assert!(entries.iter().any(|(a, _)| a == &vec!["find".to_string()]));
    }

    /// P0：[resolve_command_path] 命中 alias 时返回真实路径
    /// 条件：entries = [(["search"], ["users","search"])]，path = ["search"]
    /// 断言：Some(["users","search"])（借用 entries 内部 slice，不发生克隆）
    #[test]
    fn resolve_returns_real_path_on_alias_hit() {
        let entries = collect_alias_entries("contact", &build_schema());
        let resolved = resolve_command_path(&entries, &["search"]);
        assert_eq!(
            resolved,
            Some(["users".to_string(), "search".to_string()].as_slice())
        );
    }

    /// P1：[resolve_command_path] 未命中时返回 None
    /// 条件：entries 中不含 ["other"]
    /// 断言：None
    #[test]
    fn resolve_returns_none_on_miss() {
        let entries = collect_alias_entries("contact", &build_schema());
        assert!(resolve_command_path(&entries, &["other"]).is_none());
    }

    /// P1：[resolve_command_path] 入参为空时返回 None
    /// 条件：path = &[]
    /// 断言：None
    #[test]
    fn resolve_empty_path_returns_none() {
        let entries = collect_alias_entries("contact", &build_schema());
        assert!(resolve_command_path(&entries, &[]).is_none());
    }
}
