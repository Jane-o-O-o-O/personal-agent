use std::collections::HashMap;
use std::path::PathBuf;

use super::Directive;
use crate::{Result, fs, json_path};

/// 提取 multipart 上传的「字段名 → 物化文件路径」映射（供构建表单与再次
/// 构建闭包复用）。
///
/// 路径直接取自指令的 `file_path`——收集时已锚定为绝对路径
/// （[`collect_directives`](super::collect_directives)），payload 原文
/// 不参与文件定位。
pub fn multipart_file_fields(directives: &[Directive<'_>]) -> HashMap<String, PathBuf> {
    directives
        .iter()
        .filter_map(|d| match d {
            Directive::UploadMultipart { path, file_path } => {
                Some((json_path::segments_to_path(path), file_path.clone()))
            }
            _ => None,
        })
        .collect()
}

/// 根据文件字段映射将 payload 扁平化为 multipart 表单。
///
/// 文件字段的路径取自 `file_fields`（指令物化结果，绝对路径），读取经
/// [`fs::open_as_multipart_part`] 的沙箱校验链；其余字段取 payload 文本值。
pub async fn build_multipart_form(
    fs: &dyn fs::Fs,
    payload: &serde_json::Value,
    file_fields: &HashMap<String, PathBuf>,
) -> Result<reqwest::multipart::Form> {
    let parts = json_path::flatten_value(payload);
    let mut form = reqwest::multipart::Form::new();

    for (name, value) in parts {
        if let Some(file_path) = file_fields.get(name.as_str()) {
            let part = fs::open_as_multipart_part(fs, file_path)
                .await
                .inspect_err(
                    |e| tracing::error!(error = %e, "open file for multipart upload failed"),
                )?;
            form = form.part(name, part);
        } else {
            form = form.text(name, value);
        }
    }

    Ok(form)
}

#[cfg(test)]
// 测试夹具直接写临时目录准备输入文件，无需走沙箱；生产路径一律使用 `Fs::atomic_write`。
#[allow(clippy::disallowed_methods)]
mod tests {
    //! ## 模块摘要：octet_stream（multipart 构建）
    //!
    //! ### 关键接口
    //! - [multipart_file_fields] — 提取「字段名 → 指令物化文件路径」映射
    //! - [build_multipart_form] — 根据 directives 将 payload 扁平化为 multipart 表单
    //!
    //! ### 关键分支与异常路径
    //! - build_multipart_form：文件字段用 open_as_multipart_part（路径取自指令物化结果），普通字段用 text
    //!
    //! ### 上下游交互
    //! - 上游：HTTP 请求构建层调用本模块构建 multipart 表单
    //! - 下游：依赖 [json_path::flatten_value]（扁平化）、[fs::Fs]（文件读取）
    //!
    //! 注：`x-wecom-octet-stream` 标记的 schema 探测已并入 `marker.rs`
    //! （与下载类判定共用遍历器）。

    use super::*;

    // ── build_multipart_form ──

    /// P0：[build_multipart_form] 普通文本字段构建为 text 表单
    /// 条件：payload 含 key=value 文本字段，无文件字段集合
    /// 断言：返回的 Form 构建成功
    #[tokio::test]
    async fn build_multipart_form_text_only() {
        let fs = wecom_fs::SandboxedFs::new();
        let payload = serde_json::json!({"name": "test.txt"});
        let file_fields = HashMap::new();
        let _form = build_multipart_form(&fs, &payload, &file_fields)
            .await
            .unwrap();
    }

    /// P0：[multipart_file_fields] 提取 UploadMultipart 指令的「字段名 → 物化路径」映射
    /// 条件：directives 含两个 UploadMultipart（path 分别为 ["file"] 与 ["nested","data"]）
    /// 断言：返回映射含 "file" → /tmp/a.bin 与 "nested.data" → /tmp/b.bin
    #[test]
    fn multipart_file_fields_extracts_paths() {
        use crate::json_path::PathSegment;

        let directives = vec![
            Directive::UploadMultipart {
                path: vec![PathSegment::Key("file".into())],
                file_path: std::path::PathBuf::from("/tmp/a.bin"),
            },
            Directive::UploadMultipart {
                path: vec![
                    PathSegment::Key("nested".into()),
                    PathSegment::Key("data".into()),
                ],
                file_path: std::path::PathBuf::from("/tmp/b.bin"),
            },
        ];
        let fields = multipart_file_fields(&directives);
        assert_eq!(
            fields.get("file"),
            Some(&std::path::PathBuf::from("/tmp/a.bin"))
        );
        assert_eq!(
            fields.get("nested.data"),
            Some(&std::path::PathBuf::from("/tmp/b.bin"))
        );
    }

    /// P1：[build_multipart_form] 文件字段走 multipart part 分支
    /// 条件：payload 含 UploadMultipart 指向的文件字段，文件存在
    /// 断言：返回 Ok(Form)
    #[tokio::test]
    async fn build_multipart_form_file_field() {
        let tmp = tempfile::tempdir().unwrap();
        let file = tmp.path().join("data.txt");
        std::fs::write(&file, b"file-content").unwrap();
        let fs = wecom_fs::SandboxedFs::new();
        let payload = serde_json::json!({ "data": file.to_string_lossy() });
        let directive = Directive::UploadMultipart {
            path: vec![crate::json_path::PathSegment::Key("data".into())],
            file_path: file.clone(),
        };
        let file_fields = multipart_file_fields(&[directive]);
        let _form = build_multipart_form(&fs, &payload, &file_fields)
            .await
            .unwrap();
    }

    /// P2：[build_multipart_form] 文件不存在时返回错误
    /// 条件：UploadMultipart 指向不存在的文件
    /// 断言：返回 Err（触发 open_as_multipart_part 的 error 分支）
    #[tokio::test]
    async fn build_multipart_form_missing_file_errors() {
        let fs = wecom_fs::SandboxedFs::new();
        let payload = serde_json::json!({ "data": "/nonexistent/data.txt" });
        let directive = Directive::UploadMultipart {
            path: vec![crate::json_path::PathSegment::Key("data".into())],
            file_path: std::path::PathBuf::from("/nonexistent/data.txt"),
        };
        let file_fields = multipart_file_fields(&[directive]);
        let result = build_multipart_form(&fs, &payload, &file_fields).await;
        assert!(result.is_err());
    }
}
