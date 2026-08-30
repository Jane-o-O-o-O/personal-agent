use std::{collections::HashSet, ffi::OsStr};

const MAX_DEPTH: usize = 64;
const ENV_PREFIX_MARKERS: [(&str, &str); 10] = [
    ("DSH_", "DSH"),
    ("QODER_", "QODER"),
    ("QODERCN_", "QODER"),
    ("QODERCLI_", "QODER"),
    ("TRAE_", "TRAE"),
    ("COMATE_", "COMATE"),
    ("CODEBUDDY_", "CODEBUDDY"),
    ("KNOT_", "KNOT"),
    ("WORKBUDDY_", "WORKBUDDY"),
    ("ZCODE_", "ZCODE"),
];

struct NodeInfo {
    name: Option<String>,
    ppid: Option<u32>,
    path: Option<String>,
}

struct ProcessNode {
    name: String,
    path: Option<String>,
}

enum ChainEnd {
    Root,
    Exited,
    Loop,
    DepthLimited,
}

struct ProcessChain {
    nodes: Vec<ProcessNode>,
    end: ChainEnd,
}

impl ProcessChain {
    #[cfg(test)]
    fn render(&self, max_len: Option<usize>) -> String {
        self.render_with_env(max_len, std::iter::empty::<&str>())
    }

    fn render_with_env<I, S>(&self, max_len: Option<usize>, env_names: I) -> String
    where
        I: IntoIterator<Item = S>,
        S: AsRef<OsStr>,
    {
        let mut names: Vec<String> = self.nodes.iter().map(|node| node.name.clone()).collect();
        if cfg!(target_os = "macos") {
            decorate_macos_process_names(&mut names, &self.nodes);
        }
        decorate_current_process_name(&mut names, env_names);

        let mut parts: Vec<&str> = names.iter().map(|s| s.as_str()).collect();
        match self.end {
            ChainEnd::Root => {}
            ChainEnd::Exited => parts.push("(exited?)"),
            ChainEnd::Loop => parts.push("(loop-detected)"),
            ChainEnd::DepthLimited => parts.push("..."),
        }

        let Some(max) = max_len else {
            return parts.join(" < ");
        };

        let mut out = String::new();
        for (i, p) in parts.iter().enumerate() {
            let sep = if i == 0 { "" } else { " < " };
            if out.len() + sep.len() + p.len() > max {
                out.push_str(if out.is_empty() { "..." } else { " < ..." });
                break;
            }
            out.push_str(sep);
            out.push_str(p);
        }
        out
    }
}

fn decorate_current_process_name<I, S>(names: &mut [String], env_names: I)
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    let Some(name) = names.first_mut() else {
        return;
    };

    let mut prefix_matches = [false; ENV_PREFIX_MARKERS.len()];
    for env_name in env_names {
        let env_name = env_name.as_ref().to_string_lossy().to_ascii_uppercase();
        for (index, (prefix, _)) in ENV_PREFIX_MARKERS.iter().enumerate() {
            prefix_matches[index] |= env_name.starts_with(prefix);
        }
    }
    let mut markers = Vec::new();
    for (index, (_, marker)) in ENV_PREFIX_MARKERS.into_iter().enumerate() {
        if prefix_matches[index] && !markers.contains(&marker) {
            markers.push(marker);
        }
    }

    if !markers.is_empty() {
        name.push('[');
        name.push_str(&markers.join(","));
        name.push(']');
    }
}

fn decorate_macos_process_names(names: &mut [String], nodes: &[ProcessNode]) {
    let app_names: Vec<Option<String>> = nodes
        .iter()
        .map(|node| node.path.as_deref().and_then(app_bundle_names))
        .collect();

    if app_names.iter().any(Option::is_some) {
        for (name, app_names) in names.iter_mut().zip(app_names) {
            if let Some(app_names) = app_names {
                name.push('[');
                name.push_str(&app_names);
                name.push(']');
            }
        }
        return;
    }

    if let Some((index, path)) = nodes.iter().enumerate().rev().find_map(|(index, node)| {
        node.path
            .as_deref()
            .map(|path| (index, redact_macos_username(path)))
    }) {
        names[index].push_str("[path=");
        names[index].push_str(&path);
        names[index].push(']');
    }
}

fn app_bundle_names(path: &str) -> Option<String> {
    let names = std::path::Path::new(path)
        .components()
        .filter_map(|component| {
            let component = component.as_os_str().to_string_lossy();
            (component.len() > ".app".len() && component.ends_with(".app"))
                .then(|| component.into_owned())
        })
        .collect::<Vec<_>>();

    (!names.is_empty()).then(|| names.join(" - "))
}

fn redact_macos_username(path: &str) -> String {
    const USERS_PREFIX: &str = "/users/";

    let Some(prefix) = path.get(..USERS_PREFIX.len()) else {
        return path.to_string();
    };
    if !prefix.eq_ignore_ascii_case(USERS_PREFIX) {
        return path.to_string();
    }

    let rest = &path[USERS_PREFIX.len()..];
    match rest.find('/') {
        Some(end) if end > 0 => format!("{}*{}", &path[..USERS_PREFIX.len()], &rest[end..]),
        None if !rest.is_empty() => format!("{}*", &path[..USERS_PREFIX.len()]),
        _ => path.to_string(),
    }
}

fn build_chain<F>(start: u32, lookup: F) -> ProcessChain
where
    F: Fn(u32) -> Option<NodeInfo>,
{
    let mut nodes = Vec::new();
    let mut visited = HashSet::new();
    let mut cur = start;

    for _ in 0..MAX_DEPTH {
        let Some(info) = lookup(cur) else {
            return ProcessChain {
                nodes,
                end: ChainEnd::Exited,
            };
        };

        if !visited.insert(cur) {
            return ProcessChain {
                nodes,
                end: ChainEnd::Loop,
            };
        }

        let NodeInfo { name, ppid, path } = info;
        nodes.push(ProcessNode {
            name: name.unwrap_or_else(|| "[unknown]".to_string()),
            path,
        });

        match ppid {
            None => {
                return ProcessChain {
                    nodes,
                    end: ChainEnd::Root,
                };
            }
            Some(ppid) if ppid == 0 || ppid == cur => {
                return ProcessChain {
                    nodes,
                    end: ChainEnd::Root,
                };
            }
            Some(ppid) => cur = ppid,
        }
    }

    ProcessChain {
        nodes,
        end: ChainEnd::DepthLimited,
    }
}

pub fn capture_current_capped(max_len: usize) -> String {
    build_chain(std::process::id(), platform::info)
        .render_with_env(Some(max_len), std::env::vars_os().map(|(name, _)| name))
}

mod platform {
    use super::NodeInfo;

    #[cfg(target_os = "macos")]
    pub(super) fn info(pid: u32) -> Option<NodeInfo> {
        use std::mem;

        let mut bsd: libc::proc_bsdinfo = unsafe { mem::zeroed() };
        let size = mem::size_of::<libc::proc_bsdinfo>() as i32;
        let n = unsafe {
            libc::proc_pidinfo(
                pid as i32,
                libc::PROC_PIDTBSDINFO,
                0,
                &mut bsd as *mut _ as *mut libc::c_void,
                size,
            )
        };
        if n != size {
            return None;
        }

        let read_cstr = |ptr: *const libc::c_char| {
            let s = unsafe { std::ffi::CStr::from_ptr(ptr) }
                .to_string_lossy()
                .into_owned();
            (!s.is_empty()).then_some(s)
        };
        let name = read_cstr(bsd.pbi_name.as_ptr()).or_else(|| read_cstr(bsd.pbi_comm.as_ptr()));
        Some(NodeInfo {
            name,
            ppid: Some(bsd.pbi_ppid),
            path: process_path(pid),
        })
    }

    #[cfg(target_os = "macos")]
    fn process_path(pid: u32) -> Option<String> {
        let mut buffer = [0_u8; libc::PROC_PIDPATHINFO_MAXSIZE as usize];
        let size = unsafe {
            libc::proc_pidpath(
                pid as i32,
                buffer.as_mut_ptr().cast::<libc::c_void>(),
                buffer.len() as u32,
            )
        };
        if size <= 0 {
            return None;
        }

        let bytes = &buffer[..size as usize];
        let end = bytes
            .iter()
            .position(|byte| *byte == 0)
            .unwrap_or(bytes.len());
        let path = String::from_utf8_lossy(&bytes[..end]).into_owned();
        (!path.is_empty()).then_some(path)
    }

    // /proc 是内核虚拟文件系统而非用户文件，不纳入 Fs 沙箱（沙箱根不可能包含
    // /proc，经 Fs 读取只会被沙箱拒绝）；pid 来自 OS 进程父链而非用户输入，
    // 路径无注入面，属正当绕过。
    #[cfg(target_os = "linux")]
    #[allow(clippy::disallowed_methods)]
    pub(super) fn info(pid: u32) -> Option<NodeInfo> {
        let stat = std::fs::read_to_string(format!("/proc/{pid}/stat")).ok()?;
        let ppid = super::parse_ppid_from_stat(&stat)?;
        let name = std::fs::read_to_string(format!("/proc/{pid}/comm"))
            .ok()
            .map(|s| s.trim_end().to_string())
            .filter(|s| !s.is_empty());
        Some(NodeInfo {
            name,
            ppid: Some(ppid),
            path: None,
        })
    }

    #[cfg(target_os = "windows")]
    pub(super) fn info(pid: u32) -> Option<NodeInfo> {
        use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE};
        use windows_sys::Win32::System::Diagnostics::ToolHelp::{
            CreateToolhelp32Snapshot, PROCESSENTRY32W, Process32FirstW, Process32NextW,
            TH32CS_SNAPPROCESS,
        };

        unsafe {
            let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if snapshot == INVALID_HANDLE_VALUE {
                return None;
            }

            let mut entry: PROCESSENTRY32W = std::mem::zeroed();
            entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;

            let mut result = None;
            if Process32FirstW(snapshot, &mut entry) != 0 {
                loop {
                    if entry.th32ProcessID == pid {
                        let len = entry
                            .szExeFile
                            .iter()
                            .position(|&c| c == 0)
                            .unwrap_or(entry.szExeFile.len());
                        let name = String::from_utf16_lossy(&entry.szExeFile[..len]);
                        result = Some(NodeInfo {
                            name: (!name.is_empty()).then_some(name),
                            ppid: Some(entry.th32ParentProcessID),
                            path: None,
                        });
                        break;
                    }
                    if Process32NextW(snapshot, &mut entry) == 0 {
                        break;
                    }
                }
            }

            CloseHandle(snapshot);
            result
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    pub(super) fn info(pid: u32) -> Option<NodeInfo> {
        (pid == std::process::id()).then(|| NodeInfo {
            name: std::env::current_exe()
                .ok()
                .and_then(|p| p.file_name().map(|s| s.to_string_lossy().into_owned())),
            ppid: None,
            path: None,
        })
    }
}

#[cfg(any(target_os = "linux", test))]
fn parse_ppid_from_stat(stat: &str) -> Option<u32> {
    let rparen = stat.rfind(')')?;
    let rest = stat.get(rparen + 1..)?;
    rest.split_whitespace().nth(1)?.parse().ok()
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;

    fn map_lookup(
        m: HashMap<u32, (Option<&'static str>, Option<u32>)>,
    ) -> impl Fn(u32) -> Option<NodeInfo> {
        move |pid| {
            m.get(&pid).map(|(name, ppid)| NodeInfo {
                name: name.map(|s| s.to_string()),
                ppid: *ppid,
                path: None,
            })
        }
    }

    fn node(name: &str, path: &str) -> ProcessNode {
        ProcessNode {
            name: name.to_string(),
            path: Some(path.to_string()),
        }
    }

    fn single_node_chain() -> ProcessChain {
        build_chain(
            10,
            map_lookup(HashMap::from([(10, (Some("wecom-cli"), Some(0)))])),
        )
    }

    struct EnvMarkerCase {
        marker: &'static str,
        matched_tags: &'static [&'static str],
        ignored: &'static [&'static str],
    }

    const ENV_MARKER_CASES: &[EnvMarkerCase] = &[
        EnvMarkerCase {
            marker: "DSH",
            matched_tags: &["DSH_SHELL", "DSH_SESSION_ID", "DSH_HOME", "DSH_FUTURE"],
            ignored: &["DSH", "OTHER_DSH_VALUE"],
        },
        EnvMarkerCase {
            marker: "QODER",
            matched_tags: &[
                "QODER_SECURITY_SCAN_SETTINGS_JSON",
                "QODER_WINDOWS_SHELL_KIND",
                "QODERCN_AGENT",
                "QODERCN_CLI",
                "QODERCLI_RUNTIME_PACKAGING",
            ],
            ignored: &["QODER", "QODERCN", "QODERCLI", "OTHER_QODER_VALUE"],
        },
        EnvMarkerCase {
            marker: "TRAE",
            matched_tags: &[
                "TRAE_USER_CLOUDIDE_TOKEN_BLOB",
                "TRAE_BRAND_NAME",
                "TRAE_STATIC_CLIENT_TYPE",
                "TRAE_SANDBOX_SBOX_ID",
                "TRAE_SANDBOX_LOG_DIR",
            ],
            ignored: &["TRAE", "OTHER_TRAE_VALUE"],
        },
        EnvMarkerCase {
            marker: "COMATE",
            matched_tags: &[
                "COMATE_CLIENT_SCENE",
                "COMATE_CLIENT_TYPE",
                "COMATE_ENGINE_PLATFORM",
                "COMATE_VERSION",
            ],
            ignored: &["COMATE", "OTHER_COMATE_VALUE"],
        },
        EnvMarkerCase {
            marker: "CODEBUDDY",
            matched_tags: &[
                "CODEBUDDY_CONVERSATION_MESSAGE_ID",
                "CODEBUDDY_COPILOT_INTERNET_ENVIRONMENT",
                "CODEBUDDY_SAFE_DELETE_ENABLED",
                "CODEBUDDY_SESSION_ID",
                "CODEBUDDY_TOOL_CALL_ID",
            ],
            ignored: &["CODEBUDDY", "OTHER_CODEBUDDY_VALUE"],
        },
        EnvMarkerCase {
            marker: "KNOT",
            matched_tags: &["KNOT_JWT_TOKEN", "KNOT_AGENT_ID"],
            ignored: &["KNOT", "OTHER_KNOT_VALUE"],
        },
        EnvMarkerCase {
            marker: "WORKBUDDY",
            matched_tags: &[
                "WORKBUDDY_CONNECTOR_PROXY_FINGERPRINT",
                "WORKBUDDY_PRODUCT_NAME",
                "WORKBUDDY_RESOURCES_PATH",
                "WORKBUDDY_STARTUP_PID",
                "WORKBUDDY_USER_DATA_DIR",
            ],
            ignored: &["WORKBUDDY", "OTHER_WORKBUDDY_VALUE", "WebStorm"],
        },
        EnvMarkerCase {
            marker: "ZCODE",
            matched_tags: &[
                "ZCODE_APP_VERSION",
                "ZCODE_PROCESS_LABEL",
                "ZCODE_WINDOWS_APP_INSTALL_DIR",
            ],
            ignored: &[
                "ZCODE",
                "OTHER_ZCODE_VALUE",
                "ZAI_BUSINESS_BASE_URL",
                "ZAI_OAUTH_CLIENT_ID",
            ],
        },
    ];

    #[test]
    fn env_marker_cases_cover_every_marker_in_the_table() {
        let mut expected: Vec<&str> = ENV_PREFIX_MARKERS.iter().map(|(_, m)| *m).collect();
        expected.dedup();
        let actual: Vec<&str> = ENV_MARKER_CASES.iter().map(|c| c.marker).collect();
        assert_eq!(actual, expected, "测试表与 ENV_PREFIX_MARKERS 不一致");
    }

    #[test]
    fn env_marker_has_matched_tags_once_per_brand() {
        let chain = single_node_chain();
        for case in ENV_MARKER_CASES {
            assert_eq!(
                chain.render_with_env(None, case.matched_tags),
                format!("wecom-cli[{}]", case.marker),
                "marker={}",
                case.marker
            );
        }
    }

    #[test]
    fn env_marker_requires_the_underscore() {
        let chain = single_node_chain();
        for case in ENV_MARKER_CASES {
            assert_eq!(
                chain.render_with_env(None, case.ignored),
                "wecom-cli",
                "marker={}",
                case.marker
            );
        }
    }

    #[test]
    fn env_marker_prefix_is_case_insensitive() {
        assert_eq!(
            single_node_chain().render_with_env(
                None,
                ["dsh_shell", "Trae_Brand_Name", "CodeBuddy_Session_Id"],
            ),
            "wecom-cli[DSH,TRAE,CODEBUDDY]"
        );
    }

    #[test]
    fn with_env_prefix_is_not_a_marker() {
        assert_eq!(
            single_node_chain().render_with_env(
                None,
                ["WITH_BUNDLE_IDENTIFIER", "WITH_HOST_PID", "WITH_OPENSSL"],
            ),
            "wecom-cli"
        );
    }

    #[test]
    fn env_markers_share_one_decoration_in_table_order() {
        let mut env_names: Vec<&str> = ENV_MARKER_CASES
            .iter()
            .flat_map(|case| case.matched_tags.iter().copied())
            .collect();
        env_names.reverse();

        assert_eq!(
            single_node_chain().render_with_env(None, env_names),
            "wecom-cli[DSH,QODER,TRAE,COMATE,CODEBUDDY,KNOT,WORKBUDDY,ZCODE]"
        );
    }

    #[test]
    fn env_markers_only_decorate_current_process() {
        let mut names = vec!["wecom-cli".to_string(), "parent".to_string()];

        decorate_current_process_name(&mut names, ["DSH_SHELL", "KNOT_JWT_TOKEN"]);

        assert_eq!(names, ["wecom-cli[DSH,KNOT]", "parent"]);
    }

    #[test]
    fn macos_path_collects_all_app_bundle_names() {
        assert_eq!(
            app_bundle_names(
                "/Applications/MyApp.app/Contents/Frameworks/Electron.app/Contents/MacOS/Electron"
            ),
            Some("MyApp.app - Electron.app".to_string())
        );
        assert_eq!(app_bundle_names("/usr/local/bin/node"), None);
    }

    #[test]
    fn macos_decorates_each_process_with_all_app_bundle_names() {
        let nodes = vec![
            node(
                "Electron",
                "/Applications/MyApp.app/Contents/Frameworks/Electron.app/Contents/MacOS/Electron",
            ),
            node("helper", "/Applications/Helper.app/Contents/MacOS/helper"),
            node("launchd", "/sbin/launchd"),
        ];
        let mut names = nodes
            .iter()
            .map(|node| node.name.clone())
            .collect::<Vec<_>>();

        decorate_macos_process_names(&mut names, &nodes);

        assert_eq!(
            names,
            [
                "Electron[MyApp.app - Electron.app]",
                "helper[Helper.app]",
                "launchd"
            ]
        );
    }

    #[test]
    fn macos_without_app_reports_users_path_with_redacted_username() {
        let nodes = vec![
            node("wecom-cli", "/opt/wecom/bin/wecom-cli"),
            node("node", "/usr/local/bin/node"),
            node("Electron", "/Users/alice/tools/Electron"),
        ];
        let mut names = nodes
            .iter()
            .map(|node| node.name.clone())
            .collect::<Vec<_>>();

        decorate_macos_process_names(&mut names, &nodes);

        assert_eq!(
            names,
            [
                "wecom-cli",
                "node",
                "Electron[path=/Users/*/tools/Electron]"
            ]
        );
    }

    #[test]
    fn macos_users_path_redacts_only_username() {
        assert_eq!(
            redact_macos_username("/Users/alice/workspace/project/bin"),
            "/Users/*/workspace/project/bin"
        );
        assert_eq!(
            redact_macos_username("/users/alice/Electron"),
            "/users/*/Electron"
        );
        assert_eq!(redact_macos_username("/Users/alice"), "/Users/*");
        assert_eq!(redact_macos_username("/Users/"), "/Users/");
        assert_eq!(
            redact_macos_username("/UsersBackup/alice/Electron"),
            "/UsersBackup/alice/Electron"
        );
    }

    #[test]
    fn macos_without_app_reports_non_users_full_path_unchanged() {
        let nodes = vec![
            node("wecom-cli", "/opt/wecom/bin/wecom-cli"),
            node("Electron", "/opt/agent/bin/Electron"),
        ];
        let mut names = nodes
            .iter()
            .map(|node| node.name.clone())
            .collect::<Vec<_>>();

        decorate_macos_process_names(&mut names, &nodes);

        assert_eq!(
            names,
            ["wecom-cli", "Electron[path=/opt/agent/bin/Electron]"]
        );
    }

    #[test]
    fn builds_chain_to_root() {
        let m = HashMap::from([(10, (Some("a"), Some(20))), (20, (Some("b"), Some(0)))]);
        let chain = build_chain(10, map_lookup(m));
        assert_eq!(chain.render(None), "a < b");
    }

    #[test]
    fn marks_exited_when_parent_missing() {
        let m = HashMap::from([(10, (Some("a"), Some(20)))]);
        let chain = build_chain(10, map_lookup(m));
        assert_eq!(chain.render(None), "a < (exited?)");
    }

    #[test]
    fn start_missing_yields_only_marker() {
        let chain = build_chain(99, map_lookup(HashMap::new()));
        assert_eq!(chain.render(None), "(exited?)");
    }

    #[test]
    fn detects_loop() {
        let m = HashMap::from([(10, (Some("a"), Some(20))), (20, (Some("b"), Some(10)))]);
        let chain = build_chain(10, map_lookup(m));
        assert_eq!(chain.render(None), "a < b < (loop-detected)");
    }

    #[test]
    fn self_reference_is_root() {
        let m = HashMap::from([(10, (Some("a"), Some(10)))]);
        let chain = build_chain(10, map_lookup(m));
        assert_eq!(chain.render(None), "a");
    }

    #[test]
    fn stops_at_max_depth() {
        let mut m = HashMap::new();
        for i in 0..(MAX_DEPTH as u32 + 10) {
            m.insert(i, (Some("p"), Some(i + 1)));
        }
        let chain = build_chain(0, map_lookup(m));
        assert!(chain.render(None).ends_with("..."));
    }

    #[test]
    fn node_without_name_renders_unknown() {
        let m = HashMap::from([(7, (None, None))]);
        let chain = build_chain(7, map_lookup(m));
        assert_eq!(chain.render(None), "[unknown]");
    }

    #[test]
    fn capped_truncates_at_node_boundary() {
        let m = HashMap::from([
            (1, (Some("aaaa"), Some(2))),
            (2, (Some("bbbb"), Some(3))),
            (3, (Some("cccc"), Some(4))),
            (4, (Some("dddd"), Some(0))),
        ]);
        let chain = build_chain(1, map_lookup(m));
        let out = chain.render(Some(14));
        assert!(out.starts_with("aaaa < bbbb"), "应保留近端: {out}");
        assert!(out.ends_with("..."), "应以省略号收尾: {out}");
        assert!(out.len() <= 14 + 6, "长度受控: {out}");
    }

    #[test]
    fn capture_current_capped_is_non_empty() {
        let text = capture_current_capped(512);
        assert!(!text.is_empty());
    }

    #[test]
    fn parse_ppid_basic() {
        let stat = "1234 (bash) S 1000 1234 1000 34816 1234 4194304 ...";
        assert_eq!(parse_ppid_from_stat(stat), Some(1000));
    }

    #[test]
    fn parse_ppid_with_tricky_comm() {
        let stat = "42 (weird )( name) S 7 42 7 0 -1 ...";
        assert_eq!(parse_ppid_from_stat(stat), Some(7));
    }

    #[test]
    fn parse_ppid_malformed() {
        assert_eq!(parse_ppid_from_stat("garbage-without-paren"), None);
        assert_eq!(parse_ppid_from_stat("1 (only-state) S"), None);
    }
}
