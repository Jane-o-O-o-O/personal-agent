use std::collections::{HashMap, HashSet};
use std::path::PathBuf;

use tracing::field::Empty;
use wecom_transport::RequestOptions;

use super::types::Directive;
use crate::fs::check_file_size_limit;
use crate::{Client, Error, Result, builtins, constants, fs, json_path};

#[tracing::instrument(
    level = "info",
    name = "media_upload",
    skip_all,
    fields(file_count = Empty),
)]
pub async fn process_media_upload(
    client: &Client,
    fs: &std::sync::Arc<dyn fs::Fs>,
    data: &mut serde_json::Value,
    directives: &[Directive<'_>],
    options: &RequestOptions,
) -> Result<()> {
    // 按 path 字符串去重（同一文件可能被多个 directive 引用）。
    let mut seen: HashSet<String> = HashSet::new();
    let unique_paths: Vec<&PathBuf> = directives
        .iter()
        .filter_map(|d| match d {
            Directive::UploadMedia { file_path, .. } => {
                let key = file_path.to_string_lossy().into_owned();
                if seen.insert(key) {
                    Some(file_path)
                } else {
                    None
                }
            }
            _ => None,
        })
        .collect();

    if unique_paths.is_empty() {
        return Ok(());
    }

    tracing::Span::current().record("file_count", unique_paths.len());
    tracing::info!(file_count = unique_paths.len(), "uploading media files");

    // 先校验全部文件大小，再批量上传（避免部分上传后发现后续文件超限）
    for file_path in &unique_paths {
        check_file_size_limit(fs.as_ref(), file_path, constants::MAX_UPLOAD_SIZE).await?;
    }

    let results: HashMap<String, String> =
        futures::future::try_join_all(unique_paths.into_iter().map(|file_path| {
            let options = options.clone();
            async move {
                let response =
                    builtins::upload_media(client, fs, file_path.clone(), &options).await?;
                Ok::<_, Error>((
                    file_path.as_path().to_string_lossy().into_owned(),
                    response.media_id,
                ))
            }
        }))
        .await?
        .into_iter()
        .collect();

    for directive in directives {
        let Directive::UploadMedia {
            path,
            file_path,
            with_file_path,
        } = directive
        else {
            continue;
        };
        let file_key = file_path.as_path().to_string_lossy();
        let Some(media_id) = results.get(file_key.as_ref()) else {
            continue;
        };
        let replacement = if *with_file_path {
            serde_json::json!({
                "media_id": media_id,
                "file_path": file_key,
            })
        } else {
            serde_json::Value::String(media_id.clone())
        };
        json_path::set_value_deep(data, path, replacement);
    }

    Ok(())
}
