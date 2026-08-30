use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;

fn main() {
    // Truncate sub-second precision so Rfc3339 outputs "HH:MM:SSZ" only.
    let now = OffsetDateTime::now_utc().replace_nanosecond(0).unwrap();

    println!("cargo::rustc-env=BUILD_VERSION={}", get_build_version());
    println!(
        "cargo::rustc-env=BUILD_TIME_RFC3339={}",
        now.format(&Rfc3339).unwrap()
    );
    println!("cargo::rustc-env=GIT_COMMIT_ID={}", get_git_commit_id());
    println!("cargo::rustc-env=TARGET_PLATFORM={}", get_target_platform());
}

/// 目标平台二元组 `os/arch`（如 `linux/x86_64`）。
///
/// 经 Cargo 暴露的 `CARGO_CFG_TARGET_*` 环境变量读取**目标平台**的 cfg
/// （交叉编译下仍指向目标而非宿主），以 `/` 拼接后注入 `TARGET_PLATFORM`，
/// 供 [crate::constants::CliInfo] 编译期 `env!` 使用。
fn get_target_platform() -> String {
    let os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();
    format!("{os}/{arch}")
}

fn get_build_version() -> String {
    println!("cargo::rerun-if-env-changed=BUILD_SUFFIX");

    let mut build_version = env!("CARGO_PKG_VERSION").to_string();

    if let Ok(suffix) = std::env::var("BUILD_SUFFIX") {
        build_version.push('-');
        build_version.push_str(&suffix);
    }

    build_version
}

fn get_git_commit_id() -> String {
    println!("cargo::rerun-if-changed=.git/HEAD");
    println!("cargo::rerun-if-changed=.git/refs/heads/");

    let short_id = std::process::Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                String::from_utf8(o.stdout).ok()
            } else {
                None
            }
        })
        .map(|s| s.trim().to_string())
        .unwrap_or_default();

    if short_id.is_empty() {
        println!(
            "cargo::warning=git rev-parse --short HEAD returned nothing, GIT_COMMIT_ID will be empty"
        );
    }

    short_id
}
