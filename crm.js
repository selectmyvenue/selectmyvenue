```javascript
/* =========================================================
   SELECT MY VENUE — CRM
   Fresh CRM JavaScript
========================================================= */


/* =========================================================
   1. SUPABASE CONFIG
   EDIT ONLY THESE 2 VALUES
========================================================= */

const SUPABASE_URL =
  "https://uajqwyoqbbswkfiwosyw.supabase.co/";

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
  typeof window.supabase !== "undefined" &&
  SUPABASE_URL !== "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE" &&
  SUPABASE_ANON_KEY !== "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE"
) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}


/* =========================================================
   4. PAGE ELEMENTS
========================================================= */

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");

const staffName = document.getElementById("staffName");

const leadsTableBody =
  document.getElementById("leadsTableBody");

const emptyState =
  document.getElementById("emptyState");

const searchInput =
  document.getElementById("searchInput");

const statusFilter =
  document.getElementById("statusFilter");

const priorityFilter =
  document.getElementById("priorityFilter");


/* =========================================================
   5. LOGIN
========================================================= */

if (loginForm) {

  loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    event.stopPropagation();

    if (!supabaseClient) {

      showLoginMessage(
        "CRM connection is not configured yet.",
        true
      );

      return;

    }

    const emailInput =
      document.getElementById("email");

    const passwordInput =
      document.getElementById("password");

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    if (!email || !password) {

      showLoginMessage(
        "Please enter email and password.",
        true
      );

      return;

    }

    showLoginMessage("Signing in...", false);

    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {

      console.error("Login error:", error);

      showLoginMessage(
        error.message,
        true
      );

      return;

    }

    if (!data.session) {

      showLoginMessage(
        "Login failed. Please try again.",
        true
      );

      return;

    }

    window.location.href =
      "dashboard.html";

  });

}


/* =========================================================
   6. LOGIN MESSAGE
========================================================= */

function showLoginMessage(message, isError) {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent = message;

  loginMessage.style.display = "block";

  loginMessage.style.opacity = "1";

  if (isError) {
    loginMessage.classList.add("error");
  } else {
    loginMessage.classList.remove("error");
  }

}


/* =========================================================
   7. DASHBOARD SESSION CHECK
========================================================= */

async function checkSession() {

  if (!supabaseClient) {
    return;
  }

  const {
    data,
    error
  } = await supabaseClient.auth.getSession();

  if (error) {

    console.error(
      "Session error:",
      error
    );

    return;

  }

  const session = data.session;

  /*
     If this is dashboard.html and
     there is no logged-in user,
     send user back to login.
  */

  if (
    document.getElementById("leadsTableBody") &&
    !session
  ) {

    window.location.href =
      "login.html";

    return;

  }

  if (
    session &&
    staffName
  ) {

    staffName.textContent =
      session.user.email || "Staff";

  }

}


/* =========================================================
   8. LOGOUT
========================================================= */

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async function () {

      if (!supabaseClient) {
        return;
      }

      const {
        error
      } = await supabaseClient.auth.signOut();

      if (error) {

        console.error(
          "Logout error:",
          error
        );

        return;

      }

      window.location.href =
        "login.html";

    }
  );

}


/* =========================================================
   9. LOAD LEADS
========================================================= */

async function loadLeads() {

  if (!supabaseClient) {

    showTableMessage(
      "CRM connection is not configured."
    );

    return;

  }

  if (!leadsTableBody) {
    return;
  }

  showTableMessage(
    "Loading enquiries..."
  );

  const {
    data,
    error
  } = await supabaseClient
    .from(LEADS_TABLE)
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Lead loading error:",
      error
    );

    showTableMessage(
      "Unable to load enquiries."
    );

    return;

  }

  window.crmLeads =
    data || [];

  updateDashboardStats(
    window.crmLeads
  );

  renderLeads(
    window.crmLeads
  );

}


/* =========================================================
   10. TABLE MESSAGE
========================================================= */

function showTableMessage(message) {

  if (!leadsTableBody) {
    return;
  }

  leadsTableBody.innerHTML = `
    <tr>
      <td colspan="9" class="loading-cell">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;

}


/* =========================================================
   11. RENDER LEADS
========================================================= */

function renderLeads(leads) {

  if (!leadsTableBody) {
    return;
  }

  if (!leads || leads.length === 0) {

    leadsTableBody.innerHTML = "";

    if (emptyState) {
      emptyState.hidden = false;
    }

    return;

  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  leadsTableBody.innerHTML =
    leads.map(function (lead) {

      const customer =
        lead.customer_name ||
        "Unknown Customer";

      const occasion =
        lead.occasion ||
        "—";

      const location =
        lead.location ||
        "—";

      const eventDate =
        lead.event_date ||
        "—";

      const guests =
        lead.guests ||
        "—";

      const budget =
        lead.budget_per_person ||
        "—";

      const status =
        lead.lead_status ||
        lead.status ||
        "new";

      const priority =
        lead.priority ||
        "normal";

      return `
        <tr>

          <td>
            <strong>
              ${escapeHtml(customer)}
            </strong>

            <small>
              ${escapeHtml(
                lead.mobile_number ||
                lead.mobile ||
                ""
              )}
            </small>
          </td>

          <td>
            ${escapeHtml(occasion)}
          </td>

          <td>
            ${escapeHtml(location)}
          </td>

          <td>
            ${escapeHtml(
              formatDate(eventDate)
            )}
          </td>

          <td>
            ${escapeHtml(
              String(guests)
            )}
          </td>

          <td>
            ${escapeHtml(
              String(budget)
            )}
          </td>

          <td>
            <span class="status-badge ${escapeHtml(status)}">
              ${escapeHtml(
                formatLabel(status)
              )}
            </span>
          </td>

          <td>
            <span class="priority-badge ${escapeHtml(priority)}">
              ${escapeHtml(
                formatLabel(priority)
              )}
            </span>
          </td>

          <td>
            <button
              type="button"
              class="view-lead-btn"
              onclick="openLead(${lead.id})"
            >
              View
            </button>
          </td>

        </tr>
      `;

    }).join("");

}


/* =========================================================
   12. DASHBOARD STATS
========================================================= */

function updateDashboardStats(leads) {

  const total =
    leads.length;

  const newCount =
    leads.filter(function (lead) {

      return (
        (lead.lead_status ||
          lead.status ||
          "new") === "new"
      );

    }).length;

  const followupCount =
    leads.filter(function (lead) {

      return (
        (lead.lead_status ||
          lead.status) === "follow_up"
      );

    }).length;

  const convertedCount =
    leads.filter(function (lead) {

      return (
        (lead.lead_status ||
          lead.status) === "converted"
      );

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
   13. SEARCH + FILTER
========================================================= */

function filterLeads() {

  const leads =
    window.crmLeads || [];

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


  const filtered =
    leads.filter(function (lead) {

      const searchable = [

        lead.customer_name,

        lead.mobile_number,

        lead.mobile,

        lead.location,

        lead.email,

        lead.occasion

      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


      const leadStatus =
        lead.lead_status ||
        lead.status ||
        "new";


      const leadPriority =
        lead.priority ||
        "normal";


      const matchesSearch =
        !search ||
        searchable.includes(search);


      const matchesStatus =
        !status ||
        leadStatus === status;


      const matchesPriority =
        !priority ||
        leadPriority === priority;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );

    });


  renderLeads(filtered);

}


/* =========================================================
   14. FILTER EVENTS
========================================================= */

if (searchInput) {

  searchInput.addEventListener(
    "input",
    filterLeads
  );

}

if (statusFilter) {

  statusFilter.addEventListener(
    "change",
    filterLeads
  );

}

if (priorityFilter) {

  priorityFilter.addEventListener(
    "change",
    filterLeads
  );

}


/* =========================================================
   15. REFRESH
========================================================= */

if (refreshBtn) {

  refreshBtn.addEventListener(
    "click",
    loadLeads
  );

}


/* =========================================================
   16. LEAD MODAL
========================================================= */

let currentLead = null;

window.openLead = function (leadId) {

  const leads =
    window.crmLeads || [];

  currentLead =
    leads.find(function (lead) {

      return String(lead.id) ===
        String(leadId);

    });


  if (!currentLead) {
    return;
  }


  setText(
    "modalCustomerName",
    currentLead.customer_name ||
    "Customer"
  );

  setText(
    "modalMobile",
    currentLead.mobile_number ||
    currentLead.mobile ||
    "—"
  );

  setText(
    "modalEmail",
    currentLead.email ||
    "—"
  );

  setText(
    "modalLocation",
    currentLead.location ||
    "—"
  );

  setText(
    "modalOccasion",
    currentLead.occasion ||
    "—"
  );

  setText(
    "modalEventDate",
    formatDate(
      currentLead.event_date
    )
  );

  setText(
    "modalGuests",
    currentLead.guests ||
    "—"
  );

  setText(
    "modalBudget",
    currentLead.budget_per_person ||
    "—"
  );

  setText(
    "modalFood",
    currentLead.food_preference ||
    "—"
  );

  setText(
    "modalRequirements",
    currentLead.other_requirements ||
    currentLead.requirements ||
    "—"
  );


  const modalStatus =
    document.getElementById(
      "modalStatus"
    );

  const modalPriority =
    document.getElementById(
      "modalPriority"
    );

  const modalFollowUp =
    document.getElementById(
      "modalFollowUp"
    );

  const modalNotes =
    document.getElementById(
      "modalNotes"
    );


  if (modalStatus) {

    modalStatus.value =
      currentLead.lead_status ||
      currentLead.status ||
      "new";

  }


  if (modalPriority) {

    modalPriority.value =
      currentLead.priority ||
      "normal";

  }


  if (modalFollowUp) {

    modalFollowUp.value =
      toDateTimeLocal(
        currentLead.follow_up_at
      );

  }


  if (modalNotes) {

    modalNotes.value =
      currentLead.internal_notes ||
      "";

  }


  const modal =
    document.getElementById(
      "leadModal"
    );

  if (modal) {

    modal.hidden = false;

  }


  const callBtn =
    document.getElementById(
      "modalCallBtn"
    );

  const whatsappBtn =
    document.getElementById(
      "modalWhatsappBtn"
    );


  const phone =
    currentLead.mobile_number ||
    currentLead.mobile ||
    "";


  if (callBtn) {

    callBtn.href =
      phone
        ? "tel:" + phone
        : "#";

  }


  if (whatsappBtn) {

    const cleanPhone =
      phone.replace(
        /[^0-9]/g,
        ""
      );

    whatsappBtn.href =
      cleanPhone
        ? "https://wa.me/" +
          cleanPhone
        : "#";

  }

};


/* =========================================================
   17. CLOSE MODAL
========================================================= */

function closeLeadModal() {

  const modal =
    document.getElementById(
      "leadModal"
    );

  if (modal) {

    modal.hidden = true;

  }

  currentLead = null;

}


const closeModalBtn =
  document.getElementById(
    "closeModalBtn"
  );

const cancelModalBtn =
  document.getElementById(
    "cancelModalBtn"
  );


if (closeModalBtn) {

  closeModalBtn.addEventListener(
    "click",
    closeLeadModal
  );

}

if (cancelModalBtn) {

  cancelModalBtn.addEventListener(
    "click",
    closeLeadModal
  );

}


/* =========================================================
   18. SAVE LEAD
========================================================= */

const saveLeadBtn =
  document.getElementById(
    "saveLeadBtn"
  );


if (saveLeadBtn) {

  saveLeadBtn.addEventListener(
    "click",
    saveLeadChanges
  );

}


async function saveLeadChanges() {

  if (
    !currentLead ||
    !supabaseClient
  ) {

    return;

  }


  const status =
    document.getElementById(
      "modalStatus"
    )?.value || "new";


  const priority =
    document.getElementById(
      "modalPriority"
    )?.value || "normal";


  const followUp =
    document.getElementById(
      "modalFollowUp"
    )?.value || null;


  const notes =
    document.getElementById(
      "modalNotes"
    )?.value || "";


  saveLeadBtn.disabled = true;

  saveLeadBtn.textContent =
    "Saving...";


  const {
    error
  } = await supabaseClient
    .from(LEADS_TABLE)
    .update({

      lead_status: status,

      status: status,

      priority: priority,

      follow_up_at:
        followUp
          ? new Date(
              followUp
            ).toISOString()
          : null,

      internal_notes: notes,

      updated_at:
        new Date().toISOString()

    })
    .eq(
      "id",
      currentLead.id
    );


  saveLeadBtn.disabled = false;

  saveLeadBtn.textContent =
    "Save Changes";


  if (error) {

    console.error(
      "Save lead error:",
      error
    );

    alert(
      "Unable to save changes."
    );

    return;

  }


  closeLeadModal();

  await loadLeads();

}


/* =========================================================
   19. HELPERS
========================================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {

    element.textContent =
      value ?? "—";

  }

}


function formatLabel(value) {

  if (!value) {
    return "—";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, function (letter) {
      return letter.toUpperCase();
    });

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


function toDateTimeLocal(value) {

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

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
      offset * 60000
    );

  return localDate
    .toISOString()
    .slice(0, 16);

}


function escapeHtml(value) {

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
   20. START CRM
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    await checkSession();

    /*
       Only load leads when
       dashboard is actually open.
    */

    if (
      document.getElementById(
        "leadsTableBody"
      )
    ) {

      await loadLeads();

    }

  }
);
```
