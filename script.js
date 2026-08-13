// =====================================================
// SELECT MY VENUE
// CUSTOMER WEBSITE
// SMART EVENT DISCOVERY ENGINE
//
// Website → Smart Processing → Supabase → CRM
//
// IMPORTANT:
// - Uses existing Supabase table/columns only
// - Public website performs INSERT only
// - No public SELECT
// - Top search prepares the enquiry instead of creating
//   an incomplete database record
// =====================================================

"use strict";


// =====================================================
// SUPABASE CONFIG
// =====================================================

const SUPABASE_URL =
  "https://uajqwyoqbbswkfiwosyw.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";


// =====================================================
// SUPABASE CLIENT
// =====================================================

let supabaseClient = null;

try {

  if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
  ) {

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

    console.log("✓ Supabase client initialized.");

  } else {

    console.error(
      "Supabase library was not loaded."
    );

  }

} catch (error) {

  console.error(
    "Supabase initialization error:",
    error
  );

}


// =====================================================
// CONSTANTS
// =====================================================

const DRAFT_STORAGE_KEY =
  "smv_customer_enquiry_draft_v2";

const LAST_ENQUIRY_KEY =
  "smv_last_enquiry_reference";

const WEBSITE_SOURCE =
  "Website";


// =====================================================
// PAGE READY
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    injectSmartStyles();

    setupMobileMenu();

    setupHeroSearch();

    setupCustomerEnquiry();

    setupDraftSaving();

    setupDateProtection();

    setupSmartFieldEnhancements();

    setupNavigationHelpers();

    restoreSavedDraft();

    console.log(
      "✓ Select My Venue Smart Discovery Engine ready."
    );

  }
);


// =====================================================
// MOBILE MENU
// =====================================================

function setupMobileMenu() {

  const menuToggle =
    document.getElementById("menuToggle");

  const mainNav =
    document.getElementById("mainNav");


  if (!menuToggle || !mainNav) {
    return;
  }


  menuToggle.addEventListener(
    "click",
    function (event) {

      event.preventDefault();
      event.stopPropagation();

      const isOpen =
        mainNav.classList.toggle("open");

      menuToggle.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );

    }
  );


  mainNav
    .querySelectorAll("a")
    .forEach(function (link) {

      link.addEventListener(
        "click",
        function () {

          mainNav.classList.remove("open");

          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );

        }
      );

    });

}


// =====================================================
// HERO SMART SEARCH
//
// IMPORTANT CHANGE:
//
// The top form does NOT directly insert an incomplete
// enquiry into Supabase.
//
// It prepares a smart requirement and moves the customer
// to the full enquiry form.
//
// This prevents the current top-form submission error.
// =====================================================

function setupHeroSearch() {

  const searchForm =
    document.getElementById("searchForm");

  if (!searchForm) {
    return;
  }


  searchForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();
      event.stopPropagation();


      const submitButton =
        searchForm.querySelector(
          'button[type="submit"]'
        );


      const eventType =
        getValue("eventType");

      const location =
        getValue("location");

      const guests =
        getValue("guests");

      const eventDate =
        getValue("date");


      const message =
        document.getElementById(
          "heroFormMessage"
        );


      clearInlineMessage(message);


      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

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
          "Please enter your city or location.",
          "error"
        );

        focusField("location");

        return;

      }


      if (
        eventDate &&
        isPastDate(eventDate)
      ) {

        showInlineMessage(
          message,
          "Please select today or a future event date.",
          "error"
        );

        focusField("date");

        return;

      }


      // -------------------------------------------------
      // SMART ANALYSIS
      // -------------------------------------------------

      const smartProfile =
        createSmartEventProfile({

          eventType:
            eventType,

          location:
            location,

          guests:
            guests,

          eventDate:
            eventDate

        });


      // -------------------------------------------------
      // PREFILL FULL ENQUIRY
      // -------------------------------------------------

      prefillFullEnquiry({

        eventType:
          eventType,

        location:
          location,

        guests:
          convertGuestRangeToNumber(guests),

        eventDate:
          eventDate

      });


      // -------------------------------------------------
      // SAVE SMART SEARCH AS DRAFT
      // -------------------------------------------------

      saveDraftData({

        customerEventType:
          eventType,

        customerLocation:
          location,

        customerGuests:
          convertGuestRangeToNumber(guests),

        customerEventDate:
          eventDate

      });


      // -------------------------------------------------
      // SHOW SMART RESULT
      // -------------------------------------------------

      renderSmartSearchResult(
        smartProfile
      );


      // -------------------------------------------------
      // BUTTON
      // -------------------------------------------------

      setButtonLoading(
        submitButton,
        "Preparing..."
      );


      await wait(450);


      restoreButton(
        submitButton,
        "Find Venues →"
      );


      // -------------------------------------------------
      // MOVE CUSTOMER TO FULL ENQUIRY
      // -------------------------------------------------

      const enquirySection =
        document.getElementById("enquiry");


      if (enquirySection) {

        enquirySection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }


      showInlineMessage(
        message,
        "✓ Smart search ready. We have prepared your enquiry below — add your contact details and submit.",
        "success"
      );

    }
  );

}


// =====================================================
// PREFILL FULL ENQUIRY
// =====================================================

function prefillFullEnquiry(data) {

  setElementValue(
    "customerEventType",
    data.eventType
  );


  setElementValue(
    "customerLocation",
    data.location
  );


  if (data.guests) {

    setElementValue(
      "customerGuests",
      data.guests
    );

  }


  if (data.eventDate) {

    setElementValue(
      "customerEventDate",
      data.eventDate
    );

  }

}


// =====================================================
// SMART EVENT PROFILE
// =====================================================

function createSmartEventProfile(data) {

  const guests =
    convertGuestRangeToNumber(
      data.guests
    );


  const eventType =
    String(
      data.eventType || ""
    ).toLowerCase();


  const location =
    normalizeLocation(
      data.location
    );


  let venueTypes = [];

  let planningFocus =
    "Location + capacity + event suitability";


  let priority =
    "normal";


  let score = 72;


  // -------------------------------------------------
  // EVENT INTELLIGENCE
  // -------------------------------------------------

  if (
    eventType.includes("wedding") ||
    eventType.includes("reception") ||
    eventType.includes("engagement")
  ) {

    venueTypes = [
      "Banquet Hall",
      "Wedding Lawn",
      "Hotel",
      "Resort"
    ];

    planningFocus =
      "Capacity + ambience + food + location";

    score += 8;

  }


  else if (
    eventType.includes("birthday") ||
    eventType.includes("party")
  ) {

    venueTypes = [
      "Party Venue",
      "Banquet Hall",
      "Restaurant",
      "Lawn"
    ];

    planningFocus =
      "Location + atmosphere + guest capacity";

    score += 5;

  }


  else if (
    eventType.includes("corporate")
  ) {

    venueTypes = [
      "Hotel",
      "Conference Venue",
      "Banquet Hall",
      "Business Event Space"
    ];

    planningFocus =
      "Accessibility + capacity + professional facilities";

    score += 6;

  }


  else {

    venueTypes = [
      "Banquet Hall",
      "Hotel",
      "Resort",
      "Event Space"
    ];

  }


  // -------------------------------------------------
  // GUEST INTELLIGENCE
  // -------------------------------------------------

  let guestInsight =
    "Standard capacity matching";

  if (guests) {

    if (guests >= 500) {

      guestInsight =
        "Large-event capacity required";

      score += 7;

    }

    else if (guests >= 250) {

      guestInsight =
        "Medium-large venue capacity required";

      score += 5;

    }

    else if (guests <= 50) {

      guestInsight =
        "Intimate venue options may be suitable";

      score += 3;

    }

  }


  // -------------------------------------------------
  // DATE INTELLIGENCE
  // -------------------------------------------------

  let dateInsight =
    "Flexible date matching";


  if (data.eventDate) {

    const days =
      daysUntil(
        data.eventDate
      );


    if (days <= 7) {

      dateInsight =
        "URGENT — event within 7 days";

      priority =
        "high";

      score += 8;

    }

    else if (days <= 30) {

      dateInsight =
        "Priority — event within 30 days";

      priority =
        "high";

      score += 6;

    }

    else if (days <= 90) {

      dateInsight =
        "Planned event — 1 to 3 months";

      score += 4;

    }

    else {

      dateInsight =
        "Advance planning opportunity";

    }

  }


  // -------------------------------------------------
  // LOCATION INTELLIGENCE
  // -------------------------------------------------

  if (
    location.length >= 3
  ) {

    score += 3;

  }


  // Keep score within 100
  score =
    Math.min(
      99,
      Math.max(
        50,
        score
      )
    );


  return {

    eventType:
      data.eventType,

    location:
      location,

    guests:
      guests,

    score:
      score,

    priority:
      priority,

    venueTypes:
      venueTypes,

    planningFocus:
      planningFocus,

    guestInsight:
      guestInsight,

    dateInsight:
      dateInsight

  };

}


// =====================================================
// SMART SEARCH RESULT UI
// =====================================================

function renderSmartSearchResult(
  profile
) {

  let box =
    document.getElementById(
      "smvSmartSearchResult"
    );


  if (!box) {

    box =
      document.createElement(
        "div"
      );

    box.id =
      "smvSmartSearchResult";

    box.className =
      "smv-smart-result";


    const hero =
      document.querySelector(
        ".hero"
      );


    if (
      hero &&
      hero.querySelector(".search-card")
    ) {

      hero
        .querySelector(".search-card")
        .insertAdjacentElement(
          "afterend",
          box
        );

    }

  }


  box.innerHTML = `

    <div class="smv-smart-header">

      <div>

        <span class="smv-smart-label">
          ✦ SMART DISCOVERY
        </span>

        <h3>
          Your event profile is ready
        </h3>

      </div>

      <div class="smv-score">
        <strong>${profile.score}%</strong>
        <span>Match readiness</span>
      </div>

    </div>


    <div class="smv-smart-grid">

      <div>
        <small>EVENT</small>
        <b>${escapeHTML(profile.eventType)}</b>
      </div>

      <div>
        <small>LOCATION</small>
        <b>${escapeHTML(profile.location)}</b>
      </div>

      <div>
        <small>GUESTS</small>
        <b>
          ${
            profile.guests
              ? profile.guests + " guests"
              : "To be confirmed"
          }
        </b>
      </div>

      <div>
        <small>PRIORITY</small>
        <b class="smv-priority">
          ${profile.priority.toUpperCase()}
        </b>
      </div>

    </div>


    <div class="smv-smart-insights">

      <div>
        <span>🎯</span>
        <strong>Suggested venues</strong>
        <p>
          ${profile.venueTypes
            .map(escapeHTML)
            .join(" • ")}
        </p>
      </div>

      <div>
        <span>👥</span>
        <strong>Capacity insight</strong>
        <p>
          ${escapeHTML(profile.guestInsight)}
        </p>
      </div>

      <div>
        <span>📅</span>
        <strong>Planning insight</strong>
        <p>
          ${escapeHTML(profile.dateInsight)}
        </p>
      </div>

    </div>


    <div class="smv-smart-focus">

      <span>AI-INSPIRED MATCHING FOCUS</span>

      <strong>
        ${escapeHTML(profile.planningFocus)}
      </strong>

    </div>

  `;


  box.classList.add(
    "visible"
  );

}


// =====================================================
// CUSTOMER ENQUIRY FORM
// =====================================================

function setupCustomerEnquiry() {

  const form =
    document.getElementById(
      "customerEnquiryForm"
    );


  if (!form) {

    console.error(
      "customerEnquiryForm not found."
    );

    return;

  }


  const submitButton =
    document.getElementById(
      "customerEnquirySubmit"
    );


  const message =
    document.getElementById(
      "customerEnquiryMessage"
    );


  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();
      event.stopPropagation();


      if (
        typeof event.stopImmediatePropagation ===
        "function"
      ) {

        event.stopImmediatePropagation();

      }


      if (
        submitButton &&
        submitButton.disabled
      ) {

        return;

      }


      clearInlineMessage(message);


      // =================================================
      // GET VALUES
      // =================================================

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
        WEBSITE_SOURCE;


      // =================================================
      // VALIDATION
      // =================================================

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
        normalizeIndianMobile(
          customerMobile
        );


      if (
        !cleanMobile
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


      if (
        customerEventDate &&
        isPastDate(customerEventDate)
      ) {

        showInlineMessage(
          message,
          "Please select today or a future event date.",
          "error"
        );

        focusField("customerEventDate");

        return;

      }


      if (
        customerGuests &&
        Number(customerGuests) < 1
      ) {

        showInlineMessage(
          message,
          "Please enter a valid guest count.",
          "error"
        );

        focusField("customerGuests");

        return;

      }


      if (
        customerBudget &&
        Number(customerBudget) < 0
      ) {

        showInlineMessage(
          message,
          "Please enter a valid budget per person.",
          "error"
        );

        focusField("customerBudget");

        return;

      }


      // =================================================
      // SMART PROFILE
      // =================================================

      const smartProfile =
        createSmartEventProfile({

          eventType:
            customerEventType,

          location:
            customerLocation,

          guests:
            customerGuests,

          eventDate:
            customerEventDate

        });


      // =================================================
      // GENERATE ENQUIRY REFERENCE
      // =================================================

      const enquiryReference =
        createEnquiryReference();


      // =================================================
      // BUILD SMART REQUIREMENTS
      // =================================================

      const requirements =
        buildFullRequirements({

          reference:
            enquiryReference,

          eventType:
            customerEventType,

          location:
            customerLocation,

          guests:
            customerGuests,

          eventDate:
            customerEventDate,

          budget:
            customerBudget,

          food:
            customerFood,

          other:
            customerRequirements,

          smartProfile:
            smartProfile

        });


      // =================================================
      // LOADING
      // =================================================

      setButtonLoading(
        submitButton,
        "Submitting..."
      );


      // =================================================
      // SUPABASE INSERT
      // =================================================

      try {

        if (!supabaseClient) {

          throw new Error(
            "Supabase client is not initialized."
          );

        }


        console.log(
          "Submitting smart customer enquiry..."
        );


        const payload = {

          customer_name:
            customerName,

          mobile:
            cleanMobile,

          email:
            customerEmail ||
            null,

          location:
            customerLocation,

          occasion:
            customerEventType,

          event_date:
            customerEventDate ||
            null,

          guests:
            customerGuests
              ? Number(customerGuests)
              : null,

          budget_per_person:
            customerBudget
              ? Number(customerBudget)
              : null,

          food_preference:
            customerFood ||
            null,

          requirements:
            requirements,

          source:
            leadSource,

          status:
            "new",

          priority:
            "normal",

          assigned_to:
            null,

          follow_up_at:
            null,

          internal_notes:
            null,

          last_contacted_at:
            null

        };


        console.log(
          "CRM payload prepared:",
          {
            ...payload,
            mobile: "***protected***"
          }
        );


        const result =
          await insertWithRetry(
            payload
          );


        if (
          result &&
          result.error
        ) {

          console.error(
            "SUPABASE DATABASE ERROR:",
            result.error
          );

          throw result.error;

        }


        // =================================================
        // SUCCESS
        // =================================================

        console.log(
          "✓ CUSTOMER ENQUIRY INSERT SUCCESS"
        );


        localStorage.setItem(
          LAST_ENQUIRY_KEY,
          enquiryReference
        );


        clearSavedDraft();


        form.reset();


        showSuccessWithReference(
          message,
          enquiryReference,
          {
            name:
              customerName,

            mobile:
              cleanMobile,

            eventType:
              customerEventType,

            location:
              customerLocation

          }
        );


        // =================================================
        // SCROLL TO CONFIRMATION
        // =================================================

        setTimeout(
          function () {

            if (message) {

              message.scrollIntoView({
                behavior: "smooth",
                block: "center"
              });

            }

          },
          150
        );


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


      } finally {

        restoreButton(
          submitButton,
          "Submit Enquiry →"
        );

      }

    },
    false
  );

}


// =====================================================
// SUPABASE INSERT WITH SAFE RETRY
// =====================================================

async function insertWithRetry(
  payload
) {

  let result =
    await supabaseClient
      .from("customer_enquiries")
      .insert(payload);


  if (
    result &&
    result.error &&
    isRetryableError(
      result.error
    )
  ) {

    console.warn(
      "Temporary submission error. Retrying once..."
    );


    await wait(700);


    result =
      await supabaseClient
        .from("customer_enquiries")
        .insert(payload);

  }


  return result;

}


// =====================================================
// RETRYABLE ERROR
// =====================================================

function isRetryableError(error) {

  if (!error) {
    return false;
  }


  const text =
    (
      String(error.message || "") +
      " " +
      String(error.details || "")
    ).toLowerCase();


  return (
    text.includes("network") ||
    text.includes("failed to fetch") ||
    text.includes("fetch") ||
    text.includes("timeout") ||
    text.includes("temporarily")
  );

}


// =====================================================
// SMART REQUIREMENTS BUILDER
// =====================================================

function buildFullRequirements(details) {

  const lines = [];


  if (details.reference) {

    lines.push(
      "Enquiry Reference: " +
      details.reference
    );

  }


  lines.push(
    "--------------------------------"
  );


  if (details.eventType) {

    lines.push(
      "Event: " +
      details.eventType
    );

  }


  if (details.location) {

    lines.push(
      "Location: " +
      details.location
    );

  }


  if (details.guests) {

    lines.push(
      "Guests: " +
      details.guests
    );

  }


  if (details.eventDate) {

    lines.push(
      "Event Date: " +
      details.eventDate
    );

  }


  if (details.budget) {

    lines.push(
      "Budget / Person: ₹" +
      details.budget
    );

  }


  if (details.food) {

    lines.push(
      "Food Preference: " +
      details.food
    );

  }


  if (details.other) {

    lines.push(
      "Other Requirements: " +
      details.other
    );

  }


  // =================================================
  // SMART ANALYSIS
  // =================================================

  if (details.smartProfile) {

    const profile =
      details.smartProfile;


    lines.push(
      "",
      "SMART DISCOVERY PROFILE",
      "--------------------------------"
    );


    lines.push(
      "Match Readiness: " +
      profile.score +
      "%"
    );


    lines.push(
      "Suggested Venue Types: " +
      profile.venueTypes.join(", ")
    );


    lines.push(
      "Planning Focus: " +
      profile.planningFocus
    );


    lines.push(
      "Capacity Insight: " +
      profile.guestInsight
    );


    lines.push(
      "Date Insight: " +
      profile.dateInsight
    );


    lines.push(
      "Lead Priority Signal: " +
      profile.priority
    );

  }


  lines.push(
    "",
    "Source: Website"
  );


  return lines.join("\n");

}


// =====================================================
// LEGACY HERO REQUIREMENTS
// Kept for compatibility
// =====================================================

function buildRequirements(
  eventType,
  location,
  guests,
  eventDate
) {

  const details = [];


  details.push(
    "Event: " +
    eventType
  );


  details.push(
    "Location: " +
    location
  );


  if (guests) {

    details.push(
      "Guests: " +
      guests
    );

  }


  if (eventDate) {

    details.push(
      "Event Date: " +
      eventDate
    );

  }


  return details.join("\n");

}


// =====================================================
// GUEST RANGE CONVERSION
// =====================================================

function convertGuestRangeToNumber(value) {

  if (!value) {
    return null;
  }


  const text =
    String(value);


  if (
    text.includes("500+")
  ) {

    return 500;

  }


  const numbers =
    text.match(/\d+/g);


  if (
    !numbers ||
    !numbers.length
  ) {

    return null;

  }


  if (
    numbers.length >= 2
  ) {

    const first =
      Number(numbers[0]);

    const second =
      Number(numbers[1]);


    return Math.round(
      (first + second) / 2
    );

  }


  return Number(
    numbers[0]
  );

}


// =====================================================
// SMART DATE PROTECTION
// =====================================================

function setupDateProtection() {

  const dateFields = [
    "date",
    "customerEventDate"
  ];


  const today =
    getTodayISO();


  dateFields.forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (element) {

        element.min =
          today;

      }

    }
  );

}


// =====================================================
// SMART FIELD ENHANCEMENTS
// =====================================================

function setupSmartFieldEnhancements() {

  const mobile =
    document.getElementById(
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


  const budget =
    document.getElementById(
      "customerBudget"
    );


  if (budget) {

    budget.addEventListener(
      "input",
      function () {

        if (
          Number(this.value) < 0
        ) {

          this.value = "";

        }

      }
    );

  }


  const guests =
    document.getElementById(
      "customerGuests"
    );


  if (guests) {

    guests.addEventListener(
      "input",
      function () {

        if (
          Number(this.value) < 1
        ) {

          this.value = "";

        }

      }
    );

  }

}


// =====================================================
// DRAFT SAVING
// =====================================================

function setupDraftSaving() {

  const form =
    document.getElementById(
      "customerEnquiryForm"
    );


  if (!form) {
    return;
  }


  const fieldIds = [
    "customerName",
    "customerMobile",
    "customerEmail",
    "customerLocation",
    "customerEventType",
    "customerEventDate",
    "customerGuests",
    "customerBudget",
    "customerFood",
    "customerRequirements"
  ];


  fieldIds.forEach(
    function (id) {

      const field =
        document.getElementById(id);


      if (!field) {
        return;
      }


      field.addEventListener(
        "input",
        saveCurrentDraft
      );


      field.addEventListener(
        "change",
        saveCurrentDraft
      );

    }
  );

}


// =====================================================
// SAVE CURRENT DRAFT
// =====================================================

function saveCurrentDraft() {

  const form =
    document.getElementById(
      "customerEnquiryForm"
    );


  if (!form) {
    return;
  }


  const data = {};


  [
    "customerName",
    "customerMobile",
    "customerEmail",
    "customerLocation",
    "customerEventType",
    "customerEventDate",
    "customerGuests",
    "customerBudget",
    "customerFood",
    "customerRequirements"
  ].forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (element) {

        data[id] =
          element.value;

      }

    }
  );


  try {

    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify(data)
    );

  } catch (error) {

    console.warn(
      "Draft could not be saved:",
      error
    );

  }

}


// =====================================================
// SAVE DRAFT DATA
// =====================================================

function saveDraftData(data) {

  try {

    const existing =
      JSON.parse(
        localStorage.getItem(
          DRAFT_STORAGE_KEY
        ) ||
        "{}"
      );


    const merged = {
      ...existing,
      ...data
    };


    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify(merged)
    );

  } catch (error) {

    console.warn(
      "Smart draft save failed:",
      error
    );

  }

}


// =====================================================
// RESTORE DRAFT
// =====================================================

function restoreSavedDraft() {

  let data = null;


  try {

    data =
      JSON.parse(
        localStorage.getItem(
          DRAFT_STORAGE_KEY
        ) ||
        "null"
      );

  } catch (error) {

    console.warn(
      "Saved draft could not be read."
    );

    return;

  }


  if (!data) {
    return;
  }


  const hasUsefulData =
    Object.values(data)
      .some(
        function (value) {

          return (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
          );

        }
      );


  if (!hasUsefulData) {
    return;
  }


  let restored = false;


  Object.keys(data)
    .forEach(
      function (id) {

        const element =
          document.getElementById(id);


        if (
          element &&
          data[id] !== undefined &&
          data[id] !== null &&
          String(data[id]).trim() !== ""
        ) {

          element.value =
            data[id];

          restored = true;

        }

      }
    );


  if (!restored) {
    return;
  }


  createDraftNotice();

}


// =====================================================
// DRAFT NOTICE
// =====================================================

function createDraftNotice() {

  if (
    document.getElementById(
      "smvDraftNotice"
    )
  ) {

    return;

  }


  const form =
    document.getElementById(
      "customerEnquiryForm"
    );


  if (!form) {
    return;
  }


  const notice =
    document.createElement(
      "div"
    );


  notice.id =
    "smvDraftNotice";

  notice.className =
    "smv-draft-notice";


  notice.innerHTML = `

    <span>
      ✦ Your previous enquiry details have been restored.
    </span>

    <button type="button" id="smvClearDraft">
      Clear
    </button>

  `;


  form.insertBefore(
    notice,
    form.firstChild
  );


  const clearButton =
    document.getElementById(
      "smvClearDraft"
    );


  if (clearButton) {

    clearButton.addEventListener(
      "click",
      function () {

        clearSavedDraft();

        form.reset();

        notice.remove();

      }
    );

  }

}


// =====================================================
// CLEAR DRAFT
// =====================================================

function clearSavedDraft() {

  try {

    localStorage.removeItem(
      DRAFT_STORAGE_KEY
    );

  } catch (error) {

    console.warn(
      "Could not clear draft."
    );

  }

}


// =====================================================
// SUCCESS MESSAGE + WHATSAPP
// =====================================================

function showSuccessWithReference(
  element,
  reference,
  customer
) {

  if (!element) {
    return;
  }


  const encodedMessage =
    encodeURIComponent(
      [
        "Hello Select My Venue,",
        "",
        "I have submitted a venue enquiry.",
        "",
        "Reference: " + reference,
        "Event: " + customer.eventType,
        "Location: " + customer.location,
        "",
        "Please help me with suitable venue options."
      ].join("\n")
    );


  element.innerHTML = `

    <div class="smv-success-box">

      <div class="smv-success-icon">
        ✓
      </div>

      <div class="smv-success-content">

        <strong>
          Enquiry submitted successfully!
        </strong>

        <span>
          Thank you, ${escapeHTML(customer.name)}.
          Our team will contact you shortly.
        </span>

        <div class="smv-reference">
          Enquiry ID:
          <b>${escapeHTML(reference)}</b>
        </div>

        <div class="smv-success-actions">

          <a
            href="https://wa.me/919958716688?text=${encodedMessage}"
            target="_blank"
            rel="noopener"
            class="smv-whatsapp-btn"
          >
            WhatsApp Our Team →
          </a>

          <button
            type="button"
            class="smv-copy-btn"
            id="smvCopyReference"
          >
            Copy ID
          </button>

        </div>

      </div>

    </div>

  `;


  element.classList.remove(
    "success",
    "error"
  );


  element.classList.add(
    "success"
  );


  element.style.display =
    "block";


  const copyButton =
    document.getElementById(
      "smvCopyReference"
    );


  if (copyButton) {

    copyButton.addEventListener(
      "click",
      async function () {

        try {

          await navigator.clipboard.writeText(
            reference
          );


          copyButton.textContent =
            "Copied ✓";


          setTimeout(
            function () {

              copyButton.textContent =
                "Copy ID";

            },
            1800
          );

        } catch (error) {

          console.warn(
            "Clipboard unavailable."
          );

        }

      }
    );

  }

}


// =====================================================
// ENQUIRY REFERENCE
// =====================================================

function createEnquiryReference() {

  const now =
    new Date();


  const datePart =
    [
      now.getFullYear(),
      String(
        now.getMonth() + 1
      ).padStart(2, "0"),
      String(
        now.getDate()
      ).padStart(2, "0")
    ].join("");


  const randomPart =
    Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();


  return (
    "SMV-" +
    datePart +
    "-" +
    randomPart
  );

}


// =====================================================
// NAVIGATION HELPERS
// =====================================================

function setupNavigationHelpers() {

  document
    .querySelectorAll(
      'a[href="#enquiry"]'
    )
    .forEach(
      function (link) {

        link.addEventListener(
          "click",
          function () {

            setTimeout(
              function () {

                const firstField =
                  document.getElementById(
                    "customerName"
                  );


                if (firstField) {

                  firstField.focus();

                }

              },
              500
            );

          }
        );

      }
    );

}


// =====================================================
// LOCATION NORMALIZATION
// =====================================================

function normalizeLocation(
  location
) {

  const value =
    String(
      location || ""
    ).trim();


  if (!value) {
    return "";
  }


  return value
    .replace(/\s+/g, " ")
    .replace(
      /\b(gurgaon)\b/gi,
      "Gurgaon"
    )
    .replace(
      /\b(gurugram)\b/gi,
      "Gurugram"
    )
    .replace(
      /\b(delhi ncr)\b/gi,
      "Delhi NCR"
    )
    .trim();

}


// =====================================================
// INDIAN MOBILE NORMALIZATION
// =====================================================

function normalizeIndianMobile(
  value
) {

  let mobile =
    String(
      value || ""
    )
    .replace(
      /\D/g,
      ""
    );


  if (
    mobile.startsWith("91") &&
    mobile.length === 12
  ) {

    mobile =
      mobile.substring(2);

  }


  if (
    mobile.length !== 10
  ) {

    return "";

  }


  if (
    !/^[6-9][0-9]{9}$/.test(
      mobile
    )
  ) {

    return "";

  }


  return mobile;

}


// =====================================================
// DATE HELPERS
// =====================================================

function getTodayISO() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}


function isPastDate(
  dateString
) {

  if (!dateString) {
    return false;
  }


  return (
    dateString <
    getTodayISO()
  );

}


function daysUntil(
  dateString
) {

  if (!dateString) {
    return 9999;
  }


  const target =
    new Date(
      dateString +
      "T00:00:00"
    );


  const today =
    new Date(
      getTodayISO() +
      "T00:00:00"
    );


  const difference =
    target.getTime() -
    today.getTime();


  return Math.ceil(
    difference /
    86400000
  );

}


// =====================================================
// VALUE HELPERS
// =====================================================

function getValue(id) {

  const element =
    document.getElementById(id);


  if (!element) {
    return "";
  }


  return String(
    element.value || ""
  ).trim();

}


function setElementValue(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (
    element &&
    value !== undefined &&
    value !== null
  ) {

    element.value =
      value;

  }

}


// =====================================================
// FOCUS FIELD
// =====================================================

function focusField(id) {

  const element =
    document.getElementById(id);


  if (element) {

    setTimeout(
      function () {

        element.focus();

      },
      50
    );

  }

}


// =====================================================
// EMAIL VALIDATION
// =====================================================

function isValidEmail(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


// =====================================================
// BUTTON LOADING
// =====================================================

function setButtonLoading(
  button,
  text
) {

  if (!button) {
    return;
  }


  button.disabled =
    true;


  button.dataset.oldText =
    button.textContent;


  button.textContent =
    text;


  button.setAttribute(
    "aria-busy",
    "true"
  );

}


// =====================================================
// RESTORE BUTTON
// =====================================================

function restoreButton(
  button,
  fallbackText
) {

  if (!button) {
    return;
  }


  button.disabled =
    false;


  button.textContent =
    button.dataset.oldText ||
    fallbackText;


  delete button.dataset.oldText;


  button.removeAttribute(
    "aria-busy"
  );

}


// =====================================================
// INLINE FORM MESSAGE
// =====================================================

function showInlineMessage(
  element,
  text,
  type
) {

  if (!element) {

    console.warn(
      "Message element not found:",
      text
    );

    return;

  }


  element.textContent =
    text;


  element.classList.remove(
    "success",
    "error"
  );


  element.classList.add(
    type === "success"
      ? "success"
      : "error"
  );


  element.style.display =
    "block";


  element.style.opacity =
    "1";


  element.style.visibility =
    "visible";


  element.style.padding =
    "14px 18px";


  element.style.marginTop =
    "14px";


  element.style.borderRadius =
    "12px";


  element.style.fontWeight =
    "600";


  element.style.lineHeight =
    "1.5";


  if (
    type === "success"
  ) {

    element.style.background =
      "#e9fff2";

    element.style.color =
      "#15803d";

    element.style.border =
      "1px solid #bbf7d0";

  } else {

    element.style.background =
      "#fff1f2";

    element.style.color =
      "#b42318";

    element.style.border =
      "1px solid #fecdd3";

  }

}


// =====================================================
// CLEAR MESSAGE
// =====================================================

function clearInlineMessage(
  element
) {

  if (!element) {
    return;
  }


  element.textContent =
    "";


  element.classList.remove(
    "success",
    "error"
  );


  element.style.display =
    "none";

}


// =====================================================
// WAIT
// =====================================================

function wait(
  milliseconds
) {

  return new Promise(
    function (resolve) {

      setTimeout(
        resolve,
        milliseconds
      );

    }
  );

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(
  value
) {

  return String(
    value || ""
  )
  .replace(
    /&/g,
    "&amp;"
  )
  .replace(
    /</g,
    "&lt;"
  )
  .replace(
    />/g,
    "&gt;"
  )
  .replace(
    /"/g,
    "&quot;"
  )
  .replace(
    /'/g,
    "&#039;"
  );

}


// =====================================================
// SMART UI STYLES
//
// These styles are injected by JS so NO HTML changes
// are required for the new smart panel.
// =====================================================

function injectSmartStyles() {

  if (
    document.getElementById(
      "smvSmartEngineStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "smvSmartEngineStyles";


  style.textContent = `

    /* -----------------------------------------------
       SMART SEARCH RESULT
    ----------------------------------------------- */

    .smv-smart-result{

      display:none;

      max-width:1160px;

      margin:12px auto 0;

      padding:18px;

      border:1px solid rgba(17,224,207,.28);

      border-radius:16px;

      background:
        linear-gradient(
          145deg,
          rgba(4,29,29,.94),
          rgba(2,15,15,.96)
        );

      box-shadow:
        0 15px 45px rgba(0,0,0,.24),
        inset 0 0 40px rgba(0,220,205,.025);

    }


    .smv-smart-result.visible{

      display:block;

      animation:
        smvSmartAppear .35s ease;

    }


    @keyframes smvSmartAppear{

      from{

        opacity:0;

        transform:
          translateY(-8px);

      }

      to{

        opacity:1;

        transform:
          translateY(0);

      }

    }


    .smv-smart-header{

      display:flex;

      align-items:center;

      justify-content:space-between;

      gap:20px;

      margin-bottom:15px;

    }


    .smv-smart-label{

      display:block;

      color:#11e0cf;

      font-size:9px;

      font-weight:900;

      letter-spacing:1.2px;

      margin-bottom:4px;

    }


    .smv-smart-header h3{

      color:#f5fbfa;

      font-size:20px;

      margin:0;

    }


    .smv-score{

      min-width:88px;

      text-align:center;

      padding:9px 12px;

      border:

        1px solid

        rgba(17,224,207,.24);

      border-radius:12px;

      background:

        rgba(0,220,205,.06);

    }


    .smv-score strong{

      display:block;

      color:#11e0cf;

      font-size:21px;

      line-height:1;

    }


    .smv-score span{

      display:block;

      color:#73918f;

      font-size:8px;

      margin-top:4px;

    }


    .smv-smart-grid{

      display:grid;

      grid-template-columns:
        repeat(4,1fr);

      gap:8px;

    }


    .smv-smart-grid > div{

      padding:10px;

      border:

        1px solid

        rgba(17,224,207,.10);

      border-radius:9px;

      background:

        rgba(0,20,20,.5);

    }


    .smv-smart-grid small{

      display:block;

      color:#63817f;

      font-size:8px;

      font-weight:800;

      letter-spacing:.7px;

      margin-bottom:3px;

    }


    .smv-smart-grid b{

      display:block;

      color:#e9f7f6;

      font-size:11px;

    }


    .smv-priority{

      color:#ffc928!important;

    }


    .smv-smart-insights{

      display:grid;

      grid-template-columns:
        repeat(3,1fr);

      gap:8px;

      margin-top:8px;

    }


    .smv-smart-insights > div{

      padding:11px;

      border-radius:9px;

      background:

        rgba(4,26,26,.65);

      border:

        1px solid

        rgba(17,224,207,.08);

    }


    .smv-smart-insights span{

      display:block;

      font-size:17px;

      margin-bottom:5px;

    }


    .smv-smart-insights strong{

      display:block;

      color:#cfe8e6;

      font-size:10px;

    }


    .smv-smart-insights p{

      color:#75918f;

      font-size:9px;

      margin-top:3px;

      line-height:1.4;

    }


    .smv-smart-focus{

      display:flex;

      align-items:center;

      justify-content:space-between;

      gap:15px;

      margin-top:8px;

      padding:10px 12px;

      border-radius:9px;

      background:

        linear-gradient(
          90deg,
          rgba(17,224,207,.08),
          rgba(17,224,207,.025)
        );

      border-left:
        2px solid #11e0cf;

    }


    .smv-smart-focus span{

      color:#5e7c7a;

      font-size:8px;

      font-weight:900;

      letter-spacing:.8px;

    }


    .smv-smart-focus strong{

      color:#cfeceb;

      font-size:9px;

      text-align:right;

    }


    /* -----------------------------------------------
       SUCCESS
    ----------------------------------------------- */

    .smv-success-box{

      display:flex;

      align-items:flex-start;

      gap:13px;

    }


    .smv-success-icon{

      width:34px;

      height:34px;

      flex:none;

      border-radius:50%;

      display:grid;

      place-items:center;

      background:#bbf7d0;

      color:#15803d;

      font-weight:900;

    }


    .smv-success-content{

      display:flex;

      flex-direction:column;

      gap:4px;

    }


    .smv-success-content > strong{

      color:#15803d;

      font-size:15px;

    }


    .smv-success-content > span{

      color:#3f6f53;

      font-size:12px;

    }


    .smv-reference{

      margin-top:4px;

      color:#4d765c;

      font-size:11px;

    }


    .smv-reference b{

      color:#15803d;

      letter-spacing:.5px;

    }


    .smv-success-actions{

      display:flex;

      flex-wrap:wrap;

      gap:7px;

      margin-top:8px;

    }


    .smv-whatsapp-btn,
    .smv-copy-btn{

      border-radius:8px;

      padding:8px 11px;

      font-size:10px;

      font-weight:800;

      cursor:pointer;

      text-decoration:none;

    }


    .smv-whatsapp-btn{

      background:#15803d;

      color:#fff;

    }


    .smv-copy-btn{

      border:
        1px solid

        rgba(21,128,61,.35);

      background:#fff;

      color:#15803d;

    }


    /* -----------------------------------------------
       DRAFT
    ----------------------------------------------- */

    .smv-draft-notice{

      display:flex;

      align-items:center;

      justify-content:space-between;

      gap:10px;

      padding:9px 11px;

      margin-bottom:12px;

      border:

        1px solid

        rgba(17,224,207,.15);

      border-radius:9px;

      background:

        rgba(17,224,207,.045);

      color:#83aaa8;

      font-size:9px;

    }


    .smv-draft-notice button{

      border:

        1px solid

        rgba(17,224,207,.25);

      border-radius:6px;

      background:transparent;

      color:#11e0cf;

      padding:4px 8px;

      cursor:pointer;

      font-size:9px;

    }


    /* -----------------------------------------------
       MOBILE
    ----------------------------------------------- */

    @media(max-width:700px){

      .smv-smart-result{

        margin-left:14px;

        margin-right:14px;

        padding:13px;

      }


      .smv-smart-header{

        align-items:flex-start;

      }


      .smv-smart-header h3{

        font-size:17px;

      }


      .smv-smart-grid{

        grid-template-columns:
          repeat(2,1fr);

      }


      .smv-smart-insights{

        grid-template-columns:1fr;

      }


      .smv-smart-focus{

        display:block;

      }


      .smv-smart-focus strong{

        display:block;

        text-align:left;

        margin-top:4px;

      }

    }


    @media(max-width:430px){

      .smv-smart-grid{

        grid-template-columns:1fr;

      }


      .smv-smart-header{

        flex-direction:column;

      }


      .smv-score{

        width:100%;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}


// =====================================================
// GLOBAL JAVASCRIPT ERROR LOG
// =====================================================

window.addEventListener(
  "error",
  function (event) {

    console.error(
      "WEBSITE ERROR:",
      event.error ||
      event.message
    );

  }
);


// =====================================================
// PROMISE ERROR LOG
// =====================================================

window.addEventListener(
  "unhandledrejection",
  function (event) {

    console.error(
      "UNHANDLED PROMISE ERROR:",
      event.reason
    );

  }
);


// =====================================================
// FRIENDLY SUPABASE ERROR
// =====================================================

function getFriendlySupabaseError(
  error
) {

  if (!error) {

    return (
      "Something went wrong. Please try again."
    );

  }


  console.error(
    "FULL SUPABASE ERROR:",
    {
      message:
        error.message,

      details:
        error.details,

      hint:
        error.hint,

      code:
        error.code
    }
  );


  const errorMessage =
    String(
      error.message ||
      ""
    ).toLowerCase();


  const errorDetails =
    String(
      error.details ||
      ""
    ).toLowerCase();


  const errorHint =
    String(
      error.hint ||
      ""
    ).toLowerCase();


  const combined =
    errorMessage +
    " " +
    errorDetails +
    " " +
    errorHint;


  // -------------------------------------------------
  // RLS / PERMISSION
  // -------------------------------------------------

  if (
    combined.includes(
      "row-level security"
    ) ||
    combined.includes(
      "rls"
    ) ||
    combined.includes(
      "permission denied"
    ) ||
    combined.includes(
      "not allowed"
    ) ||
    combined.includes(
      "violates row-level"
    )
  ) {

    return (
      "The enquiry could not be submitted because the website database permission needs attention. Please try again shortly."
    );

  }


  // -------------------------------------------------
  // CONSTRAINT
  // -------------------------------------------------

  if (
    combined.includes(
      "check constraint"
    ) ||
    combined.includes(
      "violates check constraint"
    )
  ) {

    return (
      "The enquiry contains a database validation issue. Please check the entered details and try again."
    );

  }


  // -------------------------------------------------
  // NOT NULL
  // -------------------------------------------------

  if (
    combined.includes(
      "not-null"
    ) ||
    combined.includes(
      "null value in column"
    )
  ) {

    return (
      "A required enquiry field is missing. Please complete the required fields and try again."
    );

  }


  // -------------------------------------------------
  // NETWORK
  // -------------------------------------------------

  if (
    combined.includes(
      "network"
    ) ||
    combined.includes(
      "failed to fetch"
    ) ||
    combined.includes(
      "fetch"
    ) ||
    combined.includes(
      "timeout"
    )
  ) {

    return (
      "Please check your internet connection and try again."
    );

  }


  return (
    "We could not submit your enquiry right now. Please try again."
  );

}


// =====================================================
// STARTUP LOG
// =====================================================

console.log(
  "========================================"
);

console.log(
  "SELECT MY VENUE"
);

console.log(
  "Smart Event Discovery Engine"
);

console.log(
  "Website → Supabase → CRM"
);

console.log(
  "========================================"
);

console.log(
  "Smart search: ACTIVE"
);

console.log(
  "AI-style requirement analysis: ACTIVE"
);

console.log(
  "Draft protection: ACTIVE"
);

console.log(
  "Enquiry reference IDs: ACTIVE"
);

console.log(
  "WhatsApp follow-up: ACTIVE"
);

console.log(
  "Public SELECT request: DISABLED"
);

console.log(
  "========================================"
);


if (supabaseClient) {

  console.log(
    "Supabase client: READY ✓"
  );

} else {

  console.error(
    "Supabase client: NOT READY ✕"
  );

}
