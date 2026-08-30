# 沙箱路径：凭据目录读保护 + roots 外读拒绝 + `is_under` 大小写折叠

- **场景**：推荐 deny 列表覆盖伪造 `$HOME` 下的凭据文件（env-home 基底），上传读取被拒；读 roots（[cwd, 系统临时目录]）外的普通文件（非 deny 项）上传读取同样被拒；不存在的 deny 项的大小写变体经折叠比对仍被拒（macOS/Windows）
- **Transport**：HTTP（mock discovery + `files send` 上传链路）
- **平台**：全平台（`std::env::home_dir` env-first 语义经 `HOME` 注入，Windows 另注入 `USERPROFILE` 防御；④ 的断言文本按平台分化）
- **前置条件**：cwd=临时目录 A、`WECOM_CLI_CONFIG_DIR`=临时目录 B、`WECOM_CLI_BASE_URL`=mock server、`HOME`=临时目录 F（伪造家目录，内置 `.ssh/id_rsa`、**刻意无 `.aws`**，均须先于 CLI 子进程创建——deny 项快照在子进程启动时生成）；越界读目标取测试进程 cwd（crate 目录，前提：checkout 不在系统临时目录下）
- **命令与断言**：
  1. `wecom files send --json '{"media": "<A>/note.txt"}'` → 退出码 0（对照：cwd 内文件上传允许）
  2. `wecom files send --json '{"media": "<F>/.ssh/id_rsa"}'` → 非零退出，输出含 `安全策略保护`（deny 先于 roots 判定，伪造 HOME 的凭据目录被屏蔽——tmp 读根不放大外泄面）
  3. `wecom files send --json '{"media": "<repo>/Cargo.toml"}'` → 非零退出，输出含 `目标路径超出可访问范围`（[cwd, tmp] 读根之外的非 deny 位置越界拒绝——002 仅覆盖读允许面）
  4. `wecom files send --json '{"media": "<F>/.AWS/credentials"}'` → 非零退出：**macOS/Windows** 输出含 `安全策略保护`（`is_under` 折叠分支——`.aws` 不存在于磁盘，deny 快照与目标 real 的尾部段均保留 as-is 大小写，普通前缀必然不匹配，仅折叠可命中）；**Linux** 输出不含 `安全策略保护`（字节精确不折叠 → deny 不命中；F 在 tmp 读根内 → 落到文件不存在）
- **断言 — HTTP Endpoint**：`POST /file/upload` 恰好命中 1 次（仅对照组 1；2/3/4 在 resolve 阶段被拒，内容未泄露）
- **断言 — FS**：无文件写入（读取拒绝经下游请求未发生间接验证）
- **关键上下文**：内建 deny 表为纯 glob 形状（`**/.ssh`、`**/.aws`、`**/id_rsa` 等，任意深度、不依赖 home 基底）；`HOME` 经 `assert_cmd .env` 注入子进程；`resolve_readable` 中 `check_readable` 的 deny/roots 判定先于存在性探测，目标文件不存在不影响本用例
- **来源场景**：wecom-fs deny 列表与 `is_under` 折叠分支的二进制级对抗回归
