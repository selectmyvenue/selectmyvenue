# Website discovery and SEO release — 17 September 2026

## Experience

A redesigned celebration homepage uses existing brand and image assets, a prominent city/guest/budget search, occasion routes, a photographed three-step process, practical reasons to use the service and clearer next actions. Inspiration imagery is not presented as photographs of particular listed venues. No fabricated reviews, rankings, customer numbers or competitor claims were added.

The directory keeps live public inventory, filter groups, venue profiles, shortlist and three-way comparison. It adds minimum guest capacity and maximum starting-price filters, shareable search URLs, keyboard search and a lighter visual treatment. Enquiry forms appear after results so customers can browse first. All existing CRM insert paths remain in place.

New planning pages provide an interactive local-browser venue-visit checklist and an original venue-budget guide. The existing planner remains available in an expandable section. Estimates are described as indicative, not venue quotations.

Fixed the homepage success-message MutationObserver loop. Automatic enquiry interruption was removed; the inline enquiry, venue-specific quote and help actions remain available. No customer enquiries were submitted during automated verification: inserts used a mock API.

## SEO

- Descriptive homepage/directory titles, descriptions, a single H1 and internal links.
- Original guide articles with canonical URLs, social metadata, Article and Breadcrumb structured data.
- Visible homepage FAQ with matching FAQPage data. This does not promise FAQ rich results.
- Public venue profile links visible in the directory HTML, plus ItemList markup.
- Sitemap includes the two guides and the 13 currently public venue profiles. Private CRM and employee URLs are excluded.
- Existing robots.txt, category URLs, analytics tags, profile canonical logic and venue structured data are retained.
- Existing local category pages link to the new planning guides.

The sitemap's public venue inventory is a release snapshot: refresh it when venues are added or unpublished. Live listings continue to come from the public venue API. Empty city results are explained rather than inventing inventory.

## Verification

`NODE_PATH=/path/to/node_modules node tests/discovery.cjs` with jsdom installed checks live-list rendering against mocked public data, enquiry payloads, confirmation stability, capacity/budget filters, reset, shortlist/comparison storage, shareable search state, saved checklist, anchors, unique IDs and JSON-LD validity. JavaScript syntax and whitespace checks are also run.

Existing public API returned 13 published venues during review. No schema, access-control, venue record or customer lead changes were needed.

## Owner follow-up for Google

Use the verified Google Search Console property to submit `https://selectmyvenue.com/sitemap.xml`, inspect the homepage, directory and new guides, and monitor indexing, search queries, clicks and Core Web Vitals. Search Console access was not available in this task, so submission and indexing have not been claimed.

Improve each venue's genuine photographs, descriptions, facilities and supported event types. The current public listings do not populate occasion metadata, so event matching should be confirmed by the team. Add verified customer feedback only with permission and evidence. Keep city guides accurate as coverage grows.

SEO improves crawlability and relevance; it cannot guarantee a position or instant traffic. Google's own guidance: https://developers.google.com/search/docs/fundamentals/seo-starter-guide

Rollback: revert this release commit. No database migration is needed.
