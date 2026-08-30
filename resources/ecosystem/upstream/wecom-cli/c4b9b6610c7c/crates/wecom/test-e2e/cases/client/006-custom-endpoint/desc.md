# `custom-endpoint` feature: `base_url`

- **场景**：验证 custom-endpoint feature 下自定义 base_url
- **Transport**：HTTP（wiremock）
- **Feature**：`custom-endpoint`

## 测试等级

**P1**（custom-endpoint feature 下自定义 base_url）
- **条件**：启用 custom-endpoint feature，设置 base_url
- **断言**：discovery 请求发往自定义 base_url

## 子测试

| 测试 | 验证 |
|------|------|
| `run_custom_base_url` | `base_url()` 指向自定义 mock，schema list 正常 |
