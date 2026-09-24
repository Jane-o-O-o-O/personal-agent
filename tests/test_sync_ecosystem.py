import io
import json
import tarfile
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

from scripts import sync_ecosystem as sync


class ArchiveTests(unittest.TestCase):
    def test_zip_cannot_write_outside_destination(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "archive.zip"
            with zipfile.ZipFile(archive, "w") as bundle:
                bundle.writestr("../escaped.txt", "unexpected")
            with self.assertRaisesRegex(ValueError, "Unsafe archive path"):
                sync.unpack(archive, root / "unpacked", "zip")
            self.assertFalse((root / "escaped.txt").exists())

    def test_link_is_rechecked_after_removing_wrapper_directory(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "archive.tar.gz"
            with tarfile.open(archive, "w:gz") as bundle:
                content = tarfile.TarInfo("outside")
                content.size = 4
                bundle.addfile(content, io.BytesIO(b"data"))
                link = tarfile.TarInfo("pkg/link")
                link.type = tarfile.SYMTYPE
                link.linkname = "../outside"
                bundle.addfile(link)
            sync.unpack(archive, root / "unpacked", "tar.gz")
            sync.select_content(root / "unpacked" / "pkg", root / "content", None)
            with self.assertRaisesRegex(ValueError, "Link escapes final snapshot"):
                sync.validate_links(root / "content")

    def test_selected_skill_preserves_license_directory(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "source"
            (source / "skills" / "selected").mkdir(parents=True)
            (source / "LICENSES").mkdir()
            (source / "skills" / "selected" / "SKILL.md").write_text("selected")
            (source / "LICENSES" / "MIT.txt").write_text("license")
            (source / "README.md").write_text("upstream")
            (source / "unrelated.txt").write_text("not selected")
            sync.select_content(source, root / "result", ["skills/selected"])
            self.assertTrue((root / "result" / "LICENSES" / "MIT.txt").is_file())
            self.assertTrue((root / "result" / "README.md").is_file())
            self.assertFalse((root / "result" / "unrelated.txt").exists())

    def test_existing_snapshot_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            original = root / "original.zip"
            with zipfile.ZipFile(original, "w") as bundle:
                bundle.writestr("package/SKILL.md", "original")

            def download(_url, destination):
                destination.write_bytes(original.read_bytes())
                return {"resolvedUrl": "https://example.com/archive.zip", "bytes": original.stat().st_size}

            entry = {"id": "fixture", "sourceType": "archive", "format": "zip", "url": "https://example.com/archive.zip"}
            ecosystem = root / "ecosystem"
            ecosystem.mkdir()
            with patch.object(sync, "ROOT", ecosystem), patch.object(sync, "download", download):
                record = sync.materialize(entry)
                skill = ecosystem / record["path"] / "SKILL.md"
                skill.write_text("local edit")
                with self.assertRaisesRegex(ValueError, "refusing overwrite"):
                    sync.materialize(entry)
                self.assertEqual(skill.read_text(), "local edit")
                self.assertIn("Snapshot content changed", sync.verify_record(record)[0])

    def test_truncated_document_is_not_accepted(self):
        class Response(io.BytesIO):
            headers = {"Content-Length": "20"}
            url = "https://example.com/docs.md"

        with tempfile.TemporaryDirectory() as temporary:
            with patch.object(sync, "request", return_value=Response(b"short")):
                with self.assertRaisesRegex(ValueError, "Truncated download"):
                    sync.download("https://example.com/docs.md", Path(temporary) / "document")

    def test_published_checksum_is_verified_before_archive_use(self):
        with tempfile.TemporaryDirectory() as temporary:
            payload = Path(temporary) / "payload"
            payload.write_bytes(b"tampered package")
            with self.assertRaisesRegex(ValueError, "Published SHA-256 checksum mismatch"):
                sync.check_published_digest(payload, {"expectedSha256": "0" * 64})

    def test_sitemap_archive_contains_only_selected_api_pages(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            urls = ["https://example.com/docs/apis/users/", "https://example.com/docs/apis/repos/"]
            sitemap = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            sitemap += "".join(f"<url><loc>{url}</loc></url>" for url in [*urls, "https://example.com/account/"])
            sitemap += "</urlset>"
            downloaded = []

            def download(url, destination):
                downloaded.append(url)
                destination.write_text(sitemap if url.endswith("sitemap.xml") else "API parameters and response")
                return {"resolvedUrl": url, "bytes": destination.stat().st_size, "contentType": "text/html"}

            entry = {"id": "docs", "url": "https://example.com/sitemap.xml", "urlPrefix": "https://example.com/docs/apis/"}
            payload = root / "payload.tar.gz"
            with patch.object(sync, "download", download):
                record = sync.fetch_document_set(entry, root, payload)
            self.assertEqual(record["pageCount"], 2)
            self.assertNotIn("https://example.com/account/", downloaded)
            sync.unpack(payload, root / "unpacked", "tar.gz")
            pages = json.loads((root / "unpacked" / "documents" / "pages.json").read_text())["pages"]
            self.assertEqual({page["url"] for page in pages}, set(urls))


if __name__ == "__main__":
    unittest.main()
