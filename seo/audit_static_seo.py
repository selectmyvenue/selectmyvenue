#!/usr/bin/env python3
"""Read-only static SEO audit for the Select My Venue static site.

Run from the repository root:
    python seo/audit_static_seo.py

This script reports issues only; it never edits site files or sitemap dates.
Dynamic venue.html profiles set their per-venue metadata at runtime and are
intentionally not required to have a unique static canonical or sitemap URL.
"""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://selectmyvenue.com"
SITEMAP = ROOT / "sitemap.xml"
DYNAMIC_PAGES = {"venue.html"}
IGNORED_FILES = {"index.html"}  # represented by the root URL in sitemap.xml


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.in_title = False
        self.description: list[str] = []
        self.canonicals: list[str] = []
        self.h1_parts: list[list[str]] = []
        self.in_h1 = False
        self.images: list[dict[str, str | None]] = []
        self.robots: list[str] = []
        self._current_h1: list[str] | None = None

    def handle_starttag(self, tag: str, attrs) -> None:
        a = dict(attrs)
        if tag == "title":
            self.in_title = True
        elif tag == "meta":
            name = (a.get("name") or "").lower()
            if name == "description" and a.get("content") is not None:
                self.description.append(a["content"].strip())
            elif name == "robots" and a.get("content") is not None:
                self.robots.append(a["content"].strip())
        elif tag == "link" and "canonical" in (a.get("rel") or "").lower().split():
            if a.get("href"):
                self.canonicals.append(a["href"].strip())
        elif tag == "h1":
            self.in_h1 = True
            self._current_h1 = []
            self.h1_parts.append(self._current_h1)
        elif tag == "img":
            self.images.append({"src": a.get("src"), "alt": a.get("alt")})

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        elif tag == "h1":
            self.in_h1 = False
            self._current_h1 = None

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self.in_h1 and self._current_h1 is not None:
            self._current_h1.append(data)


def clean(parts: list[str]) -> str:
    return re.sub(r"\s+", " ", " ".join(parts)).strip()


def main() -> int:
    issues: list[dict[str, str]] = []
    pages = sorted(ROOT.glob("*.html"))
    page_records: dict[str, dict] = {}
    for path in pages:
        parser = PageParser()
        try:
            parser.feed(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as exc:
            issues.append({"severity": "ERROR", "file": path.name, "issue": f"Cannot read HTML: {exc}"})
            continue

        title = clean(parser.title_parts)
        description = parser.description[0] if parser.description else ""
        canonical = parser.canonicals[0] if parser.canonicals else ""
        h1s = [clean(parts) for parts in parser.h1_parts if clean(parts)]
        page_records[path.name] = {
            "title": title, "description": description,
            "canonical": canonical, "h1_count": len(h1s),
            "image_count": len(parser.images),
        }
        if not title:
            issues.append({"severity": "ERROR", "file": path.name, "issue": "Missing title"})
        if not description:
            issues.append({"severity": "ERROR", "file": path.name, "issue": "Missing meta description"})
        if not canonical:
            issues.append({"severity": "ERROR", "file": path.name, "issue": "Missing canonical"})
        else:
            parsed = urlparse(canonical)
            if parsed.scheme != "https" or parsed.netloc != "selectmyvenue.com":
                issues.append({"severity": "ERROR", "file": path.name, "issue": f"Canonical is not on the primary HTTPS host: {canonical}"})
        if not h1s and path.name not in DYNAMIC_PAGES:
            issues.append({"severity": "WARN", "file": path.name, "issue": "No static H1 found"})
        if len(h1s) > 1:
            issues.append({"severity": "WARN", "file": path.name, "issue": f"{len(h1s)} static H1 headings found"})
        for image in parser.images:
            if image["alt"] is None:
                issues.append({"severity": "WARN", "file": path.name, "issue": f"Image missing alt attribute: {image['src'] or '(no src)'}"})

    for field in ("title", "description", "canonical"):
        values: dict[str, list[str]] = defaultdict(list)
        for name, record in page_records.items():
            value = record[field].casefold().strip()
            if value:
                values[value].append(name)
        for value, names in values.items():
            if len(names) > 1:
                # Generic template canonical on venue.html is runtime-adjusted for individual profiles.
                if field == "canonical" and all(n in DYNAMIC_PAGES for n in names):
                    continue
                issues.append({"severity": "WARN", "file": ", ".join(names), "issue": f"Duplicate {field}: {value}"})

    sitemap_urls: list[str] = []
    if not SITEMAP.exists():
        issues.append({"severity": "ERROR", "file": "sitemap.xml", "issue": "Sitemap file missing"})
    else:
        try:
            root = ET.parse(SITEMAP).getroot()
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            sitemap_urls = [el.text.strip() for el in root.findall(".//sm:loc", ns) if el.text and el.text.strip()]
            if len(sitemap_urls) != len(set(sitemap_urls)):
                issues.append({"severity": "ERROR", "file": "sitemap.xml", "issue": "Duplicate <loc> URLs"})
            for url in sitemap_urls:
                parsed = urlparse(url)
                if parsed.scheme != "https" or parsed.netloc != "selectmyvenue.com":
                    issues.append({"severity": "ERROR", "file": "sitemap.xml", "issue": f"URL is not on primary HTTPS host: {url}"})
                if parsed.query or parsed.fragment:
                    issues.append({"severity": "WARN", "file": "sitemap.xml", "issue": f"URL has query or fragment: {url}"})
                rel = parsed.path.lstrip("/")
                target = ROOT / (rel if rel else "index.html")
                if not target.is_file():
                    issues.append({"severity": "ERROR", "file": "sitemap.xml", "issue": f"URL has no matching local file: {url}"})
            for name, record in page_records.items():
                if name in DYNAMIC_PAGES or name in IGNORED_FILES:
                    continue
                expected = f"{SITE}/{name}"
                if expected not in sitemap_urls:
                    issues.append({"severity": "WARN", "file": "sitemap.xml", "issue": f"HTML page not listed in sitemap: {name}"})
        except (ET.ParseError, OSError) as exc:
            issues.append({"severity": "ERROR", "file": "sitemap.xml", "issue": f"Cannot parse sitemap XML: {exc}"})

    errors = sum(i["severity"] == "ERROR" for i in issues)
    warnings = sum(i["severity"] == "WARN" for i in issues)
    report = {
        "html_pages_checked": len(pages),
        "sitemap_urls": len(sitemap_urls),
        "errors": errors,
        "warnings": warnings,
        "issues": issues,
        "note": "Static audit only; dynamic rendering, live HTTP responses, Search Console indexing, and structured-data validity require separate checks."
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
