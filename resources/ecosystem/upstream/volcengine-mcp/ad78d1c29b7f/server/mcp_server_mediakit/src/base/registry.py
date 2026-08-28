from __future__ import annotations

domain_tools_map: dict[str, set[str]] = {}


def register_domain_tools(domain: str, tool_names: list[str]) -> None:
    domain_tools_map.setdefault(domain, set()).update(tool_names)


def get_tool_domain(tool_name: str) -> str:
    for domain, tools in domain_tools_map.items():
        if tool_name in tools:
            return domain
    return ""
