// tithes.js - Member Directory, Tithe Tracking, Allocations, and Reports

let monthlyTithesChart = null;

// Safe date parser: parses "YYYY-MM-DD" as LOCAL date to avoid UTC timezone drift
function parseLocalDate(dateStr) {
    if (!dateStr) return new Date();
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dateStr);
}

// Check if a record's date matches the selected year/month filters
function matchesPeriodFilter(dateStr, yearFilter, monthFilter) {
    if ((!yearFilter || yearFilter === "All") && (!monthFilter || monthFilter === "All")) return true;
    if (!dateStr) return false;
    const d = parseLocalDate(dateStr);
    if (yearFilter && yearFilter !== "All" && d.getFullYear().toString() !== yearFilter.toString()) return false;
    if (monthFilter && monthFilter !== "All") {
        const m1 = (d.getMonth() + 1).toString();
        const m0 = d.getMonth().toString();
        if (monthFilter.toString() !== m1 && monthFilter.toString() !== m0) return false;
    }
    return true;
}

// Dynamically populate all year dropdowns across the entire application
function populateDynamicYearDropdowns() {
    const tithes = getDB("tithes", []);
    const mortuary = getDB("mortuary_contributions", []);
    const expenses = getDB("chapel_expenses", []);
    const deceased = getDB("deceased", []);
    const members = getDB("members", []);

    const yearsSet = new Set();
    const currentYear = new Date().getFullYear();

    // Default standard window (from 2020 through current year + 4)
    for (let y = 2020; y <= Math.max(2030, currentYear + 4); y++) {
        yearsSet.add(y);
    }

    // Extract years from actual records
    const extractYear = (dateStr) => {
        if (!dateStr) return;
        const d = parseLocalDate(dateStr);
        if (!isNaN(d.getFullYear()) && d.getFullYear() > 1900) {
            yearsSet.add(d.getFullYear());
        }
    };

    tithes.forEach(t => extractYear(t.date || t.submittedAt));
    mortuary.forEach(m => extractYear(m.date || m.submittedAt));
    expenses.forEach(e => extractYear(e.date));
    deceased.forEach(d => {
        extractYear(d.dateOfDeath);
        extractYear(d.burialDate);
    });
    members.forEach(m => extractYear(m.dateJoined));

    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);

    // Target year select IDs across the application
    const dropdownIds = [
        "tithes-filter-year",
        "member-report-year",
        "mort-filter-year",
        "leader-filter-year"
    ];

    dropdownIds.forEach(id => {
        const selectEl = document.getElementById(id);
        if (!selectEl) return;

        const currentVal = selectEl.value || "All";
        selectEl.innerHTML = `<option value="All">All Years</option>` +
            sortedYears.map(y => `<option value="${y}">${y}</option>`).join("");
        
        // Restore value if available, or default to All
        if (sortedYears.includes(Number(currentVal)) || currentVal === "All") {
            selectEl.value = currentVal;
        } else {
            selectEl.value = "All";
        }
    });

    // Also update admin-year-dropdown if present
    const adminYearSelect = document.getElementById("admin-year-dropdown");
    if (adminYearSelect) {
        const adminVal = adminYearSelect.value || currentYear.toString();
        adminYearSelect.innerHTML = sortedYears.slice().reverse().map(y => `<option value="${y}">${y}</option>`).join("");
        if (sortedYears.includes(Number(adminVal))) {
            adminYearSelect.value = adminVal;
        } else {
            adminYearSelect.value = currentYear.toString();
        }
    }
}

// Synchronize Member Contributions year & month filters with global filters
function syncMemberYearFilter(val) {
    const globalYear = document.getElementById("tithes-filter-year");
    if (globalYear && globalYear.value !== val) {
        globalYear.value = val;
    }
    renderTitheReports();
}

function syncMemberMonthFilter(val) {
    const globalMonth = document.getElementById("tithes-filter-month");
    if (globalMonth && globalMonth.value !== val) {
        globalMonth.value = val;
    }
    renderTitheReports();
}

// Initialize Tithes module events
function initTithesModule() {
    // Populate dynamic year dropdowns
    populateDynamicYearDropdowns();

    // Member search/filter event listeners
    const searchInput = document.getElementById("member-search");
    if (searchInput) searchInput.addEventListener("input", renderMembersTable);
    
    const filterGsk = document.getElementById("member-filter-gsk");
    if (filterGsk) filterGsk.addEventListener("change", renderMembersTable);

    const filterStatus = document.getElementById("member-filter-status");
    if (filterStatus) filterStatus.addEventListener("change", renderMembersTable);

    // Save member form submit listener
    const memberForm = document.getElementById("member-form");
    if (memberForm) {
        memberForm.addEventListener("submit", saveMemberRecord);
    }

    // Record tithe form submit listener
    const recordTitheForm = document.getElementById("record-tithe-form");
    if (recordTitheForm) {
        recordTitheForm.addEventListener("submit", recordTitheContribution);
    }

    // Set default date for tithe recording form (Today)
    const titheDateInput = document.getElementById("tithe-date");
    if (titheDateInput) {
        titheDateInput.value = getLocalISODate();
    }

    // Record chapel expense form submit listener
    const recordExpenseForm = document.getElementById("record-expense-form");
    if (recordExpenseForm) {
        recordExpenseForm.addEventListener("submit", recordChapelExpense);
    }
    
    // Dynamic Expense Category -> Item dropdown linkage
    const expenseCategorySelect = document.getElementById("expense-category");
    const expenseItemSelect = document.getElementById("expense-item");
    if (expenseCategorySelect && expenseItemSelect) {
        expenseCategorySelect.addEventListener("change", function() {
            expenseItemSelect.innerHTML = `<option value="">-- Choose Item --</option>`;
            if (this.value === "Maintenance") {
                expenseItemSelect.disabled = false;
                const items = ["Water Bill", "Electricity Bill", "Other Maintenance Expenses"];
                items.forEach(i => expenseItemSelect.innerHTML += `<option value="${i}">${i}</option>`);
            } else if (this.value === "Equipment") {
                expenseItemSelect.disabled = false;
                const items = ["Broom", "Dustpan", "Mop", "Electric Fan", "Speaker", "Candles", "Other Equipment"];
                items.forEach(i => expenseItemSelect.innerHTML += `<option value="${i}">${i}</option>`);
            } else {
                expenseItemSelect.disabled = true;
            }
        });
    }

    // Default expense date
    const expenseDate = document.getElementById("expense-date");
    if (expenseDate) {
        expenseDate.value = getLocalISODate();
    }
    
    // Chapel Share Dashboard Month Selector
    const chapelMonthSelect = document.getElementById("chapel-month-select");
    if (chapelMonthSelect) {
        const currentMonth = new Date().getMonth() + 1;
        chapelMonthSelect.value = currentMonth;
        chapelMonthSelect.addEventListener("change", renderChapelFinancialDashboard);
    }

    // Setup reports internal tab switching listeners
    const reportTabs = document.querySelectorAll(".section-tabs .sec-tab");
    reportTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // Remove active style from tabs
            reportTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            // Hide all tab contents
            const contents = document.querySelectorAll(".report-tab-content");
            contents.forEach(c => c.style.display = "none");

            // Show current content
            const targetId = tab.getAttribute("data-tab");
            if (targetId) {
                const targetEl = document.getElementById(targetId);
                if (targetEl) targetEl.style.display = "flex";
            }

            // If switching to financial summary, render the monthly chart
            if (targetId === "tab-financial-summary" && typeof renderMonthlyTithesChart === "function") {
                renderMonthlyTithesChart();
            }
        });
    });
}

// ==================== GSK MEMBER REGISTRY CRUD ====================

// Populate GSK selection lists
function populateGSKDropdowns() {
    const dropdownIds = ["member-filter-gsk", "member-gsk", "deceased-filter-gsk", "dec-gsk", "mort-gsk-select", "user-gsk"];
    const allGroups = typeof getAllGskGroups === "function" ? getAllGskGroups() : GSK_LIST;

    dropdownIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // Save original option (like "All GSKs" or "-- Choose --")
        const firstOpt = el.options[0] ? el.options[0].outerHTML : "";
        el.innerHTML = firstOpt;

        allGroups.forEach(gsk => {
            el.innerHTML += `<option value="${gsk}">${gsk}</option>`;
        });
    });
}

// Render Folder Tabs for Member Directory
// Delete GSK Leader Account by Group Name from Directory
function deleteGskLeaderByGroup(gskGroup) {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role !== "Administrator" && session.role !== "Secretary" && session.role !== "Admin") {
        alert("Access Denied: Only Administrators or Secretaries can delete leader accounts.");
        return;
    }

    const users = getDB("users", []);
    const leaderUser = users.find(u => (u.role === "GskLeader" || !u.role || u.role === "Leader") && (u.gsk === gskGroup || u.name === gskGroup));
    
    if (leaderUser && typeof deleteUserAccount === "function") {
        deleteUserAccount(leaderUser.id);
        return;
    }

    if (confirm(`Are you sure you want to permanently delete the GSK Leader account and all associated data for "${gskGroup}"?`)) {
        // Cascade delete members, tithes, mortuary, claims for this GSK
        let members = getDB("members", []);
        const membersToDelete = members.filter(m => m.gsk === gskGroup);
        const delIds = new Set(membersToDelete.map(m => m.id));
        members = members.filter(m => m.gsk !== gskGroup);
        saveDB("members", members);

        let tithes = getDB("tithes", []);
        tithes = tithes.filter(t => !delIds.has(t.memberId) && t.gsk !== gskGroup);
        saveDB("tithes", tithes);

        let mortuary = getDB("mortuary_contributions", []);
        mortuary = mortuary.filter(c => !delIds.has(c.memberId) && c.gsk !== gskGroup);
        saveDB("mortuary_contributions", mortuary);

        let claims = getDB("gsk_claims", []);
        claims = claims.filter(c => c.gskName !== gskGroup);
        saveDB("gsk_claims", claims);

        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        addSystemLog("DELETE_LEADER", "SETTINGS", `Deleted GSK Leader account and records for ${gskGroup}`, activeUser);
        showToast(`GSK Leader account and records for "${gskGroup}" deleted.`, "warning");

        // Reset filter if active tab was deleted
        const hiddenSelect = document.getElementById("member-filter-gsk");
        if (hiddenSelect && hiddenSelect.value === gskGroup) {
            const allGroups = typeof getAllGskGroups === "function" ? getAllGskGroups() : GSK_LIST;
            hiddenSelect.value = allGroups.length > 0 ? allGroups[0] : "";
        }

        renderMemberFolderTabs();
        renderMembersTable();
        if (typeof renderUserAccounts === "function") renderUserAccounts();
        if (typeof populateGSKDropdowns === "function") populateGSKDropdowns();
        if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
        if (typeof renderChapelFinancialDashboard === "function") renderChapelFinancialDashboard();
        if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();
        if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
        window.dispatchEvent(new Event('storage'));
    }
}

// Render Folder Tabs for Member Directory
function renderMemberFolderTabs() {
    const container = document.getElementById("directory-folder-tabs");
    if (!container) return;
    
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const hiddenSelect = document.getElementById("member-filter-gsk");
    const allGroups = typeof getAllGskGroups === "function" ? getAllGskGroups() : GSK_LIST;
    
    // Administrators and Secretaries see all folders
    // Leaders only see their own
    let options = [];
    if (session.role === "Administrator" || session.role === "Secretary" || session.role === "Admin" || session.role === "Parishioner") {
        allGroups.forEach(gsk => options.push({ label: gsk, value: gsk }));
        // If no filter is currently set, default to parishioner GSK or first GSK
        if (hiddenSelect && !hiddenSelect.value) {
            if (session.role === "Parishioner" && session.assignedGsk && options.some(o => o.value === session.assignedGsk)) {
                hiddenSelect.value = session.assignedGsk;
            } else if (options.length > 0) {
                hiddenSelect.value = options[0].value;
            }
        }
    } else if (session.role === "GskLeader") {
        const leaderGsk = session.assignedGsk || "GSK";
        options = [{ label: leaderGsk, value: leaderGsk }];
        if (hiddenSelect) hiddenSelect.value = leaderGsk; // Default to their GSK
    }
    
    container.innerHTML = "";
    
    options.forEach((opt, index) => {
        const btn = document.createElement("button");
        // Check if this is the currently active filter
        const isActive = hiddenSelect ? (hiddenSelect.value === opt.value) : (index === 0);
        
        btn.className = `btn ${isActive ? 'btn-primary' : 'btn-outline-primary'} folder-tab-btn`;
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.gap = "6px";
        btn.style.whiteSpace = "nowrap";
        
        // Add folder icon
        btn.innerHTML = `<i data-lucide="folder${isActive ? '-open' : ''}"></i> ${opt.label}`;
        
        btn.onclick = () => {
            if (hiddenSelect) {
                hiddenSelect.value = opt.value;
                // Re-render tabs to update active states
                renderMemberFolderTabs();
                // Re-render table
                renderMembersTable();
            }
        };
        
        container.appendChild(btn);
    });
    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

// Render Members Table with Filters
function renderMembersTable() {
    const members = getDB("members", []);
    const tithes = getDB("tithes", []);
    const tbody = document.getElementById("members-table-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    // Search and filter inputs
    const query = (document.getElementById("member-search")?.value || "").toLowerCase();
    const gskFilter = document.getElementById("member-filter-gsk")?.value || "";
    const statusFilter = document.getElementById("member-filter-status")?.value || "";

    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");

    const filtered = members.filter(m => {
        // GSK Leader Filter Restriction
        if (session.role === "GskLeader" && session.assignedGsk && session.assignedGsk !== "All" && m.gsk !== session.assignedGsk) {
            return false;
        }
        const matchesSearch = (m.name || "").toLowerCase().includes(query) || (m.contact || "").toLowerCase().includes(query) || (m.gsk || "").toLowerCase().includes(query);
        const matchesGsk = gskFilter === "" || m.gsk === gskFilter;
        const matchesStatus = statusFilter === "" || m.status === statusFilter;
        return matchesSearch && matchesGsk && matchesStatus;
    });

    // Update Overview Stats
    const totalGskCount = new Set(members.map(m => m.gsk)).size;
    const activeMembersCount = filtered.filter(m => m.status === "Active").length;
    const totalCollectionsVal = tithes.reduce((sum, item) => sum + Number(item.amount), 0);
    
    // Recent Contribution
    let recentContribStr = "₱0.00";
    let recentDateStr = "No contributions recorded";
    if (tithes.length > 0) {
        // Sort tithes by date to find latest
        const sortedTithes = [...tithes].sort((a, b) => new Date(b.date) - new Date(a.date));
        recentContribStr = formatCurrency(sortedTithes[0].amount);
        recentDateStr = `Latest: ${formatDate(sortedTithes[0].date)}`;
    }

    const totalGskEl = document.getElementById("tithe-total-gsk");
    if (totalGskEl) totalGskEl.innerText = totalGskCount;
    
    const activeMembersEl = document.getElementById("tithe-active-members");
    if (activeMembersEl) activeMembersEl.innerText = activeMembersCount;
    
    const totalCollectionsEl = document.getElementById("tithe-total-collections");
    if (totalCollectionsEl) totalCollectionsEl.innerText = formatCurrency(totalCollectionsVal);
    
    const recentContribEl = document.getElementById("tithe-recent-contrib");
    if (recentContribEl) recentContribEl.innerText = recentContribStr;
    
    const recentDateEl = document.getElementById("tithe-recent-contrib-date");
    if (recentDateEl) recentDateEl.innerText = recentDateStr;

    // Build Table Rows
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No members found matching the criteria.</td></tr>`;
        return;
    }

    filtered.forEach(m => {
        const badgeClass = m.status === "Active" ? "badge-success" : "badge-danger";
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${m.name}</strong></td>
            <td>${m.contact || 'N/A'}</td>
            <td>${m.gsk}</td>
            <td>${formatDate(m.joinedDate)}</td>
            <td><span class="badge ${badgeClass}">${m.status}</span></td>
            <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary); text-transform: none; font-family: monospace; font-weight: 600;">@${m.submittedBy || 'maryjoy'}</span></td>
        `;
        tbody.appendChild(tr);
    });

    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

// Open modal for Adding Member
function openAddMemberModal() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied: Parishioners cannot add new members.");
        return;
    }

    document.getElementById("member-modal-title").innerText = "Member Information Form";
    document.getElementById("member-id").value = "";
    document.getElementById("member-form").reset();
    
    // Set default date to today
    document.getElementById("member-joined").value = getLocalISODate();
    
    populateGSKDropdowns();

    const gskSelect = document.getElementById("member-gsk");
    if (session.role === "GskLeader" && gskSelect) {
        gskSelect.value = session.assignedGsk;
        gskSelect.disabled = true;
    } else if (gskSelect) {
        gskSelect.disabled = false;
    }

    openModal("member-modal");
}

// Open modal for Editing Member
function openEditMemberModal(memberId) {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied: Parishioners cannot edit members.");
        return;
    }

    const members = getDB("members");
    const m = members.find(item => item.id === memberId);
    if (!m) return;

    document.getElementById("member-modal-title").innerText = "Edit Member Record";
    document.getElementById("member-id").value = m.id;
    document.getElementById("member-name").value = m.name;
    document.getElementById("member-contact").value = m.contact || "";
    document.getElementById("member-joined").value = m.joinedDate || "";
    document.getElementById("member-status").value = m.status || "Active";
    
    populateGSKDropdowns();
    const gskSelect = document.getElementById("member-gsk");
    if (gskSelect) {
        gskSelect.value = m.gsk;
        if (session.role === "GskLeader") {
            gskSelect.disabled = true;
        } else {
            gskSelect.disabled = false;
        }
    }

    openModal("member-modal");
}

// Save Member Record (Form Submit handler)
function saveMemberRecord(e) {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied: Parishioners cannot modify member profiles.");
        return;
    }

    const id = document.getElementById("member-id").value;
    const name = document.getElementById("member-name").value.trim();
    const gsk = (session.role === "GskLeader" && session.assignedGsk) ? session.assignedGsk : (document.getElementById("member-gsk").value || "GSK San Jose");
    const address = "";
    const contact = document.getElementById("member-contact").value.trim();

    if (contact && !/^\d{11}$/.test(contact)) {
        alert("Contact number must be exactly 11 digits.");
        return;
    }

    const joinedDate = document.getElementById("member-joined").value || getLocalISODate();
    const status = document.getElementById("member-status").value || "Active";

    const members = getDB("members", []);
    const activeUser = localStorage.getItem("GskActiveUser") || session.username || "maryjoy";

    if (id) {
        // Edit mode
        const index = members.findIndex(item => item.id === id);
        if (index !== -1) {
            const oldRecord = members[index];
            members[index] = { ...oldRecord, name, gsk, address, contact, joinedDate, status, submittedBy: oldRecord.submittedBy || activeUser };
            saveDB("members", members);
            if (window.MemberDB && window.MemberDB.update) {
                window.MemberDB.update(members[index]);
            }
            addSystemLog("EDIT_MEMBER", "TITHES", `Updated member info for ${name} (${gsk})`, activeUser);
            showToast("Member updated successfully.");
        }
    } else {
        // Add mode
        const newMember = {
            id: "mem_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            name,
            gsk,
            address,
            contact,
            joinedDate,
            status,
            submittedBy: activeUser
        };
        members.push(newMember);
        saveDB("members", members);
        if (window.MemberDB && window.MemberDB.add) {
            window.MemberDB.add(newMember);
        }
        addSystemLog("ADD_MEMBER", "TITHES", `Added member ${name} to ${gsk}`, activeUser);
        showToast("New member registered successfully.");
    }

    closeModal("member-modal");
    
    // Refresh all member directories and dropdowns across all modules
    if (typeof renderMembersTable === "function") renderMembersTable();
    if (typeof renderLeaderMembers === "function") renderLeaderMembers();
    if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
    if (typeof renderLeaderTithes === "function") renderLeaderTithes();
    if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView();
    if (typeof renderLeaderMortuary === "function") renderLeaderMortuary();
    if (typeof renderMortuaryOverview === "function") renderMortuaryOverview();
    if (typeof renderDeceasedTable === "function") renderDeceasedTable();
    if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
    
    // Trigger global storage event to force cross-tab sync and re-render current view
    window.dispatchEvent(new Event('storage'));
}

// Delete Member Record
function deleteMemberRecord(memberId) {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Access Denied: Parishioners cannot delete member records.");
        return;
    }

    const members = getDB("members", []);
    const m = members.find(item => item.id === memberId);
    if (!m) return;

    if (session.role === "GskLeader") {
        const sessionUser = (session.username || "").toLowerCase().trim();
        const sessionEmail = (session.email || "").toLowerCase().trim();
        const sub = (m.submittedBy || "").toLowerCase().trim();
        const isOwner = (sub && (sub === sessionUser || sub === sessionEmail));
        const isGskMatch = (session.assignedGsk && m.gsk === session.assignedGsk);
        if (!isOwner && !isGskMatch) {
            alert("Access Denied: You can only delete members within your assigned GSK group.");
            return;
        }
    }

    if (confirm(`Are you sure you want to delete ${m.name}? This will remove their record from directory and all related contribution records.`)) {
        // 1. Remove member
        const updated = members.filter(item => item.id !== memberId);
        saveDB("members", updated);
        if (window.MemberDB && window.MemberDB.delete) {
            window.MemberDB.delete(memberId);
        }

        // 2. Cascade delete all Tithes for this member
        let tithes = getDB("tithes", []);
        const tithesToDelete = tithes.filter(t => t.memberId === memberId || (m && t.contributorName === m.name));
        if (tithesToDelete.length > 0) {
            tithes = tithes.filter(t => t.memberId !== memberId && (!m || t.contributorName !== m.name));
            saveDB("tithes", tithes);
            if (window.TitheDB && window.TitheDB.delete) {
                tithesToDelete.forEach(t => window.TitheDB.delete(t.id));
            }
        }

        // 3. Cascade delete all Mortuary contributions for this member
        let mortuary = getDB("mortuary_contributions", []);
        const mortToDelete = mortuary.filter(c => c.memberId === memberId || (m && c.contributorName === m.name));
        if (mortToDelete.length > 0) {
            mortuary = mortuary.filter(c => c.memberId !== memberId && (!m || c.contributorName !== m.name));
            saveDB("mortuary_contributions", mortuary);
            if (window.MortuaryDB && window.MortuaryDB.delete) {
                mortToDelete.forEach(c => window.MortuaryDB.delete(c.id));
            }
        }

        // 4. Cascade delete if this member was registered as a deceased case
        let deceased = getDB("deceased", []);
        const decToDelete = deceased.filter(d => (m && d.name === m.name));
        if (decToDelete.length > 0) {
            deceased = deceased.filter(d => (!m || d.name !== m.name));
            saveDB("deceased", deceased);
            if (window.DeceasedDB && window.DeceasedDB.delete) {
                decToDelete.forEach(d => window.DeceasedDB.delete(d.id));
            }
        }

        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        addSystemLog("DELETE_MEMBER", "TITHES", `Deleted member ${m.name} and all related contributions from database`, activeUser);
        showToast("Member record and associated contributions removed.", "warning");

        // 5. Automatically recalculate all totals and re-render all views
        if (typeof renderMembersTable === "function") renderMembersTable();
        if (typeof renderMemberFolderTabs === "function") renderMemberFolderTabs();
        if (typeof renderLeaderMembers === "function") renderLeaderMembers();
        if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
        if (typeof renderTitheReports === "function") renderTitheReports();
        if (typeof renderChapelFinancialDashboard === "function") renderChapelFinancialDashboard();
        if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();
        if (typeof renderLeaderTithes === "function") renderLeaderTithes();
        if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView();
        if (typeof renderMortuaryReportsView === "function") renderMortuaryReportsView();
        if (typeof renderMortuaryOverview === "function") renderMortuaryOverview();
        if (typeof renderLeaderMortuary === "function") renderLeaderMortuary();
        if (typeof renderMemberContributionsReport === "function") renderMemberContributionsReport();
        if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
        if (typeof renderAdminMonthlyRecords === "function") renderAdminMonthlyRecords();
        window.dispatchEvent(new Event('storage'));
    }
}

// View Member Contributions in Modal
function viewMemberContributions(memberId) {
    const members = getDB("members");
    const tithes = getDB("tithes");
    const mortuary = getDB("mortuary_contributions");
    
    const m = members.find(item => item.id === memberId);
    if (!m) return;

    document.getElementById("mc-modal-member-name").innerText = m.name;

    const modalBody = document.getElementById("member-contributions-modal-body");
    modalBody.innerHTML = "";

    const memberContributions = tithes.filter(t => t.memberId === memberId)
                                      .sort((a,b) => new Date(b.date) - new Date(a.date));

    if (memberContributions.length === 0) {
        modalBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No recorded contributions.</td></tr>`;
    } else {
        const settings = getDB("settings", DEFAULT_SETTINGS);
        const rules = settings.allocations || DEFAULT_SETTINGS.allocations;

        memberContributions.forEach(c => {
            const amt = Number(c.amount);
            const gskAmt = amt * (rules.gskShare / 100);
            const chapelAmt = amt * (rules.chapelShare / 100);
            const parokyaAmt = amt * (rules.parokyaShare / 100);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${formatDate(c.date)}</td>
                <td><strong>${formatCurrency(amt)}</strong></td>
                <td>
                    <span style="font-size:11px;">
                        GSK: ${formatCurrency(gskAmt)} (${rules.gskShare}%)<br>
                        Chapel: ${formatCurrency(chapelAmt)} (${rules.chapelShare}%)<br>
                        Parish: ${formatCurrency(parokyaAmt)} (${rules.parokyaShare}%)
                    </span>
                </td>
            `;
            modalBody.appendChild(tr);
        });
    }

    openModal("member-contributions-modal");
}
window.openMemberContributionsModal = viewMemberContributions;


// ==================== TITHES AND FUND ALLOCATIONS ====================

// Record Tithe Contribution (Form submit)
function recordTitheContribution(e) {
    e.preventDefault();
    const memberId = document.getElementById("tithe-member-select").value;
    const amount = Number(document.getElementById("tithe-amount").value);
    const date = document.getElementById("tithe-date").value;

    if (!memberId) {
        alert("Please select a member.");
        return;
    }

    const tithes = getDB("tithes");
    const members = getDB("members");
    const activeMember = members.find(m => m.id === memberId);
    
    const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
    const newTithe = {
        id: "t_" + Date.now(),
        memberId,
        date,
        amount,
        remarks: "",
        submittedBy: activeUser,
        submittedAt: new Date().toISOString()
    };

    tithes.push(newTithe);
    saveDB("tithes", tithes);

    addSystemLog("RECORD_TITHE", "TITHES", `Recorded tithe of ${formatCurrency(amount)} from ${activeMember.name}`, activeUser);
    showToast(`Recorded tithe contribution of ${formatCurrency(amount)}.`);

    // Reset Form
    document.getElementById("tithe-amount").value = "";
    document.getElementById("tithe-date").value = getLocalISODate();

    // Reload funds views
    renderTitheFundDetails();
    updateMainDashboardStats();
    
    // Trigger global storage event to force cross-tab sync and re-render current view
    window.dispatchEvent(new Event('storage'));
}

// Delete / Undo Tithe contribution
function deleteTitheContribution(id) {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied: Parishioners cannot undo records.");
        return;
    }
    
    const tithes = getDB("tithes", []);
    const t = tithes.find(item => item.id === id);
    if (!t) return;
    
    // Check GSK Leader permission
    if (session.role === "GskLeader") {
        const members = getDB("members", []);
        const member = members.find(m => m.id === t.memberId);
        const tGsk = (member && member.gsk) ? member.gsk : (t.gsk || "");
        if (tGsk && tGsk !== session.assignedGsk) {
            alert("Access Denied: You can only delete contributions within your assigned GSK group.");
            return;
        }
    }

    if (confirm(`Are you sure you want to delete this contribution record (${formatCurrency(t.amount)})?`)) {
        // 1. Remove ONLY the selected record
        const updated = tithes.filter(item => item.id !== id);
        saveDB("tithes", updated);
        if (window.TitheDB && window.TitheDB.delete) {
            window.TitheDB.delete(id);
        }

        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        const members = getDB("members", []);
        const m = members.find(mem => mem.id === t.memberId) || { name: t.contributorName || "Unknown" };
        addSystemLog("DELETE_TITHE", "TITHES", `Deleted tithe contribution of ${formatCurrency(t.amount)} from ${m.name}`, activeUser);
        showToast("Tithe record removed.", "warning");

        // 2. Recalculate and update all affected totals, balances, and reports
        if (typeof renderTitheReports === "function") renderTitheReports();
        if (typeof renderMemberContributionsReport === "function") renderMemberContributionsReport();
        if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
        if (typeof renderLeaderTithes === "function") renderLeaderTithes();
        if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
        if (typeof renderMembersTable === "function") renderMembersTable();
        if (typeof renderChapelFinancialDashboard === "function") renderChapelFinancialDashboard();
        if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();
        if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
        if (typeof renderAdminMonthlyRecords === "function") renderAdminMonthlyRecords();
        
        // 3. Trigger global storage event to force cross-tab sync and re-render current view
        window.dispatchEvent(new Event('storage'));
    }
}

// Render dynamic fund allocations calculations
function renderTitheFundDetails() {
    const tithes = getDB("tithes");
    const members = getDB("members");
    const settings = getDB("settings", DEFAULT_SETTINGS);
    const allocations = settings.allocations || DEFAULT_SETTINGS.allocations;
    
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");

    // Populate active member dropdown in Record Tithe
    if (typeof window.populateMemberDropdown === "function") {
        window.populateMemberDropdown("tithe-member-select");
    }

    // Calculations
    const totalTitheSum = tithes.reduce((sum, item) => sum + Number(item.amount), 0);
    const gskShareSum = totalTitheSum * (allocations.gskShare / 100);
    const chapelShareSum = totalTitheSum * (allocations.chapelShare / 100);
    const parokyaShareSum = totalTitheSum * (allocations.parokyaShare / 100);

    // Update visuals
    const distContainer = document.getElementById("distribution-breakdown-list");
    if (distContainer) {
        distContainer.innerHTML = `
            <div class="recent-item">
                <div class="recent-details">
                    <h4>GSK Share (${allocations.gskShare}%)</h4>
                    <p>Split evenly among 4 GSK groups</p>
                </div>
                <div class="recent-amount plus">${formatCurrency(gskShareSum)}</div>
            </div>
            <div class="recent-item">
                <div class="recent-details">
                    <h4>Chapel Share (${allocations.chapelShare}%)</h4>
                    <p>Reserved for chapel development</p>
                </div>
                <div class="recent-amount plus" style="color: var(--info);">${formatCurrency(chapelShareSum)}</div>
            </div>
            <div class="recent-item">
                <div class="recent-details">
                    <h4>Parish / Parokya Share (${allocations.parokyaShare}%)</h4>
                    <p>Parish office general fund</p>
                </div>
                <div class="recent-amount plus" style="color: var(--warning);">${formatCurrency(parokyaShareSum)}</div>
            </div>
        `;
    }

    // Chapel Share Dashboard rendering
    renderChapelFinancialDashboard();
    
    // GSK Share Dashboard rendering
    if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();

}


// ==================== REPORTS AND HISTORY VIEW ====================

function renderMemberContributionsReport() {
    const tithes = getDB("tithes");
    const mortuary = getDB("mortuary_contributions");
    const members = getDB("members");
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");

    const yearFilter = (document.getElementById("member-report-year")?.value) || (document.getElementById("tithes-filter-year")?.value) || "All";
    const monthFilter = (document.getElementById("member-report-month")?.value) || (document.getElementById("tithes-filter-month")?.value) || "All";
    const searchFilter = document.getElementById("member-report-search") ? document.getElementById("member-report-search").value.toLowerCase().trim() : "";
    const typeFilter = document.getElementById("member-report-type") ? document.getElementById("member-report-type").value : "All";
    const gskFilter = document.getElementById("member-report-gsk") ? document.getElementById("member-report-gsk").value : "All";

    const tbody = document.getElementById("member-unified-report-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // 1. Combine data
    const combinedData = [];

    tithes.forEach(t => {
        combinedData.push({ ...t, recordType: "Tithes" });
    });

    mortuary.forEach(m => {
        combinedData.push({ ...m, recordType: "Mortuary" });
    });

    // 2. Filter data
    const filtered = combinedData.filter(item => {
        const member = members.find(m => m.id === item.memberId) || { name: "Unknown", gsk: "N/A" };
        
        // A. Role-based visibility
        if (session.role === "GskLeader" && member.gsk !== session.assignedGsk) return false;

        // B. Global Date Filters (using safe local date parser)
        if (!matchesPeriodFilter(item.date, yearFilter, monthFilter)) return false;

        // C. Local Filters (Search, GSK, Type)
        if (gskFilter !== "All" && member.gsk !== gskFilter) return false;
        if (typeFilter !== "All" && item.recordType !== typeFilter) return false;
        if (searchFilter && !member.name.toLowerCase().includes(searchFilter)) return false;

        return true;
    });

    // 3. Sort by exact submission timestamp (newest first), fallback to date
    filtered.sort((a,b) => {
        const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : parseLocalDate(a.date).getTime();
        const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : parseLocalDate(b.date).getTime();
        return timeB - timeA;
    });

    // Build period label for empty message
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    let periodLabel = "";
    if (yearFilter !== "All" && monthFilter !== "All") periodLabel = ` for ${monthNames[Number(monthFilter)]} ${yearFilter}`;
    else if (yearFilter !== "All") periodLabel = ` for ${yearFilter}`;
    else if (monthFilter !== "All") periodLabel = ` for ${monthNames[Number(monthFilter)]}`;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding: 20px;">No contributions found${periodLabel}.</td></tr>`;
        return;
    }

    // 4. Render Rows
    filtered.forEach(item => {
        const member = members.find(m => m.id === item.memberId) || { name: "Unknown", gsk: "N/A" };
        const tr = document.createElement("tr");
        
        const badgeClass = item.recordType === "Tithes" ? "badge-primary" : "badge-danger";
        
        let timeStr = "N/A";
        if (item.submittedAt) {
            timeStr = new Date(item.submittedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }

        const canDelete = session.role === "Admin" || session.role === "Administrator" || session.role === "Secretary" || session.role === "GskLeader";
        const actionHtml = canDelete ? `
            <td class="admin-only leader-only">
                <button class="btn btn-danger btn-icon" onclick="deleteUnifiedContribution('${item.id}', '${item.recordType}')" title="Delete Contribution Record">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        ` : ``;

        tr.innerHTML = `
            <td><strong>${member.name}</strong></td>
            <td><strong style="color:var(--text-main);">${formatCurrency(item.amount)}</strong></td>
            <td><span class="badge ${badgeClass}">${item.recordType}</span></td>
            <td>${formatDate(item.date)}</td>
            <td style="color:var(--text-secondary); font-family: monospace; font-size:12px;">${timeStr}</td>
            <td>${member.gsk}</td>
            ${actionHtml}
        `;
        tbody.appendChild(tr);
    });
    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

function deleteUnifiedContribution(id, type) {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied.");
        return;
    }
    if (!confirm("Are you sure you want to permanently delete this contribution record?")) return;

    const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";

    if (type === "Tithes") {
        let tithes = getDB("tithes", []);
        const t = tithes.find(item => item.id === id);
        tithes = tithes.filter(item => item.id !== id);
        saveDB("tithes", tithes);
        if (window.TitheDB && window.TitheDB.delete) {
            window.TitheDB.delete(id);
        }
        addSystemLog("DELETE_TITHE", "TITHES", `Deleted tithe contribution of ${t ? formatCurrency(t.amount) : '₱0.00'}`, activeUser);
        showToast("Tithe record deleted successfully.", "warning");
    } else if (type === "Mortuary") {
        let mort = getDB("mortuary_contributions", []);
        const m = mort.find(item => item.id === id);
        mort = mort.filter(item => item.id !== id);
        saveDB("mortuary_contributions", mort);
        if (window.MortuaryDB && window.MortuaryDB.delete) {
            window.MortuaryDB.delete(id);
        }
        addSystemLog("DELETE_MORTUARY", "MORTUARY", `Deleted mortuary contribution of ${m ? formatCurrency(m.amount) : '₱0.00'}`, activeUser);
        showToast("Mortuary record deleted successfully.", "warning");
    }

    renderMemberContributionsReport();
    if (typeof renderTitheReports === "function") renderTitheReports();
    if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
    if (typeof renderChapelFinancialDashboard === "function") renderChapelFinancialDashboard();
    if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();
    if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView();
    if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
    window.dispatchEvent(new Event('storage'));
}

function renderTitheReports() {
    const tithes = getDB("tithes", []);
    const mortuary = getDB("mortuary_contributions", []);
    const members = getDB("members", []);
    const settings = getDB("settings", DEFAULT_SETTINGS);
    const allocations = settings.allocations || DEFAULT_SETTINGS.allocations;
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");

    const yearFilter = document.getElementById("tithes-filter-year") ? document.getElementById("tithes-filter-year").value : "All";
    const monthFilter = document.getElementById("tithes-filter-month") ? document.getElementById("tithes-filter-month").value : "All";

    // Sync member report filters if present
    const memberYearEl = document.getElementById("member-report-year");
    if (memberYearEl && memberYearEl.value !== yearFilter) {
        memberYearEl.value = yearFilter;
    }
    const memberMonthEl = document.getElementById("member-report-month");
    if (memberMonthEl && memberMonthEl.value !== monthFilter) {
        memberMonthEl.value = monthFilter;
    }

    // Filter tithes based on role and date filters (using safe local date parser)
    const filteredTithes = tithes.filter(t => {
        if (session.role === "GskLeader") {
            const member = members.find(m => m.id === t.memberId);
            if (!member || member.gsk !== session.assignedGsk) return false;
        }
        return matchesPeriodFilter(t.date, yearFilter, monthFilter);
    });

    // Filter mortuary contributions based on role and date filters
    const filteredMortuary = mortuary.filter(m => {
        if (session.role === "GskLeader") {
            if (m.gsk !== session.assignedGsk) return false;
        }
        return matchesPeriodFilter(m.date, yearFilter, monthFilter);
    });

    // Calculate sums for filtered period (or all-time when All Years & All Months)
    const totalTitheSum = filteredTithes.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalMortuarySum = filteredMortuary.reduce((sum, item) => sum + Number(item.amount), 0);

    // Update Quick Stats cards in Reports View
    const dashTithesEl = document.getElementById("dash-tithes-collections");
    if (dashTithesEl) dashTithesEl.innerText = formatCurrency(totalTitheSum);

    const dashMortEl = document.getElementById("dash-mortuary-collections");
    if (dashMortEl) dashMortEl.innerText = formatCurrency(totalMortuarySum);

    // Calculate allocation sums for filtered tithes
    const chapelShareSum = totalTitheSum * (allocations.chapelShare / 100);
    const gskShareSum = totalTitheSum * (allocations.gskShare / 100);
    const parokyaShareSum = totalTitheSum * (allocations.parokyaShare / 100);

    // Update main dash allocation cards if present
    const chapelShareEl = document.getElementById("main-dash-chapel-share");
    if (chapelShareEl) chapelShareEl.innerText = formatCurrency(chapelShareSum);
    const chapelLabelEl = document.getElementById("main-dash-chapel-label");
    if (chapelLabelEl) chapelLabelEl.innerText = `Chapel Share (${allocations.chapelShare}%)`;

    const gskShareEl = document.getElementById("main-dash-gsk-share");
    if (gskShareEl) gskShareEl.innerText = formatCurrency(gskShareSum);
    const gskLabelEl = document.getElementById("main-dash-gsk-label");
    if (gskLabelEl) gskLabelEl.innerText = `GSK Share (${allocations.gskShare}%)`;

    const parishShareEl = document.getElementById("main-dash-parish-share");
    if (parishShareEl) parishShareEl.innerText = formatCurrency(parokyaShareSum);
    const parishLabelEl = document.getElementById("main-dash-parish-label");
    if (parishLabelEl) parishLabelEl.innerText = `Parish Share (${allocations.parokyaShare}%)`;

    // GSK Share Breakdown
    const mainDashGskBreakdown = document.getElementById("main-dash-gsk-breakdown");
    if (mainDashGskBreakdown) {
        mainDashGskBreakdown.innerHTML = "";
        const allGroups = typeof getAllGskGroups === "function" ? getAllGskGroups() : GSK_LIST;
        const perGskShare = allGroups.length > 0 ? (gskShareSum / allGroups.length) : 0;
        allGroups.forEach(gskName => {
            mainDashGskBreakdown.innerHTML += `
                <tr>
                    <td><strong>${gskName}</strong></td>
                    <td><strong style="color:var(--primary);">${formatCurrency(perGskShare)}</strong></td>
                </tr>
            `;
        });
    }

    // Render dynamic monthly chart for the selected period
    renderMonthlyTithesChart(yearFilter, monthFilter);

    // Render chapel expenses table matching period
    if (typeof renderChapelExpenses === "function") {
        renderChapelExpenses();
    }

    // Render activity logs & member contributions report
    renderActivityLogs();
    if (typeof renderMemberContributionsReport === "function") {
        renderMemberContributionsReport();
    }
}

// Render Monthly Tithes trend chart
function renderMonthlyTithesChart(targetYear, targetMonth) {
    const ctx = document.getElementById("monthlyTithesChart");
    if (!ctx) return;

    const tithes = getDB("tithes", []);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySum = Array(12).fill(0);

    const yearFilter = targetYear !== undefined ? targetYear : (document.getElementById("tithes-filter-year") ? document.getElementById("tithes-filter-year").value : "All");
    const monthFilter = targetMonth !== undefined ? targetMonth : (document.getElementById("tithes-filter-month") ? document.getElementById("tithes-filter-month").value : "All");

    tithes.forEach(t => {
        if (!t.date) return;
        const d = parseLocalDate(t.date);
        
        // When a specific year is chosen, only count records from that year
        if (yearFilter !== "All" && d.getFullYear().toString() !== yearFilter.toString()) {
            return;
        }

        const mIdx = d.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
            monthlySum[mIdx] += Number(t.amount || 0);
        }
    });

    if (monthlyTithesChart) {
        monthlyTithesChart.destroy();
    }

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
    const textColor = isDark ? "#94a3b8" : "#64748b";

    // Dynamic Chart Title / Legend Label
    let chartLabel = "Monthly Tithe Collections (All Years) (₱)";
    if (yearFilter !== "All") {
        chartLabel = `Monthly Tithe Collections (${yearFilter}) (₱)`;
    }

    // Highlight selected month point radius if a specific month is selected
    const pointRadii = months.map((_, idx) => {
        if (monthFilter !== "All" && idx.toString() === monthFilter.toString()) {
            return 8;
        }
        return 4;
    });
    const pointBgColors = months.map((_, idx) => {
        if (monthFilter !== "All" && idx.toString() === monthFilter.toString()) {
            return "#f59e0b";
        }
        return "#6366f1";
    });

    monthlyTithesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: chartLabel,
                data: monthlySum,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366f1',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: pointBgColors,
                pointRadius: pointRadii,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor, font: { family: 'Outfit', size: 13, weight: '600' } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        font: { family: 'Outfit' },
                        callback: function(val) { return '₱' + Number(val).toLocaleString(); }
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Render system logs timeline
function renderActivityLogs() {
    const logs = getDB("logs");
    const container = document.getElementById("system-logs-container");
    if (!container) return;

    container.innerHTML = "";

    if (logs.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">No activity logs.</div>`;
        return;
    }

    logs.forEach(log => {
        const entry = document.createElement("div");
        entry.className = `log-entry ${log.category}`;
        entry.innerHTML = `
            <div class="log-time">${formatDate(log.timestamp)} &bull; ${new Date(log.timestamp).toLocaleTimeString()}</div>
            <div>
                <span class="log-user">@${log.user}</span> 
                <span style="color:var(--text-secondary);">${log.details}</span>
            </div>
            <div style="font-size:10px; margin-top:2px; font-weight:700; color:var(--text-muted);">${log.action}</div>
        `;
        container.appendChild(entry);
    });
}

// Clear system log database
function clearActivityLogs() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role !== "Administrator" && session.role !== "Secretary" && session.role !== "Admin") {
        alert("Access Denied: Only Secretaries can clear log trails.");
        return;
    }

    if (confirm("Are you sure you want to clear all activity log trails? This cannot be undone.")) {
        saveDB("logs", []);
        
        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        addSystemLog("CLEAR_LOGS", "SETTINGS", "Cleared all system activity log trails", activeUser);
        showToast("Activity logs cleared.", "warning");
        
        renderActivityLogs();
    }
}

// ==================== GSK SHARE MODULE ====================

function renderGskFinancialDashboard() {
    const tithes = getDB("tithes");
    const claims = getDB("gsk_claims", []);
    const settings = getDB("settings", DEFAULT_SETTINGS);
    const allocations = settings.allocations || DEFAULT_SETTINGS.allocations;
    
    // Total Tithes and Dynamic GSK Allocation from Settings
    const totalTithesSum = tithes.reduce((sum, item) => sum + Number(item.amount), 0);
    const globalGskAllocation = totalTithesSum * (allocations.gskShare / 100);
    
    const allGroups = typeof getAllGskGroups === "function" ? getAllGskGroups() : GSK_LIST;

    // Split evenly among all active GSKs
    const perGskAllocation = allGroups.length > 0 ? (globalGskAllocation / allGroups.length) : 0;
    
    // Calculate global claimed amount
    const globalClaimed = claims.reduce((sum, c) => sum + Number(c.amountClaimed), 0);
    const globalPending = Math.max(0, globalGskAllocation - globalClaimed);

    // Update KPIs
    const allocEl = document.getElementById("gsk-dash-allocation");
    const claimedEl = document.getElementById("gsk-dash-claimed");
    const pendingEl = document.getElementById("gsk-dash-pending");
    
    if (allocEl) allocEl.innerText = formatCurrency(globalGskAllocation);
    if (claimedEl) claimedEl.innerText = formatCurrency(globalClaimed);
    if (pendingEl) pendingEl.innerText = formatCurrency(globalPending);

    // Update Breakdown Table
    const tbody = document.getElementById("gsk-share-breakdown-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const activeSession = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const isAdmin = activeSession.role === "Administrator" || activeSession.role === "Secretary" || activeSession.role === "Admin";

    allGroups.forEach(gskName => {
        // Find all claims for this specific GSK
        const gskClaims = claims.filter(c => c.gskName === gskName);
        const claimedByThisGsk = gskClaims.reduce((sum, c) => sum + Number(c.amountClaimed), 0);
        const pendingAmount = Math.max(0, perGskAllocation - claimedByThisGsk);
        
        let lastClaimDate = "—";
        let lastClaimedBy = "—";
        if (gskClaims.length > 0) {
            // Sort to find newest
            gskClaims.sort((a,b) => new Date(b.date) - new Date(a.date));
            lastClaimDate = formatDate(gskClaims[0].date);
            lastClaimedBy = gskClaims[0].claimedBy || "—";
        }

        const isClaimable = pendingAmount > 0;
        const statusBadge = isClaimable ? `<span class="badge badge-warning">Pending</span>` : `<span class="badge badge-primary">Claimed</span>`;
        
        // Admins can trigger claim on behalf of GSK, or GSK leader can claim their own.
        let actionCell = `<button class="btn btn-secondary btn-icon" disabled><i data-lucide="check"></i></button>`;
        
        if (isAdmin || (activeSession.role === "GskLeader" && activeSession.assignedGsk === gskName)) {
            let claimBtn = isClaimable 
                ? `<button class="btn btn-primary" onclick="claimGskShare('${gskName}', ${pendingAmount})"><i data-lucide="download"></i> Claim</button>`
                : `<button class="btn btn-secondary" disabled>Claim</button>`;
                
            let undoBtn = claimedByThisGsk > 0 
                ? `<button class="btn btn-danger btn-icon" onclick="undoGskClaim('${gskName}')" title="Undo Last Claim" style="margin-left: 4px;"><i data-lucide="rotate-ccw"></i></button>`
                : ``;
                
            actionCell = `<div style="display: flex; gap: 4px;">${claimBtn}${undoBtn}</div>`;
        } else {
            actionCell = `<button class="btn btn-secondary" disabled>Claim</button>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${gskName}</strong></td>
            <td><strong style="color:var(--text-main);">${formatCurrency(perGskAllocation)}</strong></td>
            <td><strong style="color:var(--warning);">${formatCurrency(pendingAmount)}</strong></td>
            <td>${statusBadge}</td>
            <td>${lastClaimDate}</td>
            <td>${lastClaimedBy}</td>
            <td class="admin-only leader-only">${actionCell}</td>
        `;
        tbody.appendChild(tr);
    });

    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

// Process a claim for a GSK
function claimGskShare(gskName, amount) {
    if (amount <= 0) return;
    if (!confirm(`Are you sure you want to process a claim of ${formatCurrency(amount)} for ${gskName}?`)) return;

    const claims = getDB("gsk_claims", []);
    const activeUser = localStorage.getItem("GskActiveUser") || "System";

    const newClaim = {
        id: "claim_" + Date.now(),
        gskName: gskName,
        amountClaimed: amount,
        date: new Date().toISOString(),
        claimedBy: activeUser
    };

    claims.push(newClaim);
    saveDB("gsk_claims", claims);

    addSystemLog("GSK_CLAIM", "TITHES", `Processed GSK Share claim of ${formatCurrency(amount)} for ${gskName}`, activeUser);
    showToast(`Successfully processed claim for ${gskName}.`);

    // Refresh UI
    renderGskFinancialDashboard();
    renderTitheFundDetails();
    updateMainDashboardStats();
    window.dispatchEvent(new Event('storage'));
}

// Undo the most recent claim for a specific GSK
function undoGskClaim(gskName) {
    if (!confirm(`Are you sure you want to undo the last claim made for ${gskName}?`)) return;

    let claims = getDB("gsk_claims", []);
    
    const gskClaims = claims.filter(c => c.gskName === gskName);
    if (gskClaims.length === 0) return;
    
    gskClaims.sort((a,b) => new Date(b.date) - new Date(a.date));
    const claimToDelete = gskClaims[0];
    
    claims = claims.filter(c => c.id !== claimToDelete.id);
    saveDB("gsk_claims", claims);
    
    const activeUser = localStorage.getItem("GskActiveUser") || "System";
    addSystemLog("UNDO_GSK_CLAIM", "TITHES", `Undid GSK Share claim of ${formatCurrency(claimToDelete.amountClaimed)} for ${gskName}`, activeUser);
    showToast(`Successfully reversed the last claim for ${gskName}.`, "warning");
    
    renderGskFinancialDashboard();
    renderTitheFundDetails();
    updateMainDashboardStats();
    window.dispatchEvent(new Event('storage'));
}

// Reset ALL GSK Claims in the entire system
function resetAllGskClaims() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role !== "Administrator" && session.role !== "Secretary" && session.role !== "Admin") {
        alert("Access Denied: Only Administrators or Secretaries can reset the system claims.");
        return;
    }

    if (!confirm("CRITICAL WARNING: Are you sure you want to clear ALL GSK claims? This will reset the claimed amounts back to zero for all groups. This cannot be undone!")) return;

    saveDB("gsk_claims", []);

    const activeUser = localStorage.getItem("GskActiveUser") || "System";
    addSystemLog("RESET_ALL_GSK_CLAIMS", "TITHES", `Cleared all GSK Share claim records in the database`, activeUser);
    showToast("All GSK claims have been successfully cleared.", "warning");

    renderGskFinancialDashboard();
    renderTitheFundDetails();
    updateMainDashboardStats();
    window.dispatchEvent(new Event('storage'));
}

// Automatically claim all pending GSK shares
function claimAllGskPending() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role !== "Administrator" && session.role !== "Secretary" && session.role !== "Admin") {
        alert("Access Denied: Only Administrators or Secretaries can automatically claim all shares.");
        return;
    }

    if (!confirm("Are you sure you want to automatically process claims for ALL currently pending GSK shares? This will drop the GSK Pending balance to exactly ₱0.00.")) return;

    const tithes = getDB("tithes", []);
    let claims = getDB("gsk_claims", []);
    const settings = getDB("settings", DEFAULT_SETTINGS);
    const allocations = settings.allocations || DEFAULT_SETTINGS.allocations;
    const activeUser = localStorage.getItem("GskActiveUser") || "System";
    
    const allGroups = typeof getAllGskGroups === "function" ? getAllGskGroups() : GSK_LIST;
    const totalTithesSum = tithes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const globalGskAllocation = totalTithesSum * (allocations.gskShare / 100);
    const perGskAllocation = allGroups.length > 0 ? (globalGskAllocation / allGroups.length) : 0;

    let claimProcessedCount = 0;

    allGroups.forEach(gskName => {
        const gskClaims = claims.filter(c => c.gskName === gskName);
        const claimedByThisGsk = gskClaims.reduce((sum, c) => sum + Number(c.amountClaimed || 0), 0);
        const pendingAmount = perGskAllocation - claimedByThisGsk;

        if (pendingAmount > 0) {
            claims.push({
                id: "claim_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                gskName: gskName,
                amountClaimed: pendingAmount,
                date: new Date().toISOString(),
                claimedBy: activeUser
            });
            claimProcessedCount++;
        }
    });

    if (claimProcessedCount === 0) {
        showToast("There are no pending amounts to claim.", "info");
        return;
    }

    saveDB("gsk_claims", claims);
    addSystemLog("CLAIM_ALL_GSK", "TITHES", `Automatically processed ${claimProcessedCount} pending GSK Share claims`, activeUser);
    showToast(`Successfully processed all pending claims. GSK Pending is now ₱0.00.`);

    renderGskFinancialDashboard();
    renderTitheFundDetails();
    updateMainDashboardStats();
    window.dispatchEvent(new Event('storage'));
}

// ==================== KAPILYA EXPENSES TRACKING & DASHBOARD ====================

// Render the Chapel Share Financial Dashboard
function renderChapelFinancialDashboard() {
    const monthSelect = document.getElementById("chapel-month-select");
    if (monthSelect) {
        if (!monthSelect.value) {
            monthSelect.value = new Date().getMonth() + 1;
        }
        if (!monthSelect.dataset.bound) {
            monthSelect.dataset.bound = "true";
            monthSelect.addEventListener("change", renderChapelFinancialDashboard);
        }
    }
    const selectedMonth = (monthSelect && monthSelect.value) ? parseInt(monthSelect.value, 10) : (new Date().getMonth() + 1);
    
    const tithes = getDB("tithes", []);
    const members = getDB("members", []);
    const expenses = getDB("chapel_expenses", []);
    const settings = getDB("settings", DEFAULT_SETTINGS);
    const allocations = settings.allocations || DEFAULT_SETTINGS.allocations;
    const chapelPercentage = (allocations.chapelShare || 20) / 100;

    let allTimeTithesSum = 0;
    let monthlyTithesSum = 0;
    let allTimeExpensesSum = 0;
    let monthlyExpensesSum = 0;

    const monthlyIncomeRecords = [];

    // Calculate Tithes Income from valid current tithes
    tithes.forEach(t => {
        const amt = Number(t.amount) || 0;
        allTimeTithesSum += amt;
        
        const dateObj = parseLocalDate(t.date);
        if (dateObj.getMonth() + 1 === selectedMonth) {
            monthlyTithesSum += amt;
            const memberObj = members.find(m => m.id === t.memberId) || { name: t.contributorName || "Member" };
            monthlyIncomeRecords.push({
                date: t.date,
                source: memberObj.name,
                chapelAmount: amt * chapelPercentage
            });
        }
    });

    // Calculate Expenses from valid current chapel expenses
    expenses.forEach(e => {
        const amt = Number(e.amount) || 0;
        allTimeExpensesSum += amt;

        const dateObj = parseLocalDate(e.date);
        if (dateObj.getMonth() + 1 === selectedMonth) {
            monthlyExpensesSum += amt;
        }
    });

    // Derived Metrics:
    // Chapel Share (All Time) = All-time valid tithes * chapel percentage
    // Chapel Net Balance = Chapel Share (All Time) - Total Chapel Expenses (All Time)
    const allTimeChapelIncome = allTimeTithesSum * chapelPercentage;
    const monthlyChapelIncome = monthlyTithesSum * chapelPercentage;
    const allTimeNetBalance = allTimeChapelIncome - allTimeExpensesSum;

    // Update KPI UI
    const incomeEl = document.getElementById("chapel-dash-income");
    const expensesEl = document.getElementById("chapel-dash-expenses");
    const netEl = document.getElementById("chapel-dash-net");

    if (incomeEl) incomeEl.innerText = formatCurrency(monthlyChapelIncome);
    if (expensesEl) expensesEl.innerText = formatCurrency(monthlyExpensesSum);
    if (netEl) netEl.innerText = formatCurrency(allTimeNetBalance);

    // Update Income History Table if present
    const incomeTbody = document.getElementById("chapel-income-table-body");
    if (incomeTbody) {
        incomeTbody.innerHTML = "";
        
        if (monthlyIncomeRecords.length === 0) {
            incomeTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No income recorded for this month.</td></tr>`;
        } else {
            monthlyIncomeRecords.sort((a,b) => parseLocalDate(b.date) - parseLocalDate(a.date));
            
            monthlyIncomeRecords.forEach(record => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${formatDate(record.date)}</td>
                    <td><span class="badge badge-primary">Tithe from ${record.source}</span></td>
                    <td><strong style="color: var(--primary);">${formatCurrency(record.chapelAmount)}</strong></td>
                `;
                incomeTbody.appendChild(tr);
            });
        }
    }

    // Always re-render the expenses breakdown
    renderChapelExpenses();
}

// Render chapel expenses table and populate chapel select dropdown
function renderChapelExpenses() {
    const expenses = getDB("chapel_expenses");
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    
    // Bind filter listeners if not bound
    const searchInput = document.getElementById("expense-search");
    const categorySelect = document.getElementById("expense-filter-category");
    if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = "true";
        searchInput.addEventListener("input", renderChapelExpenses);
    }
    if (categorySelect && !categorySelect.dataset.bound) {
        categorySelect.dataset.bound = "true";
        categorySelect.addEventListener("change", renderChapelExpenses);
    }

    // Default legacy data to Maintenance
    expenses.forEach(exp => {
        if (!exp.category) exp.category = "Maintenance";
        // Migrate legacy "purpose" into item and remarks
        if (exp.purpose && !exp.item) {
            exp.remarks = exp.purpose;
            exp.item = exp.category === "Maintenance" ? "Other Maintenance Expenses" : "Other Equipment";
        }
    });

    const yearFilter = document.getElementById("tithes-filter-year") ? document.getElementById("tithes-filter-year").value : "All";
    const monthFilter = document.getElementById("tithes-filter-month") ? document.getElementById("tithes-filter-month").value : "All";

    // 2. Render table rows
    const tbody = document.getElementById("chapel-expenses-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    // Apply search and filters
    const query = searchInput ? searchInput.value.toLowerCase() : "";
    const filterCat = categorySelect ? categorySelect.value : "";
    
    const filtered = expenses.filter(e => {
        if (!matchesPeriodFilter(e.date, yearFilter, monthFilter)) return false;
        const itemStr = (e.item || "").toLowerCase();
        const remarksStr = (e.remarks || "").toLowerCase();
        const matchesQuery = itemStr.includes(query) || remarksStr.includes(query);
        const matchesCat = filterCat === "" || e.category === filterCat;
        return matchesQuery && matchesCat;
    });
    
    // Sort expenses by date (newest first)
    const sorted = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No chapel expenses found for this period.</td></tr>`;
        return;
    }

    sorted.forEach(exp => {
        const isActionAllowed = session.role === "Administrator" || session.role === "Secretary" || session.role === "Admin";
        const actionCell = isActionAllowed ? `
            <td class="leader-only">
                <button class="btn btn-secondary btn-icon" onclick="editChapelExpense('${exp.id}')" title="Edit Expense">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="btn btn-danger btn-icon delete-btn" onclick="deleteChapelExpense('${exp.id}')" title="Delete Expense">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        ` : `<td class="leader-only"></td>`;
        
        // Include recorded time if available, otherwise just date
        const dtDisplay = formatDate(exp.date);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${dtDisplay}</td>
            <td><span class="badge ${exp.category === 'Equipment' ? 'badge-primary' : 'badge-warning'}">${exp.category}</span></td>
            <td>${exp.item || '-'}</td>
            <td><strong>${formatCurrency(exp.amount)}</strong></td>
            ${actionCell}
        `;
        tbody.appendChild(tr);
    });

    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

// Record new Chapel Expense
function recordChapelExpense(e) {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
    
    const category = document.getElementById("expense-category").value;
    const item = document.getElementById("expense-item").value;
    const amount = Number(document.getElementById("expense-amount").value);
    const date = document.getElementById("expense-date").value;
    const remarks = document.getElementById("expense-remarks").value.trim();

    if (!category || !item) {
        alert("Please select both a category and an expense item.");
        return;
    }

    const expenses = getDB("chapel_expenses");
    const newExpense = {
        id: "exp_" + Date.now(),
        category,
        item,
        amount,
        date,
        remarks,
        recordedBy: activeUser,
        recordedAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    saveDB("chapel_expenses", expenses);
    if (window.ExpenseDB && window.ExpenseDB.add) {
        window.ExpenseDB.add(newExpense);
    }

    addSystemLog("RECORD_CHAPEL_EXPENSE", "TITHES", `Recorded ${category} expense of ${formatCurrency(amount)} for ${item}`, activeUser);
    showToast(`Recorded expense of ${formatCurrency(amount)} for ${item}.`);

    // Reset Form
    const expCat = document.getElementById("expense-category"); if (expCat) expCat.value = "";
    const expItm = document.getElementById("expense-item"); if (expItm) { expItm.innerHTML = `<option value="">-- Choose Item --</option>`; expItm.disabled = true; }
    const expAmt = document.getElementById("expense-amount"); if (expAmt) expAmt.value = "";
    const expDt = document.getElementById("expense-date"); if (expDt) expDt.value = getLocalISODate();
    const expRem = document.getElementById("expense-remarks"); if (expRem) expRem.value = "";

    // Re-render
    renderChapelFinancialDashboard();
    renderChapelExpenses();
    renderTitheFundDetails();
    if (typeof renderTitheReports === "function") renderTitheReports();
    updateMainDashboardStats();
    
    // Trigger global storage event to force cross-tab sync and re-render current view
    window.dispatchEvent(new Event('storage'));
}

// Edit Chapel Expense
function editChapelExpense(id) {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied: Parishioners cannot edit expense records.");
        return;
    }

    const expenses = getDB("chapel_expenses", []);
    const exp = expenses.find(item => item.id === id);
    if (!exp) return;

    const amtStr = prompt(`Edit amount for ${exp.category} - ${exp.item || exp.remarks || 'Expense'} (₱):`, exp.amount);
    if (amtStr === null) return;
    const amt = Number(amtStr);
    if (isNaN(amt) || amt < 0) {
        alert("Invalid amount.");
        return;
    }

    exp.amount = amt;
    saveDB("chapel_expenses", expenses);
    if (window.ExpenseDB && window.ExpenseDB.add) {
        window.ExpenseDB.add(exp);
    }

    const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
    addSystemLog("EDIT_CHAPEL_EXPENSE", "TITHES", `Edited chapel expense amount to ${formatCurrency(amt)} for ${exp.item || exp.category}`, activeUser);
    showToast("Chapel expense updated successfully.");

    renderChapelFinancialDashboard();
    renderChapelExpenses();
    renderTitheFundDetails();
    if (typeof renderTitheReports === "function") renderTitheReports();
    updateMainDashboardStats();

    window.dispatchEvent(new Event('storage'));
}

// Delete / Undo Chapel Expense
function deleteChapelExpense(id) {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied: Parishioners cannot delete expense records.");
        return;
    }

    const expenses = getDB("chapel_expenses", []);
    const exp = expenses.find(item => item.id === id);
    if (!exp) return;

    if (confirm(`Are you sure you want to delete this chapel expense: "${exp.item || exp.category || 'Expense'}" (${formatCurrency(exp.amount)})?`)) {
        const updated = expenses.filter(item => item.id !== id);
        saveDB("chapel_expenses", updated);
        if (window.ExpenseDB && window.ExpenseDB.delete) {
            window.ExpenseDB.delete(id);
        }

        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        addSystemLog("DELETE_CHAPEL_EXPENSE", "TITHES", `Deleted chapel expense of ${formatCurrency(exp.amount)} for ${exp.category}`, activeUser);
        showToast("Chapel expense record removed.", "warning");

        renderChapelFinancialDashboard();
        renderChapelExpenses();
        renderTitheFundDetails();
        if (typeof renderTitheReports === "function") renderTitheReports();
        updateMainDashboardStats();
        
        // Trigger global storage event to force cross-tab sync and re-render current view
        window.dispatchEvent(new Event('storage'));
    }
}

// ==================== GSK LEADER TITHES RECORDS & MEMBERS MANAGEMENT PANEL ====================

function initLeaderTithesModule() {
    // 1. Leader Tithes Form
    const leaderTitheForm = document.getElementById("leader-record-tithe-form");
    if (leaderTitheForm) {
        const newForm = leaderTitheForm.cloneNode(true);
        leaderTitheForm.parentNode.replaceChild(newForm, leaderTitheForm);
        newForm.addEventListener("submit", saveLeaderTitheContribution);
    }

    const leaderTitheSearch = document.getElementById("leader-tithe-search");
    if (leaderTitheSearch) {
        leaderTitheSearch.addEventListener("input", renderLeaderTithes);
    }

    const leaderMortSearch = document.getElementById("leader-mort-search");
    if (leaderMortSearch) {
        leaderMortSearch.addEventListener("input", renderLeaderMortuary);
    }

    const leaderMemberSearch = document.getElementById("leader-member-search");
    if (leaderMemberSearch) {
        leaderMemberSearch.addEventListener("input", renderLeaderMembers);
    }

    const leaderUnifiedSearch = document.getElementById("leader-unified-search");
    if (leaderUnifiedSearch) {
        leaderUnifiedSearch.addEventListener("input", renderUnifiedLeaderSubmissions);
    }

    const leaderTitheDate = document.getElementById("leader-tithe-date");
    if (leaderTitheDate) {
        leaderTitheDate.value = getLocalISODate();
    }
}

// Render Leader Tithes Records
function renderLeaderTithes() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const assignedGsk = session.assignedGsk || "";
    const sessionUser = (session.username || "").toLowerCase().trim();
    const sessionEmail = (session.email || "").toLowerCase().trim();

    const tithes = getDB("tithes", []);
    const members = getDB("members", []);

    if (typeof window.populateMemberDropdown === "function") {
        window.populateMemberDropdown("leader-tithe-member-select");
    }

    const tbody = document.getElementById("leader-tithes-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const query = (document.getElementById("leader-tithe-search")?.value || "").toLowerCase();

    // Show tithes submitted by this leader or belonging to this leader's GSK group (or all if Admin/Secretary/All)
    const filtered = tithes.filter(t => {
        const submitted = (t.submittedBy || "").toLowerCase().trim();
        const isOwner = (submitted && (submitted === sessionUser || submitted === sessionEmail));
        
        const member = members.find(m => m.id === t.memberId);
        const mGsk = (member && member.gsk ? member.gsk : (t.gsk || "")).toLowerCase().trim();
        const aGsk = (assignedGsk || "").toLowerCase().trim();
        const isGskMatch = (aGsk && aGsk !== "all" && aGsk !== "" && (mGsk === aGsk || mGsk.includes(aGsk) || aGsk.includes(mGsk)));
        
        const isVisible = isOwner || isGskMatch || assignedGsk === "All" || !assignedGsk || session.role === "Admin" || session.role === "Administrator" || session.role === "Secretary";
        if (!isVisible) return false;

        const memberName = (member && member.name) ? member.name : (t.contributorName || "Unknown");
        return memberName.toLowerCase().includes(query) || (t.remarks && t.remarks.toLowerCase().includes(query));
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalSum = filtered.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const statVal = document.getElementById("leader-tithe-total-val");
    if (statVal) statVal.innerText = formatCurrency(totalSum);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding: 20px;">No tithe contributions found.</td></tr>`;
        return;
    }

    filtered.forEach(t => {
        const member = members.find(m => m.id === t.memberId) || { name: t.contributorName || "Unknown" };
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${member.name}</strong></td>
            <td>${formatDate(t.date)}</td>
            <td><strong style="color:var(--text-main);">${formatCurrency(t.amount)}</strong></td>
            <td>
                <button class="btn btn-secondary btn-icon" onclick="editLeaderTithe('${t.id}')" title="Edit Contribution">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteLeaderTithe('${t.id}')" title="Delete/Correct Record">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

// Record new Contribution for Leader
let isSubmittingLeaderTithe = false;
function saveLeaderTitheContribution(e) {
    e.preventDefault();
    if (isSubmittingLeaderTithe) return;
    isSubmittingLeaderTithe = true;
    const submitBtn = e.target.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    try {
        const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
        const activeUser = localStorage.getItem("GskActiveUser") || session.username || "maryjoy";

        const memberSelect = document.getElementById("leader-tithe-member-select");
        const memberId = memberSelect ? memberSelect.value : "";
        const amountInput = document.getElementById("leader-tithe-amount");
        const amount = amountInput ? Number(amountInput.value) : 0;
        const dateInput = document.getElementById("leader-tithe-date");
        const date = dateInput && dateInput.value ? dateInput.value : getLocalISODate();

        if (!memberId || isNaN(amount) || amount <= 0) {
            alert("Please select a member and enter a valid positive amount.");
            return;
        }

        const tithes = getDB("tithes", []);
        const members = getDB("members", []);
        const member = members.find(m => m.id === memberId);
        const memberName = member ? member.name : "Member";
        const memberGsk = (member && member.gsk) ? member.gsk : (session.assignedGsk || "GSK");

        const newTithe = {
            id: "t_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            memberId,
            contributorName: memberName,
            gsk: memberGsk,
            date,
            amount,
            remarks: "",
            submittedBy: activeUser,
            submittedAt: new Date().toISOString(),
            status: "Submitted"
        };

        const existingIdx = tithes.findIndex(t => t.id === newTithe.id);
        if (existingIdx === -1) {
            tithes.unshift(newTithe);
            saveDB("tithes", tithes);
        }
        if (window.TitheDB && window.TitheDB.add) {
            window.TitheDB.add(newTithe);
        }

        addSystemLog("RECORD_TITHE", "TITHES", `Recorded tithe of ${formatCurrency(amount)} from ${memberName} (GSK Leader Panel)`, activeUser);
        showToast(`Submission Successful! Your contribution record has been submitted successfully.`);

        if (memberSelect) memberSelect.value = "";
        if (amountInput) amountInput.value = "";
        if (dateInput) dateInput.value = getLocalISODate();

        renderLeaderTithes();
        if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
        if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
        if (typeof renderTitheReports === "function") renderTitheReports();
        if (typeof renderMemberContributionsReport === "function") renderMemberContributionsReport();
        if (typeof renderChapelFinancialDashboard === "function") renderChapelFinancialDashboard();
        if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();
        updateMainDashboardStats();
        if (typeof renderAdminMonthlyRecords === "function") renderAdminMonthlyRecords();
        
        // Trigger global storage event to force cross-tab sync and re-render current view
        window.dispatchEvent(new Event('storage'));
    } finally {
        setTimeout(() => {
            isSubmittingLeaderTithe = false;
            if (submitBtn) submitBtn.disabled = false;
        }, 500);
    }
}

// Edit tithe record from Leader Panel
function editLeaderTithe(id) {
    const tithes = getDB("tithes");
    const t = tithes.find(item => item.id === id);
    if (!t) return;
    const amtStr = prompt("Correct Tithe Amount (₱):", t.amount);
    if (amtStr === null) return;
    const amt = Number(amtStr);
    if (isNaN(amt) || amt <= 0) {
        alert("Invalid amount.");
        return;
    }
    
    t.amount = amt;
    saveDB("tithes", tithes);
    showToast("Tithe record corrected successfully.");
    renderLeaderTithes();
    if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
    if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
    if (typeof renderTitheReports === "function") renderTitheReports();
    updateMainDashboardStats();
    window.dispatchEvent(new Event('storage'));
}

// Delete tithe record from Leader Panel
function deleteLeaderTithe(id) {
    const tithes = getDB("tithes", []);
    const t = tithes.find(item => item.id === id);
    if (!t) return;

    if (confirm(`Are you sure you want to delete this contribution record (${formatCurrency(t.amount)})?`)) {
        // 1. Remove ONLY the selected record
        const updated = tithes.filter(item => item.id !== id);
        saveDB("tithes", updated);
        if (window.TitheDB && window.TitheDB.delete) {
            window.TitheDB.delete(id);
        }

        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        addSystemLog("DELETE_TITHE", "TITHES", `Deleted tithe contribution of ${formatCurrency(t.amount)}`, activeUser);
        showToast("Tithe record removed.", "warning");

        // 2. Automatically recalculate all totals and re-render views
        if (typeof renderLeaderTithes === "function") renderLeaderTithes();
        if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
        if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
        if (typeof renderTitheReports === "function") renderTitheReports();
        if (typeof renderMemberContributionsReport === "function") renderMemberContributionsReport();
        if (typeof renderMembersTable === "function") renderMembersTable();
        if (typeof renderChapelFinancialDashboard === "function") renderChapelFinancialDashboard();
        if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();
        if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
        if (typeof renderAdminMonthlyRecords === "function") renderAdminMonthlyRecords();
        
        // 3. Trigger global storage event to force cross-tab sync and re-render current view
        window.dispatchEvent(new Event('storage'));
    }
}

// Render Leader Member list
function renderLeaderMembers() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const sessionUser = (session.username || "").toLowerCase().trim();
    const sessionEmail = (session.email || "").toLowerCase().trim();

    const members = getDB("members", []);
    const tbody = document.getElementById("leader-members-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const query = (document.getElementById("leader-member-search")?.value || "").toLowerCase();

    // Isolated per leader: show members registered by this specific leader or assigned to their GSK
    const filtered = members.filter(m => {
        const sub = (m.submittedBy || "").toLowerCase().trim();
        const isOwner = (sub && (sub === sessionUser || sub === sessionEmail));
        const isGskMember = (session.assignedGsk && session.assignedGsk !== "All" && m.gsk === session.assignedGsk);
        if (!isOwner && !isGskMember) return false;
        return (m.name || "").toLowerCase().includes(query) || (m.address || "").toLowerCase().includes(query) || (m.contact || "").toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No members registered in your GSK.</td></tr>`;
        return;
    }

    filtered.forEach(m => {
        const badgeClass = m.status === "Active" ? "badge-success" : "badge-danger";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${m.name}</strong></td>
            <td>${m.contact || 'N/A'}</td>
            <td><span class="badge ${badgeClass}">${m.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-icon" onclick="openEditMemberModal('${m.id}')" title="Edit Member">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteMemberRecord('${m.id}')" title="Delete Member" style="margin-left: 4px;">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

// Render Unified Leader Submissions History
function renderUnifiedLeaderSubmissions() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const assignedGsk = session.assignedGsk || "";
    const sessionUser = (session.username || "").toLowerCase().trim();
    const sessionEmail = (session.email || "").toLowerCase().trim();

    const members = getDB("members", []);
    const tithes = getDB("tithes", []);
    const mortuary = getDB("mortuary_contributions", []);
    const deceased = getDB("deceased", []);

    const tbody = document.getElementById("leader-unified-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const query = (document.getElementById("leader-unified-search")?.value || "").toLowerCase();
    const yearFilter = document.getElementById("leader-filter-year") ? document.getElementById("leader-filter-year").value : "All";
    const monthFilter = document.getElementById("leader-filter-month") ? document.getElementById("leader-filter-month").value : "All";

    // Combine Data - strictly isolated to this leader's submitted records
    const combined = [];
    
    // Tithes
    tithes.forEach(t => {
        const submitted = (t.submittedBy || "").toLowerCase().trim();
        const isOwner = (submitted && (submitted === sessionUser || submitted === sessionEmail));
        if (isOwner) {
            const member = members.find(m => m.id === t.memberId) || { name: t.contributorName || "Unknown" };
            combined.push({
                ...t,
                type: "Tithes",
                displayName: member.name || t.contributorName || "Member",
                gsk: t.gsk || assignedGsk
            });
        }
    });

    // Mortuary
    mortuary.forEach(m => {
        const submitted = (m.submittedBy || "").toLowerCase().trim();
        const isOwner = (submitted && (submitted === sessionUser || submitted === sessionEmail));
        if (isOwner) {
            combined.push({
                ...m,
                type: "Mortuary",
                displayName: m.contributorName || "Member",
                gsk: m.gsk || assignedGsk
            });
        }
    });

    // Filter (using safe local date parser)
    const filtered = combined.filter(item => {
        if (!matchesPeriodFilter(item.date, yearFilter, monthFilter)) return false;
        return (item.displayName && item.displayName.toLowerCase().includes(query)) || (item.date && item.date.toLowerCase().includes(query));
    });

    // Sort by exact submission timestamp (newest first), fallback to date
    filtered.sort((a,b) => {
        const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : parseLocalDate(a.date).getTime();
        const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : parseLocalDate(b.date).getTime();
        return timeB - timeA;
    });

    // Build period label for empty message
    const monthNamesL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    let periodLabelL = "";
    if (yearFilter !== "All" && monthFilter !== "All") periodLabelL = ` for ${monthNamesL[Number(monthFilter)]} ${yearFilter}`;
    else if (yearFilter !== "All") periodLabelL = ` for ${yearFilter}`;
    else if (monthFilter !== "All") periodLabelL = ` for ${monthNamesL[Number(monthFilter)]}`;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding: 20px;">No contributions found${periodLabelL}.</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement("tr");
        const typeBadge = item.type === "Tithes" ? "badge-primary" : "badge-danger";
        const statusBadge = item.status === "Submitted" ? "badge-success" : "badge-secondary";
        
        // Exact Date/Time
        let dateSubmitted = "N/A";
        let timeSubmitted = "N/A";
        if (item.submittedAt) {
            const d = new Date(item.submittedAt);
            dateSubmitted = formatDate(item.submittedAt.split('T')[0]);
            timeSubmitted = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } else {
            dateSubmitted = formatDate(item.date); // Fallback to recorded date
        }

        tr.innerHTML = `
            <td><span class="badge ${statusBadge}" style="font-weight:bold;">${item.status || "Submitted"}</span></td>
            <td>${dateSubmitted}</td>
            <td style="font-family: monospace;">${timeSubmitted}</td>
            <td><span class="badge ${typeBadge}">${item.type}</span></td>
            <td><strong>${formatCurrency(item.amount)}</strong></td>
            <td>${item.gsk}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Switch between GSK Share and Chapel Share tabs in Manage Tithes
function switchTithesTab(tab) {
    const gskContainer = document.getElementById("gsk-share-container");
    const chapelContainer = document.getElementById("chapel-share-container");
    const btnGsk = document.getElementById("btn-gsk-tab");
    const btnChapel = document.getElementById("btn-chapel-tab");

    if (!gskContainer || !chapelContainer) return;

    if (tab === 'gsk') {
        gskContainer.style.display = "block";
        chapelContainer.style.display = "none";
        if(btnGsk) btnGsk.className = "btn btn-primary";
        if(btnChapel) btnChapel.className = "btn btn-outline";
        if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();
    } else if (tab === 'chapel') {
        gskContainer.style.display = "none";
        chapelContainer.style.display = "block";
        if(btnChapel) btnChapel.className = "btn btn-primary";
        if(btnGsk) btnGsk.className = "btn btn-outline";
        if (typeof renderChapelFinancialDashboard === "function") renderChapelFinancialDashboard();
        if (typeof renderChapelExpenses === "function") renderChapelExpenses();
    }
}
