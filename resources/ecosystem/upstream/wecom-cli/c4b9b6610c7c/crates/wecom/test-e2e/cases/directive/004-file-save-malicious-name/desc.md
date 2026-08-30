# file-save 指令：服务端恶意文件名净化

- **场景**：`x-wecom-file-save` 响应中服务端返回的 `file_name`（外部输入）经 `sanitize_filename` 单段化后落盘，`..`/分隔符不能成为目录逃逸通道
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（恶意 `file_name` 被净化为单段文件名）
- **条件**：mock 响应的 file_save 字段为 Object，`file_name` = `../../evil.csv`
- **断言**：文件落盘在 `--output-dir` 内，名称为净化后的单段 `.._.._evil.csv`，目录外无文件

**P1**（正常 `file_name` 对照）
- **条件**：`file_name` = `report.csv`
- **断言**：正常落盘，净化不误伤

## 前置条件

- wiremock 挂载 discovery（service "exportsvc" → response schema 含 `x-wecom-file-save`，`contentEncoding: base64`）
- method call 两次调用分别返回 Object 载荷：恶意 `file_name`（`../../evil.csv`）与正常 `file_name`（`report.csv`），`content` 均为 base64 `"aGVsbG8="`（`hello`）

## 命令

```rust
client.run(vec!["wecom", "exportsvc", "report", "get", "--output-dir", <tmp>/out])
```

## 断言 — CLI

- 两次 `run` 均返回 `Ok`
- stdout JSON 中 `data` 被替换为落盘文件路径

## 断言 — HTTP Endpoint

- `POST /report/get` 被调用 2 次

## 断言 — FS

- 恶意载荷：`<tmp>/out` 下恰好 1 个文件，名称为 `.._.._evil.csv`，内容为 `hello`；`<tmp>/evil.csv`（output-dir 之外）不存在
- 正常载荷：`<tmp>/out` 下存在 `report.csv`，内容为 `hello`

## 关键上下文

- `directive/file_save.rs`：响应 Object 的 `file_name` 覆盖 schema 设置；净化发生在 `target.join(sanitize_filename(n))`——`/`、`\`、`:` 等替换为 `_`，单段化后再经沙箱 `create_file_unique`
- `wecom-fs/src/sanitize.rs`：`../../evil.csv` → `.._.._evil.csv`
