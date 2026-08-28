#!/usr/bin/env python3
"""List server packages whose project version changed between two revisions."""

import json
import subprocess
import sys
import tomllib
from pathlib import PurePosixPath


EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
PATHSPEC = ":(glob)server/**/pyproject.toml"


def git(*args: str) -> bytes:
    return subprocess.check_output(("git", *args), stderr=subprocess.DEVNULL)


def project_at(revision: str, path: str) -> dict[str, str] | None:
    try:
        content = git("show", f"{revision}:{path}")
    except subprocess.CalledProcessError:
        return None

    project = tomllib.loads(content.decode()).get("project", {})
    if not isinstance(project.get("name"), str) or not isinstance(
        project.get("version"), str
    ):
        raise ValueError(f"{path} must define string project.name and project.version")
    return project


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(f"usage: {sys.argv[0]} BASE_SHA HEAD_SHA")

    base, head = sys.argv[1:]
    if base == "0" * 40:
        base = EMPTY_TREE

    changed_paths = git(
        "diff", "--name-only", "--diff-filter=AM", base, head, "--", PATHSPEC
    ).decode().splitlines()

    packages = []
    for path in changed_paths:
        previous = project_at(base, path)
        current = project_at(head, path)
        if current is None:
            continue
        if previous is None or previous["version"] != current["version"]:
            packages.append(
                {
                    "directory": str(PurePosixPath(path).parent),
                    "name": current["name"],
                    "version": current["version"],
                }
            )

    print(json.dumps(packages, separators=(",", ":")))


if __name__ == "__main__":
    main()
