# qqbot 插件升级指南

如果你之前安装过 qqbot 插件，但不熟悉 `openclaw plugins` 升级命令或 `npm` 操作，建议优先使用项目内置脚本。

## 方式一：推荐（脚本升级）

### 1) 通过 npm 包升级（最省事，二选一）

**方式 A：直连下载后执行（无需 clone 仓库）**

```bash
curl -fsSL https://raw.githubusercontent.com/tencent-connect/openclaw-qqbot/main/scripts/upgrade-via-npm.sh -o /tmp/upgrade-via-npm.sh
bash /tmp/upgrade-via-npm.sh
# 或：bash /tmp/upgrade-via-npm.sh --version <version>
```

**方式 B：在本地仓库内执行脚本**

```bash
# 升级到 latest
bash ./scripts/upgrade-via-npm.sh

# 指定版本
bash ./scripts/upgrade-via-npm.sh --version <version>
```

> 不传 `--version` 时，默认使用 `latest`。

### 2) 通过源码一键升级并重启

> 注意：该脚本必须在当前仓库内执行（通过 `openclaw plugins install .` 安装本地源码）。

```bash
# 已有配置时可直接执行
bash ./scripts/upgrade-via-source.sh

# 首次安装/首次配置（必须提供 appid 和 secret）
bash ./scripts/upgrade-via-source.sh --appid your_appid --secret your_secret
```

> 注意：首次安装必须设置 `appid` 和 `secret`（或设置环境变量 `QQBOT_APPID` / `QQBOT_SECRET`）；后续升级如已有配置可直接执行 `bash ./scripts/upgrade-via-source.sh`。

---

## 方式二：手动升级（适合熟悉 openclaw / npm 的用户）

### A. 直接从 npm 安装最新版本

```bash
# 可选：先卸载旧插件（按实际安装情况执行）
# 可先执行 `openclaw plugins list` 查看已安装插件 ID
# 常见历史插件 ID：qqbot / openclaw-qqbot
# 对应 npm 包：@sliverp/qqbot / @tencent-connect/openclaw-qqbot
openclaw plugins uninstall qqbot
openclaw plugins uninstall openclaw-qqbot

# 如果你还安装过其它 qqbot 相关插件，也请一并 uninstall
# openclaw plugins uninstall <其它插件ID>

# 安装最新版本
openclaw plugins install @tencent-connect/openclaw-qqbot@latest

# 或安装指定版本
openclaw plugins install @tencent-connect/openclaw-qqbot@<version>
```

### B. 从源码目录安装

```bash
cd /path/to/openclaw-qqbot
npm install --omit=dev
openclaw plugins install .
```

### C. 配置通道（首次安装必做）

```bash
openclaw channels add --channel qqbot --token "appid:appsecret"
```

### D. 重启网关

```bash
openclaw gateway restart
```

### E. 验证

```bash
openclaw plugins list
openclaw channels list
openclaw logs --follow
```
