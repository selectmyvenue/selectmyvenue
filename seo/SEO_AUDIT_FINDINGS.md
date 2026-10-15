# Select My Venue SEO Audit Findings (Draft)

**Review date:** 2026-10-15  
**Scope:** Static source review and public competitor-page spot checks. This is not a claim that every Indian venue website has been audited.

## Confirmed static checks

- GitHub Actions ran `python seo/audit_static_seo.py` against the PR merge checkout.
- Result: 38 HTML files checked, 37 sitemap URLs, 0 errors, 0 warnings.
- `robots.txt` allows crawling and declares `https://selectmyvenue.com/sitemap.xml`.
- The static landing pages sampled have title, meta description, canonical URL, one H1, and image alt attributes.
- The static audit intentionally does not certify live HTTP status, mobile rendering, dynamic JavaScript rendering, Search Console indexing, or Google's structured-data eligibility.
- `venue.html` is a dynamic template: `venue-profile.js` changes its title, description, canonical, Open Graph data, and EventVenue structured data at runtime. Validate a real venue URL with a valid ID in Google's live URL test before deciding how profile URLs should be indexed.

## Technical follow-up priorities

1. **Search Console evidence (blocking for real indexing/performance conclusions):** inspect Page indexing, Sitemaps, URL Inspection, Search results queries/pages, and Core Web Vitals. The code audit cannot reveal Google's actual indexed URL count, impressions, clicks, queries, or organic lead share.
2. **Rendered/mobile checks:** run Google URL Inspection or Rich Results Test on homepage, a location page, a high-intent page, list-your-venue, and a real dynamic venue profile. Confirm fetch succeeds, canonical matches the intended URL, rendered H1/content is present, and primary resources/forms work on mobile.
3. **Structured data:** static JSON-LD syntax is only a first check. Validate rendered output with Google's Rich Results Test and ensure each property matches visible content. Do not add fake ratings/reviews or schema unsupported by the page.
4. **Internal links:** review crawlable anchor hrefs and page-to-page discovery with a real crawler. Ensure core location/event pages and the venue-owner page can be reached through normal links, not only JavaScript interactions.
5. **Metadata/content quality:** the static audit checks presence and basic consistency, not search intent, uniqueness, title length, description quality, thin/duplicated copy, or whether pages provide real local value. Review titles and unique content page-by-page before editing.
6. **Sitemap freshness:** update `lastmod` only when the page's content, links, or structured data has materially changed; do not touch dates just to signal activity.

## Competitor page-template observations (public spot checks)

- **WeddingWire India:** city/region and category discovery, venue counts, photos, prices, guest capacity, promotions, reviews, and request-pricing actions.
- **WedMeGood:** popular locality/category paths, budget planning, venue listings, inspiration/editorial, and vendor contact routes.
- **Weddingz:** vendor/venue discovery plus a clear distinction between non-partner listings and premium partner services.
- **VenueLook and Mandap:** venue discovery by event, location, budget/capacity, and practical facilities.
- These are public-page observations, not a complete technical backlink, traffic, schema, or crawl audit of all competitors.

## SMV priorities based on those observations

- **Customer SEO:** make each target landing page materially useful and distinct: local areas, realistic budget ranges, guest capacity, indoor/outdoor venue type, facilities, questions to ask, and a clear short enquiry path. Only state facts SMV can verify.
- **Venue-owner acquisition:** strengthen `list-your-venue.html` around benefits, how leads work, verification/onboarding steps, trial/plan terms, and a simple contact/application CTA. Make claims about lead volume only if backed by data.
- **Lead quality:** measure source and landing page alongside qualified/contacted leads, site visits, venue matches, and bookings. Form count alone is not success; don't create test leads in production.
- **AI-assisted SEO:** use AI for research, drafting, clustering, and monitoring with human review and venue-specific facts. Do not mass-publish repetitive city/keyword pages.

## Safe release rules

- This document and all SEO code changes remain in draft PRs.
- No production deployment, merge, Supabase schema/RLS change, `customer_enquiries` table change, or CRM/enquiry-flow change is included or authorized here.
- After approved changes are deployed, submit/refresh the sitemap in Search Console and request inspection for a small set of important URLs. Indexing is not guaranteed or instant.
