#!/usr/bin/env python3
"""Audit the 500-page execution matrix against the candidate inventory and sitemap."""
from __future__ import annotations

import argparse
import csv
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "seo" / "SEO_500_PAGE_INVENTORY.csv"
MATRIX = ROOT / "seo" / "SEO_500_PAGE_EXECUTION_MATRIX.csv"
SITEMAP = ROOT / "sitemap.xml"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
REQUIRED = {
    "id", "cluster", "target_keyword", "city_or_scope", "locality",
    "page_type", "proposed_slug", "recommended_action", "content_angle",
    "required_evidence", "unique_content_requirements", "internal_link_targets",
    "publication_status", "sitemap_slug_collision",
}
SUBJECTIVE = ("best ", "top ", "luxury", "premium", "most popular", "highest rated", "affordable")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return [{key: (value or "").strip() for key, value in row.items()}
                for row in csv.DictReader(handle)]


def audit(inventory_path: Path, matrix_path: Path, sitemap_path: Path) -> tuple[list[str], Counter]:
    errors: list[str] = []
    inventory = read_csv(inventory_path)
    matrix = read_csv(matrix_path)
    counts = Counter(row.get("recommended_action", "") for row in matrix)
    if len(inventory) != 500:
        errors.append(f"Expected 500 inventory rows, found {len(inventory)}.")
    if len(matrix) != 500:
        errors.append(f"Expected 500 execution-matrix rows, found {len(matrix)}.")
    missing = REQUIRED - set(matrix[0].keys() if matrix else [])
    if missing:
        errors.append("Execution matrix missing columns: " + ", ".join(sorted(missing)))
        return errors, counts

    inv_by_id = {row.get("id", ""): row for row in inventory}
    matrix_by_id = {row.get("id", ""): row for row in matrix}
    if len(inv_by_id) != len(inventory):
        errors.append("Inventory contains duplicate IDs.")
    if len(matrix_by_id) != len(matrix):
        errors.append("Execution matrix contains duplicate IDs.")
    if set(inv_by_id) != set(matrix_by_id):
        errors.append("Inventory and execution matrix IDs do not match.")
    for candidate_id, source in inv_by_id.items():
        row = matrix_by_id.get(candidate_id)
        if not row:
            continue
        for field in ("cluster", "target_keyword", "city_or_scope", "locality", "page_type", "proposed_slug"):
            if source.get(field, "") != row.get(field, ""):
                errors.append(f"Candidate {candidate_id} has mismatched {field} between inventory and matrix.")
        for field in ("recommended_action", "content_angle", "required_evidence",
                      "unique_content_requirements", "internal_link_targets", "publication_status"):
            if not row.get(field):
                errors.append(f"Candidate {candidate_id} is missing matrix field {field}.")
        keyword = row.get("target_keyword", "").lower()
        if any(term in keyword for term in SUBJECTIVE) and row.get("recommended_action") not in {
            "HOLD_UNTIL_EVIDENCE", "REUSE_EXISTING_PAGE", "REUSE_OR_MERGE_EXISTING_GUIDE",
            "MERGE_UNLESS_CITY_SPECIFIC_VALUE", "MERGE_UNLESS_DISTINCT_MONSOON_VALUE",
            "REUSE_EXISTING_GUIDE",
        }:
            errors.append(f"Candidate {candidate_id} makes a subjective claim without an evidence hold.")
        normalized_keyword = re.sub(r"[^a-z0-9]+", " ", keyword).strip()
        vague_capacity = any(term in normalized_keyword for term in ("large capacity", "intimate", "small")) and not re.search(r"\\d", keyword)
        if vague_capacity and row.get("recommended_action") not in {
            "HOLD_UNTIL_EVIDENCE", "REUSE_EXISTING_PAGE", "REUSE_OR_MERGE_EXISTING_GUIDE",
            "MERGE_UNLESS_CITY_SPECIFIC_VALUE", "MERGE_UNLESS_DISTINCT_MONSOON_VALUE",
            "REUSE_EXISTING_GUIDE",
        }:
            errors.append(f"Candidate {candidate_id} uses an undefined capacity band without an evidence hold.")
        if "pure veg" in normalized_keyword and row.get("recommended_action") not in {
            "HOLD_UNTIL_EVIDENCE", "REUSE_EXISTING_PAGE", "REUSE_OR_MERGE_EXISTING_GUIDE",
            "MERGE_UNLESS_CITY_SPECIFIC_VALUE", "REUSE_EXISTING_GUIDE",
        }:
            errors.append(f"Candidate {candidate_id} makes a pure-vegetarian claim without explicit evidence.")

    sitemap_urls: set[str] = set()
    if sitemap_path.exists():
        try:
            root = ET.parse(sitemap_path).getroot()
            sitemap_urls = {
                (node.text or "").strip()
                for node in root.findall("sm:url/sm:loc", NS)
                if node.text
            }
        except ET.ParseError as exc:
            errors.append(f"Sitemap XML is invalid: {exc}")
    else:
        errors.append(f"Sitemap does not exist: {sitemap_path}")

    for row in matrix:
        url = "https://selectmyvenue.com/" + row.get("proposed_slug", "") + ".html"
        expected = "yes" if url in sitemap_urls else "no"
        if row.get("sitemap_slug_collision") != expected:
            errors.append(
                f"Candidate {row.get('id')} sitemap collision flag is stale; expected {expected} for {url}."
            )

    return errors, counts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", type=Path, default=INVENTORY)
    parser.add_argument("--matrix", type=Path, default=MATRIX)
    parser.add_argument("--sitemap", type=Path, default=SITEMAP)
    args = parser.parse_args()
    try:
        errors, counts = audit(args.inventory, args.matrix, args.sitemap)
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    print("500-page execution matrix actions:")
    for action, count in sorted(counts.items()):
        print(f"  {action}: {count}")
    if errors:
        for error in errors:
            print("ERROR: " + error)
        print(f"Execution matrix audit failed with {len(errors)} error(s).")
        return 1
    print("Execution matrix structure and sitemap collision flags are consistent.")
    print("This is a planning/evidence gate, not approval to publish all 500 URLs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
