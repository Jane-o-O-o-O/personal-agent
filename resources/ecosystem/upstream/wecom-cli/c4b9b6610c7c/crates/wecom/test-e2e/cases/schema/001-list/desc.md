# Schema 列表 `schema list`

- **场景**：验证 `schema list` 子命令的完整链路
- **Transport**：HTTP（wiremock）
- **来源**：B.9, S1

## 前置条件

- wiremock 挂载 discovery mocks（catalog + hr service detail）

## 命令

```rust
client.run(vec!["wecom".into(), "schema".into(), "list".into()])
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 为合法 JSON 数组，包含 `name: "hr"` 且 `methods` 非空

## 关键上下文

- `commands/schema.rs`：`handle_schema_list()` → `client.list_services()` + 逐 service 拉取
