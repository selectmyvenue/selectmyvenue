/* =========================================================
   SELECT MY VENUE
   WEBSITE JAVASCRIPT
   Exact companion for the current index.html | Popup waits 15 seconds after first interaction
   Website -> AI Planner -> Customer Enquiry -> Supabase -> CRM
   ========================================================= */

"use strict";

/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const SUPABASE_URL =
  "https://uajqwyoqbbswkfiwosyw.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";

let supabaseClient = null;

try {
  if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
  ) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    console.log("Select My Venue: Supabase READY");
  } else {
    console.error("Supabase library was not loaded.");
  }
} catch (error) {
  console.error("Supabase initialization error:", error);
}

/* =========================================================
   GLOBAL STATE
   ========================================================= */

const SMV_AI_STORAGE_KEY = "smv_ai_event_plan_v2";

let currentAIPlan = null;
let plannerGenerated = false;

/* =========================================================
   PAGE READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  setupMobileMenu();
  setupHeroSearch();
  setupPopularEventShortcuts();
  setupAIEventPlanner();
  setupCustomerEnquiry();
  setupAutoEnquiryPopup();
  setupPlannerToEnquiry();
  setupSmartFormEnhancements();
  restoreSavedAIPlan();
  setupScrollAnimations();
  setupFloatingWhatsApp();
  setupContactCardUX();

  console.log(
    "Select My Venue — exact HTML AI Planner initialized."
  );
});

/* =========================================================
   HELPERS
   ========================================================= */

function byId(id) {
  return document.getElementById(id);
}

function getValue(id) {
  const element = byId(id);
  return element ? String(element.value || "").trim() : "";
}

function setValue(id, value) {
  const element = byId(id);
  if (element) element.value = value == null ? "" : value;
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value == null ? "" : String(value);
}

function escapeHTML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showInlineMessage(element, message, type) {
  if (!element) return;
  element.textContent = message || "";
  element.className =
    element.className
      .replace(/\b(success|error|info)\b/g, "")
      .trim() +
    (type ? " " + type : "");
}

function clearInlineMessage(element) {
  if (!element) return;
  element.textContent = "";
  element.className = element.className
    .replace(/\b(success|error|info)\b/g, "")
    .trim();
}

function focusField(id) {
  const element = byId(id);
  if (!element) return;

  setTimeout(function () {
    element.focus();
    element.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 50);
}

function setButtonLoading(button, text) {
  if (!button) return;

  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent;
  }

  button.disabled = true;
  button.classList.add("loading");
  button.textContent = text;
}

function restoreButton(button, text) {
  if (!button) return;

  button.disabled = false;
  button.classList.remove("loading");
  button.textContent =
    text || button.dataset.originalText || "Submit";
}

function showToast(message, type) {
  const toast = byId("toastMessage");
  if (!toast) return;

  toast.textContent = message || "";
  toast.classList.add("show");

  if (type === "error") {
    toast.classList.add("error");
  } else {
    toast.classList.remove("error");
  }

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () {
    toast.classList.remove("show");
  }, 3200);
}

function getFriendlySupabaseError(error) {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const message = String(
    error.message ||
    error.details ||
    error.hint ||
    error
  );

  const lower = message.toLowerCase();

  if (lower.includes("row-level security")) {
    return "The enquiry could not be saved because database permissions need to be checked.";
  }

  if (lower.includes("permission")) {
    return "The enquiry could not be saved because database permissions need to be checked.";
  }

  if (lower.includes("network")) {
    return "Please check your internet connection and try again.";
  }

  return message;
}

function scrollToElement(id) {
  const element = byId(id);
  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {
  const menuToggle = byId("menuToggle");
  const mainNav = byId("mainNav");

  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener("click", function (event) {
    event.preventDefault();

    const open = mainNav.classList.toggle("open");

    menuToggle.setAttribute(
      "aria-expanded",
      open ? "true" : "false"
    );
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* =========================================================
   HERO SEARCH
   ========================================================= */

function setupHeroSearch() {
  const form = byId("searchForm");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    const message = byId("heroFormMessage");

    const eventType = getValue("eventType");
    const location = getValue("location");
    const guests = getValue("guests");
    const eventDate = getValue("date");

    clearInlineMessage(message);

    if (!eventType) {
      showInlineMessage(
        message,
        "Please select your event type.",
        "error"
      );
      focusField("eventType");
      return;
    }

    if (!location) {
      showInlineMessage(
        message,
        "Please enter your event location.",
        "error"
      );
      focusField("location");
      return;
    }

    const plan = generateAIEventPlan({
      eventType,
      location,
      guests,
      eventDate,
      budget: "",
      food: "",
      venueType: "",
      style: "",
      other: ""
    });

    currentAIPlan = plan;
    plannerGenerated = true;
    saveAIPlan(plan);
    populatePlannerFromPlan(plan);
    renderAIPlan(plan);

    setValue("customerEventType", eventType);
    setValue("customerLocation", location);
    setValue("customerGuests", guests);
    setValue("customerEventDate", eventDate);

    setButtonLoading(button, "Plan Ready ✓");

    try {
      if (!supabaseClient) {
        throw new Error("Supabase client is not initialized.");
      }

      const requirements = buildFullAIRequirements({
        aiPlan: plan,
        other: ""
      });

      const { error } = await supabaseClient
        .from("customer_enquiries")
        .insert({
          customer_name: null,
          mobile: null,
          email: null,
          location,
          occasion: eventType,
          event_date: eventDate || null,
          guests: convertGuestRangeToNumber(guests),
          budget_per_person: null,
          food_preference: null,
          requirements,
          source: "Website - AI Search",
          status: "new",
          priority: calculateLeadPriority(plan),
          assigned_to: null,
          follow_up_at: null,
          internal_notes:
            "AI Planner Lead | Match Score: " +
            plan.matchScore +
            "% | Intent: " +
            plan.intent +
            " | Quality: " +
            plan.leadQuality,
          last_contacted_at: null
        });

      if (error) throw error;

      showInlineMessage(
        message,
        "✓ Your smart event plan is ready. Add your contact details below to send a qualified enquiry to our team.",
        "success"
      );

      scrollToElement("enquiry");
    } catch (error) {
      console.error("Hero enquiry error:", error);

      /*
       * The AI plan still works locally even if the optional
       * quick-search lead insert is blocked by Supabase RLS.
       */
      showInlineMessage(
        message,
        "✓ Your AI event plan is ready. Add your contact details below to submit the enquiry.",
        "success"
      );

      console.warn(
        "Hero quick-search was not saved to Supabase:",
        error
      );
    } finally {
      setTimeout(function () {
        restoreButton(button, "Find My Venue →");
      }, 500);
    }
  });
}

/* =========================================================
   POPULAR EVENT SHORTCUTS
   ========================================================= */

function setupPopularEventShortcuts() {
  document
    .querySelectorAll("[data-event-shortcut]")
    .forEach(function (card) {
      card.addEventListener("click", function () {
        const eventType =
          card.getAttribute("data-event-shortcut") || "";

        setValue("eventType", eventType);
        setValue("plannerEventType", eventType);
        setValue("customerEventType", eventType);

        scrollToElement("aiPlanner");

        setTimeout(function () {
          const plannerEvent = byId("plannerEventType");
          if (plannerEvent) plannerEvent.focus();
        }, 500);
      });
    });
}

/* =========================================================
   AI PLANNER
   ========================================================= */

function setupAIEventPlanner() {
  const generateButton = byId("generateEventPlan");
  const saveButton = byId("saveEventPlan");
  const restoreButton = byId("restoreEventPlan");

  if (generateButton) {
    generateButton.addEventListener("click", function () {
      generateAndRenderPlanner();
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", function () {
      if (!currentAIPlan) {
        showPlannerMessage(
          "Generate your event plan first.",
          "error"
        );
        return;
      }

      saveAIPlan(currentAIPlan);

      showPlannerMessage(
        "✓ Your AI event plan has been saved on this device.",
        "success"
      );

      showToast("✓ Event plan saved.");
    });
  }

  if (restoreButton) {
    restoreButton.addEventListener("click", function () {
      const restored = restoreSavedAIPlan(true);

      if (!restored) {
        showPlannerMessage(
          "No saved event plan was found on this device.",
          "error"
        );
      }
    });
  }

  [
    "plannerEventType",
    "plannerLocation",
    "plannerDate",
    "plannerGuests",
    "plannerBudget",
    "plannerFood",
    "plannerVenueType",
    "plannerStyle",
    "plannerRequirements"
  ].forEach(function (id) {
    const field = byId(id);

    if (!field) return;

    field.addEventListener("change", function () {
      /*
       * Do not automatically generate on every keystroke.
       * The user controls generation with the main button.
       */
    });
  });
}

function generateAndRenderPlanner() {
  const message = byId("plannerMessage");
  const button = byId("generateEventPlan");

  clearInlineMessage(message);

  const eventType = getValue("plannerEventType");
  const location = getValue("plannerLocation");
  const eventDate = getValue("plannerDate");
  const guests = getValue("plannerGuests");
  const budget = getValue("plannerBudget");
  const food = getValue("plannerFood");
  const venueType = getValue("plannerVenueType");
  const style = getValue("plannerStyle");
  const other = getValue("plannerRequirements");

  if (!eventType) {
    showPlannerMessage(
      "Please select an event type.",
      "error"
    );
    focusField("plannerEventType");
    return;
  }

  if (!location) {
    showPlannerMessage(
      "Please enter your city or location.",
      "error"
    );
    focusField("plannerLocation");
    return;
  }

  if (!guests || Number(guests) < 1) {
    showPlannerMessage(
      "Please enter the expected number of guests.",
      "error"
    );
    focusField("plannerGuests");
    return;
  }

  const plan = generateAIEventPlan({
    eventType,
    location,
    eventDate,
    guests,
    budget,
    food,
    venueType,
    style,
    other
  });

  currentAIPlan = plan;
  plannerGenerated = true;

  saveAIPlan(plan);
  renderAIPlan(plan);
  updatePlannerSummary(plan);

  showPlannerMessage(
    "✓ AI event plan generated successfully.",
    "success"
  );

  showToast("✓ AI Event Plan generated.");

  const results = byId("aiPlannerResults");

  if (results) {
    results.classList.add("generated");

    setTimeout(function () {
      results.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 120);
  }

  if (button) {
    button.blur();
  }
}

function showPlannerMessage(message, type) {
  showInlineMessage(
    byId("plannerMessage"),
    message,
    type
  );
}

/* =========================================================
   GENERATE AI EVENT PLAN
   ========================================================= */

function generateAIEventPlan(data) {
  const eventType = normalizeEventType(data.eventType);
  const location = String(
    data.location || "Your City"
  ).trim();

  const guests = parseGuestNumber(data.guests);
  const budget = parseBudget(data.budget);
  const eventDate = data.eventDate || "";
  const food = data.food || "";
  const venueType = data.venueType || "";
  const style = data.style || "";
  const other = data.other || "";

  const category = getEventCategory(eventType);

  const venueTypes = getVenueRecommendations(
    category,
    guests,
    venueType
  );

  const themes = getThemeRecommendations(
    category,
    style
  );

  const foodRecommendations =
    getFoodRecommendations(category, food);

  const photographyRecommendations =
    getPhotographyRecommendations(category);

  const entertainmentRecommendations =
    getEntertainmentRecommendations(category);

  const guestIntelligence =
    getGuestIntelligence(category, guests);

  const checklist =
    getEventChecklist(category);

  const timeline =
    getPlanningTimeline(eventDate, category);

  const budgetPlan =
    calculateSmartBudget(
      category,
      guests,
      budget
    );

  const matchScore =
    calculateMatchScore({
      eventType,
      location,
      guests,
      date: eventDate,
      budget,
      food,
      venueType,
      style
    });

  const intent =
    calculateLeadIntent({
      eventType,
      location,
      guests,
      date: eventDate,
      budget
    });

  const leadQuality =
    calculateLeadQuality({
      eventType,
      location,
      guests,
      date: eventDate,
      budget,
      food,
      venueType,
      style
    });

  const planningStage =
    calculatePlanningStage({
      date: eventDate,
      budget,
      guests
    });

  const dateConfidence =
    eventDate ? "HIGH" : "TO CONFIRM";

  const budgetConfidence =
    budget > 0 ? "HIGH" : "TO CONFIRM";

  return {
    eventType,
    category,
    location,
    guests,
    eventDate,
    budget,
    food,
    venueType,
    style,
    other,
    matchScore,
    matchLabel: getMatchLabel(matchScore),
    matchReason: getMatchReason({
      matchScore,
      location,
      guests,
      eventDate,
      budget
    }),
    intent,
    leadQuality,
    planningStage,
    dateConfidence,
    budgetConfidence,
    venueTypes,
    themes,
    foodRecommendations,
    photographyRecommendations,
    entertainmentRecommendations,
    guestIntelligence,
    checklist,
    timeline,
    budgetPlan,
    generatedAt: new Date().toISOString()
  };
}

/* =========================================================
   RENDER COMPLETE AI PLAN
   ========================================================= */

function renderAIPlan(plan) {
  if (!plan) return;

  currentAIPlan = plan;

  /* Match score */
  setText(
    "eventMatchBadge",
    plan.matchScore + "%"
  );

  setText(
    "eventMatchScore",
    plan.matchScore + "%"
  );

  setText(
    "eventMatchLabel",
    plan.matchLabel
  );

  setText(
    "eventMatchReason",
    plan.matchReason
  );

  /* Budget */
  const budget = plan.budgetPlan;

  setText(
    "budgetEstimate",
    formatINR(budget.total)
  );

  setText(
    "budgetRange",
    budget.rangeText
  );

  setText(
    "budgetFood",
    formatINR(budget.breakdown.food)
  );

  setText(
    "budgetVenue",
    formatINR(budget.breakdown.venue)
  );

  setText(
    "budgetOther",
    formatINR(budget.breakdown.other)
  );

  /* Guest intelligence */
  renderSimpleList(
    "guestIntelligence",
    plan.guestIntelligence,
    "insight"
  );

  /* Venue */
  renderRecommendationList(
    "venueRecommendations",
    plan.venueTypes
  );

  /* Food */
  renderRecommendationList(
    "foodRecommendations",
    plan.foodRecommendations
  );

  /* Theme */
  renderRecommendationList(
    "themeRecommendations",
    plan.themes
  );

  /* Photography */
  renderRecommendationList(
    "photographyRecommendations",
    plan.photographyRecommendations
  );

  /* Entertainment */
  renderRecommendationList(
    "entertainmentRecommendations",
    plan.entertainmentRecommendations
  );

  /* Lead intent */
  setText(
    "leadIntentBadge",
    plan.intent
  );

  setText(
    "leadQuality",
    plan.leadQuality
  );

  setText(
    "planningStage",
    plan.planningStage
  );

  setText(
    "dateConfidence",
    plan.dateConfidence
  );

  setText(
    "budgetConfidence",
    plan.budgetConfidence
  );

  /* Timeline */
  setText(
    "planningCountdown",
    getCountdownText(plan.eventDate)
  );

  renderTimeline(
    "planningTimeline",
    plan.timeline
  );

  /* Checklist */
  renderChecklist(
    "eventChecklist",
    plan.checklist
  );

  updatePlannerSummary(plan);
}

/* =========================================================
   POPULATE PLANNER FROM PLAN
   ========================================================= */

function populatePlannerFromPlan(plan) {
  if (!plan) return;

  setValue("plannerEventType", plan.eventType);
  setValue("plannerLocation", plan.location);
  setValue("plannerDate", plan.eventDate);
  setValue("plannerGuests", plan.guests || "");
  setValue("plannerBudget", plan.budget || "");
  setValue("plannerFood", plan.food || "");
  setValue("plannerVenueType", plan.venueType || "");
  setValue("plannerStyle", plan.style || "");
  setValue("plannerRequirements", plan.other || "");
}

/* =========================================================
   RECOMMENDATION RENDERERS
   ========================================================= */

function renderRecommendationList(id, items) {
  const container = byId(id);
  if (!container) return;

  if (!Array.isArray(items) || !items.length) {
    container.innerHTML =
      '<div class="recommendation-placeholder">No recommendation available yet.</div>';
    return;
  }

  container.innerHTML = items
    .map(function (item, index) {
      return (
        '<div class="ai-recommendation-item">' +
          '<span class="recommendation-number">' +
            String(index + 1).padStart(2, "0") +
          "</span>" +
          "<strong>" +
            escapeHTML(item) +
          "</strong>" +
        "</div>"
      );
    })
    .join("");
}

function renderSimpleList(id, items) {
  const container = byId(id);
  if (!container) return;

  if (!Array.isArray(items) || !items.length) {
    container.innerHTML =
      "<p>Add your guest count to receive planning insights.</p>";
    return;
  }

  container.innerHTML =
    "<ul>" +
    items
      .map(function (item) {
        return "<li>" + escapeHTML(item) + "</li>";
      })
      .join("") +
    "</ul>";
}

function renderTimeline(id, timeline) {
  const container = byId(id);
  if (!container) return;

  if (!Array.isArray(timeline) || !timeline.length) {
    container.innerHTML =
      '<div class="timeline-placeholder">Add an event date to generate your planning timeline.</div>';
    return;
  }

  container.innerHTML = timeline
    .map(function (item) {
      return (
        '<div class="timeline-item">' +
          '<span class="timeline-period">' +
            escapeHTML(item.period) +
          "</span>" +
          "<div>" +
            "<strong>" +
              escapeHTML(item.task) +
            "</strong>" +
          "</div>" +
        "</div>"
      );
    })
    .join("");
}

function renderChecklist(id, checklist) {
  const container = byId(id);
  if (!container) return;

  if (!Array.isArray(checklist) || !checklist.length) {
    container.innerHTML =
      "<label><input type=\"checkbox\" disabled><span>Generate your event plan first</span></label>";
    setText("checklistProgress", "0%");
    return;
  }

  container.innerHTML = checklist
    .map(function (item, index) {
      return (
        '<label class="checklist-item">' +
          '<input type="checkbox" data-check-index="' +
            index +
          '">' +
          "<span>" +
            escapeHTML(item) +
          "</span>" +
        "</label>"
      );
    })
    .join("");

  container
    .querySelectorAll('input[type="checkbox"]')
    .forEach(function (checkbox) {
      checkbox.addEventListener("change", updateChecklistProgress);
    });

  updateChecklistProgress();
}

function updateChecklistProgress() {
  const container = byId("eventChecklist");
  const progress = byId("checklistProgress");

  if (!container || !progress) return;

  const boxes = Array.from(
    container.querySelectorAll(
      'input[type="checkbox"]'
    )
  );

  if (!boxes.length) {
    progress.textContent = "0%";
    return;
  }

  const checked = boxes.filter(
    function (box) {
      return box.checked;
    }
  ).length;

  const percentage = Math.round(
    (checked / boxes.length) * 100
  );

  progress.textContent = percentage + "%";
}

/* =========================================================
   EVENT CATEGORY
   ========================================================= */

function getEventCategory(eventType) {
  const value = String(
    eventType || ""
  ).toLowerCase();

  if (
    value.includes("wedding") ||
    value.includes("marriage") ||
    value.includes("shaadi") ||
    value.includes("reception")
  ) {
    return value.includes("reception")
      ? "reception"
      : "wedding";
  }

  if (value.includes("birthday")) return "birthday";

  if (
    value.includes("engagement") ||
    value.includes("ring")
  ) {
    return "engagement";
  }

  if (
    value.includes("corporate") ||
    value.includes("conference") ||
    value.includes("seminar") ||
    value.includes("office")
  ) {
    return "corporate";
  }

  if (value.includes("anniversary")) {
    return "anniversary";
  }

  if (
    value.includes("baby") ||
    value.includes("shower")
  ) {
    return "baby";
  }

  if (
    value.includes("kitty")
  ) {
    return "kitty";
  }

  if (
    value.includes("party") ||
    value.includes("celebration")
  ) {
    return "party";
  }

  return "general";
}

function normalizeEventType(value) {
  const clean = String(
    value || ""
  ).trim();

  return clean || "Event";
}

/* =========================================================
   VENUE RECOMMENDATIONS
   ========================================================= */

function getVenueRecommendations(
  category,
  guests,
  requestedVenueType
) {
  if (requestedVenueType) {
    const base = [requestedVenueType];

    const related = {
      "Banquet Hall": [
        "Hotel",
        "Resort",
        "Lawn"
      ],
      Hotel: [
        "Banquet Hall",
        "Resort",
        "Rooftop"
      ],
      Resort: [
        "Hotel",
        "Lawn",
        "Farmhouse"
      ],
      Farmhouse: [
        "Lawn",
        "Resort",
        "Banquet Hall"
      ],
      Lawn: [
        "Resort",
        "Farmhouse",
        "Banquet Hall"
      ],
      Restaurant: [
        "Rooftop",
        "Private Dining",
        "Banquet Hall"
      ],
      Rooftop: [
        "Restaurant",
        "Hotel",
        "Lounge"
      ],
      "Community Hall": [
        "Banquet Hall",
        "Lawn",
        "Convention Centre"
      ]
    };

    return base.concat(
      related[requestedVenueType] || [
        "Banquet Hall",
        "Hotel",
        "Resort"
      ]
    ).slice(0, 4);
  }

  const large = guests >= 300;
  const medium = guests >= 100 && guests < 300;

  if (category === "wedding") {
    if (large) {
      return [
        "Luxury Banquet",
        "Wedding Lawn",
        "Resort",
        "5-Star Hotel"
      ];
    }

    if (medium) {
      return [
        "Banquet Hall",
        "Wedding Lawn",
        "Boutique Hotel",
        "Resort"
      ];
    }

    return [
      "Banquet Hall",
      "Boutique Venue",
      "Restaurant",
      "Private Lawn"
    ];
  }

  if (category === "birthday") {
    if (large) {
      return [
        "Party Lawn",
        "Banquet Hall",
        "Resort",
        "Club"
      ];
    }

    return [
      "Party Hall",
      "Restaurant",
      "Cafe",
      "Private Venue"
    ];
  }

  if (category === "corporate") {
    return [
      "Business Hotel",
      "Conference Hall",
      "Banquet Hall",
      "Convention Centre"
    ];
  }

  if (category === "engagement") {
    return [
      "Banquet Hall",
      "Boutique Venue",
      "Hotel",
      "Lawn"
    ];
  }

  if (category === "anniversary") {
    return [
      "Restaurant",
      "Boutique Hotel",
      "Private Dining",
      "Rooftop Venue"
    ];
  }

  if (category === "baby") {
    return [
      "Banquet Hall",
      "Restaurant",
      "Hotel",
      "Community Hall"
    ];
  }

  if (category === "kitty") {
    return [
      "Restaurant",
      "Rooftop",
      "Hotel",
      "Club"
    ];
  }

  if (category === "party") {
    return [
      "Party Hall",
      "Rooftop",
      "Lawn",
      "Restaurant"
    ];
  }

  return [
    "Banquet Hall",
    "Hotel",
    "Restaurant",
    "Lawn"
  ];
}

/* =========================================================
   THEME RECOMMENDATIONS
   ========================================================= */

function getThemeRecommendations(
  category,
  requestedStyle
) {
  if (requestedStyle) {
    const styleMap = {
      Premium: [
        "Premium Signature",
        "Luxury Floral",
        "Elegant Lighting",
        "Premium Table Styling"
      ],
      Elegant: [
        "Elegant Floral",
        "Soft Lighting",
        "Classic Premium",
        "Minimal Luxury"
      ],
      Modern: [
        "Modern Minimal",
        "Contemporary Lighting",
        "Geometric Decor",
        "Statement Stage"
      ],
      Traditional: [
        "Classic Indian",
        "Royal Heritage",
        "Traditional Floral",
        "Warm Gold Decor"
      ],
      Minimal: [
        "Minimal Modern",
        "Clean Floral",
        "Soft Neutral",
        "Simple Luxury"
      ],
      Luxury: [
        "Modern Luxury",
        "Royal Gold",
        "Statement Florals",
        "Premium Stage"
      ],
      "Fun & Colorful": [
        "Color Pop",
        "Bollywood",
        "Festive Neon",
        "Playful Celebration"
      ]
    };

    return styleMap[requestedStyle] ||
      [
        requestedStyle,
        "Elegant Lighting",
        "Premium Decor",
        "Signature Stage"
      ];
  }

  const themes = {
    wedding: [
      "Royal Elegant",
      "Pastel Romance",
      "Modern Luxury",
      "Traditional Indian"
    ],
    birthday: [
      "Luxury Birthday",
      "Neon Party",
      "Bollywood",
      "Elegant Dinner"
    ],
    engagement: [
      "Elegant Romance",
      "Floral Luxury",
      "Pastel Garden",
      "Modern Minimal"
    ],
    corporate: [
      "Modern Professional",
      "Executive Luxury",
      "Tech & Innovation",
      "Classic Corporate"
    ],
    anniversary: [
      "Romantic Dinner",
      "Candlelight",
      "Luxury Gold",
      "Garden Romance"
    ],
    baby: [
      "Pastel Dreams",
      "Floral Baby Shower",
      "Cute & Elegant",
      "Minimal Modern"
    ],
    party: [
      "Cocktail Night",
      "Bollywood",
      "Neon",
      "Luxury Celebration"
    ],
    reception: [
      "Royal Reception",
      "Modern Luxury",
      "Floral Elegance",
      "Classic Indian"
    ],
    kitty: [
      "Elegant Afternoon",
      "Floral Chic",
      "Pastel Social",
      "Modern Lounge"
    ],
    general: [
      "Elegant Celebration",
      "Modern Luxury",
      "Classic Indian",
      "Minimal Premium"
    ]
  };

  return themes[category] || themes.general;
}

/* =========================================================
   FOOD RECOMMENDATIONS
   ========================================================= */

function getFoodRecommendations(
  category,
  preference
) {
  if (preference) {
    if (preference === "Jain") {
      return [
        "Jain Menu",
        "Separate Jain Preparation",
        "Live Food Counters",
        "Dessert Station"
      ];
    }

    if (preference === "Veg") {
      return [
        "Premium Vegetarian Menu",
        "Live Food Counters",
        "Welcome Drinks",
        "Dessert Station"
      ];
    }

    if (preference === "Non-Veg") {
      return [
        "Non-Veg Main Course",
        "Live Food Counters",
        "Welcome Drinks",
        "Dessert Station"
      ];
    }

    return [
      preference,
      "Live Food Counters",
      "Welcome Drinks",
      "Dessert Station"
    ];
  }

  if (category === "wedding") {
    return [
      "Multi-Cuisine Buffet",
      "Live Chaat Counter",
      "North Indian",
      "Dessert & Mithai Counter"
    ];
  }

  if (category === "corporate") {
    return [
      "Executive Buffet",
      "Tea & Coffee",
      "Light Snacks",
      "Working Lunch"
    ];
  }

  if (
    category === "birthday" ||
    category === "party"
  ) {
    return [
      "Multi-Cuisine Buffet",
      "Live Counters",
      "Mocktails",
      "Dessert Station"
    ];
  }

  return [
    "Multi-Cuisine",
    "Live Counters",
    "Welcome Drinks",
    "Desserts"
  ];
}

/* =========================================================
   PHOTOGRAPHY
   ========================================================= */

function getPhotographyRecommendations(category) {
  if (category === "wedding" || category === "reception") {
    return [
      "Candid Photography",
      "Traditional Photography",
      "Cinematic Videography",
      "Drone Coverage"
    ];
  }

  if (category === "corporate") {
    return [
      "Event Photography",
      "Stage & Speaker Coverage",
      "Branding / Product Shots",
      "Highlight Video"
    ];
  }

  if (
    category === "birthday" ||
    category === "party"
  ) {
    return [
      "Candid Photography",
      "Birthday Highlights",
      "Group Photos",
      "Short Event Reel"
    ];
  }

  return [
    "Candid Photography",
    "Event Coverage",
    "Group Photos",
    "Highlight Video"
  ];
}

/* =========================================================
   ENTERTAINMENT
   ========================================================= */

function getEntertainmentRecommendations(category) {
  if (category === "wedding") {
    return [
      "DJ / Live Music",
      "Dance Floor",
      "Entry & Stage Moments",
      "Special Performances"
    ];
  }

  if (category === "corporate") {
    return [
      "Professional AV",
      "Host / Anchor",
      "Background Music",
      "Interactive Engagement"
    ];
  }

  if (
    category === "birthday" ||
    category === "party"
  ) {
    return [
      "DJ / Music",
      "Dance Floor",
      "Games / Activities",
      "Special Performance"
    ];
  }

  return [
    "Music",
    "Host / Anchor",
    "Interactive Activities",
    "Special Performance"
  ];
}

/* =========================================================
   GUEST INTELLIGENCE
   ========================================================= */

function getGuestIntelligence(category, guests) {
  const result = [];

  if (!guests) {
    return [
      "Add your expected guest count for more accurate planning."
    ];
  }

  if (guests < 50) {
    result.push(
      "A compact venue or private dining setup can keep the event intimate."
    );
    result.push(
      "Focus on ambience, service quality and convenient access."
    );
  } else if (guests < 100) {
    result.push(
      "A boutique venue, restaurant or smaller banquet can work well."
    );
    result.push(
      "Prioritize comfortable seating and easy guest movement."
    );
  } else if (guests < 300) {
    result.push(
      "A medium-size banquet or hotel event space should provide a strong fit."
    );
    result.push(
      "Check parking, washrooms and dining capacity before finalizing."
    );
  } else if (guests < 500) {
    result.push(
      "Prioritize large banquet halls, lawns or resorts with strong guest flow."
    );
    result.push(
      "Parking and service logistics become especially important."
    );
  } else {
    result.push(
      "Look for large-format venues with dedicated guest movement and parking."
    );
    result.push(
      "Ask about multiple dining counters, service teams and backup arrangements."
    );
  }

  if (
    category === "wedding" ||
    category === "reception"
  ) {
    result.push(
      "For wedding functions, confirm stage, food service, accommodation and vendor access."
    );
  }

  if (category === "corporate") {
    result.push(
      "For corporate events, confirm AV, power backup, Wi-Fi and seating layout."
    );
  }

  return result;
}

/* =========================================================
   EVENT CHECKLIST
   ========================================================= */

function getEventChecklist(category) {
  const common = [
    "Finalize event date",
    "Set total budget",
    "Shortlist venues",
    "Compare venue packages",
    "Confirm guest count",
    "Finalize food menu",
    "Confirm decoration",
    "Book photographer",
    "Confirm entertainment",
    "Send invitations",
    "Confirm final guest count",
    "Create event-day schedule"
  ];

  if (category === "wedding") {
    return [
      "Finalize wedding date",
      "Shortlist ceremony venue",
      "Shortlist reception venue",
      "Book photographer & videographer",
      "Finalize decoration theme",
      "Book caterer / food package",
      "Book makeup artist",
      "Book mehndi artist",
      "Book DJ / music",
      "Finalize invitations",
      "Confirm guest accommodation",
      "Plan transport",
      "Confirm final guest list",
      "Create wedding-day timeline"
    ];
  }

  if (category === "corporate") {
    return [
      "Finalize event objective",
      "Confirm attendee count",
      "Book conference venue",
      "Arrange AV equipment",
      "Finalize catering",
      "Confirm stage & branding",
      "Arrange photography",
      "Confirm host / anchor",
      "Prepare presentation material",
      "Send attendee communication",
      "Confirm seating plan",
      "Create event run sheet"
    ];
  }

  return common;
}

/* =========================================================
   PLANNING TIMELINE
   ========================================================= */

function getPlanningTimeline(eventDate, category) {
  if (!eventDate) {
    return [
      {
        period: "ASAP",
        task: "Confirm date, budget and guest count."
      },
      {
        period: "NEXT",
        task: "Shortlist and compare venues."
      },
      {
        period: "AFTER VENUE",
        task: "Book major vendors."
      },
      {
        period: "FINAL WEEK",
        task: "Confirm guests, vendors and schedule."
      }
    ];
  }

  const date = new Date(
    eventDate + "T00:00:00"
  );

  if (Number.isNaN(date.getTime())) {
    return [];
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const days = Math.ceil(
    (date - today) / 86400000
  );

  if (days < 0) {
    return [
      {
        period: "DATE PASSED",
        task: "Please update the event date to continue planning."
      }
    ];
  }

  if (days <= 7) {
    return [
      {
        period: "TODAY",
        task: "Confirm venue, guests and all vendors."
      },
      {
        period: "48 HOURS",
        task: "Confirm menu, decoration and event schedule."
      },
      {
        period: "EVENT DAY",
        task: "Execute your final event plan."
      }
    ];
  }

  if (days <= 30) {
    return [
      {
        period: "THIS WEEK",
        task: "Finalize venue and major vendors."
      },
      {
        period: "NEXT 2 WEEKS",
        task: "Finalize food, decor, photography and entertainment."
      },
      {
        period: "FINAL WEEK",
        task: "Confirm guests, payments and event schedule."
      }
    ];
  }

  if (days <= 90) {
    return [
      {
        period: "NOW",
        task: "Finalize venue, budget and guest estimate."
      },
      {
        period: "30–60 DAYS",
        task: "Book vendors and finalize event style."
      },
      {
        period: "FINAL 30 DAYS",
        task: "Invitations, menu, decor and logistics."
      },
      {
        period: "FINAL WEEK",
        task: "Final confirmations and event run sheet."
      }
    ];
  }

  return [
    {
      period: "NOW",
      task: "Define your event vision and budget."
    },
    {
      period: "NEXT 30 DAYS",
      task: "Shortlist venues and compare packages."
    },
    {
      period: "2–3 MONTHS",
      task: "Book important vendors."
    },
    {
      period: "FINAL MONTH",
      task: "Finalize guests, food, decor and schedule."
    }
  ];
}

/* =========================================================
   BUDGET
   ========================================================= */

function calculateSmartBudget(
  category,
  guests,
  suppliedBudget
) {
  const guestCount = guests || 100;

  const defaultPerGuest =
    getDefaultBudgetPerGuest(category);

  const perGuest =
    suppliedBudget > 0
      ? suppliedBudget
      : defaultPerGuest;

  const total = guestCount * perGuest;

  const low =
    Math.round(
      perGuest * 0.85
    ) * guestCount;

  const high =
    Math.round(
      perGuest * 1.2
    ) * guestCount;

  return {
    perGuest,
    total,
    low,
    high,
    rangeText:
      suppliedBudget > 0
        ? "Estimated total based on your budget per person"
        : "Indicative planning estimate — venue packages may vary",
    breakdown:
      getBudgetBreakdown(
        total,
        category
      )
  };
}

function getDefaultBudgetPerGuest(category) {
  const values = {
    wedding: 2200,
    reception: 2200,
    engagement: 1600,
    birthday: 1100,
    anniversary: 1400,
    corporate: 1500,
    baby: 1000,
    kitty: 900,
    party: 1200,
    general: 1200
  };

  return values[category] || 1200;
}

function getBudgetBreakdown(total, category) {
  let foodRatio = 0.42;
  let venueRatio = 0.38;
  let otherRatio = 0.20;

  if (category === "corporate") {
    foodRatio = 0.32;
    venueRatio = 0.45;
    otherRatio = 0.23;
  }

  if (category === "wedding") {
    foodRatio = 0.40;
    venueRatio = 0.40;
    otherRatio = 0.20;
  }

  return {
    food: Math.round(total * foodRatio),
    venue: Math.round(total * venueRatio),
    other: Math.round(total * otherRatio)
  };
}

function formatINR(value) {
  const amount = Number(value || 0);

  return "₹" +
    amount.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 0
      }
    );
}

/* =========================================================
   MATCH SCORE
   ========================================================= */

function calculateMatchScore(data) {
  let score = 50;

  if (data.eventType) score += 10;
  if (data.location) score += 10;
  if (data.guests > 0) score += 10;
  if (data.date) score += 8;
  if (data.budget > 0) score += 7;
  if (data.food) score += 2;
  if (data.venueType) score += 2;
  if (data.style) score += 1;

  return Math.max(
    0,
    Math.min(99, score)
  );
}

function getMatchLabel(score) {
  if (score >= 90) return "Excellent event fit";
  if (score >= 80) return "Strong event fit";
  if (score >= 70) return "Good event fit";
  if (score >= 60) return "Promising event fit";
  return "More details needed";
}

function getMatchReason(data) {
  const details = [];

  if (data.location) {
    details.push(
      "location is defined"
    );
  }

  if (data.guests) {
    details.push(
      "guest capacity is defined"
    );
  }

  if (data.eventDate) {
    details.push(
      "event date is defined"
    );
  }

  if (data.budget) {
    details.push(
      "budget is defined"
    );
  }

  if (!details.length) {
    return "AI will calculate your event fit score from your requirements.";
  }

  return (
    "Your plan is stronger because " +
    details.join(", ") +
    "."
  );
}

/* =========================================================
   LEAD INTELLIGENCE
   ========================================================= */

function calculateLeadIntent(data) {
  let points = 0;

  if (data.eventType) points += 15;
  if (data.location) points += 15;
  if (data.guests > 0) points += 15;
  if (data.date) points += 20;
  if (data.budget > 0) points += 20;

  if (points >= 75) return "HOT";
  if (points >= 50) return "WARM";
  return "EARLY";
}

function calculateLeadQuality(data) {
  let points = 0;

  if (data.eventType) points += 15;
  if (data.location) points += 15;
  if (data.guests > 0) points += 15;
  if (data.date) points += 20;
  if (data.budget > 0) points += 20;
  if (data.food) points += 5;
  if (data.venueType) points += 5;
  if (data.style) points += 5;

  if (points >= 80) return "HIGH";
  if (points >= 55) return "MEDIUM";
  return "LOW";
}

function calculatePlanningStage(data) {
  if (data.date) {
    const date = new Date(
      data.date + "T00:00:00"
    );

    if (!Number.isNaN(date.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const days = Math.ceil(
        (date - today) / 86400000
      );

      if (days >= 0 && days <= 30) {
        return "ACTIVE PLANNING";
      }

      if (days > 30 && days <= 180) {
        return "SHORTLISTING";
      }

      if (days > 180) {
        return "EARLY PLANNING";
      }
    }
  }

  if (data.budget || data.guests) {
    return "RESEARCH";
  }

  return "EXPLORING";
}

function calculateLeadPriority(plan) {
  if (!plan) return "medium";

  if (
    plan.intent === "HOT" ||
    plan.leadQuality === "HIGH"
  ) {
    return "high";
  }

  if (plan.intent === "WARM") {
    return "medium";
  }

  return "low";
}

/* =========================================================
   DATE / GUEST PARSING
   ========================================================= */

function parseGuestNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const text = String(
    value || ""
  ).toLowerCase();

  const digits = text.match(
    /[\d,]+/
  );

  if (digits) {
    return Number(
      digits[0].replace(/,/g, "")
    ) || 0;
  }

  if (text.includes("500+")) return 500;
  if (text.includes("250")) return 250;
  if (text.includes("100")) return 100;
  if (text.includes("50")) return 50;

  return 0;
}

function convertGuestRangeToNumber(value) {
  return parseGuestNumber(value) || null;
}

function parseBudget(value) {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const cleaned = String(
    value || ""
  ).replace(/[₹,\s]/g, "");

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
}

function getCountdownText(eventDate) {
  if (!eventDate) {
    return "DATE NOT SET";
  }

  const date = new Date(
    eventDate + "T00:00:00"
  );

  if (Number.isNaN(date.getTime())) {
    return "DATE CHECK";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.ceil(
    (date - today) / 86400000
  );

  if (days < 0) return "DATE PASSED";
  if (days === 0) return "TODAY";
  if (days === 1) return "1 DAY";
  return days + " DAYS";
}

/* =========================================================
   AI PLAN STORAGE
   ========================================================= */

function saveAIPlan(plan) {
  if (!plan) return false;

  try {
    localStorage.setItem(
      SMV_AI_STORAGE_KEY,
      JSON.stringify(plan)
    );
    return true;
  } catch (error) {
    console.warn(
      "Unable to save AI plan:",
      error
    );
    return false;
  }
}

function clearSavedAIPlan() {
  try {
    localStorage.removeItem(
      SMV_AI_STORAGE_KEY
    );
  } catch (error) {
    console.warn(error);
  }
}

function getSavedAIPlan() {
  try {
    const raw = localStorage.getItem(
      SMV_AI_STORAGE_KEY
    );

    if (!raw) return null;

    return JSON.parse(raw);
  } catch (error) {
    console.warn(
      "Unable to restore saved AI plan:",
      error
    );
    return null;
  }
}

function restoreSavedAIPlan(showMessage) {
  const plan = getSavedAIPlan();

  if (!plan) {
    return null;
  }

  currentAIPlan = plan;
  plannerGenerated = true;

  populatePlannerFromPlan(plan);
  renderAIPlan(plan);

  if (showMessage) {
    showPlannerMessage(
      "✓ Your saved AI event plan has been restored.",
      "success"
    );

    showToast("✓ Saved plan restored.");
  }

  return plan;
}

/* =========================================================
   PLANNER SUMMARY
   ========================================================= */

function buildPlannerSummary(plan) {
  if (!plan) {
    return "No AI event plan generated yet.";
  }

  const lines = [
    "EVENT: " + plan.eventType,
    "LOCATION: " + plan.location,
    "GUESTS: " + (
      plan.guests
        ? plan.guests
        : "Not specified"
    ),
    "DATE: " + (
      plan.eventDate
        ? plan.eventDate
        : "Not specified"
    ),
    "BUDGET / PERSON: " + (
      plan.budget
        ? formatINR(plan.budget)
        : "Not specified"
    ),
    "FOOD: " + (
      plan.food || "Not specified"
    ),
    "VENUE STYLE: " + (
      plan.venueType || "AI recommended"
    ),
    "EVENT STYLE: " + (
      plan.style || "AI recommended"
    ),
    "MATCH SCORE: " +
      plan.matchScore +
      "%",
    "LEAD INTENT: " +
      plan.intent,
    "LEAD QUALITY: " +
      plan.leadQuality
  ];

  if (plan.other) {
    lines.push(
      "OTHER REQUIREMENTS: " +
      plan.other
    );
  }

  return lines.join("\n");
}

function updatePlannerSummary(plan) {
  const preview = byId(
    "plannerSummaryPreview"
  );

  if (!preview) return;

  preview.textContent =
    buildPlannerSummary(plan);

  preview.classList.toggle(
    "has-plan",
    !!plan
  );
}

/* =========================================================
   CUSTOMER ENQUIRY
   ========================================================= */

function setupCustomerEnquiry() {
  const form = byId(
    "customerEnquiryForm"
  );

  if (!form) return;

  const refreshButton = byId(
    "refreshPlannerSummary"
  );

  if (refreshButton) {
    refreshButton.addEventListener(
      "click",
      function () {
        syncCustomerFormToPlanner();
        updatePlannerSummary(
          currentAIPlan
        );

        showToast(
          currentAIPlan
            ? "✓ AI Plan Summary updated."
            : "No AI plan is available yet."
        );
      }
    );
  }

  form.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      if (
        event.stopImmediatePropagation
      ) {
        event.stopImmediatePropagation();
      }

      const submitButton = byId(
        "customerEnquirySubmit"
      );

      const message = byId(
        "customerEnquiryMessage"
      );

      clearInlineMessage(message);

      const customerName =
        getValue("customerName");

      const customerMobile =
        getValue("customerMobile");

      const customerEmail =
        getValue("customerEmail");

      const customerLocation =
        getValue("customerLocation");

      const customerEventType =
        getValue("customerEventType");

      const customerEventDate =
        getValue("customerEventDate");

      const customerGuests =
        getValue("customerGuests");

      const customerBudget =
        getValue("customerBudget");

      const customerFood =
        getValue("customerFood");

      const customerRequirements =
        getValue("customerRequirements");

      const leadSource =
        getValue("leadSource") ||
        "Website";

      /* Validation */
      if (!customerName) {
        showInlineMessage(
          message,
          "Please enter your name.",
          "error"
        );
        focusField("customerName");
        return;
      }

      const cleanMobile =
        customerMobile.replace(
          /[\s\-()+]/g,
          ""
        );

      if (
        !/^[0-9]{10}$/.test(
          cleanMobile
        )
      ) {
        showInlineMessage(
          message,
          "Please enter a valid 10-digit mobile number.",
          "error"
        );
        focusField("customerMobile");
        return;
      }

      if (
        customerEmail &&
        !isValidEmail(customerEmail)
      ) {
        showInlineMessage(
          message,
          "Please enter a valid email address.",
          "error"
        );
        focusField("customerEmail");
        return;
      }

      if (!customerLocation) {
        showInlineMessage(
          message,
          "Please enter your city or location.",
          "error"
        );
        focusField("customerLocation");
        return;
      }

      if (!customerEventType) {
        showInlineMessage(
          message,
          "Please select your event type.",
          "error"
        );
        focusField("customerEventType");
        return;
      }

      /* Build a fresh plan from enquiry information */
      const plan = generateAIEventPlan({
        eventType: customerEventType,
        location: customerLocation,
        eventDate: customerEventDate,
        guests: customerGuests,
        budget: customerBudget,
        food: customerFood,
        venueType: "",
        style: "",
        other: customerRequirements
      });

      currentAIPlan = plan;
      plannerGenerated = true;

      saveAIPlan(plan);
      renderAIPlan(plan);

      setButtonLoading(
        submitButton,
        "Submitting..."
      );

      try {
        if (!supabaseClient) {
          throw new Error(
            "Supabase client is not initialized."
          );
        }

        const requirements =
          buildFullAIRequirements({
            aiPlan: plan,
            other: customerRequirements
          });

        const payload = {
          customer_name:
            customerName,

          mobile:
            cleanMobile,

          email:
            customerEmail || null,

          location:
            customerLocation,

          occasion:
            customerEventType,

          event_date:
            customerEventDate || null,

          guests:
            customerGuests
              ? Number(customerGuests)
              : null,

          budget_per_person:
            customerBudget
              ? Number(customerBudget)
              : null,

          food_preference:
            customerFood || null,

          requirements,

          source:
            leadSource,

          status:
            "new",

          priority:
            calculateLeadPriority(plan),

          assigned_to:
            null,

          follow_up_at:
            null,

           internal_notes:
  customerRequirements
    ? customerRequirements.trim()
    : "",

          last_contacted_at:
            null
        };

        const { error } =
          await supabaseClient
            .from("customer_enquiries")
            .insert(payload);

        if (error) {
          console.error(
            "SUPABASE DATABASE ERROR:",
            error
          );
          throw error;
        }

        form.reset();

        showInlineMessage(
          message,
          "✓ Thank you! Your venue requirement has been received. Select My Venue will review your event details and contact you with suitable options.",
          "success"
        );

        showToast(
          "✓ Enquiry submitted successfully."
        );

        updatePlannerSummary(plan);

        setTimeout(function () {
          scrollToElement("enquiry");
        }, 150);

      } catch (error) {
        console.error(
          "CUSTOMER ENQUIRY ERROR:",
          error
        );

        showInlineMessage(
          message,
          getFriendlySupabaseError(error),
          "error"
        );

        showToast(
          "Unable to submit enquiry.",
          "error"
        );
      } finally {
        restoreButton(
          submitButton,
          "Submit Enquiry →"
        );
      }
    }
  );
}

/* =========================================================
   AUTO CUSTOMER ENQUIRY POPUP
   Same customer enquiry -> Supabase -> CRM flow
   ========================================================= */

function setupAutoEnquiryPopup() {
  const overlay = byId("enquiryPopup");
  if (!overlay) {
    console.warn("Select My Venue: enquiry popup HTML was not found.");
    return;
  }

  /*
   * COMPLETE CUSTOMER POPUP
   * ---------------------------------------------------------
   * The existing popup shell in index.html is intentionally reused.
   * We replace only its inner content here so index.html does not
   * need to be changed.
   *
   * Behaviour:
   * - NEVER opens on initial page load.
   * - First normal website click/tap starts a 3-second timer.
   * - Popup opens after those 3 seconds.
   * - Opens once per browser session.
   * - Uses the same customer-enquiry fields as the main website form.
   */
  const popupRoot = overlay.querySelector(".enquiry-popup");
  if (!popupRoot) return;

  const originalContent = popupRoot.querySelector(".popup-content");

  /* Prevent duplicate initialization if the script is ever loaded twice. */
  if (overlay.dataset.smvEnhanced === "1") return;
  overlay.dataset.smvEnhanced = "1";

  /* ---------------------------------------------------------
     POPUP STYLES
     --------------------------------------------------------- */
  if (!byId("smvEnhancedPopupStyles")) {
    const style = document.createElement("style");
    style.id = "smvEnhancedPopupStyles";
    style.textContent = `
      #enquiryPopup {
        z-index: 99999 !important;
      }

      #enquiryPopup .enquiry-popup {
        width: min(1080px, calc(100vw - 32px)) !important;
        max-width: 1080px !important;
        height: min(760px, calc(100vh - 28px)) !important;
        max-height: calc(100vh - 28px) !important;
        overflow: hidden !important;
        border-radius: 18px !important;
      }

      #enquiryPopup .popup-content.smv-complete-popup {
        padding: 0 !important;
        display: grid !important;
        grid-template-columns: 34% 66% !important;
        height: 100% !important;
        min-height: 0 !important;
        max-height: none !important;
      }

      .smv-popup-info {
        padding: 42px 34px !important;
        background:
          radial-gradient(circle at 15% 12%, rgba(31, 211, 190, .14), transparent 30%),
          linear-gradient(145deg, #071b1b 0%, #0b2929 55%, #102f2f 100%);
        color: #fff !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
      }

      .smv-popup-info .smv-popup-logo {
        width: 150px !important;
        max-width: 70% !important;
        height: auto !important;
        object-fit: contain !important;
        margin-bottom: 34px !important;
      }

      .smv-popup-info .smv-popup-kicker {
        font-size: 11px !important;
        letter-spacing: 2px !important;
        font-weight: 800 !important;
        color: #c7a95b !important;
        margin-bottom: 12px !important;
      }

      .smv-popup-info h2 {
        margin: 0 0 14px !important;
        font-size: clamp(28px, 3vw, 42px) !important;
        line-height: 1.08 !important;
        color: #fff !important;
      }

      .smv-popup-info h2 span {
        color: #29d5c0 !important;
      }

      .smv-popup-info > p {
        color: rgba(255,255,255,.75) !important;
        line-height: 1.65 !important;
        font-size: 14px !important;
        margin: 0 0 25px !important;
      }

      .smv-popup-benefits {
        list-style: none !important;
        padding: 0 !important;
        margin: 0 !important;
        display: grid !important;
        gap: 13px !important;
      }

      .smv-popup-benefits li {
        display: flex !important;
        gap: 10px !important;
        align-items: flex-start !important;
        color: rgba(255,255,255,.88) !important;
        font-size: 13px !important;
        line-height: 1.45 !important;
      }

      .smv-popup-benefits b {
        color: #29d5c0 !important;
        font-weight: 900 !important;
      }

      .smv-popup-how {
        margin-top: 28px !important;
        padding-top: 22px !important;
        border-top: 1px solid rgba(255,255,255,.12) !important;
      }

      .smv-popup-how-title {
        color: #c7a95b !important;
        font-size: 10px !important;
        font-weight: 900 !important;
        letter-spacing: 1.6px !important;
        margin-bottom: 13px !important;
      }

      .smv-popup-how-steps {
        display: grid !important;
        gap: 11px !important;
      }

      .smv-popup-how-step {
        display: grid !important;
        grid-template-columns: 27px 1fr !important;
        gap: 9px !important;
        align-items: start !important;
      }

      .smv-popup-how-step .num {
        width: 27px !important;
        height: 27px !important;
        border: 1px solid rgba(41,213,192,.35) !important;
        border-radius: 50% !important;
        display: grid !important;
        place-items: center !important;
        color: #29d5c0 !important;
        font-size: 10px !important;
        font-weight: 900 !important;
      }

      .smv-popup-how-step strong {
        display: block !important;
        color: #fff !important;
        font-size: 12px !important;
        line-height: 1.3 !important;
        margin-bottom: 2px !important;
      }

      .smv-popup-how-step span {
        color: rgba(255,255,255,.62) !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
      }

      .smv-popup-form-side {
        background: #fff !important;
        color: #202727 !important;
        padding: 20px 30px 16px !important;
        overflow-y: auto !important;
        position: relative !important;
      }

      .smv-popup-form-side .popup-close {
        position: absolute !important;
        right: 15px !important;
        top: 10px !important;
        z-index: 4 !important;
        background: transparent !important;
        border: 0 !important;
        color: #1d2727 !important;
        font-size: 31px !important;
        line-height: 1 !important;
        cursor: pointer !important;
        padding: 3px 8px !important;
      }

      .smv-popup-form-head {
        padding-right: 38px !important;
        margin-bottom: 10px !important;
      }

      .smv-popup-form-head .kicker {
        color: #138f82 !important;
        font-size: 11px !important;
        letter-spacing: 1.7px !important;
        font-weight: 800 !important;
        margin-bottom: 6px !important;
      }

      .smv-popup-form-head h3 {
        margin: 0 !important;
        font-size: 27px !important;
        line-height: 1.15 !important;
        color: #162121 !important;
      }

      .smv-popup-form-head p {
        margin: 4px 0 0 !important;
        color: #687373 !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
      }

      .smv-popup-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 7px 12px !important;
      }

      .smv-popup-field {
        min-width: 0 !important;
      }

      .smv-popup-field.full {
        grid-column: 1 / -1 !important;
      }

      .smv-popup-field label {
        display: block !important;
        margin: 0 0 3px !important;
        color: #586363 !important;
        font-size: 10px !important;
        letter-spacing: .65px !important;
        font-weight: 800 !important;
      }

      .smv-popup-field input,
      .smv-popup-field select,
      .smv-popup-field textarea {
        width: 100% !important;
        box-sizing: border-box !important;
        border: 1px solid #cfd5d5 !important;
        border-radius: 8px !important;
        background: #fff !important;
        color: #1e2929 !important;
        font: inherit !important;
        font-size: 13px !important;
        outline: none !important;
        transition: border-color .18s ease, box-shadow .18s ease !important;
      }

      .smv-popup-field input,
      .smv-popup-field select {
        height: 35px !important;
        padding: 0 10px !important;
      }

      .smv-popup-field textarea {
        min-height: 55px !important;
        padding: 7px 10px !important;
        resize: vertical !important;
      }

      .smv-popup-field input:focus,
      .smv-popup-field select:focus,
      .smv-popup-field textarea:focus {
        border-color: #139b8d !important;
        box-shadow: 0 0 0 3px rgba(19,155,141,.10) !important;
      }

      .smv-popup-ai-summary {
        margin-top: 8px !important;
        border: 1px solid #e1e6e6 !important;
        border-radius: 10px !important;
        background: #f7fafa !important;
        padding: 7px 10px !important;
      }

      .smv-popup-ai-summary strong {
        display: block !important;
        color: #197f75 !important;
        font-size: 10px !important;
        letter-spacing: .8px !important;
        margin-bottom: 2px !important;
      }

      .smv-popup-ai-summary span {
        color: #647070 !important;
        font-size: 11px !important;
        line-height: 1.45 !important;
      }

      .smv-popup-actions {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px !important;
        margin-top: 8px !important;
      }

      .smv-popup-submit {
        flex: 1 !important;
        min-height: 40px !important;
        border: 0 !important;
        border-radius: 9px !important;
        background: linear-gradient(135deg,#0d9588,#16b9a8) !important;
        color: #fff !important;
        font-weight: 800 !important;
        font-size: 14px !important;
        cursor: pointer !important;
        box-shadow: 0 8px 22px rgba(13,149,136,.18) !important;
      }

      .smv-popup-submit:hover {
        filter: brightness(1.04) !important;
      }

      .smv-popup-submit:disabled {
        opacity: .7 !important;
        cursor: wait !important;
      }

      .smv-popup-later {
        border: 0 !important;
        background: transparent !important;
        color: #687373 !important;
        font-size: 12px !important;
        cursor: pointer !important;
        padding: 10px 5px !important;
        white-space: nowrap !important;
      }

      .smv-popup-trust {
        text-align: center !important;
        color: #8a9393 !important;
        font-size: 10px !important;
        margin: 5px 0 0 !important;
      }

      .smv-popup-error {
        min-height: 14px !important;
        margin: 5px 0 0 !important;
        color: #c43e3e !important;
        font-size: 12px !important;
        font-weight: 600 !important;
      }

      .smv-popup-success {
        min-height: 100% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        padding: 45px 30px !important;
      }

      .smv-popup-success-box {
        max-width: 460px !important;
      }

      .smv-success-icon {
        width: 70px !important;
        height: 70px !important;
        border-radius: 50% !important;
        display: grid !important;
        place-items: center !important;
        margin: 0 auto 20px !important;
        background: rgba(19,155,141,.12) !important;
        color: #139b8d !important;
        font-size: 35px !important;
        font-weight: 900 !important;
      }

      .smv-popup-success h3 {
        margin: 0 0 10px !important;
        color: #172323 !important;
        font-size: 27px !important;
      }

      .smv-popup-success p {
        margin: 0 0 20px !important;
        color: #697575 !important;
        line-height: 1.6 !important;
        font-size: 14px !important;
      }

      .smv-success-close {
        min-height: 44px !important;
        padding: 0 25px !important;
        border: 0 !important;
        border-radius: 8px !important;
        background: #0d9588 !important;
        color: #fff !important;
        font-weight: 800 !important;
        cursor: pointer !important;
      }

      /* Keep the complete form and submit action visible without requiring the customer to scroll. */
      @media (min-width: 761px) {
        #enquiryPopup .smv-popup-form-side {
          overflow-y: auto !important;
          scrollbar-width: thin !important;
        }

        #enquiryPopup .smv-popup-field label {
          font-size: 9px !important;
          line-height: 1.1 !important;
        }

        #enquiryPopup .smv-popup-trust {
          margin-bottom: 0 !important;
        }
      }

      @media (max-width: 760px) {
        #enquiryPopup .enquiry-popup {
          width: calc(100vw - 18px) !important;
          max-height: 94vh !important;
          border-radius: 14px !important;
        }

        #enquiryPopup .popup-content.smv-complete-popup {
          grid-template-columns: 1fr !important;
          min-height: auto !important;
          max-height: 94vh !important;
        }

        .smv-popup-info {
          display: none !important;
        }

        .smv-popup-form-side {
          padding: 25px 18px 18px !important;
          max-height: 94vh !important;
        }

        .smv-popup-grid {
          grid-template-columns: 1fr !important;
        }

        .smv-popup-field.full {
          grid-column: auto !important;
        }
      }

      @media (min-width: 761px) and (max-height: 720px) {
        .smv-popup-info {
          padding: 28px 28px !important;
        }

        .smv-popup-form-side {
          padding: 23px 28px 18px !important;
        }

        #enquiryPopup .popup-content.smv-complete-popup {
          min-height: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     BUILD COMPLETE POPUP FORM
     --------------------------------------------------------- */
  const content = originalContent || document.createElement("div");
  content.className = "popup-content smv-complete-popup";

  content.innerHTML = `
    <div class="smv-popup-info">
      <img class="smv-popup-logo" src="logo.png" alt="Select My Venue">

      <div class="smv-popup-kicker">SMART VENUE DISCOVERY</div>

      <h2>Let's find the right <span>venue for you.</span></h2>

      <p>
        Share your complete event requirement and our team can
        understand exactly what you need before contacting you.
      </p>

      <ul class="smv-popup-benefits">
        <li><b>✓</b><span>Requirement-based venue discovery</span></li>
        <li><b>✓</b><span>Location, date and guest-focused matching</span></li>
        <li><b>✓</b><span>Budget and food preference considered</span></li>
        <li><b>✓</b><span>Human support from Select My Venue</span></li>
        <li><b>✓</b><span>Your information is used only for your venue requirement</span></li>
      </ul>
    </div>

    <div class="smv-popup-form-side">
      <button type="button" class="popup-close" id="smvPopupClose" aria-label="Close enquiry form">×</button>

      <div class="smv-popup-form-head">
        <div class="kicker">YOUR REQUIREMENTS</div>
        <h3>Get your venue options</h3>
        <p>Tell us a few details. It only takes a moment.</p>
      </div>

      <form id="smvCompletePopupForm" novalidate>
        <div class="smv-popup-grid">

          <div class="smv-popup-field">
            <label for="smvPopupName">CUSTOMER NAME *</label>
            <input id="smvPopupName" type="text" placeholder="Enter your name" autocomplete="name" required>
          </div>

          <div class="smv-popup-field">
            <label for="smvPopupMobile">MOBILE NUMBER *</label>
            <input id="smvPopupMobile" type="tel" inputmode="numeric" maxlength="10" placeholder="10-digit mobile number" autocomplete="tel" required>
          </div>

          <div class="smv-popup-field">
            <label for="smvPopupEmail">EMAIL</label>
            <input id="smvPopupEmail" type="email" placeholder="your@email.com" autocomplete="email">
          </div>

          <div class="smv-popup-field">
            <label for="smvPopupLocation">CITY / LOCATION *</label>
            <input id="smvPopupLocation" type="text" placeholder="Delhi, Gurgaon, Noida..." autocomplete="address-level2" required>
          </div>

          <div class="smv-popup-field">
            <label for="smvPopupEventType">EVENT TYPE *</label>
            <select id="smvPopupEventType" required>
              <option value="">Select event</option>
              <option>Wedding</option>
              <option>Engagement</option>
              <option>Birthday</option>
              <option>Anniversary</option>
              <option>Corporate Event</option>
              <option>Reception</option>
              <option>Party</option>
              <option>Baby Shower</option>
              <option>Kitty Party</option>
              <option>Other</option>
            </select>
          </div>

          <div class="smv-popup-field">
            <label for="smvPopupDate">EVENT DATE</label>
            <input id="smvPopupDate" type="date">
          </div>

          <div class="smv-popup-field">
            <label for="smvPopupGuests">NUMBER OF GUESTS</label>
            <input id="smvPopupGuests" type="number" min="1" placeholder="e.g. 300">
          </div>

          <div class="smv-popup-field">
            <label for="smvPopupBudget">BUDGET / PERSON</label>
            <input id="smvPopupBudget" type="number" min="0" placeholder="₹ per person">
          </div>

          <div class="smv-popup-field">
            <label for="smvPopupFood">FOOD PREFERENCE</label>
            <select id="smvPopupFood">
              <option value="">Select preference</option>
              <option>Veg</option>
              <option>Non-Veg</option>
              <option>Both</option>
              <option>Jain</option>
              <option>Not Specified</option>
            </select>
          </div>

          <div class="smv-popup-field">
            <label for="smvPopupVenueType">VENUE STYLE</label>
            <select id="smvPopupVenueType">
              <option value="">Let Select My Venue decide</option>
              <option>Banquet Hall</option>
              <option>Hotel</option>
              <option>Resort</option>
              <option>Farmhouse</option>
              <option>Lawn</option>
              <option>Restaurant</option>
              <option>Rooftop</option>
              <option>Community Hall</option>
            </select>
          </div>

          <div class="smv-popup-field">
            <label for="smvPopupStyle">EVENT STYLE</label>
            <select id="smvPopupStyle">
              <option value="">Let Select My Venue decide</option>
              <option>Premium</option>
              <option>Elegant</option>
              <option>Modern</option>
              <option>Traditional</option>
              <option>Minimal</option>
              <option>Luxury</option>
              <option>Fun & Colorful</option>
            </select>
          </div>

          <div class="smv-popup-field full">
            <label for="smvPopupRequirements">OTHER REQUIREMENTS</label>
            <textarea id="smvPopupRequirements" rows="3" maxlength="1000" placeholder="Decoration, parking, rooms, catering, DJ, photography, special requests, etc."></textarea>
          </div>

        </div>

        <div class="smv-popup-ai-summary">
          <strong>🤖 AI PLANNER INFORMATION</strong>
          <span id="smvPopupAISummary">Your AI event plan will be attached automatically when available.</span>
        </div>

        <div class="smv-popup-actions">
          <button type="submit" class="smv-popup-submit" id="smvPopupSubmit">Submit My Venue Requirement →</button>
          <button type="button" class="smv-popup-later" id="smvPopupLater">Maybe later</button>
        </div>

        <p class="smv-popup-error" id="smvPopupMessage" role="alert" aria-live="polite"></p>
        <p class="smv-popup-trust">🔒 Your information is used only for your venue requirement.</p>
      </form>
    </div>
  `;

  /* If content existed in the HTML, it is already inside popupRoot. */
  if (!originalContent) popupRoot.appendChild(content);

  const form = byId("smvCompletePopupForm");
  const closeButton = byId("smvPopupClose");
  const laterButton = byId("smvPopupLater");
  const submitButton = byId("smvPopupSubmit");
  const message = byId("smvPopupMessage");

  if (!form) return;

  /* ---------------------------------------------------------
     SESSION CONTROL
     --------------------------------------------------------- */
  function isPopupHandled() {
    try {
      return sessionStorage.getItem("smv_popup_handled_v2") === "1";
    } catch (error) {
      return false;
    }
  }

  function markPopupHandled() {
    try {
      sessionStorage.setItem("smv_popup_handled_v2", "1");
    } catch (error) {
      /* Continue if browser storage is unavailable. */
    }
  }

  /* ---------------------------------------------------------
     OPEN / CLOSE
     --------------------------------------------------------- */
  function openPopup() {
    if (isPopupHandled()) return;
    if (overlay.classList.contains("show")) return;

    /* Prefill from existing website/AI planner information. */
    const plan = currentAIPlan;

    if (plan) {
      setValue("smvPopupEventType", plan.eventType || "");
      setValue("smvPopupLocation", plan.location || "");
      setValue("smvPopupDate", plan.eventDate || "");
      setValue("smvPopupGuests", plan.guests || "");
      setValue("smvPopupBudget", plan.budget || "");
      setValue("smvPopupFood", plan.food || "");
      setValue("smvPopupVenueType", plan.venueType || "");
      setValue("smvPopupStyle", plan.style || "");

      const summary = byId("smvPopupAISummary");
      if (summary) {
        summary.textContent =
          (plan.eventType || "Event") +
          " • " +
          (plan.location || "Location not specified") +
          " • Match " +
          (plan.matchScore || "—") +
          "% • " +
          (plan.intent || "Requirement") +
          (plan.style ? " • " + plan.style : "");
      }
    }

    const mainName = getValue("customerName");
    const mainMobile = getValue("customerMobile");
    const mainEmail = getValue("customerEmail");
    const mainLocation = getValue("customerLocation");
    const mainEvent = getValue("customerEventType");
    const mainDate = getValue("customerEventDate");
    const mainGuests = getValue("customerGuests");
    const mainBudget = getValue("customerBudget");
    const mainFood = getValue("customerFood");
    const mainOther = getValue("customerRequirements");

    if (mainName) setValue("smvPopupName", mainName);
    if (mainMobile) setValue("smvPopupMobile", mainMobile);
    if (mainEmail) setValue("smvPopupEmail", mainEmail);
    if (mainLocation) setValue("smvPopupLocation", mainLocation);
    if (mainEvent) setValue("smvPopupEventType", mainEvent);
    if (mainDate) setValue("smvPopupDate", mainDate);
    if (mainGuests) setValue("smvPopupGuests", mainGuests);
    if (mainBudget) setValue("smvPopupBudget", mainBudget);
    if (mainFood) setValue("smvPopupFood", mainFood);
    if (mainOther) setValue("smvPopupRequirements", mainOther);

    clearInlineMessage(message);

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("popup-open");

    setTimeout(function () {
      const name = byId("smvPopupName");
      if (name) name.focus();
    }, 100);
  }

  function closePopup(markHandled) {
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("popup-open");

    if (markHandled) {
      markPopupHandled();
    }
  }

  /* ---------------------------------------------------------
     TRIGGER:
     NO PAGE-LOAD TIMER.
     First genuine website click/tap -> wait 15 seconds -> popup.

     The visitor gets time to browse before the enquiry form appears.
     The popup never opens just because the page was loaded.
     --------------------------------------------------------- */
  const POPUP_DELAY_AFTER_INTERACTION = 10000;
  let interactionTimer = null;
  let interactionDetected = false;

  function startInteractionTimer(event) {
    if (interactionDetected) return;
    if (isPopupHandled()) return;
    if (overlay.classList.contains("show")) return;

    if (event && event.target && event.target.closest("#enquiryPopup")) {
      return;
    }

    interactionDetected = true;
    clearTimeout(interactionTimer);

    interactionTimer = setTimeout(function () {
      openPopup();
    }, POPUP_DELAY_AFTER_INTERACTION);

    document.removeEventListener("click", startInteractionTimer, true);

    console.log(
      "Select My Venue: enquiry popup scheduled 15 seconds after first website interaction."
    );
  }

  document.addEventListener("click", startInteractionTimer, true);

  /* ---------------------------------------------------------
     CLOSE EVENTS
     --------------------------------------------------------- */
  closeButton.addEventListener("click", function () {
    closePopup(true);
  });

  laterButton.addEventListener("click", function () {
    closePopup(true);
  });

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      closePopup(true);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      overlay.classList.contains("show")
    ) {
      closePopup(true);
    }
  });

  /* ---------------------------------------------------------
     MOBILE NUMBER
     --------------------------------------------------------- */
  const mobile = byId("smvPopupMobile");
  if (mobile) {
    mobile.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });
  }

  /* ---------------------------------------------------------
     SUCCESS SCREEN
     --------------------------------------------------------- */
  function showPopupSuccess() {
    const side = popupRoot.querySelector(".smv-popup-form-side");
    if (!side) return;

    side.innerHTML = `
      <div class="smv-popup-success">
        <div class="smv-popup-success-box">
          <div class="smv-success-icon">✓</div>
          <h3>Requirement Received!</h3>
          <p>
            Thank you. Your venue requirement has been submitted
            successfully and saved with our venue enquiry team.
            Our Select My Venue team will review your details and
            contact you with suitable options.
          </p>
          <button type="button" class="smv-success-close" id="smvSuccessClose">
            Continue Browsing
          </button>
        </div>
      </div>
    `;

    const successClose = byId("smvSuccessClose");
    if (successClose) {
      successClose.addEventListener("click", function () {
        closePopup(true);
      });
    }
  }

  /* ---------------------------------------------------------
     COMPLETE POPUP SUBMISSION
     --------------------------------------------------------- */
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    clearInlineMessage(message);

    const customerName = getValue("smvPopupName");
    const customerMobile = getValue("smvPopupMobile");
    const customerEmail = getValue("smvPopupEmail");
    const location = getValue("smvPopupLocation");
    const eventType = getValue("smvPopupEventType");
    const eventDate = getValue("smvPopupDate");
    const guests = getValue("smvPopupGuests");
    const budget = getValue("smvPopupBudget");
    const food = getValue("smvPopupFood");
    const venueType = getValue("smvPopupVenueType");
    const style = getValue("smvPopupStyle");
    const other = getValue("smvPopupRequirements");

    const cleanMobile = customerMobile.replace(/\D/g, "").slice(0, 10);

    if (!customerName) {
      showInlineMessage(message, "Please enter your name.", "error");
      focusField("smvPopupName");
      return;
    }

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      showInlineMessage(
        message,
        "Please enter a valid 10-digit mobile number.",
        "error"
      );
      focusField("smvPopupMobile");
      return;
    }

    if (customerEmail && !isValidEmail(customerEmail)) {
      showInlineMessage(
        message,
        "Please enter a valid email address.",
        "error"
      );
      focusField("smvPopupEmail");
      return;
    }

    if (!location) {
      showInlineMessage(
        message,
        "Please enter your city or location.",
        "error"
      );
      focusField("smvPopupLocation");
      return;
    }

    if (!eventType) {
      showInlineMessage(
        message,
        "Please select your event type.",
        "error"
      );
      focusField("smvPopupEventType");
      return;
    }

    const plan = generateAIEventPlan({
      eventType: eventType,
      location: location,
      eventDate: eventDate,
      guests: guests,
      budget: budget,
      food: food,
      venueType: venueType,
      style: style,
      other: other
    });

    currentAIPlan = plan;
    plannerGenerated = true;
    saveAIPlan(plan);

    const requirements = buildFullAIRequirements({
      aiPlan: plan,
      other: other
    });

    /*
     * EXACT SAME DATABASE TABLE USED BY THE MAIN ENQUIRY FORM.
     *
     * Important:
     * Do NOT call .select().single() after insert here.
     * A successful INSERT can be blocked from SELECT by an RLS
     * SELECT policy, which previously could make a saved enquiry
     * look like a failed submission to the customer.
     */
    const payload = {
      customer_name: customerName,
      mobile: cleanMobile,
      email: customerEmail || null,
      location: location,
      occasion: eventType,
      event_date: eventDate || null,
      guests: guests ? Number(guests) : null,
      budget_per_person: budget ? Number(budget) : null,
      food_preference: food || null,
      requirements: requirements,
      source: "Website - Enquiry Popup",
      status: "new",
      priority: calculateLeadPriority(plan),
      assigned_to: null,
      follow_up_at: null,
      internal_notes:
        "Website Enquiry Popup Lead | Match Score: " +
        plan.matchScore +
        "% | Intent: " +
        plan.intent +
        " | Quality: " +
        plan.leadQuality +
        " | Planning Stage: " +
        plan.planningStage +
        (venueType ? " | Venue Style: " + venueType : "") +
        (style ? " | Event Style: " + style : ""),
      last_contacted_at: null
    };

    setButtonLoading(
      submitButton,
      "Submitting..."
    );

    try {
      if (!supabaseClient) {
        throw new Error(
          "Supabase client is not initialized."
        );
      }

      const { error } = await supabaseClient
        .from("customer_enquiries")
        .insert(payload);

      if (error) {
        console.error(
          "SELECT MY VENUE POPUP INSERT ERROR:",
          error
        );
        throw error;
      }

      /*
       * Keep the same enquiry information synchronized with the
       * main website form and AI planner.
       */
      setValue("customerName", customerName);
      setValue("customerMobile", cleanMobile);
      setValue("customerEmail", customerEmail);
      setValue("customerLocation", location);
      setValue("customerEventType", eventType);
      setValue("customerEventDate", eventDate);
      setValue("customerGuests", guests);
      setValue("customerBudget", budget);
      setValue("customerFood", food);
      setValue("customerRequirements", other);

      populatePlannerFromPlan(plan);
      renderAIPlan(plan);
      updatePlannerSummary(plan);

      markPopupHandled();

      console.log(
        "Select My Venue: popup enquiry successfully inserted into customer_enquiries.",
        payload
      );

      showPopupSuccess();

      showToast(
        "✓ Your venue requirement has been received successfully."
      );
    } catch (error) {
      console.error(
        "SELECT MY VENUE POPUP ENQUIRY ERROR:",
        error
      );

      showInlineMessage(
        message,
        getFriendlySupabaseError(error),
        "error"
      );

      showToast(
        getFriendlySupabaseError(error),
        "error"
      );
    } finally {
      restoreButton(
        submitButton,
        "Submit My Venue Requirement →"
      );
    }
  });
}

/* =========================================================
   SYNC CUSTOMER FORM -> PLANNER
   ========================================================= */

function syncCustomerFormToPlanner() {
  const eventType =
    getValue("customerEventType");

  const location =
    getValue("customerLocation");

  const date =
    getValue("customerEventDate");

  const guests =
    getValue("customerGuests");

  const budget =
    getValue("customerBudget");

  const food =
    getValue("customerFood");

  const other =
    getValue("customerRequirements");

  if (!eventType && !location) {
    return;
  }

  setValue(
    "plannerEventType",
    eventType
  );

  setValue(
    "plannerLocation",
    location
  );

  setValue(
    "plannerDate",
    date
  );

  setValue(
    "plannerGuests",
    guests
  );

  setValue(
    "plannerBudget",
    budget
  );

  setValue(
    "plannerFood",
    food
  );

  setValue(
    "plannerRequirements",
    other
  );

  currentAIPlan =
    generateAIEventPlan({
      eventType,
      location,
      eventDate: date,
      guests,
      budget,
      food,
      venueType: "",
      style: "",
      other
    });

  plannerGenerated = true;
  saveAIPlan(currentAIPlan);
  renderAIPlan(currentAIPlan);
}

/* =========================================================
   FIND MATCHING VENUES
   ========================================================= */

function setupPlannerToEnquiry() {
  const button = byId(
    "plannerToEnquiry"
  );

  if (!button) return;

  button.addEventListener(
    "click",
    function () {
      if (!currentAIPlan) {
        showPlannerMessage(
          "Generate your AI event plan first.",
          "error"
        );
        return;
      }

      setValue(
        "customerEventType",
        currentAIPlan.eventType
      );

      setValue(
        "customerLocation",
        currentAIPlan.location
      );

      setValue(
        "customerEventDate",
        currentAIPlan.eventDate
      );

      setValue(
        "customerGuests",
        currentAIPlan.guests || ""
      );

      setValue(
        "customerBudget",
        currentAIPlan.budget || ""
      );

      setValue(
        "customerFood",
        currentAIPlan.food || ""
      );

      setValue(
        "customerRequirements",
        currentAIPlan.other || ""
      );

      updatePlannerSummary(
        currentAIPlan
      );

      scrollToElement("enquiry");

      setTimeout(function () {
        const name = byId(
          "customerName"
        );

        if (name) name.focus();
      }, 500);
    }
  );
}

/* =========================================================
   FULL AI REQUIREMENTS FOR CRM
   ========================================================= */

function buildAIRequirements(plan) {
  if (!plan) return "";

  const lines = [
    "=== AI EVENT PLAN ===",
    "Event: " + plan.eventType,
    "Category: " + plan.category,
    "Location: " + plan.location,
    "Guests: " + (
      plan.guests || "Not specified"
    ),
    "Event Date: " + (
      plan.eventDate || "Not specified"
    ),
    "Budget / Person: " + (
      plan.budget
        ? formatINR(plan.budget)
        : "Not specified"
    ),
    "Food: " + (
      plan.food || "Not specified"
    ),
    "Venue Style: " + (
      plan.venueType ||
      "AI recommended"
    ),
    "Event Style: " + (
      plan.style ||
      "AI recommended"
    ),
    "Match Score: " +
      plan.matchScore +
      "%",
    "Lead Intent: " +
      plan.intent,
    "Lead Quality: " +
      plan.leadQuality,
    "Planning Stage: " +
      plan.planningStage,
    "Date Confidence: " +
      plan.dateConfidence,
    "Budget Confidence: " +
      plan.budgetConfidence,
    "",
    "=== VENUE RECOMMENDATIONS ===",
    plan.venueTypes.join(", "),
    "",
    "=== FOOD RECOMMENDATIONS ===",
    plan.foodRecommendations.join(", "),
    "",
    "=== THEME & DECOR ===",
    plan.themes.join(", "),
    "",
    "=== PHOTOGRAPHY ===",
    plan.photographyRecommendations.join(", "),
    "",
    "=== ENTERTAINMENT ===",
    plan.entertainmentRecommendations.join(", "),
    "",
    "=== GUEST INTELLIGENCE ===",
    plan.guestIntelligence.join(" | "),
    "",
    "=== PLANNING TIMELINE ===",
    plan.timeline
      .map(function (item) {
        return (
          item.period +
          ": " +
          item.task
        );
      })
      .join(" | "),
    "",
    "=== CHECKLIST ===",
    plan.checklist.join(" | ")
  ];

  if (plan.other) {
    lines.push(
      "",
      "=== OTHER REQUIREMENTS ===",
      plan.other
    );
  }

  return lines.join("\n");
}

function buildFullAIRequirements(data) {
  const customerComment =
    typeof data?.other === "string"
      ? data.other.trim()
      : "";

  // IMPORTANT:
  // If the customer did not type anything in
  // "Other Requirements", keep CRM Requirements
  // completely empty.
  if (!customerComment) {
    return "";
  }

  // If the customer typed a comment,
  // save ONLY the customer's actual comment.
  return customerComment;
}

/* =========================================================
   VALIDATION
   ========================================================= */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || "").trim()
  );
}

/* =========================================================
   SMART FORM ENHANCEMENTS
   ========================================================= */

function setupSmartFormEnhancements() {
  const mobile = byId(
    "customerMobile"
  );

  if (mobile) {
    mobile.addEventListener(
      "input",
      function () {
        this.value =
          this.value
            .replace(/\D/g, "")
            .slice(0, 10);
      }
    );
  }

  const plannerGuests =
    byId("plannerGuests");

  const customerGuests =
    byId("customerGuests");

  [plannerGuests, customerGuests]
    .filter(Boolean)
    .forEach(function (field) {
      field.addEventListener(
        "input",
        function () {
          if (Number(this.value) < 0) {
            this.value = "";
          }
        }
      );
    });

  const plannerBudget =
    byId("plannerBudget");

  const customerBudget =
    byId("customerBudget");

  [plannerBudget, customerBudget]
    .filter(Boolean)
    .forEach(function (field) {
      field.addEventListener(
        "input",
        function () {
          if (Number(this.value) < 0) {
            this.value = "";
          }
        }
      );
    });

  /* Keep customer event choices aligned with planner */
  const plannerEvent =
    byId("plannerEventType");

  const customerEvent =
    byId("customerEventType");

  if (plannerEvent && customerEvent) {
    plannerEvent.addEventListener(
      "change",
      function () {
        if (!customerEvent.value) {
          customerEvent.value =
            plannerEvent.value;
        }
      }
    );

    customerEvent.addEventListener(
      "change",
      function () {
        if (!plannerEvent.value) {
          plannerEvent.value =
            customerEvent.value;
        }
      }
    );
  }
}

/* =========================================================
   SCROLL ANIMATIONS
   ========================================================= */

function setupScrollAnimations() {
  const sections =
    document.querySelectorAll(
      ".feature-card, .ai-result-card, .contact-card, .event-card"
    );

  if (
    !("IntersectionObserver" in window)
  ) {
    return;
  }

  const observer =
    new IntersectionObserver(
      function (entries) {
        entries.forEach(
          function (entry) {
            if (
              entry.isIntersecting
            ) {
              entry.target.classList.add(
                "is-visible"
              );

              observer.unobserve(
                entry.target
              );
            }
          }
        );
      },
      {
        threshold: 0.08
      }
    );

  sections.forEach(
    function (section) {
      observer.observe(section);
    }
  );
}

/* =========================================================
   OPTIONAL LEGACY QUICK ACTION SUPPORT
   ========================================================= */

document.addEventListener(
  "click",
  function (event) {
    const target =
      event.target.closest(
        "[data-ai-action]"
      );

    if (!target) return;

    const action =
      target.getAttribute(
        "data-ai-action"
      );

    if (action === "save") {
      if (currentAIPlan) {
        saveAIPlan(currentAIPlan);
        showToast(
          "✓ Your event plan has been saved."
        );
      }
    }

    if (action === "clear") {
      clearSavedAIPlan();
      currentAIPlan = null;
      plannerGenerated = false;
      showToast(
        "Saved event plan cleared."
      );
    }
  }
);

/* =========================================================
   FLOATING WHATSAPP — CUSTOMER-FIRST CTA
   ========================================================= */
function setupFloatingWhatsApp(){
  const number="918368322256";
  const message="Hi Select My Venue! I am looking for a venue for my event. Please help me find suitable options.";

  // Prefer the floating WhatsApp button already present in index.html.
  // This prevents duplicate floating buttons.
  const existing = document.querySelector(".floating-whatsapp");
  if(existing){
    existing.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
    existing.target = "_blank";
    existing.rel = "noopener noreferrer";
    existing.setAttribute("aria-label","Chat with Select My Venue on WhatsApp");
    existing.title = "Chat with Select My Venue";
    return;
  }

  if(document.getElementById("smvFloatingWhatsApp")) return;

  const link=document.createElement("a");
  link.id="smvFloatingWhatsApp";
  link.className="smv-floating-whatsapp";
  link.href="https://wa.me/"+number+"?text="+encodeURIComponent(message);
  link.target="_blank";
  link.rel="noopener noreferrer";
  link.setAttribute("aria-label","Chat with Select My Venue on WhatsApp");
  link.title="Chat with Select My Venue";
  link.innerHTML='<span class="smv-wa-icon" aria-hidden="true">◉</span><span class="smv-wa-copy"><strong>Need help?</strong><small>Chat on WhatsApp</small></span><span class="smv-wa-pulse" aria-hidden="true"></span>';
  document.body.appendChild(link);
}

function setupContactCardUX(){
  document.querySelectorAll(".contact-card").forEach(function(card){
    card.setAttribute("tabindex","0");
    card.addEventListener("keydown",function(e){
      if(e.key!=="Enter" && e.key!==" ") return;
      const link=card.closest("a")||card.querySelector("a");
      if(!link) return; e.preventDefault(); link.click();
    });
  });
}

/* =========================================================
   GLOBAL ACCESS
   Useful for debugging in browser console.
   ========================================================= */

window.SelectMyVenue = {
  getCurrentAIPlan: function () {
    return currentAIPlan;
  },

  generateAIEventPlan,

  renderAIPlan,

  saveAIPlan,

  restoreSavedAIPlan,

  clearSavedAIPlan
};

console.log(
  "Select My Venue — website script loaded."
);

/* =========================================================
   SELECT MY VENUE — FINAL REAL AI ASSISTANT
   ---------------------------------------------------------
   ONE floating customer AI assistant

   Customer
      ↓
   Supabase Edge Function
      ↓
   smv-ai-assistant
      ↓
   OpenAI
      ↓
   AI reply

   No hard-coded response engine.
   ========================================================= */

(function setupFinalSMVAI() {

  "use strict";

  /* =======================================================
     CONFIG
     ======================================================= */

  const SUPABASE_AI_URL =
    "https://uajqwyoqbbswkfiwosyw.supabase.co/functions/v1/smv-ai-assistant";

  const AI_POPUP_DELAY = 15000;


  /* =======================================================
     PREVENT DUPLICATE INITIALIZATION
     ======================================================= */

  if (window.__SMV_FINAL_REAL_AI_INITIALIZED) {
    console.log(
      "SMV AI: already initialized."
    );
    return;
  }

  window.__SMV_FINAL_REAL_AI_INITIALIZED = true;


  /* =======================================================
     HTML ESCAPE
     ======================================================= */

  function escapeHTML(value) {

    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  /* =======================================================
     FORMAT AI TEXT
     ======================================================= */

  function formatAIText(value) {

    let text =
      escapeHTML(value);

    text =
      text.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      );

    text =
      text.replace(
        /\n/g,
        "<br>"
      );

    return text;

  }


  /* =======================================================
     REMOVE ONLY OUR FINAL WIDGET
     ======================================================= */

  function removeDuplicateFinalWidget() {

    const existing =
      document.getElementById(
        "smvFinalAIAssistant"
      );

    if (existing) {
      existing.remove();
    }

  }


  /* =======================================================
     CREATE AI ASSISTANT
     ======================================================= */

  function createFinalAIAssistant() {

    if (
      document.getElementById(
        "smvFinalAIAssistant"
      )
    ) {
      return;
    }


    const wrapper =
      document.createElement("div");

    wrapper.id =
      "smvFinalAIAssistant";


    wrapper.innerHTML = `

      <button
        type="button"
        id="smvFinalAIButton"
        class="smv-final-ai-button"
        aria-label="Open Select My Venue AI Assistant"
        aria-expanded="false"
      >

        <span
          class="smv-final-ai-icon"
          aria-hidden="true"
        >
          ✦
        </span>

        <span>
          AI Assistant
        </span>

      </button>


      <div
        id="smvFinalAIPanel"
        class="smv-final-ai-panel"
        aria-hidden="true"
      >

        <div class="smv-final-ai-header">

          <div>

            <strong>
              Select My Venue
            </strong>

            <small>
              AI Event Assistant
            </small>

          </div>


          <button
            type="button"
            id="smvFinalAIClose"
            class="smv-final-ai-close"
            aria-label="Close AI Assistant"
          >
            ×
          </button>

        </div>


        <div
          id="smvFinalAIConversation"
          class="smv-final-ai-conversation"
        >

          <div
            class="smv-final-ai-message ai"
          >

            <div
              class="smv-final-ai-avatar"
            >
              ✦
            </div>

            <div
              class="smv-final-ai-bubble"
            >

              <strong>
                Hi! I'm your Select My Venue AI Assistant.
              </strong>

              <p>
                I can help you plan your event,
                understand your venue requirements
                and guide you to the right next step.
              </p>

            </div>

          </div>


          <div
            class="smv-final-ai-suggestions"
          >

            <button
              type="button"
              data-ai-action="venue"
            >
              🏛️ Venue type
            </button>

            <button
              type="button"
              data-ai-action="budget"
            >
              💰 Budget
            </button>

            <button
              type="button"
              data-ai-action="checklist"
            >
              ✅ Venue checklist
            </button>

            <button
              type="button"
              data-ai-action="planner"
            >
              ✦ Start AI Planner
            </button>

          </div>

        </div>


        <form
          id="smvFinalAIForm"
          class="smv-final-ai-form"
        >

          <input
            id="smvFinalAIInput"
            type="text"
            autocomplete="off"
            maxlength="600"
            placeholder="Ask about your event..."
            aria-label="Ask Select My Venue AI"
          >

          <button
            type="submit"
            id="smvFinalAISend"
            aria-label="Send message"
          >
            →
          </button>

        </form>

      </div>

    `;


    document.body.appendChild(
      wrapper
    );

  }


  /* =======================================================
     ELEMENTS
     ======================================================= */

  let button = null;
  let panel = null;
  let closeButton = null;
  let form = null;
  let input = null;
  let sendButton = null;
  let conversation = null;


  /* =======================================================
     CONNECT ELEMENTS
     ======================================================= */

  function connectElements() {

    button =
      document.getElementById(
        "smvFinalAIButton"
      );

    panel =
      document.getElementById(
        "smvFinalAIPanel"
      );

    closeButton =
      document.getElementById(
        "smvFinalAIClose"
      );

    form =
      document.getElementById(
        "smvFinalAIForm"
      );

    input =
      document.getElementById(
        "smvFinalAIInput"
      );

    sendButton =
      document.getElementById(
        "smvFinalAISend"
      );

    conversation =
      document.getElementById(
        "smvFinalAIConversation"
      );

  }


  /* =======================================================
     OPEN ASSISTANT
     ======================================================= */

  function openAssistant(
    focusInput
  ) {

    if (
      !panel ||
      !button
    ) {
      return;
    }


    panel.classList.add(
      "open"
    );

    panel.setAttribute(
      "aria-hidden",
      "false"
    );

    button.setAttribute(
      "aria-expanded",
      "true"
    );


    if (
      focusInput &&
      input
    ) {

      setTimeout(
        function () {

          input.focus();

        },
        100
      );

    }

  }


  /* =======================================================
     CLOSE ASSISTANT
     ======================================================= */

  function closeAssistant() {

    if (
      !panel ||
      !button
    ) {
      return;
    }


    panel.classList.remove(
      "open"
    );

    panel.setAttribute(
      "aria-hidden",
      "true"
    );

    button.setAttribute(
      "aria-expanded",
      "false"
    );

  }


  /* =======================================================
     ADD USER MESSAGE
     ======================================================= */

  function addUserMessage(
    text
  ) {

    if (!conversation) {
      return;
    }


    const message =
      document.createElement(
        "div"
      );

    message.className =
      "smv-final-ai-message user";


    message.innerHTML = `

      <div
        class="smv-final-ai-user-bubble"
      >
        ${escapeHTML(text)}
      </div>

    `;


    conversation.appendChild(
      message
    );


    conversation.scrollTop =
      conversation.scrollHeight;

  }


  /* =======================================================
     ADD AI MESSAGE
     ======================================================= */

  function addAIMessage(
    text
  ) {

    if (!conversation) {
      return;
    }


    const message =
      document.createElement(
        "div"
      );

    message.className =
      "smv-final-ai-message ai";


    message.innerHTML = `

      <div
        class="smv-final-ai-avatar"
      >
        ✦
      </div>

      <div
        class="smv-final-ai-bubble"
      >
        ${formatAIText(text)}
      </div>

    `;


    conversation.appendChild(
      message
    );


    conversation.scrollTop =
      conversation.scrollHeight;


    return message;

  }


  /* =======================================================
     THINKING MESSAGE
     ======================================================= */

  function addThinkingMessage() {

    if (!conversation) {
      return null;
    }


    const message =
      document.createElement(
        "div"
      );

    message.className =
      "smv-final-ai-message ai smv-ai-thinking";


    message.innerHTML = `

      <div
        class="smv-final-ai-avatar"
      >
        ✦
      </div>

      <div
        class="smv-final-ai-bubble"
      >
        <span>
          Thinking…
        </span>
      </div>

    `;


    conversation.appendChild(
      message
    );


    conversation.scrollTop =
      conversation.scrollHeight;


    return message;

  }


  /* =======================================================
     READ CURRENT EVENT CONTEXT

     Customer name / phone / email are NOT sent.
     ======================================================= */

  function getAIEventContext() {

    function value(id) {

      const element =
        document.getElementById(
          id
        );

      if (!element) {
        return "";
      }


      return String(
        element.value || ""
      ).trim();

    }


    const context = {

      eventType:
        value("plannerEventType") ||
        value("customerEventType") ||
        value("eventType"),


      location:
        value("plannerLocation") ||
        value("customerLocation") ||
        value("location"),


      eventDate:
        value("plannerDate") ||
        value("customerEventDate") ||
        value("date"),


      guests:
        value("plannerGuests") ||
        value("customerGuests") ||
        value("guests"),


      budgetPerPerson:
        value("plannerBudget") ||
        value("customerBudget"),


      food:
        value("plannerFood") ||
        value("customerFood"),


      venueType:
        value("plannerVenueType"),


      requirements:
        value("plannerRequirements") ||
        value("customerRequirements")

    };


    try {

      if (
        typeof currentAIPlan !== "undefined" &&
        currentAIPlan &&
        typeof currentAIPlan === "object"
      ) {

        context.aiPlan = {

          matchScore:
            (currentAIPlan.matchScore != null
              ? currentAIPlan.matchScore
              : null),


          intent:
            String(
              currentAIPlan.intent || ""
            ).slice(
              0,
              40
            ),


          leadQuality:
            String(
              currentAIPlan.leadQuality || ""
            ).slice(
              0,
              40
            ),


          planningStage:
            String(
              currentAIPlan.planningStage || ""
            ).slice(
              0,
              60
            ),


          venueTypes:
            Array.isArray(
              currentAIPlan.venueTypes
            )
              ? currentAIPlan.venueTypes
                  .slice(0, 5)
                  .map(
                    function (item) {

                      return String(
                        item
                      ).slice(
                        0,
                        100
                      );

                    }
                  )
              : []

        };

      }

    } catch (error) {

      console.warn(
        "SMV AI: could not read current AI plan.",
        error
      );

    }


    return context;

  }


  /* =======================================================
     CALL REAL SUPABASE AI
     ======================================================= */

  async function askSMVAI(
    message
  ) {

    const context =
      getAIEventContext();


    let response;


    try {

      response =
        await fetch(
          SUPABASE_AI_URL,
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Accept":
                "application/json"

            },

            body:
              JSON.stringify({

                message:
                  String(
                    message
                  ).trim(),

                context:
                  context

              })

          }
        );

    } catch (networkError) {

      console.error(
        "SMV AI network error:",
        networkError
      );

      throw new Error(
        "Unable to connect to the AI service. Please check your internet connection and try again."
      );

    }


    let data = null;


    try {

      data =
        await response.json();

    } catch (parseError) {

      console.error(
        "SMV AI invalid JSON response:",
        parseError
      );

      throw new Error(
        "The AI service returned an invalid response."
      );

    }


    console.log(
      "SMV AI response:",
      response.status,
      data
    );


    if (
      !response.ok
    ) {

      const backendError =
        data?.error ||
        data?.message ||
        data?.details?.error?.message ||
        data?.details?.message ||
        "";


      console.error(
        "SMV AI backend error:",
        {
          status:
            response.status,

          response:
            data
        }
      );


      if (
        response.status === 401 ||
        response.status === 403
      ) {

        throw new Error(
          "The AI service rejected the request. Please check the Supabase AI function configuration."
        );

      }


      if (
        response.status === 404
      ) {

        throw new Error(
          "The AI service endpoint was not found. Please check the Supabase Edge Function."
        );

      }


      if (
        response.status === 429
      ) {

        throw new Error(
          "The AI service is temporarily busy. Please try again in a moment."
        );

      }


      throw new Error(
        backendError ||
        "The AI assistant could not respond right now."
      );

    }


    if (
      !data ||
      !data.reply
    ) {

      console.error(
        "SMV AI returned no reply:",
        data
      );


      throw new Error(
        "The AI assistant returned an empty response."
      );

    }


    return String(
      data.reply
    ).trim();

  }


  /* =======================================================
     SEND REAL AI MESSAGE
     ======================================================= */

  async function sendMessage(
    rawMessage
  ) {

    const message =
      String(
        rawMessage || ""
      ).trim();


    if (!message) {
      return;
    }


    if (
      message.length > 600
    ) {

      addAIMessage(
        "Please keep your question under 600 characters."
      );

      return;

    }


    addUserMessage(
      message
    );


    if (input) {
      input.value = "";
    }


    if (input) {
      input.disabled = true;
    }


    if (sendButton) {
      sendButton.disabled = true;
    }


    const thinking =
      addThinkingMessage();


    try {

      const reply =
        await askSMVAI(
          message
        );


      if (thinking) {
        thinking.remove();
      }


      addAIMessage(
        reply
      );


    } catch (error) {

      console.error(
        "SMV AI Assistant:",
        error
      );


      if (thinking) {
        thinking.remove();
      }


      addAIMessage(
        error?.message ||
        "Sorry, the AI assistant is temporarily unavailable. Please try again."
      );


    } finally {

      if (input) {
        input.disabled = false;
      }


      if (sendButton) {
        sendButton.disabled = false;
      }


      if (input) {
        input.focus();
      }

    }

  }


  /* =======================================================
     QUICK ACTION QUESTIONS

     These are ALSO sent to REAL AI.
     ======================================================= */

  function getQuickQuestion(
    action
  ) {

    if (
      action === "venue"
    ) {

      return (
        "Help me choose the right venue. " +
        "Please consider my current event details, " +
        "guest count, location, budget and preferred style."
      );

    }


    if (
      action === "budget"
    ) {

      return (
        "Help me understand and plan my event budget. " +
        "Please consider my current event details and " +
        "tell me how I should allocate the budget."
      );

    }


    if (
      action === "checklist"
    ) {

      return (
        "Give me a practical venue booking checklist " +
        "for my event. Please prioritize the most important " +
        "things I should verify before booking."
      );

    }


    if (
      action === "planner"
    ) {

      return (
        "I want to start planning my event. " +
        "Review my current event information and tell me " +
        "the most useful next steps."
      );

    }


    return "";

  }


  /* =======================================================
     QUICK ACTION HANDLER
     ======================================================= */

  function handleQuickAction(
    action
  ) {

    const question =
      getQuickQuestion(
        action
      );


    if (!question) {
      return;
    }


    openAssistant(
      false
    );


    sendMessage(
      question
    );


    if (
      action === "planner"
    ) {

      setTimeout(
        function () {

          const planner =
            document.getElementById(
              "aiPlanner"
            );


          if (planner) {

            planner.scrollIntoView({

              behavior:
                "smooth",

              block:
                "start"

            });

          }

        },
        900
      );

    }

  }


  /* =======================================================
     BUTTON / FORM EVENTS
     ======================================================= */

  function attachEvents() {

    if (button) {

      button.addEventListener(
        "click",
        function () {

          openAssistant(
            true
          );

        }
      );

    }


    if (closeButton) {

      closeButton.addEventListener(
        "click",
        function () {

          closeAssistant();

        }
      );

    }


    if (form) {

      form.addEventListener(
        "submit",
        function (event) {

          event.preventDefault();

          sendMessage(
            input
              ? input.value
              : ""
          );

        }
      );

    }


    if (conversation) {

      conversation
        .querySelectorAll(
          "[data-ai-action]"
        )
        .forEach(
          function (actionButton) {

            actionButton.addEventListener(
              "click",
              function () {

                const action =
                  actionButton.getAttribute(
                    "data-ai-action"
                  );


                handleQuickAction(
                  action
                );

              }
            );

          }
        );

    }


    document.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Escape"
        ) {

          closeAssistant();

        }

      }
    );

  }


  /* =======================================================
     15 SECOND CUSTOMER-INTERACTION POPUP

     The timer starts ONLY after customer interaction.

     It does NOT immediately open on page load.
     ======================================================= */

  let interactionTimerStarted =
    false;

  let interactionTimer =
    null;


  function startInteractionTimer() {

    if (
      interactionTimerStarted
    ) {

      return;

    }


    interactionTimerStarted =
      true;


    interactionTimer =
      setTimeout(
        function () {

          if (
            panel &&
            !panel.classList.contains(
              "open"
            )
          ) {

            openAssistant(
              false
            );

          }

        },
        AI_POPUP_DELAY
      );

  }


  /* =======================================================
     START TIMER AFTER CUSTOMER INTERACTS
     ======================================================= */

  function interactionHandler(
    event
  ) {

    if (
      event &&
      event.target &&
      event.target.closest &&
      event.target.closest(
        "#smvFinalAIAssistant"
      )
    ) {

      return;

    }


    startInteractionTimer();

  }


  document.addEventListener(
    "click",
    interactionHandler,
    {
      passive: true
    }
  );


  /* =======================================================
     INITIALIZE
     ======================================================= */

  function initialize() {

    /*
     * Remove ONLY our own previous widget.
     */

    removeDuplicateFinalWidget();


    /*
     * Create exactly ONE final AI widget.
     */

    createFinalAIAssistant();


    /*
     * Connect all elements.
     */

    connectElements();


    /*
     * Attach events.
     */

    attachEvents();


    console.log(
      "✓ Select My Venue REAL AI Assistant initialized."
    );


    console.log(
      "✓ Supabase AI endpoint:",
      SUPABASE_AI_URL
    );


    console.log(
      "✓ AI popup delay:",
      AI_POPUP_DELAY / 1000,
      "seconds after customer interaction."
    );

  }


  /* =======================================================
     WAIT FOR PAGE
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once: true
      }
    );

  } else {

    initialize();

  }

})();
