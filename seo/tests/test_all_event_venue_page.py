import pathlib
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGE = ROOT / "venues-for-every-event-delhi-ncr.html"
SITEMAP = ROOT / "sitemap.xml"
HUB = ROOT / "seo-searches.html"
HANDLER = ROOT / "quick-enquiry.js"


class AllEventVenuePageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = PAGE.read_text(encoding="utf-8")
        cls.handler = HANDLER.read_text(encoding="utf-8")
        cls.hub = HUB.read_text(encoding="utf-8")
        cls.sitemap = ET.parse(SITEMAP).getroot()

    def test_page_has_canonical_and_indexable_metadata(self):
        self.assertIn('<link rel="canonical" href="https://selectmyvenue.com/venues-for-every-event-delhi-ncr.html">', self.page)
        self.assertRegex(self.page, r'<meta name="robots" content="index,follow')
        self.assertIn("<h1>Find a venue that fits your event, guests, location and budget.</h1>", self.page)

    def test_quick_enquiry_uses_existing_handler_and_supported_fields(self):
        self.assertIn('src="quick-enquiry.js?', self.page)
        self.assertIn('data-smv-quick-enquiry', self.page)
        for field in ("customer_name", "mobile", "occasion", "location", "event_date", "guests", "budget_per_person", "requirements"):
            self.assertRegex(self.page, rf'name="{field}"')
        for field in ("customer_name", "mobile", "location", "event_date", "occasion", "guests", "budget_per_person"):
            self.assertIn(f"form.elements.{field}", self.handler, msg=f"Existing handler should support {field}")
        comment_parser = self.handler.split("function extractComment(form)", 1)[1].split("function setMessage", 1)[0]
        self.assertIn('"requirements"', comment_parser, "Preferences field must be read by the existing comment/requirements parser")
        self.assertIn('client.from("customer_enquiries").insert(payload)', self.handler)
        self.assertIn('"Customer comment: " + comment', self.handler)

    def test_event_options_map_to_occasion_field(self):
        match = re.search(r'<select name="occasion" required>(.*?)</select>', self.page, re.S)
        self.assertIsNotNone(match, "Event choices must be submitted as occasion for the existing CRM handler")
        for event in ("Wedding", "Engagement", "Reception", "Birthday", "Anniversary", "Kitty Party", "Corporate Event", "Other Event"):
            self.assertIn(f">{event}</option>", match.group(1))

    def test_search_hub_enquiry_uses_the_same_crm_handler(self):
        form_start = self.hub.index('<form class="quick-search-form"')
        form_end = self.hub.index("</form>", form_start)
        form = self.hub[form_start:form_end]
        self.assertIn("data-smv-quick-enquiry", form)
        self.assertNotIn('action="index.html#enquiry"', form)
        self.assertNotIn('method="get"', form)
        for field in ("customer_name", "mobile", "occasion", "location", "event_date", "guests", "budget_per_person", "requirements"):
            self.assertRegex(form, rf'name="{field}"')
        self.assertIn('src="quick-enquiry.js?', self.hub)
        self.assertIn('client.from("customer_enquiries").insert(payload)', self.handler)

    def test_page_is_linked_from_hub_and_sitemap(self):
        self.assertIn("venues-for-every-event-delhi-ncr.html", self.hub)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        urls = [node.text for node in self.sitemap.findall("sm:url/sm:loc", ns)]
        self.assertIn("https://selectmyvenue.com/venues-for-every-event-delhi-ncr.html", urls)
        self.assertEqual(len(urls), len(set(urls)), "Sitemap URLs must be unique")


if __name__ == "__main__":
    unittest.main()
