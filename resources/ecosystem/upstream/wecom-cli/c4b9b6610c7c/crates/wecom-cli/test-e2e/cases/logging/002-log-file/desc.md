# `WECOM_CLI_LOG_DIR` 打开后生成日志文件

- **场景**：验证日志文件落盘
- **Transport**：HTTP
- **来源**：C.25

## 测试等级

**P0**（设置 `WECOM_CLI_LOG_DIR` 后生成按日期命名的 JSON-line 日志文件）
- **条件**：`WECOM_CLI_LOG_DIR=<tmp_dir>/logs`，mock server 返回 catalog
- **断言**：退出码 0，`<tmp_dir>/logs/ww.log.<YYYY-MM-DD>` 文件存在、非空、每行为 JSON 对象

## 前置条件

- `WECOM_CLI_LOG_DIR=<tmp_dir>/logs`
- mock server 返回 catalog

## 命令

```bash
WECOM_CLI_LOG_DIR=<tmp_dir>/logs wecom schema list
```

## 断言 — CLI

- 退出码：`0`
- 命令正常执行（日志写入不阻塞主流程）

## 断言 — FS

- `<tmp_dir>/logs/ww.log.<YYYY-MM-DD>` 文件存在（日期为 CST/UTC+8 当日）
- 文件非空
- 文件内容为 JSON-line 格式（每行一个 JSON 对象）

## 关键上下文

- `logging.rs`：`CstDailyAppender::new(dir, "ww.log")` → 日志文件路径 `<dir>/ww.log.<YYYY-MM-DD>`。
- `logging.rs`：日期使用 CST (UTC+8) 而非 UTC。
- `logging.rs`：`tracing_appender::non_blocking` → guard 被 `std::mem::forget` leak → 进程退出时 OS flush。
- 风险：涉及异步 non-blocking writer，测试需注意 flush/进程退出时机。
