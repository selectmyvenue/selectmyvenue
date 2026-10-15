# All-intent SEO and enquiry access — implementation plan

Branch: `seo/all-intent-enquiry-coverage`
Status: review only. Do not merge or deploy without explicit owner approval.

## Goal
Help customers discover Select My Venue from a broad range of genuine venue searches and make the existing enquiry path easy to find, without changing the current CRM contract.

## The five SEO layers

1. **Location intent:** city and locality pages only where the page can give useful, accurate guidance and relevant inventory exists (Delhi, Gurgaon, Noida, Faridabad and other genuinely served areas).
2. **Occasion intent:** wedding, engagement, reception, birthday, anniversary, private party, kitty party, corporate event, conference/meeting and other real customer occasions.
3. **Venue-format intent:** banquet halls, lawns, farmhouses, hotels, restaurants and other formats only where SMV can meaningfully help customers search.
4. **Practical-fit intent:** guest capacity, budget, rooms, parking, food preference, indoor/outdoor setting and other facilities. Never claim a facility, price or availability unless grounded in venue data.
5. **Technical + conversion layer:** crawlable pages, canonical metadata, accurate sitemap, internal links, mobile-friendly enquiry access, preserved source attribution, and measurement from organic visit to genuine CRM lead and qualified outcome.

## Work in this branch
- Added `venues-for-every-event-delhi-ncr.html`, a broad event-intent landing page with an enquiry form that reuses the existing `quick-enquiry.js` handler and the current `customer_enquiries` insertion path.
- Linked the new page from `seo-searches.html` and `sitemap.xml`.
- The form uses the existing supported fields: `customer_name`, `mobile`, `occasion`, `location`, `event_date`, `guests`, `budget_per_person`, and `requirements`. Date remains required because the current handler enforces it.
- No changes to Supabase schema/RLS, Master CRM, `index.html`, `script.js`, or the existing handler.

## Required validation before release
- Run the repository SEO unit tests and static audit against this page.
- Confirm every form field is understood by the existing handler and that the event selection maps to `occasion`.
- Check the generated page at desktop and mobile widths, date validation, successful submission in an explicitly approved test environment, attribution capture, and CRM arrival.
- Confirm the deployed site actually serves the new page and sitemap from the intended publishing source before requesting indexing.
- Review sitemap URL uniqueness and the new page's canonical.
- Monitor Search Console impressions/clicks and CRM organic lead quality before expanding to more pages.

## Quality and safety rules
- Do not generate mass near-duplicate doorway pages.
- Do not fabricate listings, reviews, prices, facilities, opening hours or availability.
- Do not claim 80% organic lead share as a guaranteed outcome; measure actual channel mix and qualified lead outcomes.
- Keep the live site untouched until explicit merge/deployment approval.
