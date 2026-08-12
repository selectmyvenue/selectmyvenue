/* =========================================================
   SELECT MY VENUE — CRM
   crm/crm.js
   FINAL STABLE VERSION

   - Uses Supabase configuration from dashboard.html
   - Name + Phone are read-only
   - Other table fields edit ONLY after clicking
   - No pencils displayed
   - Correct 10-column table alignment
   - Event type mapping supported
   - View Details works
   - Modal editing works
   - Add Enquiry works
   - Search + filters work
   - Supabase saves changes
   ========================================================= */


/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const CRM_SUPABASE_URL =
    window.SUPABASE_URL || "";

const CRM_SUPABASE_ANON_KEY =
    window.SUPABASE_ANON_KEY || "";


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
        console.error("Supabase library not loaded.");
        showToast(
            "Supabase library is not loaded.",
            "error"
        );
        return null;
    }

    if (
        !CRM_SUPABASE_URL ||
        !CRM_SUPABASE_ANON_KEY
    ) {
        console.error("Supabase URL or key missing.");
        showToast(
            "Supabase configuration is missing.",
            "error"
        );
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

let toastTimer = null;


/* =========================================================
   HELPERS
   ========================================================= */

function $(selector, parent = document) {
    return parent.querySelector(selector);
}


function safeValue(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value);
}


function escapeHTML(value) {

    return safeValue(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "success") {

    let toast =
        document.getElementById(
            "crmToast"
        );

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
        toast.style.color = "#fff";
        toast.style.fontSize = "14px";
        toast.style.fontWeight = "600";
        toast.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.25)";
        toast.style.transition =
            "opacity .2s ease, transform .2s ease";

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.style.background =
        type === "error"
            ? "#b42318"
            : type === "warning"
                ? "#9a6700"
                : "#13795b";

    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(() => {

            toast.style.opacity = "0";
            toast.style.transform =
                "translateY(8px)";

        }, 2800);
}


/* =========================================================
   AUTH
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
                "Auth error:",
                error
            );

            showToast(
                "Authentication error.",
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
            "Authentication failed:",
            error
        );

        return null;
    }
}


function updateStaffName(user) {

    const element =
        document.getElementById(
            "staffName"
        );

    if (!element || !user) {
        return;
    }

    const metadata =
        user.user_metadata || {};

    const name =
        metadata.full_name ||
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
                "Supabase enquiries error:",
                error
            );

            renderTableError(
                error.message ||
                "Unable to load enquiries."
            );

            showToast(
                "Unable to load enquiries.",
                "error"
            );

            return;
        }

        allLeads =
            Array.isArray(data)
                ? data
                : [];

        applyFilters();
        updateStats();

    } catch (error) {

        console.error(
            "Load enquiries failed:",
            error
        );

        renderTableError(
            "Unable to load enquiries."
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
        document.getElementById(
            "leadsTableBody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td
                colspan="10"
                class="loading-cell"
            >
                Loading customer enquiries...
            </td>
        </tr>
    `;
}


function renderTableError(message) {

    const tbody =
        document.getElementById(
            "leadsTableBody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td
                colspan="10"
                class="loading-cell"
            >
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


/* =========================================================
   FIELD MAPPING
   ========================================================= */

function getCustomerName(lead) {

    return (
        lead.customer_name ||
        lead.name ||
        lead.full_name ||
        "Unknown Customer"
    );
}


function getPhone(lead) {

    return (
        lead.phone ||
        lead.mobile ||
        lead.contact_number ||
        lead.phone_number ||
        "—"
    );
}


function getEmail(lead) {

    return (
        lead.email ||
        "—"
    );
}


function getEventType(lead) {

    return (
        lead.event_type ||
        lead.event_name ||
        lead.event ||
        lead.event_category ||
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


function getLocation(lead) {

    return (
        lead.venue ||
        lead.location ||
        lead.city ||
        lead.venue_name ||
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
            (lead) => {

                const searchable = [

                    getCustomerName(lead),
                    getPhone(lead),
                    getEmail(lead),
                    getEventType(lead),
                    getEventDate(lead),
                    getGuests(lead),
                    getLocation(lead),
                    getSource(lead),
                    lead.message,
                    lead.remarks,
                    lead.internal_notes

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    !search ||
                    searchable.includes(search);

                const status =
                    safeValue(
                        lead.status || "new"
                    ).toLowerCase();

                const priority =
                    safeValue(
                        lead.priority || "normal"
                    ).toLowerCase();

                const matchesStatus =
                    currentStatusFilter === "all" ||
                    status ===
                    currentStatusFilter;

                const matchesPriority =
                    currentPriorityFilter === "all" ||
                    priority ===
                    currentPriorityFilter;

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesPriority
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
        document.getElementById(
            "leadsTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    if (!tbody) {
        return;
    }

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
            .map(createLeadRow)
            .join("");
}


/* =========================================================
   CREATE TABLE ROW

   10 columns exactly matching dashboard.html:

   1 Customer
   2 Phone
   3 Email
   4 Event
   5 Event Date
   6 Guests
   7 Location
   8 Status
   9 Priority
   10 Action
   ========================================================= */

function createLeadRow(lead) {

    const id =
        safeValue(lead.id);

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

    const location =
        getLocation(lead);

    const status =
        lead.status || "new";

    const priority =
        lead.priority || "normal";

    return `
        <tr
            data-lead-id="${escapeHTML(id)}"
        >

            <!-- CUSTOMER - READ ONLY -->
            <td>
                <div class="customer-cell">
                    <strong>
                        ${escapeHTML(name)}
                    </strong>
                </div>
            </td>


            <!-- PHONE - READ ONLY -->
            <td>
                <div class="phone-cell">
                    ${escapeHTML(phone)}
                </div>
            </td>


            <!-- EMAIL - CLICK TO EDIT -->
            <td>
                ${createEditableCell(
                    lead,
                    "email",
                    email,
                    "text"
                )}
            </td>


            <!-- EVENT - CLICK TO EDIT -->
            <td>
                ${createEditableCell(
                    lead,
                    "event_type",
                    eventType || "—",
                    "select",
                    getEventOptions()
                )}
            </td>


            <!-- EVENT DATE - CLICK TO EDIT -->
            <td>
                ${createEditableCell(
                    lead,
                    "event_date",
                    eventDate
                        ? formatDate(eventDate)
                        : "—",
                    "date",
                    null,
                    eventDate
                )}
            </td>


            <!-- GUESTS - CLICK TO EDIT -->
            <td>
                ${createEditableCell(
                    lead,
                    "guests",
                    guests === ""
                        ? "—"
                        : guests,
                    "number"
                )}
            </td>


            <!-- LOCATION - CLICK TO EDIT -->
            <td>
                ${createEditableCell(
                    lead,
                    "venue",
                    location || "—",
                    "text"
                )}
            </td>


            <!-- STATUS - CLICK TO EDIT -->
            <td>
                ${createEditableCell(
                    lead,
                    "status",
                    formatStatus(status),
                    "select",
                    getStatusOptions()
                )}
            </td>


            <!-- PRIORITY - CLICK TO EDIT -->
            <td>
                ${createEditableCell(
                    lead,
                    "priority",
                    formatPriority(priority),
                    "select",
                    getPriorityOptions()
                )}
            </td>


            <!-- ACTION -->
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
   CLICK-TO-EDIT CELL

   No pencil icon.
   Looks like normal text until clicked.
   ========================================================= */

function createEditableCell(
    lead,
    field,
    displayValue,
    type = "text",
    options = null,
    rawValue = null
) {

    const id =
        safeValue(lead.id);

    let value;

    if (
        rawValue !== null &&
        rawValue !== undefined
    ) {
        value = rawValue;
    } else {

        if (field === "venue") {

            value =
                lead.venue ??
                lead.location ??
                lead.city ??
                "";

        } else {

            value =
                lead[field] ?? "";
        }
    }

    return `
        <div
            class="crm-inline-field"
            data-inline-field="${escapeHTML(field)}"
            data-lead-id="${escapeHTML(id)}"
            data-raw-value="${escapeHTML(value)}"
            tabindex="0"
            title="Click to edit"
        >
            <span class="inline-display">
                ${escapeHTML(
                    displayValue ||
                    "—"
                )}
            </span>
        </div>
    `;
}


/* =========================================================
   START INLINE EDIT
   ========================================================= */

function startInlineEdit(element) {

    if (
        !element ||
        element.classList.contains("editing")
    ) {
        return;
    }

    const leadId =
        element.dataset.leadId;

    const field =
        element.dataset.inlineField;

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

    let originalValue;

    if (field === "venue") {

        originalValue =
            lead.venue ??
            lead.location ??
            lead.city ??
            "";

    } else {

        originalValue =
            lead[field] ?? "";
    }

    element.classList.add(
        "editing"
    );

    const display =
        element.querySelector(
            ".inline-display"
        );

    if (!display) {
        return;
    }

    let editor;

    if (
        field === "status"
    ) {

        editor =
            createSelectEditor(
                getStatusOptions(),
                originalValue || "new"
            );

    } else if (
        field === "priority"
    ) {

        editor =
            createSelectEditor(
                getPriorityOptions(),
                originalValue || "normal"
            );

    } else if (
        field === "event_type"
    ) {

        editor =
            createSelectEditor(
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

        if (
            field === "event_date"
        ) {

            editor.type =
                "date";

        } else if (
            field === "guests"
        ) {

            editor.type =
                "number";

            editor.min = "0";

        } else {

            editor.type =
                "text";
        }

        editor.value =
            safeValue(originalValue);
    }

    display.replaceWith(
        editor
    );

    editor.focus();

    if (
        editor.tagName === "INPUT" &&
        editor.type === "text"
    ) {
        editor.select();
    }

    let finished = false;

    async function finish(
        shouldSave = true
    ) {

        if (finished) {
            return;
        }

        finished = true;

        if (!shouldSave) {

            restoreInlineDisplay(
                element,
                lead,
                field
            );

            return;
        }

        const newValue =
            editor.value;

        if (
            String(newValue) ===
            String(originalValue)
        ) {

            restoreInlineDisplay(
                element,
                lead,
                field
            );

            return;
        }

        await saveInlineField(
            leadId,
            field,
            newValue,
            originalValue
        );
    }


    editor.addEventListener(
        "blur",
        () => {

            setTimeout(
                () => finish(true),
                120
            );
        }
    );


    editor.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                editor.blur();

            } else if (
                event.key === "Escape"
            ) {

                event.preventDefault();

                finish(false);
            }
        }
    );
}


/* =========================================================
   SELECT EDITOR
   ========================================================= */

function createSelectEditor(
    options,
    selectedValue
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
                String(selectedValue)
            ) {
                item.selected = true;
            }

            select.appendChild(
                item
            );
        }
    );

    return select;
}


/* =========================================================
   SAVE INLINE FIELD
   ========================================================= */

async function saveInlineField(
    leadId,
    field,
    newValue,
    oldValue
) {

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }

    const lead =
        allLeads.find(
            item =>
                String(item.id) ===
                String(leadId)
        );

    if (!lead) {
        return;
    }

    let databaseField =
        field;

    /*
       Location display uses venue first.
       We therefore save to venue if the
       database already has a venue value.
    */

    if (field === "venue") {

        if (
            Object.prototype.hasOwnProperty.call(
                lead,
                "venue"
            )
        ) {

            databaseField =
                "venue";

        } else if (
            Object.prototype.hasOwnProperty.call(
                lead,
                "location"
            )
        ) {

            databaseField =
                "location";

        } else {

            databaseField =
                "venue";
        }
    }


    const updateData = {};

    updateData[databaseField] =
        newValue === ""
            ? null
            : newValue;

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
                "Inline update failed:",
                error
            );

            showToast(
                error.message ||
                "Unable to save change.",
                "error"
            );

            lead[field] =
                oldValue;

            refreshLeadRow(
                leadId
            );

            return;
        }

        if (data) {

            Object.assign(
                lead,
                data
            );

        } else {

            lead[databaseField] =
                updateData[databaseField];
        }

        showToast(
            "Saved successfully."
        );

        refreshLeadRow(
            leadId
        );

        updateStats();

        if (
            currentLead &&
            String(currentLead.id) ===
            String(leadId)
        ) {

            currentLead =
                lead;

            populateLeadModal(
                currentLead
            );
        }

    } catch (error) {

        console.error(
            error
        );

        lead[field] =
            oldValue;

        refreshLeadRow(
            leadId
        );

        showToast(
            "Unable to save change.",
            "error"
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

    if (!element) {
        return;
    }

    const editor =
        element.querySelector(
            ".crm-inline-editor"
        );

    if (!editor) {
        return;
    }

    let value;

    if (field === "venue") {

        value =
            lead.venue ??
            lead.location ??
            lead.city ??
            "";

    } else {

        value =
            lead[field];
    }

    if (
        field === "status"
    ) {

        value =
            formatStatus(value);

    } else if (
        field === "priority"
    ) {

        value =
            formatPriority(value);

    } else if (
        field === "event_date"
    ) {

        value =
            formatDate(value);
    }

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        value = "—";
    }

    const display =
        document.createElement(
            "span"
        );

    display.className =
        "inline-display";

    display.textContent =
        value;

    editor.replaceWith(
        display
    );

    element.classList.remove(
        "editing"
    );
}


/* =========================================================
   REFRESH ROW
   ========================================================= */

function refreshLeadRow(
    leadId
) {

    const lead =
        allLeads.find(
            item =>
                String(item.id) ===
                String(leadId)
        );

    if (!lead) {
        return;
    }

    const rows =
        document.querySelectorAll(
            "#leadsTableBody tr"
        );

    let row = null;

    rows.forEach(
        item => {

            if (
                String(
                    item.dataset.leadId
                ) ===
                String(leadId)
            ) {
                row = item;
            }
        }
    );

    if (!row) {

        renderLeads();

        return;
    }

    const temporary =
        document.createElement(
            "tbody"
        );

    temporary.innerHTML =
        createLeadRow(lead);

    const newRow =
        temporary.firstElementChild;

    if (newRow) {
        row.replaceWith(
            newRow
        );
    }
}


/* =========================================================
   VIEW DETAILS
   ========================================================= */

function openLeadModal(
    leadId
) {

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

    const modal =
        document.getElementById(
            "leadModal"
        );

    if (!modal) {

        showToast(
            "Lead details window not found.",
            "error"
        );

        return;
    }

    populateLeadModal(
        lead
    );

    modal.hidden =
        false;

    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   MODAL POPULATION
   ========================================================= */

function populateLeadModal(
    lead
) {

    setText(
        "#detailCustomerName",
        getCustomerName(lead)
    );

    setText(
        "#detailPhone",
        getPhone(lead)
    );

    setText(
        "#detailEmail",
        getEmail(lead)
    );

    setText(
        "#detailSource",
        getSource(lead) || "—"
    );

    setControl(
        "#detailEventType",
        getEventType(lead)
    );

    setControl(
        "#detailVenue",
        getLocation(lead)
    );

    setControl(
        "#detailEventDate",
        getEventDate(lead)
    );

    setControl(
        "#detailGuests",
        getGuests(lead)
    );

    setControl(
        "#detailStatus",
        lead.status || "new"
    );

    setControl(
        "#detailPriority",
        lead.priority || "normal"
    );

    setControl(
        "#detailFollowUp",
        convertToDateTimeLocal(
            lead.follow_up_at ||
            lead.followup_at ||
            ""
        )
    );

    setControl(
        "#detailAssignedTo",
        lead.assigned_to ||
        ""
    );

    setText(
        "#detailMessage",
        lead.message ||
        lead.enquiry ||
        lead.requirements ||
        "No customer message."
    );

    setControl(
        "#detailRemarks",
        lead.remarks ||
        lead.internal_notes ||
        lead.notes ||
        ""
    );
}


/* =========================================================
   MODAL HELPERS
   ========================================================= */

function setText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );

    if (!element) {
        return;
    }

    element.textContent =
        safeValue(value) || "—";
}


function setControl(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );

    if (!element) {
        return;
    }

    element.value =
        safeValue(value);
}


function convertToDateTimeLocal(
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
        return safeValue(value)
            .slice(0, 16);
    }

    const pad =
        number =>
            String(number)
                .padStart(2, "0");

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


/* =========================================================
   CLOSE LEAD MODAL
   ========================================================= */

function closeLeadModal() {

    const modal =
        document.getElementById(
            "leadModal"
        );

    if (!modal) {
        return;
    }

    modal.hidden =
        true;

    document.body.style.overflow =
        "";

    currentLead =
        null;
}


/* =========================================================
   SAVE MODAL
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

    const leadId =
        currentLead.id;

    const updateData = {};


    const eventType =
        $("#detailEventType")?.value;

    const venue =
        $("#detailVenue")?.value;

    const eventDate =
        $("#detailEventDate")?.value;

    const guests =
        $("#detailGuests")?.value;

    const status =
        $("#detailStatus")?.value;

    const priority =
        $("#detailPriority")?.value;

    const followUp =
        $("#detailFollowUp")?.value;

    const assignedTo =
        $("#detailAssignedTo")?.value;

    const remarks =
        $("#detailRemarks")?.value;


    if (
        eventType !== undefined
    ) {
        updateData.event_type =
            eventType || null;
    }

    /*
       Use venue column when available.
    */

    if (
        Object.prototype.hasOwnProperty.call(
            currentLead,
            "venue"
        )
    ) {

        updateData.venue =
            venue || null;

    } else {

        updateData.location =
            venue || null;
    }


    if (
        eventDate !== undefined
    ) {
        updateData.event_date =
            eventDate || null;
    }


    if (
        guests !== undefined
    ) {
        updateData.guests =
            guests === ""
                ? null
                : Number(guests);
    }


    if (
        status !== undefined
    ) {
        updateData.status =
            status || "new";
    }


    if (
        priority !== undefined
    ) {
        updateData.priority =
            priority || "normal";
    }


    if (
        followUp !== undefined
    ) {
        updateData.follow_up_at =
            followUp
                ? new Date(
                    followUp
                ).toISOString()
                : null;
    }


    if (
        assignedTo !== undefined
    ) {
        updateData.assigned_to =
            assignedTo || null;
    }


    if (
        remarks !== undefined
    ) {

        /*
           Use remarks if it exists in the
           current row, otherwise internal_notes.
        */

        if (
            Object.prototype.hasOwnProperty.call(
                currentLead,
                "remarks"
            )
        ) {

            updateData.remarks =
                remarks || null;

        } else {

            updateData.internal_notes =
                remarks || null;
        }
    }


    const message =
        document.getElementById(
            "leadModalMessage"
        );

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
                "Modal save error:",
                error
            );

            if (message) {
                message.textContent =
                    error.message ||
                    "Unable to save changes.";
            }

            showToast(
                error.message ||
                "Unable to save changes.",
                "error"
            );

            return;
        }

        if (data) {

            Object.assign(
                currentLead,
                data
            );

        } else {

            Object.assign(
                currentLead,
                updateData
            );
        }


        const index =
            allLeads.findIndex(
                item =>
                    String(item.id) ===
                    String(leadId)
            );

        if (index !== -1) {

            Object.assign(
                allLeads[index],
                data ||
                updateData
            );

            currentLead =
                allLeads[index];
        }


        renderLeads();
        updateStats();

        populateLeadModal(
            currentLead
        );

        if (message) {
            message.textContent =
                "Changes saved successfully.";
        }

        showToast(
            "Enquiry updated successfully."
        );

    } catch (error) {

        console.error(
            error
        );

        showToast(
            "Unable to save changes.",
            "error"
        );
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
            "Add enquiry window not found.",
            "error"
        );

        return;
    }

    modal.hidden =
        false;

    document.body.style.overflow =
        "hidden";

    const form =
        document.getElementById(
            "addEnquiryForm"
        );

    if (form) {
        form.reset();
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


/* =========================================================
   CLOSE ADD ENQUIRY
   ========================================================= */

function closeAddEnquiryModal() {

    const modal =
        document.getElementById(
            "addEnquiryModal"
        );

    if (!modal) {
        return;
    }

    modal.hidden =
        true;

    document.body.style.overflow =
        "";
}


/* =========================================================
   ADD ENQUIRY
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
        document.getElementById(
            "addEnquiryForm"
        );

    if (!form) {
        return;
    }

    const formData =
        new FormData(form);

    const data = {};


    for (
        const [
            key,
            value
        ]
        of formData.entries()
    ) {

        data[key] =
            typeof value === "string"
                ? value.trim()
                : value;
    }


    if (!data.status) {
        data.status =
            "new";
    }


    if (!data.priority) {
        data.priority =
            "normal";
    }


    if (
        data.guests === ""
    ) {
        data.guests =
            null;
    } else if (
        data.guests !== undefined
    ) {
        data.guests =
            Number(data.guests);
    }


    if (
        data.event_date === ""
    ) {
        data.event_date =
            null;
    }


    if (
        data.follow_up_at === ""
    ) {
        data.follow_up_at =
            null;
    }


    if (
        data.customer_name &&
        !data.name
    ) {
        data.name =
            data.customer_name;
    }


    try {

        const {
            data: created,
            error
        } =
            await client
                .from("customer_enquiries")
                .insert([
                    data
                ])
                .select()
                .single();

        if (error) {

            console.error(
                "Create enquiry error:",
                error
            );

            const message =
                document.getElementById(
                    "addEnquiryMessage"
                );

            if (message) {
                message.textContent =
                    error.message ||
                    "Unable to create enquiry.";
            }

            showToast(
                error.message ||
                "Unable to create enquiry.",
                "error"
            );

            return;
        }


        if (created) {

            allLeads.unshift(
                created
            );
        }


        applyFilters();
        updateStats();

        closeAddEnquiryModal();

        showToast(
            "Customer enquiry added successfully."
        );

    } catch (error) {

        console.error(
            error
        );

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
                    lead.status ||
                    "new"
                ).toLowerCase() ===
                "new"
        ).length;


    const contactedCount =
        allLeads.filter(
            lead =>
                String(
                    lead.status ||
                    ""
                ).toLowerCase() ===
                "contacted"
        ).length;


    const closedCount =
        allLeads.filter(
            lead =>
                String(
                    lead.status ||
                    ""
                ).toLowerCase() ===
                "closed"
        ).length;


    setStat(
        "totalCount",
        total
    );

    setStat(
        "newCount",
        newCount
    );

    setStat(
        "contactedCount",
        contactedCount
    );

    setStat(
        "closedCount",
        closedCount
    );
}


function setStat(
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

                    currentStatusFilter =
                        card.dataset.statusFilter ||
                        "all";

                    const statusFilter =
                        document.getElementById(
                            "statusFilter"
                        );

                    if (statusFilter) {
                        statusFilter.value =
                            currentStatusFilter;
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
        document.getElementById(
            "searchInput"
        );

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

                currentStatusFilter =
                    statusFilter.value ||
                    "all";

                updateActiveStatCard();

                applyFilters();
            }
        );
    }


    if (priorityFilter) {

        priorityFilter.addEventListener(
            "change",
            () => {

                currentPriorityFilter =
                    priorityFilter.value ||
                    "all";

                applyFilters();
            }
        );
    }
}


function updateActiveStatCard() {

    const cards =
        document.querySelectorAll(
            ".stat-card"
        );

    cards.forEach(
        card => {

            if (
                card.dataset.statusFilter ===
                currentStatusFilter
            ) {

                card.classList.add(
                    "active"
                );

            } else {

                card.classList.remove(
                    "active"
                );
            }
        }
    );
}


/* =========================================================
   REFRESH
   ========================================================= */

function setupRefreshButton() {

    const button =
        document.getElementById(
            "refreshBtn"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async () => {

            button.disabled =
                true;

            const original =
                button.innerHTML;

            button.textContent =
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
        document.getElementById(
            "addEnquiryBtn"
        );

    if (!button) {
        return;
    }

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
        event => {


            /* -----------------------------------------
               INLINE EDIT
               ----------------------------------------- */

            const inline =
                event.target.closest(
                    ".crm-inline-field"
                );

            if (
                inline &&
                !inline.classList.contains(
                    "editing"
                )
            ) {

                startInlineEdit(
                    inline
                );

                return;
            }


            /* -----------------------------------------
               VIEW DETAILS
               ----------------------------------------- */

            const viewButton =
                event.target.closest(
                    "[data-action='view']"
                );

            if (viewButton) {

                openLeadModal(
                    viewButton.dataset.id
                );

                return;
            }


            /* -----------------------------------------
               LEAD MODAL CLOSE
               ----------------------------------------- */

            const closeButton =
                event.target.closest(
                    "#closeLeadModal"
                );

            if (closeButton) {

                closeLeadModal();

                return;
            }


            /* -----------------------------------------
               ADD MODAL CLOSE
               ----------------------------------------- */

            const closeAdd =
                event.target.closest(
                    "#closeAddEnquiry"
                );

            if (closeAdd) {

                closeAddEnquiryModal();

                return;
            }


            /* -----------------------------------------
               CANCEL ADD
               ----------------------------------------- */

            const cancelAdd =
                event.target.closest(
                    "#cancelAddEnquiry"
                );

            if (cancelAdd) {

                closeAddEnquiryModal();

                return;
            }


            /* -----------------------------------------
               SAVE LEAD MODAL
               ----------------------------------------- */

            const saveButton =
                event.target.closest(
                    "#saveLeadBtn"
                );

            if (saveButton) {

                saveModalChanges();

                return;
            }

        }
    );


    /* -----------------------------------------
       LEAD MODAL BACKDROP
       ----------------------------------------- */

    const leadModal =
        document.getElementById(
            "leadModal"
        );

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


    /* -----------------------------------------
       ADD MODAL BACKDROP
       ----------------------------------------- */

    const addModal =
        document.getElementById(
            "addEnquiryModal"
        );

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
   ADD FORM
   ========================================================= */

function setupAddForm() {

    const form =
        document.getElementById(
            "addEnquiryForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        submitAddEnquiry
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    const button =
        document.getElementById(
            "logoutBtn"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        logoutCRM
    );
}


/* =========================================================
   AUTH STATE
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
    );
}


/* =========================================================
   FORMATTERS
   ========================================================= */

function formatStatus(
    status
) {

    if (!status) {
        return "New";
    }

    return String(status)
        .replace(
            /[-_]/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}


function formatPriority(
    priority
) {

    if (!priority) {
        return "Normal";
    }

    return String(priority)
        .replace(
            /[-_]/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}


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

    console.log(
        "Select My Venue CRM initializing..."
    );

    const session =
        await checkCRMAuth();

    if (!session) {
        return;
    }

    setupSearch();
    setupFilters();
    setupRefreshButton();
    setupAddButton();
    setupGlobalClicks();
    setupAddForm();
    setupLogout();
    setupStatFilters();
    setupKeyboard();
    setupAuthListener();

    await loadEnquiries();

    console.log(
        "Select My Venue CRM ready."
    );
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
        initializeCRM
    );

} else {

    initializeCRM();
}


/* =========================================================
   PUBLIC API
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
