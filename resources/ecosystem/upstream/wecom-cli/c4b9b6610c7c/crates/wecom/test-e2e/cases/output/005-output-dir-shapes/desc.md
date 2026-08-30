# `--output-dir` 的目标形状校验

- **场景**：显式 `--output-dir` 走 `FsAccess::WriteDir` 校验——已存在的文件被拒；多级不存在的目录逐层创建后正常落盘
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（WriteDir 形状门禁与目录自动创建）

- **条件 A**：`--output-dir` 指向一个已存在的普通文件
- **断言 A**：`run` 返回 Err，渲染含 `无效目录路径`；请求不发出
- **条件 B**：`--output-dir` 指向多级不存在的目录 `a/b/c`
- **断言 B**：`run` 返回 Ok；`a/b/c` 被逐层创建，下载文件落在其内且内容正确

## 前置条件

- wiremock 挂载标准 discovery + `/department/list` 返回 `application/octet-stream`（Content-Disposition 文件名 `report.xlsx`）
- client cwd = 临时目录，workspace_fs 写 roots 仅含该目录

## 命令

```rust
client.run(hr_dept_list_argv(&["--output-dir", "<tmp>/not-a-dir"]))   // A：已存在文件
client.run(hr_dept_list_argv(&["--output-dir", "<tmp>/a/b/c"]))       // B：多级不存在
```

## 断言 — CLI

- A：Err 含 `无效目录路径`
- B：stdout 为 `DownloadResult` JSON，`file_path` 位于 `<tmp>/a/b/c` 下

## 断言 — FS

- A：不产生任何新文件
- B：`<tmp>/a/b/c/report.xlsx` 存在且内容与 mock 响应一致

## 关键上下文

- `crates/wecom/src/service/execute.rs`：显式 `--output-dir` 先经 `FsAccess::WriteDir` 校验（只校验不物化），落盘时 `create_file` 逐层创建缺失父目录
- `crates/wecom-fs/src/sandbox/mod.rs`：`resolve_writable_dir` 对已存在的文件报 `无效目录路径`；不存在则放行

## 关联用例

- `output/003-binary`：`--output-dir` 正常落盘
- `sandbox_paths/007-dotdot-escape`：`--output-dir` 越界拒绝
