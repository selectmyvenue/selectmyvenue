// =====================================================
// SELECT MY VENUE
// CUSTOMER WEBSITE SCRIPT
// Website → Supabase → CRM
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
// CUSTOMER SEARCH FORM
// =====================================================

const searchForm =
  document.getElementById("searchForm");


if (searchForm) {

  searchForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

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
      // BASIC VALIDATION
      // -------------------------------------------------

      if (!eventType || !location) {

        alert(
          "Please select your event type and enter your location."
        );

        return;
      }


      // -------------------------------------------------
      // BUTTON STATE
      // -------------------------------------------------

      if (submitButton) {

        submitButton.disabled = true;

        submitButton.dataset.originalText =
          submitButton.textContent;

        submitButton.textContent =
          "Submitting...";

      }


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
                buildRequirements(
                  eventType,
                  location,
                  guests,
                  eventDate
                ),

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
            "SUPABASE ENQUIRY ERROR:",
            error
          );

          alert(
            "Sorry, your enquiry could not be submitted. Please try again."
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


        searchForm.reset();


        showSuccessMessage();


      } catch (error) {

        console.error(
          "CUSTOMER ENQUIRY EXCEPTION:",
          error
        );

        alert(
          "Something went wrong. Please try again."
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
// GUEST RANGE → NUMBER
// =====================================================

function convertGuestRangeToNumber(
  value
) {

  if (!value) {
    return null;
  }


  const numbers =
    value.match(/\d+/g);


  if (!numbers || !numbers.length) {

    if (
      value.includes("500+")
    ) {
      return 500;
    }

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


  return Number(numbers[0]);

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


  return details.join("\n");

}


// =====================================================
// SUCCESS MESSAGE
// =====================================================

function showSuccessMessage() {

  const message =
    document.createElement("div");


  message.innerHTML = `

    <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,0.55);
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:99999;
      padding:20px;
    ">

      <div style="
        width:min(460px,100%);
        background:#ffffff;
        border-radius:22px;
        padding:35px 28px;
        text-align:center;
        box-shadow:0 25px 80px rgba(0,0,0,0.25);
      ">

        <div style="
          width:60px;
          height:60px;
          margin:0 auto 18px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#e9fff3;
          color:#16a34a;
          font-size:30px;
          font-weight:700;
        ">
          ✓
        </div>

        <h2 style="
          margin:0 0 10px;
          font-size:25px;
        ">
          Enquiry Submitted
        </h2>

        <p style="
          margin:0 0 24px;
          color:#667085;
          line-height:1.6;
        ">
          Thank you! We have received your venue requirement.
          Our team will contact you shortly.
        </p>

        <button
          type="button"
          id="successCloseBtn"
          style="
            border:0;
            border-radius:12px;
            padding:13px 28px;
            background:#111827;
            color:white;
            font-size:15px;
            font-weight:600;
            cursor:pointer;
          "
        >
          Done
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    message
  );


  const closeButton =
    document.getElementById(
      "successCloseBtn"
    );


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      () => {

        message.remove();

      }
    );

  }

}


// =====================================================
// GENERAL ERROR PROTECTION
// =====================================================

window.addEventListener(
  "error",
  (event) => {

    console.error(
      "WEBSITE ERROR:",
      event.error || event.message
    );

  }
);
