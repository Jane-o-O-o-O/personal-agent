## 常见问题（FAQ）

以下为常见问题与解决方案，附加补充说明便于定位原因与快速处理。

### 无法连接到飞书/Lark API

解决方案：
- 检查本地网络连接、代理设置。
- 核对 `APP_ID`、`APP_SECRET` 是否填写正确。
- 测试是否能正常访问开放平台 API 域名（如 `https://open.feishu.cn` 或 `https://open.larksuite.com`）。

### 使用 user_access_token 报错

解决方案：
- 检查 token 是否过期（通常 2 小时有效）。
- 建议优先使用 `login` 获取并保存用户令牌。
- 若在服务器/CI 环境使用，确保安全管理令牌并妥善刷新。

### 启动 MCP 服务后调用某些 API 提示权限不足

解决方案：
- 在开发者后台为应用开通对应 API 权限，并等待审批通过。
- 以用户身份调用（需要 `user_access_token`）的场景，确认授权范围（`scope`）是否包含对应权限。如果授权范围不足，需要重新登录。

### 图片或文件上传/下载相关 API 失败

解决方案：
- 当前版本暂不支持文件/图片上传下载，相关能力将于后续版本支持。

### Windows 终端显示乱码

解决方案：
- 在命令提示符中执行 `chcp 65001` 切换为 UTF-8。
- PowerShell 用户可调整字体或相关终端设置以提升兼容性。

### 安装时遇到权限错误

解决方案：
- macOS/Linux：使用 `sudo npm install -g @larksuiteoapi/lark-mcp` 或调整 npm 全局路径权限。
- Windows：尝试以管理员身份运行命令提示符。

### 启动 MCP 服务后提示 token 超过上限

解决方案：
- 使用 `-t`（或在 MCP 配置中 `args` 的 `-t`）减少启用的 API 数量。
- 使用支持更大上下文长度的模型。

### SSE/Streamable 模式下无法连接或接收消息

解决方案：
- 检查端口占用情况，必要时更换端口。
- 确保客户端正确连接到对应端点并能处理事件流。

### Linux 环境启动报错 [StorageManager] Failed to initialize: xxx

说明：
- 不影响“手动传入 `user_access_token`”或“不使用 `user_access_token`”的场景。

原因：`StorageManager` 使用 keytar 对 `user_access_token` 做加密存储。

解决方案：
- 安装 `libsecret` 依赖：
  - Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
  - Red Hat-based: `sudo yum install libsecret-devel`
  - Arch Linux: `sudo pacman -S libsecret`


