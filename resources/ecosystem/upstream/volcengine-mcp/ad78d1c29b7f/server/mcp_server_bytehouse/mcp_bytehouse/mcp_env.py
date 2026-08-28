"""Environment configuration for the MCP ClickHouse server.

This module handles all environment variable configuration with sensible defaults
and type conversion.
"""

from dataclasses import dataclass
import os
from typing import Optional


@dataclass
class ClickHouseConfig:
    """Configuration for ClickHouse connection settings.

    This class handles all environment variable configuration with sensible defaults
    and type conversion. It provides typed methods for accessing each configuration value.

    Required environment variables:
        BYTEHOUSE_HOST: The hostname of the ClickHouse server
        BYTEHOUSE_USER: The username for authentication
        BYTEHOUSE_PASSWORD: The password for authentication

    Optional environment variables (with defaults):
        BYTEHOUSE_PORT: The port number (default: 8443 if secure=True, 8123 if secure=False)
        BYTEHOUSE_SECURE: Enable HTTPS (default: true)
        BYTEHOUSE_VERIFY: Verify SSL certificates (default: true)
        BYTEHOUSE_CONNECT_TIMEOUT: Connection timeout in seconds (default: 30)
        BYTEHOUSE_SEND_RECEIVE_TIMEOUT: Send/receive timeout in seconds (default: 300)
        BYTEHOUSE_DATABASE: Default database to use (default: None)
    """

    def __init__(self):
        """Initialize the configuration from environment variables."""
        self._validate_required_vars()

    @property
    def host(self) -> str:
        """Get the ClickHouse host."""
        return os.environ["BYTEHOUSE_HOST"]

    @property
    def port(self) -> int:
        """Get the ClickHouse port.

        Defaults to 8443 if secure=True, 8123 if secure=False.
        Can be overridden by BYTEHOUSE_PORT environment variable.
        """
        if "BYTEHOUSE_PORT" in os.environ:
            return int(os.environ["BYTEHOUSE_PORT"])
        return 8443 if self.secure else 8123

    @property
    def username(self) -> str:
        """Get the ClickHouse username."""
        return os.environ["BYTEHOUSE_USER"]

    @property
    def password(self) -> str:
        """Get the ClickHouse password."""
        return os.environ["BYTEHOUSE_PASSWORD"]

    @property
    def database(self) -> Optional[str]:
        """Get the default database name if set."""
        return os.getenv("BYTEHOUSE_DATABASE")

    @property
    def secure(self) -> bool:
        """Get whether HTTPS is enabled.

        Default: True
        """
        return os.getenv("BYTEHOUSE_SECURE", "true").lower() == "true"

    @property
    def verify(self) -> bool:
        """Get whether SSL certificate verification is enabled.

        Default: True
        """
        return os.getenv("BYTEHOUSE_VERIFY", "true").lower() == "true"

    @property
    def connect_timeout(self) -> int:
        """Get the connection timeout in seconds.

        Default: 30
        """
        return int(os.getenv("BYTEHOUSE_CONNECT_TIMEOUT", "30"))

    @property
    def send_receive_timeout(self) -> int:
        """Get the send/receive timeout in seconds.

        Default: 300 (ClickHouse default)
        """
        return int(os.getenv("BYTEHOUSE_SEND_RECEIVE_TIMEOUT", "300"))

    def get_client_config(self) -> dict:
        """Get the configuration dictionary for BYTEHOUSE_connect client.

        Returns:
            dict: Configuration ready to be passed to BYTEHOUSE_connect.get_client()
        """
        config = {
            "host": self.host,
            "port": self.port,
            "username": self.username,
            "password": self.password,
            "secure": self.secure,
            "verify": self.verify,
            "connect_timeout": self.connect_timeout,
            "send_receive_timeout": self.send_receive_timeout,
            "client_name": "mcp_bytehouse",
        }

        # Add optional database if set
        if self.database:
            config["database"] = self.database

        return config

    def _validate_required_vars(self) -> None:
        """Validate that all required environment variables are set.

        Raises:
            ValueError: If any required environment variable is missing.
        """
        missing_vars = []
        for var in ["BYTEHOUSE_HOST", "BYTEHOUSE_USER", "BYTEHOUSE_PASSWORD"]:
            if var not in os.environ:
                missing_vars.append(var)

        if missing_vars:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_vars)}"
            )


# Global instance for easy access
config = ClickHouseConfig()
