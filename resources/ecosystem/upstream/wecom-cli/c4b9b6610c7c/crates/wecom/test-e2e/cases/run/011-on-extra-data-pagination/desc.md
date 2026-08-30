# CLI `on_extra_data` 分页模式下每页触发

- **场景**：验证分页请求的每页响应携带额外字段（`page: "1"`、`page: "2"`）时，`on_extra_data` 每页各触发一次
- **Transport**：HTTP（wiremock）

## 前置条件

- wiremock 挂载 discovery + 两页 method call mock
- 第 1 页：`page: "1"`，`has_more: true`
- 第 2 页：`page: "2"`，`has_more: false`（末页）

## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list", "--page-count", "2", "--page-delay", "1"])
    .on_extra_data(callback)
    .output(output)
    .await
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 输出 2 行 NDJSON，每行可解析为合法 JSON

## 断言 — Callbacks

- `on_extra_data` 触发 2 次
- 第 1 次 `page` 字段为 `"1"`，第 2 次 `page` 字段为 `"2"`

## 关键上下文

- `client/run/mod.rs`：分页模式下每页响应独立触发 on_extra_data
