/* =========================================================
   SELECT MY VENUE — CRM
   crm.js
   PREMIUM EMPLOYEE CRM
   INLINE CLICK-TO-EDIT + SUPABASE
   ========================================================= */

/* =========================================================
   SUPABASE CONFIG
   =========================================================
   IMPORTANT:
   If your dashboard.html already defines:
       window.SUPABASE_URL
       window.SUPABASE_ANON_KEY

   this file will automatically use them.

   Otherwise replace the two values below with your existing
   Supabase project values.
   ========================================================= */

const CRM_SUPABASE_URL =
    window.SUPABASE_URL ||
    "YOUR_SUPABASE_URL";

const CRM_SUPABASE_ANON_KEY =
    window.SUPABASE_ANON_KEY ||
    "YOUR_SUPABASE_ANON_KEY";


/* =========================================================
   SUPABASE CLIENT
   ========================================================= */

let supabaseClient = null;

function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;

    if (!window.supabase || !window.supabase.createClient) {
        console.error("Supabase library not loaded.");
        showToast("Supabase library is not loaded.", "error");
        return null;
    }

    if (
        !CRM_SUPABASE_URL ||
        CRM_SUPABASE_URL === "YOUR_SUPABASE_URL" ||
        !CRM_SUPABASE_ANON_KEY ||
        CRM_SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY"
    ) {
        console.error("Supabase credentials are missing.");
        showToast("Supabase configuration is missing.", "error");
        return null;
    }

    supabaseClient = window.supabase.createClient(
        CRM_SUPABASE_URL,
        CRM_SUPABASE_ANON_KEY
    );

    return supabaseClient;
}


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let allLeads = [];
let filteredLeads = [];
let currentLead = null;

let currentStatusFilter = "all";
let currentPriorityFilter = "all";
let currentSearch = "";

let toastTimer = null;


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(selector, parent = document) {
    return parent.querySelector(selector);
}

function $all(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function safeValue(value) {
    return value === null || value === undefined ? "" : String(value);
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "success") {
    let toast = document.getElementById("toastMessage");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastMessage";
        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.remove("show");

    if (type === "error") {
        toast.style.background = "#b42318";
    } else if (type === "warning") {
        toast.style.background = "#9a6700";
    } else {
        toast.style.background = "#20283d";
    }

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

async function checkCRMAuth() {
    const client = getSupabaseClient();

    if (!client) return null;

    try {
        const {
            data: { session },
            error
        } = await client.auth.getSession();

        if (error) {
            console.error("Auth error:", error);
            return null;
        }

        if (!session) {
            window.location.href = "login.html";
            return null;
        }

        updateStaffName(session.user);

        return session;
    } catch (error) {
        console.error("Authentication check failed:", error);
        return null;
    }
}


function updateStaffName(user) {
    if (!user) return;

    const staffNameElement = document.querySelector(".staff-name");

    if (!staffNameElement) return;

    const metadata = user.user_metadata || {};

    const name =
        metadata.full_name ||
        metadata.name ||
        metadata.display_name ||
        user.email ||
        "CRM User";

    staffNameElement.textContent = name;
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutCRM() {
    const client = getSupabaseClient();

    if (!client) return;

    try {
        const { error } = await client.auth.signOut();

        if (error) {
            console.error("Logout error:", error);
            showToast("Unable to logout.", "error");
            return;
        }

        window.location.href = "login.html";
    } catch (error) {
        console.error(error);
        showToast("Unable to logout.", "error");
    }
}


/* =========================================================
   LOAD ENQUIRIES
   ========================================================= */

async function loadEnquiries() {
    const client = getSupabaseClient();

    if (!client) return;

    setTableLoading();

    try {
        const { data, error } = await client
            .from("customer_enquiries")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            console.error("Supabase enquiries error:", error);

            renderTableError(
                "Unable to load enquiries. Please check your Supabase connection."
            );

            showToast("Unable to load enquiries.", "error");
            return;
        }

        allLeads = Array.isArray(data) ? data : [];

        applyFilters();
        updateStats();

    } catch (error) {
        console.error("Load enquiries failed:", error);

        renderTableError(
            "Something went wrong while loading enquiries."
        );

        showToast("Unable to load enquiries.", "error");
    }
}


/* =========================================================
   TABLE LOADING
   ========================================================= */

function setTableLoading() {
    const tbody =
        document.querySelector(".leads-table tbody") ||
        document.querySelector("#leadsTableBody") ||
        document.querySelector("tbody");

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="20" class="loading-cell">
                Loading customer enquiries...
            </td>
        </tr>
    `;
}


function renderTableError(message) {
    const tbody =
        document.querySelector(".leads-table tbody") ||
        document.querySelector("#leadsTableBody") ||
        document.querySelector("tbody");

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="20" class="loading-cell">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


/* =========================================================
   FILTERS
   ========================================================= */

function applyFilters() {
    const search = currentSearch.trim().toLowerCase();

    filteredLeads = allLeads.filter((lead) => {

        const matchesSearch =
            !search ||
            [
                lead.name,
                lead.customer_name,
                lead.phone,
                lead.mobile,
                lead.email,
                lead.location,
                lead.city,
                lead.venue,
                lead.event_type,
                lead.message
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search);

        const leadStatus =
            safeValue(lead.status || "new").toLowerCase();

        const leadPriority =
            safeValue(lead.priority || "normal").toLowerCase();

        const matchesStatus =
            currentStatusFilter === "all" ||
            leadStatus === currentStatusFilter;

        const matchesPriority =
            currentPriorityFilter === "all" ||
            leadPriority === currentPriorityFilter;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority
        );
    });

    renderLeads();
}


/* =========================================================
   RENDER TABLE
   ========================================================= */

function renderLeads() {
    const tbody =
        document.querySelector(".leads-table tbody") ||
        document.querySelector("#leadsTableBody") ||
        document.querySelector("tbody");

    if (!tbody) {
        console.warn("CRM table body not found.");
        return;
    }

    if (!filteredLeads.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="20">
                    <div class="empty-state">
                        <div class="empty-icon">⌕</div>
                        <h3>No enquiries found</h3>
                        <p>
                            There are no customer enquiries matching your filters.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = filteredLeads
        .map((lead) => createLeadRow(lead))
        .join("");
}


/* =========================================================
   LEAD ROW
   ========================================================= */

function createLeadRow(lead) {
    const id = safeValue(lead.id);

    const name =
        lead.name ||
        lead.customer_name ||
        "Unknown Customer";

    const phone =
        lead.phone ||
        lead.mobile ||
        lead.contact_number ||
        "—";

    const email =
        lead.email ||
        "—";

    const eventType =
        lead.event_type ||
        lead.event ||
        "—";

    const eventDate =
        lead.event_date ||
        lead.date ||
        "—";

    const guests =
        lead.guests ||
        lead.guest_count ||
        lead.number_of_guests ||
        "—";

    const location =
        lead.location ||
        lead.city ||
        "—";

    const status =
        lead.status ||
        "new";

    const priority =
        lead.priority ||
        "normal";

    return `
        <tr data-lead-id="${escapeHTML(id)}">

            <td>
                <strong>${escapeHTML(name)}</strong>
                <small>${escapeHTML(phone)}</small>
            </td>

            <td>
                ${createInlineField(
                    lead,
                    "email",
                    email,
                    "text"
                )}
            </td>

            <td>
                ${createInlineField(
                    lead,
                    "event_type",
                    eventType,
                    "select",
                    getEventOptions()
                )}
            </td>

            <td>
                ${createInlineField(
                    lead,
                    "event_date",
                    formatDate(eventDate),
                    "date",
                    null,
                    eventDate
                )}
            </td>

            <td>
                ${createInlineField(
                    lead,
                    "guests",
                    guests,
                    "number"
                )}
            </td>

            <td>
                ${createInlineField(
                    lead,
                    "location",
                    location,
                    "text"
                )}
            </td>

            <td>
                ${createInlineField(
                    lead,
                    "status",
                    formatStatus(status),
                    "select",
                    getStatusOptions()
                )}
            </td>

            <td>
                ${createInlineField(
                    lead,
                    "priority",
                    formatPriority(priority),
                    "select",
                    getPriorityOptions()
                )}
            </td>

            <td>
                <button
                    type="button"
                    class="view-lead-btn"
                    data-action="view"
                    data-id="${escapeHTML(id)}"
                >
                    View Details
                </button>
            </td>

        </tr>
    `;
}


/* =========================================================
   INLINE FIELD
   =========================================================
   DISPLAY FIRST.
   Click field.
   Field becomes editable.
   Save automatically on blur / Enter.
   ========================================================= */

function createInlineField(
    lead,
    field,
    displayValue,
    type = "text",
    options = null,
    rawValue = null
) {
    const id = safeValue(lead.id);

    const value =
        rawValue !== null &&
        rawValue !== undefined
            ? rawValue
            : lead[field];

    const shownValue =
        displayValue === "" ||
        displayValue === null ||
        displayValue === undefined
            ? "—"
            : displayValue;

    return `
        <div
            class="crm-inline-field"
            data-inline-field="${escapeHTML(field)}"
            data-lead-id="${escapeHTML(id)}"
            data-value="${escapeHTML(safeValue(value))}"
            tabindex="0"
            title="Click to edit"
        >
            <span class="inline-display">
                ${escapeHTML(shownValue)}
            </span>

            <span class="inline-edit-icon">
                ✎
            </span>
        </div>
    `;
}


/* =========================================================
   INLINE EDIT
   ========================================================= */

function startInlineEdit(element) {
    if (!element || element.classList.contains("editing")) {
        return;
    }

    const field =
        element.dataset.inlineField;

    const leadId =
        element.dataset.leadId;

    const lead =
        allLeads.find(
            item => String(item.id) === String(leadId)
        );

    if (!lead) {
        showToast("Enquiry not found.", "error");
        return;
    }

    const originalValue =
        lead[field] ??
        "";

    element.classList.add("editing");

    const display =
        element.querySelector(".inline-display");

    if (!display) return;

    let editor;

    if (field === "status") {
        editor = createSelectEditor(
            getStatusOptions(),
            originalValue || "new"
        );
    }

    else if (field === "priority") {
        editor = createSelectEditor(
            getPriorityOptions(),
            originalValue || "normal"
        );
    }

    else if (field === "event_type") {
        editor = createSelectEditor(
            getEventOptions(),
            originalValue || ""
        );
    }

    else {
        editor = document.createElement("input");

        editor.type =
            field === "event_date"
                ? "date"
                : field === "guests"
                    ? "number"
                    : "text";

        editor.value = safeValue(originalValue);

        editor.className = "crm-inline-editor";

        editor.setAttribute(
            "aria-label",
            `Edit ${field}`
        );
    }

    display.replaceWith(editor);

    const icon =
        element.querySelector(".inline-edit-icon");

    if (icon) {
        icon.textContent = "✓";
    }

    editor.focus();

    if (
        editor.tagName === "INPUT" &&
        editor.type !== "date" &&
        editor.type !== "number"
    ) {
        editor.select();
    }

    let finished = false;

    async function finish(save = true) {
        if (finished) return;

        finished = true;

        if (save) {
            const newValue = editor.value;

            if (String(newValue) !== String(originalValue)) {
                await saveInlineField(
                    leadId,
                    field,
                    newValue
                );

                return;
            }
        }

        restoreInlineDisplay(
            element,
            lead,
            field
        );
    }

    editor.addEventListener(
        "blur",
        () => {
            setTimeout(() => {
                finish(true);
            }, 120);
        }
    );

    editor.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {
                event.preventDefault();

                editor.blur();
            }

            if (event.key === "Escape") {
                event.preventDefault();

                finish(false);
            }
        }
    );
}


/* =========================================================
   SELECT EDITOR
   ========================================================= */

function createSelectEditor(options, selectedValue) {
    const select =
        document.createElement("select");

    select.className =
        "crm-inline-editor";

    options.forEach((option) => {

        const opt =
            document.createElement("option");

        opt.value = option.value;
        opt.textContent = option.label;

        if (
            String(option.value) ===
            String(selectedValue)
        ) {
            opt.selected = true;
        }

        select.appendChild(opt);
    });

    return select;
}


/* =========================================================
   SAVE INLINE FIELD
   ========================================================= */

async function saveInlineField(
    leadId,
    field,
    newValue
) {
    const client = getSupabaseClient();

    if (!client) return;

    const lead =
        allLeads.find(
            item => String(item.id) === String(leadId)
        );

    if (!lead) {
        showToast("Enquiry not found.", "error");
        return;
    }

    const oldValue =
        lead[field] ?? "";

    try {

        const updateData = {};

        updateData[field] =
            newValue === ""
                ? null
                : newValue;

        const { data, error } =
            await client
                .from("customer_enquiries")
                .update(updateData)
                .eq("id", leadId)
                .select()
                .single();

        if (error) {
            console.error(
                "Inline update failed:",
                error
            );

            showToast(
                "Unable to save this change.",
                "error"
            );

            restoreRowField(
                leadId,
                field,
                oldValue
            );

            return;
        }

        Object.assign(
            lead,
            data || updateData
        );

        showToast("Updated successfully.");

        refreshLeadRow(leadId);

        updateStats();

        if (
            currentLead &&
            String(currentLead.id) === String(leadId)
        ) {
            currentLead = lead;

            refreshModalData();
        }

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to save this change.",
            "error"
        );

        restoreRowField(
            leadId,
            field,
            oldValue
        );
    }
}


/* =========================================================
   RESTORE INLINE DISPLAY
   ========================================================= */

function restoreInlineDisplay(
    element,
    lead,
    field
) {
    if (!element) return;

    const editor =
        element.querySelector(
            ".crm-inline-editor"
        );

    if (!editor) return;

    const display =
        document.createElement("span");

    display.className =
        "inline-display";

    let value =
        lead[field];

    if (field === "status") {
        value = formatStatus(value);
    }

    else if (field === "priority") {
        value = formatPriority(value);
    }

    else if (field === "event_date") {
        value = formatDate(value);
    }

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        value = "—";
    }

    display.textContent = value;

    editor.replaceWith(display);

    element.classList.remove("editing");

    const icon =
        element.querySelector(
            ".inline-edit-icon"
        );

    if (icon) {
        icon.textContent = "✎";
    }
}


/* =========================================================
   REFRESH ROW
   ========================================================= */

function refreshLeadRow(leadId) {
    const lead =
        allLeads.find(
            item => String(item.id) === String(leadId)
        );

    if (!lead) return;

    const row =
        document.querySelector(
            `tr[data-lead-id="${CSS.escape(String(leadId))}"]`
        );

    if (!row) {
        renderLeads();
        return;
    }

    const temp =
        document.createElement("tbody");

    temp.innerHTML =
        createLeadRow(lead);

    const newRow =
        temp.firstElementChild;

    if (newRow) {
        row.replaceWith(newRow);
    }
}


/* =========================================================
   RESTORE ROW FIELD ON ERROR
   ========================================================= */

function restoreRowField(
    leadId,
    field,
    oldValue
) {
    const lead =
        allLeads.find(
            item => String(item.id) === String(leadId)
        );

    if (!lead) return;

    lead[field] = oldValue;

    refreshLeadRow(leadId);
}


/* =========================================================
   VIEW DETAILS MODAL
   ========================================================= */

function openLeadModal(leadId) {
    const lead =
        allLeads.find(
            item => String(item.id) === String(leadId)
        );

    if (!lead) {
        showToast("Enquiry not found.", "error");
        return;
    }

    currentLead = lead;

    const modal =
        document.getElementById("leadModal");

    if (!modal) {
        console.warn(
            "leadModal not found in dashboard.html"
        );
        return;
    }

    populateLeadModal(lead);

    modal.hidden = false;

    document.body.style.overflow = "hidden";
}


/* =========================================================
   POPULATE LEAD MODAL
   ========================================================= */

function populateLeadModal(lead) {

    setModalText(
        [
            "#modalLeadName",
            "#leadName",
            "[data-modal='name']"
        ],
        lead.name ||
        lead.customer_name ||
        "Customer"
    );

    setModalText(
        [
            "#modalPhone",
            "#leadPhone",
            "[data-modal='phone']"
        ],
        lead.phone ||
        lead.mobile ||
        lead.contact_number ||
        "—"
    );

    setModalText(
        [
            "#modalEmail",
            "#leadEmail",
            "[data-modal='email']"
        ],
        lead.email || "—"
    );

    setModalText(
        [
            "#modalEventType",
            "#leadEventType",
            "[data-modal='event_type']"
        ],
        lead.event_type ||
        lead.event ||
        "—"
    );

    setModalText(
        [
            "#modalEventDate",
            "#leadEventDate",
            "[data-modal='event_date']"
        ],
        formatDate(
            lead.event_date ||
            lead.date
        )
    );

    setModalText(
        [
            "#modalGuests",
            "#leadGuests",
            "[data-modal='guests']"
        ],
        lead.guests ||
        lead.guest_count ||
        lead.number_of_guests ||
        "—"
    );

    setModalText(
        [
            "#modalLocation",
            "#leadLocation",
            "[data-modal='location']"
        ],
        lead.location ||
        lead.city ||
        "—"
    );

    setModalText(
        [
            "#modalBudget",
            "#leadBudget",
            "[data-modal='budget']"
        ],
        lead.budget || "—"
    );

    setModalText(
        [
            "#modalCreatedAt",
            "#leadCreatedAt",
            "[data-modal='created_at']"
        ],
        formatDateTime(
            lead.created_at
        )
    );

    setModalText(
        [
            "#modalMessage",
            "#leadMessage",
            "#detailMessage",
            "[data-modal='message']"
        ],
        lead.message ||
        lead.enquiry ||
        lead.requirements ||
        "No customer message."
    );

    setModalControl(
        [
            "#modalStatus",
            "#leadStatus",
            "[data-control='status']"
        ],
        lead.status || "new"
    );

    setModalControl(
        [
            "#modalPriority",
            "#leadPriority",
            "[data-control='priority']"
        ],
        lead.priority || "normal"
    );

    setModalControl(
        [
            "#modalFollowUp",
            "#leadFollowUp",
            "[data-control='follow_up_at']"
        ],
        lead.follow_up_at ||
        lead.followup_at ||
        ""
    );

    setModalControl(
        [
            "#modalNotes",
            "#leadNotes",
            "[data-control='internal_notes']"
        ],
        lead.internal_notes ||
        lead.notes ||
        lead.remarks ||
        ""
    );

    setupContactActions(lead);
}


/* =========================================================
   MODAL TEXT HELPER
   ========================================================= */

function setModalText(selectors, value) {
    for (const selector of selectors) {

        const element =
            document.querySelector(selector);

        if (element) {
            element.textContent =
                safeValue(value) || "—";

            return;
        }
    }
}


/* =========================================================
   MODAL CONTROL HELPER
   ========================================================= */

function setModalControl(
    selectors,
    value
) {
    for (const selector of selectors) {

        const element =
            document.querySelector(selector);

        if (!element) continue;

        if (
            element.tagName === "INPUT" ||
            element.tagName === "SELECT" ||
            element.tagName === "TEXTAREA"
        ) {
            element.value =
                safeValue(value);
        }

        return;
    }
}


/* =========================================================
   REFRESH CURRENT MODAL
   ========================================================= */

function refreshModalData() {
    if (!currentLead) return;

    populateLeadModal(currentLead);
}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeLeadModal() {
    const modal =
        document.getElementById("leadModal");

    if (!modal) return;

    modal.hidden = true;

    document.body.style.overflow = "";

    currentLead = null;
}


/* =========================================================
   MODAL CLICK OUTSIDE
   ========================================================= */

function handleModalBackdropClick(event) {
    const modal =
        document.getElementById("leadModal");

    if (!modal) return;

    if (event.target === modal) {
        closeLeadModal();
    }
}


/* =========================================================
   SAVE MODAL CHANGES
   ========================================================= */

async function saveModalChanges() {

    if (!currentLead) {
        showToast(
            "No enquiry selected.",
            "error"
        );
        return;
    }

    const client = getSupabaseClient();

    if (!client) return;

    const leadId =
        currentLead.id;

    const updateData = {};

    const status =
        getControlValue([
            "#modalStatus",
            "#leadStatus",
            "[data-control='status']"
        ]);

    const priority =
        getControlValue([
            "#modalPriority",
            "#leadPriority",
            "[data-control='priority']"
        ]);

    const followUp =
        getControlValue([
            "#modalFollowUp",
            "#leadFollowUp",
            "[data-control='follow_up_at']"
        ]);

    const notes =
        getControlValue([
            "#modalNotes",
            "#leadNotes",
            "[data-control='internal_notes']"
        ]);

    if (status !== undefined) {
        updateData.status =
            status || "new";
    }

    if (priority !== undefined) {
        updateData.priority =
            priority || "normal";
    }

    if (followUp !== undefined) {
        updateData.follow_up_at =
            followUp || null;
    }

    if (notes !== undefined) {
        updateData.internal_notes =
            notes || null;
    }

    if (!Object.keys(updateData).length) {
        showToast("Nothing to save.", "warning");
        return;
    }

    try {

        const { data, error } =
            await client
                .from("customer_enquiries")
                .update(updateData)
                .eq("id", leadId)
                .select()
                .single();

        if (error) {
            console.error(
                "Modal save error:",
                error
            );

            showToast(
                "Unable to save enquiry.",
                "error"
            );

            return;
        }

        Object.assign(
            currentLead,
            data || updateData
        );

        const index =
            allLeads.findIndex(
                item =>
                    String(item.id) ===
                    String(leadId)
            );

        if (index !== -1) {
            Object.assign(
                allLeads[index],
                data || updateData
            );

            currentLead =
                allLeads[index];
        }

        renderLeads();
        updateStats();
        populateLeadModal(currentLead);

        showToast(
            "Enquiry updated successfully."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to save enquiry.",
            "error"
        );
    }
}


/* =========================================================
   GET CONTROL VALUE
   ========================================================= */

function getControlValue(selectors) {

    for (const selector of selectors) {

        const element =
            document.querySelector(selector);

        if (element) {
            return element.value;
        }
    }

    return undefined;
}


/* =========================================================
   CONTACT ACTIONS
   ========================================================= */

function setupContactActions(lead) {

    const phone =
        lead.phone ||
        lead.mobile ||
        lead.contact_number;

    const email =
        lead.email;

    const call =
        document.querySelector(
            "#modalCallBtn"
        ) ||
        document.querySelector(
            "[data-action='call']"
        );

    const whatsapp =
        document.querySelector(
            "#modalWhatsappBtn"
        ) ||
        document.querySelector(
            "[data-action='whatsapp']"
        );

    const emailButton =
        document.querySelector(
            "#modalEmailBtn"
        ) ||
        document.querySelector(
            "[data-action='email']"
        );

    if (call) {

        if (phone) {
            call.href =
                `tel:${phone}`;

            call.style.pointerEvents =
                "auto";

            call.style.opacity = "1";
        } else {
            call.removeAttribute("href");
            call.style.pointerEvents =
                "none";
            call.style.opacity = "0.5";
        }
    }

    if (whatsapp) {

        if (phone) {

            const cleanPhone =
                String(phone)
                    .replace(/\D/g, "");

            whatsapp.href =
                `https://wa.me/${cleanPhone}`;

            whatsapp.target = "_blank";

            whatsapp.style.pointerEvents =
                "auto";

            whatsapp.style.opacity = "1";

        } else {

            whatsapp.removeAttribute("href");

            whatsapp.style.pointerEvents =
                "none";

            whatsapp.style.opacity = "0.5";
        }
    }

    if (emailButton) {

        if (email) {

            emailButton.href =
                `mailto:${email}`;

            emailButton.style.pointerEvents =
                "auto";

            emailButton.style.opacity = "1";

        } else {

            emailButton.removeAttribute("href");

            emailButton.style.pointerEvents =
                "none";

            emailButton.style.opacity = "0.5";
        }
    }
}


/* =========================================================
   ADD ENQUIRY MODAL
   ========================================================= */

function openAddEnquiryModal() {

    const modal =
        document.getElementById(
            "addEnquiryModal"
        );

    if (!modal) {
        showToast(
            "Add enquiry form not found.",
            "error"
        );
        return;
    }

    modal.hidden = false;

    document.body.style.overflow =
        "hidden";

    const form =
        modal.querySelector(
            "form"
        );

    if (form) {
        form.reset();
    }

    const message =
        modal.querySelector(
            ".form-message"
        );

    if (message) {
        message.textContent = "";
    }
}


/* =========================================================
   CLOSE ADD ENQUIRY
   ========================================================= */

function closeAddEnquiryModal() {

    const modal =
        document.getElementById(
            "addEnquiryModal"
        );

    if (!modal) return;

    modal.hidden = true;

    document.body.style.overflow = "";
}


/* =========================================================
   CREATE ENQUIRY
   ========================================================= */

async function submitAddEnquiry(event) {

    if (event) {
        event.preventDefault();
    }

    const client = getSupabaseClient();

    if (!client) return;

    const form =
        event?.target ||
        document.querySelector(
            "#addEnquiryModal form"
        );

    if (!form) {
        showToast(
            "Enquiry form not found.",
            "error"
        );
        return;
    }

    const formData =
        new FormData(form);

    const data = {};

    for (const [key, value] of formData.entries()) {
        data[key] =
            typeof value === "string"
                ? value.trim()
                : value;
    }

    /*
      Set sensible CRM defaults.
      Existing customer data is untouched.
    */

    if (!data.status) {
        data.status = "new";
    }

    if (!data.priority) {
        data.priority = "normal";
    }

    try {

        const { data: created, error } =
            await client
                .from("customer_enquiries")
                .insert([data])
                .select()
                .single();

        if (error) {

            console.error(
                "Create enquiry error:",
                error
            );

            const message =
                form.querySelector(
                    ".form-message"
                );

            if (message) {
                message.textContent =
                    error.message ||
                    "Unable to create enquiry.";
            }

            showToast(
                "Unable to create enquiry.",
                "error"
            );

            return;
        }

        if (created) {
            allLeads.unshift(created);
        }

        applyFilters();
        updateStats();

        closeAddEnquiryModal();

        showToast(
            "Customer enquiry added successfully."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to create enquiry.",
            "error"
        );
    }
}


/* =========================================================
   STATS
   ========================================================= */

function updateStats() {

    const total =
        allLeads.length;

    const newCount =
        allLeads.filter(
            lead =>
                String(
                    lead.status || "new"
                ).toLowerCase() === "new"
        ).length;

    const followUpCount =
        allLeads.filter(
            lead =>
                String(
                    lead.status || ""
                ).toLowerCase() ===
                "follow-up"
        ).length;

    const convertedCount =
        allLeads.filter(
            lead => {

                const status =
                    String(
                        lead.status || ""
                    ).toLowerCase();

                return (
                    status === "converted" ||
                    status === "closed" ||
                    status === "booked"
                );
            }
        ).length;

    const stats =
        document.querySelectorAll(
            ".stat-card"
        );

    if (!stats.length) return;

    /*
      We intentionally support the existing
      four-card dashboard structure.
    */

    const values = [
        total,
        newCount,
        followUpCount,
        convertedCount
    ];

    stats.forEach((card, index) => {

        const strong =
            card.querySelector("strong");

        if (strong && values[index] !== undefined) {
            strong.textContent =
                values[index];
        }
    });

    /*
      Also support explicit stat IDs if present.
    */

    setStatValue(
        [
            "#totalLeads",
            "#totalEnquiries",
            "[data-stat='total']"
        ],
        total
    );

    setStatValue(
        [
            "#newLeads",
            "#newEnquiries",
            "[data-stat='new']"
        ],
        newCount
    );

    setStatValue(
        [
            "#followUpLeads",
            "#followUpEnquiries",
            "[data-stat='follow-up']"
        ],
        followUpCount
    );

    setStatValue(
        [
            "#convertedLeads",
            "#convertedEnquiries",
            "[data-stat='converted']"
        ],
        convertedCount
    );
}


function setStatValue(selectors, value) {

    for (const selector of selectors) {

        const element =
            document.querySelector(selector);

        if (element) {
            element.textContent =
                value;

            return;
        }
    }
}


/* =========================================================
   FILTER BUTTON / STAT CARD CLICK
   ========================================================= */

function setupStatFilters() {

    const cards =
        document.querySelectorAll(
            ".stat-card"
        );

    cards.forEach((card, index) => {

        card.addEventListener(
            "click",
            () => {

                cards.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

                card.classList.add(
                    "active"
                );

                if (index === 0) {
                    currentStatusFilter =
                        "all";
                }

                else if (index === 1) {
                    currentStatusFilter =
                        "new";
                }

                else if (index === 2) {
                    currentStatusFilter =
                        "follow-up";
                }

                else if (index === 3) {
                    currentStatusFilter =
                        "converted";
                }

                const statusSelect =
                    document.querySelector(
                        "#statusFilter"
                    ) ||
                    document.querySelector(
                        ".filter-bar select:nth-child(2)"
                    );

                if (statusSelect) {
                    statusSelect.value =
                        currentStatusFilter;
                }

                applyFilters();
            }
        );
    });
}


/* =========================================================
   FORMATTERS
   ========================================================= */

function formatStatus(status) {

    if (!status) return "New";

    const value =
        String(status)
            .replace(/[-_]/g, " ")
            .trim();

    return value
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );
}


function formatPriority(priority) {

    if (!priority) return "Normal";

    const value =
        String(priority)
            .replace(/[-_]/g, " ")
            .trim();

    return value
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );
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


function formatDateTime(value) {

    if (!value) return "—";

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
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
   DROPDOWN OPTIONS
   ========================================================= */

function getStatusOptions() {

    return [
        {
            value: "new",
            label: "New"
        },
        {
            value: "contacted",
            label: "Contacted"
        },
        {
            value: "follow-up",
            label: "Follow-up"
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
        },
        {
            value: "lost",
            label: "Lost"
        }
    ];
}


function getPriorityOptions() {

    return [
        {
            value: "low",
            label: "Low"
        },
        {
            value: "normal",
            label: "Normal"
        },
        {
            value: "medium",
            label: "Medium"
        },
        {
            value: "high",
            label: "High"
        },
        {
            value: "urgent",
            label: "Urgent"
        }
    ];
}


function getEventOptions() {

    return [
        {
            value: "",
            label: "Select Event"
        },
        {
            value: "Wedding",
            label: "Wedding"
        },
        {
            value: "Engagement",
            label: "Engagement"
        },
        {
            value: "Birthday",
            label: "Birthday"
        },
        {
            value: "Corporate",
            label: "Corporate"
        },
        {
            value: "Anniversary",
            label: "Anniversary"
        },
        {
            value: "Party",
            label: "Party"
        },
        {
            value: "Other",
            label: "Other"
        }
    ];
}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const searchInput =
        document.querySelector(
            "#searchInput"
        ) ||
        document.querySelector(
            ".search-box input"
        ) ||
        document.querySelector(
            "input[type='search']"
        );

    if (!searchInput) return;

    searchInput.addEventListener(
        "input",
        (event) => {

            currentSearch =
                event.target.value;

            applyFilters();
        }
    );
}


/* =========================================================
   FILTER DROPDOWNS
   ========================================================= */

function setupFilters() {

    const selects =
        document.querySelectorAll(
            ".filter-bar select"
        );

    selects.forEach(
        (select, index) => {

            select.addEventListener(
                "change",
                () => {

                    const value =
                        select.value;

                    /*
                      First select = status
                      Second select = priority
                    */

                    if (
                        select.id ===
                        "statusFilter" ||
                        index === 0
                    ) {
                        currentStatusFilter =
                            value || "all";
                    }

                    else {
                        currentPriorityFilter =
                            value || "all";
                    }

                    applyFilters();
                }
            );
        }
    );
}


/* =========================================================
   REFRESH BUTTON
   ========================================================= */

function setupRefreshButton() {

    const button =
        document.querySelector(
            "#refreshBtn"
        ) ||
        document.querySelector(
            ".refresh-btn"
        );

    if (!button) return;

    button.addEventListener(
        "click",
        async () => {

            button.disabled = true;

            const original =
                button.textContent;

            button.textContent =
                "Refreshing...";

            await loadEnquiries();

            button.disabled = false;

            button.textContent =
                original || "Refresh";
        }
    );
}


/* =========================================================
   ADD ENQUIRY BUTTON
   ========================================================= */

function setupAddButton() {

    const button =
        document.querySelector(
            "#addEnquiryBtn"
        ) ||
        document.querySelector(
            ".add-enquiry-btn"
        );

    if (!button) return;

    button.addEventListener(
        "click",
        openAddEnquiryModal
    );
}


/* =========================================================
   GLOBAL CLICK HANDLER
   ========================================================= */

function setupGlobalClicks() {

    document.addEventListener(
        "click",
        (event) => {

            /*
              INLINE EDIT
            */

            const inlineField =
                event.target.closest(
                    ".crm-inline-field"
                );

            if (
                inlineField &&
                !inlineField.classList.contains(
                    "editing"
                )
            ) {
                startInlineEdit(
                    inlineField
                );

                return;
            }


            /*
              VIEW DETAILS
            */

            const viewButton =
                event.target.closest(
                    "[data-action='view']"
                );

            if (viewButton) {

                const id =
                    viewButton.dataset.id;

                openLeadModal(id);

                return;
            }


            /*
              CLOSE LEAD MODAL
            */

            const closeButton =
                event.target.closest(
                    ".close-modal"
                );

            if (
                closeButton &&
                closeButton.closest(
                    "#leadModal"
                )
            ) {
                closeLeadModal();

                return;
            }


            /*
              CLOSE ADD ENQUIRY
            */

            const cancelButton =
                event.target.closest(
                    ".cancel-btn"
                );

            if (
                cancelButton &&
                cancelButton.closest(
                    "#addEnquiryModal"
                )
            ) {
                closeAddEnquiryModal();

                return;
            }


            /*
              SAVE MODAL
            */

            const saveButton =
                event.target.closest(
                    ".save-btn"
                );

            if (
                saveButton &&
                saveButton.closest(
                    "#leadModal"
                )
            ) {

                saveModalChanges();

                return;
            }
        }
    );


    /*
      Backdrop click
    */

    const leadModal =
        document.getElementById(
            "leadModal"
        );

    if (leadModal) {
        leadModal.addEventListener(
            "click",
            handleModalBackdropClick
        );
    }


    const addModal =
        document.getElementById(
            "addEnquiryModal"
        );

    if (addModal) {

        addModal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    addModal
                ) {
                    closeAddEnquiryModal();
                }
            }
        );
    }
}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {

                const leadModal =
                    document.getElementById(
                        "leadModal"
                    );

                const addModal =
                    document.getElementById(
                        "addEnquiryModal"
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
            }
        }
    );
}


/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */

function setupAuthListener() {

    const client =
        getSupabaseClient();

    if (!client) return;

    client.auth.onAuthStateChange(
        (event, session) => {

            if (
                event === "SIGNED_OUT"
            ) {
                window.location.href =
                    "login.html";
            }

            if (
                session &&
                event === "SIGNED_IN"
            ) {
                updateStaffName(
                    session.user
                );
            }
        }
    );
}


/* =========================================================
   ADD ENQUIRY FORM LISTENER
   ========================================================= */

function setupAddForm() {

    const form =
        document.querySelector(
            "#addEnquiryModal form"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        submitAddEnquiry
    );
}


/* =========================================================
   LOGOUT LISTENER
   ========================================================= */

function setupLogout() {

    const buttons =
        document.querySelectorAll(
            ".logout-btn"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                logoutCRM
            );
        }
    );
}


/* =========================================================
   INITIALIZE CRM
   ========================================================= */

async function initializeCRM() {

    console.log(
        "Select My Venue CRM initializing..."
    );

    const session =
        await checkCRMAuth();

    if (!session) return;

    setupSearch();

    setupFilters();

    setupRefreshButton();

    setupAddButton();

    setupGlobalClicks();

    setupKeyboard();

    setupAuthListener();

    setupAddForm();

    setupLogout();

    setupStatFilters();

    await loadEnquiries();

    console.log(
        "Select My Venue CRM ready."
    );
}


/* =========================================================
   DOM READY
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeCRM
    );
} else {
    initializeCRM();
}


/* =========================================================
   GLOBAL FUNCTIONS
   =========================================================
   These are intentionally exposed so dashboard.html
   inline buttons can also use them if necessary.
   ========================================================= */

window.crm = {
    loadEnquiries,
    openLeadModal,
    closeLeadModal,
    openAddEnquiryModal,
    closeAddEnquiryModal,
    saveModalChanges,
    logoutCRM,
    startInlineEdit
};

window.loadEnquiries =
    loadEnquiries;

window.openLeadModal =
    openLeadModal;

window.closeLeadModal =
    closeLeadModal;

window.openAddEnquiryModal =
    openAddEnquiryModal;

window.closeAddEnquiryModal =
    closeAddEnquiryModal;

window.saveModalChanges =
    saveModalChanges;

window.logoutCRM =
    logoutCRM;
