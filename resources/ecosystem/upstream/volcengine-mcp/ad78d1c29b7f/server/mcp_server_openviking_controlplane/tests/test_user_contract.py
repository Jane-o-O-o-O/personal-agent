import unittest
from unittest.mock import patch

from typer.testing import CliRunner

from mcp_server_openviking_controlplane.cli import app
from mcp_server_openviking_controlplane.client import ControlPlaneClient
from mcp_server_openviking_controlplane.config import ControlPlaneConfig
from mcp_server_openviking_controlplane import server


class UserContractTest(unittest.TestCase):
    def setUp(self):
        self.client = ControlPlaneClient(ControlPlaneConfig(api_key="ark-test"))

    def test_get_user_access_can_select_user(self):
        with patch.object(
            self.client,
            "_request",
            return_value={"UserID": "alice", "Role": "user", "ApiKey": "plain"},
        ) as request:
            result = self.client.get_user_access("ov-example", user_id="alice")

        self.assertEqual(result["UserID"], "alice")
        request.assert_called_once_with(
            "GetOpenVikingCollectionUserAccess",
            {"ResourceID": "ov-example", "UserID": "alice"},
        )

    def test_get_user_access_omits_user_for_default(self):
        with patch.object(self.client, "_request", return_value={}) as request:
            self.client.get_user_access("ov-example")

        request.assert_called_once_with(
            "GetOpenVikingCollectionUserAccess",
            {"ResourceID": "ov-example"},
        )

    def test_list_users_forwards_filters_and_pagination(self):
        with patch.object(
            self.client,
            "_request",
            return_value={"UserList": [], "Total": 0},
        ) as request:
            self.client.list_collection_users(
                "ov-example",
                user_id="alice",
                role="user",
                page=2,
                limit=10,
            )

        request.assert_called_once_with(
            "ListOpenVikingCollectionUser",
            {
                "ResourceID": "ov-example",
                "UserID": "alice",
                "Role": "user",
                "Page": 2,
                "Limit": 10,
            },
        )

    def test_list_users_validates_pagination_locally(self):
        with self.assertRaisesRegex(ValueError, "page must be >= 1"):
            self.client.list_collection_users("ov-example", page=0)
        with self.assertRaisesRegex(ValueError, "limit must be between 1 and 200"):
            self.client.list_collection_users("ov-example", limit=201)

    def test_register_user_does_not_send_unsupported_role(self):
        with patch.object(self.client, "_request", return_value={"Success": True}) as request:
            self.client.register_user("ov-example", "alice")

        request.assert_called_once_with(
            "RegisterOpenVikingUser",
            {"ResourceID": "ov-example", "UserID": "alice"},
        )

    def test_update_user_sends_regenerate_key(self):
        with patch.object(self.client, "_request", return_value={"Success": True}) as request:
            self.client.update_user(
                "ov-example",
                "alice",
                regenerate_key=True,
            )

        request.assert_called_once_with(
            "UpdateOpenVikingUser",
            {
                "ResourceID": "ov-example",
                "UserID": "alice",
                "RegenerateKey": True,
            },
        )

    def test_update_user_rejects_no_op(self):
        with self.assertRaisesRegex(ValueError, "nothing to update"):
            self.client.update_user("ov-example", "alice")


class UserCliContractTest(unittest.TestCase):
    def setUp(self):
        self.runner = CliRunner()

    def test_api_key_accepts_user_id(self):
        with patch(
            "mcp_server_openviking_controlplane.cli.ControlPlaneClient.get_user_access",
            return_value={"UserID": "alice", "Role": "user", "ApiKey": "plain"},
        ) as get_user_access:
            result = self.runner.invoke(
                app,
                [
                    "--api-key",
                    "ark-test",
                    "--json",
                    "api-key",
                    "ov-example",
                    "--user-id",
                    "alice",
                ],
            )

        self.assertEqual(result.exit_code, 0)
        get_user_access.assert_called_once_with(
            "ov-example", user_id="alice", account_id=None
        )

    def test_user_list_accepts_filters_and_pagination(self):
        with patch(
            "mcp_server_openviking_controlplane.cli.ControlPlaneClient.list_collection_users",
            return_value={"UserList": [], "Total": 0},
        ) as list_users:
            result = self.runner.invoke(
                app,
                [
                    "--api-key",
                    "ark-test",
                    "--json",
                    "user",
                    "list",
                    "ov-example",
                    "--user-id",
                    "alice",
                    "--role",
                    "user",
                    "--page",
                    "2",
                    "--limit",
                    "10",
                ],
            )

        self.assertEqual(result.exit_code, 0)
        list_users.assert_called_once_with(
            "ov-example",
            user_id="alice",
            role="user",
            page=2,
            limit=10,
            account_id=None,
        )

    def test_user_update_requires_regenerate_key(self):
        result = self.runner.invoke(
            app,
            [
                "--api-key",
                "ark-test",
                "user",
                "update",
                "ov-example",
                "alice",
            ],
        )

        self.assertEqual(result.exit_code, 1)
        self.assertIn("nothing to update", result.output)


class UserMcpContractTest(unittest.TestCase):
    def test_api_key_tool_forwards_user_id(self):
        with patch.object(
            server,
            "get_client",
        ) as get_client:
            get_client.return_value.get_user_access.return_value = {
                "UserID": "alice",
                "Role": "user",
                "ApiKey": "plain",
            }

            result = server.get_collection_api_key("ov-example", user_id="alice")

        self.assertEqual(result["UserID"], "alice")
        get_client.return_value.get_user_access.assert_called_once_with(
            "ov-example",
            user_id="alice",
            account_id=None,
        )

    def test_list_users_tool_forwards_filters_and_pagination(self):
        with patch.object(server, "get_client") as get_client:
            get_client.return_value.list_collection_users.return_value = {
                "UserList": [],
                "Total": 0,
            }

            server.list_collection_users(
                "ov-example",
                user_id="alice",
                role="user",
                page=2,
                limit=10,
            )

        get_client.return_value.list_collection_users.assert_called_once_with(
            "ov-example",
            user_id="alice",
            role="user",
            page=2,
            limit=10,
            account_id=None,
        )

    def test_register_and_update_tools_match_backend_fields(self):
        with patch.object(server, "get_client") as get_client:
            get_client.return_value.register_user.return_value = {"Success": True}
            get_client.return_value.update_user.return_value = {"Success": True}

            server.register_collection_user("ov-example", "alice")
            server.update_collection_user(
                "ov-example",
                "alice",
                regenerate_key=True,
            )

        get_client.return_value.register_user.assert_called_once_with(
            "ov-example",
            "alice",
            account_id=None,
        )
        get_client.return_value.update_user.assert_called_once_with(
            "ov-example",
            "alice",
            regenerate_key=True,
            account_id=None,
        )


if __name__ == "__main__":
    unittest.main()
