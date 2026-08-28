from dataclasses import dataclass


# common

@dataclass
class ResponseError:
    code: str

    @classmethod
    def from_dict(cls, d: dict):
        if 'Code' in d:
            return cls(code=d['Code'])


@dataclass
class ResponseMetaData:
    request_id: str
    error: ResponseError

    @classmethod
    def from_dict(cls, d: dict):
        c = cls(
            request_id="",
            error=ResponseError(
                code="",
            )
        )
        if 'RequestId' in d:
            c.request_id = d['RequestId']
        if 'Error' in d:
            c.error = ResponseError.from_dict(d['Error'])
        return c

    @staticmethod
    def get_default_response_metadata():
        return ResponseMetaData(
            request_id="",
            error=ResponseError(
                code="",
            )
        )


# mcp result query

@dataclass
class SecIntelligentMCPCallResult:
    tool_type: str
    tool_call_status: str
    result_data: dict
    request: str

    @classmethod
    def from_dict(cls, req: str, d: dict):
        c = cls(
            tool_type="",
            tool_call_status="",
            result_data={},
            request=req,
        )
        if 'ResponseMetaData' in d:
            c.response_metadata = ResponseMetaData.from_dict(d['ResponseMetaData'])
        if 'Result' in d:
            result = d['Result']
            c.tool_type = result.get('ToolType')
            c.tool_call_status = result.get('ToolCallStatus')
            c.result_data = result.get('ResultData')
        return c


@dataclass
class SecIntelligentMCPCallRequest:
    result_id: str

    def to_dict(self):
        return {
            "ResultID": self.result_id
        }


# alert analysis

@dataclass
class AlertAnalysisResponse:
    response_metadata: ResponseMetaData
    result: dict
    request: str  # 添加req，帮助排查问题

    @classmethod
    def from_dict(cls, req: str, d: dict):
        c = cls(
            response_metadata=ResponseMetaData.get_default_response_metadata(),
            result={},
            request=req
        )
        if 'ResponseMetaData' in d:
            c.response_metadata = ResponseMetaData.from_dict(d['ResponseMetaData'])
        if 'Result' in d:
            c.result = d['Result']
        return c


@dataclass
class AlertAnalysisRequest:
    alert_msg: str
    data_ref: str
    principal: str
    alert_id: str
    tool_use: str

    def to_dict(self):
        return {
            "AlertMsg": self.alert_msg,
            "DataRef": self.data_ref,
            "Principal": self.principal,
            "AlertId": self.alert_id,
            "ToolUse": self.tool_use,
        }


# pcap analysis

@dataclass
class PcapAnalysisResponse:
    response_metadata: ResponseMetaData
    result: dict
    request: str  # 添加req，帮助排查问题

    @classmethod
    def from_dict(cls, req: str, d: dict):
        c = cls(
            response_metadata=ResponseMetaData.get_default_response_metadata(),
            result={},
            request=req,
        )
        if 'ResponseMetaData' in d:
            c.response_metadata = ResponseMetaData.from_dict(d['ResponseMetaData'])
        if 'Result' in d:
            c.result = d['Result']
        return c


@dataclass
class PcapAnalysisRequest:
    pcap_base64_encoded: str

    def to_dict(self):
        return {
            "PCAPBase64Encoded": self.pcap_base64_encoded
        }


# params format

@dataclass
class ParamsFormatResponse:
    response_metadata: ResponseMetaData
    result: dict
    request: str  # 添加req，帮助排查问题

    @classmethod
    def from_dict(cls, req: str, d: dict):
        c = cls(
            response_metadata=ResponseMetaData.get_default_response_metadata(),
            result={},
            request=req,
        )
        if 'ResponseMetaData' in d:
            c.response_metadata = ResponseMetaData.from_dict(d['ResponseMetaData'])
        if 'Result' in d:
            c.result = d['Result']
        return c


@dataclass
class ParamsFormatRequest:
    alert_msg: str

    def to_dict(self):
        return {
            "AlertMsg": self.alert_msg
        }


# threat intelligence production

@dataclass
class ThreatIntelligenceProductionResponse:
    response_metadata: ResponseMetaData
    result: dict
    request: str  # 添加req，帮助排查问题

    @classmethod
    def from_dict(cls, req: str, d: dict):
        c = cls(
            response_metadata=ResponseMetaData.get_default_response_metadata(),
            result={},
            request=req,
        )
        if 'ResponseMetaData' in d:
            c.response_metadata = ResponseMetaData.from_dict(d['ResponseMetaData'])
        if 'Result' in d:
            c.result = d['Result']
        return c


@dataclass
class ThreatIntelligenceProductionRequest:
    url: str
    input_msg: str

    def to_dict(self):
        return {
            "Url": self.url,
            "InputMsg": self.input_msg,
        }


# url risk detection


@dataclass
class URLRiskDetectionResponse:
    response_metadata: ResponseMetaData
    result: dict
    request: str  # 添加req，帮助排查问题

    @classmethod
    def from_dict(cls, req: str, d: dict):
        c = cls(
            response_metadata=ResponseMetaData.get_default_response_metadata(),
            result={},
            request=req,
        )
        if 'ResponseMetaData' in d:
            c.response_metadata = ResponseMetaData.from_dict(d['ResponseMetaData'])
        if 'Result' in d:
            c.result = d['Result']
        return c


@dataclass
class URLRiskDetectionRequest:
    snap_shot: str
    url: str
    icp_info: str

    def to_dict(self):
        return {
            "SnapShot": self.snap_shot,
            "Url": self.url,
            "IcpInfo": self.icp_info,
        }


# dlp endpoint capture analysis

@dataclass
class DLPEndpointCaptureAnalysisResponse:
    response_metadata: ResponseMetaData
    result: dict
    request: str  # 添加req，帮助排查问题

    @classmethod
    def from_dict(cls, req: str, d: dict):
        c = cls(
            response_metadata=ResponseMetaData.get_default_response_metadata(),
            result={},
            request=req,
        )
        if 'ResponseMetaData' in d:
            c.response_metadata = ResponseMetaData.from_dict(d['ResponseMetaData'])
        if 'Result' in d:
            c.result = d['Result']
        return c


@dataclass
class DLPEndpointCaptureAnalysisRequest:
    image_url: str

    def to_dict(self):
        return {
            "ImageURL": self.image_url,
        }


# sensitive data identification

@dataclass
class SensitiveDataIdentificationResponse:
    response_metadata: ResponseMetaData
    result: dict
    request: str  # 添加req，帮助排查问题

    @classmethod
    def from_dict(cls, req: str, d: dict):
        c = cls(
            response_metadata=ResponseMetaData.get_default_response_metadata(),
            result={},
            request=req,
        )
        if 'ResponseMetaData' in d:
            c.response_metadata = ResponseMetaData.from_dict(d['ResponseMetaData'])
        if 'Result' in d:
            c.result = d['Result']
        return c


@dataclass
class SensitiveDataIdentificationRequest:
    file_content: str
    extract_type: str

    def to_dict(self):
        return {
            "FileContent": self.file_content,
            "ExtractType": self.extract_type,
        }
