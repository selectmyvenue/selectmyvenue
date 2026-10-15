# Generated venue SEO pages — implementation and safe rollout

Branch: `seo/delhi-gurgaon-venue-engine-review`

## What was added

`seo/generate_venue_seo.py` creates a crawlable static page for each venue returned by the existing `smv_public_venues` RPC, and adds the generated canonical URLs to the existing XML sitemap. URLs use a name slug plus an ID suffix to avoid collisions. Generated pages include unique title/description/canonical/social metadata, a mobile-friendly layout, visible venue facts and JSON-LD.

The generator fails closed when credentials are missing, the RPC fails, the response is malformed, no eligible public venues are returned, or the sitemap is missing. It does not query private tables directly, write to Supabase, change venue approval, or change enquiry/CRM code.

## Run locally (after reviewing the code)

From the repository root, with Python 3.10+:

```sh
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_ANON_KEY="YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY"
export SEO_SITE_ROOT="."
python3 seo/generate_venue_seo.py
```

Use only the existing public/publishable key, never a service-role key. The RPC must be accessible with that public key and return the expected public venue fields. If the RPC is not configured for public access, stop and review its current permissions rather than weakening RLS or exposing a private table.

## Important rollout limitation

**This is a generator, not an active automatic approval trigger.** No verified deployment/build workflow was found in the inspected repository, and no workflow has been enabled. The generator must run in a controlled build/deployment process, and generated output must be published to the actual website host. A commit to this SEO branch does not change the live website.

Before enabling scheduled automation, validate the RPC output, check generated HTML and sitemap locally, test a venue that is approved and one that is hidden/pending, and confirm the deployment host can publish `venue-pages/<slug>/index.html`. Then separately approve a deployment workflow. Do not run the generator against production output until reviewed.

## Acceptance tests still required

- Python syntax and unit tests.
- RPC response contract and eligibility filtering against safe test data.
- Sitemap remains valid XML and preserves all existing canonical URLs.
- Two same-name venues produce distinct stable URLs.
- Pending, rejected, unverified and hidden listings are excluded.
- Page metadata, JSON-LD, image alt text and mobile layout are valid.
- Generated URL returns HTTP 200 from the intended host and canonical matches the URL.
- Google Search Console discovers URLs after deployment; actual indexing is not guaranteed.

## Safety boundaries

No merge, deploy, Supabase schema/RLS changes, customer enquiry changes, CRM changes, or edits to venue owner forms are included. Keep the existing `customer_enquiries` table and enquiry submission path unchanged.
