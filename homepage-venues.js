(function () {
  "use strict";

  if (!document.getElementById("smvPerformanceStability")) {
    const link = document.createElement("link");
    link.id = "smvPerformanceStability";
    link.rel = "stylesheet";
    link.href = "performance-stability.css?v=20260909-compact-lead-2";
    document.head.appendChild(link);
  }

  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";

  const clean = value => String(value == null ? "" : value).trim();
  const mobileDigits = value => clean(value).replace(/[^0-9]/g, "").slice(-10);
  const escapeHtml = value => String(value ?? "").replace(/[&<>'\"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '\"': "&quot;"
  })[character]);

  function shortPageName() {
    const path = (location.pathname || "/").toLowerCase();
    if (path === "/" || path.endsWith("/index.html")) return "Home page";
    if (path.includes("wedding")) return "Wedding venues page";
    if (path.includes("party")) return "Party halls page";
    if (path.includes("corporate")) return "Corporate venues page";
    if (path.includes("delhi-ncr")) return "Delhi NCR page";
    if (path.includes("venues")) return "Browse venues page";
    return "Website page";
  }

  function pageLabel() {
    return `${document.title || "Select My Venue"} (${location.pathname || "/"})`;
  }

  function selectedVenueContext() {
    const params = new URLSearchParams(location.search);
    return {
      id: clean(params.get("venue") || params.get("id") || params.get("venue_id")),
      name: clean(params.get("venue_name") || params.get("venueName")),
      sourcePage: clean(params.get("source_page") || "")
    };
  }

  function simpleLeadSource() {
    const venue = selectedVenueContext();
    if (venue.name) return `Website - ${venue.name}`.slice(0, 180);
    return `Website - ${shortPageName()}`;
  }

  function applyLeadSourceContext() {
    const sourceField = document.getElementById("leadSource");
    if (!sourceField) return;
    sourceField.value = simpleLeadSource();
  }

  function injectHomePartnerOffer() {
    const main = document.querySelector("body > main");
    if (!main || document.getElementById("smvHomePartnerOffer")) return;
    const offer = document.createElement("div");
    offer.id = "smvHomePartnerOffer";
    offer.className = "smv-home-offer-wrap";
    offer.innerHTML = `
      <section class="smv-home-offer" aria-labelledby="smvHomeOfferTitle">
        <div class="smv-home-offer-copy">
          <div class="smv-home-offer-kicker">📣 <b>Launch Offer</b> • Founding Venue Partners</div>
          <h2 id="smvHomeOfferTitle">List Your Venue <span>FREE.</span></h2>
          <p class="smv-home-offer-lead">Professional venue presence + relevant customer enquiry opportunities during launch.</p>
          <div class="smv-home-offer-badges" aria-label="Launch offer highlights">
            <div class="smv-home-offer-badge"><strong>₹0</strong><small>JOINING FEE</small></div>
            <div class="smv-home-offer-badge"><strong>FREE</strong><small>VENUE LISTING</small></div>
            <div class="smv-home-offer-badge"><strong>PARTNER</strong><small>CRM ACCESS</small></div>
            <div class="smv-home-offer-badge gold"><strong>10-DAY</strong><small>TRIAL</small></div>
          </div>
          <div class="smv-home-offer-strip">🎁 LIMITED LAUNCH OFFER — NO PAYMENT REQUIRED ✨</div>
        </div>
        <aside class="smv-home-offer-side">
          <h3>Your Founding Partner <span>launch benefits</span></h3>
          <ul class="smv-home-offer-list">
            <li>Professional venue profile</li>
            <li>₹0 joining fee</li>
            <li>Partner CRM access</li>
            <li>Relevant enquiries</li>
            <li>Verified Partner opportunity</li>
            <li>No commission to join</li>
            <li>10-day complimentary trial</li>
            <li>No long-term commitment</li>
          </ul>
          <div class="smv-home-offer-cta-row">
            <a class="smv-home-offer-btn" href="list-your-venue.html">LIST YOUR VENUE FREE →</a>
            <div class="smv-home-offer-growth"><b>♛</b>Grow your bookings<br>with us!</div>
          </div>
          <p class="smv-home-offer-note">Joining does not guarantee enquiries or bookings. No obligation after the complimentary period.</p>
        </aside>
      </section>
    `;
    main.insertAdjacentElement("afterbegin", offer);
  }

  function collectMainDetails() {
    const venue = selectedVenueContext();
    return {
      name: clean(document.getElementById("customerName")?.value),
      mobile: mobileDigits(document.getElementById("customerMobile")?.value),
      email: clean(document.getElementById("customerEmail")?.value),
      location: clean(document.getElementById("customerLocation")?.value),
      eventType: clean(document.getElementById("customerEventType")?.value),
      eventDate: clean(document.getElementById("customerEventDate")?.value),
      guests: clean(document.getElementById("customerGuests")?.value),
      budget: clean(document.getElementById("customerBudget")?.value),
      food: clean(document.getElementById("customerFood")?.value),
      requirements: clean(document.getElementById("customerRequirements")?.value),
      venueName: venue.name,
      venueId: venue.id
    };
  }

  function duplicateKey(details) {
    if (!details.mobile) return "";
    return [details.mobile, details.eventType, details.eventDate, details.location, details.venueId || details.venueName || "home"].join("|").toLowerCase();
  }

  function markSubmitted(details) {
    const key = duplicateKey(details);
    if (!key) return;
    try { sessionStorage.setItem("smv-last-main-enquiry-key", key); sessionStorage.setItem("smv-last-main-enquiry-time", String(Date.now())); } catch (_) {}
  }

  function isRecentDuplicate(details) {
    const key = duplicateKey(details);
    if (!key) return false;
    try {
      const oldKey = sessionStorage.getItem("smv-last-main-enquiry-key");
      const oldTime = Number(sessionStorage.getItem("smv-last-main-enquiry-time") || 0);
      return oldKey === key && Date.now() - oldTime < 90 * 1000;
    } catch (_) { return false; }
  }

  function showFrontSuccess(message, details, duplicate) {
    if (!message) return;
    message.textContent = duplicate
      ? "✓ Your request is already received. Our team will call you within 1 hour."
      : "✓ Thank you! Your venue request has been received. Our team will call you within 1 hour with suitable venue options.";
    message.className = "form-message success smv-front-success";
    const form = document.getElementById("customerEnquiryForm");
    if (form) form.classList.add("is-sent");
    setTimeout(() => message.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }

  function installMainEnquiryEnhancements() {
    const form = document.getElementById("customerEnquiryForm");
    const message = document.getElementById("customerEnquiryMessage");
    if (!form || !message || form.dataset.smvLeadFix === "1") return;
    form.dataset.smvLeadFix = "1";
    applyLeadSourceContext();

    form.addEventListener("input", applyLeadSourceContext, true);
    form.addEventListener("change", applyLeadSourceContext, true);
    form.addEventListener("submit", function (event) {
      applyLeadSourceContext();
      const details = collectMainDetails();
      window.__smvLastMainEnquiryDetails = details;
      if (isRecentDuplicate(details)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showFrontSuccess(message, details, true);
      }
    }, true);

    const observer = new MutationObserver(() => {
      const text = clean(message.textContent).toLowerCase();
      if (!text || !message.className.includes("success")) return;
      if (message.dataset.smvFinalSuccess === "1") return;
      if (text.includes("thank you") || text.includes("received") || text.includes("submitted")) {
        message.dataset.smvFinalSuccess = "1";
        const details = window.__smvLastMainEnquiryDetails || collectMainDetails();
        markSubmitted(details);
        showFrontSuccess(message, details, false);
        form.reset();
        applyLeadSourceContext();
        setTimeout(() => { message.dataset.smvFinalSuccess = ""; }, 1200);
      }
    });
    observer.observe(message, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  injectHomePartnerOffer();
  installMainEnquiryEnhancements();

  const contactLink = document.querySelector('#mainNav a[href="#contact"]');
  if (contactLink) {
    contactLink.textContent = "+91 83683 22256";
    contactLink.href = "tel:+918368322256";
    contactLink.setAttribute("aria-label", "Call Select My Venue at +91 83683 22256");
    contactLink.setAttribute("title", "Call +91 83683 22256");
  }

  const navOffer = document.querySelector('#mainNav a[href="list-your-venue.html"]');
  if (navOffer) {
    navOffer.setAttribute("title", "List Your Venue");
    navOffer.setAttribute("aria-label", "List Your Venue");
  }

  if (!document.getElementById("smvSmartMatchLoader")) {
    const smartMatchScript = document.createElement("script");
    smartMatchScript.id = "smvSmartMatchLoader";
    smartMatchScript.src = "smv-smart-match.js?v=20260901-smart-match-1";
    smartMatchScript.defer = true;
    document.head.appendChild(smartMatchScript);
  }

  const section = document.getElementById("featuredVenues");
  const grid = document.getElementById("homeVenueGrid");
  if (!section || !grid) return;

  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

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
      style: "currency", currency: "INR", maximumFractionDigits: 0
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
    const rawId = String(venue.id || "");
    const name = String(venue.venue_name || "Venue Partner");
    const imageUrl = safeHttpUrl(venue.cover_image_url);
    const locationText = [venue.area, venue.city].filter(Boolean).join(", ") || "Location on request";
    const featureList = features(venue);
    const profileUrl = `venue.html?id=${id}`;
    const quoteUrl = `index.html?venue=${id}&venue_name=${encodeURIComponent(name)}&source_page=${encodeURIComponent("Homepage Venue Card")}#enquiry`;
    const media = imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)} venue" loading="lazy" decoding="async" width="640" height="400">`
      : `<div class="home-venue-image-fallback" aria-hidden="true">🏨</div>`;
    const featureHtml = featureList.length
      ? featureList.map(item => `<span>✓ ${escapeHtml(item)}</span>`).join("")
      : `<span>Details on request</span>`;

    return `<article class="home-venue-card" data-venue-id="${escapeHtml(rawId)}" data-profile-url="${escapeHtml(profileUrl)}" role="link" tabindex="0" aria-label="Open ${escapeHtml(name)} venue profile"><div class="home-venue-media">${media}<div class="home-venue-badges"><span class="home-venue-badge">${escapeHtml(venue.venue_type || "Venue")}</span><span class="home-venue-badge verified">✓ Verified</span></div></div><div class="home-venue-content"><h3>${escapeHtml(name)}</h3><p class="home-venue-location">⌖ ${escapeHtml(locationText)}</p><div class="home-venue-facts"><div class="home-venue-fact"><span>Capacity</span><strong>${escapeHtml(capacity(venue))}</strong></div><div class="home-venue-fact"><span>Starting range</span><strong>${escapeHtml(pricing(venue))}</strong></div></div><div class="home-venue-features">${featureHtml}</div><div class="home-venue-actions"><a class="secondary-btn" href="${profileUrl}">View Profile</a><a class="primary-btn" href="${quoteUrl}">Get Quote</a></div></div></article>`;
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
    grid.innerHTML = venues.map(renderVenue).join("");
  }

  grid.addEventListener("click", event => {
    if (event.target.closest("a,button,input,select,textarea,label")) return;
    const card = event.target.closest(".home-venue-card[data-profile-url]");
    if (card?.dataset.profileUrl) window.location.href = card.dataset.profileUrl;
  });

  grid.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".home-venue-card[data-profile-url]");
    if (!card?.dataset.profileUrl) return;
    event.preventDefault();
    window.location.href = card.dataset.profileUrl;
  });

  loadHomepageVenues();
})();
