# Select My Venue — Free WhatsApp Enquiry Workflow

## Scope and cost guardrail

This is the no-subscription rollout using the existing WhatsApp Business app and the existing SMV CRM/Supabase project. It does **not** use the WhatsApp Business Platform/Cloud API, an external bot provider, paid AI inference, or a new database. It does not change production systems by itself.

**Important limitation:** the WhatsApp Business app does not provide a supported free API for a third-party service to automatically read incoming chats and write them into the CRM. Therefore, this setup gives free greeting/away messages, quick replies, labels and a consistent manual handoff. Fully automatic 24/7 AI replies and WhatsApp-to-CRM lead creation are not included because the current AI Edge Function calls OpenAI and would incur usage costs; Meta API pricing/eligibility must be checked before any future API activation.

## One-time WhatsApp Business app setup

1. Open WhatsApp Business on the phone that owns the existing SMV number.
2. Go to **Business tools**.
3. Configure **Greeting message** and select the audience appropriate for customers who message the business for the first time.
4. Configure **Away message** only for hours when the team is genuinely unavailable. Set a truthful schedule.
5. Add the quick replies below. Shortcuts are suggested; they can be edited in the app.
6. Add labels such as `New SMV Enquiry`, `Details Pending`, `Venue Options Shared`, `Follow-up`, and `Booked / Closed`.
7. Keep the existing CRM as the source of truth. For every genuine enquiry, create/update the lead in Master CRM and set source to WhatsApp if that option is available. Do not create duplicate leads when a matching mobile number already exists.

## Greeting message

Namaste! 👋 Select My Venue mein welcome hai.

Aapko wedding, engagement, birthday ya kisi aur event ke liye venue chahiye? Hum aapki requirements ke according suitable venue options shortlist karne mein help karenge.

Please reply with:
1. Event type
2. City/area
3. Approx. guest count

Agar aapne ye details pehle hi share ki hain, to dobara bhejne ki zarurat nahi hai. 😊

## Quick replies

### `/details` — ask for missing details

Namaste! Aapki enquiry receive ho gayi hai. 😊 Best venue options shortlist karne ke liye jo details missing hain, please share kar dein:

• Event/date:
• City/area:
• Guests:
• Budget per person ya total:
• Food preference (Veg/Non-veg):

Jo detail aap pehle hi share kar chuke hain, use dobara bhejne ki zarurat nahi.

### `/received` — acknowledge enquiry

Thank you! Aapki details mil gayi hain. Select My Venue team requirements check karke suitable venue options share karegi. Venue availability aur final pricing venue se confirm karni hoti hai.

### `/venueoptions` — share shortlist

Aapki requirements ke basis par kuch venue options shortlist kiye hain. Please options check kar lein. Visit/booking se pehle exact date availability, package inclusions, taxes aur final price venue se confirm karna zaroori hai.

### `/followup` — polite follow-up

Hi! Select My Venue se follow-up kar rahe hain. Kya aapko shared venue options mein se koi pasand aaya, ya location/budget/guest count mein koi change hai? Reply kar dein, hum shortlist update kar denge. 😊

### `/notnow` — customer not ready

No problem! Jab aap event planning continue karna chahein, yahin message kar sakte hain. Aapki updated date, area ya budget ke according help kar denge.

### `/owner` — venue owner enquiry

Namaste! Select My Venue par venue listing aur relevant customer enquiries ke baare mein interest dikhane ke liye thank you. Please venue name, area/city aur contact person ka naam share kar dein. Team aapse next steps ke liye contact karegi.

## Free daily operating flow

1. Reply to the customer using the greeting/quick reply, then ask only for missing event details.
2. Search the Master CRM by mobile number before creating a lead to avoid duplicates.
3. Create/update the enquiry in the existing CRM with source recorded as WhatsApp (if supported), and preserve the existing customer_enquiries schema and RLS.
4. Use the existing venues and matching workflow to shortlist only real, current venue records. Never promise availability, price or booking without confirmation.
5. Send suitable options manually, then add a follow-up date/remark in CRM.
6. Apply a WhatsApp label to match the lead's stage.
7. Respect opt-outs; stop promotional follow-ups when a customer asks not to be contacted.

## Not done / requires explicit approval

- No production deployment, WhatsApp registration, Meta Business changes, phone-number migration, webhook setup, secrets, database changes, or messages sent.
- No changes to `customer_enquiries`, RLS, or existing Edge Functions.
- Do not add an unofficial WhatsApp Web scraper/automation; it can risk account access and is not a dependable free integration.
- A future official webhook would need a Meta app, verified webhook, secure secrets, deduplication/idempotency, consent/opt-out handling, monitoring and a cost check. It must be separately approved before activation.
