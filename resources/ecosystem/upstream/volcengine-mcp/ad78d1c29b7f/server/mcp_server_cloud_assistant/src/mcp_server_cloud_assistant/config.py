import os
from dataclasses import dataclass


@dataclass
class CloudAssistantConfig:
    """Configuration for Cloud Assistant MCP Server."""

    volcengine_endpoint: str
    volcengine_ak: str
    volcengine_sk: str
    session_token: str


def load_config() -> CloudAssistantConfig:
    """Load configuration from environment variables."""
    config = CloudAssistantConfig(
        volcengine_endpoint=os.environ["VOLC_ENDPOINT"],
        volcengine_ak=os.environ["VOLC_ACCESSKEY"],
        volcengine_sk=os.environ["VOLC_SECRETKEY"],
        session_token=""
    )

    return config


def get_auth_config(ak, sk, session_token) -> CloudAssistantConfig:
    """Load configuration from auth and environment variables."""
    config = CloudAssistantConfig(
        volcengine_endpoint=os.environ["VOLC_ENDPOINT"],
        volcengine_ak=ak,
        volcengine_sk=sk,
        session_token=session_token,
    )

    return config
