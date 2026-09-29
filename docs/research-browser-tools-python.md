# Browser Use、Browser Harness 与 Skyvern 浏览器执行层核验

核验日期：2026-10-02。本文通过公开 HTTPS 读取官方仓库、官方文档及包注册表，未安装、运行浏览器执行器，未登录、调用付费云 API 或在真实网站完成业务任务。Muse 本身的机制由另份调查处理；本文不能证明 Muse 使用了这些项目。

## 结论

Browser Use 系列已经有直接基于 Pi 的 TypeScript 项目 `browser-use/browser-use-pi`，值得优先列入候选。它的主要路径是 **Pi 模型循环 -> 持久 Node/V8 REPL -> CDP -> Chromium**，使用无障碍树发现元素、读取 DOM、按实际元素位置发送鼠标事件，并按需截图。其当前源码还提供紧凑状态和短等待的 `ultrafast` 模式，但这些新增功能没有出现在当前 npm `0.1.0` 发布包中。

对本项目，速度优化应重点减少模型往返次数、页面状态体积、固定等待和重复登录。CDP 是控制协议，本身并不能保证任务成功或某个项目最快。只有在同一模型、推理深度、浏览器、任务和预算下测得的端到端结果才适合指导选型。

推荐同时比较两条路线：现有 Pi 加浏览器直接工具；Browser Use Pi 作为唯一的 Agent 循环并加入其他工具。把 Browser Use Python `Agent.run()` 或 Skyvern 完整任务再包装成 Pi 工具，是委派给另一个 Agent 的路线，会增加内部模型调用与状态管理成本。它们的直接 MCP 动作并非都运行第二个 Agent。

## 核验版本与许可

| 项目 | 固定源码版本 | 已核验发布包 | 许可与运行要求 |
| --- | --- | --- | --- |
| `browser-use/browser-use` | `302d8fcb245a7a63fb7531a4734c9ce3c7792779` | PyPI `0.13.10`，2026-09-04 发布 | MIT；Python >=3.11,<4 |
| `browser-use/browser-harness` | `afbcc381b963040c19627d788e40c7e7663171ee` | PyPI `0.1.13`，2026-09-04 发布 | MIT；Python >=3.11 |
| `browser-use/browser-harness-js` | `2d9a5ed37ed11f31b2622cd69c4b55f979cb905f` | `sdk/package.json` 为 private `cdp-sdk` 0.1.0，非核验过的公共 npm SDK | MIT；Bun 原生 CLI/REPL |
| `browser-use/browser-use-pi` | `f1f763667303f08e9a2532c89304522da67996e5` | npm `@browser_use/pi` 0.1.0，2026-09-09 发布 | MIT；Node >=22.19；Bun >=1.3.14 且仍需 Node worker |
| `Skyvern-AI/skyvern` | `e0aade09cbb341a9fa49442d744c8017e4a01dc7` | PyPI `1.0.55`，2026-10-01 发布 | AGPL-3.0；Python >=3.11,<3.15 |

源码主分支与发布包是不同对象。本次核验没有把 GitHub HEAD 宣称为上述包的发布源码。Browser Use Pi 已直接检查 npm tarball 中的接口声明，确认有实际差异。

来源：[Browser Use metadata](https://api.github.com/repos/browser-use/browser-use/commits/main)、[Browser Harness metadata](https://api.github.com/repos/browser-use/browser-harness/commits/main)、[JS metadata](https://api.github.com/repos/browser-use/browser-harness-js/commits/main)、[Pi metadata](https://api.github.com/repos/browser-use/browser-use-pi/commits/main)、[Skyvern metadata](https://api.github.com/repos/Skyvern-AI/skyvern/commits/main)。动态地址会更新，上表的完整 SHA 是本次快照。

包注册表：[browser-use](https://pypi.org/pypi/browser-use/json)、[browser-harness](https://pypi.org/pypi/browser-harness/json)、[skyvern](https://pypi.org/pypi/skyvern/json)、[@browser_use/pi](https://registry.npmjs.org/@browser_use%2Fpi)。

## Browser Use Python

### 页面理解与执行

当前 `dom/service.py` 使用 CDP `Accessibility.getFullAXTree`，按 frame 获取无障碍树；同时获取 `DOMSnapshot.captureSnapshot` 的布局、样式及绘制信息，将 DOM、AX、snapshot 的节点通过 `backendNodeId` 关联。源码包含并行请求与有界批处理。序列化后的可交互元素及状态提供给模型，截图可以开启、关闭或按需获取。

这不是仅依赖图片识别的控制器，也不等于网页中所有元素都具有可用 AX 语义。canvas、特殊控件、跨域 frame 等仍需视觉或额外 DOM/CDP 处理。

证据：[dom/service.py](https://github.com/browser-use/browser-use/blob/302d8fcb245a7a63fb7531a4734c9ce3c7792779/browser_use/dom/service.py)。关键调用为 `Accessibility.getFullAXTree` 与 `DOMSnapshot.captureSnapshot`。

### 速度与恢复

`Agent` 默认 `max_actions_per_step=5`，一个模型输出可包含多项动作，例如多个已观察到的表单字段。`multi_act` 对页面变化进行保护，防止使用失效 DOM 继续执行。`flash_mode` 去掉部分评价/规划字段；它能减少输出工作，但没有证据说明在所有任务上保持相同正确率。

默认 browser profile 等待值包括：页面捕获前最小等待 `0.25s`、网络静默 `0.5s`、动作之间 `0.1s`。可配置不表示可以无条件清零。`previous_cached_state` 和 selector map 用于状态复用及连续动作，不是任意页面的自动成功脚本缓存。

源码有 `pause`、`resume`、`save_history`、`rerun_history`。进程内暂停及历史重跑不等于 VPS 重启后任务能够可靠继续。尤其表单或订单提交发生超时后，必须先观察实际结果，再决定是否重做。

证据：[agent/service.py](https://github.com/browser-use/browser-use/blob/302d8fcb245a7a63fb7531a4734c9ce3c7792779/browser_use/agent/service.py)、[browser/profile.py](https://github.com/browser-use/browser-use/blob/302d8fcb245a7a63fb7531a4734c9ce3c7792779/browser_use/browser/profile.py)、[官方 Agent 参数](https://docs.browser-use.com/open-source/customize/agent/all-parameters.md)。

### 接入 Pi 的区别

官方本地 MCP 提供 `browser_navigate`、`browser_click`、`browser_type`、`browser_get_state`、tabs、HTML、截图等直接动作。Pi 调用这些动作时，可以保持 Pi 作为主要模型循环。`browser_get_state` 的截图参数默认关闭。

`retry_with_browser_use_agent` 是单独的完整 Agent 后备工具；`browser_extract_content` 等 AI 提取工具也可能增加模型调用。不能将同一 MCP 中所有工具视为无推理动作，也不能将所有工具视为嵌套 Agent。部署时应明确暴露的工具集合和各工具成本。

证据：[官方 MCP 文档](https://docs.browser-use.com/open-source/customize/integrations/mcp-server.md)、[MCP server.py](https://github.com/browser-use/browser-use/blob/302d8fcb245a7a63fb7531a4734c9ce3c7792779/browser_use/mcp/server.py)。源码对后备工具写明：`Only use this as a last resort`。

## Browser Harness Python / JS

### Python

官方 README 的描述是：`Connect an LLM directly to your real browser through one editable CDP websocket.` 这是给已有 Agent 提供浏览器执行层，不强制增加项目自己的模型规划循环。

技能文件推荐通过无障碍树发现目标，取得 `backendDOMNodeId`，通过 `DOM.getBoxModel` 算出可见坐标，再调用真实 CDP 鼠标事件。截图用于视觉问题，DOM/JS 用于读取和提取。`helpers.py` 提供 `Input.insertText`、受控表单输入、等待加载/元素/网络等帮助函数。

常驻 daemon 保留 CDP 连接；Agent 可将复用代码保存至独立 `agent_helpers.py`。这应理解为可保存并复用程序，不是未经验证的自动学习正确率保证。站点技能默认关闭，只有 `BH_DOMAIN_SKILLS=1` 才启用。等待函数并非所有都基于事件，例如 `wait_for_load` 轮询 `document.readyState`。

主分支提供 `browser-harness-mcp`，stdio 暴露 `browser_*` helpers，可经 Pi MCP 接入。本文没有核验 PyPI `0.1.13` 是否包含主分支每一项最新 MCP 功能，正式集成需按固定包核对。

证据：[README](https://github.com/browser-use/browser-harness/blob/afbcc381b963040c19627d788e40c7e7663171ee/README.md)、[SKILL.md](https://github.com/browser-use/browser-harness/blob/afbcc381b963040c19627d788e40c7e7663171ee/SKILL.md)、[helpers.py](https://github.com/browser-use/browser-harness/blob/afbcc381b963040c19627d788e40c7e7663171ee/src/browser_harness/helpers.py)、[MCP.md](https://github.com/browser-use/browser-harness/blob/afbcc381b963040c19627d788e40c7e7663171ee/docs/MCP.md)。此处技能文件仅作为研究对象读取，未安装或执行。

### JS

JS 版本提供一个常驻 Bun REPL 和持久 CDP `Session`，官方自报生成 `56` 个 domain、`652` 个方法的 typed wrappers。没有预制 `click`、`goto`、`upload` 高层工具；Agent 直接调用 CDP 协议，需自己组织观察、点击、输入和验证。

同一个 `/eval` 调用可以运行多条已确定的 JS 操作，减少模型往返。WebSocket、活动 target 和事件监听持续存在；每条代码片段的 `let`/`const` 仍在独立 async wrapper 内，跨调用保留数据须使用 `globalThis`。README 的持久性描述不能误读为所有本地变量自动保留。

`sdk/repl.ts` 在 `127.0.0.1:9876` 使用 `eval` 执行代码，没有额外隔离 worker。它可以作为最小原型或执行层参考；若用于产品，需要补任务串行化、取消、超时、进程隔离、产物和恢复等控制。其 CLI 文档称缺 Bun 时会自动安装，本次没有运行。

证据：[README](https://github.com/browser-use/browser-harness-js/blob/2d9a5ed37ed11f31b2622cd69c4b55f979cb905f/README.md)、[SKILL.md](https://github.com/browser-use/browser-harness-js/blob/2d9a5ed37ed11f31b2622cd69c4b55f979cb905f/SKILL.md)、[repl.ts](https://github.com/browser-use/browser-harness-js/blob/2d9a5ed37ed11f31b2622cd69c4b55f979cb905f/sdk/repl.ts)、[package.json](https://github.com/browser-use/browser-harness-js/blob/2d9a5ed37ed11f31b2622cd69c4b55f979cb905f/sdk/package.json)。

## Browser Use Pi

### 已证明的设计

官方 README 给出的数据路径是：`Pi Mono + a persistent V8 REPL + raw CDP`。`src/agent.ts` 将 `javascript` 作为 Pi `AgentTool`，采用 `executionMode: 'sequential'`、`replay: 'never'`。代码可以在一次调用中读取状态、执行多步、检查结果、保存文件，普通代码错误保留 JS 状态。

基础能力包括 AX `snapshot`、`page.evaluate`、`page.waitFor`、`page.clickAt`、原始 typed CDP、tabs 和按需 screenshot。公开导出 `CDP`、`Page`、`Tabs`；还可通过 `BrowserUse.execute()` 直接运行浏览器代码。生成 JS 在可终止的独立 Node worker 中执行；文档明确：`A worker is not a security sandbox`。

这有两种不同接法：

1. 使用它的 Pi 循环作为整个个人 Agent 的执行核心，以 `tools` 加入国内 API/MCP 工具。
2. 保留自建 Pi 会话，借鉴或适配 `CDP`、`Page`、worker/REPL 为 Pi 浏览器工具。此方案须自行管理 Pi 工具契约与执行状态。

在外层 Pi 工具里调用 `BrowserUse.run()` 是第三种委派方案，它另开内部 Pi 循环；`execute()` 或直接 CDP 操作不会自动调用浏览器模型。

证据：[README](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/README.md)、[agent.ts](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/src/agent.ts)、[API](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/docs/api.md)、[浏览器原语](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/docs/browser.md)。

### 当前源码的速度优化

`ultrafast` 模式新增 `bu.state/click/type`。`bu.state` 打印紧凑 AX 状态及可见文字，标记相对上次状态的新节点；动作后打印状态。节点 ID 是实际 Chrome `backendNodeId`，不是从图片估算的位置。

`src/ax.ts` 实现按页面状态等待：默认连续安静 `80ms`，一般等待上限 `800ms`；若 document 仍 loading，扩展到至少 `3000ms`。网络跟踪排除部分持续连接及分析请求，老于 `1500ms` 的在途请求按长期请求处理。这是启发式页面稳定判断，不能作为付款、搜索结果全部加载或后台业务已完成的证据。

点击前检查元素是否仍连接、禁用、隐藏、位于视口、被遮挡，使用真实鼠标输入。输入以 `Input.insertText` 批量插入大部分字符，并给末尾字符发送 key 事件以兼容部分 autocomplete 控件。重复步骤可放在一次 JS 调用中。

模式还自动接受 `alert/confirm/prompt/beforeunload`。若本项目复用这一模式，需为确认对话框和业务提交定义自己的处理方式。模式名和提示中对模型单次耗时的描述不是正式基准数据。

`Browser.pending()` 允许模型第一次推理与应用自行启动浏览器并行，但只有在相关模式/录制条件允许时才有收益。

证据：[ax.ts](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/src/ax.ts)、[prompt.ts](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/src/prompt.ts)、[sessions.md](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/docs/sessions.md)。

### 发布包与本项目 Pi 的版本差异

| 核验对象 | Pi 三个主要包依赖 | `ultrafast` / `Browser.pending` |
| --- | --- | --- |
| 当前 GitHub 固定 SHA | `@earendil-works/pi-agent-core` / `pi-ai` / `pi-coding-agent` 均为 `0.87.1` | 当前源码有 |
| npm `@browser_use/pi` 0.1.0 | 三个包均为 `0.85.1` | tarball 的类型声明及文件清单中没有这些接口 |
| 本项目已归档 Pi `a13d35a742c6` | `packages/agent/package.json` 为 `1.0.0` | 不因此自动兼容上方 SDK |

因此，不能直接安装 npm 0.1.0 后按照 main 文档使用 `mode: 'ultrafast'` 或 `Browser.pending()`。若使用 main，应固定 SHA 并验证与实际选择的 Pi SDK 的类型、事件、工具和 provider 接口。本文没有完成这些兼容测试。

发布包已有 `run/followUp/execute/pause/resume/steer/cancel`、profile、workspace、history、hooks、录制及 CDP/Page/Tabs 导出。直接读取了 [npm tarball](https://registry.npmjs.org/@browser_use/pi/-/pi-0.1.0.tgz) 的 `dist/types.d.ts`、`dist/browser.d.ts`、`dist/index.d.ts`，未执行其中代码。

### 登录、接管与重启

支持自托管本地 Chromium、现有 Chrome/CDP、Browser Use Cloud。本地 `profileDir` 保存 cookies/localStorage/IndexedDB，单个 profile 只能有一个 SDK owner。云 profile 是服务方管理的 `profileId`，不等同本地目录；远程下载文件也留在远端主机。

`pause()` 等待工具边界，人工或宿主可在相同 session 中 `execute()`，随后 `resume()`；已有界面的本地 Chromium 可人工登录。Linux VPS 的画面传输、人工登录入口、认证和接管 UI 仍由应用部署，不能将这些方法当作自带网页工作台。

`run` 新建 transcript；`followUp` 继续 transcript；workspace 保存文件；history 恢复对话但不恢复 JS heap 或登录。worker 超时、取消或退出会丢失 JS 状态；浏览器副作用和文件可能仍存在，恢复明确不自动重放动作。VPS 重启后仍需要任务服务根据证据进行恢复。

证据：[sessions.md](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/docs/sessions.md)、[browser.md](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/docs/browser.md)、[CDP timeout](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/src/cdp.ts)。

## Skyvern：需要区分旧视觉 Agent 与当前模式

README 介绍的是视觉模型理解页面，加 Playwright 执行动作。当前 `scraper.py` 同时提取 DOM 元素树、元素 ID 到 CSS selector 的映射和 screenshot，因此也不是纯图片坐标控制。

当前 `taskv3/tools.py` 更明确写道：`the only LLM in the loop is the agent's own persistent conversation`。它直接基于 raw DOM snapshot、选择器、Playwright/CDP 执行，不调用另一次 LLM-backed observe/act/extract。`taskv3/code_surface.py` 支持可配置的 code tool `off/add/replace`，且依赖执行器可用性，不能假定每个部署都默认启用。

Python/TypeScript SDK 及 MCP 支持选择器直控、自然语言 AI 动作和选择器失败后 AI 后备。Pi 直接调用选择器工具可以保持主循环；使用 `run_task`、自然语言 `act/extract` 会进入服务方的 AI 执行能力。MCP 支持 `--scope browser` / `--scope lean` 缩小工具集合。

源码有 cached script 的生成、部署、版本及工作流 cache key 管理；它更适合复用工作流。`fern/workflows/consistent-workflows.mdx` 仍写 `Documentation is coming soon`，不能仅凭该页许诺缓存或恢复的完整行为。Profile 文档区分实时 session 与存档 profile，保存工作流 session 和 profile 上传为异步过程。

Skyvern 的本地服务当前可使用 SQLite；Docker Compose 使用 Postgres。`skyvern[local]` 源码注释说明仍是 Forge-backed compatibility bridge，不能称为只有一个轻量浏览器驱动。自托管版核心为 AGPL-3.0，官方 README 明确托管云的反机器人能力例外，不在开源核心中。

证据：[README](https://github.com/Skyvern-AI/skyvern/blob/e0aade09cbb341a9fa49442d744c8017e4a01dc7/README.md)、[scraper.py](https://github.com/Skyvern-AI/skyvern/blob/e0aade09cbb341a9fa49442d744c8017e4a01dc7/skyvern/webeye/scraper/scraper.py)、[Task V3 tools](https://github.com/Skyvern-AI/skyvern/blob/e0aade09cbb341a9fa49442d744c8017e4a01dc7/skyvern/forge/taskv3/tools.py)、[code surface](https://github.com/Skyvern-AI/skyvern/blob/e0aade09cbb341a9fa49442d744c8017e4a01dc7/skyvern/forge/taskv3/code_surface.py)、[MCP](https://github.com/Skyvern-AI/skyvern/blob/e0aade09cbb341a9fa49442d744c8017e4a01dc7/skyvern/cli/mcp_tools/README.md)、[profiles](https://github.com/Skyvern-AI/skyvern/blob/e0aade09cbb341a9fa49442d744c8017e4a01dc7/fern/browser-sessions/browser-profiles.mdx)、[package](https://github.com/Skyvern-AI/skyvern/blob/e0aade09cbb341a9fa49442d744c8017e4a01dc7/pyproject.toml)。

## 性能证据与边界

| 公开证据 | 可以说明 | 不能推出 |
| --- | --- | --- |
| Browser Use Pi 历史 Hard 106 任务，某版 `91/106` | 作者留下旧代码、trace、eval ID；有可检查的实验记录 | 当前版本91/106、稳定91/106、当前最快 |
| 同一历史峰值随后 `79/106`、`85/106`、`84/106` | 任务/环境或重复测量有波动 | 单次峰值是生产成功率 |
| Browser Use Pi 旧 V2 60 任务连续分数 | 只能比较相应任务集、模型、预算下的运行 | 与二元成功率或当前200任务直接排名 |
| Browser Use BU2 model card 的 BU Bench V1 `63.3%` | 作者自报100任务、该模型+框架、二元judge的表现 | 最新Cloud V4、其他模型或纯CDP执行器的成绩 |
| Skyvern README WebBench `64.4%`，旧2.0报告 WebVoyager `85.8%` | 作者发布了对应历史报告入口 | 当前Task V3、自托管版或国内站点的实时成功率 |
| Skyvern 最新生产 A/B `593s -> 262s` | 作者约100,000次生产运行的统计；架构变化有工程参考价值 | 固定模型、同一流量分布下的可复现因果实验；本项目必然快2.3倍 |
| Odysseys 榜单 Skyvern `90.5%` / `65.38 steps` | 特定模型与系统组合的成绩已被外部官方榜单收录 | 所有模型下的成功率、独立重跑、无重试pass@1、Pi当前源码的成绩 |
| Odysseys 榜单 BrowserCode Luna `86.0%` / `124.2 steps` | 官方榜单提供模型、版本、全部任务与评分方式说明 | Browser Use Pi 的成绩；不同step定义下直接比较执行速度 |

Browser Use Pi 当前 [benchmarks.md](https://github.com/browser-use/browser-use-pi/blob/f1f763667303f08e9a2532c89304522da67996e5/docs/benchmarks.md) 明确：`They are not scores for the current candidate.` 另写 `does not establish causality, a matched BrowserCode advantage, or SOTA`。推理费用估计不含 judge、browser、runner 成本。

Browser Use 官方 [benchmark README](https://github.com/browser-use/benchmark/blob/main/README.md) 已明确旧60任务图不是当前 V2.1 的200任务结果，且judge/rubric有版本更新。BU2 [模型卡](https://docs.browser-use.com/open-source/bu-2-0-model-card.md) 也写明其自报judge与人工标签一致度 `87%`，任务成功不是浏览器点击正确率。

[WebBench 仓库](https://github.com/Halluminate/WebBench) 提供2,454项公开任务、452个网站，完整研究集合为5,750项；READ/WRITE区分有助于选择个人Agent任务。项目由 Halluminate 与 Skyvern 合作，不能称完全独立评测。已读取 [Skyvern WebBench报告](https://www.skyvern.com/blog/web-bench-a-new-way-to-compare-ai-browser-agents/) 的公开正文，其中提到每次执行最大50步、人工验证及未来多语言扩展。它的历史基础设施条件与今日自托管环境不同。

本次没有获得针对上述当前固定源码、同模型、同浏览器、同预算的独立端到端对照成绩，也没有测量中国网站、国产模型或国内VPS的实际完成率与耗时。

### Skyvern 2026-10-01 最新生产报告

已完整读取 [Deleting RAG from our web agent made it 2.3x faster](https://www.skyvern.com/blog/deleting-rag-from-our-web-agent-made-it-2-3x-faster/) 的公开正文与 Article JSON-LD。作者 Suchintan Singh；发布时间 `2026-10-01T18:58:59Z`，修改时间 `2026-10-01T19:39:30Z`。

文章称从强制预先截图、标注和提取所有可交互元素，改为让模型按需用 JavaScript 查看 HTML、调用 rustwright 支持的动作、截图和结束工具。文中称受 Pi 启发；这不是声明复用了本项目 Pi SDK，也不是证明 Muse 使用了 Pi。

生产 A/B 约100,000次用户运行，作者报告：

| 指标 | Skyvern 2.0 | Skyvern 3.0 | 解释边界 |
| --- | --- | --- | --- |
| 平均运行耗时 | 593s | 262s | 原始均值比例约2.26，作者舍入为2.3倍；没有P95 |
| 作者统计的平均成本 | $0.039 | $0.0302 | 降低约22.56%；未列成本包含项 |
| 每运行token用量 | 188K | 286K | 增加约52%；不代表上下文长度相同比例增长 |
| 每运行模型调用 | 6.4 | 23 | 增加约3.59倍，不能将收益仅归因于减少调用 |
| 每次调用平均token用量 | 约29K | 约12K | 原文tokens per turn；没有明确全部属于输入token |
| 含截图的LLM调用占比 | 27% | 2.7% | 分母是LLM调用；不是每运行截图工具次数或截图张数 |
| 作者报告的prompt cache命中率 | 27% | 79.7% | 增加52.7个百分点；原文相对增幅约195% |

作者认为按需读取、小粒度上下文和更稳定的缓存前缀解释了提速及降费。这是可参考的运行观察，但文章没有披露模型及reasoning、实验时间区间、随机分组方法、各组样本数、任务分布、失败/超时的统计口径、执行重试、成本范围、P95/误差区间或对应源码SHA。不能据此推导国产模型、任意国内网页或自托管版的实际效果，也不能把所有改进归因到一个变量。

文中 `2607.23373v1` 的链接锚文本是图像调用较慢的解释，实际 [论文元数据](https://arxiv.org/abs/2607.23373) 为 `UltraViT: Latency-Optimized On-device Vision Encoder for Large Vision-Language Models`。它不是 Odysseys 论文，也不足以证明所有云LLM的图像调用比纯文本固定慢1.7倍。本文不用这一链接支持浏览器benchmark或普适模型延迟。

### Odysseys 对 Skyvern 成绩的交叉核验

[官方榜单](https://odysseysbench.com/leaderboard.html) 读取 [公开 data.js](https://odysseysbench.com/js/data.js)，该数据实际收录：

| 字段 | 核验结果 |
| --- | --- |
| 名称 | `Skyvern (Claude Opus 5)` |
| Agent类型 | `hybrid`：截图及结构化browser/MCP工具，含extraction与JavaScript检查 |
| Perfect rubric rate | `90.5%`，每任务全部rubric满足才通过 |
| Rubric average | `98.12%` |
| Average steps | `65.38`，网页及博客显示舍入为65.4 |
| 运行条件 | Claude Opus 5、`xhigh effort`、100-step budget |
| 评估范围 | `all 200 submitted trajectories`，official per-rubric judge |
| O-M2W holistic judge | 未报告，数据字段为null |

因此，90.5%不是仅在供应商博客中出现的数字。但榜单条目没有源码/Agent版本3.0字段、实际运行或提交日期、执行重试次数、judge重复次数和原始200条轨迹的公开地址。博客把该成绩归为3.0；榜单只能直接证明对应Skyvern/Claude Opus 5组合。未取得该提交的原始轨迹和评分JSON，不能宣称独立复现或无重试pass@1。

正确原始论文为 [arXiv 2604.24964](https://arxiv.org/abs/2604.24964)，`Odysseys: Benchmarking Web Agents on Realistic Long Horizon Tasks`，首次提交2026-04-27；[论文HTML](https://arxiv.org/html/2604.24964v1)、[官网论文](https://odysseysbench.com/paper.html)、[固定仓库README](https://github.com/ljang0/Odysseys/blob/837814633ef948479abb3d142458f0acdb73fa65/README.md)。公开 [任务JSON](https://github.com/ljang0/Odysseys/blob/837814633ef948479abb3d142458f0acdb73fa65/data/odysseys.json) 包含200项唯一任务、1,225条rubric，45 easy / 46 medium / 109 hard。

原论文评分采用 `gemini-3.1-flash-lite-preview`，逐rubric读取完整动作及截图并给0/1，Perfect要求该任务所有rubric均通过。固定 [评分脚本](https://github.com/ljang0/Odysseys/blob/837814633ef948479abb3d142458f0acdb73fa65/scripts/python/run_full_trajectory_per_rubric.py) 明确默认模型与“验证码/访问拒绝造成条件不满足则判失败”。这是原论文与公开评分脚本的配置；Skyvern新条目只说明official judge，不单独记录judge具体版本/重复次数。

### BrowserCode：另外一条开放代码路线

同一 Odysseys [data.js](https://odysseysbench.com/js/data.js) 另收录 `BrowserCode (GPT-5.6 Luna)`：Perfect `86.0%`，rubric微平均约`96.82%`（字段舍入为96.8），平均`124.205`步（字段舍入为124.2）。条件为 `bcode v0.1.20`、Luna xhigh、Browser Use Cloud Chrome、JS/CDP、全部200项任务和1,225条rubric。结果是三次独立 `gemini-3.1-flash-lite` judge评分的均值；三次评分不是三次执行重试。

榜单说明步数为tool-calling model rounds加最终回复，而artifact中的204.675 raw action count还包含reasoning/text部分。artifact中的96.98%是任务宏平均，与榜单rubric微平均也不同。不同框架的step定义不同，因此65.38和124.2不能直接换算点击数或任务耗时。

实际开放仓库为 [browser-use/browsercode](https://github.com/browser-use/browsercode)，MIT；[v0.1.20 release](https://github.com/browser-use/browsercode/releases/tag/v0.1.20) 发布于 `2026-08-15T17:34:28Z`，对应源码SHA `e63409939d7dbc3e3d053cc3b36bd3fd81b8154e`。固定 [README](https://github.com/browser-use/browsercode/blob/e63409939d7dbc3e3d053cc3b36bd3fd81b8154e/README.md) 明确：`BrowserCode is a fork of OpenCode with a vendored TypeScript port of Browser Harness.` 核心 `browser_execute(code)` 在进程中运行JavaScript，经CDP控制Chrome并保持session，返回值、日志和截图。

[PROVENANCE.md](https://github.com/browser-use/browsercode/blob/e63409939d7dbc3e3d053cc3b36bd3fd81b8154e/packages/bcode-browser/src/cdp/PROVENANCE.md) 记载CDP层最初拷贝自 `browser-harness-js@95b7a22a923714c45d2f7234b2bfa8fa6322c2eb`，随后独立演进、按需移植Python Harness行为。它基于OpenCode，与Pi Mono的Browser Use Pi是两个实现，不能把86.0%归给本文固定的Browser Use Pi main。

未找到这条Odysseys提交的公开artifact下载入口；data.js提到manifest但不提供URL，榜单页面也没有链接。Browser Use [benchmark仓库](https://github.com/browser-use/benchmark) 有开放BrowserCode runner与Actions产物流程，但执行的是BU Bench V2.1；不能拿它替代此次Odysseys提交的原始轨迹。直接访问`bcode.sh`多次连接超时，本文通过GitHub源码和release核验，没有声称读到了官网完整正文。

## 本项目验证建议

候选评估时固定 Pi/执行器 SHA、模型、reasoning、browser/profile、网络出口和每任务预算。优先选本人的真实只读任务和可撤销测试操作，例如页面查询、中文多字段表单、动态选项、文件下载、跨页面提取、扫码登录后读取资料、慢加载、弹窗和跨域 iframe。

同时记录任务结果正确率、端到端耗时的中位数/P95、模型调用数与token、浏览器命令数、失败原因、人工接管次数。单独测冷启动和已登录的常驻浏览器，避免把复用登录的收益归因到执行器。

常规网页用 DOM/AX；截图与视觉处理用于真正需要视觉的部分；固定可靠网站可保存经验证的脚本，失败时重新观察和修复。不要无条件连点跨页面或复用过期元素 ID。浏览器服务需要独立 profile 所有权、持久卷、任务取消、接管和重启后结果核对。

## 访问记录说明

本文引用的官方 GitHub raw/API、PyPI/npm 元数据、npm tarball、Browser Use `.md` 文档、Skyvern两篇报告、Odysseys榜单数据及正确论文HTML均成功读取。`browser-harness-js/LICENSE` 和 Browser Use `browser/profile.py` 首次有一次 `Connection reset by peer`，重试后成功；不属于持续访问受限。Odysseys榜单主页面及渲染JS有个别请求SSL握手或连接超时，另一访问方式成功；其data.js已实际取得。`bcode.sh`多次连接超时；BrowserCode的GitHub源码和release成功读取。对大型源码采用仅输出所需片段的管道，部分 curl 出现下游主动结束导致的 broken pipe，不代表源站拒绝访问。

未访问任何登录后的 Cloud dashboard、付费任务轨迹或私有评测。作者主张均标为作者数据，未当作独立实测。文档与包元数据是动态资源；正式实施还须固定下载与依赖版本。
