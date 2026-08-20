# CloudBase MCP v2.28.1

## 🐛 问题修复

### 云托管
- 创建云托管环境时将 `CreateCloudRunEnv` 的 `EnvType` 设为 `baas`，与当前平台契约对齐，避免创建失败

### 云函数
- 当云函数处于 `Updating` 状态时，改为有界等待后再继续，而不是立刻失败
- 修正 `waitUntilFunctionActive` 的状态类型，避免把平台返回的字符串状态误判

## 🔧 维护与工程改进（可选阅读）

- Skills / guideline `version` 元数据同步至 2.28.1
