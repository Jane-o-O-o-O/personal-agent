/// HTTP/reqwest-specific helpers that build on top of the [`Fs`] trait.
use std::path::Path;

use futures::StreamExt;
use tokio::io::AsyncWriteExt;
use wecom_fs::Error as FsError;

use super::{FileWriter, Fs, FsAccess};
use crate::{Error, Result};

// ── Multipart upload ────────────────────────────────────────

/// Resolve a path, open it for reading, and wrap the stream into a
/// [`reqwest::multipart::Part`] ready for upload.
///
/// The file length is read from the opened handle (fd-level) and set as the
/// part's exact `Content-Length` when available.
pub async fn open_as_multipart_part(
    fs: &dyn Fs,
    file_path: &Path,
) -> Result<reqwest::multipart::Part> {
    let resolved = fs.resolve(file_path, FsAccess::Read).await?;
    let (resolved, reader) = fs.open_for_read(&resolved).await?;
    let len = reader.metadata().await.ok().map(|m| m.len);

    let file_name = resolved
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| "upload".to_string());

    let body = reqwest::Body::wrap_stream(tokio_util::io::ReaderStream::new(reader));
    let part = match len {
        Some(len) => reqwest::multipart::Part::stream_with_length(body, len),
        None => reqwest::multipart::Part::stream(body),
    }
    .file_name(file_name);

    Ok(part)
}

// ── Stream download ─────────────────────────────────────────

/// Stream a [`wecom_transport::HttpResponse`] body into `file`, then `sync_all`.
///
/// This is a pure I/O helper with no access checks — the caller is
/// responsible for ensuring that `file` was opened through a validated path
/// (e.g. via [`Fs::create_file`]).
pub async fn stream_to_file(
    file: &mut FileWriter,
    display_path: &Path,
    response: wecom_transport::HttpResponse,
) -> Result<()> {
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| Error::Wrapped(Box::new(e)))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| Error::io(format!("Failed to write to {}", display_path.display()), e))?;
    }

    file.sync_all().await.map_err(|e| match e {
        FsError::Io { source, .. } => {
            Error::io(format!("Failed to sync {}", display_path.display()), source)
        }
        other => other.into(),
    })?;

    Ok(())
}

// ── Content-Disposition ─────────────────────────────────────

/// Extract a filename from the `Content-Disposition` header of an HTTP header map.
pub fn content_disposition_filename(headers: &reqwest::header::HeaderMap) -> Option<String> {
    let header = headers.get("content-disposition")?;
    let value = header.to_str().ok()?;
    parse_content_disposition(value)
}

/// Parse an RFC 5987 ext-value: `charset'language'value-chars`.
///
/// Only UTF-8 charset is supported (which covers virtually all real-world
/// usage).  Percent-encoded octets are decoded.
fn parse_ext_value(raw: &str) -> Option<String> {
    // Format: charset'language'value-chars  (language may be empty)
    let mut parts = raw.splitn(3, '\'');
    let charset = parts.next()?;
    let _language = parts.next()?; // we don't need the language tag
    let encoded = parts.next()?;

    if !charset.eq_ignore_ascii_case("UTF-8") {
        return None; // unsupported charset
    }
    percent_decode(encoded)
}

/// Decode percent-encoded bytes (e.g. `%E4%B8%AD` → UTF-8 bytes → string).
fn percent_decode(input: &str) -> Option<String> {
    let mut bytes = Vec::with_capacity(input.len());
    let mut chars = input.chars();
    while let Some(c) = chars.next() {
        if c == '%' {
            let hi = chars.next()?;
            let lo = chars.next()?;
            let byte = u8::from_str_radix(&format!("{hi}{lo}"), 16).ok()?;
            bytes.push(byte);
        } else {
            // Non-encoded characters are passed through as UTF-8.
            let mut buf = [0u8; 4];
            bytes.extend_from_slice(c.encode_utf8(&mut buf).as_bytes());
        }
    }
    String::from_utf8(bytes).ok()
}

/// Parse a header parameter value that is either a quoted-string
/// (`"value"`, with `\\` and `\"` escapes) or a bare token.
fn parse_quoted_or_token(val: &str) -> String {
    if let Some(inner) = val.strip_prefix('"') {
        // Quoted-string: collect characters between the opening and closing
        // double-quote, honouring backslash escapes.
        let mut result = String::with_capacity(inner.len());
        let mut chars = inner.chars();
        while let Some(c) = chars.next() {
            match c {
                '"' => break, // closing quote
                '\\' => {
                    // Escaped character – take the next one literally.
                    if let Some(escaped) = chars.next() {
                        result.push(escaped);
                    }
                }
                _ => result.push(c),
            }
        }
        result
    } else {
        // Token (unquoted): take until semicolon, whitespace, or end.
        val.split(|c: char| c == ';' || c.is_whitespace())
            .next()
            .unwrap_or("")
            .to_string()
    }
}

/// Extract a filename from a `Content-Disposition` header **value** string.
///
/// Implements RFC 6266 §4.3: `filename*` (RFC 5987 ext-value) takes
/// precedence over `filename`.
fn parse_content_disposition(header_value: &str) -> Option<String> {
    let mut filename = None;
    let mut filename_star = None;

    // Split on ';' to iterate over parameters.  The first segment is the
    // disposition-type (e.g. "attachment") which we ignore.
    for (i, segment) in header_value.split(';').enumerate() {
        if i == 0 {
            continue; // skip disposition-type
        }
        let segment = segment.trim();
        if let Some((key, val)) = segment.split_once('=') {
            let key = key.trim();
            let val = val.trim();
            if key.eq_ignore_ascii_case("filename*") {
                filename_star = parse_ext_value(val);
            } else if key.eq_ignore_ascii_case("filename") {
                filename = Some(parse_quoted_or_token(val));
            }
        }
    }

    // RFC 6266 §4.3: filename* takes precedence over filename.
    filename_star.or(filename).filter(|s| !s.is_empty())
}

// ══════════════════════════════════════════════════════════════
//  Tests
// ══════════════════════════════════════════════════════════════

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    //! ## 模块摘要：reqwest_ext（Reqwest 扩展：文件上传与响应头解析）
    //!
    //! ### 关键接口
    //! - [open_as_multipart_part] — 在沙箱内打开文件用于 multipart 上传
    //! - [content_disposition_filename] — 从响应头的 Content-Disposition 中提取文件名
    //!
    //! ### 关键分支与异常路径
    //! - 文件在沙箱内 → 成功打开
    //! - 文件在沙箱外 → 返回 Err
    //! - 文件不存在 → 返回 Err
    //! - 有 filename*（RFC 5987）→ 优先使用并正确解码
    //! - 无引号 filename → 仍能提取
    //! - 无 Content-Disposition 头 → 返回 None
    //!
    //! ### 上下游交互
    //! - 上游：[directive::UploadMultipart] 调用 [open_as_multipart_part]
    //! - 下游：经 [Fs::open_for_read] 打开文件并做路径校验

    use std::fs as stdfs;

    use tempfile::TempDir;

    use super::*;

    // ── open_as_multipart_part ──

    /// P0：[open_as_multipart_part] 成功打开沙盒内文件
    /// 条件：文件位于可读写根目录下
    /// 断言：返回 Ok，Part 可正常创建
    #[tokio::test]
    async fn open_as_multipart_part_success() {
        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("upload.bin");
        stdfs::write(&file, "binary data").unwrap();

        let fs = wecom_fs::SandboxedFs::confined_to(&[tmp.path()]);
        let part = open_as_multipart_part(&fs, &file).await;
        assert!(part.is_ok());
    }

    /// P1：[open_as_multipart_part] fs 拒绝路径时返回 Err
    /// 条件：注入全部校验均失败的 ErrFs
    /// 断言：返回 Err
    #[tokio::test]
    async fn open_as_multipart_part_rejects_outside_roots() {
        let forbidden = TempDir::new().unwrap();
        let file = forbidden.path().join("secret.bin");
        stdfs::write(&file, "secret").unwrap();

        let fs = crate::fs::testing::ErrFs;
        let result = open_as_multipart_part(&fs, &file).await;
        assert!(result.is_err());
    }

    /// P1：[open_as_multipart_part] open_as_multipart_part 对不存在的文件返回错误
    /// 条件：请求打开的文件在沙盒内不存在
    /// 断言：返回 Err
    #[tokio::test]
    async fn open_as_multipart_part_nonexistent_file() {
        let tmp = TempDir::new().unwrap();
        let fs = wecom_fs::SandboxedFs::confined_to(&[tmp.path()]);
        let result = open_as_multipart_part(&fs, &tmp.path().join("no-such-file")).await;
        assert!(result.is_err());
    }

    // ── content_disposition_filename ──

    /// P0：[content_disposition_filename] 简单带引号 filename 正确提取
    /// 条件：响应头 "attachment; filename=\"report.pdf\""
    /// 断言：返回 Some("report.pdf")
    #[test]
    fn content_disposition_filename_simple() {
        let response = http::Response::builder()
            .status(200)
            .header("content-disposition", "attachment; filename=\"report.pdf\"")
            .body(Vec::<u8>::new())
            .unwrap();
        let response = reqwest::Response::from(response);
        assert_eq!(
            content_disposition_filename(response.headers()).as_deref(),
            Some("report.pdf")
        );
    }

    /// P1：[content_disposition_filename] filename*（RFC 5987）优先于 filename 被使用
    /// 条件：同时包含 filename="fallback.pdf" 和 filename*=中文文件名
    /// 断言：返回 filename* 解析出的中文名
    #[test]
    fn content_disposition_filename_star_takes_precedence() {
        let response = http::Response::builder()
            .status(200)
            .header(
                "content-disposition",
                "attachment; filename=\"fallback.pdf\"; filename*=UTF-8''%E6%96%87%E4%BB%B6.pdf",
            )
            .body(Vec::<u8>::new())
            .unwrap();
        let response = reqwest::Response::from(response);
        assert_eq!(
            content_disposition_filename(response.headers()).as_deref(),
            Some("文件.pdf")
        );
    }

    /// P1：[content_disposition_filename] 无引号的 filename 也能正确提取
    /// 条件：响应头 "attachment; filename=data.csv"（无引号）
    /// 断言：返回 Some("data.csv")
    #[test]
    fn content_disposition_filename_unquoted() {
        let response = http::Response::builder()
            .status(200)
            .header("content-disposition", "attachment; filename=data.csv")
            .body(Vec::<u8>::new())
            .unwrap();
        let response = reqwest::Response::from(response);
        assert_eq!(
            content_disposition_filename(response.headers()).as_deref(),
            Some("data.csv")
        );
    }

    /// P2：[content_disposition_filename] 无 Content-Disposition 头时返回 None
    /// 条件：响应不含任何 Content-Disposition 头
    /// 断言：返回 None
    #[test]
    fn content_disposition_no_header_returns_none() {
        let response = http::Response::builder()
            .status(200)
            .body(Vec::<u8>::new())
            .unwrap();
        let response = reqwest::Response::from(response);
        assert!(content_disposition_filename(response.headers()).is_none());
    }

    /// P2：[content_disposition_filename] Content-Disposition 无 filename 参数时返回 None
    /// 条件：响应头仅为 "inline"（无 filename/filename*）
    /// 断言：返回 None
    #[test]
    fn content_disposition_no_filename_param_returns_none() {
        let response = http::Response::builder()
            .status(200)
            .header("content-disposition", "inline")
            .body(Vec::<u8>::new())
            .unwrap();
        let response = reqwest::Response::from(response);
        assert!(content_disposition_filename(response.headers()).is_none());
    }

    /// P2：[content_disposition_filename] 空字符串 filename 返回 None
    /// 条件：响应头 filename=""
    /// 断言：返回 None
    #[test]
    fn content_disposition_empty_filename_returns_none() {
        let response = http::Response::builder()
            .status(200)
            .header("content-disposition", "attachment; filename=\"\"")
            .body(Vec::<u8>::new())
            .unwrap();
        let response = reqwest::Response::from(response);
        assert!(content_disposition_filename(response.headers()).is_none());
    }

    /// P1：[content_disposition_filename] 仅有 filename*（无 filename）时正确解析
    /// 条件：响应头仅含 "filename*=UTF-8''hello%20world.txt"
    /// 断言：返回 Some("hello world.txt")
    #[test]
    fn content_disposition_only_filename_star() {
        let response = http::Response::builder()
            .status(200)
            .header(
                "content-disposition",
                "attachment; filename*=UTF-8''hello%20world.txt",
            )
            .body(Vec::<u8>::new())
            .unwrap();
        let response = reqwest::Response::from(response);
        assert_eq!(
            content_disposition_filename(response.headers()).as_deref(),
            Some("hello world.txt")
        );
    }

    /// P2：不含等号的段被静默忽略 [[content_disposition_filename]]
    /// 条件：响应头中包含 "noequals" 段和正常的 filename 段
    /// 断言：仍正确解析出 filename="ok.txt"
    #[test]
    fn content_disposition_segment_without_equals() {
        // A segment with no '=' should be silently ignored.
        let response = http::Response::builder()
            .status(200)
            .header(
                "content-disposition",
                "attachment; noequals; filename=\"ok.txt\"",
            )
            .body(Vec::<u8>::new())
            .unwrap();
        let response = reqwest::Response::from(response);
        assert_eq!(
            content_disposition_filename(response.headers()).as_deref(),
            Some("ok.txt")
        );
    }

    // ── Content-Disposition value parsing ──

    /// P0：[parse_quoted_or_token] 简单带引号字符串解析为内部值
    /// 条件：输入 "\"report.pdf\""
    /// 断言：返回 "report.pdf"
    #[test]
    fn quoted_simple() {
        assert_eq!(parse_quoted_or_token("\"report.pdf\""), "report.pdf");
    }

    /// P1：[parse_quoted_or_token] 带反斜杠转义的引号字符串正确解析
    /// 条件：输入 "\"file\\\"name.txt\""
    /// 断言：返回 "file\"name.txt"
    #[test]
    fn quoted_with_escape() {
        assert_eq!(
            parse_quoted_or_token("\"file\\\"name.txt\""),
            "file\"name.txt"
        );
    }

    /// P1：[parse_quoted_or_token] 带双反斜杠的引号字符串正确解析为单个反斜杠
    /// 条件：输入 "\"a\\\\b\""
    /// 断言：返回 "a\\b"
    #[test]
    fn quoted_with_backslash_escape() {
        assert_eq!(parse_quoted_or_token("\"a\\\\b\""), "a\\b");
    }

    /// P0：[parse_quoted_or_token] 无引号的 token 原样返回
    /// 条件：输入 "report.pdf"
    /// 断言：返回 "report.pdf"
    #[test]
    fn token_simple() {
        assert_eq!(parse_quoted_or_token("report.pdf"), "report.pdf");
    }

    /// P1：[parse_quoted_or_token] token 在分号处截断
    /// 条件：输入 "name.txt; extra"
    /// 断言：返回 "name.txt"
    #[test]
    fn token_stops_at_semicolon() {
        assert_eq!(parse_quoted_or_token("name.txt; extra"), "name.txt");
    }

    /// P1：[parse_quoted_or_token] token 在空白字符处截断
    /// 条件：输入 "name.txt other"
    /// 断言：返回 "name.txt"
    #[test]
    fn token_stops_at_whitespace() {
        assert_eq!(parse_quoted_or_token("name.txt other"), "name.txt");
    }

    /// P1：[parse_quoted_or_token] 空引号字符串返回空串
    /// 条件：输入 "\"\""
    /// 断言：返回 ""
    #[test]
    fn empty_quoted_string() {
        assert_eq!(parse_quoted_or_token("\"\""), "");
    }

    /// P0：[percent_decode] 无编码的 ASCII 字符原样输出
    /// 条件：输入 "hello"
    /// 断言：percent_decode 返回 "hello"
    #[test]
    fn decode_ascii() {
        assert_eq!(percent_decode("hello").unwrap(), "hello");
    }

    /// P1：[percent_decode] URL 编码的大写字母正确解码
    /// 条件：输入 "%48%65%6C%6C%6F"
    /// 断言：percent_decode 返回 "Hello"
    #[test]
    fn decode_encoded_ascii() {
        assert_eq!(percent_decode("%48%65%6C%6C%6F").unwrap(), "Hello");
    }

    /// P1：[percent_decode] 中文 UTF-8 的 URL 编码正确解码
    /// 条件：输入 "%E4%B8%AD"（"中" 的 UTF-8 URL 编码）
    /// 断言：percent_decode 返回 "中"
    #[test]
    fn decode_chinese_utf8() {
        assert_eq!(percent_decode("%E4%B8%AD").unwrap(), "中");
    }

    /// P1：[percent_decode] 混合编码与普通字符正确组合
    /// 条件：输入 "file%20name.txt"（%20 为空格）
    /// 断言：percent_decode 返回 "file name.txt"
    #[test]
    fn decode_mixed() {
        assert_eq!(percent_decode("file%20name.txt").unwrap(), "file name.txt");
    }

    /// P1：[percent_decode] 无效十六进制百分号编码返回 None
    /// 条件：输入 "%ZZ"（非合法 hex）
    /// 断言：percent_decode 返回 None
    #[test]
    fn decode_invalid_hex_returns_none() {
        assert!(percent_decode("%ZZ").is_none());
    }

    /// P1：[percent_decode] 截断的百分号（仅一位 hex）返回 None
    /// 条件：输入 "%4"
    /// 断言：percent_decode 返回 None
    #[test]
    fn decode_truncated_percent_returns_none() {
        assert!(percent_decode("%4").is_none());
    }

    /// P1：[percent_decode] 尾部孤立的百分号返回 None
    /// 条件：输入 "hello%"（百分号后无十六进制位）
    /// 断言：percent_decode 返回 None
    #[test]
    fn decode_trailing_percent_returns_none() {
        assert!(percent_decode("hello%").is_none());
    }

    /// P0：[parse_ext_value] 基本 UTF-8 ext-value 解析
    /// 条件：输入 "UTF-8''hello%20world"
    /// 断言：返回 "hello world"
    #[test]
    fn ext_value_utf8() {
        assert_eq!(
            parse_ext_value("UTF-8''hello%20world").unwrap(),
            "hello world"
        );
    }

    /// P1：[parse_ext_value] 带语言标签的 UTF-8 ext-value 能正确解析
    /// 条件：输入 "UTF-8'en'report.pdf"
    /// 断言：parse_ext_value 返回 "report.pdf"
    #[test]
    fn ext_value_utf8_with_language() {
        assert_eq!(
            parse_ext_value("UTF-8'en'report.pdf").unwrap(),
            "report.pdf"
        );
    }

    /// P1：[parse_ext_value] ext-value 的 UTF-8 大小写不敏感
    /// 条件：输入 "utf-8''test.txt"（小写 utf-8）
    /// 断言：parse_ext_value 返回 "test.txt"
    #[test]
    fn ext_value_utf8_case_insensitive() {
        assert_eq!(parse_ext_value("utf-8''test.txt").unwrap(), "test.txt");
    }

    /// P1：[parse_ext_value] 非 UTF-8 字符集的 ext-value 返回 None
    /// 条件：输入 "ISO-8859-1''test.txt"
    /// 断言：parse_ext_value 返回 None
    #[test]
    fn ext_value_non_utf8_returns_none() {
        assert!(parse_ext_value("ISO-8859-1''test.txt").is_none());
    }

    /// P1：[parse_ext_value] 缺少必要部分的 ext-value 返回 None
    /// 条件：输入 "UTF-8"（缺少语言标签和编码值）
    /// 断言：parse_ext_value 返回 None
    #[test]
    fn ext_value_missing_parts_returns_none() {
        assert!(parse_ext_value("UTF-8").is_none());
    }

    /// P1：[parse_ext_value] 中文文件名的 ext-value 正确解码
    /// 条件：输入 "UTF-8''%E6%96%87%E4%BB%B6.pdf"
    /// 断言：parse_ext_value 返回 "文件.pdf"
    #[test]
    fn ext_value_chinese_filename() {
        assert_eq!(
            parse_ext_value("UTF-8''%E6%96%87%E4%BB%B6.pdf").unwrap(),
            "文件.pdf"
        );
    }

    /// P2：[parse_quoted_or_token] 未闭合引号字符串解析到输入结尾
    /// 条件：输入 "\"unclosed"（无闭合引号，chars 迭代耗尽）
    /// 断言：返回 "unclosed"
    #[test]
    fn quoted_unclosed_collects_to_end() {
        assert_eq!(parse_quoted_or_token("\"unclosed"), "unclosed");
    }

    /// P2：[parse_quoted_or_token] 反斜杠结尾的引号字符串丢弃孤立反斜杠
    /// 条件：输入 "\"abc\\"（转义符后无字符）
    /// 断言：返回 "abc"
    #[test]
    fn quoted_trailing_backslash_dropped() {
        assert_eq!(parse_quoted_or_token("\"abc\\"), "abc");
    }

    /// P2：[content_disposition_filename] 含等号的未知参数段被忽略
    /// 条件：响应头含 "foo=bar" 段与正常 filename 段
    /// 断言：仍正确解析出 Some("ok.txt")
    #[test]
    fn content_disposition_unknown_param_ignored() {
        let response = http::Response::builder()
            .status(200)
            .header(
                "content-disposition",
                "attachment; foo=bar; filename=\"ok.txt\"",
            )
            .body(Vec::<u8>::new())
            .unwrap();
        let response = reqwest::Response::from(response);
        assert_eq!(
            content_disposition_filename(response.headers()).as_deref(),
            Some("ok.txt")
        );
    }
}
