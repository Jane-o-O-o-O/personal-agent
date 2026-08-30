use std::path::Path;

use clap::{ArgMatches, Command, FromArgMatches, Subcommand};
use serde_json::json;
use wecom_fs::Error as FsError;

use crate::{CliRun, CliRunOutput, Error, Result, fs};

#[derive(Subcommand)]
#[command(subcommand_required = true)]
pub enum CacheCmds {
    /// 查看服务发现缓存状态
    Status,

    /// 清除所有服务发现缓存文件
    Clear,
}

pub fn build_cache_cmd() -> Command {
    CacheCmds::augment_subcommands(Command::new("cache")).hide(true)
}

pub async fn handle_cache_cmd(run: &CliRun<'_>, matches: &ArgMatches) -> Result<()> {
    let fs = run.get_client().private_fs().as_ref();

    let output = run.get_output();
    let cache_dir = run.get_cache_dir();

    match CacheCmds::from_arg_matches(matches) {
        Ok(CacheCmds::Status) => handle_cache_status(fs, &cache_dir, output).await,
        Ok(CacheCmds::Clear) => handle_cache_clear(fs, &cache_dir, output).await,
        _ => Err(Error::other("Unknown cache subcommand".into())),
    }
}

/// 列出当前缓存目录下所有文件及其修改时间。
#[tracing::instrument(level = "debug", name = "cache.status", skip_all)]
async fn handle_cache_status(
    fs: &dyn fs::Fs,
    cache_dir: &Path,
    output: &CliRunOutput,
) -> Result<()> {
    tracing::info!(cache_dir = %cache_dir.display(), "listing cache status");

    let files: Vec<_> = fs
        .list_dir(cache_dir)
        .await
        .unwrap_or_default()
        .into_iter()
        .filter(|e| e.is_file)
        .map(|e| e.path)
        .collect();

    let mut entries: Vec<_> = Vec::new();
    for path in &files {
        if let Ok(metadata) = fs.metadata(path).await
            && let Some(modified) = metadata.modified
            && let Ok(dur) = modified.duration_since(std::time::UNIX_EPOCH)
        {
            entries.push(serde_json::json!({
                "file": path.file_name().unwrap_or_default().to_string_lossy(),
                "update_time": dur.as_secs(),
            }));
        }
    }

    output.print(&serde_json::to_string_pretty(&entries).unwrap_or_default());
    Ok(())
}

/// 清除缓存目录下所有文件。
#[tracing::instrument(level = "debug", name = "cache.clear", skip_all)]
async fn handle_cache_clear(
    fs: &dyn fs::Fs,
    cache_dir: &Path,
    output: &CliRunOutput,
) -> Result<()> {
    tracing::info!(cache_dir = %cache_dir.display(), "clearing cache");

    // Both listing and deletion are internal maintenance of a CLI-owned
    // directory: `cache_dir` and every target under it are constructed
    // entirely by CLI implementation code and reached through the
    // private-domain Fs instance — `wecom cache clear` being model-callable
    // does not move these paths into the workspace domain.
    let files: Vec<_> = fs
        .list_dir(cache_dir)
        .await
        .unwrap_or_default()
        .into_iter()
        .filter(|entry| entry.is_file)
        .map(|entry| entry.path)
        .collect();
    let mut removed = Vec::new();

    for path in &files {
        match fs.remove_file(path).await {
            Ok(()) => {
                removed.push(
                    path.file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string(),
                );
            }
            // Permission errors abort the whole clear; convert to the crate
            // error type so the caller renders it in the usual taxonomy.
            Err(error @ FsError::Permission(_)) => return Err(error.into()),
            Err(e) => {
                tracing::info!(path = %path.display(), error = %e, "Failed to remove cache file");
            }
        }
    }

    let output_val = if removed.is_empty() {
        json!({
            "status": "success",
            "message": "没有需要清除的缓存文件。",
        })
    } else {
        json!({
            "status": "success",
            "message": format!("已清除 {} 个缓存文件。", removed.len()),
            "removed": removed,
        })
    };

    output.print(&serde_json::to_string_pretty(&output_val).unwrap_or_default());
    Ok(())
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    //! ## 模块摘要：cache（缓存命令处理）
    //!
    //! ### 关键接口
    //! - [handle_cache_status] — 列出缓存目录中所有文件及其修改时间
    //! - [handle_cache_clear] — 清除所有缓存文件并返回统计信息
    //!
    //! ### 关键分支与异常路径
    //! - handle_cache_status：空目录返回空数组；有文件时返回文件列表
    //! - handle_cache_clear：空目录返回提示信息；有文件时删除并返回统计
    //! - handle_cache_cmd：status / clear 均经 client.private_fs() 访问私有域，
    //!   不受 run 的 workspace 实例覆盖影响
    //!
    //! ### 上下游交互
    //! - 上游：[commands::handle_cache_cmd]（接受 &CliRun）调用本模块
    //! - 下游：status / clear 经 Client 的私有域 Fs 实例访问缓存目录

    use std::fs as stdfs;
    use std::io::Write;
    // Unix-only: set_mode() used by the cfg(unix)-gated test below
    #[cfg(unix)]
    use std::os::unix::fs::PermissionsExt;

    use assert_json_diff::assert_json_eq;
    use tempfile::TempDir;

    use super::*;
    use crate::Client;
    use crate::fs::Fs;

    /// A cloneable buffer for capturing output.
    #[derive(Clone)]
    struct SharedBuf(std::sync::Arc<std::sync::Mutex<Vec<u8>>>);

    impl SharedBuf {
        fn new() -> Self {
            Self(std::sync::Arc::new(std::sync::Mutex::new(Vec::new())))
        }
        fn contents(&self) -> String {
            String::from_utf8_lossy(&self.0.lock().unwrap()).to_string()
        }
    }

    impl Write for SharedBuf {
        fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
            self.0.lock().unwrap().write(buf)
        }
        fn flush(&mut self) -> std::io::Result<()> {
            Ok(())
        }
    }

    fn build_client(home: &std::path::Path) -> Client {
        Client::builder().config_dir(home).build().unwrap()
    }

    // ── handle_cache_status ──

    /// 构造一个以 cache_dir 为工作目录的 TestFs。
    fn build_cache_fs(cache_dir: &std::path::Path) -> wecom_fs::SandboxedFs {
        wecom_fs::SandboxedFs::confined_to(&[cache_dir])
    }

    /// P0：[handle_cache_status] 在空缓存目录下返回空数组
    /// 条件：缓存目录已创建但无任何文件
    /// 断言：输出为合法 JSON 空数组
    #[tokio::test]
    async fn cache_status_empty_dir() {
        let tmp = TempDir::new().unwrap();
        let buf = SharedBuf::new();
        let cache_dir = tmp.path().join("cache");
        let output = CliRunOutput::new(buf.clone());

        stdfs::create_dir_all(&cache_dir).unwrap();
        let cache_fs = build_cache_fs(&cache_dir);

        let result = handle_cache_status(&cache_fs, &cache_dir, &output).await;
        assert!(result.is_ok());

        let output = buf.contents();
        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert!(parsed.as_array().unwrap().is_empty());
    }

    /// P1：[handle_cache_status] 缓存状态查询能列出已有文件
    /// 条件：缓存目录中包含 catalog.json 文件
    /// 断言：输出 JSON 数组长度为 1，且包含 "catalog.json" 文件名
    #[tokio::test]
    async fn cache_status_with_files() {
        let tmp = TempDir::new().unwrap();
        let buf = SharedBuf::new();
        let cache_dir = tmp.path().join("cache");
        let output = CliRunOutput::new(buf.clone());

        stdfs::create_dir_all(&cache_dir).unwrap();
        stdfs::write(cache_dir.join("catalog.json"), "{}").unwrap();
        let cache_fs = build_cache_fs(&cache_dir);

        let result = handle_cache_status(&cache_fs, &cache_dir, &output).await;
        assert!(result.is_ok());

        let output = buf.contents();
        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed.as_array().unwrap().len(), 1);
        assert_json_eq!(parsed[0]["file"], serde_json::json!("catalog.json"));
    }

    // ── handle_cache_clear ──

    /// P1：[handle_cache_clear] 缺失缓存无副作用
    /// 条件：缓存目录不存在
    /// 断言：返回成功且不创建目录
    #[tokio::test]
    async fn cache_clear_missing_directory() {
        let tmp = TempDir::new().unwrap();
        let buf = SharedBuf::new();
        let cache_dir = tmp.path().join("cache");
        let output = CliRunOutput::new(buf.clone());
        let cache_fs = build_cache_fs(&cache_dir);

        let result = handle_cache_clear(&cache_fs, &cache_dir, &output).await;
        assert!(result.is_ok());

        let text = buf.contents();
        assert!(text.contains("没有需要清除的缓存文件"));
        assert!(!cache_dir.exists());
    }

    /// P1：[handle_cache_clear] 清除缓存目录时删除所有文件并返回统计
    /// 条件：缓存目录有两个普通文件、子目录和指向外部的符号链接
    ///      （符号链接夹具仅 Unix 生效：Windows 创建链接需特权，CI agent 不保证）
    /// 断言：只删除两个普通文件，保留子目录、链接与外部目标
    /// （仅 Unix：符号链接夹具；Windows 创建 symlink 需特权，门控跳过）
    #[cfg(unix)]
    #[tokio::test]
    async fn cache_clear_removes_files() {
        let tmp = TempDir::new().unwrap();
        let buf = SharedBuf::new();
        let cache_dir = tmp.path().join("cache");
        let output = CliRunOutput::new(buf.clone());

        stdfs::create_dir_all(&cache_dir).unwrap();
        stdfs::write(cache_dir.join("old.json"), "x").unwrap();
        stdfs::write(cache_dir.join("stale.json"), "y").unwrap();
        let nested = cache_dir.join("nested");
        stdfs::create_dir(&nested).unwrap();
        stdfs::write(nested.join("keep.json"), "keep").unwrap();
        // Symlink fixture is Unix-only (see doc comment above).
        #[cfg(unix)]
        let (outside, link) = {
            let outside = tmp.path().join("outside.json");
            stdfs::write(&outside, "private").unwrap();
            let link = cache_dir.join("link.json");
            std::os::unix::fs::symlink(&outside, &link).unwrap();
            (outside, link)
        };
        let cache_fs = build_cache_fs(&cache_dir);

        let result = handle_cache_clear(&cache_fs, &cache_dir, &output).await;
        assert!(result.is_ok());

        // Files should be gone
        let remaining: Vec<_> = cache_fs
            .list_dir(&cache_dir)
            .await
            .unwrap()
            .into_iter()
            .filter(|e| e.is_file)
            .collect();
        assert!(remaining.is_empty());
        assert!(nested.join("keep.json").exists());
        #[cfg(unix)]
        {
            assert!(
                stdfs::symlink_metadata(&link)
                    .unwrap()
                    .file_type()
                    .is_symlink()
            );
            assert_eq!(stdfs::read_to_string(&outside).unwrap(), "private");
        }

        let output = buf.contents();
        assert!(output.contains("已清除 2 个缓存文件"));
    }

    // ── handle_cache_cmd（私有域实例可达性守卫）──

    /// P0：[handle_cache_cmd] `cache status` 经 client.private_fs() 访问缓存目录。
    /// 条件：workspace_fs 全拒绝（ErrFs），run 再覆盖一个不相关的 workspace 实例；
    ///       private_fs 为以 config_dir 为 root 的真实沙箱
    /// 断言：status 成功并返回 entry.json（私有域与 run 级 workspace 覆盖无关）
    #[tokio::test]
    async fn cache_cmd_status_uses_private_fs() {
        let tmp = TempDir::new().unwrap();
        let buf = SharedBuf::new();
        let client = Client::builder()
            .config_dir(tmp.path())
            .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
            .workspace_fs(std::sync::Arc::new(crate::fs::testing::ErrFs))
            .build()
            .unwrap();
        let cache_dir = client.cache_dir();
        stdfs::create_dir_all(&cache_dir).unwrap();
        stdfs::write(cache_dir.join("entry.json"), "{}").unwrap();

        let cache_matches = build_cache_cmd().get_matches_from(["cache", "status"]);
        let run = client
            .run(vec!["test".into()])
            .output(CliRunOutput::new(buf.clone()))
            .fs(std::sync::Arc::new(crate::fs::testing::ErrFs));
        let result = handle_cache_cmd(&run, &cache_matches).await;
        assert!(result.is_ok(), "cache status failed: {result:?}");

        let output = buf.contents();
        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        let arr = parsed.as_array().unwrap();
        assert_eq!(arr.len(), 1);
        assert_json_eq!(arr[0]["file"], serde_json::json!("entry.json"));
    }

    /// P0：`cache clear` 列举与删除均经 client.private_fs()（CLI 自有缓存目录）。
    /// 条件：workspace_fs 全拒绝（ErrFs）；private_fs 为以 config_dir 为 root 的真实沙箱
    /// 断言：clear 成功删除两个缓存文件并输出统计
    #[tokio::test]
    async fn cache_cmd_clear_uses_private_fs() {
        let tmp = TempDir::new().unwrap();
        let buf = SharedBuf::new();
        let client = Client::builder()
            .config_dir(tmp.path())
            .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
            .workspace_fs(std::sync::Arc::new(crate::fs::testing::ErrFs))
            .build()
            .unwrap();
        let cache_dir = client.cache_dir();
        stdfs::create_dir_all(&cache_dir).unwrap();
        stdfs::write(cache_dir.join("a.json"), "x").unwrap();
        stdfs::write(cache_dir.join("b.json"), "y").unwrap();

        let cache_matches = build_cache_cmd().get_matches_from(["cache", "clear"]);
        let run = client
            .run(vec!["test".into()])
            .output(CliRunOutput::new(buf.clone()));
        let result = handle_cache_cmd(&run, &cache_matches).await;
        assert!(result.is_ok(), "cache clear failed: {result:?}");

        assert_eq!(stdfs::read_dir(&cache_dir).unwrap().count(), 0);
        let output = buf.contents();
        assert!(output.contains("已清除 2 个缓存文件"));
    }

    /// P0：双域隔离：workspace 实例够不到 config_dir，private 实例够不到 cwd
    /// 条件：workspace_fs roots=[cwd] + extra deny home；private_fs roots=[home]
    /// 断言：workspace_fs 读 home 内文件被拒；private_fs 读 cwd 内文件被拒
    #[tokio::test]
    async fn private_and_workspace_fs_are_mutually_isolated() {
        let home = TempDir::new().unwrap();
        let cwd = TempDir::new().unwrap();
        stdfs::write(home.path().join("config.json"), "{}").unwrap();
        stdfs::write(cwd.path().join("main.rs"), "fn main() {}").unwrap();

        let private_fs = wecom_fs::SandboxedFs::confined_to(&[home.path()]);
        let workspace_fs = wecom_fs::SandboxedFs::new().with_policy(
            wecom_fs::Policy::new()
                .with_allowed_dirs(&[cwd.path()])
                .with_deny(
                    wecom_fs::DenyRule::globs([home.path().to_string_lossy().into_owned()])
                        .expect("test deny glob must compile"),
                ),
        );

        let err = workspace_fs
            .read_to_string(&home.path().join("config.json"))
            .await
            .unwrap_err();
        assert!(
            matches!(err, wecom_fs::Error::Permission(_)),
            "workspace_fs must not reach config_dir: {err}"
        );
        let err = private_fs
            .read_to_string(&cwd.path().join("main.rs"))
            .await
            .unwrap_err();
        assert!(
            matches!(err, wecom_fs::Error::Permission(_)),
            "private_fs must not reach cwd: {err}"
        );
    }

    // ── build_cache_cmd ──

    /// P1：[build_cache_cmd] 构造 cache 子命令并隐藏
    /// 条件：调用 build_cache_cmd()
    /// 断言：命令名为 "cache" 且 is_hide_set() 为 true
    #[test]
    fn build_cache_cmd_returns_command() {
        let cmd = build_cache_cmd();
        assert_eq!(cmd.get_name(), "cache");
        // cache 命令对用户隐藏
        assert!(cmd.is_hide_set());
    }

    // ── handle_cache_cmd 错误路径 ──

    /// P2：[handle_cache_cmd] 未知子命令返回 Error::Other
    /// 条件：传入非 status/clear 的子命令匹配（空 ArgMatches）
    /// 断言：handle_cache_cmd() 返回 Err
    #[tokio::test]
    async fn cache_cmd_unknown_subcommand_returns_error() {
        let tmp = TempDir::new().unwrap();
        let buf = SharedBuf::new();
        let client = build_client(tmp.path());
        let run = client
            .run(vec!["test".into()])
            .output(CliRunOutput::new(buf.clone()));
        // 构造一个空的 ArgMatches（不会匹配任何子命令）
        let empty_matches = clap::Command::new("dummy").get_matches_from(Vec::<&str>::new());
        let result = handle_cache_cmd(&run, &empty_matches).await;
        assert!(result.is_err());
    }

    // ── handle_cache_clear 移除文件失败 ──

    /// P2：[handle_cache_clear] 移除文件失败不中断清除流程
    /// 条件：缓存目录中存在一个文件，但移除时模拟失败场景（chmod 只读目录，
    ///      仅 Unix 可构造：Windows 目录只读属性不阻止删除其中文件）
    /// 断言：函数成功返回（Err 分支被静默吞掉）
    #[cfg(unix)]
    #[tokio::test]
    async fn cache_clear_remove_file_error_does_not_abort() {
        let tmp = TempDir::new().unwrap();
        let buf = SharedBuf::new();
        let cache_dir = tmp.path().join("cache");
        let output = CliRunOutput::new(buf.clone());

        stdfs::create_dir_all(&cache_dir).unwrap();
        let file = cache_dir.join("locked.json");
        stdfs::write(&file, "x").unwrap();
        // Remove write permission from cache dir to trigger error on list/remove
        let mut perms = stdfs::metadata(&cache_dir).unwrap().permissions();
        perms.set_mode(0o500); // read-only dir: r-x------
        stdfs::set_permissions(&cache_dir, perms).unwrap();
        let cache_fs = build_cache_fs(&cache_dir);

        let result = handle_cache_clear(&cache_fs, &cache_dir, &output).await;
        assert!(result.is_ok());

        // Restore permissions for cleanup
        let mut perms = stdfs::metadata(&cache_dir).unwrap().permissions();
        perms.set_mode(0o700); // rwx------
        stdfs::set_permissions(&cache_dir, perms).unwrap();
    }
}
