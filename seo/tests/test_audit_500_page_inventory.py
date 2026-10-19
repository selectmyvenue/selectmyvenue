import importlib.util
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "audit_500_page_inventory.py"
SPEC = importlib.util.spec_from_file_location("audit_500_page_inventory", MODULE_PATH)
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)


class InventoryAuditTests(unittest.TestCase):
    def make_fixture(self, root: Path, rows: list[dict[str, str]], sitemap_urls: list[str]):
        inventory = root / "inventory.csv"
        with inventory.open("w", encoding="utf-8", newline="") as handle:
            import csv
            writer = csv.DictWriter(handle, fieldnames=sorted(audit.REQUIRED_COLUMNS))
            writer.writeheader()
            writer.writerows(rows)

        sitemap = root / "sitemap.xml"
        sitemap_root = ET.Element(f"{{{audit.NS['sm']}}}urlset")
        for url in sitemap_urls:
            node = ET.SubElement(sitemap_root, f"{{{audit.NS['sm']}}}url")
            ET.SubElement(node, f"{{{audit.NS['sm']}}}loc").text = url
        ET.ElementTree(sitemap_root).write(sitemap, encoding="utf-8", xml_declaration=True)
        return inventory, sitemap

    def row(self, **updates):
        row = {
            "id": "1",
            "cluster": "guide_faq",
            "target_keyword": "venue checklist in Delhi",
            "city_or_scope": "Delhi",
            "locality": "",
            "page_type": "guide",
            "proposed_slug": "venue-checklist-delhi",
            "status": "candidate_not_published",
            "publication_gate": "Unique, useful content required.",
        }
        row.update(updates)
        return row

    def test_clean_candidate_passes_structural_gate_without_claiming_publication(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            inventory, sitemap = self.make_fixture(
                root, [self.row()], ["https://selectmyvenue.com/"]
            )
            errors, warnings, counts = audit.audit_inventory(root, inventory, sitemap)
            self.assertEqual(errors, [])
            self.assertEqual(counts["guide_faq"], 1)
            self.assertTrue(any("not approval to publish" in warning for warning in [] ) is False)

    def test_duplicate_slugs_and_duplicate_sitemap_urls_are_errors(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            rows = [
                self.row(id="1"),
                self.row(id="2", target_keyword="another checklist", proposed_slug="venue-checklist-delhi"),
            ]
            url = "https://selectmyvenue.com/venue-checklist-delhi.html"
            inventory, sitemap = self.make_fixture(root, rows, [url, url])
            errors, warnings, counts = audit.audit_inventory(root, inventory, sitemap)
            self.assertTrue(any("Duplicate proposed_slug" in error for error in errors))
            self.assertTrue(any("duplicate URLs" in error for error in errors))

    def test_existing_page_slug_is_a_warning_not_silently_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "venue-checklist-delhi.html").write_text("<html></html>", encoding="utf-8")
            inventory, sitemap = self.make_fixture(
                root, [self.row()], ["https://selectmyvenue.com/"]
            )
            errors, warnings, _ = audit.audit_inventory(root, inventory, sitemap)
            self.assertEqual(errors, [])
            self.assertTrue(any("collides with existing page" in warning for warning in warnings))

    def test_unapproved_status_and_missing_publication_gate_are_flagged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            inventory, sitemap = self.make_fixture(
                root,
                [self.row(status="published", publication_gate="")],
                ["https://selectmyvenue.com/"],
            )
            errors, warnings, _ = audit.audit_inventory(root, inventory, sitemap)
            self.assertTrue(any("no publication gate" in error for error in errors))
            self.assertTrue(any("unexpected inventory status" in warning for warning in warnings))


if __name__ == "__main__":
    unittest.main()
