# CLI `on_extra_data` 无额外字段时不触发

- **场景**：验证响应仅含 `result` 和 `error`（无额外字段）时，`on_extra_data` 不被触发
- **Transport**：HTTP（wiremock）
- **来源**：额外数据回调空值处理

## 前置条件

- wiremock 挂载 discovery + method call mock
- method 响应仅含 `result` 和 `error: null`

## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list"])
    .on_extra_data(callback)
    .output(output)
    .await
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout JSON 中 `status` 为 `"ok"`

## 断言 — Callbacks

- `on_extra_data` 触发次数为 0

## 关键上下文

- `client/run/mod.rs`：result/error 之外的字段为空时 on_extra_data 不触发
