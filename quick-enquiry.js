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

  function setBusy(button, busy) {
    if (!button) return;
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? "Submitting…" : button.dataset.originalText;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    setMessage(form, "", "");

    const customerName = clean(form.elements.customer_name && form.elements.customer_name.value);
    const mobile = mobileDigits(form.elements.mobile && form.elements.mobile.value);
    const location = clean(form.elements.location && form.elements.location.value);
    const eventDate = clean(form.elements.event_date && form.elements.event_date.value);
    const guests = numberOrNull(form.elements.guests && form.elements.guests.value);
    const budget = numberOrNull(form.elements.budget_per_person && form.elements.budget_per_person.value);
    const occasion = clean(form.elements.occasion && form.elements.occasion.value) || clean(form.dataset.eventType) || "Event";
    const source = clean(form.dataset.source) || "Website Quick Enquiry";

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
    if (!location) {
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
      setMessage(form, "Unable to connect right now. Please call or WhatsApp us on +91 83683 22256.", "error");
      return;
    }

    setBusy(button, true);

    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const requirements = [
        "Quick enquiry from: " + source,
        "Landing page: " + document.title,
        guests ? "Guests: " + guests : "",
        budget ? "Budget/person: ₹" + budget : ""
      ].filter(Boolean).join("\n");

      const payload = {
        customer_name: customerName,
        mobile,
        email: null,
        location,
        occasion,
        event_date: eventDate || null,
        guests,
        budget_per_person: budget,
        food_preference: null,
        requirements,
        source,
        status: "new",
        priority: getPriority(eventDate, guests, budget),
        assigned_to: null,
        follow_up_at: null,
        last_contacted_at: null
      };

      const result = await client.from("customer_enquiries").insert(payload);
      if (result.error) throw result.error;

      form.classList.add("is-submitted");
      setMessage(form, "✓ Requirement received! Our team will contact you with suitable venue options.", "success");

      const successPanel = form.closest(".quick-enquiry-card") && form.closest(".quick-enquiry-card").querySelector("[data-quick-success]");
      if (successPanel) successPanel.hidden = false;

      form.reset();
      const occasionField = form.elements.occasion;
      if (occasionField && form.dataset.eventType) occasionField.value = form.dataset.eventType;
    } catch (error) {
      console.error("Quick enquiry error:", error);
      const text = String((error && (error.message || error.details)) || "").toLowerCase();
      const friendly = text.includes("network")
        ? "Please check your internet connection and try again."
        : "We could not submit the enquiry right now. Please call or WhatsApp +91 83683 22256.";
      setMessage(form, friendly, "error");
    } finally {
      setBusy(button, false);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("form[data-smv-quick-enquiry]").forEach(function (form) {
      const dateField = form.elements.event_date;
      if (dateField) dateField.min = todayIso();
      form.addEventListener("submit", handleSubmit);
    });
  });
})();
