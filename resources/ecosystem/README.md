# 个人 Agent 生态开发资源库

本目录以国内生态为主，保存已筛选的 Skills、MCP/CLI/SDK 开放代码、发布包和接口文档，供后续 Pi 开发使用。官方服务、社区项目和国际备用服务分别记录来源与使用条件；下载不会执行安装脚本、登录、创建订单或修改云资源。

## 目录

```text
resources/ecosystem/
  catalog-parts/     资源来源、下载方式、Pi 接法和账号条件
  sources.lock.json  实际提交/版本、下载 SHA-256、文件校验清单
  INDEX.md          本地资源入口与接入限制
  upstream/         解包后的源码、Skills 和实质接口文档
  downloads/        原始发布包与源码归档（不提交 Git）
```

从 [资源索引](INDEX.md) 找到每项内容。`upstream/<资源 ID>/<提交或内容摘要>/` 保留独立版本快照，避免更新时覆盖已有文件。官方许可证、版权说明与包内脚本保留；不带 `.git`、macOS 杂项和编辑器历史目录。没有公开源码的平台只归档公开接口文档，不将远程服务称为本地源码。

目前合计 78 项开发资产，本轮日常查询新增 31 项；一项服务可以对应多个源码、文档或发布包条目，这个数量不代表独立服务或已启用工具数量。

天气、公共交通、车票与航班、搜索、快递、节假日和汇率等日常查询的选型见 [日常查询接口清单](../../docs/daily-query-apis.md)。社区数据集与非官方服务封装不标为平台官方 API；`reference-only` 条目保留参考，不默认启用。

## 同步与验证

使用 Python 3.12 或更高版本，只依赖标准库；GitCode 等非 GitHub 仓库另外需要 Git。命令从项目根目录执行：

```bash
python3 scripts/sync_ecosystem.py
python3 scripts/sync_ecosystem.py --verify --require-downloads
```

默认使用已有快照，不自动升级。按需更新单个资源：

```bash
python3 scripts/sync_ecosystem.py --id weixin-channel --refresh
```

声明固定 `ref` 或版本 URL 的条目需先修改对应目录清单，才会获取新版本。新快照独立保存，原有快照不删除。内容校验发现本地改动时会报错，避免静默覆盖。

GitCode 的 OpenAPI 正文按官方 sitemap 的 API 路径归档，保留每页 HTML、页面来源清单和 sitemap。钉钉 MCP 实现另存 npm 发布代码，WPS CLI 另存已核对官方校验值的 Linux x86_64 发布包；二者的 GitHub 仓库本身主要提供说明和安装器，不称为完整实现源码。

## 后续开发

先按 [开发范围](../../docs/development-scope.md) 选择资源，在项目代码中开发连接器和渠道适配器。原始 Skills 存在这里作为开发资产；后续只将选定的 Skills 配置到 Pi，并配置它们所需的 CLI、MCP 和真实账号授权。

微信和 QQ 的现成插件依赖 OpenClaw，需要参考源码适配 Pi。瑞幸仍限定自提和用户扫码付款，滴滴先使用沙箱；没有将普通外卖、独立 Agent 支付或尚未落实准入的能力混入资源库。

归档状态不等于业务已启用。发布包有代码不代表完整开发源码；没有明确许可证的资源只记录实际提供的文件，后续复用或分发需遵循上游许可。美团酒旅的外网授权依赖存在缺失，保留参考资料并单独标记，不能当作已验证可在普通 VPS 运行的连接器。
