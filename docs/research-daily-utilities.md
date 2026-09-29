# 日常查询：快递、节假日、汇率与补充搜索

核查日期：2026-10-02。范围为个人 Agent 的信息查询，运行于独立 VPS，由 Pi 执行工具。以下按当前公开资料可实现的程度分级；资源归档不等于接口已开通。天气、地图、地铁、火车和航班另见对应调研。已有博查、百度搜索继续保留，本页只补充智谱，不重复下载已有资源。

## 建议优先实现

| 日常问题 | 建议工具 | 可用方式 | 前置条件和输出边界 |
| --- | --- | --- | --- |
| 我的快递到哪里了？预计什么时候到？ | 快递100官方查询 Skill / API | Node.js 查询脚本或 Pi HTTP 工具；官方 stdio MCP 可作开发参考 | 查询 Skill 声明无 Key 限额模式；正式使用应确认自己的额度及密钥。部分公司要求手机号验证，预计时效不是送达承诺 |
| 明天上班吗？下个假期哪天？还剩几个工作日？ | 国务院通知 + holiday-cn 本地 JSON | 无需远程 API，按已发布年份在本地计算休息日、调休日 | 社区数据有官方通知来源，但不是政府开放 API；默认周末规则叠加通知中的例外，不能把未收录日期都判断为工作日 |
| 今天农历几月几号？下个节气是什么时候？ | lunar-typescript 本地库 | 无第三方运行依赖的 TypeScript 日期转换和节气计算 | MIT 社区算法库，使用明确的中国日期和时区；不使用库内的民俗占卜模块，也不拿它预测国务院调休 |
| 100 美元大概是多少人民币？出国预算折合多少？ | Frankfurter v2 / 项目 MCP | 无 Key 的 HTTPS 查询，或直接解析 ECB 参考汇率 XML | 第三方服务汇集央行公开数据，按日期和来源显示参考汇率；不表示银行现钞、刷卡结算或实时成交价 |
| 最近某件事有什么消息？查一下政府公告或办事条件 | 智谱 Web Search API | 独立 HTTP 搜索 API，支持搜索引擎、域名和时间过滤 | 需智谱平台 API Key 和余额，按当前价格计费；搜索结果应保留来源，不替代专门的天气、票务或物流接口 |

## 快递100：官方查询和个人账户查询分开接入

官网文档直接链接 GitHub 发布者 [kuaidi100-api](https://api.kuaidi100.com/document/)，已核实三个不同资源：

1. [kuaidi100-skill](https://github.com/kuaidi100-api/kuaidi100-skill)：只查询的官方 Skill，提供物流轨迹、单号识别、运费预估、寄件时效和在途时效。包含 `SKILL.md` 和 `script/kuaidi100.js`，只依赖 Node.js 标准库。调用 `https://api.kuaidi100.com/stdio/*`；`KUAIDI100_API_KEY` 可选，未设置时脚本传字符串 `null`，Skill 文档声明使用有限免费额度。公开资料没有承诺此额度的数值、长期可用性或生产 SLA，不能将它写成永久免费 API。
2. [kuaidi100-MCP-Nodejs](https://github.com/kuaidi100-api/kuaidi100-MCP-Nodejs)：Apache-2.0 的 TypeScript stdio MCP 源码，提供 `query_trace`、`estimate_time`、`estimate_time_with_logistic`、`estimate_price`。Node.js >= 18，启动时强制要求 `KUAIDI100_API_KEY`。Pi 支持 stdio，但归档版本的 `index.ts` 在连接后向 stdout 写普通日志，`package.json` 还包含同名包自依赖，部署前应在本项目连接器中修正并锁定依赖。当前不直接运行此原始仓库。
3. [kuaidi100-user-skill](https://github.com/kuaidi100-api/kuaidi100-user-skill)：面向个人快递100账户的官方 Skill，使用 `https://p.kuaidi100.com/skill/api/*`，Python >= 3.7 与 `requests`。官方流程是微信「快递100」小程序「我的 → API KEY → 申请」，配置 `KUAIDI100_USER_API_KEY`；文档明确服务端物流查询和订单管理需此 Key。无 Key 模式只保留部分查询和本地缓存，不能据此声称能读取个人全部物流。其完整包还含预下单和取消代码，当前查询工具只开放 `queryUserOrders`、`trackShipment` 及必要只读方法，不自动启用寄件操作。

密钥不可互换：`KUAIDI100_API_KEY` 对应 API 开放平台 / `api.kuaidi100.com/stdio`，`KUAIDI100_USER_API_KEY` 对应个人用户 API / `p.kuaidi100.com`。传统企业 API 使用的 `key`、`customer`、`secret` 又有独立契约。开放平台当前注册页要求企业名称，不能用「可免费注册」推断普通个人必然获得企业服务权限；个人账户优先评估官方小程序用户 Key 路线。

手机号口径也需按接口区分。只查询 Skill 写明顺丰速运、顺丰快运、中通需 `phone`；Node MCP 的工具描述只写 SF 开头必填。二者没有统一说明所有场景都接受后四位，因此调用前按对应接口要求向用户取得必要信息，遇到验证失败再补参，不推测手机号。用户版 `trackShipment` 文档使用 `orderNum`（运单号）和可选 `com`（快递公司编码），仍需用户 Key；不能据此推定所有运单都无需额外验证或可匿名查询。

用户版 API 文档写明每分钟 10 次、每天 100 次，并限制每个用户最多 3 个有效密钥。此限额不外推至企业 API、stdio API 或将来套餐。单号、手机号、地址、Key 不进入通用检索提示词或访问日志；使用缓存时显示物流节点时间和查询时间，未更新不伪装为实时位置。

## 节假日：公开通知配本地数据

[国务院办公厅关于 2026 年部分节假日安排的通知](https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm) 是官方原始依据，不是开放 API。可将每年通知核对后维护成项目数据；本轮未确认面向普通开发者、稳定受支持的官方节假日 JSON API。

[NateScarlet/holiday-cn](https://github.com/NateScarlet/holiday-cn) 是 MIT 的社区数据与抓取代码。仓库当前包含 `2026.json`、JSON Schema、ICS 和历史年份，各年 `papers` 指向依据的国务院通知。2026 文件中的来源与本轮读取的通知一致；国庆安排为 10 月 1 日至 7 日放假、9 月 20 日和 10 月 10 日上班。

Pi 工具可在本地提供 `is_workday(date)`、`next_holiday(date)`、`count_workdays(start,end)`，使用 `Asia/Shanghai` 时区。需要先合并目标年及相邻年通知覆盖的日期，优先应用 `isOffDay` 的例外，其他日期再使用周末规则。仓库说明「与周末连休」的普通周末不一定在列表里，因此不能只查 `days` 数组。尚未发布安排的年份返回「未公布」，不能依据固定节日算法猜测调休。

数据同步独立于回答工具：从固定提交快照起步，每年官方通知发布后更新并核对，不让每次查询依赖 GitHub / CDN 可达性。此能力表示全国安排，不能推断公司、学校、医院或个人排班。

### 农历和二十四节气

[6tail/lunar-typescript](https://github.com/6tail/lunar-typescript) 是 MIT 的社区 TypeScript 本地计算库，当前源码包标记 1.8.6，没有第三方运行依赖，公开 `Solar`、`Lunar` 等类型。已读取源码，确认 `Solar.fromYmd(...).getLunar()`、`Lunar.fromYmd(...)`、`getJieQiTable()`、`getNextJieQi()` 与 `getPrevJieQi()` 等日期和节气 API，并有相应上游测试。

在 Pi 中只包装公农历转换、闰月标识、二十四节气日期查询。无需账户或联网，适合生日换算和日期问答；时间参数按 `Asia/Shanghai` 明确处理，不能使用 VPS 默认时区推断用户日期。源码还带民俗及占卜相关模块，不开放为本项目工具。此算法库与 `holiday-cn` 的国务院调休日数据负责不同问题，不能用农历节日或库内假期表推算未来调休。本轮只归档，没有安装或运行库；后续接入时校验闰月、跨年及接近午夜的边界。

## 汇率：明确第三方服务与原始央行来源

[Frankfurter](https://frankfurter.dev/) 由 Line of Flight 维护，API 后端 [lineofflight/frankfurter](https://github.com/lineofflight/frankfurter) 为 MIT，可自行部署；它不是人民银行、外汇交易中心或商业银行的官方客户端。公共 `https://api.frankfurter.dev/v2/` 无需注册和 Key，项目提供 [OpenAPI](https://api.frankfurter.dev/v2/openapi.json) 与 [远程 MCP](https://frankfurter.dev/mcp/)，MCP 地址是 `https://mcp.frankfurter.dev/`。MCP 页面给出的接法为远程 HTTP；后端仓库归档不应称为该独立 MCP 服务的完整源码。

v2 支持币种对、历史日期、时间段、币种目录和来源过滤。默认值会混合多个提供者；若要清晰解释数据，可指定 `providers=ECB`，或使用 `expand=providers` 保存来源归属。人民币 CNY 已确认支持。本轮只读请求 `GET /v2/rate/cny/usd?providers=ecb` 得到 `date=2026-10-01`、`rate=0.14915`，证明无需 Key 的此查询可返回结构化数据；不代表国内任意 VPS 网络路径、所有历史区间或全部币种均已验证。

原始数据可直接读取 [ECB 每日 XML](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml)。本轮 XML 日期同为 2026-10-01，按 EUR 计价包含 USD 与 CNY。交叉换算时使用同一数据日期和同一来源，并保留出处。[ECB 说明](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html) 通常在工作日约 16:00 CET 更新，TARGET 休息日例外，只供信息参考，不能当交易报价。

本地实现可优先直接包装公共 API，不必先部署整个 Ruby / SQLite 后端。若以后自托管，需要持久化数据库、数据回填与任务调度；部分上游央行需要各自 Key，开源后端不消除原始数据源的许可和连接条件。公共 API 当前声明免费无月配额，但没有据此确认生产 SLA、所有国内网络可用性或无限并发；缓存并按日期说明数据新鲜度。

## 智谱搜索：平台 API 与 Coding Plan MCP 区分

[联网搜索介绍](https://docs.bigmodel.cn/cn/guide/tools/web-search.md) 和 [Web Search API](https://docs.bigmodel.cn/api-reference/%E5%B7%A5%E5%85%B7-api/%E7%BD%91%E7%BB%9C%E6%90%9C%E7%B4%A2.md) 明确 `POST https://open.bigmodel.cn/api/paas/v4/web_search`，Bearer 平台 API Key。它是可独立使用的搜索接口，不必先调用智谱聊天模型。参数包括 `search_query`、`search_engine`、`search_intent`、`count`、域名过滤和发布时间范围；返回标题、摘要、链接等结构化结果。当前文档支持 `search_std`、`search_pro`、`search_pro_sogou`、`search_pro_quark`，字段兼容性依引擎而异。

核查时联网搜索说明页标价分别为 0.01 / 0.03 / 0.05 / 0.05 元每次，实施时以账户可用引擎和[现行价格](https://bigmodel.cn/pricing)为准。原始结果保留网页来源和时间，网页内容按外部数据处理；不要把搜索到的票价、物流或天气当作对应业务接口的实时结果。

[联网搜索 MCP](https://docs.bigmodel.cn/cn/coding-plan/mcp/search-mcp-server.md) 是 GLM Coding Plan 用户专属服务，工具为 `webSearchPrime`，端点 `https://open.bigmodel.cn/api/mcp/web_search_prime/mcp`，支持 Streamable HTTP 与 Bearer 认证。个人或团队编程套餐须按对应入口取 Key，团队套餐 Key 与其他平台 API Key 不通用。Pi 传输能力可以接入，但产品用途、套餐额度与条款应确认后才启用；普通个人 Agent 首选独立计费的 Web Search API。本轮没有订阅套餐或带 Key 联调，未确认公开 MCP 服务端源码。

## 有条件或仅作参考

| 资源 | 分级 | 保留理由与未解决条件 |
| --- | --- | --- |
| 快递100用户版 Skill | 有条件可开发 | 有第一方个人取 Key 流程与真实 API 定义；用户自行申请 Key 后，只开查询工具，不自动开启包内下单/取消 |
| 快递100 Node MCP 原始源码 | 有条件可开发 | 有 Apache-2.0 源码与 stdio 工具定义；需有效平台 Key，修正 stdout 日志并审查依赖后部署 |
| 智谱 Web Search API | 有条件可开发 | 有正式公开 API，需平台 Key、开通权限和额度；未实测账户调用 |
| 智谱 Coding Plan 搜索 MCP | 仅参考 | 专属编程套餐，不能拿平台搜索 Key 直接假定通用；用于个人产品的条款和配额另行确认 |
| 快递鸟快递查询 API | 参考 | [官方接口页](https://www.kdniao.com/api-trackexpress) 可读，有 HTTPS、签名、商户 ID、快递字段；本轮未确认普通个人完成认证后必然开通的套餐权限，不作为默认快递提供者 |

快递鸟当前归档页面使用 `RequestType=8002`，`EBusinessID` + `AppKey` 签名，请求正式地址为 `https://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx`。其 `CustomerName` 并不是一般用户名：顺丰且单号非快递鸟渠道返回时，文档要求收件人或寄件人手机后四位；其他公司字段规则不同。老的 `1002` 文档与新查询产品不可混用。旧页面「每日 500 次」和官网「免费版」描述也不能证明新账号当前有这个额度或支持全部快递。官网的语雀文档入口已找到，但本轮公开抓取没有取得其正文，因此保留能读到的官方 HTML，并标为参考。

本页没有新增无来源的免费天气站、医疗判断或金融交易工具；交通研究中的社区 12306 源码仅参考归档，不纳入开发主路径。源码、Skills、公共数据和远程服务文档分别记录在 `resources/ecosystem/catalog-parts/daily-utilities.json`；账号密钥与个人物流不会放入资源库。
