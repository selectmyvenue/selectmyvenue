/* =========================================================
   SELECT MY VENUE — CRM
   crm.js
   FINAL CLEAN VERSION
   ========================================================= */

(function () {
    "use strict";

    console.log("Select My Venue CRM: crm.js loaded");

    /* =====================================================
       GLOBAL STATE
       ===================================================== */

    let supabaseClient = null;
    let allLeads = [];
    let filteredLeads = [];
    let currentLead = null;

    let currentStatusFilter = "all";
    let currentPriorityFilter = "all";
    let currentSearch = "";

    /* =====================================================
       SUPABASE
       ===================================================== */

    function getSupabaseClient() {
        if (supabaseClient) {
            return supabaseClient;
        }

        if (
            !window.supabase ||
            typeof window.supabase.createClient !== "function"
        ) {
            console.error("Supabase library not loaded.");
            showMessage("Supabase library is not loaded.", "error");
            return null;
        }

        const url = window.SUPABASE_URL;
        const key = window.SUPABASE_ANON_KEY;

        if (!url || !key) {
            console.error("Supabase URL or key missing.");
            showMessage(
                "Supabase configuration is missing.",
                "error"
            );
            return null;
        }

        try {
            supabaseClient =
                window.supabase.createClient(url, key);

            console.log("Supabase client connected.");

            return supabaseClient;
        } catch (error) {
            console.error(
                "Supabase client creation failed:",
                error
            );

            showMessage(
                "Unable to connect to Supabase.",
                "error"
            );

            return null;
        }
    }

    /* =====================================================
       HELPERS
       ===================================================== */

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

    function showMessage(message, type) {
        let toast = $("crmToast");

        if (!toast) {
            toast = document.createElement("div");
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

            document.body.appendChild(toast);
        }

        toast.textContent = message;

        toast.style.background =
            type === "error"
                ? "#b42318"
                : type === "warning"
                    ? "#9a6700"
                    : "#167c6a";

        clearTimeout(toast._timer);

        toast._timer = setTimeout(function () {
            toast.remove();
        }, 3000);
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
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

    function formatDateTime(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return safe(value);
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

    function formatStatus(value) {
        if (!value) {
            return "New";
        }

        return safe(value)
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, function (c) {
                return c.toUpperCase();
            });
    }

    function formatPriority(value) {
        if (!value) {
            return "Normal";
        }

        return safe(value)
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, function (c) {
                return c.toUpperCase();
            });
    }

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
            "—"
        );
    }

    function getEmail(lead) {
        return lead.email || "—";
    }

    function getEventType(lead) {
        return (
            lead.event_type ||
            lead.event ||
            "—"
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
            "—"
        );
    }

    /* =====================================================
       AUTH
       ===================================================== */

    async function checkAuthentication() {
        const client = getSupabaseClient();

        if (!client) {
            return false;
        }

        try {
            const result =
                await client.auth.getSession();

            if (result.error) {
                console.error(
                    "Session error:",
                    result.error
                );

                return false;
            }

            const session =
                result.data &&
                result.data.session;

            if (!session) {
                console.log(
                    "No active session. Redirecting."
                );

                window.location.href =
                    "login.html";

                return false;
            }

            updateStaffName(
                session.user
            );

            return true;

        } catch (error) {
            console.error(
                "Authentication failed:",
                error
            );

            return false;
        }
    }

    function updateStaffName(user) {
        const element = $("staffName");

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
            "CRM User";
    }

    async function logoutCRM() {
        const client =
            getSupabaseClient();

        if (!client) {
            return;
        }

        try {
            const result =
                await client.auth.signOut();

            if (result.error) {
                console.error(
                    "Logout failed:",
                    result.error
                );

                showMessage(
                    "Unable to logout.",
                    "error"
                );

                return;
            }

            window.location.href =
                "login.html";

        } catch (error) {
            console.error(error);

            showMessage(
                "Unable to logout.",
                "error"
            );
        }
    }

    /* =====================================================
       LOAD ENQUIRIES
       ===================================================== */

    async function loadEnquiries() {
        const client =
            getSupabaseClient();

        if (!client) {
            return;
        }

        const tbody =
            $("leadsTableBody");

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="loading-cell">
                        Loading customer enquiries...
                    </td>
                </tr>
            `;
        }

        try {
            console.log(
                "Loading customer_enquiries..."
            );

            const result =
                await client
                    .from("customer_enquiries")
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );

            if (result.error) {
                console.error(
                    "Supabase load error:",
                    result.error
                );

                renderError(
                    result.error.message ||
                    "Unable to load enquiries."
                );

                return;
            }

            allLeads =
                Array.isArray(result.data)
                    ? result.data
                    : [];

            console.log(
                "Enquiries loaded:",
                allLeads.length
            );

            updateStats();
            applyFilters();

        } catch (error) {
            console.error(
                "Load enquiries failed:",
                error
            );

            renderError(
                "Unable to load enquiries."
            );
        }
    }

    function renderError(message) {
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

    /* =====================================================
       FILTERS
       ===================================================== */

    function applyFilters() {
        const search =
            currentSearch
                .trim()
                .toLowerCase();

        filteredLeads =
            allLeads.filter(function (lead) {

                const searchable = [
                    lead.customer_name,
                    lead.name,
                    lead.phone,
                    lead.mobile,
                    lead.email,
                    lead.event_type,
                    lead.event,
                    lead.venue,
                    lead.location,
                    lead.city,
                    lead.message,
                    lead.remarks,
                    lead.internal_notes,
                    lead.source
                ]
                    .filter(function (value) {
                        return value !== null &&
                            value !== undefined;
                    })
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    !search ||
                    searchable.includes(search);

                const status =
                    safe(
                        lead.status || "new"
                    ).toLowerCase();

                const priority =
                    safe(
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
            });

        renderLeads();
    }

    /* =====================================================
       RENDER TABLE
       ===================================================== */

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
                    <td colspan="10"
                        style="text-align:center;padding:40px;">
                        No enquiries found.
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

    function createLeadRow(lead) {
        const id =
            safe(lead.id);

        const name =
            getCustomerName(lead);

        const phone =
            getPhone(lead);

        const email =
            getEmail(lead);

        const event =
            getEventType(lead);

        const eventDate =
            lead.event_date ||
            lead.date ||
            "";

        const guests =
            getGuests(lead);

        const location =
            getLocation(lead);

        const status =
            safe(
                lead.status || "new"
            );

        const priority =
            safe(
                lead.priority || "normal"
            );

        return `
            <tr data-lead-id="${escapeHTML(id)}">

                <td>
                    <strong>
                        ${escapeHTML(name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(phone)}
                </td>

                <td>
                    ${escapeHTML(email)}
                </td>

                <td>
                    ${escapeHTML(event)}
                </td>

                <td>
                    ${escapeHTML(
                        formatDate(eventDate)
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        guests || "—"
                    )}
                </td>

                <td>
                    ${escapeHTML(location)}
                </td>

                <td>
                    <select
                        class="table-status-select"
                        data-id="${escapeHTML(id)}"
                    >
                        ${statusOptions(
                            status
                        )}
                    </select>
                </td>

                <td>
                    <select
                        class="table-priority-select"
                        data-id="${escapeHTML(id)}"
                    >
                        ${priorityOptions(
                            priority
                        )}
                    </select>
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

    function statusOptions(selected) {
        const options = [
            ["new", "New"],
            ["contacted", "Contacted"],
            ["follow-up", "Follow-up"],
            ["qualified", "Qualified"],
            ["converted", "Converted"],
            ["closed", "Closed"],
            ["lost", "Lost"]
        ];

        return options.map(function (item) {
            return `
                <option
                    value="${item[0]}"
                    ${item[0] === selected ? "selected" : ""}
                >
                    ${item[1]}
                </option>
            `;
        }).join("");
    }

    function priorityOptions(selected) {
        const options = [
            ["urgent", "Urgent"],
            ["high", "High"],
            ["medium", "Medium"],
            ["normal", "Normal"],
            ["low", "Low"]
        ];

        return options.map(function (item) {
            return `
                <option
                    value="${item[0]}"
                    ${item[0] === selected ? "selected" : ""}
                >
                    ${item[1]}
                </option>
            `;
        }).join("");
    }

    /* =====================================================
       STATS
       ===================================================== */

    function updateStats() {
        const total =
            allLeads.length;

        const newCount =
            allLeads.filter(function (lead) {
                return safe(
                    lead.status || "new"
                ).toLowerCase() === "new";
            }).length;

        const contactedCount =
            allLeads.filter(function (lead) {
                return safe(
                    lead.status || ""
                ).toLowerCase() ===
                    "contacted";
            }).length;

        const closedCount =
            allLeads.filter(function (lead) {
                const status =
                    safe(
                        lead.status || ""
                    ).toLowerCase();

                return (
                    status === "closed" ||
                    status === "converted"
                );
            }).length;

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

    function setText(id, value) {
        const element = $(id);

        if (element) {
            element.textContent =
                value;
        }
    }

    /* =====================================================
       OPEN LEAD MODAL
       ===================================================== */

    function openLeadModal(id) {
        const lead =
            allLeads.find(function (item) {
                return safe(item.id) ===
                    safe(id);
            });

        if (!lead) {
            showMessage(
                "Enquiry not found.",
                "error"
            );

            return;
        }

        currentLead = lead;

        fillLeadModal(lead);

        const modal =
            $("leadModal");

        if (modal) {
            modal.hidden = false;
            document.body.style.overflow =
                "hidden";
        }
    }

    function fillLeadModal(lead) {
        setElementText(
            "detailCustomerName",
            getCustomerName(lead)
        );

        setElementText(
            "detailPhone",
            getPhone(lead)
        );

        setElementText(
            "detailEmail",
            getEmail(lead)
        );

        setElementText(
            "detailSource",
            lead.source || "—"
        );

        setValue(
            "detailEventType",
            lead.event_type || ""
        );

        setValue(
            "detailVenue",
            lead.venue ||
            lead.location ||
            ""
        );

        setValue(
            "detailEventDate",
            lead.event_date || ""
        );

        setValue(
            "detailGuests",
            getGuests(lead)
        );

        setValue(
            "detailStatus",
            lead.status || "new"
        );

        setValue(
            "detailPriority",
            lead.priority || "normal"
        );

        setValue(
            "detailFollowUp",
            toDateTimeLocal(
                lead.follow_up_at
            )
        );

        setValue(
            "detailAssignedTo",
            lead.assigned_to || ""
        );

        setElementText(
            "detailMessage",
            lead.message ||
            "No customer message."
        );

        setValue(
            "detailRemarks",
            lead.remarks ||
            lead.internal_notes ||
            ""
        );
    }

    function setElementText(id, value) {
        const element = $(id);

        if (element) {
            element.textContent =
                safe(value) || "—";
        }
    }

    function setValue(id, value) {
        const element = $(id);

        if (element) {
            element.value =
                safe(value);
        }
    }

    function toDateTimeLocal(value) {
        if (!value) {
            return "";
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const pad = function (number) {
            return String(number)
                .padStart(2, "0");
        };

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

    /* =====================================================
       CLOSE LEAD MODAL
       ===================================================== */

    function closeLeadModal() {
        const modal =
            $("leadModal");

        if (modal) {
            modal.hidden = true;
        }

        currentLead = null;

        document.body.style.overflow =
            "";
    }

    /* =====================================================
       SAVE LEAD
       ===================================================== */

    async function saveLeadChanges() {
        if (!currentLead) {
            showMessage(
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

        const id =
            currentLead.id;

        const updateData = {};

        /*
         * These exactly match the IDs
         * in your dashboard.html.
         */

        if ($("detailEventType")) {
            updateData.event_type =
                $("detailEventType").value ||
                null;
        }

        if ($("detailVenue")) {
            updateData.venue =
                $("detailVenue").value.trim() ||
                null;
        }

        if ($("detailEventDate")) {
            updateData.event_date =
                $("detailEventDate").value ||
                null;
        }

        if ($("detailGuests")) {
            updateData.guests =
                $("detailGuests").value
                    ? Number(
                        $("detailGuests").value
                    )
                    : null;
        }

        if ($("detailStatus")) {
            updateData.status =
                $("detailStatus").value ||
                "new";
        }

        if ($("detailPriority")) {
            updateData.priority =
                $("detailPriority").value ||
                "normal";
        }

        if ($("detailFollowUp")) {
            updateData.follow_up_at =
                $("detailFollowUp").value
                    ? new Date(
                        $("detailFollowUp").value
                    ).toISOString()
                    : null;
        }

        if ($("detailAssignedTo")) {
            updateData.assigned_to =
                $("detailAssignedTo").value
                    .trim() ||
                null;
        }

        if ($("detailRemarks")) {
            updateData.remarks =
                $("detailRemarks").value
                    .trim() ||
                null;
        }

        const button =
            $("saveLeadBtn");

        if (button) {
            button.disabled = true;
            button.textContent =
                "Saving...";
        }

        try {
            console.log(
                "Saving enquiry:",
                id,
                updateData
            );

            const result =
                await client
                    .from("customer_enquiries")
                    .update(updateData)
                    .eq("id", id)
                    .select()
                    .single();

            if (result.error) {
                console.error(
                    "Save error:",
                    result.error
                );

                showMessage(
                    result.error.message ||
                    "Unable to save changes.",
                    "error"
                );

                return;
            }

            const index =
                allLeads.findIndex(
                    function (item) {
                        return safe(item.id) ===
                            safe(id);
                    }
                );

            if (index !== -1) {
                allLeads[index] =
                    Object.assign(
                        {},
                        allLeads[index],
                        result.data
                    );

                currentLead =
                    allLeads[index];
            }

            updateStats();
            applyFilters();

            fillLeadModal(
                currentLead
            );

            showMessage(
                "Changes saved successfully."
            );

        } catch (error) {
            console.error(
                "Save failed:",
                error
            );

            showMessage(
                "Unable to save changes.",
                "error"
            );

        } finally {
            if (button) {
                button.disabled = false;
                button.textContent =
                    "Save Changes";
            }
        }
    }

    /* =====================================================
       ADD ENQUIRY
       ===================================================== */

    function openAddEnquiryModal() {
        const modal =
            $("addEnquiryModal");

        if (!modal) {
            showMessage(
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
            message.textContent = "";
        }

        modal.hidden = false;

        document.body.style.overflow =
            "hidden";
    }

    function closeAddEnquiryModal() {
        const modal =
            $("addEnquiryModal");

        if (modal) {
            modal.hidden = true;
        }

        document.body.style.overflow =
            "";
    }

    async function submitEnquiry(event) {
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

        const data = {};

        const formData =
            new FormData(form);

        formData.forEach(
            function (value, key) {
                if (
                    typeof value ===
                    "string"
                ) {
                    data[key] =
                        value.trim();
                } else {
                    data[key] =
                        value;
                }
            }
        );

        if (!data.status) {
            data.status = "new";
        }

        if (!data.priority) {
            data.priority = "normal";
        }

        if (data.guests) {
            data.guests =
                Number(data.guests);
        }

        if (!data.event_date) {
            data.event_date = null;
        }

        if (!data.follow_up_at) {
            data.follow_up_at = null;
        }

        const button =
            $("submitEnquiryBtn");

        if (button) {
            button.disabled = true;
            button.textContent =
                "Adding...";
        }

        try {
            const result =
                await client
                    .from("customer_enquiries")
                    .insert([data])
                    .select()
                    .single();

            if (result.error) {
                console.error(
                    "Add enquiry error:",
                    result.error
                );

                showMessage(
                    result.error.message ||
                    "Unable to add enquiry.",
                    "error"
                );

                return;
            }

            if (result.data) {
                allLeads.unshift(
                    result.data
                );
            }

            updateStats();
            applyFilters();

            closeAddEnquiryModal();

            showMessage(
                "Customer enquiry added successfully."
            );

        } catch (error) {
            console.error(error);

            showMessage(
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

    /* =====================================================
       INLINE STATUS / PRIORITY SAVE
       ===================================================== */

    async function updateLeadField(
        id,
        field,
        value
    ) {
        const client =
            getSupabaseClient();

        if (!client) {
            return;
        }

        try {
            const update = {};

            update[field] =
                value || null;

            const result =
                await client
                    .from("customer_enquiries")
                    .update(update)
                    .eq("id", id)
                    .select()
                    .single();

            if (result.error) {
                console.error(
                    "Field update error:",
                    result.error
                );

                showMessage(
                    result.error.message ||
                    "Unable to save change.",
                    "error"
                );

                await loadEnquiries();

                return;
            }

            const index =
                allLeads.findIndex(
                    function (item) {
                        return safe(item.id) ===
                            safe(id);
                    }
                );

            if (index !== -1) {
                allLeads[index] =
                    Object.assign(
                        {},
                        allLeads[index],
                        result.data
                    );
            }

            updateStats();
            applyFilters();

            showMessage(
                "Updated successfully."
            );

        } catch (error) {
            console.error(error);

            showMessage(
                "Unable to save change.",
                "error"
            );

            await loadEnquiries();
        }
    }

    /* =====================================================
       SEARCH
       ===================================================== */

    function setupSearch() {
        const input =
            $("searchInput");

        if (!input) {
            return;
        }

        input.addEventListener(
            "input",
            function () {
                currentSearch =
                    input.value;

                applyFilters();
            }
        );
    }

    /* =====================================================
       FILTER SELECTS
       ===================================================== */

    function setupFilters() {
        const status =
            $("statusFilter");

        const priority =
            $("priorityFilter");

        if (status) {
            status.addEventListener(
                "change",
                function () {
                    currentStatusFilter =
                        status.value || "all";

                    updateStatActiveState();

                    applyFilters();
                }
            );
        }

        if (priority) {
            priority.addEventListener(
                "change",
                function () {
                    currentPriorityFilter =
                        priority.value || "all";

                    applyFilters();
                }
            );
        }
    }

    /* =====================================================
       STAT CARD FILTERS
       ===================================================== */

    function setupStatCards() {
        const cards =
            document.querySelectorAll(
                ".stat-card"
            );

        cards.forEach(
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

                        const status =
                            $("statusFilter");

                        if (status) {
                            status.value =
                                filter;
                        }

                        cards.forEach(
                            function (item) {
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

    function updateStatActiveState() {
        const cards =
            document.querySelectorAll(
                ".stat-card"
            );

        cards.forEach(
            function (card) {
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

    /* =====================================================
       REFRESH
       ===================================================== */

    function setupRefresh() {
        const button =
            $("refreshBtn");

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            async function () {

                button.disabled = true;

                const oldText =
                    button.innerHTML;

                button.textContent =
                    "Refreshing...";

                await loadEnquiries();

                button.disabled = false;

                button.innerHTML =
                    oldText;
            }
        );
    }

    /* =====================================================
       ADD BUTTON
       ===================================================== */

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

    /* =====================================================
       LOGOUT
       ===================================================== */

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

    /* =====================================================
       MODAL BUTTONS
       ===================================================== */

    function setupModalButtons() {

        const closeLead =
            $("closeLeadModal");

        if (closeLead) {
            closeLead.addEventListener(
                "click",
                closeLeadModal
            );
        }

        const cancelLead =
            $("cancelLeadEdit");

        if (cancelLead) {
            cancelLead.addEventListener(
                "click",
                closeLeadModal
            );
        }

        const saveLead =
            $("saveLeadBtn");

        if (saveLead) {
            saveLead.addEventListener(
                "click",
                saveLeadChanges
            );
        }

        const closeAdd =
            $("closeAddEnquiry");

        if (closeAdd) {
            closeAdd.addEventListener(
                "click",
                closeAddEnquiryModal
            );
        }

        const cancelAdd =
            $("cancelAddEnquiry");

        if (cancelAdd) {
            cancelAdd.addEventListener(
                "click",
                closeAddEnquiryModal
            );
        }

        const form =
            $("addEnquiryForm");

        if (form) {
            form.addEventListener(
                "submit",
                submitEnquiry
            );
        }

        const leadModal =
            $("leadModal");

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

        const addModal =
            $("addEnquiryModal");

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
    }

    /* =====================================================
       TABLE CLICK / CHANGE HANDLER
       ===================================================== */

    function setupTableEvents() {

        const tbody =
            $("leadsTableBody");

        if (!tbody) {
            return;
        }

        tbody.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-action='view']"
                    );

                if (!button) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                openLeadModal(
                    button.dataset.id
                );
            }
        );

        tbody.addEventListener(
            "change",
            function (event) {

                const statusSelect =
                    event.target.closest(
                        ".table-status-select"
                    );

                if (statusSelect) {
                    updateLeadField(
                        statusSelect.dataset.id,
                        "status",
                        statusSelect.value
                    );

                    return;
                }

                const prioritySelect =
                    event.target.closest(
                        ".table-priority-select"
                    );

                if (prioritySelect) {
                    updateLeadField(
                        prioritySelect.dataset.id,
                        "priority",
                        prioritySelect.value
                    );
                }
            }
        );
    }

    /* =====================================================
       ESC KEY
       ===================================================== */

    function setupEscapeKey() {
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
                    $("leadModal");

                const addModal =
                    $("addEnquiryModal");

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

    /* =====================================================
       AUTH STATE
       ===================================================== */

    function setupAuthListener() {
        const client =
            getSupabaseClient();

        if (!client) {
            return;
        }

        client.auth.onAuthStateChange(
            function (event, session) {

                console.log(
                    "Auth event:",
                    event
                );

                if (
                    event ===
                    "SIGNED_OUT"
                ) {
                    window.location.href =
                        "login.html";
                }

                if (session) {
                    updateStaffName(
                        session.user
                    );
                }
            }
        );
    }

    /* =====================================================
       INITIALIZE
       ===================================================== */

    async function initializeCRM() {

        console.log(
            "Select My Venue CRM initializing..."
        );

        const authenticated =
            await checkAuthentication();

        if (!authenticated) {
            return;
        }

        setupSearch();
        setupFilters();
        setupStatCards();
        setupRefresh();
        setupAddButton();
        setupLogout();
        setupModalButtons();
        setupTableEvents();
        setupEscapeKey();
        setupAuthListener();

        await loadEnquiries();

        console.log(
            "Select My Venue CRM ready."
        );
    }

    /* =====================================================
       PUBLIC FUNCTIONS
       ===================================================== */

    window.crm = {
        loadEnquiries:
            loadEnquiries,

        openLeadModal:
            openLeadModal,

        closeLeadModal:
            closeLeadModal,

        openAddEnquiryModal:
            openAddEnquiryModal,

        closeAddEnquiryModal:
            closeAddEnquiryModal,

        saveLeadChanges:
            saveLeadChanges,

        logoutCRM:
            logoutCRM
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

    window.saveLeadChanges =
        saveLeadChanges;

    window.logoutCRM =
        logoutCRM;

    /* =====================================================
       START
       ===================================================== */

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

})();
