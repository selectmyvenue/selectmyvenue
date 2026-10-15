import importlib.util
import json
import re
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "generate_venue_seo.py"
SPEC = importlib.util.spec_from_file_location("generate_venue_seo", MODULE_PATH)
generator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(generator)


class PublicVenueEligibilityTests(unittest.TestCase):
    def test_public_rpc_projection_uses_name_and_real_location(self):
        # The live smv_public_venues RPC exposes only its public projection;
        # internal approval/verification columns are not part of its response.
        venue = {
            "id": "11111111-1111-4111-8111-111111111111",
            "venue_name": "Sample Banquet",
            "area": "Sector 29",
            "city": "Gurugram",
        }
        self.assertTrue(generator.is_public(venue))

    def test_excludes_rows_without_name_or_location(self):
        self.assertFalse(generator.is_public({"venue_name": "", "area": "Sector 29"}))
        self.assertFalse(generator.is_public({"venue_name": "Sample Banquet"}))
        self.assertFalse(generator.is_public({"venue_name": "Sample Banquet", "area": "", "city": ""}))
        self.assertTrue(generator.is_public({"venue_name": "Sample Banquet", "area": "Sector 29"}))
        self.assertTrue(generator.is_public({"venue_name": "Sample Banquet", "city": "Gurugram"}))

    def test_focus_market_prioritizes_delhi_and_gurgaon_aliases(self):
        self.assertEqual(generator.focus_market({"city": "Delhi", "area": "Chhatarpur"}), "Delhi")
        self.assertEqual(generator.focus_market({"city": "New Delhi", "area": "South Delhi"}), "Delhi")
        self.assertEqual(generator.focus_market({"city": "Gurgaon", "area": "Sector 29"}), "Gurgaon")
        self.assertEqual(generator.focus_market({"city": "Gurugram", "area": "Sector 56"}), "Gurgaon")

    def test_focus_market_does_not_misclassify_other_or_ambiguous_ncr_locations(self):
        self.assertIsNone(generator.focus_market({"city": "Noida", "area": "Delhi NCR"}))
        self.assertIsNone(generator.focus_market({"city": "Faridabad", "area": "Delhi NCR"}))
        self.assertIsNone(generator.focus_market({"city": "Delhi NCR", "area": "Sector 29"}))
        self.assertIsNone(generator.focus_market({"city": "", "area": "NCR"}))

    def test_generated_page_opens_quote_and_captures_landing_attribution(self):
        venue = {
            "id": "11111111-1111-4111-8111-111111111111",
            "venue_name": "Sample Banquet",
            "area": "Sector 29",
            "city": "Gurugram",
            "venue_type": "Banquet Hall",
            "capacity_max": 300,
            "price_min_per_person": 1500,
        }
        page = generator.venue_page(venue, "https://selectmyvenue.com/venue-pages/sample-banquet-11111111/")
        self.assertIn("quote=1", page)
        self.assertIn("smv-traffic-attribution-v1", page)
        self.assertIn('name="description"', page)
        self.assertIn('rel="canonical"', page)
        self.assertIn("Sample Banquet", page)
        self.assertIn("Venue profile", page)
        self.assertIn(generator.GENERATED_MARKER, page)
        self.assertNotIn("Verified venue listing", page)
        self.assertNotIn("approved public listing", page)

    def test_generated_json_ld_is_valid_and_uses_only_supported_location_facts(self):
        venue = {
            "id": "11111111-1111-4111-8111-111111111111",
            "venue_name": "Sample Banquet",
            "area": "Sector 29",
            "city": "Gurugram",
            "venue_type": "Banquet Hall",
        }
        page = generator.venue_page(venue, "https://selectmyvenue.com/venue-pages/sample-banquet-11111111/")
        match = re.search(r'<script type="application/ld\+json">(.*?)</script>', page, re.S)
        self.assertIsNotNone(match)
        schema = json.loads(match.group(1))
        self.assertEqual(schema["@type"], "LocalBusiness")
        self.assertEqual(schema["address"]["addressLocality"], "Gurugram")
        self.assertNotIn("additionalType", schema)

        broad_city_page = generator.venue_page(
            {
                "id": "22222222-2222-4222-8222-222222222222",
                "venue_name": "Gurgaon Sample Venue",
                "area": "Gurgaon",
                "city": "Delhi NCR",
            },
            "https://selectmyvenue.com/venue-pages/gurgaon-sample-22222222/",
        )
        self.assertIn("Gurgaon", broad_city_page)
        self.assertNotIn("Gurgaon, Delhi NCR", broad_city_page)
        broad_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', broad_city_page, re.S)
        self.assertIsNotNone(broad_match)
        broad_schema = json.loads(broad_match.group(1))
        self.assertEqual(broad_schema["address"]["addressLocality"], "Gurgaon")

    def test_prunes_only_stale_pages_marked_as_generator_owned(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "venue-pages"
            stale = output / "stale-venue"
            current = output / "current-venue"
            manual = output / "manual-page"
            for directory in (stale, current, manual):
                directory.mkdir(parents=True)
            (stale / "index.html").write_text(generator.GENERATED_MARKER + "<html></html>", encoding="utf-8")
            (current / "index.html").write_text(generator.GENERATED_MARKER + "<html></html>", encoding="utf-8")
            (manual / "index.html").write_text("<html>Do not delete</html>", encoding="utf-8")

            removed = generator.prune_stale_generated_pages(output, {"current-venue"})

            self.assertEqual(removed, 1)
            self.assertFalse(stale.exists())
            self.assertTrue(current.exists())
            self.assertTrue(manual.exists())

    def test_schema_does_not_invent_locality_when_listing_has_no_location(self):
        venue = {
            "id": "22222222-2222-4222-8222-222222222222",
            "venue_name": "Sample Banquet",
        }
        page = generator.venue_page(venue, "https://selectmyvenue.com/venue-pages/sample-banquet-22222222/")
        self.assertIn('"addressCountry": "IN"', page)
        self.assertNotIn('"addressLocality"', page)
        self.assertNotIn("in Delhi NCR", page)
        self.assertIn("Location details on request", page)


if __name__ == "__main__":
    unittest.main()
