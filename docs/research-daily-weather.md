# 日常天气查询接入研究

核验日期：2026-10-02。仅核对第一方公开文档和源码，没有注册账户、申请凭据、调用天气业务接口或运行下载代码。资源清单位于 `resources/ecosystem/catalog-parts/daily-weather.json`，实际下载由项目统一同步工具完成。

## 可开发路线

| 服务 | 适合的日常问题 | 个人 VPS 接法 | 个人准入与鉴权 | 费用、权限和商业边界 |
| --- | --- | --- | --- | --- |
| 和风天气 QWeather | 今天穿什么、出门是否带伞、明后天温度、空气质量、天气预警、日出日落 | 官方 HTTPS JSON API，封装为 Pi 工具；本次未确认官方 MCP | 官网明确支持个人开发者；控制台创建项目、凭据和专属 API Host；推荐 Ed25519 JWT，也支持 API Key | 官方 FAQ 明确允许商业使用，须遵守开发者许可和来源标注；天气和基础服务当前共享每月前 50,000 次免费阶梯，超出继续按量计费，不是每个接口各 50,000 次；高频、海洋、太阳辐照等另有价格组 |
| 彩云天气官方 MCP | 当前温度、体感、空气质量、逐小时/逐日预报、具备权限时的预警 | 官方 Streamable HTTP MCP，或官方 Python MCP 源码在 VPS 上以 stdio 运行；Pi 支持这两种传输 | 注册彩云开发平台并申请自己的 API Key；远程传 `X-Caiyun-API-Key`，本地配置 `CAIYUN_WEATHER_API_TOKEN` | 官方计费页向个人/小项目推荐按量购买；价格、QPS、预报长度和 API 权限在账户管理平台确定。本次未找到公开的完整数据商用许可正文，不把开源 MIT 误作数据商用授权 |
| 彩云天气直接 API | 需要结构化 JSON、日出日落、完整生活指数或自定义天气工具 | HTTPS API，普通服务可使用 v2.6；新版 v3 接口按对应认证文档配置 | 支持 Token，也支持 App Key + App Secret 签名；普通天气路径为经度在前、纬度在后 | 日预报已含 `astro` 日出日落；独立太阳 v3、分钟降水为企业套餐增值服务，不能承诺普通个人凭据可用。预警不适用于免费赠送额度，须付费并具备权限 |
| Open-Meteo 备用 | 基础温度、降水概率、逐小时预报、日出日落 | 直接 HTTPS JSON，或官方 TypeScript SDK；无须部署完整气象模型服务器 | 免费开放端点免 Key；输入 WGS84 经纬度 | 非国内服务，服务器位于欧洲/北美；免费托管 API 仅非商业使用，无 SLA，受公平使用限制；商业使用需订阅客户端点和 Key。数据 CC BY 4.0 必须归因，服务 API 条款与数据许可证是不同约束 |

建议首版用和风提供完整、结构化的天气工具，以彩云官方 MCP 提供快速接入路线。Open-Meteo 只作个人非商业用途下的备用，不用于替代国内官方天气预警，也不能当作中国地面观测站实测。

## 和风：新项目应使用当前接口

| 能力 | 当前公开端点路径 | 文档声明的时间、空间范围 |
| --- | --- | --- |
| 实时天气 | `/weather/v1/current/{latitude}/{longitude}` | 全球指定坐标，1 km 分辨率、分钟级更新 |
| 逐小时预报 | `/weather/v1/hourly/{latitude}/{longitude}` | 最多 240 小时、1 km；实际返回仍按参数和服务权限 |
| 逐日预报 | `/weather/v1/daily/{latitude}/{longitude}` | 最多 10 天、1 km；含日出日落、月升月落、月相和紫外线 |
| 实时空气质量 | `/airquality/v1/current/{latitude}/{longitude}` | 1 km；AQI、污染物和健康建议，AQI标准应保留 |
| 空气质量预报 | `/airquality/v1/hourly/{latitude}/{longitude}`、`/airquality/v1/daily/{latitude}/{longitude}` | 未来 24 小时或 3 天 |
| 当前天气预警 | `/weatheralert/v1/current/{latitude}/{longitude}` | 依位置查询当前生效的官方预警，覆盖以预警覆盖表为准 |
| 短时降水 | `/v7/minutely/5m` | 中国地区，未来 2 小时、5 分钟步长、1 km |
| 日出日落专项 | `/v7/astronomy/sun` | 全球任意地点，未来 60 天；短期查询可复用逐日天气返回 |

以上路径使用控制台分配的开发者专属 API Host，不能照抄示例域名或继续把 `devapi.qweather.com` 写死。新 v1 天气、空气和预警路径使用纬度在前、经度在后；仍保留的 v7 查询参数 `location` 则是经度在前、纬度在后。新坐标路径文档最多支持两位小数，不应把这解释成房间或街道级实测精度。

官方迁移信息需要进入开发约束：

- 原公共 API 域名自 2026 年起逐步停止服务，替换为专属 API Host。
- `/v7/air/now` 和 `/v7/air/5d` 已于 2026-06-01 停服，应改用 `airquality/v1`。
- 城市天气 v7 已标记即将弃用，优先 `weather/v1`。这不等于所有 v7 服务都被弃用。
- API Key 将从 2027-01-01 起限制每日请求量；SDK 5+ 仅支持 JWT，SDK 4.x 于 2026-12-31 停服。VPS 新实现推荐 JWT。
- 个人类型与企业类型在天气数据和性能上没有差别；类型选定后暂不能修改。

按当前官方价格数据，天气和基础服务价格组每月前 50,000 次为 0 元，随后阶梯为 0.0007 元/次等。免费阶梯用完后会继续计费，开发时应设置请求预算、缓存与重试上限，并以控制台账单/现行价格为准。天气结果可以缓存；GeoAPI 地理数据不能批量下载、缓存或建立索引。

展示天气需明确标注和风来源和链接；空气质量、预警还需完整保留 `refer.sources`。预警说明、发布时间、有效范围和数据更新时间应随消息一起保留。

## 彩云：MCP 可以接 Pi，部分日常能力需要直接 API

官方远程地址为 `https://mcp-weather.caiyunapp.com/mcp`，使用 Streamable HTTP，通过 `X-Caiyun-API-Key` 请求头认证。官方文档直接链接 `caiyunapp/mcp-caiyun-weather` 仓库，源码 MIT；本地入口 `mcp.run()` 为 stdio，配置 `CAIYUN_WEATHER_API_TOKEN`。

| 官方 MCP 工具 | 当前公开代码的范围 | 接入注意 |
| --- | --- | --- |
| `get_realtime_weather` | 温度、体感、风、湿度、降水强度、PM2.5 等污染物、中美 AQI、紫外线和舒适度 | 本地实现返回英文格式化文本，不是原始 JSON；Agent 可中文回答，业务缓存需要直接 API 或适配 |
| `get_hourly_forecast` | 默认 72 小时，源码参数允许 1-360 小时 | 不能据此承诺每种套餐都有 360 小时，按真实权限与返回长度 |
| `get_weekly_forecast` | 请求 7 天，源码按实际数组长度返回，注释提示免费层为 3 天 | “七天天气”不是无条件 7 天；MCP 文本没有保留日预报原始 `astro` 字段 |
| `get_historical_weather` | 文档声明过去 24 小时；本地实现向 hourly 接口传 `begin` | 尚未联调；直接 API FAQ 要求 `dailystart=-1` 获取过去一天，不承诺该 MCP 工具已实测可靠 |
| `get_weather_alerts` | 请求 v2.6 weather 的 `alert=true` | 需要付费预警权限；本地代码将缺失 `alert` 或空数组均格式化为无预警，项目不能把未获权限当作确认没有预警 |

经纬度天气 API 的路径顺序是经度、纬度，响应 `location` 顺序是纬度、经度。跨地图提供商时要保留坐标系标签并依据各接口约定转换，不能交换数组后就假设定位正确。

普通个人路线可接当前实况、小时和日预报；日预报的 `result.daily.astro` 已含日出日落。独立太阳 v3 和逐分钟降水页面明确限企业套餐增值服务，本轮不将它们列为普通个人可用能力。天气预警需付费权限，且 v2 有行政区边界网格匹配问题；需要精确预警时应另核对 v3 权限与实现。

官方免费额度数量、单价、QPS和完整数据商用许可本次没有从公开文档获得稳定数值，保留账户平台核验步骤，不使用社区文章中的旧“免费 1000 次/天”等数字。

## 免 Key 备用的实际边界

Open-Meteo 免费预报端点是 `https://api.open-meteo.com/v1/forecast`，支持 `current`、`hourly`、`daily` 等参数；日数据可请求 `sunrise` 和 `sunset`，中国地点使用 `timezone=Asia/Shanghai`。官方 TypeScript SDK 的 `fetchWeatherApi` 使用 FlatBuffers，可以作为 Pi HTTP 工具的客户端；简单场景直接 JSON 更易归一化。

当前定价页列明免费托管 API 限非商业，600 次/分钟、5,000 次/小时、10,000 次/天、300,000 次/月。多位置、多模型、大量变量或较长时间范围可能计作多次调用，不能只统计 HTTP 请求数。商业订阅使用 `customer-api.open-meteo.com` 和 API Key。预报网格分辨率依位置和模型变化，页面列出全球模式及 CMA，不等于任意中国地点具备 1 km 精度。

SDK MIT、服务器 AGPLv3、数据 CC BY 4.0 分别约束不同产物；官方没有在本轮核对的 SDK/API 文档中提供可认定为官方的 MCP 服务，因此只归档官方 SDK、规范和计费文档。

## 第一方证据

和风官网本轮直接 HTTP 抓取返回 403，使用其官方 `qwd/dev-site` 仓库的完整正文核验；仓库首页明确是 `dev.qweather.com` 的源代码，不使用搜索摘要作为证据。固定快照：`bdbf57c82fa7580b4bea1497ba59e37e66170086`，提交日期 2026-09-16。

- [和风官方开发文档源仓库](https://github.com/qwd/dev-site)
- [和风完整中文 OpenAPI](https://github.com/qwd/dev-site/blob/bdbf57c82fa7580b4bea1497ba59e37e66170086/assets/openapi/qweather-apis-zh.yml)
- [和风个人与企业开发者](https://github.com/qwd/dev-site/blob/bdbf57c82fa7580b4bea1497ba59e37e66170086/content/zh/docs/account/developers.md)
- [和风 JWT、API Key 及迁移日期](https://github.com/qwd/dev-site/blob/bdbf57c82fa7580b4bea1497ba59e37e66170086/content/zh/docs/configuration/authentication.md)
- [和风专属 API Host](https://github.com/qwd/dev-site/blob/bdbf57c82fa7580b4bea1497ba59e37e66170086/content/zh/docs/configuration/api-host.md)
- [和风官方价格源数据](https://github.com/qwd/dev-site/blob/bdbf57c82fa7580b4bea1497ba59e37e66170086/data/price.yaml)
- [和风 FAQ：商业用途、缓存和免费额度用尽](https://github.com/qwd/dev-site/blob/bdbf57c82fa7580b4bea1497ba59e37e66170086/content/zh/help.md)
- [和风来源标注要求](https://github.com/qwd/dev-site/blob/bdbf57c82fa7580b4bea1497ba59e37e66170086/content/zh/docs/terms/attribution.md)
- [彩云官方 MCP 文档](https://docs.caiyunapp.com/weather-api/mcp.html)
- [彩云官方 MCP 源码](https://github.com/caiyunapp/mcp-caiyun-weather/tree/cbbdd7c29f4657567b6a33cb0ce19ae1a4715980)，固定提交日期 2026-09-01
- [彩云计费和个人开发建议](https://docs.caiyunapp.com/weather-api/billing.html)
- [彩云认证](https://docs.caiyunapp.com/weather-api/auth.html)
- [彩云速率限制](https://docs.caiyunapp.com/weather-api/ratelimit.html)
- [彩云实况与空气质量](https://docs.caiyunapp.com/weather-api/v2/v2.6/1-realtime.html)
- [彩云日预报与日出日落](https://docs.caiyunapp.com/weather-api/v2/v2.6/4-daily.html)
- [彩云预警付费权限及 v2 边界](https://docs.caiyunapp.com/weather-api/v2/v2.6/5-alert.html)
- [彩云分钟降水企业套餐限制](https://docs.caiyunapp.com/weather-api/v2/v2.6/2-minutely.html)
- [彩云独立太阳接口企业套餐限制](https://docs.caiyunapp.com/weather-api/v3/astronomy/sun.html)
- [彩云时空变量覆盖范围](https://docs.caiyunapp.com/weather-api/v2/v2.6/tables/coverage.html)
- [Open-Meteo 官方 TypeScript SDK](https://github.com/open-meteo/typescript)
- [Open-Meteo 官方 OpenAPI](https://github.com/open-meteo/open-meteo/blob/b06f4760fd1f997e5559bb380f64c5e496b4a509/openapi/forecast.yml)
- [Open-Meteo 当前服务条款与价格边界](https://open-meteo.com/en/pricing)

