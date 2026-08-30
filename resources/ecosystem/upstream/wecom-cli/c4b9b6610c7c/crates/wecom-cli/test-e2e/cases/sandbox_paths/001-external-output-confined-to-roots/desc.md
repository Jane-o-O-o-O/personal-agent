# 沙箱路径：外部 `--output` 被限制在 roots（cwd + 固定临时目录）内

- **场景**：真实二进制经 `main.rs` 的双实例接线（`PrivateFs` / `WorkspaceFs`）后，模型/用户给出的 `--output` 路径只能经 WorkspaceFs 落在 cwd 或固定临时目录内（`pinned_temp_dir()`：Unix 字面 `/tmp`、Windows 账户 `LocalAppData\Temp`，不信任 `TMPDIR`/`TMP`/`TEMP`）
- **Transport**：HTTP（mock discovery + `hr department list`）
- **前置条件**：cwd=临时目录 A、`WECOM_CLI_CONFIG_DIR`=临时目录 B（与 cwd 分离，避免配置目录 deny 与 cwd 重叠）、`WECOM_CLI_BASE_URL`=mock server；临时目录 C 建在固定临时目录 root 下（不能用 `tempfile::tempdir()`——macOS 上落在 /var/folders，恰在 root 之外）；越界写目标取测试进程 cwd（crate 目录，前提：checkout 不在系统临时目录下）
- **命令与断言**：
  1. `wecom hr department list --output ./ok.json` → 退出码 0，cwd 下生成 `ok.json`（写在 cwd 内允许）
  2. `wecom hr department list --output <临时目录 C>/in-tmp.json` → 退出码 0，C 下生成 `in-tmp.json`（写在固定临时目录内允许——读写对称 roots）
  3. `wecom hr department list --output <repo>/escaped.json` → 非零退出，输出含 `目标路径超出可访问范围`，目标文件未产生（roots 外拒绝）
  4.（仅 Unix）`wecom hr department list --output /etc/wecom-sandbox-probe.json` → 非零退出，输出含 `安全策略保护`，目标文件未产生
  5.（仅 Windows）`wecom hr department list --output <SystemRoot>\wecom-sandbox-probe.json` → 非零退出，输出含 `安全策略保护`，目标文件未产生（probe 路径从 `SystemRoot` 环境变量读取，不硬编码 `C:\Windows`）
- **断言 — FS**：`ok.json` 与 `in-tmp.json` 存在；`escaped.json` 与 `/etc/wecom-sandbox-probe.json` 均未产生
- **关键上下文**：路径校验发生在方法请求之前（`crates/wecom/src/service/execute.rs` 先 resolve output_path 再发请求）；第 2/3 次调用命中第 1 次的 discovery 缓存（`CONFIG_DIR`/cache，经 PrivateFs），间接验证私有域实例正常工作
- **来源场景**：沙箱双实例接线的二进制级回归
