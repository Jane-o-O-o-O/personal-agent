# 日常出行查询资源核验

核验日期：2026-10-02。目标为中国大陆个人 Agent 在 VPS 上查询公交、地铁、火车票和机票。本文依据本地已归档代码、第一方公开文档与公开发布包；未申请 Key、注册账号、执行有费用的查询或订票。

## 建议接入组合

| 用户需求 | 首选资源 | 可开发的范围 | 主要条件 |
| --- | --- | --- | --- |
| 去某个地方怎么走、附近地铁站、换乘 | 已归档高德地图 MCP；百度地图 MCP 可作为备选 | 地点定位、步行/骑行/驾车、公交与地铁换乘 | 高德 Web 服务 Key 或百度 AK，账号配额 |
| 某条公交/地铁线的站点和首末班 | 高德公交信息查询 REST | 按站点或线路名称/ID 查询线路、途经站、线路首末班 | 高级服务接口；官方明确个人认证与企业认证用户均有体验配额 |
| 从具体上车站能否赶上末班 | 高德公交路径规划 REST | 读取响应中的上车站首末班字段，并按日期、预计出发时刻规划 | 必须由实际响应提供；不能把线路首末班误报成任意中途站到站时间 |
| 明天高铁有无票、哪个车站出发 | 飞常准 Tripmatch 官方 MCP | 火车站查询、站级/城市级火车票时刻和余票查询、空铁中转 | 个人开发者注册创建 API Key；按调用计费 |
| 航班几点起飞、是否延误、机票多少钱 | 飞常准 Aviation / Tripmatch 官方 MCP | 航班动态、直飞/中转、逐航班逐舱位报价、机场天气、准点率等 | 同一开放平台账号；报价及动态可能随时间变化 |
| 旅行方案、机酒和火车票自然语言比较 | 已归档携程问道 Skill | 旅行问答、查询、比较、推荐与行程规划 | `WENDAO_API_KEY`，确认账号额度和计费 |
| 研究 12306 网页查询工作原理 | 社区 `Joooook/12306-mcp` | 仅参考源码和协议包装；不作为默认生产连接器 | 非铁路官方开发者 API，默认不启用 |

推荐先使用高德 MCP + 高德公交 REST + 飞常准 Tripmatch。Aviation 与 Tripmatch 有重复工具，若 Tripmatch 已能满足机票与火车查询，无需将两个 MCP 的重复工具同时提供给模型。

## 地图、公交和地铁

### 已归档高德 MCP 的实际能力

已检查 `resources/ecosystem/upstream/amap-maps-mcp-package/a9a639dbd609/build/index.js`，版本 `0.0.8`：

- `maps_direction_transit_integrated(origin, destination, city, cityd)` 调用 `https://restapi.amap.com/v3/direction/transit/integrated`，支持公交/地铁等公共交通组合。
- 代码保留方案时长、步行距离、上下车站名、线路名、途经站名及部分地铁出入口；适合回答换乘路线。
- 其输出映射过滤了 `start_time`、`end_time`、`station_start_time`、`station_end_time`、线路票价和其他服务返回字段；输入也没有 `date`、`time`。因此不能据这个本地 MCP 包承诺首末班或指定出发时刻规划。
- 官方远程 MCP 可能随服务升级增加能力，不能直接以本地 `0.0.8` 的字段投射远程版本，后续应读取实际 `tools/list` 并联调。
- 该工具的描述提到火车换乘，只说明公共交通规划可以包含铁路段，不等于火车余票、票价或订票工具。

来源：[高德官方 MCP 接入文档](https://lbs.amap.com/api/mcp-server/gettingstarted)、[官方 npm 包](https://registry.npmjs.org/@amap/amap-maps-mcp-server/-/amap-maps-mcp-server-0.0.8.tgz)。

### 高德公交路径规划 REST

[官方路径规划文档](https://lbs.amap.com/api/webservice/guide/api/direction) 明确给出公交规划 `GET https://restapi.amap.com/v3/direction/transit/integrated`，凭据为 Web 服务 `key`。请求可携带起终点坐标、起终点城市、日期 `date`、时刻 `time` 和换乘策略。

文档中公交线路对象包含不同层级的时间：

| 字段 | 文档含义 | 展示方式 |
| --- | --- | --- |
| `start_time` / `end_time` | 线路首班 / 末班车时间 | 明确标为线路首末班，不代表任意中途站到站时间 |
| `station_start_time` / `station_end_time` | 上车站点首班 / 末班时间 | 只有该具体方向和上车站的实际响应包含字段时才显示 |
| `duration` | 公交预计行驶时间 | 估算行程时长，不是车辆还剩几分钟到站 |

REST 适配器应保留这些原始字段与来源，而不是在 Agent 中根据线路长度推算每站末班车。节假日临时调整、缺失字段和运营公告仍需返回“未取得该站时间”，不能用线路时间顶替。

### 高德公交信息查询 REST

[当前官方公交信息文档](https://lbs.amap.com/api/webservice/guide/api-advanced/bus-inquiry) 是有效正文。旧式 `.../guide/api/busstop` 地址本次请求重定向为地理编码页面，不应作为当前公交证据。

当前端点：

- `GET https://restapi.amap.com/v3/bus/stopname`：站名关键词搜索，可指定城市。
- `GET https://restapi.amap.com/v3/bus/stopid`：按站点 ID 查询。
- `GET https://restapi.amap.com/v3/bus/linename`：按线路名称搜索，建议 `extensions=all`。
- `GET https://restapi.amap.com/v3/bus/lineid`：按线路 ID 查询，建议 `extensions=all`。

官网写明：“公交信息查询接口属于高级服务接口，对于已通过个人和企业认证的用户，我们提供每日一定量的配额以供体验。”因此可以列入个人可开发清单，但不能把体验配额写成无限免费调用。

`extensions=all` 的线路详情包括途经站点和首末班；返回对象的 `start_stop`、`end_stop`、`start_time`、`end_time` 是线路级信息。即使查询入口是某个中途站，也不能据此承诺该站的末班到站时间。文档还列出 `timedesc` JSON 字符串，应解析为结构化数据，并保留未解析的原始内容以免丢失特殊运营时段。

### 百度地图备选

已检查 `resources/ecosystem/upstream/baidu-maps-mcp/aca9b2892411/src/baidu-map/node/index.ts`：`map_directions(..., mode="transit")` 调用 `https://api.map.baidu.com/directionlite/v1/transit`。本地实现只输出方案距离、预计时长和步骤指令，不能据其输出承诺完整站点首末班或实时到站。

该代码坐标次序与高德不同：高德 REST 使用经度、纬度，百度 `directionlite` 使用纬度、经度；坐标系也须按各自文档处理。用户位置应由用户提供或授权取得，VPS 出口 IP 不能代替用户位置。

来源：[百度官方 MCP 源码](https://github.com/baidu-maps/mcp/blob/aca9b2892411/src/baidu-map/node/index.ts)、[官方说明](https://github.com/baidu-maps/mcp/blob/aca9b2892411/README_zh.md)。

### 实时公交和地铁到站

本次未核到一个普通个人账号可开通、覆盖全国城市的官方实时公交车辆/地铁列车到站 API。上述地图路径规划与公交信息接口不提供这个保证。可先实现路线、换乘、站点、运营时间；“下一班还有几分钟到站”必须另接该城市交通运营方的真实数据和授权，不能将行程预计时长当作到站倒计时。

## 飞常准官方查询服务

### 个人开发者准入已公开

当前 [飞友 AI 开放平台官网](https://ai.variflight.com/) 与 [旧 MCP 域名](https://mcp.variflight.com/) 均发布同一应用。已读取其公开文档、注册表单组件和文案：

- 注册表单必填用户名、邮箱、密码；手机号、公司名称标为可选，未要求企业认证或商务签约。
- 公开开发文档指引注册、邮件激活、登录控制台，在 `API Keys` 页面自助创建 Key。
- 官网文档说明新用户注册赠送 50 元体验额度，可先开始调用。该额度与计费政策以注册时的官网/控制台为准。
- 支持 Streamable HTTP 和本地 stdio npm；无人值守任务可用 API Key。OAuth 2.1 为可选路线。

这是个人开发者的公开接入路径证据，不是已取得账号权限的声明。没有注册、获取 Key、领取额度或执行查询。

官网为 JavaScript 应用，单独下载 HTML 只有页面壳。因此资源清单保存真正包含文案、工具表、协议配置和注册条件的公开 JS 资产，不将 HTML 壳误称为完整接入文档。

### 两套官方 MCP

| 服务 | 官方远程端点 | 用途 |
| --- | --- | --- |
| Aviation | `https://ai.variflight.com/servers/aviation/mcp` | 航班动态、机票报价、民航中转、机场天气、实时航空器位置、舒适度 |
| Tripmatch | `https://ai.variflight.com/servers/tripmatch/mcp` | 跨城出行、火车时刻/余票、机票报价、空铁中转 |

远程认证头为 `X-API-Key`。官网文档明确为无状态、JSON 响应的 Streamable HTTP；Pi 可按其支持的 HTTP MCP 传输接入，不需要 legacy SSE 桥接。

本地 stdio 包通过 `VARIFLIGHT_API_KEY` 或 `X_VARIFLIGHT_KEY` 环境变量读取凭据，调用 `https://mcp.variflight.com/api/v1/mcp/data`，请求头为 `X-VARIFLIGHT-KEY`，JSON 为 `{ "endpoint": "...", "params": { ... } }`。这是包内部的第一方数据接口，应优先使用官方 MCP，并区分本地包鉴权头与远程 MCP 鉴权头。

### 实物代码中的工具

核验 `variflight/variflight-mcp` 固定提交 `e1b5f73b78c592cb143d9339bc165dd9fb218624`，以及官方 npm `@variflight-ai/tripmatch-mcp@1.1.0` 的发布代码：

| 工具 | 能力与实际参数 |
| --- | --- |
| `searchFlightsByDepArr` | 指定日期和城市/机场查询直飞航班；同一侧不要混用城市和机场；可分页并请求摘要 |
| `searchFlightsByNumber` | 指定航班号与日期查询计划/实际起降等航班动态；不是票价工具 |
| `getFlightTransferInfo` | Aviation 的民航中转方案 |
| `getFlightAndTrainTransferInfo` | Tripmatch 的空铁联运方案 |
| `getFlightPriceByCities` | 指定出发/到达城市 IATA 代码与日期，查询逐航班、逐舱位的售价信息；不是订票或锁价 |
| `searchFlightItineraries` | Aviation 的自然语言推荐摘要，适合方案建议；不能当作逐舱报价的结构化响应 |
| `searchTrainStations` | 关键词查站，最新包描述有 `station_name`、`station_code`、`city_name` |
| `searchTrainTicketsByStation` | Tripmatch `1.1.0` 的站级查询，`from` / `to` 必须是具体中文站名，如上海虹桥、苏州北，`date` 为日期 |
| `searchTrainTicketsByCity` | Tripmatch `1.1.0` 的城市级查询，`from` / `to` 为中文城市或归属城市的站名，结果覆盖对应城市的多个站 |
| `searchTrainTickets` | Tripmatch 最新包保留的兼容别名，已标废弃，行为等同城市级；新集成使用上面两个明确工具 |
| `getFutureWeatherByAirport` | 按机场 IATA 代码查询未来三天机场天气 |
| `flightHappinessIndex` | 准点率、机型、行李额、餐食娱乐等参考信息 |
| `getRealtimeLocationByAnum` | Aviation 按机尾号查询航空器位置；不是旅客位置或叫车追踪 |

票价、余票和航班动态都是查询时的数据快照，展示时应附来源和查询时刻。价格是否含税费、可售舱位是否仍可购买，应依据实际字段与最终售票渠道确认。本次没有核到创建订单、锁票、出票、付款、改签或退票工具；这些不列入当前执行能力。

### 官网文档、GitHub 与最新 npm 有版本差异

- Aviation GitHub 包声明 `1.1.0`，README 末尾仍写 `1.0.3`；以固定提交与 `package.json` 为准。
- Tripmatch GitHub `b10abc8e48d284b5fb955ae3175d66bd13279704` 只有旧 `0.0.2` 发布代码和 README，没有完整 TypeScript 开发源码；内部 server/config 版本又标 `0.0.1`。该旧仓库仅作为参考归档。
- 当前官方 npm Tripmatch 为 `1.1.0`，发布包约 34 KB，包含真实可读 JS；它增加站级/城市级火车查询，旧仓库没有这些明确工具。
- 本次官网文档表格仍展示旧 `searchTrainTickets(from_city, to_city, date)`，而最新发布包接受 `from` / `to` 并新增两个明确工具。远程服务工具 schema 应以后续实际 `tools/list` 为准，不能把官网旧参数硬编码到最新 stdio 包中。
- 两个仓库和 npm 的 `package.json` 声明 ISC，README 也写 ISC，但所查目录/包内没有独立 LICENSE 文件。保留声明与发布者，勿把厂商数据服务许可等同于插件代码许可。

### 计费和适用范围

2026-10-02 官网文档写明 `1 积分 = 0.01 元`：航班列表/按航班号查询 50 积分，机票报价/火车票/中转查询通常 25 积分，火车站搜索 5 积分，机场天气 10 积分。每次分页调用也分别计费；协议层 `initialize`、`tools/list` 与本地日期工具免费，失败的上游查询/超时按官网说明不扣费。价格以后续官网与控制台公示为准。

[平台条款](https://ai.variflight.com/terms) 允许在自身产品/业务中调用和展示查询结果；未经书面许可不能转售、再分发或公开发布查询数据，不能超常频率抓取。个人自用查询可作为当前开发方向；如果后续把产品开放给其他用户，需重新核对数据使用和分发权限。

主要第一方来源：

- [Aviation 开发文档](https://ai.variflight.com/docs/aviation)
- [Tripmatch 开发文档](https://ai.variflight.com/docs/tripmatch)
- [注册页面](https://ai.variflight.com/register)
- [官网文案资产](https://mcp.variflight.com/assets/index-DyRg45M-.js)
- [工具表和协议配置资产](https://mcp.variflight.com/assets/Docs-DMvjYvAm.js)
- [注册表单资产](https://mcp.variflight.com/assets/Register-DhtWzTUW.js)
- [服务条款资产](https://mcp.variflight.com/assets/TermsOfService-mjC3uiA2.js)
- [官方 Aviation GitHub](https://github.com/variflight/variflight-mcp/tree/e1b5f73b78c592cb143d9339bc165dd9fb218624)
- [官方旧 Tripmatch GitHub](https://github.com/variflight/tripmatch-mcp/tree/b10abc8e48d284b5fb955ae3175d66bd13279704)
- [Tripmatch 1.1.0 官方发布包](https://registry.npmjs.org/@variflight-ai/tripmatch-mcp/-/tripmatch-mcp-1.1.0.tgz)

## 已归档携程问道

已检查本地 `resources/ecosystem/upstream/ctrip-wendao-skill/2dffb6a1444b/SKILL.md` 和 `scripts/wendao_query.js`。Skill 明确列举航班搜索、火车票查询与有无票意图，实际执行为向 `https://externalcallback.ctrip.com/skills/api/crew/skillhub/searchInfo` 发一次 POST：

```json
{ "inputs": { "token": "<WENDAO_API_KEY>", "query": "<用户的旅行问题>" } }
```

主要结果为 `result` Markdown 文本，没有单独的火车余票、票价、航班动态 schema，也没有已核实的订单/支付端点。可用于旅行规划与查询补充，不能因此对外承诺结构化实时库存或自主订票。原脚本虽然文档提到默认 30 秒超时，但实际没有请求超时控制；后续封装 Pi 工具时应增加超时、错误检查及明确的 `result` 提取，不能将含 `state` 的全量响应作为日志回传。

来源：[官方 Key 申请](https://www.ctrip.com/wendao/openclaw)、[认证 Skill 发布信息](https://api.skillhub.cn/api/v1/skills/ctripaitravelassistant?namespace=org-rdj3h8zv)。本次不重复归档已有包。

## 社区 12306 MCP 仅供参考

选择一个社区项目：[Joooook/12306-mcp](https://github.com/Joooook/12306-mcp)，固定提交 `ff6439da6f63d7d72181abea4568abd69878c600`，版本 `0.3.10`，实际 LICENSE 为 MIT，Node.js 要求至少 18。

源码实际从 12306 网页取站名 JS、初始化页面和 Cookie，动态解析查询路径，然后访问 `kyfw.12306.cn` / `search.12306.cn` 的网页业务端点。工具包括车站查找、余票/票价查询、经停站和中转查询；票价解析还有“根据 12306 的 JS 逆向出来”的明确注释。没有创建或支付订单工具。

这不是铁路官方公开给个人开发者的 API/MCP：

- 本次未核到个人开发者可申请的铁路官方余票 API 凭据与服务契约；不能因请求去了官方域名就标成官方开放接口。
- MIT 只授权社区代码，不授予铁路网页数据的自动化访问权或上游服务 SLA。
- 网站端点、Cookie、字段与反自动化措施可能改变，初始化本身也会联网。
- 本次代码未见应用级全局频率限制或显式请求超时；若以后专门实验，需要在项目层设置有限次数、并发上限、退避和停止条件，不能作为高频余票监控默认实现。
- 只保存原样代码、LICENSE 与文档；`readiness=reference-only`，默认不安装、不启动、不发查询、不绕过验证码或限流。个人 Agent 的主路径使用已开放的厂商查询服务，购票由最终售票渠道完成。

源码证据：[查询实现](https://github.com/Joooook/12306-mcp/blob/ff6439da6f63d7d72181abea4568abd69878c600/src/index.ts)、[MIT LICENSE](https://github.com/Joooook/12306-mcp/blob/ff6439da6f63d7d72181abea4568abd69878c600/LICENSE)。仓库 `docs/principle.md` 中部分端点描述与当前源码不完全一致，应以固定提交实际代码为准。

## 暂未列入开发主清单

- 全国实时公交/地铁到站：未核实普通个人能开通的通用官方服务，留待用户常用城市确定后对接运营方。
- 铁路官方自主购票、锁票、付款、改签、退票：未获得普通个人 API 接入证据。
- 航旅纵横：本次没有取得普通个人可开通的官方 API/MCP 证据，不能直接放入主清单。
- AirLabs / Aviationstack：公开航班数据 API 可作为全球航班覆盖的后续候选，但不是国内生态首选。AirLabs 文档明确数据覆盖依航班变化，`flight` 只返回最近一次航班，`schedules` 最多向前约 10 小时，不能替代机票报价/预订。当前已有飞常准满足国内查询方向，因此不额外归档同类海外接口。

后续开发验证应优先覆盖同城多机场、同城多火车站、具体站/城市语义、跨午夜航班、Asia/Shanghai 日期、缺失首末班字段和过期报价。这些场景决定查询结果是否真能用于日常出行。
