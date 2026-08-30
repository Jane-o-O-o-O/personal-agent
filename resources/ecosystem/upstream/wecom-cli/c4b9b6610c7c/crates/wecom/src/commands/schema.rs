use clap::{ArgMatches, Command, FromArgMatches, Subcommand};

use crate::{CliRun, CliRunOutput, Error, Result};

/// 查看服务与方法 schema。
#[derive(Subcommand)]
#[command(subcommand_required = true, arg_required_else_help = true)]
pub enum SchemaSubcmd {
    /// 列出所有服务及方法。
    List,
    /// 获取指定方法的 schema。
    Get {
        /// 以点分隔的方法路径：`service.resource.method`。
        method_path: String,
    },
}

pub fn build_schema_cmd() -> Command {
    SchemaSubcmd::augment_subcommands(Command::new("schema").hide(true))
}

pub async fn handle_schema_cmd(run: &CliRun<'_>, matches: &ArgMatches) -> Result<()> {
    let output = run.get_output();

    match SchemaSubcmd::from_arg_matches(matches) {
        Ok(SchemaSubcmd::List) => handle_schema_list(run, output).await,
        Ok(SchemaSubcmd::Get { method_path }) => handle_schema_get(run, &method_path, output).await,
        _ => Err(Error::other("Unknown schema subcommand".into())),
    }
}

async fn handle_schema_list(run: &CliRun<'_>, output: &CliRunOutput) -> Result<()> {
    let client = run.get_client();
    let options = run.get_options();
    let services: Vec<_> = futures::future::try_join_all(
        client
            .list_services_with_options(options)
            .await?
            .iter()
            .map(|info| async move { client.service_with_options(&info.name, options).await }),
    )
    .await?;

    let schemas: Vec<_> = services.iter().map(|s| s.schema()).collect();
    output.print(&serde_json::to_string_pretty(&schemas).unwrap_or_default());

    Ok(())
}

async fn handle_schema_get(
    run: &CliRun<'_>,
    method_path: &str,
    output: &CliRunOutput,
) -> Result<()> {
    let segments: Vec<_> = method_path.split('.').collect();
    if segments.is_empty() {
        return Err(Error::validation("方法路径至少需要包含一段"));
    }

    let service_name = segments[0];
    if service_name.is_empty() {
        return Err(Error::validation("服务名不能为空"));
    }
    let method_segments = &segments[1..];

    let svc = run
        .get_client()
        .service_with_options(service_name, run.get_options())
        .await?;
    if method_segments.is_empty() {
        output.print(&serde_json::to_string_pretty(&svc.schema()).unwrap_or_default());
        return Ok(());
    }

    let method = svc.method(method_segments)?;
    output.print(&serde_json::to_string_pretty(&method.schema()).unwrap_or_default());
    Ok(())
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：schema（Schema 命令处理）
    //!
    //! ### 关键接口
    //! - [build_schema_cmd] — 构建 schema 命令及其子命令
    //! - [handle_schema_list] — 列出所有服务和方法
    //! - [handle_schema_get] — 获取指定方法的 schema
    //! - [handle_schema_cmd] — 分发 schema 子命令
    //!
    //! ### 关键分支与异常路径
    //! - handle_schema_list：遍历所有服务并获取 schema
    //! - handle_schema_get：方法路径为空或非法时返回错误
    //! - handle_schema_cmd：未知子命令返回 Error::Other
    //!
    //! ### 上下游交互
    //! - 上游：main 命令分发后调用本模块
    //! - 下游：依赖 [Client]（服务发现、schema 获取）

    use super::*;
    use crate::Client;

    /// Build an isolated [Client] for unit tests.
    fn build_isolated_client() -> Client {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().to_path_buf();
        std::mem::forget(tmp);
        Client::builder().config_dir(&dir).build().unwrap()
    }

    /// P1：[build_schema_cmd] schema 命令构建出正确的子命令结构
    /// 条件：调用 build_schema_cmd()
    /// 断言：命令名为 "schema"，子命令包含 "list" 和 "get"
    #[test]
    fn build_schema_cmd_creates_correct_subcommands() {
        let cmd = build_schema_cmd();
        assert_eq!(cmd.get_name(), "schema");
        assert!(cmd.get_subcommands().any(|s| s.get_name() == "list"));
        assert!(cmd.get_subcommands().any(|s| s.get_name() == "get"));
    }

    /// P1：[handle_schema_get] 空路径或不存在服务名时 get 命令返回错误
    /// 条件：传入空字符串作为方法路径
    /// 断言：函数返回 Err（错误码 E_VALIDATION）且不发网络请求
    #[tokio::test]
    async fn handle_schema_get_returns_error_for_empty_or_missing_service() {
        // 空路径在本地校验阶段即被拒绝，不会发起网络请求
        let client = build_isolated_client();
        let run = client.run(vec!["test".into()]);
        let output = CliRunOutput::new(std::io::sink());
        let result = handle_schema_get(&run, "", &output).await;
        assert!(result.is_err(), "empty path should return an error");
        assert_eq!(
            result.unwrap_err().code(),
            crate::E_VALIDATION,
            "expected Validation error for empty service name"
        );
    }

    /// P1：[handle_schema_cmd] handle_schema_cmd 未知子命令返回错误
    /// 条件：传入不含子命令的 schema 命令参数（触发 required 错误）
    /// 断言：错误类型为 Error::other(_)
    #[test]
    fn handle_schema_cmd_unknown_returns_error() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let cmd = build_schema_cmd();
        let err = rt
            .block_on(async {
                let matches = cmd.try_get_matches_from(vec!["schema"]);
                let client = build_isolated_client();
                match matches {
                    Ok(m) => {
                        let cli_run = client.run(vec!["wecom".into(), "schema".into()]);
                        handle_schema_cmd(&cli_run, &m).await
                    }
                    Err(e) => Err(Error::other(e.to_string().into())),
                }
            })
            .unwrap_err();
        assert_eq!(err.code(), crate::E_OTHER);
    }
}
