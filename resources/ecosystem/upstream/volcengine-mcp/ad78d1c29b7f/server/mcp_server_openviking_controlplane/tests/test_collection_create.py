import unittest
from inspect import signature
from unittest.mock import patch

from typer.testing import CliRunner

from mcp_server_openviking_controlplane import server
from mcp_server_openviking_controlplane.cli import app, create_cmd
from mcp_server_openviking_controlplane.client import ControlPlaneClient


class CollectionCreateContractTest(unittest.TestCase):
    def test_advanced_model_options_are_only_available_in_low_level_client(self):
        low_level_parameters = signature(ControlPlaneClient.create_collection).parameters
        for name in ("source", "vlm", "embedding", "openviking_version"):
            self.assertIn(name, low_level_parameters)
            self.assertNotIn(name, signature(create_cmd).parameters)
            self.assertNotIn(name, signature(server.create_collection).parameters)


class CollectionCreateCliTest(unittest.TestCase):
    def setUp(self):
        self.runner = CliRunner()

    def test_help_hides_model_and_image_options(self):
        result = self.runner.invoke(app, ["create", "--help"])

        self.assertEqual(result.exit_code, 0)
        for option in (
            "--source",
            "--vlm-model",
            "--vlm-api-key-id",
            "--vlm-api-key",
            "--vlm-endpoint-id",
            "--emb-model",
            "--emb-api-key-id",
            "--emb-api-key",
            "--emb-endpoint-id",
            "--openviking-version",
        ):
            self.assertNotIn(option, result.output)
        self.assertIn("--version", result.output)

    def test_create_uses_agentplan_without_model_arguments(self):
        with patch(
            "mcp_server_openviking_controlplane.cli.ControlPlaneClient.create_collection",
            return_value={"ResourceID": "ov-example", "Success": True},
        ) as create_collection:
            result = self.runner.invoke(
                app,
                [
                    "--api-key",
                    "ark-test",
                    "--json",
                    "create",
                    "--name",
                    "demo",
                    "--version",
                    "enterprise",
                    "--pay-type",
                    "volc_pay",
                ],
            )

        self.assertEqual(result.exit_code, 0)
        create_collection.assert_called_once_with(
            name="demo",
            source="agentplan",
            version="enterprise",
            project=None,
            description=None,
            pay_type="volc_pay",
            seat_id=None,
        )


class CollectionCreateMcpTest(unittest.TestCase):
    def test_create_uses_agentplan_without_model_arguments(self):
        with patch.object(server, "get_client") as get_client:
            get_client.return_value.create_collection.return_value = {
                "ResourceID": "ov-example",
                "Success": True,
            }

            result = server.create_collection(
                "demo",
                version="enterprise",
                pay_type="volc_pay",
            )

        self.assertTrue(result["Success"])
        get_client.return_value.create_collection.assert_called_once_with(
            name="demo",
            source="agentplan",
            version="enterprise",
            project=None,
            description=None,
            pay_type="volc_pay",
            seat_id=None,
        )


if __name__ == "__main__":
    unittest.main()
