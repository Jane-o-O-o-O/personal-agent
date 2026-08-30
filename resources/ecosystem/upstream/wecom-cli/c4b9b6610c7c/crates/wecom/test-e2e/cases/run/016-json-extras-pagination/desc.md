# CLI `--json` 中 `page_count` 被 apply_extras 提取并触发分页

- **场景**：验证通过 `--json` 传入 `page_count` 时，`apply_extras` 正确提取并设置分页参数
- **Transport**：HTTP（wiremock）
- **来源**：apply_extras 分页路径

## 前置条件

- wiremock 挂载 discovery + 两页 method call mock
- 第 1 页：`has_more: true`，第 2 页：`has_more: false`（末页）

## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list", "--json", "{"page_count": 2}"])
    .output(output)
    .await
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 输出 2 行 NDJSON，每行可解析为合法 JSON

## 断言 — HTTP Endpoint

- `/department/list` 被调用 2 次（分页）

## 关键上下文

- `service/command/assemble.rs`：`apply_extras` 从 `--json` payload 提取非 schema 字段
- `service/handler.rs`：提取后的 `page_count` 传入 `RunOptions` 触发分页
