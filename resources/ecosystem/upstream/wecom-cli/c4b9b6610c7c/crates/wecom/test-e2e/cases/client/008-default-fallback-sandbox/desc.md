# 默认回退沙箱：不注入 Fs 实例时保持受限

- **场景**：`ClientBuilder` 不注入 `private_fs` / `workspace_fs` 时，默认回退为受限 `SandboxedFs`（workspace roots=[cwd, 系统临时目录]，deny=推荐列表含 config_dir 形状）——嵌入方不注入不会退化为全开
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（默认实例的 roots 约束生效）
- **条件**：不调用 `private_fs()` / `workspace_fs()` 构建 client，cwd 锚定到独立目录
- **断言**：`--output` 到 roots（cwd + 系统临时目录）之外被拒绝；cwd 内写入放行

## 前置条件

- wiremock 挂载标准 discovery + `/department/list` method mock

## 命令

```rust
client.run(hr_dept_list_argv(&["--output", <path>]))
```

## 断言 — CLI

- 对照（cwd 内）：`run` 返回 `Ok`
- 对抗（roots 外）：`run` 返回 `Err`，render 含 `目标路径超出可访问范围`

## 断言 — FS

- `<cwd>/ok.json` 被创建；`<outside>/escape.json` 未产生

## 关键上下文

- `crates/wecom/src/client/builder.rs`：`default_workspace_fs(cwd, default_output_dir)` / `default_private_fs(config_dir)`——与 `wecom-cli/src/main.rs` 的生产接线同策略
