use std::sync::Arc;

use clap::{ArgAction, Command};

use super::{CliRun, extract_subcmd_path};
use crate::registry::{ServiceInfo, ServiceSchema};
use crate::telemetry::contract::subcmd_not_found as ctr_snf;
use crate::{Error, Result, service, telemetry};

impl<'a> CliRun<'a> {
    // ── Parse-error handling ──

    /// Handle a clap parse error from [`execute`](Self::execute).
    ///
    /// - **帮助展示**（`DisplayHelp` / `DisplayHelpOnMissingArgumentOrSubcommand`）：
    ///   remote_doc 命中时以远程文档作为帮助内容，否则用 clap 渲染文本。
    ///   退出码由 `use_stderr` 决定：显式 `--help`（`use_stderr == false`）
    ///   输出到 stdout 并正常返回；缺失子命令/参数触发的自动帮助
    ///   （`use_stderr == true`）返回 `Error::CliOutput { code: 2 }`。
    /// - **其余非错误展示**（`use_stderr == false`，如 `DisplayVersion`）：
    ///   原样输出 clap 渲染文本并正常返回。
    /// - **其他错误**：渲染 clap 错误文案，`InvalidSubcommand` 额外上报
    ///   `subcmd-not-found` 遥测，返回 `Error::CliOutput { code: 2 }`。
    ///
    /// `pristine` 必须是未解析过的新树（见 execute 中 build_root_cmd() 的注释），
    /// 二次解析得到与成功路径一致的 clap 权威子命令路径。
    pub(super) async fn handle_parse_error(
        &self,
        error: clap::Error,
        pristine: Command,
        argv: &[String],
        info: Option<&ServiceInfo>,
        schema: Option<Arc<ServiceSchema>>,
    ) -> Result<()> {
        let path = resolve_subcmd_path(pristine, argv);
        let schema = schema.as_deref();
        // 完整命令路径段：首段即 service 名（与成功路径 extract_subcmd_path 同源）。
        let segs: Vec<&str> = path.split(' ').filter(|seg| !seg.is_empty()).collect();

        if error.kind() == clap::error::ErrorKind::InvalidSubcommand {
            // path 为 clap 权威解析出的成功前缀；出错 token 由 clap error context 提供，
            // 拼接后保持「用户实际输入的完整尝试路径」语义。
            let invalid = error
                .get(clap::error::ContextKind::InvalidSubcommand)
                .map(|v| v.to_string())
                .unwrap_or_default();
            let subcmd = if invalid.is_empty() {
                path.to_owned()
            } else {
                format!("{path} {invalid}")
            };
            telemetry::emit(
                ctr_snf::KIND,
                &serde_json::json!({ ctr_snf::FIELD_SUBCMD: subcmd }),
            );
        }

        let is_help = matches!(
            error.kind(),
            clap::error::ErrorKind::DisplayHelp
                | clap::error::ErrorKind::DisplayHelpOnMissingArgumentOrSubcommand
        );

        let message = if is_help {
            let default = match self.try_remote_doc_help(info, schema, &segs).await? {
                Some(doc) => clap::builder::StyledStr::from(doc),
                None => error.render(),
            };
            self.output.render_styled(&default)
        } else {
            self.output.render_styled(&error.render())
        };

        if !error.use_stderr() {
            self.output.print(&message);
            return Ok(());
        }

        Err(Error::CliOutput {
            code: 2,
            message,
            source: Some(error),
        })
    }

    /// remote_doc：clap 侧的 `--help` / 自动 help（DisplayHelp，非错误）
    /// 命中声明了 remote_doc 的节点时，改为请求远程文档端点生成帮助内容
    /// （payload 为 `{id, kind}`）。命中返回文档文本 `Some(doc)`，未命中
    /// 返回 `None`；输出由调用方负责。
    ///
    /// `segs` 为完整命令路径段（首段期望是 service 规范名，空段已在调用方
    /// 过滤）；首段与规范名不匹配（如 flag 在前）时不拦截。`service_info`
    /// 为 `None`（first_arg 未命中任何服务）时不拦截。
    pub(super) async fn try_remote_doc_help(
        &self,
        info: Option<&ServiceInfo>,
        schema: Option<&ServiceSchema>,
        segs: &[&str],
    ) -> Result<Option<String>> {
        let (Some(info), Some(schema)) = (info, schema) else {
            return Ok(None);
        };
        if segs.first().copied() != Some(info.name.as_str()) {
            return Ok(None);
        }
        let node_segs: Vec<&str> = segs[1..].to_vec();
        let Some(id) =
            service::remote_doc::resolve_remote_doc_id_with_alias(schema, &info.name, &node_segs)
        else {
            return Ok(None);
        };

        service::remote_doc::fetch_remote_doc(self, id, "help")
            .await
            .map(Some)
    }
}

/// Resolve the canonical subcommand path clap itself would take for `argv`,
/// even when the primary parse failed.
///
/// The tree is relaxed so that no parse can abort — `ignore_errors`, help /
/// version actions neutralized, `subcommand_required` and
/// `arg_required_else_help` cleared — hence `ArgMatches` is always produced
/// and the path is extracted by the same [`extract_subcmd_path`] used on the
/// success path. Returns an empty string when even the relaxed parse fails.
///
/// # Invariant
///
/// `pristine` MUST be a never-parsed tree. clap skips `_propagate` once a
/// `Command` is built, so global settings would not reach the subcommands and
/// the resolved path would silently truncate to the first segment.
pub(super) fn resolve_subcmd_path(pristine: Command, argv: &[String]) -> String {
    relax_cmd_validation(pristine)
        .ignore_errors(true)
        .disable_help_flag(true)
        .disable_help_subcommand(true)
        .try_get_matches_from(normalize_help_subcommand(argv))
        .map(|m| extract_subcmd_path(&m))
        .unwrap_or_default()
}

fn relax_cmd_validation(cmd: Command) -> Command {
    let names: Vec<String> = cmd
        .get_subcommands()
        .map(|c| c.get_name().to_owned())
        .collect();

    let mut cmd = cmd
        .subcommand_required(false)
        .arg_required_else_help(false)
        .mut_args(|a| match a.get_action() {
            ArgAction::Help | ArgAction::HelpShort | ArgAction::HelpLong | ArgAction::Version => {
                a.action(ArgAction::SetTrue)
            }
            _ => a,
        });

    for name in names {
        cmd = cmd.mut_subcommand(name, relax_cmd_validation);
    }
    cmd
}

/// clap spells `help <sub>` as `<sub> --help`; since the help subcommand is
/// disabled in the relaxed tree, drop the leading `help` token so the path
/// still resolves to the target node.
pub(super) fn normalize_help_subcommand(argv: &[String]) -> Vec<String> {
    let mut out = argv.to_vec();
    let Some(pos) = out.iter().position(|a| a == "help") else {
        return out;
    };
    if pos > 0 && !out[pos - 1].starts_with('-') {
        out.remove(pos);
    }
    out
}
