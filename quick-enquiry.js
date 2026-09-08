/* Select My Venue — direct quick enquiry -> Supabase -> CRM */
"use strict";

(function () {
  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";

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

  function getPriority(date, guests, budget) {
    let score = 0;
    if (date) score += 2;
    if (guests) score += 1;
    if (budget) score += 1;
    return score >= 3 ? "high" : score >= 1 ? "medium" : "low";
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
        display:block!important;margin:12px 0!important;padding:14px 15px!important;border:1px solid rgba(7,127,92,.22)!important;border-radius:14px!important;background:linear-gradient(135deg,#eafff8,#f7fffb)!important;color:#06704f!important;font-size:14px!important;font-weight:900!important;line-height:1.4!important;box-shadow:0 10px 26px rgba(5,95,72,.08)!important
      }
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
    const context = sourceContext(form);

    const details = {
      customerName,
      mobile,
      location: locationValue,
      eventDate,
      guests,
      budget,
      occasion,
      source: context.source,
      venueName: context.venueName,
      venueId: context.venueId
    };

    if (isDuplicate(details)) {
      setMessage(form, "✓ Your requirement is already received. Our team will call you within 1 hour with suitable venue options.", "success");
      getMessageNode(form)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!customerName) {
      setMessage(form, "Please enter your name.", "error");
      form.elements.customer_name && form.elements.customer_name.focus();
      return;
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      setMessage(form, "Please enter a valid 10-digit mobile number.", "error");
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
        budget ? "Budget/person: ₹" + budget : ""
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
        priority: getPriority(eventDate, guests, budget),
        assigned_to: null,
        follow_up_at: null,
        last_contacted_at: null
      };

      const result = await client.from("customer_enquiries").insert(payload);
      if (result.error) throw result.error;

      markDuplicate(details);
      form.classList.add("is-submitted");
      setMessage(form, "✓ Requirement received! Our team will call you within 1 hour with suitable venue options.", "success");

      const successPanel = form.closest(".quick-enquiry-card") && form.closest(".quick-enquiry-card").querySelector("[data-quick-success]");
      if (successPanel) successPanel.hidden = false;

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
    installStyles();
    document.querySelectorAll("form[data-smv-quick-enquiry]").forEach(function (form) {
      const dateField = form.elements.event_date;
      if (dateField) dateField.min = todayIso();
      form.querySelectorAll("[data-smv-whatsapp-option],.smv-quick-whatsapp-opt,input[name='send_whatsapp']").forEach(node => node.remove());
      form.addEventListener("submit", handleSubmit);
    });
  });
})();
