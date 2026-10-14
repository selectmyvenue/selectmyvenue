# Select My Venue SEO implementation — review notes

Branch: `seo/technical-foundation-audit`
Base: `main`
Status: review-only preparation; do not merge or deploy without owner approval.

## Guardrails

- Preserve the existing Supabase `customer_enquiries` table and the website's current enquiry submission and CRM flow.
- No Supabase schema, RLS, key, or data changes.
- No changes to `index.html`, `script.js`, enquiry forms, venue-owner forms, or CRM behavior until a targeted diff and regression test plan are approved.
- Do not generate hundreds of near-duplicate location pages. Create pages only when they can offer distinct, accurate venue information and useful customer value.
- Do not change production, merge, or deploy from this branch.

## Initial repository inspection (main)

- Static HTML/CSS/JavaScript site; no package manifest or obvious build/test command was seen in the root listing.
- Homepage already has title, meta description, robots directive, canonical URL, Open Graph/Twitter metadata, and WebSite/Organization/Service JSON-LD.
- `robots.txt` allows crawling and points to `https://selectmyvenue.com/sitemap.xml`.
- `sitemap.xml` contains location/category landing pages, but all listed content pages have fixed last-modified dates (mostly 2026-09-24). Keep dates truthful; update only when page content materially changes.
- Multiple location/category landing pages already exist. Audit their unique content, canonical URLs, internal links, and whether they return useful inventory before creating more.
- `script.js` initializes the Supabase browser client and wires the current customer enquiry path. Treat this file and its form IDs/payload as protected until regression tests are available.
- `venues.html` loads public venue details and contains enquiry UI; its data rendering and enquiry behavior must be tested before any markup changes.

## Safe implementation sequence

1. Baseline checks: enumerate sitemap URLs; verify every URL resolves; check unique titles/descriptions/canonicals, indexability, internal links, mobile performance, image alt text, and structured-data validity.
2. Content quality: compare existing location pages for duplicate/templated text; retain pages only where accurate inventory, venue details, and practical guidance make them useful.
3. Technical SEO: fix confirmed metadata, canonical, broken-link, sitemap, and image issues in small, isolated commits. Keep sitemap `lastmod` values accurate.
4. Customer conversion: preserve the existing enquiry form and CRM write path. If source attribution is added later, pass it through the existing validated payload only after confirming the current schema and CRM dependencies; no schema change is authorized.
5. Verification: run HTML/XML validation and link/metadata checks, then manual mobile checks. Submit a test enquiry only in an explicitly approved test environment; never send test leads to production CRM without approval.
6. Approval gate: review the branch diff and test results before any pull request merge or deployment.

## Acceptance checks before merge

- [ ] No edits to Supabase schema, RLS, or production data.
- [ ] Customer enquiry form field names, validation, submit handler, Supabase table, and payload remain unchanged unless separately approved.
- [ ] CRM receives enquiries through the existing path.
- [ ] Sitemap contains only canonical, indexable, useful URLs; no duplicate or redirect URLs.
- [ ] Each indexable landing page has a unique, accurate title and meta description and one correct canonical.
- [ ] No fabricated venue claims, prices, capacity, amenities, or availability.
- [ ] Branch diff is reviewed and owner explicitly approves merge/deployment.


## Latest SEO branch progress (2026-10-15)

- Expanded `seo/audit_static_seo.py` to scan nested generated venue pages as well as root HTML files, map directory-style venue URLs to `index.html`, and flag duplicate sitemap URLs, non-HTTPS/off-domain sitemap URLs, missing local targets, noindex entries, and canonical/sitemap mismatches.
- Added unit tests in `seo/tests/` for metadata parsing, generated-page path mapping, path-traversal rejection, public-venue eligibility, quote CTA output, and avoiding invented locality in structured data.
- Added `.github/workflows/seo-audit-tests.yml` to run these tests on changes to the SEO branch and pull requests targeting `main`.
- Latest GitHub Actions run: [SEO audit unit tests](https://github.com/selectmyvenue/selectmyvenue/actions/runs/38644528015) completed successfully; 10 tests passed.
- Generated venue-page CTA now opens the existing venue quote modal using the established `venue.html?id=…&quote=1` route. This uses the existing `customer_enquiries` insertion path in `venue-profile.js`; no CRM schema, RLS, form payload, or customer enquiry handler was changed.
- Generated pages preserve landing URL, referrer, and campaign parameters in the existing session attribution key so the existing venue-profile submission can include attribution in its `requirements` text.
- These changes exist only on `seo/technical-foundation-audit`. No generated pages have been published by this work, and no production deployment, merge, live CRM test, or live sitemap validation has been performed.
- Next gate: identify and verify the actual GitHub Pages publishing path; then run a read-only audit against a controlled copy and verify generated pages, sitemap paths, structured data, mobile UX, and the enquiry route before requesting approval to publish.
