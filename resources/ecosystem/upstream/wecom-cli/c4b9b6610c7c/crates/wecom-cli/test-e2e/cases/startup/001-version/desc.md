# `--version` 真实二进制可执行

- **场景**：确认二进制可启动、主入口无异常
- **Transport**：无
- **来源**：A.1

## 测试等级

**P0**（`--version` 命令正常输出版本信息，无网络请求）
- **条件**：执行 `wecom --version`
- **断言**：退出码 0，stdout 格式为 `wecom <version> (<distribution> <RFC 3339> <git_commit_id>)`，无 HTTP 请求发出

## 前置条件

无特殊前置。

## 命令

```bash
wecom --version
```

## 断言 — CLI

- 退出码：`0`
- stdout：格式 `wecom <version> (<distribution> <RFC 3339 无秒> <git_commit_id>)`（如 `wecom 1.1.0 (unknown 2026-06-30T14:50Z a1b2c3d)`）

## 断言 — HTTP Endpoint

无请求发出。`--version` 在 `Client::run()` 内部早期返回，不触发网络调用。

## 断言 — FS

无文件读写。

## 关键上下文

- `crates/wecom/src/client/run/execute.rs`：`CliRun::execute` 在开头检测 `-V` / `--version`，经 `output.print()` 输出 `CLI_INFO` 后提前返回 `Ok(())`。
- 输出来自 `CliInfo` 的 `Display`，格式 `{name} {version} ({distribution} {build_time} {commit})`，包含 `BUILD_VERSION`、`WECOM_CLI_DISTRIBUTION`、`GIT_COMMIT_ID` 和 RFC 3339 构建时间。
