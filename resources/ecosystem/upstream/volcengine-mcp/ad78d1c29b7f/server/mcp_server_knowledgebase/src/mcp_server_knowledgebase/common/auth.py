import json

from volcengine.auth.SignerV4 import SignerV4
from volcengine.base.Request import Request
from volcengine.Credentials import Credentials
from mcp_server_knowledgebase.config import config


def prepare_request(
    method, path, ak=None, sk=None, params=None, data=None, doseq=0, *, api_key=None
):
    ak = ak.strip() if isinstance(ak, str) else ak
    sk = sk.strip() if isinstance(sk, str) else sk
    api_key = api_key.strip() if isinstance(api_key, str) else api_key

    if not api_key:
        if bool(ak) != bool(sk):
            raise ValueError("AK and SK must be configured together")
        if not ak or not sk:
            raise ValueError("Configure an authentication method: VIKING_API_KEY or AK/SK")

    if params:
        for key in params:
            if (
                type(params[key]) == int
                or type(params[key]) == float
                or type(params[key]) == bool
            ):
                params[key] = str(params[key])
            elif type(params[key]) == list:
                if not doseq:
                    params[key] = ",".join(params[key])
    r = Request()
    r.set_shema("https")
    r.set_method(method)
    r.set_connection_timeout(10)
    r.set_socket_timeout(10)
    mheaders = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if api_key:
        mheaders["Authorization"] = f"Bearer {api_key}"
    r.set_headers(mheaders)
    if params:
        r.set_query(params)
    r.set_path(path)
    if data is not None:
        r.set_body(json.dumps(data))
    if not api_key:
        credentials = Credentials(ak, sk, "air", config.region)
        SignerV4.sign(r, credentials)
    return r
