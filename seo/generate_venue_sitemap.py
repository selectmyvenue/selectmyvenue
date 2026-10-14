#!/usr/bin/env python3
"""Generate venue URL entries for Select My Venue's XML sitemap.

Input must be a JSON array from the public smv_public_venues RPC (or a wrapper
object with a "data" array). This script never connects to Supabase and never
reads private partner/customer data. Run only on an export of public RPC data.

Usage:
  python3 seo/generate_venue_sitemap.py public-venues.json --output venue-sitemap-urls.xml

The current static site uses /venue.html?id=<UUID>. A later integration step must
merge these entries into sitemap.xml and schedule this script after venue approval.
"""
from __future__ import annotations

import argparse
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlencode
from uuid import UUID

BASE = "https://selectmyvenue.com"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", NS)


def unwrap_rows(payload):
    if isinstance(payload, dict):
        payload = payload.get("data", payload.get("venues", []))
    if not isinstance(payload, list):
        raise ValueError("Input must be a JSON array or an object containing a data/venues array.")
    rows = []
    for item in payload:
        if isinstance(item, dict) and isinstance(item.get("venue"), dict):
            item = item["venue"]
        if isinstance(item, dict):
            rows.append(item)
    return rows


def is_public_venue(venue):
    # Fail closed: missing eligibility fields must never silently publish a venue.
    status = str(venue.get("venue_status") or "").strip().lower()
    verification = str(venue.get("verification_status") or "").strip().lower()
    listing_enabled = venue.get("public_listing_enabled") is True
    return status == "approved" and verification == "verified" and listing_enabled


def venue_url(venue):
    raw_id = str(venue.get("id") or "").strip()
    try:
        stable_id = str(UUID(raw_id))
    except (ValueError, AttributeError, TypeError):
        return None
    if not str(venue.get("venue_name") or "").strip():
        return None
    return f"{BASE}/venue.html?{urlencode({'id': stable_id})}"


def build_xml(venues):
    urlset = ET.Element(f"{{{NS}}}urlset")
    unique_urls = set()
    for venue in venues:
        if not is_public_venue(venue):
            continue
        url = venue_url(venue)
        if not url or url in unique_urls:
            continue
        unique_urls.add(url)
        node = ET.SubElement(urlset, f"{{{NS}}}url")
        ET.SubElement(node, f"{{{NS}}}loc").text = url
    return ET.tostring(urlset, encoding="utf-8", xml_declaration=True), len(unique_urls)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="JSON export from the public venues RPC")
    parser.add_argument("--output", type=Path, default=Path("venue-sitemap-urls.xml"))
    args = parser.parse_args()
    try:
        payload = json.loads(args.input.read_text(encoding="utf-8"))
        xml, count = build_xml(unwrap_rows(payload))
        ET.fromstring(xml)
        args.output.write_bytes(xml + b"\n")
    except (OSError, json.JSONDecodeError, ValueError, ET.ParseError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    print(f"Wrote {count} approved, verified, public venue URL(s) to {args.output}")
    print("This creates a fragment only; it does not edit sitemap.xml or deploy the website.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
