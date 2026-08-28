from volcengine.ServiceInfo import ServiceInfo
from volcengine.Credentials import Credentials
from volcengine.ApiInfo import ApiInfo

api_info = {
    "McpQuickApplyCertificate": ApiInfo(
        "POST",
        "/",
        {"Action": "QuickApplyCertificate", "Version": "2024-10-01"},
        {},
        {},
    ),
    "McpCertificateGetInstance": ApiInfo(
        "POST",
        "/",
        {"Action": "CertificateGetInstance", "Version": "2024-10-01"},
        {},
        {},
    ),
    "McpImportCertificate": ApiInfo(
        "POST", "/", {"Action": "ImportCertificate", "Version": "2024-10-01"}, {}, {}
    ),
    "McpCertificateGetInstanceList": ApiInfo(
        "POST",
        "/",
        {"Action": "CertificateGetInstanceList", "Version": "2024-10-01"},
        {},
        {},
    ),
    "McpCertificateAddOrganization": ApiInfo(
        "POST",
        "/",
        {"Action": "CertificateAddOrganization", "Version": "2024-10-01"},
        {},
        {},
    ),
    "McpCertificateGetOrganization": ApiInfo(
        "POST",
        "/",
        {"Action": "CertificateGetOrganization", "Version": "2024-10-01"},
        {},
        {},
    ),
    "McpCertificateGetOrganizationList": ApiInfo(
        "POST",
        "/",
        {"Action": "CertificateGetOrganizationList", "Version": "2024-10-01"},
        {},
        {},
    ),
    "McpListTagsForResources": ApiInfo(
        "POST", "/", {"Action": "ListTagsForResources", "Version": "2024-10-01"}, {}, {}
    ),
}
service_info_map = {
    "cn-north-1": ServiceInfo(
        "open.volcengineapi.com",
        {"Accept": "application/json", "x-tt-mcp": "volc"},
        Credentials("", "", "certificate_service", "cn-north-1"),
        60,
        60,
        "http",
    ),
}
