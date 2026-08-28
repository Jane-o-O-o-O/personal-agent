import unittest

from build.lib.mcp_server_sec_agent.client.model import SecIntelligentMCPCallResult
from client.model import PcapAnalysisResponse


class MyTestCase(unittest.TestCase):
    def test_pcap_analysis_load_from_dict(self):
        d = {"ResponseMetaData": {"RequestId": "02174473965523900000000000000000000ffffac1000098d0695",
                                  "Error": {"Code": "RequestParamInvalid"}}}
        resp_obj = PcapAnalysisResponse.from_dict('', d)
        print(resp_obj)

    def test_load_from_dict(self):
        d = {"ResponseMetaData": {"RequestId": "02174479066006800000000000000000000ffffac10010c7179ee",
                                  "Error": {"Code": ""}},
             "Result": {"ToolType": "pcap_analysis", "ToolCallStatus": "running", "ResultData": {}}}
        resp_obj = SecIntelligentMCPCallResult.from_dict('', d)
        print(resp_obj)


if __name__ == '__main__':
    unittest.main()
