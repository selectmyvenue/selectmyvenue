import { createClient } from "npm:@supabase/supabase-js@2";

type Venue = {
  id: string;
  venue_name?: string | null;
  venue_type?: string | null;
  description?: string | null;
  city?: string | null;
  area?: string | null;
  capacity_min?: number | null;
  capacity_max?: number | null;
  price_min_per_person?: number | null;
  price_max_per_person?: number | null;
  food_veg?: boolean | null;
  food_non_veg?: boolean | null;
  parking_available?: boolean | null;
  rooms_available?: boolean | null;
  catering_available?: boolean | null;
  decoration_available?: boolean | null;
  event_types?: string[] | null;
  cover_image_url?: string | null;
  google_maps_url?: string | null;
  featured?: boolean | null;
};

type Requirement = {
  eventType?: string;
  city?: string;
  locality?: string;
  guests?: number;
  budgetPerPerson?: number;
  venueType?: string;
  food?: string;
  facilities?: string[];
  limit?: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://selectmyvenue.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function clean(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function norm(value: unknown): string {
  return clean(value, 240).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizeCity(value: unknown): "Delhi" | "Gurgaon" | "" {
  const city = norm(value);
  if (city === "delhi" || city.includes("new delhi")) return "Delhi";
  if (city.includes("gurgaon") || city.includes("gurugram")) return "Gurgaon";
  return "";
}

function finitePositive(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function boolKnown(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function venueCity(v: Venue): "Delhi" | "Gurgaon" | "" {
  return normalizeCity(v.city) || normalizeCity(v.area);
}

function hasText(haystack: unknown, needle: string): boolean {
  return !!needle && norm(haystack).includes(needle);
}

export function scoreVenue(v: Venue, req: Requirement) {
  const reasons: string[] = [];
  const missing: string[] = [];
  let score = 0;
  let excluded = false;

  const wantedCity = normalizeCity(req.city);
  if (wantedCity) {
    const actualCity = venueCity(v);
    if (actualCity && actualCity !== wantedCity) excluded = true;
    else if (actualCity === wantedCity) {
      score += 15;
      reasons.push(wantedCity === "Gurgaon" ? "Located in Gurgaon / Gurugram" : "Located in Delhi");
    } else missing.push("city needs confirmation");
  }

  const locality = norm(req.locality);
  if (locality) {
    if (hasText(v.area, locality)) {
      score += 10;
      reasons.push(`Located in ${clean(v.area)}`);
    } else if (hasText(v.city, locality) || hasText(v.area, locality)) {
      score += 5;
      reasons.push("Location is within the requested city/area");
    } else if (!v.area && !v.city) missing.push("locality needs confirmation");
  }

  const guests = finitePositive(req.guests);
  const minCap = finitePositive(v.capacity_min);
  const maxCap = finitePositive(v.capacity_max);
  if (guests) {
    if (maxCap && guests > maxCap) excluded = true;
    else if (maxCap && (!minCap || guests >= minCap)) {
      score += 20;
      reasons.push(`Listed capacity up to ${maxCap} guests`);
    } else if (minCap && guests < minCap) {
      score += 8;
      reasons.push(`Listed minimum capacity is ${minCap} guests`);
    } else missing.push("capacity needs confirmation");
  }

  const budget = finitePositive(req.budgetPerPerson);
  const low = finitePositive(v.price_min_per_person);
  const high = finitePositive(v.price_max_per_person);
  if (budget) {
    if (low && budget < low) {
      // A customer's maximum below a published minimum is a known conflict.
      excluded = true;
    } else if (low || high) {
      score += 20;
      reasons.push("Published per-person price range is available for comparison");
    } else missing.push("price needs confirmation");
  }

  const event = norm(req.eventType);
  const eventTypes = Array.isArray(v.event_types) ? v.event_types : [];
  if (event) {
    if (eventTypes.length && eventTypes.some((x) => norm(x).includes(event) || event.includes(norm(x)))) {
      score += 15;
      reasons.push(`Event type listed: ${clean(req.eventType)}`);
    } else if (eventTypes.length) {
      // Listed event types are explicit data; do not exclude unless the field
      // is known to be an exhaustive restriction (not established in schema).
      missing.push("event suitability needs confirmation");
    } else missing.push("event suitability needs confirmation");
  }

  const wantedType = norm(req.venueType);
  if (wantedType) {
    if (norm(v.venue_type) === wantedType || norm(v.venue_type).includes(wantedType) || wantedType.includes(norm(v.venue_type))) {
      score += 10;
      reasons.push(`Venue type: ${clean(v.venue_type)}`);
    } else if (v.venue_type) {
      // A preference is not a hard must-have.
      missing.push("preferred venue type not confirmed");
    } else missing.push("venue type needs confirmation");
  }

  const food = norm(req.food);
  if (food) {
    const veg = boolKnown(v.food_veg);
    const nonVeg = boolKnown(v.food_non_veg);
    if ((food.includes("veg") && !food.includes("non") && veg === true) ||
        (food.includes("non") && nonVeg === true) ||
        (food.includes("both") && veg === true && nonVeg === true)) {
      score += 5;
      reasons.push("Food preference is supported by the listing");
    } else if (veg === false || nonVeg === false) {
      missing.push("food preference needs confirmation");
    } else missing.push("food options need confirmation");
  }

  const facilities = Array.isArray(req.facilities) ? req.facilities.slice(0, 8) : [];
  const facilityFields: Record<string, keyof Venue> = {
    parking: "parking_available",
    rooms: "rooms_available",
    catering: "catering_available",
    decoration: "decoration_available",
  };
  let facilityPoints = 0;
  for (const item of facilities) {
    const key = norm(item);
    const field = facilityFields[key];
    if (!field) {
      missing.push(`${clean(item)} needs confirmation`);
      continue;
    }
    if (v[field] === true) {
      facilityPoints += 2.5;
      reasons.push(`${clean(item)} listed`);
    } else missing.push(`${clean(item)} needs confirmation`);
  }
  score += Math.min(10, facilityPoints);

  return {
    excluded,
    score: Math.min(100, Math.round(score)),
    reasons: [...new Set(reasons)].slice(0, 8),
    missing: [...new Set(missing)].slice(0, 8),
  };
}

export function rankVenues(venues: Venue[], req: Requirement) {
  return venues
    .filter((v) => !!v && !!v.id && !!clean(v.venue_name))
    .map((venue) => ({ venue, match: scoreVenue(venue, req) }))
    .filter((row) => !row.match.excluded)
    .sort((a, b) =>
      b.match.score - a.match.score ||
      Number(!!b.venue.featured) - Number(!!a.venue.featured) ||
      clean(a.venue.venue_name).localeCompare(clean(b.venue.venue_name))
    )
    .slice(0, Math.max(1, Math.min(12, Number(req.limit) || 6)))
    .map(({ venue, match }) => ({
      id: venue.id,
      name: clean(venue.venue_name),
      type: clean(venue.venue_type),
      city: clean(venue.city),
      area: clean(venue.area),
      capacityMin: finitePositive(venue.capacity_min),
      capacityMax: finitePositive(venue.capacity_max),
      priceMinPerPerson: finitePositive(venue.price_min_per_person),
      priceMaxPerPerson: finitePositive(venue.price_max_per_person),
      foodVeg: boolKnown(venue.food_veg),
      foodNonVeg: boolKnown(venue.food_non_veg),
      facilities: {
        parking: boolKnown(venue.parking_available),
        rooms: boolKnown(venue.rooms_available),
        catering: boolKnown(venue.catering_available),
        decoration: boolKnown(venue.decoration_available),
      },
      eventTypes: Array.isArray(venue.event_types) ? venue.event_types.slice(0, 20) : [],
      image: clean(venue.cover_image_url, 1000),
      mapUrl: clean(venue.google_maps_url, 1000),
      matchScore: match.score,
      reasons: match.reasons,
      needsConfirmation: match.missing,
      scoreLabel: "Relevance score out of 100 — not a booking probability",
    }));
}

function validateRequirement(input: unknown): Requirement | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const guests = finitePositive(raw.guests);
  const budgetPerPerson = finitePositive(raw.budgetPerPerson);
  const facilities = Array.isArray(raw.facilities)
    ? raw.facilities.filter((x): x is string => typeof x === "string").map((x) => clean(x, 40)).slice(0, 8)
    : [];
  return {
    eventType: clean(raw.eventType, 80),
    city: clean(raw.city, 80),
    locality: clean(raw.locality, 100),
    guests: guests && guests <= 100000 ? guests : undefined,
    budgetPerPerson: budgetPerPerson && budgetPerPerson <= 10000000 ? budgetPerPerson : undefined,
    venueType: clean(raw.venueType, 80),
    food: clean(raw.food, 40),
    facilities,
    limit: Math.max(1, Math.min(12, Number(raw.limit) || 6)),
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && origin !== "https://selectmyvenue.com" && origin !== "https://www.selectmyvenue.com") {
    return json({ error: "Origin not allowed." }, 403);
  }
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const contentLength = Number(req.headers.get("Content-Length") || 0);
  if (contentLength > 12000) return json({ error: "Request is too large." }, 413);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 12000) return json({ error: "Request is too large." }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON request." }, 400);
  }

  const requirement = validateRequirement(body.requirement);
  if (!requirement) return json({ error: "Please provide a valid requirement object." }, 400);
  if (!normalizeCity(requirement.city)) return json({ error: "Please choose Delhi or Gurgaon / Gurugram." }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !publishableKey) return json({ error: "Venue discovery is temporarily unavailable." }, 503);

  try {
    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // This RPC is the authoritative public-listing gate. Never query the
    // venues table directly or relax its approved/verified/public predicates.
    const { data, error } = await supabase.rpc("smv_public_venues");
    if (error) {
      console.error("Public venue inventory lookup failed:", error.message);
      return json({ error: "We could not load verified venues right now." }, 503);
    }

    const venues = (Array.isArray(data) ? data : [])
      .map((row: { venue?: Venue }) => row?.venue)
      .filter((venue: Venue | undefined): venue is Venue => !!venue)
      .filter((venue: Venue) => !!venue.id && !!clean(venue.venue_name))
      .filter((venue: Venue) => !!venueCity(venue));

    const results = rankVenues(venues, requirement);
    return json({
      results,
      totalEligible: venues.length,
      returned: results.length,
      requirement,
      matchingMethod: "Explainable deterministic ranking over the verified public inventory",
      availability: "Not checked — confirm date and package directly with the venue",
    });
  } catch (error) {
    console.error("Venue discovery failed:", error);
    return json({ error: "Venue discovery is temporarily unavailable." }, 503);
  }
});
