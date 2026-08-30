# HTTP Transport invoke 发送 JSON 请求

- **场景**：验证 HTTP Transport.invoke() 发送 JSON 请求并获取响应
- **Transport**：HTTP（reqwest）

## 测试等级

**P0**（HTTP Transport 基本 JSON 请求/响应流程）
- **条件**：mock POST /cgi-bin/test 返回含 users 数组的 JSON
- **断言**：返回 Ok，into_value() 解析得到正确的 JSON 数据

## 前置条件

- wiremock mock `POST /cgi-bin/test`，返回 `{"result": {"status": "ok"}}`

## 调用方式

```rust
transport.invoke(ep(&server.uri(), "/cgi-bin/test"), payload).await
```

## 断言

- 返回 `Ok`
- 响应解析为 `{"status": "ok"}`

## 关键上下文

- `http/mod.rs`：`HttpTransportBackend::invoke()`
