# `--json` 正文未转义引号经候选式修复后进入 dry-run 预演

- **场景**：`--json` 请求体的 `id` 字符串值含三组未转义 ASCII 双引号（LLM 高频出错形态），
  修复后 `--dry-run` 正常输出预演信息，不发起实际请求
- **Transport**：HTTP（wiremock）
- **来源**：未转义引号修复原型的同类形态。e2e discovery mock 只提供
  hr / department list（schema 声明 `id` 字段），故用 `id` 承载未转义引号正文，
  而非原型的 message send `text_content.text`；schema 排序路径一致

## 测试等级

**P2**（用户可见链路：未转义引号修复 + dry-run）
- **条件**：`--json` 的 `id` 值含未转义引号，CLI 传 `--dry-run`
- **断言**：`run` 返回 `Ok`，stdout 含 `=== Dry Run ===` 且正文引号以转义形态保留

## 前置条件

- wiremock 挂载标准 discovery mock（hr / department list）
- `/department/list` 端点 mock 设置 `expect(0)`，确保 dry-run 不发起实际调用

## 调用方式

```rust
client.run(vec!["wecom", "hr", "department", "list", "--dry-run", "--json",
    r#"{"id":"跟进"25年12月后上线"的"系统单量进度""}"#])
    .output(output)
    .await
```

## 断言

- `run` 返回 `Ok`
- stdout 包含 `=== Dry Run ===`
- stdout 包含修复后的正文 `跟进\"25年12月后上线\"的\"系统单量进度\"`（引号已转义）
- `/department/list` 未被调用（`expect(0)` 保证）

## 关键上下文

- `service/command/json_repair/`（mod.rs 编排 + enumerate.rs 搜索 + scoring.rs 打分）：候选式修复（引号修复候选 vs jsonrepair 候选统一打分，
  strategy 为 `unescaped_quotes`）
- `service/handler.rs`：`args.dry_run == Some(true)` 时输出预演信息并提前返回
