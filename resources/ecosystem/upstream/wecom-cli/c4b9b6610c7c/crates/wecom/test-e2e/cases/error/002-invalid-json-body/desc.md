# 非法 JSON 响应时的解析错误处理

- **场景**：验证服务端返回非法 JSON 时，客户端返回 `Err`（解析错误）
- **Transport**：HTTP（wiremock）

## 测试等级

**P1**（服务端返回非法 JSON 时返回解析错误）
- **条件**：mock 返回非法 JSON body
- **断言**：invoke() 返回 Err，错误类型为 Parse

## 前置条件

- wiremock 在 discovery 端点返回非法 JSON 字符串 `"not valid json at all {{{"`

## 调用方式

```rust
client.run(vec!["wecom", "schema", "list"]).output(...)
```

## 断言

- `run` 返回 `Err`（JSON 解析失败）

## 关键上下文

- `crates/wecom-transport/src/common/error.rs`：`Error::Parse`（`type="ParseError"`，code `E_PARSE`）在 JSON 解析失败时产生，经 `wecom::Error::Wrapped` 上抛
