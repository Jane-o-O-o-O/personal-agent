# file-save directive（响应附件提取）

- **场景**：验证 `x-wecom-file-save` response directive 将 base64 字段提取为独立文件
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（x-wecom-file-save directive 提取 base64 字段为独立文件）
- **条件**：mock 响应含 base64 编码字段，schema 声明 file-save directive
- **断言**：文件被正确提取到输出目录，内容与原始数据一致

## 前置条件

- wiremock 挂载 discovery（service "exportsvc" → 含 `x-wecom-file-save` directive 的 response schema）
- method call 返回 JSON，`data` 字段为 base64 `"aGVsbG8="`（`hello`）

## 命令

```rust
client.run(vec!["wecom", "exportsvc", "report", "get", "--id", "report-001"])
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout JSON 中 `data` 被替换为文件路径（含 `output.csv`），`other` 不变

## 断言 — FS

- `data` 指向的文件存在，内容为 base64 解码后的 `hello`

## 关键上下文

- `directive/file_save.rs`：`process_file_save()` → base64 decode → `Fs::create_file_unique()` → 替换原始值为文件路径
