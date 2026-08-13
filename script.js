// =====================================================
// SELECT MY VENUE
// AI EVENT PLANNER + CUSTOMER WEBSITE
// Website → Supabase → CRM
//
// VERSION: AI EVENT PLANNER V1
//
// IMPORTANT:
// - No new Supabase columns required.
// - Uses existing customer_enquiries table.
// - Public website uses INSERT only.
// - CRM continues to use authenticated SELECT.
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

    console.log(
      "Select My Venue: Supabase READY"
    );

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
// GLOBAL AI PLANNER STATE
// =====================================================

const SMV_AI_STORAGE_KEY =
  "smv_ai_event_plan_v1";

let currentAIPlan = null;


// =====================================================
// PAGE READY
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    setupMobileMenu();

    setupHeroSearch();

    setupCustomerEnquiry();

    setupAIEventPlanner();

    setupAIQuickActions();

    restoreSavedAIPlan();

    setupSmartFormEnhancements();

    setupScrollAnimations();

    console.log(
      "Select My Venue AI Event Planner initialized."
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
          "Please enter your event location.",
          "error"
        );

        focusField("location");

        return;

      }


      // -------------------------------------------------
      // BUILD AI PLAN
      // -------------------------------------------------

      const aiPlan =
        generateAIEventPlan({

          eventType:
            eventType,

          location:
            location,

          guests:
            guests,

          eventDate:
            eventDate,

          budget:
            "",

          food:
            ""

        });


      currentAIPlan =
        aiPlan;


      saveAIPlan(
        aiPlan
      );


      // -------------------------------------------------
      // SHOW AI PLAN
      // -------------------------------------------------

      showAIPlannerPanel(
        aiPlan
      );


      // -------------------------------------------------
      // SUBMIT LEAD
      // -------------------------------------------------

      setButtonLoading(
        submitButton,
        "Finding Matches..."
      );


      try {

        if (!supabaseClient) {

          throw new Error(
            "Supabase client is not initialized."
          );

        }


        const requirements =
          buildAIRequirements(
            aiPlan
          );


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
                eventDate ||
                null,

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
                "Website - AI Search",

              status:
                "new",

              priority:
                calculateLeadPriority(
                  aiPlan
                ),

              assigned_to:
                null,

              follow_up_at:
                null,

              internal_notes:
                "AI Planner Lead | Match Score: " +
                aiPlan.matchScore +
                "% | Intent: " +
                aiPlan.intent,

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
          "Hero AI enquiry submitted successfully."
        );


        searchForm.reset();


        showInlineMessage(
          message,
          "✓ Great! We've created your event plan. Our team will help you find suitable venues and options.",
          "success"
        );


        // Keep AI panel visible.
        scrollToAIPlanner();


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

    console.warn(
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


      clearInlineMessage(
        message
      );


      // -------------------------------------------------
      // VALUES
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

        focusField(
          "customerName"
        );

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

        focusField(
          "customerMobile"
        );

        return;

      }


      if (
        customerEmail &&
        !isValidEmail(
          customerEmail
        )
      ) {

        showInlineMessage(
          message,
          "Please enter a valid email address.",
          "error"
        );

        focusField(
          "customerEmail"
        );

        return;

      }


      if (!customerLocation) {

        showInlineMessage(
          message,
          "Please enter your city or location.",
          "error"
        );

        focusField(
          "customerLocation"
        );

        return;

      }


      if (!customerEventType) {

        showInlineMessage(
          message,
          "Please select your event type.",
          "error"
        );

        focusField(
          "customerEventType"
        );

        return;

      }


      // -------------------------------------------------
      // AI PLAN
      // -------------------------------------------------

      const aiPlan =
        generateAIEventPlan({

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


      currentAIPlan =
        aiPlan;


      saveAIPlan(
        aiPlan
      );


      // -------------------------------------------------
      // LOADING
      // -------------------------------------------------

      setButtonLoading(
        submitButton,
        "Creating Your Plan..."
      );


      try {

        if (!supabaseClient) {

          throw new Error(
            "Supabase client is not initialized."
          );

        }


        const requirements =
          buildFullAIRequirements({

            aiPlan:
              aiPlan,

            other:
              customerRequirements

          });


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
                leadSource,

              status:
                "new",

              priority:
                calculateLeadPriority(
                  aiPlan
                ),

              assigned_to:
                null,

              follow_up_at:
                null,

              internal_notes:
                "AI Planner Qualified Lead | Match Score: " +
                aiPlan.matchScore +
                "% | Intent: " +
                aiPlan.intent,

              last_contacted_at:
                null

            });


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
          "✓ Your event plan has been created successfully! Our team will contact you with suitable options.",
          "success"
        );


        showAIPlannerPanel(
          aiPlan
        );


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
          getFriendlySupabaseError(
            error
          ),
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
// AI EVENT PLANNER
// =====================================================

function setupAIEventPlanner() {

  injectAIPlannerStyles();

  injectAIPlannerContainer();

}


// =====================================================
// AI QUICK ACTIONS
// =====================================================

function setupAIQuickActions() {

  document.addEventListener(
    "click",
    function (event) {

      const target =
        event.target.closest(
          "[data-ai-action]"
        );


      if (!target) {
        return;
      }


      const action =
        target.dataset.aiAction;


      if (
        action ===
        "budget"
      ) {

        showBudgetEstimator();

      }


      if (
        action ===
        "checklist"
      ) {

        showAIPlannerPanel(
          currentAIPlan ||
          generateAIEventPlan({})
        );

      }


      if (
        action ===
        "save"
      ) {

        if (currentAIPlan) {

          saveAIPlan(
            currentAIPlan
          );

          showAIToast(
            "✓ Your event plan has been saved."
          );

        }

      }


      if (
        action ===
        "clear"
      ) {

        clearSavedAIPlan();

      }

    }
  );

}


// =====================================================
// GENERATE AI EVENT PLAN
// =====================================================

function generateAIEventPlan(
  data
) {

  const eventType =
    normalizeEventType(
      data.eventType ||
      "Event"
    );


  const location =
    data.location ||
    "Your City";


  const guests =
    parseGuestNumber(
      data.guests
    );


  const budget =
    parseBudget(
      data.budget
    );


  const eventDate =
    data.eventDate ||
    "";


  const food =
    data.food ||
    "";


  const category =
    getEventCategory(
      eventType
    );


  const venueTypes =
    getVenueRecommendations(
      category,
      guests
    );


  const theme =
    getThemeRecommendations(
      category
    );


  const foodRecommendations =
    getFoodRecommendations(
      category,
      food
    );


  const vendorRecommendations =
    getVendorRecommendations(
      category
    );


  const checklist =
    getEventChecklist(
      category
    );


  const timeline =
    getPlanningTimeline(
      eventDate,
      category
    );


  const budgetPlan =
    calculateSmartBudget(
      category,
      guests,
      budget
    );


  const matchScore =
    calculateMatchScore({

      eventType:
        eventType,

      location:
        location,

      guests:
        guests,

      date:
        eventDate,

      budget:
        budget

    });


  const intent =
    calculateLeadIntent({

      eventType:
        eventType,

      location:
        location,

      guests:
        guests,

      date:
        eventDate,

      budget:
        budget

    });


  return {

    eventType:
      eventType,

    category:
      category,

    location:
      location,

    guests:
      guests,

    eventDate:
      eventDate,

    budget:
      budget,

    food:
      food,

    matchScore:
      matchScore,

    intent:
      intent,

    venueTypes:
      venueTypes,

    theme:
      theme,

    foodRecommendations:
      foodRecommendations,

    vendorRecommendations:
      vendorRecommendations,

    checklist:
      checklist,

    timeline:
      timeline,

    budgetPlan:
      budgetPlan,

    generatedAt:
      new Date().toISOString()

  };

}


// =====================================================
// EVENT CATEGORY
// =====================================================

function getEventCategory(
  eventType
) {

  const value =
    String(
      eventType ||
      ""
    ).toLowerCase();


  if (
    value.includes("wedding") ||
    value.includes("marriage") ||
    value.includes("shaadi")
  ) {

    return "wedding";

  }


  if (
    value.includes("birthday")
  ) {

    return "birthday";

  }


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


  if (
    value.includes("anniversary")
  ) {

    return "anniversary";

  }


  if (
    value.includes("baby") ||
    value.includes("shower")
  ) {

    return "baby";

  }


  if (
    value.includes("party") ||
    value.includes("celebration")
  ) {

    return "party";

  }


  if (
    value.includes("reception")
  ) {

    return "reception";

  }


  return "general";

}


// =====================================================
// NORMALIZE EVENT TYPE
// =====================================================

function normalizeEventType(
  value
) {

  const clean =
    String(
      value ||
      ""
    ).trim();


  if (!clean) {
    return "Event";
  }


  return clean;

}


// =====================================================
// VENUE RECOMMENDATIONS
// =====================================================

function getVenueRecommendations(
  category,
  guests
) {

  const large =
    guests >= 300;

  const medium =
    guests >= 100 &&
    guests < 300;


  if (
    category ===
    "wedding"
  ) {

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


  if (
    category ===
    "birthday"
  ) {

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


  if (
    category ===
    "corporate"
  ) {

    return [
      "Business Hotel",
      "Conference Hall",
      "Banquet Hall",
      "Convention Centre"
    ];

  }


  if (
    category ===
    "engagement"
  ) {

    return [
      "Banquet Hall",
      "Boutique Venue",
      "Hotel",
      "Lawn"
    ];

  }


  if (
    category ===
    "anniversary"
  ) {

    return [
      "Restaurant",
      "Boutique Hotel",
      "Private Dining",
      "Rooftop Venue"
    ];

  }


  return [
    "Banquet Hall",
    "Hotel",
    "Restaurant",
    "Lawn"
  ];

}


// =====================================================
// THEME RECOMMENDATIONS
// =====================================================

function getThemeRecommendations(
  category
) {

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

    general: [
      "Elegant Celebration",
      "Modern Luxury",
      "Classic Indian",
      "Minimal Premium"
    ]

  };


  return (
    themes[category] ||
    themes.general
  );

}


// =====================================================
// FOOD RECOMMENDATIONS
// =====================================================

function getFoodRecommendations(
  category,
  preference
) {

  if (preference) {

    return [
      preference,
      "Live Food Counters",
      "Welcome Drinks",
      "Dessert Station"
    ];

  }


  if (
    category ===
    "wedding"
  ) {

    return [
      "Multi-Cuisine Buffet",
      "Live Chaat Counter",
      "North Indian",
      "Dessert & Mithai Counter"
    ];

  }


  if (
    category ===
    "corporate"
  ) {

    return [
      "Executive Buffet",
      "Tea & Coffee",
      "Light Snacks",
      "Working Lunch"
    ];

  }


  if (
    category ===
    "birthday" ||
    category ===
    "party"
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


// =====================================================
// VENDOR RECOMMENDATIONS
// =====================================================

function getVendorRecommendations(
  category
) {

  if (
    category ===
    "wedding"
  ) {

    return [
      "Photographer & Videographer",
      "Decorator",
      "Caterer",
      "DJ / Live Music",
      "Makeup Artist",
      "Mehndi Artist",
      "Invitation Designer"
    ];

  }


  if (
    category ===
    "corporate"
  ) {

    return [
      "AV & Sound",
      "Event Decor",
      "Catering",
      "Photography",
      "Host / Anchor",
      "Event Production"
    ];

  }


  if (
    category ===
    "birthday" ||
    category ===
    "party"
  ) {

    return [
      "Decorator",
      "DJ / Music",
      "Photographer",
      "Cake",
      "Entertainment",
      "Catering"
    ];

  }


  return [
    "Decorator",
    "Caterer",
    "Photographer",
    "Entertainment"
  ];

}


// =====================================================
// EVENT CHECKLIST
// =====================================================

function getEventChecklist(
  category
) {

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


  if (
    category ===
    "wedding"
  ) {

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


  if (
    category ===
    "corporate"
  ) {

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


// =====================================================
// PLANNING TIMELINE
// =====================================================

function getPlanningTimeline(
  eventDate,
  category
) {

  if (!eventDate) {

    return [

      {
        period: "ASAP",
        task: "Confirm date, budget and guest count."
      },

      {
        period: "Next",
        task: "Shortlist and compare venues."
      },

      {
        period: "After venue",
        task: "Book major vendors."
      },

      {
        period: "Final week",
        task: "Confirm guests, vendors and schedule."
      }

    ];

  }


  const date =
    new Date(
      eventDate +
      "T00:00:00"
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return [];

  }


  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  const days =
    Math.ceil(
      (
        date -
        today
      ) /
      86400000
    );


  if (
    days <= 7
  ) {

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


  if (
    days <= 30
  ) {

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


  if (
    days <= 90
  ) {

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


// =====================================================
// SMART BUDGET
// =====================================================

function calculateSmartBudget(
  category,
  guests,
  suppliedBudget
) {

  const guestCount =
    guests ||
    100;


  const defaultPerGuest =
    getDefaultBudgetPerGuest(
      category
    );


  const totalDefault =
    guestCount *
    defaultPerGuest;


  if (
    suppliedBudget &&
    suppliedBudget > 0
  ) {

    const total =
      suppliedBudget *
      guestCount;


    return {

      perGuest:
        suppliedBudget,

      total:
        total,

      breakdown:
        getBudgetBreakdown(
          total,
          category
        )

    };

  }


  return {

    perGuest:
      defaultPerGuest,

    total:
      totalDefault,

    breakdown:
      getBudgetBreakdown(
        totalDefault,
        category
      )

  };

}


// =====================================================
// DEFAULT BUDGET
// =====================================================

function getDefaultBudgetPerGuest(
  category
) {

  if (
    category ===
    "wedding"
  ) {

    return 1800;

  }


  if (
    category ===
    "corporate"
  ) {

    return 1200;

  }


  if (
    category ===
    "birthday"
  ) {

    return 900;

  }


  if (
    category ===
    "engagement"
  ) {

    return 1400;

  }


  if (
    category ===
    "anniversary"
  ) {

    return 1100;

  }


  return 1000;

}


// =====================================================
// BUDGET BREAKDOWN
// =====================================================

function getBudgetBreakdown(
  total,
  category
) {

  const venue =
    Math.round(
      total * .35
    );

  const food =
    Math.round(
      total * .30
    );

  const decor =
    Math.round(
      total * .12
    );

  const photo =
    Math.round(
      total * .08
    );

  const entertainment =
    Math.round(
      total * .06
    );

  const buffer =
    total -
    venue -
    food -
    decor -
    photo -
    entertainment;


  return {

    venue:
      venue,

    food:
      food,

    decor:
      decor,

    photography:
      photo,

    entertainment:
      entertainment,

    buffer:
      buffer

  };

}


// =====================================================
// MATCH SCORE
// =====================================================

function calculateMatchScore(
  data
) {

  let score =
    55;


  if (
    data.eventType
  ) {

    score +=
      10;

  }


  if (
    data.location
  ) {

    score +=
      10;

  }


  if (
    data.guests
  ) {

    score +=
      8;

  }


  if (
    data.date
  ) {

    score +=
      10;

  }


  if (
    data.budget
  ) {

    score +=
      7;

  }


  return Math.min(
    99,
    Math.max(
      45,
      score
    )
  );

}


// =====================================================
// LEAD INTENT
// =====================================================

function calculateLeadIntent(
  data
) {

  let score =
    0;


  if (
    data.eventType
  ) {

    score +=
      20;

  }


  if (
    data.location
  ) {

    score +=
      20;

  }


  if (
    data.guests
  ) {

    score +=
      15;

  }


  if (
    data.date
  ) {

    score +=
      25;

  }


  if (
    data.budget
  ) {

    score +=
      20;

  }


  if (
    score >=
    85
  ) {

    return "HOT";

  }


  if (
    score >=
    60
  ) {

    return "WARM";

  }


  return "EARLY PLANNER";

}


// =====================================================
// LEAD PRIORITY
// =====================================================

function calculateLeadPriority(
  plan
) {

  if (
    plan.intent ===
    "HOT"
  ) {

    return "high";

  }


  if (
    plan.intent ===
    "WARM"
  ) {

    return "normal";

  }


  return "normal";

}


// =====================================================
// AI REQUIREMENTS
// =====================================================

function buildAIRequirements(
  plan
) {

  const lines = [];


  lines.push(
    "=== AI EVENT PLAN ==="
  );


  lines.push(
    "Event: " +
    plan.eventType
  );


  lines.push(
    "Category: " +
    plan.category
  );


  lines.push(
    "Location: " +
    plan.location
  );


  if (
    plan.guests
  ) {

    lines.push(
      "Guests: " +
      plan.guests
    );

  }


  if (
    plan.eventDate
  ) {

    lines.push(
      "Event Date: " +
      plan.eventDate
    );

  }


  lines.push(
    "AI Match Score: " +
    plan.matchScore +
    "%"
  );


  lines.push(
    "Lead Intent: " +
    plan.intent
  );


  lines.push(
    "Suggested Venues: " +
    plan.venueTypes.join(
      ", "
    )
  );


  lines.push(
    "Suggested Themes: " +
    plan.theme.join(
      ", "
    )
  );


  lines.push(
    "Food Ideas: " +
    plan.foodRecommendations.join(
      ", "
    )
  );


  lines.push(
    "Recommended Vendors: " +
    plan.vendorRecommendations.join(
      ", "
    )
  );


  return lines.join(
    "\n"
  );

}


// =====================================================
// FULL AI REQUIREMENTS
// =====================================================

function buildFullAIRequirements(
  data
) {

  let result =
    buildAIRequirements(
      data.aiPlan
    );


  if (
    data.other
  ) {

    result +=
      "\n\n=== CUSTOMER REQUIREMENTS ===\n" +
      data.other;

  }


  return result;

}


// =====================================================
// INJECT AI PLANNER CONTAINER
// =====================================================

function injectAIPlannerContainer() {

  if (
    document.getElementById(
      "smvAIPlanner"
    )
  ) {

    return;

  }


  const container =
    document.createElement(
      "section"
    );


  container.id =
    "smvAIPlanner";


  container.className =
    "smv-ai-planner";


  container.innerHTML = `

    <div class="smv-ai-header">

      <div>

        <div class="smv-ai-kicker">
          SELECT MY VENUE AI
        </div>

        <h2>
          Your Smart Event Planner
        </h2>

        <p>
          Tell us what you're planning and we'll build
          a personalized starting plan for your celebration.
        </p>

      </div>

      <div class="smv-ai-badge">
        <span></span>
        AI READY
      </div>

    </div>


    <div id="smvAIContent">

      <div class="smv-ai-empty">

        <div class="smv-ai-icon">
          ✦
        </div>

        <h3>
          Let's plan something amazing.
        </h3>

        <p>
          Use the search above or enquiry form to
          generate your personalized event plan.
        </p>

      </div>

    </div>

  `;


  const enquiry =
    document.querySelector(
      ".enquiry-section"
    );


  if (
    enquiry
  ) {

    enquiry.parentNode.insertBefore(
      container,
      enquiry
    );

  } else {

    document.body.appendChild(
      container
    );

  }

}


// =====================================================
// SHOW AI PLANNER
// =====================================================

function showAIPlannerPanel(
  plan
) {

  if (!plan) {
    return;
  }


  currentAIPlan =
    plan;


  const container =
    document.getElementById(
      "smvAIPlanner"
    );


  const content =
    document.getElementById(
      "smvAIContent"
    );


  if (
    !container ||
    !content
  ) {

    return;

  }


  content.innerHTML = `

    <div class="smv-ai-score-row">

      <div class="smv-ai-score">

        <div class="smv-ai-score-number">
          ${plan.matchScore}%
        </div>

        <div>
          <strong>AI Match</strong>
          <small>Based on your requirements</small>
        </div>

      </div>


      <div class="smv-ai-intent">
        <span>Lead intent</span>
        <strong>
          ${escapeHTML(plan.intent)}
        </strong>
      </div>

    </div>


    <div class="smv-ai-grid">

      <div class="smv-ai-card">

        <span class="smv-ai-card-icon">
          🏛️
        </span>

        <h3>
          Venue Ideas
        </h3>

        <div class="smv-ai-tags">

          ${plan.venueTypes
            .map(
              item =>
                `<span>${escapeHTML(item)}</span>`
            )
            .join("")}

        </div>

      </div>


      <div class="smv-ai-card">

        <span class="smv-ai-card-icon">
          ✨
        </span>

        <h3>
          Event Style
        </h3>

        <div class="smv-ai-tags">

          ${plan.theme
            .map(
              item =>
                `<span>${escapeHTML(item)}</span>`
            )
            .join("")}

        </div>

      </div>


      <div class="smv-ai-card">

        <span class="smv-ai-card-icon">
          🍽️
        </span>

        <h3>
          Food Ideas
        </h3>

        <div class="smv-ai-list">

          ${plan.foodRecommendations
            .map(
              item =>
                `<div>✓ ${escapeHTML(item)}</div>`
            )
            .join("")}

        </div>

      </div>


      <div class="smv-ai-card">

        <span class="smv-ai-card-icon">
          🎯
        </span>

        <h3>
          Recommended Services
        </h3>

        <div class="smv-ai-list">

          ${plan.vendorRecommendations
            .slice(0, 6)
            .map(
              item =>
                `<div>✓ ${escapeHTML(item)}</div>`
            )
            .join("")}

        </div>

      </div>

    </div>


    <div class="smv-ai-budget">

      <div>

        <span class="smv-ai-card-icon">
          💰
        </span>

        <div>

          <strong>
            Smart Budget Starting Point
          </strong>

          <small>
            Indicative planning estimate — actual vendor
            prices depend on location, package and requirements.
          </small>

        </div>

      </div>


      <div class="smv-ai-budget-number">

        ₹${formatIndianNumber(
          plan.budgetPlan.total
        )}

      </div>

    </div>


    <div class="smv-ai-breakdown">

      ${renderBudgetItem(
        "Venue",
        plan.budgetPlan.breakdown.venue
      )}

      ${renderBudgetItem(
        "Food",
        plan.budgetPlan.breakdown.food
      )}

      ${renderBudgetItem(
        "Decor",
        plan.budgetPlan.breakdown.decor
      )}

      ${renderBudgetItem(
        "Photography",
        plan.budgetPlan.breakdown.photography
      )}

      ${renderBudgetItem(
        "Entertainment",
        plan.budgetPlan.breakdown.entertainment
      )}

      ${renderBudgetItem(
        "Buffer",
        plan.budgetPlan.breakdown.buffer
      )}

    </div>


    <div class="smv-ai-planning">

      <div class="smv-ai-planning-head">

        <div>

          <div class="smv-ai-kicker">
            YOUR ROADMAP
          </div>

          <h3>
            Smart Planning Timeline
          </h3>

        </div>

      </div>


      <div class="smv-ai-timeline">

        ${plan.timeline
          .map(
            (item, index) => `

              <div class="smv-ai-timeline-item">

                <div class="smv-ai-timeline-dot">
                  ${index + 1}
                </div>

                <div>

                  <strong>
                    ${escapeHTML(item.period)}
                  </strong>

                  <p>
                    ${escapeHTML(item.task)}
                  </p>

                </div>

              </div>

            `
          )
          .join("")}

      </div>

    </div>


    <div class="smv-ai-checklist">

      <div class="smv-ai-planning-head">

        <div>

          <div class="smv-ai-kicker">
            SMART CHECKLIST
          </div>

          <h3>
            Don't Miss The Important Things
          </h3>

        </div>

      </div>


      <div class="smv-ai-check-grid">

        ${plan.checklist
          .map(
            item => `

              <label class="smv-ai-check-item">

                <input
                  type="checkbox"
                  data-ai-check="${escapeHTML(item)}"
                >

                <span>
                  ${escapeHTML(item)}
                </span>

              </label>

            `
          )
          .join("")}

      </div>

    </div>


    <div class="smv-ai-actions">

      <button
        type="button"
        data-ai-action="save"
        class="smv-ai-action primary"
      >
        💾 Save My Plan
      </button>


      <button
        type="button"
        data-ai-action="budget"
        class="smv-ai-action"
      >
        💰 Recalculate Budget
      </button>


      <button
        type="button"
        data-ai-action="clear"
        class="smv-ai-action danger"
      >
        Clear Plan
      </button>

    </div>

  `;


  container.classList.add(
    "active"
  );


  setTimeout(
    function () {

      container.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    },
    120
  );

}


// =====================================================
// BUDGET ESTIMATOR
// =====================================================

function showBudgetEstimator() {

  if (!currentAIPlan) {

    showAIToast(
      "First create an event plan using the search above."
    );

    return;

  }


  const guests =
    currentAIPlan.guests ||
    100;


  const input =
    window.prompt(
      "Enter your estimated budget per guest (₹):",
      currentAIPlan.budget ||
      currentAIPlan.budgetPlan.perGuest
    );


  if (
    input ===
    null
  ) {

    return;

  }


  const budget =
    parseBudget(
      input
    );


  if (
    !budget ||
    budget <= 0
  ) {

    showAIToast(
      "Please enter a valid budget."
    );

    return;

  }


  currentAIPlan =
    generateAIEventPlan({

      eventType:
        currentAIPlan.eventType,

      location:
        currentAIPlan.location,

      guests:
        guests,

      eventDate:
        currentAIPlan.eventDate,

      budget:
        budget,

      food:
        currentAIPlan.food

    });


  saveAIPlan(
    currentAIPlan
  );


  showAIPlannerPanel(
    currentAIPlan
  );


  showAIToast(
    "✓ Budget updated."
  );

}


// =====================================================
// SAVE AI PLAN
// =====================================================

function saveAIPlan(
  plan
) {

  if (!plan) {
    return;
  }


  try {

    localStorage.setItem(
      SMV_AI_STORAGE_KEY,
      JSON.stringify(
        plan
      )
    );

  } catch (error) {

    console.warn(
      "Could not save AI plan:",
      error
    );

  }

}


// =====================================================
// RESTORE SAVED PLAN
// =====================================================

function restoreSavedAIPlan() {

  try {

    const saved =
      localStorage.getItem(
        SMV_AI_STORAGE_KEY
      );


    if (!saved) {
      return;
    }


    const plan =
      JSON.parse(
        saved
      );


    if (
      !plan ||
      !plan.eventType
    ) {

      return;

    }


    currentAIPlan =
      plan;


    // Don't automatically open the large planner
    // immediately. Show a small restore prompt.

    createRestorePrompt(
      plan
    );

  } catch (error) {

    console.warn(
      "Could not restore saved AI plan:",
      error
    );

  }

}


// =====================================================
// RESTORE PROMPT
// =====================================================

function createRestorePrompt(
  plan
) {

  if (
    document.getElementById(
      "smvRestorePrompt"
    )
  ) {

    return;

  }


  const prompt =
    document.createElement(
      "div"
    );


  prompt.id =
    "smvRestorePrompt";


  prompt.className =
    "smv-restore-prompt";


  prompt.innerHTML = `

    <div>

      <strong>
        ✦ Your saved event plan is available
      </strong>

      <span>
        ${escapeHTML(plan.eventType)}
        ·
        ${escapeHTML(plan.location)}
      </span>

    </div>


    <div class="smv-restore-actions">

      <button
        type="button"
        id="smvRestorePlan"
      >
        Restore
      </button>

      <button
        type="button"
        id="smvDismissPlan"
      >
        ×
      </button>

    </div>

  `;


  document.body.appendChild(
    prompt
  );


  const restore =
    document.getElementById(
      "smvRestorePlan"
    );


  const dismiss =
    document.getElementById(
      "smvDismissPlan"
    );


  if (restore) {

    restore.addEventListener(
      "click",
      function () {

        showAIPlannerPanel(
          plan
        );

        prompt.remove();

      }
    );

  }


  if (dismiss) {

    dismiss.addEventListener(
      "click",
      function () {

        prompt.remove();

      }
    );

  }

}


// =====================================================
// CLEAR SAVED PLAN
// =====================================================

function clearSavedAIPlan() {

  try {

    localStorage.removeItem(
      SMV_AI_STORAGE_KEY
    );

  } catch (error) {

    console.warn(
      error
    );

  }


  currentAIPlan =
    null;


  const container =
    document.getElementById(
      "smvAIPlanner"
    );


  const content =
    document.getElementById(
      "smvAIContent"
    );


  if (
    content
  ) {

    content.innerHTML = `

      <div class="smv-ai-empty">

        <div class="smv-ai-icon">
          ✦
        </div>

        <h3>
          Your planner is ready.
        </h3>

        <p>
          Start a new event search above.
        </p>

      </div>

    `;

  }


  if (
    container
  ) {

    container.classList.remove(
      "active"
    );

  }


  showAIToast(
    "Your saved plan has been cleared."
  );

}


// =====================================================
// SMART FORM ENHANCEMENTS
// =====================================================

function setupSmartFormEnhancements() {

  const dateFields =
    document.querySelectorAll(
      'input[type="date"]'
    );


  dateFields.forEach(
    function (field) {

      const today =
        new Date()
          .toISOString()
          .split("T")[0];


      field.setAttribute(
        "min",
        today
      );

    }
  );


  const mobileFields =
    document.querySelectorAll(
      'input[id*="Mobile"], input[id*="mobile"], input[type="tel"]'
    );


  mobileFields.forEach(
    function (field) {

      field.setAttribute(
        "inputmode",
        "numeric"
      );

      field.setAttribute(
        "maxlength",
        "10"
      );

    }
  );

}


// =====================================================
// SCROLL ANIMATIONS
// =====================================================

function setupScrollAnimations() {

  if (
    !("IntersectionObserver" in window)
  ) {

    return;

  }


  const elements =
    document.querySelectorAll(
      ".event-card, .feature-card, .contact-card, .about-image"
    );


  if (
    !elements.length
  ) {

    return;

  }


  elements.forEach(
    function (element) {

      element.classList.add(
        "smv-reveal"
      );

    }
  );


  const observer =
    new IntersectionObserver(
      function (
        entries
      ) {

        entries.forEach(
          function (
            entry
          ) {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "smv-visible"
              );

              observer.unobserve(
                entry.target
              );

            }

          }
        );

      },
      {
        threshold:
          0.12
      }
    );


  elements.forEach(
    function (element) {

      observer.observe(
        element
      );

    }
  );

}


// =====================================================
// AI STYLES
// =====================================================

function injectAIPlannerStyles() {

  if (
    document.getElementById(
      "smvAIPlannerStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "smvAIPlannerStyles";


  style.textContent = `

    .smv-ai-planner{

      max-width:1120px;

      margin:0 auto 35px;

      padding:22px;

      border:1px solid rgba(0,235,214,.22);

      border-radius:18px;

      background:

        radial-gradient(
          circle at 90% 0%,
          rgba(0,230,210,.12),
          transparent 30%
        ),

        linear-gradient(
          145deg,
          rgba(6,31,31,.95),
          rgba(2,15,15,.98)
        );

      box-shadow:
        0 20px 60px rgba(0,0,0,.22),
        inset 0 1px 0 rgba(255,255,255,.025);

      display:none;

    }


    .smv-ai-planner.active{
      display:block;
    }


    .smv-ai-header{

      display:flex;

      align-items:flex-start;

      justify-content:space-between;

      gap:20px;

      margin-bottom:22px;

    }


    .smv-ai-kicker{

      color:#11e0cf;

      font-size:9px;

      font-weight:900;

      letter-spacing:1.5px;

    }


    .smv-ai-header h2{

      font-size:27px;

      margin:5px 0 7px;

      letter-spacing:-.8px;

    }


    .smv-ai-header p{

      color:#8eaaa8;

      font-size:11px;

      max-width:620px;

    }


    .smv-ai-badge{

      display:flex;

      align-items:center;

      gap:7px;

      border:1px solid rgba(0,235,214,.25);

      border-radius:30px;

      padding:8px 12px;

      color:#aafcf3;

      font-size:9px;

      font-weight:900;

      letter-spacing:.8px;

      white-space:nowrap;

      background:rgba(0,220,205,.05);

    }


    .smv-ai-badge span{

      width:7px;

      height:7px;

      border-radius:50%;

      background:#11e0cf;

      box-shadow:0 0 12px #11e0cf;

    }


    .smv-ai-score-row{

      display:flex;

      align-items:center;

      justify-content:space-between;

      gap:15px;

      margin-bottom:15px;

      padding:13px;

      border-radius:12px;

      border:1px solid rgba(0,235,214,.12);

      background:rgba(0,220,205,.035);

    }


    .smv-ai-score{

      display:flex;

      align-items:center;

      gap:11px;

    }


    .smv-ai-score-number{

      width:54px;

      height:54px;

      border-radius:50%;

      display:grid;

      place-items:center;

      border:2px solid #11e0cf;

      color:#b9fff8;

      font-size:14px;

      font-weight:900;

      box-shadow:
        0 0 22px rgba(0,235,214,.16);

    }


    .smv-ai-score strong,
    .smv-ai-score small{

      display:block;

    }


    .smv-ai-score strong{

      font-size:11px;

    }


    .smv-ai-score small{

      color:#668482;

      font-size:9px;

      margin-top:2px;

    }


    .smv-ai-intent{

      text-align:right;

    }


    .smv-ai-intent span,
    .smv-ai-intent strong{

      display:block;

    }


    .smv-ai-intent span{

      color:#698382;

      font-size:8px;

      text-transform:uppercase;

      letter-spacing:.8px;

    }


    .smv-ai-intent strong{

      color:#ffd34b;

      font-size:11px;

      margin-top:3px;

    }


    .smv-ai-grid{

      display:grid;

      grid-template-columns:
        repeat(4,1fr);

      gap:9px;

    }


    .smv-ai-card{

      min-height:145px;

      padding:15px;

      border-radius:12px;

      border:1px solid rgba(0,235,214,.11);

      background:
        rgba(4,24,24,.78);

    }


    .smv-ai-card-icon{

      font-size:20px;

      display:block;

      margin-bottom:7px;

    }


    .smv-ai-card h3{

      font-size:12px;

      margin-bottom:10px;

    }


    .smv-ai-tags{

      display:flex;

      flex-wrap:wrap;

      gap:5px;

    }


    .smv-ai-tags span{

      border:1px solid rgba(0,235,214,.14);

      background:rgba(0,235,214,.035);

      color:#9dc2bf;

      border-radius:20px;

      padding:5px 7px;

      font-size:8px;

    }


    .smv-ai-list{

      color:#8eaaa8;

      font-size:9px;

      line-height:1.65;

    }


    .smv-ai-list div{

      margin:2px 0;

    }


    .smv-ai-budget{

      display:flex;

      align-items:center;

      justify-content:space-between;

      gap:15px;

      margin-top:10px;

      padding:15px;

      border:1px solid rgba(255,201,40,.18);

      border-radius:12px;

      background:rgba(255,201,40,.035);

    }


    .smv-ai-budget>div:first-child{

      display:flex;

      align-items:center;

      gap:10px;

    }


    .smv-ai-budget strong,
    .smv-ai-budget small{

      display:block;

    }


    .smv-ai-budget strong{

      font-size:11px;

    }


    .smv-ai-budget small{

      max-width:600px;

      margin-top:3px;

      color:#786f4c;

      font-size:8px;

    }


    .smv-ai-budget-number{

      color:#ffd34b;

      font-size:20px;

      font-weight:900;

      white-space:nowrap;

    }


    .smv-ai-breakdown{

      display:grid;

      grid-template-columns:
        repeat(6,1fr);

      gap:7px;

      margin-top:8px;

    }


    .smv-ai-budget-item{

      padding:9px;

      border:1px solid rgba(255,255,255,.05);

      border-radius:8px;

      text-align:center;

      background:rgba(0,0,0,.12);

    }


    .smv-ai-budget-item span{

      display:block;

      color:#6f8987;

      font-size:7px;

      text-transform:uppercase;

    }


    .smv-ai-budget-item strong{

      display:block;

      color:#c8dfdd;

      font-size:9px;

      margin-top:3px;

    }


    .smv-ai-planning,
    .smv-ai-checklist{

      margin-top:15px;

      padding:15px;

      border:1px solid rgba(0,235,214,.09);

      border-radius:12px;

      background:rgba(2,17,17,.55);

    }


    .smv-ai-planning-head h3{

      font-size:13px;

      margin-top:3px;

    }


    .smv-ai-timeline{

      display:grid;

      grid-template-columns:
        repeat(4,1fr);

      gap:10px;

      margin-top:13px;

    }


    .smv-ai-timeline-item{

      display:flex;

      gap:8px;

    }


    .smv-ai-timeline-dot{

      flex:none;

      width:25px;

      height:25px;

      border-radius:50%;

      display:grid;

      place-items:center;

      background:rgba(0,235,214,.09);

      border:1px solid rgba(0,235,214,.2);

      color:#11e0cf;

      font-size:9px;

      font-weight:900;

    }


    .smv-ai-timeline-item strong{

      display:block;

      color:#b7d1cf;

      font-size:9px;

    }


    .smv-ai-timeline-item p{

      color:#718b89;

      font-size:8px;

      line-height:1.4;

      margin-top:3px;

    }


    .smv-ai-check-grid{

      display:grid;

      grid-template-columns:
        repeat(2,1fr);

      gap:5px 20px;

      margin-top:12px;

    }


    .smv-ai-check-item{

      display:flex;

      align-items:center;

      gap:7px;

      padding:5px;

      color:#8fa9a7;

      font-size:9px;

      cursor:pointer;

    }


    .smv-ai-check-item input{

      accent-color:#11e0cf;

    }


    .smv-ai-check-item:has(
      input:checked
    ){

      color:#4d7773;

      text-decoration:line-through;

    }


    .smv-ai-actions{

      display:flex;

      flex-wrap:wrap;

      gap:7px;

      margin-top:14px;

    }


    .smv-ai-action{

      border:1px solid rgba(0,235,214,.18);

      background:rgba(0,235,214,.035);

      color:#9ed2ce;

      border-radius:20px;

      padding:9px 13px;

      cursor:pointer;

      font-size:9px;

      font-weight:800;

    }


    .smv-ai-action:hover{

      border-color:#11e0cf;

      color:#fff;

    }


    .smv-ai-action.primary{

      background:#11d9c8;

      color:#031313;

      border-color:#11d9c8;

    }


    .smv-ai-action.danger{

      color:#d38b8b;

      border-color:rgba(255,100,100,.15);

    }


    .smv-ai-empty{

      padding:28px 15px;

      text-align:center;

      border:1px dashed rgba(0,235,214,.15);

      border-radius:12px;

    }


    .smv-ai-icon{

      width:46px;

      height:46px;

      display:grid;

      place-items:center;

      margin:0 auto 9px;

      border-radius:50%;

      color:#11e0cf;

      background:rgba(0,235,214,.08);

      font-size:22px;

    }


    .smv-ai-empty h3{

      font-size:15px;

    }


    .smv-ai-empty p{

      color:#708b89;

      font-size:9px;

      margin-top:5px;

    }


    .smv-restore-prompt{

      position:fixed;

      right:18px;

      bottom:18px;

      z-index:999;

      max-width:350px;

      padding:13px;

      border:1px solid rgba(0,235,214,.3);

      border-radius:12px;

      background:#061919;

      box-shadow:0 15px 50px rgba(0,0,0,.45);

      display:flex;

      align-items:center;

      gap:15px;

    }


    .smv-restore-prompt strong,
    .smv-restore-prompt span{

      display:block;

    }


    .smv-restore-prompt strong{

      color:#e8fffc;

      font-size:10px;

    }


    .smv-restore-prompt span{

      color:#71918e;

      font-size:8px;

      margin-top:3px;

    }


    .smv-restore-actions{

      display:flex;

      gap:5px;

    }


    .smv-restore-actions button{

      border:1px solid rgba(0,235,214,.2);

      background:rgba(0,235,214,.05);

      color:#9feee6;

      border-radius:7px;

      padding:6px 8px;

      font-size:8px;

      cursor:pointer;

    }


    .smv-restore-actions button:first-child{

      background:#11d9c8;

      color:#031313;

    }


    .smv-ai-toast{

      position:fixed;

      left:50%;

      bottom:25px;

      transform:
        translateX(-50%)
        translateY(20px);

      z-index:1000;

      padding:10px 15px;

      border:1px solid rgba(0,235,214,.25);

      border-radius:30px;

      background:#061d1d;

      color:#bdfbf5;

      font-size:10px;

      opacity:0;

      pointer-events:none;

      transition:.25s ease;

      box-shadow:0 10px 35px rgba(0,0,0,.4);

    }


    .smv-ai-toast.show{

      opacity:1;

      transform:
        translateX(-50%)
        translateY(0);

    }


    .smv-reveal{

      opacity:0;

      transform:
        translateY(12px);

      transition:
        opacity .5s ease,
        transform .5s ease;

    }


    .smv-visible{

      opacity:1;

      transform:
        translateY(0);

    }


    @media(max-width:900px){

      .smv-ai-grid{

        grid-template-columns:
          repeat(2,1fr);

      }

      .smv-ai-timeline{

        grid-template-columns:
          repeat(2,1fr);

      }

      .smv-ai-breakdown{

        grid-template-columns:
          repeat(3,1fr);

      }

    }


    @media(max-width:700px){

      .smv-ai-planner{

        margin-left:14px;

        margin-right:14px;

        padding:15px;

      }


      .smv-ai-header{

        display:block;

      }


      .smv-ai-badge{

        display:inline-flex;

        margin-top:10px;

      }


      .smv-ai-header h2{

        font-size:22px;

      }


      .smv-ai-grid{

        grid-template-columns:
          1fr 1fr;

      }


      .smv-ai-score-row{

        align-items:flex-start;

      }


      .smv-ai-breakdown{

        grid-template-columns:
          repeat(2,1fr);

      }


      .smv-ai-timeline{

        grid-template-columns:
          1fr;

      }


      .smv-ai-check-grid{

        grid-template-columns:
          1fr;

      }


      .smv-ai-budget{

        align-items:flex-start;

        flex-direction:column;

      }


      .smv-restore-prompt{

        left:14px;

        right:14px;

        bottom:14px;

      }

    }


    @media(max-width:430px){

      .smv-ai-grid{

        grid-template-columns:
          1fr;

      }


      .smv-ai-breakdown{

        grid-template-columns:
          1fr 1fr;

      }


      .smv-ai-actions{

        flex-direction:column;

      }


      .smv-ai-action{

        width:100%;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}


// =====================================================
// BUDGET ITEM HTML
// =====================================================

function renderBudgetItem(
  label,
  value
) {

  return `

    <div class="smv-ai-budget-item">

      <span>
        ${escapeHTML(label)}
      </span>

      <strong>
        ₹${formatIndianNumber(value)}
      </strong>

    </div>

  `;

}


// =====================================================
// AI TOAST
// =====================================================

function showAIToast(
  message
) {

  let toast =
    document.getElementById(
      "smvAITtoast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "smvAITtoast";

    toast.className =
      "smv-ai-toast";

    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toast._timer
  );


  toast._timer =
    setTimeout(
      function () {

        toast.classList.remove(
          "show"
        );

      },
      2800
    );

}


// =====================================================
// SCROLL TO AI PLANNER
// =====================================================

function scrollToAIPlanner() {

  const planner =
    document.getElementById(
      "smvAIPlanner"
    );


  if (!planner) {
    return;
  }


  setTimeout(
    function () {

      planner.scrollIntoView({
        behavior:
          "smooth",
        block:
          "start"
      });

    },
    100
  );

}


// =====================================================
// PARSE GUEST NUMBER
// =====================================================

function parseGuestNumber(
  value
) {

  if (
    typeof value ===
    "number"
  ) {

    return value;

  }


  if (!value) {
    return 0;
  }


  const string =
    String(
      value
    );


  if (
    string.includes(
      "500+"
    )
  ) {

    return 500;

  }


  const numbers =
    string.match(
      /\d+/g
    );


  if (
    !numbers ||
    !numbers.length
  ) {

    return 0;

  }


  if (
    numbers.length >= 2
  ) {

    return Math.round(
      (
        Number(
          numbers[0]
        ) +
        Number(
          numbers[1]
        )
      ) / 2
    );

  }


  return Number(
    numbers[0]
  );

}


// =====================================================
// PARSE BUDGET
// =====================================================

function parseBudget(
  value
) {

  if (
    typeof value ===
    "number"
  ) {

    return value;

  }


  if (!value) {
    return 0;
  }


  const cleaned =
    String(
      value
    )
      .replace(
        /,/g,
        ""
      )
      .replace(
        /₹/g,
        ""
      )
      .trim();


  const number =
    parseFloat(
      cleaned
    );


  return Number.isFinite(
    number
  )
    ? number
    : 0;

}


// =====================================================
// GUEST RANGE CONVERSION
// =====================================================

function convertGuestRangeToNumber(
  value
) {

  return parseGuestNumber(
    value
  ) || null;

}


// =====================================================
// FORMAT INDIAN NUMBER
// =====================================================

function formatIndianNumber(
  value
) {

  const number =
    Math.round(
      Number(
        value || 0
      )
    );


  try {

    return number.toLocaleString(
      "en-IN"
    );

  } catch (
    error
  ) {

    return String(
      number
    );

  }

}


// =====================================================
// GET VALUE
// =====================================================

function getValue(
  id
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return "";
  }


  return String(
    element.value ||
    ""
  ).trim();

}


// =====================================================
// FOCUS FIELD
// =====================================================

function focusField(
  id
) {

  const element =
    document.getElementById(
      id
    );


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
    .test(
      email
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


  if (
    button.disabled
  ) {

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


  const combined =
    errorMessage +
    " " +
    errorDetails;


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
    )
  ) {

    return (
      "We could not submit your enquiry right now. Please try again."
    );

  }


  if (
    combined.includes(
      "check constraint"
    )
  ) {

    return (
      "There is a database validation issue. Please try again."
    );

  }


  if (
    combined.includes(
      "network"
    ) ||
    combined.includes(
      "failed to fetch"
    ) ||
    combined.includes(
      "fetch"
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
    type ===
    "success"
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
// ESCAPE HTML
// =====================================================

function escapeHTML(
  value
) {

  return String(
    value ||
    ""
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
// GLOBAL ERROR LOG
// =====================================================

window.addEventListener(
  "error",
  function (
    event
  ) {

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
  function (
    event
  ) {

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
  "SELECT MY VENUE"
);

console.log(
  "AI EVENT PLANNER V1"
);

console.log(
  "Website → Supabase → CRM"
);

console.log(
  "Mobile-safe enquiry submission: ACTIVE"
);

console.log(
  "Smart matching: ACTIVE"
);

console.log(
  "Budget intelligence: ACTIVE"
);

console.log(
  "Event checklist: ACTIVE"
);

console.log(
  "Planning timeline: ACTIVE"
);

console.log(
  "Local plan storage: ACTIVE"
);

console.log(
  "Public SELECT request: DISABLED"
);

console.log(
  "========================================"
);


if (
  supabaseClient
) {

  console.log(
    "Supabase client: READY"
  );

} else {

  console.error(
    "Supabase client: NOT READY"
  );

}
