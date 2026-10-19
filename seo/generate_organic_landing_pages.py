#!/usr/bin/env python3
"""Build review-only, data-backed organic landing-page artifacts from the 500-row inventory.

This is deliberately not a deployer. It writes only to --output (default:
seo/generated-organic-pages), never edits sitemap.xml or production. It uses the
existing public venue RPC and publishes a candidate page only when its claims can
be supported by enough real public venue records. Editorial, comparison, subjective
"best/luxury", unsupported filters, duplicate slugs, and thin-result candidates are
held with a reason in the report instead of being mass-published.
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import re
import shutil
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from urllib.parse import quote

from generate_venue_seo import SITE, SITEMAP_NS, esc, focus_market, plain_text, public_venue_rows, venue_profile_url

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "seo" / "SEO_500_PAGE_INVENTORY.csv"
SITEMAP = ROOT / "sitemap.xml"
MIN_MATCHING_VENUES = 3
ET.register_namespace("", SITEMAP_NS)

TYPE_TERMS = {
    "banquet hall": ("banquet", "banquet hall", "banquet halls"),
    "banquet halls": ("banquet", "banquet hall", "banquet halls"),
    "lawn": ("lawn", "garden", "outdoor"),
    "lawns": ("lawn", "garden", "outdoor"),
    "farmhouse": ("farmhouse", "farm house"),
    "farmhouses": ("farmhouse", "farm house"),
    "party hall": ("party hall", "party halls"),
    "party halls": ("party hall", "party halls"),
    "party venue": ("party", "event venue"),
    "party venues": ("party", "event venue"),
    "hotel": ("hotel", "resort"),
    "hotels": ("hotel", "resort"),
    "wedding venue": ("wedding", "banquet", "lawn", "farmhouse", "hotel"),
    "wedding venues": ("wedding", "banquet", "lawn", "farmhouse", "hotel"),
    "engagement venue": ("engagement", "wedding", "banquet"),
    "engagement venues": ("engagement", "wedding", "banquet"),
    "reception venue": ("reception", "wedding", "banquet"),
    "reception venues": ("reception", "wedding", "banquet"),
    "corporate event venue": ("corporate", "conference", "meeting"),
    "corporate event venues": ("corporate", "conference", "meeting"),
}
EVENT_TERMS = {
    "wedding": ("wedding", "marriage", "shaadi"),
    "engagement": ("engagement", "ring ceremony"),
    "reception": ("reception",),
    "birthday": ("birthday",),
    "anniversary": ("anniversary",),
    "mehndi": ("mehndi", "henna"),
    "sangeet": ("sangeet",),
    "baby shower": ("baby shower",),
    "kitty party": ("kitty party",),
    "corporate": ("corporate", "conference", "meeting", "team event"),
}
FEATURES = {
    "parking": ("parking_available", "Parking"),
    "rooms": ("rooms_available", "Guest rooms"),
    "room": ("rooms_available", "Guest rooms"),
    "vegetarian": ("food_veg", "Vegetarian food"),
    "pure veg": ("food_veg", "Vegetarian food"),
    "non-veg": ("food_non_veg", "Non-vegetarian food"),
    "catering": ("catering_available", "Catering"),
    "decoration": ("decoration_available", "Decoration"),
}
SUBJECTIVE_TERMS = ("best ", "top ", "luxury", "premium", "most popular", "highest rated", "affordable")
SITEMAP_NS_TAG = f"{{{SITEMAP_NS}}}urlset"


def norm(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def load_inventory(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return [{k: (v or "").strip() for k, v in row.items()}
                for row in csv.DictReader(handle)]


def venue_text(venue: dict) -> str:
    """Only fields appropriate for category matching; do not infer type from prose."""
    events = venue.get("event_types") or []
    if not isinstance(events, list):
        events = re.split(r"[,|]", str(events))
    return norm(" ".join([str(venue.get("venue_type") or "")] + [str(v) for v in events]))


def market_matches(venue: dict, scope: str) -> bool:
    target = norm(scope)
    market = focus_market(venue)
    if target in ("delhi", "new delhi"):
        return market == "Delhi"
    if target in ("gurgaon", "gurugram"):
        return market == "Gurgaon"
    if target in ("delhi ncr", "ncr", "delhi gurgaon"):
        return market in ("Delhi", "Gurgaon")
    return True


def locality_matches(venue: dict, locality: str) -> bool:
    wanted = norm(locality)
    if not wanted:
        return True
    haystack = norm(f"{venue.get('area') or ''} {venue.get('city') or ''}")
    return bool(wanted and (wanted in haystack or haystack in wanted))


def category_terms(keyword: str) -> tuple[str, ...]:
    k = norm(keyword)
    for phrase, terms in sorted(TYPE_TERMS.items(), key=lambda item: len(item[0]), reverse=True):
        if norm(phrase) in k:
            return terms
    return ()


def event_terms(keyword: str) -> tuple[str, ...]:
    k = norm(keyword)
    for phrase, terms in sorted(EVENT_TERMS.items(), key=lambda item: len(item[0]), reverse=True):
        if norm(phrase) in k:
            return terms
    return ()


def has_event(venue: dict, wanted: tuple[str, ...]) -> bool:
    if not wanted:
        return False
    events = venue.get("event_types") or []
    if not isinstance(events, list):
        events = re.split(r"[,|]", str(events))
    haystack = norm(" ".join(str(x) for x in events) + " " + str(venue.get("venue_type") or ""))
    return any(norm(term) in haystack for term in wanted)


def price_matches(venue: dict, keyword: str) -> bool:
    k = norm(keyword)
    pmin, pmax = venue.get("price_min_per_person"), venue.get("price_max_per_person")
    try:
        pmin = float(pmin) if pmin not in (None, "") else None
        pmax = float(pmax) if pmax not in (None, "") else None
    except (TypeError, ValueError):
        return False
    # Parse currency strings with commas (e.g. ₹1,000–₹1,500) without
    # treating the comma as a separate digit group.
    amounts = [int(value.replace(",", "")) for value in re.findall(r"\d[\d,]*", keyword)]
    if ("under 1000" in k or "below 1000" in k or "under 1 000" in k or "below 1 000" in k):
        return pmax is not None and pmax <= 1000
    if ("under 1500" in k or "below 1500" in k or "under 1 500" in k or "below 1 500" in k):
        return pmax is not None and pmax <= 1500
    if len(amounts) >= 2 and "per person" in k:
        low, high = amounts[0], amounts[1]
        return pmin is not None and pmax is not None and pmin >= low and pmax <= high
    return False


def capacity_matches(venue: dict, keyword: str) -> bool:
    k = norm(keyword)
    try:
        cmin = int(venue.get("capacity_min") or 0)
        cmax = int(venue.get("capacity_max") or 0)
    except (TypeError, ValueError):
        return False
    if "large capacity" in k or "large guest" in k:
        return cmax >= 300
    if "small" in k or "intimate" in k:
        return cmax > 0 and cmax <= 150
    if "under 100" in k:
        return cmax > 0 and cmax <= 100
    if "100 200" in k:
        return cmin >= 100 and cmax <= 200
    if "200 500" in k:
        return cmin >= 200 and cmax <= 500
    return False


def feature_matches(venue: dict, keyword: str) -> bool | None:
    k = norm(keyword)
    for term, (field, _label) in FEATURES.items():
        if norm(term) in k:
            return venue.get(field) is True
    return None


def intent_key(row: dict[str, str]) -> str:
    """Normalize location wording so overlapping city variants can be compared."""
    text = norm(row.get("target_keyword", ""))
    locality = norm(row.get("locality", ""))
    if locality:
        text = re.sub(rf"\b{re.escape(locality)}\b", " ", text)
    for term in ("delhi ncr", "new delhi", "delhi", "gurgaon", "gurugram", "ncr"):
        text = re.sub(rf"\b{re.escape(term)}\b", " ", text)
    words = [word for word in norm(text).split() if word not in {"in", "for", "the", "a", "an", "of", "to"}]
    return " ".join(words)


def matches_candidate(row: dict[str, str], venues: list[dict]) -> tuple[list[dict], str]:
    keyword = row["target_keyword"]
    slug = row["proposed_slug"]
    cluster = row["cluster"]
    if any(term in keyword.lower() for term in SUBJECTIVE_TERMS):
        return [], "held_subjective_claim_requires_independent_evidence"
    if cluster in ("guide_faq", "comparison_intent", "faq_intent"):
        return [], "editorial_content_requires_human_written_distinct_article"
    scope = row.get("city_or_scope", "")
    locality = row.get("locality", "")
    candidates = [v for v in venues if market_matches(v, scope)]
    if locality:
        candidates = [v for v in candidates if locality_matches(v, locality)]
        if not candidates:
            return [], "held_no_public_venue_coverage_for_locality"
    terms = category_terms(keyword)
    if cluster == "core_city_intent" and ("large-capacity" in keyword.lower() or "large capacity" in keyword.lower() or "intimate" in keyword.lower() or "small and intimate" in keyword.lower()):
        candidates = [v for v in candidates if capacity_matches(v, keyword)]
    if cluster == "event_intent":
        events = event_terms(keyword)
        if not events:
            return [], "held_event_intent_not_supported_by_matcher"
        candidates = [v for v in candidates if has_event(v, events)]
        if terms:
            candidates = [v for v in candidates if any(norm(t) in venue_text(v) for t in terms)]
    elif cluster == "budget_capacity_facilities":
        feature = feature_matches(venues[0] if venues else {}, keyword)
        if feature is not None:
            candidates = [v for v in candidates if feature_matches(v, keyword)]
        elif "per person" in keyword.lower() or "under " in keyword.lower() or "below " in keyword.lower():
            candidates = [v for v in candidates if price_matches(v, keyword)]
        elif any(x in keyword.lower() for x in ("capacity", "guests", "intimate", "small")):
            candidates = [v for v in candidates if capacity_matches(v, keyword)]
        else:
            return [], "held_filter_not_supported_by_verified_public_fields"
        if terms:
            candidates = [v for v in candidates if any(norm(t) in venue_text(v) for t in terms)]
    elif terms:
        candidates = [v for v in candidates if any(norm(t) in venue_text(v) for t in terms)]
    else:
        return [], "held_no_safe_page_template_for_intent"
    # Keep a locality page honest: it must be matched on actual area/city above.
    # Deduplicate on public ID and require enough real results to make a useful page.
    unique = {}
    for venue in candidates:
        if venue.get("id"):
            unique[str(venue["id"])] = venue
    result = list(unique.values())
    if len(result) < MIN_MATCHING_VENUES:
        return [], f"held_thin_inventory_{len(result)}_matches_need_{MIN_MATCHING_VENUES}"
    return result, "qualified_data_backed_page"


def title_for(row: dict[str, str]) -> str:
    keyword = row["target_keyword"].strip()
    return keyword[:1].upper() + keyword[1:] + " | Select My Venue"


def description_for(row: dict[str, str], count: int) -> str:
    keyword = row["target_keyword"].strip()
    return (f"Explore {count} publicly listed venue options relevant to {keyword}. "
            "Compare verified listing details, then confirm current availability and final packages directly.")[:158]


def venue_card(venue: dict) -> str:
    name = str(venue.get("venue_name") or "").strip()
    area = str(venue.get("area") or "").strip()
    city = str(venue.get("city") or "").strip()
    market = focus_market(venue)
    location = ", ".join(x for x in (area, city if norm(city) != norm(area) else "") if x)
    location = location or market or "Location shown on profile"
    capacity_min, capacity_max = venue.get("capacity_min"), venue.get("capacity_max")
    capacity = ""
    if capacity_min and capacity_max:
        capacity = f"{capacity_min}–{capacity_max} guests"
    elif capacity_max:
        capacity = f"Up to {capacity_max} guests"
    pmin, pmax = venue.get("price_min_per_person"), venue.get("price_max_per_person")
    price = ""
    if pmin and pmax:
        price = f"₹{pmin}–₹{pmax} per person"
    elif pmin:
        price = f"From ₹{pmin} per person"
    facts = " · ".join(x for x in (capacity, price) if x)
    return (f'<article class="venue-card"><h3>{esc(name)}</h3><p class="muted">{esc(location)}</p>'
            + (f'<p>{esc(facts)}</p>' if facts else "")
            + f'<a href="{esc(venue_profile_url(venue["id"]))}">View venue details →</a></article>')


def content_sections(row: dict[str, str], venues: list[dict]) -> str:
    keyword = row["target_keyword"]
    cluster = row["cluster"]
    locality = row.get("locality") or row.get("city_or_scope") or "your preferred area"
    city = row.get("city_or_scope") or "Delhi NCR"
    price_known = sum(1 for v in venues if v.get("price_min_per_person") is not None or v.get("price_max_per_person") is not None)
    capacity_known = sum(1 for v in venues if v.get("capacity_min") is not None or v.get("capacity_max") is not None)
    parking_known = sum(1 for v in venues if v.get("parking_available") is True)
    rooms_known = sum(1 for v in venues if v.get("rooms_available") is True)
    if cluster == "locality_intent":
        lead = f"""<section class="specific"><h2>Shortlisting venues around {esc(locality)}</h2>
<p>Start with the public listings below that identify this locality in their address fields. Before travelling, ask each venue to confirm the exact entrance address, event-date availability, parking arrangements and guest access. Do not assume a venue is nearby just because it is described as Delhi NCR.</p>
<h3>Local details to verify</h3><ul><li>Actual travel time from your guests’ likely starting points at the event time.</li><li>Entry and exit access for cars, cabs, elderly guests and vendors.</li><li>Parking capacity, setup access and any sound or event-timing restrictions.</li></ul></section>"""
    elif cluster == "event_intent":
        event = next((name.title() for name in EVENT_TERMS if norm(name) in norm(keyword)), "your event")
        event_detail = {
          "Wedding": "Check the ceremony and reception layout, guest flow, stage, food service, setup windows and weather backup.",
          "Engagement": "Confirm a suitable stage or ceremony area, guest seating, food service, photography access and event timing.",
          "Reception": "Check guest arrival flow, stage visibility, dining layout, sound restrictions and the planned event end time.",
          "Birthday": "Ask about age-appropriate space, food arrangements, music limits, decoration rules and setup or cleanup time.",
          "Anniversary": "Compare the space against your guest count, dining format, décor plans, accessibility and event schedule.",
          "Mehndi": "Confirm daytime timing, seating, shade or indoor backup, music rules and space for the planned activities.",
          "Sangeet": "Check stage and dance-floor suitability, sound rules, power backup, guest flow and the venue's permitted end time.",
          "Baby Shower": "Prioritise comfortable seating, accessible washrooms, food arrangements, guest access and a practical indoor option.",
          "Kitty Party": "Confirm the minimum guest commitment, meal or snack package, privacy, parking and duration limits.",
          "Corporate": "Check seating layout, AV or presentation requirements, power, connectivity, catering timings and invoice requirements."
        }.get(event, "Confirm that the layout, facilities and timings suit the exact event format you have planned.")
        lead = f"""<section class="specific"><h2>What to check for {esc(event.lower())}</h2><p>{esc(event_detail)}</p>
<h3>Compare like with like</h3><p>Use the same expected guest count, event duration and service requirements when comparing quotes. The venue profile is a starting point; ask the venue to confirm current facilities and event suitability in writing.</p></section>"""
    elif cluster == "budget_capacity_facilities":
        k = norm(keyword)
        if "per person" in k or "under" in k or "budget" in k:
            detail = f"{price_known} of the {len(venues)} matching public listings show at least one per-person price field. Confirm whether the displayed figure includes venue rental, taxes, décor and other extras; do not treat it as a final event quote."
        elif "capacity" in k or "guests" in k or "intimate" in k or "small" in k:
            detail = f"{capacity_known} of the {len(venues)} matching public listings show at least one capacity field. Ask whether the stated capacity fits your intended seating, dining, stage and circulation layout."
        elif "parking" in k:
            detail = f"{parking_known} matching listings explicitly mark parking as available. Confirm the number of spaces and whether parking is reserved for your event."
        elif "room" in k:
            detail = f"{rooms_known} matching listings explicitly mark guest rooms as available. Confirm room count, occupancy, pricing and booking conditions directly."
        else:
            detail = "Check the exact attribute on each profile and confirm any missing or ambiguous detail directly with the venue."
        lead = f"""<section class="specific"><h2>How to interpret this shortlist</h2><p>{esc(detail)}</p>
<h3>Before you decide</h3><ul><li>Confirm the attribute with the venue for your date and event format.</li><li>Ask for any additional charges and exclusions in writing.</li><li>Keep listings with missing information as unverified rather than assuming they meet the filter.</li></ul></section>"""
    else:
        format_name = "venue format"
        terms = category_terms(keyword)
        if terms:
            format_name = terms[0]
        lead = f"""<section class="specific"><h2>Compare {esc(format_name)} options in {esc(city)}</h2>
<p>Venue labels and packages can differ. Compare each option against your actual guest count, event schedule, location preference and must-have facilities instead of relying on a headline label alone.</p>
<h3>Questions worth asking every venue</h3><ul><li>What exact space and event timing are included in the quote?</li><li>Which capacity, price and facility details are confirmed, and which need a direct enquiry?</li><li>What are the payment, cancellation, vendor-access and overtime terms?</li></ul></section>"""
    coverage = f"""<section class="coverage"><h2>Listing information coverage</h2><p>Among these {len(venues)} matching public listings, {capacity_known} include a capacity field and {price_known} include at least one per-person price field. Missing information is not an indication that a venue lacks a facility; confirm it directly.</p></section>"""
    return lead + coverage


def page_html(row: dict[str, str], venues: list[dict]) -> str:
    slug = row["proposed_slug"]
    url = f"{SITE}/{slug}.html"
    keyword = row["target_keyword"]
    title = title_for(row)
    desc = description_for(row, len(venues))
    locality = row.get("locality") or row.get("city_or_scope") or "your preferred area"
    event = next((name.title() for name in EVENT_TERMS if norm(name) in norm(keyword)), "your event")
    cards = "\n".join(venue_card(v) for v in venues[:24])
    unique_sections = content_sections(row, venues)
    scope = norm(row.get("city_or_scope") or "")
    related_links = [
        ("Wedding venue budget checklist", "wedding-venue-budget-delhi-ncr.html"),
        ("Wedding venue site-visit checklist", "wedding-venue-site-visit-delhi-ncr.html"),
        ("Questions to ask before booking", "wedding-venue-booking-questions-delhi-ncr.html"),
        ("How to shortlist wedding venues", "how-to-shortlist-wedding-venues-delhi-ncr.html"),
    ]
    if scope in ("delhi", "new delhi"):
        related_links.extend([("Wedding venues in Delhi", "wedding-venues-in-delhi.html"), ("Venues in Delhi", "venues-in-delhi.html")])
    elif scope in ("gurgaon", "gurugram"):
        related_links.extend([("Wedding venues in Gurgaon", "wedding-venues-in-gurgaon.html"), ("Venues in Gurgaon", "venues-in-gurgaon.html")])
    elif scope in ("delhi ncr", "ncr"):
        related_links.append(("Wedding venues in Delhi NCR", "wedding-venues-delhi-ncr.html"))
    related_html = "\n".join(f'<li><a href="{esc(path)}">{esc(label)}</a></li>' for label, path in related_links)
    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "url": url,
        "description": desc,
        "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": len(venues),
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1,
                 "url": venue_profile_url(v["id"]), "name": str(v.get("venue_name") or "").strip()}
                for i, v in enumerate(venues[:24])
            ],
        },
    }
    # The body is specific to this candidate and the actual matching inventory.
    body = f"""<main class="organic-page">
<nav class="crumb"><a href="/">Home</a> › <a href="seo-searches.html">Venue search</a> › {esc(keyword)}</nav>
<header class="intro"><p class="eyebrow">SELECT MY VENUE · VENUE DISCOVERY</p>
<h1>{esc(keyword.title())}</h1>
<p>Explore {len(venues)} public venue listings relevant to this search. Compare the information currently shown on each profile, then confirm the event date, exact package, capacity, facilities and terms with the venue before making a decision.</p>
<div class="facts"><span>{len(venues)} matching public listings</span><span>Showing up to {min(len(venues), 24)} listings below</span><span>Direct profile details</span></div></header>
{unique_sections}
<section><h2>Venue options to review</h2><p>Use these listings as a starting shortlist, not as a guarantee of date availability or final price. Details may change; ask each venue for written confirmation of anything important to your event.</p>
<div class="venue-grid">{cards}</div></section>
<section class="checklist"><h2>How to compare these options</h2><ol>
<li>Confirm the event date and the exact space available for your guest count.</li>
<li>Request an itemised quote, including food, venue rental, applicable taxes, décor, power, parking and any additional charges.</li>
<li>Check guest movement, accessibility, facilities, setup and teardown times, and outside-vendor rules.</li>
<li>Read payment milestones, cancellation and rescheduling terms before paying an advance.</li>
<li>Visit the strongest matches and get important promises in writing.</li>
</ol></section>
<section class="related"><h2>Plan your venue shortlist</h2><ul>
{related_html}
<li><a href="venues.html">Browse all public venues</a></li>
</ul></section>
<section class="enquiry" id="enquiry"><h2>Need help finding a suitable venue?</h2><p>Share your event requirements. A submitted enquiry is not a booking or a confirmation of venue availability.</p>
<form class="quick-enquiry-form" data-smv-quick-enquiry data-event-type="{esc(event)}" data-source="SEO - Organic - {esc(title[:80])}">
<div class="field"><label>Your name *</label><input name="customer_name" autocomplete="name" required></div>
<div class="field"><label>Mobile number *</label><input name="mobile" inputmode="numeric" autocomplete="tel" maxlength="14" required></div>
<div class="field"><label>Event type *</label><select name="occasion" required><option value="">Select event</option><option>Wedding</option><option>Engagement</option><option>Reception</option><option>Birthday</option><option>Anniversary</option><option>Kitty Party</option><option>Private Party</option><option>Corporate Event</option><option>Other Event</option></select></div>
<div class="field"><label>Preferred location *</label><input name="location" value="{esc(locality if locality not in ('Delhi NCR', 'NCR') else '')}" required></div>
<div class="field"><label>Event date *</label><input name="event_date" type="date" required></div>
<div class="field"><label>Guests</label><input name="guests" type="number" min="1"></div>
<div class="field"><label>Budget per person (₹)</label><input name="budget_per_person" type="number" min="0"></div>
<div class="field full"><label>Preferences (optional)</label><input name="requirements" maxlength="500" placeholder="Facilities, food, format or other priorities"></div>
<div class="field full"><button type="submit">Submit venue enquiry →</button></div><p data-quick-message aria-live="polite"></p>
</form></section>
</main>"""
    return f"""<!doctype html>
<html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="{esc(url)}"><link rel="alternate" hreflang="en-IN" href="{esc(url)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Select My Venue">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{esc(url)}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.png" type="image/png"><link rel="stylesheet" href="public-pages.css">
<link rel="stylesheet" href="public-readability.css?v=20260922-1"><link rel="stylesheet" href="website-mobile-app-20261002.css?v=20261002-app-v1">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False).replace("</", "<\\/")}</script>
<style>
.organic-page{{max-width:1120px;margin:auto;padding:18px 18px 44px;color:#203d36}}
.crumb{{font-size:13px;color:#64756e;margin:8px 0 18px}}.intro{{background:#f0f5f0;border-radius:18px;padding:clamp(20px,4vw,42px);margin-bottom:28px}}
.eyebrow{{font-size:12px;letter-spacing:.12em;font-weight:800;color:#0d7567}}h1{{font-size:clamp(28px,5vw,46px);line-height:1.15;margin:8px 0 14px}}h2{{font-size:clamp(21px,3vw,28px);margin:0 0 12px}}
.facts{{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}}.facts span{{background:#fff;border:1px solid #dce8df;border-radius:99px;padding:7px 12px;font-size:13px}}
section{{margin:30px 0}}.venue-grid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}}
.venue-card{{background:white;border:1px solid #e0e8e2;border-radius:14px;padding:18px;min-width:0;overflow-wrap:anywhere}}
.venue-card h3{{font-size:18px;margin:0 0 5px}}.venue-card p{{margin:6px 0}}.muted{{color:#5d716a;font-size:14px}}.venue-card a,.related a{{color:#075047;font-weight:750}}
.checklist,.related,.enquiry{{padding:clamp(18px,3vw,30px);border-radius:16px;background:#f6f8f5}}.checklist li{{margin:8px 0}}.related li{{margin:8px 0}}
.quick-enquiry-form{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}.field{{display:flex;flex-direction:column;gap:5px;min-width:0}}.field.full{{grid-column:1/-1}}
.field label{{font-size:13px;font-weight:750}}.field input,.field select{{width:100%;min-height:46px;border:1px solid #cbd8d0;border-radius:9px;padding:10px;font:inherit;background:#fff}}
.field button{{min-height:48px;border:0;border-radius:10px;background:#075047;color:white;font:inherit;font-weight:800;padding:12px 18px;cursor:pointer}}
@media(max-width:700px){{.venue-grid{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
@media(max-width:480px){{.venue-grid,.quick-enquiry-form{{grid-template-columns:1fr}}.field.full{{grid-column:auto}}.venue-card{{padding:14px}}}}
</style></head><body>
<header class="site-header"><div class="header-inner"><a href="/#home" class="brand" aria-label="Select My Venue Home"><img src="logo.png" alt="Select My Venue" class="main-logo"></a><button class="menu-toggle" id="menuToggle" type="button" aria-label="Open navigation" aria-expanded="false">☰</button><nav id="mainNav"><a href="/#home">Home</a><a href="venues.html">Browse Venues</a><a href="wedding-venues-delhi-ncr.html">Wedding Venues</a><a href="list-your-venue.html">List Your Venue</a></nav></div></header>
{body}
<footer class="page-footer">© 2026 Select My Venue · <a href="/">Home</a> · <a href="venues.html">Browse Venues</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></footer>
<script src="public-header.js?v=20260922-1"></script><script src="quick-enquiry.js?v=20261018-desktop-drawer-fix-4"></script><script src="website-mobile-app-20261002.js?v=20261002-app-v1"></script>
</body></html>"""


def write_sitemap(output: Path, rows: list[dict[str, str]]) -> None:
    root = ET.Element(SITEMAP_NS_TAG)
    for row in rows:
        item = ET.SubElement(root, f"{{{SITEMAP_NS}}}url")
        ET.SubElement(item, f"{{{SITEMAP_NS}}}loc").text = f"{SITE}/{row['proposed_slug']}.html"
    ET.ElementTree(root).write(output / "sitemap-qualified-candidates.xml", encoding="utf-8", xml_declaration=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", type=Path, default=INVENTORY)
    parser.add_argument("--site-root", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path, default=Path("/tmp/smv-seo-generated-organic-pages"))
    parser.add_argument("--minimum-matches", type=int, default=MIN_MATCHING_VENUES)
    args = parser.parse_args()
    if args.minimum_matches < 3:
        parser.error("--minimum-matches cannot be less than 3; avoid thin pages.")
    inventory = load_inventory(args.inventory)
    if len(inventory) != 500:
        raise RuntimeError(f"Expected 500 inventory candidates, found {len(inventory)}; refusing to build an incomplete review artifact.")
    candidate_slugs = [row.get("proposed_slug", "") for row in inventory]
    if len(candidate_slugs) != len(set(candidate_slugs)) or any(not slug for slug in candidate_slugs):
        raise RuntimeError("Candidate inventory has missing or duplicate slugs; refusing to generate ambiguous URLs.")
    venues = [v for v in public_venue_rows() if focus_market(v)]
    if not venues:
        raise RuntimeError("No public Delhi/Gurgaon venues returned; refusing to create candidate pages.")
    if not args.site_root.is_dir():
        raise RuntimeError(f"Site root not found: {args.site_root}")
    existing = {p.stem for p in args.site_root.glob("*.html") if p.is_file()}
    output = args.output.resolve()
    if output == args.site_root.resolve() or args.site_root.resolve() in output.parents:
        # The artifact directory must not be the site root or a directory within it:
        # it is review output, not publishable site content.
        raise RuntimeError("Review output must be outside the website root; refusing to write into the site.")
    if output.exists():
        raise RuntimeError(f"Review output already exists; inspect or remove it explicitly before regenerating: {output}")
    output.mkdir(parents=True, exist_ok=False)
    report_rows: list[dict[str, str]] = []
    sitemap_rows: list[dict[str, str]] = []
    generated_signatures: list[dict] = []
    for row in inventory:
        slug = row["proposed_slug"]
        if slug in existing:
            report_rows.append({**row, "build_status": "reuse_existing_page", "matching_venues": "", "reason": "existing_root_html_slug"})
            continue
        if any(term in row["target_keyword"].lower() for term in SUBJECTIVE_TERMS):
            report_rows.append({**row, "build_status": "held_for_evidence", "matching_venues": "", "reason": "subjective_claim_requires_independent_evidence"})
            continue
        # Pass the configured threshold into matching via a local filter below.
        matches, reason = matches_candidate(row, venues)
        if matches and len(matches) < args.minimum_matches:
            matches, reason = [], f"held_thin_inventory_{len(matches)}_matches_need_{args.minimum_matches}"
        if not matches:
            count_match = re.search(r"held_thin_inventory_(\d+)_matches", reason)
            actual_count = count_match.group(1) if count_match else "0"
            report_rows.append({**row, "build_status": "not_generated", "matching_venues": actual_count, "reason": reason})
            continue
        current_ids = {str(v["id"]) for v in matches if v.get("id")}
        key = intent_key(row)
        duplicate_of = None
        for prior in generated_signatures:
            if prior["cluster"] != row["cluster"] or not key or prior["intent_key"] != key:
                continue
            smaller = min(len(current_ids), len(prior["venue_ids"]))
            overlap = len(current_ids & prior["venue_ids"]) / smaller if smaller else 0
            if overlap >= 0.9:
                duplicate_of = prior["slug"]
                break
        if duplicate_of:
            report_rows.append({**row, "build_status": "held_near_duplicate", "matching_venues": str(len(matches)), "reason": f"overlaps_{duplicate_of}_with_same_normalized_intent"})
            continue
        destination = output / f"{slug}.html"
        destination.write_text(page_html(row, matches), encoding="utf-8")
        generated_signatures.append({"cluster": row["cluster"], "intent_key": key, "venue_ids": current_ids, "slug": slug})
        report_rows.append({**row, "build_status": "generated_for_review", "matching_venues": str(len(matches)), "reason": reason})
        sitemap_rows.append(row)
    report_path = output / "SEO_500_PAGE_BUILD_REPORT.csv"
    columns = list(inventory[0].keys()) + ["build_status", "matching_venues", "reason"]
    with report_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(report_rows)
    write_sitemap(output, sitemap_rows)
    counts = Counter(row["build_status"] for row in report_rows)
    print(f"Inventory candidates reviewed: {len(inventory)}")
    print(f"Public Delhi/Gurgaon venue records available: {len(venues)}")
    for status, count in sorted(counts.items()):
        print(f"{status}: {count}")
    print(f"Review-only HTML pages created: {len(sitemap_rows)}")
    print(f"Artifact directory: {output}")
    print("Nothing was added to the live sitemap or website root. Human review and release approval remain required.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
