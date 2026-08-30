# 配置文件 JSON 非法时返回结构化错误

- **场景**：验证启动阶段配置解析失败的用户可见表现
- **Transport**：无（client 构建阶段就失败）
- **来源**：A.7

## 测试等级

**P1**（非法 `config.json` 导致启动失败并输出结构化错误 JSON）
- **条件**：`config.json` 内容为 `{invalid json!!!`，执行 `wecom --version`
- **断言**：退出码 1，stdout 为 JSON 且 `error.type == "ConfigError"`、`error.code == 893005`、message 含 "Failed to parse config file"

## 前置条件

- 写入非法 `config.json`（例如 `{invalid json!!!`）
- 设置 `WECOM_CLI_CONFIG_DIR` 指向该目录

## 命令

```bash
WECOM_CLI_CONFIG_DIR=<tmp_dir> wecom --version
```

使用 `--version` 而非其他命令——因为 `main.rs` 中 `load_config_file` 在 `client.run()` 之前执行，即使是 `--version` 也会在入口层失败。这恰好是库层测试和二进制测试的差异点。

## 断言 — CLI

- 退出码：`1`
- stdout：JSON 错误对象
  - `error.type` = `"ConfigError"`
  - `error.message` 包含 `"Failed to parse config file"`
  - `error.code` = `893005`（`E_CONFIG_CLIENT`）

## 断言 — HTTP Endpoint

无请求发出（client 构建阶段就失败了）。

## 断言 — FS

- 无文件写入

## 关键上下文

- `crates/wecom-cli/src/config.rs`：`load_config_file()` → `serde_json::from_str` 失败 → `wecom::Error::config("Failed to parse config file ...")`。
- `crates/wecom/src/error.rs`：`Error::config()` 构造 `Error::Wrapped(MessageError::config(..))`，`render()` 返回 `{"error":{"code":893005,"message":"...","type":"ConfigError"}}`。
- `crates/wecom-cli/src/error.rs`：`Error::Wecom(..)` 的 `exit_code()` 返回 `1`。
