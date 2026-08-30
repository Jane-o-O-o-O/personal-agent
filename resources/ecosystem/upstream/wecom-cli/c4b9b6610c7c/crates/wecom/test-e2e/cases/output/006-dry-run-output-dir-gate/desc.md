# `--dry-run` 下的 `--output-dir` 门禁

- **场景**：显式 `--output-dir` 在 dry-run 下同样走 `FsAccess::WriteDir` 沙箱校验——dry-run 与实际执行同一道门，错误时机一致
- **Transport**：HTTP（wiremock，仅 discovery；dry-run 不命中方法端点）

## 测试等级

**P0**（dry-run 与实际执行的 `--output-dir` 门禁一致）

- **条件 A**：`--dry-run --output-dir <roots 外目录>`
- **断言 A**：`run` 返回 Err，渲染含 `目标路径超出可访问范围`
- **条件 B**：`--dry-run --output-dir <roots 内目录>`
- **断言 B**：`run` 返回 Ok，stdout 含 `=== Dry Run ===`；目录不被创建（dry-run 不物化）

## 前置条件

- wiremock 挂载标准 discovery
- client cwd = 临时目录 A，workspace_fs 写 roots 仅含 A；roots 外目标取独立临时目录 B

## 命令

```rust
client.run(hr_dept_list_argv(&["--dry-run", "--output-dir", "<B>"]))        // A
client.run(hr_dept_list_argv(&["--dry-run", "--output-dir", "<A>/out"]))    // B
```

## 断言 — CLI

- A：Err 含 `目标路径超出可访问范围`
- B：Ok，stdout 为 dry-run 预览

## 断言 — FS

- B 的 `<A>/out` 未被创建（dry-run 只校验不物化）

## 关键上下文

- `crates/wecom/src/service/handler.rs`：`--output-dir` 门禁位于 dry-run / 实际执行的分叉点之前，两条路径同一道门
- `crates/wecom/src/service/execute.rs`：实际执行路径在 `execute_and_output` 内复核同一校验

## 关联用例

- `output/002-output-dir-non-download`：非下载方法的 `--output-dir` 校验与不产文件语义
- `output/005-output-dir-shapes`：WriteDir 的形状校验（文件拒绝 / 多级目录创建）
