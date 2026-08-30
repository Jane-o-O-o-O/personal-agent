# CLI 参数与 `--json` extras 冲突时 CLI 优先，但 `--json` 值送达后端

- **场景**：验证 CLI `--page-count 2` 优先于 `--json` 中 `page_count: 3`（控制分页页数），同时 `page_count: 3` 作为未提取字段留在请求体中发送给后端
- **Transport**：HTTP（wiremock）
- **来源**：apply_extras 冲突路径

## 前置条件

- wiremock 挂载 discovery + 两页 method call mock
- 第 1 页 mock 使用 `body_string` 匹配器，要求请求体中包含 `"page_count": 3`
- CLI 指定 `--page-count 2`，`--json` 含 `{"page_count": 3}`

## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list", "--json", "{"page_count": 3}", "--page-count", "2"])
    .output(output)
    .await
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 输出 2 行 NDJSON（CLI `--page-count 2` 生效，不是 JSON 的 3）

## 断言 — HTTP Endpoint

- `/department/list` 被调用 2 次（分页，CLI 参数优先）
- 第 1 页请求体中包含 `"page_count": 3`（未被提取，原样发送给后端）

## 关键上下文

- `service/command/assemble.rs`：`apply_extras` 检测到已设置的字段后保留原始 key，不覆盖
- `service/handler.rs`：提取后的 `page_count` 传入 `RunOptions`；未提取的 key 留在 payload 中通过 HTTP 发送
