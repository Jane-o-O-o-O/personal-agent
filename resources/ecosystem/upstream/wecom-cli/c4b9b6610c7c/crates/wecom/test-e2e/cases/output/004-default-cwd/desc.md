# 二进制响应默认下载到 cwd

- **场景**：无 `--output` / `--output-dir` 时，非 JSON 响应默认下载到当前工作目录
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（无 --output/--output-dir 时二进制响应默认下载到 cwd）
- **条件**：mock 返回非 JSON 响应，不传输出相关 flag，client cwd 锚定到独立目录
- **断言**：文件下载到 cwd 下，内容正确

## 前置条件

- wiremock 挂载标准 discovery + method call mock 返回 `application/octet-stream`
- client 经 `.cwd()` 锚定工作目录，workspace_fs 写 roots 仅含该目录

## 命令

```rust
client.run(hr_dept_list_argv(&[]))
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 为 `DownloadResult` JSON，`file_path` 位于 cwd 下

## 断言 — HTTP Endpoint

- `POST /department/list` 被调用 1 次

## 断言 — FS

- `<cwd>/hr_department_list.bin` 被创建（无 Content-Disposition 时按方法路径派生文件名）

## 关键上下文

- `crates/wecom/src/service/types.rs`：`RunOptions::output_dir()` 缺省回退 `run.get_default_output_dir()`（未配置时读时回退到 run 的 cwd）——对齐 wget / curl `-O` / `gh release download` 默认落盘当前目录的业界约定
- `crates/wecom/src/service/output.rs`：`handle_binary_output` 无显式输出时写入 `options.output_dir()`

## 关联用例

- `output/003-binary`：`--output-dir` 显式重定向下载目录
