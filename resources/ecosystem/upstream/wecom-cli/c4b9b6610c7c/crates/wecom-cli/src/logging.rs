use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use anyhow::{Context, Result};
use time::macros::format_description;
use time::{Date, OffsetDateTime, UtcOffset};
use tracing_subscriber::fmt::time::OffsetTime;
use tracing_subscriber::prelude::*;

/// Environment variable for stderr log filter (e.g. `"debug"`, `"wecom=trace"`).
const ENV_LOG_LEVEL: &str = "WECOM_CLI_LOG_LEVEL";

/// Environment variable for log file directory.
const ENV_LOG_DIR: &str = "WECOM_CLI_LOG_DIR";

/// Compile-time default for log directory (injected via build.rs / env).
const DEFAULT_LOG_DIR: Option<&str> = option_env!("WECOM_CLI_DEFAULT_LOG_DIR");

/// UTC+8 offset used for both log timestamps and file-name dates.
const CST_OFFSET: (i8, i8, i8) = (8, 0, 0);

/// Logging resources returned by [`build_logging`].
///
/// The caller is responsible for composing these layers into their own
/// subscriber.  For convenience, [`init_logging`] does this and sets the
/// global default – but lib embedders can call [`build_logging`] directly
/// and integrate the layers into their own tracing setup.
struct LoggingOutput {
    /// A composed subscriber layer (boxed for ergonomics).
    /// `None` when both `log_level` and `log_dir` are unset.
    layer: Option<Box<dyn tracing_subscriber::Layer<tracing_subscriber::Registry> + Send + Sync>>,
    /// Non-blocking writer guard that **must** be kept alive for the lifetime
    /// of the subscriber.  Dropping it prematurely causes log loss.
    guard: Option<tracing_appender::non_blocking::WorkerGuard>,
}

/// Build logging layers by reading `WECOM_CLI_LOG_LEVEL` and `WECOM_CLI_LOG_DIR`
/// environment variables.
fn build_logging() -> LoggingOutput {
    let stderr_filter = std::env::var(ENV_LOG_LEVEL).ok();
    let log_file_dir = std::env::var(ENV_LOG_DIR)
        .ok()
        .or_else(|| DEFAULT_LOG_DIR.map(String::from));

    if stderr_filter.is_none() && log_file_dir.is_none() {
        return LoggingOutput {
            layer: None,
            guard: None,
        };
    }

    // Stderr layer: human-readable
    let stderr_layer = stderr_filter.map(|filter| {
        let env_filter = tracing_subscriber::EnvFilter::try_new(&filter).unwrap_or_else(|e| {
            eprintln!(
                "[wecom] warning: invalid log_level={filter:?} ({err}), falling back to \"warn\"",
                err = e,
            );
            tracing_subscriber::EnvFilter::new("warn")
        });
        tracing_subscriber::fmt::layer()
            .with_writer(std::io::stderr)
            .with_target(false)
            .with_timer(cst_timer())
            .compact()
            .with_filter(env_filter)
    });

    // File layer: JSON-line output with daily rotation (CST / UTC+8)
    let (file_layer, guard) = if let Some(dir) = log_file_dir {
        match CstDailyAppender::new(&dir, "ww.log") {
            Ok(file_appender) => {
                let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);
                let layer = tracing_subscriber::fmt::layer()
                    .json()
                    .with_writer(non_blocking)
                    .with_target(true)
                    .with_timer(cst_timer())
                    .with_current_span(true)
                    .with_span_list(true)
                    .with_filter(tracing_subscriber::EnvFilter::new("wecom=debug"));
                (Some(layer), Some(guard))
            }
            Err(e) => {
                eprintln!(
                    "[wecom] warning: failed to open log file in {dir:?} ({err}), file logging disabled",
                    err = e,
                );
                (None, None)
            }
        }
    } else {
        (None, None)
    };

    let composed: Box<dyn tracing_subscriber::Layer<tracing_subscriber::Registry> + Send + Sync> =
        match (stderr_layer, file_layer) {
            (Some(s), Some(f)) => Box::new(s.and_then(f)),
            (Some(s), None) => Box::new(s),
            (None, Some(f)) => Box::new(f),
            (None, None) => {
                // 配置了日志但 stderr 无过滤、文件层打开失败降级为 None：
                // 无可用日志层，静默返回（不 panic）。
                return LoggingOutput {
                    layer: None,
                    guard: None,
                };
            }
        };

    LoggingOutput {
        layer: Some(composed),
        guard,
    }
}

/// Convenience function for CLI: build logging, set the global subscriber,
/// and return a root span.
///
/// Always mounts [`wecom::telemetry::TelemetryLayer`] so that
/// `CaptureScope::on_request` / `on_event` work without the caller
/// worrying about layer setup.
///
/// The non-blocking writer guard is intentionally leaked so it stays alive for
/// the process lifetime.
pub fn init_logging() -> tracing::Span {
    use tracing_subscriber::prelude::*;
    use wecom::telemetry::TelemetryLayer;

    let output = build_logging();

    // Always mount capture layer; optionally combine with log layers.
    let base = tracing_subscriber::registry();
    let telemetry = TelemetryLayer::new();
    if let Some(log_layer) = output.layer {
        let subscriber = base.with(log_layer).with(telemetry);
        if tracing::subscriber::set_global_default(subscriber).is_ok() {
            std::mem::forget(output.guard);
        }
    } else {
        let subscriber = base.with(telemetry);
        if tracing::subscriber::set_global_default(subscriber).is_ok() {
            std::mem::forget(output.guard);
        }
    }

    tracing::info_span!("proc", pid = std::process::id())
}

fn cst_timer() -> OffsetTime<&'static [time::format_description::BorrowedFormatItem<'static>]> {
    let cst_offset = UtcOffset::from_hms(8, 0, 0).expect("valid UTC+8 offset");
    let format = format_description!(
        "[year]-[month]-[day]T[hour]:[minute]:[second].[subsecond digits:3]+08:00"
    );
    OffsetTime::new(cst_offset, format)
}

// ---------------------------------------------------------------------------
// CstDailyAppender – daily-rotating file writer whose date uses UTC+8.
// ---------------------------------------------------------------------------

/// A daily-rotating file appender whose rotation boundary is midnight **CST
/// (UTC+8)** instead of UTC. This ensures the date in the filename is
/// consistent with the CST timestamps written inside the log.
///
/// Implements [`std::io::Write`] so it can be used with
/// [`tracing_appender::non_blocking()`].
struct CstDailyAppender {
    inner: Arc<Mutex<CstDailyInner>>,
}

struct CstDailyInner {
    current_date: Date,
    file: fs::File,
    dir: PathBuf,
    prefix: String,
    last_rotation_error: Option<Date>,
}

impl CstDailyAppender {
    pub fn new(dir: impl Into<PathBuf>, prefix: impl Into<String>) -> Result<Self> {
        let dir = dir.into();
        let prefix = prefix.into();
        let today = cst_today();
        let file = open_log_file(&dir, &prefix, today)?;
        Ok(Self {
            inner: Arc::new(Mutex::new(CstDailyInner {
                current_date: today,
                file,
                dir,
                prefix,
                last_rotation_error: None,
            })),
        })
    }
}

impl Write for CstDailyAppender {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        let mut inner = self.inner.lock().unwrap_or_else(|e| e.into_inner());
        let today = cst_today();
        if today != inner.current_date {
            match open_log_file(&inner.dir, &inner.prefix, today) {
                Ok(new_file) => {
                    inner.file = new_file;
                    inner.current_date = today;
                    inner.last_rotation_error = None;
                }
                Err(e) => {
                    if inner.last_rotation_error != Some(today) {
                        eprintln!(
                            "[wecom] warning: log rotation failed for {dir:?} ({err}), \
                             continuing with previous file",
                            dir = inner.dir,
                            err = e,
                        );
                        inner.last_rotation_error = Some(today);
                    }
                }
            }
        }
        inner.file.write(buf)
    }

    fn flush(&mut self) -> std::io::Result<()> {
        let mut inner = self.inner.lock().unwrap_or_else(|e| e.into_inner());
        inner.file.flush()
    }
}

/// Returns the current date in CST (UTC+8).
fn cst_today() -> Date {
    let offset =
        UtcOffset::from_hms(CST_OFFSET.0, CST_OFFSET.1, CST_OFFSET.2).expect("valid UTC+8 offset");
    OffsetDateTime::now_utc().to_offset(offset).date()
}

/// Open (create) the log file for `date`.
/// SAFETY: Log infrastructure code — runs independently of the sandbox.
/// Directory and path are env-var controlled, not user-input controlled.
#[allow(clippy::disallowed_methods)]
fn open_log_file(dir: &Path, prefix: &str, date: Date) -> Result<fs::File> {
    let path = log_file_path(dir, prefix, date);

    {
        let mut builder = fs::DirBuilder::new();
        #[cfg(unix)]
        {
            use std::os::unix::fs::DirBuilderExt;
            builder.mode(0o700);
        }
        builder
            .recursive(true)
            .create(dir)
            .with_context(|| format!("Failed to create directory {}", dir.display()))?;
    }

    let mut opts = fs::OpenOptions::new();
    opts.create(true).append(true);

    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        opts.mode(0o600);
    }

    opts.open(path).context("Failed to open log file")
}

/// Builds the log file path: `<dir>/<prefix>.<YYYY-MM-DD>`
fn log_file_path(dir: &Path, prefix: &str, date: Date) -> PathBuf {
    let date_fmt = format_description!("[year]-[month]-[day]");
    let date_str = date.format(&date_fmt).expect("date format");
    dir.join(format!("{prefix}.{date_str}"))
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    //! ## 模块摘要：logging（日志初始化与轮转写入）
    //!
    //! ### 关键接口
    //! - [init_logging] — 初始化全局 tracing subscriber，返回 root span
    //! - [build_logging] — 根据环境变量构建 stderr + file 日志层
    //! - [CstDailyAppender] — 按 CST(UTC+8) 日期每日轮转的文件 appender
    //! - [log_file_path] — 构建日志文件路径 `<dir>/<prefix>.<YYYY-MM-DD>`
    //! - [cst_today] / [cst_timer] — CST 时区日期和時間格式化器
    //!
    //! ### 关键分支与异常路径
    //! - 无环境变量 → [build_logging] 返回 `layer=None, guard=None`
    //! - 日志目录不可写 → [CstDailyAppender::new] 返回 Err
    //! - 轮转时新文件创建失败 → 降级到旧文件继续写入，仅首次报错
    //! - 日期变更检测 → write 时检查 `cst_today() != current_date` 触发轮转
    //!
    //! ### 上下游交互
    //! - 上游：CLI 入口 `main()` 调用 [init_logging]
    //! - 下游：依赖 `tracing-subscriber`、`tracing-appender`、标准库 `time`

    use std::fs;

    use super::*;

    // ── build_logging ──

    /// P0：[build_logging] 无环境变量配置时 build_logging 返回空结果
    /// 条件：未设置 WECOM_CLI_LOG_LEVEL 和 WECOM_CLI_LOG_DIR
    /// 断言：layer 和 guard 均为 None
    #[test]
    fn test_build_logging_no_config_returns_none() {
        unsafe {
            std::env::remove_var(ENV_LOG_LEVEL);
            std::env::remove_var(ENV_LOG_DIR);
        }
        let output = build_logging();
        // 编译期注入了 WECOM_CLI_DEFAULT_LOG_DIR 时，文件层会尝试打开默认目录
        //（是否返回 None 取决于目录可写性），此时不保证 None；调用本身即验证
        // 不 panic。
        if option_env!("WECOM_CLI_DEFAULT_LOG_DIR").is_none() {
            assert!(output.layer.is_none());
            assert!(output.guard.is_none());
        }
    }

    // ── cst_timer / cst_today ──

    /// P0：[cst_timer] cst_timer 能成功构建 UTC+8 时间格式化器
    /// 条件：调用 cst_timer()
    /// 断言：函数正常返回不 panic
    #[test]
    fn test_cst_timer_constructs_successfully() {
        let _ = cst_timer();
    }

    /// P0：[cst_today] cst_today 返回 UTC+8 时区的当前日期
    /// 条件：调用 cst_today()
    /// 断言：结果等于 OffsetDateTime.now_utc().to_offset(UTC+8).date()
    #[test]
    fn test_cst_today_returns_utc_plus_8() {
        let today = cst_today();
        let offset = UtcOffset::from_hms(8, 0, 0).unwrap();
        let expected = OffsetDateTime::now_utc().to_offset(offset).date();
        assert_eq!(today, expected);
    }

    // ── log_file_path ──

    /// P0：日志文件路径格式为 <prefix>.<YYYY-MM-DD>
    /// 条件：dir="/tmp/logs"，date=2026-04-10
    /// 断言：路径为 "/tmp/logs/ww.log.2026-04-10"
    #[test]
    fn test_log_file_path_format() {
        let dir = Path::new("/tmp/logs");
        let date = Date::from_calendar_date(2026, time::Month::April, 10).unwrap();
        let path = log_file_path(dir, "ww.log", date);
        assert_eq!(path, PathBuf::from("/tmp/logs/ww.log.2026-04-10"));
    }

    /// P1：[log_file_path] 日志文件路径中月份和日期补零对齐
    /// 条件：dir="/tmp/logs"，date=2026-01-05（一月五日）
    /// 断言：路径为 "/tmp/logs/ww.log.2026-01-05"
    #[test]
    fn test_log_file_path_month_day_padding() {
        let dir = Path::new("/tmp/logs");
        let date = Date::from_calendar_date(2026, time::Month::January, 5).unwrap();
        let path = log_file_path(dir, "ww.log", date);
        assert_eq!(path, PathBuf::from("/tmp/logs/ww.log.2026-01-05"));
    }

    // ── CstDailyAppender: create / append ──

    /// P0：[CstDailyAppender] CstDailyAppender 创建以 CST 日期命名的日志文件并写入内容
    /// 条件：在临时目录创建 appender 并写入 "hello\n"
    /// 断言：CST 日期路径的文件存在且内容为 "hello\n"
    #[test]
    fn test_appender_creates_file_with_cst_date() {
        let tmp = tempfile::tempdir().unwrap();
        let mut appender = CstDailyAppender::new(tmp.path(), "test.log").unwrap();
        appender.write_all(b"hello\n").unwrap();
        appender.flush().unwrap();

        let today = cst_today();
        let expected_path = log_file_path(tmp.path(), "test.log", today);
        assert!(
            expected_path.exists(),
            "log file should be created at CST date path"
        );

        let content = fs::read_to_string(&expected_path).unwrap();
        assert_eq!(content, "hello\n");
    }

    /// P1：[CstDailyAppender] CstDailyAppender 对同一文件追加写入多次
    /// 条件：连续 write_all 两次 "line1\n" 和 "line2\n"
    /// 断言：文件内容为 "line1\nline2\n"
    #[test]
    fn test_appender_appends_to_existing_file() {
        let tmp = tempfile::tempdir().unwrap();
        let mut appender = CstDailyAppender::new(tmp.path(), "test.log").unwrap();
        appender.write_all(b"line1\n").unwrap();
        appender.write_all(b"line2\n").unwrap();
        appender.flush().unwrap();

        let today = cst_today();
        let path = log_file_path(tmp.path(), "test.log", today);
        let content = fs::read_to_string(path).unwrap();
        assert_eq!(content, "line1\nline2\n");
    }

    // ── CstDailyAppender: rotation ──

    /// P0：[CstDailyAppender] CstDailyAppender 在日期变更时自动轮转到新文件
    /// 条件：内部 current_date 设为昨天，write 触发轮转
    /// 断言：今天的新文件存在且有内容，昨天文件仍存在
    #[test]
    fn test_appender_rotates_on_date_change() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().to_path_buf();
        let prefix = "test.log".to_string();

        let yesterday = cst_today() - time::Duration::days(1);
        let yesterday_file = open_log_file(&dir, &prefix, yesterday).unwrap();

        let appender = CstDailyAppender {
            inner: Arc::new(Mutex::new(CstDailyInner {
                current_date: yesterday,
                file: yesterday_file,
                dir: dir.clone(),
                prefix: prefix.clone(),
                last_rotation_error: None,
            })),
        };
        let mut appender = appender;

        // Write – should trigger rotation because cst_today() != yesterday.
        appender.write_all(b"rotated\n").unwrap();
        appender.flush().unwrap();

        let today = cst_today();
        let today_path = log_file_path(&dir, &prefix, today);
        assert!(today_path.exists(), "new file for today should exist");
        let content = fs::read_to_string(today_path).unwrap();
        assert_eq!(content, "rotated\n");

        // Yesterday's file should also exist (empty, was only opened).
        let yesterday_path = log_file_path(&dir, &prefix, yesterday);
        assert!(
            yesterday_path.exists(),
            "yesterday's file should still exist"
        );
    }

    /// P1：[CstDailyAppender::new] CstDailyAppender::new 对不可写目录返回 Err
    /// 条件：目录路径指向一个已存在的普通文件下的子路径，
    ///       此时 `DirBuilder::create(..).recursive(true)` 会因父组件不是目录而失败
    ///       （行为在 Unix 与 Windows 上一致）
    /// 断言：result.is_err()
    #[test]
    fn test_appender_new_returns_err_for_unwritable_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let blocker = tmp.path().join("blocker_file");
        fs::write(&blocker, b"not a directory").unwrap();
        // `<blocker_file>/subdir` cannot exist as a directory because
        // `blocker_file` is a regular file. mkdir -p will return an error.
        let bad_dir = blocker.join("subdir");
        let result = CstDailyAppender::new(bad_dir, "test.log");
        assert!(
            result.is_err(),
            "should return Err for unwritable directory"
        );
    }

    // ── CstDailyAppender: rotation failure fallback ──

    /// P2：[CstDailyAppender] 日志轮转失败时回退到旧文件继续写入
    /// 条件：将内部目录指向"已存在普通文件下的子路径"使轮转失败
    ///       （此种路径在 Unix 与 Windows 下 mkdir -p 都会返回错误）
    /// 断言：写入操作成功，数据被写到旧的日志文件中
    #[test]
    fn test_appender_rotation_failure_falls_back_to_old_file() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().to_path_buf();
        let prefix = "test.log".to_string();

        let yesterday = cst_today() - time::Duration::days(1);
        let yesterday_file = open_log_file(&dir, &prefix, yesterday).unwrap();

        // Point the inner dir to a path under an existing regular file so
        // rotation will fail (mkdir -p cannot turn a file into a directory).
        let blocker = tmp.path().join("blocker_file");
        fs::write(&blocker, b"not a directory").unwrap();
        let bad_dir = blocker.join("subdir");
        let mut appender = CstDailyAppender {
            inner: Arc::new(Mutex::new(CstDailyInner {
                current_date: yesterday,
                file: yesterday_file,
                dir: bad_dir,
                prefix: prefix.clone(),
                last_rotation_error: None,
            })),
        };

        // Write should succeed (falls back to old file).
        appender.write_all(b"fallback\n").unwrap();
        appender.flush().unwrap();

        let yesterday_path = log_file_path(&dir, &prefix, yesterday);
        let content = fs::read_to_string(yesterday_path).unwrap();
        assert_eq!(content, "fallback\n");
    }
}
