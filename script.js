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

    console.log("Supabase client initialized.");

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
// PAGE READY
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    setupMobileMenu();

    setupHeroSearch();

    setupCustomerEnquiry();

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


      clearInlineMessage(message);


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

        if (!supabaseClient) {

          throw new Error(
            "Supabase client is not initialized."
          );

        }


        const requirements =
          buildRequirements(
            eventType,
            location,
            guests,
            eventDate
          );


        // =================================================
        // IMPORTANT:
        // DO NOT USE .select() HERE.
        //
        // Public website visitors have INSERT permission,
        // but SELECT is restricted to authenticated CRM users.
        // =================================================

        const { error } =
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
            "HERO SUPABASE ERROR:",
            error
          );

          throw error;

        }


        console.log(
          "Hero enquiry submitted successfully."
        );


        searchForm.reset();


        showInlineMessage(
          message,
          "✓ Enquiry submitted successfully! Our team will contact you shortly.",
          "success"
        );


      } catch (error) {

        console.error(
          "HERO FORM ERROR:",
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

    }
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

      // =================================================
      // STOP NORMAL HTML FORM SUBMISSION
      // =================================================

      event.preventDefault();
      event.stopPropagation();

      if (
        typeof event.stopImmediatePropagation ===
        "function"
      ) {

        event.stopImmediatePropagation();

      }


      // =================================================
      // PREVENT DOUBLE SUBMISSION
      // =================================================

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
        "Website";


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


      // Remove spaces, hyphens and brackets from phone.
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


      // =================================================
      // LOADING
      // =================================================

      setButtonLoading(
        submitButton,
        "Submitting..."
      );


      // =================================================
      // BUILD REQUIREMENTS
      // =================================================

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
          "Submitting customer enquiry..."
        );


        // =================================================
        // IMPORTANT MOBILE FIX
        //
        // NO .select()
        //
        // The anonymous website visitor only needs INSERT.
        // CRM authenticated users have SELECT access.
        // =================================================

        const { error } =
          await supabaseClient
            .from("customer_enquiries")
            .insert({

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

            });


        // =================================================
        // DATABASE ERROR
        // =================================================

        if (error) {

          console.error(
            "SUPABASE DATABASE ERROR:",
            error
          );

          throw error;

        }


        // =================================================
        // SUCCESS
        // =================================================

        console.log(
          "CUSTOMER ENQUIRY INSERT SUCCESS"
        );


        form.reset();


        showInlineMessage(
          message,
          "✓ Enquiry submitted successfully! Thank you for choosing Select My Venue. Our team will contact you shortly.",
          "success"
        );


        // =================================================
        // KEEP USER NEAR CONFIRMATION
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
      (first + second) / 2
    );

  }


  return Number(
    numbers[0]
  );

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


  button.disabled = true;


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


  button.disabled = false;


  button.textContent =
    button.dataset.oldText ||
    fallbackText;


  button.removeAttribute(
    "aria-busy"
  );

}


// =====================================================
// FRIENDLY SUPABASE ERROR
// =====================================================

function getFriendlySupabaseError(error) {

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


  const combined =
    errorMessage +
    " " +
    errorDetails;


  // -----------------------------------------------------
  // RLS / PERMISSION
  // -----------------------------------------------------

  if (
    combined.includes("row-level security") ||
    combined.includes("rls") ||
    combined.includes("permission denied") ||
    combined.includes("not allowed")
  ) {

    return (
      "We could not submit your enquiry right now. Please try again."
    );

  }


  // -----------------------------------------------------
  // CHECK CONSTRAINT
  // -----------------------------------------------------

  if (
    combined.includes("check constraint")
  ) {

    return (
      "There is a database validation issue. Please try again."
    );

  }


  // -----------------------------------------------------
  // NETWORK
  // -----------------------------------------------------

  if (
    combined.includes("network") ||
    combined.includes("failed to fetch") ||
    combined.includes("fetch")
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
// STARTUP LOG
// =====================================================

console.log(
  "========================================"
);

console.log(
  "Select My Venue website script loaded."
);

console.log(
  "Mobile-safe enquiry submission enabled."
);

console.log(
  "Public INSERT mode: ACTIVE"
);

console.log(
  "Public SELECT request: DISABLED"
);

console.log(
  "========================================"
);


if (supabaseClient) {

  console.log(
    "Supabase client: READY"
  );

} else {

  console.error(
    "Supabase client: NOT READY"
  );

}
