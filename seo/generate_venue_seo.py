#!/usr/bin/env python3
"""Generate static, crawlable pages for public Select My Venue listings.

Read-only with respect to Supabase. Requires SUPABASE_URL and SUPABASE_ANON_KEY.
Writes only the generated output directory and sitemap path supplied by the caller.
It intentionally uses the existing public RPC; it does not query private tables or
change database schema, approval state, enquiry submission, or CRM behaviour.
"""
from __future__ import annotations

import html
import json
import os
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import quote

SITE = "https://selectmyvenue.com"
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", SITEMAP_NS)


def esc(value: object) -> str:
    return html.escape(str(value or "").strip(), quote=True)


def slugify(value: object) -> str:
    value = str(value or "").lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:70].strip("-") or "venue"


def is_public(venue: dict) -> bool:
    # smv_public_venues is the existing public-facing RPC used by the live
    # venue directory/profile. It returns a public projection and intentionally
    # omits internal approval/verification columns. Treat presence in that RPC
    # as the public-visibility gate, then fail closed on identity and location.
    # Do not infer or fabricate locality for location-intent SEO pages.
    return (
        bool(str(venue.get("venue_name") or "").strip())
        and bool(str(venue.get("area") or venue.get("city") or "").strip())
    )

def focus_market(venue: dict) -> str | None:
    """Return the current SEO focus market only when the listing location supports it.

    Prioritize Delhi and Gurgaon/Gurugram. A specific non-target city (for example,
    Noida or Faridabad) must not be reclassified as Delhi just because its area says
    'Delhi NCR'. Generic NCR-only records are excluded until their actual city/area
    can identify a target market.
    """
    city = re.sub(r"[^a-z0-9]+", " ", str(venue.get("city") or "").lower()).strip()
    area = re.sub(r"[^a-z0-9]+", " ", str(venue.get("area") or "").lower()).strip()

    if re.search(r"\b(gurgaon|gurugram)\b", city):
        return "Gurgaon"
    if "delhi" in city and not re.search(r"\b(ncr|national capital region)\b", city):
        return "Delhi"

    # Do not override a specific non-target city using a broad area label.
    non_target_city = re.search(r"\b(noida|greater noida|faridabad|ghaziabad)\b", city)
    if non_target_city:
        return None
    if re.search(r"\b(gurgaon|gurugram)\b", area):
        return "Gurgaon"
    if re.search(r"\b(delhi|new delhi|south delhi|north delhi|east delhi|west delhi)\b", area):
        return "Delhi"
    return None


def venue_from_row(row: object) -> dict | None:
    if not isinstance(row, dict):
        return None
    nested = row.get("venue")
    return nested if isinstance(nested, dict) else row


def public_venue_rows() -> list[dict]:
    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not base or not key:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_ANON_KEY before running.")
    endpoint = base + "/rest/v1/rpc/smv_public_venues"
    request = urllib.request.Request(
        endpoint,
        data=b"{}",
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Public venue RPC failed; no output was updated: {exc}") from exc
    if not isinstance(payload, list):
        raise RuntimeError("Public venue RPC returned an unexpected format; refusing to publish.")
    rows = [venue_from_row(item) for item in payload]
    eligible = [v for v in rows if v and v.get("id") and is_public(v)]
    # Emit privacy-safe diagnostics when the RPC returns rows but none qualify.
    # Do not log names, IDs, contact details, prices, or raw venue records.
    if not eligible:
        valid_rows = [v for v in rows if isinstance(v, dict)]
        print(f"Public venue RPC returned {len(payload)} row(s); {len(valid_rows)} row(s) were objects.", file=sys.stderr)
        if valid_rows:
            print("Returned field names: " + ", ".join(sorted({key for row in valid_rows[:10] for key in row.keys()})), file=sys.stderr)
            for field in ("venue_status", "verification_status", "public_listing_enabled"):
                values = sorted({str(row.get(field)) for row in valid_rows if row.get(field) is not None})
                print(f"Observed {field} values: " + (", ".join(values[:10]) if values else "(field missing or null)"), file=sys.stderr)
            location_rows = sum(bool(str(row.get("area") or row.get("city") or "").strip()) for row in valid_rows)
            print(f"Rows with area/city: {location_rows}/{len(valid_rows)}", file=sys.stderr)
    # An unsafe or incomplete response must not silently overwrite generated pages.
    for venue in eligible:
        if not str(venue.get("venue_name") or "").strip():
            raise RuntimeError("Public venue RPC included an eligible row without a venue name; refusing to publish.")
    return eligible


def venue_page(venue: dict, url: str) -> str:
    name = str(venue.get("venue_name") or "Verified Venue").strip()
    area = str(venue.get("area") or "").strip()
    city = str(venue.get("city") or "").strip()
    location = ", ".join(dict.fromkeys(part for part in (area, city) if part))
    display_location = location or "Location details on request"
    venue_type = str(venue.get("venue_type") or "Wedding and event venue").strip()
    description = str(venue.get("description") or "").strip()
    if len(description) < 40:
        if location:
            description = f"Explore {name} in {location}. Check venue capacity, facilities, pricing and event suitability with Select My Venue."
        else:
            description = f"Explore {name} on Select My Venue. Confirm its location, capacity, facilities, pricing and event suitability with our team."
    description = description[:280]
    # Never invent a specific city when the approved listing omits it.
    address_locality = city or area or None
    address_region = str(venue.get("state") or "").strip() or None
    address_postal_code = str(venue.get("pincode") or "").strip() or None
    cover = str(venue.get("cover_image_url") or "").strip()
    if not cover.startswith(("https://", "http://")):
        cover = ""
    capacity_min = venue.get("capacity_min")
    capacity_max = venue.get("capacity_max")
    capacity = (f"{capacity_min}–{capacity_max} guests" if capacity_min and capacity_max
                else f"Up to {capacity_max} guests" if capacity_max
                else f"{capacity_min}+ guests" if capacity_min else "Confirm with venue")
    pmin, pmax = venue.get("price_min_per_person"), venue.get("price_max_per_person")
    price = (f"₹{pmin}–₹{pmax} per person" if pmin and pmax
             else f"From ₹{pmin} per person" if pmin else "Price on request")
    features = []
    for field, label in (
        ("food_veg", "Vegetarian food"), ("food_non_veg", "Non-vegetarian food"),
        ("parking_available", "Parking"), ("rooms_available", "Guest rooms"),
        ("catering_available", "Catering"), ("decoration_available", "Decoration"),
    ):
        if venue.get(field) is True:
            features.append(label)
    events = venue.get("event_types") or []
    if not isinstance(events, list):
        events = [x.strip() for x in re.split(r"[,|]", str(events)) if x.strip()]
    events = [str(x).strip() for x in events if str(x).strip()][:12]
    # Open the existing quote modal immediately so SEO traffic can enquire without extra navigation.
    profile = SITE + "/venue.html?id=" + quote(str(venue["id"]), safe="") + "&quote=1"
    title = f"{name} in {location} | Select My Venue" if location else f"{name} | Select My Venue"
    image_tag = f'<img src="{esc(cover)}" alt="{esc(name)} venue" loading="eager" width="1200" height="800">' if cover else ""
    features_html = "".join(f"<li>{esc(item)}</li>" for item in features) or "<li>Ask our team to confirm facilities</li>"
    events_html = ", ".join(events) if events else "Weddings and private events (confirm suitability)"
    schema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": name,
        "description": description,
        "url": url,
        "image": cover or None,
        "address": {"@type": "PostalAddress", **({"addressLocality": address_locality} if address_locality else {}), **({"addressRegion": address_region} if address_region else {}), **({"postalCode": address_postal_code} if address_postal_code else {}), "addressCountry": "IN"},
        "additionalType": venue_type,
    }
    schema = {k: v for k, v in schema.items() if v is not None}
    return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{esc(url)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Select My Venue">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{esc(url)}">{f'<meta property="og:image" content="{esc(cover)}">' if cover else ''}
<meta name="theme-color" content="#073b35">
<script>
(function(){{try{{
  var key="smv-traffic-attribution-v1";
  var saved=JSON.parse(sessionStorage.getItem(key)||"{{}}")||{{}};
  var params=new URLSearchParams(location.search);
  ["gclid","gbraid","wbraid","utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(function(name){{
    var value=(params.get(name)||"").trim();if(value)saved[name]=value.slice(0,500);
  }});
  if(!saved.landing_page)saved.landing_page=location.href.slice(0,1000);
  if(!saved.first_referrer&&document.referrer)saved.first_referrer=document.referrer.slice(0,1000);
  saved.last_page=location.href.slice(0,1000);
  sessionStorage.setItem(key,JSON.stringify(saved));
}}catch(_){{}} }})();
</script>
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False).replace("</", "<\\/")}</script>
<style>
:root{{color-scheme:light;--ink:#173c35;--teal:#075047;--gold:#d7b75d;--paper:#f6f7f4}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:#233b36;font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}}
header{{background:#073b35;color:white;padding:14px max(18px,calc((100% - 1080px)/2));display:flex;align-items:center;justify-content:space-between;gap:14px}}
header a{{color:white;text-decoration:none;font-weight:750}}main{{width:min(1080px,calc(100% - 32px));margin:26px auto 50px}}
nav{{font-size:14px}}.crumb{{font-size:13px;color:#56706a;margin-bottom:16px}}.card{{background:white;border:1px solid #e1e9e4;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px #123a3010}}
.hero{{background:#e6efea;min-height:120px}}.hero img{{display:block;width:100%;max-height:480px;object-fit:cover}}.body{{padding:clamp(20px,4vw,42px)}}.eyebrow{{color:#0d7567;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}}
h1{{font-size:clamp(28px,5vw,46px);line-height:1.13;letter-spacing:-.03em;margin:8px 0}}h2{{font-size:22px;line-height:1.25}}.location{{color:#526b64;font-weight:600}}.facts{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:24px 0}}.fact{{background:#f1f6f2;border-radius:12px;padding:14px}}.fact span{{display:block;color:#5d756d;font-size:12px;font-weight:700}}.fact strong{{display:block;margin-top:5px;color:#183f36;font-size:16px}}.cta{{display:inline-flex;min-height:48px;align-items:center;justify-content:center;padding:12px 18px;background:var(--teal);border-radius:10px;color:white;text-decoration:none;font-weight:800}}.secondary{{display:inline-flex;min-height:48px;align-items:center;padding:10px 16px;color:var(--teal);font-weight:750}}.features{{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}}.features li{{background:#eff6f1;border:1px solid #dce9e0;border-radius:99px;padding:7px 12px;font-size:14px}}.note{{font-size:13px;color:#62756e;margin-top:18px}}footer{{text-align:center;padding:22px;color:#5a7068;font-size:13px}}@media(max-width:620px){{header{{align-items:flex-start;flex-direction:column}}main{{margin-top:16px}}.facts{{grid-template-columns:1fr}}.body{{padding:20px}}.cta,.secondary{{width:100%;margin:4px 0}}}}
</style></head><body>
<header><a href="{SITE}/">Select My Venue</a><nav><a href="{SITE}/venues.html">Browse venues</a></nav></header>
<main><div class="crumb"><a href="{SITE}/">Home</a> › <a href="{SITE}/venues.html">Verified venues</a> › {esc(name)}</div>
<article class="card"><div class="hero">{image_tag}</div><div class="body">
<p class="eyebrow">Venue profile</p><h1>{esc(name)}</h1><p class="location">⌖ {esc(display_location)} · {esc(venue_type)}</p>
<p>{esc(description)}</p><div class="facts"><div class="fact"><span>CAPACITY</span><strong>{esc(capacity)}</strong></div><div class="fact"><span>PRICE GUIDE</span><strong>{esc(price)}</strong></div><div class="fact"><span>EVENTS</span><strong>{esc(events_html)}</strong></div></div>
<h2>Facilities &amp; services</h2><ul class="features">{features_html}</ul>
<p>Venue details and availability can change. Contact Select My Venue to confirm current packages, date availability and final pricing directly with the venue.</p>
<a class="cta" href="{esc(profile)}">Check price &amp; availability</a> <a class="secondary" href="{SITE}/venues.html">Compare other venues</a>
<p class="note">Published on Select My Venue from publicly available listing details. Information is shown for discovery; availability and final terms require confirmation.</p>
</div></article></main><footer>© Select My Venue · <a href="{SITE}/privacy.html">Privacy</a> · <a href="{SITE}/terms.html">Terms</a></footer></body></html>"""


def main() -> int:
    root = Path(os.environ.get("SEO_SITE_ROOT", ".")).resolve()
    output = root / "venue-pages"
    sitemap_path = root / "sitemap.xml"
    public_rows = public_venue_rows()
    rows = [venue for venue in public_rows if focus_market(venue)]
    if not rows:
        raise RuntimeError("No eligible public Delhi/Gurgaon venues returned; refusing to update generated pages or sitemap.")
    if not sitemap_path.exists():
        raise RuntimeError("sitemap.xml is missing; refusing to write generated pages.")
    # Parse the sitemap before writing anything so a malformed/missing sitemap
    # cannot leave a partial generated-page output behind.
    tree = ET.parse(sitemap_path)
    root_xml = tree.getroot()
    if root_xml.tag != f"{{{SITEMAP_NS}}}urlset":
        raise RuntimeError("sitemap.xml is not a standard sitemap urlset; refusing to publish.")
    output.mkdir(parents=True, exist_ok=True)
    new_urls = set()
    for venue in rows:
        name = str(venue.get("venue_name") or "venue")
        # ID suffix prevents collisions and keeps URLs stable when names match.
        suffix = re.sub(r"[^a-zA-Z0-9]", "", str(venue["id"]))[:8].lower()
        slug = f"{slugify(name)}-{suffix}"
        target = output / slug / "index.html"
        url = f"{SITE}/venue-pages/{slug}/"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(venue_page(venue, url), encoding="utf-8")
        new_urls.add(url)
    loc_tag = f"{{{SITEMAP_NS}}}loc"
    lastmod_tag = f"{{{SITEMAP_NS}}}lastmod"
    for item in list(root_xml):
        loc = item.find(loc_tag)
        if loc is not None and "/venue-pages/" in (loc.text or ""):
            root_xml.remove(item)
    for url in sorted(new_urls):
        node = ET.SubElement(root_xml, f"{{{SITEMAP_NS}}}url")
        ET.SubElement(node, loc_tag).text = url
    tree.write(sitemap_path, encoding="utf-8", xml_declaration=True)
    print(f"Generated {len(rows)} approved, verified public venue pages.")
    print(f"Updated {sitemap_path} with {len(new_urls)} venue URLs.")
    print("No Supabase records or existing customer enquiry/CRM code were changed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
