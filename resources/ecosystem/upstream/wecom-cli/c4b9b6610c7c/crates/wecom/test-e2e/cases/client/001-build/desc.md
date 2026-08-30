# Client::builder 构建与配置

- **场景**：验证 `Client::builder()` 编程式 API 构建 Client，设置 config_dir、default_output_dir、base_url、access_token
- **Transport**：HTTP（reqwest）

## 测试等级

**P0**（Client::builder() 构建 Client 并设置 config_dir、default_output_dir、base_url、access_token）
- **条件**：调用 Client::builder() 链式设置各项配置后 build()
- **断言**：build() 返回 Ok，config_dir/default_output_dir 等于传入路径，headers 含 Authorization

## 前置条件

- Mock server 无需启动（build 阶段不发起网络请求）

## 调用方式

```rust
Client::builder()
    .config_dir(&dir)
    .default_output_dir(&out)
    .base_url("http://127.0.0.1:8080")
    .access_token("my-token")
    .build()
```

## 断言

- `build()` 返回 `Ok`
- `client.config_dir()` 等于传入的路径
- `client.default_output_dir()` 等于传入的路径
- `client.transport().headers()` 包含 `authorization: Bearer my-token`

## 关键上下文

- `builder.rs`：`ClientBuilder::build()` 在无网络请求时也应能正常构造 Client；`default_output_dir` 的相对值在 build 时锚定 cwd，未配置时读时回退到 cwd（`CliRun::get_default_output_dir`）
