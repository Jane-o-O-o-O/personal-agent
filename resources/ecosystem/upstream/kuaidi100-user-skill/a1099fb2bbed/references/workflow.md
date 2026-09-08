# 快递100用户版 - 工作流

## 目录

- [前置检查](#前置检查)
- [运行模式对比](#运行模式对比)
- [决策逻辑（自动 vs 询问用户）](#决策逻辑自动-vs-询问用户)
- [一、寄件人获取（双通道 + 降级）](#一寄件人获取双通道--降级)
- [二、收件人获取（三分支 + 双通道）](#二收件人获取三分支--双通道)
- [三、物品信息](#三物品信息)
- [四、地址解析与快递查询](#四地址解析与快递查询)
- [五、完整下单流程总览](#五完整下单流程总览)
- [六、下单成功展示格式](#六下单成功展示格式)
- [七、物流查询（双通道）](#七物流查询双通道)
- [八、取消订单](#八取消订单)
- [九、异常降级矩阵](#九异常降级矩阵)
- [十、接口调用策略](#十接口调用策略)
- [十一、完整数据字段](#十一完整数据字段)

---

## 前置检查

调用任何接口前，必须确认 API Key 已配置：

```bash
echo $KUAIDI100_USER_API_KEY  # Linux/macOS
echo %KUAIDI100_USER_API_KEY%  # Windows CMD
$env:KUAIDI100_USER_API_KEY    # Windows PowerShell
```

未设置未设置时提示用户：需先打开微信 → 搜索「快递100」小程序 → 进入「我的」→ 点击「API KEY」→ 点击「申请」获取 API KEY，然后设置到环境变量 `KUAIDI100_USER_API_KEY`。

---

## 运行模式对比

| 功能 | 无Key模式 | 完整模式 |
|------|-----------|----------|
| 地址解析 | ✅ | ✅ |
| 重量查询 | ✅ | ✅ |
| 快递比价 | ✅ | ✅ |
| **寄件人获取** | **本地缓存 → 手动** | **服务端 → 本地 → 手动** |
| **收件人获取** | **本地模糊匹配** | **服务端地址簿 → 本地** |
| 预下单 | ✅ | ✅ |
| 物流查询 | ❌ 仅本地 | ✅ 本地+服务端 |
| 订单管理 | ❌ 仅本地 | ✅ 本地+服务端 |
| 取消订单 | ❌ | ✅ |

---

## 决策逻辑（自动 vs 询问用户）

### 分步交互（最重要）

寄件流程是**多轮对话**，不是一次表单。严格遵守：

- **每轮只问一件事**：等用户回答后再进入下一步
- **禁止一次性列出所有问题**：不要说"请提供寄件人姓名、电话、地址，收件人姓名、电话、地址，物品名称……"
- **服务端自动填充的步骤可以跳过询问**：如默认寄件人已获取，直接展示确认即可
- **每步之间可以静默调用 API**：查地址簿、查重量、查价格等对用户透明，用户只看到"请告诉我收件人"这样的单一问题

正确的交互节奏：
```
你: 请问要寄给谁？（如果寄件人已自动获取，同时展示寄件人信息让用户确认）
用户: 寄给张三，北京朝阳区
你: [调用 queryReceiverByName → 命中] 找到张三的地址，电话 139xxxx，地址北京朝阳区XX号，对吗？
用户: 对的
你: 要寄什么物品？
用户: 手机
你: [调用 queryItemWeight → 0.5kg] 手机参考重量 0.5kg，没问题的话继续？
用户: 可以
你: [查询快递公司] 以下快递可选：1. 顺丰 18元 2. 中通 12元 3. 圆通 10元，选哪个？
...
```

### 可自动执行（无需询问）

| 场景 | 决策 | 接口 |
|------|------|------|
| 寄件人（完整模式） | 优先 `queryDefaultSender`，成功则自动填充 | 服务端 |
| 寄件人（无Key模式） | `load_default_sender()`，有则自动填充 | 本地 |
| 收件人（完整模式） | 调用 `queryReceiverByName` 模糊匹配，命中则自动填充 | 服务端 |
| 收件人（无Key模式） | 调用 `find_receiver_by_name()` 本地匹配，命中则自动填充 | 本地 |
| 物品重量 | 调用 `queryItemWeight` 推荐参考值，用户可改 | 服务端 |
| 快递公司 | 默认推荐最便宜的，用户可换 | 服务端 |
| 本地有历史收件人 | 作为服务端查询的补充 | 本地缓存 |

### 必须询问用户

| 场景 | 询问内容 |
|------|----------|
| 服务端和本地都无寄件人 | 完整寄件人信息（姓名、手机、地址） |
| 物品类型 | 必须用户提供 |
| 收件人地址簿无匹配 | 完整收件人信息 |
| 快递选择 | 确认或更换 |
| 最终下单 | 确认所有信息后才能提交 |

### 绝不自动执行

- 不猜测用户想寄什么
- 不自动选择收件人（地址簿匹配后必须用户确认）
- 不跳过最终确认直接下单

---

## 一、寄件人获取（双通道 + 降级）

### 完整模式（有Key）

采用 **服务端优先、本地兜底、手动最终降级** 的三级策略：

```
Level 1: queryDefaultSender (服务端)
    ↓ 成功 → 直接使用，跳过询问
    ↓ 失败(404/异常)
Level 2: data_manager.load_default_sender() (本地缓存)
    ↓ 有数据 → 展示给用户确认
    ↓ 无数据
Level 3: 手动询问
    → 询问姓名、手机号、详细地址
    → 保存到本地缓存供下次使用
```

### 无Key模式（无Key）

采用 **本地优先、手动降级** 的两级策略：

```
Level 1: data_manager.load_default_sender() (本地缓存)
    ↓ 有数据 → 展示给用户确认
    ↓ 无数据
Level 2: 手动询问
    → 询问姓名、手机号、详细地址
    → 保存到本地缓存供下次使用
```

**注意**：地址簿返回的字段名为 `mobile`（手机号）和 `addr`（详细地址），传给下单接口时需映射为 `phone` 和 `address`。

---

## 二、收件人获取（三分支 + 双通道）

根据用户提供的信息量，走不同的处理分支：

### 分支 A：用户仅提供收件人姓名

> 例："寄给张三"、"帮我寄个东西给李四"

**完整模式：**
```
1. queryReceiverByName(姓名) → 服务端地址簿查询
2. data_manager.load_recent_receivers() → 本地历史查询
3. 合并去重（以手机号或姓名+地址判断重复）
4. 命中?
   ├── 1条 → 直接展示，让用户确认
   ├── 多条 → 列表展示，让用户选择
   └── 0条 → 走分支 C
```

**无Key模式：**
```
1. data_manager.find_receiver_by_name(姓名) → 本地历史模糊匹配
2. 命中?
   ├── 1条 → 直接展示，让用户确认
   ├── 多条 → 列表展示，让用户选择
   └── 0条 → 走分支 C
```

### 分支 B：用户提供姓名 + 部分地址信息

> 例："寄给张三，北京朝阳区"、"寄给李四，电话139xxxx"

**完整模式：**
```
1. queryReceiverByName(姓名) → 尝试匹配验证
2. 命中?
   ├── 是 → 用服务端数据补全缺失字段，展示确认
   └── 否 → 用用户提供的信息 + 地址解析补全，走分支 C
```

**无Key模式：**
```
1. find_receiver_by_name(姓名) → 尝试本地匹配
2. 命中?
   ├── 是 → 用本地数据补全缺失字段，展示确认
   └── 否 → 用用户提供的信息 + 地址解析补全，走分支 C
```

### 分支 C：用户提供完整地址 / 无任何匹配

> 例："寄到北京市朝阳区三里屯XX号"、"第一次寄，收件人是..."

```
1. 走原有流程：询问完整收件人信息
   - 姓名（必填）
   - 手机号（必填）
   - 详细地址（必填，自由文本）
2. addressComplete(地址) → 解析为省市区 + subArea
3. 保存到本地缓存 data_manager.save_receiver()
```

---

## 三、物品信息

```
用户输入物品名 → queryItemWeight(物品名) → 返回参考重量
    ↓
展示参考重量给用户 → 用户确认或修改
```

未识别的物品名时，询问用户手动输入重量。

---

## 四、地址解析与快递查询

### 地址字段映射

服务端地址簿接口（queryDefaultSender / queryReceiverByName）返回的 DTO 字段名与下单接口参数名不一致，需要映射：

| 地址簿 DTO 字段 | 下单接口参数 | 说明 |
|----------------|------------|------|
| `mobile` | `phone` | 手机号 |
| `addr` | `address` | 详细地址 |

其余字段（`name`/`province`/`city`/`district`）名称一致。

### 地址解析

`addressComplete` 将自由文本地址解析为结构化地址：

| 返回字段 | 说明 |
|---------|------|
| `province` | 省份 |
| `city` | 城市 |
| `district` | 区县 |
| `subArea` | 详细地址（不含省市区） |
| `addressForModel` | 组合完整地址 |

**注意**：`addressComplete` 不返回 `address`（对应的是 `subArea`）。

### 快递公司字段映射

查询快递公司返回的字段名与下单接口参数名不一致：

| queryShippingCompanies 字段 | 下单接口参数 | 说明 |
|---------------------------|------------|------|
| `name` | `kuaidiName` | 快递公司名称 |
| `com` | `kuaidiCom` | 快递公司编码 |
| `sign` | `companySign` | 签名标识（下单必传） |
| `totalprice` | `estimatedAmount` | 运费 |

### 物品重量注意

`queryItemWeight` 返回的 `spec_weight` 是字符串类型，使用时需 `float()` 转换。

### 调用顺序

```
1. 确定寄件人和收件人（省市区已就绪）
2. 调用地址解析按需结构化（用户自由文本 → addressComplete）
3. queryShippingCompanies(senderCity, receiverCity, weight) → 快递列表
4. 展示快递列表（按 totalprice 升序）→ 用户选择
5. 映射字段：name→kuaidiName, com→kuaidiCom, sign→companySign, totalprice→estimatedAmount
```

---

## 五、完整下单流程总览

### 无Key模式

```
1. [本地] 获取寄件人
   data_manager.load_default_sender() → 手动询问 → 保存本地
       |
       v
2. [本地] 获取收件人
   find_receiver_by_name() → 手动输入 → 保存本地
       |
       v
3. [服务端] 物品信息
   用户输入 → queryItemWeight → 确认重量
       |
       v
4. [服务端] 地址解析
   addressComplete 结构化地址
       |
       v
5. [服务端] 查询快递公司
   queryShippingCompanies → 展示列表 → 用户选择
       |
       v
6. [服务端] 确认下单
   展示完整订单信息 → 用户确认 → collectShipmentOrderInfo
       |
       v
7. [本地] 保存订单
   data_manager.save_order() → 本地缓存
       |
       v
8. [展示] 展示结果
   下单链接 + 二维码 + 订单号
```

### 完整模式

```
1. [服务端/本地] 获取寄件人
   queryDefaultSender → 本地缓存 → 手动询问
       |
       v
2. [服务端/本地] 获取收件人
   queryReceiverByName / find_receiver_by_name → 手动输入
       |
       v
3. [服务端] 物品信息
   用户输入 → queryItemWeight → 确认重量
       |
       v
4. [服务端] 地址解析
   addressComplete 结构化地址
       |
       v
5. [服务端] 查询快递公司
   queryShippingCompanies → 展示列表 → 用户选择
       |
       v
6. [服务端] 确认下单
   展示完整订单信息 → 用户确认 → collectShipmentOrderInfo
       |
       v
7. [本地] 保存订单
   data_manager.save_order() → 本地缓存
       |
       v
8. [展示] 展示结果
   下单链接 + 二维码 + 订单号
       |
       v
9. [服务端/本地] 物流查询（双通道）
   queryUserOrders + load_recent_orders
```

---

## 六、下单成功展示格式

下单接口返回嵌套结构，需从正确路径提取数据：

```
data.orderInfo.orderNo       → 订单号
data.orderInfo.status        → 订单状态
data.orderInfo.createTime    → 下单时间
data.url                     → 微信小程序链接（用于自动打开）
data.qrCode                  → 二维码链接（用于扫码下单）
data.markdownInfo            → Markdown 格式信息（可直接展示给用户）
```

**展示方式**：文本展示为必选项，浏览器打开为可选项。无论浏览器打开是否成功，用户都能通过文本信息完成下单：

1. **链接展示**（必须）：提供 `data.url` 纯文本链接，确保用户可直接复制或点击 
2. **二维码展示**（必须）：展示 `data.qrCode` 二维码图片 
3.  **自动打开**（可选）：用浏览器工具自动打开 `data.url`，仅作为便捷补充

**核心原则**：先完成文本展示（链接+二维码），确认用户能看到后再选择性地调用浏览器打开。浏览器打开失败时不得影响已展示的链接信息。

---

## 七、物流查询（双通道）

### 无Key模式

```
用户要查物流?
└── 仅查询本地 load_recent_orders()
    └── 展示本地订单列表
```

### 完整模式

```
用户要查物流?
├── 有运单号 → 直接 trackShipment
└── 无运单号 → 双通道查订单
    ├── data_manager.load_recent_orders() → 本地订单列表
    ├── queryUserOrders() → 服务端订单列表
    ├── 合并去重展示
    └── 用户选择 → trackShipment
```

---

## 八、取消订单

### 无Key模式

❌ 不支持，提示用户获取API Key

### 完整模式

```
1. 确认用户要取消的订单号（可从本地或服务端订单列表中选择）
2. 询问取消原因
3. 调用 cancelOrder
4. 成功后从本地缓存标记状态（如有）
```

---

## 九、异常降级矩阵

| 接口 | 异常场景 | 无Key模式降级 | 完整模式降级 |
|------|---------|--------------|-------------|
| queryDefaultSender | 401/404 / 网络错误 | ❌ 无此接口 | 查本地缓存 → 手动询问 |
| queryReceiverByName | 401/404 / 空列表 / 网络错误 | ❌ 无此接口 | 查本地缓存 → 手动输入 |
| find_receiver_by_name | 本地无匹配 | 手动输入 | 服务端查询 → 手动输入 |
| load_default_sender | 本地无数据 | 手动询问 | 服务端查询 → 手动询问 |
| queryItemWeight | 404 / 未识别 | 询问用户手动输入重量 | 询问用户手动输入重量 |
| addressComplete | 404 / 解析失败 | 提示用户检查地址 | 提示用户检查地址 |
| queryShippingCompanies | 404 / 空列表 | 提示暂无可用快递 | 提示暂无可用快递 |
| collectShipmentOrderInfo | 400 参数错误 | 检查必填字段，提示补充 | 检查必填字段，提示补充 |

**原则**：服务端接口失败时，绝不中断流程，始终有本地或手动降级路径。

---

## 十、接口调用策略

### 双通道查询优先级

| 场景 | 优先级1（服务端） | 优先级2（本地） | 降级 |
|------|-----------------|----------------|------|
| 获取寄件人（完整模式） | `queryDefaultSender` | `load_default_sender()` | 手动询问 |
| 获取寄件人（无Key模式） | ❌ | `load_default_sender()` | 手动询问 |
| 查找收件人（完整模式） | `queryReceiverByName` | `find_receiver_by_name()` | 手动输入 |
| 查找收件人（无Key模式） | ❌ | `find_receiver_by_name()` | 手动输入 |
| 查找订单（完整模式） | `queryUserOrders` | `load_recent_orders()` | 提示无记录 |
| 查找订单（无Key模式） | ❌ | `load_recent_orders()` | 提示无记录 |

### 单次寄件 API 调用次数

| 步骤 | 接口 | 调用次数 |
|------|------|---------|
| 获取寄件人 | queryDefaultSender / load_default_sender | 0-1 |
| 获取收件人 | queryReceiverByName / find_receiver_by_name | 0-1 |
| 查物品重量 | queryItemWeight | 1 |
| 地址解析 | addressComplete | 0-2 |
| 查快递公司 | queryShippingCompanies | 1 |
| 提交订单 | collectShipmentOrderInfo | 1 |
| **合计** | | **4-7 次** |

频率限制：每分钟 10 次 / 每天 100 次，单次寄件流程留有充足余量。

---

## 十一、完整数据字段

### 地址簿信息（AddressBookDTO — 来自 queryDefaultSender / queryReceiverByName）

- id - 地址ID
- name - 姓名
- mobile - 手机号（下单时映射为 `phone`）
- province - 省份
- city - 城市
- district - 区县
- addr - 详细地址（下单时映射为 `address`）
- tel - 座机电话
- latitude - 纬度
- longitude - 经度
- xzqName - 行政区名称

### 快递公司信息（FreightInfoV3 — 来自 queryShippingCompanies）

- name - 快递公司名称（下单时映射为 `kuaidiName`）
- com - 快递公司编码（下单时映射为 `kuaidiCom`）
- sign - 签名标识（下单时映射为 `companySign`，下单必传）
- totalprice - 总运费（下单时映射为 `estimatedAmount`）
- arriveTipsDate - 预计送达时间
- priceInfo - 价格信息字符串（如"18元，1-2天"）
- logo - 快递公司 logo URL
- firstPrice - 首重价格
- overPricePerKg - 续重价格

### 地址解析结果（AddressCompleteResult — 来自 addressComplete）

- resultCode - 是否成功
- message - 解析结果消息
- province - 省份
- city - 城市
- district - 区县
- subArea - 详细地址（不含省市区）
- addressForModel - 组合完整地址

### 物品重量（CargoItemDTO — 来自 queryItemWeight）

- original_name - 原始物品名称
- item_name - 物品展示名称
- spec_weight - 标准重量（**字符串**，需 float() 转换）
- category - 物品分类
- restriction_level - 限制级别
- package_volume - 包装体积
- label_express_delivery - 快递标签
- auditor - 审核人
- audit_status - 审核状态
- selected_count - 选择次数

### 下单返回（ShipmentOrderResult — 来自 collectShipmentOrderInfo）

- orderInfo.orderNo - 订单编号
- orderInfo.status - 订单状态
- orderInfo.createTime - 下单时间
- orderInfo.itemName - 物品名称
- orderInfo.kuaidiName - 快递公司名称
- url - 微信小程序链接
- qrCode - 二维码链接
- markdownInfo - Markdown 格式订单信息
