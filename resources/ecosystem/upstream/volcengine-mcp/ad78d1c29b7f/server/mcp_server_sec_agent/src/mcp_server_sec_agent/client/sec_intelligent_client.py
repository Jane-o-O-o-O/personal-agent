import json
from urllib.parse import urlparse

import requests

from mcp_server_sec_agent.client.model import *
from mcp_server_sec_agent.config import SecIntelligentConfig


class SecIntelligentClient(object):
    def __init__(self, cred: SecIntelligentConfig):
        if cred.access_key == "" or cred.secret_key == "" or cred.endpoint == "":
            raise ValueError("access_key, secret_key or endpoint is empty")

        # api_client = volcenginesdkcore.ApiClient()
        # self.api_client = api_client
        self.cred = cred

    def do_request(self, req: requests.Request) -> requests.Response:
        # 添加header
        req.headers["Content-Type"] = "application/json"
        req.headers["Host"] = urlparse(self.cred.endpoint).hostname
        # 签名
        self.cred.append_authorization(
            urlparse(req.url).path,
            req.method,
            req.headers,
            req.data,
            None,
            req.params,
            "sec_agent",
        )
        req = req.prepare()
        with requests.Session() as session:
            resp = session.send(req)
            return resp

    def get_result(self, req) -> SecIntelligentMCPCallResult:
        req_json = json.dumps(req.to_dict())
        query = {
            "Action": "GetMCPCallResult",
            "Version": "2025-01-01",
        }
        request = requests.Request(
            method="POST",
            url=self.cred.endpoint,
            data=req_json,
            params=query,
        )
        response = self.do_request(request)
        if response.status_code != 200:
            raise Exception(
                f"get_result failed, status_code: {response.status_code}, response: {response.text},request_headers: {request.headers}, request_url:{request.url}, request_params:{request.params}, request_data:{request.data},request_body:{request.json}")
        resp_obj = json.loads(response.text)
        resp = SecIntelligentMCPCallResult.from_dict(req_json, resp_obj)
        return resp

    def alert_analysis(self, req: AlertAnalysisRequest) -> AlertAnalysisResponse:
        req_json = json.dumps(req.to_dict())
        query = {
            "Action": "RunAlertInvestigator",
            "Version": "2025-01-01",
        }
        request = requests.Request(
            method="POST",
            url=self.cred.endpoint,
            data=req_json,
            params=query,
        )
        response = self.do_request(request)
        if response.status_code != 200:
            raise Exception(
                f"alert_analysis failed, status_code: {response.status_code}, response: {response.text},request_headers: {request.headers}, request_url:{request.url}, request_params:{request.params}, request_data:{request.data},request_body:{request.json}")
        resp_obj = json.loads(response.text)
        resp = AlertAnalysisResponse.from_dict(req_json, resp_obj)
        return resp

    def pcap_analysis(self, req: PcapAnalysisRequest) -> PcapAnalysisResponse:
        req_json = json.dumps(req.to_dict())
        query = {
            "Action": "RunPcapAnalyzer",
            "Version": "2025-01-01",
        }
        request = requests.Request(
            method="POST",
            url=self.cred.endpoint,
            data=req_json,
            params=query,
        )
        response = self.do_request(request)
        if response.status_code != 200:
            raise Exception(
                f"pcap_analysis failed, request_query:{request.params}, request_body:{request.json}, status_code: {response.status_code}, response: {response.text},request_headers: {request.headers}, request_url:{request.url}, request_params:{request.params}, request_data:{request.data},request_body:{request.json}")
        resp_obj = json.loads(response.text)
        resp = PcapAnalysisResponse.from_dict(req_json, resp_obj)
        return resp

    def params_format(self, req: ParamsFormatRequest) -> ParamsFormatResponse:
        req_json = json.dumps(req.to_dict())
        query = {
            "Action": "RunAlertFormatter",
            "Version": "2025-01-01",
        }
        request = requests.Request(
            method="POST",
            url=self.cred.endpoint,
            data=req_json,
            params=query,
        )
        response = self.do_request(request)
        if response.status_code != 200:
            raise Exception(
                f"params_format failed, request_query:{request.params}, request_body:{request.json}, status_code: {response.status_code}, response: {response.text},request_headers: {request.headers}, request_url:{request.url}, request_params:{request.params}, request_data:{request.data},request_body:{request.json}")
        resp_obj = json.loads(response.text)
        resp = ParamsFormatResponse.from_dict(req_json, resp_obj)
        return resp

    def threat_intelligence_production(self,
                                       req: ThreatIntelligenceProductionRequest) -> ThreatIntelligenceProductionResponse:
        req_json = json.dumps(req.to_dict())
        query = {
            "Action": "RunThreatIntelProducer",
            "Version": "2025-01-01",
        }
        request = requests.Request(
            method="POST",
            url=self.cred.endpoint,
            data=req_json,
            params=query,
        )
        response = self.do_request(request)
        if response.status_code != 200:
            raise Exception(
                f"threat_intelligence_production failed, request_query:{request.params}, request_body:{request.json}, status_code: {response.status_code}, response: {response.text},request_headers: {request.headers}, request_url:{request.url}, request_params:{request.params}, request_data:{request.data},request_body:{request.json}")
        resp_obj = json.loads(response.text)
        resp = ThreatIntelligenceProductionResponse.from_dict(req_json, resp_obj)
        return resp

    def url_risk_detection(self,
                           req: URLRiskDetectionRequest) -> URLRiskDetectionResponse:
        req_json = json.dumps(req.to_dict())
        query = {
            "Action": "RunWebRiskAssessor",
            "Version": "2025-01-01",
        }
        request = requests.Request(
            method="POST",
            url=self.cred.endpoint,
            data=req_json,
            params=query,
        )
        response = self.do_request(request)
        if response.status_code != 200:
            raise Exception(
                f"url_risk_detection failed, request_query:{request.params}, request_body:{request.json}, status_code: {response.status_code}, response: {response.text},request_headers: {request.headers}, request_url:{request.url}, request_params:{request.params}, request_data:{request.data},request_body:{request.json}")
        resp_obj = json.loads(response.text)
        resp = URLRiskDetectionResponse.from_dict(req_json, resp_obj)
        return resp

    def dlp_endpoint_capture_analysis(self,
                                      req: DLPEndpointCaptureAnalysisRequest) -> DLPEndpointCaptureAnalysisResponse:
        req_json = json.dumps(req.to_dict())
        query = {
            "Action": "RunDlpScreenshotAnalyzer",
            "Version": "2025-01-01",
        }
        request = requests.Request(
            method="POST",
            url=self.cred.endpoint,
            data=req_json,
            params=query,
        )
        response = self.do_request(request)
        if response.status_code != 200:
            raise Exception(
                f"dlp_endpoint_capture_analysis failed, request_query:{request.params}, request_body:{request.json}, status_code: {response.status_code}, response: {response.text},request_headers: {request.headers}, request_url:{request.url}, request_params:{request.params}, request_data:{request.data},request_body:{request.json}")
        resp_obj = json.loads(response.text)
        resp = DLPEndpointCaptureAnalysisResponse.from_dict(req_json, resp_obj)
        return resp

    def sensitive_data_identification(self,
                                      req: SensitiveDataIdentificationRequest) -> SensitiveDataIdentificationResponse:
        req_json = json.dumps(req.to_dict())
        query = {
            "Action": "RunSensitiveDataDetector",
            "Version": "2025-01-01",
        }
        request = requests.Request(
            method="POST",
            url=self.cred.endpoint,
            data=req_json,
            params=query,
        )
        response = self.do_request(request)
        if response.status_code != 200:
            raise Exception(
                f"sensitive_data_identification failed, request_query:{request.params}, request_body:{request.json}, status_code: {response.status_code}, response: {response.text},request_headers: {request.headers}, request_url:{request.url}, request_params:{request.params}, request_data:{request.data},request_body:{request.json}")
        resp_obj = json.loads(response.text)
        resp = SensitiveDataIdentificationResponse.from_dict(req_json, resp_obj)
        return resp
