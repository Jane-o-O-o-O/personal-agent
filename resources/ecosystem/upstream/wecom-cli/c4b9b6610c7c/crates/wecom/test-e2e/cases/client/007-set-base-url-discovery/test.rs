use wecom_transport::EndpointHttpExt;

#[test]
fn run() {
    // ServiceDiscovery 是 transport 驱动：endpoint 上 base_url 为 None，
    // transport 在执行时回填其默认值（EndpointHttpExt::base_url 对 None 返回 ""）。
    // 请求/响应信封均回退 transport 默认（passthrough / gateway）——扁平协议
    // 由产品层（wecom-cli）经 endpoint_catalog 注入。
    let catalog = wecom::EndpointCatalog::default();
    let ep = catalog.resolve(wecom::EndpointKey::ServiceDiscovery);
    assert_eq!(ep.path(), "/service/discovery");
    assert_eq!(ep.req_envelope().name(), "passthrough");
    assert_eq!(ep.res_envelope().name(), "gateway");
}
