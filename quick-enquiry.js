/* Select My Venue — direct quick enquiry -> Supabase -> CRM */
"use strict";

(function () {
  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const PREMIUM_SUCCESS = "Requirement received! Thank you for choosing Select My Venue. Our venue team will contact you within 30 minutes to understand your event and help you with suitable venue options.";
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
      if (comment) payload.contact_remark = comment;

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
    document.querySelectorAll("form[data-smv-quick-enquiry]").forEach(function (form) {
      const dateField = form.elements.event_date;
      if (dateField) dateField.min = todayIso();
      addHoneypot(form);
      form.querySelectorAll("[data-smv-whatsapp-option],.smv-quick-whatsapp-opt,input[name='send_whatsapp']").forEach(node => node.remove());
      form.addEventListener("submit", handleSubmit);
    });
  });
})();