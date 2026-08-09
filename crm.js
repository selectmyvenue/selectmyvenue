/* =========================================================
   SELECT MY VENUE — CRM
   Supabase Authentication + Lead Management
========================================================= */


/* =========================================================
   1. SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co/";

const SUPABASE_ANON_KEY =
  "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";


/* =========================================================
   2. DATABASE TABLE
========================================================= */

const LEADS_TABLE = "customer_enquiries";


/* =========================================================
   3. SUPABASE CLIENT
========================================================= */

let supabaseClient = null;

if (
  SUPABASE_URL !== "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE" &&
  SUPABASE_ANON_KEY !== "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE"
) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}


/* =========================================================
   4. GLOBAL DATA
========================================================= */

let allLeads = [];
let filteredLeads = [];
let selectedLead = null;
let currentUser = null;


/* =========================================================
   5. HELPER
========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   6. PAGE START
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

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
   7. AUTHENTICATION
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

    if (!data.session || !data.session.user) {
      redirectToLogin();
      return;
    }

    currentUser = data.session.user;

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
   8. STAFF NAME
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
    currentUser.email ||
    "CRM Staff";

  staffName.textContent = name;

}


/* =========================================================
   9. LOGIN REDIRECT
========================================================= */

function redirectToLogin() {

  window.location.href = "login.html";

}


/* =========================================================
   10. LOGOUT
========================================================= */

async function logoutUser() {

  if (!supabaseClient) {
    redirectToLogin();
    return;
  }

  try {

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
   11. LOAD LEADS
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
        error.message ||
        "Unable to load enquiries."
      );

      return;
    }

    allLeads =
      Array.isArray(data)
        ? data
        : [];

    updateStatistics();

    applyFilters();

  } catch (error) {

    console.error(error);

    renderError(
      "Something went wrong while loading enquiries."
    );

  }

}


/* =========================================================
   12. FILTERS
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

  filteredLeads =
    allLeads.filter(function (lead) {

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
            "mobile_number",
            "phone",
            "phone_number"
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

    });

  renderLeads();

}


/* =========================================================
   13. RENDER LEADS
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
      .map(createLeadRow)
      .join("");

}


/* =========================================================
   14. CREATE TABLE ROW
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
        "event"
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
        "budget_per_person",
        "budget",
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
        ${formatDate(eventDate)}
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
   15. STATUS BADGE
========================================================= */

function createStatusBadge(status) {

  const value =
    normalizeValue(status || "new");

  let className =
    "status-new";

  if (value === "contacted") {
    className = "status-contacted";
  }

  else if (
    value === "follow_up" ||
    value === "qualified"
  ) {
    className = "status-progress";
  }

  else if (value === "closed") {
    className = "status-closed";
  }

  return `
    <span class="status-badge ${className}">
      ${escapeHTML(formatStatus(value))}
    </span>
  `;

}


/* =========================================================
   16. PRIORITY BADGE
========================================================= */

function createPriorityBadge(priority) {

  const value =
    normalizeValue(priority || "normal");

  let className =
    "status-progress";

  if (value === "urgent") {
    className = "status-lost";
  }

  else if (value === "high") {
    className = "status-contacted";
  }

  else if (value === "low") {
    className = "status-closed";
  }

  return `
    <span class="status-badge ${className}">
      ${escapeHTML(capitalize(value))}
    </span>
  `;

}


/* =========================================================
   17. CALL BUTTON
========================================================= */

function createCallButton(lead) {

  const mobile =
    getField(
      lead,
      [
        "mobile",
        "mobile_number",
        "phone",
        "phone_number"
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
   18. WHATSAPP BUTTON
========================================================= */

function createWhatsAppButton(lead) {

  const mobile =
    getField(
      lead,
      [
        "mobile",
        "mobile_number",
        "phone",
        "phone_number"
      ]
    );

  if (!mobile) {
    return "";
  }

  let phone =
    String(mobile)
      .replace(/\D/g, "");

  if (phone.length === 10) {
    phone = "91" + phone;
  }

  const message =
    "Hello, this is Select My Venue regarding your venue enquiry.";

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
   19. STATISTICS
========================================================= */

function updateStatistics() {

  const total =
    allLeads.length;

  const newCount =
    allLeads.filter(function (lead) {

      return normalizeValue(
        getField(
          lead,
          [
            "status",
            "lead_status"
          ]
        )
      ) === "new";

    }).length;

  const followupCount =
    allLeads.filter(function (lead) {

      return normalizeValue(
        getField(
          lead,
          [
            "status",
            "lead_status"
          ]
        )
      ) === "follow_up";

    }).length;

  const convertedCount =
    allLeads.filter(function (lead) {

      return normalizeValue(
        getField(
          lead,
          [
            "status",
            "lead_status"
          ]
        )
      ) === "converted";

    }).length;

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
   20. OPEN LEAD
========================================================= */

function openLeadModal(id) {

  const lead =
    allLeads.find(function (item) {

      return String(
        getLeadId(item)
      ) === String(id);

    });

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

  setText(
    "modalMobile",
    getField(
      lead,
      [
        "mobile",
        "mobile_number",
        "phone",
        "phone_number"
      ],
      "—"
    )
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
        "budget_per_person",
        "budget",
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
        "other_requirements",
        "requirements",
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

  if ($("modalStatus")) {
    $("modalStatus").value = status;
  }

  if ($("modalPriority")) {
    $("modalPriority").value = priority;
  }

  const followUp =
    getField(
      lead,
      [
        "follow_up_at",
        "followup_at"
      ],
      ""
    );

  if ($("modalFollowUp")) {
    $("modalFollowUp").value =
      formatDateTimeLocal(followUp);
  }

  const notes =
    getField(
      lead,
      [
        "internal_notes",
        "crm_notes"
      ],
      ""
    );

  if ($("modalNotes")) {
    $("modalNotes").value =
      notes || "";
  }

  setupContactButtons(lead);

  const modal =
    $("leadModal");

  if (modal) {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

}


/* =========================================================
   21. CONTACT BUTTONS
========================================================= */

function setupContactButtons(lead) {

  const mobile =
    getField(
      lead,
      [
        "mobile",
        "mobile_number",
        "phone",
        "phone_number"
      ]
    );

  const callBtn =
    $("modalCallBtn");

  const whatsappBtn =
    $("modalWhatsappBtn");

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

  if (whatsappBtn) {

    if (mobile) {

      let phone =
        String(mobile)
          .replace(/\D/g, "");

      if (phone.length === 10) {
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

}


/* =========================================================
   22. CLOSE MODAL
========================================================= */

function closeLeadModal() {

  const modal =
    $("leadModal");

  if (modal) {
    modal.hidden = true;
  }

  document.body.style.overflow = "";

  selectedLead = null;

}


/* =========================================================
   23. SAVE LEAD
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
      : "";

  const notes =
    $("modalNotes")
      ? $("modalNotes").value.trim()
      : "";

  const updates = {

    status: status,

    priority: priority,

    follow_up_at:
      followUp
        ? new Date(followUp).toISOString()
        : null,

    internal_notes: notes,

    updated_at:
      new Date().toISOString()

  };

  const saveButton =
    $("saveLeadBtn");

  if (saveButton) {

    saveButton.disabled = true;

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

    const index =
      allLeads.findIndex(function (lead) {

        return String(
          getLeadId(lead)
        ) === String(id);

      });

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

      saveButton.disabled = false;

      saveButton.textContent =
        "Save Changes";

    }

  }

}


/* =========================================================
   24. EVENT LISTENERS
========================================================= */

function setupEventListeners() {

  const searchInput =
    $("searchInput");

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      applyFilters
    );

  }

  const statusFilter =
    $("statusFilter");

  if (statusFilter) {

    statusFilter.addEventListener(
      "change",
      applyFilters
    );

  }

  const priorityFilter =
    $("priorityFilter");

  if (priorityFilter) {

    priorityFilter.addEventListener(
      "change",
      applyFilters
    );

  }

  const refreshBtn =
    $("refreshBtn");

  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      async function () {

        refreshBtn.disabled = true;

        refreshBtn.textContent =
          "↻ Loading...";

        await loadLeads();

        refreshBtn.disabled = false;

        refreshBtn.textContent =
          "↻ Refresh";

      }
    );

  }

  const logoutBtn =
    $("logoutBtn");

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      logoutUser
    );

  }

  const tableBody =
    $("leadsTableBody");

  if (tableBody) {

    tableBody.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest(
            "[data-action]"
          );

        if (!button) {
          return;
        }

        if (
          button.dataset.action ===
          "view"
        ) {

          openLeadModal(
            button.dataset.id
          );

        }

      }
    );

  }

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

  const saveLeadBtn =
    $("saveLeadBtn");

  if (saveLeadBtn) {

    saveLeadBtn.addEventListener(
      "click",
      saveLead
    );

  }

  const leadModal =
    $("leadModal");

  if (leadModal) {

    leadModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target === leadModal
        ) {
          closeLeadModal();
        }

      }
    );

  }

  document.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Escape") {

        const modal =
          $("leadModal");

        if (
          modal &&
          !modal.hidden
        ) {
          closeLeadModal();
        }

      }

    }
  );

}


/* =========================================================
   25. HELPERS
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


function normalizeValue(value) {

  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

}


function formatStatus(status) {

  const labels = {

    new: "New",

    contacted: "Contacted",

    follow_up: "Follow-up",

    qualified: "Qualified",

    converted: "Converted",

    closed: "Closed"

  };

  return (
    labels[status] ||
    capitalize(
      String(status)
        .replace(/_/g, " ")
    )
  );

}


function capitalize(value) {

  if (!value) {
    return "";
  }

  return (
    String(value)
      .charAt(0)
      .toUpperCase() +
    String(value)
      .slice(1)
  );

}


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
    function (number) {

      return String(number)
        .padStart(2, "0");

    };

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );

}


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


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


/* =========================================================
   26. ERROR
========================================================= */

function renderError(message) {

  const tableBody =
    $("leadsTableBody");

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = `
    <tr>
      <td colspan="9" class="loading-cell">
        ${escapeHTML(message)}
      </td>
    </tr>
  `;

}


/* =========================================================
   27. TOAST
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
      function () {

        toast.hidden = true;

      },
      3000
    );

}


/* =========================================================
   28. AUTH STATE
========================================================= */

if (
  typeof window !== "undefined"
) {

  window.addEventListener(
    "load",
    function () {

      if (!supabaseClient) {
        return;
      }

      supabaseClient.auth.onAuthStateChange(
        function (event, session) {

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
