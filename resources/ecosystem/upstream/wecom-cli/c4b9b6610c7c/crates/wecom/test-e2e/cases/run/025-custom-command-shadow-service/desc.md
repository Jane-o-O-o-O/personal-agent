# 扩展命令屏蔽同名服务

- **场景**：catalog 中含名为 "hr" 的服务，同时注册同名 "hr" 扩展命令；`wecom --help` 全量发现时同名服务被跳过，不进入命令树
- **Transport**：HTTP（wiremock）

## 前置条件

- wiremock 挂 catalog mock（含 hr 服务）；**不挂** hr schema mock（若同名服务被展开，请求 404）

## 断言 — CLI

- `wecom --help` 返回 Ok
- help 输出包含扩展命令的 about 文案（`Custom HR command`）
- help 输出不包含服务的 description（`Human Resources`）
- 仅发生一次 catalog discovery 请求（hr schema 未被请求）

## 关键上下文

- `client/run/execute.rs`：service discovery 循环中跳过与扩展命令同名的服务（`service shadowed by custom command, skipped`）
