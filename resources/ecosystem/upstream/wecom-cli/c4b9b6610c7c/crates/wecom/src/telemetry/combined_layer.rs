//! Unified [`TelemetryLayer`] — combines HTTP request tracing
//! ([`TraceLayer`]) and business event dispatch ([`EventLayer`]) into
//! a single [`tracing_subscriber::Layer`].
//!
//! This is the **only** Layer users need to mount. Internally it
//! delegates to both sub-layers, hiding the crate boundary between
//! `wecom-transport` and `wecom`.

use tracing::Subscriber;
use tracing_subscriber::Layer;
use tracing_subscriber::layer::Context;
use tracing_subscriber::registry::LookupSpan;
use wecom_transport::telemetry::TraceLayer;

use super::layer::EventLayer;

#[derive(Debug, Clone, Default)]
pub struct TelemetryLayer {
    trace: TraceLayer,
    event: EventLayer,
}

impl TelemetryLayer {
    pub fn new() -> Self {
        Self::default()
    }
}

impl<S> Layer<S> for TelemetryLayer
where
    S: Subscriber + for<'a> LookupSpan<'a> + Send + Sync + 'static,
{
    fn on_new_span(
        &self,
        attrs: &tracing::span::Attributes<'_>,
        id: &tracing::span::Id,
        ctx: Context<'_, S>,
    ) {
        self.trace.on_new_span(attrs, id, ctx);
    }

    fn on_record(
        &self,
        id: &tracing::span::Id,
        values: &tracing::span::Record<'_>,
        ctx: Context<'_, S>,
    ) {
        self.trace.on_record(id, values, ctx);
    }

    fn on_event(&self, event: &tracing::Event<'_>, ctx: Context<'_, S>) {
        self.trace.on_event(event, ctx.clone());
        self.event.on_event(event, ctx);
    }

    fn on_close(&self, id: tracing::span::Id, ctx: Context<'_, S>) {
        self.trace.on_close(id, ctx);
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：TelemetryLayer（将 HTTP 追踪和业务事件分发合并为单一 Layer）
    //!
    //! ### 关键接口
    //! - [TelemetryLayer::new] — 构造 Layer 实例
    //! - Layer trait 实现 — 委托给 TraceLayer 和 EventLayer
    //!
    //! ### 关键分支与异常路径
    //! - 零大小类型（ZST）→ 无运行时开销
    //! - new() 与 default() → 行为一致
    //!
    //! ### 上下游交互
    //! - 上游：用户通过 tracing_subscriber::Registry::with() 挂载
    //! - 下游：wecom_transport::TraceLayer（HTTP 追踪）、EventLayer（业务事件分发）

    use tracing_subscriber::prelude::*;

    use super::*;

    /// P0：[TelemetryLayer] 为零大小类型（ZST），无运行时开销
    /// 条件：检查 size_of::<TelemetryLayer>()
    /// 断言：size_of 返回 0
    #[test]
    fn telemetry_layer_is_zst() {
        assert_eq!(std::mem::size_of::<TelemetryLayer>(), 0);
    }

    /// P1：[TelemetryLayer] new() 与 default() 构造结果一致
    /// 条件：分别用 new() 和 default() 构造 TelemetryLayer
    /// 断言：Debug 格式化输出相同
    #[test]
    fn new_equals_default() {
        let a = TelemetryLayer::new();
        let b = TelemetryLayer::default();
        assert_eq!(format!("{a:?}"), format!("{b:?}"));
    }

    /// P1：[TelemetryLayer] 可正常挂载到 Registry subscriber
    /// 条件：创建 Registry 并 with(TelemetryLayer::new())
    /// 断言：挂载和 set_default 均不 panic
    #[test]
    fn telemetry_layer_mounts() {
        let subscriber = tracing_subscriber::Registry::default().with(TelemetryLayer::new());
        let _guard = tracing::subscriber::set_default(subscriber);
    }
}
