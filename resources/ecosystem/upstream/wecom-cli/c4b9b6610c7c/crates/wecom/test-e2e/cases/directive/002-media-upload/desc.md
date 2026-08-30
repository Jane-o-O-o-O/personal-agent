# `x-wecom-file-upload` directive HTTP upload

- **场景**：验证 HTTP transport 下 `x-wecom-file-upload` schema directive 驱动的文件上传
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（x-wecom-file-upload directive 驱动文件上传）
- **条件**：schema 声明 file-upload directive，提供本地文件路径
- **断言**：文件被正确上传，mock 校验请求为 multipart 格式含文件内容

## 前置条件

- wiremock 挂载 discovery（service "msgsvc" → 含 `x-wecom-file-upload` 的 request schema）
- wiremock 挂载 `/file/upload` 端点（验证 multipart body 包含文件内容）
- wiremock 挂载 `/msg/send` 方法调用端点

## 命令

```rust
client.run(vec!["wecom", "msgsvc", "msg", "send", "--media-id", "photo.jpg", "--content", "hello"])
```

## 断言

- `run` 返回 `Ok`，stdout `ok: true`
- upload 端点被调用 1 次，body 为 multipart 格式
- method call 端点被调用 1 次
