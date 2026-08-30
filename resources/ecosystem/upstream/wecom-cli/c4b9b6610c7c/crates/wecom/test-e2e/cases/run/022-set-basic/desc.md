# CLI `--set` 深层参数赋值基本功能

- **场景**：验证 `--set path=value` 通过 `assemble_payload` → `apply_set_ops` 正确写入请求体
- **Transport**：HTTP（wiremock）
- **来源**：`--set` 端到端集成

## 前置条件

- wiremock 挂载 discovery mock
- method mock 挂载 `/department/list`，`expect(1)` 确保方法被调用

## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list", "--id", "root", "--set", "extra_field=hello"])
    .output(output)
    .await
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 为合法 JSON，包含 `departments` 数组
- method mock 被命中 1 次

## 关键上下文

- `service/command/assemble.rs`：`assemble_payload` 在 `--json`、matches 之后应用 `--set`（最高优先级）
- `service/command/assemble.rs`：`apply_set_ops` 使用 `upsert_value_deep`，按需创建中间容器
