# 沙箱路径：config_dir 落在 roots 内仍被 deny 屏蔽

- **场景**：CLI 配置目录（持 token）被叠加进工作区 deny 列表——即使它落在 cwd（工作区 roots）之内，deny 仍恒胜 allow，读写双向均不可达；同次运行中 PrivateFs 对 config_dir 的合法读写（discovery 缓存）不受影响
- **Transport**：HTTP（mock discovery + `hr department list` + `files send` 上传链路）
- **平台**：全平台
- **前置条件**：cwd=临时目录 A、`WECOM_CLI_CONFIG_DIR`=`<A>/cfg`（**故意落在 cwd 内**）、`WECOM_CLI_BASE_URL`=mock server；cfg 下预置加密凭据
- **命令与断言**：
  1. `wecom hr department list --output ./ok.json` → 退出码 0（对照：cwd 其他位置写入允许；discovery 缓存经 PrivateFs 写入 `<A>/cfg/cache`，第二次调用走缓存——私有域实例正常工作）
  2. `wecom hr department list --output <A>/cfg/poison.json` → 非零退出，输出含 `安全策略保护`，poison.json 未产生（写侧：roots 内 deny 恒胜 allow）
  3. `wecom files send --json '{"media": "<A>/cfg/credentials.enc"}'` → 非零退出，输出含 `安全策略保护`（读侧：deny 目录内既有文件不可经上传泄出）
- **断言 — HTTP Endpoint**：`POST /file/upload` 命中 0 次
- **断言 — FS**：`ok.json` 存在于 cwd；`poison.json` 未产生
- **关键上下文**：`main.rs` 的 `workspace_deny = recommended + config_dir`；002 已覆盖 config_dir 独立目录场景，本用例锁定「root 包含 deny 项时不重新放行」的优先级语义
- **来源场景**：wecom-fs deny 优先级的二进制级对抗回归
