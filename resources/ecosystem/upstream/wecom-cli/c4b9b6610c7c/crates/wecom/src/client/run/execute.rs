use std::collections::HashSet;
use std::sync::Arc;

use anstyle::{AnsiColor, Color, Style};
use clap::Command;
use wecom_transport::Error as TransportError;

use super::{CliRun, extract_subcmd_path};
use crate::registry::{ServiceInfo, ServiceSchema, find_service_by_name};
use crate::{ERRCODE_SHOW_HELP, Error, Result, commands, constants, service};

/// `error:` 前缀样式，对齐 clap 默认错误风格（红色加粗）。
const ERROR_PREFIX_STYLE: Style = Style::new()
    .fg_color(Some(Color::Ansi(AnsiColor::Red)))
    .bold();

impl<'a> CliRun<'a> {
    // ── Execute ──

    /// Execute the CLI command.
    ///
    /// This is called automatically when you `.await` the [`CliRun`],
    /// but can also be invoked explicitly if needed.
    ///
    /// ## Tracing
    /// Opens a `cli.run` span. All downstream spans (`service.execute`,
    /// `transport.invoke`, `http.request`) nest under it
    /// automatically. The resolved subcommand path is recorded as the
    /// span's `subcmd` field and emitted as a `dispatching to subcommand`
    /// event.
    #[tracing::instrument(
        level = "info",
        name = "cli.run",
        skip_all,
        fields(subcmd = tracing::field::Empty),
    )]
    pub async fn execute(mut self) -> Result<()> {
        if let Some(e) = self.header_error {
            return Err(e);
        }
        let first_arg = self
            .argv
            .iter()
            .skip(1)
            .find(|a| *a == "-V" || *a == "--version" || !a.starts_with('-'))
            .cloned()
            .unwrap_or_default();

        tracing::info!(%first_arg, "execute start");

        if first_arg == "-V" || first_arg == "--version" {
            self.output
                .print(&constants::CLI_INFO.display_with_name(self.client.bin_name()));
            return Ok(());
        }

        let custom_cmds = || self.client.custom_commands().iter();
        let is_post_subcmd = post_subcmds().iter().any(|c| c.get_name() == first_arg)
            || custom_cmds().any(|c| c.name() == first_arg);

        // ① async 阶段：只做数据收集（服务目录 + 命中 first_arg 的服务 schema），
        //    不做任何命令树构建，保证 ② 的构建函数可零成本重复调用。
        let service_list = if !is_post_subcmd && !custom_cmds().any(|c| c.name() == first_arg) {
            self.client
                .list_services_with_options(self.get_options())
                .await?
        } else {
            Vec::new()
        };

        let target_service = find_service_by_name(&service_list, &first_arg);
        let target_schema = match target_service {
            Some(info) => {
                let service = self
                    .client
                    .service_with_options(&info.name, self.get_options())
                    .await?;
                Some(Arc::clone(&service.schema))
            }
            None => None,
        };

        let argv = std::mem::take(&mut self.argv);

        // ② sync 阶段：纯函数构建命令树，可重复调用；每次调用产出 pristine 树。
        let build_root_cmd =
            || self.build_root_cmd(&service_list, target_service, target_schema.as_deref());
        let mut cmd = build_root_cmd();

        let matches = match cmd.try_get_matches_from_mut(argv.clone()) {
            Ok(m) => m,
            Err(e) => {
                return self
                    .handle_parse_error(e, build_root_cmd(), &argv, target_service, target_schema)
                    .await;
            }
        };

        let subcmd_path = extract_subcmd_path(&matches);
        tracing::Span::current().record("subcmd", &subcmd_path);
        tracing::info!(subcmd = %subcmd_path, "dispatching to subcommand");

        let result = match matches.subcommand() {
            Some(("cache", matches)) => commands::cache::handle_cache_cmd(&self, matches).await,
            Some(("schema", matches)) => commands::schema::handle_schema_cmd(&self, matches).await,
            Some((name, matches)) => {
                if let Some(custom) = custom_cmds().find(|c| c.name() == name) {
                    custom.handle(&self, matches).await
                } else {
                    service::handle_service_cmd(&self, name, &first_arg, matches, &cmd).await
                }
            }
            None => Err(Error::other("Missing subcommand".into())),
        };

        // 后台接口返回 10021 错误码时，视为参数/用法错误：渲染「error 行 + 当前
        // 命令 help」（对齐 clap 用法错误输出格式）后，以 `CliOutput` 返回——退出码
        // 2、render 直接输出已渲染文本，与正常 help/用法错误走同一套处理路径。
        // 检测走能力判等（`code()` 对 Api 变体透传后台码）；命中后经 downcast
        // 恢复具体 transport 错误交给 help provider 结构化解构。
        if let Err(e) = &result
            && e.code() == ERRCODE_SHOW_HELP
        {
            let api = match e {
                Error::Wrapped(w) => w.as_any().downcast_ref::<TransportError>(),
                _ => None,
            };
            let leaf_path = extract_subcmd_path(&matches);
            let path: Vec<&str> = leaf_path.split(' ').filter(|s| !s.is_empty()).collect();
            return Err(Error::CliOutput {
                code: 2,
                message: self.render_leaf_help(&cmd, &path, api),
                source: None,
            });
        }

        result
    }

    /// Build the root clap command tree for the CLI run.
    ///
    /// Pure synchronous tree construction (no I/O): all discovery data is
    /// collected beforehand and passed in. Safe to call multiple times —
    /// each call returns a fresh, never-parsed tree, which is the invariant
    /// `resolve_subcmd_path` relies on (global settings propagate to
    /// subcommands only on first parse).
    ///
    /// `target` 为按用户首个参数经 catalog 解析到的目标服务：其命令携带
    /// `schema` 构建完整方法树，其余服务以 `None` 构建骨架树（零 schema
    /// 拉取成本）。
    pub(super) fn build_root_cmd(
        &self,
        service_list: &[ServiceInfo],
        target_service: Option<&ServiceInfo>,
        target_schema: Option<&ServiceSchema>,
    ) -> Command {
        let mut cmd = Command::new(self.client.bin_name().to_owned())
            .version(constants::CLI_INFO.display_with_name(self.client.bin_name()))
            .arg_required_else_help(true);

        let custom_cmds = self.client.custom_commands();

        // 扩展命令注册在服务发现子命令之前。
        cmd = cmd.subcommands(custom_cmds.iter().map(|c| c.command().clone()));

        // 预占名集合：扩展命令名、服务规范名、内置子命令名。alias 与其中任一
        // 冲突（或 alias 间重复）时跳过注册，既对齐 [`find_service_by_name`]
        // 的精确 name 优先语义，也避免 clap 因名称冲突触发 debug assertion。
        let post_cmds = post_subcmds();
        let mut taken: HashSet<_> = custom_cmds
            .iter()
            .map(|c| c.name())
            .chain(service_list.iter().map(|i| i.name.as_str()))
            .chain(post_cmds.iter().map(|c| c.get_name()))
            .collect();

        for info in service_list {
            // 扩展命令优先：跳过与扩展命令同名的服务。
            if custom_cmds.iter().any(|c| c.name() == info.name) {
                tracing::warn!(service = %info.name, "service shadowed by custom command, skipped");
                continue;
            }
            // schema 仅传递给目标服务（规范名相等即同一服务）；其余服务构建骨架树。
            let service_schema = if target_service.is_some_and(|t| t.name == info.name) {
                target_schema
            } else {
                None
            };

            let mut service_cmd =
                service::build_service_cmd(&self.client.helper_registry, info, service_schema);

            // alias 统一注册为 clap hidden alias（与目标服务是否命中无关）：
            // 解析后 matches 归一化为规范名，根 help 不展示 alias。
            for alias in &info.alias {
                if taken.insert(alias.as_str()) {
                    service_cmd = service_cmd.alias(alias);
                } else {
                    tracing::warn!(service = %info.name, %alias, "service alias conflicts with existing command name, skipped");
                }
            }

            cmd = cmd.subcommand(service_cmd);
        }

        cmd = cmd.subcommands(post_cmds);
        cmd
    }

    /// Walk the command tree along `path` (service name first, then method /
    /// helper segments) to the leaf subcommand and render its clap help text.
    /// When `api_error` is `Some`, the output is prefixed with an `error:` line
    /// (aligned with clap's usage-error output format); otherwise the raw help
    /// is used.
    ///
    /// Shared between the CLI `--help` path (`handle_service_cmd`) and the
    /// 10021 error path ([`execute`](Self::execute)).
    pub(crate) fn render_leaf_help(
        &self,
        cmd: &Command,
        path: &[&str],
        api_error: Option<&TransportError>,
    ) -> String {
        let mut sub = cmd;
        for seg in path {
            match sub.find_subcommand(seg) {
                Some(child) => sub = child,
                None => break,
            }
        }
        let help = sub.clone().render_help();
        // `error:` 前缀用红色加粗（对齐 clap 默认错误风格）。注意：help 内部
        // 携带 ANSI 样式，须用 `.ansi()` 取原始字符串拼接，走 `Display`
        // （`format!` 的 `{}`）会提前剥掉颜色。
        let fallback = match api_error {
            Some(e) => clap::builder::StyledStr::from(format!(
                "{}error:{} {}\n\n{}",
                ERROR_PREFIX_STYLE.render(),
                ERROR_PREFIX_STYLE.render_reset(),
                e.message(),
                help.ansi()
            )),
            None => help,
        };
        self.render_help_message(&fallback)
    }
}

/// Build the built-in subcommands registered after the dynamic service
/// commands (`cache`, `schema`).
///
/// Single source of truth for the post-discovery command set: both the
/// dispatch check in [`CliRun::execute`] and the tree construction in
/// [`CliRun::build_root_cmd`] derive from this, so the two can never drift
/// apart when a new built-in command is added.
fn post_subcmds() -> [Command; 2] {
    [
        commands::cache::build_cache_cmd(),
        commands::schema::build_schema_cmd(),
    ]
}
