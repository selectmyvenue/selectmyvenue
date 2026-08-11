/* =========================================================
   SELECT MY VENUE — CRM
   crm.js
   PREMIUM EMPLOYEE CRM
   SUPABASE + AUTH + INLINE EDIT + MODALS
========================================================= */

/* =========================================================
   SUPABASE CONFIG
========================================================= */

const CRM_SUPABASE_URL =
    "https://uajqwyoqbbswkfiwosyw.supabase.co";

const CRM_SUPABASE_ANON_KEY =
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

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function safeValue(value) {

    return (
        value === null ||
        value === undefined
    )
        ? ""
        : String(value);
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
            document.createElement(
                "div"
            );

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
            data: {
                session
            },
            error
        } =
            await client.auth.getSession();

        if (error) {

            console.error(
                "Auth error:",
                error
            );

            showToast(
                "Unable to check login session.",
                "error"
            );

            return null;
        }

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

    const staffNameElement =
        document.getElementById(
            "staffName"
        ) ||
        document.querySelector(
            ".staff-name"
        );

    if (!staffNameElement) {
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

    staffNameElement.textContent =
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
            <td
                colspan="11"
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
                colspan="11"
                class="loading-cell"
            >
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
            (lead) => {

                const searchableText = [

                    lead.name,
                    lead.customer_name,
                    lead.phone,
                    lead.mobile,
                    lead.email,
                    lead.location,
                    lead.city,
                    lead.venue,
                    lead.event_type,
                    lead.event,
                    lead.message,
                    lead.remarks

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );

                const leadStatus =
                    String(
                        lead.status ||
                        "new"
                    )
                        .toLowerCase()
                        .trim();

                const leadPriority =
                    String(
                        lead.priority ||
                        "medium"
                    )
                        .toLowerCase()
                        .trim();

                const matchesStatus =
                    currentStatusFilter ===
                        "all" ||
                    leadStatus ===
                        currentStatusFilter;

                const matchesPriority =
                    currentPriorityFilter ===
                        "all" ||
                    leadPriority ===
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
        );

    if (!tbody) {

        console.warn(
            "CRM table body not found."
        );

        return;
    }

    if (!filteredLeads.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="11">

                    <div class="empty-state">

                        <div class="empty-icon">
                            ⌕
                        </div>

                        <h3>
                            No enquiries found
                        </h3>

                        <p>
                            There are no customer enquiries
                            matching your filters.
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
                lead =>
                    createLeadRow(lead)
            )
            .join("");
}


/* =========================================================
   CREATE LEAD ROW
========================================================= */

function createLeadRow(lead) {

    const id =
        safeValue(lead.id);

    const name =
        lead.name ||
        lead.customer_name ||
        "Unknown Customer";

    const phone =
        lead.phone ||
        lead.mobile ||
        lead.contact_number ||
        "—";

    const eventType =
        lead.event_type ||
        lead.event ||
        "—";

    const venue =
        lead.venue ||
        lead.venue_name ||
        "—";

    const eventDate =
        lead.event_date ||
        lead.date ||
        "";

    const guests =
        lead.guests ??
        lead.guest_count ??
        lead.number_of_guests ??
        "";

    const status =
        lead.status ||
        "new";

    const priority =
        lead.priority ||
        "medium";

    const followUp =
        lead.follow_up_at ||
        lead.followup_at ||
        "";

    const remarks =
        lead.remarks ||
        lead.internal_notes ||
        lead.notes ||
        "—";

    return `
        <tr
            data-lead-id="${escapeHTML(id)}"
        >

            <!-- CUSTOMER -->

            <td>

                <strong>
                    ${escapeHTML(name)}
                </strong>

                ${
                    lead.email
                        ? `
                            <small>
                                ${escapeHTML(
                                    lead.email
                                )}
                            </small>
                          `
                        : ""
                }

            </td>


            <!-- PHONE -->

            <td>

                ${
                    phone !== "—"
                        ? `
                            <a
                                href="tel:${escapeHTML(
                                    phone
                                )}"
                                class="phone-link"
                            >
                                ${escapeHTML(phone)}
                            </a>
                          `
                        : "—"
                }

            </td>


            <!-- EVENT -->

            <td>

                ${createInlineField(
                    lead,
                    "event_type",
                    eventType,
                    "select",
                    getEventOptions()
                )}

            </td>


            <!-- VENUE -->

            <td>

                ${createInlineField(
                    lead,
                    "venue",
                    venue,
                    "text"
                )}

            </td>


            <!-- EVENT DATE -->

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


            <!-- GUESTS -->

            <td>

                ${createInlineField(
                    lead,
                    "guests",
                    guests || "—",
                    "number"
                )}

            </td>


            <!-- STATUS -->

            <td>

                ${createInlineField(
                    lead,
                    "status",
                    formatStatus(status),
                    "select",
                    getStatusOptions()
                )}

            </td>


            <!-- PRIORITY -->

            <td>

                ${createInlineField(
                    lead,
                    "priority",
                    formatPriority(priority),
                    "select",
                    getPriorityOptions()
                )}

            </td>


            <!-- FOLLOW-UP -->

            <td>

                ${
                    followUp
                        ? `
                            <span class="follow-up-date">
                                ${escapeHTML(
                                    formatDateTime(
                                        followUp
                                    )
                                )}
                            </span>
                          `
                        : `
                            <span class="muted-value">
                                —
                            </span>
                          `
                }

            </td>


            <!-- REMARKS -->

            <td>

                <span
                    class="remarks-cell"
                    title="${escapeHTML(
                        remarks
                    )}"
                >
                    ${escapeHTML(
                        remarks
                    )}
                </span>

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
            data-editor-type="${escapeHTML(type)}"
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
   INLINE EDIT
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

    if (field === "status") {

        editor =
            createSelectEditor(
                getStatusOptions(),
                originalValue ||
                    "new"
            );

    } else if (
        field === "priority"
    ) {

        editor =
            createSelectEditor(
                getPriorityOptions(),
                originalValue ||
                    "medium"
            );

    } else if (
        field === "event_type"
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

    display.replaceWith(
        editor
    );

    const icon =
        element.querySelector(
            ".inline-edit-icon"
        );

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
            lead,
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
                120
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

    try {

        const updateData = {};

        updateData[field] =
            newValue === ""
                ? null
                : newValue;

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

            restoreRowField(
                leadId,
                field,
                oldValue
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
        icon.textContent = "✎";
    }
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
   RESTORE ROW FIELD
========================================================= */

function restoreRowField(
    leadId,
    field,
    oldValue
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

    lead[field] =
        oldValue;

    refreshLeadRow(
        leadId
    );
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

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   POPULATE LEAD MODAL
========================================================= */

function populateLeadModal(
    lead
) {

    setModalText(
        [
            "#detailCustomerName",
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
            "#detailPhone",
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
            "#detailEmail",
            "#modalEmail",
            "#leadEmail",
            "[data-modal='email']"
        ],
        lead.email ||
        "—"
    );

    setModalText(
        [
            "#detailSource",
            "#modalSource",
            "#leadSource",
            "[data-modal='source']"
        ],
        lead.source ||
        "—"
    );

    setModalControl(
        [
            "#detailEventType",
            "#modalEventType",
            "#leadEventType"
        ],
        lead.event_type ||
        lead.event ||
        ""
    );

    setModalControl(
        [
            "#detailVenue",
            "#modalVenue",
            "#leadVenue"
        ],
        lead.venue ||
        lead.venue_name ||
        ""
    );

    setModalControl(
        [
            "#detailEventDate",
            "#modalEventDate",
            "#leadEventDate"
        ],
        normalizeDateInput(
            lead.event_date ||
            lead.date
        )
    );

    setModalControl(
        [
            "#detailGuests",
            "#modalGuests",
            "#leadGuests"
        ],
        lead.guests ??
        lead.guest_count ??
        lead.number_of_guests ??
        ""
    );

    setModalControl(
        [
            "#detailStatus",
            "#modalStatus",
            "#leadStatus"
        ],
        lead.status ||
        "New"
    );

    setModalControl(
        [
            "#detailPriority",
            "#modalPriority",
            "#leadPriority"
        ],
        lead.priority ||
        "Medium"
    );

    setModalControl(
        [
            "#detailFollowUp",
            "#modalFollowUp",
            "#leadFollowUp"
        ],
        normalizeDateTimeInput(
            lead.follow_up_at ||
            lead.followup_at
        )
    );

    setModalControl(
        [
            "#detailAssignedTo",
            "#modalAssignedTo",
            "#leadAssignedTo"
        ],
        lead.assigned_to ||
        ""
    );

    setModalText(
        [
            "#detailMessage",
            "#modalMessage",
            "#leadMessage",
            "[data-modal='message']"
        ],
        lead.message ||
        lead.enquiry ||
        lead.requirements ||
        "No customer message."
    );

    setModalControl(
        [
            "#detailRemarks",
            "#modalNotes",
            "#leadNotes",
            "[data-control='internal_notes']"
        ],
        lead.remarks ||
        lead.internal_notes ||
        lead.notes ||
        ""
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
        const selector of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );

        if (element) {

            element.textContent =
                safeValue(
                    value
                ) || "—";

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
        const selector of selectors
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

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

    currentLead =
        null;
}


/* =========================================================
   MODAL BACKDROP
========================================================= */

function handleModalBackdropClick(
    event
) {

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

    const updateData = {};

    const eventType =
        getControlValue([
            "#detailEventType",
            "#modalEventType",
            "#leadEventType"
        ]);

    const venue =
        getControlValue([
            "#detailVenue",
            "#modalVenue",
            "#leadVenue"
        ]);

    const eventDate =
        getControlValue([
            "#detailEventDate",
            "#modalEventDate",
            "#leadEventDate"
        ]);

    const guests =
        getControlValue([
            "#detailGuests",
            "#modalGuests",
            "#leadGuests"
        ]);

    const status =
        getControlValue([
            "#detailStatus",
            "#modalStatus",
            "#leadStatus"
        ]);

    const priority =
        getControlValue([
            "#detailPriority",
            "#modalPriority",
            "#leadPriority"
        ]);

    const followUp =
        getControlValue([
            "#detailFollowUp",
            "#modalFollowUp",
            "#leadFollowUp"
        ]);

    const assignedTo =
        getControlValue([
            "#detailAssignedTo",
            "#modalAssignedTo",
            "#leadAssignedTo"
        ]);

    const remarks =
        getControlValue([
            "#detailRemarks",
            "#modalNotes",
            "#leadNotes"
        ]);

    if (
        eventType !==
        undefined
    ) {
        updateData.event_type =
            eventType || null;
    }

    if (
        venue !==
        undefined
    ) {
        updateData.venue =
            venue || null;
    }

    if (
        eventDate !==
        undefined
    ) {
        updateData.event_date =
            eventDate || null;
    }

    if (
        guests !==
        undefined
    ) {
        updateData.guests =
            guests === ""
                ? null
                : Number(guests);
    }

    if (
        status !==
        undefined
    ) {
        updateData.status =
            status ||
            "New";
    }

    if (
        priority !==
        undefined
    ) {
        updateData.priority =
            priority ||
            "Medium";
    }

    if (
        followUp !==
        undefined
    ) {
        updateData.follow_up_at =
            followUp || null;
    }

    if (
        assignedTo !==
        undefined
    ) {
        updateData.assigned_to =
            assignedTo || null;
    }

    if (
        remarks !==
        undefined
    ) {
        updateData.remarks =
            remarks || null;
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

        if (
            index !== -1
        ) {

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
        const selector of selectors
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
        lead.phone ||
        lead.mobile ||
        lead.contact_number;

    const email =
        lead.email;

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
            phone
                ? `
                    <a
                        href="tel:${escapeHTML(
                            phone
                        )}"
                    >
                        Call
                    </a>

                    <a
                        href="https://wa.me/${String(
                            phone
                        ).replace(
                            /\D/g,
                            ""
                        )}"
                        target="_blank"
                        rel="noopener"
                    >
                        WhatsApp
                    </a>
                  `
                : "";
    }

    if (emailActions) {

        emailActions.innerHTML =
            email
                ? `
                    <a
                        href="mailto:${escapeHTML(
                            email
                        )}"
                    >
                        Email
                    </a>
                  `
                : "";
    }

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
                "noopener";

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

    modal.setAttribute(
        "aria-hidden",
        "false"
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

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";
}


/* =========================================================
   CREATE ENQUIRY
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
            "#addEnquiryForm"
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

    if (!data.customer_name) {

        showToast(
            "Customer name is required.",
            "error"
        );

        return;
    }

    if (!data.phone) {

        showToast(
            "Phone number is required.",
            "error"
        );

        return;
    }

    if (!data.status) {
        data.status =
            "New";
    }

    if (!data.priority) {
        data.priority =
            "Medium";
    }

    if (
        data.guests !==
        undefined &&
        data.guests !== ""
    ) {
        data.guests =
            Number(
                data.guests
            );
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


    const totalElement =
        document.getElementById(
            "totalCount"
        );

    const newElement =
        document.getElementById(
            "newCount"
        );

    const contactedElement =
        document.getElementById(
            "contactedCount"
        );

    const closedElement =
        document.getElementById(
            "closedCount"
        );


    if (totalElement) {
        totalElement.textContent =
            total;
    }

    if (newElement) {
        newElement.textContent =
            newCount;
    }

    if (contactedElement) {
        contactedElement.textContent =
            contactedCount;
    }

    if (closedElement) {
        closedElement.textContent =
            closedCount;
    }


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
        const selector of selectors
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
   STAT CARD FILTERS
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

                    const status =
                        card.dataset
                            .statusFilter;

                    currentStatusFilter =
                        status
                            ? status.toLowerCase()
                            : "all";

                    const statusSelect =
                        document.getElementById(
                            "statusFilter"
                        );

                    if (
                        statusSelect
                    ) {

                        statusSelect.value =
                            status ===
                                "all"
                                ? "all"
                                : status;
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

    const value =
        String(status)
            .replace(
                /[-_]/g,
                " "
            )
            .trim();

    return value.replace(
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
        return "Medium";
    }

    const value =
        String(priority)
            .replace(
                /[-_]/g,
                " "
            )
            .trim();

    return value.replace(
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
   FORMAT DATE/TIME
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
   DATE INPUT NORMALIZATION
========================================================= */

function normalizeDateInput(
    value
) {

    if (!value) {
        return "";
    }

    const stringValue =
        String(value);

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            stringValue
        )
    ) {
        return stringValue;
    }

    const date =
        new Date(
            stringValue
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
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");
}


/* =========================================================
   DATETIME INPUT NORMALIZATION
========================================================= */

function normalizeDateTimeInput(
    value
) {

    if (!value) {
        return "";
    }

    const stringValue =
        String(value);

    if (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
            stringValue
        )
    ) {
        return stringValue;
    }

    const date =
        new Date(
            stringValue
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

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


/* =========================================================
   STATUS OPTIONS
========================================================= */

function getStatusOptions() {

    return [
        {
            value: "New",
            label: "New"
        },
        {
            value: "Contacted",
            label: "Contacted"
        },
        {
            value: "Follow-up",
            label: "Follow-up"
        },
        {
            value: "Qualified",
            label: "Qualified"
        },
        {
            value: "Converted",
            label: "Converted"
        },
        {
            value: "Closed",
            label: "Closed"
        },
        {
            value: "Lost",
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
            value: "Low",
            label: "Low"
        },
        {
            value: "Medium",
            label: "Medium"
        },
        {
            value: "High",
            label: "High"
        },
        {
            value: "Urgent",
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

    const searchInput =
        document.getElementById(
            "searchInput"
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
   FILTER DROPDOWNS
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

                document
                    .querySelectorAll(
                        ".stat-card"
                    )
                    .forEach(
                        card =>
                            card.classList.remove(
                                "active"
                            )
                    );

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
   ADD ENQUIRY BUTTON
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
              SAVE LEAD MODAL
            */

            const saveButton =
                event.target.closest(
                    "#saveLeadBtn"
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
      Lead modal backdrop
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


    /*
      Add enquiry backdrop
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

            if (session) {

                updateStaffName(
                    session.user
                );
            }
        }
    );
}


/* =========================================================
   ADD ENQUIRY FORM
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
   LOGOUT LISTENER
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
   INITIALIZE CRM
========================================================= */

async function initializeCRM() {

    console.log(
        "Select My Venue CRM initializing..."
    );

    /*
      Wait until Supabase CDN script
      is available.
    */

    if (
        !window.supabase
    ) {

        setTimeout(
            initializeCRM,
            150
        );

        return;
    }

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
