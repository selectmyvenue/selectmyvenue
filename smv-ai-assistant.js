(function setupFinalSMVAI() {

  "use strict";

  /* =======================================================
     CONFIG
     ======================================================= */

  const SUPABASE_AI_URL =
    "https://uajqwyoqbbswkfiwosyw.supabase.co/functions/v1/smv-ai-assistant";



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


    // Pass only public discovery context to the assistant. Never include
    // customer name, phone number, email address or private CRM information.
    function textFrom(selector) {
      const node = document.querySelector(selector);
      return node ? String(node.textContent || "").trim().slice(0, 800) : "";
    }

    function textFromWithin(root, selector) {
      const node = root.querySelector(selector);
      return node ? String(node.textContent || "").trim().slice(0, 180) : "";
    }

    context.discoveryPage = String(location.pathname.split("/").pop() || "index.html").slice(0, 120);
    context.discoveryFilters = {
      search: value("smvBrowseSearch") || value("smvTopSearch") || value("smvHomeSearch"),
      city: value("smvBrowseCity") || value("smvTopCity") || value("smvHomeLocation"),
      activeFilters: Array.from(document.querySelectorAll(".smv-filter-choice.active"))
        .map(function (node) { return String(node.textContent || "").trim().slice(0, 80); })
        .filter(Boolean).slice(0, 12)
    };

    context.visibleVenueCandidates = Array.from(document.querySelectorAll(
      "#venueGrid .venue-card:not([hidden]), #homeVenueGrid .home-venue-card:not([hidden])"
    )).slice(0, 8).map(function (card) {
      const heading = card.querySelector(".venue-card-body h2, .home-venue-content h3");
      const facts = Array.from(card.querySelectorAll(".venue-facts .venue-fact, .home-venue-facts span"));
      const featureNode = card.querySelector(".venue-feature-list, .home-venue-features");
      return {
        name: String(heading?.textContent || "").trim().slice(0, 140),
        type: String(card.querySelector(".venue-type")?.textContent || "").trim().slice(0, 80),
        location: textFromWithin(card, ".venue-location, .home-venue-location"),
        capacity: String(facts[0]?.textContent || "").trim().slice(0, 100),
        price: String(facts[1]?.textContent || "").trim().slice(0, 100),
        facilities: String(featureNode?.textContent || "").trim().slice(0, 240)
      };
    }).filter(function (venue) { return !!venue.name; });

    const profile = document.getElementById("venueProfile");
    if (profile && !profile.hidden) {
      context.currentVenue = {
        name: textFrom("#venueProfileName"),
        location: textFrom("#venueProfileLocation"),
        type: textFrom("#venueProfileFactType"),
        capacity: textFrom("#venueProfileCapacity"),
        price: textFrom("#venueProfilePrice"),
        facilities: textFrom("#venueProfileFeatures"),
        description: textFrom("#venueProfileDescription")
      };
    }


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
     AI ASSISTANT — MANUAL OPEN ONLY
     =======================================================

     The AI Assistant must NEVER open automatically.

     Customer must click the AI Assistant button manually.

     IMPORTANT:
     - No timer
     - No first-click trigger
     - No automatic popup
     - AI functionality remains unchanged
     - setupAutoEnquiryPopup() is NOT affected
     ======================================================= */

  let interactionTimerStarted = false;
  let interactionTimer = null;

  /*
     Intentionally disabled.

     The AI Assistant is now completely manual.
     The button click handled in attachEvents()
     is the only way to open the assistant.
  */

  function startInteractionTimer() {
    return;
  }


  function interactionHandler(event) {
    return;
  }


  /*
     IMPORTANT:
     Do NOT attach a document-wide click listener here.

     The previous version used:

     document.addEventListener(
       "click",
       interactionHandler,
       {
         passive: true
       }
     );

     That listener has intentionally been removed.
  */
   
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
      "✓ AI Assistant is ready and opens only when requested."
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
