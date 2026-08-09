const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// =====================================================
// LOGIN
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    setupLogin();
    return;
  }

  await setupDashboard();
});


// =====================================================
// LOGIN FUNCTION
// =====================================================

function setupLogin() {

  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();
    event.stopPropagation();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "Signing in...";
    loginMessage.style.display = "block";

    try {

      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) {

        console.error("SUPABASE LOGIN ERROR:", error);

        loginMessage.textContent =
          "Login failed: " + error.message;

        return;
      }

      if (!data || !data.session) {

        loginMessage.textContent =
          "Login failed. No session created.";

        return;
      }

      loginMessage.textContent =
        "Login successful. Opening CRM...";

      window.location.href = "dashboard.html";

    } catch (error) {

      console.error("LOGIN ERROR:", error);

      loginMessage.textContent =
        "Login error: " + error.message;
    }

  });
}


// =====================================================
// DASHBOARD
// =====================================================

async function setupDashboard() {

  const { data: sessionData } =
    await supabaseClient.auth.getSession();

  const session = sessionData.session;

  // Not logged in → back to login
  if (!session) {

    window.location.href = "login.html";
    return;
  }


  // ---------------------------------------------------
  // STAFF NAME
  // ---------------------------------------------------

  const staffName =
    document.getElementById("staffName");

  if (staffName) {

    staffName.textContent =
      session.user.email || "Staff";
  }


  // ---------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------

  const logoutBtn =
    document.getElementById("logoutBtn");

  if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

      logoutBtn.disabled = true;
      logoutBtn.textContent = "Logging out...";

      const { error } =
        await supabaseClient.auth.signOut();

      if (error) {

        console.error("LOGOUT ERROR:", error);

        logoutBtn.disabled = false;
        logoutBtn.textContent = "Logout";

        alert("Unable to logout. Please try again.");

        return;
      }

      window.location.href = "login.html";

    });
  }


  // ---------------------------------------------------
  // REFRESH BUTTON
  // ---------------------------------------------------

  const refreshBtn =
    document.getElementById("refreshBtn");

  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      loadEnquiries
    );
  }


  // ---------------------------------------------------
  // SEARCH
  // ---------------------------------------------------

  const searchInput =
    document.getElementById("searchInput");

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      renderFilteredLeads
    );
  }


  // ---------------------------------------------------
  // FILTERS
  // ---------------------------------------------------

  const statusFilter =
    document.getElementById("statusFilter");

  const priorityFilter =
    document.getElementById("priorityFilter");

  if (statusFilter) {

    statusFilter.addEventListener(
      "change",
      renderFilteredLeads
    );
  }

  if (priorityFilter) {

    priorityFilter.addEventListener(
      "change",
      renderFilteredLeads
    );
  }


  // ---------------------------------------------------
  // LOAD ENQUIRIES
  // ---------------------------------------------------

  await loadEnquiries();
}


// =====================================================
// LOAD CUSTOMER ENQUIRIES
// =====================================================

let allLeads = [];

async function loadEnquiries() {

  const tableBody =
    document.getElementById("leadsTableBody");

  const emptyState =
    document.getElementById("emptyState");

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

    const { data, error } =
      await supabaseClient
        .from("customer_enquiries")
        .select("*")
        .order("created_at", {
          ascending: false
        });


    if (error) {

      console.error(
        "ENQUIRIES LOAD ERROR:",
        error
      );

      if (tableBody) {

        tableBody.innerHTML = `
          <tr>
            <td colspan="9" class="loading-cell">
              Unable to load enquiries.
            </td>
          </tr>
        `;
      }

      return;
    }


    allLeads = data || [];

    updateStats(allLeads);

    renderFilteredLeads();


    if (emptyState) {

      emptyState.hidden =
        allLeads.length !== 0;
    }

  } catch (error) {

    console.error(
      "CRM LOAD ERROR:",
      error
    );

    if (tableBody) {

      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="loading-cell">
            Unable to load enquiries.
          </td>
        </tr>
      `;
    }
  }
}


// =====================================================
// UPDATE STATS
// =====================================================

function updateStats(leads) {

  const total =
    document.getElementById("totalLeads");

  const newLeads =
    document.getElementById("newLeads");

  const followup =
    document.getElementById("followupLeads");

  const converted =
    document.getElementById("convertedLeads");


  if (total) {

    total.textContent =
      leads.length;
  }


  if (newLeads) {

    newLeads.textContent =
      leads.filter(
        lead =>
          String(
            lead.status ||
            lead.status ||
            ""
          ).toLowerCase() === "new"
      ).length;
  }


  if (followup) {

    followup.textContent =
      leads.filter(
        lead =>
          String(
            lead.status ||
            lead.status ||
            ""
          ).toLowerCase() === "follow_up"
      ).length;
  }


  if (converted) {

    converted.textContent =
      leads.filter(
        lead =>
          String(
            lead.status ||
            lead.status ||
            ""
          ).toLowerCase() === "converted"
      ).length;
  }
}


// =====================================================
// FILTER + SEARCH
// =====================================================

function renderFilteredLeads() {

  const searchInput =
    document.getElementById("searchInput");

  const statusFilter =
    document.getElementById("statusFilter");

  const priorityFilter =
    document.getElementById("priorityFilter");


  const search =
    searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";


  const status =
    statusFilter
      ? statusFilter.value.toLowerCase()
      : "";


  const priority =
    priorityFilter
      ? priorityFilter.value.toLowerCase()
      : "";


  const filtered =
    allLeads.filter(lead => {

      const customer =
        String(
          lead.customer_name || ""
        ).toLowerCase();

      const mobile =
        String(
          lead.mobile ||
          lead.mobile ||
          ""
        ).toLowerCase();

      const location =
        String(
          lead.location || ""
        ).toLowerCase();


      const leadStatus =
        String(
          lead.status ||
          lead.status ||
          ""
        ).toLowerCase();


      const leadPriority =
        String(
          lead.priority || ""
        ).toLowerCase();


      const matchesSearch =
        !search ||
        customer.includes(search) ||
        mobile.includes(search) ||
        location.includes(search);


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


  renderTable(filtered);
}


// =====================================================
// RENDER TABLE
// =====================================================

function renderTable(leads) {

  const tableBody =
    document.getElementById("leadsTableBody");

  const emptyState =
    document.getElementById("emptyState");


  if (!tableBody) return;


  if (!leads.length) {

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
    leads.map(lead => {

      const customer =
        escapeHtml(
          lead.customer_name || "—"
        );


      const occasion =
        escapeHtml(
          lead.occasion || "—"
        );


      const location =
        escapeHtml(
          lead.location || "—"
        );


      const eventDate =
        formatDate(
          lead.event_date
        );


      const guests =
        escapeHtml(
          lead.guests ?? "—"
        );


      const budget =
        lead.budget_per_person
          ? "₹" +
            escapeHtml(
              String(
                lead.budget_per_person
              )
            )
          : "—";


      const status =
        lead.status ||
        lead.status ||
        "new";


      const priority =
        lead.priority ||
        "normal";


      return `
        <tr>

          <td>
            <strong>${customer}</strong>
          </td>

          <td>
            ${occasion}
          </td>

          <td>
            ${location}
          </td>

          <td>
            ${eventDate}
          </td>

          <td>
            ${guests}
          </td>

          <td>
            ${budget}
          </td>

          <td>
            <span class="status-badge ${escapeHtml(status)}">
              ${formatStatus(status)}
            </span>
          </td>

          <td>
            <span class="priority-badge ${escapeHtml(priority)}">
              ${formatStatus(priority)}
            </span>
          </td>

          <td>
            <button
              type="button"
              class="view-lead-btn"
              onclick="openLead(${Number(lead.id)})"
            >
              View
            </button>
          </td>

        </tr>
      `;

    }).join("");
}


// =====================================================
// VIEW LEAD
// =====================================================

function openLead(id) {

  const lead =
    allLeads.find(
      item => Number(item.id) === Number(id)
    );

  if (!lead) return;


  setText(
    "modalCustomerName",
    lead.customer_name || "Customer"
  );

  setText(
    "modalMobile",
    lead.mobile ||
    lead.mobile ||
    "—"
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
    formatDate(lead.event_date)
  );

  setText(
    "modalGuests",
    lead.guests || "—"
  );

  setText(
    "modalBudget",
    lead.budget_per_person
      ? "₹" + lead.budget_per_person
      : "—"
  );

  setText(
    "modalFood",
    lead.food_preference || "—"
  );


  setText(
    "modalRequirements",
    lead.requirements ||
    lead.requirements ||
    "—"
  );


  const modalStatus =
    document.getElementById("modalStatus");

  const modalPriority =
    document.getElementById("modalPriority");

  const modalFollowUp =
    document.getElementById("modalFollowUp");

  const modalNotes =
    document.getElementById("modalNotes");


  if (modalStatus) {

    modalStatus.value =
      lead.status ||
      lead.status ||
      "new";
  }


  if (modalPriority) {

    modalPriority.value =
      lead.priority ||
      "normal";
  }


  if (modalFollowUp) {

    modalFollowUp.value =
      toDateTimeLocal(
        lead.follow_up_at
      );
  }


  if (modalNotes) {

    modalNotes.value =
      lead.internal_notes || "";
  }


  const callBtn =
    document.getElementById("modalCallBtn");

  const whatsappBtn =
    document.getElementById(
      "modalWhatsappBtn"
    );


  const mobile =
    lead.mobile ||
    lead.mobile ||
    "";


  if (callBtn) {

    callBtn.href =
      mobile
        ? "tel:" + mobile
        : "#";
  }


  if (whatsappBtn) {

    const cleanMobile =
      String(mobile)
        .replace(/\D/g, "");

    whatsappBtn.href =
      cleanMobile
        ? "https://wa.me/" +
          cleanMobile
        : "#";
  }


  const modal =
    document.getElementById("leadModal");

  if (modal) {

    modal.hidden = false;
  }


  window.currentLeadId =
    lead.id;
}


// =====================================================
// CLOSE MODAL
// =====================================================

document.addEventListener(
  "click",
  event => {

    if (
      event.target.id ===
      "closeModalBtn"
    ) {

      closeLeadModal();
    }


    if (
      event.target.id ===
      "cancelModalBtn"
    ) {

      closeLeadModal();
    }
  }
);


function closeLeadModal() {

  const modal =
    document.getElementById("leadModal");

  if (modal) {

    modal.hidden = true;
  }

  window.currentLeadId = null;
}


// =====================================================
// SAVE LEAD
// =====================================================

document.addEventListener(
  "click",
  async event => {

    if (
      event.target.id !==
      "saveLeadBtn"
    ) return;


    const id =
      window.currentLeadId;

    if (!id) return;


    const status =
      document.getElementById(
        "modalStatus"
      )?.value;


    const priority =
      document.getElementById(
        "modalPriority"
      )?.value;


    const followUp =
      document.getElementById(
        "modalFollowUp"
      )?.value;


    const notes =
      document.getElementById(
        "modalNotes"
      )?.value || "";


    const saveBtn =
      document.getElementById(
        "saveLeadBtn"
      );


    if (saveBtn) {

      saveBtn.disabled = true;
      saveBtn.textContent =
        "Saving...";
    }


    const { error } =
      await supabaseClient
        .from("customer_enquiries")
        .update({
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
        .eq("id", id);


    if (error) {

      console.error(
        "SAVE LEAD ERROR:",
        error
      );

      alert(
        "Unable to save changes: " +
        error.message
      );

    } else {

      closeLeadModal();

      await loadEnquiries();
    }


    if (saveBtn) {

      saveBtn.disabled = false;
      saveBtn.textContent =
        "Save Changes";
    }
  }
);


// =====================================================
// HELPERS
// =====================================================

function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {

    element.textContent =
      value ?? "—";
  }
}


function formatDate(value) {

  if (!value) return "—";

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {

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

  if (!value) return "";

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {

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


function formatStatus(value) {

  if (!value) return "—";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    );
}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
// =====================================================
// ADD NEW ENQUIRY
// =====================================================

document.addEventListener("click", (event) => {

  if (event.target.id === "addEnquiryBtn") {

    const modal =
      document.getElementById("addEnquiryModal");

    if (modal) {
      modal.hidden = false;
    }
  }


  if (
    event.target.id === "closeAddEnquiryBtn" ||
    event.target.id === "cancelAddEnquiryBtn"
  ) {

    closeAddEnquiryModal();
  }

});


function closeAddEnquiryModal() {

  const modal =
    document.getElementById("addEnquiryModal");

  if (modal) {
    modal.hidden = true;
  }

  const message =
    document.getElementById("addEnquiryMessage");

  if (message) {
    message.textContent = "";
  }
}


// =====================================================
// SAVE NEW ENQUIRY
// =====================================================

document.addEventListener("click", async (event) => {

  if (
    event.target.id !==
    "saveNewEnquiryBtn"
  ) {
    return;
  }


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


  // ---------------------------------------------------
  // REQUIRED FIELDS
  // ---------------------------------------------------

  if (!name || !mobile) {

    if (message) {

      message.textContent =
        "Customer name and mobile number are required.";

      message.style.display = "block";
    }

    return;
  }


  // ---------------------------------------------------
  // BUTTON STATE
  // ---------------------------------------------------

  if (saveBtn) {

    saveBtn.disabled = true;
    saveBtn.textContent =
      "Saving...";
  }


  if (message) {

    message.textContent =
      "Saving enquiry...";

    message.style.display =
      "block";
  }


  // ---------------------------------------------------
  // INSERT INTO SUPABASE
  // ---------------------------------------------------

  try {

    const { data, error } =
      await supabaseClient
        .from("customer_enquiries")
        .insert({

          customer_name: name,

         mobile: mobile,

          email:
            email || null,

          location:
            location || null,

          occasion:
            occasion || null,

          event_date:
            eventDate || null,

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

          source:
            source || "Other",

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

         requirements: requirements

          internal_notes:
            notes || null

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

      if (saveBtn) {

        saveBtn.disabled = false;

        saveBtn.textContent =
          "Save Enquiry";
      }

      return;
    }


    console.log(
      "New enquiry created:",
      data
    );


    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    if (message) {

      message.textContent =
        "Enquiry added successfully.";
    }


    // Refresh CRM list

    await loadEnquiries();


    // Clear form

    document.getElementById(
      "newCustomerName"
    ).value = "";

    document.getElementById(
      "newMobile"
    ).value = "";

    document.getElementById(
      "newEmail"
    ).value = "";

    document.getElementById(
      "newLocation"
    ).value = "";

    document.getElementById(
      "newOccasion"
    ).value = "";

    document.getElementById(
      "newEventDate"
    ).value = "";

    document.getElementById(
      "newGuests"
    ).value = "";

    document.getElementById(
      "newBudget"
    ).value = "";

    document.getElementById(
      "newFood"
    ).value = "";

    document.getElementById(
      "newSource"
    ).value = "Website";

    document.getElementById(
      "newStatus"
    ).value = "new";

    document.getElementById(
      "newPriority"
    ).value = "normal";

    document.getElementById(
      "newFollowUp"
    ).value = "";

    document.getElementById(
      "newRequirements"
    ).value = "";

    document.getElementById(
      "newNotes"
    ).value = "";


    // Close after short delay

    setTimeout(() => {

      closeAddEnquiryModal();

    }, 700);


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

      saveBtn.disabled = false;

      saveBtn.textContent =
        "Save Enquiry";
    }

  }

});
