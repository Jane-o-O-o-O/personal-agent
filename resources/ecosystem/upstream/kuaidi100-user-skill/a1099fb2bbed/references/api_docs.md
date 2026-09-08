# 快递100用户版 API 文档 v2.1

## 基础信息

- **Base URL**: `https://p.kuaidi100.com`（固定，不可配置）
- **请求方式**: POST
- **Content-Type**: `application/x-www-form-urlencoded`
- **鉴权方式**: API Key
  - Header: `X-API-Key: <密钥>`
  - 或 Query 参数: `api_key=<密钥>`
- **频率限制**: 每分钟 10 次，每天 100 次，超限返回 HTTP 429

## 运行模式

### 无Key模式
无需 API Key 即可使用的基础功能：
- 地址解析标准化
- 物品标准重量查询
- 快递公司价格和时效查询
- **预下单**（提交信息获取下单链接）
- 本地数据管理（寄件人/收件人/订单缓存）

### 完整模式
需要 API Key 才能使用的功能：
- 服务端默认寄件人查询
- 服务端地址簿匹配收件人
- 物流轨迹查询
- 订单管理（服务端）
- 取消订单

## 环境变量

```bash
export KUAIDI100_USER_API_KEY='your_key'   # API密钥（可选）
```

## 一、寄件下单接口（/skill/api/*）

### 1. 地址解析标准化

`POST /skill/api/addressComplete`

**是否需要Key**: 否

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| address | string | 是 | 自由格式地址文本 |

返回（AddressCompleteResult）：

```json
{
  "status": 200,
  "message": "ok",
  "data": {
    "resultCode": true,
    "message": "解析成功",
    "province": "广东省",
    "city": "深圳市",
    "district": "南山区",
    "subArea": "科技园南路XX号",
    "addressForModel": "广东省深圳市南山区科技园南路XX号"
  }
}
```

**注意**：此接口不返回 `xzqCode`（行政区划编码）。

---

### 2. 查询默认寄件人

`POST /skill/api/queryDefaultSender`

**是否需要Key**: **是**

无额外参数，返回当前用户的默认寄件人地址。

返回（AddressBookDTO）：

```json
{
  "status": 200,
  "message": "ok",
  "data": {
    "id": 1,
    "name": "张三",
    "mobile": "13800138000",
    "province": "广东省",
    "city": "深圳市",
    "district": "南山区",
    "addr": "科技园XX路XX号",
    "tel": "",
    "latitude": "",
    "longitude": "",
    "xzqName": "南山区"
  }
}
```

**注意**：地址簿 DTO 中手机号字段为 `mobile`，详细地址字段为 `addr`（不是 `phone` / `address`）。

---

### 3. 根据姓名查询收件人

`POST /skill/api/queryReceiverByName`

**是否需要Key**: **是**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| receiverName | string | 是 | 收件人姓名（模糊匹配） |

返回收件人列表（AddressBookDTO 数组），结构同上。

---

### 4. 查询物品重量

`POST /skill/api/queryItemWeight`

**是否需要Key**: 否

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemName | string | 是 | 物品名称 |

返回（CargoItemDTO）：

```json
{
  "status": 200,
  "message": "ok",
  "data": {
    "original_name": "手机",
    "item_name": "手机",
    "spec_weight": "0.5",
    "category": "3c产品,手机通讯,手机",
    "restriction_level": "可寄递",
    "volume_weight_category": "",
    "delivery_requirements": "",
    "able_coms": "",
    "unable_coms": "",
    "package_volume": "16*7.5*0.8",
    "pic_url": "",
    "auditor": "人工",
    "audit_status": 1,
    "label_express_delivery": "含锂电池",
    "selected_count": 109897
  }
}
```

**注意**：`spec_weight` 为字符串类型（不是数字），使用时需 `float()` 转换。

---

### 5. 查询快递公司价格时效

`POST /skill/api/queryShippingCompanies`

**是否需要Key**: 否

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| senderCity | string | 是 | 寄件地行政区划名称。**必填城市级**（如 `"深圳市"`、`"北京市"`），可附加区县（如 `"深圳市 南山区"`） |
| receiverCity | string | 是 | 收件地行政区划名称。**必填城市级**（如 `"三明市"`、`"北京市"`），可附加区县（如 `"三明市 泰宁县"`） |
| weight | number | 否 | 重量(kg)，默认 1.0 |

返回（FreightInfoV3 数组）：

```json
{
  "status": 200,
  "message": "ok",
  "data": [
    {
      "name": "顺丰速运",
      "com": "shunfeng",
      "sign": "sf",
      "totalprice": 18.0,
      "arriveTipsDate": "1-2天",
      "priceInfo": "18元，1-2天",
      "logo": "https://cdn.kuaidi100.com/images/all/56/shunfeng.png",
      "firstPrice": 18.0,
      "overPricePerKg": 5.0,
      "serviceType": "",
      "serviceTypeName": "",
      "tips": "",
      "freightPrice": 18.0,
      "overWeight": 0,
      "overPrice": 0,
      "linePrice": 18.0,
      "discountsAmount": 0,
      "couponPrice": 0,
      "event": "click",
      "eventKey": ""
    }
  ]
}
```

**重要字段映射**：

| 展示用 | 下单传参 | 说明 |
|--------|----------|------|
| `name` | `kuaidiName` | 快递公司名称 |
| `com` | `kuaidiCom` | 快递公司编码 |
| `sign` | `companySign` | 签名标识（下单必传） |
| `totalprice` | `estimatedAmount` | 运费 |
| `arriveTipsDate` | — | 预计时效 |

---

### 6. 提交寄件预订单

`POST /skill/api/collectShipmentOrderInfo`

**是否需要Key**: 否

**说明：** 此接口为预下单，提交寄件信息后返回下单链接，用户需点击链接前往小程序完成正式下单。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| senderName | string | 是 | 寄件人姓名 |
| senderPhone | string | 是 | 寄件人手机号 |
| senderProvince | string | 是 | 寄件人省份 |
| senderCity | string | 是 | 寄件人城市 |
| senderDistrict | string | 是 | 寄件人区县 |
| senderAddress | string | 是 | 寄件人详细地址 |
| receiverName | string | 是 | 收件人姓名 |
| receiverPhone | string | 是 | 收件人手机号 |
| receiverProvince | string | 是 | 收件人省份 |
| receiverCity | string | 是 | 收件人城市 |
| receiverDistrict | string | 是 | 收件人区县 |
| receiverAddress | string | 是 | 收件人详细地址 |
| itemName | string | 是 | 物品名称 |
| weight | number | 是 | 重量(kg) |
| kuaidiName | string | 是 | 快递公司名称 |
| kuaidiCom | string | 是 | 快递公司编码 |
| companySign | string | 是 | 快递公司签名标识 |
| serviceType | string | 否 | 服务类型 |
| estimatedAmount | number | 否 | 预估金额(元) |
| remark | string | 否 | 备注 |
| expectedPickupTimeDesc | string | 否 | 期望取件时间描述 |
| orderNo | string | 否 | 订单号（更新已有订单时使用） |

返回（ShipmentOrderResult，嵌套结构）：

```json
{
  "status": 200,
  "message": "ok",
  "data": {
    "orderInfo": {
      "orderNo": "KD202603200001",
      "senderName": "张三",
      "senderPhone": "13800138000",
      "senderProvince": "广东省",
      "senderCity": "深圳市",
      "senderDistrict": "南山区",
      "senderAddress": "科技园XX路XX号",
      "receiverName": "李四",
      "receiverPhone": "13900139000",
      "receiverProvince": "北京市",
      "receiverCity": "北京市",
      "receiverDistrict": "朝阳区",
      "receiverAddress": "三里屯XX号",
      "itemName": "手机",
      "weight": 0.5,
      "kuaidiName": "顺丰速运",
      "kuaidiCom": "shunfeng",
      "companySign": "sf",
      "status": "PENDING",
      "createTime": "2026-03-20 10:00:00"
    },
    "url": "weixin://dl/business/?appid=wx6885acbedba59c14&...",
    "qrCode": "https://www.kuaidi100.com/twoCode.do?&w=400&h=400&code=...",
    "markdownInfo": "## 📦 订单信息\n\n**🆔 预下单编号：** xxx\n\n..."
  }
}
```

**注意**：返回是嵌套结构，需要从 `data.orderInfo` 中获取订单号，从 `data.url` 获取链接，从 `data.qrCode` 获取二维码，从 `data.markdownInfo` 获取 Markdown 格式信息。

---

### 7. 查询用户订单

`POST /skill/api/queryUserOrders`

**是否需要Key**: **是**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | int | 否 | 返回记录数 |
| orderid | int | 否 | 订单ID，传入时查单个详情 |

返回订单列表：

```json
{
  "status": 200,
  "message": "ok",
  "data": {
    "orders": [
      {
        "orderNo": "KD202603200001",
        "status": "已下单",
        "kuaidiName": "顺丰速运",
        "createTime": "2026-03-20 10:00:00"
      }
    ]
  }
}
```

---

### 8. 物流轨迹查询

`POST /skill/api/trackShipment`

**是否需要Key**: **是**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNum | string | 是 | 运单号 |
| com | string | 否 | 快递公司编码（传入可加速识别） |

返回：

```json
{
  "status": 200,
  "message": "ok",
  "data": {
    "com": "shunfeng",
    "nu": "SF1234567890",
    "state": "3",
    "data": [
      {"time": "2026-03-20 15:00:00", "context": "已签收"}
    ]
  }
}
```

---

### 9. 取消订单

`POST /skill/api/cancelOrder`

**是否需要Key**: **是**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNo | string | 是 | 订单编号 |
| reason | string | 是 | 取消原因 |

返回：`{"status": 200, "message": "ok", "data": null}`

---

## 二、密钥说明（非接口，供参考）

API Key 通过快递100小程序获取，具体操作：

1. 打开微信 → 搜索「快递100」小程序
2. 进入「我的」→ 点击「API KEY」→ 点击「申请」获取 API KEY
3. 每个用户最多 3 个有效密钥，超出需先吊销旧的
4. 将生成的密钥设置到环境变量 `KUAIDI100_USER_API_KEY`

AI 不应调用密钥管理接口，仅在用户缺少密钥时引导其自行获取。

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | API密钥缺失或无效 / SSO未登录 |
| 404 | 资源不存在 |
| 429 | 请求频率超限 |
| 500 | 系统异常 |

> 接口调用策略（双通道优先级、地址字段映射、单次寄件 API 调用次数统计）详见 [workflow.md - 十、接口调用策略](workflow.md#十接口调用策略)。