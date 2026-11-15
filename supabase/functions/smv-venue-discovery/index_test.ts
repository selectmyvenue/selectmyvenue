import { assertEquals } from "jsr:@std/assert@1";
import { normalizeCity, rankVenues, scoreVenue } from "./index.ts";

const base = {
  id: "venue-1",
  venue_name: "Verified Banquet",
  venue_type: "Banquet Hall",
  city: "Gurugram",
  area: "Sector 29",
  capacity_min: 100,
  capacity_max: 300,
  price_min_per_person: 1200,
  price_max_per_person: 1800,
  food_veg: true,
  food_non_veg: true,
  parking_available: true,
  rooms_available: null,
  catering_available: true,
  decoration_available: false,
  event_types: ["Wedding", "Reception"],
};

Deno.test("normalizes Delhi and Gurgaon aliases", () => {
  assertEquals(normalizeCity("New Delhi"), "Delhi");
  assertEquals(normalizeCity("Gurugram"), "Gurgaon");
  assertEquals(normalizeCity("Noida"), "");
});

Deno.test("ranks matching venue with evidence-backed reasons", () => {
  const result = rankVenues([base], {
    city: "Gurgaon",
    locality: "Sector 29",
    eventType: "Wedding",
    guests: 200,
    budgetPerPerson: 1500,
    venueType: "Banquet Hall",
    food: "Both",
    facilities: ["parking", "catering"],
  });
  assertEquals(result.length, 1);
  assertEquals(result[0].matchScore, 100);
  assertEquals(result[0].reasons.includes("Located in Gurgaon / Gurugram"), true);
  assertEquals(result[0].reasons.includes("Listed capacity up to 300 guests"), true);
});

Deno.test("excludes known city and maximum-capacity conflicts", () => {
  const wrongCity = scoreVenue({ ...base, city: "Delhi" }, { city: "Gurgaon" });
  const tooSmall = scoreVenue(base, { guests: 450 });
  assertEquals(wrongCity.excluded, true);
  assertEquals(tooSmall.excluded, true);
});

Deno.test("does not award positive points for missing price or capacity", () => {
  const result = scoreVenue({
    ...base,
    price_min_per_person: null,
    price_max_per_person: null,
    capacity_min: null,
    capacity_max: null,
  }, { budgetPerPerson: 1500, guests: 200 });
  assertEquals(result.score, 0);
  assertEquals(result.missing.includes("price needs confirmation"), true);
  assertEquals(result.missing.includes("capacity needs confirmation"), true);
});

Deno.test("keeps preference mismatches non-fatal and returns confirmation notes", () => {
  const result = rankVenues([{ ...base, venue_type: "Farmhouse" }], {
    city: "Gurgaon",
    venueType: "Banquet Hall",
    limit: 3,
  });
  assertEquals(result.length, 1);
  assertEquals(result[0].needsConfirmation.includes("preferred venue type not confirmed"), true);
});
