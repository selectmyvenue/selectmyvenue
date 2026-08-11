/* =========================================================
   SELECT MY VENUE — CRM
   crm.js
   ========================================================= */

/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const SUPABASE_URL = "https://YOUR-SUPABASE-URL.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-SUPABASE-ANON-KEY";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let allLeads = [];
let filteredLeads = [];
let currentLead = null;
let currentRemarkLead = null;
let currentUser = null;


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function showToast(message, type = "success") {
  const toast = $("toast");
  const toastMessage = $("toastMessage");

  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;

  toast.classList.remove("error", "success");

  toast.classList.add(type);

  toast.hidden = false;

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2500);
}


/* =========================================================
   FORMATTERS
   ========================================================= */

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(dateValue);
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


function formatDateInput(value) {
  if (!value) return "";

  const str = String(value);

  if (str.includes("T")) {
    return str.split("T")[0];
  }

  return str.substring(0, 10);
}


function formatDateTimeInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (n) => String(n).padStart(2, "0");

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


function formatBudget(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return escapeHtml(value);
  }

  return "₹" + number.toLocaleString("en-IN");
}


function normalizePhone(phone) {
  if (!phone) return "";

  return String(phone)
    .replace(/[^\d+]/g, "")
    .replace(/^0(?=\d{10}$)/, "+91");
}


/* =========================================================
   STATUS / PRIORITY
   ========================================================= */

const STATUS_OPTIONS = [
  ["new", "New Lead"],
  ["not_pick", "Not Pick"],
  ["call_back", "Call Back"],
  ["call_disconnected", "Call Disconnected"],
  ["detail_shared", "Detail Shared"],
  ["interested", "Interested"],
  ["not_interested", "Not Interested"],
  ["wrong_number", "Wrong Number"],
  ["qualified", "Qualified"],
  ["converted", "Converted"],
  ["closed", "Closed"]
];


const PRIORITY_OPTIONS = [
  ["urgent", "Urgent"],
  ["high", "High"],
  ["normal", "Normal"],
  ["low", "Low"]
];


function buildStatusOptions(selected) {
  return STATUS_OPTIONS
    .map(([value, label]) => {
      return `
        <option value="${escapeHtml(value)}"
          ${value === selected ? "selected" : ""}>
          ${escapeHtml(label)}
        </option>
      `;
    })
    .join("");
}


function buildPriorityOptions(selected) {
  return PRIORITY_OPTIONS
    .map(([value, label]) => {
      return `
        <option value="${escapeHtml(value)}"
          ${value === selected ? "selected" : ""}>
          ${escapeHtml(label)}
        </option>
      `;
    })
    .join("");
}


/* =========================================================
   AUTH
   ========================================================= */

async function checkAuth() {
  try {
    const {
      data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
      window.location.href = "login.html";
      return null;
    }

    currentUser = user;

    const staffName = $("staffName");

    if (staffName) {
      staffName.textContent =
        user.email || "Staff";
    }

    return user;

  } catch (error) {
    console.error("Auth error:", error);

    window.location.href = "login.html";

    return null;
  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {
  try {
    await supabaseClient.auth.signOut();
  } catch (error) {
    console.error("Logout error:", error);
  }

  window.location.href = "login.html";
}


/* =========================================================
   LOAD LEADS
   ========================================================= */

async function loadLeads() {
  const tbody = $("leadsTableBody");
  const emptyState = $("emptyState");

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="loading-cell">
          Loading enquiries...
        </td>
      </tr>
    `;
  }

  try {

    /*
      IMPORTANT:
      The CRM uses the enquiries table.
    */

    const {
      data,
      error
    } = await supabaseClient
      .from("enquiries")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      throw error;
    }

    allLeads = Array.isArray(data)
      ? data
      : [];

    updateStatistics();

    applyFilters();

  } catch (error) {

    console.error(
      "Unable to load enquiries:",
      error
    );

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="12" class="loading-cell">
            Unable to load enquiries.
          </td>
        </tr>
      `;
    }

    showToast(
      "Unable to load enquiries",
      "error"
    );
  }
}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

  const total =
    allLeads.length;

  const newCount =
    allLeads.filter(
      lead => lead.status === "new"
    ).length;

  const followupCount =
    allLeads.filter(
      lead =>
        lead.status === "follow_up" ||
        lead.status === "call_back"
    ).length;

  const convertedCount =
    allLeads.filter(
      lead => lead.status === "converted"
    ).length;


  if ($("totalLeads")) {
    $("totalLeads").textContent = total;
  }

  if ($("newLeads")) {
    $("newLeads").textContent = newCount;
  }

  if ($("followupLeads")) {
    $("followupLeads").textContent =
      followupCount;
  }

  if ($("convertedLeads")) {
    $("convertedLeads").textContent =
      convertedCount;
  }
}


/* =========================================================
   FILTERING
   ========================================================= */

function applyFilters() {

  const search =
    ($("searchInput")?.value || "")
      .trim()
      .toLowerCase();

  const status =
    $("statusFilter")?.value || "";

  const priority =
    $("priorityFilter")?.value || "";


  filteredLeads =
    allLeads.filter(lead => {

      const searchable = [
        lead.customer_name,
        lead.name,
        lead.mobile,
        lead.phone,
        lead.email,
        lead.location,
        lead.occasion,
        lead.event,
        lead.remark,
        lead.contact_remark,
        lead.notes
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


      const searchMatch =
        !search ||
        searchable.includes(search);


      const statusMatch =
        !status ||
        lead.status === status;


      const priorityMatch =
        !priority ||
        lead.priority === priority;


      return (
        searchMatch &&
        statusMatch &&
        priorityMatch
      );
    });


  renderLeads();
}


/* =========================================================
   RENDER TABLE
   ========================================================= */

function renderLeads() {

  const tbody =
    $("leadsTableBody");

  const emptyState =
    $("emptyState");

  if (!tbody) return;


  if (!filteredLeads.length) {

    tbody.innerHTML = "";

    if (emptyState) {
      emptyState.hidden = false;
    }

    return;
  }


  if (emptyState) {
    emptyState.hidden = true;
  }


  tbody.innerHTML =
    filteredLeads
      .map(renderLeadRow)
      .join("");
}


/* =========================================================
   LEAD ROW
   ========================================================= */

function renderLeadRow(lead) {

  const id = lead.id;

  const customerName =
    lead.customer_name ??
    lead.name ??
    "";

  const phone =
    lead.mobile ??
    lead.phone ??
    "";

  const event =
    lead.occasion ??
    lead.event ??
    "";

  const location =
    lead.location ??
    "";

  const eventDate =
    lead.event_date ??
    lead.date ??
    null;

  const guests =
    lead.guests ??
    lead.guest_count ??
    "";

  const budget =
    lead.budget ??
    lead.budget_per_person ??
    "";

  const status =
    lead.status ||
    "new";

  const priority =
    lead.priority ||
    "normal";

  const remark =
    lead.contact_remark ??
    lead.remark ??
    "";


  const safeId =
    escapeHtml(id);


  return `
    <tr
      class="lead-row"
      data-lead-id="${safeId}"
    >

      <!-- CUSTOMER -->
      <td class="editable-cell customer-cell">

        <input
          class="table-edit-input customer-edit"
          data-field="customer_name"
          data-id="${safeId}"
          value="${escapeHtml(customerName)}"
          title="Edit customer name"
          type="text"
        >

        ${
          lead.email
            ? `
              <small class="customer-email">
                ${escapeHtml(lead.email)}
              </small>
            `
            : ""
        }

      </td>


      <!-- PHONE -->
      <td class="editable-cell phone-cell">

        <input
          class="table-edit-input"
          data-field="mobile"
          data-id="${safeId}"
          value="${escapeHtml(phone)}"
          title="Edit phone number"
          type="tel"
        >

      </td>


      <!-- EVENT -->
      <td class="editable-cell">

        <input
          class="table-edit-input"
          data-field="occasion"
          data-id="${safeId}"
          value="${escapeHtml(event)}"
          title="Edit event"
          type="text"
        >

      </td>


      <!-- LOCATION -->
      <td class="editable-cell">

        <input
          class="table-edit-input"
          data-field="location"
          data-id="${safeId}"
          value="${escapeHtml(location)}"
          title="Edit location"
          type="text"
        >

      </td>


      <!-- DATE -->
      <td class="editable-cell">

        <input
          class="table-edit-input table-date-input"
          data-field="event_date"
          data-id="${safeId}"
          value="${escapeHtml(formatDateInput(eventDate))}"
          title="Edit event date"
          type="date"
        >

      </td>


      <!-- GUESTS -->
      <td class="editable-cell">

        <input
          class="table-edit-input number-edit"
          data-field="guests"
          data-id="${safeId}"
          value="${escapeHtml(guests)}"
          title="Edit guest count"
          type="number"
          min="1"
        >

      </td>


      <!-- BUDGET -->
      <td class="editable-cell">

        <input
          class="table-edit-input number-edit"
          data-field="budget"
          data-id="${safeId}"
          value="${escapeHtml(budget)}"
          title="Edit budget per person"
          type="number"
          min="0"
        >

      </td>


      <!-- STATUS -->
      <td>

        <select
          class="table-edit-select"
          data-field="status"
          data-id="${safeId}"
        >

          ${buildStatusOptions(status)}

        </select>

      </td>


      <!-- PRIORITY -->
      <td>

        <select
          class="table-edit-select"
          data-field="priority"
          data-id="${safeId}"
        >

          ${buildPriorityOptions(priority)}

        </select>

      </td>


      <!-- REMARK -->
      <td class="remark-cell">

        <div class="remark-wrapper">

          <span
            class="remark-text"
            title="${escapeHtml(remark)}"
          >
            ${
              remark
                ? escapeHtml(remark)
                : "—"
            }
          </span>

          <button
            type="button"
            class="remark-edit-btn"
            data-action="remark"
            data-id="${safeId}"
            title="Edit remark"
          >
            ✎
          </button>

        </div>

      </td>


      <!-- CONTACT -->
      <td>

        <div class="contact-actions">

          ${
            phone
              ? `
                <a
                  href="tel:${escapeHtml(normalizePhone(phone))}"
                  class="contact-icon call-icon"
                  title="Call customer"
                >
                  ☎
                </a>
              `
              : ""
          }

          ${
            phone
              ? `
                <a
                  href="https://wa.me/${escapeHtml(
                    normalizePhone(phone)
                      .replace("+", "")
                  )}"
                  target="_blank"
                  rel="noopener"
                  class="contact-icon whatsapp-icon"
                  title="WhatsApp customer"
                >
                  ◉
                </a>
              `
              : ""
          }

        </div>

      </td>


      <!-- ACTION -->
      <td>

        <button
          type="button"
          class="view-btn"
          data-action="view"
          data-id="${safeId}"
        >
          View
        </button>

      </td>

    </tr>
  `;
}


/* =========================================================
   UPDATE LEAD FIELD
   ========================================================= */

async function updateLeadField(
  leadId,
  field,
  value,
  inputElement
) {

  if (!leadId || !field) {
    return;
  }


  /*
    Keep database field names consistent.
  */

  const updateData = {};


  if (field === "customer_name") {
    updateData.customer_name =
      value.trim();
  }

  else if (field === "mobile") {
    updateData.mobile =
      value.trim();
  }

  else if (field === "occasion") {
    updateData.occasion =
      value.trim();
  }

  else if (field === "location") {
    updateData.location =
      value.trim();
  }

  else if (field === "event_date") {
    updateData.event_date =
      value || null;
  }

  else if (field === "guests") {
    updateData.guests =
      value === ""
        ? null
        : Number(value);
  }

  else if (field === "budget") {
    updateData.budget =
      value === ""
        ? null
        : Number(value);
  }

  else if (field === "status") {
    updateData.status =
      value;
  }

  else if (field === "priority") {
    updateData.priority =
      value;
  }

  else if (field === "remark") {
    updateData.contact_remark =
      value.trim();
  }

  else {
    return;
  }


  try {

    inputElement?.classList.add(
      "saving"
    );


    const {
      error
    } = await supabaseClient
      .from("enquiries")
      .update(updateData)
      .eq("id", leadId);


    if (error) {
      throw error;
    }


    /*
      Update local copy.
    */

    const index =
      allLeads.findIndex(
        lead =>
          String(lead.id) ===
          String(leadId)
      );


    if (index !== -1) {

      Object.assign(
        allLeads[index],
        updateData
      );
    }


    updateStatistics();


    inputElement?.classList.remove(
      "saving"
    );

    inputElement?.classList.add(
      "saved"
    );


    setTimeout(() => {
      inputElement?.classList.remove(
        "saved"
      );
    }, 900);


    showToast(
      "Lead updated successfully"
    );


  } catch (error) {

    console.error(
      "Update failed:",
      error
    );


    inputElement?.classList.remove(
      "saving"
    );


    inputElement?.classList.add(
      "save-error"
    );


    setTimeout(() => {
      inputElement?.classList.remove(
        "save-error"
      );
    }, 1500);


    showToast(
      "Unable to save changes",
      "error"
    );
  }
}


/* =========================================================
   TABLE EDIT HANDLERS
   ========================================================= */

function setupTableEditing() {

  const tbody =
    $("leadsTableBody");

  if (!tbody) return;


  /*
    INPUTS
  */

  tbody.addEventListener(
    "change",
    async (event) => {

      const target =
        event.target;


      if (
        !target.matches(
          ".table-edit-input"
        ) &&
        !target.matches(
          ".table-edit-select"
        )
      ) {
        return;
      }


      const leadId =
        target.dataset.id;

      const field =
        target.dataset.field;


      await updateLeadField(
        leadId,
        field,
        target.value,
        target
      );
    }
  );


  /*
    TEXT INPUTS:
    Save when user leaves field.
  */

  tbody.addEventListener(
    "blur",
    async (event) => {

      const target =
        event.target;


      if (
        !target.matches(
          ".table-edit-input"
        )
      ) {
        return;
      }


      if (
        target.dataset.lastSavedValue ===
        target.value
      ) {
        return;
      }


      target.dataset.lastSavedValue =
        target.value;


      await updateLeadField(
        target.dataset.id,
        target.dataset.field,
        target.value,
        target
      );

    },
    true
  );


  /*
    Keep a starting value.
  */

  tbody.addEventListener(
    "focus",
    (event) => {

      const target =
        event.target;


      if (
        target.matches(
          ".table-edit-input"
        )
      ) {

        target.dataset.lastSavedValue =
          target.value;
      }
    },
    true
  );


  /*
    BUTTONS
  */

  tbody.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "[data-action]"
        );


      if (!button) return;


      const action =
        button.dataset.action;

      const id =
        button.dataset.id;


      if (action === "view") {

        openLeadModal(id);

      }


      if (action === "remark") {

        openRemarkModal(id);

      }

    }
  );
}


/* =========================================================
   VIEW / EDIT LEAD MODAL
   ========================================================= */

function openLeadModal(id) {

  const lead =
    allLeads.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!lead) {
    showToast(
      "Lead not found",
      "error"
    );
    return;
  }


  currentLead = lead;


  const customerName =
    lead.customer_name ??
    lead.name ??
    "";


  $("modalCustomerName").textContent =
    customerName || "Customer";


  $("modalCustomerNameInput").value =
    customerName;


  $("modalMobileInput").value =
    lead.mobile ??
    lead.phone ??
    "";


  $("modalEmailInput").value =
    lead.email ?? "";


  $("modalLocationInput").value =
    lead.location ?? "";


  $("modalOccasionInput").value =
    lead.occasion ??
    lead.event ??
    "";


  $("modalEventDateInput").value =
    formatDateInput(
      lead.event_date ??
      lead.date
    );


  $("modalGuestsInput").value =
    lead.guests ??
    lead.guest_count ??
    "";


  $("modalBudgetInput").value =
    lead.budget ??
    lead.budget_per_person ??
    "";


  $("modalFoodInput").value =
    lead.food_preference ??
    lead.food ??
    "";


  $("modalRequirementsInput").value =
    lead.requirements ??
    lead.other_requirements ??
    "";


  $("modalStatus").value =
    lead.status ||
    "new";


  $("modalPriority").value =
    lead.priority ||
    "normal";


  $("modalFollowUp").value =
    formatDateTimeInput(
      lead.follow_up_at ??
      lead.follow_up
    );


  $("modalContactCount").textContent =
    lead.contact_count ??
    0;


  $("modalLastContacted").textContent =
    lead.last_contacted_at
      ? formatDate(
          lead.last_contacted_at
        )
      : "Never";


  $("modalContactRemark").value =
    lead.contact_remark ??
    lead.remark ??
    "";


  $("modalNotes").value =
    lead.notes ?? "";


  setupModalContactLinks(
    lead.mobile ??
    lead.phone ??
    ""
  );


  const modal =
    $("leadModal");


  if (modal) {
    modal.hidden = false;

    document.body.classList.add(
      "modal-open"
    );
  }
}


/* =========================================================
   MODAL CONTACT LINKS
   ========================================================= */

function setupModalContactLinks(phone) {

  const callBtn =
    $("modalCallBtn");

  const whatsappBtn =
    $("modalWhatsappBtn");


  const normalized =
    normalizePhone(phone);


  if (callBtn) {

    callBtn.href =
      normalized
        ? `tel:${normalized}`
        : "#";
  }


  if (whatsappBtn) {

    whatsappBtn.href =
      normalized
        ? `https://wa.me/${normalized.replace(
            "+",
            ""
          )}`
        : "#";
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

  currentLead = null;

  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================================================
   SAVE FULL LEAD FROM MODAL
   ========================================================= */

async function saveLeadFromModal() {

  if (!currentLead) {
    return;
  }


  const id =
    currentLead.id;


  const customerName =
    $("modalCustomerNameInput").value.trim();


  const mobile =
    $("modalMobileInput").value.trim();


  const email =
    $("modalEmailInput").value.trim();


  const location =
    $("modalLocationInput").value.trim();


  const occasion =
    $("modalOccasionInput").value.trim();


  const eventDate =
    $("modalEventDateInput").value ||
    null;


  const guestsValue =
    $("modalGuestsInput").value;


  const budgetValue =
    $("modalBudgetInput").value;


  const food =
    $("modalFoodInput").value;


  const requirements =
    $("modalRequirementsInput").value.trim();


  const status =
    $("modalStatus").value;


  const priority =
    $("modalPriority").value;


  const followUp =
    $("modalFollowUp").value;


  const contactRemark =
    $("modalContactRemark").value.trim();


  const notes =
    $("modalNotes").value.trim();


  const updateData = {

    customer_name:
      customerName,

    mobile:
      mobile,

    email:
      email,

    location:
      location,

    occasion:
      occasion,

    event_date:
      eventDate,

    guests:
      guestsValue === ""
        ? null
        : Number(guestsValue),

    budget:
      budgetValue === ""
        ? null
        : Number(budgetValue),

    food_preference:
      food,

    requirements:
      requirements,

    status:
      status,

    priority:
      priority,

    follow_up_at:
      followUp
        ? new Date(
            followUp
          ).toISOString()
        : null,

    contact_remark:
      contactRemark,

    notes:
      notes
  };


  const saveBtn =
    $("saveLeadBtn");


  try {

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent =
        "Saving...";
    }


    const {
      error
    } = await supabaseClient
      .from("enquiries")
      .update(updateData)
      .eq("id", id);


    if (error) {
      throw error;
    }


    const index =
      allLeads.findIndex(
        lead =>
          String(lead.id) ===
          String(id)
      );


    if (index !== -1) {

      Object.assign(
        allLeads[index],
        updateData
      );

      currentLead =
        allLeads[index];
    }


    updateStatistics();

    applyFilters();

    closeLeadModal();


    showToast(
      "Lead saved successfully"
    );


  } catch (error) {

    console.error(
      "Modal save failed:",
      error
    );


    showToast(
      "Unable to save lead",
      "error"
    );


  } finally {

    if (saveBtn) {

      saveBtn.disabled = false;

      saveBtn.textContent =
        "Save Changes";
    }
  }
}


/* =========================================================
   REMARK MODAL
   ========================================================= */

function openRemarkModal(id) {

  const lead =
    allLeads.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!lead) {
    showToast(
      "Lead not found",
      "error"
    );
    return;
  }


  currentRemarkLead =
    lead;


  $("remarkCustomerName").textContent =
    lead.customer_name ??
    lead.name ??
    "Customer";


  $("remarkInput").value =
    lead.contact_remark ??
    lead.remark ??
    "";


  $("remarkMessage").textContent =
    "";


  const modal =
    $("remarkModal");


  if (modal) {
    modal.hidden = false;

    document.body.classList.add(
      "modal-open"
    );
  }
}


/* =========================================================
   CLOSE REMARK MODAL
   ========================================================= */

function closeRemarkModal() {

  const modal =
    $("remarkModal");

  if (modal) {
    modal.hidden = true;
  }

  currentRemarkLead = null;

  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================================================
   SAVE REMARK
   ========================================================= */

async function saveRemark() {

  if (!currentRemarkLead) {
    return;
  }


  const id =
    currentRemarkLead.id;


  const remark =
    $("remarkInput").value.trim();


  const saveBtn =
    $("saveRemarkBtn");


  try {

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent =
        "Saving...";
    }


    const {
      error
    } = await supabaseClient
      .from("enquiries")
      .update({
        contact_remark:
          remark
      })
      .eq("id", id);


    if (error) {
      throw error;
    }


    const index =
      allLeads.findIndex(
        lead =>
          String(lead.id) ===
          String(id)
      );


    if (index !== -1) {

      allLeads[index].contact_remark =
        remark;

      currentRemarkLead =
        allLeads[index];
    }


    applyFilters();

    closeRemarkModal();


    showToast(
      "Remark saved successfully"
    );


  } catch (error) {

    console.error(
      "Remark save failed:",
      error
    );


    $("remarkMessage").textContent =
      "Unable to save remark.";


    showToast(
      "Unable to save remark",
      "error"
    );


  } finally {

    if (saveBtn) {

      saveBtn.disabled = false;

      saveBtn.textContent =
        "Save Remark";
    }
  }
}


/* =========================================================
   ADD ENQUIRY MODAL
   ========================================================= */

function openAddEnquiryModal() {

  const modal =
    $("addEnquiryModal");

  if (!modal) return;


  clearAddEnquiryForm();


  modal.hidden = false;

  document.body.classList.add(
    "modal-open"
  );
}


/* =========================================================
   CLEAR ADD FORM
   ========================================================= */

function clearAddEnquiryForm() {

  const fields = [
    "newCustomerName",
    "newMobile",
    "newEmail",
    "newLocation",
    "newOccasion",
    "newEventDate",
    "newGuests",
    "newBudget",
    "newRequirements",
    "newContactRemark",
    "newNotes",
    "newFollowUp"
  ];


  fields.forEach(id => {

    const element =
      $(id);

    if (element) {
      element.value = "";
    }
  });


  if ($("newFood")) {
    $("newFood").value = "";
  }


  if ($("newSource")) {
    $("newSource").value =
      "Website";
  }


  if ($("newStatus")) {
    $("newStatus").value =
      "new";
  }


  if ($("newPriority")) {
    $("newPriority").value =
      "normal";
  }


  if ($("addEnquiryMessage")) {
    $("addEnquiryMessage")
      .textContent = "";
  }
}


/* =========================================================
   CLOSE ADD ENQUIRY
   ========================================================= */

function closeAddEnquiryModal() {

  const modal =
    $("addEnquiryModal");

  if (modal) {
    modal.hidden = true;
  }

  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================================================
   SAVE NEW ENQUIRY
   ========================================================= */

async function saveNewEnquiry() {

  const customerName =
    $("newCustomerName")?.value.trim();


  const mobile =
    $("newMobile")?.value.trim();


  if (!customerName) {

    $("addEnquiryMessage").textContent =
      "Customer name is required.";

    return;
  }


  if (!mobile) {

    $("addEnquiryMessage").textContent =
      "Mobile number is required.";

    return;
  }


  const saveBtn =
    $("saveNewEnquiryBtn");


  const insertData = {

    customer_name:
      customerName,

    mobile:
      mobile,

    email:
      $("newEmail")?.value.trim() || null,

    location:
      $("newLocation")?.value.trim() || null,

    occasion:
      $("newOccasion")?.value.trim() || null,

    event_date:
      $("newEventDate")?.value || null,

    guests:
      $("newGuests")?.value
        ? Number(
            $("newGuests").value
          )
        : null,

    budget:
      $("newBudget")?.value
        ? Number(
            $("newBudget").value
          )
        : null,

    food_preference:
      $("newFood")?.value || null,

    source:
      $("newSource")?.value || "Website",

    status:
      $("newStatus")?.value || "new",

    priority:
      $("newPriority")?.value ||
      "normal",

    follow_up_at:
      $("newFollowUp")?.value
        ? new Date(
            $("newFollowUp").value
          ).toISOString()
        : null,

    requirements:
      $("newRequirements")?.value.trim() ||
      null,

    contact_remark:
      $("newContactRemark")?.value.trim() ||
      null,

    notes:
      $("newNotes")?.value.trim() ||
      null
  };


  try {

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent =
        "Saving...";
    }


    const {
      data,
      error
    } = await supabaseClient
      .from("enquiries")
      .insert(insertData)
      .select()
      .single();


    if (error) {
      throw error;
    }


    if (data) {
      allLeads.unshift(data);
    }


    updateStatistics();

    applyFilters();

    closeAddEnquiryModal();


    showToast(
      "Enquiry added successfully"
    );


  } catch (error) {

    console.error(
      "Add enquiry failed:",
      error
    );


    if ($("addEnquiryMessage")) {
      $("addEnquiryMessage").textContent =
        error.message ||
        "Unable to save enquiry.";
    }


    showToast(
      "Unable to add enquiry",
      "error"
    );


  } finally {

    if (saveBtn) {

      saveBtn.disabled = false;

      saveBtn.textContent =
        "Save Enquiry";
    }
  }
}


/* =========================================================
   STAT CARD FILTERS
   ========================================================= */

function setupStatTabs() {

  document
    .querySelectorAll(
      ".stat-tab"
    )
    .forEach(tab => {

      tab.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".stat-tab"
            )
            .forEach(item => {
              item.classList.remove(
                "active"
              );
            });


          tab.classList.add(
            "active"
          );


          const status =
            tab.dataset.status || "";


          if ($("statusFilter")) {

            $("statusFilter").value =
              status;
          }


          applyFilters();
        }
      );
    });
}


/* =========================================================
   SEARCH + FILTER EVENTS
   ========================================================= */

function setupFilters() {

  $("searchInput")
    ?.addEventListener(
      "input",
      applyFilters
    );


  $("statusFilter")
    ?.addEventListener(
      "change",
      applyFilters
    );


  $("priorityFilter")
    ?.addEventListener(
      "change",
      applyFilters
    );
}


/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModalEvents() {

  $("closeModalBtn")
    ?.addEventListener(
      "click",
      closeLeadModal
    );


  $("cancelModalBtn")
    ?.addEventListener(
      "click",
      closeLeadModal
    );


  $("saveLeadBtn")
    ?.addEventListener(
      "click",
      saveLeadFromModal
    );


  $("closeRemarkModalBtn")
    ?.addEventListener(
      "click",
      closeRemarkModal
    );


  $("cancelRemarkBtn")
    ?.addEventListener(
      "click",
      closeRemarkModal
    );


  $("saveRemarkBtn")
    ?.addEventListener(
      "click",
      saveRemark
    );


  $("closeAddEnquiryBtn")
    ?.addEventListener(
      "click",
      closeAddEnquiryModal
    );


  $("cancelAddEnquiryBtn")
    ?.addEventListener(
      "click",
      closeAddEnquiryModal
    );


  $("saveNewEnquiryBtn")
    ?.addEventListener(
      "click",
      saveNewEnquiry
    );


  /*
    Close modal by clicking outside.
  */

  $("leadModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("leadModal")
        ) {
          closeLeadModal();
        }
      }
    );


  $("remarkModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("remarkModal")
        ) {
          closeRemarkModal();
        }
      }
    );


  $("addEnquiryModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("addEnquiryModal")
        ) {
          closeAddEnquiryModal();
        }
      }
    );


  /*
    ESC closes active modal.
  */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Escape"
      ) {
        return;
      }


      if (
        $("leadModal") &&
        !$("leadModal").hidden
      ) {
        closeLeadModal();
        return;
      }


      if (
        $("remarkModal") &&
        !$("remarkModal").hidden
      ) {
        closeRemarkModal();
        return;
      }


      if (
        $("addEnquiryModal") &&
        !$("addEnquiryModal").hidden
      ) {
        closeAddEnquiryModal();
      }

    }
  );
}


/* =========================================================
   HEADER BUTTONS
   ========================================================= */

function setupHeaderEvents() {

  $("logoutBtn")
    ?.addEventListener(
      "click",
      logout
    );


  $("refreshBtn")
    ?.addEventListener(
      "click",
      async () => {

        await loadLeads();

        showToast(
          "CRM refreshed"
        );
      }
    );


  $("addEnquiryBtn")
    ?.addEventListener(
      "click",
      openAddEnquiryModal
    );
}


/* =========================================================
   KEYBOARD SUPPORT FOR TABLE
   ========================================================= */

function setupKeyboardSupport() {

  const tbody =
    $("leadsTableBody");

  if (!tbody) return;


  tbody.addEventListener(
    "keydown",
    event => {

      const target =
        event.target;


      if (
        !target.matches(
          ".table-edit-input"
        )
      ) {
        return;
      }


      /*
        ENTER:
        Save and move out of field.
      */

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        target.blur();
      }


      /*
        ESC:
        Restore original value.
      */

      if (
        event.key === "Escape"
      ) {

        const leadId =
          target.dataset.id;

        const field =
          target.dataset.field;


        const lead =
          allLeads.find(
            item =>
              String(item.id) ===
              String(leadId)
          );


        if (!lead) return;


        let original = "";


        if (
          field ===
          "customer_name"
        ) {
          original =
            lead.customer_name || "";
        }

        else if (
          field === "mobile"
        ) {
          original =
            lead.mobile ||
            lead.phone ||
            "";
        }

        else if (
          field === "occasion"
        ) {
          original =
            lead.occasion ||
            lead.event ||
            "";
        }

        else if (
          field === "location"
        ) {
          original =
            lead.location || "";
        }

        else if (
          field === "event_date"
        ) {
          original =
            formatDateInput(
              lead.event_date ||
              lead.date
            );
        }

        else if (
          field === "guests"
        ) {
          original =
            lead.guests ??
            "";
        }

        else if (
          field === "budget"
        ) {
          original =
            lead.budget ??
            "";
        }


        target.value =
          original;
      }
    }
  );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initCRM() {

  try {

    const user =
      await checkAuth();


    if (!user) {
      return;
    }


    setupTableEditing();

    setupFilters();

    setupStatTabs();

    setupModalEvents();

    setupHeaderEvents();

    setupKeyboardSupport();


    await loadLeads();


  } catch (error) {

    console.error(
      "CRM initialization error:",
      error
    );

    showToast(
      "CRM failed to initialize",
      "error"
    );
  }
}


/* =========================================================
   START
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initCRM
  );

} else {

  initCRM();
}
