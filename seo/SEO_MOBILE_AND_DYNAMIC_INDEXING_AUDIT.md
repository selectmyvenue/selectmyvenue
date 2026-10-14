# SEO and mobile UX audit — Select My Venue

Date: 2026-10-15
Branch: seo/technical-foundation-audit
Scope: source inspection only. No production changes.

## Repository facts verified

- Static HTML/CSS/JavaScript site with multiple category/location landing pages.
- No root package.json was found; no established root build/test command is available.
- Homepage already includes title, description, canonical, social metadata, and WebSite/Organization/Service JSON-LD.
- robots.txt references sitemap.xml. Most sitemap lastmod dates are static and should be updated only when content genuinely changes.
- venues.js fetches public venue records in the browser and renders cards after JavaScript runs. A visible card does not itself guarantee a dedicated crawlable venue URL with unique HTML metadata.
- script.js initializes Supabase and handles the current AI planner/customer enquiry flow. Keep this protected.
- venues.html includes directory filters and enquiry UI; mobile touch, keyboard and layout behaviour need real device/browser tests before CSS edits.
- Many versioned stylesheets and inline CSS exist. Avoid broad overrides that could break mobile.

## Automatic SEO when a new venue is added

A new Supabase row alone does not create a dedicated Google-searchable page. A robust approach is:

1. Give every approved public venue a stable unique URL, for example /venue/venue-name.
2. Serve or pre-render crawlable HTML with unique title, description, canonical, useful venue details and descriptive image alt text.
3. Populate pages only from approved public fields. Never publish private partner/customer data or unverified prices, amenities, awards, reviews or availability.
4. Add only approved, complete, canonical, indexable venue URLs to a generated sitemap. Exclude pending, hidden, rejected and private listings.
5. Add internal links from relevant category/location pages.
6. Update sitemap through a controlled build/workflow when a public venue is approved, edited or removed. Confirm the hosting/deployment setup before enabling automation.
7. Submit sitemap in Google Search Console. Submission supports discovery; it does not guarantee indexing or ranking.

The current browser-rendered venue directory alone cannot guarantee this workflow. The hosting/rendering approach and whether each public venue has a stable slug must be verified before implementation. Do not expose private Supabase tables or credentials.

## Mobile UX acceptance checklist

- One obvious primary action: find a venue or submit an enquiry.
- Readable body text, clear labels and visible CTA; no clipped submit buttons or horizontal overflow.
- Touch targets around 44 x 44 CSS pixels where practical.
- Filters easy to open/close, with result count visible.
- Venue cards show only verified name, location, capacity, price and facilities.
- Mobile-friendly input types, inline validation and clear success/error states.
- Popups should not interrupt too early; keyboard must not cover the submit button.
- Keyboard navigation, focus indicators, semantic headings, sufficient contrast and form labels.
- Test widths 320, 360, 390 and 430 CSS pixels, plus tablet/desktop.
- Check menu, scrolling, image stability and form state after validation errors.

## SEO implementation order

### P0 — baseline
- Inventory HTML files and compare URLs with sitemap.
- Verify sitemap URLs, status codes, canonicals and indexability.
- Check duplicate/missing titles and descriptions, broken internal links, image alt text and JSON-LD syntax.
- Inspect Search Console and analytics if access is available; source code alone cannot establish organic performance.

### P1 — existing landing pages
- Improve pages only when they serve distinct intent and contain useful, accurate venue information.
- Keep one clear H1, unique title/description, correct canonical, contextual internal links and a simple enquiry path.
- Avoid mass-producing near-duplicate pages that only swap place names.
- Keep sitemap lastmod truthful and include only canonical indexable URLs.

### P2 — individual venue pages
- Confirm stable slug and rendering architecture.
- Generate page metadata/schema from approved public venue fields.
- Generate sitemap from approved, public, canonical, indexable venue pages.
- Verify HTML source, canonical, noindex rules, internal links and image alt text.
- Google makes its own crawl, index and ranking decisions.

### P3 — leads and measurement
- Preserve current customer enquiry handler, customer_enquiries table and payload.
- Track landing page, venue detail views and successful enquiries using existing analytics where configured.
- Add source attribution only after reviewing schema and CRM dependencies; no schema change is approved.
- Review Search Console impressions/clicks, organic enquiries and qualified leads monthly.

## Branch implementation updates (2026-10-15)

- `venue-profile.js` now keeps Twitter title/description/image aligned with the venue-specific Open Graph metadata.
- If a venue ID is invalid or the public venue RPC cannot find a public profile, the profile page switches to `noindex,follow` so empty/error states are not intentionally offered for indexing.
- Added `seo/generate_venue_sitemap.py`, a standard-library-only generator that accepts a JSON export of the public venues RPC and outputs unique sitemap URL entries only for approved, verified, publicly enabled venues with valid UUIDs and names. It does not connect to Supabase, edit the main sitemap, or deploy.

The generator is a safe building block, not yet an automatic approval trigger. The repository is a static site and currently has no verified venue-approval-to-deployment workflow. To complete automatic updates, a controlled workflow must be configured with an approved public-data source and deployment permissions; this should be reviewed before enabling it.

## Not yet verified

Live HTTP status, Core Web Vitals, mobile screenshots, Search Console, analytics accuracy, deployment workflow, successful enquiry-to-CRM round trip and public venue slug completeness. These require separate runtime/account checks and controlled tests. No claim of automated Google indexing or production lead growth should be made until verified.
