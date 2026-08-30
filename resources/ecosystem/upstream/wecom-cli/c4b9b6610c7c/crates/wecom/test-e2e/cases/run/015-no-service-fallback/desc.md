# CLI 无匹配 service 时回退 clap 默认错误

- **场景**：验证 `wecom notexist foobar` 中 `notexist` 不是 catalog 中任何 service 时，回退 clap 默认 unknown subcommand 错误
- **Transport**：HTTP（wiremock）

## 前置条件

- wiremock 挂载 catalog mock，仅含 hr 服务
- 调用 `wecom notexist foobar`

## 断言 — CLI

- `run` 返回 `Err`，`exit_code()` 为 `2`
- error message 包含 `"notexist"`（识别为无效子命令）
- error message 不包含 `"hr"`（不泄露 catalog 中其他 service 名）

## 关键上下文

- `client/run/execute.rs`：无法匹配任何已知 service → 回退 clap 默认错误处理
