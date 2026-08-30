use clap::Args;

#[derive(Args, Debug)]
#[command(arg_required_else_help = true)]
pub struct ServiceCmdArgs {
    /// 显示服务文档
    #[arg(long, action = clap::ArgAction::SetTrue)]
    pub doc: Option<bool>,

    /// 显示服务 schema
    #[arg(long, action = clap::ArgAction::SetTrue)]
    pub schema: Option<bool>,
}

// CLI flags shared by every helper sub-command.
//
// Besides its schema-derived parameters, every helper accepts a raw `--json`
// body plus `--schema` / `--doc` / `--help` documentation flags. (Note: this
// doc block is a plain comment, not a `///` doc comment, so clap does not
// turn it into the command's about text.)
#[derive(Args, Debug, Default, serde::Serialize, serde::Deserialize)]
pub struct HelperCmdArgs {
    // ── Parameters ─────────────────────────────────────────
    /// 请求体原始 JSON 字符串
    #[arg(long, help_heading = "请求体")]
    #[serde(skip)]
    pub json: Option<String>,

    /// 深层路径覆盖，可重复：--set deep.path=value
    #[arg(long = "set", value_name = "path=val", action = clap::ArgAction::Append, help_heading = "请求体")]
    #[serde(skip)]
    pub set: Vec<String>,

    // ── Documentation ──────────────────────────────────────
    /// 显示 helper schema
    #[arg(long, action = clap::ArgAction::SetTrue, help_heading = "文档")]
    #[serde(default)]
    pub schema: Option<bool>,

    /// 显示 helper 文档
    #[arg(long, action = clap::ArgAction::SetTrue, help_heading = "文档")]
    #[serde(default)]
    pub doc: Option<bool>,

    /// 显示帮助
    #[arg(long, short, action = clap::ArgAction::Help, help_heading = "文档")]
    #[serde(default)]
    pub help: Option<bool>,
}

#[derive(Args, Debug, Default, serde::Serialize, serde::Deserialize)]
pub struct MethodCmdArgs {
    // ── Parameters ─────────────────────────────────────────
    /// 请求体原始 JSON 字符串
    #[arg(long, help_heading = "请求体")]
    #[serde(skip)]
    pub json: Option<String>,

    /// 深层路径覆盖，可重复：--set deep.path=value
    #[arg(long = "set", value_name = "path=val", action = clap::ArgAction::Append, help_heading = "请求体")]
    #[serde(skip)]
    pub set: Vec<String>,

    // ── Documentation ──────────────────────────────────────
    /// 显示方法 schema
    #[arg(long, action = clap::ArgAction::SetTrue, help_heading = "文档")]
    #[serde(default)]
    pub schema: Option<bool>,

    /// 显示方法文档
    #[arg(long, action = clap::ArgAction::SetTrue, help_heading = "文档")]
    #[serde(default)]
    pub doc: Option<bool>,

    /// 显示帮助
    #[arg(long, short, action = clap::ArgAction::Help, help_heading = "文档")]
    #[serde(default)]
    pub help: Option<bool>,

    // ── Options ──────────────────────────────────────────────
    /// 仅在本地校验请求，不实际发送
    #[arg(long, alias = "dry_run", action = clap::ArgAction::SetTrue, help_heading = "选项")]
    #[serde(default)]
    pub dry_run: Option<bool>,

    /// 拉取的页数（启用自动分页，输出 NDJSON 格式）
    #[arg(long, alias = "page_count", help_heading = "选项")]
    #[serde(default)]
    pub page_count: Option<u32>,

    /// 分页请求之间的间隔毫秒数
    #[arg(
        long,
        alias = "page_delay",
        default_value = "100",
        help_heading = "选项"
    )]
    #[serde(default)]
    pub page_delay: Option<u64>,

    /// 将响应体写入文件
    #[arg(long, short = 'o', help_heading = "选项")]
    #[serde(default)]
    pub output: Option<String>,

    /// 将下载的文件写入指定目录
    #[arg(long, alias = "output_dir", help_heading = "选项")]
    #[serde(default)]
    pub output_dir: Option<String>,
}
