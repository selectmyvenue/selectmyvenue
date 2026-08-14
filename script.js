/* =========================================================
   SELECT MY VENUE
   WEBSITE JAVASCRIPT
   Exact companion for the current index.html
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
            "AI Planner Qualified Lead | Match Score: " +
            plan.matchScore +
            "% | Intent: " +
            plan.intent +
            " | Quality: " +
            plan.leadQuality +
            " | Planning Stage: " +
            plan.planningStage,

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
  let result = buildAIRequirements(
    data.aiPlan
  );

  if (data.other) {
    result +=
      "\n\n=== CUSTOMER REQUIREMENTS ===\n" +
      data.other;
  }

  return result;
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
