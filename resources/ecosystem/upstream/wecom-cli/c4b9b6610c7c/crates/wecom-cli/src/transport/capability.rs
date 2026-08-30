//! 鉴权能力类型（wecom-cli 自定义）。
//!
//! 鉴权语义：
//! - [`RequireAuth`] 作为**门禁**标记挂在
//!   [`Endpoint`](wecom_transport::Endpoint) 能力袋上：挂载该标记的端点
//!   若无可用的 token，请求直接报 [`Error::Auth`](crate::error::Error)
//!   且不发出。
//! - [`SuppressAuth`] 作为**抑制注入**标记：携带该标记的端点（如换取 token
//!   的鉴权引导接口）即使持有 token 也不注入 `Authorization` 头。
//! - 默认行为（不挂任何标记）：只要持有 token 就注入
//!   `Authorization: Bearer <token>`，没有 token 则忽略（不报错）。

/// 端点调用前的 token 门禁标记（存在即生效）。
///
/// 挂进 [`Endpoint`](wecom_transport::Endpoint) 能力袋（wecom-cli 自定义能力
/// 类型）——鉴权门禁按 endpoint 单独声明：挂载后调用前必须已有可用 token，
/// 无 token 时报 [`Error::Auth`](crate::error::Error)，请求不发出。
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct RequireAuth;

/// 抑制 `Authorization` 注入的标记（换取 token 的引导端点专用）。
///
/// 默认所有端点「有 token 就携带、无 token 则忽略」；仅鉴权引导等换取 token
/// 的接口挂此标记，保证引导请求绝不携带失效 token，避免 853004 刷新自死锁。
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct SuppressAuth;
