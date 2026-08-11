/* =========================================================
SELECT MY VENUE — CRM
crm.js
PREMIUM EMPLOYEE CRM
SUPABASE + AUTH + LEADS
========================================================= */

/* =========================================================
SUPABASE CONFIGURATION
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

```
if (supabaseClient) {
    return supabaseClient;
}

if (
    !window.supabase ||
    !window.supabase.createClient
) {
    console.error(
        "Supabase library is not loaded."
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
        "Supabase credentials are missing."
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

    console.log(
        "Supabase client initialized successfully."
    );

    return supabaseClient;

} catch (error) {

    console.error(
        "Supabase initialization error:",
        error
    );

    showToast(
        "Unable to connect to Supabase.",
        "error"
    );

    return null;
}
```

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

```
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
```

}

function safeValue(value) {

```
return (
    value === null ||
    value === undefined
)
    ? ""
    : String(value);
```

}

/* =========================================================
TOAST
========================================================= */

function showToast(
message,
type = "success"
) {

```
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
```

}

/* =========================================================
AUTHENTICATION
========================================================= */

async function checkCRMAuth() {

```
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
```

}

/* =========================================================
STAFF NAME
========================================================= */

function updateStaffName(user) {

```
if (!user) {
    return;
}

const element =
    document.getElementById(
        "staffName"
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
```

}

/* =========================================================
LOGOUT
========================================================= */

async function logoutCRM() {

```
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
```

}

/* =========================================================
LOAD ENQUIRIES
========================================================= */

async function loadEnquiries() {

```
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
            "Unable to load enquiries. Please check your Supabase table and permissions."
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
```

}

/* =========================================================
TABLE LOADING
========================================================= */

function setTableLoading() {

```
const tbody =
    document.getElementById(
        "leadsTableBody"
    );

if (!tbody) {
    return;
}

tbody.innerHTML = `
    <tr>
        <td colspan="9" class="loading-cell">
            Loading customer enquiries...
        </td>
    </tr>
`;
```

}

function renderTableError(message) {

```
const tbody =
    document.getElementById(
        "leadsTableBody"
    );

if (!tbody) {
    return;
}

tbody.innerHTML = `
    <tr>
        <td colspan="9" class="loading-cell">
            ${escapeHTML(message)}
        </td>
    </tr>
`;
```

}

/* =========================================================
FILTERS
========================================================= */

function applyFilters() {

```
const search =
    currentSearch
        .trim()
        .toLowerCase();

filteredLeads =
    allLeads.filter(
        (lead) => {

            const searchable =
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
                    lead.event,
                    lead.message,
                    lead.requirements
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

            const matchesSearch =
                !search ||
                searchable.includes(
                    search
                );

            const leadStatus =
                safeValue(
                    lead.status ||
                    "new"
                )
                    .toLowerCase();

            const leadPriority =
                safeValue(
                    lead.priority ||
                    "normal"
                )
                    .toLowerCase();

            const matchesStatus =
                currentStatusFilter ===
                    "all" ||
                leadStatus ===
                    currentStatusFilter
                    .toLowerCase();

            const matchesPriority =
                currentPriorityFilter ===
                    "all" ||
                leadPriority ===
                    currentPriorityFilter
                        .toLowerCase();

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );
        }
    );

renderLeads();
```

}

/* =========================================================
RENDER TABLE
========================================================= */

function renderLeads() {

```
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
            <td colspan="9">
                <div class="empty-state">
                    <div class="empty-icon">
                        ⌕
                    </div>

                    <h3>
                        No enquiries found
                    </h3>

                    <p>
                        There are no customer enquiries matching your filters.
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
                createLeadRow(
                    lead
                )
        )
        .join("");
```

}

/* =========================================================
CREATE LEAD ROW
========================================================= */

function createLeadRow(lead) {

```
const id =
    safeValue(
        lead.id
    );

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
    "";

const guests =
    lead.guests ??
    lead.guest_count ??
    lead.number_of_guests ??
    "";

const location =
    lead.location ||
    lead.city ||
    lead.venue ||
    "—";

const status =
    lead.status ||
    "new";

const priority =
    lead.priority ||
    "normal";

return `
    <tr
        data-lead-id="${escapeHTML(id)}"
    >

        <td>
            <strong>
                ${escapeHTML(name)}
            </strong>

            <small>
                ${escapeHTML(phone)}
            </small>
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
```

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

```
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

        <span class="inline-edit-icon">
            ✎
        </span>

    </div>
`;
```

}

/* =========================================================
START INLINE EDIT
========================================================= */

function startInlineEdit(
element
) {

```
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
                "normal"
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

    editor.setAttribute(
        "aria-label",
        `Edit ${field}`
    );
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
    editor.tagName ===
        "INPUT" &&
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
```

}

/* =========================================================
SELECT EDITOR
========================================================= */

function createSelectEditor(
options,
selectedValue
) {

```
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
```

}

/* =========================================================
SAVE INLINE FIELD
========================================================= */

async function saveInlineField(
leadId,
field,
newValue
) {

```
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

    console.error(
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
}
```

}

/* =========================================================
RESTORE INLINE DISPLAY
========================================================= */

function restoreInlineDisplay(
element,
lead,
field
) {

```
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

if (field === "status") {

    value =
        formatStatus(
            value
        );

} else if (
    field === "priority"
) {

    value =
        formatPriority(
            value
        );

} else if (
    field === "event_date"
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
    icon.textContent =
        "✎";
}
```

}

/* =========================================================
REFRESH ROW
========================================================= */

function refreshLeadRow(
leadId
) {

```
const lead =
    allLeads.find(
        item =>
            String(item.id) ===
            String(leadId)
    );

if (!lead) {
    return;
}

const row =
    document.querySelector(
        `tr[data-lead-id="${CSS.escape(
            String(leadId)
        )}"]`
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
```

}

/* =========================================================
RESTORE ROW FIELD
========================================================= */

function restoreRowField(
leadId,
field,
oldValue
) {

```
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
```

}

/* =========================================================
VIEW LEAD MODAL
========================================================= */

function openLeadModal(
leadId
) {

```
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
```

}

/* =========================================================
POPULATE LEAD MODAL
========================================================= */

function populateLeadModal(
lead
) {

```
setModalText(
    "#modalLeadName",
    lead.name ||
    lead.customer_name ||
    "Customer"
);

setModalText(
    "#modalPhone",
    lead.phone ||
    lead.mobile ||
    lead.contact_number ||
    "—"
);

setModalText(
    "#modalEmail",
    lead.email ||
    "—"
);

setModalText(
    "#modalSource",
    lead.source ||
    lead.lead_source ||
    "—"
);

setModalControl(
    "#detailEventType",
    lead.event_type ||
    lead.event ||
    ""
);

setModalControl(
    "#detailVenue",
    lead.venue ||
    ""
);

setModalControl(
    "#detailEventDate",
    lead.event_date ||
    ""
);

setModalControl(
    "#detailGuests",
    lead.guests ??
    lead.guest_count ??
    ""
);

setModalControl(
    "#detailStatus",
    lead.status ||
    "new"
);

setModalControl(
    "#detailPriority",
    lead.priority ||
    "normal"
);

setModalControl(
    "#detailFollowUp",
    lead.follow_up_at ||
    lead.followup_at ||
    ""
);

setModalControl(
    "#detailAssignedTo",
    lead.assigned_to ||
    ""
);

setModalText(
    "#detailMessage",
    lead.message ||
    lead.enquiry ||
    lead.requirements ||
    "No customer message."
);

setModalControl(
    "#detailRemarks",
    lead.remarks ||
    lead.internal_notes ||
    lead.notes ||
    ""
);

setupContactActions(
    lead
);
```

}

/* =========================================================
MODAL TEXT
========================================================= */

function setModalText(
selector,
value
) {

```
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
```

}

/* =========================================================
MODAL CONTROL
========================================================= */

function setModalControl(
selector,
value
) {

```
const element =
    document.querySelector(
        selector
    );

if (!element) {
    return;
}

element.value =
    safeValue(value);
```

}

/* =========================================================
CLOSE LEAD MODAL
========================================================= */

function closeLeadModal() {

```
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
```

}

/* =========================================================
SAVE MODAL
========================================================= */

async function saveModalChanges() {

```
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

const fields = [
    [
        "detailEventType",
        "event_type"
    ],
    [
        "detailVenue",
        "venue"
    ],
    [
        "detailEventDate",
        "event_date"
    ],
    [
        "detailGuests",
        "guests"
    ],
    [
        "detailStatus",
        "status"
    ],
    [
        "detailPriority",
        "priority"
    ],
    [
        "detailFollowUp",
        "follow_up_at"
    ],
    [
        "detailAssignedTo",
        "assigned_to"
    ],
    [
        "detailRemarks",
        "remarks"
    ]
];

fields.forEach(
    ([id, column]) => {

        const element =
            document.getElementById(
                id
            );

        if (!element) {
            return;
        }

        let value =
            element.value;

        if (
            value === ""
        ) {
            value =
                null;
        }

        updateData[column] =
            value;
    }
);

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
```

}

/* =========================================================
CONTACT ACTIONS
========================================================= */

function setupContactActions(
lead
) {

```
const phone =
    lead.phone ||
    lead.mobile ||
    lead.contact_number;

const email =
    lead.email;

const call =
    document.getElementById(
        "modalCallBtn"
    );

const whatsapp =
    document.getElementById(
        "modalWhatsappBtn"
    );

const emailButton =
    document.getElementById(
        "modalEmailBtn"
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
```

}

/* =========================================================
ADD ENQUIRY
========================================================= */

function openAddEnquiryModal() {

```
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
    document.getElementById(
        "addEnquiryForm"
    );

if (form) {
    form.reset();
}
```

}

function closeAddEnquiryModal() {

```
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
```

}

/* =========================================================
SUBMIT NEW ENQUIRY
========================================================= */

async function submitAddEnquiry(
event
) {

```
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
```

}

/* =========================================================
STATS
========================================================= */

function updateStats() {

```
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

const followUpCount =
    allLeads.filter(
        lead =>
            String(
                lead.status ||
                ""
            ).toLowerCase() ===
            "follow-up"
    ).length;

const convertedCount =
    allLeads.filter(
        lead => {

            const status =
                String(
                    lead.status ||
                    ""
                ).toLowerCase();

            return (
                status ===
                    "converted" ||
                status ===
                    "closed" ||
                status ===
                    "booked"
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

const followElement =
    document.getElementById(
        "followUpCount"
    );

const convertedElement =
    document.getElementById(
        "convertedCount"
    );

if (totalElement) {
    totalElement.textContent =
        total;
}

if (newElement) {
    newElement.textContent =
        newCount;
}

if (followElement) {
    followElement.textContent =
        followUpCount;
}

if (convertedElement) {
    convertedElement.textContent =
        convertedCount;
}
```

}

/* =========================================================
STAT FILTERS
========================================================= */

function setupStatFilters() {

```
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
                    card.dataset
                        .statusFilter ||
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
```

}

/* =========================================================
SEARCH
========================================================= */

function setupSearch() {

```
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
```

}

/* =========================================================
FILTER DROPDOWNS
========================================================= */

function setupFilters() {

```
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
```

}

/* =========================================================
REFRESH
========================================================= */

function setupRefreshButton() {

```
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
```

}

/* =========================================================
ADD BUTTON
========================================================= */

function setupAddButton() {

```
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
```

}

/* =========================================================
GLOBAL CLICK HANDLER
========================================================= */

function setupGlobalClicks() {

```
document.addEventListener(
    "click",
    event => {

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

        const closeButton =
            event.target.closest(
                ".close-modal"
            );

        if (closeButton) {

            if (
                closeButton.closest(
                    "#leadModal"
                )
            ) {

                closeLeadModal();

                return;
            }

            if (
                closeButton.closest(
                    "#addEnquiryModal"
                )
            ) {

                closeAddEnquiryModal();

                return;
            }
        }

        const cancelButton =
            event.target.closest(
                ".cancel-btn"
            );

        if (cancelButton) {

            if (
                cancelButton.closest(
                    "#leadModal"
                )
            ) {

                closeLeadModal();

                return;
            }

            if (
                cancelButton.closest(
                    "#addEnquiryModal"
                )
            ) {

                closeAddEnquiryModal();

                return;
            }
        }

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
```

}

/* =========================================================
KEYBOARD
========================================================= */

function setupKeyboard() {

```
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
```

}

/* =========================================================
AUTH LISTENER
========================================================= */

function setupAuthListener() {

```
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
                    "INITIAL_SESSION"
            )
        ) {

            updateStaffName(
                session.user
            );
        }
    }
);
```

}

/* =========================================================
ADD FORM
========================================================= */

function setupAddForm() {

```
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
```

}

/* =========================================================
LOGOUT
========================================================= */

function setupLogout() {

```
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
```

}

/* =========================================================
INITIALIZE CRM
========================================================= */

async function initializeCRM() {

```
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
```

}

/* =========================================================
DOM READY
========================================================= */

if (
document.readyState ===
"loading"
) {

```
document.addEventListener(
    "DOMContentLoaded",
    initializeCRM
);
```

} else {

```
initializeCRM();
```

}

/* =========================================================
GLOBAL CRM API
========================================================= */

window.crm = {

```
loadEnquiries,

openLeadModal,

closeLeadModal,

openAddEnquiryModal,

closeAddEnquiryModal,

saveModalChanges,

logoutCRM,

startInlineEdit
```

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
