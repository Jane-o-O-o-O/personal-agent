# 扩展命令（CustomCommand）：命中分发 + 跳过服务发现 + 参与帮助体系

- **场景**：通过 `ClientBuilder::command()` 注册 `auth` 扩展命令后，`wecom auth login` 由 `CliRun::execute` 分发到其 handler，且不触发 service discovery；`wecom --help` 输出包含扩展命令
- **Transport**：HTTP（wiremock）

## 前置条件

- 用例 1：不挂任何 mock（若触网即 404，run 失败）
- 用例 2：挂 catalog mock（`--help` 触发全量 discovery）

## 断言 — CLI

- `wecom auth login` 返回 Ok，handler 被调用且能取到 `login` 子命令 matches
- `wecom auth login` 全程零网络请求（服务发现被跳过）
- `wecom --help` 输出包含 `auth` 及其 about 文案

## 关键上下文

- `client/run/execute.rs`：`CliRun::execute` 将扩展命令注册在服务发现子命令之前；first_arg 命中扩展命令名时跳过 discovery；dispatch 时优先匹配扩展命令
