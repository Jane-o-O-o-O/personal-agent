from __future__ import annotations

import sys


def prefer_installed_site_packages() -> None:
    """Prefer uv/venv site-packages over FaaS system copies.

    ByteFaaS injects /opt/bytefaas/site-packages ahead of the uvx venv,
    which can shadow newer transitive deps such as typing_extensions.
    """
    preferred = [
        entry
        for entry in sys.path
        if entry.endswith("site-packages") and "/bytefaas/" not in entry
    ]
    for entry in reversed(preferred):
        if entry in sys.path:
            sys.path.remove(entry)
            sys.path.insert(0, entry)
