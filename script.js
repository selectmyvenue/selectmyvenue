// =====================================================
// SELECT MY VENUE
// CUSTOMER WEBSITE SCRIPT
// Website → Supabase → CRM
// =====================================================

// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
  "https://uajqwyoqbbswkfiwosyw.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


// =====================================================
// MOBILE MENU
// =====================================================

const menuToggle =
  document.getElementById("menuToggle");

const mainNav =
  document.getElementById("mainNav");

if (menuToggle && mainNav) {

  menuToggle.addEventListener("click", function () {

    const isOpen =
      mainNav.classList.toggle("open");

    menuToggle.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );

  });

}


// Close mobile menu after clicking a link

document
  .querySelectorAll("#mainNav a")
  .forEach(function (link) {

    link.addEventListener("click", function () {

      if (mainNav) {
        mainNav.classList.remove("open");
      }

      if (menuToggle) {
        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );
      }

    });

  });


// =====================================================
// CUSTOMER SEARCH FORM
// HERO FORM
// =====================================================

const searchForm =
  document.getElementById("searchForm");

if (searchForm) {

  searchForm.addEventListener(
    "submit",
    async function (event) {

      // VERY IMPORTANT
      // Prevent page jumping to top

      event.preventDefault();
      event.stopPropagation();

      const submitButton =
        searchForm.querySelector(
          'button[type="submit"]'
        );

      const eventType =
        document
          .getElementById("eventType")
          ?.value
          .trim();

      const location =
        document
          .getElementById("location")
          ?.value
          .trim();

      const guests =
        document
          .getElementById("guests")
          ?.value
          .trim();

      const eventDate =
        document
          .getElementById("date")
          ?.value
          .trim();


      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (!eventType || !location) {

        showFormMessage(
          "Please select an event type and enter your location.",
          "error"
        );

        return;
      }


      // -------------------------------------------------
      // BUTTON LOADING
      // -------------------------------------------------

      if (submitButton) {

        submitButton.disabled = true;

        submitButton.dataset.originalText =
          submitButton.textContent;

        submitButton.textContent =
          "Submitting...";

      }


      try {

        const requirements =
          buildRequirements(
            eventType,
            location,
            guests,
            eventDate
          );


        // -------------------------------------------------
        // SAVE TO SUPABASE
        // -------------------------------------------------

        const { data, error } =
          await supabaseClient
            .from("customer_enquiries")
            .insert({

              customer_name: null,

              mobile: null,

              email: null,

              location: location,

              occasion: eventType,

              event_date:
                eventDate || null,

              guests:
                convertGuestRangeToNumber(
                  guests
                ),

              budget_per_person: null,

              food_preference: null,

              requirements:
                requirements,

              source: "Website",

              status: "new",

              priority: "normal",

              assigned_to: null,

              follow_up_at: null,

              internal_notes: null,

              last_contacted_at: null

            })
            .select();


        if (error) {

          console.error(
            "SUPABASE SEARCH FORM ERROR:",
            error
          );

          showFormMessage(
            "Something went wrong while submitting your enquiry. Please try again.",
            "error"
          );

          return;
        }


        console.log(
          "SEARCH ENQUIRY CREATED:",
          data
        );


        // Reset only after successful submission

        searchForm.reset();


        showFormMessage(
          "Enquiry submitted successfully! Our team will contact you shortly.",
          "success"
        );


      } catch (error) {

        console.error(
          "SEARCH FORM ERROR:",
          error
        );

        showFormMessage(
          "Unable to submit your enquiry right now. Please try again.",
          "error"
        );


      } finally {

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.textContent =
            submitButton.dataset.originalText ||
            "Find Venues →";

        }

      }

    }
  );

}


// =====================================================
// FULL CUSTOMER ENQUIRY FORM
// MAIN FORM
// =====================================================

const customerEnquiryForm =
  document.getElementById(
    "customerEnquiryForm"
  );

const customerEnquiryMessage =
  document.getElementById(
    "customerEnquiryMessage"
  );


if (customerEnquiryForm) {

  customerEnquiryForm.addEventListener(
    "submit",
    async function (event) {

      // -------------------------------------------------
      // VERY IMPORTANT
      // STOP NORMAL FORM SUBMISSION
      // This prevents page jumping to top
      // -------------------------------------------------

      event.preventDefault();
      event.stopPropagation();


      const submitButton =
        document.getElementById(
          "customerEnquirySubmit"
        );


      // -------------------------------------------------
      // GET FORM VALUES
      // -------------------------------------------------

      const customerName =
        document
          .getElementById("customerName")
          ?.value
          .trim();

      const customerMobile =
        document
          .getElementById("customerMobile")
          ?.value
          .trim();

      const customerEmail =
        document
          .getElementById("customerEmail")
          ?.value
          .trim();

      const customerLocation =
        document
          .getElementById("customerLocation")
          ?.value
          .trim();

      const customerEventType =
        document
          .getElementById("customerEventType")
          ?.value
          .trim();

      const customerEventDate =
        document
          .getElementById("customerEventDate")
          ?.value
          .trim();

      const customerGuests =
        document
          .getElementById("customerGuests")
          ?.value
          .trim();

      const customerBudget =
        document
          .getElementById("customerBudget")
          ?.value
          .trim();

      const customerFood =
        document
          .getElementById("customerFood")
          ?.value
          .trim();

      const customerRequirements =
        document
          .getElementById("customerRequirements")
          ?.value
          .trim();


      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (
        !customerName ||
        !customerMobile ||
        !customerLocation ||
        !customerEventType
      ) {

        showCustomerMessage(
          "Please complete all required fields.",
          "error"
        );

        return;
      }


      // -------------------------------------------------
      // MOBILE VALIDATION
      // -------------------------------------------------

      const cleanMobile =
        customerMobile.replace(
          /\D/g,
          ""
        );


      if (cleanMobile.length !== 10) {

        showCustomerMessage(
          "Please enter a valid 10-digit mobile number.",
          "error"
        );

        return;
      }


      // -------------------------------------------------
      // BUTTON LOADING
      // -------------------------------------------------

      if (submitButton) {

        submitButton.disabled = true;

        submitButton.dataset.originalText =
          submitButton.textContent;

        submitButton.textContent =
          "Submitting...";

      }


      // Clear previous message

      showCustomerMessage(
        "",
        ""
      );


      try {

        // -------------------------------------------------
        // BUILD COMPLETE REQUIREMENTS
        // -------------------------------------------------

        const requirementLines = [];


        requirementLines.push(
          "Event: " +
          customerEventType
        );


        requirementLines.push(
          "Location: " +
          customerLocation
        );


        if (customerEventDate) {

          requirementLines.push(
            "Event Date: " +
            customerEventDate
          );

        }


        if (customerGuests) {

          requirementLines.push(
            "Guests: " +
            customerGuests
          );

        }


        if (customerBudget) {

          requirementLines.push(
            "Budget / Person: ₹" +
            customerBudget
          );

        }


        if (customerFood) {

          requirementLines.push(
            "Food Preference: " +
            customerFood
          );

        }


        if (customerRequirements) {

          requirementLines.push(
            "Other Requirements: " +
            customerRequirements
          );

        }


        const finalRequirements =
          requirementLines.join("\n");


        // -------------------------------------------------
        // INSERT INTO SUPABASE
        // -------------------------------------------------

        const { data, error } =
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
                finalRequirements,

              source:
                document
                  .getElementById("leadSource")
                  ?.value ||
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

            })
            .select();


        // -------------------------------------------------
        // SUPABASE ERROR
        // -------------------------------------------------

        if (error) {

          console.error(
            "SUPABASE CUSTOMER ENQUIRY ERROR:",
            error
          );


          showCustomerMessage(
            "Your enquiry could not be submitted. Please try again.",
            "error"
          );


          return;
        }


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        console.log(
          "CUSTOMER ENQUIRY CREATED:",
          data
        );


        // Reset form

        customerEnquiryForm.reset();


        // Show message BELOW form fields

        showCustomerMessage(
          "✓ Enquiry submitted successfully! Thank you for choosing Select My Venue. Our team will contact you shortly.",
          "success"
        );


        // Keep user around the form.
        // DO NOT scroll to top.

        if (customerEnquiryMessage) {

          customerEnquiryMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

        }


      } catch (error) {

        console.error(
          "CUSTOMER ENQUIRY EXCEPTION:",
          error
        );


        showCustomerMessage(
          "Something went wrong. Please try again.",
          "error"
        );


      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            submitButton.dataset.originalText ||
            "Submit Enquiry →";

        }

      }

    }
  );

}


// =====================================================
// CUSTOMER FORM MESSAGE
// =====================================================

function showCustomerMessage(
  message,
  type
) {

  const messageElement =
    document.getElementById(
      "customerEnquiryMessage"
    );


  if (!messageElement) {
    return;
  }


  messageElement.textContent =
    message;


  messageElement.className =
    "form-message";


  if (type === "success") {

    messageElement.classList.add(
      "success"
    );

  }


  if (type === "error") {

    messageElement.classList.add(
      "error"
    );

  }

}


// =====================================================
// HERO FORM MESSAGE
// =====================================================

function showFormMessage(
  message,
  type
) {

  let existing =
    document.getElementById(
      "heroFormMessage"
    );


  if (!existing) {

    existing =
      document.createElement("p");

    existing.id =
      "heroFormMessage";

    existing.className =
      "hero-form-message";

    const searchForm =
      document.getElementById(
        "searchForm"
      );

    if (searchForm) {

      searchForm.insertAdjacentElement(
        "afterend",
        existing
      );

    }

  }


  existing.textContent =
    message;


  existing.className =
    "hero-form-message " +
    (type || "");

}


// =====================================================
// GUEST RANGE → NUMBER
// =====================================================

function convertGuestRangeToNumber(
  value
) {

  if (!value) {
    return null;
  }


  if (value.includes("500+")) {
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


  if (numbers.length >= 2) {

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
// BUILD HERO REQUIREMENTS
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
// FORM MESSAGE STYLES
// =====================================================

(function addFormMessageStyles() {

  if (
    document.getElementById(
      "smvFormMessageStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement("style");


  style.id =
    "smvFormMessageStyles";


  style.textContent = `

    .form-message {

      width: 100%;

      margin: 14px 0 0;

      padding: 13px 16px;

      border-radius: 12px;

      font-size: 14px;

      line-height: 1.5;

      font-weight: 600;

      display: block;

    }


    .form-message:empty {

      display: none;

    }


    .form-message.success {

      background: #ecfdf3;

      border: 1px solid #a7f3d0;

      color: #047857;

    }


    .form-message.error {

      background: #fef2f2;

      border: 1px solid #fecaca;

      color: #b91c1c;

    }


    .hero-form-message {

      width: min(1100px, calc(100% - 40px));

      margin: 14px auto 0;

      padding: 12px 16px;

      border-radius: 12px;

      font-size: 14px;

      font-weight: 600;

      text-align: center;

    }


    .hero-form-message:empty {

      display: none;

    }


    .hero-form-message.success {

      background: #ecfdf3;

      color: #047857;

    }


    .hero-form-message.error {

      background: #fef2f2;

      color: #b91c1c;

    }


    .form-submit:disabled,
    .search-btn:disabled {

      opacity: 0.65;

      cursor: not-allowed;

    }

  `;


  document.head.appendChild(
    style
  );

})();


// =====================================================
// GENERAL ERROR PROTECTION
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
