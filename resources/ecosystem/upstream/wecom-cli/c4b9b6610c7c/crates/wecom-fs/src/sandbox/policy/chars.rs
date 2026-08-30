//! Dangerous-character screening for caller-supplied paths.

use std::path::{Component, Path};

use crate::Result;
use crate::api::Error;

// ── Dangerous character screening ───────────────────────────

/// Inclusive `(lo, hi)` Unicode ranges rejected by
/// [`reject_dangerous_chars`]: zero-width characters, bidi controls,
/// line / paragraph separators and the BOM.
///
/// Control characters are covered separately by `char::is_control` and are
/// therefore not listed here.
const DANGEROUS_CHAR_RANGES: &[(char, char)] = &[
    ('\u{200B}', '\u{200F}'), // zero-width space/joiners + LRM/RLM
    ('\u{2028}', '\u{2029}'), // line / paragraph separators
    ('\u{202A}', '\u{202E}'), // bidi embeddings & overrides
    ('\u{2060}', '\u{2064}'), // word joiner & invisible operators
    ('\u{2066}', '\u{2069}'), // bidi isolates
    ('\u{FEFF}', '\u{FEFF}'), // BOM / zero-width no-break space
];

/// Reject caller-supplied paths containing characters that have no
/// legitimate place in filesystem paths: control characters, zero-width
/// characters, bidi embedding/override/isolate controls, and
/// U+2028 / U+2029.
///
/// Applied by [`Fs::resolve`](crate::Fs::resolve) to the caller-supplied path
/// after logical normalisation (`.` / `..` folding) and **before** symlink
/// resolution (canonicalization happens later, in
/// [`Policy::check`](super::Policy::check)) — it screens the literal spelling
/// the caller asked
/// for.  This is an input-hygiene / observability guard for whoever reads
/// the error message (bidi overrides can spoof what a path *looks* like),
/// not a kernel-level boundary; the error therefore names the offending code
/// point so the caller can self-correct.  Non-UTF-8
/// paths are skipped here — the `Fs` boundary rejects them separately.
pub(in crate::sandbox) fn reject_dangerous_chars(path: &Path) -> Result<()> {
    let Some(raw) = path.to_str() else {
        return Ok(());
    };
    if let Some((offset, c)) = raw.char_indices().find(|(_, c)| is_dangerous_char(*c)) {
        tracing::error!(char = %c, offset, "sandbox: path contains dangerous characters");
        return Err(Error::validation(format!(
            "路径包含非法字符 U+{:04X}: {raw}",
            c as u32
        )));
    }
    // Windows: a `:` inside any normal path component names an Alternate
    // Data Stream (`file.txt:stream`); the drive-letter `Prefix` component
    // is unaffected, so `C:\…` still passes.
    if cfg!(windows)
        && let Some(comp) = path.components().find_map(|c| match c {
            Component::Normal(seg) => seg.to_str().filter(|s| s.contains(':')),
            _ => None,
        })
    {
        tracing::error!(component = %comp, "sandbox: path component names an ADS");
        return Err(Error::validation(format!("路径包含非法字符: {raw}")));
    }
    Ok(())
}

fn is_dangerous_char(c: char) -> bool {
    c.is_control()
        || DANGEROUS_CHAR_RANGES
            .iter()
            .any(|&(lo, hi)| (lo..=hi).contains(&c))
}
