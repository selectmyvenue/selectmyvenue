import pathlib
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITEMAP = ROOT / "sitemap.xml"
PAGES = {
    "wedding-venues-in-delhi.html": "Wedding Venues in Delhi | Select My Venue",
    "wedding-venues-in-gurgaon.html": "Wedding Venues in Gurgaon | Select My Venue",
    "wedding-venues-in-noida.html": "Wedding Venues in Noida | Select My Venue",
    "wedding-venues-in-chhatarpur.html": "Wedding Venues in Chhatarpur | Select My Venue",
    "wedding-venues-gt-karnal-road.html": "Wedding Venues on GT Karnal Road, Delhi | Select My Venue",
    "wedding-venues-in-kapashera.html": "Wedding Venues in Kapashera | Select My Venue",
}
EXPECTED_LASTMOD = {
    **{name: "2026-10-16" for name in PAGES},
    "banquet-halls-in-delhi.html": "2026-10-15",
    "banquet-halls-in-gurgaon.html": "2026-10-15",
}


class LocalityMetadataTests(unittest.TestCase):
    def test_titles_are_exact_concise_and_unique(self):
        titles = []
        for name, expected in PAGES.items():
            html = (ROOT / name).read_text(encoding="utf-8")
            match = re.search(r"<title>(.*?)</title>", html, re.I | re.S)
            self.assertIsNotNone(match, name)
            title = re.sub(r"\\s+", " ", match.group(1)).strip()
            self.assertEqual(title, expected, name)
            self.assertLessEqual(len(title), 65, name)
            self.assertIn("Select My Venue", title, name)
            titles.append(title)
        self.assertEqual(len(titles), len(set(titles)))

    def test_sitemap_has_unique_urls_and_truthful_changed_dates(self):
        root = ET.parse(SITEMAP).getroot()
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        entries = {}
        for node in root.findall("sm:url", ns):
            loc = node.findtext("sm:loc", namespaces=ns)
            lastmod = node.findtext("sm:lastmod", namespaces=ns)
            if loc:
                self.assertNotIn(loc, entries, f"Duplicate sitemap URL: {loc}")
                entries[loc] = lastmod
        for name, expected in EXPECTED_LASTMOD.items():
            url = "https://selectmyvenue.com/" + name
            self.assertIn(url, entries)
            self.assertEqual(entries[url], expected, name)


if __name__ == "__main__":
    unittest.main()
