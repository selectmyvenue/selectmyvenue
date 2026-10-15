#!/usr/bin/env python3
"""Read-only SEO audit for a local checkout of Select My Venue.

Usage from repository root:
    python3 seo/audit_static_seo.py

Uses only the Python standard library. It does not modify files, access Supabase,
or make network requests. It checks static HTML and sitemap-to-file consistency;
it is not a substitute for live HTTP, browser, accessibility, or Search Console tests.
"""
import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"
SITE_HOST = "selectmyvenue.com"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__"}


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
        tag = tag.lower()
        if tag == "title":
            self.in_title = True
        elif tag == "meta":
            if attrs.get("name", "").lower() == "description":
                self.description = attrs.get("content", "").strip()
            elif attrs.get("name", "").lower() == "robots":
                self.robots = attrs.get("content", "").strip().lower()
        elif tag == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonical = attrs.get("href", "").strip()
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "img" and not attrs.get("alt", "").strip():
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


def html_files_under(root: Path, generated_only: bool = False):
    """Find HTML pages while skipping dependencies; optionally limit metadata checks to generated venue pages."""
    search_root = root / "venue-pages" if generated_only else root
    if not search_root.is_dir():
        return []
    return sorted(
        path for path in search_root.rglob("*.html")
        if not any(part in SKIP_DIRS for part in path.relative_to(root).parts)
    )


def sitemap_url_to_file(url: str, root: Path) -> Path | None:
    """Map a same-site sitemap URL to its local static HTML file."""
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in {SITE_HOST, "www." + SITE_HOST}:
        return None
    path = parsed.path or "/"
    if path == "/":
        relative = Path("index.html")
    else:
        relative = Path(path.lstrip("/"))
        if path.endswith("/"):
            relative = relative / "index.html"
        elif relative.suffix.lower() != ".html":
            # Static host directory URLs should resolve to an index document.
            relative = relative / "index.html"
    target = (root / relative).resolve()
    try:
        target.relative_to(root.resolve())
    except ValueError:
        return None
    return target


def canonical_mismatch(url: str, canonical: str) -> bool:
    """Return whether sitemap and canonical disagree beyond known JS-rendered venue profiles."""
    if not canonical or canonical.rstrip("/") == url.rstrip("/"):
        return False
    parsed_url = urlparse(url)
    # venue.html starts with a generic canonical in source HTML; venue-profile.js
    # sets the venue-specific canonical after loading the public listing.
    return not (
        parsed_url.path == "/venue.html"
        and bool(parse_qs(parsed_url.query).get("id"))
        and canonical.rstrip("/") == f"https://{SITE_HOST}/venue.html"
    )


def main(generated_only: bool = False):
    html_files = html_files_under(ROOT, generated_only=generated_only)
    if not html_files:
        print("ERROR: no HTML pages found.")
        return 2

    seen_titles = {}
    seen_descriptions = {}
    errors = 0
    warnings = 0
    pages = {}
    for path in html_files:
        rel = path.relative_to(ROOT).as_posix()
        parser = MetadataParser()
        try:
            parser.feed(path.read_text(encoding="utf-8", errors="replace"))
        except OSError as exc:
            print(f"ERROR {rel}: cannot read file ({exc})")
            errors += 1
            continue
        pages[rel] = parser

        if not parser.title:
            print(f"ERROR {rel}: missing title")
            errors += 1
        else:
            key = parser.title.casefold()
            if key in seen_titles:
                print(f"WARN  {rel}: duplicate title also used by {seen_titles[key]}")
                warnings += 1
            else:
                seen_titles[key] = rel

        if not parser.description:
            print(f"ERROR {rel}: missing meta description")
            errors += 1
        else:
            key = parser.description.casefold()
            if key in seen_descriptions:
                print(f"WARN  {rel}: duplicate description also used by {seen_descriptions[key]}")
                warnings += 1
            else:
                seen_descriptions[key] = rel

        if not parser.canonical:
            print(f"WARN  {rel}: missing canonical")
            warnings += 1
        if parser.h1_count == 0:
            print(f"WARN  {rel}: no H1 detected")
            warnings += 1
        if parser.img_missing_alt:
            print(f"WARN  {rel}: {parser.img_missing_alt} image(s) missing alt text")
            warnings += 1
        if "noindex" in parser.robots:
            print(f"INFO  {rel}: robots meta includes noindex")

    sitemap_urls = []
    sitemap_targets = {}
    if SITEMAP.exists():
        try:
            tree = ET.parse(SITEMAP)
            sitemap_root = tree.getroot()
            if sitemap_root.tag != f"{{{NS['sm']}}}urlset":
                print("ERROR sitemap.xml: root element is not a standard sitemap urlset")
                errors += 1
            sitemap_urls = [
                (node.text or "").strip()
                for node in sitemap_root.findall(".//sm:loc", NS)
                if (node.text or "").strip()
            ]
        except ET.ParseError as exc:
            print(f"ERROR sitemap.xml: invalid XML ({exc})")
            errors += 1
    else:
        print("ERROR sitemap.xml: file not found")
        errors += 1

    seen_urls = set()
    for url in sitemap_urls:
        if url in seen_urls:
            print(f"ERROR sitemap.xml: duplicate URL {url}")
            errors += 1
            continue
        seen_urls.add(url)

        target = sitemap_url_to_file(url, ROOT)
        if target is None:
            print(f"WARN  sitemap URL is not an HTTPS Select My Venue URL: {url}")
            warnings += 1
            continue
        try:
            rel = target.relative_to(ROOT.resolve()).as_posix()
        except ValueError:
            rel = ""
        if not target.is_file():
            print(f"WARN  sitemap URL has no matching local HTML file: {url} (expected {rel})")
            warnings += 1
            continue
        sitemap_targets[url] = rel
        parser = pages.get(rel)
        if parser is None:
            parser = MetadataParser()
            parser.feed(target.read_text(encoding="utf-8", errors="replace"))
        if parser.robots and "noindex" in parser.robots:
            print(f"WARN  sitemap includes noindex page: {url}")
            warnings += 1
        if canonical_mismatch(url, parser.canonical):
            print(f"WARN  canonical does not match sitemap URL: {url} (canonical: {parser.canonical})")
            warnings += 1

    print("\nSEO audit summary")
    print(f"HTML files checked: {len(html_files)}")
    print(f"Sitemap URLs checked: {len(sitemap_urls)}")
    print(f"Sitemap URLs mapped to local HTML: {len(sitemap_targets)}")
    print(f"Errors: {errors}")
    print(f"Warnings: {warnings}")
    print("Note: this is a static source check; it does not test live URLs, mobile layout, structured data validity, indexing, or enquiry submission.")
    return 1 if errors else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Static SEO audit for Select My Venue")
    parser.add_argument("--generated-only", action="store_true", help="check metadata only on generated venue pages; still validate the full sitemap")
    args = parser.parse_args()
    raise SystemExit(main(generated_only=args.generated_only))
