use std::fmt::Write;
use std::pin::Pin;

use clap::Command;
use clap::builder::StyledStr;
use serde::Serialize;
use serde_json::Value;
use serde_with::skip_serializing_none;

use crate::client::CliRun;
use crate::{Result, schema};

/// ANSI bold + underline style for section headings (matches `service::doc`).
const HEADING: anstyle::Style = anstyle::Style::new().bold().underline();

/// Hook that augments the `clap::Command` generated for a helper.
///
/// Lets a helper attach CLI-only presentation (e.g. `after_help`, extra
/// `Arg`s) that has no place in the JSON Schema. Kept out of the
/// [`Helper`] trait itself so the trait stays free of CLI-framework types.
type CommandAugment = Box<dyn Fn(Command) -> Command + Send + Sync>;

/// Metadata describing a helper command, including its parameter schema.
///
/// Prefer constructing via the builder so the request / response schemas can
/// be derived from plain Rust types instead of hand-written JSON Schema:
///
/// ```rust
/// use wecom::HelperMeta;
///
/// let meta = HelperMeta::new("+upload", "上传媒体文件")
///     .with_request::<String>()
///     .with_response::<String>();
/// # let _ = meta;
/// ```
pub struct HelperMeta {
    /// Display name shown in help text.
    pub name: &'static str,
    /// One-line description.
    pub description: &'static str,
    /// JSON Schema describing the parameters this helper accepts.
    ///
    /// The schema should have `schema_type = Some("object")`.
    /// Each property becomes a CLI flag (in CLI mode) or a key in the
    /// `Value` passed to [`execute`](Helper::execute) (in SDK mode).
    ///
    /// Defaults to an empty schema when the helper takes no parameters.
    pub request: schema::JsonSchema,
    /// Optional JSON Schema describing the helper's response.
    ///
    /// Only meaningful for non-streaming helpers that return a single
    /// structured result; streaming helpers leave this `None`.
    pub response: Option<schema::JsonSchema>,
    /// Optional hook to augment the generated `clap::Command`.
    ///
    /// Registered via [`with_command_augment`](HelperMeta::with_command_augment)
    /// and applied by the CLI layer through
    /// [`augment_command`](HelperMeta::augment_command).
    command_augment: Option<CommandAugment>,
}

impl HelperMeta {
    /// Create metadata with an empty request schema and no response schema.
    pub fn new(name: &'static str, description: &'static str) -> Self {
        Self {
            name,
            description,
            request: schema::JsonSchema::default(),
            response: None,
            command_augment: None,
        }
    }

    /// Derive the request schema from a Rust type implementing
    /// [`schemars::JsonSchema`].
    #[must_use]
    pub fn with_request<T: schemars::JsonSchema>(mut self) -> Self {
        self.request = schema::schema_for_type::<T>();
        self
    }

    /// Set the request schema from a raw [`schema::JsonSchema`] (escape hatch).
    #[must_use]
    pub fn with_request_schema(mut self, schema: schema::JsonSchema) -> Self {
        self.request = schema;
        self
    }

    /// Derive the response schema from a Rust type implementing
    /// [`schemars::JsonSchema`].
    ///
    /// Intended for non-streaming helpers that return a single structured
    /// result.
    #[must_use]
    pub fn with_response<T: schemars::JsonSchema>(mut self) -> Self {
        self.response = Some(schema::schema_for_type::<T>());
        self
    }

    /// Set the response schema from a raw [`schema::JsonSchema`] (escape hatch).
    #[must_use]
    pub fn with_response_schema(mut self, schema: schema::JsonSchema) -> Self {
        self.response = Some(schema);
        self
    }

    /// Register a hook that augments the helper's generated `clap::Command`.
    ///
    /// The closure receives the command built from the schema (with the
    /// shared helper flags already attached) and returns a modified command,
    /// letting a helper add CLI-only presentation such as `after_help` or
    /// extra arguments:
    ///
    /// ```rust
    /// use wecom::HelperMeta;
    ///
    /// let meta = HelperMeta::new("+upload", "上传媒体文件")
    ///     .with_request::<String>()
    ///     .with_command_augment(|cmd| cmd.after_help("示例：wecom media +upload ..."));
    /// # let _ = meta;
    /// ```
    #[must_use]
    pub fn with_command_augment<F>(mut self, f: F) -> Self
    where
        F: Fn(Command) -> Command + Send + Sync + 'static,
    {
        self.command_augment = Some(Box::new(f));
        self
    }

    /// Apply the registered command-augmentation hook to `cmd`.
    ///
    /// Returns `cmd` unchanged when no hook was registered. The CLI layer
    /// calls this after deriving the base command from the schema so a helper
    /// can attach CLI-only presentation (e.g. `after_help`).
    pub fn augment_command(&self, cmd: Command) -> Command {
        match &self.command_augment {
            Some(f) => f(cmd),
            None => cmd,
        }
    }

    /// Structured schema info for `--schema` output.
    pub fn schema_info(&self, path: &[&str]) -> HelperSchemaInfo<'_> {
        HelperSchemaInfo {
            helper: path.join("."),
            description: self.description,
            request: &self.request,
            response: self.response.as_ref(),
        }
    }

    /// Generate helper documentation (Markdown) for `--doc` output.
    ///
    /// Mirrors the method `--doc` layout: a `--json <request_body>` usage hint
    /// plus an `export { RequestBody, Response }` block followed by the named
    /// TypeScript interfaces (`RequestBody` / `Response`).
    ///
    /// Returns a [`StyledStr`] embedding ANSI styling; use `.ansi()` to render
    /// with colour or `Display` to strip escape codes.
    pub fn doc(&self, bin_name: &str, path: &[&str]) -> StyledStr {
        let mut out = StyledStr::new();
        let joined = path.join(" ");
        let _ = write!(out, "# Helper - {HEADING}{joined}{HEADING:#}");
        let _ = write!(out, "\n\n{}", self.description);

        let has_request = self.request.schema_type.as_deref() == Some("object")
            && !self.request.properties.is_empty();

        let mut usage = format!("{bin_name} {}", path.join(" "));
        if has_request {
            usage.push_str(" --json <request_body>");
        }
        let _ = write!(
            out,
            "\n\n## {HEADING}Usage{HEADING:#}\n\n```bash\n{usage}\n```"
        );

        // Collect named declarations with fixed interface names so the output
        // matches the method `--doc` convention (`RequestBody` / `Response`).
        let mut exports = vec![];
        let mut decls = vec![];
        if has_request {
            exports.push("  RequestBody,".to_string());
            decls.push(schema::schema_to_ts("RequestBody", &self.request).0);
        }
        if let Some(response) = &self.response {
            exports.push("  Response,".to_string());
            decls.push(schema::schema_to_ts("Response", response).0);
        }
        if !decls.is_empty() {
            decls.insert(0, format!("export {{\n{}\n}};", exports.join("\n")));
            let _ = write!(
                out,
                "\n\n## {HEADING}Declarations{HEADING:#}\n\n```ts\n{}\n```",
                decls.join("\n\n")
            );
        }

        out
    }
}

/// Structured schema information for a helper (returned for `--schema`).
#[skip_serializing_none]
#[derive(Debug, Clone, Serialize)]
pub struct HelperSchemaInfo<'a> {
    /// Dot-joined helper path, e.g. `"media.+download"`.
    pub helper: String,
    /// Helper description.
    pub description: &'a str,
    /// Request parameter schema.
    pub request: &'a schema::JsonSchema,
    /// Optional response schema (non-streaming helpers only).
    pub response: Option<&'a schema::JsonSchema>,
}

/// A helper provides custom sub-commands that extend a service.
///
/// Every helper must implement all three methods. The trait is
/// intentionally free of any CLI-framework types — `about().request`
/// returns a [`schema::JsonSchema`] describing accepted parameters, and
/// `execute` receives the [`CliRun`] context plus a plain
/// `serde_json::Value` of parameters.
///
/// The CLI layer automatically converts the schema into
/// `clap::Command` + `clap::Arg` definitions and parses user input
/// into the `Value` that is passed to `execute`.
pub trait Helper: Send + Sync {
    /// Command path relative to the service,
    /// e.g. `["resource", "action"]`.
    fn path(&self) -> Vec<&'static str>;

    /// Metadata (name, description, schema) used for help text and
    /// parameter definition.
    fn about(&self) -> HelperMeta;

    /// Execute the helper logic.
    ///
    /// `run` is the active [`CliRun`] context, giving access to the
    /// [`Client`](crate::Client) (`run.get_client()`), the sandboxed
    /// filesystem (`run.get_fs()`), and the output sink (`run.get_output()`).
    ///
    /// `params` is a JSON object whose keys match the properties
    /// declared in [`about().request`](HelperMeta::request).
    fn execute<'a>(
        &'a self,
        run: &'a CliRun<'a>,
        params: Value,
    ) -> Pin<Box<dyn Future<Output = Result<()>> + Send + 'a>>;
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：helpers::types（Helper trait 及元数据定义）
    //!
    //! ### 关键接口
    //! - [Helper] trait — 定义 helper 的行为（path/about/execute）
    //! - [HelperMeta] — helper 的元数据（name/description/request/response）及其 builder
    //! - [HelperMeta::with_request] / [HelperMeta::with_response] — 从 Rust 类型派生 schema
    //! - [HelperMeta::with_command_augment] / [HelperMeta::augment_command] — 注册并应用 clap::Command 增强钩子
    //! - [HelperMeta::doc] / [HelperMeta::schema_info] — 生成 --doc / --schema 输出
    //!
    //! ### 关键分支与异常路径
    //! - execute 正常参数 → Ok
    //! - with_response 未调用 → response 为 None
    //! - augment_command 未注册钩子 → 原样返回 command
    //! - doc：request 为空对象 → 不生成 Declarations 段落
    //!
    //! ### 上下游交互
    //! - 上游：调用方实现 [Helper] trait 提供自定义 helper
    //! - 下游：[HelperRegistry] 注册并调用 helper；[schema::schema_for_type] 派生 schema

    use schemars::JsonSchema as SchemarsJsonSchema;

    use super::*;

    #[derive(SchemarsJsonSchema)]
    #[allow(dead_code)]
    struct SampleReq {
        /// the user id
        userid: String,
    }

    #[derive(SchemarsJsonSchema)]
    #[allow(dead_code)]
    struct SampleRes {
        ok: bool,
    }

    struct DummyHelper;

    impl Helper for DummyHelper {
        fn path(&self) -> Vec<&'static str> {
            vec!["test", "action"]
        }
        fn about(&self) -> HelperMeta {
            HelperMeta::new("dummy", "A test helper")
        }
        fn execute<'a>(
            &'a self,
            _run: &'a CliRun<'a>,
            _params: Value,
        ) -> Pin<Box<dyn Future<Output = Result<()>> + Send + 'a>> {
            Box::pin(async { Ok(()) })
        }
    }

    /// P0：[HelperMeta] 的 about() 返回正确元数据
    /// 条件：使用 DummyHelper 实例获取 about()
    /// 断言：name、description、request 均可访问且值正确，response 为 None
    #[test]
    fn helper_meta_fields_accessible() {
        let meta = DummyHelper.about();
        assert_eq!(meta.name, "dummy");
        assert_eq!(meta.description, "A test helper");
        let _val = serde_json::to_value(&meta.request).unwrap();
        assert!(meta.response.is_none());
    }

    /// P0：[HelperMeta::with_request] 从 Rust 类型派生请求 schema
    /// 条件：调用 with_request::<SampleReq>()
    /// 断言：request 为 object 且含 userid 属性
    #[test]
    fn with_request_derives_schema() {
        let meta = HelperMeta::new("h", "d").with_request::<SampleReq>();
        assert_eq!(meta.request.schema_type.as_deref(), Some("object"));
        assert!(meta.request.properties.contains_key("userid"));
    }

    /// P1：[HelperMeta::with_response] 从 Rust 类型派生响应 schema
    /// 条件：调用 with_response::<SampleRes>()
    /// 断言：response 为 Some 且 schema_type 为 "object"
    #[test]
    fn with_response_derives_schema() {
        let meta = HelperMeta::new("h", "d").with_response::<SampleRes>();
        let resp = meta.response.expect("response should be present");
        assert_eq!(resp.schema_type.as_deref(), Some("object"));
    }

    /// P0：[HelperMeta::augment_command] 应用已注册的钩子修改 command
    /// 条件：通过 with_command_augment 注册添加 after_help 的钩子
    /// 断言：augment_command 返回的 command 携带该 after_help 文本
    #[test]
    fn augment_command_applies_registered_hook() {
        let meta = HelperMeta::new("+download", "下载")
            .with_command_augment(|cmd| cmd.after_help("示例帮助文本"));
        let cmd = meta.augment_command(clap::Command::new("+download"));
        let after = cmd
            .get_after_help()
            .map(|s| s.to_string())
            .unwrap_or_default();
        assert_eq!(after, "示例帮助文本");
    }

    /// P1：[HelperMeta::augment_command] 未注册钩子时原样返回 command
    /// 条件：未调用 with_command_augment 的 HelperMeta
    /// 断言：返回的 command 没有 after_help
    #[test]
    fn augment_command_without_hook_returns_command_unchanged() {
        let meta = HelperMeta::new("h", "d");
        let cmd = meta.augment_command(clap::Command::new("h"));
        assert!(cmd.get_after_help().is_none());
    }

    /// P1：[HelperMeta::schema_info] 序列化包含 helper 路径、request 与 response
    /// 条件：含 request 与 response 的 HelperMeta，path=["media","+download"]
    /// 断言：helper 为 "media.+download"，request/response 字段均存在
    #[test]
    fn schema_info_serializes() {
        let meta = HelperMeta::new("+download", "下载")
            .with_request::<SampleReq>()
            .with_response::<SampleRes>();
        let info = meta.schema_info(&["media", "+download"]);
        let json = serde_json::to_value(&info).unwrap();
        assert_eq!(json["helper"], "media.+download");
        assert!(json["request"].is_object());
        assert!(json["response"].is_object());
    }

    /// P1：[HelperMeta::schema_info] 无 response 时该字段被跳过
    /// 条件：仅设置 request 的 HelperMeta
    /// 断言：序列化结果不含 response 键（skip_serializing_none）
    #[test]
    fn schema_info_skips_absent_response() {
        let meta = HelperMeta::new("h", "d").with_request::<SampleReq>();
        let info = meta.schema_info(&["svc", "h"]);
        let json = serde_json::to_value(&info).unwrap();
        assert!(json.get("response").is_none());
    }

    /// P1：[HelperMeta::doc] 生成含名称、Usage 与 Declarations 的文档
    /// 条件：含 request 与 response 的 HelperMeta，path=["media","+download"]
    /// 断言：标题含完整路径、Usage 含 --json、export 块及 RequestBody/Response interface
    #[test]
    fn doc_renders_sections() {
        let meta = HelperMeta::new("+download", "下载媒体文件")
            .with_request::<SampleReq>()
            .with_response::<SampleRes>();
        let doc = meta.doc("wecom", &["media", "+download"]).to_string();
        assert!(doc.contains("Helper - media +download"));
        assert!(doc.contains("wecom media +download --json <request_body>"));
        assert!(doc.contains("Declarations"));
        assert!(doc.contains("export {"));
        assert!(doc.contains("interface RequestBody"));
        assert!(doc.contains("interface Response"));
    }

    /// P2：[HelperMeta::doc] request 为空时不生成 Declarations 段落
    /// 条件：无 request、无 response 的 HelperMeta
    /// 断言：文档不含 "Declarations"
    #[test]
    fn doc_without_schema_omits_declarations() {
        let meta = HelperMeta::new("ping", "no params");
        let doc = meta.doc("wecom", &["svc", "ping"]).to_string();
        assert!(!doc.contains("Declarations"));
    }

    /// P0：[Helper::path] 返回正确的命令段向量
    /// 条件：调用 DummyHelper.path()
    /// 断言：返回 vec!["test", "action"]
    #[test]
    fn helper_path_returns_segments() {
        assert_eq!(DummyHelper.path(), vec!["test", "action"]);
    }

    /// P0：[Helper::execute] Helper trait 的 execute() 在正常参数下返回 Ok
    /// 条件：传入空 JSON 对象 {} 与隔离的 CliRun 上下文
    /// 断言：execute().await 为 Ok(())
    #[tokio::test]
    async fn helper_execute_ok() {
        let tmp = tempfile::tempdir().unwrap();
        let client = crate::Client::builder()
            .config_dir(tmp.path())
            .build()
            .unwrap();
        let run = client.run(vec!["test".into()]);
        assert!(
            DummyHelper
                .execute(&run, serde_json::json!({}))
                .await
                .is_ok()
        );
    }

    /// P1：[HelperMeta::with_request_schema] 设置原始请求 schema
    /// 条件：传入一个自定义 JsonSchema
    /// 断言：request 被替换为该 schema
    #[test]
    fn with_request_schema_sets_raw_schema() {
        let raw = schema::JsonSchema::default();
        let meta = HelperMeta::new("h", "d").with_request_schema(raw.clone());
        assert_eq!(meta.request.schema_type, raw.schema_type);
    }

    /// P1：[HelperMeta::with_response_schema] 设置原始响应 schema
    /// 条件：传入一个自定义 JsonSchema
    /// 断言：response 为 Some 且 schema_type 一致
    #[test]
    fn with_response_schema_sets_raw_schema() {
        let raw = schema::JsonSchema::default();
        let meta = HelperMeta::new("h", "d").with_response_schema(raw.clone());
        let resp = meta.response.expect("response should be present");
        assert_eq!(resp.schema_type, raw.schema_type);
    }
}
