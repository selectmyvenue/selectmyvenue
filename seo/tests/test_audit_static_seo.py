import importlib.util
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "audit_static_seo.py"
SPEC = importlib.util.spec_from_file_location("audit_static_seo", MODULE_PATH)
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)


class MetadataParserTests(unittest.TestCase):
    def test_reads_core_metadata_and_image_alt(self):
        parser = audit.MetadataParser()
        parser.feed(
            '<title>Venue in Gurgaon</title>'
            '<meta name="description" content="Verified venue details">'
            '<meta name="robots" content="noindex,follow">'
            '<link rel="canonical" href="https://selectmyvenue.com/venue-pages/test/">'
            '<h1>Venue</h1><img src="venue.jpg"><img src="venue2.jpg" alt="Venue">'
        )
        self.assertEqual(parser.title, "Venue in Gurgaon")
        self.assertEqual(parser.description, "Verified venue details")
        self.assertIn("noindex", parser.robots)
        self.assertEqual(parser.canonical, "https://selectmyvenue.com/venue-pages/test/")
        self.assertEqual(parser.h1_count, 1)
        self.assertEqual(parser.img_missing_alt, 1)


class SitemapMappingTests(unittest.TestCase):
    def test_root_url_maps_to_index(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertEqual(audit.sitemap_url_to_file("https://selectmyvenue.com/", root), root / "index.html")

    def test_query_string_is_ignored_for_html_file_mapping(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertEqual(
                audit.sitemap_url_to_file("https://selectmyvenue.com/venue.html?id=abc-123", root),
                root / "venue.html",
            )

    def test_generated_directory_url_maps_to_nested_index(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertEqual(
                audit.sitemap_url_to_file("https://selectmyvenue.com/venue-pages/test-123/", root),
                root / "venue-pages" / "test-123" / "index.html",
            )

    def test_rejects_non_https_or_external_hosts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertIsNone(audit.sitemap_url_to_file("http://selectmyvenue.com/index.html", root))
            self.assertIsNone(audit.sitemap_url_to_file("https://example.com/index.html", root))

    def test_rejects_path_traversal(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertIsNone(audit.sitemap_url_to_file("https://selectmyvenue.com/../outside.html", root))

    def test_finds_generated_html_but_skips_dependencies(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "index.html").write_text("<title>Home</title>", encoding="utf-8")
            generated = root / "venue-pages" / "test"
            generated.mkdir(parents=True)
            (generated / "index.html").write_text("<title>Venue</title>", encoding="utf-8")
            dependency = root / "node_modules" / "package"
            dependency.mkdir(parents=True)
            (dependency / "index.html").write_text("<title>Ignore</title>", encoding="utf-8")
            relative = {p.relative_to(root).as_posix() for p in audit.html_files_under(root)}
            self.assertEqual(relative, {"index.html", "venue-pages/test/index.html"})


if __name__ == "__main__":
    unittest.main()
