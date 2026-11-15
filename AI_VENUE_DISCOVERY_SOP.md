# Select My Venue — AI Venue Discovery SOP

**Status:** Product and operating specification  
**Initial markets:** Delhi and Gurgaon (including Gurugram naming variants)  
**Primary objective:** Help customers discover, evaluate, shortlist and enquire about suitable venues in one trusted place.

## 1. Product promise

Select My Venue is a venue-discovery and decision-support platform, not merely a directory of banquet halls. It should help customers find the right venue for their event, understand why it may fit, compare alternatives and connect with the SMV team or venue.

**Customer journey:** Share Your Requirement → Smart Matching → Shortlist & Compare → Connect / Visit → Confirm with Venue.

The public platform should support all venue types actually present in the approved inventory. Examples include banquet halls, hotels, restaurants, farmhouses, resorts, party spaces, lawns and other event spaces. Do not invent categories or display a category as available unless live inventory supports it.

## 2. Market scope

For the current phase, discovery surfaces should prioritise:
- Delhi
- Gurgaon / Gurugram

Normalize Gurgaon and Gurugram as the same discovery city. Preserve locality-level data such as Chhatarpur, Dwarka, Janakpuri, Rohini, Rajouri Garden, GT Karnal Road, Kapashera and other localities only when they are present in venue records.

Do not delete historic Noida, Faridabad or other NCR SEO pages or sitemap entries as part of this scope change. Review their Search Console traffic, rankings and enquiry contribution before any redirect, noindex or removal decision.

## 3. Requirement intake

Collect only the information needed to improve the shortlist:
1. Event / occasion (wedding, engagement, reception, birthday, anniversary, corporate event, party or other).
2. City and preferred locality / travel radius.
3. Event date or whether the date is flexible / undecided.
4. Expected guest count.
5. Budget per person and, where available, total budget.
6. Venue type preference.
7. Food preference (vegetarian, non-vegetarian, both, Jain or undecided).
8. Must-have facilities (parking, rooms, catering, decoration, accessibility, power backup and other venue-confirmed facilities).
9. Additional requirements in the customer's own words.

Allow customers to proceed with partial requirements. Ask one clear follow-up question at a time when a missing answer materially changes the shortlist.

## 4. Inventory eligibility and trust

A venue can appear in public discovery only when the authoritative public listing source confirms all three:
- `venue_status = approved`
- `verification_status = verified`
- `public_listing_enabled = true`

The current `smv_public_venues()` database function already applies these conditions. Keep it as the public inventory gate; do not weaken it or replace it with client-side assumptions.

Use “Verified Partner” only for records returned through this verified public inventory. Do not imply that every facility, price, photograph, package or availability has been independently audited unless there is a separate evidence field and verification process for that claim.

Display missing values honestly:
- Price not supplied → “Quote on request”
- Capacity not supplied → “Confirm capacity”
- Event suitability not supplied → “Confirm with venue”
- Availability not checked → “Check date with venue”

Never invent ratings, reviews, prices, capacity, distance, availability, awards or customer testimonials.

## 5. Matching SOP

### Stage A — Normalize the requirement

Normalize city aliases (Gurgaon / Gurugram), event labels, guest counts, budget ranges and locality spelling. Preserve the original customer wording in enquiry notes where helpful.

### Stage B — Apply hard eligibility rules

- Public inventory must pass the verified-listing gate in section 4.
- A selected city must match Delhi or Gurgaon / Gurugram.
- Exclude a venue only when a known value explicitly conflicts with a customer's must-have requirement.
- Missing capacity, price or event-support data is unknown, not automatically a mismatch. Keep such venues eligible where safe and clearly mark the detail for confirmation.
- Never claim real-time availability unless the venue has confirmed it for the requested date and event.

### Stage C — Rank explainably

The future AI matching engine should use a transparent 100-point relevance model:
- Location and preferred locality: 25 points
- Guest capacity fit: 20 points
- Budget fit: 20 points
- Event suitability: 15 points
- Venue type preference: 10 points
- Food and must-have facilities: 10 points

Only award points for facts present in the venue record. Missing data receives no match points and must be shown as “confirm with venue”; it must not be silently treated as a positive match. A hard must-have conflict can exclude a venue. A score must never be displayed as a probability of booking or a guarantee of suitability.

For every recommendation, explain the actual reasons (for example: “Gurgaon”, “listed for wedding events”, “capacity up to 300”, “parking listed”) and call out missing facts. Do not use a fabricated fixed score such as “92% match”.

### Stage D — Return useful options

- Show the most relevant verified venues first, with a clear way to change filters.
- Explain why each result is shown.
- Let customers shortlist and compare up to three venues.
- Compare only published facts: locality, venue type, capacity, price guidance, food and facilities.
- Offer nearby/locality alternatives only when they remain within the customer's stated travel preference; disclose when an alternative is outside the preferred locality.
- If no suitable venue is found, explain which requirement is limiting results and offer a less restrictive search or human assistance.

## 6. Venue profile standard

Every public venue profile should progressively provide:
- Clear venue name, venue type, locality, city and usable address / map link.
- Genuine cover image and gallery; no stretched or misleading images.
- Capacity range and layout / event configuration where supplied.
- Per-person price range or clear quote-on-request label.
- Supported event types.
- Veg / non-veg / Jain details where confirmed.
- Parking, rooms, catering, decoration, power backup and other facilities where confirmed.
- Policies and important booking questions: taxes, inclusions, minimum guarantee, event timings, cancellation / refund terms and outside-vendor rules.
- Direct actions: check price and availability, request a site visit, shortlist, compare and contact SMV.

The profile should distinguish venue-supplied information from details confirmed by SMV.

## 7. AI assistant behaviour

Use one consistent Select My Venue AI assistant, not multiple competing chat widgets or duplicate local response engines.

The assistant should:
- Understand natural-language requirements and ask concise clarifying questions.
- Use the same structured requirement fields as the directory and enquiry flow.
- Recommend only eligible public venue inventory.
- Explain matches and missing details in plain language.
- Help with venue type, budget, capacity, checklist and planning questions.
- Pass the final structured requirement to the existing enquiry flow only after customer consent.
- Never ask for or expose sensitive information that is not needed for venue discovery.

Where the existing Supabase Edge Function `smv-ai-assistant` is available, use it as the single server-side AI route. Verify its deployed contract before connecting or changing it. Do not expose an OpenAI secret key in browser code and do not add a second assistant implementation.

## 8. Enquiry and CRM handoff

- Keep the existing `customer_enquiries` table and its schema unchanged.
- Keep current RLS and authenticated internal CRM access boundaries unchanged.
- Capture the original requirement, selected venues, source page, campaign attribution and customer consent using existing supported fields / notes.
- Route enquiries to the existing Master CRM workflow for human review and venue assignment.
- Venue partners must only see enquiries explicitly assigned to their own venue through the separate Partner CRM access model.
- Do not give venue owners access to the full customer enquiry table.

## 9. Measurement and operating cadence

Track the discovery funnel:
- Search started and search completed.
- Filter usage and zero-result searches.
- Venue profile opens.
- Shortlist additions and removals.
- Comparisons started and completed.
- Availability / site-visit clicks.
- Enquiries submitted and successfully received by CRM.
- Enquiry-to-contact and site-visit progression where the CRM records it.
- Missing-data rate by venue (price, capacity, event types, facilities, photos).
- Inventory coverage by Delhi / Gurgaon locality and venue type.

Review weekly:
1. Which Delhi and Gurgaon localities receive searches but have insufficient eligible inventory?
2. Which venue types have demand but weak supply?
3. Which filters cause zero-result searches?
4. Which venue profiles receive interest but lack essential facts?
5. Are enquiries reaching the CRM and receiving timely human follow-up?

Use measured data to decide inventory acquisition and SEO expansion. Do not publish hundreds of thin or duplicate pages simply to increase page count.

## 10. Release and safety rules

- Implement website changes on a review branch and open a PR.
- Do not deploy or merge without explicit approval.
- Do not change production Supabase schema, RLS, CRM routes or lead data as part of frontend discovery work.
- Preserve existing Smart Venue Matches functionality unless a tested replacement is explicitly approved.
- Test desktop, tablet and mobile; keyboard operation; empty results; unknown data; city aliases; filters; compare / shortlist; enquiry submission; CRM receipt.
- Keep old SEO pages and sitemap entries until traffic and lead data have been reviewed.
- Describe a feature as “AI-powered” only when it actually calls the approved AI service; deterministic filters and ranking should be labelled “Smart Match” or “Recommended”.

## 11. Current implementation notes

The public directory already has a verified public inventory source, venue-type / location / occasion / food / capacity / budget / facility filters, shortlist storage and comparison up to three venues. The homepage also has a live venue showcase and filters.

The immediate improvement programme should strengthen the existing directory and homepage rather than rebuilding them:
- Keep the homepage and public discovery inventory focused on Delhi and Gurgaon / Gurugram.
- Keep all available venue types from live approved inventory.
- Make search tolerate multiple words.
- Keep venues with missing prices, capacities or event-support data discoverable when no known conflict exists, but visibly mark those facts for confirmation.
- Replace generic “matches your filters” copy with per-venue, fact-based explanations.
- Make the default directory ordering favour better-documented profiles without pretending it is an AI probability score.

This SOP is the product and operating standard for subsequent AI integration and release reviews.
