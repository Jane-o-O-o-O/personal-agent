#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""快递100 用户版 API客户端 v1.0"""

import requests
import json
import sys
import os

class Kuaidi100UserClient:
    def __init__(self, api_key=""):
        self.api_key = api_key or os.environ.get("KUAIDI100_USER_API_KEY", "")
        self.base_url = "https://p.kuaidi100.com"
        self.session = requests.Session()
        self.has_key = bool(self.api_key)

    def _headers(self):
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        return headers

    def _call(self, endpoint, params=None, require_key=False):
        if require_key and not self.has_key:
            return {"status": 401, "message": "请获取API Key以体验完整功能", "data": None, "key_required": True}
        params = params or {}
        if self.api_key:
            params["api_key"] = self.api_key
        url = f"{self.base_url}{endpoint}"
        try:
            response = self.session.post(url, data=params, headers=self._headers(), timeout=30)
            return response.json()
        except Exception as e:
            return {"status": 500, "message": str(e), "data": None}

    def check_key_status(self):
        return {"has_key": self.has_key, "mode": "完整模式" if self.has_key else "无Key模式（部分功能受限）"}

    # 基础功能（无需Key）
    def address_complete(self, address):
        return self._call("/skill/api/addressComplete", {"address": address}, require_key=False)

    def query_item_weight(self, item_name):
        return self._call("/skill/api/queryItemWeight", {"itemName": item_name}, require_key=False)

    def query_shipping_companies(self, senderCity, receiverCity, weight=1.0):
        return self._call("/skill/api/queryShippingCompanies", {"senderCity": senderCity, "receiverCity": receiverCity, "weight": str(weight)}, require_key=False)

    # 完整功能（需要Key）
    def query_default_sender(self):
        return self._call("/skill/api/queryDefaultSender", require_key=True)

    def query_receiver_by_name(self, receiver_name):
        return self._call("/skill/api/queryReceiverByName", {"receiverName": receiver_name}, require_key=True)

    def collect_shipment_order_info(self, **kwargs):
        """预下单接口（无需Key）- 提交信息获取下单链接"""
        param_map = {"sender_name": "senderName", "sender_phone": "senderPhone", "sender_province": "senderProvince", "sender_city": "senderCity", "sender_district": "senderDistrict", "sender_address": "senderAddress", "receiver_name": "receiverName", "receiver_phone": "receiverPhone", "receiver_province": "receiverProvince", "receiver_city": "receiverCity", "receiver_district": "receiverDistrict", "receiver_address": "receiverAddress", "item_name": "itemName", "weight": "weight", "kuaidi_name": "kuaidiName", "kuaidi_com": "kuaidiCom", "company_sign": "companySign", "service_type": "serviceType", "estimated_amount": "estimatedAmount", "remark": "remark", "expected_pickup_time_desc": "expectedPickupTimeDesc", "order_no": "orderNo"}
        params = {camel: kwargs[snake] for snake, camel in param_map.items() if snake in kwargs}
        return self._call("/skill/api/collectShipmentOrderInfo", params, require_key=False)

    def query_user_orders(self, limit=10, orderid=None):
        params = {"limit": str(limit)}
        if orderid:
            params["orderid"] = str(orderid)
        return self._call("/skill/api/queryUserOrders", params, require_key=True)

    def track_shipment(self, order_num, com=""):
        params = {"orderNum": order_num}
        if com:
            params["com"] = com
        return self._call("/skill/api/trackShipment", params, require_key=True)

    def cancel_order(self, order_no, reason):
        return self._call("/skill/api/cancelOrder", {"orderNo": order_no, "reason": reason}, require_key=True)

    def close(self):
        self.session.close()


def main():
    """命令行入口"""
    if len(sys.argv) < 2:
        print("快递100 用户版 API客户端 v1.0")
        print("")
        print("用法：")
        print("  python api_client.py status                          # 检查Key状态")
        print("  python api_client.py address <地址>                  # 地址解析（无需Key）")
        print("  python api_client.py weight <物品名>                 # 查重量（无需Key）")
        print("  python api_client.py companies <寄件城市> <收件城市> [重量]  # 查快递（无需Key）")
        print("  python api_client.py sender                          # 查默认寄件人（需Key）")
        print("  python api_client.py receiver <姓名>                 # 查收件人（需Key）")
        print("  python api_client.py orders [数量]                   # 查订单（需Key）")
        print("  python api_client.py track <运单号> [公司]           # 查物流（需Key）")
        print("  python api_client.py cancel <单号> <原因>            # 取消订单（需Key）")
        print("")
        print("环境变量：")
        print("  KUAIDI100_USER_API_KEY      API密钥（可选）")
        sys.exit(1)

    client = Kuaidi100UserClient()
    command = sys.argv[1].lower()

    try:
        if command == "status":
            result = client.check_key_status()
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif command == "address":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "缺少地址参数"}, ensure_ascii=False))
                sys.exit(1)
            result = client.address_complete(sys.argv[2])
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif command == "weight":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "缺少物品名"}, ensure_ascii=False))
                sys.exit(1)
            result = client.query_item_weight(sys.argv[2])
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif command == "companies":
            if len(sys.argv) < 4:
                print(json.dumps({"error": "缺少城市名称"}, ensure_ascii=False))
                sys.exit(1)
            weight = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
            result = client.query_shipping_companies(sys.argv[2], sys.argv[3], weight)
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif command == "sender":
            result = client.query_default_sender()
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif command == "receiver":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "缺少收件人姓名"}, ensure_ascii=False))
                sys.exit(1)
            result = client.query_receiver_by_name(sys.argv[2])
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif command == "orders":
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            result = client.query_user_orders(limit)
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif command == "track":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "缺少运单号"}, ensure_ascii=False))
                sys.exit(1)
            com = sys.argv[3] if len(sys.argv) > 3 else ""
            result = client.track_shipment(sys.argv[2], com)
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif command == "cancel":
            if len(sys.argv) < 4:
                print(json.dumps({"error": "缺少单号或原因"}, ensure_ascii=False))
                sys.exit(1)
            result = client.cancel_order(sys.argv[2], sys.argv[3])
            print(json.dumps(result, ensure_ascii=False, indent=2))

        else:
            print(json.dumps({"error": f"未知命令: {command}"}, ensure_ascii=False))

    finally:
        client.close()


if __name__ == "__main__":
    main()
