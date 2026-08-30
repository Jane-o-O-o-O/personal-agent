//! Filename sanitization for safe cross-platform on-disk use.

const WINDOWS_RESERVED: &[&str] = &[
    "con", "prn", "aux", "nul", "com0", "com1", "com2", "com3", "com4", "com5", "com6", "com7",
    "com8", "com9", "lpt0", "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9",
];

fn is_illegal_char(ch: char) -> bool {
    matches!(ch, '/' | '?' | '<' | '>' | '\\' | ':' | '*' | '|' | '"')
}

fn is_control_char(ch: char) -> bool {
    let code = ch as u32;
    (code <= 0x1f) || (0x80..=0x9f).contains(&code)
}

fn is_windows_reserved(name: &str) -> bool {
    let base = name.split_once(".").map(|(base, _)| base).unwrap_or(name);
    for &reserved in WINDOWS_RESERVED {
        if base.eq_ignore_ascii_case(reserved) {
            return true;
        }
    }
    false
}

/// Sanitize a filename for safe use on all platforms.
///
/// Leading/trailing whitespace is trimmed; illegal / control characters
/// become `_`; empty or all-dot names get an `_` prefix; on Windows a
/// trailing dot and reserved device names are additionally guarded; the
/// result is truncated to 255 bytes at a character boundary.
pub fn sanitize_filename(name: &str) -> String {
    sanitize_filename_inner(name, cfg!(windows))
}

fn sanitize_filename_inner(input: &str, windows: bool) -> String {
    let mut name = String::new();

    for c in input.trim().chars() {
        name.push(if is_illegal_char(c) || is_control_char(c) {
            '_'
        } else {
            c
        });
    }

    if name.is_empty() {
        name.push('_');
    }

    if name.chars().all(|c| c == '.') {
        name.insert(0, '_');
    }

    if name.len() > 255 {
        // `String::truncate` 是字节语义且要求字符边界——多字节文件名在边界
        // 中间截断会 panic。退回到不超过 255 字节的最后一个字符边界。
        let end = name
            .char_indices()
            .map(|(i, _)| i)
            .take_while(|&i| i <= 255)
            .last()
            .unwrap_or(0);
        name.truncate(end);
    }

    if windows {
        if name.ends_with('.') {
            name.push('_');
        }
        if is_windows_reserved(&name) {
            name.insert(0, '_');
        }
    }

    name
}

// ══════════════════════════════════════════════════════════════
//  Tests
// ══════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    //! ## 模块摘要：sanitize（文件名净化）
    //!
    //! ### 关键接口
    //! - [sanitize_filename] — 净化文件名（内部按平台参数化为 [sanitize_filename_inner]）
    //! - [is_illegal_char] / [is_control_char] / [is_windows_reserved] — 字符检查
    //!
    //! ### 关键分支与异常路径
    //! - 非法字符/控制字符 → 替换为下划线
    //! - 空输入/全点号 → 前补下划线
    //! - 超长文件名 → 按字符边界截断至 ≤255 字节（多字节不 panic）
    //! - Windows 模式：尾部点号追加下划线、保留名前加下划线（首尾空格已由 trim 去除）
    //!
    //! ### 上下游交互
    //! - 上游：wecom 的下载与落盘链路（经 `wecom::fs::sanitize_filename` 委托）、
    //!   本 crate 的 `lib.rs` re-export
    //! - 下游：仅依赖 `std::string` / `std::char` 字符处理

    use super::*;

    // ── sanitize_filename_inner ──

    /// P0：[sanitize_filename_inner] 非法字符（/ ? < > \ : * | "）被替换为下划线
    /// 条件：输入包含多种非法字符的字符串
    /// 断言：非法字符全部替换为 _
    #[test]
    fn sanitize_replaces_illegal_chars() {
        assert_eq!(sanitize_filename_inner("a/b:c*d", false), "a_b_c_d");
        assert_eq!(
            sanitize_filename_inner("file<name>.txt", false),
            "file_name_.txt"
        );
    }

    /// P0：[sanitize_filename_inner] 控制字符（如 \x00、\x1f）被替换为下划线
    /// 条件：输入包含控制字符的字符串
    /// 断言：控制字符替换为 _
    #[test]
    fn sanitize_replaces_control_chars() {
        assert_eq!(
            sanitize_filename_inner("hello\x00world", false),
            "hello_world"
        );
        assert_eq!(sanitize_filename_inner("a\x1fb", false), "a_b");
    }

    /// P1：[sanitize_filename_inner] 空输入或纯空格输入返回 "_"
    /// 条件：输入 "" 或 "   "
    /// 断言：返回 "_"
    #[test]
    fn sanitize_empty_input() {
        assert_eq!(sanitize_filename_inner("", false), "_");
        assert_eq!(sanitize_filename_inner("   ", false), "_");
    }

    /// P1：[sanitize_filename_inner] 全点号文件名前补下划线
    /// 条件：输入 "..." 或 "."
    /// 断言：返回 "_..." 或 "_."
    #[test]
    fn sanitize_all_dots() {
        assert_eq!(sanitize_filename_inner("...", false), "_...");
        assert_eq!(sanitize_filename_inner(".", false), "_.");
    }

    /// P0：[sanitize_filename_inner] 文件名前后空格被 trim
    /// 条件：输入 "  hello  "
    /// 断言：返回 "hello"
    #[test]
    fn sanitize_trims_whitespace() {
        assert_eq!(sanitize_filename_inner("  hello  ", false), "hello");
    }

    /// P1：[sanitize_filename_inner] 超长文件名被截断至 255 字节
    /// 条件：输入 300 个字符的字符串
    /// 断言：输出长度为 255
    #[test]
    fn sanitize_truncates_long_names() {
        let long_name = "a".repeat(300);
        let result = sanitize_filename_inner(&long_name, false);
        assert_eq!(result.len(), 255);
    }

    /// P2：[sanitize_filename_inner] 超长多字节文件名按字符边界截断而不 panic
    /// 条件：ASCII 前缀 + 中文重复共 601 字节，第 255 字节落在某个字符中间
    /// 断言：不 panic；输出不超过 255 字节且为合法 UTF-8，前缀保留
    #[test]
    fn sanitize_truncates_multibyte_at_char_boundary() {
        let input = format!("a{}", "中".repeat(200));
        assert!(input.len() > 255);
        let result = sanitize_filename_inner(&input, false);
        assert!(result.len() <= 255, "len = {}", result.len());
        assert!(result.starts_with('a'), "result = {result}");
    }

    /// P0：[sanitize_filename_inner] 合法文件名保持不变（包括中文、连字符、下划线、点号）
    /// 条件：输入正常文件名如 readme.md、日本語.txt 等
    /// 断言：输出与输入一致
    #[test]
    fn sanitize_normal_filenames_unchanged() {
        assert_eq!(sanitize_filename_inner("readme.md", false), "readme.md");
        assert_eq!(
            sanitize_filename_inner("my-file_v2.tar.gz", false),
            "my-file_v2.tar.gz"
        );
        assert_eq!(sanitize_filename_inner("日本語.txt", false), "日本語.txt");
    }

    /// P1：[sanitize_filename_inner] 尾部空格经 trim 去除（非 Windows 分支职责）
    /// 条件：windows=true，输入 "hello " 或 "a b" 或 "   "
    /// 断言："hello "→"hello"，"a b"不变，"   "→"_"
    #[test]
    fn sanitize_windows_trailing_space() {
        assert_eq!(sanitize_filename_inner("hello ", true), "hello");
        assert_eq!(sanitize_filename_inner("a b", true), "a b");
        assert_eq!(sanitize_filename_inner("   ", true), "_");
    }

    /// P1：[sanitize_filename_inner] Windows 模式下尾部点号追加下划线
    /// 条件：windows=true，输入 "data."
    /// 断言：返回 "data._"；windows=false 时保持不变
    #[test]
    fn sanitize_windows_trailing_dot() {
        assert_eq!(sanitize_filename_inner("data.", true), "data._");
        assert_eq!(sanitize_filename_inner("data.", false), "data.");
    }

    /// P1：[sanitize_filename_inner] 截断重新引入的尾部点号仍被 Windows 检查兜住
    /// 条件：windows=true，输入 "a" + 300 个 "."（截断后恰以点号结尾）
    /// 断言：结果不以 "." 结尾（Windows 检查在截断之后执行）
    #[test]
    fn sanitize_windows_trailing_dot_after_truncation() {
        let input = format!("a{}", ".".repeat(300));
        let result = sanitize_filename_inner(&input, true);
        assert!(!result.ends_with('.'), "result ends with dot: {result:?}");
        assert!(result.len() <= 256, "len = {}", result.len());
    }

    /// P1：[sanitize_filename_inner] Windows 保留名前加下划线
    /// 条件：windows=true，输入 CON、con.txt、NUL、COM1.log、aux
    /// 断言：均以 "_" 前缀开头
    #[test]
    fn sanitize_windows_reserved_names() {
        assert_eq!(sanitize_filename_inner("CON", true), "_CON");
        assert_eq!(sanitize_filename_inner("con.txt", true), "_con.txt");
        assert_eq!(sanitize_filename_inner("NUL", true), "_NUL");
        assert_eq!(sanitize_filename_inner("COM1.log", true), "_COM1.log");
        assert_eq!(sanitize_filename_inner("aux", true), "_aux");
    }

    /// P1：[sanitize_filename_inner] 非 Windows 模式不处理保留名
    /// 条件：windows=false，输入 CON、con.txt、NUL
    /// 断言：输出与输入一致
    #[test]
    fn sanitize_windows_reserved_not_applied_on_unix() {
        assert_eq!(sanitize_filename_inner("CON", false), "CON");
        assert_eq!(sanitize_filename_inner("con.txt", false), "con.txt");
        assert_eq!(sanitize_filename_inner("NUL", false), "NUL");
    }

    /// P1：[sanitize_filename_inner] Windows 模式下非保留名保持不变
    /// 条件：windows=true，输入 readme.md、console 等正常名称
    /// 断言：输出与输入一致
    #[test]
    fn sanitize_windows_non_reserved_unchanged() {
        assert_eq!(sanitize_filename_inner("readme.md", true), "readme.md");
        assert_eq!(sanitize_filename_inner("console", true), "console");
    }

    // ── is_windows_reserved ──

    /// P0：[is_windows_reserved] Windows 保留名精确匹配检测
    /// 条件：输入 con、prn、aux、nul、com0、lpt9 等精确匹配
    /// 断言：is_windows_reserved 返回 true
    #[test]
    fn reserved_exact_match() {
        assert!(is_windows_reserved("con"));
        assert!(is_windows_reserved("prn"));
        assert!(is_windows_reserved("aux"));
        assert!(is_windows_reserved("nul"));
        assert!(is_windows_reserved("com0"));
        assert!(is_windows_reserved("lpt9"));
    }

    /// P1：[is_windows_reserved] Windows 保留名匹配忽略大小写
    /// 条件：输入 CON、Prn、AUX、NUL、Com1、LPT3
    /// 断言：is_windows_reserved 返回 true
    #[test]
    fn reserved_case_insensitive() {
        assert!(is_windows_reserved("CON"));
        assert!(is_windows_reserved("Prn"));
        assert!(is_windows_reserved("AUX"));
        assert!(is_windows_reserved("NUL"));
        assert!(is_windows_reserved("Com1"));
        assert!(is_windows_reserved("LPT3"));
    }

    /// P1：[is_windows_reserved] 带扩展名的保留名被正确识别
    /// 条件：输入 con.txt、NUL.log、COM1.dat、aux.tar.gz
    /// 断言：is_windows_reserved 返回 true
    #[test]
    fn reserved_with_extension() {
        assert!(is_windows_reserved("con.txt"));
        assert!(is_windows_reserved("NUL.log"));
        assert!(is_windows_reserved("COM1.dat"));
        assert!(is_windows_reserved("aux.tar.gz"));
    }

    /// P0：[is_windows_reserved] 正常名称不被误判为保留名
    /// 条件：输入 hello、readme.md、console、prn_data、com10 等
    /// 断言：返回 false
    #[test]
    fn not_reserved_normal_names() {
        assert!(!is_windows_reserved("hello"));
        assert!(!is_windows_reserved("readme.md"));
        assert!(!is_windows_reserved("console"));
        assert!(!is_windows_reserved("prn_data"));
        assert!(!is_windows_reserved("auxiliary"));
        assert!(!is_windows_reserved("com10"));
        assert!(!is_windows_reserved("lpt"));
        assert!(!is_windows_reserved(""));
    }
}
