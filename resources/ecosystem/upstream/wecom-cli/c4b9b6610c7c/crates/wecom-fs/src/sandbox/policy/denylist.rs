//! The built-in deny tables — glob lists covering system locations and
//! credential shapes — and the [`recommended_deny_rule`] preset built
//! from them.  [`super::rule`] holds the [`DenyRule`] machinery (glob
//! dialect included).
//!
//! Everything is a shape or an absolute prefix — no home base, no
//! `$HOME`, no account database: home-relative credential coverage is
//! expressed entirely as `**/…` patterns (any depth, any user's home),
//! applied in **both** directions: the workspace fs is not a general file
//! manager, so the false-positive
//! cost of also denying *writes* of credential-shaped names (a downloaded
//! `cert.pem`, a scaffolded `.env`) is accepted in exchange for closing
//! the write-side vectors — persistence (`~/.ssh/authorized_keys`) and
//! config poisoning (overwriting a project's `.env`).
//!
//! The CLI's own default configuration directory (`**/.config/wecom`) is
//! in the table too: the private-domain instance carries no denylist at
//! all (`SandboxedFs::confined_to`), so the workspace-facing wiring can
//! rely on [`recommended_deny_rule`] alone.

use super::rule::DenyRule;

/// Cross-platform credential shapes.  Dialect: [`DenyRule::globs`].
///
/// - `**/name`: credential-store directory segments, credential and
///   shell/REPL history file names (single-component patterns deny a
///   directory of that name too — accepted);
/// - `**/*.ext`: key / certificate containers (matched on any component,
///   so a directory named `x.pem` is denied with its contents —
///   accepted);
/// - `**/a/b/…`: multi-segment credential stores.
pub(super) const COMMON_DENY_GLOBS: &[&str] = &[
    // ── credential-store directory segments ──
    "**/.ssh",
    "**/.aws",
    "**/.azure",
    "**/.gnupg",
    "**/.kube",
    "**/.docker",
    "**/.git",
    // ── credential / history file names ──
    "**/.env",
    "**/.env.local",
    "**/.env.production",
    "**/.git-credentials",
    "**/.gitconfig",
    "**/.netrc",
    "**/.npmrc",
    "**/.pypirc",
    "**/id_rsa",
    "**/id_ed25519",
    "**/id_ecdsa",
    "**/.bash_history",
    "**/.zsh_history",
    "**/.sh_history",
    "**/.python_history",
    "**/.psql_history",
    // ── key / certificate extensions ──
    "**/*.pem",
    "**/*.key",
    "**/*.p12",
    "**/*.pfx",
    "**/*.jks",
    // ── multi-segment credential stores ──
    "**/.config/gh",       // GitHub CLI OAuth token
    "**/.config/gcloud",   // GCP credentials
    "**/.config/wecom",    // this CLI's own token store (default location)
    "**/.gem/credentials", // RubyGems API key
    "**/.cargo/credentials",
    "**/.cargo/credentials.toml", // crates.io token
];

/// Unix system directories (fixed directories — evaluated via
/// [`DenyRule::prefix`]).
#[cfg(unix)]
pub(super) const UNIX_DENY_DIRS: &[&str] = &["/etc", "/proc", "/sys", "/dev", "/root", "/var/run"];

/// Windows system locations: OS roots (fixed directories — evaluated via
/// [`DenyRule::prefix`]).  `C:\Windows` is the `SystemRoot` fallback;
/// [`recommended_deny_rule`] adds the env value when it differs.
#[cfg(windows)]
pub(super) const WINDOWS_DENY_DIRS: &[&str] = &[
    r"C:\Windows",
    r"C:\ProgramData",
    r"C:\Program Files",
    r"C:\Program Files (x86)",
];

/// Windows DPAPI credential stores (shapes — follow every profile, not
/// just the env home; these need the glob dialect's any-depth matching).
#[cfg(windows)]
pub(super) const WINDOWS_DENY_SHAPES: &[&str] = &[
    "**/AppData/Roaming/Microsoft/Credentials",
    "**/AppData/Local/Microsoft/Credentials",
];

/// The recommended deny rule: the built-in tables as one compiled rule —
/// fixed system directories via [`DenyRule::prefix`] (no pattern
/// validation), credential shapes via the glob dialect (any-depth
/// component matching).
///
/// Nothing here is applied implicitly — [`SandboxedFs::new`](crate::SandboxedFs)
/// starts with an empty denylist; callers opt in via
/// `policy.with_deny(recommended_deny_rule())` (or
/// [`Policy::with_recommended_deny`](super::Policy::with_recommended_deny)).
/// When applied, deny always wins over allow: it holds even when roots are
/// `None` (unrestricted mode), and a root that *contains* a denied entry
/// (e.g. cwd == home directory) does not re-allow it.
pub fn recommended_deny_rule() -> DenyRule {
    let mut rules: Vec<DenyRule> = Vec::new();
    #[cfg(unix)]
    rules.extend(UNIX_DENY_DIRS.iter().map(DenyRule::prefix));
    #[cfg(windows)]
    {
        rules.extend(WINDOWS_DENY_DIRS.iter().map(DenyRule::prefix));
        // SystemRoot is a system-set variable (not user-controlled like
        // $HOME); the conventional location is already in the table — add
        // the env value only when it differs.
        if let Some(sr) = std::env::var_os("SystemRoot")
            && std::path::Path::new(&sr) != std::path::Path::new(r"C:\Windows")
        {
            rules.push(DenyRule::prefix(sr));
        }
    }

    #[cfg(not(windows))]
    let globs: Vec<_> = COMMON_DENY_GLOBS.iter().map(|s| (*s).to_string()).collect();
    #[cfg(windows)]
    let globs: Vec<_> = COMMON_DENY_GLOBS
        .iter()
        .chain(WINDOWS_DENY_SHAPES.iter())
        .map(|s| (*s).to_string())
        .collect();

    // The built-in tables are compile-time constants covered by the
    // tests/ module; a compile failure here would be a code bug, not
    // runtime input.
    rules.push(DenyRule::globs(globs).expect("built-in deny glob table must compile"));

    DenyRule::new("recommended deny", move |real: &std::path::Path| {
        for rule in &rules {
            rule.evaluate(real)?;
        }
        Ok(())
    })
}
