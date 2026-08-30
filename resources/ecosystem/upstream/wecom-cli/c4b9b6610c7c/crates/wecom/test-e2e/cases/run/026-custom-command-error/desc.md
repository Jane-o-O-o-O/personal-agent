# 扩展命令 handler 错误传播

- **场景**：注册 handler 固定返回 `Error::Other("boom!")` 的扩展命令 `boom`，`wecom boom` 时 `run` 返回 `Err`、`exit_code()` 为 1，且不触发 service discovery
- **Transport**：HTTP（wiremock）
- **对齐**：wecom-cli 的 `auth` 错误路径（handler 错误经 `wecom::Error::Other` 包装，走统一退出码）

## 前置条件

- 不挂任何 mock（扩展命令命中时跳过 discovery，若触网即 404）

## 断言 — CLI

- `wecom boom` 返回 `Err`，`exit_code()` 为 1
- 错误为 `Error::Other`，message 为 `"boom!"`
- 全程零网络请求

## 关键上下文

- `client/run/execute.rs`：`CliRun::execute` 分发到扩展命令 handler，其返回值原样成为 `run` 的返回
