# HTTP Transport 二进制响应处理

- **场景**：验证 HTTP Transport 正确处理二进制响应（非 JSON）
- **Transport**：HTTP（reqwest）

## 测试等级

**P1**（HTTP Transport 正确处理二进制响应，如图片下载）
- **条件**：mock 返回 Content-Type: image/png 和 PNG magic bytes
- **断言**：匹配 TransportResponse::Binary，收集到的字节与原始数据一致

## 前置条件

- wiremock mock `POST /cgi-bin/binary`，返回二进制内容（`Content-Type: application/octet-stream`）

## 调用方式

```rust
transport.invoke(ep(&server.uri(), "/cgi-bin/binary"), payload).await
```

## 断言

- 返回 `Ok`
- 响应 body 正确接收二进制数据

## 关键上下文

- `http_client/reqwest_send.rs`：处理非 JSON Content-Type
