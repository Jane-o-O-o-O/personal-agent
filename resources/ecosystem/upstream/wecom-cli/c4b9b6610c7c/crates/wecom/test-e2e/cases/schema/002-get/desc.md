# Schema 详情 `schema get`

- **场景**：获取指定方法的 schema 信息
- **Transport**：HTTP（wiremock）
- **来源**：B.10

## 前置条件

- wiremock 挂载 hr service detail discovery mock

## 命令

```rust
client.run(vec!["wecom", "schema", "get", "hr.department.list"])
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout JSON 包含 `method`（含 `department.list`）、`request`、`response` 字段

## 关键上下文

- `commands/schema.rs`：`handle_schema_get()` → 按 `.` 分割 → 第一段 service name，后续 method path
