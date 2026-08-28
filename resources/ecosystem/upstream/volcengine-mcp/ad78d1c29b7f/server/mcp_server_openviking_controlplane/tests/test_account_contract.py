import inspect
import unittest
from unittest.mock import patch

from typer.testing import CliRunner

from mcp_server_openviking_controlplane import cli, server
from mcp_server_openviking_controlplane.cli import app
from mcp_server_openviking_controlplane.client import (
    ControlPlaneClient,
    ControlPlaneError,
    validate_account_id,
)
from mcp_server_openviking_controlplane.config import ControlPlaneConfig


class AccountClientContractTest(unittest.TestCase):
    def setUp(self):
        self.client = ControlPlaneClient(ControlPlaneConfig(api_key="ark-test"))

    def test_create_account_sends_exact_wire_body(self):
        with patch.object(
            self.client,
            "_request",
            return_value={"Success": True, "OpenVikingAccountID": "team.alpha"},
        ) as request:
            result = self.client.create_account(
                "ov-example",
                "team.alpha",
                extra={"TraceTag": "test"},
            )

        self.assertEqual(result["OpenVikingAccountID"], "team.alpha")
        request.assert_called_once_with(
            "CreateOpenVikingAccount",
            {
                "ResourceID": "ov-example",
                "OpenVikingAccountID": "team.alpha",
                "TraceTag": "test",
            },
        )

    def test_list_accounts_omits_keyword_by_default(self):
        with patch.object(
            self.client,
            "_request",
            return_value={"AccountList": [], "Total": 0},
        ) as request:
            self.client.list_accounts("ov-example")

        request.assert_called_once_with(
            "ListOpenVikingAccounts",
            {"ResourceID": "ov-example", "Page": 1, "Limit": 20},
        )

    def test_list_accounts_forwards_keyword_and_pagination(self):
        with patch.object(
            self.client,
            "_request",
            return_value={"AccountList": [], "Total": 0},
        ) as request:
            self.client.list_accounts(
                "ov-example",
                keyword="team alpha",
                page=2,
                limit=10,
            )

        request.assert_called_once_with(
            "ListOpenVikingAccounts",
            {
                "ResourceID": "ov-example",
                "Keyword": "team alpha",
                "Page": 2,
                "Limit": 10,
            },
        )

    def test_list_accounts_validates_pagination_locally(self):
        for kwargs, message in (
            ({"page": 0}, "page must be >= 1"),
            ({"limit": 0}, "limit must be between 1 and 200"),
            ({"limit": 201}, "limit must be between 1 and 200"),
        ):
            with self.subTest(kwargs=kwargs):
                with self.assertRaisesRegex(ValueError, message):
                    self.client.list_accounts("ov-example", **kwargs)

    def test_delete_account_rejects_default_before_request(self):
        with patch.object(self.client, "_request") as request:
            with self.assertRaisesRegex(ValueError, "default.*cannot be deleted"):
                self.client.delete_account("ov-example", "default")

        request.assert_not_called()

    def test_delete_account_sends_exact_wire_body(self):
        with patch.object(
            self.client,
            "_request",
            return_value={"Success": True},
        ) as request:
            self.client.delete_account("ov-example", "team-alpha")

        request.assert_called_once_with(
            "DeleteOpenVikingAccount",
            {"ResourceID": "ov-example", "OpenVikingAccountID": "team-alpha"},
        )

    def test_account_id_validation_rejects_invalid_values(self):
        invalid_values = (
            None,
            7,
            "",
            "a" * 65,
            "team alpha",
            "中文",
            "_private",
            ".",
            "..",
            "a@b@c",
        )
        for value in invalid_values:
            with self.subTest(value=value):
                with self.assertRaisesRegex(ValueError, "Rules:"):
                    validate_account_id(value)

    def test_account_id_validation_accepts_boundaries_and_supported_characters(self):
        for value in ("a", "a" * 64, "team.alpha-1_x", "user@corp"):
            with self.subTest(value=value):
                self.assertEqual(validate_account_id(value), value)

    def test_existing_user_actions_omit_account_id_for_legacy_wire_compatibility(self):
        calls = (
            (
                lambda: self.client.get_user_access("ov-example"),
                "GetOpenVikingCollectionUserAccess",
                {"ResourceID": "ov-example"},
            ),
            (
                lambda: self.client.list_collection_users("ov-example"),
                "ListOpenVikingCollectionUser",
                {"ResourceID": "ov-example", "Page": 1, "Limit": 20},
            ),
            (
                lambda: self.client.register_user("ov-example", "alice"),
                "RegisterOpenVikingUser",
                {"ResourceID": "ov-example", "UserID": "alice"},
            ),
            (
                lambda: self.client.update_user("ov-example", "alice", True),
                "UpdateOpenVikingUser",
                {"ResourceID": "ov-example", "UserID": "alice", "RegenerateKey": True},
            ),
            (
                lambda: self.client.delete_user("ov-example", "alice"),
                "DeleteOpenVikingUser",
                {"ResourceID": "ov-example", "UserID": "alice"},
            ),
        )
        for call, action, body in calls:
            with self.subTest(action=action):
                with patch.object(self.client, "_request", return_value={}) as request:
                    call()
                request.assert_called_once_with(action, body)

    def test_existing_user_actions_forward_validated_account_id(self):
        calls = (
            (
                lambda: self.client.get_user_access("ov-example", account_id="team"),
                "GetOpenVikingCollectionUserAccess",
                {"ResourceID": "ov-example", "OpenVikingAccountID": "team"},
            ),
            (
                lambda: self.client.list_collection_users(
                    "ov-example", account_id="team"
                ),
                "ListOpenVikingCollectionUser",
                {
                    "ResourceID": "ov-example",
                    "Page": 1,
                    "Limit": 20,
                    "OpenVikingAccountID": "team",
                },
            ),
            (
                lambda: self.client.register_user(
                    "ov-example", "alice", account_id="team"
                ),
                "RegisterOpenVikingUser",
                {"ResourceID": "ov-example", "UserID": "alice", "OpenVikingAccountID": "team"},
            ),
            (
                lambda: self.client.update_user(
                    "ov-example", "alice", True, account_id="team"
                ),
                "UpdateOpenVikingUser",
                {
                    "ResourceID": "ov-example",
                    "UserID": "alice",
                    "RegenerateKey": True,
                    "OpenVikingAccountID": "team",
                },
            ),
            (
                lambda: self.client.delete_user(
                    "ov-example", "alice", account_id="team"
                ),
                "DeleteOpenVikingUser",
                {"ResourceID": "ov-example", "UserID": "alice", "OpenVikingAccountID": "team"},
            ),
        )
        for call, action, body in calls:
            with self.subTest(action=action):
                with patch.object(self.client, "_request", return_value={}) as request:
                    call()
                request.assert_called_once_with(action, body)

    def test_existing_user_actions_normalize_optional_account_id(self):
        calls = (
            lambda value: self.client.get_user_access("ov-example", account_id=value),
            lambda value: self.client.list_collection_users(
                "ov-example", account_id=value
            ),
            lambda value: self.client.register_user(
                "ov-example", "alice", account_id=value
            ),
            lambda value: self.client.update_user(
                "ov-example", "alice", True, account_id=value
            ),
            lambda value: self.client.delete_user(
                "ov-example", "alice", account_id=value
            ),
        )
        for call in calls:
            with self.subTest(call=call, value="blank"):
                with patch.object(self.client, "_request", return_value={}) as request:
                    call("   ")
                self.assertNotIn("OpenVikingAccountID", request.call_args.args[1])
            with self.subTest(call=call, value="trimmed"):
                with patch.object(self.client, "_request", return_value={}) as request:
                    call(" team ")
                self.assertEqual(request.call_args.args[1]["OpenVikingAccountID"], "team")

    def test_existing_actions_reject_invalid_account_id_before_request(self):
        calls = (
            lambda: self.client.get_user_access("ov-example", account_id="bad value"),
            lambda: self.client.get_user_access("ov-example", account_id=7),
            lambda: self.client.list_collection_users(
                "ov-example", account_id="bad value"
            ),
            lambda: self.client.register_user(
                "ov-example", "alice", account_id="bad value"
            ),
            lambda: self.client.update_user(
                "ov-example", "alice", True, account_id="bad value"
            ),
            lambda: self.client.delete_user(
                "ov-example", "alice", account_id="bad value"
            ),
            lambda: self.client.get_usage("ov-example", account_id="bad value"),
        )
        with patch.object(self.client, "_request") as request:
            for call in calls:
                with self.subTest(call=call):
                    with self.assertRaisesRegex(ValueError, "Rules:"):
                        call()
            request.assert_not_called()

    def test_scoped_usage_uses_backend_field_and_removes_library_billing(self):
        backend_result = {
            "CurContextFileNum": 3,
            "AgentFileNum": 9,
            "EstimatedCosts": "0.05",
            "EstimatedBilling": {"CNY": "0.05"},
        }
        with patch.object(
            self.client, "_request", return_value=backend_result
        ) as request:
            result = self.client.get_usage(
                "ov-example",
                account_id="team",
                user_id="alice",
            )

        request.assert_called_once_with(
            "GetOpenVikingUsage",
            {
                "ResourceID": "ov-example",
                "OpenVikingAccountID": "team",
                "UserID": "alice",
            },
        )
        self.assertEqual(result, {"CurContextFileNum": 3})

    def test_usage_allows_user_only_scope_in_default_account(self):
        with patch.object(
            self.client,
            "_request",
            return_value={"CurContextFileNum": 1, "EstimatedCosts": "0.05"},
        ) as request:
            result = self.client.get_usage("ov-example", user_id="alice")

        request.assert_called_once_with(
            "GetOpenVikingUsage",
            {"ResourceID": "ov-example", "UserID": "alice"},
        )
        self.assertNotIn("EstimatedCosts", result)

    def test_unscoped_usage_preserves_legacy_wire_body_and_enrichment(self):
        with patch.object(
            self.client,
            "_request",
            side_effect=[
                {"AgentFileNum": 9, "EstimatedCosts": "0.05"},
                {},
            ],
        ) as request:
            result = self.client.get_usage("ov-example")

        self.assertEqual(
            request.call_args_list[0].args,
            ("GetOpenVikingUsage", {"ResourceID": "ov-example"}),
        )
        self.assertNotIn("AgentFileNum", result)
        self.assertEqual(result["EstimatedBilling"]["CNY"], "0.05")


class AccountCliContractTest(unittest.TestCase):
    def setUp(self):
        self.runner = CliRunner()
        self.prefix = ["--api-key", "ark-test", "--json"]

    def test_account_list_forwards_filters_and_pagination(self):
        with patch(
            "mcp_server_openviking_controlplane.cli.ControlPlaneClient.list_accounts",
            return_value={"AccountList": [], "Total": 0},
        ) as list_accounts:
            result = self.runner.invoke(
                app,
                self.prefix
                + [
                    "account",
                    "list",
                    "ov-example",
                    "--keyword",
                    "team",
                    "--page",
                    "2",
                    "--limit",
                    "10",
                ],
            )

        self.assertEqual(result.exit_code, 0)
        list_accounts.assert_called_once_with(
            "ov-example", keyword="team", page=2, limit=10
        )

    def test_account_create_forwards_identifiers(self):
        with patch(
            "mcp_server_openviking_controlplane.cli.ControlPlaneClient.create_account",
            return_value={"Success": True, "OpenVikingAccountID": "team"},
        ) as create_account:
            result = self.runner.invoke(
                app,
                self.prefix + ["account", "create", "ov-example", "team"],
            )

        self.assertEqual(result.exit_code, 0)
        create_account.assert_called_once_with("ov-example", "team")

    def test_account_create_reports_validation_error_without_traceback(self):
        result = self.runner.invoke(
            app,
            self.prefix + ["account", "create", "ov-example", "team alpha"],
        )

        self.assertEqual(result.exit_code, 1)
        self.assertIn("Rules:", result.output)
        self.assertNotIn("Traceback", result.output)

    def test_account_delete_confirmation_can_abort_without_calling_backend(self):
        with patch(
            "mcp_server_openviking_controlplane.cli.ControlPlaneClient.delete_account"
        ) as delete_account:
            result = self.runner.invoke(
                app,
                self.prefix + ["account", "delete", "ov-example", "team"],
                input="n\n",
            )

        self.assertEqual(result.exit_code, 1)
        self.assertIn("Aborted", result.output)
        delete_account.assert_not_called()

    def test_account_delete_rejects_default_before_prompt_or_backend_call(self):
        with patch(
            "mcp_server_openviking_controlplane.cli.ControlPlaneClient.delete_account"
        ) as delete_account:
            result = self.runner.invoke(
                app,
                self.prefix + ["account", "delete", "ov-example", "default"],
            )

        self.assertEqual(result.exit_code, 1)
        self.assertIn("default account cannot be deleted", result.output)
        self.assertNotIn("[y/N]", result.output)
        delete_account.assert_not_called()

    def test_account_delete_confirmation_and_yes_flag_call_backend(self):
        for suffix, input_text in (([], "y\n"), (["--yes"], None)):
            with self.subTest(suffix=suffix):
                with patch(
                    "mcp_server_openviking_controlplane.cli.ControlPlaneClient.delete_account",
                    return_value={"Success": True},
                ) as delete_account:
                    result = self.runner.invoke(
                        app,
                        self.prefix
                        + ["account", "delete", "ov-example", "team"]
                        + suffix,
                        input=input_text,
                    )

                self.assertEqual(result.exit_code, 0)
                delete_account.assert_called_once_with("ov-example", "team")

    def test_user_delete_confirms_and_forwards_normalized_account_id(self):
        for raw_account_id, expected_account_id in ((" team ", "team"), ("   ", None)):
            with self.subTest(raw_account_id=raw_account_id):
                with patch(
                    "mcp_server_openviking_controlplane.cli.ControlPlaneClient.delete_user",
                    return_value={"Success": True},
                ) as delete_user:
                    result = self.runner.invoke(
                        app,
                        self.prefix
                        + [
                            "user",
                            "delete",
                            "ov-example",
                            "alice",
                            "--account-id",
                            raw_account_id,
                        ],
                        input="n\n",
                    )

                self.assertEqual(result.exit_code, 1)
                self.assertIn(
                    f"data space {expected_account_id or 'default'}", result.output
                )
                delete_user.assert_not_called()

                with patch(
                    "mcp_server_openviking_controlplane.cli.ControlPlaneClient.delete_user",
                    return_value={"Success": True},
                ) as delete_user:
                    result = self.runner.invoke(
                        app,
                        self.prefix
                        + [
                            "user",
                            "delete",
                            "ov-example",
                            "alice",
                            "--account-id",
                            raw_account_id,
                            "--yes",
                        ],
                    )

                self.assertEqual(result.exit_code, 0)
                delete_user.assert_called_once_with(
                    "ov-example", "alice", account_id=expected_account_id
                )

    def test_scoped_existing_commands_forward_account_and_user(self):
        cases = (
            (
                "get_user_access",
                ["api-key", "ov-example", "--account-id", "team", "--user-id", "alice"],
                ("ov-example",),
                {"user_id": "alice", "account_id": "team"},
                {"ApiKey": "plain"},
            ),
            (
                "get_usage",
                ["usage", "ov-example", "--account-id", "team", "--user-id", "alice"],
                ("ov-example",),
                {"account_id": "team", "user_id": "alice"},
                {"CurContextFileNum": 1},
            ),
            (
                "list_collection_users",
                ["user", "list", "ov-example", "--account-id", "team"],
                ("ov-example",),
                {
                    "user_id": None,
                    "role": None,
                    "page": 1,
                    "limit": 20,
                    "account_id": "team",
                },
                {"UserList": [], "Total": 0},
            ),
            (
                "register_user",
                ["user", "register", "ov-example", "alice", "--account-id", "team"],
                ("ov-example", "alice"),
                {"account_id": "team"},
                {"Success": True},
            ),
            (
                "update_user",
                [
                    "user",
                    "update",
                    "ov-example",
                    "alice",
                    "--regenerate-key",
                    "--account-id",
                    "team",
                ],
                ("ov-example", "alice"),
                {"regenerate_key": True, "account_id": "team"},
                {"Success": True},
            ),
            (
                "delete_user",
                [
                    "user",
                    "delete",
                    "ov-example",
                    "alice",
                    "--account-id",
                    "team",
                    "--yes",
                ],
                ("ov-example", "alice"),
                {"account_id": "team"},
                {"Success": True},
            ),
        )
        for method, argv, args, kwargs, response in cases:
            with self.subTest(method=method):
                with patch(
                    f"mcp_server_openviking_controlplane.cli.ControlPlaneClient.{method}",
                    return_value=response,
                ) as call:
                    result = self.runner.invoke(app, self.prefix + argv)
                self.assertEqual(result.exit_code, 0, result.output)
                call.assert_called_once_with(*args, **kwargs)


class AccountMcpContractTest(unittest.TestCase):
    def test_account_tools_forward_all_arguments(self):
        with patch.object(server, "get_client") as get_client:
            client = get_client.return_value
            client.list_accounts.return_value = {"AccountList": [], "Total": 0}
            client.create_account.return_value = {"Success": True}
            client.delete_account.return_value = {"Success": True}

            server.list_collection_accounts(
                "ov-example", keyword="team", page=2, limit=10
            )
            server.create_collection_account("ov-example", "team")
            server.delete_collection_account("ov-example", "team")

        client.list_accounts.assert_called_once_with(
            "ov-example", keyword="team", page=2, limit=10
        )
        client.create_account.assert_called_once_with("ov-example", "team")
        client.delete_account.assert_called_once_with("ov-example", "team")

    def test_existing_tools_forward_scope(self):
        with patch.object(server, "get_client") as get_client:
            client = get_client.return_value
            server.get_usage("ov-example", account_id="team", user_id="alice")
            server.get_collection_api_key(
                "ov-example", user_id="alice", account_id="team"
            )
            server.list_collection_users(
                "ov-example", account_id="team", page=2, limit=10
            )
            server.register_collection_user("ov-example", "alice", account_id="team")
            server.update_collection_user(
                "ov-example", "alice", regenerate_key=True, account_id="team"
            )
            server.delete_collection_user("ov-example", "alice", account_id="team")

        client.get_usage.assert_called_once_with(
            "ov-example", account_id="team", user_id="alice"
        )
        client.get_user_access.assert_called_once_with(
            "ov-example", user_id="alice", account_id="team"
        )
        client.list_collection_users.assert_called_once_with(
            "ov-example",
            user_id=None,
            role=None,
            page=2,
            limit=10,
            account_id="team",
        )
        client.register_user.assert_called_once_with(
            "ov-example", "alice", account_id="team"
        )
        client.update_user.assert_called_once_with(
            "ov-example", "alice", regenerate_key=True, account_id="team"
        )
        client.delete_user.assert_called_once_with(
            "ov-example", "alice", account_id="team"
        )

    def test_account_tools_return_structured_errors(self):
        cases = (
            (
                "list_accounts",
                lambda: server.list_collection_accounts("ov-example"),
                ControlPlaneError("Denied", "not allowed", "req-1"),
                {
                    "error": {
                        "code": "Denied",
                        "message": "not allowed",
                        "request_id": "req-1",
                    }
                },
            ),
            (
                "create_account",
                lambda: server.create_collection_account("ov-example", "bad value"),
                ValueError("invalid account_id"),
                {"error": {"message": "invalid account_id"}},
            ),
        )
        for method, call, error, expected in cases:
            with self.subTest(method=method):
                with patch.object(server, "get_client") as get_client:
                    getattr(get_client.return_value, method).side_effect = error
                    self.assertEqual(call(), expected)

    def test_public_signatures_expose_scope_and_keep_context_last(self):
        client_methods = (
            "get_usage",
            "get_user_access",
            "list_collection_users",
            "register_user",
            "update_user",
            "delete_user",
        )
        for name in client_methods:
            with self.subTest(layer="client", name=name):
                params = inspect.signature(getattr(ControlPlaneClient, name)).parameters
                self.assertIn("account_id", params)
        self.assertIn(
            "user_id", inspect.signature(ControlPlaneClient.get_usage).parameters
        )

        cli_commands = (
            "usage_cmd",
            "api_key_cmd",
            "user_list_cmd",
            "user_register_cmd",
            "user_update_cmd",
            "user_delete_cmd",
        )
        for name in cli_commands:
            with self.subTest(layer="cli", name=name):
                params = inspect.signature(getattr(cli, name)).parameters
                self.assertIn("account_id", params)
        self.assertIn("user_id", inspect.signature(cli.usage_cmd).parameters)

        server_tools = (
            "get_usage",
            "get_collection_api_key",
            "list_collection_users",
            "register_collection_user",
            "update_collection_user",
            "delete_collection_user",
            "list_collection_accounts",
            "create_collection_account",
            "delete_collection_account",
        )
        for name in server_tools:
            with self.subTest(layer="server", name=name):
                params = inspect.signature(getattr(server, name)).parameters
                self.assertEqual(next(reversed(params)), "ctx")
        self.assertIn("user_id", inspect.signature(server.get_usage).parameters)


if __name__ == "__main__":
    unittest.main()
