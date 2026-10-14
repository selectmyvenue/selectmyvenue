import importlib.util
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
