(function () {
  "use strict";

  function installFoundingPartnerOffer() {
    if (document.getElementById("smvFoundingPartnerOffer")) return;

    const style = document.createElement("style");
    style.id = "smvFoundingPartnerOfferStyles";
    style.textContent = `
      /* Homepage injected polish — compact standard size, no global font boost */
      .floating-whatsapp{position:fixed!important;right:22px!important;bottom:22px!important;z-index:9999!important;width:56px!important;height:56px!important;min-width:56px!important;min-height:56px!important;padding:0!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:#25D366!important;color:#fff!important;border:3px solid #fff!important;box-shadow:0 12px 28px rgba(0,0,0,.25),0 0 0 7px rgba(37,211,102,.10)!important;text-decoration:none!important;transition:transform .18s ease,box-shadow .18s ease!important}
      .floating-whatsapp:hover{transform:translateY(-2px) scale(1.035)!important;box-shadow:0 16px 34px rgba(0,0,0,.30),0 0 0 9px rgba(37,211,102,.12)!important}
      .floating-whatsapp-icon{width:31px!important;height:31px!important;display:grid!important;place-items:center!important;color:#fff!important;background:transparent!important;border-radius:0!important}.floating-whatsapp-icon svg{width:31px!important;height:31px!important;display:block!important;color:#fff!important}.floating-whatsapp-text{position:absolute!important;right:68px!important;top:50%!important;transform:translateY(-50%)!important;padding:8px 11px!important;border-radius:999px!important;background:#075E54!important;color:#fff!important;font-size:11px!important;font-weight:900!important;white-space:nowrap!important;box-shadow:0 8px 20px rgba(0,0,0,.20)!important;opacity:0!important;pointer-events:none!important;transition:.18s ease!important}.floating-whatsapp:hover .floating-whatsapp-text{opacity:1!important;right:74px!important}
      @media(max-width:620px){.floating-whatsapp{right:14px!important;bottom:14px!important;width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important}.floating-whatsapp-icon,.floating-whatsapp-icon svg{width:29px!important;height:29px!important}.floating-whatsapp-text{display:none!important}}

      .smv-owner-launch-wrap{position:relative;z-index:30;width:100%;padding:14px 22px;overflow:hidden;background:radial-gradient(circle at 8% 20%,rgba(25,216,189,.12),transparent 24%),radial-gradient(circle at 92% 12%,rgba(243,200,75,.08),transparent 22%),linear-gradient(180deg,#031b19 0%,#031817 100%);border-bottom:1px solid rgba(25,216,189,.13)}
      .smv-owner-launch-panel{position:relative;width:min(100%,1580px);margin:0 auto;padding:18px 22px;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(360px,.92fr);gap:22px;align-items:center;overflow:hidden;border:1px solid rgba(25,216,189,.36);border-radius:24px;color:#f3fbfa;background:radial-gradient(circle at 0% 0%,rgba(25,216,189,.10),transparent 34%),radial-gradient(circle at 100% 0%,rgba(243,200,75,.06),transparent 30%),linear-gradient(135deg,#06322d 0%,#03231f 42%,#031a18 100%);box-shadow:0 20px 44px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.025)}
      .smv-owner-launch-panel::after{content:"";position:absolute;inset:-70% -25%;background:linear-gradient(110deg,transparent 45%,rgba(255,255,255,.045) 50%,transparent 55%);transform:translateX(-74%);animation:smvHomepageOfferShine 7s ease-in-out infinite;pointer-events:none}
      .smv-owner-launch-left,.smv-owner-launch-right{position:relative;z-index:1}
      .smv-owner-launch-kicker{display:inline-flex;align-items:center;gap:8px;min-height:31px;padding:0 12px;border-radius:999px;border:1px solid rgba(25,216,189,.40);color:#20dcc3;background:rgba(25,216,189,.055);font-size:10px!important;font-weight:950;letter-spacing:.13em;text-transform:uppercase}
      .smv-owner-launch-kicker::before{content:"";width:7px;height:7px;border-radius:50%;background:#19d8bd;box-shadow:0 0 12px rgba(25,216,189,.65);animation:smvHomepageDotPulse 1.6s ease-in-out infinite}
      .smv-owner-launch-heading{margin:11px 0 6px;max-width:820px;color:#f3fbfa;font-size:clamp(32px,3.35vw,52px);line-height:1;font-weight:1000;letter-spacing:-.04em}
      .smv-owner-launch-heading span{color:#19d8bd;text-shadow:0 0 20px rgba(25,216,189,.14);animation:smvHomepageFreePulse 1.9s ease-in-out infinite}
      .smv-owner-launch-copy{max-width:820px;margin:0;color:#a9cbc6;font-size:13px!important;line-height:1.58!important}
      .smv-owner-launch-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
      .smv-owner-launch-chips span{display:inline-flex;align-items:center;min-height:32px;padding:0 11px;border-radius:11px;border:1px solid rgba(25,216,189,.25);color:#f3fbfa;background:rgba(25,216,189,.055);font-size:10px!important;font-weight:900;white-space:nowrap}
      .smv-owner-launch-chips .trial-chip{color:#ffe47a;border-color:rgba(243,200,75,.46);background:rgba(243,200,75,.06);animation:smvTrialGlow 2.1s ease-in-out infinite}
      .smv-owner-launch-limited{display:flex;align-items:center;justify-content:center;margin-top:12px;min-height:39px;padding:7px 12px;border-radius:13px;border:1px solid rgba(243,200,75,.58);background:linear-gradient(90deg,rgba(243,200,75,.10),rgba(243,200,75,.03));color:#ffe9a0;font-size:11px!important;font-weight:1000;letter-spacing:.03em;text-align:center}
      .smv-owner-launch-right{padding:17px 18px;border:1px solid rgba(25,216,189,.20);border-radius:19px;background:rgba(2,28,25,.77);box-shadow:0 15px 32px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.02)}
      .smv-owner-launch-right h3{margin:0 0 10px;color:#fff;font-size:18px!important;line-height:1.2;font-weight:950}
      .smv-owner-launch-benefit-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px}
      .smv-owner-launch-benefit{display:flex;gap:8px;align-items:flex-start;color:#c4dcda;font-size:12px!important;line-height:1.42!important}
      .smv-owner-launch-benefit::before{content:"✓";flex:0 0 auto;color:#19d8bd;font-size:13px;font-weight:1000;line-height:1;margin-top:1px}
      .smv-owner-launch-cta-row{display:flex;align-items:center;gap:10px;margin-top:15px}
      .smv-owner-launch-cta{display:inline-flex;align-items:center;justify-content:center;min-height:43px;padding:0 17px;border-radius:12px;border:1px solid rgba(31,235,207,.50);background:linear-gradient(135deg,#20dcc3,#0fc8b0);color:#02211c;font-size:12px!important;font-weight:1000;text-decoration:none;white-space:nowrap;box-shadow:0 10px 24px rgba(15,200,176,.16);animation:smvHomepageCtaPulse 2.1s ease-in-out infinite;transition:.2s ease}
      .smv-owner-launch-cta:hover{transform:translateY(-1px);filter:brightness(1.05)}
      .smv-owner-launch-trust{margin-top:9px;color:#8fb8b3;font-size:10.5px!important;line-height:1.45!important}
      .site-header{height:62px!important}.header-inner{padding-left:14px!important;padding-right:14px!important;gap:8px!important}.brand{width:140px!important;flex:0 0 140px!important;height:58px!important}.brand img{width:132px!important;max-height:50px!important;object-fit:contain!important}#mainNav{min-width:0!important;gap:4px!important;margin-left:auto!important;justify-content:flex-end!important;align-items:center!important}#mainNav>a:not(.smv-header-action){position:relative;display:inline-flex!important;align-items:center;justify-content:center;min-height:34px;padding:0 7px!important;border-radius:9px;color:#b9cfcc!important;font-size:11.4px!important;font-weight:800!important;white-space:nowrap;background:rgba(255,255,255,.015);border:1px solid transparent;transition:.18s ease}#mainNav>a:not(.smv-header-action)::after{display:none!important}#mainNav>a:not(.smv-header-action).active{color:#fff!important;background:rgba(25,216,189,.08);border-color:rgba(25,216,189,.18);box-shadow:inset 0 -2px 0 #19d8bd}#mainNav .smv-header-action{min-height:36px;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;font-size:11.6px!important;transition:transform .2s ease,border-color .2s ease,background .2s ease,box-shadow .2s ease,color .2s ease}#mainNav a.smv-find-nav{padding:0 10px!important;border:1px solid rgba(25,216,189,.44)!important;background:linear-gradient(180deg,rgba(25,216,189,.08),rgba(25,216,189,.02))!important;color:#2ce3ca!important}#mainNav a.smv-header-phone{position:relative;padding:0 9px!important;gap:5px;color:#f3fbfa!important;font-weight:900!important;white-space:nowrap;border:1px solid rgba(25,216,189,.16);background:linear-gradient(180deg,rgba(255,255,255,.022),rgba(25,216,189,.02))}#mainNav a.smv-header-phone::before{content:"☎";width:20px;height:20px;display:grid;place-items:center;border-radius:50%;color:#02211c;background:linear-gradient(135deg,#2ce3ca,#19d8bd);font-size:10px}#mainNav a.smv-owner-nav-offer{position:relative;padding:0 10px!important;border:1px solid rgba(243,200,75,.48);border-radius:999px;color:#ffe47a!important;background:linear-gradient(180deg,rgba(243,200,75,.08),rgba(243,200,75,.02))}#mainNav a.smv-owner-nav-offer::before{content:"FREE";position:absolute;top:-8px;right:7px;min-width:27px;height:15px;padding:0 4px;display:grid;place-items:center;border-radius:999px;border:2px solid #031817;background:#19d8bd;color:#02211c;font-size:6px;font-weight:1000;letter-spacing:.07em}#mainNav a.smv-find-nav::after,#mainNav a.smv-header-phone::after,#mainNav a.smv-owner-nav-offer::after{display:none!important}
      @media(max-width:1650px){.brand{width:126px!important;flex-basis:126px!important}.brand img{width:120px!important}#mainNav{gap:3px!important}#mainNav>a:not(.smv-header-action){font-size:10.8px!important;padding:0 5px!important;min-height:33px}#mainNav .smv-header-action{font-size:10.8px!important;min-height:34px}#mainNav a.smv-find-nav,#mainNav a.smv-owner-nav-offer{padding:0 8px!important}#mainNav a.smv-header-phone{padding:0 7px!important}}
      @media(max-width:1450px){#mainNav a[href="#aiPlanner"],#mainNav a[href="delhi-ncr-venues.html"],#mainNav a[href="#smart"]{display:none!important}.brand{width:132px!important;flex-basis:132px!important}.brand img{width:126px!important}}
      #home{min-height:390px!important}#home .hero-inner{min-height:390px!important;padding-top:42px!important;padding-bottom:38px!important}#home h1{font-size:clamp(34px,3.9vw,58px)!important;line-height:1.02!important}
      @keyframes smvHomepageDotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.78)}}@keyframes smvHomepageFreePulse{0%,100%{opacity:1;filter:brightness(1)}50%{opacity:.86;filter:brightness(1.12)}}@keyframes smvTrialGlow{0%,100%{box-shadow:0 0 0 rgba(243,200,75,0)}50%{box-shadow:0 0 14px rgba(243,200,75,.12)}}@keyframes smvHomepageCtaPulse{0%,100%{box-shadow:0 10px 24px rgba(15,200,176,.16)}50%{box-shadow:0 10px 27px rgba(15,200,176,.22)}}@keyframes smvOwnerNavGlow{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 6px 16px rgba(0,0,0,.10)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 6px 18px rgba(243,200,75,.08)}}@keyframes smvHomepageOfferShine{0%,72%,100%{transform:translateX(-74%)}86%{transform:translateX(74%)}}
      @media(max-width:1100px){.smv-owner-launch-panel{grid-template-columns:1fr;gap:14px;padding:18px}.smv-owner-launch-right{padding:16px 18px}.smv-owner-launch-heading{font-size:clamp(32px,6.2vw,48px)}}
      @media(max-width:760px){.smv-owner-launch-wrap{padding:10px}.smv-owner-launch-panel{padding:15px 13px;border-radius:19px}.smv-owner-launch-heading{font-size:clamp(32px,10vw,44px)}.smv-owner-launch-benefit-grid{grid-template-columns:1fr}.smv-owner-launch-copy{font-size:12.5px!important}.smv-owner-launch-limited{font-size:10px!important}#home{min-height:360px!important}#home .hero-inner{min-height:360px!important;padding-top:34px!important;padding-bottom:34px!important}}
      @media(max-width:520px){.smv-owner-launch-kicker{font-size:8.5px!important;min-height:29px;padding:0 10px}.smv-owner-launch-heading{font-size:34px}.smv-owner-launch-chips{gap:6px}.smv-owner-launch-chips span{min-height:31px;padding:0 9px;font-size:9px!important}.smv-owner-launch-right{padding:14px}.smv-owner-launch-right h3{font-size:16px!important}.smv-owner-launch-cta{width:100%;font-size:11px!important}}
      @media(prefers-reduced-motion:reduce){.smv-owner-launch-panel::after,.smv-owner-launch-kicker::before,.smv-owner-launch-heading span,.smv-owner-launch-chips .trial-chip,.smv-owner-launch-cta,#mainNav a.smv-owner-nav-offer{animation:none!important}}
    `;
    document.head.appendChild(style);

    const main = document.querySelector("main");
    const hero = document.getElementById("home");
    if (main && hero) {
      const section = document.createElement("section");
      section.id = "smvFoundingPartnerOffer";
      section.className = "smv-owner-launch-wrap";
      section.setAttribute("aria-label", "Founding Venue Partner launch offer");
      section.innerHTML = `<div class="smv-owner-launch-panel"><div class="smv-owner-launch-left"><div class="smv-owner-launch-kicker">Launch Offer · Founding Venue Partners</div><h2 class="smv-owner-launch-heading">List Your Venue <span>FREE.</span></h2><p class="smv-owner-launch-copy">Join the Select My Venue partner network during our launch phase. We help create your venue profile and give eligible partners access to tools for managing relevant customer enquiry opportunities.</p><div class="smv-owner-launch-chips"><span>₹0 JOINING FEE</span><span>FREE VENUE LISTING</span><span>PARTNER CRM ACCESS</span><span class="trial-chip">10-DAY COMPLIMENTARY LAUNCH TRIAL</span></div><div class="smv-owner-launch-limited">✨ LIMITED LAUNCH OFFER — NO PAYMENT REQUIRED TO GET STARTED ✨</div></div><aside class="smv-owner-launch-right"><h3>Your Founding Partner launch benefits</h3><div class="smv-owner-launch-benefit-grid"><div class="smv-owner-launch-benefit">Professional venue profile</div><div class="smv-owner-launch-benefit">₹0 joining fee</div><div class="smv-owner-launch-benefit">Partner CRM access</div><div class="smv-owner-launch-benefit">Relevant enquiry opportunities</div><div class="smv-owner-launch-benefit">Verified Partner opportunity</div><div class="smv-owner-launch-benefit">No commission to join</div><div class="smv-owner-launch-benefit">10-day complimentary trial</div><div class="smv-owner-launch-benefit">No long-term commitment</div></div><div class="smv-owner-launch-cta-row"><a class="smv-owner-launch-cta" href="list-your-venue.html">LIST YOUR VENUE FREE →</a></div><p class="smv-owner-launch-trust">You stay in control. Joining does not guarantee enquiries or bookings, and there is no obligation to continue after the complimentary period.</p></aside></div>`;
      main.insertBefore(section, hero);
    }

    const findLink = document.querySelector('#mainNav a.nav-cta[href="#enquiry"]');
    if (findLink) findLink.classList.add("smv-header-action", "smv-find-nav");
    const navOffer = document.querySelector('#mainNav a[href="list-your-venue.html"]');
    if (navOffer) {
      navOffer.classList.add("smv-header-action", "smv-owner-nav-offer");
      navOffer.setAttribute("title", "Founding Venue Partner Offer — List Your Venue FREE");
      navOffer.setAttribute("aria-label", "List Your Venue FREE — Founding Venue Partner Offer");
    }
    const contactLink = document.querySelector('#mainNav a[href="#contact"]');
    if (contactLink) {
      contactLink.textContent = "+91 83683 22256";
      contactLink.href = "tel:+918368322256";
      contactLink.classList.add("smv-header-action", "smv-header-phone");
      contactLink.setAttribute("aria-label", "Call Select My Venue at +91 83683 22256");
      contactLink.setAttribute("title", "Call +91 83683 22256");
    }
  }

  installFoundingPartnerOffer();

  if (!document.getElementById("smvSmartMatchLoader")) {
    const smartMatchScript = document.createElement("script");
    smartMatchScript.id = "smvSmartMatchLoader";
    smartMatchScript.src = "smv-smart-match.js?v=20260901-smart-match-1";
    smartMatchScript.defer = true;
    document.head.appendChild(smartMatchScript);
  }

  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const section = document.getElementById("featuredVenues");
  const grid = document.getElementById("homeVenueGrid");
  if (!section || !grid) return;

  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const escapeHtml = value => String(value ?? "").replace(/[&<>'\"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '\"': "&quot;" })[character]);
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
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(number);
  }
  function capacity(venue) {
    const minimum = Number(venue.capacity_min || 0), maximum = Number(venue.capacity_max || 0);
    if (minimum && maximum) return `${minimum}–${maximum} guests`;
    if (maximum) return `Up to ${maximum} guests`;
    if (minimum) return `${minimum}+ guests`;
    return "On request";
  }
  function pricing(venue) {
    const minimum = money(venue.price_min_per_person), maximum = money(venue.price_max_per_person);
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
    const location = [venue.area, venue.city].filter(Boolean).join(", ") || "Location on request";
    const featureList = features(venue);
    const profileUrl = `venue.html?id=${id}`;
    const quoteUrl = `index.html?venue=${id}&venue_name=${encodeURIComponent(name)}#enquiry`;
    const media = imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)} venue" loading="lazy" decoding="async">` : `<div class="home-venue-image-fallback" aria-hidden="true">🏨</div>`;
    const featureHtml = featureList.length ? featureList.map(item => `<span>✓ ${escapeHtml(item)}</span>`).join("") : `<span>Details on request</span>`;
    return `<article class="home-venue-card" data-venue-id="${escapeHtml(rawId)}" data-profile-url="${escapeHtml(profileUrl)}" role="link" tabindex="0" aria-label="Open ${escapeHtml(name)} venue profile"><div class="home-venue-media">${media}<div class="home-venue-badges"><span class="home-venue-badge">${escapeHtml(venue.venue_type || "Venue")}</span><span class="home-venue-badge verified">✓ Verified</span></div></div><div class="home-venue-content"><h3>${escapeHtml(name)}</h3><p class="home-venue-location">⌖ ${escapeHtml(location)}</p><div class="home-venue-facts"><div class="home-venue-fact"><span>Capacity</span><strong>${escapeHtml(capacity(venue))}</strong></div><div class="home-venue-fact"><span>Starting range</span><strong>${escapeHtml(pricing(venue))}</strong></div></div><div class="home-venue-features">${featureHtml}</div><div class="home-venue-actions"><a class="secondary-btn" href="${profileUrl}">View Profile</a><a class="primary-btn" href="${quoteUrl}">Get Quote</a></div></div></article>`;
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
    if (!client) { hideShowcase(); return; }
    const { data, error } = await client.rpc("smv_public_venues");
    if (error) { console.error("Homepage venue showcase error:", error); hideShowcase(); return; }
    const venues = Array.isArray(data) ? data.map(item => item?.venue || item).filter(Boolean) : [];
    if (!venues.length) { hideShowcase(); return; }
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
