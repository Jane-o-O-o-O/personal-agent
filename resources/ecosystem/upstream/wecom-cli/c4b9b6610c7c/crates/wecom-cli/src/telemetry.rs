//! JSON repair 提示监听：基于统一 telemetry 事件，在 json repair 成功时
//! 向 stderr 输出提示，告知用户请求体曾被自动修复。
//!
//! 注意：`json_repair` 事件仅携带策略与候选数，不含修复前后原文，
//! 故提示不含具体 JSON 内容。

use wecom::telemetry::{ClientEvent, EventExt};
use wecom_transport::telemetry::CaptureScope;

/// `json_repair` 事件 kind（与 `wecom::telemetry::contract::json_repair` 对应）。
const KIND_JSON_REPAIR: &str = "json_repair";
/// 事件 payload 中的 outcome 字段。
const FIELD_OUTCOME: &str = "outcome";
/// outcome = ok_repaired：修复成功。
const OUTCOME_OK_REPAIRED: &str = "ok_repaired";

/// 注册 json repair 成功提示监听。
///
/// 监听挂在给定的 [`CaptureScope`] 上；scope 的 span 需覆盖 CLI 主流程
/// （如 `main` 中 attach 到 root span），`json_repair` 事件才会被捕获。
/// 仅处理 `outcome=ok_repaired` 的事件（修复失败由调用方报错，无需提示），
/// 其余静默忽略。
pub fn install_json_repair_listener(scope: &CaptureScope) {
    scope.on_event(|ev: ClientEvent| {
        if ev.kind != KIND_JSON_REPAIR {
            return;
        }
        if ev
            .payload
            .get(FIELD_OUTCOME)
            .and_then(serde_json::Value::as_str)
            != Some(OUTCOME_OK_REPAIRED)
        {
            return;
        }

        eprintln!("{JSON_REPAIR_HINT}");
    });
}

/// stderr 提示文本：告知输入 JSON 曾被自动修复。
const JSON_REPAIR_HINT: &str = "[wecom] json repair: 输入 JSON 已自动修复";

#[cfg(test)]
mod tests {
    use super::*;

    /// P0：提示文本含 json repair 标识
    #[test]
    fn hint_mentions_json_repair() {
        assert!(JSON_REPAIR_HINT.contains("json repair"));
    }

    /// P1：outcome 过滤只认 ok_repaired（常量与上游契约一致）
    #[test]
    fn outcome_constant_matches_contract() {
        assert_eq!(OUTCOME_OK_REPAIRED, "ok_repaired");
    }
}
