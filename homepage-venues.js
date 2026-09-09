(function () {
  "use strict";

  const PERFORMANCE_CSS_VERSION = "20260909-aw-snap-fix-1";
  const SUCCESS_TEXT = "Requirement received! Thank you for choosing Select My Venue. Our venue team will contact you within 30 minutes to understand your event and help you with suitable venue options.";
  const DUPLICATE_TEXT = SUCCESS_TEXT;
  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  window.__SMV_HOMEPAGE_NOTES_FIX = "20260909-notes-permission-1";

  if (!document.getElementById("smvPerformanceStability")) {
    const link = document.createElement("link");
    link.id = "smvPerformanceStability";
    link.rel = "stylesheet";
    link.href = "performance-stability.css?v=" + PERFORMANCE_CSS_VERSION;
    document.head.appendChild(link);
  } else {
    document.getElementById("smvPerformanceStability").href = "performance-stability.css?v=" + PERFORMANCE_CSS_VERSION;
  }

  const clean = value => String(value == null ? "" : value).trim();
  const mobileDigits = value => clean(value).replace(/[^0-9]/g, "").slice(-10);
  const escapeHtml = value => String(value ?? "").replace(/[&<>'\"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '\"': "&quot;"
  })[character]);

  window.addEventListener("error", function (event) {
    console.warn("SMV website script warning:", event.message || event.error || event);
  });
  window.addEventListener("unhandledrejection", function (event) {
    console.warn("SMV website promise warning:", event.reason || event);
  });

  function onReady(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
    else callback();
  }

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

  function selectedVenueContext() {
    const params = new URLSearchParams(location.search);
    return {
      id: clean(params.get("venue") || params.get("id") || params.get("venue_id")),
      name: clean(params.get("venue_name") || params.get("venueName"))
    };
  }

  function simpleLeadSource() {
    const venue = selectedVenueContext();
    if (venue.name) return `Website - ${venue.name}`.slice(0, 140);
    return `Website - ${shortPageName()}`;
  }

  function applyLeadSourceContext() {
    const sourceField = document.getElementById("leadSource");
    if (sourceField) sourceField.value = simpleLeadSource();
  }

  function stripSystemLines(value) {
    const blocked = [
      "interested venue:",
      "search page:",
      "submitted page:",
      "venue id:"
    ];
    return clean(value)
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !blocked.some(prefix => line.toLowerCase().startsWith(prefix)))
      .join("\n")
      .slice(0, 3000);
  }

  function currentCustomerComment() {
    const popup = document.getElementById("enquiryPopup");
    const popupOpen = popup && popup.classList.contains("show");
    const popupComment = stripSystemLines(document.getElementById("smvPopupRequirements")?.value);
    const mainComment = stripSystemLines(document.getElementById("customerRequirements")?.value);
    if (popupOpen && popupComment) return popupComment;
    return mainComment || popupComment || "";
  }

  function installCustomerEnquiryInsertBridge() {
    if (window.__smvCustomerCommentBridgeInstalled) return;
    if (!window.supabase || typeof window.supabase.createClient !== "function") return;

    try {
      const probeClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      const probeBuilder = probeClient.from("customer_enquiries");
      let proto = Object.getPrototypeOf(probeBuilder);
      while (proto && !Object.prototype.hasOwnProperty.call(proto, "insert")) {
        proto = Object.getPrototypeOf(proto);
      }
      if (!proto || typeof proto.insert !== "function" || proto.__smvCommentBridgeInstalled) return;

      const originalInsert = proto.insert;
      proto.insert = function (values, options) {
        try {
          const target = String(this?.url || "");
          if (target.includes("customer_enquiries")) {
            const comment = currentCustomerComment();
            const enrich = row => {
              if (!row || typeof row !== "object" || Array.isArray(row)) return row;
              const next = { ...row };
              delete next.priority;

              if (comment) {
                const existingRequirements = clean(next.requirements);
                const commentLine = `Customer comment: ${comment}`;
                if (!existingRequirements.toLowerCase().includes(commentLine.toLowerCase())) {
                  next.requirements = existingRequirements
                    ? `${existingRequirements}\n${commentLine}`
                    : commentLine;
                }
              }

              delete next.contact_remark;
              return next;
            };
            values = Array.isArray(values) ? values.map(enrich) : enrich(values);
          }
        } catch (error) {
          console.warn("SMV comment bridge warning:", error);
        }
        return originalInsert.call(this, values, options);
      };
      proto.__smvCommentBridgeInstalled = true;
      window.__smvCustomerCommentBridgeInstalled = true;
    } catch (error) {
      console.warn("SMV comment bridge could not be installed:", error);
    }
  }

  function installConfirmationStyles() {
    if (document.getElementById("smvUnifiedConfirmationStyles")) return;
    const style = document.createElement("style");
    style.id = "smvUnifiedConfirmationStyles";
    style.textContent = `
      #customerEnquiryMessage.smv-front-success,
      #customerEnquiryMessage.success.smv-front-success {
        display:block!important;
        width:100%!important;
        box-sizing:border-box!important;
        position:relative!important;
        margin:16px 0 4px!important;
        padding:18px 20px 18px 58px!important;
        border:1px solid rgba(28,166,119,.34)!important;
        border-radius:17px!important;
        background:linear-gradient(135deg,#effff8 0%,#ffffff 58%,#fff9e5 100%)!important;
        color:#075f4b!important;
        font-size:14px!important;
        line-height:1.5!important;
        font-weight:850!important;
        white-space:normal!important;
        overflow:visible!important;
        box-shadow:0 14px 34px rgba(5,95,72,.12),inset 0 1px 0 rgba(255,255,255,.9)!important;
        text-shadow:none!important;
      }
      #customerEnquiryMessage.smv-front-success:before {
        content:"✓"!important;
        position:absolute!important;
        left:17px!important;
        top:17px!important;
        width:28px!important;
        height:28px!important;
        display:grid!important;
        place-items:center!important;
        border-radius:50%!important;
        background:linear-gradient(135deg,#20d4aa,#087f61)!important;
        color:#fff!important;
        font-size:16px!important;
        font-weight:950!important;
        box-shadow:0 6px 16px rgba(8,127,97,.22)!important;
      }
      @media(max-width:680px){
        #customerEnquiryMessage.smv-front-success,
        #customerEnquiryMessage.success.smv-front-success{
          padding:15px 15px 15px 50px!important;
          font-size:13px!important;
          line-height:1.48!important;
        }
        #customerEnquiryMessage.smv-front-success:before{
          left:14px!important;
          top:14px!important;
          width:25px!important;
          height:25px!important;
          font-size:14px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function installPopupConfirmationNormalizer() {
    if (window.__smvPopupConfirmationNormalizerInstalled) return;
    window.__smvPopupConfirmationNormalizerInstalled = true;

    const normalize = () => {
      document.querySelectorAll(".smv-popup-success").forEach(panel => {
        const heading = panel.querySelector("h3");
        const paragraph = panel.querySelector("p");
        if (heading) heading.textContent = "Requirement received!";
        if (paragraph) paragraph.textContent = "Thank you for choosing Select My Venue. Our venue team will contact you within 30 minutes to understand your event and help you with suitable venue options.";
      });
    };

    normalize();
    const observer = new MutationObserver(normalize);
    observer.observe(document.body, { childList: true, subtree: true });
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

  function ensureEmailField() {
    const form = document.getElementById("customerEnquiryForm");
    if (!form) return;
    const existing = document.getElementById("customerEmail");
    if (existing) {
      const field = existing.closest(".field");
      if (field) {
        field.hidden = false;
        field.style.display = "";
      }
      existing.type = "email";
      existing.placeholder = existing.placeholder || "your@email.com";
      return;
    }
    const mobileField = document.getElementById("customerMobile")?.closest(".field");
    const emailField = document.createElement("div");
    emailField.className = "field";
    emailField.innerHTML = `<label for="customerEmail">EMAIL</label><input id="customerEmail" type="email" placeholder="your@email.com" autocomplete="email">`;
    if (mobileField) mobileField.insertAdjacentElement("afterend", emailField);
  }

  function collectMainDetails() {
    const venue = selectedVenueContext();
    return {
      mobile: mobileDigits(document.getElementById("customerMobile")?.value),
      location: clean(document.getElementById("customerLocation")?.value),
      eventType: clean(document.getElementById("customerEventType")?.value),
      eventDate: clean(document.getElementById("customerEventDate")?.value),
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
    try {
      sessionStorage.setItem("smv-last-main-enquiry-key", key);
      sessionStorage.setItem("smv-last-main-enquiry-time", String(Date.now()));
    } catch (_) {}
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

  function showFrontSuccess(message, duplicate) {
    if (!message) return;
    message.textContent = duplicate ? DUPLICATE_TEXT : SUCCESS_TEXT;
    message.className = "form-message success smv-front-success";
    const form = document.getElementById("customerEnquiryForm");
    if (form) form.classList.add("is-sent");
    setTimeout(() => message.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
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
    form.addEventListener("submit", function (event) {
      applyLeadSourceContext();
      const details = collectMainDetails();
      window.__smvLastMainEnquiryDetails = details;
      if (isRecentDuplicate(details)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showFrontSuccess(message, true);
      }
    }, true);

    const observer = new MutationObserver(() => {
      const text = clean(message.textContent).toLowerCase();
      if (!text || !message.className.includes("success") || message.dataset.smvFinalSuccess === "1") return;
      if (text.includes("thank you") || text.includes("received") || text.includes("submitted") || text.includes("success")) {
        message.dataset.smvFinalSuccess = "1";
        const details = window.__smvLastMainEnquiryDetails || collectMainDetails();
        markSubmitted(details);
        showFrontSuccess(message, false);
      }
    });
    observer.observe(message, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  function installWhatsappIconCleanup() {
    const cleanWhatsApp = () => {
      const floating = document.querySelector(".floating-whatsapp");
      if (!floating) return;
      floating.querySelectorAll(".floating-whatsapp-text").forEach(node => node.remove());
      floating.setAttribute("aria-label", "Chat with Select My Venue on WhatsApp");
      floating.title = "WhatsApp";
    };
    cleanWhatsApp();
    const observer = new MutationObserver(cleanWhatsApp);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function installHeaderTweaks() {
    const nav = document.getElementById("mainNav");
    if (!nav || nav.dataset.smvHeaderFix === "1") return;
    nav.dataset.smvHeaderFix = "1";
    const existingPhone = nav.querySelector("a[href^='tel:']");
    if (!existingPhone) {
      const phone = document.createElement("a");
      phone.href = "tel:+918368322256";
      phone.textContent = "☎ +91 83683 22256";
      phone.setAttribute("aria-label", "Call Select My Venue");
      const listLink = nav.querySelector("a[href='list-your-venue.html']");
      if (listLink) nav.insertBefore(phone, listLink);
      else nav.appendChild(phone);
    }
  }

  async function loadHomepageVenues() {
    const section = document.getElementById("featuredVenues");
    const grid = document.getElementById("homeVenueGrid");
    if (!section || !grid || !window.supabase || typeof window.supabase.createClient !== "function") return;

    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      let result = await client.rpc("smv_public_venues");
      if (result.error && /function|schema cache/i.test(String(result.error.message || ""))) {
        result = await client.from("venues")
          .select("id,venue_name,venue_type,description,city,area,capacity_min,capacity_max,price_min_per_person,price_max_per_person,food_veg,food_non_veg,parking_available,rooms_available,catering_available,decoration_available,google_maps_url,cover_image_url,featured,event_types")
          .eq("venue_status", "approved")
          .eq("verification_status", "verified")
          .eq("public_listing_enabled", true)
          .order("featured", { ascending: false })
          .order("venue_name", { ascending: true });
      }
      if (result.error) throw result.error;
      const rows = (Array.isArray(result.data) ? result.data : []).map(item => item?.venue || item).filter(Boolean).slice(0, 6);
      if (!rows.length) return;

      grid.innerHTML = rows.map(item => {
        const name = clean(item.venue_name) || "Verified Venue";
        const locationText = [clean(item.area), clean(item.city)].filter(Boolean).join(", ") || "Location on request";
        const cover = clean(item.cover_image_url);
        const price = Number(item.price_min_per_person) > 0 ? `From ₹${Number(item.price_min_per_person).toLocaleString("en-IN")}/person` : "Quote on request";
        const capacity = Number(item.capacity_max) > 0 ? `Up to ${Number(item.capacity_max).toLocaleString("en-IN")} guests` : Number(item.capacity_min) > 0 ? `${Number(item.capacity_min).toLocaleString("en-IN")}+ guests` : "Capacity on request";
        const features = [];
        if (item.food_veg) features.push("Vegetarian");
        if (item.food_non_veg) features.push("Non-Vegetarian");
        if (item.parking_available) features.push("Parking");
        if (item.rooms_available) features.push("Rooms");
        if (item.catering_available) features.push("Catering");
        if (item.decoration_available) features.push("Decoration");
        const featureMarkup = features.slice(0, 4).map(feature => `<span>${escapeHtml(feature)}</span>`).join("");
        const href = `venue.html?id=${encodeURIComponent(item.id)}`;
        return `
          <article class="home-venue-card">
            <a href="${href}" class="home-venue-media" aria-label="View ${escapeHtml(name)}">
              ${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(name)}" loading="lazy">` : `<div class="home-venue-image-fallback" aria-hidden="true">🏨</div>`}
              <div class="home-venue-badges"><span class="home-venue-badge verified">✓ Verified Partner</span>${item.featured ? `<span class="home-venue-badge">Featured</span>` : ""}</div>
            </a>
            <div class="home-venue-content">
              <p class="home-venue-location">⌖ ${escapeHtml(locationText)}</p>
              <h3><a href="${href}">${escapeHtml(name)}</a></h3>
              <div class="home-venue-facts"><span>${escapeHtml(capacity)}</span><span>${escapeHtml(price)}</span></div>
              ${featureMarkup ? `<div class="home-venue-features">${featureMarkup}</div>` : ""}
              <div class="home-venue-actions"><a class="primary-btn" href="${href}">View Venue →</a><a class="secondary-btn" href="${href}&quote=1">Check Availability</a></div>
            </div>
          </article>`;
      }).join("");
      section.hidden = false;
    } catch (error) {
      console.warn("Homepage venues unavailable:", error);
    }
  }

  function safeInit() {
    installCustomerEnquiryInsertBridge();
    installConfirmationStyles();
    installPopupConfirmationNormalizer();
    injectHomePartnerOffer();
    ensureEmailField();
    installMainEnquiryEnhancements();
    installWhatsappIconCleanup();
    installHeaderTweaks();
    window.setTimeout(loadHomepageVenues, 350);
  }

  onReady(safeInit);
})();