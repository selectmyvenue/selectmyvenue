#!/usr/bin/env python3
"""Read-only SEO audit for a local checkout of Select My Venue.

Usage from repository root:
    python3 seo/audit_static_seo.py

Uses only the Python standard library. It does not modify files, access Supabase,
or make network requests. It checks HTML metadata and sitemap references only;
it is not a substitute for browser, live HTTP, accessibility, or Search Console tests.
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class MetadataParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts = []
        self.in_title = False
        self.description = ""
        self.canonical = ""
        self.robots = ""
        self.h1_count = 0
        self.img_missing_alt = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == "title":
            self.in_title = True
        elif tag.lower() == "meta":
            if attrs.get("name", "").lower() == "description":
                self.description = attrs.get("content", "").strip()
            elif attrs.get("name", "").lower() == "robots":
                self.robots = attrs.get("content", "").strip().lower()
        elif tag.lower() == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonical = attrs.get("href", "").strip()
        elif tag.lower() == "h1":
            self.h1_count += 1
        elif tag.lower() == "img" and not attrs.get("alt", "").strip():
            self.img_missing_alt += 1

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title_parts.append(data.strip())

    @property
    def title(self):
        return " ".join(part for part in self.title_parts if part).strip()


def main():
    html_files = sorted(ROOT.glob("*.html"))
    if not html_files:
        print("ERROR: no root-level HTML pages found.")
        return 2

    seen_titles = {}
    seen_descriptions = {}
    errors = 0
    warnings = 0
    pages = {}

    for path in html_files:
        parser = MetadataParser()
        try:
            parser.feed(path.read_text(encoding="utf-8", errors="replace"))
        except OSError as exc:
            print(f"ERROR {path.name}: cannot read file ({exc})")
            errors += 1
            continue

        pages[path.name] = parser
        if not parser.title:
            print(f"ERROR {path.name}: missing title")
            errors += 1
        else:
            key = parser.title.casefold()
            if key in seen_titles:
                print(f"WARN  {path.name}: duplicate title also used by {seen_titles[key]}")
                warnings += 1
            else:
                seen_titles[key] = path.name

        if not parser.description:
            print(f"ERROR {path.name}: missing meta description")
            errors += 1
        else:
            key = parser.description.casefold()
            if key in seen_descriptions:
                print(f"WARN  {path.name}: duplicate description also used by {seen_descriptions[key]}")
                warnings += 1
            else:
                seen_descriptions[key] = path.name

        if not parser.canonical:
            print(f"WARN  {path.name}: missing canonical")
            warnings += 1
        if parser.h1_count == 0:
            print(f"WARN  {path.name}: no H1 detected")
            warnings += 1
        if parser.img_missing_alt:
            print(f"WARN  {path.name}: {parser.img_missing_alt} image(s) missing alt text")
            warnings += 1
        if "noindex" in parser.robots:
            print(f"INFO  {path.name}: robots meta includes noindex")

    sitemap_urls = []
    if SITEMAP.exists():
        try:
            tree = ET.parse(SITEMAP)
            sitemap_urls = [
                (node.text or "").strip()
                for node in tree.findall(".//sm:loc", NS)
                if (node.text or "").strip()
            ]
        except ET.ParseError as exc:
            print(f"ERROR sitemap.xml: invalid XML ({exc})")
            errors += 1
    else:
        print("ERROR sitemap.xml: file not found")
        errors += 1

    for url in sitemap_urls:
        filename = url.rstrip("/").split("/")[-1] or "index.html"
        if filename == "selectmyvenue.com":
            filename = "index.html"
        if filename not in pages and filename != "index.html":
            print(f"WARN  sitemap URL has no matching root HTML file: {url}")
            warnings += 1
        elif filename in pages and pages[filename].robots and "noindex" in pages[filename].robots:
            print(f"WARN  sitemap includes noindex page: {url}")
            warnings += 1

    print("\nSEO audit summary")
    print(f"HTML files checked: {len(html_files)}")
    print(f"Sitemap URLs checked: {len(sitemap_urls)}")
    print(f"Errors: {errors}")
    print(f"Warnings: {warnings}")
    print("Note: this is a static source check; it does not test live URLs, mobile layout, structured data validity, or enquiry submission.")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
