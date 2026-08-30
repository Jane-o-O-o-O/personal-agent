# `--output-dir` 对纯 JSON 响应不产生文件

- **场景**：验证非下载方法携带 `--output-dir` 时调用照常成功，纯 JSON 响应不产出任何文件
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（纯 JSON 响应不产文件，--output-dir 自然无效果）
- **条件**：方法返回 JSON 响应（无下载产物），命令行传入 roots 内的 --output-dir
- **断言**：退出码 0，stdout 为方法响应 JSON；--output-dir 目录下无文件

## 前置条件

- mock server 返回 catalog + service detail + method call JSON 响应

## 命令

```rust
client.run(hr_dept_list_argv(&["--output-dir", <tmp_dir>/out]))
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout：JSON 对象，`departments` 数组包含 mock 返回的数据

## 断言 — HTTP Endpoint

- `POST /department/list` 被调用 1 次

## 断言 — FS

- `<tmp_dir>/out` 下无文件（WriteDir resolve 只校验不物化目录）

## 关键上下文

- `crates/wecom/src/service/execute.rs`：`--output-dir` 为全局参数，显式声明即走 WriteDir 沙箱校验；只有产生文件的分支（运行时 binary 响应、`x-wecom-file-save` 提取）才消费它——对齐 curl `--output-dir` 仅在产文件时生效的语义
- roots 外的 `--output-dir` 被沙箱拒绝，见 `sandbox_paths/007-dotdot-escape`（process-level）

## 关联用例

- `output/003-binary`：运行时 binary 响应消费 `--output-dir`
