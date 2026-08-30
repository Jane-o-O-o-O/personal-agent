# 扩展命令子命令帮助

- **场景**：注册带 `login`/`show` 子命令的扩展命令 `auth`，`wecom auth --help` 输出包含其子命令名，且不触发 service discovery
- **Transport**：HTTP（wiremock）
- **对齐**：wecom-cli 的 `auth` 命令（derive `Parser` + `subcommand_required + arg_required_else_help`，无子命令时 clap 展示 help；本用例验证子命令参与 clap 帮助体系）

## 前置条件

- 不挂任何 mock（扩展命令命中时跳过 discovery；`--help` 走 clap 渲染不触网）

## 断言 — CLI

- `wecom auth --help` 返回 Ok
- help 输出包含子命令名 `login` 与 `show`
- 全程零网络请求

## 关键上下文

- `client/run/execute.rs`：扩展命令的 clap 定义整体并入命令树，子命令帮助由 clap 原生渲染
