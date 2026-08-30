# `WECOM_CLI_LOG_LEVEL` 打开后 stderr 有日志

- **场景**：验证 stderr 日志输出
- **Transport**：HTTP
- **来源**：C.24

## 测试等级

**P0**（设置 `WECOM_CLI_LOG_LEVEL=debug` 后 stderr 输出日志内容）
- **条件**：`WECOM_CLI_LOG_LEVEL=debug`，mock server 返回 catalog
- **断言**：退出码 0，stderr 非空且包含 `wecom` 关键词，stdout 正常业务输出

## 前置条件

- `WECOM_CLI_LOG_LEVEL=debug`
- mock server 返回 catalog

## 命令

```bash
WECOM_CLI_LOG_LEVEL=debug wecom schema list
```

## 断言 — CLI

- 退出码：`0`
- stderr：包含日志文本（建议只断言关键字段如时间戳格式、含 `wecom`，不做全文匹配）
- stdout：正常业务输出

## 关键上下文

- `logging.rs`：`build_logging()` → `stderr_filter` → `tracing_subscriber::fmt::layer().with_writer(std::io::stderr).compact()`。
- 风险：日志内容容易波动，建议只断言"stderr 非空且包含特定关键词"。
