/* =========================================================
   SELECT MY VENUE — CRM
   crm.js
   ========================================================= */


/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const SUPABASE_URL =
  "https://uajqwyoqbbswkfiwosyw.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";

const supabaseClient =
  window.supabase.createClient(
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
   DOM HELPER
   ========================================================= */

const $ = (id) =>
  document.getElementById(id);


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  message,
  type = "success"
) {

  const toast =
    $("toast");

  const toastMessage =
    $("toastMessage");

  if (
    !toast ||
    !toastMessage
  ) {
    return;
  }

  toastMessage.textContent =
    message;

  toast.classList.remove(
    "error",
    "success"
  );

  toast.classList.add(
    type
  );

  toast.hidden = false;

  clearTimeout(
    window.__toastTimer
  );

  window.__toastTimer =
    setTimeout(() => {

      toast.hidden = true;

    }, 2500);
}


/* =========================================================
   FORMAT DATE
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
    return escapeHtml(value);
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}


/* =========================================================
   DATE INPUT FORMAT
   ========================================================= */

function formatDateInput(value) {

  if (!value) {
    return "";
  }

  const stringValue =
    String(value);

  if (
    stringValue.includes("T")
  ) {
    return stringValue.split("T")[0];
  }

  return stringValue.substring(
    0,
    10
  );
}


/* =========================================================
   DATETIME LOCAL INPUT FORMAT
   ========================================================= */

function formatDateTimeInput(value) {

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
   BUDGET FORMAT
   ========================================================= */

function formatBudget(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number =
    Number(value);

  if (
    Number.isNaN(number)
  ) {
    return escapeHtml(value);
  }

  return (
    "₹" +
    number.toLocaleString(
      "en-IN"
    )
  );
}


/* =========================================================
   PHONE NORMALIZATION
   ========================================================= */

function normalizePhone(phone) {

  if (!phone) {
    return "";
  }

  let value =
    String(phone)
      .trim()
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "");

  /* Already +91 */

  if (
    value.startsWith("+91")
  ) {

    return (
      "+91" +
      value
        .substring(3)
        .replace(/\D/g, "")
    );
  }

  /* Remove everything except numbers */

  value =
    value.replace(
      /\D/g,
      ""
    );

  /* Indian 10 digit number */

  if (
    value.length === 10
  ) {

    return "+91" + value;
  }

  /* Indian number beginning with 0 */

  if (
    value.length === 11 &&
    value.startsWith("0")
  ) {

    return (
      "+91" +
      value.substring(1)
    );
  }

  return value;
}


/* =========================================================
   STATUS OPTIONS
   ========================================================= */

const STATUS_OPTIONS = [

  ["new", "New Lead"],

  ["not_picked", "Not Picked"],

  ["call_back", "Call Back"],

  [
    "call_disconnected",
    "Call Disconnected"
  ],

  [
    "detail_shared",
    "Detail Shared"
  ],

  [
    "interested",
    "Interested"
  ],

  [
    "not_interested",
    "Not Interested"
  ],

  [
    "wrong_number",
    "Wrong Number"
  ],

  [
    "qualified",
    "Qualified"
  ],

  [
    "converted",
    "Converted"
  ],

  [
    "closed",
    "Closed"
  ]

];


/* =========================================================
   PRIORITY OPTIONS
   ========================================================= */

const PRIORITY_OPTIONS = [

  ["urgent", "Urgent"],

  ["high", "High"],

  ["normal", "Normal"],

  ["low", "Low"]

];


/* =========================================================
   BUILD STATUS OPTIONS
   ========================================================= */

function buildStatusOptions(
  selected
) {

  return STATUS_OPTIONS
    .map(
      ([value, label]) => {

        return `
          <option
            value="${escapeHtml(value)}"
            ${
              value === selected
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(label)}
          </option>
        `;
      }
    )
    .join("");
}


/* =========================================================
   BUILD PRIORITY OPTIONS
   ========================================================= */

function buildPriorityOptions(
  selected
) {

  return PRIORITY_OPTIONS
    .map(
      ([value, label]) => {

        return `
          <option
            value="${escapeHtml(value)}"
            ${
              value === selected
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(label)}
          </option>
        `;
      }
    )
    .join("");
}


/* =========================================================
   AUTH CHECK
   ========================================================= */

async function checkAuth() {

  try {

    const {
      data: {
        user
      }
    } =
      await supabaseClient
        .auth
        .getUser();

    if (!user) {

      window.location.href =
        "login.html";

      return null;
    }

    currentUser =
      user;

    const staffName =
      $("staffName");

    if (staffName) {

      staffName.textContent =
        user.email ||
        "Staff";
    }

    return user;

  } catch (error) {

    console.error(
      "Auth error:",
      error
    );

    window.location.href =
      "login.html";

    return null;
  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

  try {

    await supabaseClient
      .auth
      .signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );
  }

  window.location.href =
    "login.html";
}


/* =========================================================
   LOAD LEADS
   IMPORTANT:
   ACTUAL SUPABASE TABLE = customer_enquiries
   ========================================================= */

async function loadLeads() {

  const tbody =
    $("leadsTableBody");

  const emptyState =
    $("emptyState");

  if (tbody) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="12"
          class="loading-cell"
        >
          Loading enquiries...
        </td>
      </tr>
    `;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("customer_enquiries")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    allLeads =
      Array.isArray(data)
        ? data
        : [];

    console.log(
      "CRM enquiries loaded:",
      allLeads
    );

    updateStatistics();

    applyFilters();

  } catch (error) {

    console.error(
      "Unable to load customer_enquiries:",
      error
    );

    if (tbody) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="12"
            class="loading-cell"
          >
            Unable to load enquiries.
            <br>
            <small>
              ${escapeHtml(
                error.message ||
                "Database error"
              )}
            </small>
          </td>
        </tr>
      `;
    }

    showToast(
      error.message ||
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
      (lead) =>
        lead.status === "new"
    ).length;

  const followupCount =
    allLeads.filter(
      (lead) =>
        lead.status === "call_back"
    ).length;

  const convertedCount =
    allLeads.filter(
      (lead) =>
        lead.status === "converted"
    ).length;

  if ($("totalLeads")) {

    $("totalLeads")
      .textContent =
      total;
  }

  if ($("newLeads")) {

    $("newLeads")
      .textContent =
      newCount;
  }

  if ($("followupLeads")) {

    $("followupLeads")
      .textContent =
      followupCount;
  }

  if ($("convertedLeads")) {

    $("convertedLeads")
      .textContent =
      convertedCount;
  }
}


/* =========================================================
   APPLY FILTERS
   ========================================================= */

function applyFilters() {

  const search =
    (
      $("searchInput")
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();

  const status =
    $("statusFilter")
      ?.value ||
    "";

  const priority =
    $("priorityFilter")
      ?.value ||
    "";

  filteredLeads =
    allLeads.filter(
      (lead) => {

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

          lead.notes,

          lead.internal_notes,

          lead.source

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const searchMatch =
          !search ||
          searchable.includes(
            search
          );

        const statusMatch =
          !status ||
          lead.status ===
            status;

        const priorityMatch =
          !priority ||
          lead.priority ===
            priority;

        return (
          searchMatch &&
          statusMatch &&
          priorityMatch
        );
      }
    );

  renderLeads();
}


/* =========================================================
   RENDER LEADS
   ========================================================= */

function renderLeads() {

  const tbody =
    $("leadsTableBody");

  const emptyState =
    $("emptyState");

  if (!tbody) {
    return;
  }

  if (
    !filteredLeads.length
  ) {

    tbody.innerHTML = "";

    if (emptyState) {

      emptyState.hidden =
        false;
    }

    return;
  }

  if (emptyState) {

    emptyState.hidden =
      true;
  }

  tbody.innerHTML =
    filteredLeads
      .map(
        renderLeadRow
      )
      .join("");
}


/* =========================================================
   RENDER SINGLE LEAD ROW
   ========================================================= */

function renderLeadRow(
  lead
) {

  const id =
    lead.id;

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

  /* CORRECT DATABASE COLUMN */

  const budget =
    lead.budget_per_person ??
    lead.budget ??
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

  const normalizedPhone =
    normalizePhone(phone);

  return `

    <tr
      class="lead-row"
      data-lead-id="${safeId}"
    >

      <!-- CUSTOMER -->

      <td
        class="editable-cell customer-cell"
      >

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
              <small
                class="customer-email"
              >
                ${escapeHtml(
                  lead.email
                )}
              </small>
            `
            : ""
        }

      </td>


      <!-- PHONE -->

      <td
        class="editable-cell phone-cell"
      >

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

      <td
        class="editable-cell"
      >

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

      <td
        class="editable-cell"
      >

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

      <td
        class="editable-cell"
      >

        <input
          class="table-edit-input table-date-input"
          data-field="event_date"
          data-id="${safeId}"
          value="${escapeHtml(
            formatDateInput(
              eventDate
            )
          )}"
          title="Edit event date"
          type="date"
        >

      </td>


      <!-- GUESTS -->

      <td
        class="editable-cell"
      >

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

      <td
        class="editable-cell"
      >

        <input
          class="table-edit-input number-edit"
          data-field="budget_per_person"
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

          ${buildStatusOptions(
            status
          )}

        </select>

      </td>


      <!-- PRIORITY -->

      <td>

        <select
          class="table-edit-select"
          data-field="priority"
          data-id="${safeId}"
        >

          ${buildPriorityOptions(
            priority
          )}

        </select>

      </td>


      <!-- REMARK -->

      <td
        class="remark-cell"
      >

        <div
          class="remark-wrapper"
        >

          <span
            class="remark-text"
            title="${escapeHtml(
              remark
            )}"
          >
            ${
              remark
                ? escapeHtml(
                    remark
                  )
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

        <div
          class="contact-actions"
        >

          ${
            normalizedPhone
              ? `
                <a
                  href="tel:${escapeHtml(
                    normalizedPhone
                  )}"
                  class="contact-icon call-icon"
                  title="Call customer"
                >
                  ☎
                </a>
              `
              : ""
          }


          ${
            normalizedPhone
              ? `
                <a
                  href="https://wa.me/${escapeHtml(
                    normalizedPhone.replace(
                      "+",
                      ""
                    )
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
   UPDATE SINGLE LEAD FIELD
   ========================================================= */

async function updateLeadField(
  leadId,
  field,
  value,
  inputElement
) {

  if (
    !leadId ||
    !field
  ) {
    return;
  }

  const updateData = {};


  if (
    field ===
    "customer_name"
  ) {

    updateData.customer_name =
      value.trim();

  }


  else if (
    field === "mobile"
  ) {

    updateData.mobile =
      value.trim();

  }


  else if (
    field === "occasion"
  ) {

    updateData.occasion =
      value.trim();

  }


  else if (
    field === "location"
  ) {

    updateData.location =
      value.trim();

  }


  else if (
    field === "event_date"
  ) {

    updateData.event_date =
      value ||
      null;

  }


  else if (
    field === "guests"
  ) {

    updateData.guests =
      value === ""
        ? null
        : Number(value);

  }


  /* CORRECT DATABASE COLUMN */

  else if (
    field ===
    "budget_per_person"
  ) {

    updateData.budget_per_person =
      value === ""
        ? null
        : Number(value);

  }


  else if (
    field === "status"
  ) {

    updateData.status =
      value;

  }


  else if (
    field === "priority"
  ) {

    updateData.priority =
      value;

  }


  else if (
    field === "remark"
  ) {

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
    } =
      await supabaseClient
        .from(
          "customer_enquiries"
        )
        .update(
          updateData
        )
        .eq(
          "id",
          leadId
        );


    if (error) {
      throw error;
    }


    const index =
      allLeads.findIndex(
        (lead) =>
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


    setTimeout(
      () => {

        inputElement?.classList.remove(
          "saved"
        );

      },
      900
    );


    if (
      field === "status" ||
      field === "priority"
    ) {

      applyFilters();
    }


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


    setTimeout(
      () => {

        inputElement?.classList.remove(
          "save-error"
        );

      },
      1500
    );


    showToast(
      error.message ||
      "Unable to save changes",
      "error"
    );
  }
}


/* =========================================================
   TABLE EDITING
   ========================================================= */

function setupTableEditing() {

  const tbody =
    $("leadsTableBody");

  if (!tbody) {
    return;
  }


  /* SELECT / DATE / NUMBER CHANGE */

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


      await updateLeadField(
        target.dataset.id,
        target.dataset.field,
        target.value,
        target
      );
    }
  );


  /* TEXT INPUT BLUR */

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


  /* STORE ORIGINAL VALUE */

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


  /* BUTTONS */

  tbody.addEventListener(
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


      if (
        action === "remark"
      ) {

        openRemarkModal(id);
      }

    }
  );
}


/* =========================================================
   OPEN LEAD MODAL
   ========================================================= */

function openLeadModal(id) {

  const lead =
    allLeads.find(
      (item) =>
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

  currentLead =
    lead;


  const customerName =
    lead.customer_name ??
    lead.name ??
    "";


  /* CUSTOMER NAME */

  if (
    $("modalCustomerTitle")
  ) {

    $("modalCustomerTitle")
      .textContent =
      customerName ||
      "Customer";
  }


  if (
    $("modalCustomerName")
  ) {

    $("modalCustomerName")
      .value =
      customerName;
  }


  /* MOBILE */

  if (
    $("modalMobile")
  ) {

    $("modalMobile")
      .value =
      lead.mobile ??
      lead.phone ??
      "";
  }


  /* EMAIL */

  if (
    $("modalEmail")
  ) {

    $("modalEmail")
      .value =
      lead.email ??
      "";
  }


  /* LOCATION */

  if (
    $("modalLocation")
  ) {

    $("modalLocation")
      .value =
      lead.location ??
      "";
  }


  /* OCCASION */

  if (
    $("modalOccasion")
  ) {

    $("modalOccasion")
      .value =
      lead.occasion ??
      lead.event ??
      "";
  }


  /* EVENT DATE */

  if (
    $("modalEventDate")
  ) {

    $("modalEventDate")
      .value =
      formatDateInput(
        lead.event_date ??
        lead.date
      );
  }


  /* GUESTS */

  if (
    $("modalGuests")
  ) {

    $("modalGuests")
      .value =
      lead.guests ??
      lead.guest_count ??
      "";
  }


  /* BUDGET */

  if (
    $("modalBudget")
  ) {

    $("modalBudget")
      .value =
      lead.budget_per_person ??
      lead.budget ??
      "";
  }


  /* FOOD */

  if (
    $("modalFood")
  ) {

    $("modalFood")
      .value =
      lead.food_preference ??
      lead.food ??
      "";
  }


  /* REQUIREMENTS */

  if (
    $("modalRequirements")
  ) {

    $("modalRequirements")
      .value =
      lead.requirements ??
      lead.other_requirements ??
      "";
  }


  /* STATUS */

  if (
    $("modalStatus")
  ) {

    let modalStatus =
      lead.status ||
      "new";


    /* Safety for old value */

    if (
      modalStatus ===
      "not_pick"
    ) {

      modalStatus =
        "not_picked";
    }


    $("modalStatus")
      .value =
      modalStatus;
  }


  /* PRIORITY */

  if (
    $("modalPriority")
  ) {

    $("modalPriority")
      .value =
      lead.priority ||
      "normal";
  }


  /* FOLLOW-UP */

  if (
    $("modalFollowUp")
  ) {

    $("modalFollowUp")
      .value =
      formatDateTimeInput(
        lead.follow_up_at ??
        lead.follow_up
      );
  }


  /* CONTACT COUNT */

  if (
    $("modalContactCount")
  ) {

    $("modalContactCount")
      .textContent =
      lead.contact_count ??
      0;
  }


  /* LAST CONTACTED */

  if (
    $("modalLastContacted")
  ) {

    $("modalLastContacted")
      .textContent =
      lead.last_contacted_at
        ? formatDate(
            lead.last_contacted_at
          )
        : "Never";
  }


  /* CONTACT REMARK */

  if (
    $("modalContactRemark")
  ) {

    $("modalContactRemark")
      .value =
      lead.contact_remark ??
      lead.remark ??
      "";
  }


  /* INTERNAL NOTES */

  if (
    $("modalNotes")
  ) {

    $("modalNotes")
      .value =
      lead.internal_notes ??
      lead.notes ??
      "";
  }


  /* CONTACT BUTTONS */

  setupModalContactLinks(
    lead.mobile ??
    lead.phone ??
    ""
  );


  /* SHOW MODAL */

  const modal =
    $("leadModal");

  if (modal) {

    modal.hidden =
      false;

    document.body.classList.add(
      "modal-open"
    );
  }
}


/* =========================================================
   MODAL CONTACT LINKS
   ========================================================= */

function setupModalContactLinks(
  phone
) {

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

    modal.hidden =
      true;
  }

  currentLead =
    null;

  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================================================
   SAVE LEAD FROM MODAL
   ========================================================= */

async function saveLeadFromModal() {

  if (!currentLead) {
    return;
  }

  const id =
    currentLead.id;


  /* READ FORM VALUES */

  const customerName =
    $("modalCustomerName")
      ?.value
      .trim() ||
    "";

  const mobile =
    $("modalMobile")
      ?.value
      .trim() ||
    "";

  const email =
    $("modalEmail")
      ?.value
      .trim() ||
    "";

  const location =
    $("modalLocation")
      ?.value
      .trim() ||
    "";

  const occasion =
    $("modalOccasion")
      ?.value
      .trim() ||
    "";

  const eventDate =
    $("modalEventDate")
      ?.value ||
    null;

  const guestsValue =
    $("modalGuests")
      ?.value ||
    "";

  const budgetValue =
    $("modalBudget")
      ?.value ||
    "";

  const food =
    $("modalFood")
      ?.value ||
    "";

  const requirements =
    $("modalRequirements")
      ?.value
      .trim() ||
    "";

  const status =
    $("modalStatus")
      ?.value ||
    "new";

  const priority =
    $("modalPriority")
      ?.value ||
    "normal";

  const followUp =
    $("modalFollowUp")
      ?.value ||
    "";

  const contactRemark =
    $("modalContactRemark")
      ?.value
      .trim() ||
    "";

  const notes =
    $("modalNotes")
      ?.value
      .trim() ||
    "";


  /* PREPARE DATABASE UPDATE */

  const updateData = {

    customer_name:
      customerName,

    mobile:
      mobile,

    email:
      email ||
      null,

    location:
      location ||
      null,

    occasion:
      occasion ||
      null,

    event_date:
      eventDate,

    guests:
      guestsValue === ""
        ? null
        : Number(
            guestsValue
          ),

    /* CORRECT COLUMN */

    budget_per_person:
      budgetValue === ""
        ? null
        : Number(
            budgetValue
          ),

    food_preference:
      food ||
      null,

    requirements:
      requirements ||
      null,

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
      contactRemark ||
      null,

    /* CORRECT COLUMN */

    internal_notes:
      notes ||
      null
  };


  const saveBtn =
    $("saveLeadBtn");


  try {

    if (saveBtn) {

      saveBtn.disabled =
        true;

      saveBtn.textContent =
        "Saving...";
    }


    const {
      error
    } =
      await supabaseClient
        .from(
          "customer_enquiries"
        )
        .update(
          updateData
        )
        .eq(
          "id",
          id
        );


    if (error) {
      throw error;
    }


    /* UPDATE LOCAL DATA */

    const index =
      allLeads.findIndex(
        (lead) =>
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
      error.message ||
      "Unable to save lead",
      "error"
    );


  } finally {

    if (saveBtn) {

      saveBtn.disabled =
        false;

      saveBtn.textContent =
        "Save Changes";
    }
  }
}


/* =========================================================
   OPEN REMARK MODAL
   ========================================================= */

function openRemarkModal(id) {

  const lead =
    allLeads.find(
      (item) =>
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


  if (
    $("remarkCustomerName")
  ) {

    $("remarkCustomerName")
      .textContent =
      lead.customer_name ??
      lead.name ??
      "Customer";
  }


  if (
    $("remarkInput")
  ) {

    $("remarkInput")
      .value =
      lead.contact_remark ??
      lead.remark ??
      "";
  }


  if (
    $("remarkMessage")
  ) {

    $("remarkMessage")
      .textContent =
      "";
  }


  const modal =
    $("remarkModal");

  if (modal) {

    modal.hidden =
      false;

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

    modal.hidden =
      true;
  }

  currentRemarkLead =
    null;

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
    $("remarkInput")
      ?.value
      .trim() ||
    "";

  const saveBtn =
    $("saveRemarkBtn");


  try {

    if (saveBtn) {

      saveBtn.disabled =
        true;

      saveBtn.textContent =
        "Saving...";
    }


    const {
      error
    } =
      await supabaseClient
        .from(
          "customer_enquiries"
        )
        .update({
          contact_remark:
            remark ||
            null
        })
        .eq(
          "id",
          id
        );


    if (error) {
      throw error;
    }


    const index =
      allLeads.findIndex(
        (lead) =>
          String(lead.id) ===
          String(id)
      );


    if (index !== -1) {

      allLeads[index]
        .contact_remark =
        remark ||
        null;

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


    if (
      $("remarkMessage")
    ) {

      $("remarkMessage")
        .textContent =
        error.message ||
        "Unable to save remark.";
    }


    showToast(
      error.message ||
      "Unable to save remark",
      "error"
    );


  } finally {

    if (saveBtn) {

      saveBtn.disabled =
        false;

      saveBtn.textContent =
        "Save Remark";
    }
  }
}


/* =========================================================
   OPEN ADD ENQUIRY MODAL
   ========================================================= */

function openAddEnquiryModal() {

  const modal =
    $("addEnquiryModal");

  if (!modal) {
    return;
  }

  clearAddEnquiryForm();

  modal.hidden =
    false;

  document.body.classList.add(
    "modal-open"
  );

  setTimeout(
    () => {

      $("newCustomerName")
        ?.focus();

    },
    100
  );
}


/* =========================================================
   CLEAR ADD ENQUIRY FORM
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


  fields.forEach(
    (id) => {

      const element =
        $(id);

      if (element) {

        element.value =
          "";
      }
    }
  );


  if ($("newFood")) {

    $("newFood").value =
      "";
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


  if (
    $("addEnquiryMessage")
  ) {

    $("addEnquiryMessage")
      .textContent =
      "";
  }
}


/* =========================================================
   CLOSE ADD ENQUIRY MODAL
   ========================================================= */

function closeAddEnquiryModal() {

  const modal =
    $("addEnquiryModal");

  if (modal) {

    modal.hidden =
      true;
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
    $("newCustomerName")
      ?.value
      .trim() ||
    "";

  const mobile =
    $("newMobile")
      ?.value
      .trim() ||
    "";

  const message =
    $("addEnquiryMessage");


  if (!customerName) {

    if (message) {

      message.textContent =
        "Customer name is required.";
    }

    return;
  }


  if (!mobile) {

    if (message) {

      message.textContent =
        "Mobile number is required.";
    }

    return;
  }


  if (message) {

    message.textContent =
      "";
  }


  const saveBtn =
    $("saveNewEnquiryBtn");


  const followUpValue =
    $("newFollowUp")
      ?.value ||
    "";


  const insertData = {

    customer_name:
      customerName,

    mobile:
      mobile,

    email:
      $("newEmail")
        ?.value
        .trim() ||
      null,

    location:
      $("newLocation")
        ?.value
        .trim() ||
      null,

    occasion:
      $("newOccasion")
        ?.value
        .trim() ||
      null,

    event_date:
      $("newEventDate")
        ?.value ||
      null,

    guests:
      $("newGuests")
        ?.value
        ? Number(
            $("newGuests")
              .value
          )
        : null,

    /* CORRECT COLUMN */

    budget_per_person:
      $("newBudget")
        ?.value
        ? Number(
            $("newBudget")
              .value
          )
        : null,

    food_preference:
      $("newFood")
        ?.value ||
      null,

    source:
      $("newSource")
        ?.value ||
      "Website",

    status:
      $("newStatus")
        ?.value ||
      "new",

    priority:
      $("newPriority")
        ?.value ||
      "normal",

    follow_up_at:
      followUpValue
        ? new Date(
            followUpValue
          ).toISOString()
        : null,

    requirements:
      $("newRequirements")
        ?.value
        .trim() ||
      null,

    contact_remark:
      $("newContactRemark")
        ?.value
        .trim() ||
      null,

    /* CORRECT COLUMN */

    internal_notes:
      $("newNotes")
        ?.value
        .trim() ||
      null
  };


  try {

    if (saveBtn) {

      saveBtn.disabled =
        true;

      saveBtn.textContent =
        "Saving...";
    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "customer_enquiries"
        )
        .insert(
          insertData
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    if (data) {

      allLeads.unshift(
        data
      );
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


    if (message) {

      message.textContent =
        error.message ||
        "Unable to save enquiry.";
    }


    showToast(
      error.message ||
      "Unable to add enquiry",
      "error"
    );


  } finally {

    if (saveBtn) {

      saveBtn.disabled =
        false;

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
    .forEach(
      (tab) => {

        tab.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".stat-tab"
              )
              .forEach(
                (item) => {

                  item.classList.remove(
                    "active"
                  );
                }
              );


            tab.classList.add(
              "active"
            );


            const status =
              tab.dataset.status ||
              "";


            if (
              $("statusFilter")
            ) {

              $("statusFilter")
                .value =
                status;
            }


            applyFilters();
          }
        );
      }
    );
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
      () => {

        updateActiveStatTab();

        applyFilters();
      }
    );


  $("priorityFilter")
    ?.addEventListener(
      "change",
      applyFilters
    );
}


/* =========================================================
   UPDATE ACTIVE STAT TAB
   ========================================================= */

function updateActiveStatTab() {

  const currentStatus =
    $("statusFilter")
      ?.value ||
    "";


  document
    .querySelectorAll(
      ".stat-tab"
    )
    .forEach(
      (tab) => {

        const tabStatus =
          tab.dataset.status ||
          "";


        tab.classList.toggle(
          "active",
          tabStatus ===
            currentStatus
        );
      }
    );
}


/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModalEvents() {

  /* LEAD MODAL */

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


  /* REMARK MODAL */

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


  /* ADD ENQUIRY */

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


  /* LEAD MODAL OUTSIDE CLICK */

  $("leadModal")
    ?.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          $("leadModal")
        ) {

          closeLeadModal();
        }
      }
    );


  /* REMARK MODAL OUTSIDE CLICK */

  $("remarkModal")
    ?.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          $("remarkModal")
        ) {

          closeRemarkModal();
        }
      }
    );


  /* ADD ENQUIRY OUTSIDE CLICK */

  $("addEnquiryModal")
    ?.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          $("addEnquiryModal")
        ) {

          closeAddEnquiryModal();
        }
      }
    );


  /* ESCAPE KEY */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !==
        "Escape"
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
   HEADER EVENTS
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

        const button =
          $("refreshBtn");


        if (button) {

          button.disabled =
            true;
        }


        try {

          await loadLeads();

          showToast(
            "CRM refreshed"
          );


        } finally {

          if (button) {

            button.disabled =
              false;
          }
        }
      }
    );


  $("addEnquiryBtn")
    ?.addEventListener(
      "click",
      openAddEnquiryModal
    );
}


/* =========================================================
   KEYBOARD SUPPORT
   ========================================================= */

function setupKeyboardSupport() {

  const tbody =
    $("leadsTableBody");

  if (!tbody) {
    return;
  }


  tbody.addEventListener(
    "keydown",
    (event) => {

      const target =
        event.target;


      if (
        !target.matches(
          ".table-edit-input"
        )
      ) {
        return;
      }


      /* ENTER */

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        target.blur();

        return;
      }


      /* ESCAPE */

      if (
        event.key ===
        "Escape"
      ) {

        const leadId =
          target.dataset.id;

        const field =
          target.dataset.field;


        const lead =
          allLeads.find(
            (item) =>
              String(item.id) ===
              String(leadId)
          );


        if (!lead) {
          return;
        }


        let original =
          "";


        if (
          field ===
          "customer_name"
        ) {

          original =
            lead.customer_name ||
            "";
        }


        else if (
          field ===
          "mobile"
        ) {

          original =
            lead.mobile ||
            lead.phone ||
            "";
        }


        else if (
          field ===
          "occasion"
        ) {

          original =
            lead.occasion ||
            lead.event ||
            "";
        }


        else if (
          field ===
          "location"
        ) {

          original =
            lead.location ||
            "";
        }


        else if (
          field ===
          "event_date"
        ) {

          original =
            formatDateInput(
              lead.event_date ||
              lead.date
            );
        }


        else if (
          field ===
          "guests"
        ) {

          original =
            lead.guests ??
            "";
        }


        else if (
          field ===
          "budget_per_person"
        ) {

          original =
            lead.budget_per_person ??
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
   OPTIONAL REALTIME REFRESH
   ========================================================= */

function setupRealtime() {

  try {

    supabaseClient
      .channel(
        "crm-customer-enquiries"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "customer_enquiries"
        },
        () => {

          loadLeads();
        }
      )
      .subscribe();

  } catch (error) {

    console.warn(
      "Realtime setup skipped:",
      error
    );
  }
}


/* =========================================================
   INITIALIZE CRM
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

    setupRealtime();


    await loadLeads();


  } catch (error) {

    console.error(
      "CRM initialization error:",
      error
    );

    showToast(
      error.message ||
      "CRM failed to initialize",
      "error"
    );
  }
}


/* =========================================================
   START CRM
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
