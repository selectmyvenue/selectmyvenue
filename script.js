// =====================================================
// SELECT MY VENUE
// CUSTOMER WEBSITE SCRIPT
// Website → Supabase → CRM
// =====================================================


// =====================================================
// SUPABASE CONNECTION
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

  menuToggle.addEventListener(
    "click",
    () => {

      const isOpen =
        mainNav.classList.toggle("open");

      menuToggle.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );

    }
  );

}


document
  .querySelectorAll("#mainNav a")
  .forEach((link) => {

    link.addEventListener(
      "click",
      () => {

        if (mainNav) {
          mainNav.classList.remove("open");
        }

        if (menuToggle) {
          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );
        }

      }
    );

  });


// =====================================================
// TOP SEARCH FORM
// =====================================================

const searchForm =
  document.getElementById("searchForm");


if (searchForm) {

  searchForm.addEventListener(
    "submit",
    async (event) => {

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

        showNotification(
          "Requirement Required",
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


      // -------------------------------------------------
      // BUILD REQUIREMENTS
      // -------------------------------------------------

      const requirements =
        buildRequirements(
          eventType,
          location,
          guests,
          eventDate
        );


      // -------------------------------------------------
      // SAVE TOP SEARCH AS ENQUIRY
      // -------------------------------------------------

      try {

        const {
          data,
          error
        } =
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

            })
            .select();


        // -------------------------------------------------
        // ERROR
        // -------------------------------------------------

        if (error) {

          console.error(
            "TOP SEARCH SUPABASE ERROR:",
            error
          );


          showNotification(
            "Enquiry Could Not Be Submitted",
            "Something went wrong while saving your requirement. Please try again.",
            "error"
          );


          return;

        }


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        console.log(
          "TOP SEARCH ENQUIRY CREATED:",
          data
        );


        searchForm.reset();


        showNotification(
          "Enquiry Submitted Successfully!",
          "Thank you for choosing Select My Venue. Our team will contact you shortly.",
          "success"
        );


      } catch (error) {

        console.error(
          "TOP SEARCH EXCEPTION:",
          error
        );


        showNotification(
          "Something Went Wrong",
          "We could not submit your enquiry right now. Please try again.",
          "error"
        );


      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            submitButton.dataset.originalText ||
            "Find Venues →";

        }

      }

    }
  );

}


// =====================================================
// MAIN CUSTOMER ENQUIRY FORM
// Website → Supabase → CRM
// =====================================================

const customerEnquiryForm =
  document.getElementById(
    "customerEnquiryForm"
  );


if (customerEnquiryForm) {

  customerEnquiryForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();
      event.stopPropagation();


      // -------------------------------------------------
      // ELEMENTS
      // -------------------------------------------------

      const submitButton =
        document.getElementById(
          "customerEnquirySubmit"
        );


      const messageBox =
        document.getElementById(
          "customerEnquiryMessage"
        );


      // -------------------------------------------------
      // GET CUSTOMER DETAILS
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


      // -------------------------------------------------
      // GET EVENT DETAILS
      // -------------------------------------------------

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
          .getElementById(
            "customerRequirements"
          )
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

        showInlineEnquiryMessage(
          "Please complete all required fields.",
          "error"
        );

        return;

      }


      // -------------------------------------------------
      // MOBILE VALIDATION
      // -------------------------------------------------

      if (
        !/^[0-9]{10}$/.test(
          customerMobile
        )
      ) {

        showInlineEnquiryMessage(
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


      // -------------------------------------------------
      // BUILD REQUIREMENTS
      // -------------------------------------------------

      const requirementParts = [];


      if (customerRequirements) {

        requirementParts.push(
          `Other Requirements: ${customerRequirements}`
        );

      }


      if (customerFood) {

        requirementParts.push(
          `Food Preference: ${customerFood}`
        );

      }


      const requirements =
        requirementParts.length
          ? requirementParts.join("\n")
          : null;


      // -------------------------------------------------
      // SUPABASE INSERT
      // -------------------------------------------------

      try {

        const {
          data,
          error
        } =
          await supabaseClient
            .from("customer_enquiries")
            .insert({

              customer_name:
                customerName,

              mobile:
                customerMobile,

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
                  ? Number(
                      customerGuests
                    )
                  : null,

              budget_per_person:
                customerBudget
                  ? Number(
                      customerBudget
                    )
                  : null,

              food_preference:
                customerFood ||
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

            })
            .select();


        // -------------------------------------------------
        // SUPABASE ERROR
        // -------------------------------------------------

        if (error) {

          console.error(
            "CUSTOMER ENQUIRY SUPABASE ERROR:",
            error
          );


          showInlineEnquiryMessage(
            "We couldn't submit your enquiry. Please try again.",
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


        // Show confirmation BEFORE reset
        showInlineEnquiryMessage(
          "✓ Enquiry submitted successfully! Our team will contact you shortly.",
          "success"
        );


        // Reset form
        customerEnquiryForm.reset();


        // Put success message back after reset
        showInlineEnquiryMessage(
          "✓ Enquiry submitted successfully! Our team will contact you shortly.",
          "success"
        );


      } catch (error) {

        console.error(
          "CUSTOMER ENQUIRY EXCEPTION:",
          error
        );


        showInlineEnquiryMessage(
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
// INLINE ENQUIRY CONFIRMATION
// =====================================================

function showInlineEnquiryMessage(
  message,
  type = "success"
) {

  const messageBox =
    document.getElementById(
      "customerEnquiryMessage"
    );


  if (!messageBox) {
    return;
  }


  messageBox.textContent =
    message;


  if (type === "success") {

    messageBox.className =
      "form-message enquiry-success";

  } else {

    messageBox.className =
      "form-message enquiry-error";

  }


  // Make message visible
  messageBox.style.display =
    "block";


  // Keep message near enquiry form
  setTimeout(
    () => {

      messageBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });

    },
    100
  );

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


  if (
    value.includes("500+")
  ) {

    return 500;

  }


  const numbers =
    value.match(
      /\d+/g
    );


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
      Number(
        numbers[0]
      );


    const second =
      Number(
        numbers[1]
      );


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
// BUILD REQUIREMENTS
// =====================================================

function buildRequirements(
  eventType,
  location,
  guests,
  eventDate
) {

  const details = [];


  details.push(
    `Event: ${eventType}`
  );


  details.push(
    `Location: ${location}`
  );


  if (guests) {

    details.push(
      `Guests: ${guests}`
    );

  }


  if (eventDate) {

    details.push(
      `Event Date: ${eventDate}`
    );

  }


  return details.join(
    "\n"
  );

}


// =====================================================
// PREMIUM NOTIFICATION
// Used ONLY for top search form
// =====================================================

function showNotification(
  title,
  message,
  type = "success"
) {

  const oldNotification =
    document.getElementById(
      "smvNotification"
    );


  if (oldNotification) {

    oldNotification.remove();

  }


  const isSuccess =
    type === "success";


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "smvNotification";


  overlay.innerHTML = `

    <div class="smv-notification-overlay">

      <div
        class="smv-notification-card ${
          isSuccess
            ? "smv-notification-success"
            : "smv-notification-error"
        }"
      >

        <button
          type="button"
          class="smv-notification-close"
          id="smvNotificationClose"
          aria-label="Close"
        >
          ×
        </button>


        <div class="smv-notification-icon">
          ${
            isSuccess
              ? "✓"
              : "!"
          }
        </div>


        <div class="smv-notification-title">
          ${escapeNotificationText(title)}
        </div>


        <div class="smv-notification-message">
          ${escapeNotificationText(message)}
        </div>


        ${
          isSuccess
            ? `
              <div class="smv-notification-note">
                ✦ Select My Venue
              </div>
            `
            : ""
        }


        <button
          type="button"
          class="smv-notification-button"
          id="smvNotificationDone"
        >
          ${
            isSuccess
              ? "Done"
              : "Try Again"
          }
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    overlay
  );


  addNotificationStyles();


  // -------------------------------------------------
  // CLOSE
  // -------------------------------------------------

  const closeNotification =
    () => {

      const element =
        document.getElementById(
          "smvNotification"
        );


      if (element) {

        element.classList.add(
          "smv-notification-hide"
        );


        setTimeout(
          () => {

            element.remove();

          },
          250
        );

      }

    };


  const closeButton =
    document.getElementById(
      "smvNotificationClose"
    );


  const doneButton =
    document.getElementById(
      "smvNotificationDone"
    );


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeNotification
    );

  }


  if (doneButton) {

    doneButton.addEventListener(
      "click",
      closeNotification
    );

  }


  const notificationOverlay =
    overlay.querySelector(
      ".smv-notification-overlay"
    );


  if (notificationOverlay) {

    notificationOverlay.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          notificationOverlay
        ) {

          closeNotification();

        }

      }
    );

  }


  // -------------------------------------------------
  // ESC
  // -------------------------------------------------

  const escHandler =
    (event) => {

      if (
        event.key === "Escape"
      ) {

        closeNotification();

        document.removeEventListener(
          "keydown",
          escHandler
        );

      }

    };


  document.addEventListener(
    "keydown",
    escHandler
  );

}


// =====================================================
// ESCAPE NOTIFICATION TEXT
// =====================================================

function escapeNotificationText(
  value
) {

  return String(
    value ?? ""
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
// NOTIFICATION STYLES
// =====================================================

function addNotificationStyles() {

  if (
    document.getElementById(
      "smvNotificationStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "smvNotificationStyles";


  style.textContent = `

    .smv-notification-overlay {

      position: fixed;

      inset: 0;

      z-index: 999999;

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 20px;

      background:
        rgba(7, 10, 20, 0.72);

      backdrop-filter:
        blur(8px);

      animation:
        smvFadeIn
        0.2s ease;

    }


    .smv-notification-card {

      position: relative;

      width:
        min(460px, 100%);

      padding:
        38px 30px 30px;

      text-align:
        center;

      background:
        #ffffff;

      border-radius:
        24px;

      box-shadow:
        0 30px 100px
        rgba(0, 0, 0, 0.30);

      animation:
        smvScaleIn
        0.25s ease;

    }


    .smv-notification-close {

      position:
        absolute;

      top:
        12px;

      right:
        14px;

      width:
        34px;

      height:
        34px;

      border:
        0;

      border-radius:
        50%;

      background:
        #f2f4f7;

      color:
        #667085;

      font-size:
        25px;

      line-height:
        1;

      cursor:
        pointer;

    }


    .smv-notification-icon {

      width:
        72px;

      height:
        72px;

      margin:
        0 auto 20px;

      display:
        flex;

      align-items:
        center;

      justify-content:
        center;

      border-radius:
        50%;

      font-size:
        34px;

      font-weight:
        800;

    }


    .smv-notification-success
    .smv-notification-icon {

      background:
        #e9fff2;

      color:
        #16a34a;

      box-shadow:
        0 0 0 8px
        #f3fff7;

    }


    .smv-notification-error
    .smv-notification-icon {

      background:
        #fff0f0;

      color:
        #dc2626;

      box-shadow:
        0 0 0 8px
        #fff7f7;

    }


    .smv-notification-title {

      margin-bottom:
        12px;

      color:
        #101828;

      font-size:
        25px;

      line-height:
        1.25;

      font-weight:
        750;

    }


    .smv-notification-message {

      max-width:
        390px;

      margin:
        0 auto;

      color:
        #667085;

      font-size:
        15px;

      line-height:
        1.7;

    }


    .smv-notification-note {

      margin-top:
        18px;

      color:
        #667085;

      font-size:
        13px;

      font-weight:
        600;

    }


    .smv-notification-button {

      min-width:
        130px;

      margin-top:
        25px;

      padding:
        13px 24px;

      border:
        0;

      border-radius:
        12px;

      background:
        #111827;

      color:
        #ffffff;

      font-size:
        15px;

      font-weight:
        700;

      cursor:
        pointer;

      transition:
        transform
        0.15s ease,
        opacity
        0.15s ease;

    }


    .smv-notification-button:hover {

      transform:
        translateY(-1px);

      opacity:
        0.92;

    }


    .smv-notification-hide {

      animation:
        smvFadeOut
        0.25s ease
        forwards;

    }


    @keyframes smvFadeIn {

      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }

    }


    @keyframes smvFadeOut {

      from {
        opacity: 1;
      }

      to {
        opacity: 0;
      }

    }


    @keyframes smvScaleIn {

      from {

        opacity: 0;

        transform:
          scale(0.94)
          translateY(10px);

      }

      to {

        opacity: 1;

        transform:
          scale(1)
          translateY(0);

      }

    }


    @media (max-width: 520px) {

      .smv-notification-card {

        padding:
          35px 22px 25px;

        border-radius:
          20px;

      }


      .smv-notification-title {

        font-size:
          22px;

      }


      .smv-notification-message {

        font-size:
          14px;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}


// =====================================================
// GENERAL ERROR PROTECTION
// =====================================================

window.addEventListener(
  "error",
  (event) => {

    console.error(
      "WEBSITE ERROR:",
      event.error ||
      event.message
    );

  }
);
