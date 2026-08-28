import unittest
from inspect import signature
from unittest.mock import patch

from mcp_server_openviking_controlplane import server
from mcp_server_openviking_controlplane.cli import update_cmd
from mcp_server_openviking_controlplane.client import (
    ControlPlaneClient,
    ControlPlaneError,
)
from mcp_server_openviking_controlplane.config import ControlPlaneConfig


class CollectionUpdateContractTest(unittest.TestCase):
    def setUp(self):
        self.client = ControlPlaneClient(ControlPlaneConfig(api_key="ark-test"))

    def test_description_update_preserves_model_configuration(self):
        with patch.object(
            self.client,
            "_request",
            return_value={"Success": True},
        ) as request:
            self.client.update_collection(
                "ov-example",
                description="new description",
            )

        request.assert_called_once_with(
            "UpdateOpenVikingCollection",
            {
                "ResourceID": "ov-example",
                "Description": "new description",
            },
        )

    def test_billing_update_preserves_model_configuration(self):
        with patch.object(
            self.client,
            "_request",
            return_value={"Success": True},
        ) as request:
            self.client.update_collection(
                "ov-example",
                pay_type="volc_pay",
            )

        request.assert_called_once_with(
            "UpdateOpenVikingCollection",
            {
                "ResourceID": "ov-example",
                "PaymentConfig": {"PayType": "volc_pay"},
            },
        )

    def test_explicit_model_updates_are_forwarded(self):
        with patch.object(
            self.client,
            "_request",
            return_value={"Success": True},
        ) as request:
            self.client.update_collection(
                "ov-example",
                vlm={
                    "ModelName": "doubao-seed-2.0-lite",
                    "Credentials": [
                        {
                            "Source": "agentplan",
                            "ApiKey": "ark-model",
                        }
                    ],
                },
            )

        request.assert_called_once_with(
            "UpdateOpenVikingCollection",
            {
                "ResourceID": "ov-example",
                "VLM": {
                    "ModelName": "doubao-seed-2.0-lite",
                    "Credentials": [
                        {
                            "Source": "agentplan",
                            "ApiKey": "ark-model",
                        }
                    ],
                },
            },
        )

    def test_replays_existing_credentials_when_backend_rebuilds_models(self):
        collection = {
            "VLM": {
                "ModelName": "doubao-seed-2.0-lite",
                "Credentials": [
                    {"Source": "agentplan", "Provider": "volcengine"},
                    {
                        "Source": "volcengine",
                        "Provider": "volcengine",
                        "ApiKeyID": "4131627",
                        "EndpointID": "ep-vlm",
                    },
                ],
            },
            "Embedding": {
                "ModelName": "doubao-embedding-vision",
                "Credentials": [
                    {
                        "Source": "volcengine",
                        "Provider": "volcengine",
                        "ApiKeyID": "4131628",
                        "EndpointID": "ep-embedding",
                    }
                ],
            },
        }
        rejection = ControlPlaneError("InvalidParameter", "apikey is empty")

        def respond(action, body):
            if action == "GetOpenVikingCollection":
                return collection
            if "VLM" not in body:
                raise rejection
            return {"Success": True}

        with patch.object(self.client, "_request", side_effect=respond) as request:
            result = self.client.update_collection(
                "ov-example",
                description="new description",
            )

        self.assertEqual(
            [call.args[0] for call in request.call_args_list],
            [
                "UpdateOpenVikingCollection",
                "GetOpenVikingCollection",
                "UpdateOpenVikingCollection",
            ],
        )
        self.assertEqual(
            request.call_args_list[-1].args[1],
            {
                "ResourceID": "ov-example",
                "Description": "new description",
                "VLM": {
                    "ModelName": "doubao-seed-2.0-lite",
                    "Credentials": [
                        {
                            "Source": "agentplan",
                            "Provider": "volcengine",
                            "ApiKey": "ark-test",
                        },
                        {
                            "Source": "volcengine",
                            "Provider": "volcengine",
                            "ApiKeyID": "4131627",
                            "EndpointID": "ep-vlm",
                        },
                    ],
                },
                "Embedding": {
                    "ModelName": "doubao-embedding-vision",
                    "Credentials": [
                        {
                            "Source": "volcengine",
                            "Provider": "volcengine",
                            "ApiKeyID": "4131628",
                            "EndpointID": "ep-embedding",
                        }
                    ],
                },
            },
        )
        self.assertIn("AgentPlan", result["Note"])

    def test_replay_is_refused_when_a_credential_cannot_be_rebuilt(self):
        collection = {
            "VLM": {
                "ModelName": "doubao-seed-2.0-lite",
                "Credentials": [{"Source": "codeplan", "Provider": "volcengine"}],
            },
        }

        def respond(action, body):
            if action == "GetOpenVikingCollection":
                return collection
            raise ControlPlaneError("InvalidParameter", "apikey is empty")

        with patch.object(self.client, "_request", side_effect=respond):
            with self.assertRaises(ControlPlaneError) as raised:
                self.client.update_collection("ov-example", description="new")

        self.assertEqual(raised.exception.code, "CredentialNotReplayable")
        self.assertIn("codeplan", raised.exception.message)

    def test_explicit_model_update_failure_is_not_retried(self):
        with patch.object(
            self.client,
            "_request",
            side_effect=ControlPlaneError("InvalidParameter", "apikey is empty"),
        ) as request:
            with self.assertRaises(ControlPlaneError):
                self.client.update_collection(
                    "ov-example",
                    vlm={"Credentials": [{"Source": "agentplan", "ApiKey": "ark-x"}]},
                )

        self.assertEqual(request.call_count, 1)

    def test_unrelated_errors_are_not_retried(self):
        with patch.object(
            self.client,
            "_request",
            side_effect=ControlPlaneError("ProductUnordered", "product not ordered"),
        ) as request:
            with self.assertRaises(ControlPlaneError):
                self.client.update_collection("ov-example", description="new")

        self.assertEqual(request.call_count, 1)

    def test_explicit_agentplan_key_overwrites_model_credentials(self):
        collection = {
            "VLM": {
                "ModelName": "doubao-seed-2.0-lite",
                "Credentials": [
                    {"Source": "agentplan", "Provider": "volcengine"},
                    {
                        "Source": "volcengine",
                        "Provider": "volcengine",
                        "ApiKeyID": "4131627",
                        "EndpointID": "ep-vlm",
                    },
                ],
            },
            "Embedding": {
                "ModelName": "doubao-embedding-vision",
                "Credentials": [{"Source": "agentplan", "Provider": "volcengine"}],
            },
        }

        def respond(action, body):
            if action == "GetOpenVikingCollection":
                return collection
            return {"Success": True}

        with patch.object(self.client, "_request", side_effect=respond) as request:
            result = self.client.update_collection(
                "ov-example",
                description="new description",
                model_api_key="ark-model-override",
            )

        self.assertEqual(
            [call.args[0] for call in request.call_args_list],
            ["GetOpenVikingCollection", "UpdateOpenVikingCollection"],
        )
        sent = request.call_args_list[-1].args[1]
        self.assertEqual(sent["Description"], "new description")
        # One supplied key, written to both models; siblings replayed untouched.
        self.assertEqual(
            sent["VLM"]["Credentials"],
            [
                {
                    "Source": "agentplan",
                    "Provider": "volcengine",
                    "ApiKey": "ark-model-override",
                },
                {
                    "Source": "volcengine",
                    "Provider": "volcengine",
                    "ApiKeyID": "4131627",
                    "EndpointID": "ep-vlm",
                },
            ],
        )
        self.assertEqual(
            sent["Embedding"]["Credentials"],
            [
                {
                    "Source": "agentplan",
                    "Provider": "volcengine",
                    "ApiKey": "ark-model-override",
                }
            ],
        )
        self.assertIn("overwritten", result["Note"])

    def test_explicit_key_overrides_an_agentplan_credential_stored_by_id(self):
        collection = {
            "VLM": {
                "ModelName": "doubao-seed-2.0-lite",
                "Credentials": [{"Source": "agentplan", "ApiKeyID": "4131600"}],
            },
            "Embedding": {
                "ModelName": "doubao-embedding-vision",
                "Credentials": [{"Source": "agentplan", "ApiKeyID": "4131600"}],
            },
        }

        def respond(action, body):
            return collection if action == "GetOpenVikingCollection" else {"Success": True}

        with patch.object(self.client, "_request", side_effect=respond) as request:
            self.client.update_collection("ov-example", model_api_key="ark-new")

        sent = request.call_args_list[-1].args[1]
        self.assertEqual(
            sent["VLM"]["Credentials"], [{"Source": "agentplan", "ApiKey": "ark-new"}]
        )

    def test_explicit_key_is_refused_without_an_agentplan_credential(self):
        collection = {
            "VLM": {
                "ModelName": "doubao-seed-2.0-lite",
                "Credentials": [
                    {"Source": "volcengine", "ApiKeyID": "4131627", "EndpointID": "ep"}
                ],
            },
            "Embedding": {
                "ModelName": "doubao-embedding-vision",
                "Credentials": [
                    {"Source": "volcengine", "ApiKeyID": "4131628", "EndpointID": "ep2"}
                ],
            },
        }

        def respond(action, body):
            return collection if action == "GetOpenVikingCollection" else {"Success": True}

        with patch.object(self.client, "_request", side_effect=respond) as request:
            with self.assertRaises(ControlPlaneError) as raised:
                self.client.update_collection("ov-example", model_api_key="ark-new")

        self.assertEqual(raised.exception.code, "CredentialNotReplayable")
        self.assertNotIn(
            "UpdateOpenVikingCollection",
            [call.args[0] for call in request.call_args_list],
        )

    def test_explicit_key_conflicts_with_an_explicit_model_block(self):
        with patch.object(self.client, "_request") as request:
            with self.assertRaises(ValueError):
                self.client.update_collection(
                    "ov-example",
                    model_api_key="ark-new",
                    vlm={"Credentials": [{"Source": "agentplan", "ApiKey": "ark-x"}]},
                )
        request.assert_not_called()

    def test_model_api_key_is_exposed_on_every_update_entry_point(self):
        for entry in (self.client.update_collection, server.update_collection, update_cmd):
            self.assertIn("model_api_key", signature(entry).parameters)

    def test_removed_version_update_is_not_exposed(self):
        self.assertNotIn("openviking_version", signature(self.client.update_collection).parameters)
        self.assertNotIn("openviking_version", signature(server.update_collection).parameters)
        self.assertNotIn("openviking_version", signature(update_cmd).parameters)


if __name__ == "__main__":
    unittest.main()
