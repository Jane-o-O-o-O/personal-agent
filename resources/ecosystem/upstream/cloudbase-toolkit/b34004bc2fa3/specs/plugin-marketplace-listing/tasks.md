# 实施计划

- [x] 1. 建立市场矩阵真源 `markets.yaml`
  - 按 requirements A–E 写入全部市场条目
  - 填初判 `listing_statuses`、evidence、Trae 四通道拆分
  - 覆盖 WorkBuddy/ZCode listed，Claude/Codex self-marketplace + OPS
  - _需求: 1, 3

- [x] 2. 实现矩阵加载与 schema 校验库
  - `scripts/lib/plugin-marketplace-matrix.mjs`
  - 必填字段、枚举、唯一 id、stale 计算
  - _需求: 1, 5

- [x] 3. 实现本地证据检查与优先级分类
  - `scripts/lib/plugin-marketplace-evidence.mjs`
  - `scripts/lib/plugin-marketplace-report.mjs`
  - _需求: 2, 4

- [x] 4. 实现 CLI 入口并挂 package.json 脚本
  - `scripts/analyze-plugin-marketplace.mjs`
  - 支持 `--matrix` / `--out` / `--strict` / `--online`
  - 生成 `reports/latest.md` + `latest.json`
  - _需求: 2, 4

- [x] 5. 补充测试与维护说明
  - `tests/plugin-marketplace-listing.test.js`
  - `specs/plugin-marketplace-listing/README.md`
  - 跑一遍离线分析并提交示例报告
  - _需求: 5

- [x] 6. 验收
  - 离线模式成功生成报告
  - 严格模式对故意坏矩阵失败
  - 报告含 ready_to_submit / packaging / outreach / listed 分组
  - _需求: 2, 4, 5
