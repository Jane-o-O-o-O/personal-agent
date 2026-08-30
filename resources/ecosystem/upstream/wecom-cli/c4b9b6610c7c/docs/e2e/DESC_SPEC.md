# desc.md 规范标准

本文档定义 `test-e2e/cases/<group>/<NNN>-<slug>/desc.md` 的格式规范，对两个套件（`crates/wecom/test-e2e/`、`crates/wecom-cli/test-e2e/`）统一适用。所有 desc.md 必须严格遵守此标准，以确保：

1. 人工可读、结构统一
2. LLM 可机械解析、生成 test.rs
3. 新增/修改用例时有据可循

项目通过 discovery 协议 + HTTP 传输（网关扁平协议）调用远程服务。

---

## 文件结构（必须按此顺序）

```markdown
# <标题>

- **场景**：<一句话>
- **Transport**：<值>
- **来源**：<编号或说明>

## 测试等级

<内容>

## 前置条件

<内容>

## 命令

<内容>

## 断言 — CLI

<内容>

## 断言 — HTTP Endpoint

<内容>

## 断言 — FS

<内容>

## 关键上下文

<内容>
```

**可选章节**：

- `## 测试等级`：有明确等级划分时书写（见下文）
- `## 变体`、`## 关联用例`：放在"关键上下文"之后

---

## 各章节规范

### 标题（`# <标题>`）

- 必须是一级标题
- 用一短句描述"这个测试验证什么"
- 若涉及 CLI flag 或环境变量，用反引号包裹：`` `--version` 真实二进制可执行 ``
- 不要包含用例编号（编号已在目录名中）

### 元数据行

标题下紧跟元数据行，用无序列表 + 加粗 key：

```markdown
- **场景**：<动词开头的一句话，不超过 30 字>
- **Transport**：<HTTP / 无>
- **来源**：<可追溯的编号（如 A.1、S2、C.25）或简短说明>
```

**规则**：

| 字段 | 允许值 | 说明 |
|---|---|---|
| 场景 | 自由文本 | 动词开头，如"验证…"、"确认…" |
| Transport | `HTTP`、`无` | 描述测试是否涉及网络请求；可附加括号补充，如 `HTTP（wiremock）`、`HTTP（连接失败）`、`无（直接操作 FS）` |
| 来源 | 自由文本 | 可追溯的编号或一句话说明 |

**可选第 4 行**：当用例依赖编译 feature 时追加：

```markdown
- **Feature**：`custom-endpoint`
```

### `## 测试等级`（可选）

有明确等级划分时书写，格式固定：

```markdown
## 测试等级

**P0**（<该等级覆盖的核心行为一句话>）
- **条件**：<触发条件>
- **断言**：<预期结果>
```

等级约定：`P0` 为核心路径（命令正常执行、关键副作用发生），`P1` 为变体/边界行为。一个用例可列多个等级段落。

如用例内部拆分为多个子测试，可追加 `## 子测试` 表格：

```markdown
## 子测试

| 测试 | 验证 |
|------|------|
| `run_custom_base_url` | `base_url()` 指向自定义 mock，schema list 正常 |
```

### `## 前置条件`

描述测试执行前需要准备的所有环境。用无序列表，每项一个条件。

**分类书写**（按此顺序，缺哪个省哪个）：

1. **Feature gate**：`启用 custom-endpoint feature`
2. **Mock server**：`mock server 返回 xxx`
3. **环境变量**：`设置 WECOM_CLI_XXX=value`
4. **文件系统**：`临时目录下写入 xxx 文件`

**mock 描述规范**：

- 简写：`mock server 返回 catalog + service detail`（标准 discovery mock）
- 详写：附 JSON 示例时用 code block
- 多步骤 mock 用有序列表

**示例**：

```markdown
## 前置条件

- mock server 返回 catalog + service detail
- method call 返回含 `taskid` 的响应：
  ```json
  { "result": null, "taskid": "task_001", "long_task_poll": { "done": false, "task_timeout": 60, "polling_interval_ms": 100 } }
  ```
- 轮询 endpoint 配置：
  1. 第 1 次返回 `done: false`
  2. 第 2 次返回 `done: true` + 最终 result
```

**无前置条件时**：写 `无特殊前置。`

### `## 命令`

library-level 用例用 `rust` code block 写调用表达式；process-level 用例用 `bash` code block 写 CLI 命令：

````markdown
## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list"]).output(output).await
```
````

````markdown
## 命令

```bash
wecom hr department list --id root --dry-run
```
````

**规则**：

- 占位符用 `<xxx>` 表示：`<tmp_dir>`、`<mock_server>`
- 若有多个变体命令，分别列出并在标题标注：`## 命令（3 种变体）`
- 环境变量前缀写在命令行内：`WECOM_CLI_LOG_DIR=<tmp_dir>/logs wecom schema list`
- 如果需要 cd：`cd <tmp_dir> && wecom schema list`

### `## 断言 — CLI`

描述退出码和标准输出/标准错误的预期。

**退出码**（必填）：

```markdown
- 退出码：`0`
```

允许值：`` `0` ``、`` `1` ``、`` `2` ``

**stdout**（按需选用以下断言类型）：

| 断言类型 | 格式 | 示例 |
|---|---|---|
| 包含子串 | `stdout：包含 "xxx"` | `stdout：包含 "wecom"` |
| 合法 JSON | `stdout：合法 JSON` | |
| JSON 字段 | `stdout：JSON 对象，xxx` + 子列表 | 见下方 |
| JSON 错误 | `stdout：JSON 错误对象` + 子列表 | 见下方 |
| DownloadResult | `stdout：\`DownloadResult\` JSON` + 子列表 | 见下方 |
| 多行输出 | `stdout：N 行 compact JSON（NDJSON）` | |
| 文本匹配 | `stdout 第一行：xxx` | |

**JSON 字段断言的标准格式**：

```markdown
- stdout：JSON 对象，`departments` 数组包含 mock 返回的数据
```

**JSON 错误断言的标准格式**：

```markdown
- stdout：JSON 错误对象
  - `error.type` = `"NetworkError"`
  - `error.code` = `893002`
  - `error.message` 包含 `"xxx"`
```

**DownloadResult 断言的标准格式**：

```markdown
- stdout：`DownloadResult` JSON
  - `content_type`: `"application/json"`
  - `file_path`: 包含 `out.json`
  - `size`: > 0
```

**stderr**（仅在需要时写）：

```markdown
- stderr：包含日志文本
```

### `## 断言 — HTTP Endpoint`

描述 mock server 侧预期收到的 HTTP 请求。仅当 Transport 为 HTTP 时需要。

**格式规范**：

- 每个 endpoint 一项，用无序列表
- 必须注明调用次数
- 请求 body 用 JSON code block 或行内 backtick

```markdown
## 断言 — HTTP Endpoint

- `POST /service/discovery` 被调用 2 次（catalog + service detail）
- `POST /department/list` 被调用 1 次
  - body: `{ "payload": "{\"id\":\"root\"}" }`
  - headers: `Authorization: Bearer <token>`
- `/department/list` 调用次数 = 0
```

**"无请求发出"的写法**：

```markdown
## 断言 — HTTP Endpoint

无请求发出。<原因说明>
```

### `## 断言 — FS`

描述文件系统的可观测变化。

**格式规范**：

| 断言类型 | 格式 |
|---|---|
| 文件被创建 | `<path> 被创建` |
| 文件内容 | `文件内容为 xxx` |
| 文件权限 | `Unix 权限 \`0o600\`` |
| 文件名推导 | `文件名由 xxx 生成` |
| 文件被删除 | `<path> 被删除` |
| 目录为空 | `<dir> 目录为空` |
| 无文件变化 | `无文件写入` 或 `无文件读写` |

**注意**：`断言 — FS` 只描述文件系统的**写入/删除/创建**等可观测变更。**不要写"CLI 读取了 xxx 文件"**——文件读取无法直接断言，应通过下游可观测副作用验证：

- 文件上传 → 在 `断言 — HTTP Endpoint` 中验证请求 body 包含文件内容
- config.json 加载 → 在 `断言 — HTTP Endpoint` 中验证请求 header 或行为变化
- config 解析失败 → 在 `断言 — CLI` 中验证错误输出

**示例**：

```markdown
## 断言 — FS

- `<tmp_dir>/out.json` 被创建
- 文件内容为 API 响应的 JSON
- Unix 权限 `0o600`
```

### `## 关键上下文`

列出与此用例相关的源码路径和协议细节。用无序列表，每项格式：

```markdown
- `<file.rs>`：<简短说明>
```

**规则**：

- 路径相对仓库根（如 `crates/wecom/src/client/run.rs`）或 crate root（如 `logging.rs`），保持用例内一致
- 跨 crate 引用时带 crate 前缀，如 `crates/wecom-transport/src/http/polling.rs`
- 说明要具体到函数/字段/逻辑分支
- 可以包含协议细节（如"payload 是字符串化 JSON"）

### `## 变体`（可选）

当一个用例有多个值得单独说明的分支行为时使用。每个变体用三级标题或加粗段落。

```markdown
## 超时变体

若轮询超过 `task_timeout` 秒仍未 `done=true`：
- CLI 退出码：`1`
- stdout：`OtherError`，message 含 `"timeout"`
```

### `## 关联用例`（可选）

引用其他相关的 desc.md：

```markdown
## 关联用例

- `pagination/002-page-count-exceeds`：验证页数超限时的封顶行为
```

---

## 省略规则

**可以省略的章节**（用固定文案或整段省略）：

| 情况 | 处理 |
|---|---|
| 无测试等级 | 整段省略 |
| 无 HTTP 断言 | 写 `无请求发出。<原因>` 或 `无请求发出。` |
| 无 FS 断言 | 写 `无文件写入` 或 `无文件读写` |
| 无变体 | 整段省略 |
| 无关联用例 | 整段省略 |

**不可省略的章节**：标题、元数据行、前置条件、命令、断言 — CLI、关键上下文。

---

## 示范对照

### 最简用例（startup/001-version）

```markdown
# `--version` 真实二进制可执行

- **场景**：确认二进制可启动、主入口无异常
- **Transport**：无
- **来源**：A.1

## 前置条件

无特殊前置。

## 命令

```bash
wecom --version
```

## 断言 — CLI

- 退出码：`0`
- stdout：格式 `wecom <version> (<distribution> <RFC 3339> <git_commit_id>)`

## 断言 — HTTP Endpoint

无请求发出。`--version` 在 `Client::run()` 内部提前返回，不触发网络调用。

## 断言 — FS

无文件读写。

## 关键上下文

- `crates/wecom/src/client/run.rs`：`--version` 判断在 `run()` 最前面，直接输出后返回 `Ok(())`。
```

### 中等复杂用例（output/001-file）

```markdown
# `--output` 将响应写入文件

- **场景**：验证 JSON 响应写入指定文件
- **Transport**：HTTP（wiremock）
- **来源**：B.17

## 前置条件

- mock server 返回 catalog + service detail + method call JSON 响应
- 临时目录作为 writable 路径

## 命令

```bash
wecom hr department list --id root --output <tmp_dir>/out.json
```

## 断言 — CLI

- 退出码：`0`
- stdout：`DownloadResult` JSON
  - `content_type`: `"application/json"`
  - `file_path`: 包含 `out.json`
  - `size`: > 0

## 断言 — HTTP Endpoint

- `POST /department/list` 被调用 1 次

## 断言 — FS

- `<tmp_dir>/out.json` 被创建
- 文件内容为 API 响应的 JSON
- Unix 权限 `0o600`

## 关键上下文

- `crates/wecom/src/client/run.rs`：`--output` 触发输出路由，写入文件并返回 `DownloadResult`。
```

### 复杂用例（长任务轮询）

```markdown
# 长任务轮询

- **场景**：验证 method call 触发长任务轮询的完整交互
- **Transport**：HTTP（wiremock）
- **来源**：S2

## 前置条件

- mock server 返回 catalog + service detail
- method call 返回含 `taskid` 的响应：
  ```json
  { "result": null, "taskid": "task_001", "long_task_poll": { "done": false, "task_timeout": 60, "polling_interval_ms": 1 } }
  ```
- 轮询 endpoint 配置：
  1. 第 1 次返回 `done: false`
  2. 第 2 次返回 `done: true` + 最终 result

## 命令

```bash
wecom hr department list --id root
```

## 断言 — CLI

- 退出码：`0`
- stdout：最终轮询结果的 JSON

## 断言 — HTTP Endpoint

- method call endpoint 被调用 1 次
- 轮询 endpoint 被调用 2 次
- 每次轮询 body：
  ```json
  { "method": "PollClawLongTask", "payload": "{\"taskid\":\"task_001\"}" }
  ```

## 断言 — FS

- 无文件写入

## 关键上下文

- `crates/wecom-transport/src/http/polling.rs`：响应含 `taskid` → 触发轮询，body 为 `{"method": "PollClawLongTask", "payload": ...}`。
- `crates/wecom-transport/src/polling.rs`：通用轮询框架，处理超时和网络重试。

## 超时变体

若轮询超过 `task_timeout` 秒仍未 `done=true`：
- CLI 退出码：`1`
- stdout：`OtherError`，message 含 `"timeout"`
```
