use std::io::{IsTerminal, Write};
use std::sync::{Arc, Mutex};

use indexmap::IndexMap;

/// Thread-safe writer shared across the `run` pipeline for all output.
///
/// Defaults to `stdout`. Library embedders can supply any `Write`
/// implementation (e.g. `Vec<u8>`, a file, a network socket).
pub type Writer = Arc<Mutex<Box<dyn Write + Send>>>;

/// 服务端额外数据回调类型（与 PollCallback 模式一致，使用 Arc 共享所有权）。
///
/// 当后台 API 响应中除了主 `result` 还附带 side-channel 字段时，
/// 通过此回调将额外数据透传给调用方。transport 层不做解析，纯透传。
pub(crate) type ExtraDataCallback = Arc<dyn Fn(&IndexMap<String, serde_json::Value>) + Send + Sync>;

/// Output configuration for the `run` pipeline.
///
/// Encapsulates *where* and *how* CLI output is written. This is a
/// parameter of the `run` family of methods — not a property of
/// [`Client`](crate::client::Client).
///
/// # Default
///
/// [`CliRunOutput::default()`] writes to **stdout** with ANSI color
/// auto-detected based on whether stdout is a terminal.
///
/// # Examples
///
/// ```rust
/// use wecom::CliRunOutput;
///
/// // Capture output in a buffer:
/// let buf: Vec<u8> = Vec::new();
/// let output = CliRunOutput::new(buf);
///
/// // Force color on:
/// let output = CliRunOutput::stdout().force_color(true);
/// # let _ = output;
/// ```
pub struct CliRunOutput {
    writer: Writer,
    force_color: bool,
}

impl Default for CliRunOutput {
    /// Create a `CliRunOutput` that writes to **stdout** with color
    /// auto-detected.
    fn default() -> Self {
        Self {
            writer: Arc::new(Mutex::new(Box::new(std::io::stdout()))),
            force_color: std::io::stdout().is_terminal(),
        }
    }
}

impl CliRunOutput {
    /// Create a `CliRunOutput` backed by a custom writer.
    ///
    /// Color is **disabled** by default when using a custom writer.
    /// Call [`.force_color(true)`](Self::force_color) to override.
    pub fn new(w: impl Write + Send + 'static) -> Self {
        Self {
            writer: Arc::new(Mutex::new(Box::new(w))),
            force_color: false,
        }
    }

    /// Create a `CliRunOutput` that writes to **stdout** with color
    /// auto-detected.
    ///
    /// Equivalent to [`CliRunOutput::default()`].
    pub fn stdout() -> Self {
        Self::default()
    }

    /// Create a `CliRunOutput` backed by a pre-built [`Writer`] arc.
    ///
    /// Useful when the caller needs to retain a handle to the same
    /// `Arc` in order to inspect what was written (e.g. in tests).
    pub fn from_writer_arc(w: Writer) -> Self {
        Self {
            writer: w,
            force_color: false,
        }
    }

    /// Create a new `CliRunOutput` that shares the same underlying writer
    /// and color setting.
    ///
    /// This is cheap (only clones an `Arc`) and is useful when multiple
    /// consumers need to write to the same output destination.
    pub fn clone_shared(&self) -> Self {
        Self {
            writer: Arc::clone(&self.writer),
            force_color: self.force_color,
        }
    }

    /// Force ANSI color output on or off (builder pattern).
    #[must_use]
    pub fn force_color(mut self, enable: bool) -> Self {
        self.force_color = enable;
        self
    }

    // ── Accessors ──

    /// Returns a reference to the shared [`Writer`].
    ///
    /// Callers can lock it to perform multiple writes atomically:
    /// ```rust,no_run
    /// # use std::io::Write;
    /// # use wecom::CliRunOutput;
    /// # fn example(output: &CliRunOutput) -> Result<(), Box<dyn std::error::Error>> {
    /// let mut w = output.writer().lock().unwrap();
    /// writeln!(w, "hello")?;
    /// # Ok(())
    /// # }
    /// ```
    pub fn writer(&self) -> &Writer {
        &self.writer
    }

    /// Whether forced ANSI color output is enabled.
    pub fn is_force_color(&self) -> bool {
        self.force_color
    }

    /// Write a line of text to the configured writer.
    ///
    /// Convenience wrapper that appends a newline and silently ignores
    /// write errors.
    pub fn print(&self, s: &str) {
        let _ = writeln!(self.writer.lock().unwrap_or_else(|e| e.into_inner()), "{s}");
    }

    /// Render a [`StyledStr`](clap::builder::StyledStr) to a color-aware `String`.
    ///
    /// When `force_color` is enabled the ANSI escape codes embedded in the
    /// `StyledStr` are preserved; otherwise they are stripped via the
    /// `Display` implementation. This is the single source of truth for
    /// converting styled clap output into a printable string.
    pub fn render_styled(&self, s: &clap::builder::StyledStr) -> String {
        if self.force_color {
            s.ansi().to_string()
        } else {
            s.to_string()
        }
    }

    /// Write a [`StyledStr`](clap::builder::StyledStr) to the configured writer.
    ///
    /// Color-aware: see [`render_styled`](Self::render_styled).
    pub fn print_styled(&self, s: &clap::builder::StyledStr) {
        self.print(&self.render_styled(s));
    }
}

impl std::fmt::Debug for CliRunOutput {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CliRunOutput")
            .field("force_color", &self.force_color)
            .finish_non_exhaustive()
    }
}
