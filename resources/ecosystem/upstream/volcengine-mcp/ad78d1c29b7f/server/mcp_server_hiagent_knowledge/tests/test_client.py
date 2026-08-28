from __future__ import annotations

import io
import json
import urllib.error
import urllib.request

import pytest

from mcp_server_hiagent_knowledge.versions.v3_1_0.client import HiAgentOpenAPIClient, OpenAPIError
from mcp_server_hiagent_knowledge.versions.v3_1_0.config import HiAgentConfig


class _Response:
    def __init__(self, payload: dict[str, object]) -> None:
        self._payload = json.dumps(payload).encode("utf-8")

    def __enter__(self) -> _Response:
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def read(self) -> bytes:
        return self._payload


def test_call_sends_account_id_to_platform_api(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    requested_urls: list[str] = []

    def fake_urlopen(
        request: urllib.request.Request,
        *,
        timeout: float,
    ) -> _Response:
        requested_urls.append(request.full_url)
        return _Response({"ResponseMetadata": {}, "Result": {"Items": []}})

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    client = HiAgentOpenAPIClient(
        HiAgentConfig(
            top_host="http://hiagent.example.com:30040",
            account_id="1000000000",
            access_key_id="ak",
            secret_access_key="sk",
        )
    )

    result = client.call(action="ListApp", body={"ListOpt": {"PageSize": 1}})

    assert result["Result"] == {"Items": []}
    assert "X-Account-Id=1000000000" in requested_urls[0]


def test_call_raises_for_platform_api_error_in_http_200(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fake_urlopen(
        request: urllib.request.Request,
        *,
        timeout: float,
    ) -> _Response:
        return _Response(
            {
                "ResponseMetadata": {
                    "RequestId": "request-1",
                    "Error": {
                        "Code": "InvalidActionOrVersion",
                        "Message": "invalid action",
                    },
                }
            }
        )

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    client = HiAgentOpenAPIClient(
        HiAgentConfig(
            top_host="http://hiagent.example.com:30040",
            account_id="1000000000",
            access_key_id="ak",
            secret_access_key="sk",
        )
    )

    with pytest.raises(OpenAPIError, match="InvalidActionOrVersion: invalid action"):
        client.call(action="UnknownAction")


def test_call_parses_platform_api_error_from_http_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fake_urlopen(
        request: urllib.request.Request,
        *,
        timeout: float,
    ) -> _Response:
        payload = json.dumps(
            {
                "ResponseMetadata": {
                    "Error": {
                        "Code": "InvalidAccessKey",
                        "Message": "access key not found",
                    }
                }
            }
        ).encode("utf-8")
        raise urllib.error.HTTPError(
            request.full_url,
            401,
            "Unauthorized",
            {},
            io.BytesIO(payload),
        )

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    client = HiAgentOpenAPIClient(
        HiAgentConfig(
            top_host="http://hiagent.example.com:30040",
            account_id="1000000000",
            access_key_id="ak",
            secret_access_key="sk",
        )
    )

    with pytest.raises(OpenAPIError, match="InvalidAccessKey: access key not found"):
        client.call(action="ListApp")
