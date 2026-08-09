const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// =====================================================
// GLOBAL CRM STATE
// =====================================================

let currentEnquiries = [];
let currentLead = null;


// =====================================================
// PAGE READY
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    setupLogin();
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    await setupCRM();
  }

});


// =====================================================
// LOGIN
// =====================================================

function setupLogin() {

  const loginForm =
    document.getElementById("loginForm");

  const loginMessage =
    document.getElementById("loginMessage");


  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();
      event.stopPropagation();


      const email =
        document.getElementById("email")
          ?.value.trim();

      const password =
        document.getElementById("password")
          ?.value;


      if (!email || !password) {

        loginMessage.textContent =
          "Please enter email and password.";

        loginMessage.style.display =
          "block";

        return;
      }


      loginMessage.textContent =
        "Signing in...";

      loginMessage.style.display =
        "block";


      try {

        const { data, error } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password
          });


        if (error) {

          console.error(
            "SUPABASE LOGIN ERROR:",
            error
          );

          loginMessage.textContent =
            "Login failed: " +
            error.message;

          return;
        }


        if (!data || !data.session) {

          loginMessage.textContent =
            "Login failed. No session created.";

          return;
        }


        loginMessage.textContent =
          "Login successful. Opening CRM...";


        window.location.href =
          "dashboard.html";

      } catch (error) {

        console.error(
          "LOGIN ERROR:",
          error
        );

        loginMessage.textContent =
          "Login error: " +
          error.message;
      }

    }
  );

}


// =====================================================
// CRM SETUP
// =====================================================

async function setupCRM() {

  try {

    const {
      data: {
        session
      }
    } = await supabaseClient.auth.getSession();


    if (!session) {

      window.location.href =
        "login.html";

      return;
    }


    setupLogout();

    setupSearch();

    setupFilters();

    setupRefresh();

    setupLeadModal();

    setupAddEnquiry();

    showStaffName(
      session.user
    );

    await loadEnquiries();

  } catch (error) {

    console.error(
      "CRM SETUP ERROR:",
      error
    );

    showStaffNameError();

  }

}


// =====================================================
// STAFF NAME / EMAIL
// =====================================================

function showStaffName(user) {

  const staffName =
    document.getElementById(
      "staffName"
    );

  if (!staffName) {
    return;
  }


  staffName.textContent =
    user?.email || "Staff";
}


function showStaffNameError() {

  const staffName =
    document.getElementById(
      "staffName"
    );

  if (staffName) {

    staffName.textContent =
      "Staff";
  }

}


// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );

  if (!logoutBtn) {
    return;
  }


  logoutBtn.addEventListener(
    "click",
    async () => {

      logoutBtn.disabled =
        true;

      logoutBtn.textContent =
        "Logging out...";


      try {

        const {
          error
        } =
          await supabaseClient.auth.signOut();


        if (error) {

          console.error(
            "LOGOUT ERROR:",
            error
          );

          logoutBtn.disabled =
            false;

          logoutBtn.textContent =
            "Logout";

          return;
        }


        window.location.href =
          "login.html";

      } catch (error) {

        console.error(
          "LOGOUT EXCEPTION:",
          error
        );

        logoutBtn.disabled =
          false;

        logoutBtn.textContent =
          "Logout";
      }

    }
  );

}


// =====================================================
// LOAD ENQUIRIES
// =====================================================

async function loadEnquiries() {

  const tableBody =
    document.getElementById(
      "leadsTableBody"
    );


  if (tableBody) {

    tableBody.innerHTML = `
      <tr>
        <td
          colspan="9"
          class="loading-cell"
        >
          Loading enquiries...
        </td>
      </tr>
    `;
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

      console.error(
        "LOAD ENQUIRIES ERROR:",
        error
      );

      currentEnquiries = [];

      if (tableBody) {

        tableBody.innerHTML = `
          <tr>
            <td
              colspan="9"
              class="loading-cell"
            >
              Unable to load enquiries.
            </td>
          </tr>
        `;
      }

      return;
    }


    currentEnquiries =
      data || [];


    renderEnquiries(
      currentEnquiries
    );


    updateStats(
      currentEnquiries
    );

  } catch (error) {

    console.error(
      "LOAD ENQUIRIES EXCEPTION:",
      error
    );

    if (tableBody) {

      tableBody.innerHTML = `
        <tr>
          <td
            colspan="9"
            class="loading-cell"
          >
            Unable to load enquiries.
          </td>
        </tr>
      `;
    }

  }

}


// =====================================================
// RENDER ENQUIRIES
// =====================================================

function renderEnquiries(
  enquiries
) {

  const tableBody =
    document.getElementById(
      "leadsTableBody"
    );

  const emptyState =
    document.getElementById(
      "emptyState"
    );


  if (!tableBody) {
    return;
  }


  if (!enquiries.length) {

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
    enquiries.map(
      (lead) => {

        return `
          <tr>

            <td>

              <strong>
                ${escapeHTML(
                  lead.customer_name || "Unnamed"
                )}
              </strong>

              <small>
                ${escapeHTML(
                  lead.mobile || ""
                )}
              </small>

            </td>


            <td>
              ${escapeHTML(
                lead.occasion || "—"
              )}
            </td>


            <td>
              ${escapeHTML(
                lead.location || "—"
              )}
            </td>


            <td>
              ${formatDate(
                lead.event_date
              )}
            </td>


            <td>
              ${lead.guests || "—"}
            </td>


            <td>
              ${
                lead.budget_per_person
                  ? "₹" +
                    Number(
                      lead.budget_per_person
                    ).toLocaleString("en-IN")
                  : "—"
              }
            </td>


            <td>
              <span class="status-badge">
                ${formatStatus(
                  lead.status
                )}
              </span>
            </td>


            <td>
              <span class="priority-badge">
                ${formatPriority(
                  lead.priority
                )}
              </span>
            </td>


            <td>

              <button
                type="button"
                class="view-lead-btn"
                data-lead-id="${lead.id}"
              >
                View
              </button>

            </td>

          </tr>
        `;

      }
    ).join("");


  document
    .querySelectorAll(
      ".view-lead-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const leadId =
              button.dataset.leadId;

            const lead =
              currentEnquiries.find(
                item =>
                  String(item.id) ===
                  String(leadId)
              );

            if (lead) {
              openLeadModal(lead);
            }

          }
        );

      }
    );

}


// =====================================================
// STATS
// =====================================================

function updateStats(
  enquiries
) {

  const total =
    document.getElementById(
      "totalLeads"
    );

  const newLeads =
    document.getElementById(
      "newLeads"
    );

  const followup =
    document.getElementById(
      "followupLeads"
    );

  const converted =
    document.getElementById(
      "convertedLeads"
    );


  if (total) {

    total.textContent =
      enquiries.length;
  }


  if (newLeads) {

    newLeads.textContent =
      enquiries.filter(
        lead =>
          lead.status === "new"
      ).length;
  }


  if (followup) {

    followup.textContent =
      enquiries.filter(
        lead =>
          lead.status === "follow_up"
      ).length;
  }


  if (converted) {

    converted.textContent =
      enquiries.filter(
        lead =>
          lead.status === "converted"
      ).length;
  }

}


// =====================================================
// SEARCH
// =====================================================

function setupSearch() {

  const searchInput =
    document.getElementById(
      "searchInput"
    );

  if (!searchInput) {
    return;
  }


  searchInput.addEventListener(
    "input",
    applyFilters
  );

}


// =====================================================
// FILTERS
// =====================================================

function setupFilters() {

  const statusFilter =
    document.getElementById(
      "statusFilter"
    );

  const priorityFilter =
    document.getElementById(
      "priorityFilter"
    );


  if (statusFilter) {

    statusFilter.addEventListener(
      "change",
      applyFilters
    );
  }


  if (priorityFilter) {

    priorityFilter.addEventListener(
      "change",
      applyFilters
    );
  }

}


function applyFilters() {

  const searchInput =
    document.getElementById(
      "searchInput"
    );

  const statusFilter =
    document.getElementById(
      "statusFilter"
    );

  const priorityFilter =
    document.getElementById(
      "priorityFilter"
    );


  const search =
    (
      searchInput?.value ||
      ""
    ).trim().toLowerCase();


  const status =
    statusFilter?.value ||
    "";


  const priority =
    priorityFilter?.value ||
    "";


  const filtered =
    currentEnquiries.filter(
      (lead) => {

        const searchable = [

          lead.customer_name,

          lead.mobile,

          lead.email,

          lead.location,

          lead.occasion

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        const matchesSearch =
          !search ||
          searchable.includes(
            search
          );


        const matchesStatus =
          !status ||
          lead.status === status;


        const matchesPriority =
          !priority ||
          lead.priority === priority;


        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority
        );

      }
    );


  renderEnquiries(
    filtered
  );

}


// =====================================================
// REFRESH
// =====================================================

function setupRefresh() {

  const refreshBtn =
    document.getElementById(
      "refreshBtn"
    );

  if (!refreshBtn) {
    return;
  }


  refreshBtn.addEventListener(
    "click",
    async () => {

      refreshBtn.disabled =
        true;

      refreshBtn.textContent =
        "Refreshing...";


      await loadEnquiries();


      refreshBtn.disabled =
        false;

      refreshBtn.textContent =
        "↻ Refresh";

    }
  );

}


// =====================================================
// LEAD MODAL
// =====================================================

function setupLeadModal() {

  const closeBtn =
    document.getElementById(
      "closeModalBtn"
    );

  const cancelBtn =
    document.getElementById(
      "cancelModalBtn"
    );

  const saveBtn =
    document.getElementById(
      "saveLeadBtn"
    );


  if (closeBtn) {

    closeBtn.addEventListener(
      "click",
      closeLeadModal
    );
  }


  if (cancelBtn) {

    cancelBtn.addEventListener(
      "click",
      closeLeadModal
    );
  }


  if (saveBtn) {

    saveBtn.addEventListener(
      "click",
      saveLeadChanges
    );
  }


  const callBtn =
    document.getElementById(
      "modalCallBtn"
    );

  const whatsappBtn =
    document.getElementById(
      "modalWhatsappBtn"
    );


  if (callBtn) {

    callBtn.addEventListener(
      "click",
      (event) => {

        if (
          !currentLead ||
          !currentLead.mobile
        ) {

          event.preventDefault();
        }

      }
    );

  }


  if (whatsappBtn) {

    whatsappBtn.addEventListener(
      "click",
      (event) => {

        if (
          !currentLead ||
          !currentLead.mobile
        ) {

          event.preventDefault();
        }

      }
    );

  }

}


function openLeadModal(
  lead
) {

  currentLead =
    lead;


  setText(
    "modalCustomerName",
    lead.customer_name || "Customer"
  );


  setText(
    "modalMobile",
    lead.mobile || "—"
  );


  setText(
    "modalEmail",
    lead.email || "—"
  );


  setText(
    "modalLocation",
    lead.location || "—"
  );


  setText(
    "modalOccasion",
    lead.occasion || "—"
  );


  setText(
    "modalEventDate",
    formatDate(
      lead.event_date
    )
  );


  setText(
    "modalGuests",
    lead.guests || "—"
  );


  setText(
    "modalBudget",
    lead.budget_per_person
      ? "₹" +
        Number(
          lead.budget_per_person
        ).toLocaleString("en-IN")
      : "—"
  );


  setText(
    "modalFood",
    lead.food_preference || "—"
  );


  setText(
    "modalRequirements",
    lead.requirements || "—"
  );


  const status =
    document.getElementById(
      "modalStatus"
    );

  if (status) {

    status.value =
      lead.status || "new";
  }


  const priority =
    document.getElementById(
      "modalPriority"
    );

  if (priority) {

    priority.value =
      lead.priority || "normal";
  }


  const followUp =
    document.getElementById(
      "modalFollowUp"
    );

  if (followUp) {

    followUp.value =
      toDateTimeLocal(
        lead.follow_up_at
      );
  }


  const notes =
    document.getElementById(
      "modalNotes"
    );

  if (notes) {

    notes.value =
      lead.internal_notes || "";
  }


  const callBtn =
    document.getElementById(
      "modalCallBtn"
    );


  if (callBtn) {

    callBtn.href =
      lead.mobile
        ? "tel:" + lead.mobile
        : "#";
  }


  const whatsappBtn =
    document.getElementById(
      "modalWhatsappBtn"
    );


  if (whatsappBtn) {

    const cleanMobile =
      String(
        lead.mobile || ""
      ).replace(
        /\D/g,
        ""
      );


    const whatsappNumber =
      cleanMobile.length === 10
        ? "91" + cleanMobile
        : cleanMobile;


    whatsappBtn.href =
      whatsappNumber
        ? "https://wa.me/" +
          whatsappNumber
        : "#";
  }


  const modal =
    document.getElementById(
      "leadModal"
    );


  if (modal) {

    modal.hidden = false;
  }

}


function closeLeadModal() {

  const modal =
    document.getElementById(
      "leadModal"
    );


  if (modal) {

    modal.hidden = true;
  }


  currentLead =
    null;

}


// =====================================================
// SAVE LEAD CHANGES
// =====================================================

async function saveLeadChanges() {

  if (!currentLead) {
    return;
  }


  const saveBtn =
    document.getElementById(
      "saveLeadBtn"
    );


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
    )?.value;


  const notes =
    document.getElementById(
      "modalNotes"
    )?.value.trim();


  if (saveBtn) {

    saveBtn.disabled =
      true;

    saveBtn.textContent =
      "Saving...";
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from("customer_enquiries")
        .update({

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

          internal_notes:
            notes || null,

          updated_at:
            new Date().toISOString()

        })
        .eq(
          "id",
          currentLead.id
        );


    if (error) {

      console.error(
        "UPDATE LEAD ERROR:",
        error
      );

      showToast(
        "Unable to save changes."
      );

      return;
    }


    showToast(
      "Lead updated successfully."
    );


    closeLeadModal();

    await loadEnquiries();

  } catch (error) {

    console.error(
      "UPDATE LEAD EXCEPTION:",
      error
    );

    showToast(
      "Something went wrong."
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


// =====================================================
// ADD ENQUIRY
// =====================================================

function setupAddEnquiry() {

  const addBtn =
    document.getElementById(
      "addEnquiryBtn"
    );


  const closeBtn =
    document.getElementById(
      "closeAddEnquiryBtn"
    );


  const cancelBtn =
    document.getElementById(
      "cancelAddEnquiryBtn"
    );


  const saveBtn =
    document.getElementById(
      "saveNewEnquiryBtn"
    );


  if (addBtn) {

    addBtn.addEventListener(
      "click",
      openAddEnquiryModal
    );
  }


  if (closeBtn) {

    closeBtn.addEventListener(
      "click",
      closeAddEnquiryModal
    );
  }


  if (cancelBtn) {

    cancelBtn.addEventListener(
      "click",
      closeAddEnquiryModal
    );
  }


  if (saveBtn) {

    saveBtn.addEventListener(
      "click",
      saveNewEnquiry
    );
  }

}


function openAddEnquiryModal() {

  const modal =
    document.getElementById(
      "addEnquiryModal"
    );


  if (!modal) {

    console.error(
      "addEnquiryModal not found."
    );

    return;
  }


  modal.hidden =
    false;

}


function closeAddEnquiryModal() {

  const modal =
    document.getElementById(
      "addEnquiryModal"
    );


  if (modal) {

    modal.hidden =
      true;
  }


  const message =
    document.getElementById(
      "addEnquiryMessage"
    );


  if (message) {

    message.textContent =
      "";
  }

}


async function saveNewEnquiry() {

  const name =
    document.getElementById(
      "newCustomerName"
    )?.value.trim();


  const mobile =
    document.getElementById(
      "newMobile"
    )?.value.trim();


  const email =
    document.getElementById(
      "newEmail"
    )?.value.trim();


  const location =
    document.getElementById(
      "newLocation"
    )?.value.trim();


  const occasion =
    document.getElementById(
      "newOccasion"
    )?.value;


  const eventDate =
    document.getElementById(
      "newEventDate"
    )?.value;


  const guests =
    document.getElementById(
      "newGuests"
    )?.value;


  const budget =
    document.getElementById(
      "newBudget"
    )?.value;


  const food =
    document.getElementById(
      "newFood"
    )?.value;


  const source =
    document.getElementById(
      "newSource"
    )?.value;


  const status =
    document.getElementById(
      "newStatus"
    )?.value || "new";


  const priority =
    document.getElementById(
      "newPriority"
    )?.value || "normal";


  const followUp =
    document.getElementById(
      "newFollowUp"
    )?.value;


  const requirements =
    document.getElementById(
      "newRequirements"
    )?.value.trim();


  const notes =
    document.getElementById(
      "newNotes"
    )?.value.trim();


  const message =
    document.getElementById(
      "addEnquiryMessage"
    );


  const saveBtn =
    document.getElementById(
      "saveNewEnquiryBtn"
    );


  if (!name || !mobile) {

    if (message) {

      message.textContent =
        "Customer name and mobile number are required.";

    }

    return;
  }


  if (saveBtn) {

    saveBtn.disabled =
      true;

    saveBtn.textContent =
      "Saving...";
  }


  if (message) {

    message.textContent =
      "Saving enquiry...";
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("customer_enquiries")
        .insert({

          customer_name:
            name,

          mobile:
            mobile,

          email:
            email || null,

          location:
            location || null,

          occasion:
            occasion || null,

          guests:
            guests
              ? Number(guests)
              : null,

          budget_per_person:
            budget
              ? Number(budget)
              : null,

          food_preference:
            food || null,

          event_date:
            eventDate || null,

          internal_notes:
            notes || null,

          source:
            source || "Other",

          status:
            status,

          assigned_to:
            null,

          follow_up_at:
            followUp
              ? new Date(
                  followUp
                ).toISOString()
              : null,

          priority:
            priority,

          requirements:
            requirements || null,

          last_contacted_at:
            null

        })
        .select()
        .single();


    if (error) {

      console.error(
        "ADD ENQUIRY ERROR:",
        error
      );


      if (message) {

        message.textContent =
          "Unable to save enquiry: " +
          error.message;
      }


      return;
    }


    console.log(
      "ENQUIRY CREATED:",
      data
    );


    if (message) {

      message.textContent =
        "Enquiry added successfully.";
    }


    await loadEnquiries();


    clearAddEnquiryForm();


    setTimeout(
      () => {

        closeAddEnquiryModal();

      },
      500
    );


  } catch (error) {

    console.error(
      "ADD ENQUIRY EXCEPTION:",
      error
    );


    if (message) {

      message.textContent =
        "Something went wrong: " +
        error.message;
    }

  } finally {

    if (saveBtn) {

      saveBtn.disabled =
        false;

      saveBtn.textContent =
        "Save Enquiry";
    }

  }

}


// =====================================================
// CLEAR ADD ENQUIRY FORM
// =====================================================

function clearAddEnquiryForm() {

  const fields = [

    "newCustomerName",
    "newMobile",
    "newEmail",
    "newLocation",
    "newEventDate",
    "newGuests",
    "newBudget",
    "newFollowUp",
    "newRequirements",
    "newNotes"

  ];


  fields.forEach(
    (id) => {

      const element =
        document.getElementById(
          id
        );

      if (element) {

        element.value =
          "";
      }

    }
  );


  const occasion =
    document.getElementById(
      "newOccasion"
    );

  if (occasion) {

    occasion.value =
      "";
  }


  const food =
    document.getElementById(
      "newFood"
    );

  if (food) {

    food.value =
      "";
  }


  const source =
    document.getElementById(
      "newSource"
    );

  if (source) {

    source.value =
      "Website";
  }


  const status =
    document.getElementById(
      "newStatus"
    );

  if (status) {

    status.value =
      "new";
  }


  const priority =
    document.getElementById(
      "newPriority"
    );

  if (priority) {

    priority.value =
      "normal";
  }

}


// =====================================================
// TOAST
// =====================================================

function showToast(
  message
) {

  const toast =
    document.getElementById(
      "toastMessage"
    );


  if (!toast) {
    return;
  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    2500
  );

}


// =====================================================
// HELPERS
// =====================================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;
  }

}


function formatDate(
  value
) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(
      value
    );


  if (Number.isNaN(
    date.getTime()
  )) {

    return value;
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


function toDateTimeLocal(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(
      value
    );


  if (Number.isNaN(
    date.getTime()
  )) {

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


function formatStatus(
  status
) {

  const values = {

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
    values[status] ||
    status ||
    "New"
  );

}


function formatPriority(
  priority
) {

  const values = {

    urgent:
      "Urgent",

    high:
      "High",

    normal:
      "Normal",

    low:
      "Low"

  };


  return (
    values[priority] ||
    priority ||
    "Normal"
  );

}


function escapeHTML(
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
