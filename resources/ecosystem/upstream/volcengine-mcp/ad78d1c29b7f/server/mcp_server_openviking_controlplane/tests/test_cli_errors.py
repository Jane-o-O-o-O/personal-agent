import unittest

from typer.testing import CliRunner

from mcp_server_openviking_controlplane.cli import app


class CliParseErrorTest(unittest.TestCase):
    def setUp(self):
        self.runner = CliRunner()

    def test_invalid_pay_type_is_a_short_usage_error(self):
        result = self.runner.invoke(
            app,
            ["create", "--name", "demo", "--pay-type", "agentplan"],
        )

        self.assertEqual(result.exit_code, 2)
        self.assertIn("Invalid value for '--pay-type'", result.output)
        self.assertIn("agentplan_enterprise", result.output)
        self.assertNotIn("Traceback", result.output)

    def test_invalid_version_is_a_short_usage_error(self):
        result = self.runner.invoke(
            app,
            ["create", "--name", "demo", "--version", "premium"],
        )

        self.assertEqual(result.exit_code, 2)
        self.assertIn("Invalid value for '--version'", result.output)
        self.assertIn("enterprise", result.output)
        self.assertNotIn("Traceback", result.output)

    def test_unknown_option_does_not_emit_a_traceback(self):
        result = self.runner.invoke(
            app,
            ["create", "--name", "demo", "--sead-id", "seat-demo"],
        )

        self.assertEqual(result.exit_code, 2)
        self.assertIn("No such option: --sead-id", result.output)
        self.assertIn("--seat-id", result.output)
        self.assertNotIn("Traceback", result.output)


if __name__ == "__main__":
    unittest.main()
