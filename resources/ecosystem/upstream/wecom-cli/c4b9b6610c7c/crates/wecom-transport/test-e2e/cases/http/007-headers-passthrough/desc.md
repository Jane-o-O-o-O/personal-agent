# HTTP Transport Header 透传

- **场景**：验证 HTTP Transport 的请求/响应 header 正确透传（包括自定义 header 和标准 header）
- **Transport**：HTTP（reqwest）

## 测试等级

**P1**（builder header、调用时 header、链式 header 的正确合并与覆盖语义）
- **条件**：builder 设置 header + 调用时 .headers() 合并 + 链式 .header() 调用
- **断言**：builder 和调用时 header 合并发送到服务端，调用时 header 覆盖 builder 同名 header，链式调用所有 header 均发送

## 前置条件

- wiremock mock 端点，读取收到的请求 header
- 请求中携带多个自定义 header

## 断言

- 自定义 header 正确传递到服务端
- 服务端返回的响应 header 在客户端可读取

## 关键上下文

- `http_client/request.rs`：HttpRequest header 构造
- `http_client/response.rs`：HttpResponse header 解析
