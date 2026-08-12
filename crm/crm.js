/* =========================================================
   SELECT MY VENUE — CRM
   crm.js
   COMPLETE REPLACEMENT

   Features:
   - Supabase Auth
   - Customer enquiries
   - Correct phone/email mapping
   - No pencil/edit icons
   - Click-to-edit clean table
   - View Details modal
   - Modal editing + saving
   - Add Enquiry
   - Search
   - Status / Priority filters
   - Refresh
   ========================================================= */


/* =========================================================
   SUPABASE CONFIG
   dashboard.html provides these values BEFORE crm.js loads.

   DO NOT put another Supabase URL/key here.
   ========================================================= */

const CRM_SUPABASE_URL =
    window.SUPABASE_URL || "";

const CRM_SUPABASE_ANON_KEY =
    window.SUPABASE_ANON_KEY || "";

let supabaseClient = null;


/* =========================================================
   SUPABASE CLIENT
   ========================================================= */

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
        console.error(
            "Supabase configuration is missing."
        );

        showToast(
            "Supabase configuration is missing.",
            "error"
        );

        return null;
    }

    supabaseClient =
        window.supabase.createClient(
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
    return Array.from(
        parent.querySelectorAll(selector)
    );
}


/* =========================================================
   SAFE HELPERS
   ========================================================= */

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
   FIELD RESOLUTION
   ---------------------------------------------------------
   This is the important fix for Phone / Email.

   The CRM will look for the first existing/populated
   column from the supplied aliases.
   ========================================================= */

const FIELD_ALIASES = {

    name: [
        "name",
        "customer_name",
        "customer",
        "full_name"
    ],

    phone: [
        "phone",
        "mobile",
        "phone_number",
        "mobile_number",
        "contact_number",
        "customer_phone",
        "customer_mobile",
        "contact_phone"
    ],

    email: [
        "email",
        "email_address",
        "email_id",
        "customer_email",
        "customer_email_address",
        "contact_email"
    ],

    event_type: [
        "event_type",
        "event",
        "event_name"
    ],

    event_date: [
        "event_date",
        "date",
        "eventDate"
    ],

    guests: [
        "guests",
        "guest_count",
        "number_of_guests",
        "no_of_guests",
        "guest_number"
    ],

    location: [
        "location",
        "city",
        "area",
        "customer_location"
    ],

    venue: [
        "venue",
        "venue_name"
    ],

    source: [
        "source",
        "lead_source",
        "enquiry_source"
    ],

    message: [
        "message",
        "enquiry",
        "requirements",
        "customer_message",
        "customer_requirement",
        "comment"
    ],

    remarks: [
        "remarks",
        "internal_notes",
        "notes",
        "internal_remarks"
    ],

    follow_up_at: [
        "follow_up_at",
        "followup_at",
        "follow_up",
        "followup",
        "follow_up_date"
    ],

    assigned_to: [
        "assigned_to",
        "assigned",
        "employee",
        "employee_name"
    ],

    status: [
        "status"
    ],

    priority: [
        "priority"
    ]
};


/* =========================================================
   GET FIELD KEY
   ---------------------------------------------------------
   IMPORTANT:

   If the database has:
       email = null
       customer_email = "abc@email.com"

   this function returns customer_email.

   That prevents the Email column from appearing blank.
   ========================================================= */

function getFieldKey(lead, logicalField) {

    if (!lead) {
        return null;
    }

    const aliases =
        FIELD_ALIASES[logicalField] || [];

    /* First prefer a populated value. */

    for (const key of aliases) {

        if (
            Object.prototype.hasOwnProperty.call(
                lead,
                key
            ) &&
            lead[key] !== null &&
            lead[key] !== undefined &&
            String(lead[key]).trim() !== ""
        ) {
            return key;
        }
    }

    /* Then use the first existing database column. */

    for (const key of aliases) {

        if (
            Object.prototype.hasOwnProperty.call(
                lead,
                key
            )
        ) {
            return key;
        }
    }

    return null;
}


/* =========================================================
   GET FIELD VALUE
   ========================================================= */

function getLeadValue(
    lead,
    logicalField,
    fallback = ""
) {

    const key =
        getFieldKey(
            lead,
            logicalField
        );

    if (!key) {
        return fallback;
    }

    const value =
        lead[key];

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return fallback;
    }

    return value;
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "success"
) {

    let toast =
        document.getElementById(
            "toastMessage"
        );

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id =
            "toastMessage";

        document.body.appendChild(
            toast
        );
    }

    toast.textContent =
        message;

    toast.classList.remove(
        "show"
    );

    if (type === "error") {

        toast.style.background =
            "#b42318";

    } else if (type === "warning") {

        toast.style.background =
            "#9a6700";

    } else {

        toast.style.background =
            "#20283d";
    }

    requestAnimationFrame(() => {

        toast.classList.add(
            "show"
        );

    });

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

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
                "Auth error:",
                error
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
            "Authentication check failed:",
            error
        );

        return null;
    }
}


/* =========================================================
   STAFF NAME
   ========================================================= */

function updateStaffName(user) {

    if (!user) {
        return;
    }

    const element =
        document.getElementById(
            "staffName"
        ) ||
        document.querySelector(
            ".staff-name"
        );

    if (!element) {
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

    element.textContent =
        name;
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

        console.error(
            error
        );

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
                .from(
                    "customer_enquiries"
                )
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
        document.getElementById(
            "leadsTableBody"
        ) ||
        document.querySelector(
            ".leads-table tbody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td
                colspan="9"
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
        ) ||
        document.querySelector(
            ".leads-table tbody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td
                colspan="9"
                class="loading-cell"
            >
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


/* =========================================================
   SEARCH TEXT
   ========================================================= */

function getSearchableText(lead) {

    return [

        getLeadValue(
            lead,
            "name"
        ),

        getLeadValue(
            lead,
            "phone"
        ),

        getLeadValue(
            lead,
            "email"
        ),

        getLeadValue(
            lead,
            "venue"
        ),

        getLeadValue(
            lead,
            "location"
        ),

        getLeadValue(
            lead,
            "event_type"
        ),

        getLeadValue(
            lead,
            "message"
        ),

        getLeadValue(
            lead,
            "source"
        )

    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}


/* =========================================================
   FILTERS
   ========================================================= */

function applyFilters() {

    const search =
        currentSearch
            .trim()
            .toLowerCase();

    filteredLeads =
        allLeads.filter(
            (lead) => {

                const searchable =
                    getSearchableText(
                        lead
                    );

                const matchesSearch =
                    !search ||
                    searchable.includes(
                        search
                    );

                const status =
                    safeValue(
                        getLeadValue(
                            lead,
                            "status",
                            "new"
                        )
                    )
                        .toLowerCase();

                const priority =
                    safeValue(
                        getLeadValue(
                            lead,
                            "priority",
                            "normal"
                        )
                    )
                        .toLowerCase();

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
   RENDER TABLE
   ========================================================= */

function renderLeads() {

    const tbody =
        document.getElementById(
            "leadsTableBody"
        ) ||
        document.querySelector(
            ".leads-table tbody"
        );

    if (!tbody) {
        return;
    }

    if (!filteredLeads.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="loading-cell"
                >
                    <div class="empty-state">
                        <div class="empty-icon">
                            ⌕
                        </div>

                        <h3>
                            No enquiries found
                        </h3>

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
            .map(
                createLeadRow
            )
            .join("");
}


/* =========================================================
   CREATE LEAD ROW
   ---------------------------------------------------------
   IMPORTANT:
   CUSTOMER, PHONE and EMAIL are now separate columns.
   No pencil is generated anywhere.
   ========================================================= */

function createLeadRow(lead) {

    const id =
        safeValue(
            lead.id
        );

    const name =
        getLeadValue(
            lead,
            "name",
            "Unknown Customer"
        );

    const phone =
        getLeadValue(
            lead,
            "phone",
            "—"
        );

    const email =
        getLeadValue(
            lead,
            "email",
            "—"
        );

    const eventType =
        getLeadValue(
            lead,
            "event_type",
            "—"
        );

    const eventDate =
        getLeadValue(
            lead,
            "event_date",
            ""
        );

    const guests =
        getLeadValue(
            lead,
            "guests",
            "—"
        );

    const location =
        getLeadValue(
            lead,
            "location",
            "—"
        );

    const status =
        getLeadValue(
            lead,
            "status",
            "new"
        );

    const priority =
        getLeadValue(
            lead,
            "priority",
            "normal"
        );

    const phoneField =
        getFieldKey(
            lead,
            "phone"
        );

    const emailField =
        getFieldKey(
            lead,
            "email"
        );

    const eventField =
        getFieldKey(
            lead,
            "event_type"
        );

    const dateField =
        getFieldKey(
            lead,
            "event_date"
        );

    const guestsField =
        getFieldKey(
            lead,
            "guests"
        );

    const locationField =
        getFieldKey(
            lead,
            "location"
        );

    return `
        <tr
            data-lead-id="${escapeHTML(id)}"
        >

            <!-- CUSTOMER -->

            <td>
                <div class="crm-table-value">
                    ${escapeHTML(name)}
                </div>
            </td>


            <!-- PHONE -->

            <td>
                ${createInlineField(
                    lead,
                    phoneField,
                    phone,
                    "text",
                    {
                        logicalField: "phone"
                    }
                )}
            </td>


            <!-- EMAIL -->

            <td>
                ${createInlineField(
                    lead,
                    emailField,
                    email,
                    "email",
                    {
                        logicalField: "email"
                    }
                )}
            </td>


            <!-- EVENT -->

            <td>
                ${createInlineField(
                    lead,
                    eventField,
                    eventType,
                    "select",
                    {
                        options:
                            getEventOptions(),
                        logicalField:
                            "event_type"
                    }
                )}
            </td>


            <!-- EVENT DATE -->

            <td>
                ${createInlineField(
                    lead,
                    dateField,
                    formatDate(eventDate),
                    "date",
                    {
                        rawValue:
                            eventDate,
                        logicalField:
                            "event_date"
                    }
                )}
            </td>


            <!-- GUESTS -->

            <td>
                ${createInlineField(
                    lead,
                    guestsField,
                    guests,
                    "number",
                    {
                        logicalField:
                            "guests"
                    }
                )}
            </td>


            <!-- LOCATION -->

            <td>
                ${createInlineField(
                    lead,
                    locationField,
                    location,
                    "text",
                    {
                        logicalField:
                            "location"
                    }
                )}
            </td>


            <!-- STATUS -->

            <td>
                ${createInlineField(
                    lead,
                    "status",
                    formatStatus(status),
                    "select",
                    {
                        options:
                            getStatusOptions(),
                        logicalField:
                            "status"
                    }
                )}
            </td>


            <!-- PRIORITY -->

            <td>
                ${createInlineField(
                    lead,
                    "priority",
                    formatPriority(priority),
                    "select",
                    {
                        options:
                            getPriorityOptions(),
                        logicalField:
                            "priority"
                    }
                )}
            </td>


            <!-- ACTION -->

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
   ---------------------------------------------------------
   DISPLAY ONLY.
   No pencil.
   Click anywhere on the value to edit.
   ========================================================= */

function createInlineField(
    lead,
    field,
    displayValue,
    type = "text",
    config = {}
) {

    if (!field) {

        return `
            <div
                class="crm-inline-field crm-inline-disabled"
            >
                <span class="inline-display">
                    ${escapeHTML(
                        displayValue || "—"
                    )}
                </span>
            </div>
        `;
    }

    const id =
        safeValue(
            lead.id
        );

    const rawValue =
        config.rawValue !== undefined
            ? config.rawValue
            : lead[field];

    const logicalField =
        config.logicalField ||
        field;

    return `
        <div
            class="crm-inline-field"
            data-inline-field="${escapeHTML(field)}"
            data-logical-field="${escapeHTML(logicalField)}"
            data-lead-id="${escapeHTML(id)}"
            tabindex="0"
            title="Click to edit"
        >

            <span class="inline-display">
                ${escapeHTML(
                    displayValue || "—"
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
        element.classList.contains(
            "editing"
        )
    ) {
        return;
    }

    const field =
        element.dataset.inlineField;

    const logicalField =
        element.dataset.logicalField ||
        field;

    const leadId =
        element.dataset.leadId;

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

    const actualField =
        field ||
        getFieldKey(
            lead,
            logicalField
        );

    if (!actualField) {

        showToast(
            "This field is not available.",
            "warning"
        );

        return;
    }

    const originalValue =
        lead[actualField] ??
        "";

    const display =
        element.querySelector(
            ".inline-display"
        );

    if (!display) {
        return;
    }

    element.classList.add(
        "editing"
    );

    let editor = null;

    if (
        logicalField ===
        "status"
    ) {

        editor =
            createSelectEditor(
                getStatusOptions(),
                originalValue ||
                    "new"
            );

    } else if (
        logicalField ===
        "priority"
    ) {

        editor =
            createSelectEditor(
                getPriorityOptions(),
                originalValue ||
                    "normal"
            );

    } else if (
        logicalField ===
        "event_type"
    ) {

        editor =
            createSelectEditor(
                getEventOptions(),
                originalValue ||
                    ""
            );

    } else {

        editor =
            document.createElement(
                "input"
            );

        if (
            logicalField ===
            "event_date"
        ) {

            editor.type =
                "date";

        } else if (
            logicalField ===
            "guests"
        ) {

            editor.type =
                "number";

            editor.min =
                "0";

        } else if (
            logicalField ===
            "email"
        ) {

            editor.type =
                "email";

        } else {

            editor.type =
                "text";
        }

        editor.value =
            safeValue(
                originalValue
            );
    }

    editor.className =
        "crm-inline-editor";

    editor.setAttribute(
        "aria-label",
        `Edit ${logicalField}`
    );

    display.replaceWith(
        editor
    );

    editor.focus();

    if (
        editor.tagName ===
            "INPUT" &&
        editor.type !==
            "date" &&
        editor.type !==
            "number"
    ) {

        try {
            editor.select();
        } catch (e) {}
    }

    let finished =
        false;

    async function finish(
        save = true
    ) {

        if (finished) {
            return;
        }

        finished = true;

        if (save) {

            const newValue =
                editor.value;

            if (
                String(newValue) !==
                String(originalValue)
            ) {

                await saveInlineField(
                    leadId,
                    actualField,
                    newValue
                );

                return;
            }
        }

        restoreInlineDisplay(
            element,
            lead,
            actualField,
            logicalField
        );
    }


    editor.addEventListener(
        "blur",
        () => {

            setTimeout(
                () => {
                    finish(true);
                },
                100
            );

        }
    );


    editor.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                editor.blur();

                return;
            }

            if (
                event.key ===
                "Escape"
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

            const opt =
                document.createElement(
                    "option"
                );

            opt.value =
                option.value;

            opt.textContent =
                option.label;

            if (
                String(
                    option.value
                ) ===
                String(
                    selectedValue
                )
            ) {

                opt.selected =
                    true;
            }

            select.appendChild(
                opt
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
    newValue
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

        showToast(
            "Enquiry not found.",
            "error"
        );

        return;
    }

    const oldValue =
        lead[field] ?? "";

    const updateData = {};

    updateData[field] =
        newValue === ""
            ? null
            : newValue;

    try {

        const {
            data,
            error
        } =
            await client
                .from(
                    "customer_enquiries"
                )
                .update(
                    updateData
                )
                .eq(
                    "id",
                    leadId
                )
                .select()
                .single();

        if (error) {

            console.error(
                "Inline update failed:",
                error
            );

            showToast(
                error.message ||
                    "Unable to save this change.",
                "error"
            );

            lead[field] =
                oldValue;

            refreshLeadRow(
                leadId
            );

            return;
        }

        Object.assign(
            lead,
            data ||
                updateData
        );

        showToast(
            "Updated successfully."
        );

        refreshLeadRow(
            leadId
        );

        updateStats();

        if (
            currentLead &&
            String(
                currentLead.id
            ) ===
            String(
                leadId
            )
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
            "Unable to save this change.",
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
    field,
    logicalField
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

    const display =
        document.createElement(
            "span"
        );

    display.className =
        "inline-display";

    let value =
        lead[field];

    if (
        logicalField ===
        "status"
    ) {

        value =
            formatStatus(
                value
            );

    } else if (
        logicalField ===
        "priority"
    ) {

        value =
            formatPriority(
                value
            );

    } else if (
        logicalField ===
        "event_date"
    ) {

        value =
            formatDate(
                value
            );
    }

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        value =
            "—";
    }

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
   REFRESH LEAD ROW
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
        $all(
            "tr[data-lead-id]"
        );

    const row =
        rows.find(
            item =>
                String(
                    item.dataset.leadId
                ) ===
                String(leadId)
        );

    if (!row) {

        renderLeads();

        return;
    }

    const temp =
        document.createElement(
            "tbody"
        );

    temp.innerHTML =
        createLeadRow(
            lead
        );

    const newRow =
        temp.firstElementChild;

    if (newRow) {

        row.replaceWith(
            newRow
        );
    }
}


/* =========================================================
   VIEW DETAILS MODAL
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

        console.warn(
            "leadModal not found."
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
   POPULATE MODAL
   ---------------------------------------------------------
   Uses the EXACT IDs from your dashboard.html.
   ========================================================= */

function populateLeadModal(
    lead
) {

    /* CUSTOMER */

    setText(
        "detailCustomerName",
        getLeadValue(
            lead,
            "name",
            "Customer"
        )
    );


    /* PHONE */

    const phone =
        getLeadValue(
            lead,
            "phone",
            "—"
        );

    setText(
        "detailPhone",
        phone
    );


    /* EMAIL */

    const email =
        getLeadValue(
            lead,
            "email",
            "—"
        );

    setText(
        "detailEmail",
        email
    );


    /* SOURCE */

    setText(
        "detailSource",
        getLeadValue(
            lead,
            "source",
            "—"
        )
    );


    /* EVENT TYPE */

    setControl(
        "detailEventType",
        getLeadValue(
            lead,
            "event_type",
            ""
        )
    );


    /* VENUE */

    setControl(
        "detailVenue",
        getLeadValue(
            lead,
            "venue",
            ""
        )
    );


    /* EVENT DATE */

    setControl(
        "detailEventDate",
        normalizeDateInput(
            getLeadValue(
                lead,
                "event_date",
                ""
            )
        )
    );


    /* GUESTS */

    setControl(
        "detailGuests",
        getLeadValue(
            lead,
            "guests",
            ""
        )
    );


    /* STATUS */

    setControl(
        "detailStatus",
        getLeadValue(
            lead,
            "status",
            "new"
        )
    );


    /* PRIORITY */

    setControl(
        "detailPriority",
        getLeadValue(
            lead,
            "priority",
            "normal"
        )
    );


    /* FOLLOW UP */

    setControl(
        "detailFollowUp",
        normalizeDateTimeInput(
            getLeadValue(
                lead,
                "follow_up_at",
                ""
            )
        )
    );


    /* ASSIGNED TO */

    setControl(
        "detailAssignedTo",
        getLeadValue(
            lead,
            "assigned_to",
            ""
        )
    );


    /* MESSAGE */

    setText(
        "detailMessage",
        getLeadValue(
            lead,
            "message",
            "No customer message."
        )
    );


    /* REMARKS */

    setControl(
        "detailRemarks",
        getLeadValue(
            lead,
            "remarks",
            ""
        )
    );


    setupContactActions(
        lead
    );
}


/* =========================================================
   SET TEXT
   ========================================================= */

function setText(
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

    element.textContent =
        safeValue(value) ||
        "—";
}


/* =========================================================
   SET CONTROL
   ========================================================= */

function setControl(
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
        safeValue(value);
}


/* =========================================================
   NORMALIZE DATE
   ========================================================= */

function normalizeDateInput(
    value
) {

    if (!value) {
        return "";
    }

    const text =
        String(value);

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(text)
    ) {
        return text;
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

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");
}


/* =========================================================
   NORMALIZE DATETIME
   ========================================================= */

function normalizeDateTimeInput(
    value
) {

    if (!value) {
        return "";
    }

    const text =
        String(value);

    if (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
            .test(text)
    ) {

        return text.slice(
            0,
            16
        );
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

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    const hours =
        String(
            date.getHours()
        ).padStart(
            2,
            "0"
        );

    const minutes =
        String(
            date.getMinutes()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


/* =========================================================
   REFRESH MODAL
   ========================================================= */

function refreshModalData() {

    if (!currentLead) {
        return;
    }

    populateLeadModal(
        currentLead
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

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }

    const lead =
        currentLead;

    const updateData = {};


    /* EVENT TYPE */

    addModalUpdate(
        updateData,
        lead,
        "event_type",
        getControl(
            "detailEventType"
        )
    );


    /* VENUE */

    addModalUpdate(
        updateData,
        lead,
        "venue",
        getControl(
            "detailVenue"
        )
    );


    /* EVENT DATE */

    addModalUpdate(
        updateData,
        lead,
        "event_date",
        getControl(
            "detailEventDate"
        )
    );


    /* GUESTS */

    addModalUpdate(
        updateData,
        lead,
        "guests",
        getControl(
            "detailGuests"
        )
    );


    /* STATUS */

    addModalUpdate(
        updateData,
        lead,
        "status",
        getControl(
            "detailStatus"
        )
    );


    /* PRIORITY */

    addModalUpdate(
        updateData,
        lead,
        "priority",
        getControl(
            "detailPriority"
        )
    );


    /* FOLLOW UP */

    addModalUpdate(
        updateData,
        lead,
        "follow_up_at",
        getControl(
            "detailFollowUp"
        )
    );


    /* ASSIGNED TO */

    addModalUpdate(
        updateData,
        lead,
        "assigned_to",
        getControl(
            "detailAssignedTo"
        )
    );


    /* REMARKS */

    addModalUpdate(
        updateData,
        lead,
        "remarks",
        getControl(
            "detailRemarks"
        )
    );


    if (
        !Object.keys(
            updateData
        ).length
    ) {

        showToast(
            "Nothing to save.",
            "warning"
        );

        return;
    }


    const saveButton =
        document.getElementById(
            "saveLeadBtn"
        );

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
                .from(
                    "customer_enquiries"
                )
                .update(
                    updateData
                )
                .eq(
                    "id",
                    lead.id
                )
                .select()
                .single();

        if (error) {

            console.error(
                "Modal save error:",
                error
            );

            showToast(
                error.message ||
                    "Unable to save enquiry.",
                "error"
            );

            return;
        }


        Object.assign(
            lead,
            data ||
                updateData
        );


        const index =
            allLeads.findIndex(
                item =>
                    String(item.id) ===
                    String(lead.id)
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

        showToast(
            "Enquiry updated successfully."
        );

    } catch (error) {

        console.error(
            error
        );

        showToast(
            "Unable to save enquiry.",
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
   ADD MODAL UPDATE
   ---------------------------------------------------------
   Uses the real existing database key if it exists.
   ========================================================= */

function addModalUpdate(
    updateData,
    lead,
    logicalField,
    value
) {

    if (value === undefined) {
        return;
    }

    const actualField =
        getFieldKey(
            lead,
            logicalField
        );

    if (!actualField) {
        return;
    }

    const oldValue =
        lead[actualField] ??
        "";

    const normalizedNew =
        value === ""
            ? null
            : value;

    if (
        String(
            oldValue ?? ""
        ) !==
        String(
            normalizedNew ?? ""
        )
    ) {

        updateData[
            actualField
        ] =
            normalizedNew;
    }
}


/* =========================================================
   GET CONTROL
   ========================================================= */

function getControl(
    id
) {

    const element =
        document.getElementById(
            id
        );

    if (!element) {
        return undefined;
    }

    return element.value;
}


/* =========================================================
   CONTACT ACTIONS
   ========================================================= */

function setupContactActions(
    lead
) {

    const phone =
        getLeadValue(
            lead,
            "phone",
            ""
        );

    const email =
        getLeadValue(
            lead,
            "email",
            ""
        );


    const call =
        document.getElementById(
            "modalCallBtn"
        ) ||
        document.querySelector(
            "[data-action='call']"
        );


    const whatsapp =
        document.getElementById(
            "modalWhatsappBtn"
        ) ||
        document.querySelector(
            "[data-action='whatsapp']"
        );


    const emailButton =
        document.getElementById(
            "modalEmailBtn"
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

            call.style.opacity =
                "1";

        } else {

            call.removeAttribute(
                "href"
            );

            call.style.pointerEvents =
                "none";

            call.style.opacity =
                "0.5";
        }
    }


    if (whatsapp) {

        if (phone) {

            const cleanPhone =
                String(phone)
                    .replace(
                        /\D/g,
                        ""
                    );

            whatsapp.href =
                `https://wa.me/${cleanPhone}`;

            whatsapp.target =
                "_blank";

            whatsapp.rel =
                "noopener noreferrer";

            whatsapp.style.pointerEvents =
                "auto";

            whatsapp.style.opacity =
                "1";

        } else {

            whatsapp.removeAttribute(
                "href"
            );

            whatsapp.style.pointerEvents =
                "none";

            whatsapp.style.opacity =
                "0.5";
        }
    }


    if (emailButton) {

        if (email) {

            emailButton.href =
                `mailto:${email}`;

            emailButton.style.pointerEvents =
                "auto";

            emailButton.style.opacity =
                "1";

        } else {

            emailButton.removeAttribute(
                "href"
            );

            emailButton.style.pointerEvents =
                "none";

            emailButton.style.opacity =
                "0.5";
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

    modal.hidden =
        false;

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
        event.target;

    if (!form) {
        return;
    }

    const formData =
        new FormData(
            form
        );

    const data = {};

    for (
        const [
            key,
            value
        ]
        of formData.entries()
    ) {

        data[key] =
            typeof value ===
            "string"
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


    /* Convert empty optional values to null. */

    Object.keys(
        data
    ).forEach(
        key => {

            if (
                data[key] === ""
            ) {

                data[key] =
                    null;
            }
        }
    );


    const submitButton =
        document.getElementById(
            "submitEnquiryBtn"
        );

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
                .from(
                    "customer_enquiries"
                )
                .insert(
                    [data]
                )
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
   STATISTICS
   ========================================================= */

function updateStats() {

    const total =
        allLeads.length;


    const newCount =
        allLeads.filter(
            lead =>
                String(
                    getLeadValue(
                        lead,
                        "status",
                        "new"
                    )
                )
                    .toLowerCase() ===
                "new"
        ).length;


    const contactedCount =
        allLeads.filter(
            lead =>
                String(
                    getLeadValue(
                        lead,
                        "status",
                        ""
                    )
                )
                    .toLowerCase() ===
                "contacted"
        ).length;


    const closedCount =
        allLeads.filter(
            lead => {

                const status =
                    String(
                        getLeadValue(
                            lead,
                            "status",
                            ""
                        )
                    )
                        .toLowerCase();

                return (
                    status ===
                        "closed" ||
                    status ===
                        "converted" ||
                    status ===
                        "booked"
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
        $all(
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
                        card.dataset
                            .statusFilter;

                    currentStatusFilter =
                        filter ||
                        "all";

                    const statusSelect =
                        document.getElementById(
                            "statusFilter"
                        );

                    if (statusSelect) {

                        statusSelect.value =
                            currentStatusFilter;
                    }

                    applyFilters();
                }
            );
        }
    );
}


/* =========================================================
   FORMAT STATUS
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


/* =========================================================
   FORMAT PRIORITY
   ========================================================= */

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


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "—";
    }

    const text =
        String(value);

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(text)
    ) {

        const [
            year,
            month,
            day
        ] =
            text.split("-");

        const date =
            new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            );

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
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
   FORMAT DATETIME
   ========================================================= */

function formatDateTime(
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
   STATUS OPTIONS
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


/* =========================================================
   PRIORITY OPTIONS
   ========================================================= */

function getPriorityOptions() {

    return [

        {
            value: "normal",
            label: "Normal"
        },

        {
            value: "low",
            label: "Low"
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


/* =========================================================
   EVENT OPTIONS
   ========================================================= */

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

    const status =
        document.getElementById(
            "statusFilter"
        );

    const priority =
        document.getElementById(
            "priorityFilter"
        );


    if (status) {

        status.addEventListener(
            "change",
            () => {

                currentStatusFilter =
                    status.value ||
                    "all";

                updateActiveStatCard();

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


/* =========================================================
   ACTIVE STAT CARD
   ========================================================= */

function updateActiveStatCard() {

    $all(
        ".stat-card"
    ).forEach(
        card => {

            const filter =
                card.dataset
                    .statusFilter ||
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
   REFRESH BUTTON
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

            if (button.disabled) {
                return;
            }

            button.disabled =
                true;

            const original =
                button.textContent;

            button.textContent =
                "Refreshing...";

            await loadEnquiries();

            button.disabled =
                false;

            button.textContent =
                original ||
                "↻ Refresh";
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
   GLOBAL CLICKS
   ========================================================= */

function setupGlobalClicks() {

    document.addEventListener(
        "click",
        event => {


            /* =============================================
               INLINE CLICK TO EDIT
               ============================================= */

            const inlineField =
                event.target.closest(
                    ".crm-inline-field"
                );

            if (
                inlineField &&
                !inlineField.classList.contains(
                    "editing"
                ) &&
                !inlineField.classList.contains(
                    "crm-inline-disabled"
                )
            ) {

                startInlineEdit(
                    inlineField
                );

                return;
            }


            /* =============================================
               VIEW DETAILS
               ============================================= */

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


            /* =============================================
               CLOSE LEAD MODAL
               ============================================= */

            const closeButton =
                event.target.closest(
                    "#closeLeadModal"
                );

            if (closeButton) {

                closeLeadModal();

                return;
            }


            /* =============================================
               CLOSE ADD MODAL
               ============================================= */

            const closeAdd =
                event.target.closest(
                    "#closeAddEnquiry"
                );

            if (closeAdd) {

                closeAddEnquiryModal();

                return;
            }


            /* =============================================
               CANCEL LEAD MODAL
               ============================================= */

            const cancelLead =
                event.target.closest(
                    "#cancelLeadEdit"
                );

            if (cancelLead) {

                closeLeadModal();

                return;
            }


            /* =============================================
               CANCEL ADD MODAL
               ============================================= */

            const cancelAdd =
                event.target.closest(
                    "#cancelAddEnquiry"
                );

            if (cancelAdd) {

                closeAddEnquiryModal();

                return;
            }


            /* =============================================
               SAVE LEAD MODAL
               ============================================= */

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


    /* =============================================
       LEAD MODAL BACKDROP
       ============================================= */

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


    /* =============================================
       ADD MODAL BACKDROP
       ============================================= */

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
   ADD FORM LISTENER
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

    const buttons =
        $all(
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

    if (!session) {
        return;
    }


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
   GLOBAL CRM API
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
