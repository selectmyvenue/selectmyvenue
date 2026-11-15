import { createClient } from "npm:@supabase/supabase-js@2";

const allowed = new Set(["https://selectmyvenue.com", "https://www.selectmyvenue.com"]);
const cors = (origin: string | null) => ({
  "Vary": "Origin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  ...(origin && allowed.has(origin) ? {"Access-Control-Allow-Origin": origin} : {}),
});
const response = (body: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {status, headers: {"Content-Type":"application/json", ...cors(origin)}});
const clean = (value: unknown, max = 120) => String(value ?? "").trim().slice(0, max);
const norm = (value: unknown) => clean(value).toLowerCase().replace(/gurugram/g, "gurgaon").replace(/\s+/g, " ");

async function hash(value: string, key: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value + ":" + key));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function score(venue: any, request: any) {
  const city = norm(venue.city), wantedCity = norm(request.city);
  if (!city || !wantedCity || !city.includes(wantedCity)) return null;
  const max = Number(venue.capacity_max || 0), min = Number(venue.capacity_min || 0);
  const guests = Number(request.guests || 0), price = Number(venue.price_min_per_person || 0);
  const budget = Number(request.budgetPerPerson || 0);
  if ((guests && max && max < guests) || (budget && price && price > budget)) return null;
  let relevanceScore = 30;
  const matchReasons: string[] = ["City matches"];
  if (request.area && norm(venue.area).includes(norm(request.area))) { relevanceScore += 20; matchReasons.push("Area matches"); }
  if (guests && max && max >= guests && (!min || min <= guests)) { relevanceScore += 20; matchReasons.push("Capacity fits"); }
  if (budget && price && price <= budget) { relevanceScore += 15; matchReasons.push("Published price fits"); }
  if (request.venueType && norm(venue.venue_type).includes(norm(request.venueType))) { relevanceScore += 10; matchReasons.push("Venue type matches"); }
  const events = Array.isArray(venue.event_types) ? venue.event_types.map(norm) : [];
  if (events.some((event: string) => event.includes(norm(request.eventType)))) { relevanceScore += 10; matchReasons.push("Event type listed"); }
  const food = norm(request.food);
  if (food === "veg" && venue.food_veg === true) { relevanceScore += 5; matchReasons.push("Vegetarian option listed"); }
  if (food === "non-veg" && venue.food_non_veg === true) { relevanceScore += 5; matchReasons.push("Non-vegetarian option listed"); }
  if (food === "both" && venue.food_veg === true && venue.food_non_veg === true) { relevanceScore += 5; matchReasons.push("Veg and non-veg options listed"); }
  const needsConfirmation = [
    !max ? "Capacity to confirm" : "",
    !price ? "Price to confirm" : "",
    food === "jain" ? "Jain food availability to confirm" : "",
  ].filter(Boolean);
  return {...venue, relevanceScore, matchReasons, needsConfirmation};
}

Deno.serve(async req => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", {headers:cors(origin)});
  if (origin && !allowed.has(origin)) return response({error:"Origin not allowed"}, 403, origin);
  if (req.method !== "POST") return response({error:"Method not allowed"}, 405, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return response({error:"Search service not configured"}, 503, origin);
  let body: any;
  try { body = await req.json(); } catch { return response({error:"Invalid request"}, 400, origin); }
  if (clean(body.website)) return response({success:true, venues:[], crmLeadCreated:false}, 200, origin);

  const eventType = clean(body.eventType, 80);
  const city = clean(body.city, 80);
  const area = clean(body.area, 100);
  const customerName = clean(body.customerName, 100);
  const mobile = clean(body.mobile, 10);
  const guests = body.guests === "" || body.guests == null ? null : Number(body.guests);
  const budget = body.budgetPerPerson === "" || body.budgetPerPerson == null ? null : Number(body.budgetPerPerson);
  const eventDate = clean(body.eventDate, 10);
  const venueType = clean(body.venueType, 80);
  const food = clean(body.food, 40);

  if (!eventType || !["Delhi", "Gurgaon"].includes(city)) return response({error:"Select a valid occasion and city"}, 400, origin);
  if (customerName.length < 2 || !/^[6-9]\d{9}$/.test(mobile)) return response({error:"Enter your name and a valid 10-digit Indian mobile number"}, 400, origin);
  if (body.contactConsent !== "yes") return response({error:"Please confirm contact permission"}, 400, origin);
  if (guests !== null && (!Number.isInteger(guests) || guests < 1 || guests > 100000)) return response({error:"Check guest count"}, 400, origin);
  if (budget !== null && (!Number.isFinite(budget) || budget < 0 || budget > 10000000)) return response({error:"Check budget"}, 400, origin);
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return response({error:"Check event date"}, 400, origin);

  const db = createClient(url, key, {auth:{persistSession:false, autoRefreshToken:false}});
  const ip = clean(req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown", 120);
  const ipHash = await hash(ip, key);
  const since = new Date(Date.now() - 600000).toISOString();
  const {count, error: rateError} = await db.from("smv_public_search_rate_limits").select("id", {count:"exact", head:true}).eq("ip_hash", ipHash).gte("created_at", since);
  if (rateError) return response({error:"Search temporarily unavailable"}, 503, origin);
  if ((count || 0) >= 8) return response({error:"Too many searches. Try again in a few minutes."}, 429, origin);
  const {error: limitError} = await db.from("smv_public_search_rate_limits").insert({ip_hash:ipHash});
  if (limitError) return response({error:"Search temporarily unavailable"}, 503, origin);

  const request = {eventType, city, area, guests, budgetPerPerson:budget, venueType, food};
  const {data: rows, error: venueError} = await db.rpc("smv_public_venues");
  if (venueError || !Array.isArray(rows)) return response({error:"Venue list unavailable"}, 503, origin);
  const venues = rows.map((row: any) => row?.venue || row).map((venue: any) => score(venue, request)).filter(Boolean)
    .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore).slice(0, 12);

  let duplicateQuery = db.from("customer_enquiries")
    .select("id")
    .eq("mobile", mobile)
    .eq("occasion", eventType)
    .eq("location", city)
    .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
  duplicateQuery = eventDate ? duplicateQuery.eq("event_date", eventDate) : duplicateQuery.is("event_date", null);
  const {data: existing, error: duplicateError} = await duplicateQuery
    .order("created_at", {ascending:false}).limit(1).maybeSingle();
  if (duplicateError) return response({error:"Could not verify your enquiry. Please try again."}, 503, origin);

  let leadId = existing?.id ?? null;
  if (!leadId) {
    const requirements = [
      area ? "Preferred area: " + area : "",
      venueType ? "Venue type: " + venueType : "",
      food ? "Food preference: " + food : "",
      guests ? "Guests: " + guests : "",
      budget !== null ? "Maximum budget/person: ₹" + budget : "",
      eventDate ? "Event date: " + eventDate : "",
      "Lead captured through homepage venue search.",
    ].filter(Boolean).join("\n");
    const {data: lead, error: insertError} = await db.from("customer_enquiries").insert({
      location: city,
      occasion: eventType,
      guests,
      budget_per_person: budget,
      food_preference: food || null,
      event_date: eventDate || null,
      customer_name: customerName,
      mobile,
      source: "Website - Homepage Venue Search",
      status: "new",
      priority: "normal",
      call_outcome: "Not Connected",
      preferred_city: city,
      preferred_area: area || null,
      venue_type_preference: venueType || null,
      requirements,
      requirements_structured: {capture_source:"homepage_venue_search", event_type:eventType, city, preferred_area:area || null, event_date:eventDate || null, guests, budget_per_person:budget, venue_type:venueType || null, food_preference:food || null},
    }).select("id").single();
    if (insertError || !lead) return response({error:"Your enquiry could not be saved. Please try again."}, 503, origin);
    leadId = lead.id;
  }

  return response({success:true, crmLeadCreated:true, leadId, venues}, 200, origin);
});