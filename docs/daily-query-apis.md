# 日常查询接口清单

核验日期：2026-10-02。面向个人使用、独立 VPS、以 Pi 为执行核心的 Agent，优先国内官方开放服务。社区本地数据、算法库与国际备用服务单独注明来源。

本轮新增 31 项源码、发布包、数据和文档，项目资源库合计 78 项。这是开发资产数，不是已启用的工具数。资源已下载到 [本地生态资源库](../resources/ecosystem/README.md)，具体快照、版本和条件见 [资源索引](../resources/ecosystem/INDEX.md)；尚未配置真实 Key 或完成业务联调。

## 按生活场景选接口

| 日常问题 | 推荐资源 | 接入方式 | 个人准入与费用 | 返回范围与边界 |
| --- | --- | --- | --- | --- |
| 今天穿什么、明天会不会下雨？ | 和风天气；彩云天气作第二路线 | 和风 HTTPS API；彩云官方 MCP / API | 和风支持个人开发者，使用专属 Host + JWT；彩云申请开发者 Key。按账号额度和服务计费 | 实况、小时/日预报；显示地点和更新时间，预报不等于现场实测 |
| 过一会儿会下雨吗？ | 和风短时降水 | `/v7/minutely/5m` | 和风凭据，中国地区；具体费用按价格组 | 未来两小时、五分钟步长；彩云分钟降水限企业增值权限，不放入普通个人主路径 |
| 空气怎么样、有天气预警吗？ | 和风空气质量和预警 | `airquality/v1`、`weatheralert/v1` | 个人开发者路线；按服务权限和覆盖范围 | 保留 AQI 标准、预警来源、发布时间与有效范围；权限不足或字段缺失不能解释为没有预警 |
| 日出日落几点、什么时候天黑？ | 和风日预报 / 太阳 API；彩云日预报 | 和风 `weather/v1/daily` 或 `/v7/astronomy/sun`；彩云日预报 `astro` | 普通天气凭据；彩云独立太阳 v3 限企业增值服务 | 按具体坐标和日期；彩云现有 MCP 文本省略 `astro`，此问题宜调用直接 API |
| 附近有什么、到某地怎么走？ | 高德地图；百度地图备选 | 官方 MCP 或 REST | 高德 Web 服务 Key / 百度 AK，账号配额及所用功能权限 | POI、地理编码、步行/骑行/驾车路线；坐标系和经纬度顺序按各接口转换 |
| 坐哪路公交、地铁怎么换乘？ | 高德地图 MCP / 公交路径规划 REST | `maps_direction_transit_integrated` 或 `/v3/direction/transit/integrated` | 高德 Web 服务 Key 与配额 | 公交地铁组合、站点、换乘和预计行程时间；不是实时车辆到站倒计时 |
| 地铁有哪些站、首末班几点？ | 高德公交信息查询 REST | `/v3/bus/linename`、`lineid`、`stopname`、`stopid` | 高级服务；个人认证和企业认证均有体验配额，正式额度以账号为准 | 线路和站点资料、线路首末班；具体上车站首末班只有路径规划实际返回时才展示 |
| 明天高铁几点、有没有余票？ | 飞常准 Tripmatch 官方 MCP | 远程 HTTP MCP 或官方 stdio 包 | 个人注册、邮箱激活、创建 API Key；按查询积分计费 | 时刻、站级/城市级余票、空铁中转；只查询，不包含购票、锁票或支付 |
| 机票多少钱、航班延误了吗？ | 飞常准 Tripmatch / Aviation 官方 MCP | 远程 HTTP MCP 或官方 stdio 包 | 同一平台 Key 和余额；价格、航班动态按调用计费 | 逐航班逐舱位报价、起降动态、机场天气；显示查询时刻，报价不是锁价或出票承诺 |
| 查新闻、政府公告、办事条件 | 博查 / 百度搜索 / 智谱 Web Search API | 官方 MCP、Skill 或直接 HTTP API | 各平台 Key、服务开通和余额；先选一家 | 保留链接与来源，搜索不能替代票务、物流或天气的专门业务查询 |
| 我的快递到哪里了？ | 快递100官方个人 Skill / 查询 Skill | 个人用户 API 或官方只读查询脚本 | 个人 Key 可从快递100微信小程序申请；平台查询 Key 与用户 Key 不互换 | 物流轨迹、具备权限时的个人订单查询、时效估算；部分公司需要手机号验证 |
| 明天上班吗、下个假期哪天？ | 国务院通知 + holiday-cn | 本地年度 JSON / ICS，封装 Pi 日期工具 | 无 Key；社区 MIT 数据，以官方通知核对 | 全国节假日和调休日，不推断公司排班；未公布年份不能猜测 |
| 今天农历几号、下个节气何时？ | lunar-typescript | 本地 TypeScript 算法库 | 无 Key、无需联网；社区 MIT 库 | 公农历转换、闰月、节气；使用中国时区，不用农历节日推算国务院调休 |
| 出国预算折合多少人民币？ | Frankfurter v2 / 项目 MCP | 公共 HTTPS API、远程 MCP 或自托管后端 | 国际第三方服务，公共 API 无 Key；国内 VPS 可达性待验证 | 央行参考汇率，附日期和数据来源；不是银行结算价或实时成交价 |

## 已核实的接入入口

### Pi SDK 的 MCP 配置

Pi v1.0.0 的官方 MCP 扩展原生支持 stdio 和 Streamable HTTP。CLI 会自动加载，嵌入 SDK 时需在 `DefaultResourceLoader.extensionFactories` 中显式加入 `createMcpExtension()`，调用资源加载器的 `reload()`，创建会话后再调用 `session.bindExtensions()` 启动连接。

默认 `codemode` 工具曝光需要同时加载 `createCodemodeExtension()`；选择 `deferred` 曝光时加载 `createToolSearchExtension()`。参考已归档的 [官方 SDK 示例](../resources/ecosystem/upstream/pi/a13d35a742c6/packages/coding-agent/examples/sdk/14-codemode-mcp.ts) 与 [MCP 文档](../resources/ecosystem/upstream/pi/a13d35a742c6/packages/coding-agent/docs/mcp.md)。仅 legacy SSE 服务需要另行桥接。本轮只保存开发资产，尚未创建会自动连接这些服务的配置。

### 天气

- 和风：[官方开发文档](https://dev.qweather.com/)，本地归档了官方中文 OpenAPI、认证、价格和许可正文。使用控制台的专属 API Host，新天气优先 `weather/v1`，空气质量使用 `airquality/v1`。旧 `/v7/air` 已于 2026-06-01 停服。新 v1 坐标路径是纬度在前，仍保留的 v7 `location` 参数是经度在前。
- 和风推荐 Ed25519 JWT；API Key 从 2027-01-01 起限量。天气和基础服务当前共享每月前 50,000 次免费阶梯，超额继续计费，不能按每个接口各自获得免费额度来计算。
- 彩云官方远程 MCP：`https://mcp-weather.caiyunapp.com/mcp`，Streamable HTTP，请求头 `X-Caiyun-API-Key`；本地源码用 stdio，环境变量 `CAIYUN_WEATHER_API_TOKEN`。分钟降水、预警和预报长度需要逐项确认账号权限。
- Open-Meteo：`https://api.open-meteo.com/v1/forecast`，免 Key 的国际备用；免费托管服务仅非商业，受频率与月额度限制。已保存官方 TypeScript SDK、OpenAPI 和价格文档。

### 地图与公共交通

- 高德官方远程 MCP：`https://mcp.amap.com/mcp?key=<自己的Key>`；本地发布包使用 `AMAP_MAPS_API_KEY`。含 Key 的 URL 不写入日志。
- 高德公交路径规划：`GET https://restapi.amap.com/v3/direction/transit/integrated`，支持起终点、城市、日期和时刻。现有归档 MCP 包 `0.0.8` 没有日期/时刻输入，并过滤首末班字段，需要这些信息时采用 REST 适配器。
- 高德公交资料：`GET https://restapi.amap.com/v3/bus/{linename|lineid|stopname|stopid}`；线路查询使用 `extensions=all` 取得详细资料。`start_time/end_time` 是线路时间，不能替代中途站到站时间。
- 本次未确认覆盖全国、普通个人可开通的官方实时公交/地铁到站 API。该能力要按常用城市另接当地运营方数据。

### 火车票、机票与航班

| 服务 | 远程 MCP | 认证与本地替代 |
| --- | --- | --- |
| 飞常准 Tripmatch | `https://ai.variflight.com/servers/tripmatch/mcp` | HTTP 请求头 `X-API-Key`；可选官方 `@variflight-ai/tripmatch-mcp@1.1.0` stdio 包 |
| 飞常准 Aviation | `https://ai.variflight.com/servers/aviation/mcp` | HTTP 请求头 `X-API-Key`；已归档官方 MCP 源码 |

官网支持个人自助注册、邮箱激活和创建 Key；注册表单的公司名称为可选。核验时新用户有 50 元体验额度，实际计费以控制台为准。官网当前 `1 积分 = 0.01 元`，火车票/机票报价通常 25 积分一查，航班动态通常 50 积分一查，分页也是独立调用。

Tripmatch 最新发布包提供 `searchTrainTicketsByStation(from,to,date)` 与 `searchTrainTicketsByCity(from,to,date)`，应区分具体火车站和城市。官网旧文档与旧 GitHub 仓库有版本落差，远程接入读取实际 `tools/list`；本地接入以归档 `1.1.0` 的 schema 为准。

携程问道作为已归档的旅行查询与规划补充，主要返回 Markdown 问答文本，不将其视为已验证的结构化实时余票接口。社区 12306 MCP 仅保存研究参考，未列入开发主路径。

### 搜索、快递与本地日期

- 博查、百度搜索已有官方资产；智谱新增独立搜索 API：`POST https://open.bigmodel.cn/api/paas/v4/web_search`，Bearer 平台 API Key。核验时不同引擎每次 0.01-0.05 元，选型按实际账号权限和现行价格。智谱 Coding Plan 搜索 MCP 的套餐用途另行确认，仅参考归档。
- 快递100个人用户 Key：微信「快递100」小程序「我的 → API KEY → 申请」，配置 `KUAIDI100_USER_API_KEY`；此 Key 不用于平台 `KUAIDI100_API_KEY` 接口。个人文档当前写明每分钟 10 次、每天 100 次，以账号最新政策为准。
- 快递100查询 Skill 声明无 Key 限额模式，但额度数值与长期可用性未确认。原始 Node MCP 的 stdout 普通日志和自依赖需适配后再部署。个人完整 Skill 还含寄件和取消代码，日常查询连接器只开放只读方法。
- `holiday-cn` 有年度数据、Schema 和 ICS，官方通知另存；日期计算先叠加通知的调休例外，再应用周末规则。`lunar-typescript` 单独负责公农历和节气，不能替代调休日数据。
- Frankfurter：`https://api.frankfurter.dev/v2/`；项目远程 MCP：`https://mcp.frankfurter.dev/`。例如 `/v2/rate/cny/usd?providers=ecb` 按同一日期的 ECB 数据换算，公共查询已做只读验证，返回的是参考汇率。

## 本地开发资产

下表的 ID 对应 `resources/ecosystem/upstream/<ID>/<固定快照>/`；完整路径与提交由 [索引](../resources/ecosystem/INDEX.md) 和 [锁文件](../resources/ecosystem/sources.lock.json) 记录。

| 用途 | 已保存资源 ID | 内容性质 |
| --- | --- | --- |
| 和风天气 | `qweather-api-docs-source` | 官方文档源码、中文 OpenAPI、许可与价格，不是天气服务端源码 |
| 彩云天气 | `caiyun-weather-mcp-source`、`caiyun-weather-*-docs` | 官方 Python MCP 源码与 API/MCP/认证/计费文档 |
| 地图与公交地铁 | `amap-maps-mcp-package`、`baidu-maps-mcp`、`amap-transit-rest-docs`、`amap-bus-inquiry-rest-docs` | 官方 MCP 发布代码/源码和完整 REST 文档 |
| 火车票与航班 | `variflight-tripmatch-mcp-package`、`variflight-aviation-mcp-source`、`variflight-mcp-official-*` | 当前官方发布代码、Aviation 源码；官网 JS 资产保存真实工具表、准入和条款正文 |
| 搜索 | `bocha-search-mcp`、`baidu-search-skill`、`zhipu-web-search-api-docs` | 官方 MCP 源码、Skill 与独立搜索 API 文档 |
| 快递 | `kuaidi100-query-skill`、`kuaidi100-user-skill`、`kuaidi100-mcp-nodejs` | 官方 Skills、查询脚本与 TypeScript MCP 源码 |
| 工作日与调休 | `china-holiday-notice-2026`、`holiday-cn-data` | 国务院通知与社区年度 JSON/ICS |
| 农历与节气 | `lunar-typescript-calendar` | 社区 TypeScript 本地算法库源码 |
| 汇率 | `frankfurter-api-source`、`frankfurter-openapi`、`frankfurter-mcp-docs` | 社区 API 后端、OpenAPI 与项目远程 MCP 文档；未归档独立 MCP 服务端源码 |
| 国际天气备用 | `open-meteo-typescript-sdk`、`open-meteo-forecast-openapi`、`open-meteo-pricing-docs` | 官方 SDK 源码、规范与使用条件 |

详细依据见 [天气研究](research-daily-weather.md)、[交通研究](research-daily-transport.md)、[日常工具研究](research-daily-utilities.md)。新增来源清单分别是 [daily-weather.json](../resources/ecosystem/catalog-parts/daily-weather.json)、[daily-transport.json](../resources/ecosystem/catalog-parts/daily-transport.json)、[daily-utilities.json](../resources/ecosystem/catalog-parts/daily-utilities.json)。

## 接入顺序与验收

1. 先做一家搜索服务、高德路线与地点查询、和风基础天气，再加入无需账号的本地日期工具。
2. 获得个人 Key 后接入飞常准和快递100；彩云、百度地图与汇率按实际需要作为补充，避免重复向模型注册同类工具。
3. Pi 工具统一返回数据来源、查询时刻、业务数据时刻和关键参数；凭据从项目配置注入，不由模型生成。
4. 在实际 VPS 上验证坐标系、Asia/Shanghai 日期、同城多机场/车站、缺失首末班字段、额度不足、超时和报价过期。先读取 MCP 工具 schema，再启用具体查询工具。

查询结果保留数据时间。缓存、刷新和重试按接口许可与调用预算分别设置；和风 GeoAPI 不缓存或建立索引。只有查询功能通过账号联调后才向用户开放；票务与物流查询不会自动启用包内其他业务操作。

当前仅参考的新增项包括旧 Tripmatch 仓库、社区 12306 MCP、快递鸟和智谱编程套餐搜索 MCP。原有美团酒旅授权问题维持原分级，详见 [开发范围](development-scope.md)。
