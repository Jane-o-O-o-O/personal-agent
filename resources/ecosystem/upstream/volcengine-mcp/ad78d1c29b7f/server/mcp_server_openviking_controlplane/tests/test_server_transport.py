"""Transport wiring: stateless streamable HTTP and per-request credentials."""

import os
import sys
import unittest
from unittest.mock import Mock, patch

from mcp.server.mcpserver.context import Context
from starlette.datastructures import Headers

from mcp_server_openviking_controlplane import server


class TransportOptionsTest(unittest.TestCase):
    """The run() arguments the gateway depends on."""

    def test_stdio_takes_no_transport_options(self):
        self.assertEqual(server._transport_options("stdio"), {})

    def test_streamable_http_is_stateless_and_mounted_at_mcp(self):
        options = server._transport_options("streamable-http")
        self.assertTrue(options["stateless_http"])
        self.assertEqual(options["streamable_http_path"], "/mcp")

    def test_binds_all_interfaces_so_dns_rebinding_protection_stays_off(self):
        # Binding 127.0.0.1 makes the SDK enable a localhost-only Host allowlist,
        # which would reject every gateway-forwarded request.
        for transport in ("sse", "streamable-http"):
            with self.subTest(transport=transport):
                self.assertEqual(server._transport_options(transport)["host"], "0.0.0.0")

    def test_sse_gets_no_stateless_option(self):
        # stateless_http is only a streamable-http argument in mcp 2.x; passing it
        # to the sse overload would be a TypeError.
        self.assertNotIn("stateless_http", server._transport_options("sse"))

    def test_repo_standard_typo_disables_stateless(self):
        with patch.dict(os.environ, {"STATLESS_HTTP": "false"}):
            self.assertFalse(server._transport_options("streamable-http")["stateless_http"])

    def test_correct_spelling_also_disables_stateless(self):
        with patch.dict(os.environ, {"STATELESS_HTTP": "false"}):
            self.assertFalse(server._transport_options("streamable-http")["stateless_http"])

    def test_typo_takes_precedence_when_both_are_set(self):
        with patch.dict(os.environ, {"STATLESS_HTTP": "true", "STATELESS_HTTP": "false"}):
            self.assertTrue(server._transport_options("streamable-http")["stateless_http"])

    def test_port_env_vars(self):
        with patch.dict(os.environ, {"MCP_SERVER_PORT": "9001"}):
            self.assertEqual(server._transport_options("streamable-http")["port"], 9001)
        # An exported-but-empty variable must fall through rather than raise at startup.
        with patch.dict(os.environ, {"MCP_SERVER_PORT": ""}):
            self.assertEqual(server._transport_options("streamable-http")["port"], 8000)


class TransportSelectionTest(unittest.TestCase):
    """``main()`` must hand the SDK a transport string it actually accepts."""

    def _run_main(self, argv):
        with patch.object(server.mcp, "run") as run:
            with patch.object(sys, "argv", ["mcp-server-openviking-controlplane"] + argv):
                server.main()
        return run

    def test_defaults_to_stdio_with_no_transport_options(self):
        run = self._run_main([])
        self.assertEqual(run.call_args.kwargs, {"transport": "stdio"})

    def test_accepts_every_transport_the_sdk_supports(self):
        for transport in ("stdio", "sse", "streamable-http"):
            with self.subTest(transport=transport):
                run = self._run_main(["--transport", transport])
                self.assertEqual(run.call_args.kwargs["transport"], transport)

    def test_streamable_http_receives_its_options(self):
        kwargs = self._run_main(["--transport", "streamable-http"]).call_args.kwargs
        self.assertTrue(kwargs["stateless_http"])
        self.assertEqual(kwargs["host"], "0.0.0.0")

    def test_rejects_the_underscore_spelling(self):
        # MCPServer.run types transport as Literal["stdio", "sse", "streamable-http"],
        # so the underscore form would be a ValueError deep inside the SDK.
        with patch.object(server.mcp, "run"):
            with patch.object(sys, "argv", ["x", "--transport", "streamable_http"]):
                with self.assertRaises(SystemExit):
                    with patch.object(sys, "stderr"):
                        server.main()


class RequestCredentialTest(unittest.TestCase):
    """The credential is resolved per request, not once per process."""

    @staticmethod
    def _context(headers):
        request_context = Mock()
        request_context.request.headers = Headers(headers)
        return Context(request_context=request_context)

    def test_dedicated_header_is_used_verbatim(self):
        ctx = self._context({"X-AgentPlan-Api-Key": "ark-caller"})
        self.assertEqual(server._request_api_key(ctx), "ark-caller")

    def test_bearer_scheme_is_stripped(self):
        ctx = self._context({"Authorization": "Bearer ark-caller"})
        self.assertEqual(server._request_api_key(ctx), "ark-caller")

    def test_dedicated_header_beats_authorization(self):
        ctx = self._context(
            {"X-AgentPlan-Api-Key": "ark-dedicated", "Authorization": "Bearer ark-auth"}
        )
        self.assertEqual(server._request_api_key(ctx), "ark-dedicated")

    def test_non_bearer_authorization_is_ignored(self):
        # A gateway terminating its own auth may put an unrelated credential here.
        # Using it as an Ark key would stamp it into the caller's collection.
        for value in ("Basic dXNlcjpwYXNz", "opaque-gateway-token", "Bearer "):
            with self.subTest(value=value):
                self.assertIsNone(server._request_api_key(self._context({"Authorization": value})))

    def test_no_request_means_no_request_key(self):
        self.assertIsNone(server._request_api_key(None))  # stdio: no Context injected

        request_context = Mock()
        request_context.request = None  # HTTP transport without a request object
        self.assertIsNone(server._request_api_key(Context(request_context=request_context)))

    def test_consecutive_requests_do_not_share_a_credential(self):
        with patch.dict(os.environ, {"AGENTPLAN_API_KEY": "ark-env"}, clear=False):
            first = server.get_client(self._context({"X-AgentPlan-Api-Key": "ark-first"}))
            second = server.get_client(self._context({"X-AgentPlan-Api-Key": "ark-second"}))
            fallback = server.get_client(None)

        self.assertEqual(first.config.api_key, "ark-first")
        self.assertEqual(second.config.api_key, "ark-second")
        self.assertEqual(fallback.config.api_key, "ark-env")


class ToolContractTest(unittest.TestCase):
    """Injecting Context must not change what clients see."""

    def test_ctx_is_not_exposed_as_a_tool_argument(self):
        import anyio

        tools = anyio.run(server.mcp.list_tools)
        self.assertEqual(
            {tool.name for tool in tools},
            {
                "list_collections",
                "get_collection",
                "get_usage",
                "get_collection_api_key",
                "create_collection",
                "update_collection",
                "list_collection_users",
                "register_collection_user",
                "update_collection_user",
                "delete_collection_user",
                "list_collection_accounts",
                "create_collection_account",
                "delete_collection_account",
                "delete_collection",
            },
        )
        for tool in tools:
            with self.subTest(tool=tool.name):
                self.assertNotIn("ctx", tool.input_schema.get("properties") or {})


if __name__ == "__main__":
    unittest.main()
