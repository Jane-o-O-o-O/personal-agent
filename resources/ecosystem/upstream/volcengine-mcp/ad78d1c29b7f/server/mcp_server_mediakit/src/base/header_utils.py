from __future__ import annotations


def header_value(headers: dict[str, str] | None, header_name: str) -> str:
    """读取 inbound header，大小写不敏感；缺失或空值时返回空字符串。"""
    inbound = headers or {}
    if header_name in inbound:
        return str(inbound[header_name]).strip()
    header_lower = header_name.lower()
    for key, value in inbound.items():
        if key.lower() == header_lower:
            return str(value).strip()
    return ""
