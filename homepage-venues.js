(function () {
  "use strict";

  /* =========================================================
     HOMEPAGE FOUNDING VENUE PARTNER OFFER
     Premium two-touchpoint offer for venue owners.
     ========================================================= */

  function installFoundingPartnerOffer() {
    if (document.getElementById("smvFoundingPartnerOffer")) return;

    const style = document.createElement("style");
    style.id = "smvFoundingPartnerOfferStyles";
    style.textContent = `
      .smv-owner-launch-strip{
        position:relative;
        z-index:30;
        width:100%;
        overflow:hidden;
        border-top:1px solid rgba(25,216,189,.10);
        border-bottom:1px solid rgba(25,216,189,.28);
        background:
          radial-gradient(circle at 10% 50%,rgba(25,216,189,.15),transparent 26%),
          radial-gradient(circle at 88% 20%,rgba(243,200,75,.10),transparent 24%),
          linear-gradient(90deg,#03241f 0%,#031a18 48%,#05251f 100%);
        box-shadow:0 12px 36px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.025);
      }

      .smv-owner-launch-strip::after{
        content:"";
        position:absolute;
        left:0;right:0;bottom:0;
        height:2px;
        background:linear-gradient(90deg,transparent,#19d8bd 35%,#f3c84b 64%,transparent);
        opacity:.48;
      }

      .smv-owner-launch-card{
        width:min(100%,1480px);
        min-height:84px;
        margin:0 auto;
        padding:11px 28px;
        display:grid;
        grid-template-columns:auto 1fr auto;
        align-items:center;
        gap:20px;
        color:#f3fbfa;
        position:relative;
      }

      .smv-owner-launch-card::before{
        content:"";
        position:absolute;
        inset:-120% -25%;
        background:linear-gradient(110deg,transparent 45%,rgba(255,255,255,.07) 50%,transparent 55%);
        transform:translateX(-72%);
        animation:smvHomepageOfferShine 6.5s ease-in-out infinite;
        pointer-events:none;
      }

      .smv-owner-launch-badge{
        position:relative;
        z-index:1;
        display:flex;
        align-items:center;
        gap:10px;
        min-width:245px;
        padding:11px 14px;
        border:1px solid rgba(243,200,75,.46);
        border-radius:15px;
        background:linear-gradient(180deg,rgba(243,200,75,.09),rgba(243,200,75,.035));
        box-shadow:inset 0 0 18px rgba(243,200,75,.025),0 8px 22px rgba(0,0,0,.12);
      }

      .smv-owner-launch-badge-icon{
        width:34px;height:34px;
        flex:0 0 34px;
        display:grid;place-items:center;
        border-radius:11px;
        color:#02211c;
        background:linear-gradient(135deg,#f7d76e,#f3c84b);
        font-size:17px;
        font-weight:1000;
        box-shadow:0 0 18px rgba(243,200,75,.18);
      }

      .smv-owner-launch-badge-copy small{
        display:block;
        color:#d5aefb;
        color:#ffe47a;
        font-size:8px;
        font-weight:950;
        letter-spacing:.16em;
        text-transform:uppercase;
        margin-bottom:2px;
      }

      .smv-owner-launch-badge-copy strong{
        display:block;
        color:#fff;
        font-size:12px;
        font-weight:950;
        letter-spacing:.01em;
      }

      .smv-owner-launch-center{
        position:relative;
        z-index:1;
        min-width:0;
      }

      .smv-owner-launch-title{
        display:flex;
        align-items:baseline;
        flex-wrap:wrap;
        gap:6px 10px;
        margin-bottom:6px;
      }

      .smv-owner-launch-title .owner-label{
        color:#fff;
        font-size:13px;
        font-weight:900;
      }

      .smv-owner-launch-title .free-title{
        color:#19d8bd;
        font-size:20px;
        line-height:1;
        font-weight:1000;
        letter-spacing:-.02em;
        text-shadow:0 0 18px rgba(25,216,189,.24);
        animation:smvHomepageFreePulse 1.8s ease-in-out infinite;
      }

      .smv-owner-launch-benefits{
        display:flex;
        flex-wrap:wrap;
        gap:7px;
      }

      .smv-owner-launch-benefits span{
        display:inline-flex;
        align-items:center;
        gap:5px;
        min-height:24px;
        padding:0 8px;
        border-radius:999px;
        border:1px solid rgba(25,216,189,.15);
        background:rgba(25,216,189,.045);
        color:#a9cbc6;
        font-size:9px;
        font-weight:800;
        white-space:nowrap;
      }

      .smv-owner-launch-benefits span::before{
        content:"✓";
        color:#19d8bd;
        font-weight:1000;
      }

      .smv-owner-launch-actions{
        position:relative;
        z-index:1;
        display:flex;
        align-items:center;
        gap:10px;
      }

      .smv-owner-launch-trial{
        display:flex;
        flex-direction:column;
        align-items:flex-end;
        line-height:1.1;
      }

      .smv-owner-launch-trial strong{
        color:#ffe47a;
        font-size:11px;
        font-weight:950;
        white-space:nowrap;
      }

      .smv-owner-launch-trial small{
        margin-top:4px;
        color:#719e98;
        font-size:8px;
        font-weight:750;
        white-space:nowrap;
      }

      .smv-owner-launch-cta{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:46px;
        padding:0 18px;
        border-radius:14px;
        border:1px solid rgba(31,235,207,.48);
        background:linear-gradient(135deg,#20dcc3,#0fc8b0);
        color:#02211c;
        font-size:11px;
        font-weight:1000;
        text-decoration:none;
        white-space:nowrap;
        box-shadow:0 10px 28px rgba(15,200,176,.14),0 0 0 0 rgba(25,216,189,.20);
        animation:smvHomepageCtaPulse 2.1s ease-in-out infinite;
        transition:.2s ease;
      }

      .smv-owner-launch-cta:hover{
        transform:translateY(-2px);
        filter:brightness(1.05);
      }

      #mainNav a.smv-owner-nav-offer{
        position:relative;
        padding:10px 16px;
        border:1px solid rgba(243,200,75,.42);
        border-radius:999px;
        color:#ffe47a!important;
        background:linear-gradient(180deg,rgba(243,200,75,.07),rgba(243,200,75,.025));
        animation:smvOwnerNavGlow 2.4s ease-in-out infinite;
      }

      #mainNav a.smv-owner-nav-offer::before{
        content:"FREE";
        position:absolute;
        top:-9px;
        right:-8px;
        min-width:31px;
        height:17px;
        padding:0 5px;
        display:grid;
        place-items:center;
        border-radius:999px;
        background:#19d8bd;
        color:#02211c;
        font-size:7px;
        font-weight:1000;
        letter-spacing:.08em;
        box-shadow:0 0 14px rgba(25,216,189,.35);
      }

      #mainNav a.smv-owner-nav-offer::after{display:none!important}

      @keyframes smvHomepageFreePulse{
        0%,100%{opacity:1;filter:brightness(1)}
        50%{opacity:.78;filter:brightness(1.2)}
      }

      @keyframes smvHomepageCtaPulse{
        0%,100%{box-shadow:0 10px 28px rgba(15,200,176,.14),0 0 0 0 rgba(25,216,189,.22)}
        50%{box-shadow:0 10px 30px rgba(15,200,176,.20),0 0 0 7px rgba(25,216,189,0)}
      }

      @keyframes smvOwnerNavGlow{
        0%,100%{box-shadow:0 0 0 rgba(243,200,75,0)}
        50%{box-shadow:0 0 18px rgba(243,200,75,.15)}
      }

      @keyframes smvHomepageOfferShine{
        0%,72%,100%{transform:translateX(-72%)}
        86%{transform:translateX(72%)}
      }

      @media (max-width:1150px){
        .smv-owner-launch-card{grid-template-columns:auto 1fr;gap:12px 16px}
        .smv-owner-launch-actions{grid-column:2;justify-content:flex-start}
        .smv-owner-launch-badge{grid-row:1 / span 2}
      }

      @media (max-width:760px){
        .smv-owner-launch-card{display:flex;flex-wrap:wrap;gap:10px;padding:12px 16px}
        .smv-owner-launch-badge{min-width:0;flex:1 1 210px}
        .smv-owner-launch-center{flex:1 1 100%}
        .smv-owner-launch-actions{width:100%;justify-content:space-between}
        .smv-owner-launch-title .free-title{font-size:18px}
      }

      @media (max-width:520px){
        .smv-owner-launch-card{padding:10px 12px}
        .smv-owner-launch-badge{padding:9px 10px;border-radius:13px}
        .smv-owner-launch-badge-icon{width:30px;height:30px;flex-basis:30px}
        .smv-owner-launch-title{margin-bottom:7px}
        .smv-owner-launch-title .owner-label{font-size:11px}
        .smv-owner-launch-title .free-title{font-size:16px}
        .smv-owner-launch-benefits span{font-size:8px;min-height:22px}
        .smv-owner-launch-trial{align-items:flex-start}
        .smv-owner-launch-trial small{white-space:normal}
        .smv-owner-launch-cta{min-height:42px;padding:0 14px;font-size:10px}
      }

      @media (prefers-reduced-motion:reduce){
        .smv-owner-launch-card::before,
        .smv-owner-launch-title .free-title,
        .smv-owner-launch-cta,
        #mainNav a.smv-owner-nav-offer{
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
        <div class="smv-owner-launch-card">
          <a class="smv-owner-launch-badge" href="list-your-venue.html" aria-label="Founding Venue Partner offer">
            <span class="smv-owner-launch-badge-icon">★</span>
            <span class="smv-owner-launch-badge-copy">
              <small>Limited Launch Opportunity</small>
              <strong>FOUNDING VENUE PARTNER</strong>
            </span>
          </a>

          <div class="smv-owner-launch-center">
            <div class="smv-owner-launch-title">
              <span class="owner-label">VENUE OWNER?</span>
              <span class="free-title">LIST YOUR VENUE FREE</span>
            </div>
            <div class="smv-owner-launch-benefits" aria-label="Partner offer benefits">
              <span>₹0 Joining Fee</span>
              <span>Professional Venue Profile</span>
              <span>Partner CRM Access</span>
              <span>No Commission to Join</span>
            </div>
          </div>

          <div class="smv-owner-launch-actions">
            <span class="smv-owner-launch-trial">
              <strong>10-DAY COMPLIMENTARY LAUNCH TRIAL</strong>
              <small>No payment required to get started</small>
            </span>
            <a class="smv-owner-launch-cta" href="list-your-venue.html">JOIN FREE →</a>
          </div>
        </div>
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
    if (!Number.isFinite(number) || number <= 0) return null;
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
            <div class="home-venue-fact"><span>Capacity</span><strong>${escapeHtml(capacity(venue))}</strong></div>
            <div class="home-venue-fact"><span>Starting range</span><strong>${escapeHtml(pricing(venue))}</strong></div>
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
    grid.innerHTML = venues.slice(0, 6).map(renderVenue).join("");
  }

  loadHomepageVenues();
})();