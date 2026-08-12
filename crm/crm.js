/* =========================================================
   SELECT MY VENUE — CRM
   FINAL crm.js
   Matches current dashboard.html exactly
   Supabase + Login + Leads + Filters + Add/Edit
========================================================= */


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const CRM_SUPABASE_URL =
    window.SUPABASE_URL ||
    "https://uajqwyoqbbswkfiwosyw.supabase.co";

const CRM_SUPABASE_ANON_KEY =
    window.SUPABASE_ANON_KEY ||
    "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";


/* =========================================================
   SUPABASE CLIENT
========================================================= */

let supabaseClient = null;

function getSupabaseClient() {

    if (supabaseClient) {
        return supabaseClient;
    }

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {
        console.error("Supabase JS library is not loaded.");
        showToast("Supabase library not loaded.", "error");
        return null;
    }

    if (
        !CRM_SUPABASE_URL ||
        !CRM_SUPABASE_ANON_KEY
    ) {
        console.error("Supabase configuration missing.");
        showToast("Supabase configuration missing.", "error");
        return null;
    }

    try {

        supabaseClient =
            window.supabase.createClient(
                CRM_SUPABASE_URL,
                CRM_SUPABASE_ANON_KEY
            );

        return supabaseClient;

    } catch (error) {

        console.error(
            "Supabase client error:",
            error
        );

        showToast(
            "Unable to connect to Supabase.",
            "error"
        );

        return null;
    }
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

let crmInitialized = false;
let toastTimer = null;


/* =========================================================
   BASIC HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function safe(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value);
}


function escapeHTML(value) {

    return safe(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getLeadId(lead) {
    return safe(lead && lead.id);
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "success") {

    let toast = $("crmToast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id = "crmToast";

        toast.style.position = "fixed";
        toast.style.right = "24px";
        toast.style.bottom = "24px";
        toast.style.zIndex = "99999";
        toast.style.padding = "13px 18px";
        toast.style.borderRadius = "10px";
        toast.style.fontSize = "14px";
        toast.style.fontWeight = "600";
        toast.style.color = "#fff";
        toast.style.boxShadow =
            "0 12px 30px rgba(0,0,0,.25)";
        toast.style.transition =
            "opacity .2s ease, transform .2s ease";

        document.body.appendChild(toast);
    }

    if (type === "error") {

        toast.style.background =
            "#b42318";

    } else if (type === "warning") {

        toast.style.background =
            "#9a6700";

    } else {

        toast.style.background =
            "#147a68";
    }

    toast.textContent = message;

    toast.style.opacity = "1";
    toast.style.transform =
        "translateY(0)";

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(() => {

            toast.style.opacity = "0";

            toast.style.transform =
                "translateY(8px)";

        }, 2800);
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkCRMAuth() {

    const client =
        getSupabaseClient();

    if (!client) {
        return null;
    }

    try {

        const {
            data,
            error
        } =
            await client.auth.getSession();

        if (error) {

            console.error(
                "getSession error:",
                error
            );

            showToast(
                "Unable to check login session.",
                "error"
            );

            return null;
        }

        const session =
            data?.session;

        if (!session) {

            window.location.href =
                "login.html";

            return null;
        }

        updateStaffName(
            session.user
        );

        return session;

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        return null;
    }
}


/* =========================================================
   STAFF NAME
========================================================= */

function updateStaffName(user) {

    const element =
        $("staffName");

    if (!element || !user) {
        return;
    }

    const metadata =
        user.user_metadata || {};

    const name =
        metadata.full_name ||
        metadata.fullName ||
        metadata.name ||
        metadata.display_name ||
        user.email ||
        "Employee";

    element.textContent = name;
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutCRM() {

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }

    try {

        const {
            error
        } =
            await client.auth.signOut();

        if (error) {

            console.error(
                "Logout error:",
                error
            );

            showToast(
                "Unable to logout.",
                "error"
            );

            return;
        }

        window.location.href =
            "login.html";

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to logout.",
            "error"
        );
    }
}


/* =========================================================
   LOAD ENQUIRIES
========================================================= */

async function loadEnquiries() {

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }

    setTableLoading();

    try {

        const {
            data,
            error
        } =
            await client
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
                "Supabase load error:",
                error
            );

            renderTableError(
                "Unable to load enquiries."
            );

            showToast(
                error.message ||
                "Unable to load enquiries.",
                "error"
            );

            return;
        }

        allLeads =
            Array.isArray(data)
                ? data
                : [];

        updateStats();

        applyFilters();

        console.log(
            "CRM enquiries loaded:",
            allLeads.length
        );

    } catch (error) {

        console.error(
            "loadEnquiries failed:",
            error
        );

        renderTableError(
            "Something went wrong while loading enquiries."
        );

        showToast(
            "Unable to load enquiries.",
            "error"
        );
    }
}


/* =========================================================
   TABLE LOADING
========================================================= */

function setTableLoading() {

    const tbody =
        $("leadsTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="10" class="loading-cell">
                Loading customer enquiries...
            </td>
        </tr>
    `;
}


function renderTableError(message) {

    const tbody =
        $("leadsTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="10" class="loading-cell">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


/* =========================================================
   FIELD COMPATIBILITY
========================================================= */

function getCustomerName(lead) {

    return (
        lead.customer_name ||
        lead.name ||
        "Unknown Customer"
    );
}


function getPhone(lead) {

    return (
        lead.phone ||
        lead.mobile ||
        lead.contact_number ||
        ""
    );
}


function getEmail(lead) {

    return (
        lead.email ||
        ""
    );
}


function getSource(lead) {

    return (
        lead.source ||
        lead.lead_source ||
        ""
    );
}


function getEventType(lead) {

    return (
        lead.event_type ||
        lead.event ||
        ""
    );
}


function getVenue(lead) {

    return (
        lead.venue ||
        lead.location ||
        ""
    );
}


function getEventDate(lead) {

    return (
        lead.event_date ||
        lead.date ||
        ""
    );
}


function getGuests(lead) {

    return (
        lead.guests ??
        lead.guest_count ??
        lead.number_of_guests ??
        ""
    );
}


function getStatus(lead) {

    return (
        lead.status ||
        "new"
    );
}


function getPriority(lead) {

    return (
        lead.priority ||
        "normal"
    );
}


function getFollowUp(lead) {

    return (
        lead.follow_up_at ||
        lead.followup_at ||
        ""
    );
}


function getAssignedTo(lead) {

    return (
        lead.assigned_to ||
        lead.assignedTo ||
        ""
    );
}


function getMessage(lead) {

    return (
        lead.message ||
        lead.enquiry ||
        lead.requirements ||
        ""
    );
}


function getRemarks(lead) {

    return (
        lead.remarks ||
        lead.internal_notes ||
        lead.notes ||
        ""
    );
}


/* =========================================================
   FILTERING
========================================================= */

function applyFilters() {

    const search =
        currentSearch
            .trim()
            .toLowerCase();

    filteredLeads =
        allLeads.filter(
            lead => {

                const searchable = [

                    getCustomerName(lead),
                    getPhone(lead),
                    getEmail(lead),
                    getSource(lead),
                    getEventType(lead),
                    getVenue(lead),
                    getMessage(lead),
                    getRemarks(lead)

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const status =
                    safe(
                        getStatus(lead)
                    ).toLowerCase();

                const priority =
                    safe(
                        getPriority(lead)
                    ).toLowerCase();

                const searchMatch =
                    !search ||
                    searchable.includes(search);

                const statusMatch =
                    currentStatusFilter === "all" ||
                    status ===
                        currentStatusFilter;

                const priorityMatch =
                    currentPriorityFilter === "all" ||
                    priority ===
                        currentPriorityFilter;

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

    if (!tbody) {
        console.error(
            "leadsTableBody not found."
        );
        return;
    }

    if (!filteredLeads.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state">
                        <div class="empty-icon">⌕</div>
                        <h3>No enquiries found</h3>
                        <p>
                            Try changing your search or filter.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        filteredLeads
            .map(createLeadRow)
            .join("");
}


/* =========================================================
   CREATE TABLE ROW
   EXACTLY 10 CELLS
========================================================= */

function createLeadRow(lead) {

    const id =
        getLeadId(lead);

    const name =
        getCustomerName(lead);

    const phone =
        getPhone(lead);

    const email =
        getEmail(lead);

    const eventType =
        getEventType(lead);

    const eventDate =
        getEventDate(lead);

    const guests =
        getGuests(lead);

    const venue =
        getVenue(lead);

    const status =
        getStatus(lead);

    const priority =
        getPriority(lead);

    return `
        <tr data-lead-id="${escapeHTML(id)}">

            <td>
                <strong>
                    ${escapeHTML(name)}
                </strong>
            </td>

            <td>
                <span class="crm-cell-text">
                    ${escapeHTML(phone || "—")}
                </span>
            </td>

            <td>
                <span class="crm-cell-text">
                    ${escapeHTML(email || "—")}
                </span>
            </td>

            <td>
                <span
                    class="crm-editable-cell"
                    data-edit-field="event_type"
                    data-lead-id="${escapeHTML(id)}"
                    title="Click to edit"
                >
                    ${escapeHTML(eventType || "—")}
                </span>
            </td>

            <td>
                <span
                    class="crm-editable-cell"
                    data-edit-field="event_date"
                    data-lead-id="${escapeHTML(id)}"
                    title="Click to edit"
                >
                    ${escapeHTML(
                        formatDate(eventDate)
                    )}
                </span>
            </td>

            <td>
                <span
                    class="crm-editable-cell"
                    data-edit-field="guests"
                    data-lead-id="${escapeHTML(id)}"
                    title="Click to edit"
                >
                    ${escapeHTML(
                        guests === "" ? "—" : guests
                    )}
                </span>
            </td>

            <td>
                <span
                    class="crm-editable-cell"
                    data-edit-field="venue"
                    data-lead-id="${escapeHTML(id)}"
                    title="Click to edit"
                >
                    ${escapeHTML(venue || "—")}
                </span>
            </td>

            <td>
                <span
                    class="crm-editable-cell"
                    data-edit-field="status"
                    data-lead-id="${escapeHTML(id)}"
                    title="Click to edit"
                >
                    ${escapeHTML(
                        formatStatus(status)
                    )}
                </span>
            </td>

            <td>
                <span
                    class="crm-editable-cell"
                    data-edit-field="priority"
                    data-lead-id="${escapeHTML(id)}"
                    title="Click to edit"
                >
                    ${escapeHTML(
                        formatPriority(priority)
                    )}
                </span>
            </td>

            <td class="action-column">

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
   INLINE EDIT
   No pencil icons.
   Click text → editor.
========================================================= */

function startInlineEdit(element) {

    if (!element) {
        return;
    }

    if (
        element.classList.contains(
            "crm-editing"
        )
    ) {
        return;
    }

    const leadId =
        element.dataset.leadId;

    const field =
        element.dataset.editField;

    const lead =
        allLeads.find(
            item =>
                String(item.id) ===
                String(leadId)
        );

    if (!lead) {

        showToast(
            "Enquiry not found.",
            "error"
        );

        return;
    }

    const originalValue =
        getEditableValue(
            lead,
            field
        );

    element.classList.add(
        "crm-editing"
    );

    const originalHTML =
        element.innerHTML;

    let editor;

    if (field === "status") {

        editor =
            createSelect(
                getStatusOptions(),
                originalValue || "new"
            );

    } else if (field === "priority") {

        editor =
            createSelect(
                getPriorityOptions(),
                originalValue || "normal"
            );

    } else if (field === "event_type") {

        editor =
            createSelect(
                getEventOptions(),
                originalValue || ""
            );

    } else {

        editor =
            document.createElement(
                "input"
            );

        editor.className =
            "crm-inline-editor";

        if (field === "event_date") {

            editor.type = "date";

        } else if (field === "guests") {

            editor.type = "number";
            editor.min = "0";

        } else {

            editor.type = "text";
        }

        editor.value =
            safe(originalValue);
    }

    element.innerHTML = "";

    element.appendChild(editor);

    editor.focus();

    if (
        editor.tagName === "INPUT" &&
        editor.type === "text"
    ) {
        editor.select();
    }

    let completed = false;

    async function finish(save) {

        if (completed) {
            return;
        }

        completed = true;

        if (!save) {

            element.innerHTML =
                originalHTML;

            element.classList.remove(
                "crm-editing"
            );

            return;
        }

        const newValue =
            editor.value;

        if (
            String(newValue) ===
            String(originalValue)
        ) {

            element.innerHTML =
                originalHTML;

            element.classList.remove(
                "crm-editing"
            );

            return;
        }

        await updateLeadField(
            lead,
            field,
            newValue
        );
    }


    editor.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                finish(true);
            }

            if (
                event.key === "Escape"
            ) {

                event.preventDefault();

                finish(false);
            }
        }
    );


    editor.addEventListener(
        "blur",
        () => {

            setTimeout(
                () => finish(true),
                150
            );
        }
    );
}


/* =========================================================
   GET EDITABLE VALUE
========================================================= */

function getEditableValue(
    lead,
    field
) {

    if (field === "event_type") {
        return getEventType(lead);
    }

    if (field === "event_date") {
        return getEventDate(lead);
    }

    if (field === "guests") {
        return getGuests(lead);
    }

    if (field === "venue") {
        return getVenue(lead);
    }

    if (field === "status") {
        return getStatus(lead);
    }

    if (field === "priority") {
        return getPriority(lead);
    }

    return "";
}


/* =========================================================
   CREATE SELECT
========================================================= */

function createSelect(
    options,
    selected
) {

    const select =
        document.createElement(
            "select"
        );

    select.className =
        "crm-inline-editor";

    options.forEach(
        option => {

            const item =
                document.createElement(
                    "option"
                );

            item.value =
                option.value;

            item.textContent =
                option.label;

            if (
                String(option.value) ===
                String(selected)
            ) {

                item.selected = true;
            }

            select.appendChild(item);
        }
    );

    return select;
}


/* =========================================================
   UPDATE INLINE FIELD
========================================================= */

async function updateLeadField(
    lead,
    field,
    value
) {

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }

    const leadId =
        lead.id;

    const dbField =
        resolveDatabaseField(
            lead,
            field
        );

    if (!dbField) {

        showToast(
            `Database field for ${field} was not found.`,
            "error"
        );

        renderLeads();

        return;
    }

    const updateData = {};

    updateData[dbField] =
        value === ""
            ? null
            : value;

    try {

        const {
            data,
            error
        } =
            await client
                .from("customer_enquiries")
                .update(updateData)
                .eq("id", leadId)
                .select()
                .single();

        if (error) {

            console.error(
                "Inline save error:",
                error
            );

            showToast(
                error.message ||
                "Change could not be saved.",
                "error"
            );

            renderLeads();

            return;
        }

        if (data) {

            const index =
                allLeads.findIndex(
                    item =>
                        String(item.id) ===
                        String(leadId)
                );

            if (index !== -1) {

                allLeads[index] =
                    data;

            }

        } else {

            lead[dbField] =
                value === ""
                    ? null
                    : value;
        }

        updateStats();

        applyFilters();

        showToast(
            "Change saved successfully."
        );

        if (
            currentLead &&
            String(currentLead.id) ===
                String(leadId)
        ) {

            currentLead =
                allLeads.find(
                    item =>
                        String(item.id) ===
                        String(leadId)
                ) || null;

            if (currentLead) {
                populateLeadModal(
                    currentLead
                );
            }
        }

    } catch (error) {

        console.error(
            "Inline update failed:",
            error
        );

        showToast(
            "Change could not be saved.",
            "error"
        );

        renderLeads();
    }
}


/* =========================================================
   RESOLVE DATABASE FIELD
========================================================= */

function resolveDatabaseField(
    lead,
    requestedField
) {

    const keys =
        Object.keys(lead || {});

    function findExisting(
        possible
    ) {

        return possible.find(
            key =>
                keys.includes(key)
        ) || null;
    }


    if (
        requestedField ===
        "event_type"
    ) {

        return findExisting([
            "event_type",
            "event"
        ]);
    }


    if (
        requestedField ===
        "event_date"
    ) {

        return findExisting([
            "event_date",
            "date"
        ]);
    }


    if (
        requestedField ===
        "guests"
    ) {

        return findExisting([
            "guests",
            "guest_count",
            "number_of_guests"
        ]);
    }


    if (
        requestedField ===
        "venue"
    ) {

        return findExisting([
            "venue",
            "location"
        ]);
    }


    if (
        requestedField ===
        "status"
    ) {

        return findExisting([
            "status"
        ]);
    }


    if (
        requestedField ===
        "priority"
    ) {

        return findExisting([
            "priority"
        ]);
    }


    return findExisting([
        requestedField
    ]);
}


/* =========================================================
   VIEW DETAILS
========================================================= */

function openLeadModal(leadId) {

    const lead =
        allLeads.find(
            item =>
                String(item.id) ===
                String(leadId)
        );

    if (!lead) {

        showToast(
            "Enquiry not found.",
            "error"
        );

        return;
    }

    currentLead =
        lead;

    populateLeadModal(
        lead
    );

    const modal =
        $("leadModal");

    if (!modal) {

        console.error(
            "leadModal not found."
        );

        return;
    }

    modal.hidden = false;

    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   POPULATE EXACT MODAL IDs
========================================================= */

function populateLeadModal(
    lead
) {

    setText(
        "detailCustomerName",
        getCustomerName(lead)
    );

    setText(
        "detailPhone",
        getPhone(lead) || "—"
    );

    setText(
        "detailEmail",
        getEmail(lead) || "—"
    );

    setText(
        "detailSource",
        getSource(lead) || "—"
    );

    setValue(
        "detailEventType",
        getEventType(lead)
    );

    setValue(
        "detailVenue",
        getVenue(lead)
    );

    setValue(
        "detailEventDate",
        getEventDate(lead)
    );

    setValue(
        "detailGuests",
        getGuests(lead)
    );

    setValue(
        "detailStatus",
        getStatus(lead)
    );

    setValue(
        "detailPriority",
        getPriority(lead)
    );

    setValue(
        "detailFollowUp",
        formatDateTimeLocal(
            getFollowUp(lead)
        )
    );

    setValue(
        "detailAssignedTo",
        getAssignedTo(lead)
    );

    setText(
        "detailMessage",
        getMessage(lead) ||
        "No customer message."
    );

    setValue(
        "detailRemarks",
        getRemarks(lead)
    );
}


/* =========================================================
   MODAL HELPERS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        $(id);

    if (!element) {
        return;
    }

    element.textContent =
        safe(value) || "—";
}


function setValue(
    id,
    value
) {

    const element =
        $(id);

    if (!element) {
        return;
    }

    element.value =
        safe(value);
}


/* =========================================================
   CLOSE LEAD MODAL
========================================================= */

function closeLeadModal() {

    const modal =
        $("leadModal");

    if (!modal) {
        return;
    }

    modal.hidden = true;

    document.body.style.overflow =
        "";

    currentLead =
        null;
}


/* =========================================================
   SAVE LEAD MODAL
========================================================= */

async function saveModalChanges() {

    if (!currentLead) {

        showToast(
            "No enquiry selected.",
            "error"
        );

        return;
    }

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }

    const lead =
        currentLead;

    const updateData = {};

    addChangedField(
        updateData,
        lead,
        "event_type",
        $("detailEventType")?.value
    );

    addChangedField(
        updateData,
        lead,
        "venue",
        $("detailVenue")?.value
    );

    addChangedField(
        updateData,
        lead,
        "event_date",
        $("detailEventDate")?.value
    );

    addChangedField(
        updateData,
        lead,
        "guests",
        $("detailGuests")?.value
    );

    addChangedField(
        updateData,
        lead,
        "status",
        $("detailStatus")?.value
    );

    addChangedField(
        updateData,
        lead,
        "priority",
        $("detailPriority")?.value
    );

    addChangedField(
        updateData,
        lead,
        "follow_up_at",
        $("detailFollowUp")?.value
    );

    addChangedField(
        updateData,
        lead,
        "assigned_to",
        $("detailAssignedTo")?.value
    );

    addChangedField(
        updateData,
        lead,
        "remarks",
        $("detailRemarks")?.value
    );


    if (
        Object.keys(updateData).length === 0
    ) {

        showModalMessage(
            "No changes to save."
        );

        return;
    }


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
        } =
            await client
                .from("customer_enquiries")
                .update(updateData)
                .eq("id", lead.id)
                .select()
                .single();


        if (error) {

            console.error(
                "Modal save error:",
                error
            );

            showModalMessage(
                error.message ||
                "Unable to save changes.",
                true
            );

            showToast(
                error.message ||
                "Unable to save changes.",
                "error"
            );

            return;
        }


        const index =
            allLeads.findIndex(
                item =>
                    String(item.id) ===
                    String(lead.id)
            );


        if (index !== -1) {

            allLeads[index] =
                data || {
                    ...allLeads[index],
                    ...updateData
                };

            currentLead =
                allLeads[index];
        }


        updateStats();

        applyFilters();

        populateLeadModal(
            currentLead
        );

        showModalMessage(
            "Changes saved successfully."
        );

        showToast(
            "Changes saved successfully."
        );


    } catch (error) {

        console.error(
            "Modal save failed:",
            error
        );

        showModalMessage(
            "Unable to save changes.",
            true
        );

        showToast(
            "Unable to save changes.",
            "error"
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
   ADD CHANGED FIELD
========================================================= */

function addChangedField(
    updateData,
    lead,
    logicalField,
    newValue
) {

    if (
        newValue === undefined
    ) {
        return;
    }

    const dbField =
        resolveModalDatabaseField(
            lead,
            logicalField
        );

    if (!dbField) {
        return;
    }

    const oldValue =
        getLogicalValue(
            lead,
            logicalField
        );


    let normalizedNew =
        newValue;


    if (
        logicalField ===
        "guests"
    ) {

        normalizedNew =
            newValue === ""
                ? null
                : Number(newValue);

        if (
            Number.isNaN(
                normalizedNew
            )
        ) {

            normalizedNew =
                null;
        }
    }


    if (
        logicalField ===
        "follow_up_at"
    ) {

        normalizedNew =
            newValue === ""
                ? null
                : newValue;
    }


    if (
        String(
            oldValue ?? ""
        ) !==
        String(
            normalizedNew ?? ""
        )
    ) {

        updateData[dbField] =
            normalizedNew;
    }
}


/* =========================================================
   RESOLVE MODAL DB FIELD
========================================================= */

function resolveModalDatabaseField(
    lead,
    logicalField
) {

    const keys =
        Object.keys(
            lead || {}
        );


    const map = {

        event_type: [
            "event_type",
            "event"
        ],

        venue: [
            "venue",
            "location"
        ],

        event_date: [
            "event_date",
            "date"
        ],

        guests: [
            "guests",
            "guest_count",
            "number_of_guests"
        ],

        status: [
            "status"
        ],

        priority: [
            "priority"
        ],

        follow_up_at: [
            "follow_up_at",
            "followup_at"
        ],

        assigned_to: [
            "assigned_to",
            "assignedTo"
        ],

        remarks: [
            "remarks",
            "internal_notes",
            "notes"
        ]
    };


    const possible =
        map[logicalField] ||
        [logicalField];


    return (
        possible.find(
            key =>
                keys.includes(key)
        ) || null
    );
}


/* =========================================================
   LOGICAL VALUE
========================================================= */

function getLogicalValue(
    lead,
    field
) {

    if (field === "event_type") {
        return getEventType(lead);
    }

    if (field === "venue") {
        return getVenue(lead);
    }

    if (field === "event_date") {
        return getEventDate(lead);
    }

    if (field === "guests") {
        return getGuests(lead);
    }

    if (field === "status") {
        return getStatus(lead);
    }

    if (field === "priority") {
        return getPriority(lead);
    }

    if (field === "follow_up_at") {
        return getFollowUp(lead);
    }

    if (field === "assigned_to") {
        return getAssignedTo(lead);
    }

    if (field === "remarks") {
        return getRemarks(lead);
    }

    return "";
}


/* =========================================================
   MODAL MESSAGE
========================================================= */

function showModalMessage(
    message,
    error = false
) {

    const element =
        $("leadModalMessage");

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.style.color =
        error
            ? "#d92d20"
            : "";
}


/* =========================================================
   ADD ENQUIRY
========================================================= */

function openAddEnquiryModal() {

    const modal =
        $("addEnquiryModal");

    if (!modal) {

        showToast(
            "Add enquiry window not found.",
            "error"
        );

        return;
    }

    const form =
        $("addEnquiryForm");

    if (form) {
        form.reset();
    }

    const message =
        $("addEnquiryMessage");

    if (message) {
        message.textContent =
            "";
    }

    modal.hidden =
        false;

    document.body.style.overflow =
        "hidden";
}


function closeAddEnquiryModal() {

    const modal =
        $("addEnquiryModal");

    if (!modal) {
        return;
    }

    modal.hidden =
        true;

    document.body.style.overflow =
        "";
}


/* =========================================================
   SUBMIT ADD ENQUIRY
========================================================= */

async function submitAddEnquiry(
    event
) {

    event.preventDefault();

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }

    const form =
        $("addEnquiryForm");

    if (!form) {
        return;
    }

    const formData =
        new FormData(form);

    const data = {};

    formData.forEach(
        (value, key) => {

            const cleanValue =
                typeof value === "string"
                    ? value.trim()
                    : value;

            if (
                cleanValue !== ""
            ) {

                data[key] =
                    cleanValue;
            }
        }
    );


    if (!data.status) {
        data.status = "new";
    }

    if (!data.priority) {
        data.priority = "normal";
    }


    const submitButton =
        $("submitEnquiryBtn");

    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Adding...";
    }


    try {

        const {
            data: created,
            error
        } =
            await client
                .from("customer_enquiries")
                .insert([data])
                .select()
                .single();


        if (error) {

            console.error(
                "Add enquiry error:",
                error
            );

            const message =
                $("addEnquiryMessage");

            if (message) {

                message.textContent =
                    error.message ||
                    "Unable to add enquiry.";
            }

            showToast(
                error.message ||
                "Unable to add enquiry.",
                "error"
            );

            return;
        }


        if (created) {

            allLeads.unshift(
                created
            );
        }


        updateStats();

        applyFilters();

        closeAddEnquiryModal();

        showToast(
            "Customer enquiry added successfully."
        );


    } catch (error) {

        console.error(
            "Submit enquiry failed:",
            error
        );

        showToast(
            "Unable to add enquiry.",
            "error"
        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Add Enquiry";
        }
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
                getStatus(lead)
                    .toLowerCase() ===
                "new"
        ).length;


    const contactedCount =
        allLeads.filter(
            lead =>
                getStatus(lead)
                    .toLowerCase() ===
                "contacted"
        ).length;


    const closedCount =
        allLeads.filter(
            lead => {

                const status =
                    getStatus(lead)
                        .toLowerCase();

                return (
                    status === "closed" ||
                    status === "converted"
                );
            }
        ).length;


    setText(
        "totalCount",
        total
    );

    setText(
        "newCount",
        newCount
    );

    setText(
        "contactedCount",
        contactedCount
    );

    setText(
        "closedCount",
        closedCount
    );
}


/* =========================================================
   STAT FILTERS
========================================================= */

function setupStatFilters() {

    const cards =
        document.querySelectorAll(
            ".stat-card"
        );

    cards.forEach(
        card => {

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

                    const filter =
                        card.dataset.statusFilter ||
                        "all";

                    currentStatusFilter =
                        filter;

                    const statusFilter =
                        $("statusFilter");

                    if (statusFilter) {

                        statusFilter.value =
                            filter;
                    }

                    applyFilters();
                }
            );
        }
    );
}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    const input =
        $("searchInput");

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        event => {

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

    const status =
        $("statusFilter");

    const priority =
        $("priorityFilter");


    if (status) {

        status.addEventListener(
            "change",
            () => {

                currentStatusFilter =
                    status.value ||
                    "all";

                updateStatActiveState();

                applyFilters();
            }
        );
    }


    if (priority) {

        priority.addEventListener(
            "change",
            () => {

                currentPriorityFilter =
                    priority.value ||
                    "all";

                applyFilters();
            }
        );
    }
}


function updateStatActiveState() {

    document
        .querySelectorAll(
            ".stat-card"
        )
        .forEach(
            card => {

                const filter =
                    card.dataset.statusFilter ||
                    "all";

                card.classList.toggle(
                    "active",
                    filter ===
                        currentStatusFilter
                );
            }
        );
}


/* =========================================================
   REFRESH
========================================================= */

function setupRefresh() {

    const button =
        $("refreshBtn");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async () => {

            if (button.disabled) {
                return;
            }

            button.disabled =
                true;

            const original =
                button.innerHTML;

            button.innerHTML =
                "Refreshing...";

            await loadEnquiries();

            button.disabled =
                false;

            button.innerHTML =
                original;
        }
    );
}


/* =========================================================
   ADD BUTTON
========================================================= */

function setupAddButton() {

    const button =
        $("addEnquiryBtn");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        openAddEnquiryModal
    );
}


/* =========================================================
   LOGOUT BUTTON
========================================================= */

function setupLogout() {

    const button =
        $("logoutBtn");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        logoutCRM
    );
}


/* =========================================================
   ADD FORM
========================================================= */

function setupAddForm() {

    const form =
        $("addEnquiryForm");

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        submitAddEnquiry
    );
}


/* =========================================================
   GLOBAL CLICK HANDLER
========================================================= */

function setupGlobalClicks() {

    document.addEventListener(
        "click",
        event => {


            /* ---------------------------------------------
               EDITABLE CELL
            --------------------------------------------- */

            const editable =
                event.target.closest(
                    ".crm-editable-cell"
                );

            if (editable) {

                if (
                    !editable.classList.contains(
                        "crm-editing"
                    )
                ) {

                    startInlineEdit(
                        editable
                    );
                }

                return;
            }


            /* ---------------------------------------------
               VIEW DETAILS
            --------------------------------------------- */

            const viewButton =
                event.target.closest(
                    ".view-lead-btn"
                );

            if (viewButton) {

                const id =
                    viewButton.dataset.id;

                openLeadModal(id);

                return;
            }


            /* ---------------------------------------------
               CLOSE LEAD MODAL
            --------------------------------------------- */

            if (
                event.target.closest(
                    "#closeLeadModal"
                )
            ) {

                closeLeadModal();

                return;
            }


            /* ---------------------------------------------
               CANCEL LEAD MODAL
            --------------------------------------------- */

            if (
                event.target.closest(
                    "#cancelLeadEdit"
                )
            ) {

                closeLeadModal();

                return;
            }


            /* ---------------------------------------------
               SAVE LEAD
            --------------------------------------------- */

            if (
                event.target.closest(
                    "#saveLeadBtn"
                )
            ) {

                saveModalChanges();

                return;
            }


            /* ---------------------------------------------
               CLOSE ADD MODAL
            --------------------------------------------- */

            if (
                event.target.closest(
                    "#closeAddEnquiry"
                )
            ) {

                closeAddEnquiryModal();

                return;
            }


            /* ---------------------------------------------
               CANCEL ADD MODAL
            --------------------------------------------- */

            if (
                event.target.closest(
                    "#cancelAddEnquiry"
                )
            ) {

                closeAddEnquiryModal();

                return;
            }

        }
    );
}


/* =========================================================
   BACKDROP CLICK
========================================================= */

function setupModalBackdrops() {

    const leadModal =
        $("leadModal");

    if (leadModal) {

        leadModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    leadModal
                ) {

                    closeLeadModal();
                }
            }
        );
    }


    const addModal =
        $("addEnquiryModal");

    if (addModal) {

        addModal.addEventListener(
            "click",
            event => {

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
   KEYBOARD
========================================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {
                return;
            }

            const leadModal =
                $("leadModal");

            const addModal =
                $("addEnquiryModal");


            if (
                leadModal &&
                !leadModal.hidden
            ) {

                closeLeadModal();

                return;
            }


            if (
                addModal &&
                !addModal.hidden
            ) {

                closeAddEnquiryModal();
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

    if (!client) {
        return;
    }

    client.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            if (
                event ===
                "SIGNED_OUT"
            ) {

                window.location.href =
                    "login.html";

                return;
            }


            if (session) {

                updateStaffName(
                    session.user
                );
            }
        }
    );
}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
    value
) {

    if (!value) {
        return "New";
    }

    return safe(value)
        .replace(/[-_]/g, " ")
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}


function formatPriority(
    value
) {

    if (!value) {
        return "Normal";
    }

    return safe(value)
        .replace(/[-_]/g, " ")
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

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

        return safe(value);
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
   DATETIME LOCAL
========================================================= */

function formatDateTimeLocal(
    value
) {

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

        return safe(value)
            .slice(0, 16);
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");

    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");

    return (
        `${year}-${month}-${day}` +
        `T${hours}:${minutes}`
    );
}


/* =========================================================
   OPTIONS
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
            value: "urgent",
            label: "Urgent"
        },

        {
            value: "high",
            label: "High"
        },

        {
            value: "medium",
            label: "Medium"
        },

        {
            value: "normal",
            label: "Normal"
        },

        {
            value: "low",
            label: "Low"
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
   INITIALIZE
========================================================= */

async function initializeCRM() {

    if (crmInitialized) {
        return;
    }

    crmInitialized =
        true;

    console.log(
        "Select My Venue CRM initializing..."
    );


    const session =
        await checkCRMAuth();

    if (!session) {

        crmInitialized =
            false;

        return;
    }


    setupSearch();

    setupFilters();

    setupStatFilters();

    setupRefresh();

    setupAddButton();

    setupLogout();

    setupAddForm();

    setupGlobalClicks();

    setupModalBackdrops();

    setupKeyboard();

    setupAuthListener();


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
   PUBLIC CRM API
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
