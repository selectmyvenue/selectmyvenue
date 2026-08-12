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
        console.error("Supabase library not loaded.");

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
        setTimeout(() => {

            toast.style.opacity =
                "0";

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
                        <div>⌕</div>
                        <strong>No enquiries found</strong>
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
                    "text"
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


    editor.style.width =
        "100%";

    editor.style.maxWidth =
        "100%";

    editor.style.minWidth =
        "0";

    editor.style.boxSizing =
        "border-box";

    editor.style.margin =
        "0";

    editor.style.display =
        "block";

    editor.style.height =
        "34px";


    display.replaceWith(
        editor
    );

    editor.focus();


    if (
        editor.tagName === "INPUT" &&
        editor.type !== "date" &&
        editor.type !== "number"
    ) {

        try {
            editor.select();
        }

        catch (e) {}
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

        const newValue =
            editor.value;


        if (
            save &&
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

        restoreInlineDisplay(
            element,
            lead,
            field
        );
    }


    if (
        editor.tagName ===
        "SELECT"
    ) {

        editor.addEventListener(
            "change",
            () => {

                finish(true);

            }
        );

        editor.addEventListener(
            "blur",
            () => {

                setTimeout(
                    () => finish(true),
                    100
                );

            }
        );
    }

    else {

        editor.addEventListener(
            "blur",
            () => {

                setTimeout(
                    () => finish(true),
                    100
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
}


/* =========================================================
   STATUS EDIT
========================================================= */

function startStatusEdit(element) {

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

    const originalValue =
        lead.status ||
        "new";

    const select =
        createSelectEditor(
            getStatusOptions(),
            originalValue
        );

    select.classList.add(
        "crm-status-editor"
    );

    element.classList.add(
        "editing"
    );

    element.innerHTML = "";

    element.appendChild(
        select
    );

    select.focus();


    let finished =
        false;


    async function finish(
        save = true
    ) {

        if (finished) {
            return;
        }

        finished = true;

        const newValue =
            select.value;


        if (
            save &&
            newValue !==
                originalValue
        ) {

            await saveInlineField(
                leadId,
                "status",
                newValue
            );

            return;
        }

        refreshLeadRow(
            leadId
        );
    }


    select.addEventListener(
        "change",
        () => {

            finish(true);

        }
    );


    select.addEventListener(
        "blur",
        () => {

            setTimeout(
                () => finish(true),
                100
            );

        }
    );


    select.addEventListener(
        "keydown",
        event => {

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
                String(option.value) ===
                String(selectedValue)
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
        return;
    }

    const oldValue =
        lead[field] ?? "";


    const allowedFields = [

        "email",
        "source",
        "occasion",
        "event_date",
        "guests",
        "location",
        "status"

    ];


    if (
        !allowedFields.includes(
            field
        )
    ) {

        showToast(
            "This field cannot be edited here.",
            "error"
        );

        refreshLeadRow(
            leadId
        );

        return;
    }


    let value =
        newValue;


    if (
        value === ""
    ) {
        value = null;
    }


    if (
        field === "guests" &&
        value !== null
    ) {

        value =
            Number(value);
    }


    if (
        field === "status" &&
        value === null
    ) {

        value =
            "new";
    }


    const updateData = {};

    updateData[field] =
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
                .select("*")
                .single();


        if (error) {

            console.error(
                "Save error:",
                error
            );

            lead[field] =
                oldValue;

            refreshLeadRow(
                leadId
            );

            showToast(
                error.message ||
                "Unable to save change.",
                "error"
            );

            return;
        }


        Object.assign(
            lead,
            data ||
            updateData
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


        showToast(
            "Saved successfully."
        );

    }

    catch (error) {

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

    let value =
        lead[field];


    if (
        field === "event_date"
    ) {

        value =
            value
                ? formatDate(value)
                : "—";
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
}


/* =========================================================
   REFRESH ONE ROW
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
            "tr[data-lead-id]"
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
   POPULATE MODAL
========================================================= */

function populateLeadModal(
    lead
) {

    setText(
        "#detailCustomerName",
        lead.customer_name ||
        "—"
    );

    setText(
        "#detailPhone",
        lead.mobile ||
        "—"
    );


    setControl(
        "#detailEmail",
        lead.email ||
        ""
    );


    setControl(
        "#detailSource",
        lead.source ||
        ""
    );


    setControl(
        "#detailEventType",
        lead.occasion ||
        ""
    );


    setControl(
        "#detailVenue",
        lead.location ||
        ""
    );


    setControl(
        "#detailEventDate",
        lead.event_date ||
        ""
    );


    setControl(
        "#detailGuests",
        lead.guests ??
        ""
    );


    setControl(
        "#detailStatus",
        lead.status ||
        "new"
    );


    setControl(
        "#detailFollowUp",
        convertDateTimeLocal(
            lead.follow_up_at
        )
    );


    setControl(
        "#detailAssignedTo",
        lead.assigned_to ||
        ""
    );


    setControl(
        "#detailMessage",
        lead.requirements ||
        ""
    );


    setControl(
        "#detailRemarks",
        lead.internal_notes ||
        ""
    );
}


/* =========================================================
   TEXT HELPER
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
        safeValue(value) ||
        "—";
}


/* =========================================================
   CONTROL HELPER
========================================================= */

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


/* =========================================================
   DATE LOCAL
========================================================= */

function convertDateTimeLocal(
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

    const pad =
        number =>
            String(number)
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


    const updateData = {

        email:
            getValue(
                "#detailEmail"
            ) || null,

        source:
            getValue(
                "#detailSource"
            ) || null,

        occasion:
            getValue(
                "#detailEventType"
            ) || null,

        location:
            getValue(
                "#detailVenue"
            ) || null,

        event_date:
            getValue(
                "#detailEventDate"
            ) || null,

        guests:
            getNumberValue(
                "#detailGuests"
            ),

        status:
            getValue(
                "#detailStatus"
            ) ||
            "new",

        follow_up_at:
            getValue(
                "#detailFollowUp"
            ) || null,

        internal_notes:
            getValue(
                "#detailRemarks"
            ) || null,

        requirements:
            getValue(
                "#detailMessage"
            ) || null
    };


    const assigned =
        getValue(
            "#detailAssignedTo"
        );


    if (
        assigned &&
        isUUID(assigned)
    ) {

        updateData.assigned_to =
            assigned;
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
                    leadId
                )
                .select("*")
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
            currentLead,
            data ||
            updateData
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
                data ||
                updateData
            );

            currentLead =
                allLeads[index];
        }


        applyFilters();

        updateStats();

        populateLeadModal(
            currentLead
        );


        showToast(
            "Changes saved successfully."
        );

    }

    catch (error) {

        console.error(
            error
        );

        showToast(
            "Unable to save changes.",
            "error"
        );
    }

    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Changes";
        }
    }
}


/* =========================================================
   GET VALUE
========================================================= */

function getValue(
    selector
) {

    const element =
        document.querySelector(
            selector
        );

    if (!element) {
        return "";
    }

    return safeValue(
        element.value
    ).trim();
}


function getNumberValue(
    selector
) {

    const value =
        getValue(
            selector
        );

    if (value === "") {
        return null;
    }

    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? number
        : null;
}


/* =========================================================
   UUID CHECK
========================================================= */

function isUUID(value) {

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(value);
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
   CLOSE ADD MODAL
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


    /* =====================================================
       DIRECT MAPPING TO REAL DATABASE COLUMNS
    ===================================================== */

    const data = {

        customer_name:
            safeValue(
                formData.get(
                    "customer_name"
                )
            ).trim(),

        mobile:
            safeValue(
                formData.get(
                    "mobile"
                )
            ).trim(),

        email:
            safeValue(
                formData.get(
                    "email"
                )
            ).trim() ||
            null,

        source:
            safeValue(
                formData.get(
                    "source"
                )
            ).trim() ||
            null,

        occasion:
            safeValue(
                formData.get(
                    "occasion"
                )
            ).trim() ||
            null,

        location:
            safeValue(
                formData.get(
                    "location"
                )
            ).trim() ||
            null,

        event_date:
            safeValue(
                formData.get(
                    "event_date"
                )
            ).trim() ||
            null,

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

        status:
            safeValue(
                formData.get(
                    "status"
                )
            ).trim() ||
            "new",

        follow_up_at:
            safeValue(
                formData.get(
                    "follow_up_at"
                )
            ).trim() ||
            null,

        requirements:
            safeValue(
                formData.get(
                    "requirements"
                )
            ).trim() ||
            null,

        internal_notes:
            safeValue(
                formData.get(
                    "internal_notes"
                )
            ).trim() ||
            null
    };


    /* =====================================================
       ASSIGNED TO
       Only send if UUID is provided.
    ===================================================== */

    const assigned =
        safeValue(
            formData.get(
                "assigned_to"
            )
        ).trim();


    if (
        assigned &&
        isUUID(assigned)
    ) {

        data.assigned_to =
            assigned;
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
                .insert([
                    data
                ])
                .select("*")
                .single();


        if (error) {

            console.error(
                "Create error:",
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

    }

    catch (error) {

        console.error(
            error
        );

        showToast(
            "Unable to add enquiry.",
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
                        "converted"
                );
            }
        ).length;


    setStat(
        "#totalCount",
        total
    );

    setStat(
        "#newCount",
        newCount
    );

    setStat(
        "#contactedCount",
        contactedCount
    );

    setStat(
        "#closedCount",
        closedCount
    );
}


function setStat(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );

    if (element) {
        element.textContent =
            value;
    }
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
   STAT CARDS
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
                        card.dataset.statusFilter;

                    currentStatusFilter =
                        filter ||
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


            /* SAVE MODAL */

            const save =
                event.target.closest(
                    "#saveLeadBtn"
                );

            if (save) {

                saveModalChanges();

                return;
            }

        }
    );


    /* LEAD MODAL BACKDROP */

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


    /* ADD MODAL BACKDROP */

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


function normalizeStatusClass(
    status
) {

    return String(
        status ||
        "new"
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
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
   STATUS OPTIONS

   DATABASE VALUES MUST MATCH SQL CONSTRAINT
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

}

else {

    initializeCRM();
}


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.crm = {

    loadEnquiries,

    openLeadModal,

    closeLeadModal,

    openAddEnquiryModal,

    closeAddEnquiryModal,

    saveModalChanges,

    logoutCRM,

    startInlineEdit,

    openCommentEditor,

    viewComment
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
