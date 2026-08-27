(function () {
  "use strict";

  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const section = document.getElementById("featuredVenues");
  const grid = document.getElementById("homeVenueGrid");

  if (!section || !grid) {
    return;
  }

  const client = window.supabase?.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  const escapeHtml = value => String(value ?? "").replace(
    /[&<>'"]/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[character]
  );

  function safeHttpUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function money(value) {
    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) {
      return null;
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(number);
  }

  function capacity(venue) {
    const minimum = Number(venue.capacity_min || 0);
    const maximum = Number(venue.capacity_max || 0);

    if (minimum && maximum) return `${minimum}–${maximum} guests`;
    if (maximum) return `Up to ${maximum} guests`;
    if (minimum) return `${minimum}+ guests`;
    return "On request";
  }

  function pricing(venue) {
    const minimum = money(venue.price_min_per_person);
    const maximum = money(venue.price_max_per_person);

    if (minimum && maximum) return `${minimum}–${maximum}/person`;
    if (minimum) return `${minimum}+/person`;
    if (maximum) return `Up to ${maximum}/person`;
    return "Quote on request";
  }

  function features(venue) {
    const items = [];

    if (venue.food_veg) items.push("Vegetarian");
    if (venue.food_non_veg) items.push("Non-Vegetarian");
    if (venue.parking_available) items.push("Parking");
    if (venue.rooms_available) items.push("Rooms");
    if (venue.catering_available) items.push("Catering");
    if (venue.decoration_available) items.push("Decoration");

    return items.slice(0, 4);
  }

  function renderVenue(venue) {
    const id = encodeURIComponent(String(venue.id || ""));
    const name = String(venue.venue_name || "Venue Partner");
    const imageUrl = safeHttpUrl(venue.cover_image_url);
    const location = [venue.area, venue.city].filter(Boolean).join(", ") || "Location on request";
    const featureList = features(venue);
    const profileUrl = `venue.html?id=${id}`;
    const quoteUrl = `index.html?venue=${id}&venue_name=${encodeURIComponent(name)}#enquiry`;

    const media = imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)} venue" loading="lazy" decoding="async">`
      : `<div class="home-venue-image-fallback" aria-hidden="true">🏨</div>`;

    const featureHtml = featureList.length
      ? featureList.map(item => `<span>✓ ${escapeHtml(item)}</span>`).join("")
      : `<span>Details on request</span>`;

    return `
      <article class="home-venue-card">
        <div class="home-venue-media">
          ${media}
          <div class="home-venue-badges">
            <span class="home-venue-badge">${escapeHtml(venue.venue_type || "Venue")}</span>
            <span class="home-venue-badge verified">✓ Verified</span>
          </div>
        </div>

        <div class="home-venue-content">
          <h3>${escapeHtml(name)}</h3>
          <p class="home-venue-location">⌖ ${escapeHtml(location)}</p>

          <div class="home-venue-facts">
            <div class="home-venue-fact">
              <span>Capacity</span>
              <strong>${escapeHtml(capacity(venue))}</strong>
            </div>
            <div class="home-venue-fact">
              <span>Starting range</span>
              <strong>${escapeHtml(pricing(venue))}</strong>
            </div>
          </div>

          <div class="home-venue-features">${featureHtml}</div>

          <div class="home-venue-actions">
            <a class="secondary-btn" href="${profileUrl}">View Profile</a>
            <a class="primary-btn" href="${quoteUrl}">Get Quote</a>
          </div>
        </div>
      </article>
    `;
  }

  function hideShowcase() {
    grid.innerHTML = "";
    section.hidden = true;
    section.setAttribute("aria-busy", "false");
  }

  function showShowcase() {
    section.hidden = false;
    section.setAttribute("aria-busy", "false");
  }

  async function loadHomepageVenues() {
    if (!client) {
      hideShowcase();
      return;
    }

    const { data, error } = await client.rpc("smv_public_venues");

    if (error) {
      console.error("Homepage venue showcase error:", error);
      hideShowcase();
      return;
    }

    const venues = Array.isArray(data)
      ? data.map(item => item?.venue || item).filter(Boolean)
      : [];

    if (!venues.length) {
      hideShowcase();
      return;
    }

    showShowcase();
    grid.innerHTML = venues
      .slice(0, 6)
      .map(renderVenue)
      .join("");
  }

  loadHomepageVenues();
})();
