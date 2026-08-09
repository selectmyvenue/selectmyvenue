/* =========================================================
   SELECT MY VENUE — CRM JAVASCRIPT
   Supabase Authentication + Lead Management
   ========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
   ========================================================= */

/*
   IMPORTANT:
   Replace these two values with your Supabase project details.

   Supabase:
   Project Settings
   → API
   → Project URL
   → anon / publishable key
*/

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";


/*
   Database table containing customer enquiries.

   If your Supabase table has a different name,
   change only this value.
*/

const LEADS_TABLE = "enquiries";


/* =========================================================
   SUPABASE CLIENT
   ========================================================= */

let supabaseClient = null;

if (
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL" &&
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let allLeads = [];

let filteredLeads = [];

let selectedLead = null;

let currentUser = null;


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  setupEventListeners();

  if (!supabaseClient) {

    showToast(
      "Supabase configuration is missing.",
      true
    );

    return;
  }

  await checkAuthentication();

});


/* =========================================================
   AUTHENTICATION CHECK
   ========================================================= */

async function checkAuthentication() {

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error(error);
      redirectToLogin();
      return;
    }

    const session = data.session;

    if (!session || !session.user) {
      redirectToLogin();
      return;
    }

    currentUser = session.user;

    updateStaffName();

    await loadLeads();

  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );

    redirectToLogin();

  }

}


/* =========================================================
   STAFF NAME
   ========================================================= */

function updateStaffName() {

  const staffName = $("staffName");

  if (!staffName || !currentUser) {
    return;
  }

  const metadata =
    currentUser.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    currentUser.email ||
    "CRM Staff";

  staffName.textContent = name;

}


/* =========================================================
   LOGIN REDIRECT
   ========================================================= */

function redirectToLogin() {

  window.location.href = "login.html";

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

  try {

    if (!supabaseClient) {
      redirectToLogin();
      return;
    }

    const {
      error
    } = await supabaseClient.auth.signOut();

    if (error) {
      console.error(error);

      showToast(
        "Unable to logout.",
        true
      );

      return;
    }

    window.location.href = "login.html";

  } catch (error) {

    console.error(error);

    window.location.href = "login.html";

  }

}


/* =========================================================
   LOAD LEADS
   ========================================================= */

async function loadLeads() {

  const tableBody =
    $("leadsTableBody");

  if (tableBody) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="loading-cell">
          Loading enquiries...
        </td>
      </tr>
    `;

  }

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from(LEADS_TABLE)
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {

      console.error(
        "Lead loading error:",
        error
      );

      renderError(
        "Unable to load enquiries."
      );

      return;
    }

    allLeads = Array.isArray(data)
      ? data
      : [];

    applyFilters();

    updateStatistics();

  } catch (error) {

    console.error(error);

    renderError(
      "Something went wrong while loading enquiries."
    );

  }

}


/* =========================================================
   FILTERS
   ========================================================= */

function applyFilters() {

  const searchInput =
    $("searchInput");

  const statusFilter =
    $("statusFilter");

  const priorityFilter =
    $("priorityFilter");


  const search =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";


  const status =
    statusFilter
      ? statusFilter.value
      : "";


  const priority =
    priorityFilter
      ? priorityFilter.value
      : "";


  filteredLeads = allLeads.filter(
    (lead) => {

      const customerName =
        getField(
          lead,
          [
            "customer_name",
            "name",
            "full_name"
          ]
        );


      const mobile =
        getField(
          lead,
          [
            "mobile",
            "phone",
            "phone_number",
            "mobile_number"
          ]
        );


      const location =
        getField(
          lead,
          [
            "location",
            "city",
            "venue_location"
          ]
        );


      const matchesSearch =
        !search ||
        String(customerName)
          .toLowerCase()
          .includes(search) ||
        String(mobile)
          .toLowerCase()
          .includes(search) ||
        String(location)
          .toLowerCase()
          .includes(search);


      const leadStatus =
        normalizeValue(
          getField(
            lead,
            [
              "status",
              "lead_status"
            ]
          )
        );


      const leadPriority =
        normalizeValue(
          getField(
            lead,
            [
              "priority",
              "lead_priority"
            ]
          )
        );


      const matchesStatus =
        !status ||
        leadStatus ===
        normalizeValue(status);


      const matchesPriority =
        !priority ||
        leadPriority ===
        normalizeValue(priority);


      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );

    }
  );


  renderLeads();

}


/* =========================================================
   RENDER LEADS
   ========================================================= */

function renderLeads() {

  const tableBody =
    $("leadsTableBody");

  const emptyState =
    $("emptyState");


  if (!tableBody) {
    return;
  }


  if (!filteredLeads.length) {

    tableBody.innerHTML = "";

    if (emptyState) {
      emptyState.hidden = false;
    }

    return;

  }


  if (emptyState) {
    emptyState.hidden = true;
  }


  tableBody.innerHTML =
    filteredLeads
      .map(
        (lead) =>
          createLeadRow(lead)
      )
      .join("");


}


/* =========================================================
   CREATE TABLE ROW
   ========================================================= */

function createLeadRow(lead) {

  const id =
    getLeadId(lead);


  const name =
    getField(
      lead,
      [
        "customer_name",
        "name",
        "full_name"
      ],
      "Unknown Customer"
    );


  const event =
    getField(
      lead,
      [
        "occasion",
        "event_type",
        "event",
        "event_name"
      ],
      "—"
    );


  const location =
    getField(
      lead,
      [
        "location",
        "city",
        "venue_location"
      ],
      "—"
    );


  const eventDate =
    getField(
      lead,
      [
        "event_date",
        "date"
      ],
      ""
    );


  const guests =
    getField(
      lead,
      [
        "guests",
        "guest_count",
        "number_of_guests"
      ],
      "—"
    );


  const budget =
    getField(
      lead,
      [
        "budget",
        "budget_per_person",
        "budget_per_guest"
      ],
      "—"
    );


  const status =
    normalizeValue(
      getField(
        lead,
        [
          "status",
          "lead_status"
        ],
        "new"
      )
    );


  const priority =
    normalizeValue(
      getField(
        lead,
        [
          "priority",
          "lead_priority"
        ],
        "normal"
      )
    );


  return `
    <tr>

      <td>
        <strong class="customer-name">
          ${escapeHTML(name)}
        </strong>
      </td>

      <td>
        ${escapeHTML(event)}
      </td>

      <td>
        ${escapeHTML(location)}
      </td>

      <td>
        <span class="enquiry-date">
          ${formatDate(eventDate)}
        </span>
      </td>

      <td>
        ${escapeHTML(guests)}
      </td>

      <td>
        ${escapeHTML(budget)}
      </td>

      <td>
        ${createStatusBadge(status)}
      </td>

      <td>
        ${createPriorityBadge(priority)}
      </td>

      <td>

        <div class="table-actions">

          <button
            type="button"
            class="action-btn"
            data-action="view"
            data-id="${escapeAttribute(id)}"
            title="View enquiry"
          >
            View
          </button>

          ${createCallButton(lead)}

          ${createWhatsAppButton(lead)}

        </div>

      </td>

    </tr>
  `;

}


/* =========================================================
   STATUS BADGE
   ========================================================= */

function createStatusBadge(status) {

  const safeStatus =
    normalizeValue(status || "new");


  const label =
    formatStatus(safeStatus);


  let className =
    "status-new";


  if (safeStatus === "contacted") {
    className = "status-contacted";
  }

  else if (
    safeStatus === "follow_up" ||
    safeStatus === "qualified"
  ) {
    className = "status-progress";
  }

  else if (safeStatus === "converted") {
    className = "status-new";
  }

  else if (safeStatus === "closed") {
    className = "status-closed";
  }


  return `
    <span class="status-badge ${className}">
      ${escapeHTML(label)}
    </span>
  `;

}


/* =========================================================
   PRIORITY BADGE
   ========================================================= */

function createPriorityBadge(priority) {

  const value =
    normalizeValue(
      priority || "normal"
    );


  let className =
    "status-closed";


  if (value === "urgent") {
    className = "status-lost";
  }

  else if (value === "high") {
    className = "status-contacted";
  }

  else if (value === "normal") {
    className = "status-progress";
  }


  return `
    <span class="status-badge ${className}">
      ${escapeHTML(
        capitalize(value)
      )}
    </span>
  `;

}


/* =========================================================
   CALL BUTTON
   ========================================================= */

function createCallButton(lead) {

  const mobile =
    getField(
      lead,
      [
        "mobile",
        "phone",
        "phone_number",
        "mobile_number"
      ]
    );


  if (!mobile) {
    return "";
  }


  const phone =
    String(mobile)
      .replace(/[^\d+]/g, "");


  return `
    <a
      class="action-btn call"
      href="tel:${escapeAttribute(phone)}"
      title="Call customer"
    >
      ☎
    </a>
  `;

}


/* =========================================================
   WHATSAPP BUTTON
   ========================================================= */

function createWhatsAppButton(lead) {

  const mobile =
    getField(
      lead,
      [
        "mobile",
        "phone",
        "phone_number",
        "mobile_number"
      ]
    );


  if (!mobile) {
    return "";
  }


  let phone =
    String(mobile)
      .replace(/\D/g, "");


  /*
     India number support.
     10 digit number → add +91
  */

  if (
    phone.length === 10
  ) {
    phone = "91" + phone;
  }


  const message =
    `Hello, this is Select My Venue regarding your venue enquiry.`;


  const url =
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;


  return `
    <a
      class="action-btn whatsapp"
      href="${escapeAttribute(url)}"
      target="_blank"
      rel="noopener"
      title="WhatsApp customer"
    >
      ◉
    </a>
  `;

}


/* =========================================================
   UPDATE STATISTICS
   ========================================================= */

function updateStatistics() {

  const total =
    allLeads.length;


  const newCount =
    allLeads.filter(
      (lead) =>
        normalizeValue(
          getField(
            lead,
            [
              "status",
              "lead_status"
            ]
          )
        ) === "new"
    ).length;


  const followupCount =
    allLeads.filter(
      (lead) =>
        normalizeValue(
          getField(
            lead,
            [
              "status",
              "lead_status"
            ]
          )
        ) === "follow_up"
    ).length;


  const convertedCount =
    allLeads.filter(
      (lead) =>
        normalizeValue(
          getField(
            lead,
            [
              "status",
              "lead_status"
            ]
          )
        ) === "converted"
    ).length;


  setText(
    "totalLeads",
    total
  );

  setText(
    "newLeads",
    newCount
  );

  setText(
    "followupLeads",
    followupCount
  );

  setText(
    "convertedLeads",
    convertedCount
  );

}


/* =========================================================
   OPEN LEAD MODAL
   ========================================================= */

function openLeadModal(id) {

  const lead =
    allLeads.find(
      (item) =>
        String(getLeadId(item)) ===
        String(id)
    );


  if (!lead) {
    return;
  }


  selectedLead = lead;


  setText(
    "modalCustomerName",
    getField(
      lead,
      [
        "customer_name",
        "name",
        "full_name"
      ],
      "Customer"
    )
  );


  const mobile =
    getField(
      lead,
      [
        "mobile",
        "phone",
        "phone_number",
        "mobile_number"
      ],
      "—"
    );


  setText(
    "modalMobile",
    mobile
  );


  setText(
    "modalEmail",
    getField(
      lead,
      [
        "email",
        "customer_email"
      ],
      "—"
    )
  );


  setText(
    "modalLocation",
    getField(
      lead,
      [
        "location",
        "city",
        "venue_location"
      ],
      "—"
    )
  );


  setText(
    "modalOccasion",
    getField(
      lead,
      [
        "occasion",
        "event_type",
        "event"
      ],
      "—"
    )
  );


  setText(
    "modalEventDate",
    formatDate(
      getField(
        lead,
        [
          "event_date",
          "date"
        ],
        ""
      )
    )
  );


  setText(
    "modalGuests",
    getField(
      lead,
      [
        "guests",
        "guest_count",
        "number_of_guests"
      ],
      "—"
    )
  );


  setText(
    "modalBudget",
    getField(
      lead,
      [
        "budget",
        "budget_per_person",
        "budget_per_guest"
      ],
      "—"
    )
  );


  setText(
    "modalFood",
    getField(
      lead,
      [
        "food_preference",
        "food",
        "cuisine"
      ],
      "—"
    )
  );


  setText(
    "modalRequirements",
    getField(
      lead,
      [
        "requirements",
        "other_requirements",
        "message",
        "notes"
      ],
      "—"
    )
  );


  const status =
    normalizeValue(
      getField(
        lead,
        [
          "status",
          "lead_status"
        ],
        "new"
      )
    );


  const priority =
    normalizeValue(
      getField(
        lead,
        [
          "priority",
          "lead_priority"
        ],
        "normal"
      )
    );


  const statusSelect =
    $("modalStatus");


  const prioritySelect =
    $("modalPriority");


  if (statusSelect) {
    statusSelect.value = status;
  }


  if (prioritySelect) {
    prioritySelect.value = priority;
  }


  const followUp =
    getField(
      lead,
      [
        "follow_up_at",
        "followup_at",
        "follow_up"
      ],
      ""
    );


  const followUpInput =
    $("modalFollowUp");


  if (followUpInput) {

    followUpInput.value =
      formatDateTimeLocal(
        followUp
      );

  }


  const notes =
    getField(
      lead,
      [
        "internal_notes",
        "crm_notes",
        "notes"
      ],
      ""
    );


  const notesInput =
    $("modalNotes");


  if (notesInput) {
    notesInput.value =
      notes || "";
  }


  const callBtn =
    $("modalCallBtn");


  if (callBtn) {

    if (mobile) {

      const phone =
        String(mobile)
          .replace(/[^\d+]/g, "");

      callBtn.href =
        `tel:${phone}`;

      callBtn.style.display =
        "inline-flex";

    } else {

      callBtn.style.display =
        "none";

    }

  }


  const whatsappBtn =
    $("modalWhatsappBtn");


  if (whatsappBtn) {

    if (mobile) {

      let phone =
        String(mobile)
          .replace(/\D/g, "");


      if (
        phone.length === 10
      ) {
        phone = "91" + phone;
      }


      const message =
        "Hello, this is Select My Venue regarding your venue enquiry.";


      whatsappBtn.href =
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      whatsappBtn.style.display =
        "inline-flex";

    } else {

      whatsappBtn.style.display =
        "none";

    }

  }


  const modal =
    $("leadModal");


  if (modal) {

    modal.hidden = false;

    document.body.style.overflow =
      "hidden";

  }

}


/* =========================================================
   CLOSE LEAD MODAL
   ========================================================= */

function closeLeadModal() {

  const modal =
    $("leadModal");


  if (modal) {
    modal.hidden = true;
  }


  document.body.style.overflow =
    "";

  selectedLead = null;

}


/* =========================================================
   SAVE LEAD
   ========================================================= */

async function saveLead() {

  if (!selectedLead) {
    return;
  }


  const id =
    getLeadId(selectedLead);


  const status =
    $("modalStatus")
      ? $("modalStatus").value
      : "new";


  const priority =
    $("modalPriority")
      ? $("modalPriority").value
      : "normal";


  const followUp =
    $("modalFollowUp")
      ? $("modalFollowUp").value
      : null;


  const notes =
    $("modalNotes")
      ? $("modalNotes").value.trim()
      : "";


  const updates = {

    status:
      status,

    priority:
      priority,

    follow_up_at:
      followUp
        ? new Date(followUp).toISOString()
        : null,

    internal_notes:
      notes,

    updated_at:
      new Date().toISOString()

  };


  const saveButton =
    $("saveLeadBtn");


  if (saveButton) {

    saveButton.disabled =
      true;

    saveButton.textContent =
      "Saving...";

  }


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from(LEADS_TABLE)
      .update(updates)
      .eq("id", id)
      .select()
      .single();


    if (error) {

      console.error(
        "Save lead error:",
        error
      );

      showToast(
        error.message ||
        "Unable to save changes.",
        true
      );

      return;

    }


    /*
       Update local data immediately.
    */

    const index =
      allLeads.findIndex(
        (lead) =>
          String(getLeadId(lead)) ===
          String(id)
      );


    if (index !== -1) {

      allLeads[index] =
        data || {
          ...allLeads[index],
          ...updates
        };

    }


    updateStatistics();

    applyFilters();

    closeLeadModal();

    showToast(
      "Lead updated successfully."
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Unable to save lead.",
      true
    );

  } finally {

    if (saveButton) {

      saveButton.disabled =
        false;

      saveButton.textContent =
        "Save Changes";

    }

  }

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {


  /* ---------------------------------------------
     Search
  --------------------------------------------- */

  const searchInput =
    $("searchInput");


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      applyFilters
    );

  }


  /* ---------------------------------------------
     Status filter
  --------------------------------------------- */

  const statusFilter =
    $("statusFilter");


  if (statusFilter) {

    statusFilter.addEventListener(
      "change",
      applyFilters
    );

  }


  /* ---------------------------------------------
     Priority filter
  --------------------------------------------- */

  const priorityFilter =
    $("priorityFilter");


  if (priorityFilter) {

    priorityFilter.addEventListener(
      "change",
      applyFilters
    );

  }


  /* ---------------------------------------------
     Refresh
  --------------------------------------------- */

  const refreshBtn =
    $("refreshBtn");


  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      async () => {

        refreshBtn.disabled =
          true;

        refreshBtn.textContent =
          "↻ Loading...";


        await loadLeads();


        refreshBtn.disabled =
          false;

        refreshBtn.textContent =
          "↻ Refresh";

      }
    );

  }


  /* ---------------------------------------------
     Logout
  --------------------------------------------- */

  const logoutBtn =
    $("logoutBtn");


  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      logoutUser
    );

  }


  /* ---------------------------------------------
     Table actions
  --------------------------------------------- */

  const tableBody =
    $("leadsTableBody");


  if (tableBody) {

    tableBody.addEventListener(
      "click",
      (event) => {

        const button =
          event.target.closest(
            "[data-action]"
          );


        if (!button) {
          return;
        }


        const action =
          button.dataset.action;


        const id =
          button.dataset.id;


        if (
          action === "view"
        ) {

          openLeadModal(id);

        }

      }
    );

  }


  /* ---------------------------------------------
     Close modal
  --------------------------------------------- */

  const closeModalBtn =
    $("closeModalBtn");


  if (closeModalBtn) {

    closeModalBtn.addEventListener(
      "click",
      closeLeadModal
    );

  }


  const cancelModalBtn =
    $("cancelModalBtn");


  if (cancelModalBtn) {

    cancelModalBtn.addEventListener(
      "click",
      closeLeadModal
    );

  }


  /* ---------------------------------------------
     Save
  --------------------------------------------- */

  const saveLeadBtn =
    $("saveLeadBtn");


  if (saveLeadBtn) {

    saveLeadBtn.addEventListener(
      "click",
      saveLead
    );

  }


  /* ---------------------------------------------
     Close modal by clicking outside
  --------------------------------------------- */

  const leadModal =
    $("leadModal");


  if (leadModal) {

    leadModal.addEventListener(
      "click",
      (event) => {

        if (
          event.target === leadModal
        ) {
          closeLeadModal();
        }

      }
    );

  }


  /* ---------------------------------------------
     ESC key
  --------------------------------------------- */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape"
      ) {

        if (
          leadModal &&
          !leadModal.hidden
        ) {
          closeLeadModal();
        }

      }

    }
  );

}


/* =========================================================
   HELPER — GET FIELD
   ========================================================= */

function getField(
  object,
  possibleNames,
  fallback = ""
) {

  if (!object) {
    return fallback;
  }


  for (
    const name of possibleNames
  ) {

    if (
      object[name] !== undefined &&
      object[name] !== null &&
      object[name] !== ""
    ) {

      return object[name];

    }

  }


  return fallback;

}


/* =========================================================
   HELPER — GET LEAD ID
   ========================================================= */

function getLeadId(lead) {

  return getField(
    lead,
    [
      "id",
      "lead_id",
      "enquiry_id"
    ],
    ""
  );

}


/* =========================================================
   HELPER — NORMALIZE VALUE
   ========================================================= */

function normalizeValue(value) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

}


/* =========================================================
   HELPER — STATUS LABEL
   ========================================================= */

function formatStatus(status) {

  const labels = {

    new:
      "New",

    contacted:
      "Contacted",

    follow_up:
      "Follow-up",

    qualified:
      "Qualified",

    converted:
      "Converted",

    closed:
      "Closed"

  };


  return (
    labels[status] ||
    capitalize(
      String(status)
        .replace(/_/g, " ")
    )
  );

}


/* =========================================================
   HELPER — CAPITALIZE
   ========================================================= */

function capitalize(value) {

  if (!value) {
    return "";
  }


  return String(value)
    .charAt(0)
    .toUpperCase() +
    String(value)
      .slice(1);

}


/* =========================================================
   HELPER — FORMAT DATE
   ========================================================= */

function formatDate(value) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


/* =========================================================
   HELPER — DATETIME LOCAL
   ========================================================= */

function formatDateTimeLocal(value) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  const pad =
    (number) =>
      String(number)
        .padStart(2, "0");


  return (
    date.getFullYear() +
    "-" +
    pad(
      date.getMonth() + 1
    ) +
    "-" +
    pad(
      date.getDate()
    ) +
    "T" +
    pad(
      date.getHours()
    ) +
    ":" +
    pad(
      date.getMinutes()
    )
  );

}


/* =========================================================
   HELPER — SET TEXT
   ========================================================= */

function setText(
  id,
  value
) {

  const element =
    $(id);


  if (element) {

    element.textContent =
      value ?? "—";

  }

}


/* =========================================================
   HELPER — ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

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


/* =========================================================
   HELPER — ESCAPE ATTRIBUTE
   ========================================================= */

function escapeAttribute(value) {

  return escapeHTML(value);

}


/* =========================================================
   ERROR STATE
   ========================================================= */

function renderError(
  message
) {

  const tableBody =
    $("leadsTableBody");


  if (!tableBody) {
    return;
  }


  tableBody.innerHTML = `
    <tr>
      <td
        colspan="9"
        class="loading-cell"
      >
        ${escapeHTML(message)}
      </td>
    </tr>
  `;


}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  message,
  isError = false
) {

  const toast =
    $("toast");

  const toastMessage =
    $("toastMessage");


  if (!toast) {
    return;
  }


  if (toastMessage) {

    toastMessage.textContent =
      message;

  }


  toast.hidden = false;


  toast.classList.toggle(
    "error",
    isError
  );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(
      () => {

        toast.hidden = true;

      },
      3000
    );

}


/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */

if (typeof window !== "undefined") {

  window.addEventListener(
    "load",
    () => {

      if (!supabaseClient) {
        return;
      }


      supabaseClient.auth.onAuthStateChange(
        (event, session) => {

          if (
            event === "SIGNED_OUT"
          ) {

            window.location.href =
              "login.html";

          }


          if (
            event === "SIGNED_IN" &&
            session
          ) {

            currentUser =
              session.user;

            updateStaffName();

          }

        }
      );

    }
  );

}
