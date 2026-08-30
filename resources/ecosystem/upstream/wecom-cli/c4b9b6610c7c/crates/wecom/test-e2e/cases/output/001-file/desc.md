# `--output` 文件输出

- **场景**：验证 `--output` flag 将结果写入文件
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（--output flag 将结果写入指定文件）
- **条件**：mock 返回 JSON 响应，命令行传入 --output 路径
- **断言**：退出码 0，文件存在且内容与响应一致

## 前置条件

- wiremock 挂载 discovery + method call mock

## 命令

```rust
client.run(hr_dept_list_argv(&["--output", "/tmp/out.json"]))
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 为 `DownloadResult` JSON，`content_type` = `"application/json"`
- 输出文件存在且内容正确
