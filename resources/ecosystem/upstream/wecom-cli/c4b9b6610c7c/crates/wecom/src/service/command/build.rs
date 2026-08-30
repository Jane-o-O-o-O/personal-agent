use std::collections::HashSet;

use clap::{Args, Command};

use super::super::{alias, schema_util};
use super::arg_types::{HelperCmdArgs, MethodCmdArgs, ServiceCmdArgs};
use super::schema_clap::build_args_from_schema;
use crate::helpers::{HelperMeta, HelperRegistry};
use crate::registry::*;

pub fn build_service_cmd(
    helpers: &HelperRegistry,
    info: &ServiceInfo,
    schema: Option<&ServiceSchema>,
) -> Command {
    let mut cmd = ServiceCmdArgs::augment_args(Command::new(&info.name)).about(&info.description);

    if info.hidden {
        cmd = cmd.hide(true);
    }

    let mut path = vec![info.name.as_str()];
    let (helper_infos, helper_groups) = helpers.get_helpers_in(&[]);

    for meta in &helper_infos {
        cmd = cmd.subcommand(build_helper_cmd(meta));
    }

    if let Some(schema) = schema {
        if let Some(description) = &schema.description {
            cmd = cmd.long_about(description);
        }
        cmd = augment_resource_cmds(cmd, helpers, schema, &schema.resource_tree, &mut path);
        cmd = augment_alias_cmds(cmd, &info.name, schema);
    }

    augment_helper_groups(cmd, helpers, &helper_groups, &mut path)
}

/// 把 [`MethodSchema::path_alias`] 声明的命令路径**合并**进现有 service
/// 命令树。
///
/// 设计要点：
/// - 沿用现有命令树：alias 链上的每一段，若服务命令树里已有同名子命令则
///   reuse（继续 dive 进去），不重复构建；
/// - 只有 alias 链上**新增**的中间 group 与叶子方法命令才标记 `hide(true)`，
///   不影响真实命令树的可见性；
/// - 叶子段若与现有真实方法命令同名则跳过，避免覆盖；
/// - 中间段若与某个真实**方法命令**同名也跳过（方法命令不能再嵌套子命令）。
fn augment_alias_cmds(mut cmd: Command, service_name: &str, schema: &ServiceSchema) -> Command {
    for (alias_segs, real_segs) in alias::collect_alias_entries(service_name, &schema.resource_tree)
    {
        let Some(method) = lookup_method(&schema.resource_tree, &real_segs) else {
            continue;
        };
        cmd = merge_alias_chain(cmd, &alias_segs, schema, method);
    }
    cmd
}

/// 沿 `real_segs` 在 resource 树中找到目标 `MethodSchema`。
fn lookup_method<'a>(root: &'a ServiceResource, real_segs: &[String]) -> Option<&'a MethodSchema> {
    if real_segs.is_empty() {
        return None;
    }
    let mut node = root;
    for seg in &real_segs[..real_segs.len() - 1] {
        node = node.resources.get(seg)?;
    }
    node.methods.get(real_segs.last().unwrap())
}

/// 把单条 alias 链合并进 `parent`：
/// - 中间段：reuse 同名子命令；不存在则新建 hidden group。
/// - 叶子段：reuse 时跳过（不覆盖真实命令）；不存在则新建 hidden method 命令。
fn merge_alias_chain(
    parent: Command,
    alias_segs: &[String],
    schema: &ServiceSchema,
    method: &MethodSchema,
) -> Command {
    if alias_segs.is_empty() {
        return parent;
    }
    let head = alias_segs[0].as_str();
    let is_leaf = alias_segs.len() == 1;

    if parent.find_subcommand(head).is_some() {
        // reuse：找已有同名子命令，递归下探。
        if is_leaf {
            // 叶子冲突：保留现有命令，跳过整条 alias。
            return parent;
        }
        // mut_subcommand 闭包要求 'static，把 schema 与 method 克隆进闭包；
        // schema 数据量小（仅 service 级 metadata，IndexMap 浅克隆），构建期
        // 一次性开销可接受，换来零 unsafe。
        let tail: Vec<String> = alias_segs[1..].to_vec();
        let schema_owned = schema.clone();
        let method_owned = method.clone();
        parent.mut_subcommand(head, move |child| {
            merge_alias_chain(child, &tail, &schema_owned, &method_owned)
        })
    } else {
        // 不存在同名：新增子命令链，整条都隐藏。
        parent.subcommand(build_alias_subtree(alias_segs, schema, method))
    }
}

/// 递归生成 alias 链对应的 hidden 命令子树（仅在树里**没有**对应段时使用）。
fn build_alias_subtree(
    alias_segs: &[String],
    schema: &ServiceSchema,
    method: &MethodSchema,
) -> Command {
    debug_assert!(!alias_segs.is_empty());
    let head = &alias_segs[0];
    if alias_segs.len() == 1 {
        // 叶子：和正常的方法命令一致，附加 hide。
        return build_method_cmd(schema, head, method).hide(true);
    }
    // 中间段：隐藏的 group，要求继续提供子命令。
    let group = Command::new(head.clone())
        .hide(true)
        .subcommand_required(true)
        .arg_required_else_help(true);
    group.subcommand(build_alias_subtree(&alias_segs[1..], schema, method))
}

fn augment_resource_cmds<'a>(
    cmd: Command,
    helpers: &HelperRegistry,
    schema: &ServiceSchema,
    resource: &'a ServiceResource,
    path: &mut Vec<&'a str>,
) -> Command {
    let mut cmd = cmd;
    let (helper_infos, helper_groups) = helpers.get_helpers_in(path);

    for meta in &helper_infos {
        cmd = cmd.subcommand(build_helper_cmd(meta));
    }

    for (name, method) in resource.methods.iter() {
        cmd = cmd.subcommand(build_method_cmd(schema, name, method));
    }

    for (name, resource) in resource.resources.iter() {
        path.push(name.as_str());
        cmd = cmd.subcommand(build_sub_resource_cmd(
            helpers, schema, name, resource, path,
        ));
        path.pop();
    }

    augment_helper_groups(cmd, helpers, &helper_groups, path)
}

fn build_sub_resource_cmd<'a>(
    helpers: &HelperRegistry,
    schema: &ServiceSchema,
    name: &str,
    resource: &'a ServiceResource,
    path: &mut Vec<&'a str>,
) -> Command {
    let mut cmd = Command::new(name.to_string())
        .about(format!("管理 '{}' 资源", name))
        .subcommand_required(true)
        .arg_required_else_help(true);

    if resource.hidden {
        cmd = cmd.hide(true);
    }

    augment_resource_cmds(cmd, helpers, schema, resource, path)
}

fn augment_helper_groups(
    mut cmd: Command,
    helpers: &HelperRegistry,
    helper_groups: &HashSet<&'static str>,
    path: &mut Vec<&str>,
) -> Command {
    for &name in helper_groups {
        if cmd.find_subcommand(name).is_some() {
            continue;
        }
        path.push(name);

        let mut group_cmd = Command::new(name).hide(true);
        let (helper_infos, helper_groups) = helpers.get_helpers_in(path);

        for meta in &helper_infos {
            group_cmd = group_cmd.subcommand(build_helper_cmd(meta));
        }

        cmd = cmd.subcommand(augment_helper_groups(
            group_cmd,
            helpers,
            &helper_groups,
            path,
        ));

        path.pop();
    }

    cmd
}

fn build_method_cmd(schema: &ServiceSchema, name: &str, method: &MethodSchema) -> Command {
    let mut cmd = Command::new(name.to_string())
        .about(method.description.clone().unwrap_or_default())
        .disable_help_flag(true);
    if let Some(request_schema) = schema_util::resolve_schema_ref(&schema.schemas, &method.request)
        && let Some(args) = build_args_from_schema(&request_schema)
    {
        for arg in args {
            cmd = cmd.arg(arg);
        }
    }
    let mut cmd = MethodCmdArgs::augment_args(cmd);
    if method.hidden {
        cmd = cmd.hide(true);
    }
    cmd
}

/// Build a `clap::Command` from a helper's metadata and JSON Schema.
///
/// Mirrors [`build_method_cmd`]: parameters come from the request schema and
/// every helper also gets `--json` / `--schema` / `--doc` / `--help` flags.
fn build_helper_cmd(meta: &HelperMeta) -> Command {
    let mut cmd = Command::new(meta.name)
        .about(meta.description)
        .disable_help_flag(true);
    if let Some(args) = build_args_from_schema(&meta.request) {
        for arg in args {
            cmd = cmd.arg(arg);
        }
    }
    meta.augment_command(HelperCmdArgs::augment_args(cmd))
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：命令树构建（build_service_cmd、alias 注入）
    //!
    //! ### 关键接口
    //! - [build_service_cmd] — 根据 ServiceInfo 构建完整的 clap::Command 树
    //! - [build_helper_cmd] — 根据 HelperMeta 构建 helper 子命令（含 --json/--schema/--doc）
    //!
    //! ### 关键分支与异常路径
    //! - helper 命令 about 取 helper 描述，而非 HelperCmdArgs 文档块

    use super::*;
    use crate::HelperMeta;

    // ── build_helper_cmd ──

    /// P0：[build_helper_cmd] 命令 about 为 helper 描述而非 HelperCmdArgs 文档块
    /// 条件：HelperMeta 描述为 "下载媒体文件"
    /// 断言：command about 渲染文本为 "下载媒体文件"
    #[test]
    fn helper_cmd_about_is_helper_description() {
        let meta = HelperMeta::new("+download", "下载媒体文件");
        let cmd = build_helper_cmd(&meta);
        let about = cmd.get_about().map(|s| s.to_string()).unwrap_or_default();
        assert_eq!(about, "下载媒体文件");
    }

    /// P0：[build_helper_cmd] 注入 --json / --schema / --doc 标志
    /// 条件：任意 HelperMeta
    /// 断言：命令包含 json、schema、doc 三个参数 id
    #[test]
    fn helper_cmd_has_json_and_doc_flags() {
        let meta = HelperMeta::new("h", "d");
        let cmd = build_helper_cmd(&meta);
        let ids: Vec<String> = cmd
            .get_arguments()
            .map(|a| a.get_id().to_string())
            .collect();
        assert!(ids.contains(&"json".to_string()));
        assert!(ids.contains(&"schema".to_string()));
        assert!(ids.contains(&"doc".to_string()));
    }

    /// P1：[build_helper_cmd] 应用 helper 注册的 command 增强钩子
    /// 条件：HelperMeta 通过 with_command_augment 注册添加 after_help 的钩子
    /// 断言：构建出的 command 携带该 after_help 文本
    #[test]
    fn helper_cmd_applies_command_augment() {
        let meta = HelperMeta::new("+download", "下载媒体文件")
            .with_command_augment(|cmd| cmd.after_help("使用示例"));
        let cmd = build_helper_cmd(&meta);
        let after = cmd
            .get_after_help()
            .map(|s| s.to_string())
            .unwrap_or_default();
        assert_eq!(after, "使用示例");
    }

    // ── augment_alias_cmds / build_service_cmd（alias 注入）──

    fn make_simple_method(path: &str, aliases: Option<Vec<&str>>) -> MethodSchema {
        MethodSchema {
            description: Some("d".into()),
            http_method: "POST".into(),
            path: path.into(),
            path_alias: aliases.map(|v| v.into_iter().map(String::from).collect()),
            request: None,
            response: None,
            ..Default::default()
        }
    }

    /// 构造 contact 服务 schema：
    /// ```text
    /// contact
    /// └── users
    ///     └── search   (alias: /contact/search)
    /// ```
    fn build_contact_schema() -> ServiceSchema {
        let mut user_methods = indexmap::IndexMap::new();
        user_methods.insert(
            "search".to_string(),
            make_simple_method("/contact/users/search", Some(vec!["/contact/search"])),
        );
        let users = ServiceResource {
            methods: user_methods,
            resources: indexmap::IndexMap::new(),
            ..Default::default()
        };
        let mut top_resources = indexmap::IndexMap::new();
        top_resources.insert("users".to_string(), users);
        ServiceSchema {
            description: None,
            skills: vec![],
            base_url: Some("https://api.test".to_string()),
            schemas: indexmap::IndexMap::new(),
            id: None,
            remote_doc: None,
            resource_tree: ServiceResource {
                methods: indexmap::IndexMap::new(),
                resources: top_resources,
                ..Default::default()
            },
        }
    }

    fn empty_helpers() -> HelperRegistry {
        HelperRegistry::default()
    }

    /// P0：[build_service_cmd] 将 path_alias 注入为根级隐藏子命令，叶子命令也是 hidden
    /// 条件：contact.users.search 上声明 alias /contact/search
    /// 断言：contact 命令下能找到名为 "search" 的 hidden 子命令；同时正常命令链 users → search 仍存在
    #[test]
    fn build_service_cmd_injects_hidden_alias_at_service_root() {
        let info = ServiceInfo {
            name: "contact".into(),
            description: String::new(),
            hidden: false,
            alias: vec![],
        };
        let schema = build_contact_schema();
        let cmd = build_service_cmd(&empty_helpers(), &info, Some(&schema));

        // 真实命令路径仍然存在
        let users = cmd.find_subcommand("users").expect("users resource exists");
        assert!(users.find_subcommand("search").is_some());

        // alias `search` 注入为根级 hidden 子命令
        let alias = cmd
            .find_subcommand("search")
            .expect("alias subcommand should be injected");
        assert!(alias.is_hide_set(), "alias subcommand should be hidden");
    }

    /// P0：[augment_alias_cmds] alias 叶子段与现有 group/方法名冲突时跳过整条 alias
    /// 条件：alias 仅一段且与已有真实 resource `users` 同名（`/contact/users`）
    /// 断言：根级 users 仍是可见的真实 group，未被 alias 隐藏 / 覆盖
    #[test]
    fn build_service_cmd_skips_alias_when_leaf_conflicts_with_existing() {
        let mut user_methods = indexmap::IndexMap::new();
        user_methods.insert(
            "search".to_string(),
            // alias 仅一段且与已有 users group 同名 → 必须跳过
            make_simple_method("/contact/users/search", Some(vec!["/contact/users"])),
        );
        let users = ServiceResource {
            methods: user_methods,
            resources: indexmap::IndexMap::new(),
            ..Default::default()
        };
        let mut top_resources = indexmap::IndexMap::new();
        top_resources.insert("users".to_string(), users);
        let schema = ServiceSchema {
            description: None,
            skills: vec![],
            base_url: Some("https://api.test".to_string()),
            schemas: indexmap::IndexMap::new(),
            id: None,
            remote_doc: None,
            resource_tree: ServiceResource {
                methods: indexmap::IndexMap::new(),
                resources: top_resources,
                ..Default::default()
            },
        };
        let info = ServiceInfo {
            name: "contact".into(),
            description: String::new(),
            hidden: false,
            alias: vec![],
        };
        let cmd = build_service_cmd(&empty_helpers(), &info, Some(&schema));
        let users_cmd = cmd.find_subcommand("users").unwrap();
        // 真实 resource 不应被隐藏
        assert!(!users_cmd.is_hide_set());
    }

    /// P0：[build_service_cmd] service 级 --help 由 clap 自动 help 处理
    /// 条件：无 schema 的 service 命令执行 `try_get_matches_from(["hr", "--help"])`
    /// 断言：返回 DisplayHelp（run.rs 据此拦截做 remote_doc 远程帮助 / 本地帮助渲染）
    #[test]
    fn build_service_cmd_help_returns_display_help() {
        let info = ServiceInfo {
            name: "hr".into(),
            description: "HR service".into(),
            hidden: false,
            alias: vec![],
        };
        let cmd = build_service_cmd(&empty_helpers(), &info, None);
        let err = cmd.try_get_matches_from(["hr", "--help"]).unwrap_err();
        assert_eq!(err.kind(), clap::error::ErrorKind::DisplayHelp);
    }

    /// P0：[build_service_cmd] resource group 级 --help 正常下钻
    /// 条件：含 users 资源的服务命令执行 `try_get_matches_from(["c", "users", "--help"])`
    /// 断言：返回 DisplayHelp（--help 下钻到 resource group 的自动 help，而非被 service 级拦截）
    #[test]
    fn build_service_cmd_resource_help_drills_down() {
        let info = ServiceInfo {
            name: "contact".into(),
            description: String::new(),
            hidden: false,
            alias: vec![],
        };
        let cmd = build_service_cmd(&empty_helpers(), &info, Some(&build_contact_schema()));
        let err = cmd
            .try_get_matches_from(["contact", "users", "--help"])
            .unwrap_err();
        assert_eq!(err.kind(), clap::error::ErrorKind::DisplayHelp);
    }

    /// P0：[augment_alias_cmds] alias 中间段 reuse 现有 group，仅在末段新增 hidden 叶子
    /// 条件：alias `/contact/users/find` 命中已有 users group，叶子 `find` 不存在
    /// 断言：
    /// - users group 仍 visible（reuse 而非新建/隐藏）
    /// - users 下出现 hidden 的 `find` 子命令
    /// - users 下原有的真实 `search` 子命令不受影响
    #[test]
    fn build_service_cmd_alias_reuses_existing_group_and_only_hides_new_leaf() {
        let mut user_methods = indexmap::IndexMap::new();
        user_methods.insert(
            "search".to_string(),
            make_simple_method("/contact/users/search", Some(vec!["/contact/users/find"])),
        );
        let users = ServiceResource {
            methods: user_methods,
            resources: indexmap::IndexMap::new(),
            ..Default::default()
        };
        let mut top_resources = indexmap::IndexMap::new();
        top_resources.insert("users".to_string(), users);
        let schema = ServiceSchema {
            description: None,
            skills: vec![],
            base_url: Some("https://api.test".to_string()),
            schemas: indexmap::IndexMap::new(),
            id: None,
            remote_doc: None,
            resource_tree: ServiceResource {
                methods: indexmap::IndexMap::new(),
                resources: top_resources,
                ..Default::default()
            },
        };
        let info = ServiceInfo {
            name: "contact".into(),
            description: String::new(),
            hidden: false,
            alias: vec![],
        };
        let cmd = build_service_cmd(&empty_helpers(), &info, Some(&schema));

        let users_cmd = cmd.find_subcommand("users").expect("users still exists");
        assert!(
            !users_cmd.is_hide_set(),
            "existing users group must stay visible after reuse"
        );
        // 真实子命令仍可见
        let real_search = users_cmd
            .find_subcommand("search")
            .expect("real users.search preserved");
        assert!(!real_search.is_hide_set());
        // 新增的 alias 叶子是 hidden
        let alias_leaf = users_cmd
            .find_subcommand("find")
            .expect("alias users.find injected");
        assert!(alias_leaf.is_hide_set(), "alias leaf must be hidden");
    }

    /// P1：[lookup_method] 沿 real_segs 在 resource 树中找到目标 method
    /// 条件：real_segs = ["users","search"]，schema 中存在该方法
    /// 断言：返回 Some 且 path 与 schema 一致
    #[test]
    fn lookup_method_finds_nested_method() {
        let schema = build_contact_schema();
        let m = lookup_method(
            &schema.resource_tree,
            &["users".to_string(), "search".to_string()],
        )
        .expect("should find users.search");
        assert_eq!(m.path, "/contact/users/search");
    }

    /// P1：[lookup_method] 路径不存在时返回 None
    /// 条件：real_segs = ["users","missing"]
    /// 断言：返回 None
    #[test]
    fn lookup_method_returns_none_for_missing_path() {
        let schema = build_contact_schema();
        let res = lookup_method(
            &schema.resource_tree,
            &["users".to_string(), "missing".to_string()],
        );
        assert!(res.is_none());
    }

    /// P1：[build_alias_subtree] 多段 alias 构造嵌套 hidden 子命令链
    /// 条件：alias_segs = ["v2","search"]，方法存在
    /// 断言：返回的 v2 是 hidden 且其下的 search 也是 hidden
    #[test]
    fn build_alias_subtree_chains_hidden_groups() {
        let schema = build_contact_schema();
        let method = lookup_method(
            &schema.resource_tree,
            &["users".to_string(), "search".to_string()],
        )
        .unwrap();
        let segs = vec!["v2".to_string(), "search".to_string()];
        let sub = build_alias_subtree(&segs, &schema, method);
        assert_eq!(sub.get_name(), "v2");
        assert!(sub.is_hide_set());
        let leaf = sub.find_subcommand("search").expect("nested leaf exists");
        assert!(leaf.is_hide_set());
    }
}
