# Website Form → CRM Capture Audit
Date: 2026-11-16
Scope: public website forms in the website repository and the existing Supabase CRM intake.

## CRM destinations
- Customer requirements and quote requests: `public.customer_enquiries`.
- Venue-owner listing applications: `public.venues`, created with `venue_status='pending'`, `verification_status='pending'`, and `public_listing_enabled=false`. The Master CRM's existing Venue Management screen reads the `venues` table, shows pending counts, and displays contact person/mobile/city/area. No new CRM table or customer-enquiry schema change is required.

## Existing customer lead capture confirmed in source
- Homepage main customer enquiry / popup: `script.js` inserts into `customer_enquiries` with a Website source.
- Homepage search-first: `homepage-search-first.js` calls `smv-homepage-search`; the Edge Function validates and inserts a customer lead into `customer_enquiries`.
- Quick-enquiry forms: `quick-enquiry.js` binds `form[data-smv-quick-enquiry]` and inserts into `customer_enquiries`. This shared handler is used on homepage, browse-venues, and SEO enquiry components.
- Venue profile quick enquiry and quote/site-visit request: `venue-profile.js` inserts into `customer_enquiries` and records the venue ID/name in requirements and source.
- SEO category/occasion enquiry forms using `data-smv-quick-enquiry`: shared handler routes them to the same customer CRM table.

## Gap fixed by this change
- `list-your-venue.html` previously only opened a pre-filled WhatsApp message. The form did not create a CRM record unless the user separately sent the WhatsApp message.
- It now POSTs to `smv-venue-listing-application`. The function validates the application and creates a pending row in `venues`. The existing Master CRM Venue Management list then shows the application with owner/contact mobile and location for call/follow-up.
- The success state offers explicit Call SMV and WhatsApp SMV actions after the database confirms the application was saved.

## Search/planning UI that is not a lead submission
- The homepage hero search and AI planner collect event preferences and generate/prepare a plan; the lead is created only when the customer submits a contact/enquiry form.
- SEO quick-search forms that navigate to `index.html#enquiry` are search/pre-fill navigation, not contact forms: they do not collect customer name/mobile and do not claim that a lead was submitted.
- The AI assistant chat form is a conversation interface, not a lead form. A customer enquiry is created only through a contact/quote form or the homepage search-first flow.

## Security and data handling
- The public venue application endpoint uses server-side Supabase service credentials; no service key is exposed to the browser.
- It only creates pending, unverified, non-public venue records. It never grants public listing visibility or partner access.
- It validates venue/contact fields, consent, mobile and capacity; includes a honeypot; checks recent submissions to reduce accidental duplicates and repeated abuse.
- Existing `customer_enquiries` schema and RLS policies are unchanged.
- Existing `venues` RLS policies are unchanged. The Edge Function is the narrowly scoped public intake boundary; CRM access continues through existing authenticated staff policies.

## Deployment note
The Edge Function must be deployed with JWT verification disabled at the gateway because this is a public form endpoint; the function itself validates the request and restricts browser origins. The website form should be considered live only after the Edge Function is deployed and a real submission is verified in Master CRM.
