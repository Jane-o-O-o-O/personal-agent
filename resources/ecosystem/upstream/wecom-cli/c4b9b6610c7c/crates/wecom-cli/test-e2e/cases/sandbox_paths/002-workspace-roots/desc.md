# 沙箱路径：WorkspaceFs 读写 roots（cwd + 固定临时目录）

- **场景**：生产接线的 WorkspaceFs 读写同 roots=[cwd, 固定临时目录]（下载默认落盘 cwd，`tmp_dir` 概念已移除；临时目录 root 用 `pinned_temp_dir()` 固定取值——Unix 为字面 `/tmp`、Windows 为账户 `LocalAppData\Temp`，不信任 `TMPDIR`/`TMP`/`TEMP`），config_dir 叠加 prefix deny，推荐 deny 表双向生效
- **Transport**：HTTP（mock discovery + `hr department list` + `files send`）
- **平台**：全平台
- **Feature**：`custom-endpoint`
- **前置条件**：cwd=临时目录 A、`WECOM_CLI_CONFIG_DIR`=临时目录 B（预置加密凭据）、`WECOM_CLI_BASE_URL`=mock server；固定临时目录 root 下建临时目录 C 放置待上传文件（不能用 `tempfile::tempdir()`——macOS 上落在 /var/folders，恰在 root 之外）；roots 外写目标取测试进程 cwd（crate 目录，前提：checkout 不在系统临时目录下）
- **命令与断言**：
  1. `wecom hr department list --output <A>/ok.json` → 退出码 0，`<A>/ok.json` 存在（对照：cwd 内写放行）
  2. `wecom hr department list --output <C>/in-tmp.json` → 退出码 0，`<C>/in-tmp.json` 存在（写放行：固定临时目录在 roots 内，读写对称）
  3. `wecom hr department list --output <repo>/escape.json` → 非零退出，输出含 `目标路径超出可访问范围`，目标文件未产生（roots 外写拒绝）
  4. `wecom hr department list --output <B>/poison.json` → 非零退出，输出含 `安全策略保护`，目标文件未产生（config_dir 经 `DenyRule::prefix` 屏蔽，deny 压过 allow）
  5. `wecom files send --json '{"media": "<C>/pic.bin"}'` → 退出码 0（读放行：固定临时目录在 roots 内，上传链路走通）
  6. `wecom files send --json '{"media": "/etc/hosts"}'`（Unix）→ 非零退出，输出含 `安全策略保护`（推荐 deny 表读向同样生效，roots 不放大外泄面）
- **断言 — FS**：`ok.json` / `in-tmp.json` 存在；`escape.json` / `poison.json` 未产生
- **关键上下文**：`wecom-cli/src/main.rs` 的 WorkspaceFs 接线——单一 Policy 读写同守 roots=[cwd, pinned_temp_dir()] + 推荐 deny 表 + config_dir 的 `DenyRule::prefix`（固定目录专用规则，无 glob 校验失败路径）；`tmp_dir`/`request_storage_dir` 已随下载默认落盘 cwd 一并移除，调用方需要额外 roots 时自行注入 workspace_fs（`ClientBuilder::default_output_dir` 只决定落盘位置，不扩沙箱）；lib 侧 `default_workspace_fs(cwd)` 是库侧缺省回退（roots=[cwd, `std::env::temp_dir()`]），生产二进制不经由它
- **来源场景**：wecom-cli 双域沙箱生产接线的二进制级回归
