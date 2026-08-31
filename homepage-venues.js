(function () {
  "use strict";

  /* =========================================================
     HOMEPAGE FOUNDING VENUE PARTNER OFFER
     Adds two highly-visible touchpoints without changing the
     customer enquiry, CRM or venue-directory functionality.
     ========================================================= */

  function installFoundingPartnerOffer() {
    if (document.getElementById("smvFoundingPartnerOffer")) return;

    const style = document.createElement("style");
    style.id = "smvFoundingPartnerOfferStyles";
    style.textContent = `
      .smv-owner-launch-strip{
        position:relative;
        z-index:20;
        width:100%;
        overflow:hidden;
        border-bottom:1px solid rgba(25,216,189,.34);
        background:
          radial-gradient(circle at 15% 50%,rgba(25,216,189,.14),transparent 30%),
          radial-gradient(circle at 88% 50%,rgba(243,200,75,.10),transparent 25%),
          linear-gradient(90deg,#03231f 0%,#041b19 52%,#052520 100%);
        box-shadow:0 10px 34px rgba(0,0,0,.20);
      }

      .smv-owner-launch-link{
        width:min(100%,1440px);
        min-height:66px;
        margin:0 auto;
        padding:10px 28px;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:15px;
        color:#f3fbfa;
        text-decoration:none;
        position:relative;
      }

      .smv-owner-launch-link::before{
        content:"";
        position:absolute;
        inset:-90% -20%;
        background:linear-gradient(110deg,transparent 45%,rgba(255,255,255,.08) 50%,transparent 55%);
        transform:translateX(-60%);
        animation:smvHomepageOfferShine 5.5s ease-in-out infinite;
        pointer-events:none;
      }

      .smv-owner-launch-pill{
        position:relative;
        z-index:1;
        display:inline-flex;
        align-items:center;
        gap:8px;
        flex:0 0 auto;
        padding:7px 12px;
        border:1px solid rgba(243,200,75,.48);
        border-radius:999px;
        background:rgba(243,200,75,.08);
        color:#ffe47a;
        font-size:10px;
        font-weight:950;
        letter-spacing:.12em;
        text-transform:uppercase;
        white-space:nowrap;
      }

      .smv-owner-launch-dot{
        width:8px;
        height:8px;
        border-radius:50%;
        background:#19d8bd;
        box-shadow:0 0 15px rgba(25,216,189,.95);
        animation:smvHomepageBlink 1.25s ease-in-out infinite;
      }

      .smv-owner-launch-main{
        position:relative;
        z-index:1;
        display:flex;
        align-items:center;
        justify-content:center;
        flex-wrap:wrap;
        gap:7px 10px;
        text-align:center;
        line-height:1.25;
      }

      .smv-owner-launch-main strong{
        color:#ffffff;
        font-size:14px;
        font-weight:950;
      }

      .smv-owner-launch-main .smv-free{
        color:#19d8bd;
        font-size:16px;
        font-weight:1000;
        text-shadow:0 0 17px rgba(25,216,189,.28);
        animation:smvHomepageFreePulse 1.6s ease-in-out infinite;
      }

      .smv-owner-launch-main span{
        color:#9bc8c2;
        font-size:12px;
        font-weight:750;
      }

      .smv-owner-launch-cta{
        position:relative;
        z-index:1;
        flex:0 0 auto;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:38px;
        padding:0 15px;
        border-radius:999px;
        border:1px solid rgba(25,216,189,.48);
        background:linear-gradient(135deg,#19d8bd,#0fc8b0);
        color:#02211c;
        font-size:11px;
        font-weight:950;
        white-space:nowrap;
        box-shadow:0 0 0 0 rgba(25,216,189,.24);
        animation:smvHomepageCtaPulse 1.9s ease-in-out infinite;
      }

      #mainNav a.smv-owner-nav-offer{
        position:relative;
        padding:9px 13px;
        border:1px solid rgba(243,200,75,.42);
        border-radius:999px;
        color:#ffe47a!important;
        background:rgba(243,200,75,.055);
        box-shadow:0 0 0 rgba(243,200,75,0);
        animation:smvOwnerNavGlow 2.2s ease-in-out infinite;
      }

      #mainNav a.smv-owner-nav-offer::before{
        content:"FREE";
        position:absolute;
        top:-10px;
        right:-8px;
        min-width:30px;
        height:17px;
        padding:0 5px;
        display:grid;
        place-items:center;
        border-radius:999px;
        background:#19d8bd;
        color:#02211c;
        font-size:7px;
        line-height:1;
        font-weight:1000;
        letter-spacing:.08em;
        box-shadow:0 0 12px rgba(25,216,189,.38);
        animation:smvHomepageBlink 1.25s ease-in-out infinite;
      }

      #mainNav a.smv-owner-nav-offer::after{display:none!important}

      @keyframes smvHomepageBlink{
        0%,100%{opacity:1;transform:scale(1)}
        50%{opacity:.45;transform:scale(.86)}
      }

      @keyframes smvHomepageFreePulse{
        0%,100%{opacity:1;filter:brightness(1)}
        50%{opacity:.72;filter:brightness(1.28)}
      }

      @keyframes smvHomepageCtaPulse{
        0%,100%{box-shadow:0 0 0 0 rgba(25,216,189,.26),0 8px 22px rgba(0,0,0,.16)}
        50%{box-shadow:0 0 0 8px rgba(25,216,189,0),0 0 26px rgba(25,216,189,.20)}
      }

      @keyframes smvOwnerNavGlow{
        0%,100%{box-shadow:0 0 0 rgba(243,200,75,0)}
        50%{box-shadow:0 0 18px rgba(243,200,75,.16)}
      }

      @keyframes smvHomepageOfferShine{
        0%,68%,100%{transform:translateX(-65%)}
        82%{transform:translateX(65%)}
      }

      @media (max-width:900px){
        .smv-owner-launch-link{
          min-height:86px;
          padding:10px 16px;
          flex-wrap:wrap;
          gap:7px 10px;
        }
        .smv-owner-launch-main{width:100%;order:2}
        .smv-owner-launch-pill{order:1}
        .smv-owner-launch-cta{order:1}
        .smv-owner-launch-main strong{font-size:13px}
        .smv-owner-launch-main .smv-free{font-size:15px}
        .smv-owner-launch-main span{font-size:11px}
      }

      @media (max-width:520px){
        .smv-owner-launch-link{min-height:104px;padding:9px 11px}
        .smv-owner-launch-pill{font-size:8px;padding:6px 9px}
        .smv-owner-launch-cta{min-height:34px;font-size:10px;padding:0 11px}
        .smv-owner-launch-main{gap:4px 7px}
        .smv-owner-launch-main strong{font-size:12px}
        .smv-owner-launch-main .smv-free{font-size:14px}
        .smv-owner-launch-main span{font-size:10px}
      }

      @media (prefers-reduced-motion:reduce){
        .smv-owner-launch-link::before,
        .smv-owner-launch-dot,
        .smv-owner-launch-main .smv-free,
        .smv-owner-launch-cta,
        #mainNav a.smv-owner-nav-offer,
        #mainNav a.smv-owner-nav-offer::before{
          animation:none!important;
        }
      }
    `;
    document.head.appendChild(style);

    const main = document.querySelector("main");
    const hero = document.getElementById("home");

    if (main && hero) {
      const strip = document.createElement("section");
      strip.id = "smvFoundingPartnerOffer";
      strip.className = "smv-owner-launch-strip";
      strip.setAttribute("aria-label", "Founding Venue Partner launch offer");
      strip.innerHTML = `
        <a class="smv-owner-launch-link" href="list-your-venue.html">
          <span class="smv-owner-launch-pill"><span class="smv-owner-launch-dot"></span> FOUNDING VENUE PARTNER OFFER</span>
          <span class="smv-owner-launch-main">
            <strong>VENUE OWNERS:</strong>
            <span class="smv-free">LIST YOUR VENUE FREE</span>
            <span>• ₹0 Joining Fee • Partner CRM • 10-Day Complimentary Launch Trial</span>
          </span>
          <span class="smv-owner-launch-cta">JOIN FREE →</span>
        </a>
      `;
      main.insertBefore(strip, hero);
    }

    const navOffer = document.querySelector('#mainNav a[href="list-your-venue.html"]');
    if (navOffer) {
      navOffer.classList.add("smv-owner-nav-offer");
      navOffer.setAttribute("title", "Founding Venue Partner Offer — List Your Venue FREE");
      navOffer.setAttribute("aria-label", "List Your Venue FREE — Founding Venue Partner Offer");
    }
  }

  installFoundingPartnerOffer();

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
    /[&<>'\"]/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '\"': "&quot;"
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
