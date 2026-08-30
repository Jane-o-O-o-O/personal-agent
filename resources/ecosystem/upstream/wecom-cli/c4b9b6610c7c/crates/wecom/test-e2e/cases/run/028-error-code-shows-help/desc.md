# 后台 10021 错误码展示当前命令 help

- **场景**：`wecom hr department list` 时 method 接口返回网关错误信封 `error.code = 10021`，`run` 以 `Err(CliOutput { code: 2 })` 返回（`exit_code()` 为 2），`render()` 输出 `error: <后台 errmsg>` 行 + 空行 + `department list` 子命令的 help（对齐 clap 错误输出格式）
- **Transport**：HTTP（wiremock）
- **对齐**：`CliRun::execute` 分发结果后，若错误 `code() == 10021`（Api 变体透传后台码），则渲染当前叶子子命令 help，并以 `Error::CliOutput { code: 2 }` 返回（与正常 help/用法错误同路径，不继续向上传播）

## 前置条件

- 挂载标准 discovery mocks（catalog + hr 服务详情）
- 挂载 `/department/list` method mock，返回 `error.code = 10021`

## 断言 — CLI

- `wecom hr department list --id root` 返回 `Err(CliOutput)`，`exit_code()` 为 2
- `err.render()` 包含 `error: invalid usage`（后台 errmsg 行）、`Usage`（help 头部）与 `List departments`（method 描述）

## 关键上下文

- `client/run/execute.rs`：`CliRun::execute` 在分发后以 `err.code() == 10021` 判等命中，再经 `render_leaf_help` 渲染当前子命令 help（`error:` 前缀并入默认文案），并以 `Error::CliOutput { code: 2 }` 返回
