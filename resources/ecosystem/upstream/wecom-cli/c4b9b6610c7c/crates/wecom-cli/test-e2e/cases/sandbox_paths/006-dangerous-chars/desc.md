# 沙箱路径：危险字符路径拒绝

- **场景**：`--output` 路径含控制字符、零宽字符、bidi 控制字符时在 resolve 期即被拒绝，视觉混淆的拼写永远到不了文件系统；Windows 另拒组件内 `:`（ADS 流）
- **Transport**：HTTP（mock discovery + `hr department list`）
- **平台**：全平台（ADS 冒号变体仅 Windows）
- **前置条件**：cwd=临时目录 A、`WECOM_CLI_CONFIG_DIR`=临时目录 B、`WECOM_CLI_BASE_URL`=mock server
- **命令与断言**：
  1. `wecom hr department list --output 子目录/报告 v2.json` → 退出码 0（对照：CJK + 空格的合法文件名放行，父目录经句柄递归创建）
  2. `wecom hr department list --output report<U+200B>.json` → 非零退出，输出含 `路径包含非法字符`（零宽字符）
  3. `wecom hr department list --output report<U+202E>.json` → 非零退出，输出含 `路径包含非法字符`（bidi 覆写）
  4. `wecom hr department list --output rep<\n>ort.json` → 非零退出，输出含 `路径包含非法字符`（控制字符）
  5.（仅 Windows）`wecom hr department list --output report.txt:stream` → 非零退出，输出含 `路径包含非法字符`（ADS 流）
- **断言 — FS**：仅 `子目录/报告 v2.json` 存在；含危险字符的文件均未产生
- **关键上下文**：`policy/chars.rs::reject_dangerous_chars` 作用于 resolve 后的物理路径（读/写统一入口）；拒绝发生在方法请求之前
- **来源场景**：wecom-fs 危险字符筛查的二进制级对抗回归
