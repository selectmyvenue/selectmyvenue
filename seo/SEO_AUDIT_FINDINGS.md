# Select My Venue SEO Audit Findings (Draft)

**Review date:** 2026-10-16  
**Scope:** Static source review and public competitor-page spot checks. This is not a claim that every Indian venue website has been audited.

## Confirmed static checks

- GitHub Actions ran `python seo/audit_static_seo.py` against the PR merge checkout.
- Result: 38 HTML files checked, 37 sitemap URLs, 0 errors, 0 warnings.
- `robots.txt` allows crawling and declares `https://selectmyvenue.com/sitemap.xml`.
- Sampled static landing pages have a title, meta description, canonical URL, one H1, and image alt attributes.
- The static audit intentionally does not certify live HTTP status, mobile rendering, dynamic JavaScript rendering, Search Console indexing, or Google's structured-data eligibility.
- `venue.html` is a dynamic template: `venue-profile.js` changes its title, description, canonical, Open Graph data, and EventVenue structured data at runtime. Validate a real venue URL with a valid ID in Google's live URL test before deciding how profile URLs should be indexed.

## Concrete page-level findings from source review

- The location and event landing pages sampled contain real decision-support copy on area/access, guest capacity, venue type, total event cost, and facilities. They are not just a headline and a form.
- Delhi and Gurgaon banquet pages are distinct in their current copy (for example, Delhi locality/metro/road access vs Gurgaon sector/business-district/airport travel), and both preserve a short enquiry path.
- `list-your-venue.html` already explains a three-step process: send basics, quick verification, then profile/enquiries. Improve differentiation and conversion proof rather than replacing the page wholesale.
- Several locality wedding titles are long in source: `wedding-venues-in-delhi.html` (~77 characters), `wedding-venues-in-gurgaon.html` (~75), `wedding-venues-in-noida.html` (~68), `wedding-venues-in-chhatarpur.html` (~77), `wedding-venues-gt-karnal-road.html` (~80), and `wedding-venues-in-kapashera.html` (~75). Review these for concise, distinct wording; do not change titles solely to chase a rigid character count.
- A number of static category/location pages have JSON-LD blocks, while some hub/owner/legal pages do not. This is not automatically a defect: choose schema based on the visible purpose/content and validate rendered output. The static template for `venue.html` contains a dynamic schema placeholder, so static JSON parsing alone is not a valid test for each venue profile.
- The simple static audit did not find missing metadata/canonical/H1/alt issues in its run, but it does not test duplicate content quality, internal-link crawlability, title truncation in actual SERPs, HTTP status, or page speed.

## Technical follow-up priorities

1. **Search Console evidence (blocking for real indexing/performance conclusions):** inspect Page indexing, Sitemaps, URL Inspection, Search results queries/pages, and Core Web Vitals. The code audit cannot reveal Google's actual indexed URL count, impressions, clicks, queries, or organic lead share.
2. **Rendered/mobile checks:** run Google URL Inspection or Rich Results Test on homepage, a location page, a high-intent page, list-your-venue, and a real dynamic venue profile. Confirm fetch succeeds, canonical matches the intended URL, rendered H1/content is present, and primary resources/forms work on mobile.
3. **Structured data:** static JSON-LD syntax is only a first check. Validate rendered output with Google's Rich Results Test and ensure each property matches visible content. Do not add fake ratings/reviews or schema unsupported by the page.
4. **Internal links:** review crawlable anchor hrefs and page-to-page discovery with a real crawler. Ensure core location/event pages and the venue-owner page can be reached through normal links, not only JavaScript interactions.
5. **Metadata/content quality:** review the long locality titles listed above, then evaluate uniqueness, search intent, description quality, thin/duplicated copy, and whether pages provide real local value before editing.
6. **Sitemap freshness:** update `lastmod` only when the page's content, links, or structured data has materially changed; do not touch dates just to signal activity.

## Competitor page-template observations (public spot checks)

- **WeddingWire India:** city/region and category discovery, venue counts, photos, prices, guest capacity, promotions, reviews, request-pricing actions, and a dedicated business-area registration path for venue owners.
- **WedMeGood:** popular locality/category paths, budget planning, venue listings, inspiration/editorial, vendor contact routes, and business/vendor registration/contact options.
- **Weddingz:** vendor/venue discovery plus a clear distinction between non-partner listings and premium partner services.
- **VenueLook:** detailed venue-owner form (venue name, location, capacity, description, contact) and explicit messaging around profile visibility, qualified leads, marketing, customer enquiries, and partner support.
- **Mandap:** venue discovery by event, location, budget/capacity, and practical facilities (initial spot check only).
- These are public-page observations, not a complete technical backlink, traffic, schema, or crawl audit of all competitors.

## SMV priorities based on those observations

- **Customer SEO:** make each target landing page materially useful and distinct: local areas, realistic budget ranges, guest capacity, indoor/outdoor venue type, facilities, questions to ask, and a clear short enquiry path. Only state facts SMV can verify.
- **Venue-owner acquisition:** strengthen `list-your-venue.html` with a visible free/trial or plan explanation that matches the current real offer, the exact verification/onboarding process, how enquiries are shared, what Partner CRM does, and a prominent WhatsApp/call/application CTA. Add venue-owner FAQs and avoid promises about guaranteed leads or bookings.
- **Lead quality:** measure source and landing page alongside qualified/contacted leads, site visits, venue matches, and bookings. Form count alone is not success; don't create test leads in production.
- **AI-assisted SEO:** use AI for research, drafting, clustering, and monitoring with human review and venue-specific facts. Do not mass-publish repetitive city/keyword pages.

## Search Console snapshot (connected Windsor.ai / Search Console data)

**Snapshot date:** 2026-10-16. The connector returns Google Search Console Search Analytics aggregates; use the Search Console UI / URL Inspection for final indexing decisions. Metrics can differ by dimension, and query-level rows do not include all clicks because Google anonymizes some queries.

- **URL-prefix property `https://selectmyvenue.com/`, last 28 days:** the country dimension reports India at 25 clicks, 65 impressions, 38.46% CTR and average position 11.8. Other countries contribute 7 impressions and no clicks in that country breakdown.
- **Same property, last 3 months:** the country dimension reports India at 43 clicks, 148 impressions, 29.05% CTR and average position 12.98. The all-country page dimension returns 46 clicks and 453 impressions; do not add metrics across different dimensions or treat those two reports as directly interchangeable.
- **Connector consistency warning:** for the same URL-prefix property and time windows, the page and country dimension aggregates differ materially (last 28 days: 25 clicks / 176 page impressions versus 25 / 72 country impressions; last 3 months: 46 / 453 page totals versus 43 / 166 country totals). These should not be treated as a reconciled sitewide total. Verify the actual totals in the Search Console UI before using them for reporting or investment decisions.
- **Pages with opportunity in the last 3 months (page dimension, all countries):** `/venues-in-delhi.html` had 5 clicks / 67 impressions (average position ~3.1); `/delhi-ncr-venues.html` had 3 / 56 (~10.2); `/venues-in-gurgaon.html` had 0 / 16 (~11.9); `/party-halls-delhi-ncr.html` had 0 / 16 (~19.6); and `/list-your-venue.html` had 0 / 23 (~14.8). These are small samples, so use them as prioritization signals, not stable performance forecasts.
- **Homepage URL variants:** the page dimension separately reports `/` and `/index.html`. The static `index.html` source declares the root URL as canonical, but Search Console URL Inspection should confirm Google's selected canonical. Review internal links for avoidable `index.html` links before making broad rewrites.
- **Query-level data:** the connector returns a small set of low-volume queries (e.g. “party halls delhi”, “venue gurgaon”, “venue in delhi”) and those rows show zero clicks. This is not a total-click report: anonymized queries and aggregation differences mean page/country totals are the better overall traffic indicators.
- **Sitemap discrepancy to verify in Search Console UI:** the connected sitemap report for `https://selectmyvenue.com/sitemap.xml` shows 36 submitted URLs, 0 errors and 0 warnings; its last-submitted timestamp is 2026-08-27 and last-downloaded is 2026-10-14. The current repository `sitemap.xml` contains 61 `<url>` entries. The connector's `indexed` field is marked deprecated, so its value of 0 must **not** be interpreted as proof that no URLs are indexed. Re-check the sitemap report and processing date in Search Console before taking action.
- **Legacy www sitemap:** the connector also returns `https://www.selectmyvenue.com/sitemap.xml` with 1,027 submitted URLs, 1 error and 27 warnings, last downloaded in 2018. Review the www property and redirects/canonicalization in Search Console; do not delete or remove this entry automatically.
- **What this means:** SMV has some organic search activity, but the absolute number of impressions remains small for a venue-discovery site. The next SEO priority is increasing relevant Delhi/Gurgaon wedding/banquet/party query coverage and resolving sitemap/canonical reporting questions—not claiming that SEO already drives most leads.
- The public Rich Results Test and Search Console URL Inspection have not yet been run to completion for a live set of representative pages. Mobile rendering, Google-selected canonicals, dynamic venue profile indexing, Core Web Vitals, and organic enquiry share remain unverified.

## Safe release rules

- This document and all SEO code changes remain in draft PRs.
- No production deployment, merge, Supabase schema/RLS change, `customer_enquiries` table change, or CRM/enquiry-flow change is included or authorized here.
- After approved changes are deployed, submit/refresh the sitemap in Search Console and request inspection for a small set of important URLs. Indexing is not guaranteed or instant.
