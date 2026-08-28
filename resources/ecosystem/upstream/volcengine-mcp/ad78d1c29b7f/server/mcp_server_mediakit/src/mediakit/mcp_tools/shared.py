from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from pydantic import Field
except Exception:  # pragma: no cover
    def Field(*args, **kwargs):
        if args:
            return args[0]
        return kwargs.get("default", None)

from base.context import get_client
from ..utils.async_poller import poll_until_complete
from ..utils.response import error_response, query_task_response


TOOL_NAMES = ["query_task"]


def _structured_error(exc: Exception) -> object:
    response = getattr(exc, "response", None)
    if response is not None:
        try:
            return response.json()
        except Exception:
            pass
    return {"message": str(exc)}


def register_tools(mcp) -> None:
    @mcp.tool(
        name="query_task",
        description="查询异步任务状态。提交异步任务后使用此工具获取结果。推荐使用 poll_interval_seconds + max_poll_attempts 控制轮询，例如 poll_interval_seconds=2、max_poll_attempts=10。传递这两个参数时，不需要再传 poll_complete【不推荐】。可选 max_poll_timeout_seconds 限制单次轮询总时长，默认 0 表示不限制；poll_interval_seconds × max_poll_attempts 不得超过该上限。",
    )
    async def query_task(
        task_id: str = Field(..., description="异步任务 ID，由异步能力提交后返回"),
        poll_interval_seconds: Optional[float] = Field(10, description="轮询间隔（秒）。推荐与 max_poll_attempts 搭配使用，例如 2。"),
        max_poll_attempts: Optional[int] = Field(0, description="最大轮询次数。0 表示仅查一次不轮询。推荐与 poll_interval_seconds 搭配使用，例如 10。"),
        poll_complete: Optional[bool] = Field(False, description="是否阻塞直到任务完成。推荐使用 poll_interval_seconds + max_poll_attempts 控制轮询；传递这两个参数时通常不需要再传 poll_complete。"),
        max_poll_timeout_seconds: Optional[float] = Field(0, description="轮询总时长上限（秒）。0 表示不限制。"),
    ) -> dict:
        """查询异步任务状态。"""
        try:
            def _do_query() -> dict:
                return get_client().call(
                    api_name="query_task",
                    tool_name="query_task",
                    task_id=task_id,
                )

            result = _do_query()

            status = result.get("status")
            interval = 10 if poll_interval_seconds is None else poll_interval_seconds
            attempt_limit = 0 if max_poll_attempts is None else max_poll_attempts
            timeout_limit = 0 if max_poll_timeout_seconds is None else max_poll_timeout_seconds
            wait_for_terminal = bool(poll_complete)
            if status not in {
                "completed",
                "failed",
                "canceled",
                "cancelled",
            }:
                if wait_for_terminal or attempt_limit > 0:
                    result = await poll_until_complete(
                        _do_query,
                        poll_interval_seconds=interval,
                        max_poll_attempts=attempt_limit,
                        poll_complete=wait_for_terminal,
                        max_poll_timeout_seconds=timeout_limit,
                        initial_result=result,
                    )

            logger.info(
                "query_task completed: status=%s task_id_present=%s result_present=%s",
                result.get("status"),
                bool(result.get("task_id")),
                isinstance(result.get("result"), dict),
            )
            return query_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))
