# Pi 浏览器工具调研：TypeScript 与 CLI 路线

核验日期：2026-10-02。范围：Microsoft Playwright MCP、Microsoft Playwright CLI、Vercel Labs agent-browser、Browserbase Stagehand。资料来自官方 GitHub 固定提交、npm 元数据和官方文档。本次仅阅读公开资料，没有安装工具、启动浏览器、使用账号或运行 benchmark。

这四个项目都能采用结构化页面信息执行操作，不能把它们统称为“截图识别后点击”。也没有证据证明其中任何一个就是 Muse 的实际实现。对 Muse 的判断必须另看它自己的公开资料。

## 1. 版本与许可

| 项目 | 核验时 npm latest | 源码固定提交 | 许可与运行要求 |
| --- | --- | --- | --- |
| Microsoft Playwright MCP | `@playwright/mcp@0.0.83`，2026-09-28 发布 | `f183dad4a52965583e3cc1d59b88cdc279e2e57d` | Apache-2.0；包装包声明 Node >=18，但固定依赖的 Playwright/Core 声明 >=20，部署选 Node 24 |
| Microsoft Playwright CLI | `@playwright/cli@0.1.22`，2026-09-28 发布 | `b85c7a736bb473bf55b584e54a09ffa698d6d871` | Apache-2.0；同样需要注意包装包和固定 Playwright 依赖的 Node 要求差别 |
| Vercel Labs agent-browser | `agent-browser@0.38.2`，2026-10-01 发布 | `39a74c70d7759d5a6de7a22c04570bb626bbd081` | Apache-2.0；npm 包要求 Node >=24，实际浏览器 daemon 为 Rust，npm 不是运行核心 |
| Browserbase Stagehand | `@browserbasehq/stagehand@4.1.0`，2026-09-09 发布 | 发布 provenance 指向 `cd7b230778cf92269e4cb90e80d97f5113781c51` | MIT；SDK Node >=22.18，仓库里的 Pi 集成要求 Node >=24 |

元数据：[MCP npm](https://registry.npmjs.org/%40playwright%2Fmcp)、[CLI npm](https://registry.npmjs.org/%40playwright%2Fcli)、[agent-browser npm](https://registry.npmjs.org/agent-browser)、[Stagehand npm](https://registry.npmjs.org/%40browserbasehq%2Fstagehand)。固定源码链接见下文。

Stagehand 4.1.0 的 npm 包没有可直接使用的 `gitHead`；从 [npm SLSA provenance](https://registry.npmjs.org/-/npm/v1/attestations/%40browserbasehq%2Fstagehand@4.1.0) 的 `resolvedDependencies[].digest.gitCommit` 核对发布提交。当前 main `a237c771fc188569bc95c1b2ed3c789950335d3a` 已进入 4.2.0 alpha，本文优先使用稳定 4.1.0 对应源码，而不是混用开发分支能力。

Playwright MCP 和 CLI 包装仓库已将实现移入 Playwright monorepo。两者固定依赖均为 `playwright/core@1.64.0-alpha-1790635538000`，其 npm `gitHead` 为 `e8149b8257d32dcf8f72573ecc43e72439da7080`。不能只读包装仓库就断言没有源码或 benchmark。

- [MCP 源码说明](https://github.com/microsoft/playwright-mcp/blob/f183dad4a52965583e3cc1d59b88cdc279e2e57d/src/README.md)："Playwright MCP source code is located in the Playwright monorepo"。
- [MCP package.json](https://github.com/microsoft/playwright-mcp/blob/f183dad4a52965583e3cc1d59b88cdc279e2e57d/package.json)、[CLI package.json](https://github.com/microsoft/playwright-cli/blob/b85c7a736bb473bf55b584e54a09ffa698d6d871/package.json)、[Playwright Core 发布元数据](https://registry.npmjs.org/playwright-core/1.64.0-alpha-1790635538000)。
- [agent-browser LICENSE](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/LICENSE)、[Stagehand LICENSE](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/LICENSE)。商业使用仍需保留相应版权、许可和适用 NOTICE。

## 2. Microsoft Playwright MCP

### 页面读取与操作机制

默认路线是 Playwright 的语义 accessibility/ARIA 快照及元素 ref，不需要视觉模型。

- [官方 README](https://github.com/microsoft/playwright-mcp/blob/f183dad4a52965583e3cc1d59b88cdc279e2e57d/README.md)："structured accessibility snapshots, bypassing the need for screenshots or visually-tuned models"。
- [Tab 源码](https://github.com/microsoft/playwright/blob/e8149b8257d32dcf8f72573ecc43e72439da7080/packages/playwright-core/src/tools/backend/tab.ts)：`captureSnapshot()` 调用 `page.ariaSnapshot({ mode: 'ai', depth, boxes })`；ref 通过 `page.locator('aria-ref=...')` 解析。
- [ARIA 快照源码](https://github.com/microsoft/playwright/blob/e8149b8257d32dcf8f72573ecc43e72439da7080/packages/injected/src/ariaSnapshot.ts)：`generateAriaTree(rootElement: Element, ...)` 遍历 DOM 并计算 ARIA 信息。这里不能简单称为“直接读取 Chrome 原生 AX tree”，它和 agent-browser 的 `Accessibility.getFullAXTree` 路线有区别。
- [点击工具源码](https://github.com/microsoft/playwright/blob/e8149b8257d32dcf8f72573ecc43e72439da7080/packages/playwright-core/src/tools/backend/snapshot.ts)：`await locator.click(options)`，交给 Playwright 执行；不是让模型从截图猜坐标。需要视觉补充时可启用 `vision` capability 或截图工具。

### 可以减少步骤的能力

`browser_fill_form` 一次接收多个字段，源码内部顺序执行 `fill`、`setChecked`、`selectOption`，减少模型分别调用每个表单字段的往返。

- [form.ts](https://github.com/microsoft/playwright/blob/e8149b8257d32dcf8f72573ecc43e72439da7080/packages/playwright-core/src/tools/backend/form.ts)：description 为 "Fill multiple form fields"，`for (const field of params.fields)`。

当前通用代码工具名称是 **`browser_run_code_unsafe`**。它能在一次调用中执行多个 Playwright 操作，但执行环境是 MCP 服务进程，源码和工具说明明确称它为 RCE-equivalent，不能当成仅有网页权限的 `page.evaluate`。

- [runCode.ts](https://github.com/microsoft/playwright/blob/e8149b8257d32dcf8f72573ecc43e72439da7080/packages/playwright-core/src/tools/backend/runCode.ts)："executes arbitrary JavaScript in the Playwright server process and is RCE-equivalent"，内部使用 `vm.runInContext`；`vm` 不能替代隔离容器。

快照可以限制 depth、scope，或者保存到文件；`--snapshot-mode=none` 能关闭动作后自动快照，但需要主动读取状态。不能在关掉快照后仍假设模型拥有最新页面状态。

### 等待和稳定性

Playwright Locator 自带可操作性等待：点击前确认元素唯一、可见、稳定、可接收事件、启用。这里的等待提高可靠性，不应为了“看起来快”全部关闭。

- [官方 actionability 文档源码](https://github.com/microsoft/playwright/blob/e8149b8257d32dcf8f72573ecc43e72439da7080/docs/src/actionability.md)："It auto-waits for all the relevant checks to pass"。

MCP 还存在额外的 settle 等待，当前默认 **500 ms**。点击工具经过 `tab.waitForCompletion()`；helper 在 callback 后等待 settle，出现导航则等待 `load`，其它请求最多额外等待 5 秒，并可能再等待一次 settle。因此单次点击耗时不能仅按 CDP 请求时间估算。

- [utils.ts](https://github.com/microsoft/playwright/blob/e8149b8257d32dcf8f72573ecc43e72439da7080/packages/playwright-core/src/tools/backend/utils.ts)：`const settleMs = ... ?? 500`、`await tab.waitForTimeout(settleMs)`、请求等待 `Promise.race(..., 5000)`。
- README 公开 `--timeout-settle`、`--timeout-action`、`--timeout-navigation`。只调整针对已知页面可验证的等待策略，并记录失败率。

### 登录态、接管与 Pi

支持 `--user-data-dir` 持久 profile、`--isolated`、storage-state、CDP endpoint 和官方 Chrome/Edge 扩展连接既有浏览器。README 明确同一持久 profile 同时只能由一个浏览器实例占用。

Pi 可通过 MCP 扩展或 SDK 的工具适配层调用 stdio/HTTP 服务；这不代表 Pi 核心原生内置 MCP。服务持续运行能保留浏览器上下文，但后端仍须管理任务取消、执行互斥和重启恢复。

适合当稳定基线和需要跨 Chromium/Firefox/WebKit 的路线。对大量简单点击，默认 settle 和丰富快照可能增加开销；通用代码模式应在专用容器中执行。MCP 本身不等于完整的网页接管产品。

## 3. Microsoft Playwright CLI + Skills

[官方固定 README](https://github.com/microsoft/playwright-cli/blob/b85c7a736bb473bf55b584e54a09ffa698d6d871/README.md) 将 CLI 定位为 coding agents 的 token-efficient 入口，同时认可 MCP 在长期自主任务和持续页面上下文中的价值。

### 机制和优势

与 MCP 共享 Playwright monorepo 中的 backend，页面快照、ref、Locator 和动作逻辑并不是一个全新的浏览器引擎。

- [cli-daemon 源码目录](https://github.com/microsoft/playwright/tree/e8149b8257d32dcf8f72573ecc43e72439da7080/packages/playwright-core/src/tools/cli-daemon)。每次 CLI 调用连接会话 daemon，不是每次重启 Chromium。
- README："After each command, playwright-cli provides a snapshot of the current browser state"，默认展示 `.playwright-cli/page-...yml` 文件链接。模型按需读取文件，省去强制把整棵树注入上下文。
- `snapshot --depth`、`snapshot <ref>`、`find <text>` 支持局部观察；`run-code` 可批量执行代码；当前支持录制用户动作并输出 Playwright 代码，为固定工作流重放提供入口。

“节省上下文 token”不自动等于“完成任务更快”。模型可能多一次读快照文件；MCP 也可选择保存到文件。比较必须记录端到端耗时和模型调用数。

### 持久化和人工接管

CLI 默认内存 profile，关闭浏览器后失去状态；跨重启持久化需 `--persistent` 或 `--profile=<path>`。`-s=<name>` 分离会话。默认 headless；`--headed` 可显示窗口。

当前已有 **`playwright-cli show` 监控与接管 dashboard**，包含 session grid、live screencast、tab bar、导航、鼠标键盘输入。

- README："Click into the viewport to take over mouse and keyboard input; press Escape to release"。

这说明不一定要从零开发浏览器远控界面，但该 dashboard 仍需核验怎样部署在 VPS、怎样认证和代理。它不会自动替我们实现“Agent 暂停 → 用户接管 → 交回 → 任务继续”的所有产品状态。

Pi 可通过 Bash 工具及匹配版本的 Skill 使用 CLI；SDK 服务端更建议用结构化参数封装进程调用，避免依赖拼接 shell 字符串。CLI 代码运行能力也需要隔离。

## 4. Vercel Labs agent-browser

### 当前架构已经变化

不能继续引用早期“Rust CLI + Node/Playwright daemon”的架构图。当前 0.38.2 官方文档明确：

- [native-mode 文档](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/docs/src/app/native-mode/page.mdx)："agent-browser is now 100% native Rust by default. The Node.js/Playwright daemon has been removed"。
- [当前 Skill](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/skills/agent-browser/SKILL.md)："Chrome/Chromium via CDP with accessibility-tree snapshots and compact @eN element refs"；没有 Playwright/Puppeteer 依赖。

### 读取和动作

Rust daemon 直接通过 CDP 读取 AX tree，再生成紧凑 ref；scope 时结合 DOM 查询。动作把已定位节点转换成浏览器内的真实操作。

- [snapshot.rs](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/cli/src/native/snapshot.rs)：`Accessibility.getFullAXTree`、`DOM.describeNode`。
- [interaction.rs](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/cli/src/native/interaction.rs)：点击调用 `Input.dispatchMouseEvent`，填文本调用 `Input.insertText`。点击位置来自已解析元素，不是视觉模型猜坐标。
- [element.rs](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/cli/src/native/element.rs) 包含遮挡检测及错误说明；不能把“直接 CDP”误读为对任何页面都可靠或自动绕过验证码。

`snapshot -i -c -d N -s <selector>` 限制页面信息；`snapshot --delta` 返回 full、unchanged 或有界结构变化，按 tab/选项管理 baseline；URL 改变或 delta 不省空间时退回 full。

- [README Snapshot Options](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/README.md#snapshot-options)。这是减少上下文的方法，不是“只读取变化节点”的完整性能保证。
- [snapshot 文档](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/docs/src/app/snapshots/page.mdx)：存活 DOM 节点的 ref 可以跨快照保留；替换节点或页面/iframe 导航会失效，虚拟 AX 节点只在本快照有效。

### 批量操作和等待

`batch` 支持命令数组 JSON stdin 和 `--bail`。一次模型调用可以提交已知的多步任务，同时减少重复 CLI 进程启动。

- [main.rs run_batch](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/cli/src/main.rs)：`Vec<Vec<String>>`，循环中逐条 `send_command_with_respawn(...)`。因此它是一个 CLI 调用中的顺序执行，不是所有 CDP 操作压成一次请求，也不是多次未知页面导航之间无需检查。
- [README Batch Execution / Waiting](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/README.md)："After a page change, prefer a selector, text, URL, or JavaScript condition that represents the state you need"。对长期连接、轮询页面不应盲目用 `networkidle`。

当前也提供原生 MCP 入口和按 core/debug 等 profile 裁剪工具面；Pi 可以选择扩展包装 CLI，或通过 MCP adapter 接入。CLI 使用结构化 JSON batch 更容易记录每一步的成功状态。

### 持久化与接管

支持具名 session、磁盘 profile、状态保存、已有 CDP 浏览器。读取本机 Chrome profile 的能力不意味着 VPS 自动拥有个人电脑登录态，需要在 VPS 的独立 profile 实际登录。

当前已有 WebSocket viewport streaming 和远程 mouse/keyboard/touch 输入，可以嵌入自己的工作台。流只绑定本机，网页 Origin 限制需要通过我们自己的认证代理处理。

- [streaming.md](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/skill-data/core/references/streaming.md)："the browser runs wherever the daemon runs ... and the client renders frames and sends clicks back"；鼠标键盘输入和 frame delivery 分开处理，提供 ack pacing 避免旧帧堆积。
- [当前 Skill](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/skills/agent-browser/SKILL.md) 记录独立 dashboard 端口 4848；可参考已有 dashboard，而不是必然自行搭 noVNC。

适合 Pi 上层规划、下层执行精简命令的自托管候选。Chromium/CDP 路线最适合首版统一环境；其它浏览器 backend 的能力并不完全相同。ref、等待及复杂 iframe 行为仍需测评。

## 5. Browserbase Stagehand v4

### 新架构：浏览器里的 runtime

v4 已不能用“Playwright 上面包一层 LLM”概括。稳定 4.1.0 对应文档说明浏览器 runtime 运行在扩展中，经 CDP 控制，不依赖 Playwright/Puppeteer。

- [introduction](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/docs/v4/first-steps/introduction.mdx)："Runtime lives in the browser"，"there is no Playwright or Puppeteer dependency"。
- [capture.ts](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/extension/understudy/a11y/snapshot/capture.ts)："Capture a hybrid DOM + Accessibility snapshot"；同一 CDP session 的 `DOM.getDocument` 索引复用，再组合各 frame 的 AX 信息。
- [浏览器配置文档](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/docs/v4/configuration/browser.mdx)：连接本地浏览器时需加载扩展；默认 SDK 和已有浏览器需要共享文件系统。远程现有 Browserbase session 应走 `browserbase.connect()`。

这类把多步 workflow 移到浏览器附近的设计可减少远程逐动作往返。国内 VPS 与 Chromium 同机时，网络收益必须实测，不能直接套用云浏览器宣传倍数。

### 两种使用方式必须区分

1. `act(instruction)`、`observe()`、`extract()` 是自然语言/结构化 AI primitives，需要 Stagehand 模型推理；每一个 `act("...")` 都可能增加一次或多次 LLM 调用。
2. `page.locator(...).fill()/click()` 以及 Pi 集成的 `run`/snapshot-ID actions 是确定性执行，Pi 模型承担规划，不需要为每次点击再调用第二个模型。

[速度优化文档](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/docs/v4/best-practices/speed-optimization.mdx) 给出先 `observe("Find all form fields to fill")`，再重放 Action 的方式，减少逐字段推理。未知页面变化后仍需重新观察，不能缓存失效选择器继续执行。

### 已有 Pi 原生扩展示例

这是本次较直接的参考：官方仓库已有 Pi 的 **`run`、`snapshot`、`screenshot`** 工具扩展，首次调用延迟启动浏览器，同一 Pi session 复用 browser，关闭 session 时清理。

- [Pi 文档](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/docs/v4/integrations/pi.mdx)："Pi ships without built-in MCP by design; extensions register tools directly"；"The facade tools are deterministic and do not call a Stagehand model today"。
- [Pi extension 源码](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/integrations/pi/extensions/stagehand.ts)：调用 `pi.registerTool()`；`run` 接受代码或动作数组；截图返回 Pi image content。
- [facade/tools.ts](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/integrations/core/src/facade/tools.ts)：维护快照 ID/XPath 映射、导航后拒绝旧快照，调用 `stagehand.experimentalBatch(...)`，整体 timeout 60 秒。
- [callbackBatch.ts](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/extension/callbackBatch.ts)：callback batch 在浏览器 runtime 内通过 router 执行，内部仍需实际 CDP 动作。

版本注：上方 Stagehand 文档中的 Pi/MCP 说明是该文档的历史表述。本项目已归档的 Pi v1.0.0 提供官方 MCP 扩展，支持 stdio 和 Streamable HTTP；不能用这句旧说明断言本项目缺少 MCP 接法。Stagehand 直接注册确定性工具的设计仍可参考。

该 Pi 集成明确是 **experimental、从源码仓库提供、未独立发布 adapter**。不能把它描述为安装 npm SDK 后就具备完整个人 Agent。

官方还有 `pi-sdk` harness，可用于评测，源码使用 `createAgentSession()`、customTools 和 in-memory SessionManager；不是生产任务恢复方案。其导入为 `@earendil-works/pi-coding-agent`，接入时需与我们固定的 Pi 版本及包名实际匹配。

- [pi-sdk/session.ts](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/integrations/pi-sdk/src/session.ts)。

### 等待、缓存和持久化边界

自然语言 `act()` 在读取快照前等待 DOM/network settle，默认上限 5000 ms；这是等待上限，不是每次固定睡满 5 秒。已观察 Action 的重放跳过该 settle，`observe()`/`extract()` 读取当前快照。

- [actService.ts](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/extension/services/actService.ts)：先处理确定性 Action 分支，再对 instruction 分支 `waitForDomNetworkQuiet(...)`、cache lookup、capture、LLM inference。
- [浏览器配置文档](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/docs/v4/configuration/browser.mdx) 的 DOM settle 说明。局部 Locator 等待仍需根据页面和动作验证。

v4 的自动结果缓存由 **Browserbase 云端** 管理；本地 browser 的 `cache` 选项没有该能力。页面内容/指令/选项参与缓存键，页面结构变化会 MISS；cached act 的选择器失效回退推理。4.1.0 对应文档用 `cache: true` 显式启用，当前 main 文档改为默认开启，接入时要以固定版本实际行为为准。

- [caching 文档](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/docs/v4/best-practices/caching.mdx)："With a local browser ... the cache option has no effect and every call runs inference"。这里的 every call 指相关 AI primitives，不能套到确定性 `run`/Locator 操作。

本地 SDK 支持 `userDataDir`、`preserveUserDataDir`、`keepAlive` 和连接现有 CDP browser。官方 Pi 示例的 local config 只传 `{ headless: false }`，没有现成磁盘 profile 配置；若用于 VPS，必须补持久目录、生命周期及工作台接管。

- [facade/config.ts](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/integrations/core/src/facade/config.ts)：local `launchOptions: { headless: false }`。

适合参考原生 Pi 接入、代码批量执行、DOM+AX 观察及固定动作重放。它的云缓存、Model Gateway、云 session replay 是 Browserbase 服务能力，不是“只靠国内 VPS 自动拥有”的开源能力。

## 6. 已公开测评能证明什么

| 公开资料 | 可使用的证据 | 不能得出的结论 |
| --- | --- | --- |
| Playwright CLI/MCP README | CLI 按需快照、少工具 schema 可降低上下文占用 | CLI 在同一任务上必然更快、MCP 不适合个人 Agent |
| agent-browser daemon benchmark | 有 warmup、iterations、标准差、冷启动、daemon/browser RSS 分离的脚本 | Rust 点击一定快很多、内存下降倍数等于任务速度提升倍数 |
| agent-browser Skills Evals | 能检查 Skill 加载、命令生成、CLI/MCP context footprint，另有本地 WebMCP smoke test | 已证明所有真实网站操作成功率或对国内网站的稳定性 |
| Stagehand 当前 main README “2x faster” | 作者对 Browserbase 上的云浏览器执行的宣称，非 4.1.0 固定 README 的承诺 | 本地 VPS、同模型、同任务也快 2 倍，或优于另外三项的普遍成功率 |
| Stagehand Evals | 提供本地任务、WebVoyager/OnlineMind2Web 等 suite 和 Pi harness | 未运行的脚本就是本项目的测试结果；不同模型/网站/网络结果可直接排名 |

重要原文：

- [agent-browser benchmarks/README.md](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/benchmarks/README.md)："Command latency is dominated by Chrome (CDP round-trips), not the daemon"；"per-command speedups are typically small"。Rust 主要降低冷启动、daemon 内存和分发体积。README 中 140 MB 与 7 MB 是项目方描述，没有在本机复测。
- [benchmarks/bench.ts](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/benchmarks/bench.ts) 与 [scenarios.ts](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/benchmarks/scenarios.ts)：旧 Node daemon 和新 Rust daemon 两阶段比较，需要 Vercel Sandbox 凭据，不是四工具的统一测评。
- [agent-browser evals/README.md](https://github.com/vercel-labs/agent-browser/blob/39a74c70d7759d5a6de7a22c04570bb626bbd081/evals/README.md)：context-footprint 的 token 为近似值；WebMCP 明确为 "smoke evaluations, not a claim of reliability across models or sites"。其中旧 Codex eval 还会改用户 config，不应无隔离直接执行。
- [Stagehand 当前 main README](https://github.com/browserbase/stagehand/blob/a237c771fc188569bc95c1b2ed3c789950335d3a/README.md) 的 "2x faster execution than Playwright cloud equivalent browsers" 是云服务宣传，需要限定环境；[4.1 README](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/README.md) 可核实稳定版浏览器侧扩展设计，但没有同一句 2x 宣传。[Stagehand Evals](https://github.com/browserbase/stagehand/blob/cd7b230778cf92269e4cb90e80d97f5113781c51/packages/evals/README.md) 支持 `--env local`、`--trials`、`--concurrency`、`--model`、`--harness pi`，可参考做统一评估。

截至本次只读核验，没有获取到四个候选在同一国内个人工作流、同模型、同浏览器、同网络上的可信统一排名。

## 7. 建议的本地可复现测评

先比较执行层，再比较 Agent 层，避免把模型慢和浏览器慢混在一起。

### 执行层，不调用模型

统一 Chromium/Chrome 版本、viewport、CPU/RAM、网络和登录状态；每个候选独立 profile，串行测。运行冷启动与温启动两个组，每组预热后至少 20 次。

使用本地 fixture，包含中文页面：

1. 稳定表单：一次填 5 个字段、选择下拉、勾选、本地提交、读取完成状态。
2. 500 ms 后才出现/启用的按钮：检查等待策略与误操作。
3. SPA 重绘/节点替换：检查 ref 失效是否检测、是否能恢复。
4. 弹窗遮挡：正确识别覆盖元素，关闭后再点击目标。
5. iframe 表单：同源及跨源各一组，验证候选的实际覆盖。
6. 标签页与本地下载：验证结果文件和实际保存内容。

记录冷启动、warm click/fill/snapshot 耗时、P50/P95、错误类别、重试数、浏览器和 worker 内存。分别比较逐动作、batch/code 两个模式。不能只计“工具返回 success”，要由页面后台或 DOM 状态断言最后结果。

### Agent 层，固定 Pi 和模型

给同一任务语义、相同模型及预算、相同 fixture，分别暴露四个候选的工具面。每项至少 10 次，记录端到端耗时、成功率、工具调用数、模型往返数、输入输出 token、截图次数、等待时间及重试。

将“纯结构化观察”和“允许视觉补充”分组；浏览器冷/温 session、首次探索/确定性重放分组。对缓存将 HIT/MISS 分组，Stagehand 本地不要冒充云缓存测评。

真实国内网站只增加只读检索/公开列表查询，不将下单、发消息、支付作为测速样本。网站网络延迟、VPS IP 和登录验证单独记录。固定 fixture 的速度结果与真实网站的成功率结果都保留。

## 8. 对本项目的选择建议

优先将 **agent-browser 的紧凑 AX/ref/条件等待** 与 **Stagehand v4 的 Pi 原生 code-mode/浏览器侧 batch** 放进候选验证。Playwright MCP 作为可操作性等待成熟的基线；Playwright CLI 的按需快照、录制重放和内置 dashboard 也值得复用。

实际实现可以保持 Pi 统一规划：已知表单或稳定步骤用确定性 batch，一次观察后执行多个动作；页面跳转、错误或状态改变时再观察；无语义节点、图形内容或视觉验证才截图。不要让 Pi 每点击一次都再调用 Stagehand 自然语言模型。

VPS 的浏览器 profile 应是独立持久环境，工作台接管同一 session。任务状态、暂停/恢复、互斥、超时、取消和最终结果验证仍由我们的后端负责。工具的速度与可靠性必须通过上述同环境测评确认，不能只按 GitHub Stars 或宣传片选型。
