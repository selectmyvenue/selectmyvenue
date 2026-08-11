/* =========================================================
   SELECT MY VENUE — CRM
   COMPLETE CRM JAVASCRIPT
   PHASE 2 — CUSTOMER CONTACT + EDITABLE LEAD DETAILS
   ========================================================= */


/* =========================================================
   SUPABASE
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

let currentEnquiries = [];
let currentLead = null;

let activeLeadTab = "";

let originalContactRemark = "";


/* =========================================================
   STATUS OPTIONS
   IMPORTANT:
   These values MUST match dashboard.html
   ========================================================= */

const STATUS_OPTIONS = [
  {
    value: "new",
    label: "New Lead"
  },
  {
    value: "not_pick",
    label: "Not Pick"
  },
  {
    value: "call_back",
    label: "Call Back"
  },
  {
    value: "call_disconnected",
    label: "Call Disconnected"
  },
  {
    value: "detail_shared",
    label: "Detail Shared"
  },
  {
    value: "interested",
    label: "Interested"
  },
  {
    value: "not_interested",
    label: "Not Interested"
  },
  {
    value: "wrong_number",
    label: "Wrong Number"
  },
  {
    value: "qualified",
    label: "Qualified"
  },
  {
    value: "converted",
    label: "Converted"
  },
  {
    value: "closed",
    label: "Closed"
  }
];


/* =========================================================
   PAGE READY
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const loginForm =
      document.getElementById("loginForm");

    if (loginForm) {

      setupLogin();

      return;
    }


    const logoutBtn =
      document.getElementById("logoutBtn");

    if (logoutBtn) {

      await setupCRM();

    }

  }
);


/* =========================================================
   LOGIN
   ========================================================= */

function setupLogin() {

  const loginForm =
    document.getElementById("loginForm");

  const loginMessage =
    document.getElementById("loginMessage");

  if (!loginForm) return;


  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        document
          .getElementById("email")
          ?.value
          .trim();


      const password =
        document
          .getElementById("password")
          ?.value;


      if (!email || !password) {

        if (loginMessage) {

          loginMessage.textContent =
            "Please enter email and password.";

          loginMessage.style.display =
            "block";

        }

        return;
      }


      if (loginMessage) {

        loginMessage.textContent =
          "Signing in...";

        loginMessage.style.display =
          "block";

      }


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signInWithPassword({
              email,
              password
            });


        if (error) {

          console.error(
            "LOGIN ERROR:",
            error
          );


          if (loginMessage) {

            loginMessage.textContent =
              "Login failed: " +
              error.message;

          }

          return;
        }


        if (!data?.session) {

          if (loginMessage) {

            loginMessage.textContent =
              "Login failed. No session created.";

          }

          return;
        }


        if (loginMessage) {

          loginMessage.textContent =
            "Login successful. Opening CRM...";

        }


        window.location.href =
          "dashboard.html";


      } catch (error) {

        console.error(
          "LOGIN EXCEPTION:",
          error
        );


        if (loginMessage) {

          loginMessage.textContent =
            "Login error: " +
            error.message;

        }

      }

    }
  );

}


/* =========================================================
   CRM SETUP
   ========================================================= */

async function setupCRM() {

  try {

    const {
      data: {
        session
      }
    } =
      await supabaseClient.auth
        .getSession();


    if (!session) {

      window.location.href =
        "login.html";

      return;
    }


    setupLogout();

    setupSearch();

    setupFilters();

    setupRefresh();

    setupLeadTabs();

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


/* =========================================================
   STAFF NAME
   ========================================================= */

function showStaffName(user) {

  const staffName =
    document.getElementById(
      "staffName"
    );


  if (!staffName) return;


  staffName.textContent =
    user?.email ||
    "Staff";

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


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );


  if (!logoutBtn) return;


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
          await supabaseClient.auth
            .signOut();


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


/* =========================================================
   LOAD ENQUIRIES
   ========================================================= */

async function loadEnquiries() {

  const tableBody =
    document.getElementById(
      "leadsTableBody"
    );


  if (tableBody) {

    tableBody.innerHTML = `
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
              colspan="12"
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
      Array.isArray(data)
        ? data
        : [];


    updateStats(
      currentEnquiries
    );


    applyFilters();


  } catch (error) {

    console.error(
      "LOAD ENQUIRIES EXCEPTION:",
      error
    );


    if (tableBody) {

      tableBody.innerHTML = `
        <tr>
          <td
            colspan="12"
            class="loading-cell"
          >
            Unable to load enquiries.
          </td>
        </tr>
      `;

    }

  }

}


/* =========================================================
   RENDER ENQUIRIES
   ========================================================= */

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


  if (!tableBody) return;


  if (!enquiries.length) {

    tableBody.innerHTML =
      "";


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


  tableBody.innerHTML =
    enquiries
      .map(
        (lead) => {

          const status =
            lead.status ||
            "new";


          const priority =
            lead.priority ||
            "normal";


          const mobile =
            lead.mobile ||
            "";


          const remark =
            lead.contact_remark ||
            "";


          const contactCount =
            Number(
              lead.contact_count ||
              0
            );


          return `
            <tr>

              <td>

                <strong
                  class="customer-name"
                >
                  ${escapeHTML(
                    lead.customer_name ||
                    "Unnamed"
                  )}
                </strong>

                <small>
                  ${escapeHTML(
                    lead.email ||
                    ""
                  )}
                </small>

              </td>


              <td>

                ${
                  mobile
                    ? `
                      <a
                        href="tel:${escapeHTML(
                          mobile
                        )}"
                        class="phone-link"
                      >
                        ☎ ${escapeHTML(
                          mobile
                        )}
                      </a>
                    `
                    : "—"
                }

              </td>


              <td>
                ${escapeHTML(
                  lead.occasion ||
                  "—"
                )}
              </td>


              <td>
                ${escapeHTML(
                  lead.location ||
                  "—"
                )}
              </td>


              <td>
                ${formatDate(
                  lead.event_date
                )}
              </td>


              <td>
                ${
                  lead.guests ??
                  "—"
                }
              </td>


              <td>

                ${
                  lead.budget_per_person
                    ? "₹" +
                      Number(
                        lead.budget_per_person
                      ).toLocaleString(
                        "en-IN"
                      )
                    : "—"
                }

              </td>


              <td>

                <select
                  class="inline-status-select ${getStatusClass(
                    status
                  )}"
                  data-lead-id="${escapeHTML(
                    String(lead.id)
                  )}"
                  data-current-value="${escapeHTML(
                    status
                  )}"
                  aria-label="Change lead status"
                >

                  ${buildStatusOptions(
                    status
                  )}

                </select>

              </td>


              <td>

                <select
                  class="inline-priority-select priority-${escapeHTML(
                    priority
                  )}"
                  data-lead-id="${escapeHTML(
                    String(lead.id)
                  )}"
                  data-current-value="${escapeHTML(
                    priority
                  )}"
                  aria-label="Change lead priority"
                >

                  <option
                    value="urgent"
                    ${
                      priority ===
                      "urgent"
                        ? "selected"
                        : ""
                    }
                  >
                    Urgent
                  </option>

                  <option
                    value="high"
                    ${
                      priority ===
                      "high"
                        ? "selected"
                        : ""
                    }
                  >
                    High
                  </option>

                  <option
                    value="normal"
                    ${
                      priority ===
                      "normal"
                        ? "selected"
                        : ""
                    }
                  >
                    Normal
                  </option>

                  <option
                    value="low"
                    ${
                      priority ===
                      "low"
                        ? "selected"
                        : ""
                    }
                  >
                    Low
                  </option>

                </select>

              </td>


              <td>

                <button
                  type="button"
                  class="remark-table-btn"
                  data-lead-id="${escapeHTML(
                    String(lead.id)
                  )}"
                  title="View contact remark"
                >
                  ${
                    remark
                      ? escapeHTML(
                          remark
                        )
                      : "Add Remark"
                  }
                </button>

              </td>


              <td>

                <div class="contact-cell">

                  ${
                    mobile
                      ? `
                        <a
                          href="tel:${escapeHTML(
                            mobile
                          )}"
                          class="mini-contact"
                          title="Call customer"
                        >
                          ☎
                        </a>
                      `
                      : ""
                  }

                  ${
                    mobile
                      ? `
                        <a
                          href="${buildWhatsAppURL(
                            mobile
                          )}"
                          target="_blank"
                          rel="noopener"
                          class="mini-contact whatsapp-mini"
                          title="WhatsApp customer"
                        >
                          ◉
                        </a>
                      `
                      : ""
                  }

                  <span
                    class="contact-count"
                    title="Contact count"
                  >
                    ${contactCount}
                  </span>

                </div>

              </td>


              <td>

                <button
                  type="button"
                  class="view-lead-btn"
                  data-lead-id="${escapeHTML(
                    String(lead.id)
                  )}"
                >
                  View
                </button>

              </td>

            </tr>
          `;

        }
      )
      .join("");


  setupInlineLeadControls();


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
              button.dataset
                .leadId;


            const lead =
              currentEnquiries.find(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    leadId
                  )
              );


            if (lead) {

              openLeadModal(
                lead
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".remark-table-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const leadId =
              button.dataset
                .leadId;


            const lead =
              currentEnquiries.find(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    leadId
                  )
              );


            if (lead) {

              openRemarkModal(
                lead
              );

            }

          }
        );

      }
    );

}


/* =========================================================
   BUILD STATUS OPTIONS
   ========================================================= */

function buildStatusOptions(
  currentStatus
) {

  return STATUS_OPTIONS
    .map(
      (option) => `
        <option
          value="${escapeHTML(
            option.value
          )}"
          ${
            currentStatus ===
            option.value
              ? "selected"
              : ""
          }
        >
          ${escapeHTML(
            option.label
          )}
        </option>
      `
    )
    .join("");

}


/* =========================================================
   INLINE STATUS / PRIORITY
   ========================================================= */

function setupInlineLeadControls() {

  document
    .querySelectorAll(
      ".inline-status-select"
    )
    .forEach(
      (select) => {

        select.addEventListener(
          "change",
          async () => {

            const leadId =
              select.dataset
                .leadId;


            const newStatus =
              select.value;


            await updateLeadInline(
              leadId,
              {
                status:
                  newStatus
              },
              select
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".inline-priority-select"
    )
    .forEach(
      (select) => {

        select.addEventListener(
          "change",
          async () => {

            const leadId =
              select.dataset
                .leadId;


            const newPriority =
              select.value;


            await updateLeadInline(
              leadId,
              {
                priority:
                  newPriority
              },
              select
            );

          }
        );

      }
    );

}


/* =========================================================
   INLINE UPDATE
   ========================================================= */

async function updateLeadInline(
  leadId,
  changes,
  selectElement
) {

  if (!leadId) return;


  const lead =
    currentEnquiries.find(
      (item) =>
        String(item.id) ===
        String(leadId)
    );


  if (!lead) return;


  const previousValue =
    selectElement.dataset
      .currentValue;


  selectElement.disabled =
    true;


  try {

    const updateData = {

      ...changes,

      updated_at:
        new Date()
          .toISOString()

    };


    const {
      error
    } =
      await supabaseClient
        .from("customer_enquiries")
        .update(
          updateData
        )
        .eq(
          "id",
          leadId
        );


    if (error) {

      console.error(
        "INLINE UPDATE ERROR:",
        error
      );


      selectElement.value =
        previousValue;


      showToast(
        "Unable to update lead: " +
        error.message
      );


      return;
    }


    Object.assign(
      lead,
      changes
    );


    selectElement.dataset
      .currentValue =
      selectElement.value;


    if (
      Object.prototype
        .hasOwnProperty.call(
          changes,
          "status"
        )
    ) {

      selectElement.className =
        "inline-status-select " +
        getStatusClass(
          changes.status
        );

    }


    if (
      Object.prototype
        .hasOwnProperty.call(
          changes,
          "priority"
        )
    ) {

      selectElement.className =
        "inline-priority-select priority-" +
        changes.priority;

    }


    updateStats(
      currentEnquiries
    );


    showToast(
      "Lead updated successfully."
    );


  } catch (error) {

    console.error(
      "INLINE UPDATE EXCEPTION:",
      error
    );


    selectElement.value =
      previousValue;


    showToast(
      "Something went wrong."
    );


  } finally {

    selectElement.disabled =
      false;

  }

}


/* =========================================================
   STATS
   ========================================================= */

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
        (lead) =>
          (
            lead.status ||
            "new"
          ) ===
          "new"
      ).length;

  }


  if (followup) {

    followup.textContent =
      enquiries.filter(
        (lead) =>
          (
            lead.status ||
            "new"
          ) ===
          "call_back"
      ).length;

  }


  if (converted) {

    converted.textContent =
      enquiries.filter(
        (lead) =>
          (
            lead.status ||
            "new"
          ) ===
          "converted"
      ).length;

  }

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

  const searchInput =
    document.getElementById(
      "searchInput"
    );


  if (!searchInput) return;


  searchInput.addEventListener(
    "input",
    applyFilters
  );

}


/* =========================================================
   FILTERS
   ========================================================= */

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
      () => {

        activeLeadTab =
          "";


        setActiveLeadTab(
          null
        );


        applyFilters();

      }
    );

  }


  if (priorityFilter) {

    priorityFilter.addEventListener(
      "change",
      applyFilters
    );

  }

}


/* =========================================================
   APPLY FILTERS
   ========================================================= */

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
    )
      .trim()
      .toLowerCase();


  const dropdownStatus =
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

          lead.occasion,

          lead.source,

          lead.contact_remark,

          lead.internal_notes,

          lead.requirements

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        const matchesSearch =
          !search ||
          searchable.includes(
            search
          );


        const leadStatus =
          lead.status ||
          "new";


        const matchesTab =
          !activeLeadTab ||
          leadStatus ===
          activeLeadTab;


        const matchesStatus =
          !dropdownStatus ||
          leadStatus ===
          dropdownStatus;


        const matchesPriority =
          !priority ||
          (
            lead.priority ||
            "normal"
          ) ===
          priority;


        return (
          matchesSearch &&
          matchesTab &&
          matchesStatus &&
          matchesPriority
        );

      }
    );


  renderEnquiries(
    filtered
  );

}


/* =========================================================
   REFRESH
   ========================================================= */

function setupRefresh() {

  const refreshBtn =
    document.getElementById(
      "refreshBtn"
    );


  if (!refreshBtn) return;


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


/* =========================================================
   LEAD TABS
   ========================================================= */

function setupLeadTabs() {

  const tabs =
    document.querySelectorAll(
      ".stat-tab"
    );


  if (!tabs.length) return;


  tabs.forEach(
    (tab) => {

      tab.addEventListener(
        "click",
        () => {

          activeLeadTab =
            tab.dataset.status ||
            "";


          setActiveLeadTab(
            tab
          );


          const statusFilter =
            document.getElementById(
              "statusFilter"
            );


          if (statusFilter) {

            statusFilter.value =
              "";

          }


          applyFilters();

        }
      );

    }
  );

}


/* =========================================================
   ACTIVE TAB
   ========================================================= */

function setActiveLeadTab(
  selectedTab
) {

  document
    .querySelectorAll(
      ".stat-tab"
    )
    .forEach(
      (tab) => {

        tab.classList.remove(
          "active"
        );

      }
    );


  if (selectedTab) {

    selectedTab.classList.add(
      "active"
    );

  }

}


/* =========================================================
   LEAD MODAL
   ========================================================= */

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


  const modal =
    document.getElementById(
      "leadModal"
    );


  if (modal) {

    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          modal
        ) {

          closeLeadModal();

        }

      }
    );

  }


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


      const leadModal =
        document.getElementById(
          "leadModal"
        );


      const addModal =
        document.getElementById(
          "addEnquiryModal"
        );


      const remarkModal =
        document.getElementById(
          "remarkModal"
        );


      if (
        leadModal &&
        !leadModal.hidden
      ) {

        closeLeadModal();

      }


      if (
        addModal &&
        !addModal.hidden
      ) {

        closeAddEnquiryModal();

      }


      if (
        remarkModal &&
        !remarkModal.hidden
      ) {

        closeRemarkModal();

      }

    }
  );

}


/* =========================================================
   OPEN LEAD MODAL
   ========================================================= */

function openLeadModal(
  lead
) {

  currentLead =
    lead;


  originalContactRemark =
    lead.contact_remark ||
    "";


  /* CUSTOMER NAME */

  setInputValue(
    "modalCustomerNameInput",
    lead.customer_name ||
    ""
  );


  /* MOBILE */

  setInputValue(
    "modalMobileInput",
    lead.mobile ||
    ""
  );


  /* EMAIL */

  setInputValue(
    "modalEmailInput",
    lead.email ||
    ""
  );


  /* LOCATION */

  setInputValue(
    "modalLocationInput",
    lead.location ||
    ""
  );


  /* OCCASION */

  setInputValue(
    "modalOccasionInput",
    lead.occasion ||
    ""
  );


  /* EVENT DATE */

  setInputValue(
    "modalEventDateInput",
    lead.event_date
      ? formatDateForInput(
          lead.event_date
        )
      : ""
  );


  /* GUESTS */

  setInputValue(
    "modalGuestsInput",
    lead.guests ??
    ""
  );


  /* BUDGET */

  setInputValue(
    "modalBudgetInput",
    lead.budget_per_person ??
    ""
  );


  /* FOOD */

  setInputValue(
    "modalFoodInput",
    lead.food_preference ||
    ""
  );


  /* REQUIREMENTS */

  setInputValue(
    "modalRequirementsInput",
    lead.requirements ||
    ""
  );


  /* CONTACT REMARK */

  setInputValue(
    "modalContactRemark",
    lead.contact_remark ||
    ""
  );


  /* CONTACT COUNT */

  setText(
    "modalContactCount",
    Number(
      lead.contact_count ||
      0
    )
  );


  /* LAST CONTACT */

  setText(
    "modalLastContacted",
    lead.last_contacted_at
      ? formatDateTime(
          lead.last_contacted_at
        )
      : "Never"
  );


  /* STATUS */

  const status =
    document.getElementById(
      "modalStatus"
    );


  if (status) {

    status.innerHTML =
      buildStatusOptions(
        lead.status ||
        "new"
      );

  }


  /* PRIORITY */

  setInputValue(
    "modalPriority",
    lead.priority ||
    "normal"
  );


  /* FOLLOW UP */

  setInputValue(
    "modalFollowUp",
    toDateTimeLocal(
      lead.follow_up_at
    )
  );


  /* INTERNAL NOTES */

  setInputValue(
    "modalNotes",
    lead.internal_notes ||
    ""
  );


  /* CALL BUTTON */

  const callBtn =
    document.getElementById(
      "modalCallBtn"
    );


  if (callBtn) {

    callBtn.href =
      lead.mobile
        ? "tel:" +
          lead.mobile
        : "#";

  }


  /* WHATSAPP BUTTON */

  const whatsappBtn =
    document.getElementById(
      "modalWhatsappBtn"
    );


  if (whatsappBtn) {

    whatsappBtn.href =
      buildWhatsAppURL(
        lead.mobile
      );

  }


  /* OPEN MODAL */

  const modal =
    document.getElementById(
      "leadModal"
    );


  if (modal) {

    modal.hidden =
      false;


    document.body.style.overflow =
      "hidden";

  }

}


/* =========================================================
   CLOSE LEAD MODAL
   ========================================================= */

function closeLeadModal() {

  const modal =
    document.getElementById(
      "leadModal"
    );


  if (modal) {

    modal.hidden =
      true;

  }


  document.body.style.overflow =
    "";


  currentLead =
    null;


  originalContactRemark =
    "";

}


/* =========================================================
   SAVE LEAD MODAL CHANGES
   ========================================================= */

async function saveLeadChanges() {

  if (
    !currentLead ||
    !currentLead.id
  ) {

    showToast(
      "No lead selected."
    );

    return;
  }


  /* =======================================================
     READ CUSTOMER FIELDS
     ======================================================= */

  const customerName =
    getInputValue(
      "modalCustomerNameInput"
    );


  const mobile =
    getInputValue(
      "modalMobileInput"
    );


  const email =
    getInputValue(
      "modalEmailInput"
    );


  const location =
    getInputValue(
      "modalLocationInput"
    );


  const occasion =
    getInputValue(
      "modalOccasionInput"
    );


  const eventDate =
    getInputValue(
      "modalEventDateInput"
    );


  const guests =
    getInputValue(
      "modalGuestsInput"
    );


  const budget =
    getInputValue(
      "modalBudgetInput"
    );


  const foodPreference =
    getInputValue(
      "modalFoodInput"
    );


  const requirements =
    getInputValue(
      "modalRequirementsInput"
    );


  const contactRemark =
    getInputValue(
      "modalContactRemark"
    );


  /* =======================================================
     CRM
     ======================================================= */

  const status =
    document.getElementById(
      "modalStatus"
    )?.value ||
    "new";


  const priority =
    document.getElementById(
      "modalPriority"
    )?.value ||
    "normal";


  const followUp =
    document.getElementById(
      "modalFollowUp"
    )?.value ||
    "";


  const notes =
    getInputValue(
      "modalNotes"
    );


  /* =======================================================
     CONTACT TRACKING
     ======================================================= */

  const remarkChanged =
    contactRemark !==
    originalContactRemark;


  if (saveBtnExists()) {

    const saveBtn =
      document.getElementById(
        "saveLeadBtn"
      );


    saveBtn.disabled =
      true;


    saveBtn.textContent =
      "Saving...";

  }


  try {

    const updateData = {

      customer_name:
        customerName ||
        null,

      mobile:
        mobile ||
        null,

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
        eventDate ||
        null,

      guests:
        guests
          ? Number(
              guests
            )
          : null,

      budget_per_person:
        budget
          ? Number(
              budget
            )
          : null,

      food_preference:
        foodPreference ||
        null,

      requirements:
        requirements ||
        null,

      status,

      priority,

      follow_up_at:
        followUp
          ? new Date(
              followUp
            ).toISOString()
          : null,

      internal_notes:
        notes ||
        null,

      contact_remark:
        contactRemark ||
        null,

      updated_at:
        new Date()
          .toISOString()

    };


    /* =====================================================
       CONTACT HISTORY
       ===================================================== */

    if (remarkChanged) {

      updateData.contact_count =
        Number(
          currentLead.contact_count ||
          0
        ) + 1;


      updateData.last_contacted_at =
        new Date()
          .toISOString();

    }


    /* =====================================================
       CONVERSION DATE
       ===================================================== */

    if (
      status ===
      "converted" &&
      currentLead.status !==
      "converted"
    ) {

      updateData.converted_at =
        new Date()
          .toISOString();

    }


    /* =====================================================
       SAVE
       ===================================================== */

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
          currentLead.id
        );


    if (error) {

      console.error(
        "UPDATE LEAD ERROR:",
        error
      );


      showToast(
        "Unable to save: " +
        error.message
      );


      return;
    }


    /* =====================================================
       LOCAL UPDATE
       ===================================================== */

    Object.assign(
      currentLead,
      updateData
    );


    /* =====================================================
       SUCCESS
       ===================================================== */

    showToast(
      remarkChanged
        ? "Lead + contact history saved."
        : "Lead updated successfully."
    );


    closeLeadModal();


    await loadEnquiries();


  } catch (error) {

    console.error(
      "SAVE LEAD EXCEPTION:",
      error
    );


    showToast(
      "Something went wrong: " +
      error.message
    );


  } finally {

    const saveBtn =
      document.getElementById(
        "saveLeadBtn"
      );


    if (saveBtn) {

      saveBtn.disabled =
        false;


      saveBtn.textContent =
        "Save Changes";

    }

  }

}


/* =========================================================
   ADD ENQUIRY SETUP
   ========================================================= */

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


  const modal =
    document.getElementById(
      "addEnquiryModal"
    );


  if (modal) {

    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          modal
        ) {

          closeAddEnquiryModal();

        }

      }
    );

  }

}


/* =========================================================
   OPEN ADD ENQUIRY
   ========================================================= */

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


  document.body.style.overflow =
    "hidden";

}


/* =========================================================
   CLOSE ADD ENQUIRY
   ========================================================= */

function closeAddEnquiryModal() {

  const modal =
    document.getElementById(
      "addEnquiryModal"
    );


  if (modal) {

    modal.hidden =
      true;

  }


  document.body.style.overflow =
    "";


  const message =
    document.getElementById(
      "addEnquiryMessage"
    );


  if (message) {

    message.textContent =
      "";

  }

}


/* =========================================================
   SAVE NEW ENQUIRY
   ========================================================= */

async function saveNewEnquiry() {

  const name =
    getInputValue(
      "newCustomerName"
    );


  const mobile =
    getInputValue(
      "newMobile"
    );


  const email =
    getInputValue(
      "newEmail"
    );


  const location =
    getInputValue(
      "newLocation"
    );


  const occasion =
    document.getElementById(
      "newOccasion"
    )?.value ||
    "";


  const eventDate =
    document.getElementById(
      "newEventDate"
    )?.value ||
    "";


  const guests =
    document.getElementById(
      "newGuests"
    )?.value ||
    "";


  const budget =
    document.getElementById(
      "newBudget"
    )?.value ||
    "";


  const food =
    document.getElementById(
      "newFood"
    )?.value ||
    "";


  const source =
    document.getElementById(
      "newSource"
    )?.value ||
    "Website";


  const status =
    document.getElementById(
      "newStatus"
    )?.value ||
    "new";


  const priority =
    document.getElementById(
      "newPriority"
    )?.value ||
    "normal";


  const followUp =
    document.getElementById(
      "newFollowUp"
    )?.value ||
    "";


  const requirements =
    getInputValue(
      "newRequirements"
    );


  const contactRemark =
    getInputValue(
      "newContactRemark"
    );


  const notes =
    getInputValue(
      "newNotes"
    );


  const message =
    document.getElementById(
      "addEnquiryMessage"
    );


  const saveBtn =
    document.getElementById(
      "saveNewEnquiryBtn"
    );


  if (
    !name ||
    !mobile
  ) {

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
        .from(
          "customer_enquiries"
        )
        .insert({

          customer_name:
            name,

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

          guests:
            guests
              ? Number(
                  guests
                )
              : null,

          budget_per_person:
            budget
              ? Number(
                  budget
                )
              : null,

          food_preference:
            food ||
            null,

          event_date:
            eventDate ||
            null,

          internal_notes:
            notes ||
            null,

          contact_remark:
            contactRemark ||
            null,

          contact_count:
            contactRemark
              ? 1
              : 0,

          last_contacted_at:
            contactRemark
              ? new Date()
                  .toISOString()
              : null,

          source:
            source ||
            "Other",

          status,

          assigned_to:
            null,

          follow_up_at:
            followUp
              ? new Date(
                  followUp
                ).toISOString()
              : null,

          priority,

          requirements:
            requirements ||
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


    clearAddEnquiryForm();


    await loadEnquiries();


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


/* =========================================================
   CLEAR ADD ENQUIRY FORM
   ========================================================= */

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
    "newContactRemark",
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


/* =========================================================
   QUICK REMARK MODAL
   ========================================================= */

function setupRemarkModal() {

  const closeBtn =
    document.getElementById(
      "closeRemarkModalBtn"
    );


  const cancelBtn =
    document.getElementById(
      "cancelRemarkBtn"
    );


  const saveBtn =
    document.getElementById(
      "saveRemarkBtn"
    );


  if (closeBtn) {

    closeBtn.addEventListener(
      "click",
      closeRemarkModal
    );

  }


  if (cancelBtn) {

    cancelBtn.addEventListener(
      "click",
      closeRemarkModal
    );

  }


  if (saveBtn) {

    saveBtn.addEventListener(
      "click",
      saveRemark
    );

  }


  const modal =
    document.getElementById(
      "remarkModal"
    );


  if (modal) {

    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          modal
        ) {

          closeRemarkModal();

        }

      }
    );

  }

}


/* =========================================================
   OPEN QUICK REMARK MODAL
   ========================================================= */

function openRemarkModal(
  lead
) {

  currentLead =
    lead;


  const customerName =
    document.getElementById(
      "remarkCustomerName"
    );


  if (customerName) {

    customerName.textContent =
      lead.customer_name ||
      "Customer";

  }


  const input =
    document.getElementById(
      "remarkInput"
    );


  if (input) {

    input.value =
      lead.contact_remark ||
      "";

  }


  const message =
    document.getElementById(
      "remarkMessage"
    );


  if (message) {

    message.textContent =
      "";

  }


  const modal =
    document.getElementById(
      "remarkModal"
    );


  if (modal) {

    modal.hidden =
      false;


    document.body.style.overflow =
      "hidden";

  }

}


/* =========================================================
   CLOSE QUICK REMARK MODAL
   ========================================================= */

function closeRemarkModal() {

  const modal =
    document.getElementById(
      "remarkModal"
    );


  if (modal) {

    modal.hidden =
      true;

  }


  document.body.style.overflow =
    "";


  currentLead =
    null;

}


/* =========================================================
   SAVE QUICK REMARK
   ========================================================= */

async function saveRemark() {

  if (
    !currentLead ||
    !currentLead.id
  ) {

    return;
  }


  const input =
    document.getElementById(
      "remarkInput"
    );


  const message =
    document.getElementById(
      "remarkMessage"
    );


  const saveBtn =
    document.getElementById(
      "saveRemarkBtn"
    );


  const remark =
    String(
      input?.value ||
      ""
    ).trim();


  if (!remark) {

    if (message) {

      message.textContent =
        "Please enter a remark.";

    }


    return;
  }


  if (saveBtn) {

    saveBtn.disabled =
      true;


    saveBtn.textContent =
      "Saving...";

  }


  try {

    const newCount =
      Number(
        currentLead.contact_count ||
        0
      ) + 1;


    const updateData = {

      contact_remark:
        remark,

      contact_count:
        newCount,

      last_contacted_at:
        new Date()
          .toISOString(),

      updated_at:
        new Date()
          .toISOString()

    };


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
          currentLead.id
        );


    if (error) {

      console.error(
        "SAVE REMARK ERROR:",
        error
      );


      if (message) {

        message.textContent =
          "Unable to save remark: " +
          error.message;

      }


      return;
    }


    Object.assign(
      currentLead,
      updateData
    );


    showToast(
      "Contact remark saved."
    );


    closeRemarkModal();


    await loadEnquiries();


  } catch (error) {

    console.error(
      "SAVE REMARK EXCEPTION:",
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
        "Save Remark";

    }

  }

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  message
) {

  const toastMessage =
    document.getElementById(
      "toastMessage"
    );


  const toast =
    document.getElementById(
      "toast"
    );


  if (toastMessage) {

    toastMessage.textContent =
      message;

  }


  if (toast) {

    toast.hidden =
      false;


    toast.classList.add(
      "show"
    );


    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );


        toast.hidden =
          true;

      },
      2500
    );


  } else {

    console.log(
      "TOAST:",
      message
    );

  }

}


/* =========================================================
   INPUT HELPERS
   ========================================================= */

function getInputValue(
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
    element.value ??
    ""
  ).trim();

}


function setInputValue(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {

    return;

  }


  element.value =
    value ??
    "";

}


/* =========================================================
   TEXT HELPER
   ========================================================= */

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
      value ??
      "";

  }

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

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


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

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


/* =========================================================
   DATE + TIME FORMAT
   ========================================================= */

function formatDateTime(
  value
) {

  if (!value) {

    return "—";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

  }


  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


/* =========================================================
   DATE INPUT FORMAT
   ========================================================= */

function formatDateForInput(
  value
) {

  if (!value) {

    return "";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    )
      .padStart(
        2,
        "0"
      );


  const day =
    String(
      date.getDate()
    )
      .padStart(
        2,
        "0"
      );


  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}


/* =========================================================
   DATETIME LOCAL
   ========================================================= */

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


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  const pad =
    (number) =>
      String(
        number
      )
        .padStart(
          2,
          "0"
        );


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
   STATUS
   ========================================================= */

function formatStatus(
  status
) {

  const found =
    STATUS_OPTIONS.find(
      (item) =>
        item.value ===
        status
    );


  return (
    found?.label ||
    status ||
    "New Lead"
  );

}


function getStatusClass(
  status
) {

  const classes = {

    new:
      "status-new",

    not_pick:
      "status-progress",

    call_back:
      "status-progress",

    call_disconnected:
      "status-progress",

    detail_shared:
      "status-progress",

    interested:
      "status-contacted",

    not_interested:
      "status-closed",

    wrong_number:
      "status-closed",

    qualified:
      "status-contacted",

    converted:
      "status-contacted",

    closed:
      "status-closed"

  };


  return (
    classes[
      status
    ] ||
    "status-new"
  );

}


/* =========================================================
   PRIORITY
   ========================================================= */

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
    values[
      priority
    ] ||
    priority ||
    "Normal"
  );

}


/* =========================================================
   WHATSAPP URL
   ========================================================= */

function buildWhatsAppURL(
  mobile
) {

  const cleanMobile =
    String(
      mobile ||
      ""
    )
      .replace(
        /\D/g,
        ""
      );


  let whatsappNumber =
    cleanMobile;


  if (
    cleanMobile.length ===
    10
  ) {

    whatsappNumber =
      "91" +
      cleanMobile;

  }


  if (!whatsappNumber) {

    return "#";

  }


  return (
    "https://wa.me/" +
    whatsappNumber
  );

}


/* =========================================================
   SAVE BUTTON HELPER
   ========================================================= */

function saveBtnExists() {

  return Boolean(
    document.getElementById(
      "saveLeadBtn"
    )
  );

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ??
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
