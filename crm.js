const SUPABASE_URL =
  "https://uajqwyoqbbswkfiwosyw.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


// =====================================================
// GLOBAL CRM STATE
// =====================================================

let currentEnquiries = [];
let currentLead = null;
let activeLeadTab = "";


// =====================================================
// PAGE READY
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

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
});


// =====================================================
// LOGIN
// =====================================================

function setupLogin() {

  const loginForm =
    document.getElementById("loginForm");

  const loginMessage =
    document.getElementById("loginMessage");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();
    event.stopPropagation();

    const email =
      document.getElementById("email")?.value.trim();

    const password =
      document.getElementById("password")?.value;

    if (!email || !password) {

      if (loginMessage) {
        loginMessage.textContent =
          "Please enter email and password.";
        loginMessage.style.display = "block";
      }

      return;
    }

    if (loginMessage) {
      loginMessage.textContent = "Signing in...";
      loginMessage.style.display = "block";
    }

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

        if (loginMessage) {
          loginMessage.textContent =
            "Login failed: " + error.message;
        }

        return;
      }

      if (!data || !data.session) {

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

      window.location.href = "dashboard.html";

    } catch (error) {

      console.error("LOGIN ERROR:", error);

      if (loginMessage) {
        loginMessage.textContent =
          "Login error: " + error.message;
      }
    }
  });
}


// =====================================================
// CRM SETUP
// =====================================================

async function setupCRM() {

  try {

    const {
      data: { session }
    } =
      await supabaseClient.auth.getSession();

    if (!session) {

      window.location.href = "login.html";
      return;
    }

    setupLogout();
    setupSearch();
    setupFilters();
    setupRefresh();
    setupLeadModal();
    setupAddEnquiry();
    setupLeadTabs();

    showStaffName(session.user);

    injectLeadDetailsStyles();

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
// STAFF NAME
// =====================================================

function showStaffName(user) {

  const staffName =
    document.getElementById("staffName");

  if (!staffName) return;

  staffName.textContent =
    user?.email || "Staff";
}


function showStaffNameError() {

  const staffName =
    document.getElementById("staffName");

  if (staffName) {
    staffName.textContent = "Staff";
  }
}


// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {

  const logoutBtn =
    document.getElementById("logoutBtn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {

    logoutBtn.disabled = true;
    logoutBtn.textContent = "Logging out...";

    try {

      const { error } =
        await supabaseClient.auth.signOut();

      if (error) {

        console.error(
          "LOGOUT ERROR:",
          error
        );

        logoutBtn.disabled = false;
        logoutBtn.textContent = "Logout";

        return;
      }

      window.location.href = "login.html";

    } catch (error) {

      console.error(
        "LOGOUT ERROR:",
        error
      );

      logoutBtn.disabled = false;
      logoutBtn.textContent = "Logout";
    }
  });
}


// =====================================================
// LOAD ENQUIRIES
// =====================================================

async function loadEnquiries() {

  const tableBody =
    document.getElementById("leadsTableBody");

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
            <td colspan="9" class="loading-cell">
              Unable to load enquiries.
            </td>
          </tr>
        `;
      }

      return;
    }

    currentEnquiries =
      Array.isArray(data) ? data : [];

    updateStats(currentEnquiries);

    applyFilters();

  } catch (error) {

    console.error(
      "LOAD ENQUIRIES EXCEPTION:",
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
// RENDER ENQUIRIES
// =====================================================

function renderEnquiries(enquiries) {

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
    enquiries
      .map((lead) => {

        return `
          <tr>

            <td>

              <strong class="customer-name">
                ${escapeHTML(
                  lead.customer_name ||
                  "Unnamed"
                )}
              </strong>

              <small style="
                display:block;
                margin-top:4px;
                color:#8b94a5;
              ">
                ${escapeHTML(
                  lead.mobile ||
                  lead.mobile_number ||
                  ""
                )}
              </small>

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

              <span class="
                status-badge
                ${getStatusClass(
                  lead.status ||
                  lead.lead_status
                )}
              ">
                ${formatStatus(
                  lead.status ||
                  lead.lead_status
                )}
              </span>

            </td>

            <td>

              <span class="
                priority-badge
                priority-${escapeHTML(
                  lead.priority ||
                  "normal"
                )}
              ">
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
      })
      .join("");

  document
    .querySelectorAll(".view-lead-btn")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const leadId =
            button.dataset.leadId;

          const lead =
            currentEnquiries.find(
              (item) =>
                String(item.id) ===
                String(leadId)
            );

          if (lead) {
            openLeadModal(lead);
          }
        }
      );
    });
}


// =====================================================
// STATS
// =====================================================

function updateStats(enquiries) {

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
          (lead.status ||
            lead.lead_status) ===
          "new"
      ).length;
  }

  if (followup) {

    followup.textContent =
      enquiries.filter(
        (lead) =>
          (lead.status ||
            lead.lead_status) ===
          "follow_up"
      ).length;
  }

  if (converted) {

    converted.textContent =
      enquiries.filter(
        (lead) =>
          (lead.status ||
            lead.lead_status) ===
          "converted"
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

  if (!searchInput) return;

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


// =====================================================
// APPLY FILTERS
// =====================================================

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
          lead.mobile_number,
          lead.email,
          lead.location,
          lead.occasion,
          lead.source,
          lead.requirements,
          lead.other_requirements

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const status =
          lead.status ||
          lead.lead_status ||
          "";

        const matchesSearch =
          !search ||
          searchable.includes(search);

        const matchesTab =
          !activeLeadTab ||
          status === activeLeadTab;

        const matchesStatus =
          !dropdownStatus ||
          status === dropdownStatus;

        const matchesPriority =
          !priority ||
          lead.priority === priority;

        return (
          matchesSearch &&
          matchesTab &&
          matchesStatus &&
          matchesPriority
        );
      }
    );

  renderEnquiries(filtered);
}


// =====================================================
// REFRESH
// =====================================================

function setupRefresh() {

  const refreshBtn =
    document.getElementById(
      "refreshBtn"
    );

  if (!refreshBtn) return;

  refreshBtn.addEventListener(
    "click",
    async () => {

      refreshBtn.disabled = true;
      refreshBtn.textContent =
        "Refreshing...";

      await loadEnquiries();

      refreshBtn.disabled = false;
      refreshBtn.textContent =
        "↻ Refresh";
    }
  );
}


// =====================================================
// LEAD TABS
// =====================================================

function setupLeadTabs() {

  const tabs =
    document.querySelectorAll(
      ".stat-tab"
    );

  if (tabs.length) {

    tabs.forEach((tab) => {

      tab.addEventListener(
        "click",
        () => {

          activeLeadTab =
            tab.dataset.status ||
            "";

          setActiveLeadTab(tab);

          clearDropdownStatus();

          applyFilters();
        }
      );
    });

    return;
  }

  const cards =
    document.querySelectorAll(
      ".stats-grid .stat-card"
    );

  if (!cards.length) return;

  cards.forEach((card, index) => {

    let status = "";

    if (index === 1) {
      status = "new";
    }

    if (index === 2) {
      status = "follow_up";
    }

    if (index === 3) {
      status = "converted";
    }

    card.dataset.status =
      status;

    card.classList.add(
      "stat-tab"
    );

    card.style.cursor =
      "pointer";

    card.addEventListener(
      "click",
      () => {

        activeLeadTab =
          status;

        setActiveLeadTab(card);

        clearDropdownStatus();

        applyFilters();
      }
    );
  });
}


// =====================================================
// ACTIVE TAB
// =====================================================

function setActiveLeadTab(
  selectedTab
) {

  document
    .querySelectorAll(
      ".stat-tab"
    )
    .forEach((tab) => {

      tab.classList.remove(
        "active"
      );
    });

  if (selectedTab) {

    selectedTab.classList.add(
      "active"
    );
  }
}


function clearDropdownStatus() {

  const statusFilter =
    document.getElementById(
      "statusFilter"
    );

  if (statusFilter) {
    statusFilter.value = "";
  }
}


// =====================================================
// LEAD MODAL SETUP
// =====================================================

function setupLeadModal() {

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        document.getElementById(
          "smvLeadDetailsModal"
        )
      ) {
        closeLeadModal();
      }
    }
  );

  document.addEventListener(
    "click",
    (event) => {

      const closeButton =
        event.target.closest(
          "[data-smv-close-lead]"
        );

      if (closeButton) {
        closeLeadModal();
      }

      const saveButton =
        event.target.closest(
          "[data-smv-save-lead]"
        );

      if (saveButton) {
        saveLeadChanges();
      }

      const callButton =
        event.target.closest(
          "[data-smv-call]"
        );

      if (
        callButton &&
        currentLead
      ) {

        const mobile =
          currentLead.mobile ||
          currentLead.mobile_number ||
          "";

        if (mobile) {

          window.location.href =
            "tel:" + mobile;
        }
      }

      const whatsappButton =
        event.target.closest(
          "[data-smv-whatsapp]"
        );

      if (
        whatsappButton &&
        currentLead
      ) {

        const mobile =
          currentLead.mobile ||
          currentLead.mobile_number ||
          "";

        const cleanMobile =
          String(mobile)
            .replace(/\D/g, "");

        const whatsappNumber =
          cleanMobile.length === 10
            ? "91" + cleanMobile
            : cleanMobile;

        if (whatsappNumber) {

          window.open(
            "https://wa.me/" +
              whatsappNumber,
            "_blank"
          );
        }
      }

      const overlay =
        event.target.closest(
          "#smvLeadDetailsModal"
        );

      if (
        overlay &&
        event.target === overlay
      ) {
        closeLeadModal();
      }
    }
  );
}


// =====================================================
// OPEN NEW PROFESSIONAL LEAD MODAL
// =====================================================

function openLeadModal(lead) {

  currentLead = lead;

  const oldModal =
    document.getElementById(
      "smvLeadDetailsModal"
    );

  if (oldModal) {
    oldModal.remove();
  }

  const mobile =
    lead.mobile ||
    lead.mobile_number ||
    "";

  const requirements =
    lead.requirements ||
    lead.other_requirements ||
    "No additional requirements provided.";

  const status =
    lead.status ||
    lead.lead_status ||
    "new";

  const modal =
    document.createElement("div");

  modal.id =
    "smvLeadDetailsModal";

  modal.className =
    "smv-lead-modal-overlay";

  modal.innerHTML = `

    <div class="smv-lead-modal">

      <!-- HEADER -->

      <div class="smv-lead-modal-header">

        <div class="smv-lead-title-area">

          <div class="smv-lead-avatar">
            ${escapeHTML(
              getInitials(
                lead.customer_name ||
                "Customer"
              )
            )}
          </div>

          <div>

            <div class="smv-modal-kicker">
              CUSTOMER ENQUIRY
            </div>

            <h2>
              ${escapeHTML(
                lead.customer_name ||
                "Unnamed Customer"
              )}
            </h2>

            <span class="smv-lead-id">
              Lead ID: ${escapeHTML(
                String(
                  lead.id ||
                  "—"
                )
              )}
            </span>

          </div>

        </div>

        <button
          type="button"
          class="smv-modal-close"
          data-smv-close-lead
          aria-label="Close"
        >
          ×
        </button>

      </div>


      <!-- QUICK ACTIONS -->

      <div class="smv-lead-actions">

        <button
          type="button"
          class="smv-action-call"
          data-smv-call
          ${mobile ? "" : "disabled"}
        >
          ☎ Call Customer
        </button>

        <button
          type="button"
          class="smv-action-whatsapp"
          data-smv-whatsapp
          ${mobile ? "" : "disabled"}
        >
          ◉ WhatsApp
        </button>

      </div>


      <!-- BODY -->

      <div class="smv-lead-modal-body">


        <!-- CUSTOMER INFORMATION -->

        <section class="smv-detail-section">

          <div class="smv-section-heading">

            <div class="smv-section-icon">
              👤
            </div>

            <div>

              <strong>
                Customer Information
              </strong>

              <span>
                Contact details
              </span>

            </div>

          </div>


          <div class="smv-info-grid">

            ${detailCard(
              "Mobile Number",
              mobile || "—",
              "smv-phone"
            )}

            ${detailCard(
              "Email Address",
              lead.email || "—",
              "smv-email"
            )}

            ${detailCard(
              "City / Location",
              lead.location || "—",
              "smv-location"
            )}

            ${detailCard(
              "Lead Source",
              lead.source || "Website",
              "smv-source"
            )}

          </div>

        </section>


        <!-- EVENT INFORMATION -->

        <section class="smv-detail-section">

          <div class="smv-section-heading">

            <div class="smv-section-icon">
              ✦
            </div>

            <div>

              <strong>
                Event Requirements
              </strong>

              <span>
                Customer's event details
              </span>

            </div>

          </div>


          <div class="smv-info-grid smv-event-grid">

            ${detailCard(
              "Event Type",
              lead.occasion || "—",
              "smv-event"
            )}

            ${detailCard(
              "Event Date",
              formatDate(
                lead.event_date
              ),
              "smv-date"
            )}

            ${detailCard(
              "Number of Guests",
              lead.guests
                ? Number(
                    lead.guests
                  ).toLocaleString("en-IN")
                : "—",
              "smv-guests"
            )}

            ${detailCard(
              "Budget / Person",
              lead.budget_per_person
                ? "₹" +
                  Number(
                    lead.budget_per_person
                  ).toLocaleString("en-IN")
                : "—",
              "smv-budget"
            )}

            ${detailCard(
              "Food Preference",
              lead.food_preference || "—",
              "smv-food"
            )}

          </div>

        </section>


        <!-- OTHER REQUIREMENTS -->

        <section class="smv-detail-section">

          <div class="smv-section-heading">

            <div class="smv-section-icon">
              📝
            </div>

            <div>

              <strong>
                Other Requirements
              </strong>

              <span>
                Additional customer requests
              </span>

            </div>

          </div>


          <div class="smv-requirements-box">

            <div class="smv-requirements-label">
              CUSTOMER REQUEST
            </div>

            <div class="smv-requirements-text">
              ${escapeHTML(
                requirements
              ).replace(
                /\n/g,
                "<br>"
              )}
            </div>

          </div>

        </section>


        <!-- CRM MANAGEMENT -->

        <section class="smv-detail-section smv-crm-section">

          <div class="smv-section-heading">

            <div class="smv-section-icon">
              ⚙
            </div>

            <div>

              <strong>
                CRM Management
              </strong>

              <span>
                Update lead progress
              </span>

            </div>

          </div>


          <div class="smv-crm-grid">


            <div class="smv-control">

              <label>
                LEAD STATUS
              </label>

              <select id="smvModalStatus">

                <option
                  value="new"
                  ${status === "new" ? "selected" : ""}
                >
                  New
                </option>

                <option
                  value="contacted"
                  ${status === "contacted" ? "selected" : ""}
                >
                  Contacted
                </option>

                <option
                  value="follow_up"
                  ${status === "follow_up" ? "selected" : ""}
                >
                  Follow-up
                </option>

                <option
                  value="qualified"
                  ${status === "qualified" ? "selected" : ""}
                >
                  Qualified
                </option>

                <option
                  value="converted"
                  ${status === "converted" ? "selected" : ""}
                >
                  Converted
                </option>

                <option
                  value="closed"
                  ${status === "closed" ? "selected" : ""}
                >
                  Closed
                </option>

              </select>

            </div>


            <div class="smv-control">

              <label>
                PRIORITY
              </label>

              <select id="smvModalPriority">

                <option
                  value="urgent"
                  ${lead.priority === "urgent" ? "selected" : ""}
                >
                  Urgent
                </option>

                <option
                  value="high"
                  ${lead.priority === "high" ? "selected" : ""}
                >
                  High
                </option>

                <option
                  value="normal"
                  ${(!lead.priority ||
                    lead.priority === "normal")
                    ? "selected"
                    : ""}
                >
                  Normal
                </option>

                <option
                  value="low"
                  ${lead.priority === "low" ? "selected" : ""}
                >
                  Low
                </option>

              </select>

            </div>


            <div class="smv-control">

              <label>
                FOLLOW-UP DATE & TIME
              </label>

              <input
                type="datetime-local"
                id="smvModalFollowUp"
                value="${escapeHTML(
                  toDateTimeLocal(
                    lead.follow_up_at
                  )
                )}"
              >

            </div>

          </div>


          <!-- INTERNAL NOTES -->

          <div class="smv-notes-control">

            <label>
              INTERNAL NOTES
            </label>

            <textarea
              id="smvModalNotes"
              rows="4"
              placeholder="Add internal notes about this lead..."
            >${escapeHTML(
              lead.internal_notes || ""
            )}</textarea>

            <small>
              Notes are visible to CRM staff only.
            </small>

          </div>

        </section>


      </div>


      <!-- FOOTER -->

      <div class="smv-lead-modal-footer">

        <div class="smv-footer-hint">
          Changes are saved to the CRM.
        </div>

        <div class="smv-footer-buttons">

          <button
            type="button"
            class="smv-cancel-btn"
            data-smv-close-lead
          >
            Cancel
          </button>

          <button
            type="button"
            class="smv-save-btn"
            data-smv-save-lead
          >
            ✓ Save Changes
          </button>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);

  document.body.style.overflow =
    "hidden";

  requestAnimationFrame(() => {

    modal.classList.add("show");
  });
}


// =====================================================
// DETAIL CARD
// =====================================================

function detailCard(
  label,
  value,
  iconClass
) {

  return `

    <div class="smv-info-card">

      <div class="smv-info-card-label">
        ${escapeHTML(label)}
      </div>

      <div class="
        smv-info-card-value
        ${iconClass || ""}
      ">
        ${escapeHTML(
          value
        )}
      </div>

    </div>

  `;
}


// =====================================================
// CLOSE LEAD MODAL
// =====================================================

function closeLeadModal() {

  const modal =
    document.getElementById(
      "smvLeadDetailsModal"
    );

  if (modal) {

    modal.classList.remove(
      "show"
    );

    setTimeout(() => {

      modal.remove();

    }, 180);
  }

  document.body.style.overflow =
    "";

  currentLead =
    null;
}


// =====================================================
// SAVE LEAD CHANGES
// =====================================================

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

  const saveBtn =
    document.querySelector(
      "[data-smv-save-lead]"
    );

  const status =
    document.getElementById(
      "smvModalStatus"
    )?.value ||
    "new";

  const priority =
    document.getElementById(
      "smvModalPriority"
    )?.value ||
    "normal";

  const followUp =
    document.getElementById(
      "smvModalFollowUp"
    )?.value ||
    "";

  const notes =
    document.getElementById(
      "smvModalNotes"
    )?.value.trim() ||
    "";

  if (saveBtn) {

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
  }

  try {

    const updateData = {

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
    };

    const {
      error
    } =
      await supabaseClient
        .from("customer_enquiries")
        .update(updateData)
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
      "Something went wrong: " +
      error.message
    );

  } finally {

    if (saveBtn) {

      saveBtn.disabled = false;
      saveBtn.textContent =
        "✓ Save Changes";
    }
  }
}


// =====================================================
// ADD ENQUIRY SETUP
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

  const modal =
    document.getElementById(
      "addEnquiryModal"
    );

  if (modal) {

    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target === modal
        ) {
          closeAddEnquiryModal();
        }
      }
    );
  }
}


// =====================================================
// OPEN ADD ENQUIRY
// =====================================================

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

  modal.hidden = false;

  document.body.style.overflow =
    "hidden";
}


// =====================================================
// CLOSE ADD ENQUIRY
// =====================================================

function closeAddEnquiryModal() {

  const modal =
    document.getElementById(
      "addEnquiryModal"
    );

  if (modal) {
    modal.hidden = true;
  }

  document.body.style.overflow = "";

  const message =
    document.getElementById(
      "addEnquiryMessage"
    );

  if (message) {
    message.textContent = "";
  }
}


// =====================================================
// SAVE NEW ENQUIRY
// =====================================================

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
    )?.value || "";

  const eventDate =
    document.getElementById(
      "newEventDate"
    )?.value || "";

  const guests =
    document.getElementById(
      "newGuests"
    )?.value || "";

  const budget =
    document.getElementById(
      "newBudget"
    )?.value || "";

  const food =
    document.getElementById(
      "newFood"
    )?.value || "";

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
    )?.value || "";

  const requirements =
    document.getElementById(
      "newRequirements"
    )?.value.trim() ||
    "";

  const notes =
    document.getElementById(
      "newNotes"
    )?.value.trim() ||
    "";

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

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
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
        });

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

      saveBtn.disabled = false;
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

  fields.forEach((id) => {

    const element =
      document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });

  const occasion =
    document.getElementById(
      "newOccasion"
    );

  if (occasion) {
    occasion.value = "";
  }

  const food =
    document.getElementById(
      "newFood"
    );

  if (food) {
    food.value = "";
  }

  const source =
    document.getElementById(
      "newSource"
    );

  if (source) {
    source.value = "Website";
  }

  const status =
    document.getElementById(
      "newStatus"
    );

  if (status) {
    status.value = "new";
  }

  const priority =
    document.getElementById(
      "newPriority"
    );

  if (priority) {
    priority.value = "normal";
  }
}


// =====================================================
// TOAST
// =====================================================

function showToast(message) {

  const toast =
    document.getElementById(
      "toastMessage"
    ) ||
    document.getElementById(
      "toast"
    );

  if (!toast) {

    console.log(
      "TOAST:",
      message
    );

    return;
  }

  toast.textContent =
    message;

  toast.classList.add("show");

  setTimeout(
    () => {
      toast.classList.remove("show");
    },
    2500
  );
}


// =====================================================
// DATE FORMAT
// =====================================================

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


// =====================================================
// DATETIME LOCAL
// =====================================================

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

  const pad =
    (number) =>
      String(number).padStart(
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


// =====================================================
// STATUS
// =====================================================

function formatStatus(status) {

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


function getStatusClass(status) {

  const classes = {

    new:
      "status-new",

    contacted:
      "status-contacted",

    follow_up:
      "status-progress",

    qualified:
      "status-progress",

    converted:
      "status-contacted",

    closed:
      "status-closed"
  };

  return (
    classes[status] ||
    "status-new"
  );
}


// =====================================================
// PRIORITY
// =====================================================

function formatPriority(priority) {

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


// =====================================================
// INITIALS
// =====================================================

function getInitials(name) {

  return String(name || "C")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (word) =>
        word.charAt(0).toUpperCase()
    )
    .join("");
}


// =====================================================
// HTML ESCAPE
// =====================================================

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


// =====================================================
// PROFESSIONAL LEAD MODAL CSS
// =====================================================

function injectLeadDetailsStyles() {

  if (
    document.getElementById(
      "smvLeadDetailsStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "smvLeadDetailsStyles";

  style.textContent = `

    /* =========================================
       LEAD DETAILS MODAL
       ========================================= */

    .smv-lead-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(9, 14, 24, 0.72);
      backdrop-filter: blur(8px);
      opacity: 0;
      transition: opacity .18s ease;
    }

    .smv-lead-modal-overlay.show {
      opacity: 1;
    }


    .smv-lead-modal {
      width: min(1120px, 100%);
      max-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #ffffff;
      border: 1px solid #e5e9f1;
      border-radius: 22px;
      box-shadow:
        0 30px 80px rgba(0,0,0,.28);
      transform: translateY(12px) scale(.985);
      transition:
        transform .18s ease;
    }

    .smv-lead-modal-overlay.show
    .smv-lead-modal {
      transform: translateY(0) scale(1);
    }


    /* HEADER */

    .smv-lead-modal-header {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 22px 26px;
      border-bottom: 1px solid #edf0f5;
      background:
        linear-gradient(
          135deg,
          #ffffff 0%,
          #f8fbff 100%
        );
    }


    .smv-lead-title-area {
      display: flex;
      align-items: center;
      gap: 15px;
      min-width: 0;
    }


    .smv-lead-avatar {
      width: 54px;
      height: 54px;
      flex: 0 0 54px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 15px;
      background:
        linear-gradient(
          135deg,
          #16233f,
          #314f89
        );
      color: #ffffff;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: .5px;
    }


    .smv-modal-kicker {
      margin-bottom: 3px;
      color: #6b7da0;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.6px;
      text-transform: uppercase;
    }


    .smv-lead-title-area h2 {
      margin: 0;
      color: #172033;
      font-size: 24px;
      line-height: 1.15;
      font-weight: 800;
    }


    .smv-lead-id {
      display: block;
      margin-top: 5px;
      color: #98a2b3;
      font-size: 11px;
    }


    .smv-modal-close {
      width: 40px;
      height: 40px;
      flex: 0 0 40px;
      border: 1px solid #dfe4ec;
      border-radius: 12px;
      background: #ffffff;
      color: #68748a;
      font-size: 25px;
      line-height: 1;
      cursor: pointer;
      transition: .15s ease;
    }


    .smv-modal-close:hover {
      background: #f3f5f8;
      color: #172033;
      transform: rotate(4deg);
    }


    /* ACTION BAR */

    .smv-lead-actions {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 12px 26px;
      border-bottom: 1px solid #edf0f5;
      background: #fbfcfe;
    }


    .smv-lead-actions button {
      min-height: 36px;
      padding: 0 14px;
      border-radius: 9px;
      border: 1px solid #dfe5ee;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: .15s ease;
    }


    .smv-action-call {
      background: #eef2ff;
      color: #4354c8;
    }


    .smv-action-whatsapp {
      background: #ecfbf3;
      color: #17804b;
    }


    .smv-lead-actions button:hover {
      transform: translateY(-1px);
    }


    .smv-lead-actions button:disabled {
      opacity: .45;
      cursor: not-allowed;
      transform: none;
    }


    /* BODY */

    .smv-lead-modal-body {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 24px 26px 28px;
      background: #f7f9fc;
    }


    .smv-detail-section {
      margin-bottom: 22px;
      padding: 20px;
      border: 1px solid #e6eaf1;
      border-radius: 16px;
      background: #ffffff;
    }


    .smv-detail-section:last-child {
      margin-bottom: 0;
    }


    .smv-section-heading {
      display: flex;
      align-items: center;
      gap: 11px;
      margin-bottom: 17px;
    }


    .smv-section-icon {
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9px;
      background: #eef3ff;
      color: #5369cf;
      font-size: 15px;
    }


    .smv-section-heading strong {
      display: block;
      color: #202a3d;
      font-size: 14px;
      font-weight: 800;
    }


    .smv-section-heading span {
      display: block;
      margin-top: 2px;
      color: #8b96a8;
      font-size: 11px;
    }


    /* INFO GRID */

    .smv-info-grid {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 12px;
    }


    .smv-event-grid {
      grid-template-columns:
        repeat(5, minmax(0, 1fr));
    }


    .smv-info-card {
      min-width: 0;
      min-height: 76px;
      padding: 13px 14px;
      border: 1px solid #e7ebf2;
      border-radius: 12px;
      background: #fbfcfe;
    }


    .smv-info-card-label {
      margin-bottom: 8px;
      color: #8994a7;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.1px;
      text-transform: uppercase;
    }


    .smv-info-card-value {
      color: #273249;
      font-size: 14px;
      line-height: 1.35;
      font-weight: 700;
      overflow-wrap: anywhere;
      word-break: break-word;
    }


    /* REQUIREMENTS */

    .smv-requirements-box {
      padding: 17px 18px;
      border: 1px solid #dfe6f0;
      border-radius: 13px;
      background:
        linear-gradient(
          135deg,
          #f9fbff,
          #f5f8fc
        );
    }


    .smv-requirements-label {
      margin-bottom: 9px;
      color: #77859b;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.2px;
    }


    .smv-requirements-text {
      color: #2b3548;
      font-size: 14px;
      line-height: 1.65;
      white-space: normal;
      overflow-wrap: anywhere;
    }


    /* CRM CONTROLS */

    .smv-crm-section {
      background: #fbfcff;
    }


    .smv-crm-grid {
      display: grid;
      grid-template-columns:
        1fr 1fr 1.35fr;
      gap: 13px;
      margin-bottom: 17px;
    }


    .smv-control label,
    .smv-notes-control label {
      display: block;
      margin-bottom: 7px;
      color: #778398;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1px;
    }


    .smv-control select,
    .smv-control input,
    .smv-notes-control textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #dce2eb;
      border-radius: 10px;
      outline: none;
      background: #ffffff;
      color: #253046;
      font-family: inherit;
      font-size: 13px;
      transition: border-color .15s ease,
                  box-shadow .15s ease;
    }


    .smv-control select,
    .smv-control input {
      height: 44px;
      padding: 0 12px;
    }


    .smv-notes-control textarea {
      min-height: 94px;
      padding: 12px;
      resize: vertical;
      line-height: 1.5;
    }


    .smv-control select:focus,
    .smv-control input:focus,
    .smv-notes-control textarea:focus {
      border-color: #7488dd;
      box-shadow:
        0 0 0 3px rgba(
          91,
          112,
          207,
          .10
        );
    }


    .smv-notes-control small {
      display: block;
      margin-top: 6px;
      color: #9aa4b4;
      font-size: 10px;
    }


    /* FOOTER */

    .smv-lead-modal-footer {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 16px 26px;
      border-top: 1px solid #e8ebf1;
      background: #ffffff;
    }


    .smv-footer-hint {
      color: #8d98a9;
      font-size: 11px;
    }


    .smv-footer-buttons {
      display: flex;
      align-items: center;
      gap: 9px;
    }


    .smv-cancel-btn,
    .smv-save-btn {
      height: 42px;
      padding: 0 18px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      transition: .15s ease;
    }


    .smv-cancel-btn {
      border: 1px solid #dce2ea;
      background: #ffffff;
      color: #536075;
    }


    .smv-save-btn {
      border: 1px solid #182642;
      background: #182642;
      color: #ffffff;
      box-shadow:
        0 6px 15px rgba(
          24,
          38,
          66,
          .18
        );
    }


    .smv-cancel-btn:hover,
    .smv-save-btn:hover {
      transform: translateY(-1px);
    }


    .smv-save-btn:disabled {
      opacity: .6;
      cursor: wait;
      transform: none;
    }


    /* SCROLLBAR */

    .smv-lead-modal-body::-webkit-scrollbar {
      width: 7px;
    }

    .smv-lead-modal-body::-webkit-scrollbar-track {
      background: transparent;
    }

    .smv-lead-modal-body::-webkit-scrollbar-thumb {
      background: #cbd3df;
      border-radius: 20px;
    }


    /* =========================================
       MOBILE
       ========================================= */

    @media (max-width: 900px) {

      .smv-info-grid,
      .smv-event-grid {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }

      .smv-crm-grid {
        grid-template-columns:
          1fr 1fr;
      }

      .smv-control:last-child {
        grid-column: 1 / -1;
      }
    }


    @media (max-width: 620px) {

      .smv-lead-modal-overlay {
        padding: 0;
        align-items: flex-end;
      }

      .smv-lead-modal {
        width: 100%;
        max-height: 94vh;
        border-radius:
          20px 20px 0 0;
      }

      .smv-lead-modal-header {
        padding: 17px;
      }

      .smv-lead-modal-body {
        padding: 17px;
      }

      .smv-lead-actions {
        padding: 10px 17px;
      }

      .smv-detail-section {
        padding: 15px;
      }

      .smv-info-grid,
      .smv-event-grid,
      .smv-crm-grid {
        grid-template-columns: 1fr;
      }

      .smv-control:last-child {
        grid-column: auto;
      }

      .smv-lead-modal-footer {
        padding: 13px 17px;
        flex-direction: column;
        align-items: stretch;
      }

      .smv-footer-buttons {
        width: 100%;
      }

      .smv-cancel-btn,
      .smv-save-btn {
        flex: 1;
      }

      .smv-lead-title-area h2 {
        font-size: 20px;
      }
    }

  `;

  document.head.appendChild(style);
}
