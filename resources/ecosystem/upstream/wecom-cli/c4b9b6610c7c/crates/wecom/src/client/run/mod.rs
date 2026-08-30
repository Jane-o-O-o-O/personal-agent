//! CLI run pipeline: [`CliRun`] run context, its output configuration,
//! clap command-tree execution, and parse-error handling.
//!
//! Split by responsibility:
//! - [`output`] — [`CliRunOutput`] / [`Writer`] / extra-data callback
//! - [`execute`] — root command-tree build + subcommand dispatch
//! - [`parse_error`] — clap error handling + relaxed re-parse path resolution

mod execute;
mod output;
mod parse_error;
#[cfg(test)]
mod tests;

use std::future::IntoFuture;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::sync::Arc;

use clap::ArgMatches;
use indexmap::IndexMap;
use output::ExtraDataCallback;
pub use output::{CliRunOutput, Writer};

use super::Client;
use crate::{Error, Result, fs};

// ── CliRun ───────────────────────────────────────────────────

/// A CLI run context returned by [`Client::run()`] that can be awaited
/// directly or configured with extra options before execution.
///
/// `CliRun` bundles the [`Client`] reference, output configuration, and
/// additional HTTP headers into a single value that is threaded through
/// the entire CLI command pipeline.
///
/// You can chain `.output()` / `.headers()` / `.header()` to configure
/// the run before `.await`ing.
///
/// # Examples
///
/// ```rust,no_run
/// # use wecom::{CliRunOutput, Client};
/// # async fn example(
/// #     client: &Client,
/// #     argv: Vec<String>,
/// #     buf: Vec<u8>,
/// #     my_headers: &reqwest::header::HeaderMap,
/// # ) -> Result<(), Box<dyn std::error::Error>> {
/// // Simple – no extra options:
/// client.run(argv.clone()).await?;
///
/// // With custom output:
/// client.run(argv.clone()).output(CliRunOutput::new(buf)).await?;
///
/// // With additional headers:
/// client.run(argv.clone()).headers(&my_headers).await?;
///
/// // With a single header:
/// client.run(argv.clone()).header("x-custom", "value").await?;
///
/// // Use a differently configured workspace filesystem for this run
/// // (e.g. another working directory):
/// client.run(argv.clone())
///     .fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
///     .await?;
///
/// // Combine a workspace fs override with other options:
/// client.run(argv.clone())
///     .fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
///     .headers(&my_headers)
///     .await?;
///
/// // Cap every individual wire call (首发请求、分页每页、长任务轮询每一轮
/// // /task/query、媒体上传子请求) with a uniform per-request
/// // timeout. 注意：这是"每笔请求"的超时，而不是整个 run 的总挂钟时间。
/// client.run(argv.clone())
///     .timeout(std::time::Duration::from_secs(30))
///     .await?;
///
/// // Receive a heartbeat per long-task polling round (None when the server
/// // hasn't published progress in this round; useful as a "still alive" signal).
/// // `ev.result` is `Option<&serde_json::Value>` — already parsed.
/// client.run(argv)
///     .on_poll(|ev| eprintln!("[heartbeat] task={} result={:?}", ev.taskid, ev.result))
///     .await?;
/// # Ok(())
/// # }
/// ```
pub struct CliRun<'a> {
    client: &'a Client,
    workspace_fs: Arc<dyn fs::Fs>,
    cwd: Option<PathBuf>,
    argv: Vec<String>,
    output: CliRunOutput,
    header_error: Option<Error>,
    options: wecom_transport::RequestOptions,
    on_extra_data: Option<ExtraDataCallback>,
}

impl<'a> std::fmt::Debug for CliRun<'a> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CliRun")
            .field("argv", &self.argv)
            .field("output", &self.output)
            .field("options", &self.options)
            .field(
                "on_extra_data",
                &self.on_extra_data.as_ref().map(|_| "<callback>"),
            )
            .finish()
    }
}

// Implements inherent `.headers()` / `.header()` / `.timeout()` /
// `.on_poll()` / `.with_options()` methods so callers
// never need to import a trait.
//
// `+options` 的语义：替换 `+timeout` 和 `+on_poll`，生成：
// - `with_options(RequestOptions)` — 整体替换所有 per-request 参数
// - `timeout(Duration)` — 设置每笔独立请求的超时
// - `on_poll(F)` / `on_poll_arc(cb)` — 长任务轮询心跳回调
// - `extension(T)` / `extensions(&Extensions)` / `get_extensions()` —
//   扩展袋注入 / 合并 / 读取
wecom_transport::impl_request_builder!(
    CliRun<'a>,
    +options,
    error_type = Error,
    error_wrapper = Error::other,
);

impl<'a> CliRun<'a> {
    // ── Client ──

    /// Returns a reference to the [`Client`].
    pub fn get_client(&self) -> &Client {
        self.client
    }

    // ── fs ──

    /// Filesystem capability for this run (workspace domain).
    ///
    /// Defaults to the client-injected [`Client::workspace_fs`]
    /// implementation; a per-run [`.fs()`](Self::fs) override replaces it
    /// wholesale. The CLI-private domain is intentionally not reachable from
    /// here — use [`Client::private_fs`] for that.
    pub fn get_fs(&self) -> &Arc<dyn fs::Fs> {
        &self.workspace_fs
    }

    /// Replace the workspace-domain [`fs::Fs`] implementation for this run
    /// only.
    ///
    /// Run-scoped filesystem behavior (working directory, sandbox roots,
    /// path resolver) is a construction-time concern of the implementation:
    /// override it by injecting a differently configured instance. The
    /// override cannot affect the CLI-private domain.
    #[must_use]
    pub fn fs(mut self, fs: Arc<dyn fs::Fs>) -> Self {
        self.workspace_fs = fs;
        self
    }

    // ── config_dir / default_output_dir（client 级固定，run 级不可覆盖）──

    /// Configuration directory of the owning [`Client`].
    ///
    /// Deliberately not overridable per run: the CLI-private [`fs::Fs`]
    /// roots are pinned when the instance is constructed, so a run-level
    /// directory override would drift away from the capability that serves
    /// it.  Embedders needing another directory build a differently
    /// configured [`Client`] (or inject another fs via [`fs()`](Self::fs)
    /// for the workspace domain).
    pub fn get_config_dir(&self) -> &Path {
        self.client.config_dir()
    }

    /// Effective cache directory (derived from [`get_config_dir`](Self::get_config_dir)).
    pub fn get_cache_dir(&self) -> PathBuf {
        self.get_config_dir().join("cache")
    }

    /// Effective default output directory for downloaded files: the
    /// client-configured default output directory, or this run's working
    /// directory anchor when unconfigured (honoring a per-run
    /// [`.cwd()`](Self::cwd) override).
    pub fn get_default_output_dir(&self) -> &Path {
        self.client
            .default_output_dir()
            .unwrap_or_else(|| self.get_cwd())
    }

    /// Working directory anchoring relative externally-derived paths for
    /// this run.
    ///
    /// Defaults to the owning [`Client`]'s pinned cwd; a per-run
    /// [`.cwd()`](Self::cwd) override moves the anchor only.
    pub fn get_cwd(&self) -> &Path {
        self.cwd.as_deref().unwrap_or_else(|| self.client.cwd())
    }

    /// Override the working-directory anchor for this run.
    ///
    /// Only the anchor moves, **not** the security boundary: the workspace
    /// [`fs::Fs`] keeps its construction-time roots.  Intended for moving
    /// *within* the configured roots (e.g. per-task subdirectories under a
    /// shared workspace root).  Relative input anchored to a cwd outside
    /// the roots is rejected (fail-closed) — when switching to a directory
    /// outside the roots, pair with [`.fs()`](Self::fs) carrying matching
    /// roots.
    #[must_use]
    pub fn cwd(mut self, dir: impl Into<PathBuf>) -> Self {
        self.cwd = Some(dir.into());
        self
    }

    // ── output ──

    /// Replace the output configuration.
    #[must_use]
    pub fn output(mut self, output: CliRunOutput) -> Self {
        self.output = output;
        self
    }

    /// Returns a reference to the [`CliRunOutput`] configuration.
    pub fn get_output(&self) -> &CliRunOutput {
        &self.output
    }

    /// 注册一个回调，在每次非二进制响应携带服务端额外数据（非空）时接收
    /// side-channel 字段。
    ///
    /// 单页模式下服务端有额外数据则触发 1 次；分页模式下每页各自触发。
    /// 额外数据为空时回调不触发。多次调用以最后一次为准（last-one-wins）。
    ///
    /// 回调签名 `&IndexMap<String, Value>` 与
    /// [`wecom_transport::ExecuteOutput::extra`] /
    /// [`wecom_transport::PollEvent::extra`] 类型一致。
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use wecom::Client;
    /// # async fn example(client: &Client, argv: Vec<String>) -> Result<(), Box<dyn std::error::Error>> {
    /// client.run(argv)
    ///     .on_extra_data(|data| {
    ///         if let Some(display) = data.get("display_result") {
    ///             eprintln!("展示结果: {display}");
    ///         }
    ///     })
    ///     .await?;
    /// # Ok(())
    /// # }
    /// ```
    #[must_use]
    pub fn on_extra_data<F>(mut self, f: F) -> Self
    where
        F: Fn(&IndexMap<String, serde_json::Value>) + Send + Sync + 'static,
    {
        self.on_extra_data = Some(Arc::new(f));
        self
    }

    /// 内部使用：返回已注册的额外数据回调（若有）。
    pub(crate) fn get_on_extra_data(&self) -> Option<&ExtraDataCallback> {
        self.on_extra_data.as_ref()
    }

    /// Render clap help / error output color-aware (see
    /// [`CliRunOutput::render_styled`]), preserving the original styling.
    ///
    /// Shared between `--help` rendering (`handle_service_cmd`) and the CLI
    /// parse-error path ([`execute`](Self::execute)).
    pub(crate) fn render_help_message(&self, fallback: &clap::builder::StyledStr) -> String {
        self.output.render_styled(fallback)
    }
}

impl<'a> IntoFuture for CliRun<'a> {
    type Output = Result<()>;
    type IntoFuture = Pin<Box<dyn std::future::Future<Output = Self::Output> + Send + 'a>>;

    fn into_future(self) -> Self::IntoFuture {
        Box::pin(self.execute())
    }
}

impl Client {
    /// 核心入口：接受命令行参数列表。
    ///
    /// `argv` 应包含程序名本身（即 `std::env::args().collect()` 的完整结果）。
    ///
    /// Returns a [`CliRun`] that can be `.await`ed directly, or
    /// configured with `.output()` / `.headers()` / `.header()` first.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use wecom::{CliRunOutput, Client};
    /// # async fn example(
    /// #     client: &Client,
    /// #     argv: Vec<String>,
    /// #     buf: Vec<u8>,
    /// #     headers: &reqwest::header::HeaderMap,
    /// # ) -> Result<(), Box<dyn std::error::Error>> {
    /// // Simple usage (output to stdout):
    /// client.run(argv.clone()).await?;
    ///
    /// // With custom output:
    /// client.run(argv.clone()).output(CliRunOutput::new(buf)).await?;
    ///
    /// // With additional headers:
    /// client.run(argv).headers(&headers).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub fn run(&self, argv: Vec<String>) -> CliRun<'_> {
        CliRun {
            client: self,
            workspace_fs: Arc::clone(self.workspace_fs()),
            cwd: None,
            argv,
            output: CliRunOutput::default(),
            header_error: None,
            options: wecom_transport::RequestOptions::default(),
            on_extra_data: None,
        }
    }
}

/// Extract the full subcommand path from clap-parsed [`ArgMatches`].
///
/// Walks the subcommand chain recursively and returns a space-separated
/// path string (e.g. `"contact users search"`), matching the format used
/// by [`method_alias`](crate::telemetry::contract::method_alias) events.
fn extract_subcmd_path(matches: &ArgMatches) -> String {
    let mut path: Vec<&str> = Vec::new();
    let mut cur = matches;
    while let Some((name, sub)) = cur.subcommand() {
        path.push(name);
        cur = sub;
    }
    path.join(" ")
}
