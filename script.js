// =====================================================
// SELECT MY VENUE
// CUSTOMER WEBSITE
// Website → Supabase → CRM
// MOBILE-SAFE VERSION
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

function initializeSupabase() {

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

      console.log(
        "Supabase client initialized successfully."
      );

      return true;

    }

    console.error(
      "Supabase library is not available."
    );

    return false;

  } catch (error) {

    console.error(
      "Supabase initialization error:",
      error
    );

    return false;

  }

}


// =====================================================
// PAGE READY
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeSupabase();

    setupMobileMenu();

    setupHeroSearch();

    setupCustomerEnquiry();

    setupMobileFormProtection();

    console.log(
      "Select My Venue website ready."
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
// HERO SEARCH
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


      if (!eventType || !location) {

        showInlineMessage(
          message,
          "Please select an event type and enter your location.",
          "error"
        );

        return;

      }


      setButtonLoading(
        submitButton,
        "Submitting..."
      );


      try {

        ensureSupabase();


        const requirements =
          buildRequirements(
            eventType,
            location,
            guests,
            eventDate
          );


        const { data, error } =
          await supabaseClient
            .from("customer_enquiries")
            .insert({

              customer_name:
                null,

              mobile:
                null,

              email:
                null,

              location:
                location,

              occasion:
                eventType,

              event_date:
                eventDate || null,

              guests:
                convertGuestRangeToNumber(
                  guests
                ),

              budget_per_person:
                null,

              food_preference:
                null,

              requirements:
                requirements,

              source:
                "Website",

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

            });


        if (error) {

          console.error(
            "Hero enquiry database error:",
            error
          );

          throw error;

        }


        searchForm.reset();


        showInlineMessage(
          message,
          "Enquiry submitted successfully! Our team will contact you shortly.",
          "success"
        );


      } catch (error) {

        console.error(
          "Hero enquiry error:",
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
          "Find Venues →"
        );

      }

    },
    false
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


  // ---------------------------------------------------
  // IMPORTANT MOBILE SAFETY
  // ---------------------------------------------------

  form.setAttribute(
    "novalidate",
    "novalidate"
  );


  // ---------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------

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


      clearInlineMessage(message);


      // -------------------------------------------------
      // GET VALUES
      // -------------------------------------------------

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


      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

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
          /\D/g,
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


      // -------------------------------------------------
      // PREVENT DOUBLE SUBMISSION
      // -------------------------------------------------

      if (
        form.dataset.submitting === "true"
      ) {

        return;

      }


      form.dataset.submitting =
        "true";


      setButtonLoading(
        submitButton,
        "Submitting..."
      );


      // -------------------------------------------------
      // BUILD REQUIREMENTS
      // -------------------------------------------------

      const requirements =
        buildFullRequirements({

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
            customerRequirements

        });


      // -------------------------------------------------
      // DATABASE INSERT
      // -------------------------------------------------

      try {

        ensureSupabase();


        console.log(
          "Submitting customer enquiry to Supabase..."
        );


        const enquiryPayload = {

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
          "Enquiry payload:",
          enquiryPayload
        );


        const { data, error } =
          await supabaseClient
            .from("customer_enquiries")
            .insert(enquiryPayload)
            .select();


        // -------------------------------------------------
        // DATABASE ERROR
        // -------------------------------------------------

        if (error) {

          console.error(
            "SUPABASE DATABASE ERROR:",
            error
          );

          throw error;

        }


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        console.log(
          "CUSTOMER ENQUIRY SUCCESS:",
          data
        );


        // Reset only AFTER successful insert
        form.reset();


        // Make sure hidden source remains Website
        const sourceField =
          document.getElementById(
            "leadSource"
          );

        if (sourceField) {

          sourceField.value =
            "Website";

        }


        showInlineMessage(
          message,
          "✓ Enquiry submitted successfully! Thank you for choosing Select My Venue. Our team will contact you shortly.",
          "success"
        );


        // Scroll only after successful submission
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

        form.dataset.submitting =
          "false";


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
// MOBILE FORM PROTECTION
// =====================================================

function setupMobileFormProtection() {

  const mobileInput =
    document.getElementById(
      "customerMobile"
    );


  if (!mobileInput) {
    return;
  }


  mobileInput.addEventListener(
    "input",
    function () {

      // Keep only numbers
      this.value =
        this.value
          .replace(/\D/g, "")
          .slice(0, 10);

    }
  );


  mobileInput.addEventListener(
    "keydown",
    function (event) {

      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
        "Home",
        "End"
      ];


      if (
        allowedKeys.includes(
          event.key
        )
      ) {

        return;

      }


      if (
        !/^[0-9]$/.test(
          event.key
        )
      ) {

        event.preventDefault();

      }

    }
  );

}


// =====================================================
// ENSURE SUPABASE
// =====================================================

function ensureSupabase() {

  if (!supabaseClient) {

    initializeSupabase();

  }


  if (!supabaseClient) {

    throw new Error(
      "Supabase client is not initialized. Please refresh the page and try again."
    );

  }

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


  if (
    !button.dataset.originalText
  ) {

    button.dataset.originalText =
      button.textContent;

  }


  button.disabled =
    true;

  button.setAttribute(
    "aria-busy",
    "true"
  );

  button.style.opacity =
    "0.7";

  button.style.pointerEvents =
    "none";

  button.textContent =
    text;

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

  button.removeAttribute(
    "aria-busy"
  );

  button.style.opacity =
    "";

  button.style.pointerEvents =
    "";


  button.textContent =
    button.dataset.originalText ||
    fallbackText;

}


// =====================================================
// GET VALUE
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


// =====================================================
// FOCUS FIELD
// =====================================================

function focusField(id) {

  const element =
    document.getElementById(id);


  if (!element) {
    return;
  }


  setTimeout(
    function () {

      try {

        element.focus({
          preventScroll: true
        });

      } catch (error) {

        element.focus();

      }

    },
    50
  );

}


// =====================================================
// EMAIL VALIDATION
// =====================================================

function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


// =====================================================
// BUILD FULL REQUIREMENTS
// =====================================================

function buildFullRequirements(details) {

  const lines = [];


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


  return lines.join("\n");

}


// =====================================================
// HERO REQUIREMENTS
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


  if (
    value.includes("500+")
  ) {

    return 500;

  }


  const numbers =
    value.match(/\d+/g);


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
      (
        first +
        second
      ) / 2
    );

  }


  return Number(
    numbers[0]
  );

}


// =====================================================
// FRIENDLY SUPABASE ERROR
// =====================================================

function getFriendlySupabaseError(error) {

  console.error(
    "Supabase error details:",
    error
  );


  if (!error) {

    return (
      "Something went wrong while submitting your enquiry. Please try again."
    );

  }


  const message =
    String(
      error.message ||
      error.error_description ||
      ""
    ).toLowerCase();


  if (
    message.includes("network") ||
    message.includes("fetch")
  ) {

    return (
      "Network connection issue. Please check your internet connection and try again."
    );

  }


  if (
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {

    return (
      "The enquiry service is temporarily unavailable. Please try again shortly."
    );

  }


  if (
    message.includes("status_check")
  ) {

    return (
      "The enquiry status configuration needs attention. Please contact support."
    );

  }


  return (
    "We could not submit your enquiry. Please check your details and try again."
  );

}


// =====================================================
// INLINE MESSAGE
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

function clearInlineMessage(element) {

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
// GLOBAL ERROR LOG
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
// UNHANDLED PROMISE LOG
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
// INITIAL CONSOLE CHECK
// =====================================================

console.log(
  "Select My Venue script loaded."
);

console.log(
  "Supabase library:",
  window.supabase
    ? "Available"
    : "NOT AVAILABLE"
);
