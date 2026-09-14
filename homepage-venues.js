(function () {
  "use strict";

  const PERFORMANCE_CSS_VERSION = "20260914-marketplace-filters-3";
  const SUCCESS_TEXT = "Requirement received! Thank you for choosing Select My Venue. Our venue team will contact you within 30 minutes to understand your event and help you with suitable venue options.";
  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const ATTRIBUTION_STORAGE_KEY = "smv-traffic-attribution-v1";

  function ensurePerformanceCss() {
    let link = document.getElementById("smvPerformanceStability");
    if (!link) {
      link = document.createElement("link");
      link.id = "smvPerformanceStability";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = "performance-stability.css?v=" + PERFORMANCE_CSS_VERSION;
  }

  const clean = value => String(value == null ? "" : value).trim();
  const normal = value => clean(value).toLowerCase();
  const mobileDigits = value => clean(value).replace(/[^0-9]/g, "").slice(-10);
  const escapeHtml = value => String(value ?? "").replace(/[&<>'\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'\"':"&quot;"})[ch]);
  const eventTypes = item => {
    const raw = item.event_types || item.events || item.suitable_events || [];
    if (Array.isArray(raw)) return raw.map(String).map(clean).filter(Boolean);
    return String(raw || "").split(/[,|]/).map(clean).filter(Boolean);
  };

  function onReady(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
    else callback();
  }

  function isHumanName(value) {
    const name = clean(value);
    return name.length >= 2 && name.length <= 80 && !/\d/.test(name) && /[A-Za-z\u00C0-\u024F\u0900-\u097F]{2}/u.test(name.replace(/\s/g, "")) && /^[A-Za-z\u00C0-\u024F\u0900-\u097F .'-]+$/u.test(name);
  }

  function isValidIndianMobile(value) {
    const mobile = mobileDigits(value);
    return /^[6-9][0-9]{9}$/.test(mobile) && !/^(\d)\1{9}$/.test(mobile);
  }

  function captureAttribution() {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}") || {}; } catch (_) {}
    const params = new URLSearchParams(location.search);
    ["gclid","gbraid","wbraid","utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(key => {
      const value = clean(params.get(key));
      if (value) saved[key] = value.slice(0, 500);
    });
    if (!saved.landing_page) saved.landing_page = location.href.slice(0, 1000);
    if (!saved.first_referrer && document.referrer) saved.first_referrer = document.referrer.slice(0, 1000);
    saved.last_page = location.href.slice(0, 1000);
    try { sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(saved)); } catch (_) {}
    return saved;
  }

  function addHoneypot(form) {
    if (!form || form.elements?._smv_company_website) return;
    const field = document.createElement("input");
    field.type = "text";
    field.name = "_smv_company_website";
    field.tabIndex = -1;
    field.autocomplete = "off";
    field.setAttribute("aria-hidden", "true");
    field.style.cssText = "position:absolute;left:-10000px;width:1px;height:1px;opacity:0;pointer-events:none";
    form.appendChild(field);
  }

  function installFormQualityGuards() {
    const prepare = () => {
      addHoneypot(document.getElementById("customerEnquiryForm"));
      document.querySelectorAll("form").forEach(form => { if (form.querySelector("#smvPopupName,#popupCustomerName")) addHoneypot(form); });
    };
    prepare();
    const observer = new MutationObserver(prepare);
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("submit", event => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const isMain = form.id === "customerEnquiryForm";
      const popupName = form.querySelector("#smvPopupName,#popupCustomerName");
      if (!isMain && !popupName) return;
      if (clean(form.elements?._smv_company_website?.value)) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      const nameField = isMain ? document.getElementById("customerName") : popupName;
      const mobileField = isMain ? document.getElementById("customerMobile") : form.querySelector("#smvPopupMobile,#popupCustomerMobile");
      if (nameField && !isHumanName(nameField.value)) {
        event.preventDefault(); event.stopImmediatePropagation();
        nameField.setCustomValidity("Please enter your real name using letters only."); nameField.reportValidity(); nameField.focus();
        nameField.addEventListener("input", function clearError(){ nameField.setCustomValidity(""); nameField.removeEventListener("input", clearError); });
        return;
      }
      if (mobileField && !isValidIndianMobile(mobileField.value)) {
        event.preventDefault(); event.stopImmediatePropagation();
        mobileField.setCustomValidity("Please enter a valid 10-digit Indian mobile number."); mobileField.reportValidity(); mobileField.focus();
        mobileField.addEventListener("input", function clearError(){ mobileField.setCustomValidity(""); mobileField.removeEventListener("input", clearError); });
      }
    }, true);
  }

  function ensureEmailField() {
    const form = document.getElementById("customerEnquiryForm");
    if (!form) return;
    const existing = document.getElementById("customerEmail");
    if (existing) {
      const field = existing.closest(".field");
      if (field) { field.hidden = false; field.style.display = ""; }
      return;
    }
    const mobileField = document.getElementById("customerMobile")?.closest(".field");
    if (!mobileField) return;
    const field = document.createElement("div");
    field.className = "field";
    field.innerHTML = '<label for="customerEmail">EMAIL</label><input id="customerEmail" type="email" placeholder="your@email.com" autocomplete="email">';
    mobileField.insertAdjacentElement("afterend", field);
  }

  function selectedVenueContext() {
    const params = new URLSearchParams(location.search);
    return { id: clean(params.get("venue") || params.get("id") || params.get("venue_id")), name: clean(params.get("venue_name") || params.get("venueName")) };
  }

  function applyLeadSourceContext() {
    const source = document.getElementById("leadSource");
    if (!source) return;
    const venue = selectedVenueContext();
    source.value = venue.name ? `Website - ${venue.name}`.slice(0, 140) : "Website - Home page";
  }

  function installMainEnquiryEnhancements() {
    const form = document.getElementById("customerEnquiryForm");
    const message = document.getElementById("customerEnquiryMessage");
    if (!form || !message || form.dataset.smvLeadFix === "1") return;
    form.dataset.smvLeadFix = "1";
    ensureEmailField();
    applyLeadSourceContext();
    form.addEventListener("input", applyLeadSourceContext, true);
    form.addEventListener("change", applyLeadSourceContext, true);
    const observer = new MutationObserver(() => {
      const text = normal(message.textContent);
      if (message.className.includes("success") && /thank you|received|submitted|success/.test(text)) {
        message.textContent = SUCCESS_TEXT;
        message.className = "form-message success smv-front-success";
      }
    });
    observer.observe(message, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  function installPopupConfirmationNormalizer() {
    if (window.__smvPopupConfirmationNormalizerInstalled) return;
    window.__smvPopupConfirmationNormalizerInstalled = true;
    const normalize = () => document.querySelectorAll(".smv-popup-success").forEach(panel => {
      const h = panel.querySelector("h3"), p = panel.querySelector("p");
      if (h) h.textContent = "Requirement received!";
      if (p) p.textContent = SUCCESS_TEXT.replace("Requirement received! ", "");
    });
    normalize();
    if (document.body) new MutationObserver(normalize).observe(document.body, { childList: true, subtree: true });
  }

  function injectHomePartnerOffer() {
    const main = document.querySelector("body > main");
    if (!main || document.getElementById("smvHomePartnerOffer")) return;
    const offer = document.createElement("div");
    offer.id = "smvHomePartnerOffer";
    offer.className = "smv-home-offer-wrap";
    offer.innerHTML = '<section class="smv-home-offer"><div class="smv-home-offer-copy"><div class="smv-home-offer-kicker">📣 <b>Launch Offer</b> • Founding Venue Partners</div><h2>List Your Venue <span>FREE.</span></h2><p class="smv-home-offer-lead">Professional venue presence + relevant customer enquiry opportunities during launch.</p><div class="smv-home-offer-badges"><div class="smv-home-offer-badge"><strong>₹0</strong><small>JOINING FEE</small></div><div class="smv-home-offer-badge"><strong>FREE</strong><small>VENUE LISTING</small></div><div class="smv-home-offer-badge"><strong>PARTNER</strong><small>CRM ACCESS</small></div><div class="smv-home-offer-badge gold"><strong>10-DAY</strong><small>TRIAL</small></div></div><div class="smv-home-offer-strip">🎁 LIMITED LAUNCH OFFER — NO PAYMENT REQUIRED ✨</div></div><aside class="smv-home-offer-side"><h3>Your Founding Partner <span>launch benefits</span></h3><ul class="smv-home-offer-list"><li>Professional venue profile</li><li>₹0 joining fee</li><li>Partner CRM access</li><li>Relevant enquiries</li><li>Verified Partner opportunity</li><li>No commission to join</li><li>10-day complimentary trial</li><li>No long-term commitment</li></ul><div class="smv-home-offer-cta-row"><a class="smv-home-offer-btn" href="list-your-venue.html">LIST YOUR VENUE FREE →</a><div class="smv-home-offer-growth"><b>♛</b>Grow your bookings<br>with us!</div></div><p class="smv-home-offer-note">Joining does not guarantee enquiries or bookings. No obligation after the complimentary period.</p></aside></section>';
    main.insertAdjacentElement("afterbegin", offer);
  }

  function installWhatsappIconCleanup() {
    const cleanup = () => {
      const button = document.querySelector(".floating-whatsapp");
      if (!button) return;
      button.querySelectorAll(".floating-whatsapp-text").forEach(node => node.remove());
      button.setAttribute("aria-label", "Chat with Select My Venue on WhatsApp");
      button.title = "WhatsApp";
    };
    cleanup();
    if (document.body) new MutationObserver(cleanup).observe(document.body, { childList: true, subtree: true });
  }

  function installHeaderTweaks() {
    const nav = document.getElementById("mainNav");
    if (!nav || nav.dataset.smvHeaderFix === "1") return;
    nav.dataset.smvHeaderFix = "1";
    if (!nav.querySelector("a[href^='tel:']")) {
      const a = document.createElement("a");
      a.href = "tel:+918368322256";
      a.textContent = "☎ +91 83683 22256";
      const list = nav.querySelector("a[href='list-your-venue.html']");
      list ? nav.insertBefore(a, list) : nav.appendChild(a);
    }
  }

  function polishContactIcons() {
    ["✉", "☎", "◉", "⌂"].forEach((iconText, index) => {
      const icon = document.querySelectorAll(".contact-grid .contact-card")[index]?.querySelector("b");
      if (icon) icon.textContent = iconText;
    });
  }

  function simplifyHomeVenueHeading() {
    const section = document.getElementById("featuredVenues");
    if (!section) return;
    section.querySelector(".home-venues-heading-actions .secondary-btn")?.remove();
    const p = section.querySelector(".home-venues-heading-actions p");
    if (p) p.textContent = "Browse every currently verified venue profile and narrow the list by venue type, location, occasion, food, capacity, budget and facilities.";
  }

  function marketplaceCss() {
    let style = document.getElementById("smvHomeMarketplaceV3Styles");
    if (style) return;
    style = document.createElement("style");
    style.id = "smvHomeMarketplaceV3Styles";
    style.textContent = `
      #featuredVenues .smv-home-market-search{display:grid;grid-template-columns:190px minmax(0,1fr) 118px;gap:9px;margin:0 0 16px;padding:12px;border:1px solid rgba(109,231,211,.18);border-radius:16px;background:linear-gradient(155deg,#07312d,#041f1c);box-shadow:0 14px 34px rgba(0,0,0,.18)}
      #featuredVenues .smv-home-market-search select,#featuredVenues .smv-home-market-search input{width:100%;min-height:44px;border:1px solid rgba(109,231,211,.18);border-radius:10px;background:#fff;color:#263b38;padding:0 12px;font:inherit;font-size:12px;font-weight:750;outline:none}
      #featuredVenues .smv-home-market-search button{min-height:44px;border:0;border-radius:10px;background:linear-gradient(180deg,#178fc7,#1177aa);color:#fff;font:inherit;font-size:12px;font-weight:950;cursor:pointer;box-shadow:0 7px 18px rgba(17,119,170,.22)}
      #featuredVenues .smv-home-filter-layout{display:grid!important;grid-template-columns:270px minmax(0,1fr)!important;gap:18px!important;align-items:start!important}
      #featuredVenues .smv-home-filter-panel{display:block!important;position:sticky!important;top:92px!important;max-height:calc(100vh - 108px)!important;overflow:auto!important;padding:0!important;border:1px solid rgba(109,231,211,.18)!important;border-radius:15px!important;background:#f8fbfa!important;box-shadow:0 14px 34px rgba(0,0,0,.14)!important;color:#213936!important;scrollbar-width:thin}
      #featuredVenues .smv-filter-box{border-bottom:1px solid #dbe6e3;padding:0 10px 10px}
      #featuredVenues .smv-filter-box:last-child{border-bottom:0}
      #featuredVenues .smv-filter-title{margin:0 -10px 8px;padding:8px 10px;background:#373838;color:#fff;font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:space-between}
      #featuredVenues .smv-filter-list{display:grid;gap:2px}
      #featuredVenues .smv-filter-choice{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:25px;padding:2px 4px;border:0;background:transparent;color:#415954;font:inherit;font-size:9.5px;text-align:left;cursor:pointer;border-radius:5px}
      #featuredVenues .smv-filter-choice:hover,#featuredVenues .smv-filter-choice.active{background:#e5f5f1;color:#086d5d;font-weight:900}
      #featuredVenues .smv-filter-choice b{color:#7a8f8a;font-size:8.5px;font-weight:800}
      #featuredVenues .smv-filter-subsearch{width:100%;height:31px;margin:0 0 7px;padding:0 8px;border:1px solid #d3dfdc;border-radius:6px;background:#fff;color:#304944;font-size:9.5px;outline:none}
      #featuredVenues .smv-home-results{min-width:0!important}
      #featuredVenues .smv-home-result-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding:9px 12px;border:1px solid rgba(109,231,211,.16);border-radius:11px;background:rgba(255,255,255,.03);color:#b9d0cc;font-size:10px;font-weight:800}
      #featuredVenues .smv-home-result-bar strong{color:#f2d179}
      #featuredVenues .smv-home-clear-all{border:1px solid rgba(232,189,104,.25);border-radius:8px;background:rgba(232,189,104,.06);color:#e8c76d;min-height:31px;padding:0 9px;font:inherit;font-size:9px;font-weight:900;cursor:pointer}
      #featuredVenues .smv-home-no-results{display:none;padding:25px;border:1px dashed rgba(109,231,211,.2);border-radius:15px;color:#8fb3ad;text-align:center;font-weight:850}
      #featuredVenues .smv-home-filter-toggle{display:none!important}
      #featuredVenues .home-venue-card[hidden]{display:none!important}
      @media(max-width:980px){#featuredVenues .smv-home-filter-layout{grid-template-columns:1fr!important}#featuredVenues .smv-home-filter-panel{position:static!important;max-height:none!important;overflow:visible!important}#featuredVenues .smv-filter-box{padding-bottom:8px}#featuredVenues .smv-filter-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:620px){#featuredVenues .smv-home-market-search{grid-template-columns:1fr}#featuredVenues .smv-filter-list{grid-template-columns:1fr}#featuredVenues .smv-home-result-bar{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function createChoice(label, value, count, category) {
    return `<button type="button" class="smv-filter-choice" data-category="${escapeHtml(category)}" data-value="${escapeHtml(value)}"><span>${escapeHtml(label)}</span><b>${count}</b></button>`;
  }

  function bucketLabel(max) {
    if (max <= 25) return "Less than 25";
    if (max <= 50) return "26 to 50";
    if (max <= 100) return "51 to 100";
    if (max <= 150) return "101 to 150";
    if (max <= 200) return "151 to 200";
    if (max <= 300) return "201 to 300";
    if (max <= 400) return "301 to 400";
    if (max <= 500) return "401 to 500";
    if (max <= 700) return "501 to 700";
    return "700+";
  }

  function buildHomeMarketplace(rows) {
    const section = document.getElementById("featuredVenues");
    const grid = document.getElementById("homeVenueGrid");
    if (!section || !grid) return;
    marketplaceCss();

    let layout = grid.closest(".smv-home-filter-layout");
    let results = grid.closest(".smv-home-results");
    if (!layout || !results) {
      layout = document.createElement("div");
      layout.className = "smv-home-filter-layout";
      results = document.createElement("div");
      results.className = "smv-home-results";
      grid.parentNode.insertBefore(layout, grid);
      layout.appendChild(results);
      results.appendChild(grid);
    }

    layout.querySelector(".smv-home-filter-panel")?.remove();
    section.querySelectorAll(".smv-home-filter-toggle").forEach(node => node.remove());

    const panel = document.createElement("aside");
    panel.className = "smv-home-filter-panel";
    layout.insertBefore(panel, results);

    let top = section.querySelector(".smv-home-market-search");
    if (!top) {
      top = document.createElement("div");
      top.className = "smv-home-market-search";
      layout.parentNode.insertBefore(top, layout);
    }

    const cities = [...new Set(rows.map(v => clean(v.city)).filter(Boolean))].sort();
    top.innerHTML = `<select id="smvMarketCity" aria-label="Choose city"><option value="">All Locations</option>${cities.map(x => `<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("")}</select><input id="smvMarketSearch" type="search" placeholder="Search by Venue, Category, Locality or Occasion" aria-label="Search venues"><button id="smvMarketSearchButton" type="button">Search</button>`;

    const typeCounts = new Map(), locationCounts = new Map(), eventCounts = new Map();
    const capacityCounts = new Map(), foodCounts = new Map(), moreCounts = new Map(), budgetCounts = new Map();
    const inc = (map, key) => { if (key) map.set(key, (map.get(key) || 0) + 1); };
    rows.forEach(v => {
      inc(typeCounts, clean(v.venue_type) || "Venue");
      inc(locationCounts, clean(v.city));
      inc(locationCounts, clean(v.area));
      eventTypes(v).forEach(e => inc(eventCounts, e));
      inc(capacityCounts, bucketLabel(Number(v.capacity_max || v.capacity_min || 0)));
      if (v.food_veg) inc(foodCounts, "Vegetarian");
      if (v.food_non_veg) inc(foodCounts, "Non-Vegetarian");
      if (v.parking_available) inc(moreCounts, "Parking");
      if (v.rooms_available) inc(moreCounts, "Rooms");
      if (v.catering_available) inc(moreCounts, "Catering");
      if (v.decoration_available) inc(moreCounts, "Decoration");
      const price = Number(v.price_min_per_person || 0);
      if (price) inc(budgetCounts, price <= 1000 ? "Up to ₹1,000" : price <= 1500 ? "₹1,001–1,500" : price <= 2000 ? "₹1,501–2,000" : price <= 3000 ? "₹2,001–3,000" : "₹3,000+");
    });

    const box = (title, category, map, includeSearch) => {
      const values = [...map.entries()].sort((a,b) => a[0].localeCompare(b[0]));
      return `<section class="smv-filter-box"><div class="smv-filter-title"><span>${escapeHtml(title)}</span></div>${includeSearch ? `<input class="smv-filter-subsearch" data-filter-search="${escapeHtml(category)}" placeholder="Search ${escapeHtml(title.toLowerCase())}">` : ""}<div class="smv-filter-list" data-list="${escapeHtml(category)}">${createChoice("All", "", rows.length, category)}${values.map(([label,count]) => createChoice(label,label,count,category)).join("")}</div></section>`;
    };
    panel.innerHTML = box("VENUES", "type", typeCounts, false) + box("LOCATION", "location", locationCounts, true) + box("MEAL / FOOD", "food", foodCounts, false) + box("OCCASION", "occasion", eventCounts, true) + box("VENUE CAPACITY", "capacity", capacityCounts, false) + box("BUDGET / PERSON", "budget", budgetCounts, false) + box("MORE FILTERS", "more", moreCounts, false);

    let resultBar = results.querySelector(".smv-home-result-bar");
    if (!resultBar) {
      resultBar = document.createElement("div");
      resultBar.className = "smv-home-result-bar";
      results.insertBefore(resultBar, grid);
    }
    let noResults = results.querySelector(".smv-home-no-results");
    if (!noResults) {
      noResults = document.createElement("div");
      noResults.className = "smv-home-no-results";
      noResults.textContent = "No matching venues found. Try changing one filter or clear all filters.";
      results.appendChild(noResults);
    }

    const state = { city:"", q:"", type:"", location:"", food:"", occasion:"", capacity:"", budget:"", more:"" };

    function rowMatches(v) {
      const locationText = [clean(v.area), clean(v.city)].filter(Boolean).join(" ");
      const searchText = [clean(v.venue_name), clean(v.venue_type), locationText, eventTypes(v).join(" ")].join(" ").toLowerCase();
      if (state.q && !searchText.includes(state.q)) return false;
      if (state.city && normal(v.city) !== normal(state.city)) return false;
      if (state.type && clean(v.venue_type) !== state.type) return false;
      if (state.location && ![clean(v.city), clean(v.area)].some(x => normal(x) === normal(state.location))) return false;
      if (state.food === "Vegetarian" && v.food_veg !== true) return false;
      if (state.food === "Non-Vegetarian" && v.food_non_veg !== true) return false;
      if (state.occasion && !eventTypes(v).some(e => normal(e).includes(normal(state.occasion)) || normal(state.occasion).includes(normal(e)))) return false;
      if (state.capacity && bucketLabel(Number(v.capacity_max || v.capacity_min || 0)) !== state.capacity) return false;
      if (state.budget) {
        const p = Number(v.price_min_per_person || 0);
        const ok = state.budget === "Up to ₹1,000" ? p > 0 && p <= 1000 : state.budget === "₹1,001–1,500" ? p > 1000 && p <= 1500 : state.budget === "₹1,501–2,000" ? p > 1500 && p <= 2000 : state.budget === "₹2,001–3,000" ? p > 2000 && p <= 3000 : p > 3000;
        if (!ok) return false;
      }
      if (state.more === "Parking" && v.parking_available !== true) return false;
      if (state.more === "Rooms" && v.rooms_available !== true) return false;
      if (state.more === "Catering" && v.catering_available !== true) return false;
      if (state.more === "Decoration" && v.decoration_available !== true) return false;
      return true;
    }

    function applyFilters() {
      let visible = 0;
      const cards = [...grid.querySelectorAll(".home-venue-card")];
      cards.forEach(card => {
        const item = rows.find(v => String(v.id) === String(card.dataset.venueId));
        const ok = item ? rowMatches(item) : true;
        card.hidden = !ok;
        card.style.display = ok ? "" : "none";
        if (ok) visible++;
      });
      resultBar.innerHTML = `<span><strong>${visible}</strong> of ${rows.length} verified venue${rows.length === 1 ? "" : "s"} shown</span><button type="button" class="smv-home-clear-all">Clear All Filters</button>`;
      noResults.style.display = visible ? "none" : "block";
      panel.querySelectorAll(".smv-filter-choice").forEach(button => button.classList.toggle("active", state[button.dataset.category] === button.dataset.value));
      resultBar.querySelector(".smv-home-clear-all")?.addEventListener("click", clearAll);
    }

    function clearAll() {
      Object.keys(state).forEach(key => state[key] = "");
      const citySelect = document.getElementById("smvMarketCity"), searchInput = document.getElementById("smvMarketSearch");
      if (citySelect) citySelect.value = "";
      if (searchInput) searchInput.value = "";
      applyFilters();
    }

    panel.addEventListener("click", event => {
      const button = event.target.closest(".smv-filter-choice");
      if (!button) return;
      state[button.dataset.category] = button.dataset.value || "";
      applyFilters();
    });
    panel.addEventListener("input", event => {
      const input = event.target.closest("[data-filter-search]");
      if (!input) return;
      const term = normal(input.value), category = input.dataset.filterSearch;
      panel.querySelectorAll(`[data-list="${category}"] .smv-filter-choice`).forEach(button => {
        button.style.display = !term || normal(button.textContent).includes(term) ? "" : "none";
      });
    });
    document.getElementById("smvMarketSearchButton")?.addEventListener("click", () => {
      state.city = clean(document.getElementById("smvMarketCity")?.value);
      state.q = normal(document.getElementById("smvMarketSearch")?.value);
      applyFilters();
    });
    document.getElementById("smvMarketSearch")?.addEventListener("keydown", event => {
      if (event.key === "Enter") { event.preventDefault(); document.getElementById("smvMarketSearchButton")?.click(); }
    });
    document.getElementById("smvMarketCity")?.addEventListener("change", () => {
      state.city = clean(document.getElementById("smvMarketCity")?.value);
      applyFilters();
    });
    grid.addEventListener("click", event => {
      if (event.target.closest("a,button,input,select,textarea,label")) return;
      const card = event.target.closest(".home-venue-card[data-profile-url]");
      if (card?.dataset.profileUrl) location.href = card.dataset.profileUrl;
    });

    applyFilters();
  }

  async function loadHomepageVenues() {
    const section = document.getElementById("featuredVenues"), grid = document.getElementById("homeVenueGrid");
    if (!section || !grid || !window.supabase?.createClient) return;
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } });
      let result = await client.rpc("smv_public_venues");
      if (result.error && /function|schema cache/i.test(String(result.error.message || ""))) {
        result = await client.from("venues").select("id,venue_name,venue_type,description,city,area,capacity_min,capacity_max,price_min_per_person,price_max_per_person,food_veg,food_non_veg,parking_available,rooms_available,catering_available,decoration_available,cover_image_url,featured,event_types").eq("venue_status","approved").eq("verification_status","verified").eq("public_listing_enabled",true).order("featured",{ascending:false}).order("venue_name",{ascending:true});
      }
      if (result.error) throw result.error;
      const rows = (Array.isArray(result.data) ? result.data : []).map(item => item?.venue || item).filter(Boolean);
      grid.innerHTML = rows.map(item => {
        const name = clean(item.venue_name) || "Verified Venue";
        const city = clean(item.city), area = clean(item.area), type = clean(item.venue_type), cover = clean(item.cover_image_url);
        const locationText = [area, city].filter(Boolean).join(", ") || "Location on request";
        const max = Number(item.capacity_max || 0), min = Number(item.capacity_min || 0), price = Number(item.price_min_per_person || 0);
        const capacity = max ? `Up to ${max.toLocaleString("en-IN")} guests` : min ? `${min.toLocaleString("en-IN")}+ guests` : "Capacity on request";
        const priceText = price ? `From ₹${price.toLocaleString("en-IN")}/person` : "Quote on request";
        const features = [];
        if (item.food_veg) features.push("Vegetarian");
        if (item.food_non_veg) features.push("Non-Vegetarian");
        if (item.parking_available) features.push("Parking");
        if (item.rooms_available) features.push("Rooms");
        if (item.catering_available) features.push("Catering");
        if (item.decoration_available) features.push("Decoration");
        const href = `venue.html?id=${encodeURIComponent(item.id)}`;
        return `<article class="home-venue-card" data-venue-id="${escapeHtml(String(item.id || ""))}" data-profile-url="${escapeHtml(href)}" data-venue-city="${escapeHtml(city)}" data-venue-area="${escapeHtml(area)}" data-venue-type="${escapeHtml(type)}" data-capacity="${max || min || 0}" data-price="${price || 0}"><a href="${href}" class="home-venue-media" aria-label="View ${escapeHtml(name)}">${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async">` : '<div class="home-venue-image-fallback" aria-hidden="true">🏨</div>'}<div class="home-venue-badges"><span class="home-venue-badge verified">✓ Verified Partner</span>${item.featured ? '<span class="home-venue-badge">Featured</span>' : ''}</div></a><div class="home-venue-content"><p class="home-venue-location">⌖ ${escapeHtml(locationText)}</p><h3><a href="${href}">${escapeHtml(name)}</a></h3><div class="home-venue-facts"><span>${escapeHtml(capacity)}</span><span>${escapeHtml(priceText)}</span></div>${features.length ? `<div class="home-venue-features">${features.slice(0,4).map(f => `<span>${escapeHtml(f)}</span>`).join("")}</div>` : ""}<div class="home-venue-actions"><a class="primary-btn" href="${href}">View Venue →</a><a class="secondary-btn" href="${href}&quote=1">Check Availability</a></div></div></article>`;
      }).join("");
      simplifyHomeVenueHeading();
      section.hidden = false;
      buildHomeMarketplace(rows);
    } catch (error) {
      console.warn("Homepage venues unavailable:", error);
    }
  }

  function safeInit() {
    ensurePerformanceCss();
    captureAttribution();
    installPopupConfirmationNormalizer();
    injectHomePartnerOffer();
    ensureEmailField();
    installFormQualityGuards();
    installMainEnquiryEnhancements();
    installWhatsappIconCleanup();
    installHeaderTweaks();
    polishContactIcons();
    simplifyHomeVenueHeading();
    window.setTimeout(loadHomepageVenues, 420);
  }

  onReady(safeInit);
})();