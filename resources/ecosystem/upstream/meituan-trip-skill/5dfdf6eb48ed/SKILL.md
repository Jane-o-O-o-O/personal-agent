---
name: meituan-travel
description: "美团酒旅官方 Skill，您的专属 AI 旅行管家。酒店、机票、火车票、景点门票、度假一站搞定，还能帮你找优惠、比价格、定行程。美团海量真实点评加持，出行每一步都更放心。"
homepage: https://developer.meituan.com
metadata:
  primary: MEITUAN_HT_TOKEN
  openclaw:
    agent:
      type: tool
      runtime: node
      context_isolation: execution
      parent_context_access: read-only
    requires:
      env:
        - MEITUAN_HT_TOKEN
        - MEITUAN_RAW_JSON
      bins:
        - npx

skill-dependencies:
   meituan-passport-user-auth:
      passport_token_placeholder: ${passport_token}
      passport_auth_mode_placeholder: ${passport_auth_mode}
      client_id: 475ed9064610499ea66835e1da122f3a
      env: prod
---

# 美团旅行助手 Skill
美团酒旅官方 Skill，您的专属 AI 旅行管家。机票、酒店、火车票、景点门票一站搞定，还能帮你抢优惠券、比价格、定行程。美团海量真实点评加持，出行每一步都更放心。

## 适用场景边界

✅ **使用此 skill：**
- "想去踏青赏花，推荐几个必去的城市"
- "周末两天适合去哪里玩"
- "带小孩去哪里旅游比较好"
- "明天去武汉的火车票"
- "去南方的特价机票"
- "两大一小怎么买上海迪士尼门票"
- "帮我订这周末开封的情侣酒店，预算500内"

❌ **不使用此 skill：**
- 出国签证申请、护照办理流程
- 非旅行相关的外卖、打车等美团其他业务

---

## 工作流程

**Step 1：鉴权检查**

执行鉴权脚本（含 CLI 安装检查、缓存检测、授权链接获取、二维码生成，全程约 3 秒内完成）：

```bash
bash "{baseDir}/scripts/auth.sh" --client_id 475ed9064610499ea66835e1da122f3a --env prod
```

按输出结果处理：

- 输出 `TOKEN_CACHED` → 缓存有效，直接进入 Step 2
- 输出 `QRCODE_IMAGE:<path>` + `AUTH_LINK:<url>` →
  1. 向用户展示二维码图片和授权链接
     > ⚠️ 路径必须用尖括号包裹：`![二维码](<path>)`
  2. **【强制】立即在同一轮次中**执行轮询，**禁止等待用户回复、禁止要求用户「告诉我」或「通知我」**：
     ```bash
     pt-passport auth poll-token --client_id 475ed9064610499ea66835e1da122f3a
     ```
  3. 轮询退出码 `0` → 进入 Step 2；非 `0` → 提示用户授权失败
- 输出 `ERROR:<message>` → 提示用户错误信息后终止

**Step 2：提取参数**

从对话中识别：
- **城市**：用户当前定位城市；用户明确指定出发地时以用户为准；获取不到默认北京
- **查询需求**：用户完整的旅行意图描述

**Step 3：发起查询**

先向用户发送等待提示（该接口耗时约 1-2 分钟）：

> 🔍 正在连接美团酒旅数据接口为您规划，耗时约 1-2 分钟，请稍候...

然后执行 CLI：

```bash
MEITUAN_HT_TOKEN="${passport_token}" npx @meituan-travel/ht-ai-open@latest query \
  --query "<用户的自然语言查询>" \
  --origin-query "<用户完整原始输入>" \
  --channel skillhub \
  [--city <城市>]
```

> ⚠️ `--origin-query` 为必填参数，必须传入用户完整原始输入，不得省略。
> ⚠️ 严禁使用 curl、fetch、axios 等方式直接调用 API，必须通过 `ht-ai` CLI。

**退出码：**

| 退出码 | 含义 |
|--------|------|
| 0 | 成功 |
| 1 | 普通错误（参数错误、网络超时等） |
| 3 | 鉴权失败（Token 无效或未配置） |

**Step 4：渲染输出**

严格按照【输出要求】向用户展示最终结果。

---

## ⚠️ 强制约束

- **禁止手动构造 HTTP 请求**：严禁使用 curl、fetch、axios 等方式直接调用 API，必须且只能通过 `@meituan-travel/ht-ai` CLI 发起请求。
- **禁止自行拼接 Token**：`${passport_token}` 必须原样通过环境变量 `MEITUAN_HT_TOKEN` 传入 CLI，不得作为 `Authorization: Bearer` 等其他格式使用。
- **禁止中断轮询等待用户**：展示二维码后必须在同一轮次中立即调用 `poll-token` 等待授权结果，严禁输出「完成授权后请告诉我」「授权后通知我」等要求用户主动触发的语句。

## 输出要求

- **零删减**：必须将 CLI 输出的全部内容原样透传给用户，不得合并段落、删减字数，不得省略酒店名、价格、评分、链接等信息。
- **跳转链接**：CLI 返回内容中包含的跳转链接（如 [查看详情](http://...)）必须完整保留并透传给用户，禁止去除链接只保留文字。
- **图片**：若终端支持图片渲染，CLI 返回的图片（![alt](url)）应内嵌展示；不支持时保留链接即可，禁止直接丢弃。
- **价格原样输出**：CLI 返回的价格字符串必须原样展示，禁止任何转换或补充说明。价格中的占位符（如 X、XX）是后端脱敏处理，不得自行还原或猜测。

## 🆘 错误处理

| 异常情况 | 应对策略 |
|---------|---------|
| 网络超时（>120s） | "请求超时啦，当前查询人数较多，请换个问法或稍后再试。" |
| 查询失败 | 展示错误信息，建议用户换个问法重试 |
| 城市无法识别 | 停止猜测，主动询问用户确认具体城市 |
| 返回内容为空 | 告知用户暂无相关结果，建议调整查询关键词 |
| exit 3（鉴权失败） | 提示用户通过美团 Passport 重新授权 |

## 注意事项

- **响应时间约 1-2 分钟**，调用前必须告知用户耐心等待。
- **query 越具体推荐越精准**，引导用户提供：出发城市、时间、人数、预算、旅行风格。
- **Token 为极高敏感凭证**，禁止在对话中打印 Token 明文；勿在日志中打印完整 Token。
- 默认将 API 返回的 Markdown **如实展示给用户**，响应不完整时可重试。
