# CLI `--help` 帮助信息输出

- **场景**：验证传入 `--help` 参数时正确展示帮助信息
- **Transport**：HTTP（wiremock，需要 catalog mock 因为 --help 会触发 list_services）
- **来源**：CLI 帮助测试

## 前置条件

- wiremock 挂载 discovery mock

## 命令

```rust
client.run(vec!["wecom", "--help"]).output(output).await
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 包含 `"Usage"`

## 关键上下文

- `client/run/parse_error.rs`：`--help` 触发 clap 帮助输出，需要 discovery 提供服务的 command tree
