# P3 SEO Candidate Review — 16 November 2026

## Live inventory snapshot
The review workflow queried the existing public venue RPC and loaded **34 eligible Delhi/Gurgaon public venue records**. It processed all 500 candidate rows without writing to the website, live sitemap, CRM or database.

| Disposition | Count | Decision |
|---|---:|---|
| Generated for human review | 22 | Candidate HTML artifact only; not published |
| Held for evidence | 81 | Keep out of sitemap until claims are substantiated |
| Not generated | 388 | No safe matching template / insufficient evidence / no qualified match |
| Reuse existing page | 9 | Improve or link the existing canonical destination rather than create a duplicate |
| **Total** | **500** | |

## Candidate publication decision
The 22 generated pages are not being added to the live sitemap automatically. Their venue coverage is real, but several candidate sets overlap heavily with other event/facility pages and existing city/category pages. Search Console performance reads are currently paused by the connected Windsor plan, so there is no verified query-volume or ranking evidence to justify publishing overlapping variants.

The review-only workflow remains intentionally separate from the production website. It writes a report, candidate-only sitemap and HTML files to a GitHub Actions artifact. It never edits the live sitemap or site root.

## Pages approved for the P3 release candidate
Fifteen human-written editorial guides are included in this branch. Each has a self-canonical URL, indexable robots directive, unique title/meta description, one H1, useful page content and the existing quick-enquiry form connected to `customer_enquiries`.

The guides cover venue shortlisting, budget, hidden costs, booking questions and timeline, capacity planning, site visits, food tasting, outdoor weather backup, banquet hall vs lawn, farmhouse vs banquet hall, and event-specific checklists for wedding reception, engagement, birthday and corporate events.

## CRM attribution
Organic search visits are labelled `SEO - Organic - <page title>` in the existing source field where available. Landing title, landing URL, first referrer and available UTM/click identifiers are appended to existing `requirements` and `contact_remark` fields. This is best-effort and does not change tables, columns or RLS policies.

## Release boundary
Only the 15 editorial guides, their internal links and attribution code are intended for the P3 website release. The 22 candidate pages remain review-only until their unique value is demonstrated. No bulk 500-page publication is authorised by this artifact.
