/// 默认最小轮询间隔（毫秒）
pub(crate) const DEFAULT_MIN_POLL_INTERVAL_MS: u64 = 500;

/// 默认任务超时时间（秒）
pub(crate) const DEFAULT_POLL_TIMEOUT_SECS: u64 = 120;

/// 轮询时允许的最大连续网络错误次数
pub(crate) const MAX_CONSECUTIVE_NETWORK_ERRORS: u32 = 3;
