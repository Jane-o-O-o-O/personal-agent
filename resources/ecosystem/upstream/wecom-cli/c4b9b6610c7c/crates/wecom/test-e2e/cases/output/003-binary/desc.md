# 运行时二进制响应下载到 `--output-dir`

- **场景**：验证运行时返回 `application/octet-stream` 的响应保存到 `--output-dir` 指定目录
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（运行时 binary 分支消费 --output-dir：二进制响应正确保存到指定目录）
- **条件**：方法 schema 无下载标记，mock 运行时返回 Content-Type: application/octet-stream
- **断言**：二进制数据写入 --output-dir 下的输出文件，内容完整，文件名取自 Content-Disposition

## 前置条件

- wiremock 挂载标准 discovery + method call mock 返回二进制 + `Content-Disposition: attachment; filename="report.xlsx"`

## 命令

```rust
client.run(hr_dept_list_argv(&["--output-dir", <tmp_dir>/out]))
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 为 `DownloadResult` JSON，`content_type` = `"application/octet-stream"`
- `file_path` 位于 `--output-dir` 下，文件名为 `report.xlsx`
- `size` 与二进制内容长度一致

## 断言 — HTTP Endpoint

- `POST /department/list` 被调用 1 次

## 断言 — FS

- `<tmp_dir>/out/report.xlsx` 被创建，内容与 mock 响应一致

## 关键上下文

- `crates/wecom/src/service/output.rs`：`handle_binary_output` 流式落盘到 `options.output_dir()`，文件名取 Content-Disposition 并 sanitize；binary 与否由运行时 Content-Type 决定，`--output-dir` 对该分支同样生效

## 关联用例

- `output/002-output-dir-non-download`：纯 JSON 响应下 `--output-dir` 无效果
- `output/004-default-cwd`：无 `--output-dir` 时默认下载到 cwd
