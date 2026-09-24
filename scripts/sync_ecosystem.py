#!/usr/bin/env python3
"""Archive public upstream assets without installing or executing them."""

import argparse
import base64
import concurrent.futures
import fcntl
import hashlib
import json
import os
import re
import shutil
import subprocess
import tarfile
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath


PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT / "resources" / "ecosystem"
LOCK = ROOT / "sources.lock.json"
MAX_DOWNLOAD = 512 * 1024 * 1024
MAX_EXTRACT = 2 * 1024 * 1024 * 1024
SOURCE_TYPES = {"github", "git", "archive", "document", "document-set"}


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def save_json(path, data):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(path)


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def get_catalog():
    entries = []
    for path in sorted((ROOT / "catalog-parts").glob("*.json")):
        items = json.loads(path.read_text())
        if not isinstance(items, list):
            raise ValueError(f"{path}: expected an array")
        entries.extend(items)
    ids = set()
    for entry in entries:
        asset_id = entry["id"]
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", asset_id):
            raise ValueError(f"Invalid asset ID: {asset_id}")
        if asset_id in ids:
            raise ValueError(f"Duplicate asset ID: {asset_id}")
        ids.add(asset_id)
        if entry["sourceType"] not in SOURCE_TYPES:
            raise ValueError(f"Unknown source type: {asset_id}")
        for field in ("name", "platform", "category", "kind", "homepage"):
            if not entry.get(field):
                raise ValueError(f"{asset_id}: missing {field}")
    return sorted(entries, key=lambda item: item["id"])


def request(url):
    if urllib.parse.urlsplit(url).scheme != "https":
        raise ValueError(f"HTTPS required: {url}")
    headers = {"User-Agent": "Personal-Agent-Ecosystem-Archive/1.0"}
    if urllib.parse.urlsplit(url).hostname == "api.github.com":
        headers["Accept"] = "application/vnd.github+json"
    for attempt in range(3):
        try:
            return urllib.request.urlopen(
                urllib.request.Request(url, headers=headers), timeout=60
            )
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            time.sleep(2 ** attempt)
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def download(url, destination):
    with request(url) as response, destination.open("wb") as output:
        expected_size = response.headers.get("Content-Length")
        size = 0
        for chunk in iter(lambda: response.read(1024 * 1024), b""):
            size += len(chunk)
            if size > MAX_DOWNLOAD:
                raise ValueError("Download exceeds 512 MiB")
            output.write(chunk)
        if size == 0:
            raise ValueError("Empty download")
        if expected_size is not None and size != int(expected_size):
            raise ValueError(f"Truncated download: expected {expected_size} bytes, got {size}")
        return {
            "resolvedUrl": response.url,
            "contentType": response.headers.get("Content-Type", ""),
            "bytes": size,
        }


def safe_name(name):
    path = PurePosixPath(name)
    if path.is_absolute() or ".." in path.parts or "\\" in name:
        raise ValueError(f"Unsafe archive path: {name}")
    return path


def unpack(archive, destination, archive_format):
    destination.mkdir()
    if archive_format == "zip":
        with zipfile.ZipFile(archive) as bundle:
            entries = bundle.infolist()
            if sum(item.file_size for item in entries) > MAX_EXTRACT:
                raise ValueError("Archive exceeds 2 GiB after extraction")
            for item in entries:
                safe_name(item.filename)
                if (item.external_attr >> 16) & 0o170000 == 0o120000:
                    raise ValueError(f"ZIP symlink requires review: {item.filename}")
            bundle.extractall(destination)
    elif archive_format == "tar.gz":
        with tarfile.open(archive, "r:gz") as bundle:
            entries = bundle.getmembers()
            if sum(item.size for item in entries) > MAX_EXTRACT:
                raise ValueError("Archive exceeds 2 GiB after extraction")
            for item in entries:
                safe_name(item.name)
            bundle.extractall(destination, filter="data")
    else:
        raise ValueError(f"Unknown archive format: {archive_format}")


def prune_metadata(directory):
    for path in sorted(directory.rglob("*"), key=lambda item: len(item.parts), reverse=True):
        if path.name in {"__MACOSX", ".DS_Store", ".history", ".git"}:
            if path.is_dir() and not path.is_symlink():
                shutil.rmtree(path)
            else:
                path.unlink()


def content_root(directory):
    children = list(directory.iterdir())
    if len(children) == 1 and children[0].is_dir() and not children[0].is_symlink():
        return children[0]
    return directory


def select_content(source, target, include_paths):
    if not include_paths:
        shutil.copytree(source, target, symlinks=True)
        return
    target.mkdir()
    selected = list(include_paths)
    selected.extend(
        path.name for path in source.iterdir()
        if re.match(r"(?i)^(license|licence|copying|notice|readme)", path.name)
    )
    for name in dict.fromkeys(selected):
        relative = safe_name(name)
        origin = source / relative
        destination = target / relative
        if not origin.exists():
            raise ValueError(f"Requested path missing from archive: {name}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        if origin.is_dir():
            shutil.copytree(origin, destination, symlinks=True)
        else:
            shutil.copy2(origin, destination)


def validate_links(directory):
    root = directory.resolve()
    for path in directory.rglob("*"):
        if path.is_symlink() and not path.resolve().is_relative_to(root):
            raise ValueError(f"Link escapes final snapshot: {path.relative_to(directory)}")


def inventory(directory):
    files = {}
    for path in sorted(directory.rglob("*")):
        relative = path.relative_to(directory).as_posix()
        if path.is_symlink():
            files[relative] = {"symlink": os.readlink(path)}
        elif path.is_file():
            files[relative] = {"sha256": sha256(path), "bytes": path.stat().st_size}
    return files


def run_git(*arguments):
    result = subprocess.run(
        ["git", *arguments], check=True, text=True, capture_output=True,
        timeout=180, env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
    )
    return result.stdout.strip()


def fetch_document_set(entry, stage, payload):
    documents = stage / "documents"
    documents.mkdir()
    sitemap = documents / "sitemap.xml"
    transfer = download(entry["url"], sitemap)
    urls = sorted({
        element.text.strip()
        for element in ET.parse(sitemap).findall(".//{*}url/{*}loc")
        if element.text and element.text.strip().startswith(entry["urlPrefix"])
    })
    if not urls:
        raise ValueError("Sitemap contains no matching documentation pages")
    paths = {}
    for url in urls:
        relative = safe_name(urllib.parse.unquote(urllib.parse.urlsplit(url).path).lstrip("/")) / "index.html"
        if relative in paths.values():
            raise ValueError(f"Duplicate documentation path: {relative}")
        paths[url] = relative

    def fetch_page(url):
        destination = documents / paths[url]
        destination.parent.mkdir(parents=True, exist_ok=True)
        response = download(url, destination)
        return {"url": url, "path": paths[url].as_posix(), "sha256": sha256(destination), **response}

    pages = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(fetch_page, url) for url in urls]
        for future in concurrent.futures.as_completed(futures):
            pages.append(future.result())
            if len(pages) % 50 == 0 or len(pages) == len(urls):
                print(f"FETCH {entry['id']}: {len(pages)}/{len(urls)} pages", flush=True)
    save_json(documents / "pages.json", {"urlPrefix": entry["urlPrefix"], "pages": sorted(pages, key=lambda item: item["url"])})
    with tarfile.open(payload, "w:gz") as bundle:
        bundle.add(documents, arcname="documents")
    return {
        "resolvedUrl": transfer["resolvedUrl"], "contentType": "application/gzip",
        "bytes": payload.stat().st_size, "pageCount": len(pages),
        "pageBytes": sum(page["bytes"] for page in pages),
    }


def check_published_digest(payload, entry):
    expected = entry.get("expectedSha256")
    if expected and sha256(payload) != expected:
        raise ValueError("Published SHA-256 checksum mismatch")
    integrity = entry.get("integrity")
    if integrity:
        algorithm, encoded = integrity.split("-", 1)
        if algorithm not in {"sha256", "sha384", "sha512"}:
            raise ValueError("Unsupported published integrity algorithm")
        digest = hashlib.new(algorithm)
        with payload.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
        if digest.digest() != base64.b64decode(encoded, validate=True):
            raise ValueError("Published package integrity mismatch")


def materialize(entry):
    asset_id = entry["id"]
    source_type = entry["sourceType"]
    (ROOT / ".staging").mkdir(exist_ok=True)
    (ROOT / "downloads").mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=f"{asset_id}-", dir=ROOT / ".staging") as temporary:
        stage = Path(temporary)
        revision = None
        archive_format = entry.get("format", "tar.gz")
        if source_type == "github":
            repository = entry["repo"]
            if not re.fullmatch(r"[\w.-]+/[\w.-]+", repository):
                raise ValueError("Invalid GitHub repository")
            ref = entry.get("ref")
            endpoint = f"https://api.github.com/repos/{repository}/commits"
            endpoint += f"/{urllib.parse.quote(ref, safe='')}" if ref else "?per_page=1"
            with request(endpoint) as response:
                metadata = json.load(response)
            revision = (metadata if ref else metadata[0])["sha"]
            url = f"https://codeload.github.com/{repository}/tar.gz/{revision}"
        elif source_type == "git":
            url = entry["repo"]
            if urllib.parse.urlsplit(url).scheme != "https":
                raise ValueError("Public HTTPS Git repository required")
            repository = stage / "repository.git"
            run_git("init", "--bare", str(repository))
            run_git("-C", str(repository), "fetch", "--depth=1", url, entry.get("ref", "HEAD"))
            revision = run_git("-C", str(repository), "rev-parse", "FETCH_HEAD")
        else:
            url = entry["url"]
        payload = stage / "payload"
        if source_type == "git":
            run_git("-C", str(repository), "archive", "--format=tar.gz", f"--output={payload}", revision)
            transfer = {"resolvedUrl": url, "contentType": "application/gzip", "bytes": payload.stat().st_size}
        elif source_type == "document-set":
            transfer = fetch_document_set(entry, stage, payload)
        else:
            transfer = download(url, payload)
        check_published_digest(payload, entry)
        digest = sha256(payload)
        snapshot = (revision[:12] if revision else digest[:12])
        asset_directory = ROOT / "upstream" / asset_id / snapshot
        if source_type == "document":
            filename = entry["filename"]
            safe_name(filename)
            staged_content = stage / "content"
            staged_content.mkdir()
            destination = staged_content / filename
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(payload, destination)
        else:
            unpacked = stage / "unpacked"
            unpack(payload, unpacked, archive_format)
            prune_metadata(unpacked)
            staged_content = stage / "content"
            select_content(content_root(unpacked), staged_content, entry.get("includePaths"))
        validate_links(staged_content)
        files = inventory(staged_content)
        if not files:
            raise ValueError("Archive contains no files")
        if asset_directory.exists():
            if inventory(asset_directory) != files:
                raise ValueError(f"Existing snapshot changed; refusing overwrite: {asset_directory}")
        else:
            asset_directory.parent.mkdir(parents=True, exist_ok=True)
            staged_content.rename(asset_directory)
        suffix = ".bin" if source_type == "document" else (".zip" if archive_format == "zip" else ".tar.gz")
        archive_path = ROOT / "downloads" / f"{asset_id}-{digest[:12]}{suffix}"
        if archive_path.exists():
            if sha256(archive_path) != digest:
                raise ValueError(f"Download cache changed: {archive_path}")
        else:
            payload.rename(archive_path)
        return {
            "id": asset_id, "status": "archived", "fetchedAt": now(),
            "source": url, "revision": revision, "sha256": digest, **transfer,
            "path": asset_directory.relative_to(ROOT).as_posix(),
            "downloadPath": archive_path.relative_to(ROOT).as_posix(),
            "version": entry.get("version"), "fileCount": len(files),
            "skillFiles": [name for name in files if PurePosixPath(name).name == "SKILL.md"],
            "licenseFiles": [name for name in files if re.match(r"(?i)^(license|licence|copying|notice)", PurePosixPath(name).name)],
            "files": files,
        }


def verify_record(record, require_download=False):
    directory = ROOT / record["path"]
    if not directory.is_dir():
        return [f"Missing snapshot: {record['path']}"]
    errors = []
    try:
        validate_links(directory)
    except (ValueError, OSError, RuntimeError) as error:
        errors.append(str(error))
    actual = inventory(directory)
    if actual != record["files"]:
        errors.append(f"Snapshot content changed: {record['id']}")
    archive = ROOT / record["downloadPath"]
    if archive.exists():
        if sha256(archive) != record["sha256"]:
            errors.append(f"Download checksum mismatch: {record['id']}")
    elif require_download:
        errors.append(f"Missing original download: {record['id']}")
    return errors


def index(catalog, records):
    rows = [
        "# 本地生态资源索引", "",
        "由 `scripts/sync_ecosystem.py` 生成。状态表示归档完整性，不表示已授权或可在 Pi 中直接运行。", "",
        "| 资源 | 来源性质 | 类型 | 本地文件 | 固定版本 / 提交 | 使用条件 |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for entry in catalog:
        record = records.get(entry["id"], {})
        if record.get("status") == "archived":
            location = f"[文件]({record['path']}/)"
            version = (record.get("revision") or record.get("version") or record["sha256"])[:12]
        else:
            location = "待下载"
            version = "-"
        conditions = entry.get("access", "")
        if entry.get("readiness") == "reference-only":
            conditions = conditions.rstrip("。；") + "；仅供参考，未启用"
        conditions = conditions.replace("|", "/").replace("\n", " ")
        origin = entry.get("origin", "official")
        provenance = {"official": "官方发布", "community": "社区项目", "open-source": "开源服务"}.get(origin, origin)
        rows.append(f"| {entry['name']} | {provenance} | {entry['kind']} | {location} | `{version}` | {conditions} |")
    rows.extend(["", "## 接入限制", ""])
    for entry in catalog:
        limitations = entry.get("limitations", "")
        if isinstance(limitations, list):
            limitations = " ".join(limitations)
        integration = entry.get("piIntegration", "").rstrip("。")
        rows.append(f"- **{entry['name']}**：{integration}。{limitations}")
    (ROOT / "INDEX.md").write_text("\n".join(rows) + "\n")


def main_locked():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id", action="append", help="Sync only the named asset; repeat for multiple assets")
    parser.add_argument("--refresh", action="store_true", help="Fetch current catalog versions into new snapshots")
    parser.add_argument("--verify", action="store_true", help="Verify all locked snapshot contents without network")
    parser.add_argument("--require-downloads", action="store_true", help="Also require the original downloaded bundles")
    parser.add_argument("--jobs", type=int, default=3)
    arguments = parser.parse_args()
    catalog = get_catalog()
    if arguments.id:
        unknown = set(arguments.id) - {entry["id"] for entry in catalog}
        if unknown:
            parser.error(f"Unknown assets: {', '.join(sorted(unknown))}")
    selected = [entry for entry in catalog if not arguments.id or entry["id"] in arguments.id]
    lock = json.loads(LOCK.read_text()) if LOCK.exists() else {"schemaVersion": 1, "assets": {}}
    records = lock["assets"]
    failures = []
    if arguments.verify:
        verified = 0
        for entry in selected:
            record = records.get(entry["id"])
            errors = verify_record(record, arguments.require_downloads) if record else [f"Not archived: {entry['id']}"]
            failures.extend(errors)
            verified += not errors
        for error in failures:
            print(error, flush=True)
        print(f"Verified {verified}/{len(selected)} assets", flush=True)
        return int(bool(failures))
    pending = []
    for entry in selected:
        record = records.get(entry["id"])
        if record and not arguments.refresh:
            errors = verify_record(record)
            if errors:
                failures.extend(errors)
                print(f"ERROR {entry['id']}: {'; '.join(errors)}", flush=True)
            else:
                print(f"SKIP {entry['id']} (locked snapshot already present)", flush=True)
        else:
            pending.append(entry)
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(arguments.jobs, 8))) as pool:
        futures = {pool.submit(materialize, entry): entry for entry in pending}
        for future in concurrent.futures.as_completed(futures):
            entry = futures[future]
            try:
                record = future.result()
                records[entry["id"]] = record
                lock["updatedAt"] = now()
                save_json(LOCK, lock)
                print(f"OK {entry['id']}: {record['fileCount']} files, {len(record['skillFiles'])} Skills", flush=True)
            except Exception as error:
                message = f"{entry['id']}: {type(error).__name__}: {error}"
                failures.append(message)
                print(f"ERROR {message}", flush=True)
    index(catalog, records)
    archived = sum(entry["id"] in records for entry in catalog)
    print(f"Archived {archived}/{len(catalog)} catalog assets", flush=True)
    return int(bool(failures))


def main():
    (ROOT / ".staging").mkdir(exist_ok=True)
    with (ROOT / ".staging" / "sync.lock").open("a") as process_lock:
        try:
            fcntl.flock(process_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print("Another ecosystem sync or verification is running", flush=True)
            return 1
        return main_locked()


if __name__ == "__main__":
    raise SystemExit(main())
