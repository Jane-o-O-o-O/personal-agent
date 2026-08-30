# 沙箱路径：硬链接别名的威胁模型收口

- **场景**：deny 规则为纯字符串路径比对（零系统调用）——硬链接别名指向 deny 目录内文件时按别名自身的字符串路径判定，不命中任何形状即放行。这是威胁模型的有意取舍：防同 UID 本地攻击者不在其列
- **Transport**：HTTP（mock discovery + `files send` 上传链路）
- **平台**：仅 Unix（硬链接创建需同文件系统——cwd 与伪造 HOME 均为 `/tmp` 下临时目录）
- **前置条件**：cwd=临时目录 A、`WECOM_CLI_CONFIG_DIR`=临时目录 B、`WECOM_CLI_BASE_URL`=mock server、`HOME`=临时目录 F（内置 `.ssh/id_rsa`）；fixture：A 内硬链接 `alias.rsa` → `<F>/.ssh/id_rsa`，A 内另有 `id_rsa`（形状命中样本）
- **命令与断言**：
  1. `wecom files send --json '{"media": "<A>/note.txt"}'` → 退出码 0（对照：cwd 内正常文件上传允许）
  2. `wecom files send --json '{"media": "<A>/alias.rsa"}'` → 退出码 0（别名字符串在 roots 内且不命中形状 → 放行，威胁模型接受的残留）
  3. `wecom files send --json '{"media": "<A>/id_rsa"}'` → 非零退出，输出含 `安全策略保护`（路径形状命中 `**/id_rsa`）
- **断言 — HTTP Endpoint**：`POST /file/upload` 恰好命中 2 次（仅 1、2）
- **断言 — FS**：无文件写入
- **关键上下文**：`policy/rule.rs::DenyRule::globs`（纯字符串比对，构造期编译）；`policy/denylist.rs` 内建形状表（`**/.ssh`、`**/id_rsa` 等）；与 003 的 symlink（路径解析层）分属两条独立机制
- **来源场景**：wecom-fs deny 形状比对的进程级语义回归
