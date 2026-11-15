"""Unit tests for review-only organic landing page qualification safeguards."""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

SEO_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SEO_DIR))
MODULE_PATH = SEO_DIR / "generate_organic_landing_pages.py"
SPEC = importlib.util.spec_from_file_location("generate_organic_landing_pages", MODULE_PATH)
seo_pages = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(seo_pages)


def candidate(**updates):
    row = {
        "id": "1",
        "cluster": "core_city_intent",
        "target_keyword": "wedding venues in Delhi",
        "city_or_scope": "Delhi",
        "locality": "",
        "page_type": "category",
        "proposed_slug": "wedding-venues-in-delhi",
    }
    row.update(updates)
    return row


def venue(venue_id, *, city="Delhi", area="Dwarka", venue_type="banquet hall", **updates):
    row = {
        "id": venue_id,
        "venue_name": f"Venue {venue_id}",
        "city": city,
        "area": area,
        "venue_type": venue_type,
        "event_types": ["Wedding", "Engagement", "Reception"],
        "capacity_min": 50,
        "capacity_max": 250,
        "price_min_per_person": 800,
        "price_max_per_person": 1400,
        "parking_available": True,
    }
    row.update(updates)
    return row


class OrganicLandingPageQualificationTests(unittest.TestCase):
    def test_requires_at_least_three_unique_public_venue_ids(self):
        rows = [venue("1"), venue("2"), venue("3")]
        matches, reason = seo_pages.matches_candidate(candidate(), rows)
        self.assertEqual(len(matches), 3)
        self.assertEqual(reason, "qualified_data_backed_page")

        matches, reason = seo_pages.matches_candidate(candidate(), rows[:2])
        self.assertEqual(matches, [])
        self.assertEqual(reason, "held_thin_inventory_2_matches_need_3")

    def test_subjective_superlative_is_held_without_independent_evidence(self):
        matches, reason = seo_pages.matches_candidate(
            candidate(target_keyword="best wedding venues in Delhi"),
            [venue("1"), venue("2"), venue("3")],
        )
        self.assertEqual(matches, [])
        self.assertEqual(reason, "held_subjective_claim_requires_independent_evidence")

    def test_editorial_and_comparison_topics_are_not_auto_generated_from_listing_data(self):
        for cluster in ("guide_faq", "comparison_intent", "faq_intent"):
            with self.subTest(cluster=cluster):
                matches, reason = seo_pages.matches_candidate(
                    candidate(cluster=cluster, target_keyword="wedding venue booking checklist in Delhi"),
                    [venue("1"), venue("2"), venue("3")],
                )
                self.assertEqual(matches, [])
                self.assertEqual(reason, "editorial_content_requires_human_written_distinct_article")

    def test_locality_page_requires_matching_address_fields(self):
        rows = [venue("1", area="Dwarka"), venue("2", area="Dwarka"), venue("3", area="Dwarka")]
        matches, reason = seo_pages.matches_candidate(
            candidate(cluster="locality_intent", locality="Rohini",
                      target_keyword="wedding venues in Rohini, Delhi"),
            rows,
        )
        self.assertEqual(matches, [])
        self.assertEqual(reason, "held_no_public_venue_coverage_for_locality")

    def test_city_filter_does_not_mislabel_gurgaon_as_delhi(self):
        rows = [venue("1", city="Gurgaon"), venue("2", city="Gurgaon"), venue("3", city="Gurgaon")]
        matches, reason = seo_pages.matches_candidate(candidate(), rows)
        self.assertEqual(matches, [])
        self.assertEqual(reason, "held_thin_inventory_0_matches_need_3")

    def test_numeric_guest_band_requires_capacity_overlap(self):
        self.assertTrue(seo_pages.capacity_matches(
            venue("1", capacity_min=100, capacity_max=250),
            "venues for 100-300 guests"
        ))
        self.assertFalse(seo_pages.capacity_matches(
            venue("2", capacity_min=50, capacity_max=80),
            "venues for 100-300 guests"
        ))
        self.assertFalse(seo_pages.capacity_matches(
            venue("3", capacity_min=350, capacity_max=500),
            "venues for 100-300 guests"
        ))

    def test_event_capacity_page_filters_by_both_event_and_guest_band(self):
        rows = [
            venue("1", capacity_min=100, capacity_max=250, event_types=["Wedding"]),
            venue("2", capacity_min=150, capacity_max=300, event_types=["Wedding"]),
            venue("3", capacity_min=0, capacity_max=200, event_types=["Wedding"]),
            venue("4", capacity_min=100, capacity_max=250, event_types=["Birthday"]),
            venue("5", capacity_min=50, capacity_max=80, event_types=["Wedding"]),
            venue("6", capacity_min=350, capacity_max=500, event_types=["Wedding"]),
        ]
        matches, reason = seo_pages.matches_candidate(
            candidate(
                cluster="event_intent",
                target_keyword="venues for 100-300 guests for wedding in Delhi NCR",
                city_or_scope="Delhi NCR",
                proposed_slug="venues-for-100-300-guests-for-wedding-delhi-ncr",
            ),
            rows,
        )
        self.assertEqual({row["id"] for row in matches}, {"1", "2", "3"})
        self.assertEqual(reason, "qualified_data_backed_page")

    def test_specific_event_phrase_wins_when_keyword_contains_wedding_reception(self):
        self.assertEqual(
            seo_pages.event_name_for("banquet halls for wedding reception in Delhi NCR"),
            "Reception"
        )

    def test_duplicate_public_ids_do_not_inflate_page_coverage(self):
        rows = [venue("same"), venue("same"), venue("other")]
        matches, reason = seo_pages.matches_candidate(candidate(), rows)
        self.assertEqual(matches, [])
        self.assertEqual(reason, "held_thin_inventory_2_matches_need_3")

    def test_pure_veg_page_only_includes_verified_matching_venues(self):
        rows = [
            venue("1", pure_veg=True),
            venue("2", pure_veg=True),
            venue("3", pure_veg=True),
            venue("4", city="Gurgaon", pure_veg=True),
            venue("5", pure_veg=False),
        ]
        matches, reason = seo_pages.matches_candidate(
            candidate(cluster="budget_capacity_facilities",
                      target_keyword="pure veg wedding venues in Delhi"),
            rows,
        )
        self.assertEqual({row["id"] for row in matches}, {"1", "2", "3"})
        self.assertEqual(reason, "qualified_data_backed_page")
        self.assertTrue(all(row.get("pure_veg") is True for row in matches))

    def test_pure_veg_evidence_from_another_city_cannot_qualify_delhi_page(self):
        rows = [
            venue("1", pure_veg=False),
            venue("2", pure_veg=False),
            venue("3", pure_veg=False),
            venue("4", city="Gurgaon", pure_veg=True),
        ]
        matches, reason = seo_pages.matches_candidate(
            candidate(cluster="budget_capacity_facilities",
                      target_keyword="pure veg wedding venues in Delhi"),
            rows,
        )
        self.assertEqual(matches, [])
        self.assertEqual(reason, "held_pure_vegetarian_claim_not_supported_by_public_field")


if __name__ == "__main__":
    unittest.main()
