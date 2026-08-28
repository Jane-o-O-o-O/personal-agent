import unittest
from unittest.mock import patch

import requests

from mcp_server_openviking_controlplane.client import (
    ControlPlaneClient,
    enrich_usage_billing,
)
from mcp_server_openviking_controlplane.config import ControlPlaneConfig


class UsageBillingTest(unittest.TestCase):
    def test_agentplan_usage_includes_afp_and_cny_per_hour(self):
        usage = {"EstimatedCosts": "0.05"}
        collection = {
            "PaymentConfig": {
                "PayType": "agentplan_pay",
                "AgentPlanConfig": {
                    "BusinessScenarios": "agent_plan_enterprise",
                },
            }
        }

        result = enrich_usage_billing(usage, collection)

        self.assertEqual(
            result["EstimatedBilling"],
            {
                "CNY": "0.05",
                "Period": "hour",
                "PayType": "agentplan_pay",
                "BusinessScenarios": "agent_plan_enterprise",
                "AFP": "25",
            },
        )

    def test_volc_usage_does_not_claim_an_afp_charge(self):
        result = enrich_usage_billing(
            {"EstimatedCosts": "0.05"},
            {"PaymentConfig": {"PayType": "volc_pay"}},
        )

        self.assertEqual(
            result["EstimatedBilling"],
            {
                "CNY": "0.05",
                "Period": "hour",
                "PayType": "volc_pay",
            },
        )

    def test_existing_server_billing_is_authoritative(self):
        usage = {
            "EstimatedCosts": "0.05",
            "EstimatedBilling": {"AFP": "24", "Period": "hour"},
        }

        result = enrich_usage_billing(
            usage,
            {"PaymentConfig": {"PayType": "agentplan_pay"}},
        )

        self.assertEqual(result["EstimatedBilling"]["AFP"], "24")

    def test_usage_survives_collection_metadata_failure(self):
        client = ControlPlaneClient(ControlPlaneConfig(api_key="ark-real-key"))
        with patch.object(
            client,
            "_request",
            side_effect=[
                {"EstimatedCosts": "0.05", "AgentFileNum": 99},
                requests.ConnectionError("metadata unavailable"),
            ],
        ):
            result = client.get_usage("ov-example")

        self.assertNotIn("AgentFileNum", result)
        self.assertEqual(
            result["EstimatedBilling"],
            {"CNY": "0.05", "Period": "hour"},
        )


if __name__ == "__main__":
    unittest.main()
