# VPS 部署

应用与浏览器两个容器分开运行，只有任务工作区共享。应用密钥、SQLite、会话与成果不挂载到浏览器容器。容器使用非 root 用户，CDP 与浏览器服务不映射公网端口。浏览器 seccomp 采用 Playwright 官方配置，在 Docker 基础策略上允许 Chromium 用户命名空间 sandbox。

1. Node 24 运行 `npm ci`、`npm run typecheck`、`npm test`、`npm run build`。
2. `node --import tsx scripts/prepare-deployment.ts` 创建忽略的 `.runtime/deployment.env`；上传为 VPS 项目目录的 `.env`，权限 600。后续更新不得覆盖已有生产 `.env`。
3. 源码上传到 `/opt/personal-agent`。创建 `state/app`、`state/browser`、`state/workspaces`，由 UID 1000 持有；浏览器 profile 独立保留。
4. 在项目目录执行 `docker compose --env-file .env -f deploy/compose.yaml up -d --build`。
5. `deploy/nginx.conf` 为本次 VPS 的独立 8443 HTTPS 入口。使用这台 VPS 已有、涵盖该 IP 的证书；其他机器需配置自己的证书路径和 PUBLIC_ORIGIN。
6. 检查健康、认证、浏览器启动与画面、人控中文输入、重启持久化。完成真实模型配置和微信扫码后，再做账号联调。

备份包含 `.env`、`state/app` 与 `state/browser`、`state/workspaces`。SQLite 在线备份使用 DatabaseSync backup 或数据库停写后拷贝，不能只拷贝活动 WAL 数据库主文件。恢复时必须保留原加密 key；否则已保存的连接配置无法解密。

证书有效期和续期由 VPS 现有证书服务维护，部署时核查证书 SAN、有效期及续期任务。没有覆盖或重新启动已有业务容器。不要暴露 3420、3101、CDP 端口到公网。

生产批准和重启恢复沿应用契约执行；自动化部署不代表第三方账号、票务、付款或订单已完成联调。

## 当前实例

工作台为 [https://39.107.111.115:8443](https://39.107.111.115:8443)，代码目录 `/opt/personal-agent`。应用仅发布 VPS loopback 3420；浏览器 3101 和 CDP 均在内部网络。现有业务与端口使用独立配置保留。

2026-10-03 已在实际 app 容器验证 Open-Meteo 城市/天气和 Frankfurter 汇率查询成功。本地与 VPS 已通过工作台接入 `https://api.jane-zz.online/v1` 的 `gpt-6-sol`，真实模型连接与 VPS 日历/成果文件工具循环通过。模型凭据由配置数据库加密保存，不写入生产 `.env`，更新配置无需重启。国内站点的 DNS/TLS 可达不等于已获业务权限；微信及国内收费 API 仍需真实账号联调。

同日完成中转 PNG 图片识别补测：随机数字和红/绿/蓝色块顺序仅存在于图片中，Pi 真实模型请求首轮准确识别。通过后，两端实际配置启用 `images=true`，不需要重启容器；`reasoning=false` 保持关闭，推理参数仍未联调。新部署默认图像开关为关闭，应按该实例使用的中转实测后启用。本轮场景与最终凭据检查见 [全量功能测试报告](../docs/full-functional-test-report.md)。

HTTPS 使用现有 `airmirror-signaling-ip` 短期 IP 证书，当前到期为北京时间 2026-10-07 03:25。已核查 `airmirror-ip-cert-renew.timer` 启用并每 12 小时检查，最近执行成功；9 月 30 日有实际续期与证书归档，含 Nginx reload hook。保留其 80 端口、webroot 与原续期服务。

Docker 构建在 `npm ci` 前复制依赖补丁脚本，安装后验证 Pi 实际加载的 `brace-expansion@5.0.12`；构建上下文排除运行数据、凭据与部署包。更新时保留 `.env`、全部 `state/` 和 Chromium profile，等待健康检查后再核验认证与交互。

浏览器容器使用固定主机名 `personal-agent-browser`，停止宽限为 30 秒。关闭自己启动的 Chromium 时优先通过 CDP `Browser.close` 正常退出，超时才终止该子进程；确认退出后才释放自己的 SDK 和原生锁，不删除 profile 或 cookie。

SDK 锁记录主机、启动身份和 Linux boot/PID namespace。只在同一运行环境内确认原进程已退出或 PID 已复用后恢复；无法核实的旧主机、旧 namespace、损坏记录及只有原生锁的情况保守拒绝启动。容器被强杀后若留下跨 namespace 的锁，需要在宿主机先确认原容器与 Chromium 已退出，再仅处理对应旧锁；不能以新容器内没有 Chrome 为依据清空 profile。正常停止、重建和重启由优雅关闭流程避免这种迁移锁。

本次测试结果与尚需账号联调的项目见 [验收记录](../docs/verification-report.md)。
