"""Regression checks for canonical homepage navigation links."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEGACY_HOME_HREF = re.compile(r"""href=(["'])index\.html(?=[?#"'])""", re.IGNORECASE)


class CanonicalHomeLinksTests(unittest.TestCase):
    def test_top_level_pages_link_home_to_root_not_index_html(self):
        offenders = []
        for page in sorted(ROOT.glob("*.html")):
            if page.name == "index.html":
                continue
            matches = len(LEGACY_HOME_HREF.findall(page.read_text(encoding="utf-8")))
            if matches:
                offenders.append(f"{page.name}: {matches}")
        self.assertEqual(
            offenders,
            [],
            "Homepage navigation should use the canonical root URL (/), not /index.html.",
        )

    def test_mobile_navigation_uses_canonical_root_home_url(self):
        script = (ROOT / "website-mobile-app-20261002.js").read_text(encoding="utf-8")
        self.assertIsNone(
            LEGACY_HOME_HREF.search(script),
            "Mobile navigation should link to / rather than /index.html.",
        )


if __name__ == "__main__":
    unittest.main()
