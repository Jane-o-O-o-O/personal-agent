import unittest

from mcp_server_openviking_controlplane.common.auth import BearerTokenAuth
from mcp_server_openviking_controlplane.config import ControlPlaneConfig


class HeaderValidationTest(unittest.TestCase):
    def test_agentplan_api_key_rejects_non_ascii_placeholder(self):
        with self.assertRaisesRegex(
            ValueError,
            "AgentPlan API key contains non-ASCII characters",
        ):
            BearerTokenAuth("ark-你的key")

    def test_agentplan_api_key_accepts_bearer_prefix(self):
        auth = BearerTokenAuth("Bearer ark-real-key")

        self.assertEqual(
            auth.auth_headers("POST", "/", {}, "{}"),
            {"Authorization": "Bearer ark-real-key"},
        )

    def test_extra_header_rejects_invalid_name(self):
        config = ControlPlaneConfig(
            api_key="ark-real-key",
            extra_headers={"bad header": "value"},
        )

        with self.assertRaisesRegex(ValueError, "extra header name"):
            config.safe_extra_headers()

    def test_extra_header_rejects_non_latin1_value(self):
        config = ControlPlaneConfig(
            api_key="ark-real-key",
            extra_headers={"x-tt-env": "泳道"},
        )

        with self.assertRaisesRegex(ValueError, "extra header 'x-tt-env'"):
            config.safe_extra_headers()


if __name__ == "__main__":
    unittest.main()
