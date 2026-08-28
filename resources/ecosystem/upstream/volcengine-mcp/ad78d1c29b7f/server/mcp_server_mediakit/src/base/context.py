from __future__ import annotations

from contextvars import ContextVar

from .client import MediakitClient

_client_var: ContextVar[MediakitClient | None] = ContextVar("mediakit_client", default=None)


def bind_client(client: MediakitClient) -> None:
    _client_var.set(client)


def get_client() -> MediakitClient:
    client = _client_var.get()
    if client is None:
        raise RuntimeError("MediakitClient 未绑定到当前请求上下文")
    return client
