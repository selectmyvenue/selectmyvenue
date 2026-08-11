```javascript
/* =========================================================
   SELECT MY VENUE — CRM
   crm.js
   COMPLETE REPLACEMENT
   VERSION 2 — STABLE CRM
   =========================================================

   FEATURES
   ---------------------------------------------------------
   ✓ Supabase authentication
   ✓ Customer enquiries loading
   ✓ Phone number
   ✓ Email
   ✓ Lead source
   ✓ Event type
   ✓ Venue
   ✓ Event date
   ✓ Guests
   ✓ Location
   ✓ Status
   ✓ Priority
   ✓ Follow-up
   ✓ Assigned employee
   ✓ Customer message
   ✓ Internal remarks
   ✓ View Details modal
   ✓ Inline editing
   ✓ Dropdown editing
   ✓ Automatic save
   ✓ Modal save
   ✓ Add enquiry
   ✓ Search
   ✓ Filters
   ✓ Dashboard statistics
   ✓ WhatsApp / Call / Email
   ========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
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

    try {

        supabaseClient =
            window.supabase.createClient(
                CRM_SUPABASE_URL,
                CRM_SUPABASE_ANON_KEY
            );

        return supabaseClient;

    } catch (error) {

        console.error(
            "Supabase client creation failed:",
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

        toast.style.position =
            "fixed";

        toast.style.right =
            "24px";

        toast.style.bottom =
            "24px";

        toast.style.zIndex =
            "99999";

        toast.style.padding =
            "13px 18px";

        toast.style.borderRadius =
            "12px";

        toast.style.color =
            "#ffffff";

        toast.style.fontSize =
            "14px";

        toast.style.fontWeight =
            "600";

        toast.style.boxShadow =
            "0 15px 40px rgba(0,0,0,.30)";

        toast.style.opacity =
            "0";

        toast.style.transform =
            "translateY(10px)";

        toast.style.transition =
            "all .22s ease";

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
            "#087f73";
    }

    toast.textContent =
        message;

    clearTimeout(toastTimer);

    requestAnimationFrame(() => {

        toast.style.opacity =
            "1";

        toast.style.transform =
            "translateY(0)";
    });

    toastTimer =
        setTimeout(() => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateY(10px)";

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
                "Authentication error:",
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
            "Authentication failed:",
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
        "CRM User";

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

        console.error(error);

        showToast(
            "Unable to logout.",
            "error"
        );
    }
}


/* =========================================================
   FIND LEAD
   ========================================================= */

function findLead(leadId) {

    return allLeads.find(
        lead =>
            String(lead.id) ===
            String(leadId)
    );
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
            "Loading enquiries failed:",
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

function getTableBody() {

    return (
        document.querySelector(
            "#leadsTableBody"
        ) ||
        document.querySelector(
            ".leads-table tbody"
        ) ||
        document.querySelector(
            "tbody"
        )
    );
}

function setTableLoading() {

    const tbody =
        getTableBody();

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td
                colspan="20"
                class="loading-cell"
            >
                Loading customer enquiries...
            </td>
        </tr>
    `;
}

function renderTableError(message) {

    const tbody =
        getTableBody();

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td
                colspan="20"
                class="loading-cell"
            >
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


/* =========================================================
   NORMALIZE LEAD DATA
   Handles different existing column names.
   ========================================================= */

function normalizeLead(lead) {

    return {

        ...lead,

        customer_name:
            lead.customer_name ||
            lead.name ||
            "",

        phone:
            lead.phone ||
            lead.mobile ||
            lead.contact_number ||
            "",

        email:
            lead.email ||
            "",

        lead_source:
            lead.lead_source ||
            lead.source ||
            "",

        event_type:
            lead.event_type ||
            lead.event ||
            "",

        venue:
            lead.venue ||
            lead.venue_name ||
            "",

        event_date:
            lead.event_date ||
            lead.date ||
            "",

        guests:
            lead.guests ??
            lead.guest_count ??
            lead.number_of_guests ??
            "",

        location:
            lead.location ||
            lead.city ||
            "",

        status:
            lead.status ||
            "new",

        priority:
            lead.priority ||
            "normal",

        follow_up_at:
            lead.follow_up_at ||
            lead.followup_at ||
            "",

        assigned_to:
            lead.assigned_to ||
            lead.assigned_employee ||
            lead.employee ||
            "",

        message:
            lead.message ||
            lead.enquiry ||
            lead.requirements ||
            "",

        internal_notes:
            lead.internal_notes ||
            lead.notes ||
            lead.remarks ||
            ""
    };
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
            originalLead => {

                const lead =
                    normalizeLead(
                        originalLead
                    );

                const searchableText = [

                    lead.customer_name,
                    lead.phone,
                    lead.email,
                    lead.lead_source,
                    lead.event_type,
                    lead.venue,
                    lead.location,
                    lead.assigned_to,
                    lead.message

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );

                const status =
                    safeValue(
                        lead.status
                    ).toLowerCase();

                const priority =
                    safeValue(
                        lead.priority
                    ).toLowerCase();

                let matchesStatus =
                    true;

                let matchesPriority =
                    true;

                if (
                    currentStatusFilter !==
                    "all"
                ) {

                    if (
                        currentStatusFilter ===
                        "converted"
                    ) {

                        matchesStatus =
                            [
                                "converted",
                                "closed",
                                "booked"
                            ].includes(
                                status
                            );

                    } else {

                        matchesStatus =
                            status ===
                            currentStatusFilter;
                    }
                }

                if (
                    currentPriorityFilter !==
                    "all"
                ) {

                    matchesPriority =
                        priority ===
                        currentPriorityFilter;
                }

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
        getTableBody();

    if (!tbody) {

        console.warn(
            "CRM table body not found."
        );

        return;
    }

    if (!filteredLeads.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="20">
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
            .map(createLeadRow)
            .join("");
}


/* =========================================================
   CREATE LEAD ROW
   ========================================================= */

function createLeadRow(originalLead) {

    const lead =
        normalizeLead(
            originalLead
        );

    const id =
        safeValue(
            lead.id
        );

    return `
        <tr
            data-lead-id="${escapeHTML(id)}"
        >

            <!-- CUSTOMER -->
            <td class="customer-cell">

                <div class="customer-main">

                    <strong>
                        ${escapeHTML(
                            lead.customer_name ||
                            "Unknown Customer"
                        )}
                    </strong>

                    ${
                        lead.phone
                            ? `
                                <a
                                    class="customer-phone"
                                    href="tel:${escapeHTML(
                                        lead.phone
                                    )}"
                                    onclick="event.stopPropagation()"
                                >
                                    ${escapeHTML(
                                        lead.phone
                                    )}
                                </a>
                              `
                            : `
                                <span class="customer-phone muted">
                                    No phone
                                </span>
                              `
                    }

                </div>

            </td>


            <!-- EMAIL -->
            <td>
                ${createInlineField(
                    originalLead,
                    "email",
                    lead.email ||
                    "—",
                    "text"
                )}
            </td>


            <!-- EVENT -->
            <td>
                ${createInlineField(
                    originalLead,
                    "event_type",
                    lead.event_type ||
                    "—",
                    "select",
                    getEventOptions()
                )}
            </td>


            <!-- EVENT DATE -->
            <td>
                ${createInlineField(
                    originalLead,
                    "event_date",
                    lead.event_date
                        ? formatDate(
                            lead.event_date
                        )
                        : "—",
                    "date",
                    null,
                    lead.event_date
                )}
            </td>


            <!-- GUESTS -->
            <td>
                ${createInlineField(
                    originalLead,
                    "guests",
                    lead.guests ||
                    "—",
                    "number"
                )}
            </td>


            <!-- LOCATION -->
            <td>
                ${createInlineField(
                    originalLead,
                    "location",
                    lead.location ||
                    "—",
                    "text"
                )}
            </td>


            <!-- STATUS -->
            <td>
                ${createInlineField(
                    originalLead,
                    "status",
                    formatStatus(
                        lead.status
                    ),
                    "select",
                    getStatusOptions()
                )}
            </td>


            <!-- PRIORITY -->
            <td>
                ${createInlineField(
                    originalLead,
                    "priority",
                    formatPriority(
                        lead.priority
                    ),
                    "select",
                    getPriorityOptions()
                )}
            </td>


            <!-- ACTION -->
            <td class="action-cell">

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
   Pencil is hidden until hover.
   ========================================================= */

function createInlineField(
    lead,
    field,
    displayValue,
    type = "text",
    options = null,
    rawValue = null
) {

    const id =
        safeValue(
            lead.id
        );

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
            data-value="${escapeHTML(
                safeValue(value)
            )}"
            tabindex="0"
            title="Click to edit"
        >

            <span class="inline-display">
                ${escapeHTML(
                    shownValue
                )}
            </span>

            <span
                class="inline-edit-icon"
                aria-hidden="true"
            >
                ✎
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

    const leadId =
        element.dataset.leadId;

    const originalLead =
        findLead(
            leadId
        );

    if (!originalLead) {

        showToast(
            "Enquiry not found.",
            "error"
        );

        return;
    }

    const lead =
        normalizeLead(
            originalLead
        );

    const originalValue =
        lead[field] ?? "";

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


    /* SELECT */
    if (
        field === "status" ||
        field === "priority" ||
        field === "event_type"
    ) {

        let options =
            getStatusOptions();

        if (
            field ===
            "priority"
        ) {
            options =
                getPriorityOptions();
        }

        if (
            field ===
            "event_type"
        ) {
            options =
                getEventOptions();
        }

        editor =
            createSelectEditor(
                options,
                originalValue
            );

    }

    /* INPUT */
    else {

        editor =
            document.createElement(
                "input"
            );

        editor.className =
            "crm-inline-editor";

        if (
            field ===
            "event_date"
        ) {

            editor.type =
                "date";

            editor.value =
                normalizeDateInput(
                    originalValue
                );

        } else if (
            field ===
            "guests"
        ) {

            editor.type =
                "number";

            editor.min =
                "0";

            editor.value =
                safeValue(
                    originalValue
                );

        } else {

            editor.type =
                "text";

            editor.value =
                safeValue(
                    originalValue
                );
        }
    }

    display.replaceWith(
        editor
    );

    const icon =
        element.querySelector(
            ".inline-edit-icon"
        );

    if (icon) {
        icon.textContent =
            "✓";
    }

    editor.focus();

    if (
        editor.tagName ===
        "INPUT" &&
        editor.type !==
        "date" &&
        editor.type !==
        "number"
    ) {
        editor.select();
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
                    field,
                    newValue
                );

                return;
            }
        }

        restoreInlineDisplay(
            element,
            originalLead,
            field
        );
    }


    editor.addEventListener(
        "blur",
        () => {

            setTimeout(
                () => {
                    finish(true);
                },
                150
            );
        }
    );


    editor.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                editor.blur();
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

    const originalLead =
        findLead(
            leadId
        );

    if (!originalLead) {

        showToast(
            "Enquiry not found.",
            "error"
        );

        return;
    }

    const normalized =
        normalizeLead(
            originalLead
        );

    const oldValue =
        normalized[field] ?? "";

    let databaseField =
        field;

    let value =
        newValue;


    /* Empty values */
    if (
        value ===
        ""
    ) {
        value =
            null;
    }


    /* Make sure guests is numeric */
    if (
        field ===
        "guests" &&
        value !== null
    ) {

        value =
            Number(value);

        if (
            Number.isNaN(value)
        ) {
            value =
                null;
        }
    }


    const updateData = {};

    updateData[
        databaseField
    ] =
        value;


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

            originalLead[
                field
            ] =
                oldValue;

            refreshLeadRow(
                leadId
            );

            return;
        }


        /*
          Update local object with
          returned Supabase record.
        */

        if (data) {

            Object.assign(
                originalLead,
                data
            );

        } else {

            originalLead[
                databaseField
            ] =
                value;
        }


        refreshLeadRow(
            leadId
        );

        updateStats();

        if (
            currentLead &&
            String(
                currentLead.id
            ) ===
            String(leadId)
        ) {

            currentLead =
                originalLead;

            populateLeadModal(
                currentLead
            );
        }

        showToast(
            "Updated successfully."
        );

    } catch (error) {

        console.error(
            error
        );

        showToast(
            "Unable to save this change.",
            "error"
        );

        originalLead[
            field
        ] =
            oldValue;

        refreshLeadRow(
            leadId
        );
    }
}


/* =========================================================
   RESTORE INLINE DISPLAY
   ========================================================= */

function restoreInlineDisplay(
    element,
    originalLead,
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

    const lead =
        normalizeLead(
            originalLead
        );

    let value =
        lead[field];


    if (
        field ===
        "status"
    ) {

        value =
            formatStatus(
                value
            );

    } else if (
        field ===
        "priority"
    ) {

        value =
            formatPriority(
                value
            );

    } else if (
        field ===
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

    const icon =
        element.querySelector(
            ".inline-edit-icon"
        );

    if (icon) {
        icon.textContent =
            "✎";
    }
}


/* =========================================================
   REFRESH LEAD ROW
   ========================================================= */

function refreshLeadRow(
    leadId
) {

    const lead =
        findLead(
            leadId
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
                String(
                    leadId
                )
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
   OPEN LEAD MODAL
   ========================================================= */

function openLeadModal(
    leadId
) {

    const lead =
        findLead(
            leadId
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

    modal.classList.add(
        "show"
    );

    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   POPULATE MODAL
   ========================================================= */

function populateLeadModal(
    originalLead
) {

    const lead =
        normalizeLead(
            originalLead
        );


    /* CUSTOMER */
    setModalText(
        [
            "#modalLeadName",
            "#leadName",
            "[data-modal='name']"
        ],
        lead.customer_name ||
        "Customer"
    );


    /* PHONE */
    setModalText(
        [
            "#modalPhone",
            "#leadPhone",
            "[data-modal='phone']"
        ],
        lead.phone ||
        "—"
    );


    /* EMAIL */
    setModalText(
        [
            "#modalEmail",
            "#leadEmail",
            "[data-modal='email']"
        ],
        lead.email ||
        "—"
    );


    /* LEAD SOURCE */
    setModalText(
        [
            "#modalLeadSource",
            "#leadSource",
            "[data-modal='lead_source']"
        ],
        lead.lead_source ||
        "—"
    );


    /* EVENT */
    setModalControl(
        [
            "#modalEventType",
            "#leadEventType",
            "[data-control='event_type']"
        ],
        lead.event_type
    );


    /* VENUE */
    setModalControl(
        [
            "#modalVenue",
            "#leadVenue",
            "[data-control='venue']"
        ],
        lead.venue
    );


    /* DATE */
    setModalControl(
        [
            "#modalEventDate",
            "#leadEventDate",
            "[data-control='event_date']"
        ],
        normalizeDateInput(
            lead.event_date
        )
    );


    /* GUESTS */
    setModalControl(
        [
            "#modalGuests",
            "#leadGuests",
            "[data-control='guests']"
        ],
        lead.guests
    );


    /* LOCATION */
    setModalText(
        [
            "#modalLocation",
            "#leadLocation",
            "[data-modal='location']"
        ],
        lead.location ||
        "—"
    );


    /* STATUS */
    setModalControl(
        [
            "#modalStatus",
            "#leadStatus",
            "[data-control='status']"
        ],
        lead.status ||
        "new"
    );


    /* PRIORITY */
    setModalControl(
        [
            "#modalPriority",
            "#leadPriority",
            "[data-control='priority']"
        ],
        lead.priority ||
        "normal"
    );


    /* FOLLOW UP */
    setModalControl(
        [
            "#modalFollowUp",
            "#leadFollowUp",
            "[data-control='follow_up_at']"
        ],
        normalizeDateTimeLocal(
            lead.follow_up_at
        )
    );


    /* ASSIGNED TO */
    setModalControl(
        [
            "#modalAssignedTo",
            "#leadAssignedTo",
            "[data-control='assigned_to']"
        ],
        lead.assigned_to
    );


    /* MESSAGE */
    setModalText(
        [
            "#modalMessage",
            "#leadMessage",
            "#detailMessage",
            "[data-modal='message']"
        ],
        lead.message ||
        "No customer message."
    );


    /* INTERNAL NOTES */
    setModalControl(
        [
            "#modalNotes",
            "#leadNotes",
            "#modalInternalNotes",
            "[data-control='internal_notes']"
        ],
        lead.internal_notes
    );


    /* CREATED */
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


    setupContactActions(
        lead
    );
}


/* =========================================================
   MODAL TEXT
   ========================================================= */

function setModalText(
    selectors,
    value
) {

    for (
        const selector
        of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );

        if (element) {

            element.textContent =
                safeValue(
                    value
                ) ||
                "—";

            return;
        }
    }
}


/* =========================================================
   MODAL CONTROL
   ========================================================= */

function setModalControl(
    selectors,
    value
) {

    for (
        const selector
        of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );

        if (!element) {
            continue;
        }

        if (
            element.tagName ===
                "INPUT" ||
            element.tagName ===
                "SELECT" ||
            element.tagName ===
                "TEXTAREA"
        ) {

            element.value =
                safeValue(
                    value
                );
        }

        return;
    }
}


/* =========================================================
   CURRENT MODAL
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

    modal.classList.remove(
        "show"
    );

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


    const leadId =
        currentLead.id;

    const updateData =
        {};


    /* STATUS */
    const status =
        getControlValue(
            [
                "#modalStatus",
                "#leadStatus",
                "[data-control='status']"
            ]
        );

    if (
        status !==
        undefined
    ) {

        updateData.status =
            status ||
            "new";
    }


    /* PRIORITY */
    const priority =
        getControlValue(
            [
                "#modalPriority",
                "#leadPriority",
                "[data-control='priority']"
            ]
        );

    if (
        priority !==
        undefined
    ) {

        updateData.priority =
            priority ||
            "normal";
    }


    /* EVENT */
    const eventType =
        getControlValue(
            [
                "#modalEventType",
                "#leadEventType",
                "[data-control='event_type']"
            ]
        );

    if (
        eventType !==
        undefined
    ) {

        updateData.event_type =
            eventType ||
            null;
    }


    /* VENUE */
    const venue =
        getControlValue(
            [
                "#modalVenue",
                "#leadVenue",
                "[data-control='venue']"
            ]
        );

    if (
        venue !==
        undefined
    ) {

        updateData.venue =
            venue ||
            null;
    }


    /* EVENT DATE */
    const eventDate =
        getControlValue(
            [
                "#modalEventDate",
                "#leadEventDate",
                "[data-control='event_date']"
            ]
        );

    if (
        eventDate !==
        undefined
    ) {

        updateData.event_date =
            eventDate ||
            null;
    }


    /* GUESTS */
    const guests =
        getControlValue(
            [
                "#modalGuests",
                "#leadGuests",
                "[data-control='guests']"
            ]
        );

    if (
        guests !==
        undefined
    ) {

        updateData.guests =
            guests === ""
                ? null
                : Number(
                    guests
                );
    }


    /* FOLLOW UP */
    const followUp =
        getControlValue(
            [
                "#modalFollowUp",
                "#leadFollowUp",
                "[data-control='follow_up_at']"
            ]
        );

    if (
        followUp !==
        undefined
    ) {

        updateData.follow_up_at =
            followUp ||
            null;
    }


    /* ASSIGNED TO */
    const assignedTo =
        getControlValue(
            [
                "#modalAssignedTo",
                "#leadAssignedTo",
                "[data-control='assigned_to']"
            ]
        );

    if (
        assignedTo !==
        undefined
    ) {

        updateData.assigned_to =
            assignedTo ||
            null;
    }


    /* INTERNAL NOTES */
    const notes =
        getControlValue(
            [
                "#modalNotes",
                "#leadNotes",
                "#modalInternalNotes",
                "[data-control='internal_notes']"
            ]
        );

    if (
        notes !==
        undefined
    ) {

        updateData.internal_notes =
            notes ||
            null;
    }


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
                lead =>
                    String(
                        lead.id
                    ) ===
                    String(
                        leadId
                    )
            );


        if (
            index !==
            -1
        ) {

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
    }
}


/* =========================================================
   GET CONTROL VALUE
   ========================================================= */

function getControlValue(
    selectors
) {

    for (
        const selector
        of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );

        if (element) {

            return element.value;
        }
    }

    return undefined;
}


/* =========================================================
   CONTACT ACTIONS
   ========================================================= */

function setupContactActions(
    lead
) {

    const phone =
        lead.phone;

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


    /* CALL */
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


    /* WHATSAPP */
    if (whatsapp) {

        if (phone) {

            let cleanPhone =
                String(
                    phone
                ).replace(
                    /\D/g,
                    ""
                );

            /*
              India number handling.
            */

            if (
                cleanPhone.length ===
                10
            ) {

                cleanPhone =
                    "91" +
                    cleanPhone;
            }

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


    /* EMAIL */
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

    modal.classList.add(
        "show"
    );

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

    modal.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";
}


/* =========================================================
   FORM FIELD HELPER
   ========================================================= */

function getFormField(
    form,
    names
) {

    for (
        const name
        of names
    ) {

        const field =
            form.elements[
                name
            ];

        if (field) {
            return field;
        }
    }

    return null;
}


/* =========================================================
   SUBMIT ADD ENQUIRY
   ========================================================= */

async function submitAddEnquiry(
    event
) {

    if (event) {
        event.preventDefault();
    }

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }

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


    /*
      Build the object explicitly.
      This avoids sending wrong field names.
    */

    const customerNameField =
        getFormField(
            form,
            [
                "customer_name",
                "name",
                "customerName"
            ]
        );

    const phoneField =
        getFormField(
            form,
            [
                "phone",
                "mobile",
                "contact_number"
            ]
        );

    const emailField =
        getFormField(
            form,
            [
                "email"
            ]
        );

    const leadSourceField =
        getFormField(
            form,
            [
                "lead_source",
                "source"
            ]
        );

    const eventTypeField =
        getFormField(
            form,
            [
                "event_type",
                "event"
            ]
        );

    const venueField =
        getFormField(
            form,
            [
                "venue",
                "venue_name"
            ]
        );

    const eventDateField =
        getFormField(
            form,
            [
                "event_date",
                "date"
            ]
        );

    const guestsField =
        getFormField(
            form,
            [
                "guests",
                "guest_count",
                "number_of_guests"
            ]
        );

    const locationField =
        getFormField(
            form,
            [
                "location",
                "city"
            ]
        );

    const statusField =
        getFormField(
            form,
            [
                "status"
            ]
        );

    const priorityField =
        getFormField(
            form,
            [
                "priority"
            ]
        );

    const followUpField =
        getFormField(
            form,
            [
                "follow_up_at",
                "followup_at"
            ]
        );

    const assignedField =
        getFormField(
            form,
            [
                "assigned_to",
                "assigned_employee",
                "employee"
            ]
        );

    const messageField =
        getFormField(
            form,
            [
                "message",
                "enquiry",
                "requirements"
            ]
        );

    const notesField =
        getFormField(
            form,
            [
                "internal_notes",
                "notes",
                "remarks"
            ]
        );


    const data = {

        customer_name:
            customerNameField
                ?.value
                ?.trim() ||
            null,

        phone:
            phoneField
                ?.value
                ?.trim() ||
            null,

        email:
            emailField
                ?.value
                ?.trim() ||
            null,

        lead_source:
            leadSourceField
                ?.value
                ?.trim() ||
            null,

        event_type:
            eventTypeField
                ?.value
                ?.trim() ||
            null,

        venue:
            venueField
                ?.value
                ?.trim() ||
            null,

        event_date:
            eventDateField
                ?.value ||
            null,

        guests:
            guestsField?.value
                ? Number(
                    guestsField.value
                )
                : null,

        location:
            locationField
                ?.value
                ?.trim() ||
            null,

        status:
            statusField
                ?.value ||
            "new",

        priority:
            priorityField
                ?.value ||
            "normal",

        follow_up_at:
            followUpField
                ?.value ||
            null,

        assigned_to:
            assignedField
                ?.value
                ?.trim() ||
            null,

        message:
            messageField
                ?.value
                ?.trim() ||
            null,

        internal_notes:
            notesField
                ?.value
                ?.trim() ||
            null
    };


    /*
      Remove fields that may not exist
      in the current form.
    */

    Object.keys(
        data
    ).forEach(
        key => {

            if (
                data[key] ===
                undefined
            ) {

                delete data[key];
            }
        }
    );


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
            lead => {

                const status =
                    String(
                        lead.status ||
                        ""
                    ).toLowerCase();

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


    /*
      Match existing four stat cards
      on dashboard.html.
    */

    const cards =
        document.querySelectorAll(
            ".stat-card"
        );


    const values = [

        total,
        newCount,
        contactedCount,
        closedCount

    ];


    cards.forEach(
        (
            card,
            index
        ) => {

            const valueElement =
                card.querySelector(
                    "strong"
                ) ||
                card.querySelector(
                    ".stat-value"
                ) ||
                card.querySelector(
                    "[data-stat-value]"
                );

            if (
                valueElement &&
                values[index] !==
                    undefined
            ) {

                valueElement.textContent =
                    values[index];
            }
        }
    );


    /*
      Explicit IDs if available.
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
            "#contactedLeads",
            "#contactedEnquiries",
            "[data-stat='contacted']"
        ],
        contactedCount
    );


    setStatValue(
        [
            "#closedLeads",
            "#closedEnquiries",
            "[data-stat='closed']"
        ],
        closedCount
    );
}


function setStatValue(
    selectors,
    value
) {

    for (
        const selector
        of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );

        if (element) {

            element.textContent =
                value;

            return;
        }
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
        (
            card,
            index
        ) => {

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


                    if (
                        index ===
                        0
                    ) {

                        currentStatusFilter =
                            "all";

                    } else if (
                        index ===
                        1
                    ) {

                        currentStatusFilter =
                            "new";

                    } else if (
                        index ===
                        2
                    ) {

                        currentStatusFilter =
                            "contacted";

                    } else if (
                        index ===
                        3
                    ) {

                        currentStatusFilter =
                            "closed";
                    }


                    const statusSelect =
                        document.querySelector(
                            "#statusFilter"
                        );


                    if (
                        statusSelect
                    ) {

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

    return String(
        status
    )
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

    return String(
        priority
    )
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

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
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
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );
    }

    return date.toLocaleString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );
}


/* =========================================================
   DATE INPUT NORMALIZER
   ========================================================= */

function normalizeDateInput(
    value
) {

    if (!value) {
        return "";
    }

    const text =
        String(
            value
        );

    /*
      Already YYYY-MM-DD
    */

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(text)
    ) {

        return text;
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

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )
    ].join("-");
}


/* =========================================================
   DATETIME LOCAL NORMALIZER
   ========================================================= */

function normalizeDateTimeLocal(
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

    return (
        `${year}-${month}-${day}` +
        `T${hours}:${minutes}`
    );
}


/* =========================================================
   DROPDOWN OPTIONS
   ========================================================= */

function getStatusOptions() {

    return [

        {
            value:
                "new",

            label:
                "New"
        },

        {
            value:
                "contacted",

            label:
                "Contacted"
        },

        {
            value:
                "follow-up",

            label:
                "Follow-up"
        },

        {
            value:
                "qualified",

            label:
                "Qualified"
        },

        {
            value:
                "converted",

            label:
                "Converted"
        },

        {
            value:
                "closed",

            label:
                "Closed"
        },

        {
            value:
                "lost",

            label:
                "Lost"
        }
    ];
}


function getPriorityOptions() {

    return [

        {
            value:
                "low",

            label:
                "Low"
        },

        {
            value:
                "normal",

            label:
                "Normal"
        },

        {
            value:
                "medium",

            label:
                "Medium"
        },

        {
            value:
                "high",

            label:
                "High"
        },

        {
            value:
                "urgent",

            label:
                "Urgent"
        }
    ];
}


function getEventOptions() {

    return [

        {
            value:
                "",

            label:
                "Select Event"
        },

        {
            value:
                "Wedding",

            label:
                "Wedding"
        },

        {
            value:
                "Engagement",

            label:
                "Engagement"
        },

        {
            value:
                "Birthday",

            label:
                "Birthday"
        },

        {
            value:
                "Corporate",

            label:
                "Corporate"
        },

        {
            value:
                "Anniversary",

            label:
                "Anniversary"
        },

        {
            value:
                "Party",

            label:
                "Party"
        },

        {
            value:
                "Other",

            label:
                "Other"
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

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
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
        document.querySelector(
            "#statusFilter"
        );

    const priorityFilter =
        document.querySelector(
            "#priorityFilter"
        );


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            () => {

                currentStatusFilter =
                    statusFilter.value ||
                    "all";

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


    /*
      Fallback for existing filter bar.
    */

    if (
        !statusFilter &&
        !priorityFilter
    ) {

        const selects =
            document.querySelectorAll(
                ".filter-bar select"
            );

        selects.forEach(
            (
                select,
                index
            ) => {

                select.addEventListener(
                    "change",
                    () => {

                        if (
                            index ===
                            0
                        ) {

                            currentStatusFilter =
                                select.value ||
                                "all";

                        } else {

                            currentPriorityFilter =
                                select.value ||
                                "all";
                        }

                        applyFilters();
                    }
                );
            }
        );
    }
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


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

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
                "Refresh";
        }
    );
}


/* =========================================================
   ADD BUTTON
   ========================================================= */

function setupAddButton() {

    const button =
        document.querySelector(
            "#addEnquiryBtn"
        ) ||
        document.querySelector(
            ".add-enquiry-btn"
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


            /*
              INLINE FIELD
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

                openLeadModal(
                    id
                );

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
              CLOSE ADD MODAL
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
      LEAD MODAL BACKDROP
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
      ADD MODAL BACKDROP
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


            if (
                session &&
                (
                    event ===
                        "SIGNED_IN" ||
                    event ===
                        "TOKEN_REFRESHED"
                )
            ) {

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
        document.querySelector(
            "#addEnquiryModal form"
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
                event => {

                    event.preventDefault();

                    logoutCRM();
                }
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
   GLOBAL API
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

window.startInlineEdit =
    startInlineEdit;
```
