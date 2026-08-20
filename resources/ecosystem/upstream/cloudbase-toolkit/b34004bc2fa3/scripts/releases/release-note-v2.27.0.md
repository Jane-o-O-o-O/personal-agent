# CloudBase MCP v2.27.0

## 🎉 新功能

### 工具能力调整
- 移除报错率高达 79% 的 `downloadRemoteFile` 工具，远程资源下载改为引导使用 shell 命令（`curl` / `Invoke-WebRequest`），同时更新了 `ui-design` 等 Skill 的配套指引（#908、#909）

### 小程序 Skills
- `miniprogram-development` Skill 纳入小程序 SEO / 搜索优化指南，覆盖微信搜索收录、页面索引（`mpcrawler`）等场景（#906）

### 云托管 / 网关
- 云托管统一走 tcbr 新逻辑：`manageCloudRun` 部署前自动做初始化检查，`callCloudApi` 侧禁用旧 tcb 云托管接口，并补充单环境查询指引（`DescribeEnvBaseInfo`）
- 网关支持路由级启用 / 禁用，并在返回访问地址前识别已禁用的默认域名路由
- 托管部署时 `accessUrl` 为空将跳过部署通知，避免误报

## 🐛 问题修复

- 应用部署打包排除 `target/.next` 等大目录，防止超大 zip 打爆磁盘（#909）
- 清理云托管相关未使用变量与冗余导入，README 托管模式表述去国际化措辞

## 📚 文档与体验

- 简化快速开始并外置图片，降低 README 体积（#905）
- CLI 新增 `--cloudbase-api-key` 环境登录说明，与现有 API Key 命名对齐（#900）
- 补充 MCP 工具缺失时 CLI 回退指引、CodeBuddy 插件市场安装指南

## 🔧 维护与工程改进（可选阅读）

- 移除 `downloadRemoteFile` 遗留集成测试，修复 pkg.pr.new CI 失败（#909）
- 加固 ClawHub 发布「版本已存在」幂等路径测试
- 同步 skill 版本元数据至 2.27.0
