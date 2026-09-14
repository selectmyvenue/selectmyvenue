(function () {
  "use strict";

  const PERFORMANCE_CSS_VERSION = "20260914-filter-apply-1";
  const SUCCESS_TEXT = "Requirement received! Thank you for choosing Select My Venue. Our venue team will contact you within 30 minutes to understand your event and help you with suitable venue options.";
  const DUPLICATE_TEXT = SUCCESS_TEXT;
  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const ATTRIBUTION_STORAGE_KEY = "smv-traffic-attribution-v1";

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
  const escapeHtml = value => String(value ?? "").replace(/[&<>'\"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'\"':"&quot;"})[character]);

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
      document.querySelectorAll("form").forEach(form => { if (form.querySelector("#smvPopupName")) addHoneypot(form); });
    };
    prepare();
    new MutationObserver(prepare).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("submit", event => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const isMain = form.id === "customerEnquiryForm";
      const popupName = form.querySelector("#smvPopupName");
      if (!isMain && !popupName) return;
      if (clean(form.elements?._smv_company_website?.value)) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      const nameField = isMain ? document.getElementById("customerName") : popupName;
      const mobileField = isMain ? document.getElementById("customerMobile") : form.querySelector("#smvPopupMobile");
      if (nameField && !isHumanName(nameField.value)) {
        event.preventDefault(); event.stopImmediatePropagation();
        nameField.setCustomValidity("Please enter your real name using letters only."); nameField.reportValidity(); nameField.focus();
        nameField.addEventListener("input", function clear(){ nameField.setCustomValidity(""); nameField.removeEventListener("input", clear); });
        return;
      }
      if (mobileField && !isValidIndianMobile(mobileField.value)) {
        event.preventDefault(); event.stopImmediatePropagation();
        mobileField.setCustomValidity("Please enter a valid 10-digit Indian mobile number."); mobileField.reportValidity(); mobileField.focus();
        mobileField.addEventListener("input", function clear(){ mobileField.setCustomValidity(""); mobileField.removeEventListener("input", clear); });
      }
    }, true);
  }

  function ensureEmailField() {
    const form = document.getElementById("customerEnquiryForm");
    if (!form) return;
    const existing = document.getElementById("customerEmail");
    if (existing) { const field = existing.closest(".field"); if (field) { field.hidden = false; field.style.display = ""; } return; }
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
    source.value = venue.name ? `Website - ${venue.name}`.slice(0,140) : "Website - Home page";
  }

  function collectMainDetails() {
    const venue = selectedVenueContext();
    return { mobile: mobileDigits(document.getElementById("customerMobile")?.value), location: clean(document.getElementById("customerLocation")?.value), eventType: clean(document.getElementById("customerEventType")?.value), eventDate: clean(document.getElementById("customerEventDate")?.value), venueName: venue.name, venueId: venue.id };
  }

  function duplicateKey(details) {
    if (!details.mobile) return "";
    return [details.mobile,details.eventType,details.eventDate,details.location,details.venueId||details.venueName||"home"].join("|").toLowerCase();
  }

  function isRecentDuplicate(details) {
    const key = duplicateKey(details); if (!key) return false;
    try { return sessionStorage.getItem("smv-last-main-enquiry-key") === key && Date.now() - Number(sessionStorage.getItem("smv-last-main-enquiry-time") || 0) < 90000; } catch (_) { return false; }
  }

  function markSubmitted(details) {
    const key = duplicateKey(details); if (!key) return;
    try { sessionStorage.setItem("smv-last-main-enquiry-key", key); sessionStorage.setItem("smv-last-main-enquiry-time", String(Date.now())); } catch (_) {}
  }

  function showFrontSuccess(message, duplicate) {
    if (!message) return;
    message.textContent = duplicate ? DUPLICATE_TEXT : SUCCESS_TEXT;
    message.className = "form-message success smv-front-success";
    document.getElementById("customerEnquiryForm")?.classList.add("is-sent");
    setTimeout(() => message.scrollIntoView({ behavior:"smooth", block:"center" }), 60);
  }

  function installMainEnquiryEnhancements() {
    const form = document.getElementById("customerEnquiryForm");
    const message = document.getElementById("customerEnquiryMessage");
    if (!form || !message || form.dataset.smvLeadFix === "1") return;
    form.dataset.smvLeadFix = "1";
    ensureEmailField(); applyLeadSourceContext();
    form.addEventListener("input", applyLeadSourceContext, true);
    form.addEventListener("change", applyLeadSourceContext, true);
    form.addEventListener("submit", event => {
      applyLeadSourceContext();
      const details = collectMainDetails(); window.__smvLastMainEnquiryDetails = details;
      if (isRecentDuplicate(details)) { event.preventDefault(); event.stopImmediatePropagation(); showFrontSuccess(message, true); }
    }, true);
    new MutationObserver(() => {
      const text = clean(message.textContent).toLowerCase();
      if (!text || !message.className.includes("success") || message.dataset.smvFinalSuccess === "1") return;
      if (/thank you|received|submitted|success/.test(text)) {
        message.dataset.smvFinalSuccess = "1";
        markSubmitted(window.__smvLastMainEnquiryDetails || collectMainDetails());
        showFrontSuccess(message, false);
      }
    }).observe(message, { childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:["class"] });
  }

  function installPopupConfirmationNormalizer() {
    if (window.__smvPopupConfirmationNormalizerInstalled) return;
    window.__smvPopupConfirmationNormalizerInstalled = true;
    const normalize = () => document.querySelectorAll(".smv-popup-success").forEach(panel => {
      const h = panel.querySelector("h3"), p = panel.querySelector("p");
      if (h) h.textContent = "Requirement received!";
      if (p) p.textContent = SUCCESS_TEXT.replace("Requirement received! ", "");
    });
    normalize(); new MutationObserver(normalize).observe(document.body,{childList:true,subtree:true});
  }

  function injectHomePartnerOffer() {
    const main = document.querySelector("body > main");
    if (!main || document.getElementById("smvHomePartnerOffer")) return;
    const offer = document.createElement("div"); offer.id="smvHomePartnerOffer"; offer.className="smv-home-offer-wrap";
    offer.innerHTML='<section class="smv-home-offer"><div class="smv-home-offer-copy"><div class="smv-home-offer-kicker">📣 <b>Launch Offer</b> • Founding Venue Partners</div><h2>List Your Venue <span>FREE.</span></h2><p class="smv-home-offer-lead">Professional venue presence + relevant customer enquiry opportunities during launch.</p><div class="smv-home-offer-badges"><div class="smv-home-offer-badge"><strong>₹0</strong><small>JOINING FEE</small></div><div class="smv-home-offer-badge"><strong>FREE</strong><small>VENUE LISTING</small></div><div class="smv-home-offer-badge"><strong>PARTNER</strong><small>CRM ACCESS</small></div><div class="smv-home-offer-badge gold"><strong>10-DAY</strong><small>TRIAL</small></div></div><div class="smv-home-offer-strip">🎁 LIMITED LAUNCH OFFER — NO PAYMENT REQUIRED ✨</div></div><aside class="smv-home-offer-side"><h3>Your Founding Partner <span>launch benefits</span></h3><ul class="smv-home-offer-list"><li>Professional venue profile</li><li>₹0 joining fee</li><li>Partner CRM access</li><li>Relevant enquiries</li><li>Verified Partner opportunity</li><li>No commission to join</li><li>10-day complimentary trial</li><li>No long-term commitment</li></ul><div class="smv-home-offer-cta-row"><a class="smv-home-offer-btn" href="list-your-venue.html">LIST YOUR VENUE FREE →</a><div class="smv-home-offer-growth"><b>♛</b>Grow your bookings<br>with us!</div></div><p class="smv-home-offer-note">Joining does not guarantee enquiries or bookings. No obligation after the complimentary period.</p></aside></section>';
    main.insertAdjacentElement("afterbegin", offer);
  }

  function installWhatsappIconCleanup() {
    const cleanIcon = () => { const f=document.querySelector(".floating-whatsapp"); if(!f)return; f.querySelectorAll(".floating-whatsapp-text").forEach(n=>n.remove()); f.setAttribute("aria-label","Chat with Select My Venue on WhatsApp"); f.title="WhatsApp"; };
    cleanIcon(); new MutationObserver(cleanIcon).observe(document.body,{childList:true,subtree:true});
  }

  function installHeaderTweaks() {
    const nav=document.getElementById("mainNav"); if(!nav||nav.dataset.smvHeaderFix==="1")return; nav.dataset.smvHeaderFix="1";
    if(!nav.querySelector("a[href^='tel:']")){const a=document.createElement("a");a.href="tel:+918368322256";a.textContent="☎ +91 83683 22256";const list=nav.querySelector("a[href='list-your-venue.html']");list?nav.insertBefore(a,list):nav.appendChild(a);}
  }

  function polishContactIcons(){["✉","☎","◉","⌂"].forEach((x,i)=>{const icon=document.querySelectorAll(".contact-grid .contact-card")[i]?.querySelector("b");if(icon)icon.textContent=x;});}

  function simplifyHomeVenueHeading(){
    const section=document.getElementById("featuredVenues"); if(!section)return;
    section.querySelector(".home-venues-heading-actions .secondary-btn")?.remove();
    const p=section.querySelector(".home-venues-heading-actions p"); if(p)p.textContent="Browse all currently verified venue profiles here with location, capacity, pricing and facilities.";
  }

  async function loadHomepageVenues(){
    const section=document.getElementById("featuredVenues"),grid=document.getElementById("homeVenueGrid");
    if(!section||!grid||!window.supabase?.createClient)return;
    try{
      const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      let result=await client.rpc("smv_public_venues");
      if(result.error&&/function|schema cache/i.test(String(result.error.message||""))) result=await client.from("venues").select("id,venue_name,venue_type,description,city,area,capacity_min,capacity_max,price_min_per_person,price_max_per_person,food_veg,food_non_veg,parking_available,rooms_available,catering_available,decoration_available,cover_image_url,featured,event_types").eq("venue_status","approved").eq("verification_status","verified").eq("public_listing_enabled",true).order("featured",{ascending:false}).order("venue_name",{ascending:true});
      if(result.error)throw result.error;
      const rows=(Array.isArray(result.data)?result.data:[]).map(x=>x?.venue||x).filter(Boolean); if(!rows.length)return;
      grid.innerHTML=rows.map(item=>{
        const name=clean(item.venue_name)||"Verified Venue",locationText=[clean(item.area),clean(item.city)].filter(Boolean).join(", ")||"Location on request",cover=clean(item.cover_image_url);
        const max=Number(item.capacity_max||0),min=Number(item.capacity_min||0),price=Number(item.price_min_per_person||0);
        const capacity=max?`Up to ${max.toLocaleString("en-IN")} guests`:min?`${min.toLocaleString("en-IN")}+ guests`:"Capacity on request";
        const priceText=price?`From ₹${price.toLocaleString("en-IN")}/person`:"Quote on request";
        const features=[];if(item.food_veg)features.push("Vegetarian");if(item.food_non_veg)features.push("Non-Vegetarian");if(item.parking_available)features.push("Parking");if(item.rooms_available)features.push("Rooms");if(item.catering_available)features.push("Catering");if(item.decoration_available)features.push("Decoration");
        const href=`venue.html?id=${encodeURIComponent(item.id)}`;
        return `<article class="home-venue-card" data-venue-type="${escapeHtml(clean(item.venue_type))}" data-capacity="${max||min||0}" data-price="${price||0}"><a href="${href}" class="home-venue-media" aria-label="View ${escapeHtml(name)}">${cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async">`:'<div class="home-venue-image-fallback" aria-hidden="true">🏨</div>'}<div class="home-venue-badges"><span class="home-venue-badge verified">✓ Verified Partner</span>${item.featured?'<span class="home-venue-badge">Featured</span>':''}</div></a><div class="home-venue-content"><p class="home-venue-location">⌖ ${escapeHtml(locationText)}</p><h3><a href="${href}">${escapeHtml(name)}</a></h3><div class="home-venue-facts"><span>${escapeHtml(capacity)}</span><span>${escapeHtml(priceText)}</span></div>${features.length?`<div class="home-venue-features">${features.slice(0,4).map(f=>`<span>${escapeHtml(f)}</span>`).join("")}</div>`:""}<div class="home-venue-actions"><a class="primary-btn" href="${href}">View Venue →</a><a class="secondary-btn" href="${href}&quote=1">Check Availability</a></div></div></article>`;
      }).join("");
      simplifyHomeVenueHeading();section.hidden=false;
    }catch(error){console.warn("Homepage venues unavailable:",error);}
  }

  function installHomeFilterApplyUX(){
    if(window.__smvHomeFilterApplyUX)return;window.__smvHomeFilterApplyUX=true;
    let applied=false,stagedQuick="all";
    const style=document.createElement("style");style.id="smvHomeFilterApplyStyles";style.textContent="#featuredVenues .smv-home-filter-actions{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:13px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}#featuredVenues .smv-home-apply{min-height:43px;border:0;border-radius:11px;background:linear-gradient(135deg,#31dac2,#0f9482);color:#03231f;font:inherit;font-size:10.5px;font-weight:950;cursor:pointer}#featuredVenues .smv-home-clear{min-height:43px;padding:0 11px;border:1px solid rgba(232,189,104,.28);border-radius:11px;background:rgba(232,189,104,.06);color:#f0cf7b;font:inherit;font-size:9.5px;font-weight:900;cursor:pointer}#featuredVenues .smv-home-filter-status{margin-top:8px;color:#9ec0ba;font-size:9px;font-weight:800;line-height:1.4}#featuredVenues .smv-home-filter-status strong{color:#f0cf7b}@media(max-width:520px){#featuredVenues .smv-home-filter-actions{grid-template-columns:1fr}}";document.head.appendChild(style);
    function install(){
      const panel=document.querySelector("#featuredVenues .smv-home-filter-panel"),grid=document.getElementById("homeVenueGrid");if(!panel||!grid)return false;
      if(!document.getElementById("smvHomeApply")){
        const old=panel.querySelector(".smv-home-filter-footer");if(old)old.style.display="none";
        const a=document.createElement("div");a.className="smv-home-filter-actions";a.innerHTML='<button id="smvHomeApply" class="smv-home-apply" type="button">Show Matching Venues →</button><button id="smvHomeClear" class="smv-home-clear" type="button">Clear All</button>';panel.appendChild(a);
        const s=document.createElement("div");s.id="smvHomeFilterStatus";s.className="smv-home-filter-status";s.innerHTML='Select requirements, then press <strong>Show Matching Venues</strong>.';panel.appendChild(s);
        document.getElementById("smvHomeApply").addEventListener("click",apply);
        document.getElementById("smvHomeClear").addEventListener("click",clearAll);
        const cap=document.getElementById("smvHomeCapacity");cap?.querySelectorAll("option").forEach(o=>{if(o.value&&o.value!=="1000")o.textContent="Venue capacity "+o.value+"+ guests";});
        panel.addEventListener("input",e=>{if(e.target.id==="smvHomeSearch"){e.stopPropagation();dirty();}},true);
        panel.addEventListener("change",e=>{if(["smvHomeLocation","smvHomeCapacity","smvHomeBudget"].includes(e.target.id)){e.stopPropagation();dirty();}},true);
        panel.addEventListener("click",e=>{const b=e.target.closest("#smvHomeQuick [data-filter]");if(!b)return;e.stopPropagation();e.preventDefault();stagedQuick=b.dataset.filter||"all";document.querySelectorAll("#smvHomeQuick [data-filter]").forEach(x=>x.classList.toggle("active",x===b));dirty();},true);
      }
      if(applied)setTimeout(apply,0);return true;
    }
    function dirty(){const s=document.getElementById("smvHomeFilterStatus");if(s)s.textContent="Requirements changed — press Show Matching Venues to update results.";}
    function read(card){const text=(card.textContent||"").toLowerCase();const loc=(card.querySelector(".home-venue-location")?.textContent||"").replace("⌖","").trim().toLowerCase();const cap=Number(card.dataset.capacity||((card.querySelectorAll(".home-venue-facts span")[0]?.textContent||"").match(/[0-9][0-9,]*/g)||[]).pop()?.replace(/,/g,"")||0);const price=Number(card.dataset.price||((card.querySelectorAll(".home-venue-facts span")[1]?.textContent||"").match(/[0-9][0-9,]*/)||[0])[0].toString().replace(/,/g,"")||0);return{text,loc,cap,price};}
    function apply(){
      const grid=document.getElementById("homeVenueGrid");if(!grid)return;
      const q=clean(document.getElementById("smvHomeSearch")?.value).toLowerCase(),loc=clean(document.getElementById("smvHomeLocation")?.value).toLowerCase(),guests=Number(document.getElementById("smvHomeCapacity")?.value||0),budget=Number(document.getElementById("smvHomeBudget")?.value||0);let visible=0;
      [...grid.querySelectorAll(".home-venue-card")].forEach(card=>{const d=read(card);let ok=!q||d.text.includes(q);if(ok&&loc)ok=d.loc.includes(loc);if(ok&&guests)ok=!!d.cap&&(guests===1000?d.cap>=1000:d.cap>=guests);if(ok&&budget)ok=!!d.price&&d.price<=budget;if(ok&&stagedQuick==="parking")ok=d.text.includes("parking");if(ok&&stagedQuick==="rooms")ok=d.text.includes("rooms");if(ok&&stagedQuick==="veg")ok=d.text.includes("vegetarian");if(ok&&stagedQuick==="nonveg")ok=d.text.includes("non-vegetarian");if(ok&&stagedQuick==="300plus")ok=d.cap>=300;card.hidden=!ok;if(ok)visible++;});
      const no=document.querySelector("#featuredVenues .smv-home-no-results");if(no)no.style.display=visible?"none":"block";const s=document.getElementById("smvHomeFilterStatus");if(s)s.innerHTML='<strong>'+visible+'</strong> matching venue'+(visible===1?'':'s')+' shown.';applied=true;document.querySelector("#featuredVenues .smv-home-results")?.scrollIntoView({behavior:"smooth",block:"start"});
    }
    function clearAll(){["smvHomeSearch","smvHomeLocation","smvHomeCapacity","smvHomeBudget"].forEach(id=>{const x=document.getElementById(id);if(x)x.value="";});stagedQuick="all";document.querySelectorAll("#smvHomeQuick [data-filter]").forEach(x=>x.classList.toggle("active",x.dataset.filter==="all"));document.querySelectorAll("#homeVenueGrid .home-venue-card").forEach(card=>card.hidden=false);const no=document.querySelector("#featuredVenues .smv-home-no-results");if(no)no.style.display="none";const s=document.getElementById("smvHomeFilterStatus");if(s)s.innerHTML='Filters cleared. <strong>All verified venues</strong> are shown.';applied=false;}
    const observer=new MutationObserver(install);observer.observe(document.body,{childList:true,subtree:true});install();
  }

  function safeInit(){
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
    installHomeFilterApplyUX();
    window.setTimeout(loadHomepageVenues,350);
  }

  onReady(safeInit);
})();