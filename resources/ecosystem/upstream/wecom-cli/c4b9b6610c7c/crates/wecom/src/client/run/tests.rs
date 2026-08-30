//! ## 模块摘要：run（CLI 入口、CliRun 与 RunOutput）
//!
//! ### 关键接口
//! - [Client::run] — 创建 [CliRun]，支持 `.await` 或 `.headers()` / `.header()` / `.timeout()` / `.on_poll()` 链式调用
//! - `CliRun` — inherent `.headers()` / `.header()` / `.timeout()` / `.on_poll()` methods (via `impl_request_builder!` macro)
//! - [CliRun::execute] — 执行 CLI 命令（可由 [IntoFuture] 自动调用）
//! - `IntoFuture for CliRun` — 支持 `.await` 语法
//! - [CliRunOutput::default] — 默认 stdout + 自动检测颜色
//! - [CliRunOutput::new] — 自定义 writer，颜色默认关闭
//! - [CliRunOutput::stdout] — 等同于 default
//! - [CliRunOutput::from_writer_arc] — 从预构建 Writer arc 创建
//! - [CliRunOutput::force_color] — 强制开关颜色（builder pattern）
//! - [CliRunOutput::print] — 写入一行文本
//! - `CliRun::build_root_cmd` — 纯同步构建根命令树（可重复调用，每次产出 pristine 树）
//! - [resolve_subcmd_path] — 错误分支用「放松树 + 二次解析」得到 clap 权威子命令路径
//! - `normalize_help_subcommand` — 剥离 help 子命令 token（relax 树中已禁用）
//!
//! ### 关键分支与异常路径
//! - `argv` 含 `-V` / `--version` → 输出版本号并提前返回
//! - 子命令未找到 → 动态注册服务子命令后重试匹配
//! - clap 解析失败 → [resolve_subcmd_path] 二次解析得到规范路径，再走 [CliRun::handle_parse_error]
//! - 子命令匹配失败 → 返回 [Error::CliOutput]（携带预渲染 message 与原始 `clap::Error` 作为 source；非错误路径）或 [Error::Other]
//! - 后台返回 10021 → Error::CliOutput(code=2)，渲染「error 行 + 当前命令 help」
//! - clap 解析错误（未知子命令 / 未知 flag / flag 在 service 名前）→ [resolve_subcmd_path] 得到 path
//! - `headers` 非空 → 通过 [CliRun] 传递给下游
//! - 自定义 writer 默认 force_color=false
//! - stdout 默认 force_color=is_terminal()
//! - print 在 writer poisoned 时不 panic
//! - service alias 统一注册为 clap hidden alias（与目标服务无关），解析归一化为
//!   规范名；与预占名（扩展命令 / 服务规范名 / 内置子命令）冲突或跨服务重复时跳过
//! - first_arg 未命中任何服务时 service_info 为 None（不回退为 first_arg），
//!   remote_doc 不介入
//!
//! ### 上下游交互
//! - 上游：binary `wecom` 的 `main()` 调用 `client.run(argv).await`
//! - 下游：委托 `crate::commands::cache`、`crate::commands::schema`、`crate::service::handle_service_cmd` 处理具体子命令

use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};

use clap::Command;

use super::parse_error::{normalize_help_subcommand, resolve_subcmd_path};
use super::*;
use crate::client::custom_command::CustomCommand;
use crate::registry::{ServiceInfo, ServiceSchema};

/// Build an isolated [Client] for unit tests.
///
/// Uses a leaked tempdir as `config_dir` so that tests never touch
/// the real `~/.config/wecom` directory.
fn build_isolated_client() -> Client {
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path().to_path_buf();
    std::mem::forget(tmp);
    Client::builder().config_dir(&dir).build().unwrap()
}

// ── CliRunOutput ──

/// A cloneable, `Write`-compatible buffer for capturing output in tests.
#[derive(Clone)]
struct SharedBuf(Arc<Mutex<Vec<u8>>>);

impl SharedBuf {
    fn new() -> Self {
        Self(Arc::new(Mutex::new(Vec::new())))
    }
    fn contents(&self) -> String {
        String::from_utf8_lossy(&self.0.lock().unwrap()).to_string()
    }
}

impl std::io::Write for SharedBuf {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.0.lock().unwrap().write(buf)
    }
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

/// P0：[CliRunOutput::new] 自定义 writer 默认 force_color 为 false
/// 条件：使用 Vec<u8> 创建 CliRunOutput
/// 断言：is_force_color() 返回 false
#[test]
fn new_custom_writer_disables_color() {
    let output = CliRunOutput::new(Vec::<u8>::new());
    assert!(!output.is_force_color());
}

/// P0：[CliRunOutput::force_color] builder 方法正确设置颜色
/// 条件：创建后调用 .force_color(true)
/// 断言：is_force_color() 返回 true
#[test]
fn force_color_builder_sets_flag() {
    let output = CliRunOutput::new(Vec::<u8>::new()).force_color(true);
    assert!(output.is_force_color());
}

/// P0：[CliRunOutput::print] 写入内容到自定义 writer
/// 条件：使用 SharedBuf 创建 RunOutput，调用 print("hello")
/// 断言：writer 中包含 "hello\n"
#[test]
fn print_writes_to_custom_writer() {
    let buf = SharedBuf::new();
    let output = CliRunOutput::new(buf.clone());
    output.print("hello");
    assert_eq!(buf.contents(), "hello\n");
}

/// P1：测试夹具 SharedBuf 的 flush 为 no-op（保持 Write 契约）
/// 条件：对 SharedBuf 调用 flush
/// 断言：返回 Ok(())
#[test]
fn shared_buf_flush_is_noop() {
    let mut buf = SharedBuf::new();
    assert!(std::io::Write::flush(&mut buf).is_ok());
}

/// P1：[CliRunOutput::from_writer_arc] 从预构建 arc 创建
/// 条件：传入预构建的 Writer arc
/// 断言：writer() 返回相同的 arc
#[test]
fn from_writer_arc_shares_reference() {
    let buf: Writer = Arc::new(Mutex::new(Box::new(std::io::sink())));
    let output = CliRunOutput::from_writer_arc(buf.clone());
    assert!(Arc::ptr_eq(output.writer(), &buf));
}

/// P1：[CliRunOutput::stdout] 等价于 default，且 clone_shared 共享同一 writer
/// 条件：调用 stdout() 再 clone_shared()
/// 断言：clone 与原件指向同一 writer Arc，force_color 相同
#[test]
fn stdout_and_clone_shared_share_writer() {
    let output = CliRunOutput::stdout();
    let shared = output.clone_shared();

    assert!(std::sync::Arc::ptr_eq(shared.writer(), output.writer()));
    assert_eq!(shared.is_force_color(), output.is_force_color());
}

/// P1：[CliRunOutput] 实现 Debug
/// 条件：创建 CliRunOutput
/// 断言：Debug 输出包含 "CliRunOutput" 和 "force_color"
#[test]
fn debug_impl() {
    let output = CliRunOutput::new(std::io::sink());
    let debug = format!("{output:?}");
    assert!(debug.contains("CliRunOutput"));
    assert!(debug.contains("force_color"));
}

/// P1：[CliRunOutput::render_styled] force_color 关闭时剥离 ANSI 样式
/// 条件：构造带色 StyledStr，output 未开启 force_color
/// 断言：返回串不含 ESC(\x1b) 转义，仅保留纯文本
#[test]
fn render_styled_strips_ansi_when_color_off() {
    let mut styled = clap::builder::StyledStr::new();
    use std::fmt::Write;
    write!(styled, "hello").unwrap();
    let output = CliRunOutput::new(Vec::<u8>::new());
    let rendered = output.render_styled(&styled);
    assert!(!rendered.contains('\u{1b}'));
    assert_eq!(rendered, "hello");
}

/// P1：[CliRunOutput::render_styled] force_color=true 时保留 StyledStr 的 ANSI
/// 条件：构造 force_color(true) 的 output，传入无 ANSI 的 StyledStr
/// 断言：渲染结果与原文本一致（ansi() 在无转义时返回原文）
#[test]
fn render_styled_forced_color_keeps_text() {
    let output = CliRunOutput::new(Vec::<u8>::new()).force_color(true);
    let styled = clap::builder::StyledStr::from("plain");

    assert_eq!(output.render_styled(&styled), "plain");
}

/// P1：[CliRunOutput::print_styled] 委托 render_styled，写入 color-aware 文本
/// 条件：force_color 关闭，print_styled 一段带色 StyledStr
/// 断言：writer 内容为纯文本 + 换行，不含 ANSI 转义
#[test]
fn print_styled_writes_color_aware_text() {
    use std::fmt::Write;
    let mut styled = clap::builder::StyledStr::new();
    write!(styled, "world").unwrap();
    let buf = SharedBuf::new();
    let output = CliRunOutput::new(buf.clone());
    output.print_styled(&styled);
    assert_eq!(buf.contents(), "world\n");
    assert!(!buf.contents().contains('\u{1b}'));
}

// ── Client::run() ──

/// P1：[Client::run] 返回 CliRun 实例
/// 条件：调用 client.run(vec!["test"])
/// 断言：返回值类型实现了 IntoFuture
#[test]
fn run_returns_cli_run() {
    // 验证 CliRun 实现了 IntoFuture
    fn assert_into_future<T: std::future::IntoFuture>(_: &T) {}
    let client = build_isolated_client();
    let cli_run = client.run(vec!["test".into()]);
    assert_into_future(&cli_run);
}

/// P1：[CliRun] get_fs / fs 覆盖 / Debug 格式化可正常调用
/// 条件：构造 CliRun 后调用 get_fs、以新实例调用 fs 覆盖，并格式化 Debug
/// 断言：不 panic，Debug 输出包含 "CliRun"；fs 覆盖替换实例
#[test]
fn cli_run_fs_override_and_debug() {
    let client = build_isolated_client();
    let before = std::sync::Arc::clone(client.workspace_fs());
    let mut run = client.run(vec!["wecom".to_owned()]);

    let _ = run.get_fs();
    run = run.fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()));
    let debug = format!("{run:?}");
    assert!(debug.contains("CliRun"));
    assert!(!std::sync::Arc::ptr_eq(run.get_fs(), &before));
}

/// P1：[CliRun::get_cwd] 未覆盖时返回 client 钉死的工作目录
/// 条件：ClientBuilder 显式设置 cwd，run 不调用 .cwd()
/// 断言：run.get_cwd() 等于 client.cwd()
#[test]
fn cli_run_cwd_forwards_client_value() {
    let tmp = tempfile::tempdir().unwrap();
    let config = tempfile::tempdir().unwrap();
    let client = Client::builder()
        .config_dir(config.path())
        .cwd(tmp.path())
        .build()
        .unwrap();
    let run = client.run(vec!["wecom".to_owned()]);
    assert_eq!(run.get_cwd(), client.cwd());
    assert_eq!(run.get_cwd(), tmp.path());
}

/// P1：[CliRun::get_cwd] run 级覆盖生效且不影响 client 值
/// 条件：run 调用 .cwd("/other/dir")
/// 断言：run.get_cwd() 返回 "/other/dir"；client.cwd() 不变
#[test]
fn cli_run_cwd_override_takes_precedence() {
    let tmp = tempfile::tempdir().unwrap();
    let config = tempfile::tempdir().unwrap();
    let client = Client::builder()
        .config_dir(config.path())
        .cwd(tmp.path())
        .build()
        .unwrap();
    let run = client.run(vec!["wecom".to_owned()]).cwd("/other/dir");
    assert_eq!(run.get_cwd(), std::path::Path::new("/other/dir"));
    assert_eq!(client.cwd(), tmp.path());
}

/// P1：[CliRun::get_fs] 未覆盖时返回 client 注入的 fs 实例
/// 条件：构造 CliRun 后不调用 .fs()
/// 断言：run.get_fs() 与 client 注入实例为同一 Arc（Arc::ptr_eq）
#[test]
fn cli_run_get_fs_defaults_to_client_instance() {
    let client = Client::builder()
        .private_fs(std::sync::Arc::new(crate::fs::testing::ErrFs))
        .workspace_fs(std::sync::Arc::new(crate::fs::testing::ErrFs))
        .build()
        .unwrap();
    let before = std::sync::Arc::clone(client.workspace_fs());

    let run = client.run(vec!["wecom".to_owned()]);

    assert!(std::sync::Arc::ptr_eq(run.get_fs(), &before));
    // 工作区实例与私有实例互不串扰：run 侧只能触及 workspace_fs。
    assert!(!std::sync::Arc::ptr_eq(run.get_fs(), client.private_fs()));
}

// ── Path overrides ──

/// P0：[CliRun::get_config_dir] 返回 client 的 config_dir
/// 条件：config_dir 仅 client 级可配
/// 断言：get_config_dir() 等于 client.config_dir()
#[test]
fn get_config_dir_defaults_to_client() {
    let client = build_isolated_client();
    let run = client.run(vec!["test".into()]);
    assert_eq!(run.get_config_dir(), client.config_dir());
}

/// P0：[CliRun::get_default_output_dir] 未配置时读时回退到 run 的 cwd
/// 条件：client 未配置 default_output_dir
/// 断言：get_default_output_dir() 等于 run.get_cwd()；run 级 .cwd() 覆盖生效
#[test]
fn get_default_output_dir_falls_back_to_cwd() {
    let client = build_isolated_client();
    let run = client.run(vec!["test".into()]);
    assert_eq!(run.get_default_output_dir(), run.get_cwd());

    let run = client
        .run(vec!["test".into()])
        .cwd(std::path::PathBuf::from("/custom/cwd"));
    assert_eq!(
        run.get_default_output_dir(),
        std::path::Path::new("/custom/cwd")
    );
}

/// P0：[CliRun::get_default_output_dir] 返回 client 配置的 default_output_dir
/// 条件：client 经 default_output_dir() 配置（仅 client 级可配）
/// 断言：get_default_output_dir() 等于配置目录
#[test]
fn get_default_output_dir_returns_configured() {
    let tmp = tempfile::tempdir().unwrap();
    let client = crate::Client::builder()
        .config_dir(tmp.path().join("config"))
        .default_output_dir(tmp.path().join("out"))
        .build()
        .unwrap();
    let run = client.run(vec!["test".into()]);
    assert_eq!(
        run.get_default_output_dir(),
        tmp.path().join("out").as_path()
    );
}

/// P0：[CliRun::get_cache_dir] 派生自 client 的 config_dir
/// 条件：config_dir 仅 client 级可配
/// 断言：get_cache_dir() 等于 client.cache_dir()
#[test]
fn get_cache_dir_defaults_to_client_derived() {
    let client = build_isolated_client();
    let run = client.run(vec!["test".into()]);
    assert_eq!(run.get_cache_dir(), client.cache_dir());
}

// ── timeout（每笔独立请求超时） ──

/// P0：[CliRun::timeout] 链式 setter 把 Duration 写入 self.timeout
/// 条件：调用 .timeout(Duration::from_secs(7))
/// 断言：get_timeout() 返回 Some(7s)
#[test]
fn timeout_setter_writes_field() {
    let client = build_isolated_client();
    let run = client
        .run(vec!["test".into()])
        .timeout(std::time::Duration::from_secs(7));
    assert_eq!(run.get_timeout(), Some(std::time::Duration::from_secs(7)));
}

/// P0：[CliRun::get_timeout] 未调用 .timeout() 时为 None
/// 条件：构造 CliRun 后不设置 timeout
/// 断言：get_timeout() 返回 None
#[test]
fn timeout_default_none() {
    let client = build_isolated_client();
    let run = client.run(vec!["test".into()]);
    assert!(run.get_timeout().is_none());
}

/// P1：[CliRun::timeout] 与 .header() 等其他 setter 可链式叠加
/// 条件：先 .timeout(5s)，再 .header("x-a", "1")
/// 断言：timeout / headers 各自正确生效
#[test]
fn timeout_chains_with_other_setters() {
    let client = build_isolated_client();
    let run = client
        .run(vec!["test".into()])
        .timeout(std::time::Duration::from_secs(5))
        .header("x-a", "1");
    assert_eq!(run.get_timeout(), Some(std::time::Duration::from_secs(5)));
    let hdrs = run.get_headers();
    assert_eq!(hdrs.get("x-a").unwrap().to_str().unwrap(), "1");
}

/// P1：[CliRun::timeout] 多次调用后写覆盖前写
/// 条件：先 .timeout(3s)，再 .timeout(11s)
/// 断言：get_timeout() 返回 Some(11s)
#[test]
fn timeout_last_one_wins() {
    let client = build_isolated_client();
    let run = client
        .run(vec!["test".into()])
        .timeout(std::time::Duration::from_secs(3))
        .timeout(std::time::Duration::from_secs(11));
    assert_eq!(run.get_timeout(), Some(std::time::Duration::from_secs(11)));
}

// ── extensions（run 级写入 options；默认层归 transport 构建期） ──

/// P1：[CliRun::extension] run 级扩展值写入 options
/// 条件：client.run() 后调用 .extension(RunExt(2))
/// 断言：cli_run.options.extensions.get::<RunExt>() 为 Some(2)
#[test]
fn run_level_extension_written_to_options() {
    let client = build_isolated_client();
    let run = client.run(vec!["test".into()]).extension(RunExt(2));
    assert_eq!(run.options.extensions.get::<RunExt>(), Some(&RunExt(2)));
}

/// P1：[Client::run] 未注入扩展时袋为空
/// 条件：build_isolated_client()（无扩展）
/// 断言：cli_run.options.extensions.is_empty() 为 true
#[test]
fn run_extensions_default_empty() {
    let client = build_isolated_client();
    let run = client.run(vec!["test".into()]);
    assert!(run.options.extensions.is_empty());
}

// ── extensions 端到端：CliRun → 全部请求 → 后端 execute ──

/// 测试夹具：合法的服务 schema JSON（detail 缓存与 discovery 响应共用）。
fn svc_schema_json() -> serde_json::Value {
    serde_json::json!({
        "description": "test service",
        "base_url": "https://test.example.com/",
        "methods": { "list": { "http_method": "GET", "path": "/list" } },
        "resources": {}
    })
}

/// 测试夹具：记录每次 execute 收到的 RequestOptions 的捕获型后端。
///
/// 对 payload 含 `"service"` 键的 discovery 请求返回合法 schema，
/// 其余（业务）请求返回空 JSON 对象。
#[derive(Debug)]
struct CaptureBackend {
    captured: std::sync::Arc<std::sync::Mutex<Vec<wecom_transport::RequestOptions>>>,
}

impl wecom_transport::TransportBackend for CaptureBackend {
    fn execute<'a>(
        &'a self,
        _endpoint: std::borrow::Cow<'a, wecom_transport::Endpoint>,
        payload: wecom_transport::HttpRequestPayload,
        options: wecom_transport::RequestOptions,
    ) -> std::pin::Pin<
        Box<
            dyn std::future::Future<
                    Output = std::result::Result<
                        wecom_transport::TransportResponse,
                        wecom_transport::Error,
                    >,
                > + Send
                + 'a,
        >,
    > {
        self.captured.lock().unwrap().push(options);
        Box::pin(async move {
            let data = payload.build().await.unwrap();
            let is_discovery = matches!(
                &data,
                wecom_transport::HttpRequestBody::Json(v) if v.get("service").is_some()
            );
            let result = if is_discovery {
                svc_schema_json()
            } else {
                serde_json::json!({})
            };
            Ok(wecom_transport::TransportResponse::Json(
                wecom_transport::ExecuteOutput {
                    result,
                    extra: indexmap::IndexMap::new(),
                },
            ))
        })
    }
}

/// 测试夹具：播种 catalog 缓存（list_services 无需网络）。
fn seed_run_catalog_cache(root: &std::path::Path, service: &str) {
    seed_run_catalog_cache_multi(root, &[service]);
}

/// 测试夹具：播种多服务 catalog 缓存（list_services 无需网络）。
fn seed_run_catalog_cache_multi(root: &std::path::Path, services: &[&str]) {
    let cache_dir = root.join("cache");
    std::fs::create_dir_all(&cache_dir).unwrap();
    let items: Vec<serde_json::Value> = services
        .iter()
        .map(|s| serde_json::json!({ "name": s }))
        .collect();
    #[allow(clippy::disallowed_methods)] // Test helper: write fixture outside sandbox
    std::fs::write(
        cache_dir.join("catalog.json"),
        serde_json::to_string(&serde_json::json!({ "items": items })).unwrap(),
    )
    .unwrap();
}

/// 测试夹具：播种服务 detail 缓存（schema 拉取无需网络）。
fn seed_run_detail_cache(root: &std::path::Path, service: &str) {
    seed_detail_cache_with(root, service, &svc_schema_json());
}

/// 测试夹具：以指定 schema JSON 播种服务 detail 缓存。
fn seed_detail_cache_with(root: &std::path::Path, service: &str, schema: &serde_json::Value) {
    let cache_dir = root.join("cache");
    std::fs::create_dir_all(&cache_dir).unwrap();
    let detail = cache_dir.join(format!(
        "service_{}.json",
        crate::fs::sanitize_filename(service)
    ));
    #[allow(clippy::disallowed_methods)] // Test helper: write fixture outside sandbox
    std::fs::write(detail, serde_json::to_string(schema).unwrap()).unwrap();
}

/// 测试夹具：捕获型后端 + 共享 captured 缓冲 + client 构造。
///
/// `seed_detail` 为 false 时仅播种 catalog，schema 拉取会真实经过后端。
fn build_capture_client(
    ext: RunExt,
    seed_detail: bool,
) -> (
    Client,
    std::sync::Arc<std::sync::Mutex<Vec<wecom_transport::RequestOptions>>>,
) {
    let tmp = tempfile::tempdir().unwrap();
    let root = tmp.path().to_path_buf();
    std::mem::forget(tmp);
    seed_run_catalog_cache(&root, "svc");
    if seed_detail {
        seed_run_detail_cache(&root, "svc");
    }
    let captured = std::sync::Arc::new(std::sync::Mutex::new(vec![]));
    let backend = CaptureBackend {
        captured: captured.clone(),
    };
    let client = Client::builder()
        .config_dir(&root)
        .transport(
            wecom_transport::TransportBuilder::new(backend)
                .extension(ext)
                .build()
                .unwrap(),
        )
        .build()
        .unwrap();
    (client, captured)
}

/// P0：[CliRun → TransportRequest] transport 默认扩展袋经业务调用到达后端 execute
/// 条件：捕获型后端 + 已播种缓存；TransportBuilder 级 RunExt(1)，run 级不设置
/// 断言：execute 恰好收到 1 次请求，options.extensions 含 RunExt(1)
#[tokio::test]
async fn run_transport_extensions_reach_backend_execute() {
    let (client, captured) = build_capture_client(RunExt(1), true);
    client
        .run(vec!["wecom".into(), "svc".into(), "list".into()])
        .execute()
        .await
        .unwrap();
    let captured = captured.lock().unwrap();
    assert_eq!(captured.len(), 1, "expect exactly one business request");
    assert_eq!(captured[0].extensions.get::<RunExt>(), Some(&RunExt(1)));
}

/// P0：[CliRun → TransportRequest] run 级 options 全字段覆盖后到达后端 execute
/// 条件：捕获型后端 + 已播种缓存；transport 级 RunExt(1)；run 级
///       .extension(RunExt(2)) + .header("x-run-scope","yes") + .timeout(7s)
/// 断言：execute 收到的 options 中扩展袋 / header / timeout 全部为 run 级值
#[tokio::test]
async fn run_level_options_override_reaches_backend_execute() {
    let (client, captured) = build_capture_client(RunExt(1), true);
    client
        .run(vec!["wecom".into(), "svc".into(), "list".into()])
        .extension(RunExt(2))
        .header("x-run-scope", "yes")
        .timeout(std::time::Duration::from_secs(7))
        .execute()
        .await
        .unwrap();
    let captured = captured.lock().unwrap();
    assert_eq!(captured.len(), 1, "expect exactly one business request");
    let got = &captured[0];
    assert_eq!(got.extensions.get::<RunExt>(), Some(&RunExt(2)));
    assert_eq!(got.wire.headers.get("x-run-scope").unwrap(), "yes");
    assert_eq!(got.wire.timeout, Some(std::time::Duration::from_secs(7)));
}

/// P0：[CliRun → discovery] run 级 options 对 run 触发的 discovery 请求同样生效
/// 条件：捕获型后端；仅播种 catalog（detail 拉取真实经过后端）；transport 级
///       RunExt(1)；run 级 .extension(RunExt(2)) + .header("x-run-scope","yes")
/// 断言：恰好 2 次请求（discovery detail + 业务），两次请求的 options 均含
///       RunExt(2) 与 x-run-scope 头
#[tokio::test]
async fn run_level_options_reach_discovery_fetch() {
    let (client, captured) = build_capture_client(RunExt(1), false);
    client
        .run(vec!["wecom".into(), "svc".into(), "list".into()])
        .extension(RunExt(2))
        .header("x-run-scope", "yes")
        .execute()
        .await
        .unwrap();
    let captured = captured.lock().unwrap();
    assert_eq!(
        captured.len(),
        2,
        "expect discovery detail fetch + business request"
    );
    for (i, got) in captured.iter().enumerate() {
        assert_eq!(
            got.extensions.get::<RunExt>(),
            Some(&RunExt(2)),
            "request #{i} 扩展袋应为 run 级值"
        );
        assert_eq!(
            got.wire.headers.get("x-run-scope").unwrap(),
            "yes",
            "request #{i} header 应为 run 级值"
        );
    }
}

/// 测试夹具：run 扩展袋用例。
#[derive(Debug, PartialEq)]
struct RunExt(u32);

// ── resolve_subcmd_path / normalize_help_subcommand ──

/// 测试夹具：三层命令树 wecom → hr → department → list。
///
/// - list 带必需位置参数 `id`（缺失触发 MissingRequiredArgument）；
/// - list 声明 clap alias `ls`（触发规范名归一化）；
/// - list 显式声明 `--help` 为 [ArgAction::Help]（覆盖 mut_args 递归 relax），
///   与真实 `crate::service::command::build_method_cmd` 一致关闭自动 help flag。
fn build_resolve_tree() -> Command {
    Command::new("wecom").subcommand(
        Command::new("hr").subcommand(
            Command::new("department").subcommand(
                Command::new("list")
                    .disable_help_flag(true)
                    .visible_alias("ls")
                    .arg(clap::Arg::new("id").required(true).index(1))
                    .arg(
                        clap::Arg::new("help")
                            .long("help")
                            .action(clap::ArgAction::Help),
                    ),
            ),
        ),
    )
}

/// 测试夹具：把 &str 数组转为 Vec<String>。
fn to_argv(args: &[&str]) -> Vec<String> {
    args.iter().map(|s| s.to_string()).collect()
}

/// P0：[resolve_subcmd_path] 缺失必需参数时返回完整叶子路径
/// 条件：pristine 树 + argv = ["wecom","hr","department","list"]（list 有 required arg）
/// 断言：返回 "hr department list"
#[test]
fn resolve_subcmd_path_missing_required_arg_keeps_full_path() {
    let argv = to_argv(&["wecom", "hr", "department", "list"]);
    assert_eq!(
        resolve_subcmd_path(build_resolve_tree(), &argv),
        "hr department list"
    );
}

/// P0：[resolve_subcmd_path] 未知子命令时返回解析成功的前缀
/// 条件：argv = ["wecom","hr","department","lst"]（lst 未注册）
/// 断言：返回 "hr department"
#[test]
fn resolve_subcmd_path_unknown_subcommand_returns_prefix() {
    let argv = to_argv(&["wecom", "hr", "department", "lst"]);
    assert_eq!(
        resolve_subcmd_path(build_resolve_tree(), &argv),
        "hr department"
    );
}

/// P0：[resolve_subcmd_path] 对显式 ArgAction::Help 叶子不中断
/// 条件：argv = ["wecom","hr","department","list","--help"]（list 显式声明
///       --help 为 ArgAction::Help）
/// 断言：返回 "hr department list"（覆盖 mut_args 递归 relax）
#[test]
fn resolve_subcmd_path_explicit_help_action_leaf_does_not_break() {
    let argv = to_argv(&["wecom", "hr", "department", "list", "--help"]);
    assert_eq!(
        resolve_subcmd_path(build_resolve_tree(), &argv),
        "hr department list"
    );
}

/// P1：[resolve_subcmd_path] 结果与 ContextKind::Usage 一致
/// 条件：非 relax 树解析缺失必需参数触发 MissingRequiredArgument（注入 Usage 上下文）
/// 断言：path == "hr department list"，且 usage 首行命令链包含 bin 名 + path
///       （clap 升级漂移哨兵）
#[test]
fn resolve_subcmd_path_matches_usage_context() {
    let tree = build_resolve_tree();
    let mut probe = tree.clone();
    let err = probe
        .try_get_matches_from_mut(["wecom", "hr", "department", "list"])
        .unwrap_err();
    let usage = err
        .get(clap::error::ContextKind::Usage)
        .map(|v| v.to_string())
        .unwrap_or_default();
    let first_line = usage.lines().next().unwrap_or_default();

    let argv = to_argv(&["wecom", "hr", "department", "list"]);
    let path = resolve_subcmd_path(tree, &argv);
    assert_eq!(path, "hr department list");
    assert!(
        first_line.contains("wecom hr department list"),
        "usage first line should contain the command chain: {first_line}"
    );
}

/// P1：[resolve_subcmd_path] clap alias 归一化为规范名
/// 条件：argv = ["wecom","hr","department","ls"]（ls 是 list 的 visible alias）
/// 断言：返回 "hr department list"
#[test]
fn resolve_subcmd_path_normalizes_alias_to_canonical_name() {
    let argv = to_argv(&["wecom", "hr", "department", "ls"]);
    assert_eq!(
        resolve_subcmd_path(build_resolve_tree(), &argv),
        "hr department list"
    );
}

/// P1：[resolve_subcmd_path] help 子命令 token 被剥离后解析到目标节点
/// 条件：argv = ["wecom","hr","help","department"]（relax 树中 help 子命令被禁用）
/// 断言：返回 "hr department"
#[test]
fn resolve_subcmd_path_strips_help_subcommand_token() {
    let argv = to_argv(&["wecom", "hr", "help", "department"]);
    assert_eq!(
        resolve_subcmd_path(build_resolve_tree(), &argv),
        "hr department"
    );
}

/// P1：[resolve_subcmd_path] flag 在 service 名之前时返回空串
/// 条件：argv = ["wecom","--verbose","hr"]（未知 flag 触发 dummy 命令，后续子命令不匹配）
/// 断言：返回 ""
#[test]
fn resolve_subcmd_path_empty_when_flag_first() {
    let argv = to_argv(&["wecom", "--verbose", "hr"]);
    assert_eq!(resolve_subcmd_path(build_resolve_tree(), &argv), "");
}

/// P1：[normalize_help_subcommand] "help" 前一个 token 以 '-' 开头时不剥离
/// 条件：argv = ["wecom","--help","help","svc"]（help 前的 token 是 flag）
/// 断言：返回原样（help 保留，不 remove）
#[test]
fn normalize_help_subcommand_keeps_help_after_flag() {
    let argv = to_argv(&["wecom", "--help", "help", "svc"]);
    let got = normalize_help_subcommand(&argv);
    assert_eq!(got, argv);
}

// ── handle_parse_error / try_remote_doc_help ──

/// P1：[CliRun::handle_parse_error] 非帮助展示（use_stderr=false）经 render_styled 输出并正常返回
/// 条件：DisplayVersion 类 clap 错误（非 help、use_stderr=false）；pristine 树 + argv
///       二次解析得到空路径（--version 无子命令）
/// 断言：返回 Ok(())，writer 收到版本文本
#[tokio::test]
async fn parse_error_display_version_prints_and_returns_ok() {
    let client = build_isolated_client();
    let buf = SharedBuf::new();
    let run = client
        .run(vec!["wecom".into(), "--version".into()])
        .output(CliRunOutput::new(buf.clone()));
    let error = clap::Error::raw(clap::error::ErrorKind::DisplayVersion, "wecom 1.2.3\n");
    let cmd = Command::new("wecom").version("1.2.3");
    let argv: Vec<String> = vec!["wecom".into(), "--version".into()];
    run.handle_parse_error(error, cmd, &argv, None, None)
        .await
        .unwrap();
    assert!(buf.contents().contains("wecom 1.2.3"));
}

/// P1：[CliRun::try_remote_doc_help] segs 首段不是 service 名时不拦截，回退本地渲染
/// 条件：schema 存在，但 segs 首段 ("other") != service 规范名 ("hr")
/// 断言：返回 Ok(None)，不发起远程文档请求
#[tokio::test]
async fn remote_doc_help_prefix_mismatch_returns_none() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let schema: ServiceSchema = serde_json::from_value(svc_schema_json()).unwrap();
    let info = svc_info("hr", &[]);
    let got = run
        .try_remote_doc_help(Some(&info), Some(&schema), &["other"])
        .await
        .unwrap();
    assert_eq!(got, None);
}

/// P1：[CliRun::try_remote_doc_help] service_info 为 None（first_arg 未命中服务）时不拦截
/// 条件：schema 存在，service_info 传入 None
/// 断言：返回 Ok(None)，不发起远程文档请求
#[tokio::test]
async fn remote_doc_help_without_service_info_returns_none() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let schema: ServiceSchema = serde_json::from_value(svc_schema_json()).unwrap();
    let got = run
        .try_remote_doc_help(None, Some(&schema), &["svc", "list"])
        .await
        .unwrap();
    assert_eq!(got, None);
}

// ── render_leaf_help ──

/// P1：[CliRun::render_leaf_help] api_error 为 None 时输出叶子命令的原始 help 文本
/// 条件：无 provider、无 api_error，path 指向叶子子命令 list
/// 断言：返回该子命令的 help 文本（含其 usage 与参数说明），不含 error: 前缀
#[test]
fn leaf_help_without_api_error_renders_leaf_subcommand() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let cmd = Command::new("wecom").subcommand(
        Command::new("svc").subcommand(
            Command::new("list")
                .about("List items")
                .arg(clap::Arg::new("id").long("id")),
        ),
    );
    let out = run.render_leaf_help(&cmd, &["svc", "list"], None);
    assert!(out.contains("List items"), "expect leaf help body: {out}");
    assert!(out.contains("--id"), "expect leaf arg help: {out}");
    assert!(!out.contains("error:"), "no error prefix expected: {out}");
}

/// P1：[CliRun::render_leaf_help] path 含未注册段时提前 break，回退渲染已匹配层级的 help
/// 条件：path = ["svc", "nope"]，nope 未注册为 svc 的子命令
/// 断言：返回 svc 层的 help 文本（含 svc 的 about），不 panic
#[test]
fn leaf_help_unknown_segment_falls_back_to_matched_level() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let cmd = Command::new("wecom").subcommand(
        Command::new("svc")
            .about("A service")
            .subcommand(Command::new("list")),
    );
    let out = run.render_leaf_help(&cmd, &["svc", "nope"], None);
    assert!(out.contains("A service"), "expect svc-level help: {out}");
}

// ── coverage 补全：output.rs 分支 ──

/// P1：[CliRunOutput::render_styled] force_color 开启时保留 ANSI 样式
/// 条件：带样式的 StyledStr + output 开启 force_color(true)
/// 断言：返回串含 ESC(\x1b) 转义
#[test]
fn render_styled_preserves_ansi_when_force_color_on() {
    let bold = anstyle::Style::new().bold();
    let text = format!("{}{}{}", bold.render(), "hello", bold.render_reset());
    let styled = clap::builder::StyledStr::from(text);
    let output = CliRunOutput::new(Vec::<u8>::new()).force_color(true);
    let rendered = output.render_styled(&styled);
    assert!(rendered.contains('\u{1b}'), "ansi preserved: {rendered:?}");
}

// ── coverage 补全：execute.rs 分支 ──

/// P0：[CliRun::execute] `-V` 提前输出版本号
/// 条件：argv = ["wecom", "-V"]
/// 断言：返回 Ok(())，writer 收到版本号文本
#[tokio::test]
async fn execute_short_version_flag_prints_and_returns_ok() {
    let client = build_isolated_client();
    let buf = SharedBuf::new();
    client
        .run(vec!["wecom".into(), "-V".into()])
        .output(CliRunOutput::new(buf.clone()))
        .execute()
        .await
        .unwrap();
    assert!(
        buf.contents().contains(crate::constants::CLI_INFO.version),
        "expect version output: {}",
        buf.contents()
    );
}

/// P0：[CliRun::execute] `--version` 提前输出版本号
/// 条件：argv = ["wecom", "--version"]
/// 断言：返回 Ok(())，writer 收到版本号文本
#[tokio::test]
async fn execute_version_flag_prints_and_returns_ok() {
    let client = build_isolated_client();
    let buf = SharedBuf::new();
    client
        .run(vec!["wecom".into(), "--version".into()])
        .output(CliRunOutput::new(buf.clone()))
        .execute()
        .await
        .unwrap();
    assert!(
        buf.contents().contains(crate::constants::CLI_INFO.version),
        "expect version output: {}",
        buf.contents()
    );
}

/// P1：[CliRun::execute] 扩展命令与目录服务同名时跳过该服务（扩展命令优先）
/// 条件：catalog 含 svc、svc2；注册同名 svc2 扩展命令；argv = wecom svc list
///       （first_arg=svc 非自定义名 → 拉取目录 [svc, svc2]；构建时 svc2 被 skip）
/// 断言：返回 Ok(())，svc2 handler 未被调用，仅 1 次业务请求（svc schema 走缓存、
///       svc2 被 shadow 不拉取）
#[tokio::test]
async fn execute_custom_command_shadows_same_name_service() {
    let tmp = tempfile::tempdir().unwrap();
    let root = tmp.path().to_path_buf();
    std::mem::forget(tmp);
    seed_run_catalog_cache_multi(&root, &["svc", "svc2"]);
    seed_detail_cache_with(&root, "svc", &svc_schema_json());
    let called = std::sync::Arc::new(AtomicBool::new(false));
    let called_cb = called.clone();
    let captured = std::sync::Arc::new(Mutex::new(vec![]));
    let backend = CaptureBackend {
        captured: captured.clone(),
    };
    let client = crate::Client::builder()
        .config_dir(&root)
        .transport(
            wecom_transport::TransportBuilder::new(backend)
                .build()
                .unwrap(),
        )
        .command(CustomCommand::new(
            clap::Command::new("svc2"),
            move |_run, _matches| {
                let called = called_cb.clone();
                Box::pin(async move {
                    called.store(true, Ordering::SeqCst);
                    Ok(())
                })
            },
        ))
        .build()
        .unwrap();

    let result = client
        .run(vec!["wecom".into(), "svc".into(), "list".into()])
        .execute()
        .await;
    assert!(result.is_ok(), "svc list 应正常执行: {result:?}");
    assert!(
        !called.load(Ordering::SeqCst),
        "svc2 handler 不应被调用（被服务 shadow 检查跳过）"
    );
    assert_eq!(
        captured.lock().unwrap().len(),
        1,
        "仅一次业务请求（svc schema 走缓存、svc2 被 shadow 不拉取）"
    );
}

/// P1：[CliRun::execute] 目录含多个服务时，非命中服务以 schema=None 构建
/// 条件：catalog 含 svc、svc2；仅 svc 有 detail 缓存；argv = wecom svc list
/// 断言：返回 Ok(())；仅 1 次请求（svc 业务；svc2 schema 不拉取、无独立请求）
#[tokio::test]
async fn execute_multi_service_catalog_builds_others_without_schema() {
    let tmp = tempfile::tempdir().unwrap();
    let root = tmp.path().to_path_buf();
    std::mem::forget(tmp);
    seed_run_catalog_cache_multi(&root, &["svc", "svc2"]);
    seed_detail_cache_with(&root, "svc", &svc_schema_json());
    let captured = std::sync::Arc::new(Mutex::new(vec![]));
    let backend = CaptureBackend {
        captured: captured.clone(),
    };
    let client = crate::Client::builder()
        .config_dir(&root)
        .transport(
            wecom_transport::TransportBuilder::new(backend)
                .build()
                .unwrap(),
        )
        .build()
        .unwrap();

    let result = client
        .run(vec!["wecom".into(), "svc".into(), "list".into()])
        .execute()
        .await;
    assert!(result.is_ok(), "svc list 应正常执行: {result:?}");
    assert_eq!(
        captured.lock().unwrap().len(),
        1,
        "仅一次业务请求（svc schema 走缓存，svc2 schema=None 不拉取）"
    );
}

// ── build_root_cmd：service alias 注册（clap hidden alias）──

/// 测试夹具：构造仅含 name/alias 的 ServiceInfo。
fn svc_info(name: &str, alias: &[&str]) -> ServiceInfo {
    ServiceInfo {
        name: name.into(),
        description: String::new(),
        hidden: false,
        alias: alias.iter().map(|s| (*s).to_string()).collect(),
    }
}

/// P0：[CliRun::build_root_cmd] alias 注册与目标服务无关，解析归一化为规范名
/// 条件：infos 含 hr(alias=["human-resources"]) 与 doc；目标服务为 hr
/// 断言：hr 子命令携带 alias "human-resources"；以 alias 解析时 subcommand 名为 "hr"
#[test]
fn build_root_cmd_registers_alias_regardless_of_target() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let infos = vec![svc_info("hr", &["human-resources"]), svc_info("doc", &[])];
    let mut cmd = run.build_root_cmd(&infos, Some(&infos[0]), None);
    let hr = cmd.find_subcommand("hr").unwrap();
    assert!(hr.get_aliases().any(|a| a == "human-resources"));
    let matches = cmd
        .try_get_matches_from_mut(["wecom", "human-resources", "--doc"])
        .unwrap();
    assert_eq!(matches.subcommand().map(|(name, _)| name), Some("hr"));
}

/// P0：[CliRun::build_root_cmd] 目标服务经 alias 解析可下钻 schema 方法
/// 条件：目标服务为 hr（其 alias 为 "human-resources"），schema 含顶层 list 方法
/// 断言：以 alias 解析后 subcommand 链为 hr → list
#[test]
fn build_root_cmd_alias_resolves_into_schema_methods() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let infos = vec![svc_info("hr", &["human-resources"])];
    let schema: ServiceSchema = serde_json::from_value(svc_schema_json()).unwrap();
    let mut cmd = run.build_root_cmd(&infos, Some(&infos[0]), Some(&schema));
    let matches = cmd
        .try_get_matches_from_mut(["wecom", "human-resources", "list"])
        .unwrap();
    let (name, sub_matches) = matches.subcommand().unwrap();
    assert_eq!(name, "hr");
    assert_eq!(sub_matches.subcommand().map(|(n, _)| n), Some("list"));
}

/// P1：[CliRun::build_root_cmd] alias 与自身规范名相同时跳过注册
/// 条件：infos 含 hr(alias=["hr"])；目标服务为 hr
/// 断言：hr 子命令不携带 alias（避免 clap 名称冲突）
#[test]
fn build_root_cmd_skips_alias_equal_to_canonical_name() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let infos = vec![svc_info("hr", &["hr"])];
    let cmd = run.build_root_cmd(&infos, Some(&infos[0]), None);
    assert_eq!(cmd.find_subcommand("hr").unwrap().get_aliases().count(), 0);
}

/// P1：[CliRun::build_root_cmd] alias 与其他服务规范名冲突时跳过该 alias
/// 条件：infos 含 a(alias=["b"]) 与 b；目标服务为 b
/// 断言：a 子命令不携带 alias，b 子命令保持规范注册
#[test]
fn build_root_cmd_skips_alias_conflicting_with_other_service_name() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let infos = vec![svc_info("a", &["b"]), svc_info("b", &[])];
    let cmd = run.build_root_cmd(&infos, Some(&infos[1]), None);
    assert_eq!(cmd.find_subcommand("a").unwrap().get_aliases().count(), 0);
    assert!(cmd.find_subcommand("b").is_some());
}

/// P1：[CliRun::build_root_cmd] 多个服务声明同一 alias 时仅首个注册
/// 条件：infos 含 s1(alias=["x"]) 与 s2(alias=["x"])；无目标服务
/// 断言：s1 携带 alias "x"，s2 不携带 alias
#[test]
fn build_root_cmd_dedupes_alias_across_services() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let infos = vec![svc_info("s1", &["x"]), svc_info("s2", &["x"])];
    let cmd = run.build_root_cmd(&infos, None, None);
    assert!(
        cmd.find_subcommand("s1")
            .unwrap()
            .get_aliases()
            .any(|a| a == "x")
    );
    assert_eq!(cmd.find_subcommand("s2").unwrap().get_aliases().count(), 0);
}

/// P1：[CliRun::build_root_cmd] alias 不出现在根 help 输出
/// 条件：infos 含 hr(alias=["human-resources"])；无目标服务
/// 断言：根 help 文本含规范名 "hr"，不含 "human-resources"
#[test]
fn build_root_cmd_alias_hidden_from_root_help() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let infos = vec![svc_info("hr", &["human-resources"])];
    let mut cmd = run.build_root_cmd(&infos, None, None);
    let help = cmd.render_help().to_string();
    assert!(help.contains("hr"), "expect canonical name in help: {help}");
    assert!(
        !help.contains("human-resources"),
        "alias should not appear in root help: {help}"
    );
}

/// P1：[CliRun::build_root_cmd] schema 仅传递给目标服务，其余服务为骨架树
/// 条件：infos 含 hr 与 doc，目标服务为 hr，schema 含顶层 list 方法
/// 断言：hr 下存在 "list" 方法子命令，doc 下不存在
#[test]
fn build_root_cmd_schema_only_applies_to_target_service() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let infos = vec![svc_info("hr", &[]), svc_info("doc", &[])];
    let schema: ServiceSchema = serde_json::from_value(svc_schema_json()).unwrap();
    let cmd = run.build_root_cmd(&infos, Some(&infos[0]), Some(&schema));
    assert!(
        cmd.find_subcommand("hr")
            .unwrap()
            .find_subcommand("list")
            .is_some()
    );
    assert!(
        cmd.find_subcommand("doc")
            .unwrap()
            .find_subcommand("list")
            .is_none()
    );
}

// ── coverage 补全：parse_error.rs 分支 ──

/// P1：[CliRun::handle_parse_error] DisplayHelp（use_stderr=false）渲染帮助并正常返回
/// 条件：DisplayHelp 错误、pristine 树可解析出 path、schema 无 remote_doc
/// 断言：返回 Ok(())，writer 收到帮助文本
#[tokio::test]
async fn parse_error_display_help_prints_and_returns_ok() {
    let client = build_isolated_client();
    let buf = SharedBuf::new();
    let run = client
        .run(vec!["wecom".into(), "svc".into(), "list".into()])
        .output(CliRunOutput::new(buf.clone()));
    let schema: ServiceSchema = serde_json::from_value(svc_schema_json()).unwrap();
    let error = clap::Error::raw(clap::error::ErrorKind::DisplayHelp, "help for list\n");
    let cmd = Command::new("wecom")
        .subcommand(Command::new("svc").subcommand(Command::new("list").disable_help_flag(true)));
    let argv: Vec<String> = vec!["wecom".into(), "svc".into(), "list".into()];
    let info = svc_info("svc", &[]);
    run.handle_parse_error(error, cmd, &argv, Some(&info), Some(Arc::new(schema)))
        .await
        .unwrap();
    assert!(buf.contents().contains("help for list"));
}

/// P1：[CliRun::handle_parse_error] DisplayHelpOnMissingArgumentOrSubcommand（use_stderr=true）返回 CliOutput
/// 条件：该 kind 的 clap 错误（缺失子命令触发的自动帮助），schema 为 None
/// 断言：返回 Err(Error::CliOutput{code:2})，writer 无输出
#[tokio::test]
async fn parse_error_display_help_missing_arg_returns_cli_output() {
    let client = build_isolated_client();
    let buf = SharedBuf::new();
    let run = client
        .run(vec!["wecom".into()])
        .output(CliRunOutput::new(buf.clone()));
    let error = clap::Error::raw(
        clap::error::ErrorKind::DisplayHelpOnMissingArgumentOrSubcommand,
        "usage help\n",
    );
    let cmd = Command::new("wecom").subcommand(Command::new("svc"));
    let argv: Vec<String> = vec!["wecom".into(), "svc".into()];
    let info = svc_info("svc", &[]);
    let err = run
        .handle_parse_error(error, cmd, &argv, Some(&info), None)
        .await
        .unwrap_err();
    match err {
        Error::CliOutput { code, .. } => assert_eq!(code, 2),
        other => panic!("expect CliOutput, got {other:?}"),
    }
    assert!(buf.contents().is_empty(), "writer 不应有输出");
}

/// P1：[CliRun::handle_parse_error] InvalidSubcommand 无 context 时上报 path 本身
/// 条件：clap::Error::raw(InvalidSubcommand)（raw 构造不含 InvalidSubcommand context），
///       pristine 树可解析出 path = "svc"
/// 断言：返回 Err(Error::CliOutput{code:2})，无 panic（invalid 空串分支）
#[tokio::test]
async fn parse_error_invalid_subcmd_without_context_emits_path() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into(), "svc".into(), "lst".into()]);
    let error = clap::Error::raw(
        clap::error::ErrorKind::InvalidSubcommand,
        "invalid subcommand\n",
    );
    let cmd = Command::new("wecom").subcommand(Command::new("svc"));
    let argv: Vec<String> = vec!["wecom".into(), "svc".into(), "lst".into()];
    let info = svc_info("svc", &[]);
    let err = run
        .handle_parse_error(error, cmd, &argv, Some(&info), None)
        .await
        .unwrap_err();
    assert!(matches!(err, Error::CliOutput { code: 2, .. }));
}

/// 测试夹具：schema 为 None 时 try_remote_doc_help 直接返回 None。
#[tokio::test]
async fn remote_doc_help_schema_none_returns_none() {
    let client = build_isolated_client();
    let run = client.run(vec!["wecom".into()]);
    let info = svc_info("svc", &[]);
    let got = run
        .try_remote_doc_help(Some(&info), None, &["svc", "list"])
        .await
        .unwrap();
    assert_eq!(got, None);
}

/// 测试夹具：业务请求返回远程文档形状响应的后端。
#[derive(Debug)]
struct RemoteDocOkBackend;

impl wecom_transport::TransportBackend for RemoteDocOkBackend {
    fn execute<'a>(
        &'a self,
        _endpoint: std::borrow::Cow<'a, wecom_transport::Endpoint>,
        _payload: wecom_transport::HttpRequestPayload,
        _options: wecom_transport::RequestOptions,
    ) -> std::pin::Pin<
        Box<
            dyn std::future::Future<
                    Output = std::result::Result<
                        wecom_transport::TransportResponse,
                        wecom_transport::Error,
                    >,
                > + Send
                + 'a,
        >,
    > {
        Box::pin(async {
            Ok(wecom_transport::TransportResponse::Json(
                wecom_transport::ExecuteOutput {
                    result: serde_json::json!({ "doc": "remote help text" }),
                    extra: indexmap::IndexMap::new(),
                },
            ))
        })
    }
}

/// 测试夹具：声明 service remote_doc 与 method id 的 schema（remote_doc 命中）。
fn remote_doc_hit_schema_json() -> serde_json::Value {
    serde_json::json!({
        "id": "svc-doc-id",
        "remote_doc": true,
        "description": "test",
        "base_url": "https://test.example.com/",
        "methods": {
            "list": {
                "id": "list-doc-id",
                "remote_doc": true,
                "http_method": "GET",
                "path": "/list"
            }
        },
        "resources": {}
    })
}

/// P1：[CliRun::try_remote_doc_help] remote_doc 命中时请求远程端点并返回文档文本
/// 条件：schema 声明 service remote_doc + method id；后端返回 {"doc": "remote help text"}
/// 断言：返回 Some("remote help text")
#[tokio::test]
async fn remote_doc_help_remote_doc_hit_returns_doc() {
    let tmp = tempfile::tempdir().unwrap();
    let root = tmp.path().to_path_buf();
    std::mem::forget(tmp);
    let client = crate::Client::builder()
        .config_dir(&root)
        .transport(
            wecom_transport::TransportBuilder::new(RemoteDocOkBackend)
                .build()
                .unwrap(),
        )
        .build()
        .unwrap();
    let run = client.run(vec!["wecom".into()]);
    let schema: ServiceSchema = serde_json::from_value(remote_doc_hit_schema_json()).unwrap();
    let info = svc_info("svc", &[]);
    let got = run
        .try_remote_doc_help(Some(&info), Some(&schema), &["svc", "list"])
        .await
        .unwrap();
    assert_eq!(got.as_deref(), Some("remote help text"));
}
