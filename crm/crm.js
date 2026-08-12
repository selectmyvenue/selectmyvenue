/* =========================================================
   SELECT MY VENUE — CRM
   FINAL CRM.JS
   Source + Comment + Expanded Status
   Matches actual customer_enquiries columns
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
        !window.supabase.createClient
    ) {

        console.error(
            "Supabase library not loaded."
        );

        showToast(
            "Supabase library is not loaded.",
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
let currentSearch = "";

let toastTimer = null;


/* =========================================================
   HELPERS
========================================================= */

function $(selector, parent = document) {
    return parent.querySelector(selector);
}


function safeValue(value) {

    return (
        value === null ||
        value === undefined
    )
        ? ""
        : String(value);

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

        toast.style.bottom =
            "25px";

        toast.style.right =
            "25px";

        toast.style.zIndex =
            "99999";

        toast.style.padding =
            "13px 18px";

        toast.style.borderRadius =
            "10px";

        toast.style.color =
            "#fff";

        toast.style.fontSize =
            "14px";

        toast.style.fontWeight =
            "600";

        toast.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.25)";

        toast.style.transition =
            "all .2s ease";

        document.body.appendChild(toast);

    }


    if (type === "error") {

        toast.style.background =
            "#b42318";

    }

    else if (type === "warning") {

        toast.style.background =
            "#9a6700";

    }

    else {

        toast.style.background =
            "#167c6a";

    }


    toast.textContent =
        message;

    toast.style.opacity =
        "1";


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

            },
            2800
        );

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

            return null;

        }


        const session =
            data.session;


        if (!session) {

            window.location.href =
                "login.html";

            return null;

        }


        updateStaffName(
            session.user
        );


        return session;

    }

    catch (error) {

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

    }

    catch (error) {

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
                "Supabase error:",
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


        applyFilters();

        updateStats();

    }


    catch (error) {

        console.error(
            "Load error:",
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
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = `
        <tr>
            <td colspan="11" class="loading-cell">
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
            <td colspan="11" class="loading-cell">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;

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
            lead => {

                const searchable = [

                    lead.customer_name,
                    lead.mobile,
                    lead.email,
                    lead.location,
                    lead.occasion,
                    lead.source,
                    lead.requirements,
                    lead.internal_notes,
                    lead.status

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchable.includes(search);


                const status =
                    safeValue(
                        lead.status ||
                        "new"
                    ).toLowerCase();


                const matchesStatus =
                    currentStatusFilter ===
                        "all" ||
                    status ===
                        currentStatusFilter;


                return (
                    matchesSearch &&
                    matchesStatus
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
        );


    if (!tbody) {
        return;
    }


    if (!filteredLeads.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="11">
                    <div class="crm-empty-inline">

                        <div>
                            ⌕
                        </div>

                        <strong>
                            No enquiries found
                        </strong>

                        <span>
                            Try changing your search or filter.
                        </span>

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

   Actual DB columns:
   customer_name
   mobile
   email
   occasion
   event_date
   guests
   location
   source
   status
   internal_notes
========================================================= */

function createLeadRow(lead) {

    const id =
        safeValue(lead.id);


    const customerName =
        lead.customer_name ||
        "Unknown Customer";


    const phone =
        lead.mobile ||
        "—";


    const email =
        lead.email ||
        "—";


    const source =
        lead.source ||
        "—";


    const occasion =
        lead.occasion ||
        "—";


    const eventDate =
        lead.event_date ||
        "";


    const guests =
        lead.guests ??
        "";


    const location =
        lead.location ||
        "—";


    const status =
        lead.status ||
        "new";


    const hasComment =
        !!safeValue(
            lead.internal_notes
        ).trim();


    return `
        <tr
            data-lead-id="${escapeHTML(id)}"
        >

            <!-- CUSTOMER -->

            <td class="customer-cell">

                <strong>
                    ${escapeHTML(customerName)}
                </strong>

            </td>


            <!-- PHONE -->

            <td class="phone-cell">

                ${
                    phone !== "—"
                        ? escapeHTML(phone)
                        : "—"
                }

            </td>


            <!-- EMAIL -->

            <td>

                ${createInlineField(
                    lead,
                    "email",
                    email,
                    "text"
                )}

            </td>


            <!-- SOURCE -->

            <td>

                ${createInlineField(
                    lead,
                    "source",
                    source,
                    "select",
                    getSourceOptions()
                )}

            </td>


            <!-- EVENT -->

            <td>

                ${createInlineField(
                    lead,
                    "occasion",
                    occasion,
                    "select",
                    getEventOptions()
                )}

            </td>


            <!-- EVENT DATE -->

            <td>

                ${createInlineField(
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


            <!-- GUESTS -->

            <td>

                ${createInlineField(
                    lead,
                    "guests",
                    guests === ""
                        ? "—"
                        : guests,
                    "number"
                )}

            </td>


            <!-- LOCATION -->

            <td>

                ${createInlineField(
                    lead,
                    "location",
                    location,
                    "text"
                )}

            </td>


            <!-- STATUS -->

            <td>

                ${createStatusField(
                    lead
                )}

            </td>


            <!-- COMMENT -->

            <td class="comment-cell">

                ${createCommentCell(
                    lead,
                    hasComment
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
   STATUS FIELD
========================================================= */

function createStatusField(lead) {

    const id =
        safeValue(lead.id);


    const status =
        safeValue(
            lead.status ||
            "new"
        ).toLowerCase();


    return `
        <div
            class="crm-status-field status-${escapeHTML(
                normalizeStatusClass(status)
            )}"
            data-status-field="${escapeHTML(status)}"
            data-lead-id="${escapeHTML(id)}"
            tabindex="0"
            title="Click to change status"
        >

            <span class="status-display">

                ${escapeHTML(
                    formatStatus(status)
                )}

            </span>

        </div>
    `;

}


/* =========================================================
   COMMENT CELL

   ✏️ = edit
   👁️ = view
   Y = comment exists
========================================================= */

function createCommentCell(
    lead,
    hasComment
) {

    const id =
        safeValue(lead.id);


    return `
        <div
            class="crm-comment-actions"
            data-lead-id="${escapeHTML(id)}"
        >

            <button
                type="button"
                class="comment-action-btn comment-edit-btn"
                data-comment-action="edit"
                data-id="${escapeHTML(id)}"
                title="Edit comment"
                aria-label="Edit comment"
            >
                ✏️
            </button>


            ${
                hasComment
                    ? `
                        <button
                            type="button"
                            class="comment-action-btn comment-view-btn"
                            data-comment-action="view"
                            data-id="${escapeHTML(id)}"
                            title="View comment"
                            aria-label="View comment"
                        >
                            👁️
                        </button>

                        <span
                            class="comment-exists-indicator"
                            title="Comment exists"
                        >
                            Y
                        </span>
                    `
                    : ""
            }

        </div>
    `;

}


/* =========================================================
   INLINE FIELD
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
        safeValue(lead.id);


    const value =
        rawValue !== null &&
        rawValue !== undefined
            ? rawValue
            : lead[field];


    const shown =
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
        lead[field] ?? "";


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


    let editor;


    /* DROPDOWN */

    if (
        field === "occasion"
    ) {

        editor =
            createSelectEditor(
                getEventOptions(),
                originalValue
            );

    }


    /* SOURCE DROPDOWN */

    else if (
        field === "source"
    ) {

        editor =
            createSelectEditor(
                getSourceOptions(),
                originalValue
            );

    }


    /* NORMAL INPUT */

    else {

        editor =
            document.createElement(
                "input"
            );


        editor.type =
            field === "event_date"
                ? "date"
                : field === "guests"
                    ? "number"
                    : "text";


        editor.value =
            safeValue(
                originalValue
            );


        editor.className =
            "crm-inline-editor";

    }


    display.style.display =
        "none";


    element.appendChild(
        editor
    );


    editor.focus();


    if (
        typeof editor.select ===
        "function"
    ) {

        editor.select();

    }


    let saved = false;


    async function save() {

        if (saved) {
            return;
        }


        saved = true;


        const newValue =
            editor.value;


        if (
            safeValue(newValue) ===
            safeValue(originalValue)
        ) {

            element.classList.remove(
                "editing"
            );

            display.style.display =
                "";

            editor.remove();

            return;

        }


        await updateLeadField(
            leadId,
            field,
            newValue
        );

    }


    function cancel() {

        if (saved) {
            return;
        }


        saved = true;


        element.classList.remove(
            "editing"
        );


        display.style.display =
            "";


        editor.remove();

    }


    editor.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                save();

            }


            if (
                event.key ===
                "Escape"
            ) {

                event.preventDefault();

                cancel();

            }

        }
    );


    editor.addEventListener(
        "blur",
        () => {

            setTimeout(
                () => {

                    if (
                        !saved
                    ) {

                        save();

                    }

                },
                120
            );

        }
    );

}


/* =========================================================
   SELECT EDITOR
========================================================= */

function createSelectEditor(
    options,
    currentValue
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
                safeValue(
                    option.value
                ) ===
                safeValue(
                    currentValue
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
   UPDATE LEAD FIELD
========================================================= */

async function updateLeadField(
    leadId,
    field,
    value
) {

    const client =
        getSupabaseClient();


    if (!client) {
        return;
    }


    try {

        const updateData = {};


        if (
            field ===
            "guests"
        ) {

            updateData[field] =
                value
                    ? Number(value)
                    : null;

        }

        else {

            updateData[field] =
                value === ""
                    ? null
                    : value;

        }


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
                "Update field error:",
                error
            );


            showToast(
                error.message ||
                "Unable to update enquiry.",
                "error"
            );


            renderLeads();

            return;

        }


        updateLocalLead(
            data
        );


        renderLeads();


        showToast(
            "Updated successfully.",
            "success"
        );

    }


    catch (error) {

        console.error(
            error
        );


        showToast(
            "Unable to update enquiry.",
            "error"
        );


        renderLeads();

    }

}


/* =========================================================
   LOCAL LEAD UPDATE
========================================================= */

function updateLocalLead(
    updatedLead
) {

    if (!updatedLead) {
        return;
    }


    const index =
        allLeads.findIndex(
            item =>
                String(item.id) ===
                String(updatedLead.id)
        );


    if (index === -1) {

        allLeads.unshift(
            updatedLead
        );

    }

    else {

        allLeads[index] =
            updatedLead;

    }


    if (
        currentLead &&
        String(currentLead.id) ===
        String(updatedLead.id)
    ) {

        currentLead =
            updatedLead;

    }

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
            value: "interested",
            label: "Interested"
        },

        {
            value: "qualified",
            label: "Qualified"
        },

        {
            value: "site-visit",
            label: "Site Visit"
        },

        {
            value: "negotiation",
            label: "Negotiation"
        },

        {
            value: "booked",
            label: "Booked"
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
        },

        {
            value: "not-interested",
            label: "Not Interested"
        }

    ];

}


/* =========================================================
   SOURCE OPTIONS
========================================================= */

function getSourceOptions() {

    return [

        {
            value: "",
            label: "Select Source"
        },

        {
            value: "Website",
            label: "Website"
        },

        {
            value: "WhatsApp",
            label: "WhatsApp"
        },

        {
            value: "Phone",
            label: "Phone"
        },

        {
            value: "Facebook",
            label: "Facebook"
        },

        {
            value: "Instagram",
            label: "Instagram"
        },

        {
            value: "Referral",
            label: "Referral"
        },

        {
            value: "Other",
            label: "Other"
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
   STATUS EDIT
========================================================= */

function startStatusEdit(
    element
) {

    if (!element) {
        return;
    }


    if (
        element.classList.contains(
            "editing"
        )
    ) {
        return;
    }


    const leadId =
        element.dataset.leadId;


    const lead =
        allLeads.find(
            item =>
                String(item.id) ===
                String(leadId)
        );


    if (!lead) {
        return;
    }


    const currentStatus =
        safeValue(
            lead.status ||
            "new"
        ).toLowerCase();


    element.classList.add(
        "editing"
    );


    const display =
        element.querySelector(
            ".status-display"
        );


    if (display) {

        display.style.display =
            "none";

    }


    const select =
        createSelectEditor(
            getStatusOptions(),
            currentStatus
        );


    select.classList.add(
        "crm-status-editor"
    );


    element.appendChild(
        select
    );


    select.focus();


    let saved = false;


    async function saveStatus() {

        if (saved) {
            return;
        }


        saved = true;


        const newStatus =
            select.value;


        if (
            newStatus ===
            currentStatus
        ) {

            element.classList.remove(
                "editing"
            );


            if (display) {

                display.style.display =
                    "";

            }


            select.remove();

            return;

        }


        await updateLeadField(
            leadId,
            "status",
            newStatus
        );

    }


    function cancelStatus() {

        if (saved) {
            return;
        }


        saved = true;


        element.classList.remove(
            "editing"
        );


        if (display) {

            display.style.display =
                "";

        }


        select.remove();

    }


    select.addEventListener(
        "change",
        saveStatus
    );


    select.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                event.preventDefault();

                cancelStatus();

            }

        }
    );


    select.addEventListener(
        "blur",
        () => {

            setTimeout(
                () => {

                    if (
                        !saved
                    ) {

                        cancelStatus();

                    }

                },
                150
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

    const found =
        getStatusOptions().find(
            option =>
                option.value ===
                status
        );


    if (found) {
        return found.label;
    }


    return safeValue(
        status
    )
        .replace(/-/g, " ")
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


/* =========================================================
   NORMALIZE STATUS CLASS
========================================================= */

function normalizeStatusClass(
    status
) {

    return safeValue(
        status
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        ) ||
        "new";

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
            value +
            (
                value.length === 10
                    ? "T00:00:00"
                    : ""
            )
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return safeValue(
            value
        );

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
        () => {

            currentSearch =
                input.value ||
                "";

            applyFilters();

        }
    );

}


/* =========================================================
   STATUS FILTER
========================================================= */

function setupFilters() {

    const status =
        document.getElementById(
            "statusFilter"
        );


    if (status) {

        status.addEventListener(
            "change",
            () => {

                currentStatusFilter =
                    status.value ||
                    "all";

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
            "[data-status-filter]"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const filter =
                            card.dataset.statusFilter ||
                            "all";


                        currentStatusFilter =
                            filter;


                        const status =
                            document.getElementById(
                                "statusFilter"
                            );


                        if (status) {

                            status.value =
                                currentStatusFilter;

                        }


                        document
                            .querySelectorAll(
                                ".stat-card"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        card.classList.add(
                            "active"
                        );


                        applyFilters();

                    }
                );

            }
        );

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


            /* INLINE FIELD */

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


            /* STATUS */

            const statusField =
                event.target.closest(
                    ".crm-status-field"
                );


            if (
                statusField &&
                !statusField.classList.contains(
                    "editing"
                )
            ) {

                startStatusEdit(
                    statusField
                );

                return;

            }


            /* COMMENT */

            const commentAction =
                event.target.closest(
                    "[data-comment-action]"
                );


            if (commentAction) {

                const id =
                    commentAction.dataset.id;


                const action =
                    commentAction.dataset.commentAction;


                if (
                    action ===
                    "edit"
                ) {

                    openCommentEditor(
                        id
                    );

                }

                else if (
                    action ===
                    "view"
                ) {

                    viewComment(
                        id
                    );

                }


                return;

            }


            /* VIEW DETAILS */

            const view =
                event.target.closest(
                    "[data-action='view']"
                );


            if (view) {

                openLeadModal(
                    view.dataset.id
                );

                return;

            }


            /* CLOSE MODAL */

            const close =
                event.target.closest(
                    ".close-modal"
                );


            if (close) {

                if (
                    close.closest(
                        "#leadModal"
                    )
                ) {

                    closeLeadModal();

                    return;

                }


                if (
                    close.closest(
                        "#addEnquiryModal"
                    )
                ) {

                    closeAddEnquiryModal();

                    return;

                }

            }


            /* CANCEL LEAD */

            const cancelLead =
                event.target.closest(
                    "#cancelLeadEdit"
                );


            if (cancelLead) {

                closeLeadModal();

                return;

            }


            /* CANCEL ADD */

            const cancel =
                event.target.closest(
                    "#cancelAddEnquiry"
                );


            if (cancel) {

                closeAddEnquiryModal();

                return;

            }


            /* SAVE LEAD */

            const save =
                event.target.closest(
                    "#saveLeadBtn"
                );


            if (save) {

                saveModalChanges();

                return;

            }


            /* ADD MODAL */

            const addModal =
                event.target.closest(
                    "#addEnquiryModal"
                );


            if (
                event.target ===
                addModal
            ) {

                closeAddEnquiryModal();

                return;

            }


            /* LEAD MODAL */

            const leadModal =
                event.target.closest(
                    "#leadModal"
                );


            if (
                event.target ===
                leadModal
            ) {

                closeLeadModal();

            }

        }
    );

}


/* =========================================================
   COMMENT ACTIONS
========================================================= */

function openCommentEditor(
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


    currentLead =
        lead;


    const modal =
        document.getElementById(
            "leadModal"
        );


    if (!modal) {
        return;
    }


    populateLeadModal(
        lead
    );


    modal.hidden =
        false;


    document.body.style.overflow =
        "hidden";


    const remarks =
        document.getElementById(
            "detailRemarks"
        );


    if (remarks) {

        remarks.focus();


        remarks.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


/* =========================================================
   VIEW COMMENT
========================================================= */

function viewComment(
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


    const comment =
        safeValue(
            lead.internal_notes
        ).trim();


    if (!comment) {

        showToast(
            "No comment available.",
            "warning"
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
        return;
    }


    populateLeadModal(
        lead
    );


    modal.hidden =
        false;


    document.body.style.overflow =
        "hidden";


    const remarks =
        document.getElementById(
            "detailRemarks"
        );


    if (remarks) {

        remarks.focus();


        remarks.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


/* =========================================================
   VIEW LEAD MODAL
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
            "Lead modal not found.",
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


    currentLead =
        null;


    document.body.style.overflow =
        "";

}


/* =========================================================
   POPULATE LEAD MODAL
========================================================= */

function populateLeadModal(
    lead
) {

    if (!lead) {
        return;
    }


    const set =
        (id, value) => {

            const element =
                document.getElementById(
                    id
                );


            if (!element) {
                return;
            }


            if (
                element.tagName ===
                "INPUT" ||
                element.tagName ===
                "TEXTAREA" ||
                element.tagName ===
                "SELECT"
            ) {

                element.value =
                    safeValue(value);

            }

            else {

                element.textContent =
                    safeValue(value) ||
                    "—";

            }

        };


    set(
        "detailCustomerName",
        lead.customer_name
    );


    set(
        "detailPhone",
        lead.mobile
    );


    set(
        "detailEmail",
        lead.email
    );


    set(
        "detailSource",
        lead.source
    );


    set(
        "detailEventType",
        lead.occasion
    );


    set(
        "detailVenue",
        lead.location
    );


    set(
        "detailEventDate",
        lead.event_date
    );


    set(
        "detailGuests",
        lead.guests
    );


    set(
        "detailStatus",
        lead.status ||
        "new"
    );


    set(
        "detailPriority",
        lead.priority ||
        "normal"
    );


    set(
        "detailFollowUp",
        formatDateTimeLocal(
            lead.follow_up_at
        )
    );


    set(
        "detailAssignedTo",
        lead.assigned_to
    );


    set(
        "detailMessage",
        lead.requirements
    );


    set(
        "detailRemarks",
        lead.internal_notes
    );


    updateContactActions(
        lead
    );

}


/* =========================================================
   CONTACT ACTIONS
========================================================= */

function updateContactActions(
    lead
) {

    const phoneActions =
        document.getElementById(
            "detailPhoneActions"
        );


    const emailActions =
        document.getElementById(
            "detailEmailActions"
        );


    if (phoneActions) {

        phoneActions.innerHTML =
            "";


        if (lead.mobile) {

            const call =
                document.createElement(
                    "a"
                );


            call.href =
                "tel:" +
                safeValue(
                    lead.mobile
                );


            call.textContent =
                "Call";


            call.className =
                "mini-contact-btn";


            phoneActions.appendChild(
                call
            );

        }

    }


    if (emailActions) {

        emailActions.innerHTML =
            "";


        if (lead.email) {

            const email =
                document.createElement(
                    "a"
                );


            email.href =
                "mailto:" +
                safeValue(
                    lead.email
                );


            email.textContent =
                "Email";


            email.className =
                "mini-contact-btn";


            emailActions.appendChild(
                email
            );

        }

    }

}


/* =========================================================
   FORMAT DATETIME LOCAL
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


    const hours =
        String(
            date.getHours()
        )
            .padStart(
                2,
                "0"
            );


    const minutes =
        String(
            date.getMinutes()
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
        day +
        "T" +
        hours +
        ":" +
        minutes
    );

}


/* =========================================================
   UPDATE STATS
========================================================= */

function updateStats() {

    const total =
        allLeads.length;


    const count =
        status =>
            allLeads.filter(
                lead =>
                    safeValue(
                        lead.status ||
                        "new"
                    ).toLowerCase() ===
                    status
            ).length;


    setText(
        "totalCount",
        total
    );


    setText(
        "newCount",
        count("new")
    );


    setText(
        "contactedCount",
        count("contacted")
    );


    setText(
        "closedCount",
        count("closed")
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


    if (element) {

        element.textContent =
            safeValue(value);

    }

}
// =====================================================
// SELECT MY VENUE — CRM
// crm.js
// BLOCK 2
// LEAD LOADING + FILTERING + TABLE RENDERING
// =====================================================


// =====================================================
// CRM STATE
// =====================================================

let allLeads = [];
let filteredLeads = [];
let currentLead = null;

let currentStatusFilter = "all";
let currentPriorityFilter = "all";
let currentSearchTerm = "";


// =====================================================
// CRM STATUS LIST
// =====================================================

const CRM_STATUSES = [
  "new",
  "contacted",
  "follow-up",
  "interested",
  "qualified",
  "site visit",
  "negotiation",
  "booked",
  "converted",
  "closed",
  "lost",
  "not interested"
];


// =====================================================
// STATUS DISPLAY NAMES
// =====================================================

const STATUS_LABELS = {
  "new": "New",
  "contacted": "Contacted",
  "follow-up": "Follow-up",
  "interested": "Interested",
  "qualified": "Qualified",
  "site visit": "Site Visit",
  "negotiation": "Negotiation",
  "booked": "Booked",
  "converted": "Converted",
  "closed": "Closed",
  "lost": "Lost",
  "not interested": "Not Interested"
};


// =====================================================
// STATUS COLORS
// =====================================================

const STATUS_CLASS = {
  "new": "status-new",
  "contacted": "status-contacted",
  "follow-up": "status-follow-up",
  "interested": "status-interested",
  "qualified": "status-qualified",
  "site visit": "status-site-visit",
  "negotiation": "status-negotiation",
  "booked": "status-booked",
  "converted": "status-converted",
  "closed": "status-closed",
  "lost": "status-lost",
  "not interested": "status-not-interested"
};


// =====================================================
// SOURCE LIST
// =====================================================

const LEAD_SOURCES = [
  "Website",
  "WhatsApp",
  "Phone",
  "Facebook",
  "Instagram",
  "Referral"
];


// =====================================================
// INITIALIZE CRM
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeCRM();

  }
);


// =====================================================
// INITIALIZE CRM
// =====================================================

async function initializeCRM() {

  try {

    setupCRMEvents();

    setupSourceDropdown();

    setupStatusDropdowns();

    await checkCRMUser();

    await loadLeads();

  } catch (error) {

    console.error(
      "CRM initialization error:",
      error
    );

    showCRMMessage(
      "Unable to initialize CRM. Please refresh the page.",
      "error"
    );

  }

}


// =====================================================
// CHECK LOGGED-IN USER
// =====================================================

async function checkCRMUser() {

  if (!supabaseClient) {

    console.error(
      "Supabase client is not available."
    );

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .getSession();


    if (error) {

      console.error(
        "Session check error:",
        error
      );

      return;

    }


    if (
      !data ||
      !data.session
    ) {

      console.warn(
        "No active CRM session."
      );

      return;

    }


    const user =
      data.session.user;


    const staffName =
      document.getElementById(
        "staffName"
      );


    if (staffName) {

      const displayName =
        user.user_metadata &&
        (
          user.user_metadata.full_name ||
          user.user_metadata.name
        );


      staffName.textContent =
        displayName ||
        user.email ||
        "Employee";

    }

  } catch (error) {

    console.error(
      "CRM user check failed:",
      error
    );

  }

}


// =====================================================
// LOAD LEADS
// =====================================================

async function loadLeads() {

  const tableBody =
    document.getElementById(
      "leadsTableBody"
    );


  if (tableBody) {

    tableBody.innerHTML = `
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


  if (!supabaseClient) {

    renderEmptyState(
      "Supabase connection unavailable."
    );

    return;

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
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        "Lead loading error:",
        error
      );

      renderEmptyState(
        "Unable to load enquiries."
      );

      return;

    }


    allLeads =
      Array.isArray(data)
        ? data
        : [];


    normalizeLeadData();

    updateStatistics();

    applyLeadFilters();

  } catch (error) {

    console.error(
      "CRM load leads error:",
      error
    );

    renderEmptyState(
      "Unable to load enquiries."
    );

  }

}


// =====================================================
// NORMALIZE LEAD DATA
// =====================================================

function normalizeLeadData() {

  allLeads =
    allLeads.map(
      function (lead) {

        const normalized =
          {
            ...lead
          };


        normalized.status =
          normalizeStatus(
            lead.status
          );


        normalized.source =
          lead.source ||
          "Website";


        normalized.customer_name =
          lead.customer_name ||
          "—";


        normalized.mobile =
          lead.mobile ||
          "";


        normalized.email =
          lead.email ||
          "";


        normalized.location =
          lead.location ||
          "";


        normalized.occasion =
          lead.occasion ||
          "";


        normalized.guests =
          lead.guests ??
          null;


        normalized.event_date =
          lead.event_date ||
          null;


        normalized.internal_notes =
          lead.internal_notes ||
          "";


        return normalized;

      }
    );

}


// =====================================================
// NORMALIZE STATUS
// =====================================================

function normalizeStatus(
  status
) {

  if (!status) {

    return "new";

  }


  const value =
    String(status)
      .trim()
      .toLowerCase();


  return STATUS_LABELS[value]
    ? value
    : "new";

}


// =====================================================
// APPLY FILTERS
// =====================================================

function applyLeadFilters() {

  const search =
    currentSearchTerm
      .trim()
      .toLowerCase();


  filteredLeads =
    allLeads.filter(
      function (lead) {

        // ---------------------------------------------
        // STATUS FILTER
        // ---------------------------------------------

        if (
          currentStatusFilter !==
          "all"
        ) {

          if (
            normalizeStatus(
              lead.status
            ) !==
            currentStatusFilter
          ) {

            return false;

          }

        }


        // ---------------------------------------------
        // PRIORITY FILTER
        // ---------------------------------------------
        // Kept internally for compatibility
        // with existing data.
        // Priority is NOT displayed in CRM.

        if (
          currentPriorityFilter !==
          "all"
        ) {

          const priority =
            String(
              lead.priority ||
              ""
            )
              .trim()
              .toLowerCase();


          if (
            priority !==
            currentPriorityFilter
          ) {

            return false;

          }

        }


        // ---------------------------------------------
        // SEARCH
        // ---------------------------------------------

        if (search) {

          const searchableText = [
            lead.customer_name,
            lead.mobile,
            lead.email,
            lead.location,
            lead.occasion,
            lead.source,
            lead.requirements,
            lead.internal_notes
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          if (
            !searchableText.includes(
              search
            )
          ) {

            return false;

          }

        }


        return true;

      }
    );


  renderLeadTable();

}


// =====================================================
// RENDER LEAD TABLE
// =====================================================

function renderLeadTable() {

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


  if (
    !filteredLeads.length
  ) {

    tableBody.innerHTML = "";

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
    filteredLeads
      .map(
        function (lead) {

          return buildLeadRow(
            lead
          );

        }
      )
      .join("");

}


// =====================================================
// BUILD LEAD TABLE ROW
// =====================================================

function buildLeadRow(
  lead
) {

  const status =
    normalizeStatus(
      lead.status
    );


  const statusLabel =
    STATUS_LABELS[status] ||
    "New";


  const statusClass =
    STATUS_CLASS[status] ||
    "status-new";


  const customerName =
    escapeHTML(
      lead.customer_name ||
      "—"
    );


  const phone =
    escapeHTML(
      lead.mobile ||
      "—"
    );


  const email =
    escapeHTML(
      lead.email ||
      "—"
    );


  const occasion =
    escapeHTML(
      lead.occasion ||
      "—"
    );


  const eventDate =
    formatDate(
      lead.event_date
    );


  const guests =
    lead.guests !== null &&
    lead.guests !== undefined &&
    lead.guests !== ""
      ? escapeHTML(
          String(
            lead.guests
          )
        )
      : "—";


  const location =
    escapeHTML(
      lead.location ||
      "—"
    );


  const commentExists =
    Boolean(
      String(
        lead.internal_notes ||
        ""
      ).trim()
    );


  return `
    <tr
      data-lead-id="${escapeHTML(
        String(
          lead.id ||
          ""
        )
      )}"
    >

      <td>
        <div class="customer-cell">

          <strong>
            ${customerName}
          </strong>

        </div>
      </td>


      <td>
        <span class="table-phone">
          ${phone}
        </span>
      </td>


      <td>
        <span class="table-email">
          ${email}
        </span>
      </td>


      <td>
        <span class="event-cell">
          ${occasion}
        </span>
      </td>


      <td>
        <span class="date-cell">
          ${eventDate}
        </span>
      </td>


      <td>
        <span class="guest-cell">
          ${guests}
        </span>
      </td>


      <td>
        <span class="location-cell">
          ${location}
        </span>
      </td>


      <td>
        <span
          class="status-badge ${statusClass}"
          data-status="${escapeHTML(
            status
          )}"
        >
          ${escapeHTML(
            statusLabel
          )}
        </span>
      </td>


      <td class="comment-cell">

        <div class="comment-actions">

          <button
            type="button"
            class="comment-icon-btn comment-edit-btn"
            data-action="edit-comment"
            data-id="${escapeHTML(
              String(
                lead.id ||
                ""
              )
            )}"
            title="Edit comment"
            aria-label="Edit comment"
          >
            ✏
          </button>


          <button
            type="button"
            class="comment-icon-btn comment-view-btn"
            data-action="view-comment"
            data-id="${escapeHTML(
              String(
                lead.id ||
                ""
              )
            )}"
            title="View comment"
            aria-label="View comment"
          >
            👁
          </button>


          ${
            commentExists
              ? `
                <span
                  class="comment-exists"
                  title="Comment available"
                  aria-label="Comment available"
                >
                  Y
                </span>
              `
              : ""
          }

        </div>

      </td>


      <td class="action-column">

        <button
          type="button"
          class="view-details-btn"
          data-action="view-details"
          data-id="${escapeHTML(
            String(
              lead.id ||
              ""
            )
          )}"
        >
          <span class="view-details-icon">
            ↗
          </span>

          <span>
            Details
          </span>
        </button>

      </td>

    </tr>
  `;

}


// =====================================================
// UPDATE STATISTICS
// =====================================================

function updateStatistics() {

  const total =
    allLeads.length;


  const newCount =
    countStatus(
      "new"
    );


  const contactedCount =
    countStatus(
      "contacted"
    );


  const closedCount =
    countStatus(
      "closed"
    );


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


// =====================================================
// COUNT STATUS
// =====================================================

function countStatus(
  status
) {

  return allLeads.filter(
    function (lead) {

      return normalizeStatus(
        lead.status
      ) === status;

    }
  ).length;

}


// =====================================================
// REFRESH LEADS
// =====================================================

async function refreshLeads() {

  await loadLeads();

}


// =====================================================
// RENDER EMPTY STATE
// =====================================================

function renderEmptyState(
  message
) {

  const tableBody =
    document.getElementById(
      "leadsTableBody"
    );


  const emptyState =
    document.getElementById(
      "emptyState"
    );


  if (tableBody) {

    tableBody.innerHTML = `
      <tr>
        <td
          colspan="10"
          class="loading-cell"
        >
          ${escapeHTML(
            message
          )}
        </td>
      </tr>
    `;

  }


  if (emptyState) {

    emptyState.hidden =
      true;

  }

}


// =====================================================
// STATUS DROPDOWNS
// =====================================================

function setupStatusDropdowns() {

  const statusFilter =
    document.getElementById(
      "statusFilter"
    );


  if (!statusFilter) {

    return;

  }


  const statuses = [
    "all",
    ...CRM_STATUSES
  ];


  statusFilter.innerHTML =
    statuses
      .map(
        function (status) {

          if (
            status ===
            "all"
          ) {

            return `
              <option value="all">
                All Status
              </option>
            `;

          }


          return `
            <option value="${escapeHTML(
              status
            )}">
              ${escapeHTML(
                STATUS_LABELS[
                  status
                ]
              )}
            </option>
          `;

        }
      )
      .join("");

}


// =====================================================
// SOURCE DROPDOWN
// =====================================================

function setupSourceDropdown() {

  const sourceElement =
    document.getElementById(
      "leadSource"
    );


  if (!sourceElement) {

    return;

  }


  // Only change select fields.
  // Existing text inputs are safely converted.

  if (
    sourceElement.tagName
      .toLowerCase() ===
    "input"
  ) {

    const select =
      document.createElement(
        "select"
      );


    select.id =
      sourceElement.id;


    select.name =
      sourceElement.name ||
      "source";


    select.className =
      sourceElement.className;


    LEAD_SOURCES.forEach(
      function (source) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          source;


        option.textContent =
          source;


        select.appendChild(
          option
        );

      }
    );


    sourceElement.replaceWith(
      select
    );

  }

}


// =====================================================
// CRM EVENT HANDLERS
// =====================================================

function setupCRMEvents() {

  // ---------------------------------------------
  // SEARCH
  // ---------------------------------------------

  const searchInput =
    document.getElementById(
      "searchInput"
    );


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        currentSearchTerm =
          searchInput.value ||
          "";


        applyLeadFilters();

      }
    );

  }


  // ---------------------------------------------
  // STATUS FILTER
  // ---------------------------------------------

  const statusFilter =
    document.getElementById(
      "statusFilter"
    );


  if (statusFilter) {

    statusFilter.addEventListener(
      "change",
      function () {

        currentStatusFilter =
          statusFilter.value ||
          "all";


        setActiveStatCard(
          currentStatusFilter
        );


        applyLeadFilters();

      }
    );

  }


  // ---------------------------------------------
  // PRIORITY FILTER
  // ---------------------------------------------
  // Hidden compatibility only.
  // Priority remains in database but not visible.

  const priorityFilter =
    document.getElementById(
      "priorityFilter"
    );


  if (priorityFilter) {

    priorityFilter.style.display =
      "none";

  }


  // ---------------------------------------------
  // STAT CARDS
  // ---------------------------------------------

  document
    .querySelectorAll(
      ".stat-card[data-status-filter]"
    )
    .forEach(
      function (card) {

        card.addEventListener(
          "click",
          function () {

            const filter =
              card.dataset
                .statusFilter ||
              "all";


            currentStatusFilter =
              filter;


            if (statusFilter) {

              statusFilter.value =
                filter;

            }


            setActiveStatCard(
              filter
            );


            applyLeadFilters();

          }
        );

      }
    );


  // ---------------------------------------------
  // REFRESH
  // ---------------------------------------------

  const refreshBtn =
    document.getElementById(
      "refreshBtn"
    );


  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      async function () {

        refreshBtn.disabled =
          true;


        const oldText =
          refreshBtn.textContent;


        refreshBtn.textContent =
          "Refreshing...";


        try {

          await refreshLeads();

        } finally {

          refreshBtn.disabled =
            false;


          refreshBtn.textContent =
            oldText ||
            "↻ Refresh";

        }

      }
    );

  }


  // ---------------------------------------------
  // TABLE ACTIONS
  // ---------------------------------------------

  const tableBody =
    document.getElementById(
      "leadsTableBody"
    );


  if (tableBody) {

    tableBody.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest(
            "button[data-action]"
          );


        if (!button) {

          return;

        }


        const action =
          button.dataset.action;


        const id =
          button.dataset.id;


        if (!id) {

          return;

        }


        if (
          action ===
          "view-details"
        ) {

          openLeadModal(
            id
          );

          return;

        }


        if (
          action ===
          "edit-comment"
        ) {

          editLeadComment(
            id
          );

          return;

        }


        if (
          action ===
          "view-comment"
        ) {

          viewLeadComment(
            id
          );

          return;

        }

      }
    );

  }


  // ---------------------------------------------
  // LOGOUT
  // ---------------------------------------------

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );


  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      async function () {

        await logoutCRM();

      }
    );

  }


  // ---------------------------------------------
  // ADD ENQUIRY
  // ---------------------------------------------

  const addBtn =
    document.getElementById(
      "addEnquiryBtn"
    );


  if (addBtn) {

    addBtn.addEventListener(
      "click",
      function () {

        openAddEnquiryModal();

      }
    );

  }

}


// =====================================================
// ACTIVE STAT CARD
// =====================================================

function setActiveStatCard(
  status
) {

  document
    .querySelectorAll(
      ".stat-card[data-status-filter]"
    )
    .forEach(
      function (card) {

        card.classList.toggle(
          "active",
          card.dataset
            .statusFilter ===
          status
        );

      }
    );

}


// =====================================================
// LOGOUT
// =====================================================

async function logoutCRM() {

  if (!supabaseClient) {

    return;

  }


  try {

    const {
      error
    } =
      await supabaseClient
        .auth
        .signOut();


    if (error) {

      console.error(
        "Logout error:",
        error
      );

      return;

    }


    window.location.href =
      "login.html";

  } catch (error) {

    console.error(
      "Logout failed:",
      error
    );

  }

}


// =====================================================
// COMMENT — VIEW
// =====================================================

function viewLeadComment(
  id
) {

  const lead =
    findLeadById(
      id
    );


  if (!lead) {

    return;

  }


  const comment =
    String(
      lead.internal_notes ||
      ""
    ).trim();


  if (!comment) {

    showCRMMessage(
      "No comment has been added for this enquiry.",
      "info"
    );

    return;

  }


  openSimpleCommentModal(
    lead,
    comment,
    false
  );

}


// =====================================================
// COMMENT — EDIT
// =====================================================

function editLeadComment(
  id
) {

  const lead =
    findLeadById(
      id
    );


  if (!lead) {

    return;

  }


  const comment =
    String(
      lead.internal_notes ||
      ""
    );


  openSimpleCommentModal(
    lead,
    comment,
    true
  );

}


// =====================================================
// SIMPLE COMMENT MODAL
// =====================================================

function openSimpleCommentModal(
  lead,
  comment,
  editable
) {

  let modal =
    document.getElementById(
      "commentQuickModal"
    );


  if (!modal) {

    modal =
      document.createElement(
        "div"
      );


    modal.id =
      "commentQuickModal";


    modal.className =
      "modal-overlay";


    modal.innerHTML = `
      <div
        class="quick-comment-card"
        role="dialog"
        aria-modal="true"
      >

        <div class="modal-header">

          <div>

            <div class="modal-kicker">
              ${editable
                ? "EDIT COMMENT"
                : "COMMENT"
              }
            </div>

            <h2>
              ${escapeHTML(
                lead.customer_name ||
                "Customer Enquiry"
              )}
            </h2>

          </div>

          <button
            type="button"
            class="close-modal"
            id="closeQuickComment"
            aria-label="Close"
          >
            ×
          </button>

        </div>

        <div class="quick-comment-body">

          <label>
            INTERNAL COMMENT
          </label>

          ${
            editable
              ? `
                <textarea
                  id="quickCommentText"
                  rows="6"
                  placeholder="Add internal comment..."
                ></textarea>
              `
              : `
                <div
                  id="quickCommentText"
                  class="quick-comment-view"
                ></div>
              `
          }

        </div>

        <div
          id="quickCommentMessage"
          class="form-message"
        ></div>

        <div class="modal-actions">

          <button
            type="button"
            class="cancel-btn"
            id="cancelQuickComment"
          >
            Close
          </button>

          ${
            editable
              ? `
                <button
                  type="button"
                  class="save-btn"
                  id="saveQuickComment"
                >
                  Save Comment
                </button>
              `
              : ""
          }

        </div>

      </div>
    `;


    document.body.appendChild(
      modal
    );


    const close =
      function () {

        modal.remove();

      };


    const closeButton =
      document.getElementById(
        "closeQuickComment"
      );


    const cancelButton =
      document.getElementById(
        "cancelQuickComment"
      );


    if (closeButton) {

      closeButton.addEventListener(
        "click",
        close
      );

    }


    if (cancelButton) {

      cancelButton.addEventListener(
        "click",
        close
      );

    }


    if (editable) {

      const saveButton =
        document.getElementById(
          "saveQuickComment"
        );


      if (saveButton) {

        saveButton.addEventListener(
          "click",
          async function () {

            await saveQuickComment(
              lead.id,
              modal
            );

          }
        );

      }

    }

  }


  const textarea =
    modal.querySelector(
      "#quickCommentText"
    );


  if (textarea) {

    if (
      textarea.tagName &&
      textarea.tagName
        .toLowerCase() ===
      "textarea"
    ) {

      textarea.value =
        comment;

    } else {

      textarea.textContent =
        comment;

    }

  }


  modal.hidden =
    false;


  modal.style.display =
    "flex";


  if (editable) {

    setTimeout(
      function () {

        const input =
          modal.querySelector(
            "textarea"
          );


        if (input) {

          input.focus();

        }

      },
      50
    );

  }

}


// =====================================================
// SAVE QUICK COMMENT
// =====================================================

async function saveQuickComment(
  id,
  modal
) {

  const textarea =
    modal.querySelector(
      "#quickCommentText"
    );


  const message =
    modal.querySelector(
      "#quickCommentMessage"
    );


  if (!textarea) {

    return;

  }


  const comment =
    textarea.value.trim();


  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "customer_enquiries"
        )
        .update({
          internal_notes:
            comment ||
            null
        })
        .eq(
          "id",
          id
        );


    if (error) {

      console.error(
        "Comment save error:",
        error
      );


      showInlineMessage(
        message,
        "Unable to save comment. Please try again.",
        "error"
      );


      return;

    }


    const lead =
      findLeadById(
        id
      );


    if (lead) {

      lead.internal_notes =
        comment;

    }


    updateStatistics();

    applyLeadFilters();


    showInlineMessage(
      message,
      "Comment saved successfully.",
      "success"
    );


    setTimeout(
      function () {

        if (modal) {

          modal.remove();

        }

      },
      700
    );

  } catch (error) {

    console.error(
      "Quick comment error:",
      error
    );


    showInlineMessage(
      message,
      "Unable to save comment.",
      "error"
    );

  }

}


// =====================================================
// FIND LEAD BY ID
// =====================================================

function findLeadById(
  id
) {

  return allLeads.find(
    function (lead) {

      return String(
        lead.id
      ) ===
      String(
        id
      );

    }
  );

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(
  value
) {

  if (!value) {

    return "—";

  }


  try {

    const date =
      new Date(
        value +
        (
          String(value)
            .length === 10
            ? "T00:00:00"
            : ""
        )
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return escapeHTML(
        String(
          value
        )
      );

    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  } catch (error) {

    return escapeHTML(
      String(
        value
      )
    );

  }

}


// =====================================================
// SET TEXT
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


// =====================================================
// ESCAPE HTML
// =====================================================

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


// =====================================================
// CRM MESSAGE
// =====================================================

function showCRMMessage(
  text,
  type
) {

  console.log(
    `[CRM ${type || "info"}]`,
    text
  );

}
// =====================================================
// SELECT MY VENUE — CRM
// crm.js
// BLOCK 3
// VIEW DETAILS MODAL + INLINE EDITING + SAVE
// =====================================================


// =====================================================
// OPEN LEAD DETAILS MODAL
// =====================================================

function openLeadModal(id) {

  const lead =
    findLeadById(id);

  if (!lead) {

    showCRMMessage(
      "Customer enquiry not found.",
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

    console.error(
      "leadModal element not found."
    );

    showCRMMessage(
      "View Details window is unavailable.",
      "error"
    );

    return;
  }

  populateLeadDetails(
    lead
  );

  modal.hidden =
    false;

  modal.style.display =
    "flex";

  document.body.classList.add(
    "modal-open"
  );

}


// =====================================================
// CLOSE LEAD MODAL
// =====================================================

function closeLeadModal() {

  const modal =
    document.getElementById(
      "leadModal"
    );

  if (modal) {

    modal.hidden =
      true;

    modal.style.display =
      "none";

  }

  currentLead =
    null;

  document.body.classList.remove(
    "modal-open"
  );

}


// =====================================================
// POPULATE DETAILS
// =====================================================

function populateLeadDetails(
  lead
) {

  if (!lead) {
    return;
  }


  // ---------------------------------------------------
  // CUSTOMER NAME
  // NON EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailCustomerName",
    lead.customer_name
  );


  // ---------------------------------------------------
  // PHONE
  // NON EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailPhone",
    lead.mobile
  );


  // ---------------------------------------------------
  // EMAIL
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailEmail",
    lead.email
  );


  // ---------------------------------------------------
  // SOURCE
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailSource",
    lead.source
  );


  // ---------------------------------------------------
  // EVENT TYPE
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailEventType",
    lead.occasion
  );


  // ---------------------------------------------------
  // VENUE / LOCATION
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailVenue",
    lead.location
  );


  // ---------------------------------------------------
  // EVENT DATE
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailEventDate",
    lead.event_date
  );


  // ---------------------------------------------------
  // GUESTS
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailGuests",
    lead.guests
  );


  // ---------------------------------------------------
  // STATUS
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailStatus",
    normalizeStatus(
      lead.status
    )
  );


  // ---------------------------------------------------
  // PRIORITY
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailPriority",
    lead.priority ||
    "normal"
  );


  // ---------------------------------------------------
  // FOLLOW UP
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailFollowUp",
    lead.follow_up_at
      ? formatDateTimeInput(
          lead.follow_up_at
        )
      : ""
  );


  // ---------------------------------------------------
  // ASSIGNED TO
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailAssignedTo",
    lead.assigned_to
  );


  // ---------------------------------------------------
  // CUSTOMER MESSAGE
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailMessage",
    lead.requirements
  );


  // ---------------------------------------------------
  // INTERNAL REMARKS
  // EDITABLE
  // ---------------------------------------------------

  setDetailValue(
    "detailRemarks",
    lead.internal_notes
  );


  setupDetailFieldEditing(
    lead
  );


  setupDetailContactActions(
    lead
  );

}


// =====================================================
// SET DETAIL VALUE
// =====================================================

function setDetailValue(
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


  const safe =
    value === null ||
    value === undefined
      ? ""
      : String(value);


  if (
    element.tagName ===
      "INPUT" ||
    element.tagName ===
      "TEXTAREA" ||
    element.tagName ===
      "SELECT"
  ) {

    element.value =
      safe;

  } else {

    element.textContent =
      safe ||
      "—";

  }

}


// =====================================================
// DETAIL FIELD EDITING
//
// IMPORTANT:
//
// Customer Name = locked
// Phone = locked
//
// Everything else = editable
//
// There is NO pencil icon.
// The field looks normal.
// Clicking the field activates editing.
// =====================================================

function setupDetailFieldEditing(
  lead
) {

  const editableFields = [

    {
      id:
        "detailEmail",

      column:
        "email",

      type:
        "text"
    },

    {
      id:
        "detailSource",

      column:
        "source",

      type:
        "select",

      options:
        LEAD_SOURCES
    },

    {
      id:
        "detailEventType",

      column:
        "occasion",

      type:
        "text"
    },

    {
      id:
        "detailVenue",

      column:
        "location",

      type:
        "text"
    },

    {
      id:
        "detailEventDate",

      column:
        "event_date",

      type:
        "date"
    },

    {
      id:
        "detailGuests",

      column:
        "guests",

      type:
        "number"
    },

    {
      id:
        "detailStatus",

      column:
        "status",

      type:
        "select",

      options:
        CRM_STATUSES
    },

    {
      id:
        "detailPriority",

      column:
        "priority",

      type:
        "select",

      options: [
        "normal",
        "low",
        "medium",
        "high"
      ]
    },

    {
      id:
        "detailFollowUp",

      column:
        "follow_up_at",

      type:
        "datetime-local"
    },

    {
      id:
        "detailAssignedTo",

      column:
        "assigned_to",

      type:
        "text"
    },

    {
      id:
        "detailMessage",

      column:
        "requirements",

      type:
        "textarea"
    },

    {
      id:
        "detailRemarks",

      column:
        "internal_notes",

      type:
        "textarea"
    }

  ];


  editableFields.forEach(
    function (config) {

      const element =
        document.getElementById(
          config.id
        );

      if (!element) {
        return;
      }


      // Remove previously attached
      // handlers by cloning.

      const clean =
        element.cloneNode(
          true
        );


      element.replaceWith(
        clean
      );


      clean.classList.add(
        "crm-detail-editable"
      );


      clean.dataset.crmColumn =
        config.column;


      clean.dataset.crmType =
        config.type;


      clean.dataset.crmLeadId =
        String(
          lead.id
        );


      if (
        config.options
      ) {

        clean.dataset.crmOptions =
          JSON.stringify(
            config.options
          );

      }


      clean.addEventListener(
        "click",
        function () {

          activateDetailField(
            clean,
            config,
            lead
          );

        }
      );


      clean.addEventListener(
        "focus",
        function () {

          activateDetailField(
            clean,
            config,
            lead
          );

        }
      );

    }
  );


  // ---------------------------------------------------
  // LOCK CUSTOMER NAME
  // ---------------------------------------------------

  const customerName =
    document.getElementById(
      "detailCustomerName"
    );

  if (customerName) {

    customerName.classList.add(
      "crm-detail-locked"
    );

    customerName.dataset.locked =
      "true";

  }


  // ---------------------------------------------------
  // LOCK PHONE
  // ---------------------------------------------------

  const phone =
    document.getElementById(
      "detailPhone"
    );

  if (phone) {

    phone.classList.add(
      "crm-detail-locked"
    );

    phone.dataset.locked =
      "true";

  }

}


// =====================================================
// ACTIVATE DETAIL FIELD
// =====================================================

function activateDetailField(
  element,
  config,
  lead
) {

  if (!element) {
    return;
  }


  if (
    element.dataset.editing ===
    "true"
  ) {

    return;

  }


  element.dataset.editing =
    "true";


  element.classList.add(
    "is-editing"
  );


  const original =
    lead[
      config.column
    ] ?? "";


  let editor;


  // ---------------------------------------------------
  // SELECT
  // ---------------------------------------------------

  if (
    config.type ===
    "select"
  ) {

    editor =
      document.createElement(
        "select"
      );


    const options =
      config.options ||
      [];


    options.forEach(
      function (option) {

        const optionElement =
          document.createElement(
            "option"
          );


        let value =
          option;

        let label =
          option;


        if (
          typeof option ===
          "object"
        ) {

          value =
            option.value;

          label =
            option.label;

        }


        optionElement.value =
          value;


        optionElement.textContent =
          label;


        if (
          String(value) ===
          String(original)
        ) {

          optionElement.selected =
            true;

        }


        editor.appendChild(
          optionElement
        );

      }
    );

  }


  // ---------------------------------------------------
  // TEXTAREA
  // ---------------------------------------------------

  else if (
    config.type ===
    "textarea"
  ) {

    editor =
      document.createElement(
        "textarea"
      );


    editor.value =
      String(
        original
      );


    editor.rows =
      4;

  }


  // ---------------------------------------------------
  // INPUT
  // ---------------------------------------------------

  else {

    editor =
      document.createElement(
        "input"
      );


    editor.type =
      config.type;


    if (
      config.type ===
      "datetime-local"
    ) {

      editor.value =
        original
          ? formatDateTimeInput(
              original
            )
          : "";

    }

    else {

      editor.value =
        String(
          original
        );

    }

  }


  editor.className =
    "crm-detail-editor";


  editor.dataset.originalValue =
    String(
      original
    );


  // ---------------------------------------------------
  // REPLACE DISPLAY FIELD
  // ---------------------------------------------------

  element.style.display =
    "none";


  element.parentNode.insertBefore(
    editor,
    element.nextSibling
  );


  setTimeout(
    function () {

      editor.focus();

      if (
        typeof editor.select ===
        "function" &&
        config.type !==
          "select" &&
        config.type !==
          "textarea"
      ) {

        editor.select();

      }

    },
    20
  );


  let finished =
    false;


  // ---------------------------------------------------
  // SAVE
  // ---------------------------------------------------

  async function save() {

    if (finished) {
      return;
    }


    finished =
      true;


    const newValue =
      editor.value;


    const oldValue =
      String(
        original
      );


    if (
      newValue ===
      oldValue
    ) {

      finishDetailEditor(
        element,
        editor
      );

      return;

    }


    await saveDetailField(
      lead.id,
      config.column,
      newValue,
      element,
      editor
    );

  }


  // ---------------------------------------------------
  // CANCEL
  // ---------------------------------------------------

  function cancel() {

    if (finished) {
      return;
    }


    finished =
      true;


    finishDetailEditor(
      element,
      editor
    );

  }


  // ---------------------------------------------------
  // KEYBOARD
  // ---------------------------------------------------

  editor.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Escape"
      ) {

        event.preventDefault();

        cancel();

        return;

      }


      if (
        event.key ===
        "Enter" &&
        config.type !==
          "textarea"
      ) {

        event.preventDefault();

        save();

      }

    }
  );


  // ---------------------------------------------------
  // SELECT CHANGE
  // ---------------------------------------------------

  if (
    config.type ===
    "select"
  ) {

    editor.addEventListener(
      "change",
      function () {

        save();

      }
    );

  }


  // ---------------------------------------------------
  // BLUR
  // ---------------------------------------------------

  editor.addEventListener(
    "blur",
    function () {

      setTimeout(
        function () {

          if (
            !finished
          ) {

            save();

          }

        },
        150
      );

    }
  );

}


// =====================================================
// FINISH DETAIL EDITOR
// =====================================================

function finishDetailEditor(
  element,
  editor
) {

  if (editor) {

    editor.remove();

  }


  if (element) {

    element.style.display =
      "";

    element.dataset.editing =
      "false";

    element.classList.remove(
      "is-editing"
    );

  }

}


// =====================================================
// SAVE DETAIL FIELD
// =====================================================

async function saveDetailField(
  leadId,
  column,
  value,
  displayElement,
  editor
) {

  if (!supabaseClient) {

    finishDetailEditor(
      displayElement,
      editor
    );

    return;

  }


  let databaseValue =
    value;


  // ---------------------------------------------------
  // NUMBER
  // ---------------------------------------------------

  if (
    column ===
    "guests"
  ) {

    databaseValue =
      value === ""
        ? null
        : Number(
            value
          );


    if (
      value !== "" &&
      Number.isNaN(
        databaseValue
      )
    ) {

      showCRMMessage(
        "Please enter a valid guest number.",
        "error"
      );


      finishDetailEditor(
        displayElement,
        editor
      );


      return;

    }

  }


  // ---------------------------------------------------
  // EMPTY VALUES
  // ---------------------------------------------------

  if (
    typeof databaseValue ===
      "string" &&
    databaseValue.trim() ===
      ""
  ) {

    databaseValue =
      null;

  }


  try {

    const updateData =
      {};


    updateData[
      column
    ] =
      databaseValue;


    const {
      data,
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
          leadId
        )
        .select()
        .single();


    if (error) {

      console.error(
        "Detail update error:",
        error
      );


      showCRMMessage(
        error.message ||
        "Unable to save changes.",
        "error"
      );


      finishDetailEditor(
        displayElement,
        editor
      );


      return;

    }


    // -------------------------------------------------
    // UPDATE LOCAL RECORD
    // -------------------------------------------------

    const index =
      allLeads.findIndex(
        function (item) {

          return String(
            item.id
          ) ===
          String(
            leadId
          );

        }
      );


    if (
      index !==
      -1
    ) {

      allLeads[index] =
        {
          ...allLeads[index],
          ...(data || updateData)
        };


      currentLead =
        allLeads[index];

    }


    // -------------------------------------------------
    // UPDATE DISPLAY
    // -------------------------------------------------

    finishDetailEditor(
      displayElement,
      editor
    );


    populateLeadDetails(
      findLeadById(
        leadId
      )
    );


    updateStatistics();

    applyLeadFilters();


    showCRMMessage(
      "Saved successfully.",
      "success"
    );


  } catch (error) {

    console.error(
      "Save detail field error:",
      error
    );


    finishDetailEditor(
      displayElement,
      editor
    );


    showCRMMessage(
      "Unable to save changes.",
      "error"
    );

  }

}


// =====================================================
// CONTACT ACTIONS
// =====================================================

function setupDetailContactActions(
  lead
) {

  const phoneActions =
    document.getElementById(
      "detailPhoneActions"
    );


  const emailActions =
    document.getElementById(
      "detailEmailActions"
    );


  // ---------------------------------------------------
  // PHONE
  // ---------------------------------------------------

  if (phoneActions) {

    phoneActions.innerHTML =
      "";


    if (
      lead.mobile
    ) {

      const call =
        document.createElement(
          "a"
        );


      call.href =
        "tel:" +
        String(
          lead.mobile
        );


      call.className =
        "crm-contact-link";


      call.textContent =
        "Call";


      phoneActions.appendChild(
        call
      );

    }

  }


  // ---------------------------------------------------
  // EMAIL
  // ---------------------------------------------------

  if (emailActions) {

    emailActions.innerHTML =
      "";


    if (
      lead.email
    ) {

      const email =
        document.createElement(
          "a"
        );


      email.href =
        "mailto:" +
        String(
          lead.email
        );


      email.className =
        "crm-contact-link";


      email.textContent =
        "Email";


      emailActions.appendChild(
        email
      );

    }

  }

}


// =====================================================
// FORMAT DATETIME FOR INPUT
// =====================================================

function formatDateTimeInput(
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


  const hours =
    String(
      date.getHours()
    )
      .padStart(
        2,
        "0"
      );


  const minutes =
    String(
      date.getMinutes()
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
    day +
    "T" +
    hours +
    ":" +
    minutes
  );

}


// =====================================================
// SAVE MODAL CHANGES BUTTON
// =====================================================
//
// The individual fields now save immediately when
// clicked and edited.
//
// This function is retained for compatibility with
// the existing dashboard HTML.
// =====================================================

async function saveModalChanges() {

  if (!currentLead) {

    return;

  }


  const modal =
    document.getElementById(
      "leadModal"
    );


  if (!modal) {

    return;

  }


  const fields = [

    {
      id:
        "detailEmail",

      column:
        "email"
    },

    {
      id:
        "detailSource",

      column:
        "source"
    },

    {
      id:
        "detailEventType",

      column:
        "occasion"
    },

    {
      id:
        "detailVenue",

      column:
        "location"
    },

    {
      id:
        "detailEventDate",

      column:
        "event_date"
    },

    {
      id:
        "detailGuests",

      column:
        "guests"
    },

    {
      id:
        "detailStatus",

      column:
        "status"
    },

    {
      id:
        "detailPriority",

      column:
        "priority"
    },

    {
      id:
        "detailFollowUp",

      column:
        "follow_up_at"
    },

    {
      id:
        "detailAssignedTo",

      column:
        "assigned_to"
    },

    {
      id:
        "detailMessage",

      column:
        "requirements"
    },

    {
      id:
        "detailRemarks",

      column:
        "internal_notes"
    }

  ];


  const updateData =
    {};


  fields.forEach(
    function (field) {

      const element =
        document.getElementById(
          field.id
        );


      if (!element) {
        return;
      }


      if (
        element.dataset.editing ===
        "true"
      ) {

        return;

      }


      let value =
        element.value;


      if (
        value ===
        undefined
      ) {

        value =
          element.textContent
            .trim();

      }


      if (
        field.column ===
        "guests"
      ) {

        value =
          value === ""
            ? null
            : Number(
                value
              );

      }


      updateData[
        field.column
      ] =
        value === ""
          ? null
          : value;

    }
  );


  try {

    const {
      data,
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
        )
        .select()
        .single();


    if (error) {

      console.error(
        "Modal save error:",
        error
      );


      showCRMMessage(
        error.message ||
        "Unable to save changes.",
        "error"
      );


      return;

    }


    updateLocalLeadRecord(
      data
    );


    populateLeadDetails(
      data
    );


    applyLeadFilters();

    updateStatistics();


    showCRMMessage(
      "Customer enquiry updated successfully.",
      "success"
    );


  } catch (error) {

    console.error(
      "Modal save failed:",
      error
    );


    showCRMMessage(
      "Unable to save customer enquiry.",
      "error"
    );

  }

}


// =====================================================
// UPDATE LOCAL RECORD
// =====================================================

function updateLocalLeadRecord(
  updatedLead
) {

  if (!updatedLead) {
    return;
  }


  const index =
    allLeads.findIndex(
      function (lead) {

        return String(
          lead.id
        ) ===
        String(
          updatedLead.id
        );

      }
    );


  if (
    index !==
    -1
  ) {

    allLeads[index] =
      {
        ...allLeads[index],
        ...updatedLead
      };

  }


  currentLead =
    {
      ...(currentLead || {}),
      ...updatedLead
    };

}


// =====================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// =====================================================

document.addEventListener(
  "click",
  function (event) {

    const modal =
      document.getElementById(
        "leadModal"
      );


    if (!modal) {
      return;
    }


    if (
      event.target ===
      modal
    ) {

      closeLeadModal();

    }

  }
);


// =====================================================
// ESC KEY — CLOSE MODALS
// =====================================================

document.addEventListener(
  "keydown",
  function (event) {

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


    if (
      leadModal &&
      !leadModal.hidden
    ) {

      closeLeadModal();

      return;

    }


    const commentModal =
      document.getElementById(
        "commentQuickModal"
      );


    if (
      commentModal
    ) {

      commentModal.remove();

    }

  }
);


// =====================================================
// ADD ENQUIRY MODAL
// =====================================================

function openAddEnquiryModal() {

  const modal =
    document.getElementById(
      "addEnquiryModal"
    );


  if (!modal) {

    showCRMMessage(
      "Add enquiry window is unavailable.",
      "error"
    );

    return;

  }


  const form =
    document.getElementById(
      "addEnquiryForm"
    );


  if (form) {

    form.reset();

  }


  modal.hidden =
    false;


  modal.style.display =
    "flex";


  document.body.classList.add(
    "modal-open"
  );

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

    modal.hidden =
      true;

    modal.style.display =
      "none";

  }


  document.body.classList.remove(
    "modal-open"
  );

}


// =====================================================
// SAVE NEW ENQUIRY
// =====================================================

async function saveNewEnquiry() {

  const form =
    document.getElementById(
      "addEnquiryForm"
    );


  if (!form) {

    return;

  }


  if (!supabaseClient) {

    showCRMMessage(
      "CRM connection unavailable.",
      "error"
    );

    return;

  }


  const formData =
    new FormData(
      form
    );


  const customerName =
    String(
      formData.get(
        "customer_name"
      ) ||
      ""
    ).trim();


  const mobile =
    String(
      formData.get(
        "mobile"
      ) ||
      ""
    ).trim();


  if (!customerName) {

    showCRMMessage(
      "Customer name is required.",
      "error"
    );

    return;

  }


  if (!mobile) {

    showCRMMessage(
      "Phone number is required.",
      "error"
    );

    return;

  }


  const enquiry = {

    customer_name:
      customerName,

    mobile:
      mobile,

    email:
      cleanFormValue(
        formData.get(
          "email"
        )
      ),

    source:
      cleanFormValue(
        formData.get(
          "source"
        )
      ) ||
      "Website",

    occasion:
      cleanFormValue(
        formData.get(
          "occasion"
        )
      ),

    event_date:
      cleanFormValue(
        formData.get(
          "event_date"
        )
      ),

    guests:
      formData.get(
        "guests"
      )
        ? Number(
            formData.get(
              "guests"
            )
          )
        : null,

    location:
      cleanFormValue(
        formData.get(
          "location"
        )
      ),

    status:
      "new",

    internal_notes:
      cleanFormValue(
        formData.get(
          "internal_notes"
        )
      )

  };


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "customer_enquiries"
        )
        .insert(
          enquiry
        )
        .select()
        .single();


    if (error) {

      console.error(
        "Create enquiry error:",
        error
      );


      showCRMMessage(
        error.message ||
        "Unable to create enquiry.",
        "error"
      );


      return;

    }


    allLeads.unshift(
      data
    );


    normalizeLeadData();

    updateStatistics();

    applyLeadFilters();

    closeAddEnquiryModal();


    showCRMMessage(
      "New enquiry added successfully.",
      "success"
    );


  } catch (error) {

    console.error(
      "Create enquiry failed:",
      error
    );


    showCRMMessage(
      "Unable to create enquiry.",
      "error"
    );

  }

}


// =====================================================
// CLEAN FORM VALUE
// =====================================================

function cleanFormValue(
  value
) {

  if (
    value ===
      null ||
    value ===
      undefined
  ) {

    return null;

  }


  const cleaned =
    String(
      value
    ).trim();


  return cleaned ||
    null;

}


// =====================================================
// ADD FORM EVENTS
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const form =
      document.getElementById(
        "addEnquiryForm"
      );


    if (form) {

      form.addEventListener(
        "submit",
        function (event) {

          event.preventDefault();

          saveNewEnquiry();

        }
      );

    }


    const closeAdd =
      document.getElementById(
        "cancelAddEnquiry"
      );


    if (closeAdd) {

      closeAdd.addEventListener(
        "click",
        closeAddEnquiryModal
      );

    }

  }
);


// =====================================================
// MODAL CLOSE BUTTONS
// =====================================================

document.addEventListener(
  "click",
  function (event) {

    const closeButton =
      event.target.closest(
        ".close-modal"
      );


    if (!closeButton) {
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
      leadModal.contains(
        closeButton
      )
    ) {

      closeLeadModal();

      return;

    }


    if (
      addModal &&
      addModal.contains(
        closeButton
      )
    ) {

      closeAddEnquiryModal();

    }

  }
);


// =====================================================
// SAFETY — NEVER ALLOW NAME / PHONE EDITING
// =====================================================

document.addEventListener(
  "click",
  function (event) {

    const target =
      event.target.closest(
        "#detailCustomerName, #detailPhone"
      );


    if (!target) {
      return;
    }


    event.preventDefault();


    target.blur();

  }
);


// =====================================================
// SAFETY — REMOVE OLD PENCIL EDIT BUTTONS
// =====================================================
//
// The corporate CRM uses clean clickable fields.
// No pencil icon is required for normal editing.
//
// This also removes any old inline pencil buttons
// left behind by previous CRM versions.
// =====================================================

function removeOldPencilButtons() {

  const selectors = [

    ".edit-field-btn",

    ".field-edit-btn",

    ".inline-edit-btn",

    ".pencil-btn",

    ".edit-pencil",

    ".crm-pencil",

    "[data-edit-field]",

    "[data-edit]"

  ];


  selectors.forEach(
    function (selector) {

      document
        .querySelectorAll(
          selector
        )
        .forEach(
          function (button) {

            if (
              button.closest(
                "#detailCustomerName"
              ) ||
              button.closest(
                "#detailPhone"
              )
            ) {

              return;

            }


            button.remove();

          }
        );

    }
  );

}


document.addEventListener(
  "DOMContentLoaded",
  function () {

    removeOldPencilButtons();

  }
);


// =====================================================
// CORPORATE CLICK-TO-EDIT INDICATOR
// =====================================================

function setupCorporateFields() {

  document
    .querySelectorAll(
      ".crm-detail-editable"
    )
    .forEach(
      function (field) {

        field.setAttribute(
          "title",
          "Click to edit"
        );


        field.classList.add(
          "click-to-edit"
        );

      }
    );


  const lockedFields = [

    "detailCustomerName",
    "detailPhone"

  ];


  lockedFields.forEach(
    function (id) {

      const field =
        document.getElementById(
          id
        );


      if (field) {

        field.classList.add(
          "crm-detail-locked"
        );

        field.removeAttribute(
          "title"
        );

      }

    }
  );

}


// =====================================================
// RUN CORPORATE FIELD CLEANUP
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    setTimeout(
      function () {

        removeOldPencilButtons();

        setupCorporateFields();

      },
      300
    );

  }
);
// =====================================================
// SELECT MY VENUE — CRM
// crm.js
// BLOCK 4 / 4
// FINAL EVENT WIRING + COMPATIBILITY + CLEANUP
// =====================================================


// =====================================================
// FINAL CRM EVENT INITIALIZATION
// =====================================================

function initializeFinalCRMEvents() {

  // ---------------------------------------------------
  // VIEW DETAILS
  // ---------------------------------------------------

  document
    .querySelectorAll(
      ".view-details-btn"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function (event) {

            event.preventDefault();

            event.stopPropagation();

            const id =
              button.dataset.id;

            if (id) {

              openLeadModal(
                id
              );

            }

          }
        );

      }
    );


  // ---------------------------------------------------
  // CLOSE LEAD MODAL
  // ---------------------------------------------------

  const leadModal =
    document.getElementById(
      "leadModal"
    );


  if (leadModal) {

    leadModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          leadModal
        ) {

          closeLeadModal();

        }

      }
    );

  }


  // ---------------------------------------------------
  // CLOSE BUTTON
  // ---------------------------------------------------

  document
    .querySelectorAll(
      "#leadModal .close-modal"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            closeLeadModal();

          }
        );

      }
    );


  // ---------------------------------------------------
  // ADD ENQUIRY MODAL CLOSE
  // ---------------------------------------------------

  const addModal =
    document.getElementById(
      "addEnquiryModal"
    );


  if (addModal) {

    addModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          addModal
        ) {

          closeAddEnquiryModal();

        }

      }
    );

  }


  // ---------------------------------------------------
  // ADD ENQUIRY BUTTON
  // ---------------------------------------------------

  const addButton =
    document.getElementById(
      "addEnquiryBtn"
    );


  if (
    addButton &&
    !addButton.dataset
      .finalCrmBound
  ) {

    addButton.dataset
      .finalCrmBound =
      "true";


    addButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        openAddEnquiryModal();

      }
    );

  }


  // ---------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------

  const logoutButton =
    document.getElementById(
      "logoutBtn"
    );


  if (
    logoutButton &&
    !logoutButton.dataset
      .finalCrmBound
  ) {

    logoutButton.dataset
      .finalCrmBound =
      "true";


    logoutButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        logoutCRM();

      }
    );

  }


  // ---------------------------------------------------
  // REFRESH
  // ---------------------------------------------------

  const refreshButton =
    document.getElementById(
      "refreshBtn"
    );


  if (
    refreshButton &&
    !refreshButton.dataset
      .finalCrmBound
  ) {

    refreshButton.dataset
      .finalCrmBound =
      "true";


    refreshButton.addEventListener(
      "click",
      async function (event) {

        event.preventDefault();


        refreshButton.disabled =
          true;


        const originalText =
          refreshButton.textContent;


        refreshButton.textContent =
          "Refreshing...";


        try {

          await loadLeads();

        }

        finally {

          refreshButton.disabled =
            false;


          refreshButton.textContent =
            originalText ||
            "Refresh";

        }

      }
    );

  }

}


// =====================================================
// CLEAN TABLE AFTER EVERY RENDER
// =====================================================
//
// This is intentionally called after rendering because
// the table rows are rebuilt dynamically.
// =====================================================

function cleanRenderedTable() {

  const table =
    document.getElementById(
      "leadsTableBody"
    );


  if (!table) {
    return;
  }


  // ---------------------------------------------------
  // REMOVE OLD PENCIL / EDIT ICONS
  // ---------------------------------------------------

  const oldEditors = [

    ".edit-pencil",

    ".pencil-icon",

    ".pencil-btn",

    ".edit-field-btn",

    ".field-edit-btn",

    ".inline-edit-btn",

    ".crm-pencil",

    ".table-edit-btn"

  ];


  oldEditors.forEach(
    function (selector) {

      table
        .querySelectorAll(
          selector
        )
        .forEach(
          function (element) {

            element.remove();

          }
        );

    }
  );


  // ---------------------------------------------------
  // CUSTOMER NAME
  // ---------------------------------------------------

  table
    .querySelectorAll(
      ".customer-cell"
    )
    .forEach(
      function (cell) {

        cell.classList.add(
          "crm-clean-cell"
        );

      }
    );


  // ---------------------------------------------------
  // PHONE
  // ---------------------------------------------------

  table
    .querySelectorAll(
      ".table-phone"
    )
    .forEach(
      function (cell) {

        cell.classList.add(
          "crm-locked-cell"
        );

      }
    );


  // ---------------------------------------------------
  // EMAIL
  // ---------------------------------------------------

  table
    .querySelectorAll(
      ".table-email"
    )
    .forEach(
      function (cell) {

        cell.classList.add(
          "crm-clickable-cell"
        );

      }
    );

}


// =====================================================
// CLEAN MODAL
// =====================================================

function cleanLeadModal() {

  const modal =
    document.getElementById(
      "leadModal"
    );


  if (!modal) {
    return;
  }


  // ---------------------------------------------------
  // REMOVE PENCIL BUTTONS
  // ---------------------------------------------------

  const selectors = [

    ".edit-pencil",

    ".pencil-icon",

    ".pencil-btn",

    ".edit-field-btn",

    ".field-edit-btn",

    ".inline-edit-btn",

    ".crm-pencil",

    "[data-edit-field]"

  ];


  selectors.forEach(
    function (selector) {

      modal
        .querySelectorAll(
          selector
        )
        .forEach(
          function (element) {

            element.remove();

          }
        );

    }
  );


  // ---------------------------------------------------
  // CUSTOMER NAME LOCK
  // ---------------------------------------------------

  const name =
    document.getElementById(
      "detailCustomerName"
    );


  if (name) {

    name.classList.add(
      "crm-detail-locked"
    );

    name.setAttribute(
      "readonly",
      "readonly"
    );

    name.setAttribute(
      "aria-readonly",
      "true"
    );

  }


  // ---------------------------------------------------
  // PHONE LOCK
  // ---------------------------------------------------

  const phone =
    document.getElementById(
      "detailPhone"
    );


  if (phone) {

    phone.classList.add(
      "crm-detail-locked"
    );

    phone.setAttribute(
      "readonly",
      "readonly"
    );

    phone.setAttribute(
      "aria-readonly",
      "true"
    );

  }


  // ---------------------------------------------------
  // ALL OTHER FIELDS
  // ---------------------------------------------------

  const editableIds = [

    "detailEmail",

    "detailSource",

    "detailEventType",

    "detailVenue",

    "detailEventDate",

    "detailGuests",

    "detailStatus",

    "detailPriority",

    "detailFollowUp",

    "detailAssignedTo",

    "detailMessage",

    "detailRemarks"

  ];


  editableIds.forEach(
    function (id) {

      const element =
        document.getElementById(
          id
        );


      if (!element) {
        return;
      }


      element.classList.add(
        "crm-detail-editable"
      );


      element.classList.add(
        "click-to-edit"
      );


      element.removeAttribute(
        "readonly"
      );

    }
  );

}


// =====================================================
// WRAP ORIGINAL TABLE RENDER
// =====================================================
//
// We preserve the existing rendering function while
// adding final corporate cleanup.
// =====================================================

const originalRenderLeadTable =
  renderLeadTable;


renderLeadTable =
  function () {

    originalRenderLeadTable();

    setTimeout(
      function () {

        cleanRenderedTable();

      },
      0
    );

  };


// =====================================================
// WRAP MODAL POPULATION
// =====================================================
//
// After details are populated, clean the modal and
// reconnect click-to-edit fields.
// =====================================================

const originalPopulateLeadDetails =
  populateLeadDetails;


populateLeadDetails =
  function (
    lead
  ) {

    originalPopulateLeadDetails(
      lead
    );


    setTimeout(
      function () {

        cleanLeadModal();

        setupCorporateFields();

      },
      0
    );

  };


// =====================================================
// GLOBAL TABLE EVENT DELEGATION
// =====================================================
//
// Handles dynamically-created rows.
// =====================================================

document.addEventListener(
  "click",
  function (event) {

    const viewButton =
      event.target.closest(
        "[data-action='view-details']"
      );


    if (
      viewButton
    ) {

      const id =
        viewButton.dataset.id;


      if (id) {

        event.preventDefault();

        event.stopPropagation();

        openLeadModal(
          id
        );

      }

      return;

    }


    const editComment =
      event.target.closest(
        "[data-action='edit-comment']"
      );


    if (
      editComment
    ) {

      const id =
        editComment.dataset.id;


      if (id) {

        event.preventDefault();

        event.stopPropagation();

        editLeadComment(
          id
        );

      }

      return;

    }


    const viewComment =
      event.target.closest(
        "[data-action='view-comment']"
      );


    if (
      viewComment
    ) {

      const id =
        viewComment.dataset.id;


      if (id) {

        event.preventDefault();

        event.stopPropagation();

        viewLeadComment(
          id
        );

      }

      return;

    }

  }
);


// =====================================================
// CLICK OUTSIDE QUICK COMMENT
// =====================================================

document.addEventListener(
  "click",
  function (event) {

    const modal =
      document.getElementById(
        "commentQuickModal"
      );


    if (
      !modal
    ) {

      return;

    }


    if (
      event.target ===
      modal
    ) {

      modal.remove();

    }

  }
);


// =====================================================
// INITIALIZE FINAL EVENTS
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    setTimeout(
      function () {

        initializeFinalCRMEvents();

        removeOldPencilButtons();

        cleanLeadModal();

      },
      400
    );

  }
);


// =====================================================
// MODAL BODY LOCK
// =====================================================

function lockCRMBody() {

  document.body.classList.add(
    "crm-modal-open"
  );

  document.body.style.overflow =
    "hidden";

}


function unlockCRMBody() {

  document.body.classList.remove(
    "crm-modal-open"
  );

  document.body.style.overflow =
    "";

}


// =====================================================
// OVERRIDE MODAL OPEN
// =====================================================

const crmOriginalOpenLeadModal =
  openLeadModal;


openLeadModal =
  function (
    id
  ) {

    crmOriginalOpenLeadModal(
      id
    );


    lockCRMBody();


    setTimeout(
      function () {

        cleanLeadModal();

      },
      50
    );

  };


// =====================================================
// OVERRIDE MODAL CLOSE
// =====================================================

const crmOriginalCloseLeadModal =
  closeLeadModal;


closeLeadModal =
  function () {

    crmOriginalCloseLeadModal();

    unlockCRMBody();

  };


// =====================================================
// OVERRIDE ADD MODAL OPEN
// =====================================================

const crmOriginalOpenAddModal =
  openAddEnquiryModal;


openAddEnquiryModal =
  function () {

    crmOriginalOpenAddModal();

    lockCRMBody();

  };


// =====================================================
// OVERRIDE ADD MODAL CLOSE
// =====================================================

const crmOriginalCloseAddModal =
  closeAddEnquiryModal;


closeAddEnquiryModal =
  function () {

    crmOriginalCloseAddModal();

    unlockCRMBody();

  };


// =====================================================
// HANDLE ENTER KEY ON SEARCH
// =====================================================

document.addEventListener(
  "keydown",
  function (event) {

    const search =
      document.getElementById(
        "searchInput"
      );


    if (
      event.key ===
      "Enter" &&
      document.activeElement ===
      search
    ) {

      event.preventDefault();

      currentSearchTerm =
        search.value ||
        "";

      applyLeadFilters();

    }

  }
);


// =====================================================
// FINAL SAFETY CHECK
// =====================================================

function crmFinalSafetyCheck() {

  // ---------------------------------------------------
  // NAME MUST NEVER BE EDITABLE
  // ---------------------------------------------------

  const name =
    document.getElementById(
      "detailCustomerName"
    );


  if (name) {

    name.setAttribute(
      "readonly",
      "readonly"
    );

    name.classList.add(
      "crm-detail-locked"
    );

  }


  // ---------------------------------------------------
  // PHONE MUST NEVER BE EDITABLE
  // ---------------------------------------------------

  const phone =
    document.getElementById(
      "detailPhone"
    );


  if (phone) {

    phone.setAttribute(
      "readonly",
      "readonly"
    );

    phone.classList.add(
      "crm-detail-locked"
    );

  }


  // ---------------------------------------------------
  // REMOVE ALL PENCIL ELEMENTS
  // ---------------------------------------------------

  document
    .querySelectorAll(
      ".edit-pencil, .pencil-icon, .pencil-btn, .edit-field-btn, .field-edit-btn, .inline-edit-btn, .crm-pencil"
    )
    .forEach(
      function (element) {

        element.remove();

      }
    );

}


// =====================================================
// FINAL SAFETY TIMER
// =====================================================

setTimeout(
  function () {

    crmFinalSafetyCheck();

  },
  1000
);


// =====================================================
// WINDOW EXPORTS
// =====================================================
//
// These make the CRM functions available to the HTML
// even if the dashboard uses inline onclick handlers.
// =====================================================

window.openLeadModal =
  openLeadModal;


window.closeLeadModal =
  closeLeadModal;


window.openAddEnquiryModal =
  openAddEnquiryModal;


window.closeAddEnquiryModal =
  closeAddEnquiryModal;


window.saveNewEnquiry =
  saveNewEnquiry;


window.saveModalChanges =
  saveModalChanges;


window.loadLeads =
  loadLeads;


window.refreshLeads =
  refreshLeads;


window.logoutCRM =
  logoutCRM;


window.editLeadComment =
  editLeadComment;


window.viewLeadComment =
  viewLeadComment;


// =====================================================
// CRM READY
// =====================================================

console.log(
  "Select My Venue CRM — Final JavaScript loaded."
);

console.log(
  "Customer Name: LOCKED"
);

console.log(
  "Phone Number: LOCKED"
);

console.log(
  "Other fields: CLICK TO EDIT"
);

console.log(
  "Pencil buttons: REMOVED"
);

console.log(
  "View Details: ENABLED"
);
