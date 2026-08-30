# `x-wecom-octet-stream` directive multipart upload

- **场景**：验证 HTTP transport 下 `x-wecom-octet-stream` schema directive 驱动的 multipart upload
- **Transport**：HTTP（wiremock）

## 测试等级

**P1**（x-wecom-octet-stream directive 驱动 multipart 上传）
- **条件**：schema 声明 octet-stream directive，提供大文件路径
- **断言**：分片上传流程正确，mock 校验每个分片请求

## 前置条件

- wiremock 挂载 discovery（service "filesvc" → 含 `x-wecom-octet-stream` 的 request schema）
- wiremock 挂载 `/doc/upload` 端点（验证 multipart body 包含文件内容 + text field）

## 断言

- `run` 返回 `Ok`，stdout `ok: true`
- 方法调用端点被调用 1 次，body 为 multipart 格式
