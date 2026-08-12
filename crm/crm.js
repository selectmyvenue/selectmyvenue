/* =========================================================
   SELECT MY VENUE — CRM
   CLEAN CORPORATE CRM ENGINE
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       SUPABASE CONFIG
       KEEP YOUR EXISTING VALUES
    ===================================================== */

    const SUPABASE_URL =
        window.SUPABASE_URL ||
        "https://uajqwyoqbbswkfiwosyw.supabase.co";

    const SUPABASE_ANON_KEY =
        window.SUPABASE_ANON_KEY ||
        "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";


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

    let editingCell = null;

    let crmTable = null;


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    async function init() {

        try {

            if (!window.supabase) {
                showFatalError(
                    "Supabase library could not be loaded."
                );
                return;
            }


            supabaseClient =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_ANON_KEY
                );


            cleanDashboardMarkup();

            setupEvents();

            await checkAuthentication();

        } catch (error) {

            console.error(
                "CRM initialization error:",
                error
            );

            showFatalError(
                "CRM could not be initialized."
            );
        }
    }


    /* =====================================================
       CLEAN ACCIDENTAL / OLD UI MARKUP
    ===================================================== */

    function cleanDashboardMarkup() {

        /*
         * Remove the unwanted CUSTOMER CRM label.
         */

        document
            .querySelectorAll("body *")
            .forEach(element => {

                if (
                    element.children.length === 0
                ) {

                    const text =
                        (element.textContent || "")
                            .trim()
                            .toUpperCase();

                    if (
                        text === "CUSTOMER CRM"
                    ) {

                        element.remove();
                    }
                }
            });


        /*
         * Remove visible pencil/edit symbols
         * from the table.
         */

        document
            .querySelectorAll(
                ".leads-table button, " +
                ".leads-table i, " +
                ".leads-table svg, " +
                ".lead-table button, " +
                ".lead-table i, " +
                ".lead-table svg, " +
                ".edit-icon, " +
                ".pencil, " +
                ".fa-pencil, " +
                ".fa-edit, " +
                "[data-edit]"
            )
            .forEach(element => {

                const text =
                    (element.textContent || "")
                        .trim();

                const aria =
                    (
                        element.getAttribute(
                            "aria-label"
                        ) || ""
                    )
                        .toLowerCase();

                if (
                    text === "✎" ||
                    text === "✏" ||
                    text === "🖉" ||
                    text.toLowerCase() === "edit" ||
                    aria.includes("edit") ||
                    aria.includes("pencil")
                ) {

                    element.remove();
                }
            });


        /*
         * Prevent old edit icons from
         * visually appearing.
         */

        const style =
            document.createElement("style");

        style.id =
            "crm-clean-runtime-style";

        style.textContent = `
            .edit-icon,
            .pencil,
            .fa-pencil,
            .fa-pencil-alt,
            .fa-edit,
            [data-edit],
            .table-edit-icon,
            .inline-edit-icon {
                display:none !important;
                visibility:hidden !important;
                width:0 !important;
                min-width:0 !important;
                margin:0 !important;
                padding:0 !important;
            }

            .click-to-edit {
                cursor:pointer;
            }

            .click-to-edit:hover {
                background:rgba(15,118,110,.035);
            }

            .non-editable-cell {
                cursor:default;
            }

            .clean-inline-editor {
                display:flex;
                align-items:center;
                gap:6px;
                width:100%;
                min-width:150px;
            }

            .clean-inline-input,
            .clean-inline-editor select {
                flex:1;
                min-width:0;
                border:1px solid #cbd5e1;
                border-radius:7px;
                padding:7px 9px;
                background:#fff;
                color:#0f172a;
                font:inherit;
                outline:none;
            }

            .clean-inline-input:focus,
            .clean-inline-editor select:focus {
                border-color:#0f766e;
                box-shadow:0 0 0 3px rgba(15,118,110,.10);
            }

            .clean-inline-save,
            .clean-inline-cancel {
                border:0;
                border-radius:6px;
                padding:6px 8px;
                cursor:pointer;
                font-size:12px;
                font-weight:600;
                white-space:nowrap;
            }

            .clean-inline-save {
                background:#0f766e;
                color:#fff;
            }

            .clean-inline-cancel {
                background:#e2e8f0;
                color:#334155;
            }

            .crm-toast {
                position:fixed;
                right:24px;
                bottom:24px;
                z-index:99999;
                padding:12px 18px;
                border-radius:10px;
                background:#0f172a;
                color:#fff;
                font-size:13px;
                font-weight:600;
                box-shadow:0 12px 35px rgba(0,0,0,.18);
                opacity:0;
                transform:translateY(10px);
                pointer-events:none;
                transition:.2s ease;
            }

            .crm-toast.show {
                opacity:1;
                transform:translateY(0);
            }

            .crm-toast.success {
                background:#0f766e;
            }

            .crm-toast.error {
                background:#b91c1c;
            }

            body.modal-open {
                overflow:hidden;
            }
        `;

        document.head.appendChild(style);
    }


    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    async function checkAuthentication() {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            showFatalError(
                "Unable to verify your login session."
            );

            return;
        }


        if (
            !data ||
            !data.session
        ) {

            window.location.href =
                "./login.html";

            return;
        }


        setStaffName(
            data.session.user
        );


        await detectTable();

        await loadLeads();
    }


    function setStaffName(user) {

        const element =
            document.getElementById(
                "staffName"
            );


        if (!element) {
            return;
        }


        const metadata =
            user?.user_metadata || {};


        element.textContent =
            metadata.full_name ||
            metadata.name ||
            metadata.display_name ||
            user?.email ||
            "Employee";
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function setupEvents() {

        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                logout
            );
        }


        const refreshBtn =
            document.getElementById(
                "refreshBtn"
            );

        if (refreshBtn) {

            refreshBtn.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    await loadLeads();
                }
            );
        }


        const searchInput =
            document.getElementById(
                "searchInput"
            );

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                () => {

                    currentSearch =
                        searchInput.value
                            .trim()
                            .toLowerCase();

                    applyFilters();
                }
            );
        }


        const statusFilter =
            document.getElementById(
                "statusFilter"
            );

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                () => {

                    currentStatusFilter =
                        normalizeStatus(
                            statusFilter.value
                        ) || "all";

                    applyFilters();
                }
            );
        }


        const priorityFilter =
            document.getElementById(
                "priorityFilter"
            );

        if (priorityFilter) {

            priorityFilter.addEventListener(
                "change",
                () => {

                    currentPriorityFilter =
                        normalizePriority(
                            priorityFilter.value
                        ) || "all";

                    applyFilters();
                }
            );
        }


        document
            .querySelectorAll(
                ".stat-card[data-status-filter]"
            )
            .forEach(card => {

                card.addEventListener(
                    "click",
                    () => {

                        const value =
                            normalizeStatus(
                                card.dataset.statusFilter
                            );


                        currentStatusFilter =
                            value || "all";


                        if (statusFilter) {

                            statusFilter.value =
                                currentStatusFilter;
                        }


                        document
                            .querySelectorAll(
                                ".stat-card"
                            )
                            .forEach(item => {

                                item.classList.remove(
                                    "active"
                                );
                            });


                        card.classList.add(
                            "active"
                        );


                        applyFilters();
                    }
                );
            });


        const addBtn =
            document.getElementById(
                "addEnquiryBtn"
            );

        if (addBtn) {

            addBtn.addEventListener(
                "click",
                openAddEnquiryModal
            );
        }


        const closeAdd =
            document.getElementById(
                "closeAddEnquiry"
            );

        if (closeAdd) {

            closeAdd.addEventListener(
                "click",
                closeAddEnquiryModal
            );
        }


        const cancelAdd =
            document.getElementById(
                "cancelAddEnquiry"
            );

        if (cancelAdd) {

            cancelAdd.addEventListener(
                "click",
                closeAddEnquiryModal
            );
        }


        const addForm =
            document.getElementById(
                "addEnquiryForm"
            );

        if (addForm) {

            addForm.addEventListener(
                "submit",
                handleAddEnquiry
            );
        }


        const closeDetails =
            document.getElementById(
                "closeLeadModal"
            );

        if (closeDetails) {

            closeDetails.addEventListener(
                "click",
                closeLeadModal
            );
        }


        const cancelEdit =
            document.getElementById(
                "cancelLeadEdit"
            );

        if (cancelEdit) {

            cancelEdit.addEventListener(
                "click",
                closeLeadModal
            );
        }


        const saveBtn =
            document.getElementById(
                "saveLeadBtn"
            );

        if (saveBtn) {

            saveBtn.addEventListener(
                "click",
                saveLeadDetails
            );
        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {

                    cancelInlineEdit();

                    closeLeadModal();

                    closeAddEnquiryModal();
                }
            }
        );


        document.addEventListener(
            "click",
            event => {

                const target =
                    event.target;


                if (
                    target.classList &&
                    target.classList.contains(
                        "lead-modal"
                    )
                ) {

                    closeLeadModal();
                }


                if (
                    target.classList &&
                    target.classList.contains(
                        "add-enquiry-modal"
                    )
                ) {

                    closeAddEnquiryModal();
                }
            }
        );
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        try {

            await supabaseClient.auth.signOut();

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );
        }


        window.location.href =
            "./login.html";
    }


    /* =====================================================
       TABLE DETECTION
    ===================================================== */

    async function detectTable() {

        if (crmTable) {
            return crmTable;
        }


        if (window.__CRM_TABLE__) {

            crmTable =
                window.__CRM_TABLE__;

            return crmTable;
        }


        const enquiries =
            await supabaseClient
                .from("enquiries")
                .select("*")
                .limit(1);


        if (!enquiries.error) {

            crmTable =
                "enquiries";

            window.__CRM_TABLE__ =
                "enquiries";

            return crmTable;
        }


        const leads =
            await supabaseClient
                .from("leads")
                .select("*")
                .limit(1);


        if (!leads.error) {

            crmTable =
                "leads";

            window.__CRM_TABLE__ =
                "leads";

            return crmTable;
        }


        crmTable =
            "enquiries";

        return crmTable;
    }


    function getTableName() {

        return (
            crmTable ||
            window.__CRM_TABLE__ ||
            "enquiries"
        );
    }


    /* =====================================================
       LOAD LEADS
    ===================================================== */

    async function loadLeads() {

        setLoadingState();


        try {

            await detectTable();


            const {
                data,
                error
            } =
                await supabaseClient
                    .from(getTableName())
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending:false
                        }
                    );


            if (error) {
                throw error;
            }


            allLeads =
                data || [];


            updateStatistics();

            applyFilters();


        } catch (error) {

            console.error(
                "Load leads error:",
                error
            );


            showTableMessage(
                "Unable to load enquiries. Please refresh the page."
            );
        }
    }


    /* =====================================================
       DATABASE FIELD HELPERS
    ===================================================== */

    function findField(
        row,
        names
    ) {

        if (!row) {
            return null;
        }


        const keys =
            Object.keys(row);


        for (
            const name of names
        ) {

            const exact =
                keys.find(
                    key =>
                        key === name
                );

            if (exact) {
                return exact;
            }
        }


        for (
            const name of names
        ) {

            const lower =
                name.toLowerCase();


            const match =
                keys.find(
                    key =>
                        key.toLowerCase() ===
                        lower
                );


            if (match) {
                return match;
            }
        }


        return null;
    }


    function getValue(
        row,
        names
    ) {

        const field =
            findField(
                row,
                names
            );


        return field
            ? row[field]
            : "";
    }


    function getId(row) {

        return getValue(
            row,
            [
                "id",
                "enquiry_id",
                "lead_id"
            ]
        );
    }


    function getIdField(row) {

        return (
            findField(
                row,
                [
                    "id",
                    "enquiry_id",
                    "lead_id"
                ]
            ) || "id"
        );
    }


    function getCustomerName(row) {

        return getValue(
            row,
            [
                "customer_name",
                "name",
                "full_name",
                "customer"
            ]
        );
    }


    /*
     * SMART PHONE / EMAIL FIX
     *
     * If old records accidentally contain
     * email inside phone, don't display the
     * email as a phone number.
     */

    function looksLikeEmail(value) {

        return (
            typeof value === "string" &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(value.trim())
        );
    }


    function looksLikePhone(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return false;
        }


        const cleaned =
            String(value)
                .replace(
                    /[\s()+\-]/g,
                    ""
                );


        return (
            /^\d{7,15}$/.test(
                cleaned
            )
        );
    }


    function getPhone(row) {

        const phone =
            getValue(
                row,
                [
                    "phone",
                    "mobile",
                    "phone_number",
                    "mobile_number",
                    "customer_phone",
                    "contact_phone"
                ]
            );


        const email =
            getValue(
                row,
                [
                    "email",
                    "customer_email",
                    "email_address",
                    "contact_email"
                ]
            );


        /*
         * If phone field contains an email
         * and email field contains a phone,
         * display the correct values.
         */

        if (
            looksLikeEmail(phone) &&
            looksLikePhone(email)
        ) {

            return email;
        }


        /*
         * If phone contains an email and
         * email is empty, do not display
         * the email as a phone.
         */

        if (
            looksLikeEmail(phone)
        ) {

            return "";
        }


        return phone;
    }


    function getEmail(row) {

        const email =
            getValue(
                row,
                [
                    "email",
                    "customer_email",
                    "email_address",
                    "contact_email"
                ]
            );


        const phone =
            getValue(
                row,
                [
                    "phone",
                    "mobile",
                    "phone_number",
                    "mobile_number",
                    "customer_phone",
                    "contact_phone"
                ]
            );


        /*
         * If email field contains a phone
         * and phone field contains an email,
         * correct the display.
         */

        if (
            looksLikePhone(email) &&
            looksLikeEmail(phone)
        ) {

            return phone;
        }


        if (
            looksLikePhone(email)
        ) {

            return "";
        }


        return email;
    }


    function getEventType(row) {

        return getValue(
            row,
            [
                "event_type",
                "event",
                "event_name"
            ]
        );
    }


    function getVenue(row) {

        return getValue(
            row,
            [
                "venue",
                "venue_name",
                "location"
            ]
        );
    }


    function getEventDate(row) {

        return getValue(
            row,
            [
                "event_date",
                "date"
            ]
        );
    }


    function getGuests(row) {

        return getValue(
            row,
            [
                "guests",
                "guest_count",
                "number_of_guests"
            ]
        );
    }


    function getStatus(row) {

        return getValue(
            row,
            [
                "status",
                "lead_status"
            ]
        );
    }


    function getPriority(row) {

        return getValue(
            row,
            [
                "priority",
                "lead_priority"
            ]
        );
    }


    function getSource(row) {

        return getValue(
            row,
            [
                "source",
                "lead_source"
            ]
        );
    }


    function getMessage(row) {

        return getValue(
            row,
            [
                "message",
                "customer_message",
                "comment",
                "comments"
            ]
        );
    }


    function getRemarks(row) {

        return getValue(
            row,
            [
                "remarks",
                "internal_remarks",
                "notes",
                "internal_notes"
            ]
        );
    }


    function getFollowUp(row) {

        return getValue(
            row,
            [
                "follow_up_at",
                "followup_at",
                "follow_up",
                "followup_date"
            ]
        );
    }


    function getAssignedTo(row) {

        return getValue(
            row,
            [
                "assigned_to",
                "assigned",
                "employee"
            ]
        );
    }


    /* =====================================================
       FILTERS
    ===================================================== */

    function applyFilters() {

        filteredLeads =
            allLeads.filter(
                lead => {

                    const status =
                        normalizeStatus(
                            getStatus(lead)
                        );


                    const priority =
                        normalizePriority(
                            getPriority(lead)
                        );


                    if (
                        currentStatusFilter !==
                        "all" &&
                        status !==
                        currentStatusFilter
                    ) {

                        return false;
                    }


                    if (
                        currentPriorityFilter !==
                        "all" &&
                        priority !==
                        currentPriorityFilter
                    ) {

                        return false;
                    }


                    if (
                        currentSearch
                    ) {

                        const searchable = [

                            getCustomerName(
                                lead
                            ),

                            getPhone(
                                lead
                            ),

                            getEmail(
                                lead
                            ),

                            getVenue(
                                lead
                            ),

                            getEventType(
                                lead
                            ),

                            getSource(
                                lead
                            )

                        ]
                            .join(" ")
                            .toLowerCase();


                        if (
                            !searchable.includes(
                                currentSearch
                            )
                        ) {

                            return false;
                        }
                    }


                    return true;
                }
            );


        renderTable();
    }


    /* =====================================================
       STATISTICS
    ===================================================== */

    function updateStatistics() {

        setText(
            "totalCount",
            allLeads.length
        );


        setText(
            "newCount",
            allLeads.filter(
                lead =>
                    normalizeStatus(
                        getStatus(lead)
                    ) === "new"
            ).length
        );


        setText(
            "contactedCount",
            allLeads.filter(
                lead =>
                    normalizeStatus(
                        getStatus(lead)
                    ) === "contacted"
            ).length
        );


        setText(
            "closedCount",
            allLeads.filter(
                lead =>
                    normalizeStatus(
                        getStatus(lead)
                    ) === "closed"
            ).length
        );
    }


    /* =====================================================
       TABLE RENDER
    ===================================================== */

    function renderTable() {

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


        tbody.innerHTML = "";


        if (
            !filteredLeads.length
        ) {

            if (emptyState) {
                emptyState.hidden = false;
            }

            return;
        }


        if (emptyState) {
            emptyState.hidden = true;
        }


        filteredLeads.forEach(
            lead => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                tr.dataset.leadId =
                    String(
                        getId(lead)
                    );


                /* CUSTOMER - LOCKED */

                const customerTd =
                    document.createElement(
                        "td"
                    );

                customerTd.className =
                    "customer-cell non-editable-cell";


                const customerName =
                    document.createElement(
                        "strong"
                    );


                customerName.textContent =
                    safeDisplay(
                        getCustomerName(
                            lead
                        ),
                        "Unnamed Customer"
                    );


                customerTd.appendChild(
                    customerName
                );


                /* PHONE - LOCKED */

                const phoneTd =
                    createEditableCell(
                        lead,
                        "phone",
                        getPhone(lead),
                        false
                    );


                /* EMAIL - EDITABLE */

                const emailTd =
                    createEditableCell(
                        lead,
                        "email",
                        getEmail(lead),
                        true
                    );


                /* EVENT - EDITABLE */

                const eventTd =
                    createEditableCell(
                        lead,
                        "event_type",
                        getEventType(lead),
                        true,
                        "select",
                        [
                            "Wedding",
                            "Engagement",
                            "Birthday",
                            "Corporate",
                            "Anniversary",
                            "Party",
                            "Other"
                        ]
                    );


                /* DATE - EDITABLE */

                const dateTd =
                    createEditableCell(
                        lead,
                        "event_date",
                        formatDate(
                            getEventDate(lead)
                        ),
                        true,
                        "date",
                        null,
                        getEventDate(lead)
                    );


                /* GUESTS - EDITABLE */

                const guestsTd =
                    createEditableCell(
                        lead,
                        "guests",
                        getGuests(lead),
                        true,
                        "number"
                    );


                /* LOCATION - EDITABLE */

                const locationTd =
                    createEditableCell(
                        lead,
                        "venue",
                        getVenue(lead),
                        true
                    );


                /* STATUS - EDITABLE */

                const statusTd =
                    createEditableCell(
                        lead,
                        "status",
                        prettyStatus(
                            getStatus(lead)
                        ),
                        true,
                        "select",
                        [
                            "new",
                            "contacted",
                            "follow-up",
                            "qualified",
                            "converted",
                            "closed",
                            "lost"
                        ]
                    );


                /* PRIORITY - EDITABLE */

                const priorityTd =
                    createEditableCell(
                        lead,
                        "priority",
                        prettyStatus(
                            getPriority(lead)
                        ),
                        true,
                        "select",
                        [
                            "urgent",
                            "high",
                            "medium",
                            "normal",
                            "low"
                        ]
                    );


                /* ACTION */

                const actionTd =
                    document.createElement(
                        "td"
                    );


                actionTd.className =
                    "action-cell";


                const detailsBtn =
                    document.createElement(
                        "button"
                    );


                detailsBtn.type =
                    "button";

                detailsBtn.className =
                    "view-details-btn";

                detailsBtn.textContent =
                    "View Details";


                detailsBtn.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        openLeadDetails(
                            lead
                        );
                    }
                );


                actionTd.appendChild(
                    detailsBtn
                );


                tr.append(
                    customerTd,
                    phoneTd,
                    emailTd,
                    eventTd,
                    dateTd,
                    guestsTd,
                    locationTd,
                    statusTd,
                    priorityTd,
                    actionTd
                );


                tbody.appendChild(
                    tr
                );
            }
        );
    }


    /* =====================================================
       CLICK-TO-EDIT
       NO PENCIL
    ===================================================== */

    function createEditableCell(
        lead,
        logicalField,
        displayValue,
        editable = true,
        type = "text",
        options = null,
        rawValue = null
    ) {

        const td =
            document.createElement(
                "td"
            );


        const value =
            document.createElement(
                "span"
            );


        value.className =
            "cell-value";


        value.textContent =
            safeDisplay(
                displayValue
            );


        td.appendChild(
            value
        );


        if (!editable) {

            td.classList.add(
                "non-editable-cell"
            );

            return td;
        }


        td.classList.add(
            "click-to-edit"
        );


        td.title =
            "Click to edit";


        td.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "input,select,button"
                    )
                ) {

                    return;
                }


                startInlineEdit(
                    td,
                    lead,
                    logicalField,
                    type,
                    options,
                    rawValue !== null
                        ? rawValue
                        : getLogicalValue(
                            lead,
                            logicalField
                        )
                );
            }
        );


        return td;
    }


    /* =====================================================
       INLINE EDITOR
    ===================================================== */

    function startInlineEdit(
        td,
        lead,
        logicalField,
        type,
        options,
        currentValue
    ) {

        if (
            editingCell &&
            editingCell !== td
        ) {

            cancelInlineEdit();
        }


        if (
            td.classList.contains(
                "editing"
            )
        ) {

            return;
        }


        editingCell =
            td;


        td.classList.add(
            "editing"
        );


        const original =
            td.querySelector(
                ".cell-value"
            );


        if (original) {

            original.style.display =
                "none";
        }


        const editor =
            document.createElement(
                "div"
            );


        editor.className =
            "clean-inline-editor";


        let input;


        if (
            type === "select"
        ) {

            input =
                document.createElement(
                    "select"
                );


            (options || [])
                .forEach(
                    option => {

                        const item =
                            document.createElement(
                                "option"
                            );


                        item.value =
                            option;


                        item.textContent =
                            prettyStatus(
                                option
                            );


                        if (
                            normalizeStatus(
                                option
                            ) ===
                            normalizeStatus(
                                currentValue
                            )
                        ) {

                            item.selected =
                                true;
                        }


                        input.appendChild(
                            item
                        );
                    }
                );

        } else {

            input =
                document.createElement(
                    "input"
                );


            input.type =
                type;


            input.value =
                currentValue || "";
        }


        input.className =
            "clean-inline-input";


        const save =
            document.createElement(
                "button"
            );


        save.type =
            "button";


        save.className =
            "clean-inline-save";


        save.textContent =
            "Save";


        const cancel =
            document.createElement(
                "button"
            );


        cancel.type =
            "button";


        cancel.className =
            "clean-inline-cancel";


        cancel.textContent =
            "Cancel";


        editor.append(
            input,
            save,
            cancel
        );


        td.appendChild(
            editor
        );


        save.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                event.stopPropagation();

                await saveInlineEdit(
                    td,
                    lead,
                    logicalField,
                    input.value,
                    original,
                    editor
                );
            }
        );


        cancel.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                cancelInlineEdit();
            }
        );


        input.addEventListener(
            "keydown",
            async event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    await saveInlineEdit(
                        td,
                        lead,
                        logicalField,
                        input.value,
                        original,
                        editor
                    );
                }


                if (
                    event.key === "Escape"
                ) {

                    event.preventDefault();

                    cancelInlineEdit();
                }
            }
        );


        setTimeout(
            () => {

                input.focus();

                if (
                    input.select &&
                    type !== "date"
                ) {

                    input.select();
                }

            },
            20
        );
    }


    async function saveInlineEdit(
        td,
        lead,
        logicalField,
        value,
        original,
        editor
    ) {

        const id =
            getId(lead);


        if (!id) {

            showToast(
                "Lead ID is missing.",
                "error"
            );

            return;
        }


        const databaseField =
            resolveDatabaseField(
                lead,
                logicalField
            );


        if (!databaseField) {

            showToast(
                "Database field not found.",
                "error"
            );

            return;
        }


        let cleanValue =
            String(
                value ?? ""
            ).trim();


        if (
            logicalField === "guests"
        ) {

            cleanValue =
                cleanValue === ""
                    ? null
                    : Number(
                        cleanValue
                    );
        }


        const update = {};


        update[databaseField] =
            cleanValue === ""
                ? null
                : cleanValue;


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        getTableName()
                    )
                    .update(update)
                    .eq(
                        getIdField(lead),
                        id
                    )
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            const index =
                allLeads.findIndex(
                    row =>
                        String(
                            getId(row)
                        ) ===
                        String(id)
                );


            if (
                index !== -1
            ) {

                allLeads[index] =
                    data ||
                    {
                        ...allLeads[index],
                        ...update
                    };
            }


            let displayValue =
                cleanValue || "—";


            if (
                logicalField ===
                "event_date"
            ) {

                displayValue =
                    formatDate(
                        cleanValue
                    );
            }


            if (
                logicalField === "status" ||
                logicalField === "priority"
            ) {

                displayValue =
                    prettyStatus(
                        cleanValue
                    );
            }


            if (original) {

                original.textContent =
                    displayValue;
            }


            removeInlineEditor(
                td,
                editor,
                original
            );


            updateStatistics();


            showToast(
                "Updated successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Inline update error:",
                error
            );


            showToast(
                "Unable to save this change.",
                "error"
            );
        }
    }


    function cancelInlineEdit() {

        if (!editingCell) {
            return;
        }


        const td =
            editingCell;


        const editor =
            td.querySelector(
                ".clean-inline-editor"
            );


        const original =
            td.querySelector(
                ".cell-value"
            );


        removeInlineEditor(
            td,
            editor,
            original
        );
    }


    function removeInlineEditor(
        td,
        editor,
        original
    ) {

        if (editor) {
            editor.remove();
        }


        if (original) {

            original.style.display =
                "";
        }


        td.classList.remove(
            "editing"
        );


        editingCell =
            null;
    }


    /* =====================================================
       DETAILS MODAL
    ===================================================== */

    function openLeadDetails(lead) {

        currentLead =
            lead;


        /*
         * CUSTOMER NAME
         * LOCKED
         */

        setValue(
            "detailCustomerName",
            getCustomerName(lead)
        );


        /*
         * PHONE
         * LOCKED
         */

        setValue(
            "detailPhone",
            getPhone(lead)
        );


        /*
         * EMAIL
         * EDITABLE
         */

        setValue(
            "detailEmail",
            getEmail(lead)
        );


        setValue(
            "detailSource",
            getSource(lead)
        );


        setValue(
            "detailVenue",
            getVenue(lead)
        );


        setValue(
            "detailGuests",
            getGuests(lead)
        );


        setValue(
            "detailEventDate",
            getEventDate(lead)
        );


        setValue(
            "detailAssignedTo",
            getAssignedTo(lead)
        );


        setValue(
            "detailRemarks",
            getRemarks(lead)
        );


        setValue(
            "detailMessage",
            getMessage(lead)
        );


        setSelectValue(
            "detailEventType",
            getEventType(lead)
        );


        setSelectValue(
            "detailStatus",
            normalizeStatus(
                getStatus(lead)
            )
        );


        setSelectValue(
            "detailPriority",
            normalizePriority(
                getPriority(lead)
            )
        );


        setValue(
            "detailFollowUp",
            formatDateTimeLocal(
                getFollowUp(lead)
            )
        );


        setupContactActions(
            lead
        );


        lockCustomerFields();


        showLeadModal();
    }


    function lockCustomerFields() {

        const customer =
            document.getElementById(
                "detailCustomerName"
            );


        const phone =
            document.getElementById(
                "detailPhone"
            );


        [
            customer,
            phone
        ]
            .forEach(
                field => {

                    if (!field) {
                        return;
                    }


                    field.readOnly =
                        true;


                    field.disabled =
                        false;


                    field.classList.add(
                        "crm-readonly"
                    );
                }
            );
    }


    function showLeadModal() {

        const modal =
            findLeadModal();


        if (!modal) {

            console.warn(
                "Lead modal not found."
            );

            return;
        }


        modal.hidden =
            false;


        modal.style.display =
            "flex";


        document.body.classList.add(
            "modal-open"
        );
    }


    function closeLeadModal() {

        const modal =
            findLeadModal();


        if (modal) {

            modal.hidden =
                true;


            modal.style.display =
                "none";
        }


        document.body.classList.remove(
            "modal-open"
        );


        currentLead =
            null;
    }


    function findLeadModal() {

        return (
            document.getElementById(
                "leadModal"
            ) ||
            document.querySelector(
                ".lead-modal"
            ) ||
            document.querySelector(
                ".lead-modal-overlay"
            )
        );
    }


    /* =====================================================
       SAVE DETAILS MODAL
    ===================================================== */

    async function saveLeadDetails() {

        if (!currentLead) {

            showModalMessage(
                "No enquiry selected.",
                "error"
            );

            return;
        }


        const id =
            getId(currentLead);


        if (!id) {

            showModalMessage(
                "Lead ID is missing.",
                "error"
            );

            return;
        }


        const update = {};


        addUpdateIfAvailable(
            update,
            currentLead,
            "email",
            "detailEmail"
        );


        addUpdateIfAvailable(
            update,
            currentLead,
            "source",
            "detailSource"
        );


        addUpdateIfAvailable(
            update,
            currentLead,
            "event_type",
            "detailEventType"
        );


        addUpdateIfAvailable(
            update,
            currentLead,
            "venue",
            "detailVenue"
        );


        addUpdateIfAvailable(
            update,
            currentLead,
            "event_date",
            "detailEventDate"
        );


        addUpdateIfAvailable(
            update,
            currentLead,
            "guests",
            "detailGuests"
        );


        addUpdateIfAvailable(
            update,
            currentLead,
            "status",
            "detailStatus"
        );


        addUpdateIfAvailable(
            update,
            currentLead,
            "priority",
            "detailPriority"
        );


        addUpdateIfAvailable(
            update,
            currentLead,
            "follow_up_at",
            "detailFollowUp"
        );


        addUpdateIfAvailable(
            update,
            currentLead,
            "assigned_to",
            "detailAssignedTo"
        );


        addUpdateIfAvailable(
            update,
            currentLead,
            "remarks",
            "detailRemarks"
        );


        try {

            const saveBtn =
                document.getElementById(
                    "saveLeadBtn"
                );


            if (saveBtn) {

                saveBtn.disabled =
                    true;

                saveBtn.textContent =
                    "Saving...";
            }


            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        getTableName()
                    )
                    .update(update)
                    .eq(
                        getIdField(
                            currentLead
                        ),
                        id
                    )
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            const index =
                allLeads.findIndex(
                    row =>
                        String(
                            getId(row)
                        ) ===
                        String(id)
                );


            if (
                index !== -1
            ) {

                allLeads[index] =
                    data ||
                    {
                        ...allLeads[index],
                        ...update
                    };


                currentLead =
                    allLeads[index];
            }


            updateStatistics();

            applyFilters();


            showModalMessage(
                "Changes saved successfully.",
                "success"
            );


            showToast(
                "Changes saved successfully.",
                "success"
            );


            setTimeout(
                closeLeadModal,
                700
            );


        } catch (error) {

            console.error(
                "Save details error:",
                error
            );


            showModalMessage(
                "Unable to save changes. Please try again.",
                "error"
            );


        } finally {

            const saveBtn =
                document.getElementById(
                    "saveLeadBtn"
                );


            if (saveBtn) {

                saveBtn.disabled =
                    false;

                saveBtn.textContent =
                    "Save Changes";
            }
        }
    }


    function addUpdateIfAvailable(
        update,
        lead,
        logicalField,
        elementId
    ) {

        const field =
            resolveDatabaseField(
                lead,
                logicalField
            );


        const element =
            document.getElementById(
                elementId
            );


        if (
            !field ||
            !element
        ) {

            return;
        }


        let value =
            element.value;


        if (
            element.type ===
            "number"
        ) {

            value =
                value === ""
                    ? null
                    : Number(value);
        }


        update[field] =
            value === ""
                ? null
                : value;
    }


    /* =====================================================
       CONTACT ACTIONS
    ===================================================== */

    function setupContactActions(
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


            const phone =
                getPhone(lead);


            if (phone) {

                const call =
                    document.createElement(
                        "a"
                    );


                call.href =
                    `tel:${phone}`;


                call.textContent =
                    "Call";


                call.className =
                    "contact-action";


                phoneActions.appendChild(
                    call
                );
            }
        }


        if (emailActions) {

            emailActions.innerHTML =
                "";


            const email =
                getEmail(lead);


            if (email) {

                const mail =
                    document.createElement(
                        "a"
                    );


                mail.href =
                    `mailto:${email}`;


                mail.textContent =
                    "Email";


                mail.className =
                    "contact-action";


                emailActions.appendChild(
                    mail
                );
            }
        }
    }


    /* =====================================================
       ADD ENQUIRY
    ===================================================== */

    function openAddEnquiryModal() {

        const modal =
            document.getElementById(
                "addEnquiryModal"
            ) ||
            document.querySelector(
                ".add-enquiry-modal"
            );


        if (!modal) {

            console.warn(
                "Add enquiry modal not found."
            );

            return;
        }


        modal.hidden =
            false;


        modal.style.display =
            "flex";


        document.body.classList.add(
            "modal-open"
        );
    }


    function closeAddEnquiryModal() {

        const modal =
            document.getElementById(
                "addEnquiryModal"
            ) ||
            document.querySelector(
                ".add-enquiry-modal"
            );


        if (modal) {

            modal.hidden =
                true;


            modal.style.display =
                "none";
        }


        const form =
            document.getElementById(
                "addEnquiryForm"
            );


        if (form) {
            form.reset();
        }
    }


    async function handleAddEnquiry(
        event
    ) {

        event.preventDefault();


        const get =
            id =>
                document.getElementById(
                    id
                )?.value?.trim() || "";


        const customerName =
            get("customerName");


        const phone =
            get("customerPhone");


        if (!customerName) {

            showAddMessage(
                "Customer name is required.",
                "error"
            );

            return;
        }


        if (!phone) {

            showAddMessage(
                "Phone number is required.",
                "error"
            );

            return;
        }


        const button =
            document.getElementById(
                "submitEnquiryBtn"
            );


        try {

            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Adding...";
            }


            await detectTable();


            const sample =
                allLeads[0] || {};


            const insert = {};


            setInsertField(
                insert,
                sample,
                "customer_name",
                customerName
            );


            setInsertField(
                insert,
                sample,
                "phone",
                phone
            );


            setInsertField(
                insert,
                sample,
                "email",
                get("customerEmail")
            );


            setInsertField(
                insert,
                sample,
                "source",
                get("leadSource")
            );


            setInsertField(
                insert,
                sample,
                "event_type",
                get("eventType")
            );


            setInsertField(
                insert,
                sample,
                "venue",
                get("venueName")
            );


            setInsertField(
                insert,
                sample,
                "event_date",
                get("eventDate")
            );


            const guests =
                get("guestCount");


            setInsertField(
                insert,
                sample,
                "guests",
                guests
                    ? Number(guests)
                    : null
            );


            setInsertField(
                insert,
                sample,
                "status",
                get("newStatus") || "new"
            );


            setInsertField(
                insert,
                sample,
                "priority",
                get("newPriority") || "normal"
            );


            setInsertField(
                insert,
                sample,
                "follow_up_at",
                get("newFollowUp")
            );


            setInsertField(
                insert,
                sample,
                "assigned_to",
                get("newAssignedTo")
            );


            setInsertField(
                insert,
                sample,
                "message",
                get("customerMessage")
            );


            setInsertField(
                insert,
                sample,
                "remarks",
                get("newRemarks")
            );


            /*
             * If database is currently empty,
             * use the known standard structure.
             */

            if (
                Object.keys(insert).length === 0
            ) {

                Object.assign(
                    insert,
                    {
                        customer_name:
                            customerName,

                        phone:
                            phone,

                        email:
                            get(
                                "customerEmail"
                            ) || null,

                        source:
                            get(
                                "leadSource"
                            ) || null,

                        event_type:
                            get(
                                "eventType"
                            ) || null,

                        venue:
                            get(
                                "venueName"
                            ) || null,

                        event_date:
                            get(
                                "eventDate"
                            ) || null,

                        guests:
                            guests
                                ? Number(
                                    guests
                                )
                                : null,

                        status:
                            get(
                                "newStatus"
                            ) || "new",

                        priority:
                            get(
                                "newPriority"
                            ) || "normal",

                        follow_up_at:
                            get(
                                "newFollowUp"
                            ) || null,

                        assigned_to:
                            get(
                                "newAssignedTo"
                            ) || null,

                        message:
                            get(
                                "customerMessage"
                            ) || null,

                        remarks:
                            get(
                                "newRemarks"
                            ) || null
                    }
                );
            }


            const {
                error
            } =
                await supabaseClient
                    .from(
                        getTableName()
                    )
                    .insert(insert);


            if (error) {
                throw error;
            }


            showAddMessage(
                "Enquiry added successfully.",
                "success"
            );


            await loadLeads();


            setTimeout(
                closeAddEnquiryModal,
                700
            );


        } catch (error) {

            console.error(
                "Add enquiry error:",
                error
            );


            showAddMessage(
                "Unable to add enquiry. Please try again.",
                "error"
            );


        } finally {

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "Add Enquiry";
            }
        }
    }


    /* =====================================================
       FIELD RESOLUTION
    ===================================================== */

    function resolveDatabaseField(
        row,
        logicalField
    ) {

        const map = {

            customer_name: [
                "customer_name",
                "name",
                "full_name",
                "customer"
            ],

            phone: [
                "phone",
                "mobile",
                "phone_number",
                "mobile_number",
                "customer_phone",
                "contact_phone"
            ],

            email: [
                "email",
                "customer_email",
                "email_address",
                "contact_email"
            ],

            event_type: [
                "event_type",
                "event",
                "event_name"
            ],

            venue: [
                "venue",
                "venue_name",
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
                "status",
                "lead_status"
            ],

            priority: [
                "priority",
                "lead_priority"
            ],

            source: [
                "source",
                "lead_source"
            ],

            message: [
                "message",
                "customer_message",
                "comment",
                "comments"
            ],

            remarks: [
                "remarks",
                "internal_remarks",
                "notes",
                "internal_notes"
            ],

            follow_up_at: [
                "follow_up_at",
                "followup_at",
                "follow_up",
                "followup_date"
            ],

            assigned_to: [
                "assigned_to",
                "assigned",
                "employee"
            ]
        };


        return findField(
            row,
            map[logicalField] || []
        );
    }


    function setInsertField(
        target,
        sample,
        logicalField,
        value
    ) {

        const field =
            resolveDatabaseField(
                sample,
                logicalField
            );


        if (field) {

            target[field] =
                value === ""
                    ? null
                    : value;
        }
    }


    /* =====================================================
       FORMATTING
    ===================================================== */

    function normalizeStatus(
        value
    ) {

        return String(
            value || ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );
    }


    function normalizePriority(
        value
    ) {

        return String(
            value || ""
        )
            .trim()
            .toLowerCase();
    }


    function prettyStatus(
        value
    ) {

        return String(
            value || ""
        )
            .trim()
            .replace(
                /-/g,
                " "
            )
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
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
                day:"2-digit",
                month:"short",
                year:"numeric"
            }
        );
    }


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

            return String(value)
                .slice(0,16);
        }


        const pad =
            number =>
                String(number)
                    .padStart(2,"0");


        return (
            date.getFullYear() +
            "-" +
            pad(
                date.getMonth()+1
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


    function getLogicalValue(
        row,
        logicalField
    ) {

        switch (
            logicalField
        ) {

            case "phone":
                return getPhone(row);

            case "email":
                return getEmail(row);

            case "event_type":
                return getEventType(row);

            case "venue":
                return getVenue(row);

            case "event_date":
                return getEventDate(row);

            case "guests":
                return getGuests(row);

            case "status":
                return getStatus(row);

            case "priority":
                return getPriority(row);

            case "source":
                return getSource(row);

            case "message":
                return getMessage(row);

            case "remarks":
                return getRemarks(row);

            case "follow_up_at":
                return getFollowUp(row);

            case "assigned_to":
                return getAssignedTo(row);

            default:
                return "";
        }
    }


    /* =====================================================
       UI HELPERS
    ===================================================== */

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
                value ?? "—";
        }
    }


    function setValue(
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


        if (
            element.tagName === "INPUT" ||
            element.tagName === "TEXTAREA" ||
            element.tagName === "SELECT"
        ) {

            element.value =
                value ?? "";

        } else {

            element.textContent =
                safeDisplay(
                    value
                );
        }
    }


    function setSelectValue(
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


        const normalized =
            normalizeStatus(
                value
            );


        const option =
            Array.from(
                element.options
            )
                .find(
                    item =>
                        normalizeStatus(
                            item.value
                        ) ===
                        normalized
                );


        if (option) {

            element.value =
                option.value;

        } else {

            element.value =
                value || "";
        }
    }


    function safeDisplay(
        value,
        fallback = "—"
    ) {

        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {

            return fallback;
        }


        return String(value);
    }


    function setLoadingState() {

        const tbody =
            document.getElementById(
                "leadsTableBody"
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
            <tr>
                <td colspan="10"
                    class="loading-cell">
                    Loading customer enquiries...
                </td>
            </tr>
        `;
    }


    function showTableMessage(
        message
    ) {

        const tbody =
            document.getElementById(
                "leadsTableBody"
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
            <tr>
                <td colspan="10"
                    class="loading-cell">
                    ${escapeHtml(message)}
                </td>
            </tr>
        `;
    }


    function showModalMessage(
        message,
        type = ""
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


        element.className =
            `form-message ${type}`;
    }


    function showAddMessage(
        message,
        type = ""
    ) {

        const element =
            document.getElementById(
                "addEnquiryMessage"
            );


        if (!element) {
            return;
        }


        element.textContent =
            message;


        element.className =
            `form-message ${type}`;
    }


    function showToast(
        message,
        type = "success"
    ) {

        let toast =
            document.getElementById(
                "crmToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );


            toast.id =
                "crmToast";


            document.body.appendChild(
                toast
            );
        }


        toast.textContent =
            message;


        toast.className =
            `crm-toast ${type}`;


        requestAnimationFrame(
            () => {

                toast.classList.add(
                    "show"
                );
            }
        );


        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
    }


    function showFatalError(
        message
    ) {

        document.body.innerHTML = `
            <div style="
                min-height:100vh;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:30px;
                background:#f4f7fb;
                font-family:Arial,sans-serif;
            ">
                <div style="
                    max-width:520px;
                    width:100%;
                    background:#fff;
                    border:1px solid #e5e7eb;
                    border-radius:18px;
                    padding:35px;
                    box-shadow:0 15px 50px rgba(0,0,0,.08);
                ">
                    <h2 style="
                        margin:0 0 10px;
                        color:#172554;
                    ">
                        Select My Venue CRM
                    </h2>

                    <p style="
                        margin:0;
                        color:#64748b;
                    ">
                        ${escapeHtml(message)}
                    </p>
                </div>
            </div>
        `;
    }


    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
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

})();
