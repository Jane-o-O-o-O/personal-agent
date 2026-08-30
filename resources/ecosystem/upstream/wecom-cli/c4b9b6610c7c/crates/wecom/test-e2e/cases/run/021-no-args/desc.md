# 无参数时 clap `arg_required_else_help` 返回 exit code 2

- **场景**：无参数调用 `client.run(["wecom"])` → discovery 成功 → clap 缺少子命令 → exit code 2
- **Transport**：HTTP（wiremock）

## 前置条件

- wiremock 挂载 discovery（空 catalog）

## 断言

- `run` 返回 `Err`，`exit_code() == 2`
