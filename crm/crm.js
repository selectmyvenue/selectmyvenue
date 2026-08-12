/* =========================================================
   SELECT MY VENUE — CRM
   crm.js — COMPLETE REPLACEMENT
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       SUPABASE CONFIG
       KEEP THESE VALUES
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


            if (
                !SUPABASE_URL ||
                !SUPABASE_ANON_KEY
            ) {

                showFatalError(
                    "Supabase configuration is missing."
                );

                return;
            }


            supabaseClient =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_ANON_KEY
                );


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
                "Authentication error:",
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


        const name =
            metadata.full_name ||
            metadata.name ||
            metadata.display_name ||
            user?.email ||
            "Employee";


        element.textContent =
            name;
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function setupEvents() {

        /* LOGOUT */

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


        /* REFRESH */

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


        /* SEARCH */

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


        /* STATUS FILTER */

        const statusFilter =
            document.getElementById(
                "statusFilter"
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


        /* PRIORITY FILTER */

        const priorityFilter =
            document.getElementById(
                "priorityFilter"
            );


        if (priorityFilter) {

            priorityFilter.addEventListener(
                "change",
                () => {

                    currentPriorityFilter =
                        statusFilter?.value ||
                        "all";

                    currentPriorityFilter =
                        document.getElementById(
                            "priorityFilter"
                        )?.value ||
                        "all";

                    applyFilters();
                }
            );
        }


        /* STAT CARDS */

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


                        const filter =
                            document.getElementById(
                                "statusFilter"
                            );


                        if (filter) {

                            filter.value =
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


        /* ADD ENQUIRY */

        const addBtn =
            document.getElementById(
                "addEnquiryBtn"
            );


        if (addBtn) {

            addBtn.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openAddEnquiryModal();
                }
            );
        }


        /* CLOSE ADD */

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


        /* ADD FORM */

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


        /* CLOSE DETAILS */

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


        /* CANCEL DETAILS */

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


        /* SAVE DETAILS */

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


        /* ESC */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }


                if (editingCell) {

                    cancelInlineEdit();

                    return;
                }


                closeLeadModal();

                closeAddEnquiryModal();
            }
        );


        /* MODAL BACKDROP */

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
       LOAD DATABASE
    ===================================================== */

    async function loadLeads() {

        setLoadingState();


        try {

            const table =
                await detectTable();


            if (!table) {

                showTableMessage(
                    "Unable to find the enquiries table."
                );

                return;
            }


            crmTable =
                table;


            const {
                data,
                error
            } =
                await supabaseClient
                    .from(crmTable)
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                /*
                 * Some databases may not have
                 * created_at. Try a plain select.
                 */

                const retry =
                    await supabaseClient
                        .from(crmTable)
                        .select("*");


                if (retry.error) {

                    throw retry.error;
                }


                allLeads =
                    retry.data || [];

            } else {

                allLeads =
                    data || [];
            }


            console.log(
                "CRM table:",
                crmTable
            );


            console.log(
                "CRM records:",
                allLeads
            );


            updateStatistics();

            applyFilters();


        } catch (error) {

            console.error(
                "Load enquiries error:",
                error
            );


            showTableMessage(
                "Unable to load enquiries. Please refresh the page."
            );
        }
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


        /*
         * FIRST: enquiries
         */

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

            return "enquiries";
        }


        /*
         * SECOND: leads
         */

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

            return "leads";
        }


        console.error(
            "No CRM table found.",
            {
                enquiries:
                    enquiries.error,

                leads:
                    leads.error
            }
        );


        return null;
    }


    /* =====================================================
       FIELD FINDER
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


        /*
         * Exact match first
         */

        for (
            const name of names
        ) {

            if (
                keys.includes(name)
            ) {

                return name;
            }
        }


        /*
         * Case insensitive
         */

        for (
            const name of names
        ) {

            const lower =
                name.toLowerCase();


            const found =
                keys.find(
                    key =>
                        key.toLowerCase() ===
                        lower
                );


            if (found) {
                return found;
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


        if (!field) {
            return "";
        }


        return row[field];
    }


    /* =====================================================
       FIELD MAPPINGS
    ===================================================== */

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


    function getPhone(row) {

        /*
         * PHONE ONLY.
         *
         * Email fields are intentionally
         * NOT included here.
         */

        return getValue(
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
    }


    function getEmail(row) {

        /*
         * EMAIL ONLY.
         */

        return getValue(
            row,
            [
                "email",
                "customer_email",
                "email_address",
                "contact_email"
            ]
        );
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
                        normalizeStatus(
                            currentStatusFilter
                        )
                    ) {

                        return false;
                    }


                    if (
                        currentPriorityFilter !==
                        "all" &&
                        priority !==
                        normalizePriority(
                            currentPriorityFilter
                        )
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
                            ),

                            getStatus(
                                lead
                            ),

                            getPriority(
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
            countStatus(
                "new"
            )
        );


        setText(
            "contactedCount",
            countStatus(
                "contacted"
            )
        );


        setText(
            "closedCount",
            countStatus(
                "closed"
            )
        );
    }


    function countStatus(status) {

        return allLeads.filter(
            row =>
                normalizeStatus(
                    getStatus(row)
                ) ===
                normalizeStatus(status)
        ).length;
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

            console.warn(
                "leadsTableBody not found."
            );

            return;
        }


        tbody.innerHTML =
            "";


        if (
            !filteredLeads.length
        ) {

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


                /* CUSTOMER */

                const customerTd =
                    document.createElement(
                        "td"
                    );


                customerTd.className =
                    "customer-cell";


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


                /*
                 * PHONE
                 * NON EDITABLE
                 */

                const phoneTd =
                    createEditableCell(
                        lead,
                        "phone",
                        getPhone(lead),
                        false
                    );


                /*
                 * EMAIL
                 * EDITABLE
                 */

                const emailTd =
                    createEditableCell(
                        lead,
                        "email",
                        getEmail(lead),
                        true
                    );


                /*
                 * EVENT
                 */

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


                /*
                 * DATE
                 */

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


                /*
                 * GUESTS
                 */

                const guestsTd =
                    createEditableCell(
                        lead,
                        "guests",
                        getGuests(lead),
                        true,
                        "number"
                    );


                /*
                 * VENUE
                 */

                const venueTd =
                    createEditableCell(
                        lead,
                        "venue",
                        getVenue(lead),
                        true
                    );


                /*
                 * STATUS
                 */

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


                /*
                 * PRIORITY
                 */

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


                /*
                 * ACTION
                 */

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


                tr.appendChild(
                    customerTd
                );

                tr.appendChild(
                    phoneTd
                );

                tr.appendChild(
                    emailTd
                );

                tr.appendChild(
                    eventTd
                );

                tr.appendChild(
                    dateTd
                );

                tr.appendChild(
                    guestsTd
                );

                tr.appendChild(
                    venueTd
                );

                tr.appendChild(
                    statusTd
                );

                tr.appendChild(
                    priorityTd
                );

                tr.appendChild(
                    actionTd
                );


                tbody.appendChild(
                    tr
                );
            }
        );
    }


    /* =====================================================
       CLICK TO EDIT
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
                displayValue,
                "—"
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


        td.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "input"
                    ) ||
                    event.target.closest(
                        "select"
                    ) ||
                    event.target.closest(
                        "button"
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
                    rawValue ??
                        getLogicalValue(
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


            (
                options || []
            ).forEach(
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
                currentValue ??
                "";
        }


        input.className =
            "clean-inline-input";


        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "inline-edit-actions";


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


        actions.appendChild(
            save
        );


        actions.appendChild(
            cancel
        );


        editor.appendChild(
            input
        );


        editor.appendChild(
            actions
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
                    event.key ===
                    "Enter"
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
                    event.key ===
                    "Escape"
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
                    input.select
                ) {

                    input.select();
                }

            },
            10
        );
    }


    /* =====================================================
       SAVE INLINE EDIT
    ===================================================== */

    async function saveInlineEdit(
        td,
        lead,
        logicalField,
        value,
        original,
        editor
    ) {

        const databaseField =
            resolveDatabaseField(
                lead,
                logicalField
            );


        const id =
            getId(lead);


        if (!id) {

            showToast(
                "Lead ID is missing.",
                "error"
            );

            return;
        }


        if (!databaseField) {

            showToast(
                "Database field could not be found.",
                "error"
            );

            return;
        }


        let cleanValue =
            String(
                value ?? ""
            ).trim();


        /*
         * Empty value becomes NULL.
         */

        const databaseValue =
            cleanValue === ""
                ? null
                : cleanValue;


        try {

            const update =
                {};


            update[databaseField] =
                databaseValue;


            const {
                data,
                error
            } =
                await supabaseClient
                    .from(crmTable)
                    .update(update)
                    .eq(
                        getIdField(
                            lead
                        ),
                        id
                    )
                    .select()
                    .single();


            if (error) {

                throw error;
            }


            /*
             * Update local record
             */

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


            /*
             * Update visual value
             */

            if (original) {

                let display =
                    databaseValue ??
                    "—";


                if (
                    logicalField ===
                    "event_date"
                ) {

                    display =
                        formatDate(
                            databaseValue
                        );
                }


                if (
                    logicalField ===
                    "status" ||
                    logicalField ===
                    "priority"
                ) {

                    display =
                        prettyStatus(
                            databaseValue
                        );
                }


                original.textContent =
                    display;
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

    function openLeadDetails(
        lead
    ) {

        currentLead =
            lead;


        /*
         * CUSTOMER NAME
         * NEVER EDITABLE
         */

        setValue(
            "detailCustomerName",
            getCustomerName(lead)
        );


        /*
         * PHONE
         * NEVER EDITABLE
         */

        setValue(
            "detailPhone",
            getPhone(lead)
        );


        /*
         * EMAIL
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


        showLeadModal();
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


    function showLeadModal() {

        const modal =
            findLeadModal();


        if (!modal) {

            console.error(
                "Lead details modal was not found."
            );

            showToast(
                "Details window could not be opened.",
                "error"
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


    /* =====================================================
       DETAILS SAVE
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


        const update =
            {};


        /*
         * EMAIL
         */

        addUpdateIfAvailable(
            update,
            currentLead,
            "email",
            "detailEmail"
        );


        /*
         * EVENT
         */

        addUpdateIfAvailable(
            update,
            currentLead,
            "event_type",
            "detailEventType"
        );


        /*
         * VENUE
         */

        addUpdateIfAvailable(
            update,
            currentLead,
            "venue",
            "detailVenue"
        );


        /*
         * DATE
         */

        addUpdateIfAvailable(
            update,
            currentLead,
            "event_date",
            "detailEventDate"
        );


        /*
         * GUESTS
         */

        addUpdateIfAvailable(
            update,
            currentLead,
            "guests",
            "detailGuests"
        );


        /*
         * STATUS
         */

        addUpdateIfAvailable(
            update,
            currentLead,
            "status",
            "detailStatus"
        );


        /*
         * PRIORITY
         */

        addUpdateIfAvailable(
            update,
            currentLead,
            "priority",
            "detailPriority"
        );


        /*
         * FOLLOW UP
         */

        addUpdateIfAvailable(
            update,
            currentLead,
            "follow_up_at",
            "detailFollowUp"
        );


        /*
         * ASSIGNED TO
         */

        addUpdateIfAvailable(
            update,
            currentLead,
            "assigned_to",
            "detailAssignedTo"
        );


        /*
         * REMARKS
         */

        addUpdateIfAvailable(
            update,
            currentLead,
            "remarks",
            "detailRemarks"
        );


        /*
         * Nothing to save
         */

        if (
            !Object.keys(update).length
        ) {

            showModalMessage(
                "No editable fields were found.",
                "error"
            );

            return;
        }


        const saveBtn =
            document.getElementById(
                "saveLeadBtn"
            );


        try {

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
                    .from(crmTable)
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


        /*
         * Do not allow customer name
         * or phone to be updated.
         */

        if (
            logicalField ===
            "customer_name" ||
            logicalField ===
            "phone"
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

            showToast(
                "Add Enquiry window could not be found.",
                "error"
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
                )?.value?.trim() ||
                "";


        const customerName =
            get("customerName");


        const phone =
            get("customerPhone");


        const email =
            get("customerEmail");


        const source =
            get("leadSource");


        const eventType =
            get("eventType");


        const venue =
            get("venueName");


        const eventDate =
            get("eventDate");


        const guestsRaw =
            get("guestCount");


        const status =
            get("newStatus") ||
            "new";


        const priority =
            get("newPriority") ||
            "normal";


        const followUp =
            get("newFollowUp");


        const assignedTo =
            get("newAssignedTo");


        const customerMessage =
            get("customerMessage");


        const remarks =
            get("newRemarks");


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


            const sample =
                allLeads[0] ||
                null;


            const insert =
                {};


            /*
             * IMPORTANT:
             * Existing column names are detected
             * from existing Supabase data.
             */

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
                email || null
            );


            setInsertField(
                insert,
                sample,
                "source",
                source || null
            );


            setInsertField(
                insert,
                sample,
                "event_type",
                eventType || null
            );


            setInsertField(
                insert,
                sample,
                "venue",
                venue || null
            );


            setInsertField(
                insert,
                sample,
                "event_date",
                eventDate || null
            );


            setInsertField(
                insert,
                sample,
                "guests",
                guestsRaw
                    ? Number(
                        guestsRaw
                    )
                    : null
            );


            setInsertField(
                insert,
                sample,
                "status",
                status
            );


            setInsertField(
                insert,
                sample,
                "priority",
                priority
            );


            setInsertField(
                insert,
                sample,
                "follow_up_at",
                followUp ||
                    null
            );


            setInsertField(
                insert,
                sample,
                "assigned_to",
                assignedTo ||
                    null
            );


            setInsertField(
                insert,
                sample,
                "message",
                customerMessage ||
                    null
            );


            setInsertField(
                insert,
                sample,
                "remarks",
                remarks ||
                    null
            );


            /*
             * If there are no existing rows,
             * use the standard schema.
             */

            if (
                !Object.keys(
                    insert
                ).length
            ) {

                Object.assign(
                    insert,
                    {
                        customer_name:
                            customerName,

                        phone:
                            phone,

                        email:
                            email ||
                            null,

                        source:
                            source ||
                            null,

                        event_type:
                            eventType ||
                            null,

                        venue:
                            venue ||
                            null,

                        event_date:
                            eventDate ||
                            null,

                        guests:
                            guestsRaw
                                ? Number(
                                    guestsRaw
                                )
                                : null,

                        status:
                            status,

                        priority:
                            priority,

                        follow_up_at:
                            followUp ||
                            null,

                        assigned_to:
                            assignedTo ||
                            null,

                        message:
                            customerMessage ||
                            null,

                        remarks:
                            remarks ||
                            null
                    }
                );
            }


            const {
                error
            } =
                await supabaseClient
                    .from(crmTable)
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
                error?.message ||
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
       DATABASE FIELD RESOLUTION
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
            map[logicalField] ||
            []
        );
    }


    function setInsertField(
        target,
        sample,
        logicalField,
        value
    ) {

        if (!sample) {

            return;
        }


        const field =
            resolveDatabaseField(
                sample,
                logicalField
            );


        if (field) {

            target[field] =
                value;
        }
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
            ) ||
            "id"
        );
    }


    /* =====================================================
       LOGICAL VALUES
    ===================================================== */

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

        const text =
            String(
                value || ""
            )
                .trim()
                .replace(
                    /-/g,
                    " "
                );


        return text.replace(
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
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"
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

            return String(
                value
            ).slice(
                0,
                16
            );
        }


        const pad =
            number =>
                String(
                    number
                ).padStart(
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
                value ??
                "—";
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
            element.tagName ===
            "INPUT" ||
            element.tagName ===
            "TEXTAREA" ||
            element.tagName ===
            "SELECT"
        ) {

            element.value =
                value ??
                "";

        } else {

            element.textContent =
                safeDisplay(
                    value,
                    "—"
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
            ).find(
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
                value ||
                "";
        }
    }


    function safeDisplay(
        value,
        fallback = "—"
    ) {

        if (
            value === null ||
            value === undefined ||
            String(
                value
            ).trim() === ""
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
                <td
                    colspan="10"
                    class="loading-cell"
                >
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
                <td
                    colspan="10"
                    class="loading-cell"
                >
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
            <div
                style="
                    min-height:100vh;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:30px;
                    background:#f4f7fb;
                    font-family:Arial,sans-serif;
                "
            >
                <div
                    style="
                        max-width:520px;
                        width:100%;
                        background:#fff;
                        border:1px solid #e5e7eb;
                        border-radius:18px;
                        padding:35px;
                        box-shadow:0 15px 50px rgba(0,0,0,.08);
                    "
                >
                    <h2
                        style="
                            margin:0 0 10px;
                            color:#172554;
                        "
                    >
                        Select My Venue CRM
                    </h2>

                    <p
                        style="
                            margin:0;
                            color:#64748b;
                        "
                    >
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
