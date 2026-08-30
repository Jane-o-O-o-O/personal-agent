# @wecom/cli

## 1.3.4

### Patch Changes

- a0f3749: 增强 trace 调用来源识别能力，支持识别更多客户端，并统一同品牌来源标记。

## 1.3.3

### Patch Changes

- 4a1ec97: 增强 trace 调用来源识别能力，支持识别更多客户端，并统一同品牌来源标记。

## 1.3.2

### Patch Changes

- a373c49: 优化调用链信息

## 1.3.1

### Patch Changes

- 5ee712c: 修正两处面向用户可感知的行为
  - env 来源 token 过期（后台 errcode 853004）时返回鉴权错误，指明 `WECOM_CLI_ACCESS_TOKEN` 已过期、需更新该环境变量后重试（此前该提示因刷新裁决前置门禁而不可达，用户只能看到原始业务错误）。
  - 修正编译期端点注入的构建缓存问题：`build.rs` 补登记 `WECOM_CLI_BASE_URL` / `WECOM_CLI_AUTH_ENDPOINT` 的 `rerun-if-env-changed`，构建时改动这两个变量现在会触发重新编译，不再复用缓存产物、把旧端点烘焙进二进制。
- 5ee712c: 支持在构建时通过 WECOM_CLI_BASE_URL 指定默认请求端点
  - 构建时设置该环境变量即烘焙为默认 base URL，无需启用 `custom-endpoint` feature。
  - 优先级：运行时来源（`custom-endpoint` 下的 `WECOM_CLI_BASE_URL` 环境变量 / `config.json`）> 构建时值 > 内置默认端点。
- bdb0677: 优化调用链信息
- 5ee712c: 支持 WECOM_CLI_ACCESS_TOKEN 环境变量直接指定 Bearer token
  - 设置该环境变量即直接提供 access token，优先于 `credentials.enc` 中保存的 token；空值视为未设置，回退文件来源。
  - 该来源不配套 bot 凭据：token 失效（后台 errcode 853004）时不发起静默刷新，返回鉴权错误提示更新该环境变量后重试。
  - 取消 `custom-access-token` 编译开关，所有构建均生效。

## 1.3.0

### Minor Changes

- 6967dc6: 收紧文件读写沙箱
  - CLI 此前不注入任何沙箱根、可读写任意位置；现在读写均限制在当前工作目录与系统临时目录内。凭据目录与配置目录（含任意基座下的 `**/.config/wecom`）一律拒绝。
  - 内置 deny 清单覆盖凭据形状路径（`.ssh`、`.aws`、`.kube`、`.env`、`.git`、`*.pem`、`*.key`、`id_rsa` 等）与系统目录，即使位于当前工作目录内同样拒绝。
  - 迁移指引：如需读写当前工作目录之外的文件，请在目标目录下运行 CLI，或使用相对当前工作目录的路径。`--output` / `--output-dir` 仍控制文件落点，但目标必须落在上述范围内。
  - 错误码与错误输出格式不变（CLI 段 893000–893299；后台 errcode 原样透传）。
- 6967dc6: 重构下载落盘位置与 `--output-dir` 语义
  - 下载产生的文件（运行时二进制响应、响应内容导出为文件）默认落盘到当前工作目录，不再是 `<tmp_dir>/requests`——对齐 wget / curl `-O` / `gh release download` 的默认行为。
  - `--output-dir` 只对产生文件的响应生效；不再把 JSON 响应落盘为 `<method>.json`（分页时为 `<method>.ndjson`），纯 JSON 响应不产生文件。保存 JSON 响应请改用 `--output/-o` 或 shell 重定向。
  - 显式声明的 `--output-dir` 一律经沙箱校验，目标必须落在当前工作目录或系统临时目录内。
  - 移除 `tmp_dir` 配置（`WECOM_CLI_TMP_DIR` 环境变量、`config.json` 的 `tmp_dir` 字段及对应 builder API）与派生的 `request_storage_dir`。嵌入方可经 `ClientBuilder::default_output_dir` 设置客户端级默认下载目录（默认当前工作目录；单次调用仍可用 `--output-dir` 覆盖）。
- 6967dc6: 移除文件路径模糊纠错
  - 路径不存在或输入有误时，不再自动纠正为名称相近的真实文件；统一以「找不到目标文件」报错，不会按纠正后的路径静默继续。
- 6967dc6: 精简 JSON 自动修复提示，避免载荷外泄
  - `--json` / `--set` 输入被自动修复时，stderr 提示精简为单行，不再回显修复前后的 JSON 原文。
  - 遥测事件不再携带修复前后的载荷内容，仅保留修复策略信息，避免敏感数据外泄。

### Patch Changes

- 6967dc6: 外部路径相对值统一锚定到进程工作目录
  - `WECOM_CLI_CONFIG_DIR` 的相对值按进程工作目录解析为绝对路径；空值按未设置处理，回退默认配置目录。

## 1.2.1

### Patch Changes

- 56cd4c5: 新增编译特性 call-chain

## 1.2.0

### Minor Changes

- 1f0e0b8: 支持远程文档渲染
  - schema 中 service / resource / method 任一层级声明 `remote_doc: true` 时，对应节点的 `--doc` / `--help` / `--schema` 不再本地渲染，改为请求远程 endpoint 生成文档并直接输出。
  - 生效规则为就近覆盖（method → 父级 resource 链 → service → 默认 `false`），每层可用 `remote_doc: false` 显式关闭上层开启的远程渲染。

- 1f0e0b8: 支持服务别名解析
  - `ServiceInfo.alias` 支持为服务声明别名，调用时按精确名优先、别名其次解析。
  - `method_alias` 遥测事件统一在方法解析处单点发射，记录用户原始输入路径（保留服务别名）与规范化路径的映射。

### Patch Changes

- 1f0e0b8: multipart 上传请求支持 token 失效重放
  - 请求载荷统一为可重放的延迟工厂：multipart 表单在每次发送时重新构建（重新打开文件），token 失效（853004）静默刷新后的自动重放不再限于 JSON 请求，文件上传类调用同样生效。

## 1.1.0

### Major Changes

- b2dfa0f: 重构鉴权命令与凭据存储
  - `wecom-cli init` 移除，改为 `wecom-cli auth init`（交互式选择接入方式，非交互环境自动扫码），并新增 `wecom-cli auth show` 查看授权状态。
  - 扫码接入成为默认方式（终端二维码，5 分钟超时），支持 `--noninteractive` / `--no-browser` / `--output-qrcode` / `--manual`。
  - `auth show` 输出调整：默认输出人类可读的 `Status` 与 `Bot ID`；原 `--auth-status` 改为 `--status`，仅输出 `authorized` / `unauthorized` 单行。
  - 凭据文件由 `<config_dir>/bot.enc` 改为 `<config_dir>/credentials.enc`（AES-256-GCM，0600，bot 信息与 token 共存）；启动时自动迁移旧版 `bot.enc`，旧文件保留。
  - 加密密钥优先使用系统 keyring，不可用时回退 `<config_dir>/.encryption_key` 文件。
  - token 失效（后台 errcode 853004）时使用 bot 凭据静默换取新 token 并重放一次请求，无需重新 `auth init`。

  迁移指引：将脚本中的 `wecom-cli init` 替换为 `wecom-cli auth init`；`auth show --auth-status` 替换为 `auth show --status`。

- b2dfa0f: 重构命令模型，接口集合整体更名
  - 调用格式由 `wecom-cli <category> <method> [json_args]` 改为 `wecom-cli <service> [resource...] <method> [flags]`，方法支持嵌套资源路径。
  - **接口名称变化**：旧版扁平工具名（内部经 MCP 工具集下发，如 `contact get_userlist`、`doc create_doc`、`msg get_msg_media`）整体替换为服务端 schema 下发的服务/资源/方法路径（如 `contact users search`、`doc contents get`、`message aibot sessions list`）；方法名与参数名均可能不同，现有脚本与集成必须按 `wecom-cli <service> <method> --help` / `--doc` 逐个核对迁移。
  - 品类标识调整：`msg` 更名为 `message`，`schedule` 更名为 `calendar`；可用服务列表以 `wecom-cli --help` 实际输出为准。
  - 请求体不再使用位置参数 JSON 字符串，改为三种可组合的方式：schema 生成的命名参数（如 `--id root`）、`--json '<JSON>'`、`--set path=value`。
  - 服务目录与方法 schema 在线获取并本地缓存（TTL 60 秒），查看帮助与调用工具均需要凭证与网络。
  - 媒体文件不再统一下载到临时目录，下载/落盘行为由 `--output` / `--output-dir` 控制，文件读写受沙箱目录约束。

  迁移示例：

  ```bash
  # 旧
  wecom-cli contact get_userlist '{}'
  wecom-cli doc create_doc '{"doc_type": 3, "doc_name": "项目周报"}'
  # 新（方法名与参数以 --help 为准）
  wecom-cli contact users search --json '{}'
  wecom-cli doc create --json '{"doc_type": 3, "doc_name": "项目周报"}'
  ```

- b2dfa0f: 统一输出、错误与环境变量约定
  - 错误改为以结构化 JSON 输出到 **stdout**（`{"error": {"type", "code", "message"}}`），日志与提示信息一律走 stderr；CLI 自身错误码段为 893000–893299，后台 errcode 原样透传。
  - 明确退出码约定：`0` 成功（含 `--help` / `--version`），`1` 运行时错误，`2` 用法错误（后台返回用法类错误码时渲染当前命令 help 并以 2 退出）。
  - `--version` 输出格式改为 `wecom-cli <version> (<distribution> <RFC 3339 构建时间> <git_commit_id>)`。
  - `WECOM_CLI_LOG_FILE` 移除，改为 `WECOM_CLI_LOG_DIR`：值为目录，JSON Lines 日志按天写入 `<dir>/ww.log.<日期>`（UTC+8）。
  - 新增 `WECOM_CLI_ADDITIONAL_HEADERS`（及 `WECOM_CLI_ADDITIONAL_HEADERS_*` 后缀形式）注入额外请求头。
  - 新增可选配置文件 `<config_dir>/config.json`（`headers` / `tmp_dir`），环境变量优先级高于配置文件。

  迁移指引：解析 stderr 文本错误的脚本请改为解析 stdout 的 JSON 错误；使用 `WECOM_CLI_LOG_FILE` 的环境请改用 `WECOM_CLI_LOG_DIR` 并传入目录路径。

### Minor Changes

- b2dfa0f: 新增服务品类与执行能力
  - 服务品类扩展：新增 `mail`（邮件）、`sheet`（在线表格）、`smartpage`（智能文档）、`disk`（微盘）、`media`（媒体文件）、`identity`（身份）等，文档能力增强（搜索、重命名、权限管理）。
  - 本地 helper：以 `+` 前缀挂载在命令路径上（如媒体上传、文件导入场景）。
  - 执行 flag：`--dry-run` 本地校验并打印请求；`--page-count` / `--page-delay` 游标自动分页（NDJSON 输出）；`--output` / `-o` 与 `--output-dir` 将响应与附件落盘（0600）。
  - 文档与调试：`--doc` / `--schema` 输出服务或方法文档与 schema；内建 `schema list|get`、`cache status|clear` 命令。
  - 长任务自动轮询：后台返回 `taskid` 时按配置轮询直至完成或超时。
  - `--json` / `--set` 中的非法 JSON 片段自动修复，并在 stderr 输出修复前后对照。

## 0.1.9

### Patch Changes

- 3700b1b: update cmds

## 0.1.8

### Patch Changes

- 7774ba3: update init process

## 0.1.7

### Patch Changes

- 83a7495: add smartsheet auto file upload helpers
