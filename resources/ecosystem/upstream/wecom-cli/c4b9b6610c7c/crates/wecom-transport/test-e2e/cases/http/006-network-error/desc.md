# HTTP Transport 网络错误处理

- **场景**：验证 HTTP Transport 在连接不可达时的错误处理
- **Transport**：HTTP（reqwest）

## 测试等级

**P1**（连接不可达时返回 Error::Network）
- **条件**：绑定随机端口后释放，使端口不可达，向该端口发送 HTTP 请求
- **断言**：invoke() 返回 Err，错误类型为 Error::Network

## 前置条件

- 连接到不可达端口或 mock server 主动断连

## 断言

- `invoke()` 返回 `Err`
- 错误类型为 NetworkError

## 关键上下文

- `http_client/reqwest_send.rs`：reqwest 网络错误捕获
- `common/error.rs`：Error::Network
