use std::path::{Path, PathBuf};
use std::sync::Arc;

use super::Client;
use crate::helpers::HelperRegistry;
use crate::registry::ServiceCache;
use crate::{Result, constants};

/// Step-by-step builder for [`Client`].
///
/// Obtain one via [`Client::builder()`](Client::builder), configure it with
/// chainable setters, then call [`build()`](Self::build) to produce the
/// final `Client`.
///
/// Two filesystem capabilities ([`crate::fs::Fs`]) can be injected, one per
/// domain: [`private_fs()`](Self::private_fs) governs the CLI's own private
/// state (config, token, discovery cache) and
/// [`workspace_fs()`](Self::workspace_fs) governs the user workspace and
/// artifact directories — the only instance that may receive
/// externally-derived paths. Either one defaults to a restricted
/// [`wecom_fs::SandboxedFs`] when not injected (see [`build()`](Self::build)).
/// Transport 由外部预先构建并通过 [`transport()`](Self::transport) 注入；
/// 未注入时 [`build()`](Self::build) 默认使用 [`wecom_transport::HttpTransportBackend`]。
///
/// # Example
///
/// ```rust,no_run
/// # fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let transport = wecom_transport::Transport::from(
///     wecom_transport::HttpTransportBackend::default(),
/// )
/// .with_header("Authorization", "Bearer my-token")?;
///
/// // Note: pass absolute paths — `~` is not expanded.
/// let private_policy = wecom_fs::Policy::new()
///     .with_allowed_dirs(&[std::path::Path::new("/home/user/.config/wecom")]);
///
/// let client = wecom::Client::builder()
///     .config_dir("/home/user/.config/wecom")
///     .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new().with_policy(private_policy)))
///     .workspace_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
///     .transport(transport)
///     .build()?;
/// # Ok(())
/// # }
/// ```
#[derive(Default)]
pub struct ClientBuilder {
    // -- filesystem capabilities --
    private_fs: Option<Arc<dyn crate::fs::Fs>>,
    workspace_fs: Option<Arc<dyn crate::fs::Fs>>,

    // -- paths --
    cwd: Option<PathBuf>,
    config_dir: Option<PathBuf>,
    default_output_dir: Option<PathBuf>,

    // -- cli name --
    /// 外部注入的二进制名（命令名）；未设置时回退 [`constants::DEFAULT_BIN_NAME`]。
    bin_name: Option<String>,

    // -- transport --
    /// 外部注入的 [`wecom_transport::Transport`]。
    /// 设置后 [`build`](Self::build) 直接采用；未设置时默认使用
    /// [`wecom_transport::HttpTransportBackend`]。
    transport: Option<wecom_transport::Transport>,

    // -- endpoint catalog --
    /// 外部注入的内置 endpoint 配置目录；未设置时使用 [`super::EndpointCatalog::default`]。
    endpoint_catalog: Option<super::EndpointCatalog>,

    // -- custom commands --
    custom_commands: Vec<super::CustomCommand>,

    // -- helpers --
    extra_helpers: Vec<Box<dyn crate::helpers::Helper>>,
}

impl ClientBuilder {
    // -- filesystem capabilities --

    /// Inject the filesystem capability for the CLI's own private state —
    /// config, token and discovery cache.
    ///
    /// This instance must never receive externally-derived paths; those
    /// belong to [`workspace_fs()`](Self::workspace_fs). When not injected,
    /// [`build()`](Self::build) falls back to [`default_private_fs`]: a
    /// restricted [`wecom_fs::SandboxedFs`] confined to the effective
    /// `config_dir`, roots-only with **no denylist** (every path in this
    /// domain is code-constructed).
    #[must_use]
    pub fn private_fs(mut self, fs: Arc<dyn crate::fs::Fs>) -> Self {
        self.private_fs = Some(fs);
        self
    }

    /// Inject the filesystem capability for the user workspace and artifact
    /// directories.
    ///
    /// This is the only instance that may receive externally-derived paths
    /// (request payloads, response-derived filenames, CLI `--output`
    /// arguments). When not injected, [`build()`](Self::build) falls back to
    /// [`default_workspace_fs`]: a restricted [`wecom_fs::SandboxedFs`]
    /// whose read and write share one policy — roots are the effective
    /// working directory (see [`cwd()`](Self::cwd)) plus the system
    /// temporary directory, and the denylist is the recommended rule alone
    /// (its built-in table includes the `**/.config/wecom` shape, so the
    /// CLI's default token store stays masked regardless of
    /// `WECOM_CLI_CONFIG_DIR` or `$HOME` redirection).  A root that lands
    /// inside the denylist is not fatal — deny wins over allow, so
    /// operations against it are refused individually.
    #[must_use]
    pub fn workspace_fs(mut self, fs: Arc<dyn crate::fs::Fs>) -> Self {
        self.workspace_fs = Some(fs);
        self
    }

    /// Set the working directory used to anchor relative externally-derived
    /// paths (default: the process working directory).
    ///
    /// The value is pinned once at [`build()`](Self::build): every later
    /// absolutize of CLI arguments, model payloads or helper parameters
    /// resolves against this fixed base — never a late
    /// `std::env::current_dir()` read — so the anchor cannot drift mid-run.
    #[must_use]
    pub fn cwd(mut self, dir: impl Into<PathBuf>) -> Self {
        self.cwd = Some(dir.into());
        self
    }

    /// Returns the currently configured working directory, if any.
    pub fn get_cwd(&self) -> Option<&PathBuf> {
        self.cwd.as_ref()
    }

    /// Set the root configuration directory (default `~/.config/wecom`).
    #[must_use]
    pub fn config_dir(mut self, dir: impl Into<PathBuf>) -> Self {
        self.config_dir = Some(dir.into());
        self
    }

    /// Returns the currently configured home directory, if any.
    pub fn get_config_dir(&self) -> Option<&PathBuf> {
        self.config_dir.as_ref()
    }

    /// Set the default output directory for downloaded files (default:
    /// the working directory — see [`cwd()`](Self::cwd)).
    ///
    /// Downloads (`x-wecom-octet-stream` responses and `x-wecom-file-save`
    /// extractions) land here unless a per-call output directory overrides
    /// it (`--output-dir` / [`RunOptions::output_dir`](crate::RunOptions)).
    /// A relative value is anchored to the effective working directory at
    /// [`build()`](Self::build) time.
    ///
    /// Note: [`default_workspace_fs`] roots cover only the working
    /// directory and the system temporary directory. Pointing the default
    /// output directory outside them requires injecting a matching
    /// [`workspace_fs()`](Self::workspace_fs) instance (the caller extends
    /// the roots; the builder deliberately does not widen the default
    /// sandbox for it).
    #[must_use]
    pub fn default_output_dir(mut self, dir: impl Into<PathBuf>) -> Self {
        self.default_output_dir = Some(dir.into());
        self
    }

    /// Returns the currently configured default output directory, if any.
    pub fn get_default_output_dir(&self) -> Option<&PathBuf> {
        self.default_output_dir.as_ref()
    }

    /// Set the binary name (command name) shown in `--version`, `--help`
    /// and generated `--doc` usage lines.
    ///
    /// Defaults to [`constants::DEFAULT_BIN_NAME`]; embedders (e.g. the `wecom-cli`
    /// binary) should pass `env!("CARGO_BIN_NAME")` here.
    #[must_use]
    pub fn bin_name(mut self, name: impl Into<String>) -> Self {
        self.bin_name = Some(name.into());
        self
    }

    /// Returns the currently configured binary name, if any.
    pub fn get_bin_name(&self) -> Option<&str> {
        self.bin_name.as_deref()
    }

    // -- networking --

    /// Inject a fully-constructed [`wecom_transport::Transport`].
    ///
    /// When set, [`build`](Self::build) uses this transport directly.
    /// When not set, [`build`](Self::build) defaults to
    /// [`wecom_transport::HttpTransportBackend`].
    ///
    /// ```rust,no_run
    /// # fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let transport = wecom_transport::Transport::from(
    ///     wecom_transport::HttpTransportBackend::default(),
    /// )
    /// .with_header("Authorization", "Bearer my-token")?;
    /// let client = wecom::Client::builder().transport(transport).build()?;
    /// # Ok(())
    /// # }
    /// ```
    #[must_use]
    pub fn transport(mut self, transport: wecom_transport::Transport) -> Self {
        self.transport = Some(transport);
        self
    }

    /// Returns the currently configured transport, if any.
    pub fn get_transport(&self) -> Option<&wecom_transport::Transport> {
        self.transport.as_ref()
    }

    /// 整体替换内置 endpoint 配置目录（详见
    /// [`EndpointCatalog`](wecom_transport::EndpointCatalog)）。
    ///
    /// 未调用时 [`build`](Self::build) 使用内建默认表；
    /// 调用后可逐 key 覆写媒体上传 / 下载、服务发现、长任务轮询与
    /// schema 方法默认信封的 endpoint。
    #[must_use]
    pub fn endpoint_catalog(mut self, catalog: super::EndpointCatalog) -> Self {
        self.endpoint_catalog = Some(catalog);
        self
    }

    /// 注册一个扩展命令（自定义顶层子命令）。
    ///
    /// 扩展命令注册在服务发现子命令**之前**：与服务同名的服务子命令会被
    /// 跳过（扩展命令优先）。扩展命令与内置命令（`cache` / `schema`）
    /// 同等待遇：跳过服务发现、参与 clap 帮助体系，命中时由
    /// [`CliRun::execute`](crate::CliRun::execute) 调度到其处理器。
    /// 详见 [`CustomCommand`](super::CustomCommand)。
    #[must_use]
    pub fn command(mut self, command: super::CustomCommand) -> Self {
        self.custom_commands.push(command);
        self
    }

    /// 注册一个额外的 [`Helper`](crate::helpers::Helper)（产品层 `+` 命令）。
    ///
    /// 内置 helper 之外，调用方可注册自己的产品层 helper；与内置 helper
    /// 同等待遇：按命令路径参与 CLI 命令树构建、帮助体系与调度。
    #[must_use]
    pub fn helper(mut self, helper: impl crate::helpers::Helper + 'static) -> Self {
        self.extra_helpers.push(Box::new(helper));
        self
    }

    // -- build --

    /// Build the [`Client`], resolving paths and creating the HTTP client.
    #[tracing::instrument(level = "debug", name = "client.build", skip_all)]
    pub fn build(self) -> Result<Client> {
        tracing::info!("building client");

        // Emit a compile-time warning in test builds when config_dir is not
        // explicitly set.  This helps catch accidental reads from the real
        // ~/.config/wecom directory.
        #[cfg(test)]
        if self.config_dir.is_none() {
            tracing::info!("ClientBuilder::build() called in test without explicit config_dir");
        }

        let config_dir = self.config_dir.unwrap_or_else(|| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".config")
                .join("wecom")
        });

        let cwd = self
            .cwd
            .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

        let default_output_dir = self
            .default_output_dir
            .map(|d| crate::fs::absolutize(&cwd, &d));

        let private_fs = self
            .private_fs
            .unwrap_or_else(|| default_private_fs(&config_dir));

        let workspace_fs = self
            .workspace_fs
            .unwrap_or_else(|| default_workspace_fs(&cwd));

        let mut transport = self
            .transport
            .unwrap_or_else(|| wecom_transport::HttpTransportBackend::default().into());

        if !transport.headers().contains_key("X-WeCom-Cli-Info") {
            transport = transport.with_header(
                "X-WeCom-Cli-Info",
                constants::CLI_INFO.to_json().to_string(),
            )?;
        }

        let mut helper_registry = HelperRegistry::new();
        for helper in self.extra_helpers {
            helper_registry.register(helper);
        }

        let bin_name = self
            .bin_name
            .unwrap_or_else(|| constants::DEFAULT_BIN_NAME.to_string());

        let client = Client {
            // filesystem capabilities
            private_fs,
            workspace_fs,

            // paths
            cwd,
            config_dir,
            default_output_dir,

            // runtime
            bin_name,
            transport,

            // endpoint catalog
            endpoints: Arc::new(self.endpoint_catalog.unwrap_or_default()),

            service_cache: ServiceCache::new(),
            helper_registry,

            // custom commands
            custom_commands: self.custom_commands,
        };

        Ok(client)
    }
}

/// Default [`Fs`](crate::fs::Fs) for the CLI-private domain (config, token,
/// discovery cache) — both the [`ClientBuilder::build`](super::ClientBuilder::build)
/// fallback and the
/// constructor the `wecom-cli` entry point uses for its two-phase startup
/// (the config file is read through this instance before the workspace
/// domain can be configured).
///
/// Roots-only, no denylist: every path in this domain is code-constructed
/// (config / cache / token / approval file names), never model-influenced,
/// so `roots = [config_dir]` is the complete boundary — a deny entry could
/// only fire when `config_dir` itself is pointed at a broad location, and
/// even then the reachable targets are just the CLI's own file names.
pub fn default_private_fs(config_dir: &Path) -> Arc<dyn crate::fs::Fs> {
    Arc::new(wecom_fs::SandboxedFs::confined_to(&[config_dir]))
}

/// Default workspace-domain [`Fs`](crate::fs::Fs) when the embedder injects
/// nothing — the [`ClientBuilder::build`](super::ClientBuilder::build)
/// fallback, exported for harnesses that need the same layout outside
/// `build()`.  The production entry point (`wecom-cli/src/main.rs`)
/// constructs its own policy explicitly (pinned temp root + an additional
/// `config_dir` deny rule) and does not ride this fallback.
///
/// Read and write share one policy: roots = `[cwd, 系统临时目录]`（上传可
/// 引用 mktemp/截图等产物），deny = [`wecom_fs::recommended_deny_rule`]
/// （系统目录 + 凭据形状，含 `**/.config/wecom`，故默认 token 存储与
/// `$HOME`/`WECOM_CLI_CONFIG_DIR` 重定向无关、恒被屏蔽）。deny 恒胜
/// allow：root 落入 deny 不是构造错误，该 root 上的操作被逐次拒绝。
///
/// 需要更多 roots（如 cwd 之外的默认下载目录）时自行构造并经
/// [`ClientBuilder::workspace_fs`](super::ClientBuilder::workspace_fs)
/// 注入——本回退刻意保持最小。
pub fn default_workspace_fs(cwd: &Path) -> Arc<dyn crate::fs::Fs> {
    Arc::new(
        wecom_fs::SandboxedFs::new().with_policy(
            wecom_fs::Policy::new()
                .with_allowed_dirs(&[cwd, std::env::temp_dir().as_path()])
                .with_deny(wecom_fs::recommended_deny_rule()),
        ),
    )
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：ClientBuilder（Client 构建器）
    //!
    //! ### 关键接口
    //! - [ClientBuilder::default] — 创建默认构建器
    //! - [private_fs] / [workspace_fs] — 按域注入文件系统能力实现（可选，缺省回退受限默认实例）
    //! - [default_private_fs] / [default_workspace_fs] — 缺省回退与共给嵌入方使用的构造器
    //! - [config_dir] / [default_output_dir] — 路径设置
    //! - [transport] / [get_transport]  — 注入/获取 Transport
    //! - [build] — 构建最终 Client 实例
    //!
    //! ### 关键分支与异常路径
    //! - build 时未注入 private_fs / workspace_fs → 回退到受限默认 SandboxedFs
    //!   （private 仅 roots=[config_dir] 无 deny——私有域路径全由代码构造；
    //!   workspace 单一 Policy 读写同守：roots=[cwd, 系统临时目录]；deny 仅
    //!   recommended_deny_rule() 一条（内建 glob 表含系统目录、凭据形状与
    //!   **/.config/wecom）；root 落入 deny 时按 deny 逐操作拒绝）
    //! - build 时未注入 transport 则默认使用 HttpTransportBackend
    //! - build 时若未设置 `X-WeCom-Cli-Info` header 则由 [`build`](Self::build) 注入默认值
    //! - build 时未设置 config_dir 则使用 ~/.config/wecom
    //!
    //! ### 上下游交互
    //! - 上游：外部调用方构建 Transport 与 Fs 实现后注入
    //! - 下游：build 产出 Client 实例

    use wecom_transport::{EndpointHttpExt, HttpTransportBackend};

    use super::*;

    /// Build an isolated [`Client`] for unit tests.
    ///
    /// Creates a temporary directory and uses it as `config_dir` and the
    /// sandbox working directory, ensuring the test never touches the real
    /// `~/.config/wecom` directory.
    ///
    /// # Panics
    ///
    /// Panics if the temporary directory cannot be created or the client
    /// fails to build.
    fn build_isolated_client() -> Client {
        isolated_builder()
            .build()
            .expect("build_isolated_client: Client::build failed")
    }

    /// Build an isolated [`ClientBuilder`] (leaked tempdir as `config_dir`/fs cwd).
    fn isolated_builder() -> ClientBuilder {
        let tmp = tempfile::tempdir().expect("failed to create tempdir for test isolation");
        let dir = tmp.path().to_path_buf();
        std::mem::forget(tmp);
        Client::builder().config_dir(&dir)
    }

    // ── Default / New ──

    /// P0：默认 ClientBuilder 的所有可选字段均为 None 或空
    /// 条件：通过 [ClientBuilder::default] 创建实例
    /// 断言：private_fs、workspace_fs、config_dir、default_output_dir、transport 均为 None
    #[test]
    fn default_builder_has_empty_fields() {
        let b = ClientBuilder::default();
        assert!(b.private_fs.is_none());
        assert!(b.workspace_fs.is_none());
        assert!(b.get_config_dir().is_none());
        assert!(b.get_default_output_dir().is_none());
        assert!(b.get_cwd().is_none());
        assert!(b.get_transport().is_none());
    }

    // ── Custom commands / Helpers ──

    /// P1：[ClientBuilder::command] 注册的扩展命令进入 Client，且 handler 可经 handle 调度执行
    /// 条件：注册名为 "auth" 的 [`CustomCommand`] 并 build，随后以 "auth" 的 matches 调用 handle
    /// 断言：`client.custom_commands()` 恰含该命令，name 匹配；handler 被执行
    #[tokio::test]
    async fn command_registers_custom_command_into_client() {
        let called = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
        let called_in_handler = called.clone();
        let client = isolated_builder()
            .command(crate::client::CustomCommand::new(
                clap::Command::new("auth"),
                move |_run, _matches| {
                    let called = called_in_handler.clone();
                    Box::pin(async move {
                        called.store(true, std::sync::atomic::Ordering::SeqCst);
                        Ok(())
                    })
                },
            ))
            .build()
            .unwrap();

        let cmds = client.custom_commands();
        assert_eq!(cmds.len(), 1);
        assert_eq!(cmds[0].name(), "auth");

        let run = client.run(vec!["wecom".into(), "auth".into()]);
        let matches = cmds[0].command().clone().get_matches_from(vec!["auth"]);
        cmds[0].handle(&run, &matches).await.unwrap();
        assert!(
            called.load(std::sync::atomic::Ordering::SeqCst),
            "handler was not invoked"
        );
    }

    /// P1：[ClientBuilder::command] 可注册多个扩展命令，顺序保持，且各自 handler 均可调度
    /// 条件：依次注册 "auth" / "init" 两个扩展命令并 build，随后分别调用 handle
    /// 断言：`client.custom_commands()` 含两者且顺序为注册顺序；两个 handler 均被执行
    #[tokio::test]
    async fn command_registers_multiple_custom_commands_in_order() {
        let client = isolated_builder()
            .command(crate::client::CustomCommand::new(
                clap::Command::new("auth"),
                |_run, _matches| Box::pin(async { Ok(()) }),
            ))
            .command(crate::client::CustomCommand::new(
                clap::Command::new("init"),
                |_run, _matches| Box::pin(async { Ok(()) }),
            ))
            .build()
            .unwrap();

        let cmds = client.custom_commands();
        assert_eq!(cmds.len(), 2);
        assert_eq!(cmds[0].name(), "auth");
        assert_eq!(cmds[1].name(), "init");

        // 逐一调度 handler，覆盖两个注册闭包体
        let run = client.run(vec!["wecom".into()]);
        for (idx, argv) in ["auth", "init"].into_iter().enumerate() {
            let cmd = &client.custom_commands()[idx];
            let matches = cmd.command().clone().get_matches_from(vec![argv]);
            cmd.handle(&run, &matches)
                .await
                .unwrap_or_else(|e| panic!("handler of {argv} failed: {e}"));
        }
    }

    struct NoopHelper;

    impl crate::helpers::Helper for NoopHelper {
        fn path(&self) -> Vec<&'static str> {
            vec!["svc"]
        }
        fn about(&self) -> crate::helpers::HelperMeta {
            crate::helpers::HelperMeta::new("+noop", "A no-op helper")
        }
        fn execute<'a>(
            &'a self,
            _run: &'a crate::client::CliRun<'a>,
            _params: serde_json::Value,
        ) -> std::pin::Pin<Box<dyn std::future::Future<Output = crate::Result<()>> + Send + 'a>>
        {
            Box::pin(async { Ok(()) })
        }
    }

    /// P1：[ClientBuilder::helper] 注册的 helper 进入 Client 的 HelperRegistry
    /// 条件：注册 path=["svc"]、name="+noop" 的 helper 并 build
    /// 断言：`helper_registry().get_helper(&["svc", "+noop"])` 命中；
    ///       注册的 helper 成为顶层分组（`get_helpers_in(&[])` 的 children 含 "svc"）
    ///
    /// 注：本项目默认 `HelperRegistry` 为空（不内置 media helpers），故此处断言注册的
    /// helper 自身成为顶层分组。
    #[tokio::test]
    async fn helper_registers_into_helper_registry() {
        let client = isolated_builder().helper(NoopHelper).build().unwrap();

        let helper = client
            .helper_registry()
            .get_helper(&["svc", "+noop"])
            .expect("registered helper not found in registry");
        let (_, children) = client.helper_registry().get_helpers_in(&[]);
        assert!(
            children.contains("svc"),
            "registered helper should appear as a top-level group"
        );

        let run = client.run(vec!["wecom".into()]);
        helper.execute(&run, serde_json::json!({})).await.unwrap();
    }

    /// P1：[ClientBuilder::helper] 可注册多个 helper，全部进入 HelperRegistry 且均可执行
    /// 条件：注册 path 分别为 ["svc"] 与 ["svc","sub"] 的两个 helper 并 build，
    ///       随后分别调用 execute
    /// 断言：`helper_registry()` 分别按各自路径命中，且两者 execute 均返回 Ok
    #[tokio::test]
    async fn helper_registers_multiple_helpers() {
        struct SubHelper;
        impl crate::helpers::Helper for SubHelper {
            fn path(&self) -> Vec<&'static str> {
                vec!["svc", "sub"]
            }
            fn about(&self) -> crate::helpers::HelperMeta {
                crate::helpers::HelperMeta::new("+sub", "A sub-level no-op helper")
            }
            fn execute<'a>(
                &'a self,
                _run: &'a crate::client::CliRun<'a>,
                _params: serde_json::Value,
            ) -> std::pin::Pin<Box<dyn std::future::Future<Output = crate::Result<()>> + Send + 'a>>
            {
                Box::pin(async { Ok(()) })
            }
        }

        let client = isolated_builder()
            .helper(NoopHelper)
            .helper(SubHelper)
            .build()
            .unwrap();

        let reg = client.helper_registry();
        let first = reg
            .get_helper(&["svc", "+noop"])
            .expect("first helper not registered");
        let second = reg
            .get_helper(&["svc", "sub", "+sub"])
            .expect("second helper not registered");

        // 逐一执行，覆盖两个 helper 的 execute 实现
        let run = client.run(vec!["wecom".into()]);
        first.execute(&run, serde_json::json!({})).await.unwrap();
        second.execute(&run, serde_json::json!({})).await.unwrap();
    }

    // ── config_dir setter/getter ──

    /// P0：config_dir setter/getter 基本功能
    /// 条件：调用 [config_dir]
    /// 断言：[get_config_dir] 返回 [Some]
    #[test]
    fn config_dir_setter_and_getter() {
        let b = ClientBuilder::default().config_dir("/home/user/.config/wecom");
        assert_eq!(
            b.get_config_dir().unwrap(),
            &std::path::PathBuf::from("/home/user/.config/wecom")
        );
    }

    // ── default_output_dir setter/getter ──

    /// P0：default_output_dir setter/getter 基本功能
    /// 条件：调用 [default_output_dir]
    /// 断言：[get_default_output_dir] 返回 [Some]
    #[test]
    fn default_output_dir_setter_and_getter() {
        let b = ClientBuilder::default().default_output_dir("/custom/out");
        assert_eq!(
            b.get_default_output_dir().unwrap(),
            &std::path::PathBuf::from("/custom/out")
        );
    }

    // ── cwd setter/getter ──

    /// P0：cwd setter/getter 基本功能
    /// 条件：调用 [cwd]
    /// 断言：[get_cwd] 返回 [Some]
    #[test]
    fn cwd_setter_and_getter() {
        let b = ClientBuilder::default().cwd("/work/dir");
        assert_eq!(b.get_cwd().unwrap(), &std::path::PathBuf::from("/work/dir"));
    }

    /// P0：[ClientBuilder::build] 未设置 cwd 时回退进程工作目录
    /// 条件：不调用 cwd()
    /// 断言：client.cwd() 等于 std::env::current_dir()
    #[test]
    fn build_defaults_cwd_to_process_working_dir() {
        let client = isolated_builder().build().unwrap();
        assert_eq!(client.cwd(), std::env::current_dir().unwrap().as_path());
    }

    /// P0：[ClientBuilder::build] 显式设置的 cwd 生效于 Client
    /// 条件：调用 cwd(<平台原生绝对路径>)
    /// 断言：client.cwd() 等于设置的值
    #[test]
    fn build_uses_explicit_cwd() {
        // 绝对路径是构造期契约（默认 workspace 沙箱的 debug_assert 要求）。
        #[cfg(unix)]
        let custom = std::path::Path::new("/custom/work");
        #[cfg(windows)]
        let custom = std::path::Path::new(r"C:\custom\work");
        let client = isolated_builder().cwd(custom).build().unwrap();
        assert_eq!(client.cwd(), custom);
    }

    // ── transport ──

    /// P0：transport setter/getter 基本功能
    /// 条件：调用 [transport] 注入 HttpTransportBackend
    /// 断言：[get_transport] 返回 Some，name() 为 "http"
    #[test]
    fn transport_setter_and_getter() {
        let transport: wecom_transport::Transport = HttpTransportBackend::default().into();
        let b = ClientBuilder::default().transport(transport);
        assert_eq!(b.get_transport().unwrap().name(), "http");
    }

    /// P0：[ClientBuilder::build] 注入的 Transport 在 build 后生效
    /// 条件：注入带自定义 base_url 的 HttpTransportBackend
    /// 断言：build() 后 client.transport().name() == "http"
    #[test]
    fn build_uses_injected_transport() -> Result<()> {
        let transport: wecom_transport::Transport = HttpTransportBackend::builder()
            .base_url("http://injected")
            .build()?;
        let client = isolated_builder().transport(transport).build()?;
        assert_eq!(client.transport().name(), "http");
        Ok(())
    }

    /// P0：bin_name setter/getter 基本功能
    /// 条件：调用 [bin_name] 设置 "wecom-test"
    /// 断言：[get_bin_name] 返回 Some("wecom-test")
    #[test]
    fn bin_name_setter_and_getter() {
        let b = ClientBuilder::default().bin_name("wecom-test");
        assert_eq!(b.get_bin_name(), Some("wecom-test"));
    }

    /// P0：[ClientBuilder::build] 未注入 Transport 时默认使用 HttpTransportBackend
    /// 条件：不调用 transport()
    /// 断言：client.transport().name() == "http"
    #[test]
    fn build_defaults_to_http_transport() -> Result<()> {
        let client = isolated_builder().build()?;
        assert_eq!(client.transport().name(), "http");
        Ok(())
    }

    /// P1：[ClientBuilder::build] transport 已携带 X-WeCom-Cli-Info 时不覆写
    /// 条件：注入预置 `X-WeCom-Cli-Info: custom` 的 Transport
    /// 断言：build() 后该 header 值保持 "custom"
    #[test]
    fn build_preserves_existing_cli_info_header() -> Result<()> {
        let transport = HttpTransportBackend::builder()
            .header("X-WeCom-Cli-Info", "custom")
            .build()?;
        let client = isolated_builder().transport(transport).build()?;
        let value = client
            .transport()
            .headers()
            .get("X-WeCom-Cli-Info")
            .and_then(|v| v.to_str().ok());
        assert_eq!(value, Some("custom"));
        Ok(())
    }

    // ── build() ──

    /// P0：[ClientBuilder::build] 注入 fs 后成功构建 Client
    /// 条件：注入 fs，使用默认 ClientBuilder 调用 build()
    /// 断言：返回 Ok(Client)
    #[test]
    fn build_succeeds_with_injected_fs() -> Result<()> {
        let _client = isolated_builder().build()?;
        Ok(())
    }

    /// P1：[ClientBuilder::build] 未注入 private_fs 时回退到受限默认实例（roots = [config_dir]）
    /// 条件：不调用 private_fs()（workspace_fs 已注入）
    /// 断言：build() 返回 Ok，client.private_fs() 可用（默认实例）
    #[test]
    fn build_without_private_fs_falls_back_to_default() {
        let client = ClientBuilder::default()
            .workspace_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
            .build()
            .expect("build without private_fs falls back to a default instance");
        let _ = client.private_fs();
    }

    /// P1：[ClientBuilder::build] 未注入 workspace_fs 时回退到受限默认实例（roots = [cwd]）
    /// 条件：不调用 workspace_fs()（private_fs 已注入）
    /// 断言：build() 返回 Ok，client.workspace_fs() 可用（默认实例）
    #[test]
    fn build_without_workspace_fs_falls_back_to_default() {
        let client = ClientBuilder::default()
            .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
            .build()
            .expect("build without workspace_fs falls back to a default instance");
        let _ = client.workspace_fs();
    }

    /// P1：[ClientBuilder::build] 两个 fs 实例均未注入时双双回退受限默认实例
    /// 条件：不调用 private_fs() / workspace_fs()；cwd 用独立临时目录，
    ///       config_dir 用 .config/wecom 形状目录（形状 deny 与 roots 无关）
    /// 断言：workspace_fs 读写 roots 均含 cwd 与系统临时目录（读写对称）；
    ///       config_dir 经形状 deny 对 workspace_fs 返回 Err(Permission)；
    ///       private_fs 读 config_dir 内路径返回非 Permission，读 cwd 下文件返回 Err(Permission)；
    ///       两者均挂推荐 denylist（Unix：读 /etc/hosts 返回 Err(Permission)）
    #[tokio::test]
    #[allow(clippy::disallowed_methods)] // 测试夹具：直接落盘造越界文件，不经沙箱
    async fn build_without_any_fs_uses_restricted_defaults() {
        let cwd = tempfile::tempdir().unwrap();
        let config_dir = tempfile::tempdir().unwrap().path().join(".config/wecom");
        std::fs::create_dir_all(&config_dir).unwrap();
        let client = ClientBuilder::default()
            .config_dir(&config_dir)
            .cwd(cwd.path())
            .build()
            .expect("build without any fs falls back to restricted default instances");

        // workspace_fs：cwd 在 roots 内（文件不存在 → Io 错误而非 Permission）。
        let err = client
            .workspace_fs()
            .read_to_string(&cwd.path().join("missing.txt"))
            .await
            .unwrap_err();
        assert!(
            !matches!(err, wecom_fs::Error::Permission(_)),
            "cwd must stay inside workspace roots, err = {err}"
        );
        // workspace_fs：系统临时目录在 roots 内（文件不存在 → Io 错误而非 Permission）。
        let err = client
            .workspace_fs()
            .read_to_string(&std::env::temp_dir().join("missing.txt"))
            .await
            .unwrap_err();
        assert!(
            !matches!(err, wecom_fs::Error::Permission(_)),
            "system temp dir must stay inside default roots, err = {err}"
        );
        // workspace_fs：写侧同样含系统临时目录（读写对称）。
        client
            .workspace_fs()
            .create_file(&std::env::temp_dir().join("wecom-write-probe.txt"))
            .await
            .expect("system temp dir must be writable by the default instance");
        std::fs::remove_file(std::env::temp_dir().join("wecom-write-probe.txt")).unwrap();
        // workspace_fs：config_dir 经形状 deny 屏蔽（即使在读根内也不放行）。
        std::fs::write(config_dir.join("secret.txt"), "x").unwrap();
        let err = client
            .workspace_fs()
            .read_to_string(&config_dir.join("secret.txt"))
            .await
            .unwrap_err();
        assert!(
            matches!(err, wecom_fs::Error::Permission(_)),
            "config_dir shape must stay denied, err = {err}"
        );

        // private_fs：config_dir 在 roots 内（文件不存在 → Io 错误而非 Permission）。
        let err = client
            .private_fs()
            .read_to_string(&config_dir.join("missing.txt"))
            .await
            .unwrap_err();
        assert!(
            !matches!(err, wecom_fs::Error::Permission(_)),
            "config_dir must stay inside private roots, err = {err}"
        );
        // private_fs：进程 cwd 下的文件在 roots 外。
        let cwd_file = std::env::current_dir().unwrap().join("Cargo.toml");
        let err = client
            .private_fs()
            .read_to_string(&cwd_file)
            .await
            .unwrap_err();
        assert!(
            matches!(err, wecom_fs::Error::Permission(_)),
            "cwd file must be outside private roots, err = {err}"
        );

        // 两个默认实例都挂推荐 denylist（Unix：/etc 在列表内）。
        #[cfg(unix)]
        {
            for (name, fs) in [
                ("private", client.private_fs()),
                ("workspace", client.workspace_fs()),
            ] {
                let err = fs
                    .read_to_string(std::path::Path::new("/etc/hosts"))
                    .await
                    .unwrap_err();
                assert!(
                    matches!(err, wecom_fs::Error::Permission(_)),
                    "{name} default instance must carry the recommended denylist, err = {err}"
                );
            }
        }
    }

    /// P1：[ClientBuilder::build] 默认配置目录位于 cwd 内仍被形状规则 deny（deny 压过 roots allow）
    /// 条件：不注入 fs，config_dir 位于 cwd 内且为 .config/wecom 形状（cwd/.config/wecom）
    /// 断言：workspace_fs 读 config_dir 内文件返回 Err(Permission)；cwd 内普通文件仍可读
    #[tokio::test]
    #[allow(clippy::disallowed_methods)] // 测试夹具：直接落盘造文件，不经沙箱
    async fn default_workspace_fs_denies_config_dir_inside_cwd() {
        let cwd = tempfile::tempdir().unwrap();
        let config = cwd.path().join(".config/wecom");
        std::fs::create_dir_all(&config).unwrap();
        std::fs::write(config.join("token"), "secret").unwrap();
        std::fs::write(cwd.path().join("ok.txt"), "fine").unwrap();

        let client = ClientBuilder::default()
            .cwd(cwd.path())
            .config_dir(&config)
            .build()
            .expect("build with config_dir inside cwd");

        let err = client
            .workspace_fs()
            .read_to_string(&config.join("token"))
            .await
            .unwrap_err();
        assert!(
            matches!(err, wecom_fs::Error::Permission(_)),
            "config_dir must be denied even inside workspace roots, err = {err}"
        );

        let content = client
            .workspace_fs()
            .read_to_string(&cwd.path().join("ok.txt"))
            .await
            .expect("ordinary cwd file must stay readable");
        assert_eq!(content, "fine");
    }

    /// P1：[ClientBuilder::build] 默认配置目录按形状 deny：任意基座的 .config/wecom 都读不到（与 $HOME 无关）
    /// 条件：config_dir 重定向到独立临时目录（≠ 默认位置），build 默认实例
    /// 断言：读 <env_home>/.config/wecom/config.json 与 <cwd>/.config/wecom/config.json
    ///       均 Err(Permission)；二者均非生效 config_dir，命中纯靠形状规则
    #[tokio::test]
    async fn default_workspace_fs_denies_config_dir_shape_at_any_base() {
        let Some(home) = std::env::home_dir() else {
            return; // env home 不可解析时本用例无意义（CI 恒可解析）
        };
        let decoy = tempfile::tempdir().unwrap();

        let client = Client::builder()
            .config_dir(decoy.path())
            .build()
            .expect("build with redirected config_dir");
        let targets = [
            home.join(".config").join("wecom").join("config.json"),
            std::env::current_dir()
                .unwrap()
                .join(".config/wecom/config.json"),
        ];
        for target in &targets {
            let err = client
                .workspace_fs()
                .read_to_string(target)
                .await
                .unwrap_err();
            assert!(
                matches!(err, wecom_fs::Error::Permission(_)),
                "{} must stay denied after config_dir redirection, err = {err}",
                target.display()
            );
        }
    }

    /// P1：build() 设置的 default_output_dir 正确传递到 Client
    /// 条件：设置 default_output_dir（平台原生绝对路径）后 build()
    /// 断言：Client 的 default_output_dir() 等于设置的值
    #[test]
    fn build_passes_default_output_dir_to_client() -> Result<()> {
        // 绝对路径是构造期契约（默认 workspace 沙箱的 debug_assert 要求）。
        #[cfg(unix)]
        let custom = std::path::Path::new("/custom/out");
        #[cfg(windows)]
        let custom = std::path::Path::new(r"C:\custom\out");
        let client = isolated_builder().default_output_dir(custom).build()?;
        assert_eq!(client.default_output_dir(), Some(custom));
        Ok(())
    }

    /// P1：[ClientBuilder::build] 仅设置 config_dir 与两个 fs 实例即可构建
    /// 条件：仅设置 config_dir、private_fs 和 workspace_fs，不设置其他可选字段
    /// 断言：build() 返回 Ok
    #[test]
    fn build_without_any_config_succeeds() {
        let tmp = tempfile::tempdir().unwrap();
        let result = ClientBuilder::default().config_dir(tmp.path()).build();
        assert!(result.is_ok());
    }

    // ── builtin endpoint resolution ──

    /// P0：[ClientBuilder::build] 后 resolve_builtin_endpoint(ServiceDiscovery) 返回内建默认值
    /// 条件：使用默认 builder 调用 build()
    /// 断言：endpoint.path == "/service/discovery"（内建默认表兜底）
    #[test]
    fn build_default_discovery_endpoint_returns_builtin_values() {
        let client = build_isolated_client();
        let ep = client.resolve_builtin_endpoint(crate::client::EndpointKey::ServiceDiscovery);
        // base_url on endpoint is None (transport fills)
        assert_eq!(ep.base_url(), "");
        assert_eq!(ep.path(), "/service/discovery");
    }

    /// P0：[ClientBuilder::endpoint_catalog] 注入的目录生效于 ServiceDiscovery 解析
    /// 条件：覆写 ServiceDiscovery path 为 "/sd/v2" 后 build()
    /// 断言：resolve_builtin_endpoint(ServiceDiscovery).path() == "/sd/v2"
    #[test]
    fn endpoint_catalog_overrides_discovery_endpoint() {
        let client = isolated_builder()
            .endpoint_catalog(crate::client::EndpointCatalog::default().with(
                crate::client::EndpointKey::ServiceDiscovery,
                wecom_transport::Endpoint::new().with(wecom_transport::HttpEndpoint::new("/sd/v2")),
            ))
            .build()
            .unwrap();
        assert_eq!(
            client
                .resolve_builtin_endpoint(crate::client::EndpointKey::ServiceDiscovery)
                .path(),
            "/sd/v2"
        );
    }
}
