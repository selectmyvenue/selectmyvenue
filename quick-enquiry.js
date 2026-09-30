/* Select My Venue — direct quick enquiry -> Supabase -> CRM */
"use strict";

(function () {
  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const PREMIUM_SUCCESS = "Requirement received! Thank you for choosing Select My Venue. Our venue team will review your event details and contact you as soon as possible during support hours.";
  const GOOGLE_ADS_TAG_ID = "AW-18435642634";
  const GOOGLE_ADS_CONVERSION_SEND_TO = "AW-18435642634/_rfMCLfZsfAcEIqq5tZE";
  const ATTRIBUTION_STORAGE_KEY = "smv-traffic-attribution-v1";

  function installGoogleAdsTag() {
    if (window.__smvGoogleAdsTagInstalled || document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GOOGLE_ADS_TAG_ID}"]`)) {
      window.__smvGoogleAdsTagInstalled = true;
      return;
    }

    window.__smvGoogleAdsTagInstalled = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GOOGLE_ADS_TAG_ID);

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_TAG_ID}`;
    document.head.appendChild(script);
  }

  function fireGoogleAdsLeadConversion() {
    try {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("event", "conversion", {
        send_to: GOOGLE_ADS_CONVERSION_SEND_TO,
        value: 1.0,
        currency: "INR"
      });
    } catch (error) {
      console.warn("Google Ads conversion tracking warning:", error);
    }
  }

  installGoogleAdsTag();

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function mobileDigits(value) {
    return clean(value).replace(/[^0-9]/g, "").slice(-10);
  }

  function numberOrNull(value) {
    const n = Number(String(value || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function todayIso() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function isHumanName(value) {
    const name = clean(value);
    if (name.length < 2 || name.length > 80) return false;
    if (/\d/.test(name)) return false;
    if (!/[A-Za-z\u00C0-\u024F\u0900-\u097F]{2}/u.test(name.replace(/\s/g, ""))) return false;
    return /^[A-Za-z\u00C0-\u024F\u0900-\u097F .'-]+$/u.test(name);
  }

  function isValidIndianMobile(value) {
    return /^[6-9][0-9]{9}$/.test(value) && !/^(\d)\1{9}$/.test(value);
  }

  function captureAttribution() {
    let saved = {};
    try {
      saved = JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}") || {};
    } catch (_) {}

    const params = new URLSearchParams(location.search);
    const keys = ["gclid", "gbraid", "wbraid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    keys.forEach(key => {
      const value = clean(params.get(key));
      if (value) saved[key] = value.slice(0, 500);
    });

    if (!saved.landing_page) saved.landing_page = location.href.slice(0, 1000);
    if (!saved.first_referrer && document.referrer) saved.first_referrer = document.referrer.slice(0, 1000);
    saved.last_page = location.href.slice(0, 1000);

    try {
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(saved));
    } catch (_) {}
    return saved;
  }

  function getAttribution() {
    return captureAttribution();
  }

  function isGoogleAdsTraffic(attribution) {
    const source = clean(attribution && attribution.utm_source).toLowerCase();
    const medium = clean(attribution && attribution.utm_medium).toLowerCase();
    return !!(
      attribution && (attribution.gclid || attribution.gbraid || attribution.wbraid) ||
      source.includes("google") && /cpc|ppc|paid/.test(medium)
    );
  }

  function clearlyOutsideDelhiGurgaon(locationValue) {
    const value = clean(locationValue).toLowerCase();
    return /\b(hapur|ghaziabad|noida|greater noida|faridabad|meerut|sonipat|sonepat|panipat|rohtak|bulandshahr|aligarh)\b/.test(value);
  }

  function attributionLines(attribution, locationValue) {
    const lines = [];
    if (isGoogleAdsTraffic(attribution)) lines.push("Traffic channel: Google Ads");
    else if (/google\./i.test(clean(attribution.first_referrer))) lines.push("Traffic channel: Google Organic");
    else if (attribution.first_referrer) lines.push("Traffic channel: Referral");
    else lines.push("Traffic channel: Direct / Unknown");

    if (attribution.gclid) lines.push("Google Click ID: " + attribution.gclid);
    if (attribution.gbraid) lines.push("Google GBRAID: " + attribution.gbraid);
    if (attribution.wbraid) lines.push("Google WBRAID: " + attribution.wbraid);
    if (attribution.utm_source) lines.push("UTM Source: " + attribution.utm_source);
    if (attribution.utm_medium) lines.push("UTM Medium: " + attribution.utm_medium);
    if (attribution.utm_campaign) lines.push("UTM Campaign: " + attribution.utm_campaign);
    if (attribution.utm_term) lines.push("UTM Term: " + attribution.utm_term);
    if (attribution.landing_page) lines.push("Landing page: " + attribution.landing_page);
    lines.push("Submitted URL: " + location.href.slice(0, 1000));
    if (isGoogleAdsTraffic(attribution) && clearlyOutsideDelhiGurgaon(locationValue)) {
      lines.push("Paid area check: Outside Delhi / Gurgaon service area");
    }
    return lines;
  }

  function addHoneypot(form) {
    if (!form || form.elements._smv_company_website) return;
    const field = document.createElement("input");
    field.type = "text";
    field.name = "_smv_company_website";
    field.tabIndex = -1;
    field.autocomplete = "off";
    field.setAttribute("aria-hidden", "true");
    field.style.position = "absolute";
    field.style.left = "-10000px";
    field.style.width = "1px";
    field.style.height = "1px";
    field.style.opacity = "0";
    field.style.pointerEvents = "none";
    form.appendChild(field);
  }

  function getPriority(date, guests, budget) {
    let score = 0;
    if (date) score += 2;
    if (guests) score += 1;
    if (budget) score += 1;
    return score >= 3 ? "high" : score >= 1 ? "medium" : "low";
  }

  function extractComment(form) {
    const names = [
      "contact_remark",
      "comment",
      "comments",
      "other_requirements",
      "requirements",
      "message",
      "notes"
    ];
    for (const name of names) {
      const field = form.elements && form.elements[name];
      const value = clean(field && field.value);
      if (value) return value.slice(0, 3000);
    }
    const textarea = form.querySelector("textarea");
    return clean(textarea && textarea.value).slice(0, 3000);
  }

  function setMessage(form, text, type) {
    const node = form.querySelector("[data-quick-message]");
    if (!node) return;
    node.textContent = text || "";
    node.className = "quick-enquiry-message" + (type ? " " + type : "");
  }

  function getMessageNode(form) {
    return form.querySelector("[data-quick-message]");
  }

  function setBusy(button, busy) {
    if (!button) return;
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? "Submitting…" : button.dataset.originalText;
  }

  function pageLabel() {
    const path = (location.pathname || "/").replace(/^\//, "") || "Home page";
    if (path === "index.html" || path === "Home page") return "Home page";
    return path.replace(/\.html$/i, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  function pageSource() {
    const label = pageLabel().toLowerCase();
    if (label.includes("wedding")) return "Website - Wedding page";
    if (label.includes("party")) return "Website - Party page";
    if (label.includes("corporate")) return "Website - Corporate page";
    if (label.includes("delhi ncr")) return "Website - Delhi NCR page";
    if (label.includes("venue")) return "Website - Venue page";
    return "Website - Home page";
  }

  function sourceContext(form) {
    const params = new URLSearchParams(location.search);
    const venueName = clean(
      form.dataset.venueName ||
      form.dataset.venue ||
      params.get("venue_name") ||
      params.get("venueName") ||
      document.querySelector("[data-current-venue-name]")?.getAttribute("data-current-venue-name") ||
      ""
    ).slice(0, 80);
    const venueId = clean(form.dataset.venueId || params.get("venue") || params.get("id") || params.get("venue_id") || "").slice(0, 80);
    const source = venueName ? `Website - Venue: ${venueName}` : pageSource();
    return { source, venueName, venueId, page: pageLabel() };
  }

  function duplicateKey(details) {
    return [details.mobile, details.occasion, details.eventDate, details.location, details.source].join("|").toLowerCase();
  }

  function isDuplicate(details) {
    if (!details.mobile) return false;
    try {
      const key = duplicateKey(details);
      const oldKey = sessionStorage.getItem("smv-last-quick-enquiry-key");
      const oldTime = Number(sessionStorage.getItem("smv-last-quick-enquiry-time") || 0);
      return oldKey === key && Date.now() - oldTime < 90 * 1000;
    } catch (_) {
      return false;
    }
  }

  function markDuplicate(details) {
    try {
      sessionStorage.setItem("smv-last-quick-enquiry-key", duplicateKey(details));
      sessionStorage.setItem("smv-last-quick-enquiry-time", String(Date.now()));
    } catch (_) {}
  }

  function installStyles() {
    if (document.getElementById("smvQuickEnquiryFixStyles")) return;
    const style = document.createElement("style");
    style.id = "smvQuickEnquiryFixStyles";
    style.textContent = `
      .smv-home-enquiry-edge{position:fixed!important;left:0!important;top:var(--smv-edge-top,44%)!important;transform:translateY(-50%)!important;z-index:10040!important;display:block!important;pointer-events:auto!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important;cursor:grab!important;will-change:top,transform!important}.smv-home-enquiry-edge.smv-get-matched-dragging{cursor:grabbing!important}
      .smv-home-enquiry-edge.smv-get-matched-open{top:72px!important;transform:translateY(-50%)!important}
      .smv-home-enquiry-tab{position:relative!important;overflow:hidden!important;isolation:isolate!important;width:116px!important;height:42px!important;border:1px solid #f2da91!important;border-left:0!important;border-radius:0 11px 11px 0!important;background:linear-gradient(135deg,#f7df8e 0%,#d9b954 58%,#b99536 100%)!important;color:#173d35!important;font:900 11px/1 Arial,sans-serif!important;letter-spacing:.04em!important;box-shadow:8px 10px 24px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.8)!important;cursor:pointer!important}
      .smv-home-enquiry-tab span{position:relative!important;z-index:5!important}
      .smv-home-enquiry-tab:before{content:""!important;position:absolute!important;top:-35%!important;left:-75%!important;width:48%!important;height:170%!important;z-index:4!important;pointer-events:none!important;border-radius:inherit!important;background:linear-gradient(100deg,transparent 0%,rgba(255,255,255,.12) 22%,rgba(255,255,255,1) 50%,rgba(255,255,255,.14) 78%,transparent 100%)!important;transform:skewX(-20deg)!important;box-shadow:0 0 18px rgba(255,255,255,.95),0 0 30px rgba(255,214,72,.85)!important;animation:smvGetMatchedStrongSweep 1.85s linear infinite!important}
      .smv-home-enquiry-tab:after{content:""!important;position:absolute!important;inset:-3px!important;z-index:1!important;pointer-events:none!important;border-radius:inherit!important;border:2px solid rgba(255,245,177,.8)!important;animation:smvGetMatchedStrongPulse 1.85s ease-in-out infinite!important}
      @keyframes smvGetMatchedStrongSweep{0%,34%{left:-75%;opacity:0}40%{opacity:1}62%{left:125%;opacity:1}70%,100%{left:125%;opacity:0}}
      @keyframes smvGetMatchedStrongPulse{0%,34%{box-shadow:0 0 0 rgba(255,214,72,0),0 0 0 rgba(255,255,255,0)}48%{box-shadow:0 0 10px rgba(255,214,72,.75),0 0 24px rgba(255,255,255,.4)}61%{box-shadow:0 0 24px rgba(255,214,72,1),0 0 46px rgba(255,255,255,.72)}72%,100%{box-shadow:0 0 0 rgba(255,214,72,0),0 0 0 rgba(255,255,255,0)}}
      .smv-home-enquiry-backdrop{position:fixed!important;inset:0!important;z-index:10038!important;background:rgba(3,27,24,.62)!important;backdrop-filter:blur(2px)!important}
      .smv-home-enquiry-backdrop[hidden]{display:none!important}
      .smv-home-enquiry-drawer{position:fixed!important;left:0!important;top:72px!important;width:min(430px,92vw)!important;height:calc(100vh - 72px)!important;z-index:10039!important;background:#fbf7f0!important;color:#19342f!important;border-radius:0 16px 16px 0!important;box-shadow:14px 0 42px rgba(0,0,0,.30)!important;overflow:hidden!important;transform:translateX(-105%)!important;transition:transform .3s ease!important}
      .smv-home-enquiry-drawer.is-open{transform:translateX(0)!important}
      .smv-home-enquiry-head{display:flex!important;justify-content:space-between!important;gap:16px!important;padding:22px 20px 18px!important;background:linear-gradient(145deg,#062d28,#0b5147)!important;color:#fff!important}
      .smv-home-enquiry-head p{margin:0 0 5px!important;color:#b9d8d1!important;font-size:9px!important;font-weight:900!important;letter-spacing:.08em!important}
      .smv-home-enquiry-head h2{margin:0 0 6px!important;color:#fff!important;font-size:24px!important;line-height:1.15!important}
      .smv-home-enquiry-head span{display:block!important;color:#c5ddd8!important;font-size:11px!important;line-height:1.45!important}
      .smv-home-enquiry-head button{width:36px!important;height:36px!important;border:1px solid rgba(255,255,255,.25)!important;border-radius:50%!important;background:rgba(255,255,255,.08)!important;color:#fff!important;font-size:25px!important;line-height:1!important;cursor:pointer!important;flex:0 0 auto!important}.smv-home-enquiry-close-label{display:none!important}
      .smv-home-enquiry-body{height:calc(100% - 128px)!important;overflow-y:auto!important;padding:20px!important;background:#fbf7f0!important}
      .smv-home-enquiry-body .quick-enquiry-form{display:grid!important;grid-template-columns:1fr 1fr!important;gap:11px!important}
      .smv-home-enquiry-body .form-field.full{grid-column:1/-1!important}
      .smv-home-enquiry-body .form-field label{display:block!important;margin-bottom:5px!important;color:#526761!important;font-size:9px!important;font-weight:850!important;letter-spacing:.04em!important}
      .smv-home-enquiry-body .form-field input,.smv-home-enquiry-body .form-field select{width:100%!important;min-height:42px!important;padding:0 10px!important;border:1px solid #d9d0c2!important;border-radius:9px!important;background:#fff!important;color:#19342f!important;font-size:12px!important;box-sizing:border-box!important}
      .smv-home-enquiry-body .button-primary{width:100%!important;min-height:46px!important;border-radius:10px!important;background:#031b18!important;color:#fff!important;cursor:pointer!important}
      .smv-home-enquiry-benefits{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:7px!important;margin-top:14px!important}
      .smv-home-enquiry-benefits span{padding:8px!important;border:1px solid #e1d8ca!important;border-radius:9px!important;background:#fff!important;color:#65736f!important;font-size:8px!important;line-height:1.35!important;text-align:center!important}
      body.smv-home-drawer-open{overflow:hidden!important}
      @media(max-width:520px){.smv-home-enquiry-edge{top:44%!important;touch-action:none!important;cursor:grab!important;user-select:none!important;-webkit-user-select:none!important}.smv-home-enquiry-edge.smv-get-matched-open{top:68px!important}body:has(.smv-home-launch-strip) .smv-home-enquiry-edge{top:136px!important}.smv-home-enquiry-tab{width:106px!important;height:40px!important;font-size:10px!important}.smv-home-enquiry-drawer{top:62px!important;width:100%!important;height:calc(100vh - 62px)!important;border-radius:0!important}.smv-home-enquiry-body{height:calc(100% - 142px)!important}.smv-home-enquiry-body .quick-enquiry-form{grid-template-columns:1fr!important}.smv-home-enquiry-body .form-field.full{grid-column:auto!important}.smv-home-enquiry-benefits{grid-template-columns:1fr 1fr 1fr!important}}

      .quick-enquiry-message.success{
        display:block!important;
        width:100%!important;
        box-sizing:border-box!important;
        margin:14px 0 4px!important;
        padding:16px 18px 16px 54px!important;
        border:1px solid rgba(18,157,115,.28)!important;
        border-radius:16px!important;
        background:linear-gradient(135deg,#effff8 0%,#ffffff 58%,#fff9e8 100%)!important;
        color:#075f4d!important;
        font-size:14px!important;
        font-weight:800!important;
        line-height:1.48!important;
        box-shadow:0 12px 28px rgba(5,95,72,.10),inset 0 1px 0 rgba(255,255,255,.9)!important;
        position:relative!important;
        white-space:normal!important;
        overflow:visible!important;
      }
      .quick-enquiry-message.success:before{
        content:"✓";
        position:absolute;
        left:16px;
        top:16px;
        width:26px;
        height:26px;
        display:grid;
        place-items:center;
        border-radius:50%;
        background:linear-gradient(135deg,#20d4aa,#087f61);
        color:#fff;
        font-size:15px;
        font-weight:950;
        box-shadow:0 6px 16px rgba(8,127,97,.22);
      }
      .quick-enquiry-form{grid-auto-rows:auto!important;align-items:start!important}
      .quick-enquiry-message.success{grid-column:1/-1!important;height:auto!important;min-height:88px!important;max-height:none!important;overflow:visible!important;align-self:stretch!important;padding-top:16px!important;padding-bottom:16px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important}
      .quick-enquiry-message.success:before{top:18px!important;transform:none!important}
      .quick-enquiry-message.error{display:block!important;margin:12px 0!important;padding:12px!important;border-radius:12px!important;background:#fff1f1!important;color:#a4161a!important;font-weight:850!important}
      .smv-quick-whatsapp-opt,[data-smv-whatsapp-option],input[name="send_whatsapp"]{display:none!important}
      form[data-smv-quick-enquiry].is-submitted{outline:2px solid rgba(19,155,141,.16)!important;outline-offset:4px!important}
    `;
    document.head.appendChild(style);
  }

  function ensureGlobalQuickEnquiry(){
    if(!document.body) return;
    // Reuse the existing homepage markup when it is already present; do not
    // return early, because the interaction handlers must still be attached.
    if(!document.querySelector(".smv-home-enquiry-edge")) document.body.insertAdjacentHTML("beforeend", `
      <div class="smv-home-enquiry-edge" aria-label="Quick venue enquiry"><button type="button" class="smv-home-enquiry-tab" id="smvHomeEnquiryTab" aria-label="Get matched for venue options"><span>GET MATCHED →</span></button></div>
      <div class="smv-home-enquiry-backdrop" id="smvHomeEnquiryBackdrop" hidden></div>
      <aside class="smv-home-enquiry-drawer" id="smvHomeEnquiryDrawer" aria-label="Quick venue enquiry" aria-hidden="true">
        <div class="smv-home-enquiry-head"><div><p>QUICK VENUE ENQUIRY</p><h2>Tell us what you're looking for.</h2><span>Share a few details and we’ll help you find suitable venue options for your event.</span></div><button id="smvHomeEnquiryClose" type="button" aria-label="Close enquiry form"><span aria-hidden="true">×</span><b class="smv-home-enquiry-close-label">Close</b></button></div>
        <div class="smv-home-enquiry-body"><form class="quick-enquiry-form" data-smv-quick-enquiry data-source="Website - Quick Enquiry">
          <div class="form-field"><label>YOUR NAME *</label><input name="customer_name" autocomplete="name" placeholder="Your name" required></div>
          <div class="form-field"><label>MOBILE NUMBER *</label><input name="mobile" inputmode="numeric" autocomplete="tel" maxlength="14" placeholder="10-digit mobile" required></div>
          <div class="form-field"><label>EVENT TYPE *</label><select name="occasion" required><option value="">Select event</option><option>Wedding</option><option>Engagement</option><option>Birthday</option><option>Party</option><option>Corporate Event</option><option>Reception</option><option>Other</option></select></div>
          <div class="form-field"><label>LOCATION *</label><select name="location" required><option value="">Select location</option><option>Delhi</option><option>Gurgaon</option><option>Noida</option><option>Faridabad</option><option>Delhi NCR</option></select></div>
          <div class="form-field"><label>EVENT DATE *</label><input name="event_date" type="date" required></div>
          <div class="form-field"><label>GUESTS</label><input name="guests" type="number" min="1" placeholder="e.g. 300"></div>
          <div class="form-field full"><label>BUDGET / PERSON</label><input name="budget_per_person" type="number" min="0" placeholder="e.g. 1500"></div>
          <div class="form-field full"><button class="button button-primary" type="submit">Get My Venue Options →</button></div>
          <p class="quick-enquiry-message" data-quick-message aria-live="polite"></p>
        </form><div class="smv-home-enquiry-benefits"><span>✓ Suitable matches</span><span>✓ Compare options</span><span>✓ Personal assistance</span></div></div>
      </aside>`);
    var edge=document.querySelector(".smv-home-enquiry-edge"),drawer=document.getElementById("smvHomeEnquiryDrawer"),backdrop=document.getElementById("smvHomeEnquiryBackdrop"),close=document.getElementById("smvHomeEnquiryClose");
    if(!edge||!drawer||!backdrop||!close)return;
    function openDrawer(){drawer.classList.add("is-open");drawer.setAttribute("aria-hidden","false");backdrop.hidden=false;document.body.classList.add("smv-home-drawer-open");document.documentElement.classList.add("smv-home-drawer-open");edge.classList.add("smv-get-matched-open");setTimeout(function(){var first=drawer.querySelector("input");if(first)first.focus();},220);}
    function closeDrawer(){drawer.classList.remove("is-open");drawer.setAttribute("aria-hidden","true");document.body.classList.remove("smv-home-drawer-open");document.documentElement.classList.remove("smv-home-drawer-open");edge.classList.remove("smv-get-matched-open");resetEdgePosition();setTimeout(function(){backdrop.hidden=true;},300);}
    // GET MATCHED interaction — deliberately simple:
    // desktop uses pointer drag; mobile uses a tiny tap window so a normal
    // tap opens immediately while any vertical movement switches to dragging.
    var dragging=false,moved=false,dragPointerId=null,dragStartY=0,dragStartCenter=0,touchTimer=null,touchOpened=false;

    function setEdgeCenter(center){
      var h=edge.offsetHeight||42;
      var minCenter=h/2+8;
      var maxCenter=window.innerHeight-h/2-8;
      var next=Math.max(minCenter,Math.min(maxCenter,center));
      edge.style.setProperty("top",next+"px","important");
      edge.style.setProperty("transform","translateY(-50%)","important");
    }

    function resetEdgePosition(){
      if(touchTimer){clearTimeout(touchTimer);touchTimer=null;}
      edge.style.removeProperty("top");
      edge.style.removeProperty("transform");
      edge.classList.remove("smv-get-matched-dragging");
      dragging=false;moved=false;touchOpened=false;dragPointerId=null;
    }

    function isTouchDeviceEvent(e){
      return e.pointerType==="touch" || (e.touches && e.touches.length);
    }

    // Desktop / mouse / pen drag.
    edge.addEventListener("pointerdown",function(e){
      if(e.pointerType==="touch")return;
      if(e.button!==undefined&&e.button!==0)return;
      var rect=edge.getBoundingClientRect();
      dragging=true;moved=false;dragPointerId=e.pointerId;
      dragStartY=e.clientY;dragStartCenter=rect.top+rect.height/2;
      edge.classList.add("smv-get-matched-dragging");
      if(edge.setPointerCapture)edge.setPointerCapture(e.pointerId);
    },{passive:true});

    edge.addEventListener("pointermove",function(e){
      if(e.pointerType==="touch"||!dragging||e.pointerId!==dragPointerId)return;
      var dy=e.clientY-dragStartY;
      if(Math.abs(dy)>6)moved=true;
      if(moved)setEdgeCenter(dragStartCenter+dy);
    },{passive:true});

    edge.addEventListener("pointerup",function(e){
      if(e.pointerType==="touch"||!dragging||e.pointerId!==dragPointerId)return;
      var open=!moved;
      dragging=false;dragPointerId=null;
      edge.classList.remove("smv-get-matched-dragging");
      if(edge.releasePointerCapture){try{edge.releasePointerCapture(e.pointerId);}catch(_){}}
      if(open)openDrawer();
      moved=false;
    },{passive:true});

    edge.addEventListener("pointercancel",function(e){
      if(e.pointerType==="touch"||!dragging||e.pointerId!==dragPointerId)return;
      dragging=false;dragPointerId=null;moved=false;
      edge.classList.remove("smv-get-matched-dragging");
    },{passive:true});

    // Mobile: a normal tap opens on touchend. Any real vertical movement
    // cancels the tap and turns the same gesture into a drag.
    edge.addEventListener("touchstart",function(e){
      if(!e.touches||!e.touches[0])return;
      var t=e.touches[0],rect=edge.getBoundingClientRect();
      dragging=true;moved=false;dragPointerId="touch";
      dragStartY=t.clientY;dragStartCenter=rect.top+rect.height/2;
      edge.classList.add("smv-get-matched-dragging");
    },{passive:true});

    edge.addEventListener("touchmove",function(e){
      if(!dragging||dragPointerId!=="touch"||!e.touches||!e.touches[0])return;
      var dy=e.touches[0].clientY-dragStartY;
      if(Math.abs(dy)<=5)return;
      moved=true;
      setEdgeCenter(dragStartCenter+dy);
      if(e.cancelable)e.preventDefault();
    },{passive:false});

    edge.addEventListener("touchend",function(e){
      if(dragPointerId!=="touch")return;
      var open=!moved;
      dragging=false;dragPointerId=null;
      edge.classList.remove("smv-get-matched-dragging");
      if(open){
        if(e&&e.cancelable)e.preventDefault();
        openDrawer();
      }
      moved=false;
    },{passive:false});

    edge.addEventListener("touchcancel",function(){
      dragging=false;dragPointerId=null;moved=false;
      edge.classList.remove("smv-get-matched-dragging");
    },{passive:true});

    // Direct button click fallback for browsers that synthesize a click.
    var tab=edge.querySelector("#smvHomeEnquiryTab");
    if(tab){
      tab.addEventListener("click",function(e){
        if(dragging||moved)return;
        e.preventDefault();
        e.stopPropagation();
        openDrawer();
      });
    }

    close.addEventListener("click",closeDrawer);backdrop.addEventListener("click",closeDrawer);

    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!backdrop.hidden)closeDrawer();});
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    setMessage(form, "", "");

    const customerName = clean(form.elements.customer_name && form.elements.customer_name.value);
    const mobile = mobileDigits(form.elements.mobile && form.elements.mobile.value);
    const locationValue = clean(form.elements.location && form.elements.location.value);
    const eventDate = clean(form.elements.event_date && form.elements.event_date.value);
    const guests = numberOrNull(form.elements.guests && form.elements.guests.value);
    const budget = numberOrNull(form.elements.budget_per_person && form.elements.budget_per_person.value);
    const occasion = clean(form.elements.occasion && form.elements.occasion.value) || clean(form.dataset.eventType) || "Event";
    const comment = extractComment(form);
    const context = sourceContext(form);
    const attribution = getAttribution();

    const details = {
      customerName,
      mobile,
      location: locationValue,
      eventDate,
      guests,
      budget,
      occasion,
      comment,
      source: context.source,
      venueName: context.venueName,
      venueId: context.venueId
    };

    if (clean(form.elements._smv_company_website && form.elements._smv_company_website.value)) {
      setMessage(form, "We could not verify this enquiry. Please try again.", "error");
      return;
    }

    if (isDuplicate(details)) {
      setMessage(form, PREMIUM_SUCCESS, "success");
      getMessageNode(form)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!isHumanName(customerName)) {
      setMessage(form, "Please enter your real name using letters only.", "error");
      form.elements.customer_name && form.elements.customer_name.focus();
      return;
    }
    if (!isValidIndianMobile(mobile)) {
      setMessage(form, "Please enter a valid 10-digit Indian mobile number.", "error");
      form.elements.mobile && form.elements.mobile.focus();
      return;
    }
    if (!locationValue) {
      setMessage(form, "Please select or enter a preferred location.", "error");
      form.elements.location && form.elements.location.focus();
      return;
    }
    if (!eventDate) {
      setMessage(form, "Please select your event date.", "error");
      form.elements.event_date && form.elements.event_date.focus();
      return;
    }
    if (eventDate < todayIso()) {
      setMessage(form, "Please select today or a future event date.", "error");
      form.elements.event_date && form.elements.event_date.focus();
      return;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      setMessage(form, "Unable to connect right now. Please call us on +91 83683 22256.", "error");
      return;
    }

    setBusy(button, true);

    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const requirements = [
        "Quick enquiry source: " + context.source,
        context.venueName ? "Interested venue: " + context.venueName : "",
        context.venueId ? "Venue ID: " + context.venueId : "",
        "Submitted page: " + context.page,
        guests ? "Guests: " + guests : "",
        budget ? "Budget/person: ₹" + budget : "",
        comment ? "Customer comment: " + comment : "",
        ...attributionLines(attribution, locationValue)
      ].filter(Boolean).join("\n");

      const payload = {
        customer_name: customerName,
        mobile,
        email: null,
        location: locationValue,
        occasion,
        event_date: eventDate || null,
        guests,
        budget_per_person: budget,
        food_preference: null,
        requirements,
        source: context.source,
        status: "new",
        assigned_to: null,
        follow_up_at: null,
        last_contacted_at: null
      };

      const result = await client.from("customer_enquiries").insert(payload);
      if (result.error) throw result.error;

      if (!(isGoogleAdsTraffic(attribution) && clearlyOutsideDelhiGurgaon(locationValue))) {
        fireGoogleAdsLeadConversion();
      }
      markDuplicate(details);
      form.classList.add("is-submitted");
      setMessage(form, PREMIUM_SUCCESS, "success");

      const successPanel = form.closest(".quick-enquiry-card") && form.closest(".quick-enquiry-card").querySelector("[data-quick-success]");
      if (successPanel) {
        successPanel.hidden = true;
        successPanel.textContent = "";
      }

      form.reset();
      const occasionField = form.elements.occasion;
      if (occasionField && form.dataset.eventType) occasionField.value = form.dataset.eventType;
      getMessageNode(form)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      console.error("Quick enquiry error:", error);
      const text = String((error && (error.message || error.details)) || "").toLowerCase();
      const friendly = text.includes("network")
        ? "Please check your internet connection and try again."
        : "We could not submit the enquiry right now. Please call +91 83683 22256.";
      setMessage(form, friendly, "error");
    } finally {
      setBusy(button, false);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    captureAttribution();
    installStyles();
    ensureGlobalQuickEnquiry();
    // Mobile app bottom-nav Find opens the quick-enquiry drawer.
    const mobileFind=document.querySelector(".smv-mobile-app-nav .smv-nav-main");
    if(mobileFind){
      mobileFind.addEventListener("click",function(e){
        if(window.matchMedia && !window.matchMedia("(max-width: 767px)").matches) return;
        e.preventDefault();
        e.stopPropagation();
        const tab=document.getElementById("smvHomeEnquiryTab");
        if(tab) tab.click();
      });
    }
    if(!window.supabase){var s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.async=true;document.head.appendChild(s);}
    document.querySelectorAll("form[data-smv-quick-enquiry]").forEach(function (form) {
      const dateField = form.elements.event_date;
      if (dateField) dateField.min = todayIso();
      addHoneypot(form);
      form.querySelectorAll("[data-smv-whatsapp-option],.smv-quick-whatsapp-opt,input[name='send_whatsapp']").forEach(node => node.remove());
      form.addEventListener("submit", handleSubmit);
    });
  });
})();
