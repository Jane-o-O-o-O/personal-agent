# 顶层子命令拼写错误的相似建议

- **场景**：验证 `wecom schma`（`schma` 是 `schema` 的拼写错误）时 clap 给出相似子命令建议
- **Transport**：HTTP（wiremock，空 catalog 避免干扰）
- **来源**：CLI 错误提示

## 前置条件

- wiremock 返回空 catalog `{"items": []}`，不注册 service 子命令
- 命令树仅含 `cache`（hidden）、`schema` 两个子命令

## 命令

```rust
client.run(vec!["wecom", "schma"]).output(output).await
```

## 断言 — CLI

- `run` 返回 `Err`，`exit_code()` 为 `2`
- 错误类型为 `Error::CliOutput`
- error message 包含 `"schema"`（clap 相似建议）

## 关键上下文

- `service/command/build.rs`：catalog items 注册为 clap 子命令
- `cache` 是 `.hide(true)` 命令，不应出现在建议中
