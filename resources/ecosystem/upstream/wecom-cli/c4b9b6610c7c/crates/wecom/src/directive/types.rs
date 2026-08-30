use std::path::PathBuf;

use crate::json_path::PathSegment;
use crate::schema::FileSaveOptions;

#[derive(Debug)]
pub enum Directive<'a> {
    UploadMedia {
        path: Vec<PathSegment>,
        /// Local file to upload (derived from the request payload — always
        /// accessed through the workspace-domain filesystem).
        file_path: PathBuf,
        with_file_path: bool,
    },
    UploadMultipart {
        path: Vec<PathSegment>,
        /// Local file to upload (derived from the request payload — always
        /// accessed through the workspace-domain filesystem).
        file_path: PathBuf,
    },
    Save {
        path: Vec<PathSegment>,
        options: &'a FileSaveOptions,
    },
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：Directive（指令类型定义）
    //!
    //! ### 关键接口
    //! - `Directive::UploadMedia { path, file_path }` — 文件上传指令，标记需要上传的本地文件路径
    //! - `Directive::UploadMultipart { path, file_path }` — Multipart 上传指令，通过 multipart 表单上传文件
    //! - `Directive::Save { path, options }` — 文件保存指令，将响应字段保存为独立文件
    //!
    //! ### 关键分支与异常路径
    //! - 三个变体（UploadMedia / UploadMultipart / Save）分别对应不同处理逻辑
    //! - Debug derive 自动生成格式化输出
    //!
    //! ### 上下游交互
    //! - 上游：[directive::collect] 收集后产出 Directive 实例；[directive::file_save] / [directive::octet_stream] 消费
    //! - 下游：依赖 [json_path::PathSegment]（路径表示）、[schema::FileSaveOptions]（保存选项）

    use super::*;
    use crate::json_path::PathSegment;

    // ── Debug 输出 ──

    /// P1：[Directive::UploadMedia] UploadMedia 变体的 Debug 输出包含变体名和文件名
    /// 条件：创建一个含 media 路径的 UploadMedia 实例
    /// 断言：Debug 字符串包含 "UploadMedia" 和 "file.txt"
    #[test]
    fn directive_upload_media_debug() {
        let d = Directive::UploadMedia {
            path: vec![PathSegment::Key("media".into())],
            file_path: PathBuf::from("/tmp/file.txt"),
            with_file_path: false,
        };
        let debug_str = format!("{:?}", d);
        assert!(debug_str.contains("UploadMedia"));
        assert!(debug_str.contains("file.txt"));
    }

    /// P1：[Directive::UploadMultipart] UploadMultipart 变体的 Debug 输出包含变体名
    /// 条件：创建一个含 file 路径的 UploadMultipart 实例
    /// 断言：Debug 字符串包含 "UploadMultipart"
    #[test]
    fn directive_upload_multipart_debug() {
        let d = Directive::UploadMultipart {
            path: vec![PathSegment::Key("file".into())],
            file_path: PathBuf::from("/tmp/file.txt"),
        };
        let debug_str = format!("{:?}", d);
        assert!(debug_str.contains("UploadMultipart"));
    }

    /// P1：[Directive::Save] Save 变体的 Debug 输出包含变体名和文件名
    /// 条件：创建一个配置了 file_name 和 content_encoding 的 Save 实例
    /// 断言：Debug 字符串包含 "Save" 和 "report.pdf"
    #[test]
    fn directive_save_debug() {
        let options = crate::schema::FileSaveOptions {
            file_name: Some("report.pdf".to_string()),
            content_encoding: Some("base64".to_string()),
        };
        let d = Directive::Save {
            path: vec![PathSegment::Key("data".into())],
            options: &options,
        };
        let debug_str = format!("{:?}", d);
        assert!(debug_str.contains("Save"));
        assert!(debug_str.contains("report.pdf"));
    }
}
