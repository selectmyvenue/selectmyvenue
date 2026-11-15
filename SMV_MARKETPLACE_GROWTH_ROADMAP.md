# SMV Marketplace Growth & Experience Roadmap
Date: 2026-11-16
Branch: upgrade/smv-premium-marketplace-experience

## Product ambition
Build Select My Venue into India's most useful AI-assisted venue discovery and customer-support platform, beginning with Delhi and Gurgaon. The product should win on relevant discovery, trustworthy venue information, thoughtful human assistance, and partner value—not on unsupported claims or copied competitor layouts.

## Competitive product principles
- Sloshout reference: structured venue search, transparent listing cards, category/locality discovery, partner operations.
- HALYO reference: useful planning tools that make the platform valuable before and after venue search.
- SMV differentiation: connect discovery, explainable matching, shortlist/compare, customer enquiry, Master CRM follow-up, venue assignment, and Partner CRM.

## Existing capabilities confirmed in repository
- Homepage hero search and AI event planner.
- Homepage public venue showcase.
- Homepage search-first enquiry capture.
- Venue directory filters and sorting.
- Shortlist and compare state in venue directory (up to three).
- Existing Master CRM and Partner CRM flows.
- Existing Smart Venue Matches assignment workflow.
- Shared AI assistant integration and public venue inventory RPC.

Do not rebuild or duplicate these capabilities. Improve the journey around them.

## Phase 1 — Homepage trust and conversion
Implemented in this branch:
- Customer-facing explanation of the SMV difference.
- Four-step value proposition: search around event, understand matches, compare clearly, human support.
- Links to existing Delhi/Gurgaon occasion/category pages.
- Venue-owner value proposition and transparent partner journey.
- FAQ content clarifying pricing, availability and enquiry process.
- Responsive premium visual treatment consistent with SMV teal/gold and light editorial sections.

## Phase 2 — Listing and discovery quality
Recommended next:
1. Audit every venue card on desktop/mobile: image crop, name contrast, location, price label, capacity, facilities and CTA.
2. Add clear venue profile completeness indicators based only on known fields.
3. Improve filter usability, empty states, sorting and compare drawer accessibility.
4. Add a clear distinction between venue-supplied data and SMV-confirmed details.
5. Collect genuine reviews only through a traceable customer feedback workflow; do not display fabricated ratings.
6. Improve profile conversion actions: request quote, check date, ask a question and request a site visit.
7. Keep price/availability language honest and venue-confirmed.

## Phase 3 — Delhi/Gurgaon SEO expansion
- Prioritise localities where verified inventory exists and where the business can serve enquiries.
- Build useful locality + occasion pages only when unique venue coverage and local content support them.
- Link city, locality, category, occasion, and venue profiles contextually.
- Review Search Console impressions/clicks and CRM enquiries before expanding page templates.
- Avoid thin, near-duplicate or empty pages; preserve existing URLs and historic pages until data supports a change.

## Phase 4 — Venue partner experience
- Improve partner onboarding and listing quality guidance.
- Add partner profile completeness feedback.
- Add assigned enquiry response tracking and transparent status history.
- Add packages, availability and media tools only after validating the existing Partner CRM data model and access boundaries.
- Offer useful performance reporting only from actual tracked data; never promise leads or bookings.

## Phase 5 — Event planning ecosystem
Prioritise a lightweight budget planner, event checklist and planning timeline that feed structured venue requirements into existing enquiry workflows. Invitation tools and wider vendor categories should wait until core venue inventory and service operations are strong.

## Non-negotiable safety and architecture constraints
- Do not change the existing customer_enquiries schema or its RLS policies.
- Do not expose customer PII or CRM records to public discovery.
- Do not change Smart Venue Matches or the existing assignment workflow.
- Do not change Get Matched submission behaviour without a separate reviewed change.
- Use only approved, verified and public-enabled inventory from smv_public_venues().
- No fabricated ratings, reviews, venue details, availability, prices, booking outcomes or lead guarantees.
- Keep production deployment separate from PR review and explicit approval.

## Current inventory observation
The public inventory RPC returned 37 records at the time of review. 36 had a cover image, 36 had a minimum per-person price and all 37 had a maximum capacity value. City-name counts were 16 Delhi and 17 Gurgaon/Gurugram; the remaining records use other city labels and should be reviewed for market eligibility before SEO expansion. This is a point-in-time database observation, not a permanent KPI.

## Acceptance criteria for this phase
- Existing homepage sections continue to render.
- New content appears between public venue showcase and the existing enquiry section.
- All links point to existing SMV pages.
- Layout works at desktop and mobile widths.
- No CRM, Supabase schema, RLS, AI endpoint, or venue assignment changes.
- Existing SEO and Get Matched tests remain green.
