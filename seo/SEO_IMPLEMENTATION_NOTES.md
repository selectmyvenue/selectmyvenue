# Select My Venue SEO implementation — review notes

Branch: `seo/delhi-gurgaon-venue-engine-review`
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
- Latest verified GitHub Actions run: [SEO audit tests + static audit](https://github.com/selectmyvenue/selectmyvenue/actions/runs/38773527444) completed the 14 unit tests successfully and checked 37 HTML files / 36 sitemap URLs with 0 errors and 0 warnings. The static audit initially found one missing fallback alt attribute on the dynamic venue hero image; the source was fixed, and the rerun is clean.
- Static audit scope is source-level only. Live HTTP status/redirects, mobile browser rendering, structured-data validation, Search Console indexing, generated artifact review, and enquiry-to-CRM testing remain separate release checks.
- Generated venue-page CTA now opens the existing venue quote modal using the established `venue.html?id=…&quote=1` route. This uses the existing `customer_enquiries` insertion path in `venue-profile.js`; no CRM schema, RLS, form payload, or customer enquiry handler was changed.
- Generated pages preserve landing URL, referrer, and campaign parameters in the existing session attribution key so the existing venue-profile submission can include attribution in its `requirements` text.
- These changes exist only on `seo/delhi-gurgaon-venue-engine-review`. No generated pages have been published by this work, and no production deployment, merge, live CRM test, or live sitemap validation has been performed.
- Next gate: identify and verify the actual GitHub Pages publishing path; then run a read-only audit against a controlled copy and verify generated pages, sitemap paths, structured data, mobile UX, and the enquiry route before requesting approval to publish.


## Manual page-artifact workflow (2026-10-15)

- Added `.github/workflows/prepare-seo-venue-pages.yml`, manually triggered only with `workflow_dispatch` on `seo/delhi-gurgaon-venue-engine-review`.
- It runs the unit tests, invokes the existing public `smv_public_venues` RPC through `seo/generate_venue_seo.py`, runs the static audit, and uploads `venue-pages/**` plus the updated `sitemap.xml` as a short-lived GitHub Actions artifact.
- It does **not** commit generated output, merge branches, deploy, or change the live website. It fails closed if required Supabase repository secrets are absent, the public RPC returns no eligible venues, or no generated pages are produced.
- Repository inspection found a root-level `CNAME` containing `selectmyvenue.com` and static HTML files, but did not find a build/deployment workflow on the SEO branch or main. The GitHub Pages settings endpoint could not be verified through the available read interface, so the actual publishing source remains unconfirmed.
- Before any live publication, manually review the generated artifact and verify live sitemap/URL serving, canonical/indexability, and the existing enquiry-to-CRM route in an approved test environment.

- The page generator now also excludes approved/verified records that lack a real `area` or `city` from the location-focused SEO page set. This avoids inventing “Delhi NCR” as a venue location; locationless records can remain in the existing directory/CRM but do not get these local SEO pages until the listing has a location.


## Current market focus (2026-10-15)

- SEO rollout priority is **Delhi and Gurgaon/Gurugram**, reflecting the current venue inventory concentration.
- The static venue-page generator now filters public listing rows to a clearly identified Delhi or Gurgaon market before writing generated pages and sitemap entries. Specific non-target cities such as Noida and Faridabad are not reclassified as Delhi merely because a broad area label says "Delhi NCR". Ambiguous generic NCR-only locations are held back until a real target locality is available.
- The existing public RPC was verified read-only to filter records to approved, verified, publicly enabled venues. The generator fails closed when no eligible Delhi/Gurgaon venue exists, so it does not replace the sitemap with an empty generated-venue set.
- This is an SEO rollout scope, not a change to the existing venue directory or CRM inventory. No Supabase schema, RLS, customer enquiry form, CRM, merge, or deployment changes are included.
- Required validation: run the SEO unit-test workflow, inspect the generated artifact and resulting sitemap, verify mobile rendering and quote CTA, and confirm the publishing path before any production release.
