# HTTP Transport 长任务轮询

- **场景**：验证 HTTP Transport 收到 taskid 后正确进行轮询直到终态
- **Transport**：HTTP（reqwest）

## 测试等级

**P0**（长任务轮询：首请求返回 taskid → 轮询 → done=true → 返回最终结果）
- **条件**：首请求 POST /cgi-bin/export 返回 taskid，轮询 POST /task/query 返回 done=true
- **断言**：最终 into_value() 得到 `{"export_url": "https://example.com/file.csv"}`

## 前置条件

- wiremock 挂载多轮 mock：首响应返回 taskid，后续轮询逐步推进

## 断言

- 轮询正确执行直到 `done=true`
- 终态 result 正确返回
- 轮询间隔和超时配置生效

## 关键上下文

- `polling.rs` + `http/polling.rs`：`poll_long_task` 轮询循环，连续网络错误超过 `MAX_CONSECUTIVE_NETWORK_ERRORS` 时返回最后一个网络错误
