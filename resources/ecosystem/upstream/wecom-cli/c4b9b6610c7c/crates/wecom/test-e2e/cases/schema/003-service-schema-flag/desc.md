# Service `--schema` flag

- **场景**：验证 service 级 `--schema` flag
- **Transport**：HTTP（wiremock）
- **来源**：B.11

## 前置条件

- wiremock 挂载 catalog + hr service detail discovery mocks

## 命令

```rust
client.run(vec!["wecom".into(), "hr".into(), "--schema".into()])
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout JSON 中 `name` = `"hr"`，`methods` 非空数组

## 关键上下文

- `service/handler.rs`：`ServiceCmdArgs { schema: Some(true), .. }` → `svc.schema()` → 输出
