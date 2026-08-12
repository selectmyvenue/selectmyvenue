/* =========================================================
   SELECT MY VENUE — CRM
   FINAL CRM.JS
   Supabase + Employee CRM
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
        return null;
    }

    if (
        !CRM_SUPABASE_URL ||
        !CRM_SUPABASE_ANON_KEY
    ) {
        console.error("Supabase configuration missing.");
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

let databaseColumns = new Set();


/* =========================================================
   HELPERS
   ========================================================= */

function $(selector) {
    return document.querySelector(selector);
}


function safeValue(value) {
    if (value === null || value === undefined) {
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


function escapeAttribute(value) {
    return escapeHTML(value);
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "success") {

    let toast = document.getElementById("crmToast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "crmToast";

        toast.style.position = "fixed";
        toast.style.right = "24px";
        toast.style.bottom = "24px";
        toast.style.zIndex = "99999";
        toast.style.padding = "12px 18px";
        toast.style.borderRadius = "10px";
        toast.style.color = "#fff";
        toast.style.fontSize = "14px";
        toast.style.fontWeight = "600";
        toast.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.25)";
        toast.style.transition = "opacity .2s ease";

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.style.background =
        type === "error"
            ? "#b42318"
            : type === "warning"
                ? "#9a6700"
                : "#147d64";

    toast.style.opacity = "1";

    clearTimeout(window.crmToastTimer);

    window.crmToastTimer = setTimeout(() => {
        toast.style.opacity = "0";
    }, 2800);
}


/* =========================================================
   AUTH
   ========================================================= */

async function checkCRMAuth() {

    const client = getSupabaseClient();

    if (!client) {
        return null;
    }

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

        console.error(
            "Authentication error:",
            error
        );

        return null;
    }
}


function updateStaffName(user) {

    const element =
        document.getElementById("staffName");

    if (!element || !user) {
        return;
    }

    const metadata =
        user.user_metadata || {};

    element.textContent =
        metadata.full_name ||
        metadata.name ||
        metadata.display_name ||
        user.email ||
        "Employee";
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutCRM() {

    const client = getSupabaseClient();

    if (!client) {
        return;
    }

    try {

        const { error } =
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

        window.location.href = "login.html";

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

    const client = getSupabaseClient();

    if (!client) {
        return;
    }

    setTableLoading();

    try {

        const {
            data,
            error
        } = await client
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

        /*
          Remember the actual columns returned
          by Supabase.
        */

        databaseColumns.clear();

        if (allLeads.length) {

            Object.keys(
                allLeads[0]
            ).forEach(column => {
                databaseColumns.add(column);
            });
        }

        console.log(
            "CRM database columns:",
            Array.from(databaseColumns)
        );

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
            <td colspan="10" class="loading-cell">
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
            <td colspan="10" class="loading-cell">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


/* =========================================================
   DATABASE COLUMN DETECTION
   ========================================================= */

function findExistingColumn(
    lead,
    possibleColumns
) {

    for (const column of possibleColumns) {

        if (
            Object.prototype.hasOwnProperty.call(
                lead,
                column
            )
        ) {
            return column;
        }
    }

    return null;
}


/* =========================================================
   FIELD MAPPINGS
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
        ""
    );
}


function getEmail(lead) {

    return (
        lead.email ||
        lead.customer_email ||
        ""
    );
}


function getEventColumn(lead) {

    /*
      IMPORTANT:
      Do NOT assume event_type.

      Your Supabase table appears to use
      another column name.

      We detect the actual one.
    */

    return findExistingColumn(
        lead,
        [
            "event",
            "event_name",
            "event_type",
            "eventType",
            "eventname"
        ]
    );
}


function getEventValue(lead) {

    const column =
        getEventColumn(lead);

    if (!column) {
        return "";
    }

    return lead[column] || "";
}


function getVenueColumn(lead) {

    return findExistingColumn(
        lead,
        [
            "venue",
            "location",
            "city",
            "venue_name",
            "venue_location"
        ]
    );
}


function getVenueValue(lead) {

    const column =
        getVenueColumn(lead);

    return column
        ? lead[column] || ""
        : "";
}


function getEventDateColumn(lead) {

    return findExistingColumn(
        lead,
        [
            "event_date",
            "date",
            "eventDate"
        ]
    );
}


function getEventDateValue(lead) {

    const column =
        getEventDateColumn(lead);

    return column
        ? lead[column] || ""
        : "";
}


function getGuestsColumn(lead) {

    return findExistingColumn(
        lead,
        [
            "guests",
            "guest_count",
            "number_of_guests",
            "guestCount"
        ]
    );
}


function getGuestsValue(lead) {

    const column =
        getGuestsColumn(lead);

    return column
        ? lead[column] ?? ""
        : "";
}


function getStatusColumn(lead) {

    return findExistingColumn(
        lead,
        [
            "status"
        ]
    );
}


function getPriorityColumn(lead) {

    return findExistingColumn(
        lead,
        [
            "priority"
        ]
    );
}


function getFollowUpColumn(lead) {

    return findExistingColumn(
        lead,
        [
            "follow_up_at",
            "followup_at",
            "follow_up",
            "followup"
        ]
    );
}


function getAssignedColumn(lead) {

    return findExistingColumn(
        lead,
        [
            "assigned_to",
            "assigned",
            "assignedTo"
        ]
    );
}


function getRemarksColumn(lead) {

    return findExistingColumn(
        lead,
        [
            "remarks",
            "internal_notes",
            "notes",
            "internal_remarks"
        ]
    );
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
        allLeads.filter(lead => {

            const searchable = [

                getCustomerName(lead),
                getPhone(lead),
                getEmail(lead),
                getEventValue(lead),
                getVenueValue(lead),
                getEventDateValue(lead),
                getGuestsValue(lead),
                lead.message,
                lead.status,
                lead.priority

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
                status === currentStatusFilter;

            const matchesPriority =
                currentPriorityFilter === "all" ||
                priority === currentPriorityFilter;

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
        document.getElementById(
            "leadsTableBody"
        );

    if (!tbody) {
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
                            Try changing your search or filters.
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
   LEAD ROW
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

    const event =
        getEventValue(lead);

    const eventDate =
        getEventDateValue(lead);

    const guests =
        getGuestsValue(lead);

    const venue =
        getVenueValue(lead);

    const status =
        lead.status || "new";

    const priority =
        lead.priority || "normal";

    return `
        <tr data-lead-id="${escapeAttribute(id)}">

            <!-- CUSTOMER : NOT EDITABLE -->
            <td>
                <strong>
                    ${escapeHTML(name)}
                </strong>
            </td>

            <!-- PHONE : NOT EDITABLE -->
            <td>
                ${escapeHTML(phone || "—")}
            </td>

            <!-- EMAIL : EDITABLE -->
            <td>
                ${createInlineField(
                    lead,
                    "email",
                    email,
                    "text",
                    {
                        column: findExistingColumn(
                            lead,
                            [
                                "email",
                                "customer_email"
                            ]
                        )
                    }
                )}
            </td>

            <!-- EVENT : EDITABLE -->
            <td>
                ${createInlineField(
                    lead,
                    "event",
                    event,
                    "select",
                    {
                        column:
                            getEventColumn(lead),
                        options:
                            getEventOptions()
                    }
                )}
            </td>

            <!-- EVENT DATE : EDITABLE -->
            <td>
                ${createInlineField(
                    lead,
                    "event_date",
                    formatDate(eventDate),
                    "date",
                    {
                        column:
                            getEventDateColumn(lead),
                        rawValue:
                            eventDate
                    }
                )}
            </td>

            <!-- GUESTS : EDITABLE -->
            <td>
                ${createInlineField(
                    lead,
                    "guests",
                    guests,
                    "number",
                    {
                        column:
                            getGuestsColumn(lead)
                    }
                )}
            </td>

            <!-- LOCATION : EDITABLE -->
            <td>
                ${createInlineField(
                    lead,
                    "location",
                    venue,
                    "text",
                    {
                        column:
                            getVenueColumn(lead)
                    }
                )}
            </td>

            <!-- STATUS : EDITABLE -->
            <td>
                ${createInlineField(
                    lead,
                    "status",
                    formatStatus(status),
                    "select",
                    {
                        column:
                            getStatusColumn(lead),
                        options:
                            getStatusOptions()
                    }
                )}
            </td>

            <!-- PRIORITY : EDITABLE -->
            <td>
                ${createInlineField(
                    lead,
                    "priority",
                    formatPriority(priority),
                    "select",
                    {
                        column:
                            getPriorityColumn(lead),
                        options:
                            getPriorityOptions()
                    }
                )}
            </td>

            <!-- ACTION -->
            <td class="action-column">

                <button
                    type="button"
                    class="view-lead-btn"
                    data-action="view"
                    data-id="${escapeAttribute(id)}"
                >
                    View Details
                </button>

            </td>

        </tr>
    `;
}


/* =========================================================
   INLINE FIELD
   NO PENCIL SHOWN
   ========================================================= */

function createInlineField(
    lead,
    logicalField,
    displayValue,
    type,
    config = {}
) {

    const id =
        safeValue(lead.id);

    const column =
        config.column;

    /*
      If a database column does not exist,
      don't make the field editable.
    */

    const editable =
        !!column;

    const shown =
        displayValue === null ||
        displayValue === undefined ||
        displayValue === ""
            ? "—"
            : displayValue;

    return `
        <div
            class="crm-inline-field${editable ? "" : " not-editable"}"
            data-inline-field="${escapeAttribute(logicalField)}"
            data-db-column="${escapeAttribute(column || "")}"
            data-lead-id="${escapeAttribute(id)}"
            data-editable="${editable ? "true" : "false"}"
            tabindex="${editable ? "0" : "-1"}"
            title="${editable ? "Click to edit" : ""}"
        >
            <span class="inline-display">
                ${escapeHTML(shown)}
            </span>
        </div>
    `;
}


/* =========================================================
   INLINE EDIT
   ========================================================= */

function startInlineEdit(element) {

    if (!element) {
        return;
    }

    if (
        element.dataset.editable !== "true"
    ) {
        return;
    }

    if (
        element.classList.contains("editing")
    ) {
        return;
    }

    const leadId =
        element.dataset.leadId;

    const logicalField =
        element.dataset.inlineField;

    const dbColumn =
        element.dataset.dbColumn;

    if (!dbColumn) {

        showToast(
            "This field is not available in the database.",
            "error"
        );

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

    const originalValue =
        lead[dbColumn] ?? "";

    /*
      Remember page position.
      This prevents the annoying page jumping.
    */

    const scrollX =
        window.scrollX;

    const scrollY =
        window.scrollY;

    element.classList.add("editing");

    const display =
        element.querySelector(
            ".inline-display"
        );

    if (!display) {
        return;
    }

    let editor;

    if (logicalField === "event") {

        editor =
            createSelectEditor(
                getEventOptions(),
                originalValue
            );

    } else if (logicalField === "status") {

        editor =
            createSelectEditor(
                getStatusOptions(),
                originalValue || "new"
            );

    } else if (logicalField === "priority") {

        editor =
            createSelectEditor(
                getPriorityOptions(),
                originalValue || "normal"
            );

    } else {

        editor =
            document.createElement(
                "input"
            );

        editor.className =
            "crm-inline-editor";

        if (
            logicalField === "event_date"
        ) {
            editor.type = "date";

        } else if (
            logicalField === "guests"
        ) {
            editor.type = "number";
            editor.min = "0";

        } else {
            editor.type = "text";
        }

        editor.value =
            safeValue(originalValue);

        editor.style.width = "100%";
        editor.style.boxSizing =
            "border-box";
    }

    display.replaceWith(editor);

    /*
      Restore scroll position immediately.
    */

    window.scrollTo(
        scrollX,
        scrollY
    );

    setTimeout(() => {

        try {
            editor.focus();
        } catch (e) {}

        window.scrollTo(
            scrollX,
            scrollY
        );

    }, 0);

    let completed = false;

    async function finish(
        shouldSave = true
    ) {

        if (completed) {
            return;
        }

        completed = true;

        if (!shouldSave) {

            restoreInlineDisplay(
                element,
                lead,
                logicalField,
                dbColumn
            );

            window.scrollTo(
                scrollX,
                scrollY
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
                logicalField,
                dbColumn
            );

            window.scrollTo(
                scrollX,
                scrollY
            );

            return;
        }

        await saveInlineField(
            lead,
            dbColumn,
            newValue,
            element
        );

        window.scrollTo(
            scrollX,
            scrollY
        );
    }

    editor.addEventListener(
        "blur",
        () => {

            setTimeout(
                () => finish(true),
                150
            );
        }
    );

    editor.addEventListener(
        "keydown",
        event => {

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

    select.style.width = "100%";
    select.style.boxSizing =
        "border-box";

    options.forEach(option => {

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

        select.appendChild(item);
    });

    return select;
}


/* =========================================================
   SAVE INLINE FIELD
   ========================================================= */

async function saveInlineField(
    lead,
    dbColumn,
    newValue,
    element
) {

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }

    const oldValue =
        lead[dbColumn];

    const updateData = {};

    updateData[dbColumn] =
        newValue === ""
            ? null
            : newValue;

    try {

        const {
            data,
            error
        } = await client
            .from("customer_enquiries")
            .update(updateData)
            .eq("id", lead.id)
            .select()
            .single();

        if (error) {

            console.error(
                "Inline save error:",
                error
            );

            /*
              Specifically handle schema cache
              problem.
            */

            if (
                error.message &&
                error.message
                    .toLowerCase()
                    .includes(
                        "schema cache"
                    )
            ) {

                showToast(
                    `Database column "${dbColumn}" is not available.`,
                    "error"
                );

            } else {

                showToast(
                    error.message ||
                    "Unable to save change.",
                    "error"
                );
            }

            lead[dbColumn] =
                oldValue;

            restoreInlineDisplay(
                element,
                lead,
                null,
                dbColumn
            );

            return;
        }

        if (data) {

            Object.assign(
                lead,
                data
            );
        } else {

            lead[dbColumn] =
                updateData[dbColumn];
        }

        showToast(
            "Change saved successfully."
        );

        restoreInlineDisplay(
            element,
            lead,
            null,
            dbColumn
        );

        updateStats();

    } catch (error) {

        console.error(error);

        lead[dbColumn] =
            oldValue;

        restoreInlineDisplay(
            element,
            lead,
            null,
            dbColumn
        );

        showToast(
            "Unable to save change.",
            "error"
        );
    }
}


/* =========================================================
   RESTORE INLINE FIELD
   ========================================================= */

function restoreInlineDisplay(
    element,
    lead,
    logicalField,
    dbColumn
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

    let value =
        dbColumn
            ? lead[dbColumn]
            : "";

    if (
        logicalField === "status" ||
        dbColumn === "status"
    ) {

        value =
            formatStatus(value);

    } else if (
        logicalField === "priority" ||
        dbColumn === "priority"
    ) {

        value =
            formatPriority(value);

    } else if (
        logicalField === "event_date" ||
        dbColumn === "event_date" ||
        dbColumn === "date"
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

    editor.replaceWith(display);

    element.classList.remove(
        "editing"
    );
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

    currentLead = lead;

    populateLeadModal(lead);

    const modal =
        document.getElementById(
            "leadModal"
        );

    if (!modal) {

        showToast(
            "Lead modal not found.",
            "error"
        );

        return;
    }

    modal.hidden = false;

    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   POPULATE MODAL
   ========================================================= */

function populateLeadModal(lead) {

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
        lead.source ||
        lead.lead_source ||
        "—"
    );

    setControl(
        "detailEventType",
        getEventValue(lead)
    );

    setControl(
        "detailVenue",
        getVenueValue(lead)
    );

    setControl(
        "detailEventDate",
        getEventDateValue(lead)
    );

    setControl(
        "detailGuests",
        getGuestsValue(lead)
    );

    setControl(
        "detailStatus",
        lead.status || "new"
    );

    setControl(
        "detailPriority",
        lead.priority || "normal"
    );

    setControl(
        "detailFollowUp",
        getFollowUpColumn(lead)
            ? lead[
                getFollowUpColumn(lead)
            ] || ""
            : ""
    );

    setControl(
        "detailAssignedTo",
        getAssignedColumn(lead)
            ? lead[
                getAssignedColumn(lead)
            ] || ""
            : ""
    );

    setText(
        "detailMessage",
        lead.message ||
        lead.enquiry ||
        lead.requirements ||
        "No customer message."
    );

    setControl(
        "detailRemarks",
        getRemarksColumn(lead)
            ? lead[
                getRemarksColumn(lead)
            ] || ""
            : ""
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
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        safeValue(value) || "—";
}


function setControl(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.value =
        safeValue(value);
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

    /*
      EVENT
    */

    const eventColumn =
        getEventColumn(lead);

    if (eventColumn) {

        updateData[eventColumn] =
            $("#detailEventType")?.value ||
            null;
    }

    /*
      VENUE / LOCATION
    */

    const venueColumn =
        getVenueColumn(lead);

    if (venueColumn) {

        updateData[venueColumn] =
            $("#detailVenue")?.value ||
            null;
    }

    /*
      EVENT DATE
    */

    const dateColumn =
        getEventDateColumn(lead);

    if (dateColumn) {

        updateData[dateColumn] =
            $("#detailEventDate")?.value ||
            null;
    }

    /*
      GUESTS
    */

    const guestsColumn =
        getGuestsColumn(lead);

    if (guestsColumn) {

        const value =
            $("#detailGuests")?.value;

        updateData[guestsColumn] =
            value === ""
                ? null
                : Number(value);
    }

    /*
      STATUS
    */

    const statusColumn =
        getStatusColumn(lead);

    if (statusColumn) {

        updateData[statusColumn] =
            $("#detailStatus")?.value ||
            "new";
    }

    /*
      PRIORITY
    */

    const priorityColumn =
        getPriorityColumn(lead);

    if (priorityColumn) {

        updateData[priorityColumn] =
            $("#detailPriority")?.value ||
            "normal";
    }

    /*
      FOLLOW UP
    */

    const followColumn =
        getFollowUpColumn(lead);

    if (followColumn) {

        updateData[followColumn] =
            $("#detailFollowUp")?.value ||
            null;
    }

    /*
      ASSIGNED TO
    */

    const assignedColumn =
        getAssignedColumn(lead);

    if (assignedColumn) {

        updateData[assignedColumn] =
            $("#detailAssignedTo")?.value ||
            null;
    }

    /*
      REMARKS
    */

    const remarksColumn =
        getRemarksColumn(lead);

    if (remarksColumn) {

        updateData[remarksColumn] =
            $("#detailRemarks")?.value ||
            null;
    }

    if (!Object.keys(updateData).length) {

        showToast(
            "No editable database fields found.",
            "error"
        );

        return;
    }

    const saveButton =
        document.getElementById(
            "saveLeadBtn"
        );

    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "Saving...";
    }

    try {

        const {
            data,
            error
        } = await client
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

        if (data) {

            Object.assign(
                lead,
                data
            );
        } else {

            Object.assign(
                lead,
                updateData
            );
        }

        /*
          Update main array too.
        */

        const index =
            allLeads.findIndex(
                item =>
                    String(item.id) ===
                    String(lead.id)
            );

        if (index !== -1) {

            Object.assign(
                allLeads[index],
                lead
            );

            currentLead =
                allLeads[index];
        }

        showModalMessage(
            "Changes saved successfully.",
            false
        );

        showToast(
            "Changes saved successfully."
        );

        updateStats();

        /*
          Refresh table while preserving
          current page position.
        */

        const scrollX =
            window.scrollX;

        const scrollY =
            window.scrollY;

        applyFilters();

        requestAnimationFrame(() => {

            window.scrollTo(
                scrollX,
                scrollY
            );
        });

    } catch (error) {

        console.error(
            "Modal save exception:",
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

            saveButton.disabled = false;

            saveButton.textContent =
                "Save Changes";
        }
    }
}


/* =========================================================
   MODAL MESSAGE
   ========================================================= */

function showModalMessage(
    message,
    isError
) {

    const element =
        document.getElementById(
            "leadModalMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.style.color =
        isError
            ? "#ff6b6b"
            : "#36d399";
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

    modal.hidden = true;

    document.body.style.overflow =
        "";

    currentLead = null;
}


/* =========================================================
   ADD ENQUIRY
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
        message.textContent = "";
    }
}


function closeAddEnquiryModal() {

    const modal =
        document.getElementById(
            "addEnquiryModal"
        );

    if (!modal) {
        return;
    }

    modal.hidden = true;

    document.body.style.overflow =
        "";
}


/* =========================================================
   ADD ENQUIRY SUBMIT
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

    formData.forEach(
        (value, key) => {

            data[key] =
                typeof value === "string"
                    ? value.trim()
                    : value;
        }
    );

    if (!data.status) {
        data.status = "new";
    }

    if (!data.priority) {
        data.priority = "normal";
    }

    const button =
        document.getElementById(
            "submitEnquiryBtn"
        );

    if (button) {

        button.disabled = true;

        button.textContent =
            "Adding...";
    }

    try {

        const {
            data: created,
            error
        } = await client
            .from("customer_enquiries")
            .insert([data])
            .select()
            .single();

        if (error) {

            console.error(
                "Create enquiry error:",
                error
            );

            showToast(
                error.message ||
                "Unable to add enquiry.",
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
            "Unable to add enquiry.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
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
                String(
                    lead.status || "new"
                ).toLowerCase() === "new"
        ).length;

    const contactedCount =
        allLeads.filter(
            lead =>
                String(
                    lead.status || ""
                ).toLowerCase() ===
                "contacted"
        ).length;

    const closedCount =
        allLeads.filter(
            lead => {

                const status =
                    String(
                        lead.status || ""
                    ).toLowerCase();

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
                    status.value || "all";

                applyFilters();
            }
        );
    }

    if (priority) {

        priority.addEventListener(
            "change",
            () => {

                currentPriorityFilter =
                    priority.value || "all";

                applyFilters();
            }
        );
    }
}


/* =========================================================
   STAT FILTERS
   ========================================================= */

function setupStatFilters() {

    document
        .querySelectorAll(
            ".stat-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".stat-card"
                        )
                        .forEach(item =>
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

                    const status =
                        document.getElementById(
                            "statusFilter"
                        );

                    if (status) {
                        status.value =
                            currentStatusFilter;
                    }

                    applyFilters();
                }
            );
        });
}


/* =========================================================
   REFRESH
   ========================================================= */

function setupRefresh() {

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

            const oldText =
                button.innerHTML;

            button.disabled = true;

            button.textContent =
                "Refreshing...";

            await loadEnquiries();

            button.disabled = false;

            button.innerHTML =
                oldText;
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

            /*
              INLINE EDIT
            */

            const inline =
                event.target.closest(
                    ".crm-inline-field"
                );

            if (
                inline &&
                inline.dataset.editable ===
                "true" &&
                !inline.classList.contains(
                    "editing"
                )
            ) {

                event.preventDefault();

                startInlineEdit(
                    inline
                );

                return;
            }


            /*
              VIEW DETAILS
            */

            const view =
                event.target.closest(
                    "[data-action='view']"
                );

            if (view) {

                event.preventDefault();

                openLeadModal(
                    view.dataset.id
                );

                return;
            }


            /*
              CLOSE LEAD MODAL
            */

            if (
                event.target.closest(
                    "#closeLeadModal"
                )
            ) {

                closeLeadModal();

                return;
            }


            /*
              CANCEL LEAD MODAL
            */

            if (
                event.target.closest(
                    "#cancelLeadEdit"
                )
            ) {

                closeLeadModal();

                return;
            }


            /*
              CLOSE ADD MODAL
            */

            if (
                event.target.closest(
                    "#closeAddEnquiry"
                )
            ) {

                closeAddEnquiryModal();

                return;
            }


            /*
              CANCEL ADD
            */

            if (
                event.target.closest(
                    "#cancelAddEnquiry"
                )
            ) {

                closeAddEnquiryModal();

                return;
            }


            /*
              SAVE MODAL
            */

            if (
                event.target.closest(
                    "#saveLeadBtn"
                )
            ) {

                event.preventDefault();

                saveModalChanges();

                return;
            }
        }
    );


    /*
      Lead modal backdrop
    */

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


    /*
      Add modal backdrop
    */

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
   KEYBOARD
   ========================================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
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
   AUTH LISTENER
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
   FORMATTING
   ========================================================= */

function formatStatus(
    value
) {

    if (!value) {
        return "New";
    }

    return String(value)
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

    return String(value)
        .replace(/[-_]/g, " ")
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

    /*
      Date-only values should not be
      shifted by timezone.
    */

    const stringValue =
        String(value);

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            stringValue
        )
    ) {

        const parts =
            stringValue.split("-");

        return `${parts[2]} ${getMonthName(
            Number(parts[1])
        )} ${parts[0]}`;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return stringValue;
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


function getMonthName(
    month
) {

    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    return (
        months[month - 1] ||
        ""
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
        "Select My Venue CRM starting..."
    );

    const session =
        await checkCRMAuth();

    if (!session) {
        return;
    }

    setupSearch();
    setupFilters();
    setupStatFilters();
    setupRefresh();
    setupAddButton();
    setupGlobalClicks();
    setupAddForm();
    setupLogout();
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
