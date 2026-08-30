# 分页全量拉取 `--page-count`

- **场景**：验证 `--page-count --page-delay` 分页参数交互行为，mock 返回 3 页数据
- **Transport**：HTTP（wiremock）
- **来源**：C.21, S9

## 前置条件

- wiremock 挂载 discovery + 3 页 method call mock
- 第 1 页：`has_more: true, next_cursor: "cursor_1"` + 业务数据
- 第 2 页：`has_more: true, next_cursor: "cursor_2"` + 业务数据
- 第 3 页：`has_more: false` + 业务数据

## 命令

```rust
client.run(hr_dept_list_argv(&["--page-count", "3", "--page-delay", "1"]))
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 输出 3 行 NDJSON，每行可解析为合法 JSON

## 关键上下文

- `service/execute.rs`：`extract_next_cursor()` 检查 `has_more` + `next_cursor`
- 分页终止条件：`has_more=false` 或达到 `page_count`
