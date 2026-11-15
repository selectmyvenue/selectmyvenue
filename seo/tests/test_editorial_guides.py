"""SEO checks for the 15 human-written Delhi NCR venue planning guides."""
from __future__ import annotations

import html
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GUIDES = [
    "banquet-hall-vs-wedding-lawn-delhi-ncr.html",
    "birthday-party-venue-checklist-delhi-ncr.html",
    "corporate-event-venue-checklist-delhi-ncr.html",
    "engagement-venue-checklist-delhi-ncr.html",
    "farmhouse-vs-banquet-hall-delhi-ncr.html",
    "how-to-choose-wedding-venue-capacity-delhi-ncr.html",
    "how-to-shortlist-wedding-venues-delhi-ncr.html",
    "outdoor-wedding-weather-backup-delhi-ncr.html",
    "wedding-reception-venue-checklist-delhi-ncr.html",
    "wedding-venue-booking-questions-delhi-ncr.html",
    "wedding-venue-booking-timeline-delhi-ncr.html",
    "wedding-venue-budget-delhi-ncr.html",
    "wedding-venue-food-tasting-checklist-delhi-ncr.html",
    "wedding-venue-hidden-costs-delhi-ncr.html",
    "wedding-venue-site-visit-delhi-ncr.html",
]


def plain_text(source: str) -> str:
    source = re.sub(r"<script\b[\s\S]*?</script>", " ", source, flags=re.I)
    source = re.sub(r"<style\b[\s\S]*?</style>", " ", source, flags=re.I)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", source))).strip()


class EditorialGuideTests(unittest.TestCase):
    def test_all_guides_are_indexable_canonical_and_crm_connected(self):
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        hub = (ROOT / "seo-searches.html").read_text(encoding="utf-8")
        for name in GUIDES:
            with self.subTest(page=name):
                source = (ROOT / name).read_text(encoding="utf-8")
                title = re.search(r"<title[^>]*>(.*?)</title>", source, re.I | re.S)
                description = re.search(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)', source, re.I)
                canonical = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)', source, re.I)
                robots = re.search(r'<meta\s+name=["\']robots["\']\s+content=["\']([^"\']+)', source, re.I)
                self.assertIsNotNone(title)
                self.assertIsNotNone(description)
                self.assertIsNotNone(canonical)
                self.assertIsNotNone(robots)
                self.assertIn("index", robots.group(1).lower())
                self.assertNotIn("noindex", robots.group(1).lower())
                self.assertEqual(canonical.group(1), "https://selectmyvenue.com/" + name)
                self.assertEqual(len(re.findall(r"<h1\b", source, re.I)), 1)
                self.assertIn("data-smv-quick-enquiry", source)
                self.assertIn("quick-enquiry.js", source)
                self.assertGreaterEqual(len(plain_text(source).split()), 400)
                self.assertIn("https://selectmyvenue.com/" + name, sitemap)
                self.assertIn(name, hub)
    def test_delhi_wedding_hub_links_to_budget_guide(self):
        page = (ROOT / "wedding-venues-delhi-ncr.html").read_text(encoding="utf-8")
        self.assertIn("wedding-venue-budget-delhi-ncr.html", page)


if __name__ == "__main__":
    unittest.main()
