pub(crate) mod cache;
mod types;

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use tokio::sync::Mutex;
pub use types::*;

use crate::{Client, Result};

/// Service discovery cache TTL — used by both the in-memory cache and the file cache (1 minute).
pub(super) const CACHE_TTL: Duration = Duration::from_secs(60);

pub(crate) struct ServiceCache {
    catalog: Option<Cached<Arc<ServiceCatalog>>>,
    details: HashMap<String, Cached<Arc<ServiceSchema>>>,
}

struct Cached<T> {
    data: T,
    fetched_at: Instant,
}

impl ServiceCache {
    pub fn new() -> Mutex<Self> {
        Mutex::new(Self {
            catalog: None,
            details: HashMap::new(),
        })
    }

    /// 获取服务目录（带内存缓存 + 文件缓存）。
    ///
    /// 缓存未命中发起 discovery 请求时，`options` 会合并进请求
    /// （叠加在 transport 默认之上）。
    pub async fn get_or_fetch_catalog(
        &mut self,
        client: &Client,
        options: &wecom_transport::RequestOptions,
    ) -> Result<Arc<ServiceCatalog>> {
        if !self.is_catalog_fresh() {
            self.catalog = Some(Cached {
                data: Arc::new(cache::fetch_with_cache(client, None, false, options).await?),
                fetched_at: Instant::now(),
            });
        }
        Ok(Arc::clone(&self.catalog.as_ref().unwrap().data))
    }

    /// 获取服务详情（带内存缓存 + 文件缓存）。
    ///
    /// 缓存未命中发起 schema 拉取请求时，`options` 会合并进请求
    /// （叠加在 transport 默认之上）。
    pub async fn get_or_fetch_detail(
        &mut self,
        client: &Client,
        name: &str,
        options: &wecom_transport::RequestOptions,
    ) -> Result<Arc<ServiceSchema>> {
        if !self.is_detail_fresh(name) {
            let schema = cache::fetch_with_cache(client, Some(name), false, options).await?;
            self.details.insert(
                name.to_string(),
                Cached {
                    data: Arc::new(schema),
                    fetched_at: Instant::now(),
                },
            );
        }
        Ok(Arc::clone(&self.details[name].data))
    }

    fn is_catalog_fresh(&self) -> bool {
        self.catalog
            .as_ref()
            .is_some_and(|c| c.fetched_at.elapsed() < CACHE_TTL)
    }

    fn is_detail_fresh(&self, name: &str) -> bool {
        self.details
            .get(name)
            .is_some_and(|c| c.fetched_at.elapsed() < CACHE_TTL)
    }
}
