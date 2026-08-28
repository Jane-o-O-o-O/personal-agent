from __future__ import annotations

import datetime as dt

import pytest

from mcp_server_hiagent_knowledge.versions.v3_1_0.signer import sign_openapi_request


def test_sign_openapi_request_includes_region_in_credential_scope() -> None:
    signed = sign_openapi_request(
        top_host="http://hiagent.example.com:30040",
        action="ListApps",
        version="2023-08-01",
        account_id="1000000000",
        access_key_id="ak",
        secret_access_key="sk",
        region="cn-north-1",
        service="app",
        body={"Limit": 10},
        now=dt.datetime(2026, 8, 6, 0, 0, 0, tzinfo=dt.timezone.utc),
    )

    assert "Action=ListApps" in signed.url
    assert "Version=2023-08-01" in signed.url
    assert "X-Account-Id=1000000000" in signed.url
    assert signed.headers["X-Date"] == "20260806T000000Z"
    assert signed.headers["Authorization"].startswith("HMAC-SHA256 Credential=ak/")
    assert "/cn-north-1/app/request" in signed.headers["Authorization"]


def test_sign_openapi_request_requires_top_host_with_scheme() -> None:
    with pytest.raises(ValueError, match="HIAGENT_TOP_HOST"):
        sign_openapi_request(
            top_host="hiagent.example.com",
            action="ListApps",
            version="2023-08-01",
            account_id="1000000000",
            access_key_id="ak",
            secret_access_key="sk",
            region="cn-north-1",
            service="app",
            body={},
        )


def test_sign_openapi_request_preserves_existing_top_host_query() -> None:
    signed = sign_openapi_request(
        top_host="https://hiagent.example.com/openapi?X-Tenant-Id=tenant-1",
        action="GetApp",
        version="2023-08-01",
        account_id="1000000000",
        access_key_id="ak",
        secret_access_key="sk",
        region="cn-north-1",
        service="app",
        body={},
        now=dt.datetime(2026, 8, 6, 0, 0, 0, tzinfo=dt.timezone.utc),
    )

    assert signed.url.endswith(
        "/openapi?Action=GetApp&Version=2023-08-01&X-Account-Id=1000000000"
        "&X-Tenant-Id=tenant-1"
    )
