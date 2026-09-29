# Meta Muse 浏览器控制：第一方证据核查

核验日期：2026-10-02。研究对象是 Meta 于 2026-09 发布的个人 Agent Muse；不混用 Manus、音乐乐队 Muse、旧视频产品或 `facebookresearch/MUSE` 词向量项目。

## 结论与证据边界

可以确认 Muse 在专属云端 VM 中持续运行，使用 Muse Spark，能够打开浏览器、填写表格和执行事务，也支持官方及自定义连接器。**本轮实际取得的第一方公开正文没有说明浏览器采用 CDP、Playwright、DOM、可访问性树、截图坐标或混合控制；不能根据操作速度给它指定实现。**

这不是“Meta 从未公开过”的全网否定结论。官方模型研究、产品介绍、安全页面和帮助页面存在本轮网络访问失败，无法据此判断这些页面是否披露了更多实现。没有登录 Muse、实测用户任务、检查私有服务或请求非公开接口。

## 已读取的官方来源

### 1. Muse 个人 Agent 发布公告

- URL：[Introducing Muse: The World's First Personal AI Agent Built for Everyone](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)
- 发布：2026-09-08；页面元数据更新：2026-09-30。
- 访问：HTTP 200；解析页面的 JSON-LD `NewsArticle.articleBody`，同时核查链接。
- 原文：`It can open a browser, fill out forms, and negotiate on their behalf.`
- 原文：`Muse runs on its own dedicated computer in the cloud`。
- 原文：`powered by Muse Spark ... built for real-world agentic work like this`。
- 原文：`A separate Sentinel agent runs on that same machine, kept apart from Muse at the system level.`

能够证明：云端独立环境、浏览器操作能力、使用的模型名称、系统隔离的 Sentinel 产品设计。不能证明：浏览器引擎、控制库、定位方式、截图频率、操作批处理、工具往返耗时或基准成功率。该文的购物演示视频也不是控制协议或可比较的延迟测试。

相关官方演示链接：[Muse Shopping](https://about.fb.com/wp-content/uploads/2026/09/Muse_Shopping.mp4)。本轮仅记录公告中的公开媒体地址，没有将剪辑的演示速度当作测量值。

### 2. Connect 2026 综述

- URL：[The Biggest News From Connect 2026](https://about.fb.com/news/2026/09/the-biggest-news-from-connect-2026/)
- 发布及更新：2026-09-24。
- 访问：HTTP 200；取得 JSON-LD 文章正文。
- 原文：`Connectors are a big reason Muse can do so much for people.`
- 原文：`We launched with dozens of partners along with access to the entire Shopify catalogue.`

能够证明：Muse 的能力有一部分通过合作伙伴连接器提供。不能证明：某一次可见操作是否通过连接器完成，或所有购物和网站操作都通过 API。合作伙伴名单不能代替浏览器实现证据。

### 3. 小企业发布公告

- URL：[The Future Is for Everyone: Muse for Small Business](https://about.fb.com/news/2026/09/introducing-muse-small-business/)
- 发布及更新：2026-09-29。
- 访问：HTTP 200；取得 JSON-LD 文章正文及其帮助链接。
- 原文：`Muse also supports custom connectors so you can plug in services we don't support yet`。
- 文中链接：[自定义连接器帮助](https://www.meta.com/help/artificial-intelligence/1687253048996149/)，本轮访问失败，详见后文。

能够证明：支持自定义连接器。不能仅据该句断言其全部连接器都是 MCP，或浏览器层使用 OpenClaw。

### 4. Muse Spark 初始模型公告

- URL：[Introducing Muse Spark: MSL's First Model, Purpose-Built to Prioritize People](https://about.fb.com/news/2026/04/introducing-muse-spark-meta-superintelligence-labs/)
- 发布：2026-04-08；更新：2026-05-12。
- 访问：HTTP 200；取得 JSON-LD 文章正文。
- 原文：`This initial model is small and fast by design`。
- 原文：`Meta AI can launch multiple subagents in parallel to tackle your question.`

能够证明：Meta 对初始 Spark 模型的速度定位，以及当时 Meta AI 的并行子 Agent 能力。不能把 4 月 Meta AI 产品说明直接等同于 9 月 Muse 浏览器实现；也不能由此得出浏览器点击耗时或端到端提速比例。

### 5. Meta AI 的行动能力公告

- URL：[Meta AI Doesn't Just Think, It Acts](https://about.fb.com/news/2026/07/meta-ai-muse-spark-doesnt-just-think-it-acts/)
- 发布及更新：2026-07-24。
- 访问：HTTP 200；取得 JSON-LD 文章正文。
- 原文：`The model is built to plan, work with your apps, and follow through from start to finish`。
- 该公告讨论 Muse Spark 1.1 驱动的 Meta AI、计划、连接邮件与日历、研究和实时任务 steering；没有披露浏览器控制协议。

这是相关模型与产品背景，不是个人 Muse 浏览器层的直接证据。

### 6. Muse Connector Platform

- URL：[Muse Platform](https://muse.ai/platform)
- 页面没有核实到内容发布日期；访问日期：2026-10-02。
- 访问：HTTP 200；可读内容为连接器合作流程。
- 原文：`We'll review your connector for functional, security, and legal requirements, and complete end to end testing.`

说明连接器提交、审核、上架和 Stripe Link 合作，不提供浏览器控制技术文档。

### 7. Muse 支持页面与站点地图

- [支持页面](https://muse.ai/support)：HTTP 200，内容为姓名、邮箱、主题和问题的联系表单，没有公开技术知识库正文。
- [站点地图](https://muse.ai/sitemap.xml)：HTTP 200，列出首页、`business`、`privacy`、`terms`、`support`；站点地图本身不是实现说明。
- 官网首页 `https://muse.ai/` 和商业页 `https://muse.ai/business` 的正文请求在本轮超时；未把搜索摘要当作完整页面。

## 第一方访问失败与未核实内容

以下是实际请求的 URL，而非已经阅读的技术证据。

| URL | 发现方式 | 本轮结果 | 保留的判断 |
| --- | --- | --- | --- |
| [Muse Spark 1.3 研究介绍](https://research.meta.ai/blog/introducing-muse-spark-1-3) | 9 月 8 日公告链接 | Node `UND_ERR_CONNECT_TIMEOUT`；curl 连接超时 | 未读取论文、模型卡或工具协议，不能引用其细节 |
| [Muse 安全页面](https://security.muse.ai/) | 9 月公告链接 | Node 与 curl 连接超时 | 已核实公告的 Sentinel 描述，但未核实该页可能包含的机制细节 |
| [Muse 产品介绍](https://introducing.muse.ai/) | 9 月公告链接 | Node 连接超时 | 未核实该页内容 |
| [自定义连接器帮助](https://www.meta.com/help/artificial-intelligence/1687253048996149/) | 小企业公告链接 | Node 连接超时 | 不由公告链接推导协议类型 |
| [Muse Spark 技术博客](https://ai.meta.com/blog/introducing-muse-spark-msl/) | 4 月模型公告链接 | Node 连接超时 | 不用搜索摘要替代模型技术报告 |
| [Muse Code](https://dev.meta.ai/products/muse-code) | 搜索结果线索 | Node 连接超时 | 不混用代码产品与个人 Muse 的浏览器实现 |

超时是本轮环境的访问结果，不代表页面不存在、被下线或全球不可访问。初始请求最长 35 秒，复查使用 7 秒连接超时；均未成功取得这些页面正文。

## 公开检索与容易混淆的材料

- Bing 公开 RSS 使用了 `"Meta Muse" browser CDP Playwright`、`"Muse" "OpenClaw" Meta official`、`"Muse Spark 1.3" browser` 和第一方域名限定等关键词。结果包含官网、注册教程、二手新闻和同名项目；域名限定结果仍混入其他网站，不能当作完备或严格过滤的检索结果。Google HTTP 搜索请求超时。
- [CSDN 二手文章](https://blog.csdn.net/aidoudoulong/article/details/166578884) 的搜索摘要声称 Muse 的产品形态源于 OpenClaw，且“获 Meta 官方确认”。本轮没有找到能够支撑这句话的可读第一方出处；保留为未确认线索。即使未来证实借鉴 OpenClaw，也仍需另外核实实际浏览器模块。
- [Engineering at Meta 站内搜索](https://engineering.fb.com/?s=muse) HTTP 200，返回的 4 个结果涉及 2018/2019 年多语言预训练和词向量；不是个人 Muse 浏览器技术披露。
- GitHub 官方组织检索：`facebook`、`fbsamples`、`meta-llama` 中名称/描述匹配 Muse 的仓库检索结果为空；`facebookresearch` 仅返回 [facebookresearch/MUSE](https://github.com/facebookresearch/MUSE)，描述为 `A library for Multilingual Unsupervised or Supervised word Embeddings`。这不能证明所有 Meta 仓库中不存在实现，只说明这些具体检索未得到相关开源项目。

## 补充：Bing 网页搜索发现的两个第三方仓库

独立浏览器内的 Bing 搜索 `Muse browser CDP` 得到了 RSS 检索未显示的两个 GitHub 结果。以下在 2026-10-02 通过 GitHub REST 元数据、固定提交文件进行只读核查，没有安装、运行、导入 Cookie 或连接个人账号。两者都不是 Meta 官方发布。

### browser-bridge-for-muse：提供外接浏览器工具的第三方网关

- 项目：[javedhamzabwn/browser-bridge-for-muse](https://github.com/javedhamzabwn/browser-bridge-for-muse)。MIT；仓库创建：2026-09-25。
- 固定提交：[a1f394512408d8c726920e42fb2cb70b0c69847e](https://github.com/javedhamzabwn/browser-bridge-for-muse/commit/a1f394512408d8c726920e42fb2cb70b0c69847e)，提交时间：2026-09-25T15:30:32Z。
- [README 第 3 行](https://github.com/javedhamzabwn/browser-bridge-for-muse/blob/a1f394512408d8c726920e42fb2cb70b0c69847e/README.md#L3) 原文：`for OpenMuse, Claude Code, Cursor, and personal AI agents`。其目标名称是 **OpenMuse**，不能自动等同于 Meta 个人 Muse。
- [轻量核心第 153 行](https://github.com/javedhamzabwn/browser-bridge-for-muse/blob/a1f394512408d8c726920e42fb2cb70b0c69847e/browser_bridge_muse.py#L153) 导入 `playwright.async_api.async_playwright`，随后启动 Chromium 和新 BrowserContext；[第 273 行](https://github.com/javedhamzabwn/browser-bridge-for-muse/blob/a1f394512408d8c726920e42fb2cb70b0c69847e/browser_bridge_muse.py#L273) 使用 `active_page.click(selector)`，第 283 行使用 `active_page.fill(selector, text)`。这是直接按页面元素操作，不依赖每次识别截图。
- 同一核心提供 `/nav`、`/eval`、`/snapshot`、`/screenshot`、`/click`、`/type`、`/tabs` 等 REST 接口；[第 306 行](https://github.com/javedhamzabwn/browser-bridge-for-muse/blob/a1f394512408d8c726920e42fb2cb70b0c69847e/browser_bridge_muse.py#L306) 可向另行运行的本机 Chrome CSI daemon `/command` 转发命令。因此它可作为 Agent 接入本地或已有用户浏览器的第三方桥接层，**仓库本身不证明已和 Meta Muse 实际联调成功**。
- 完成度限制：README 宣称“semantic accessibility snapshots”，但轻量核心的 [snapshot 第 224 行](https://github.com/javedhamzabwn/browser-bridge-for-muse/blob/a1f394512408d8c726920e42fb2cb70b0c69847e/browser_bridge_muse.py#L224) 实际使用 DOM `TreeWalker` 抽取文本并截到 15,000 字符，没有读取完整可访问性树、交互元素引用或稳定的元素编号。README 还列有 WebSocket/MCP/Tencent BSK 功能；不能将整个套件的宣称当成轻量核心全部已实现，其轻量核心没有 MCP 路由，BSK 在该文件中仅进行端口健康检查。其他套件文件需另外核查。

结论：这是可研究的外部浏览器工具实现示例，不能作为 Muse 内部使用 Playwright/CDP 的证据，也没有本轮端到端速度或成功率测试。

### muse2api：操作 Muse 聊天 UI 的第三方 API 网关

- 项目：[www222fff/muse2api](https://github.com/www222fff/muse2api)。MIT；仓库创建：2026-09-27。
- 固定提交：[f61736889da959bc7ffac117e27ae08e6749d459](https://github.com/www222fff/muse2api/commit/f61736889da959bc7ffac117e27ae08e6749d459)，提交时间：2026-09-28T02:43:01Z。
- [README 第 4 行](https://github.com/www222fff/muse2api/blob/f61736889da959bc7ffac117e27ae08e6749d459/README.md#L4) 原文：`exposes the muse.ai web app as an OpenAI-compatible API`。
- [browser driver 第 1 行](https://github.com/www222fff/muse2api/blob/f61736889da959bc7ffac117e27ae08e6749d459/src/muse2api/drivers/browser/driver.py#L1) 原文：`operates the muse.ai web client in headless Chromium over CDP`。
- [DOM 模块第 12 行](https://github.com/www222fff/muse2api/blob/f61736889da959bc7ffac117e27ae08e6749d459/src/muse2api/drivers/browser/dom.py#L12) 选择 `textarea`、Muse 消息气泡、附件及停止按钮；[发送逻辑第 268 行](https://github.com/www222fff/muse2api/blob/f61736889da959bc7ffac117e27ae08e6749d459/src/muse2api/drivers/browser/driver.py#L268) 填聊天框、点击发送或发送 Enter；随后以 DOM 消息气泡轮询获取回复。自有 CDP client 的 [第 83 行](https://github.com/www222fff/muse2api/blob/f61736889da959bc7ffac117e27ae08e6749d459/src/muse2api/drivers/browser/cdp.py#L83) 使用 `Runtime.evaluate`。
- [README 第 44 行](https://github.com/www222fff/muse2api/blob/f61736889da959bc7ffac117e27ae08e6749d459/README.md#L44) 明确：`the test suite has not been run yet and nothing has been tested against a real muse.ai account`。直接 HTTP driver 在固定版本仍为预留，[第 41 行](https://github.com/www222fff/muse2api/blob/f61736889da959bc7ffac117e27ae08e6749d459/src/muse2api/drivers/http/driver.py#L41) 的聊天实现抛出 `FeatureNotImplemented`。

结论：它控制的是“用户向 Muse 发消息的网页”，不是“Meta Muse 访问其他网站的浏览器”。因此 `muse2api 使用 CDP` 与 `Muse 内部使用 CDP` 是不同命题。其开发状态也不足以作为本项目效果已验证的浏览器执行器。

## 对本项目可采用的判断

1. Muse 的专属云端环境、后台工作和连接器有公开资料支撑。本项目据此设计持久化任务、浏览器会话与人工接管；这些具体状态和接管协议属于我们的工程方案，并非已公开的 Muse 实现规格。
2. `DOM/可访问性树 + 浏览器自动化 + 必要时视觉` 是候选工程路线，应由公开源码和本地任务测试评估；它不是已经证实的 Muse 架构。
3. “快”的原因需要拆成模型响应、输入大小、模型调用轮数、执行工具耗时、网络/页面等待、重试次数等，再测完整任务成功率。现有第一方资料不足以给 Muse 分配这些因素的具体占比。
4. 选型应比较同一模型、同一网站、同一任务、同一网络和登录条件下的正确完成率、总耗时、模型调用次数及恢复能力；演示片段或项目自报提速不能单独决定选型。

本文件是第一方证据记录。开源浏览器项目的控制方式、源码核验和本项目推荐架构另行比较；本轮没有改动既有 [Muse 与 Pi 研究](muse-and-pi.md)。
