import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://selectmyvenue.com",
  "https://www.selectmyvenue.com",
]);
const clean = (value: unknown, max = 140) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");
async function hash(value: string, key: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value + ":" + key));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
const headers = (origin: string | null) => ({
  "Content-Type": "application/json",
  "Vary": "Origin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
});
const reply = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: headers(origin) });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (origin && !allowedOrigins.has(origin)) return reply({ error: "Origin not allowed." }, 403, origin);
  if (req.method !== "POST") return reply({ error: "Method not allowed." }, 405, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return reply({ error: "Venue application service is not configured." }, 503, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Please submit the form again." }, 400, origin);
  }

  // Honeypot: silently accept automated submissions without creating a CRM record.
  if (clean(body.website, 180)) return reply({ success: true, message: "Application received." }, 200, origin);

  const venueName = clean(body.venueName, 140);
  const contactPerson = clean(body.ownerName, 120);
  const mobile = digits(body.mobile);
  const venueType = clean(body.venueType, 80);
  const capacity = Number(body.capacity);
  const city = clean(body.city, 80);
  const area = clean(body.area, 100);
  const consent = body.consent === true;

  if (venueName.length < 2 || contactPerson.length < 2) {
    return reply({ error: "Please enter the venue and contact person's name." }, 400, origin);
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return reply({ error: "Please enter a valid 10-digit Indian mobile number." }, 400, origin);
  }
  if (!venueType || !city || !area || !Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
    return reply({ error: "Please check venue type, capacity, city and area." }, 400, origin);
  }
  if (!consent) return reply({ error: "Please confirm that you are authorised to share these details." }, 400, origin);

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // Reuse the existing public-intake rate-limit table with a separate venue-listing bucket.
  const ip = clean(req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown", 120);
  const ipHash = await hash("venue-listing:" + ip, serviceKey);
  const rateSince = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count, error: rateError } = await db
    .from("smv_public_search_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", rateSince);
  if (rateError) {
    console.error("Venue application rate-limit check failed:", rateError);
    return reply({ error: "We could not verify the application right now. Please try again." }, 503, origin);
  }
  if ((count || 0) >= 8) return reply({ error: "Too many applications. Please try again in a few minutes or call SMV." }, 429, origin);
  const { error: rateInsertError } = await db.from("smv_public_search_rate_limits").insert({ ip_hash: ipHash });
  if (rateInsertError) {
    console.error("Venue application rate-limit record failed:", rateInsertError);
    return reply({ error: "We could not verify the application right now. Please try again." }, 503, origin);
  }

  // Prevent accidental repeat submissions and basic number-based form abuse.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent, error: recentError } = await db
    .from("venues")
    .select("id,venue_name,venue_status")
    .eq("contact_mobile", mobile)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(6);
  if (recentError) {
    console.error("Venue application duplicate check failed:", recentError);
    return reply({ error: "We could not verify the application right now. Please try again." }, 503, origin);
  }

  const sameVenue = (recent || []).find(row => clean(row.venue_name).toLowerCase() === venueName.toLowerCase());
  if (sameVenue) {
    return reply({ success: true, duplicate: true, message: "We already have an application for this venue. Our team will contact you." }, 200, origin);
  }
  if ((recent || []).length >= 5) {
    return reply({ error: "We have received several applications from this number today. Please contact our team for help." }, 429, origin);
  }

  const trialStartedAt = new Date();
  const trialExpiresAt = new Date(trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data, error } = await db.from("venues").insert({
    venue_name: venueName,
    contact_person: contactPerson,
    contact_mobile: mobile,
    whatsapp_number: mobile,
    venue_type: venueType,
    capacity_max: capacity,
    city,
    area,
    venue_status: "pending",
    verification_status: "pending",
    public_listing_enabled: false,
    featured: false,
    partner_plan: "launch_trial",
    plan_status: "trialing",
    plan_started_at: trialStartedAt.toISOString(),
    plan_expires_at: trialExpiresAt.toISOString(),
    partner_notes: "Website venue listing application. Submitted via list-your-venue.html; awaiting SMV team contact and verification.",
  }).select("id").single();

  if (error || !data?.id) {
    console.error("Venue listing application insert failed:", error);
    return reply({ error: "Your application could not be saved. Please try again or call +91 83683 22256." }, 503, origin);
  }

  return reply({
    success: true,
    applicationId: data.id,
    message: "Your venue application has been received. The Select My Venue team will contact you.",
  }, 200, origin);
});
