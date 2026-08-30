# 沙箱路径：`..` 注入逃逸（文件写 + 目录写入口）

- **场景**：相对路径经入口边界锚定到 cwd 后，`normalize_path` 逻辑折叠 `.`/`..`——越界的 `..` 序列在 roots 判定处被拒绝；`--output`（文件写）与 `--output-dir`（目录写，WriteDir 分支）两个入口同链路
- **Transport**：HTTP（mock discovery + `hr department list` + `dl file download`）
- **平台**：全平台
- **前置条件**：cwd=临时目录 A、`WECOM_CLI_CONFIG_DIR`=临时目录 B、`WECOM_CLI_BASE_URL`=mock server
- **命令与断言**（读写 roots=[cwd, 系统临时目录]，tmp 内不算越界，逃逸目标越出 tmp 一级）：
  1. `wecom hr department list --output sub/../ok.json` → 退出码 0，`<A>/ok.json` 存在（对照：roots 内部折叠放行，`sub` 无需存在）
  2. `wecom hr department list --output ../../escape.json` → 非零退出，输出含 `目标路径超出可访问范围`，`<tmp>/../escape.json` 未产生
  3. `wecom hr department list --output a/../../../escape2.json` → 非零退出，输出含 `目标路径超出可访问范围`（深层折叠越界，`a` 无需存在）
  4. `wecom hr department list --output-dir ../../escape-dir` → 非零退出，输出含 `目标路径超出可访问范围`（目录写入口同样拒绝——显式 `--output-dir` 即走沙箱校验）
- **断言 — FS**：`ok.json` 存在于 cwd；`escape.json` / `escape2.json` / `escape-dir` 均未产生于系统临时目录的上一级
- **关键上下文**：`absolutize` 纯拼接不折叠（`wecom/src/fs/mod.rs`），折叠在 `SandboxedFs::resolve` → `normalize_path`；`--output-dir` 为全局参数，走 `FsAccess::WriteDir` 分支校验，只有产文件的分支（运行时 binary、`x-wecom-file-save`）消费它
- **来源场景**：wecom-fs 路径归一化的二进制级对抗回归
