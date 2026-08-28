"""MediaKit API 请求客户端

封装 HTTP 请求能力，支持 GET / POST / PUT / DELETE / PATCH 等多种请求方式。
按构造时注入的配置解析鉴权、Endpoint 与 Runtime。

同时提供基于 api_info 路由表的高层调用接口 call(api_name, **kwargs)。
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Any

import httpx

from .api_info import api_info
from .header_utils import header_value
from .constant import (
    DEFAULT_ENDPOINT,
    DEFAULT_RUNTIME,
    DEFAULT_TASK_SOURCE,
    ENDPOINT_ENV,
    ENDPOINT_HEADER,
    LOGID_ENV,
    LOGID_HEADER,
    MEDIAKIT_API_KEY_ENV,
    MEDIAKIT_API_KEY_HEADER,
    RUNTIME_ENV,
    RUNTIME_HEADER,
    TASK_SOURCE_ENV,
    TASK_SOURCE_HEADER,
    TOOL_NAME_HEADER,
)

logger = logging.getLogger(__name__)


def resolve_client_config(headers: dict[str, str] | None = None) -> ClientConfig:
    """解析 client 配置。

    各字段优先级：HTTP Header > 环境变量 > 默认值（如适用）。
    """
    inbound = headers or {}
    api_key = header_value(inbound, MEDIAKIT_API_KEY_HEADER) or os.environ.get(
        MEDIAKIT_API_KEY_ENV, ""
    ).strip()
    if not api_key:
        raise ValueError(
            f"缺少 API Key，请设置 Header {MEDIAKIT_API_KEY_HEADER} "
            f"或环境变量 {MEDIAKIT_API_KEY_ENV}"
        )
    endpoint = header_value(inbound, ENDPOINT_HEADER) or os.environ.get(
        ENDPOINT_ENV, ""
    ).strip() or DEFAULT_ENDPOINT
    runtime = os.environ.get(RUNTIME_ENV, "").strip() or DEFAULT_RUNTIME
    task_source = os.environ.get(TASK_SOURCE_ENV, "").strip() or DEFAULT_TASK_SOURCE
    logid = header_value(inbound, LOGID_HEADER) or os.environ.get(LOGID_ENV, "").strip()
    return ClientConfig(
        api_key=api_key,
        endpoint=endpoint,
        runtime=runtime,
        task_source=task_source,
        logid=logid or None,
    )


@dataclass(frozen=True)
class ClientConfig:
    api_key: str
    endpoint: str
    runtime: str
    task_source: str = DEFAULT_TASK_SOURCE
    logid: str | None = None


class MediakitClient:
    """MediaKit API 请求客户端"""

    DEFAULT_TIMEOUT = 30.0

    def __init__(self, config: ClientConfig, timeout: float | None = None) -> None:
        self._config = config
        self._timeout = timeout or self.DEFAULT_TIMEOUT

    @classmethod
    def from_env(cls, timeout: float | None = None) -> "MediakitClient":
        api_key = os.environ.get(MEDIAKIT_API_KEY_ENV, "")
        if not api_key:
            raise ValueError(
                f"缺少 API Key，请通过环境变量 {MEDIAKIT_API_KEY_ENV} 设置"
            )
        return cls(
            ClientConfig(
                api_key=api_key,
                endpoint=os.environ.get(ENDPOINT_ENV, "") or DEFAULT_ENDPOINT,
                runtime=os.environ.get(RUNTIME_ENV, "") or DEFAULT_RUNTIME,
                task_source=os.environ.get(TASK_SOURCE_ENV, "") or DEFAULT_TASK_SOURCE,
                logid=os.environ.get(LOGID_ENV, "").strip() or None,
            ),
            timeout=timeout,
        )

    @classmethod
    def from_request_headers(
        cls,
        headers: dict[str, str],
        timeout: float | None = None,
    ) -> "MediakitClient":
        """按 inbound HTTP headers 构造 client（Header > Env）。"""
        return cls(resolve_client_config(headers), timeout=timeout)

    def _build_request_headers(self, *, tool_name: str) -> dict[str, str]:
        headers: dict[str, str] = {
            "Content-Type": "application/json",
            RUNTIME_HEADER: self._config.runtime,
            TASK_SOURCE_HEADER: self._config.task_source,
            TOOL_NAME_HEADER: tool_name,
            "Authorization": f"Bearer {self._config.api_key}",
        }
        if self._config.logid:
            headers[LOGID_HEADER] = self._config.logid
        return headers

    @staticmethod
    def _handle_response(response: httpx.Response) -> dict[str, Any]:
        response.raise_for_status()
        return response.json()

    def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
        tool_name: str | None = None,
    ) -> dict[str, Any]:
        if not tool_name:
            raise ValueError("MCP downstream request requires a tool name")
        request_headers = self._build_request_headers(tool_name=tool_name)
        endpoint = self._config.endpoint
        url = f"{endpoint.rstrip('/')}/{path.lstrip('/')}"

        with httpx.Client(timeout=self._timeout) as client:
            response = client.request(
                method=method.upper(),
                url=url,
                headers=request_headers,
                params=params,
                json=json,
                data=data,
            )
        return self._handle_response(response)

    def get(
        self,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        tool_name: str | None = None,
    ) -> dict[str, Any]:
        return self.request("GET", path, params=params, tool_name=tool_name)

    def post(
        self,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
        tool_name: str | None = None,
    ) -> dict[str, Any]:
        return self.request("POST", path, json=json, data=data, tool_name=tool_name)

    def put(
        self,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
        tool_name: str | None = None,
    ) -> dict[str, Any]:
        return self.request("PUT", path, json=json, data=data, tool_name=tool_name)

    def delete(
        self,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        tool_name: str | None = None,
    ) -> dict[str, Any]:
        return self.request("DELETE", path, params=params, tool_name=tool_name)

    def patch(
        self,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
        tool_name: str | None = None,
    ) -> dict[str, Any]:
        return self.request("PATCH", path, json=json, data=data, tool_name=tool_name)

    def call(
        self,
        api_name: str,
        *,
        tool_name: str | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        route = api_info[api_name]
        method = route["method"].upper()
        path = route["path"]

        path_params = {}
        remaining_kwargs = dict(kwargs)
        for key in list(remaining_kwargs.keys()):
            placeholder = "{" + key + "}"
            if placeholder in path:
                path_params[key] = remaining_kwargs.pop(key)
        path = path.format(**path_params)
        remaining_kwargs = {
            key: value for key, value in remaining_kwargs.items() if value is not None
        }

        resolved_tool = tool_name or api_name
        if method in {"GET", "DELETE"}:
            return self.request(
                method,
                path,
                params=remaining_kwargs,
                tool_name=resolved_tool,
            )
        return self.request(
            method,
            path,
            json=remaining_kwargs,
            tool_name=resolved_tool,
        )


def create_client(timeout: float | None = None) -> MediakitClient:
    return MediakitClient.from_env(timeout=timeout)
