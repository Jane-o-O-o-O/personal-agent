# Transport Builder 构建 HTTP Transport 并调用

- **场景**：验证 `HttpTransportBackend::builder()` 构建 HTTP Transport，设置 header 后发送请求
- **Transport**：HTTP（reqwest）

## 测试等级

**P0**（HTTP Builder 模式构建 transport 并透传自定义 header）
- **条件**：HTTP builder 设置 x-custom header，mock 验证 header 匹配
- **断言**：HTTP 返回 `{"ok": true}`，mock expect(1) 满足

## 前置条件

- wiremock mock `POST /cgi-bin/test`（HTTP）需匹配 `x-custom: custom-val`

## 调用方式

```rust
// HTTP
HttpTransportBackend::builder().header("x-custom", "custom-val").build()
```

## 断言

- HTTP：返回 `{"ok": true}`，header `x-custom: custom-val` 传递到服务端
- mock `expect(1)` 被满足

## 关键上下文

- `http/mod.rs`：`HttpTransportBackend::builder()` 返回 `TransportBuilder<HttpTransportBackend>`（链式 `.header()` / `.build()`）
