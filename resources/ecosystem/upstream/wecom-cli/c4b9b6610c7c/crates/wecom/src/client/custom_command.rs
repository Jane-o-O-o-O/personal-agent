//! 扩展命令：调用方注册自定义顶层子命令，由 [`CliRun::execute`] 统一调度。
//!
//! 用于 wecom-cli 等调用方在 lib 之外实现自有命令（如 `auth`），
//! 同时保留 `Client::run` 作为单一命令入口。扩展命令与内置命令
//! （`cache` / `schema`）同等待遇：跳过服务发现（不触网）、
//! 参与 clap 帮助体系。

use std::pin::Pin;
use std::sync::Arc;

use super::{CliRun, Result};

/// 扩展命令处理器：接收当前 [`CliRun`] 与解析后的 [`clap::ArgMatches`]。
pub type CustomCommandHandler = Arc<
    dyn for<'a> Fn(
            &'a CliRun<'a>,
            &'a clap::ArgMatches,
        ) -> Pin<Box<dyn std::future::Future<Output = Result<()>> + Send + 'a>>
        + Send
        + Sync,
>;

/// 一个自定义顶层子命令。
///
/// `command` 提供 clap 定义（名称 / 参数 / 子命令 / 帮助），`handler`
/// 在命令命中时执行。
pub struct CustomCommand {
    command: clap::Command,
    handler: CustomCommandHandler,
}

impl CustomCommand {
    /// 以 clap 命令定义与异步处理器构造扩展命令。
    pub fn new<F>(command: clap::Command, handler: F) -> Self
    where
        F: for<'a> Fn(
                &'a CliRun<'a>,
                &'a clap::ArgMatches,
            )
                -> Pin<Box<dyn std::future::Future<Output = Result<()>> + Send + 'a>>
            + Send
            + Sync
            + 'static,
    {
        Self {
            command,
            handler: Arc::new(handler),
        }
    }

    /// 命令名（clap 命令的名称）。
    pub fn name(&self) -> &str {
        self.command.get_name()
    }

    pub(crate) fn command(&self) -> &clap::Command {
        &self.command
    }

    pub(crate) async fn handle(&self, run: &CliRun<'_>, matches: &clap::ArgMatches) -> Result<()> {
        (self.handler)(run, matches).await
    }
}

impl std::fmt::Debug for CustomCommand {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CustomCommand")
            .field("name", &self.name())
            .finish_non_exhaustive()
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：CustomCommand（扩展命令，clap 定义 + 异步处理器）
    //!
    //! ### 关键接口
    //! - [CustomCommand::new] — 以 clap 命令定义与 handler 构造
    //! - [CustomCommand::name] — 命令名（clap 命令的名称）
    //! - [CustomCommand::handle] — 命中时调度到 handler
    //!
    //! ### 关键分支与异常路径
    //! - handler 接收完整的 [`clap::ArgMatches`]（含子命令匹配）
    //! - `Debug` 只暴露 name，handler 不可见（non-exhaustive）

    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, Ordering};

    use super::*;

    /// Build an isolated [`crate::Client`] for unit tests (leaked tempdir as
    /// `config_dir`, never touches the real `~/.config/wecom`).
    fn build_isolated_client() -> crate::Client {
        let tmp = tempfile::tempdir().expect("failed to create tempdir for test isolation");
        let dir = tmp.path().to_path_buf();
        std::mem::forget(tmp);
        crate::Client::builder().config_dir(&dir).build().unwrap()
    }

    /// P1：[CustomCommand::name] 返回 clap 命令定义的名称
    /// 条件：以 `clap::Command::new("auth")` 构造扩展命令
    /// 断言：name() == "auth"
    #[test]
    fn name_returns_clap_command_name() {
        let cmd = CustomCommand::new(clap::Command::new("auth"), |_run, _matches| {
            Box::pin(async { Ok(()) })
        });
        assert_eq!(cmd.name(), "auth");
    }

    /// P1：[CustomCommand::handle] 命中时将 ArgMatches 传递给 handler 执行
    /// 条件：注册带 `login` 子命令的 `auth` 扩展命令，以 `auth login` 的 matches 调用 handle
    /// 断言：handler 被调用，且能通过 matches 取到 `login` 子命令
    #[tokio::test]
    async fn handle_invokes_handler_with_matches() {
        let called = Arc::new(AtomicBool::new(false));
        let called_in_handler = called.clone();
        let cmd = CustomCommand::new(
            clap::Command::new("auth").subcommand(clap::Command::new("login")),
            move |_run, matches| {
                let called = called_in_handler.clone();
                Box::pin(async move {
                    called.store(
                        matches.subcommand_matches("login").is_some(),
                        Ordering::SeqCst,
                    );
                    Ok(())
                })
            },
        );

        let client = build_isolated_client();
        let run = client.run(vec!["wecom".into(), "auth".into(), "login".into()]);
        let matches = clap::Command::new("auth")
            .subcommand(clap::Command::new("login"))
            .get_matches_from(vec!["auth", "login"]);

        cmd.handle(&run, &matches).await.unwrap();
        assert!(called.load(Ordering::SeqCst), "handler was not invoked");
    }

    /// P2：[CustomCommand::Debug] 输出命令名且不暴露 handler
    /// 条件：构造 `auth` 扩展命令并 format Debug
    /// 断言：输出含 "auth"，且为 non-exhaustive（含 ".."）
    #[test]
    fn debug_shows_name_and_hides_handler() {
        let cmd = CustomCommand::new(clap::Command::new("auth"), |_run, _matches| {
            Box::pin(async { Ok(()) })
        });
        let dbg = format!("{cmd:?}");
        assert!(dbg.contains("auth"), "Debug should contain name: {dbg}");
        assert!(dbg.contains(".."), "Debug should be non-exhaustive: {dbg}");
    }

    /// P2：[CustomCommand::handle] handler 返回 `Err` 时错误原样传播（对齐 wecom-cli 的 `auth` 错误路径）
    /// 条件：handler 返回 `Error::other("boom")`，调用 handle
    /// 断言：handle 返回同一错误，message 为 "boom"
    #[tokio::test]
    async fn handle_propagates_handler_error() {
        let cmd = CustomCommand::new(clap::Command::new("auth"), |_run, _matches| {
            Box::pin(async { Err(crate::Error::other("boom".into())) })
        });

        let client = build_isolated_client();
        let run = client.run(vec!["wecom".into(), "auth".into()]);
        let matches = clap::Command::new("auth").get_matches_from(vec!["auth"]);

        let err = cmd.handle(&run, &matches).await.unwrap_err();
        assert_eq!(err.code(), crate::E_OTHER);
        assert_eq!(err.message(), "boom");
    }
}
