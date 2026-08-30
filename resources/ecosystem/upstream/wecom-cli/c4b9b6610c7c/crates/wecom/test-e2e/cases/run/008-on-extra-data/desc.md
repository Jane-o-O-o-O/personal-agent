# CLI `on_extra_data` 单页响应触发额外数据回调

- **场景**：验证方法调用返回额外字段（非 result/error）时，`on_extra_data` 回调被触发
- **Transport**：HTTP（wiremock）
- **来源**：额外数据回调

## 前置条件

- wiremock 挂载 discovery + method call mock
- method 响应包含 `result`、`error: null` 和额外字段 `custom_extra: "hello"`

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

- `on_extra_data` 触发 1 次
- 回调收到的数据中 `custom_extra` 为 `"hello"`

## 关键上下文

- `client/run/mod.rs`：解析响应时除 result/error 外的字段通过 `.on_extra_data()` 回调传递
