import base64
import json
import logging
import os
from dataclasses import dataclass

from starlette.requests import Request
from volcenginesdkcore.signv4 import SignerV4

logger = logging.getLogger(__name__)

DEFAULT_REGION = "cn-beijing"
DEFAULT_ENDPOINT = "https://open.volcengineapi.com"


@dataclass
class SecIntelligentConfig:
    """Configuration for Storage TOS MCP Server.

        Required environment variables:
            VOLC_ACCESSKEY: The Access key ID for authentication
            VOLC_SECRETKEY: Access key secret for authentication
            ENDPOINT:       The service endpoint
            REGION:         The region of the service
        """
    access_key: str
    secret_key: str
    region: str
    endpoint: str
    security_token: str
    debug: bool

    def append_authorization(self, path, method, headers, body, post_params, query, service):
        SignerV4.sign(path, method, headers, body, post_params, query, self.access_key, self.secret_key, self.region,
                      service,
                      self.security_token)


def validate_required_vars():
    """
    Validate that all required environment variables are set.

    Raises:
    ValueError: If any required environment variable is missing.
    """
    missing_vars = []
    for var in ["VOLC_ACCESSKEY", "VOLC_SECRETKEY"]:
        if var not in os.environ:
            missing_vars.append(var)

    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")


def load_config(raw_request: Request) -> SecIntelligentConfig:
    auth = None
    if raw_request:
        # 从 header 的 authorization 字段读取 base64 编码后的 sts json
        auth = raw_request.headers.get("authorization", None)
    if auth is None:
        # 如果 header 中没有认证信息，可能是 stdio 模式，尝试从环境变量获取
        auth = os.getenv("authorization", None)
    if auth is not None:
        if ' ' in auth:
            _, base64_data = auth.split(' ', 1)
        else:
            base64_data = auth

        try:
            config = parse_authorization(base64_data)
            return config
        except Exception as e:
            raise ValueError("Decode authorization info error", e)

    # validate_required_vars()  # 不强校验AKSK，允许通过authorization参数传入
    config = SecIntelligentConfig(
        access_key=os.environ.get("VOLC_ACCESSKEY", ""),
        secret_key=os.environ.get("VOLC_SECRETKEY", ""),
        region=DEFAULT_REGION if os.environ.get("REGION", "") == "" else os.environ.get("REGION"),
        endpoint=DEFAULT_ENDPOINT if os.environ.get("ENDPOINT", "") == "" else os.environ.get("ENDPOINT"),
        security_token=os.environ.get("SECURITY_TOKEN", ""),
        debug=True if os.environ.get("DEBUG", "").lower() == "true" else False,
    )

    logger.info(f"Loaded configuration, endpoint: {config.endpoint}, region: {config.region}")

    return config


def parse_authorization(authorization: str) -> SecIntelligentConfig:
    b = base64.standard_b64decode(authorization)
    auth_obj = json.loads(b.decode("utf-8"))
    return SecIntelligentConfig(
        access_key=auth_obj["AccessKeyId"],
        secret_key=auth_obj["SecretAccessKey"],
        region=DEFAULT_REGION,
        endpoint=DEFAULT_ENDPOINT,
        security_token=auth_obj["SessionToken"],
        debug=False,
    )
