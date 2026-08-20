# openclaw 常用指令手册

本文档整理了 `openclaw` 的常用命令，方便日常使用和维护。

---

## 📦 插件管理

### 安装插件
```bash
# 从当前目录安装插件
openclaw plugins install .

# 从指定路径安装
openclaw plugins install /path/to/plugin
```

### 禁用/启用插件
```bash
# 禁用指定插件
openclaw plugins disable qqbot

# 启用指定插件
openclaw plugins enable qqbot
```

### 查看已安装插件
```bash
openclaw plugins list
```

---

## 📺 通道管理

### 配置 qqbot 通道
```bash
# qqbot 是自定义插件，通过 config set 配置（不是 channels add）
openclaw config set channels.qqbot.appId "你的appid"
openclaw config set channels.qqbot.clientSecret "你的appsecret"
openclaw config set channels.qqbot.enabled true
```

> **注意**：`openclaw channels add --channel` 仅支持内置通道（telegram、discord 等）。
> qqbot 作为自定义插件，需通过 `config set` 或直接编辑 `~/.openclaw/openclaw.json` 配置。

### 禁用通道
```bash
openclaw config set channels.qqbot.enabled false
```

### 查看通道列表
```bash
openclaw channels list
```

---

## 🚀 网关控制

### 启动网关
```bash
# 普通启动
openclaw gateway

# 详细模式启动（显示更多日志）
openclaw gateway --verbose
```

### 重启网关
```bash
openclaw gateway restart
```

### 停止网关
```bash
openclaw gateway stop
```

---

## 📋 日志查看

### 查看实时日志
```bash
# 跟踪模式（实时刷新）
openclaw logs --follow

# 普通查看
openclaw logs
```

### 查看指定行数
```bash
# 查看最近 100 行日志
openclaw logs --limit 100
```

### 其他日志选项
```bash
# JSON 格式输出
openclaw logs --json

# 纯文本输出（无颜色）
openclaw logs --plain
```

---

## ⚙️ 配置管理

### 设置配置项
```bash
# 启用 markdown 消息格式
openclaw config set channels.qqbot.markdownSupport true

# 禁用 markdown 消息格式
openclaw config set channels.qqbot.markdownSupport false
```

### 获取配置项
```bash
# 查看某个配置项的值
openclaw config get channels.qqbot.markdownSupport
```

### 查看所有配置
```bash
openclaw config
```

---

## 🛠️ 项目脚本

项目中提供了一些便捷脚本，简化日常操作：

### 一键升级并启动
```bash
# 基本用法
./scripts/upgrade-via-source.sh

# 指定 appid 和 secret
./scripts/upgrade-via-source.sh --appid 123456789 --secret your_secret

# 同时启用 markdown
./scripts/upgrade-via-source.sh --appid 123456789 --secret your_secret --markdown yes

# 查看帮助
./scripts/upgrade-via-source.sh --help
```

**环境变量方式：**
```bash
export QQBOT_APPID="123456789"
export QQBOT_SECRET="your_secret"
export QQBOT_MARKDOWN="no"
./scripts/upgrade-via-source.sh
```

### markdown 设置脚本
```bash
# 启用 markdown
./scripts/set-markdown.sh enable

# 禁用 markdown
./scripts/set-markdown.sh disable

# 查看当前状态
./scripts/set-markdown.sh status

# 交互式选择
./scripts/set-markdown.sh
```

### 升级脚本（清理旧版本）
```bash
# 清理旧版本插件和配置
bash ./scripts/cleanup-legacy-plugins.sh
```

---

## 📁 常用路径

| 路径 | 说明 |
|------|------|
| `~/.openclaw/` | openclaw 主目录 |
| `~/.openclaw/openclaw.json` | 全局配置文件 |
| `~/.openclaw/extensions/` | 插件安装目录 |
| `~/.openclaw/extensions/qqbot/` | qqbot 插件目录 |

---

## 🔧 故障排查

### 查看详细日志
```bash
openclaw logs --follow
```

### 检查插件状态
```bash
openclaw plugins list
```

### 检查通道配置
```bash
openclaw channels list
```

### 重新安装插件
```bash
# 1. 清理旧版本
bash ./scripts/cleanup-legacy-plugins.sh

# 2. 重新安装
openclaw plugins install .

# 3. 重新配置通道
openclaw config set channels.qqbot.appId "你的appid"
openclaw config set channels.qqbot.clientSecret "你的appsecret"
openclaw config set channels.qqbot.enabled true
```

---

## ⚠️ 注意事项

1. **不要使用 sudo 运行脚本**：会导致配置文件权限问题
2. **markdown 功能需要权限**：启用前需在 QQ 开放平台申请 markdown 消息权限

---

## 📚 更多帮助

```bash
# 查看 openclaw 帮助
openclaw --help

# 查看子命令帮助
openclaw plugins --help
openclaw channels --help
openclaw gateway --help
openclaw config --help
openclaw logs --help
```
