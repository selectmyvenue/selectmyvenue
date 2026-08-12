/* =========================================================
   SELECT MY VENUE — CRM
   crm.js
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
       These are already supplied by dashboard.html
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


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener("DOMContentLoaded", init);


    async function init() {

        try {

            if (!window.supabase) {
                showFatalError(
                    "Supabase library could not be loaded."
                );
                return;
            }

            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
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
        } = await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "Session error:",
                error
            );

            return;
        }

        if (!data || !data.session) {

            /*
             * If dashboard is opened directly without login,
             * return to CRM login page.
             */

            window.location.href = "./login.html";

            return;
        }


        const user =
            data.session.user;


        setStaffName(user);

        await loadLeads();
    }


    function setStaffName(user) {

        const staffName =
            document.getElementById("staffName");

        if (!staffName) {
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

        staffName.textContent = name;
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function setupEvents() {

        /* Logout */

        const logoutBtn =
            document.getElementById("logoutBtn");

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                logout
            );
        }


        /* Refresh */

        const refreshBtn =
            document.getElementById("refreshBtn");

        if (refreshBtn) {

            refreshBtn.addEventListener(
                "click",
                async () => {

                    await loadLeads();
                }
            );
        }


        /* Search */

        const searchInput =
            document.getElementById("searchInput");

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


        /* Status filter */

        const statusFilter =
            document.getElementById("statusFilter");

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


        /* Priority filter */

        const priorityFilter =
            document.getElementById(
                "priorityFilter"
            );

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


        /* Stat cards */

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
                            value === "all"
                                ? "all"
                                : value;

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


        /* Add enquiry */

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


        /* Close add enquiry */

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


        /* Add enquiry form */

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


        /* Close details */

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


        /* Cancel details */

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


        /* Save details */

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


        /*
         * ESC closes modal
         */

        document.addEventListener(
            "keydown",
            event => {

                if (event.key !== "Escape") {
                    return;
                }

                closeLeadModal();
                closeAddEnquiryModal();
            }
        );


        /*
         * Click outside modal
         */

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
       LOAD LEADS
    ===================================================== */

    async function loadLeads() {

        setLoadingState();

        try {

            /*
             * IMPORTANT:
             * Select * keeps the existing database structure.
             * We do NOT rename or overwrite database columns.
             */

            const {
                data,
                error
            } = await supabaseClient
                .from("enquiries")
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

                /*
                 * Some projects may use "leads"
                 * instead of "enquiries".
                 */

                const fallback =
                    await supabaseClient
                        .from("leads")
                        .select("*")
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        );

                if (
                    fallback.error ||
                    !fallback.data
                ) {

                    throw error;
                }

                allLeads =
                    fallback.data;

            } else {

                allLeads =
                    data || [];
            }


            console.log(
                "CRM leads loaded:",
                allLeads
            );


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
       DATABASE FIELD MAPPING
    ===================================================== */

    function findField(row, names) {

        if (!row) {
            return null;
        }

        const keys =
            Object.keys(row);

        for (
            const wanted of names
        ) {

            const exact =
                keys.find(
                    key =>
                        key === wanted
                );

            if (exact) {
                return exact;
            }
        }


        for (
            const wanted of names
        ) {

            const lowerWanted =
                wanted.toLowerCase();

            const match =
                keys.find(
                    key =>
                        key.toLowerCase() ===
                        lowerWanted
                );

            if (match) {
                return match;
            }
        }


        return null;
    }


    function getValue(row, names) {

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

        const total =
            allLeads.length;


        const newCount =
            allLeads.filter(
                row =>
                    normalizeStatus(
                        getStatus(row)
                    ) === "new"
            ).length;


        const contactedCount =
            allLeads.filter(
                row =>
                    normalizeStatus(
                        getStatus(row)
                    ) === "contacted"
            ).length;


        const closedCount =
            allLeads.filter(
                row =>
                    normalizeStatus(
                        getStatus(row)
                    ) === "closed"
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


    /* =====================================================
       TABLE
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


                /* PHONE */

                const phoneTd =
                    createEditableCell(
                        lead,
                        "phone",
                        getPhone(lead),
                        false
                    );


                /* EMAIL */

                const emailTd =
                    createEditableCell(
                        lead,
                        "email",
                        getEmail(lead),
                        true
                    );


                /* EVENT */

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


                /* DATE */

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


                /* GUESTS */

                const guestsTd =
                    createEditableCell(
                        lead,
                        "guests",
                        getGuests(lead),
                        true,
                        "number"
                    );


                /* LOCATION / VENUE */

                const locationTd =
                    createEditableCell(
                        lead,
                        "venue",
                        getVenue(lead),
                        true
                    );


                /* STATUS */

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


                /* PRIORITY */

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
                    locationTd
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
       CLEAN CLICK-TO-EDIT CELL
       NO PENCIL / NO EDIT ICON
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


        /*
         * Important:
         * There is intentionally NO pencil,
         * edit icon, title or visible indicator.
         */

        td.classList.add(
            "click-to-edit"
        );


        td.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "input, select, button"
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
       INLINE EDIT
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


        editingCell = td;

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


        if (type === "select") {

            input =
                document.createElement(
                    "select"
                );

            options.forEach(
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


        editor.appendChild(
            input
        );

        editor.appendChild(
            save
        );

        editor.appendChild(
            cancel
        );


        td.appendChild(
            editor
        );


        save.addEventListener(
            "click",
            async event => {

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
                    input.select
                ) {
                    input.select();
                }

            },
            0
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

        const cleanValue =
            value.trim();


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
                `Could not find database field for ${logicalField}.`,
                "error"
            );

            return;
        }


        try {

            const update = {};

            update[databaseField] =
                cleanValue || null;


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


            /*
             * Update local record.
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
                        [databaseField]:
                            cleanValue ||
                            null
                    };

                lead =
                    allLeads[index];
            }


            if (original) {

                let display =
                    cleanValue ||
                    "—";


                if (
                    logicalField ===
                    "event_date"
                ) {

                    display =
                        formatDate(
                            cleanValue
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
                            cleanValue
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


        editingCell = null;
    }


    /* =====================================================
       DETAILS MODAL
    ===================================================== */

    function openLeadDetails(lead) {

        currentLead =
            lead;


        setValue(
            "detailCustomerName",
            getCustomerName(lead)
        );

        setValue(
            "detailPhone",
            getPhone(lead)
        );

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


        const followUp =
            getFollowUp(lead);


        setValue(
            "detailFollowUp",
            formatDateTimeLocal(
                followUp
            )
        );


        /*
         * Phone/email action buttons
         */

        setupContactActions(
            lead
        );


        showLeadModal();
    }


    function showLeadModal() {

        const modal =
            findLeadModal();


        if (!modal) {

            console.warn(
                "Lead modal container not found."
            );

            return;
        }


        modal.hidden = false;

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

            modal.hidden = true;

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
       SAVE DETAILS
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


        const table =
            getTableName();


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
                    .from(table)
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
                () => {

                    closeLeadModal();

                },
                700
            );


        } catch (error) {

            console.error(
                "Save lead error:",
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
            document.querySelector(
                ".add-enquiry-modal"
            ) ||
            document.getElementById(
                "addEnquiryModal"
            );


        if (!modal) {

            console.warn(
                "Add enquiry modal not found."
            );

            return;
        }


        modal.hidden = false;

        modal.style.display =
            "flex";


        document.body.classList.add(
            "modal-open"
        );
    }


    function closeAddEnquiryModal() {

        const modal =
            document.querySelector(
                ".add-enquiry-modal"
            ) ||
            document.getElementById(
                "addEnquiryModal"
            );


        if (modal) {

            modal.hidden = true;

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


        const form =
            event.currentTarget;


        const message =
            document.getElementById(
                "addEnquiryMessage"
            );


        const button =
            document.getElementById(
                "submitEnquiryBtn"
            );


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


        try {

            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Adding...";
            }


            const table =
                getTableName();


            /*
             * Build insert using the fields
             * that actually exist in the
             * current database.
             */

            const sample =
                allLeads[0] ||
                {};


            const insert =
                {};


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
                email
            );

            setInsertField(
                insert,
                sample,
                "source",
                source
            );

            setInsertField(
                insert,
                sample,
                "event_type",
                eventType
            );

            setInsertField(
                insert,
                sample,
                "venue",
                venue
            );

            setInsertField(
                insert,
                sample,
                "event_date",
                eventDate
            );

            setInsertField(
                insert,
                sample,
                "guests",
                guestsRaw
                    ? Number(guestsRaw)
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
                followUp
            );

            setInsertField(
                insert,
                sample,
                "assigned_to",
                assignedTo
            );

            setInsertField(
                insert,
                sample,
                "message",
                customerMessage
            );

            setInsertField(
                insert,
                sample,
                "remarks",
                remarks
            );


            /*
             * If database is empty, use the
             * standard column names from
             * the current dashboard form.
             */

            if (!Object.keys(insert).length) {

                Object.assign(
                    insert,
                    {
                        customer_name:
                            customerName,

                        phone:
                            phone,

                        email:
                            email || null,

                        source:
                            source || null,

                        event_type:
                            eventType || null,

                        venue:
                            venue || null,

                        event_date:
                            eventDate || null,

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
                            followUp || null,

                        assigned_to:
                            assignedTo || null,

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
                    .from(table)
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
                () => {

                    closeAddEnquiryModal();

                },
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
       DATABASE HELPERS
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


    function getTableName() {

        /*
         * We remember which table loaded
         * successfully.
         */

        return window.__CRM_TABLE__ ||
            (
                allLeads.length
                    ? window.__CRM_TABLE__ ||
                      "enquiries"
                    : "enquiries"
            );
    }


    function getIdField(row) {

        return findField(
            row,
            [
                "id",
                "enquiry_id",
                "lead_id"
            ]
        ) || "id";
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


        return text
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
                day: "2-digit",
                month: "short",
                year: "numeric"
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
                .slice(0, 16);
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
            document.getElementById(id);

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
            document.getElementById(id);

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
                value ?? "";

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
            document.getElementById(id);

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
                    ) === normalized
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
                <td
                    colspan="9"
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
                    colspan="9"
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


    /* =====================================================
       TABLE DETECTION
    ===================================================== */

    /*
     * We try enquiries first.
     * If enquiries is successful, remember it.
     * If not, try leads.
     */

    async function detectTable() {

        if (
            window.__CRM_TABLE__
        ) {

            return window.__CRM_TABLE__;
        }


        const enquiries =
            await supabaseClient
                .from("enquiries")
                .select("*")
                .limit(1);


        if (!enquiries.error) {

            window.__CRM_TABLE__ =
                "enquiries";

            return "enquiries";
        }


        const leads =
            await supabaseClient
                .from("leads")
                .select("*")
                .limit(1);


        if (!leads.error) {

            window.__CRM_TABLE__ =
                "leads";

            return "leads";
        }


        return "enquiries";
    }


    /*
     * Replace loadLeads table selection with
     * automatic table detection.
     */

    const originalLoadLeads =
        loadLeads;


    loadLeads = async function() {

        await detectTable();

        return originalLoadLeads();
    };


    /* =====================================================
       PATCH loadLeads TABLE NAME
    ===================================================== */

    /*
     * The function above uses the remembered table.
     * This keeps existing Supabase data untouched.
     */

})();
