# 沙箱路径：symlink 逃逸对抗（写侧 + 读侧）

- **场景**：cwd 内的符号链接不能成为越界/越 deny 通道——`resolve_real_path` 跟随 symlink 到真实落点后再做 deny/roots 判定（写 roots=[cwd]、读 roots=[cwd, 固定临时目录]——`pinned_temp_dir()` 固定取值，不信任 `TMPDIR`/`TMP`/`TEMP`）；落点合法的 symlink 不受影响
- **Transport**：HTTP（mock discovery + `hr department list` + `files send` 上传链路）
- **平台**：仅 Unix（symlink 创建无需特权）
- **前置条件**：cwd=临时目录 A、`WECOM_CLI_CONFIG_DIR`=临时目录 B、`WECOM_CLI_BASE_URL`=mock server；fixture：A 内 `real/sub` 真实目录、A 内 symlink `link-out`→测试进程 cwd（crate 目录，roots 外；前提：checkout 不在系统临时目录下）、`link-cfg`→B、`link-in`→A/real、文件级 symlink `link-file-out`→C/secret.bin（C 建在固定临时目录 root 下——不能用 `tempfile::tempdir()`，macOS 上落在 /var/folders，恰在 root 之外）、`link-file-cfg`→B/credentials.enc
- **命令与断言**：
  1. `wecom hr department list --output real/sub/ok.json` → 退出码 0（对照：真实子目录写入允许）
  2. `wecom hr department list --output link-in/sub/ok2.json` → 退出码 0（对照：roots 内 symlink 落点在 roots 内，放行——合法 symlink 不误伤）
  3. `wecom hr department list --output link-out/escape.json` → 非零退出，输出含 `目标路径超出可访问范围`，repo 下无 escape.json（写侧 symlink 逃逸——落点在 roots 外）
  4. `wecom hr department list --output link-cfg/poison.json` → 非零退出，输出含 `安全策略保护`，B 下无 poison.json（写侧 symlink 落入 deny）
  5. `wecom files send --json '{"media": "<A>/note.txt"}'` → 退出码 0（对照：读侧真实文件上传允许）
  6. `wecom files send --json '{"media": "<A>/link-file-out"}'` → 退出码 0（对照：symlink 落点在固定临时目录内——tmp 属默认读根，合法 symlink 不误伤）
  7. `wecom files send --json '{"media": "<A>/link-file-cfg"}'` → 非零退出，输出含 `安全策略保护`（读侧 symlink 落入 deny）
- **断言 — HTTP Endpoint**：`POST /file/upload` 恰好命中 2 次（对照组 5、6；7 在 resolve 阶段被拒，请求未发出）
- **断言 — FS**：`real/sub/ok.json`、`real/sub/ok2.json`（经 link-in 落点）存在；`escape.json`、`poison.json` 均未产生
- **关键上下文**：symlink 在路径解析层（`sandbox/paths.rs::resolve_real_path`）被拦截；硬链接别名不做 inode 身份判定，由 005 单独验证（deny 为纯字符串比对）；断言用报错特征文本而非路径（macOS `/var→/private/var` canonicalize 差异）
- **来源场景**：wecom-fs 沙箱路径解析的二进制级对抗回归
