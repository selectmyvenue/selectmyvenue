#!/usr/bin/env python3
"""Read-only validation for SMV's 500-page SEO candidate inventory.

This gate deliberately does not publish pages. It identifies candidates that
need a collision, sitemap, or status review before distinct content is written.
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "seo" / "SEO_500_PAGE_INVENTORY.csv"
SITEMAP = ROOT / "sitemap.xml"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
REQUIRED_COLUMNS = {
    "id", "cluster", "target_keyword", "city_or_scope", "page_type",
    "proposed_slug", "status", "publication_gate",
}


def slug_for_path(path: Path) -> str:
    return path.stem if path.suffix.lower() == ".html" else path.name


def load_inventory(path: Path = INVENTORY) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise ValueError("Inventory is missing required columns: " + ", ".join(sorted(missing)))
        return [{key: (value or "").strip() for key, value in row.items()} for row in reader]


def audit_inventory(root: Path = ROOT, inventory_path: Path = INVENTORY,
                    sitemap_path: Path = SITEMAP) -> tuple[list[str], list[str], Counter]:
    errors: list[str] = []
    warnings: list[str] = []
    rows = load_inventory(inventory_path)
    if not rows:
        errors.append("Inventory contains no candidate rows.")

    ids = [row["id"] for row in rows]
    slugs = [row["proposed_slug"] for row in rows]
    keywords = [row["target_keyword"].casefold() for row in rows]

    for value, label in ((ids, "id"), (slugs, "proposed_slug"), (keywords, "target_keyword")):
        duplicates = sorted(item for item, count in Counter(value).items() if item and count > 1)
        if duplicates:
            errors.append(f"Duplicate {label} values: " + ", ".join(duplicates[:12]))

    counts = Counter(row["cluster"] for row in rows)
    for row in rows:
        if not row["id"] or not row["cluster"] or not row["target_keyword"] or not row["proposed_slug"]:
            errors.append(f"Row {row.get('id') or '?'} has a missing required value.")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", row["proposed_slug"]):
            errors.append(f"Invalid slug format for row {row.get('id')}: {row['proposed_slug']!r}")
        if row["status"] != "candidate_not_published":
            warnings.append(f"Row {row.get('id')} has unexpected inventory status {row['status']!r}; review manually.")
        if not row["publication_gate"]:
            errors.append(f"Row {row.get('id')} has no publication gate.")

    # Check root-level static pages, which are the current convention for SEO
    # landing pages. Generated /venue-pages/ redirect helpers are excluded.
    existing_html = {
        path.stem: path for path in root.glob("*.html")
        if path.is_file()
    }
    for slug in sorted(set(slugs) & set(existing_html)):
        warnings.append(
            f"Candidate slug '{slug}' collides with existing page '{existing_html[slug].name}'; "
            "reuse/audit that page rather than create a duplicate."
        )

    sitemap_urls: list[str] = []
    if sitemap_path.exists():
        try:
            sitemap_root = ET.parse(sitemap_path).getroot()
            sitemap_urls = [
                (node.text or "").strip()
                for node in sitemap_root.findall("sm:url/sm:loc", NS)
            ]
        except ET.ParseError as exc:
            errors.append(f"Sitemap XML is invalid: {exc}")
    else:
        errors.append(f"Sitemap not found: {sitemap_path}")

    duplicate_urls = sorted(url for url, count in Counter(sitemap_urls).items() if url and count > 1)
    if duplicate_urls:
        errors.append("Sitemap contains duplicate URLs: " + ", ".join(duplicate_urls[:10]))

    live_sitemap_paths = set()
    for url in sitemap_urls:
        parsed = urlparse(url)
        if parsed.hostname not in {"selectmyvenue.com", "www.selectmyvenue.com"}:
            continue
        path = parsed.path.strip("/")
        if path.endswith(".html"):
            live_sitemap_paths.add(Path(path).stem)

    for row in rows:
        slug = row["proposed_slug"]
        if slug in live_sitemap_paths:
            warnings.append(
                f"Candidate '{slug}' is already represented in the sitemap; audit intent/canonical before adding a URL."
            )

    # Near-duplicate intent detection: exact phrases after punctuation and
    # whitespace normalization. This is a warning, not an automatic rejection.
    normalized: dict[str, str] = {}
    for row in rows:
        norm = re.sub(r"[^a-z0-9]+", " ", row["target_keyword"].casefold()).strip()
        if norm in normalized:
            warnings.append(
                f"Rows {normalized[norm]} and {row['id']} normalize to the same keyword intent."
            )
        else:
            normalized[norm] = row["id"]

    return errors, warnings, counts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--inventory", type=Path, default=INVENTORY)
    parser.add_argument("--sitemap", type=Path, default=SITEMAP)
    args = parser.parse_args()
    try:
        errors, warnings, counts = audit_inventory(args.root, args.inventory, args.sitemap)
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    print(f"Candidate rows checked: {sum(counts.values())}")
    for cluster, count in sorted(counts.items()):
        print(f"  {cluster}: {count}")
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"Inventory audit failed with {len(errors)} error(s) and {len(warnings)} warning(s).")
        return 1
    print(f"Inventory structure passed with {len(warnings)} warning(s).")
    print("Important: structural pass is not approval to publish; venue coverage, search intent, unique content, and enquiry QA remain required.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
