"""Static regression checks for SEO-to-CRM attribution wiring."""
from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class OrganicAttributionTests(unittest.TestCase):
    def test_homepage_ai_enquiry_captures_organic_source_and_landing_context(self):
        source = (ROOT / "script.js").read_text(encoding="utf-8")
        self.assertIn("setupTrafficAttribution();", source)
        self.assertIn('attribution.source = "SEO - Organic"', source)
        self.assertIn("searchReferrerHost", source)
        self.assertIn("attribution.landing_title", source)
        self.assertIn("attributionLines.join", source)
        self.assertIn("requirements:", source)
        self.assertIn('contact_remark:', source)
        self.assertIn("attributionLines.join", source)

    def test_quick_enquiry_captures_seo_page_and_campaign_metadata(self):
        source = (ROOT / "quick-enquiry.js").read_text(encoding="utf-8")
        self.assertIn("saved.landing_title", source)
        self.assertIn('saved.source = "SEO - Organic"', source)
        self.assertIn("referrerHost", source)
        self.assertIn("UTM Content:", source)
        self.assertIn("Landing page:", source)


if __name__ == "__main__":
    unittest.main()
