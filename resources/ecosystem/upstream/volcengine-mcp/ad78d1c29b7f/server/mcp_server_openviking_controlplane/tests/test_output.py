import json
import unittest
from io import StringIO

from rich.console import Console

from mcp_server_openviking_controlplane.output import OutputMode, render_result


class OutputRenderingTest(unittest.TestCase):
    def render(
        self,
        data,
        *,
        mode=OutputMode.AUTO,
        view="auto",
        is_terminal=False,
        width=100,
    ):
        stream = StringIO()
        console = Console(
            file=stream,
            force_terminal=False,
            color_system=None,
            width=width,
        )
        render_result(
            data,
            output_mode=mode,
            view=view,
            console=console,
            is_terminal=is_terminal,
        )
        return stream.getvalue()

    def test_auto_mode_keeps_piped_output_as_standard_json(self):
        data = {"ResourceID": "ov-123", "中文": "值"}

        output = self.render(data, is_terminal=False)

        self.assertEqual(json.loads(output), data)
        self.assertNotIn("\x1b[", output)

    def test_json_compact_is_machine_readable(self):
        data = {"ResourceID": "ov-123", "Success": True}

        output = self.render(data, mode=OutputMode.JSON_COMPACT)

        self.assertEqual(output, '{"ResourceID":"ov-123","Success":true}\n')

    def test_auto_mode_uses_usage_panel_in_a_terminal(self):
        data = {
            "CurContextFileNum": 20000,
            "ResourcesFileNum": 20000,
            "UserFileNum": 0,
            "FreshTime": 1785406248,
            "EstimatedCosts": "0.05",
            "EstimatedBilling": {
                "CNY": "0.05",
                "AFP": "25",
                "Period": "hour",
                "PayType": "agentplan_pay",
                "BusinessScenarios": "agent_plan_enterprise",
            },
        }

        output = self.render(
            data,
            view="usage",
            is_terminal=True,
            width=72,
        )

        self.assertIn("OpenViking Usage", output)
        self.assertIn("25 AFP / hour", output)
        self.assertIn("¥0.05 / hour", output)
        self.assertNotIn('"EstimatedBilling"', output)

    def test_collection_table_wraps_in_a_narrow_terminal(self):
        data = {
            "Collections": [
                {
                    "Name": "demo",
                    "ResourceID": "ov-very-long-resource-id",
                    "Version": "enterprise",
                    "Status": "READY",
                    "Project": "default",
                }
            ]
        }

        output = self.render(
            data,
            mode=OutputMode.PRETTY,
            view="collections",
            width=54,
        )

        self.assertIn("OpenViking Collections (1)", output)
        self.assertIn("demo", output)
        self.assertIn("READY", output)

    def test_account_table_renders_count_timestamp_and_boolean(self):
        data = {
            "AccountList": [
                {
                    "OpenVikingAccountID": "default",
                    "UserCount": 3,
                    "CreateTime": "2026-08-27T12:34:56Z",
                    "IsDefault": True,
                },
                {
                    "OpenVikingAccountID": "team-a",
                    "UserCount": 1,
                    "CreateTime": "1732100000",
                    "IsDefault": False,
                },
            ],
            "Total": 2,
        }

        output = self.render(data, mode=OutputMode.PRETTY, view="accounts")

        self.assertIn("Data Spaces (2)", output)
        self.assertIn("default", output)
        self.assertIn("team-a", output)
        self.assertIn("yes", output)
        self.assertIn("no", output)
        self.assertIn("2026-08-27T12:34:56Z", output)
        self.assertIn("1732100000", output)

    def test_scoped_usage_does_not_render_library_billing_placeholder(self):
        output = self.render(
            {"CurContextFileNum": 12, "ResourcesFileNum": 4},
            mode=OutputMode.PRETTY,
            view="usage",
        )

        self.assertIn("reported for the whole library, not per data space", output)
        self.assertNotIn("¥—", output)

    def test_api_key_view_warns_that_the_value_is_sensitive(self):
        output = self.render(
            {"UserID": "default", "Role": "admin", "ApiKey": "secret-key"},
            mode=OutputMode.PRETTY,
            view="api-key",
        )

        self.assertIn("Sensitive credential", output)
        self.assertIn("secret-key", output)


if __name__ == "__main__":
    unittest.main()
