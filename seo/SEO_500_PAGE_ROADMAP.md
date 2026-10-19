# SMV 500-Page Organic Lead Generation Programme

Status: implementation branch only; not merged or deployed.

## Objective
Build a sustainable, lead-generating organic search programme for Select My Venue, focused first on Delhi and Gurgaon/Gurugram. Every indexable landing page must serve a real customer intent, help compare or discover venues, and route enquiries through the existing website form to `customer_enquiries` and the Master CRM.

## Critical implementation finding
The current `seo/generate_venue_seo.py` output under `/venue-pages/` is intentionally `noindex,follow`, canonicalises to `/venue.html?id=...`, and redirects to the live venue profile. Those generated helper pages are **not 500 indexable SEO landing pages** and must not be counted as such. The generator also had duplicate sitemap URL entries; a tested deduplication fix is included in this branch.

## Planned portfolio: 500 page targets, subject to uniqueness and inventory checks

| Cluster | Target count | Purpose |
|---|---:|---|
| Core venue-type + city intent | 100 | Wedding venues, banquet halls, lawns, farmhouses, party halls, engagement/reception venues and corporate event spaces for Delhi and Gurgaon |
| Locality + venue-type intent | 150 | Locality pages only where SMV has relevant venue coverage and enough distinct information to help users |
| Event-specific intent | 75 | Birthday, anniversary, engagement, wedding reception, mehndi, sangeet, baby shower, kitty party and corporate events |
| Budget, capacity and facilities | 30 | Budget bands, guest-count ranges, vegetarian options, parking, rooms, indoor/outdoor and similar real filters only where inventory supports them |
| Venue discovery and comparison guides | 75 | Practical guides, checklists, price-planning explainers and FAQs |
| Venue discovery comparisons | 40 | Decision-useful venue-format, pricing-model and logistics comparisons for Delhi and Gurgaon |
| High-intent supporting pages / FAQs | 30 | Conversion support for shortlisting, site visits, availability and enquiry preparation |
| **Total target** | **500** | A target portfolio, not a promise that every candidate qualifies for indexation |

The detailed 500-row candidate inventory is maintained in `seo/SEO_500_PAGE_INVENTORY.csv`. Its rows are targets, **not created or published pages**; each stays `candidate_not_published` until the inventory/content gate passes. Public venue profile pages are generated only from real public venue records and are not fabricated as placeholder rows.

## Page acceptance rules
1. One page targets one clearly defined search intent. Do not publish pages that differ only by swapped city/locality words.
2. Publish a locality page only when the public venue inventory and page content genuinely support that location and the page adds useful local detail.
3. No invented venues, prices, capacities, venue availability, locality facts, reviews or rankings.
4. Noindex/canonical redirect helper pages remain out of the XML sitemap. Sitemap contains only intended indexable canonical URLs.
5. Every indexable page needs a unique title, meta description, H1, meaningful page body, internal links, mobile layout and a working enquiry CTA.
6. Pages that fail the uniqueness or inventory gate remain drafts; do not force a quota by publishing thin or doorway pages.
7. Delhi and Gurgaon/Gurugram are the first focus markets. Do not automatically reclassify Noida, Faridabad, Ghaziabad, Sonipat or Kundli as Delhi/Gurgaon.

## Footer and internal-link policy

The current homepage already has a small set of descriptive links to key discovery pages. Keep this useful navigation; do not add a long block of hundreds of exact-match keywords.

- Use a compact, human-readable footer group such as **Explore venues** with roughly 5–10 high-value links (for example, Wedding Venues in Delhi, Wedding Venues in Gurgaon, Banquet Halls in Delhi, Banquet Halls in Gurgaon, Party Venues, and Browse Venues), only when each destination is live, indexable and genuinely useful.
- On relevant SEO landing pages, add a few contextual links to closely related live pages and the main venue directory. Do not repeat the same large keyword list on every page.
- Keep labels natural and accurate. Do not create footer links for unpublished pages, noindex redirect helpers, unsupported localities, or pages with no useful venue coverage.
- Footer links help users navigate and help crawlers discover important pages; they are not a shortcut that guarantees ranking. The page's unique content, search intent match, internal context, technical indexability and real venue coverage matter more.
- Preserve the current footer design and mobile usability. Footer changes remain branch-only until visual/mobile regression checks pass.

## Lead attribution contract
- Existing destination: `customer_enquiries` -> Master CRM.
- No schema/table/RLS change.
- Source field format for organic leads: `SEO - Organic - <page title>` (bounded to the existing source field), with a stable `SEO - Organic` fallback.
- Append source page title, landing URL, first referrer and available UTM/click IDs to existing `requirements` and `contact_remark` fields, preserving customer-entered requirements.
- Attribution is best-effort: storage failures must never prevent enquiry submission.
- Test with a controlled staging/local form fixture. Never create dummy leads in production.

## Publishing and safety gates
1. Work only on `seo/500-page-organic-lead-program` until tests and review are complete.
2. Run existing event-page tests, SEO unit tests, static audit, sitemap duplicate check and browser/form attribution checks.
3. Confirm the enquiry still reaches the existing CRM with the correct source and page name using a safe non-production test.
4. Check indexability, canonical, robots, sitemap inclusion, internal links and mobile rendering.
5. Submit a PR for review. No merge or production deployment without explicit approval.

## Delivery status
- [x] Create a dedicated implementation branch.
- [x] Add organic landing-page attribution to the existing website enquiry flow without changing the database schema.
- [x] Add sitemap duplicate-removal helper and unit test.
- [ ] Run full automated test suite at the end of implementation and resolve all failures.
- [x] Create a 500-row candidate keyword-to-URL inventory; validation against live venue coverage and search demand remains pending.
- [x] Add fifteen editorial/comparison guides with distinct intent: budget comparison, site-visit inspection, booking/payment/cancellation questions, venue shortlisting, hidden costs, capacity planning, booking timeline, food tasting, outdoor weather backup, banquet hall vs wedding lawn, farmhouse vs banquet hall, corporate events, birthday parties, engagements, and wedding receptions. They are branch-only until approval and deployment; the planning guides and comparisons are linked from the SEO search hub.
- [x] Add a 500-row execution matrix that assigns every candidate a build strategy, content angle, evidence gate, unique-content requirement and internal-link targets.
- The current execution matrix disposition is: 276 data-backed candidates awaiting real inventory matching; 81 subjective claims held for evidence; 33 city-variant candidates marked for consolidation; 15 candidate intents mapped to existing pages/guides; and 95 guide/comparison/FAQ candidates requiring distinct editorial writing or intent merging. These are candidate dispositions, not published-page counts.
- [x] Add a review-only organic landing-page generator that reads the 500-row inventory and the existing public venue RPC, matches candidates to real public Delhi/Gurgaon listings, requires at least three matching listings, and writes a separate review artifact plus candidate-only sitemap. It never writes to the site root or live sitemap.
- [x] Add a manual GitHub Actions workflow to prepare the review artifact; it does not deploy or change production.
- [ ] Generate and manually review the data-backed candidate artifact; identify existing pages to reuse, locality/filter pages with insufficient venue coverage, and editorial/comparison/subjective claims that need human-written content or evidence.
- [ ] Expand genuinely useful landing-page coverage from the initial editorial guides; the 500-row inventory remains a candidate list, not 500 completed pages.
- [ ] Verify end-to-end attribution through a non-production test environment.
- [ ] Review and approve PR before merge/publish.
