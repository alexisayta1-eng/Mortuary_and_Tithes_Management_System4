// mortuary.js - Deceased Registry, Condolence Contributions, and Payout Analytics

let mortuaryChart = null;

function initMortuaryModule() {
    if (typeof populateDynamicYearDropdowns === "function") populateDynamicYearDropdowns();

    // Search & Filter event listeners for Deceased registry
    const searchInput = document.getElementById("deceased-search");
    if (searchInput) searchInput.addEventListener("input", renderDeceasedTable);

    const filterGsk = document.getElementById("deceased-filter-gsk");
    if (filterGsk) filterGsk.addEventListener("change", renderDeceasedTable);

    const filterStatus = document.getElementById("deceased-filter-status");
    if (filterStatus) filterStatus.addEventListener("change", renderDeceasedTable);

    // Deceased save record form
    const deceasedForm = document.getElementById("deceased-form");
    if (deceasedForm) {
        deceasedForm.addEventListener("submit", saveDeceasedRecord);
    }

    // Deceased member select change listener to auto-fill GSK
    const memberSelect = document.getElementById("dec-member-select");
    if (memberSelect) {
        memberSelect.addEventListener("change", (e) => {
            const memberId = e.target.value;
            if (!memberId) return;
            const members = getDB("members");
            const member = members.find(m => m.id === memberId);
            if (member) {
                const decGsk = document.getElementById("dec-gsk");
                if (decGsk) decGsk.value = member.gsk;
            }
        });
    }

    // Record mortuary contribution form
    const recordMortForm = document.getElementById("record-mortuary-form");
    if (recordMortForm && !recordMortForm.dataset.initialized) {
        recordMortForm.dataset.initialized = "true";
        recordMortForm.addEventListener("submit", recordMortuaryContribution);
    }

    // Default contribution date
    const mortDate = document.getElementById("mort-date");
    if (mortDate) {
        mortDate.value = getLocalISODate();
    }
    
    if (typeof renderMortuaryContributionsView === "function") {
        renderMortuaryContributionsView();
    }
}

// ==================== 1. MORTUARY OVERVIEW ====================

function renderMortuaryOverview() {
    const deceased = getDB("deceased");
    const contributions = getDB("mortuary_contributions");
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");

    // Filter lists
    const filteredDeceased = deceased.filter(d => {
        if (session.role === "GskLeader" && d.gsk !== session.assignedGsk) {
            return false;
        }
        return true;
    });

    const filteredContribs = contributions.filter(c => {
        if (session.role === "GskLeader") {
            const d = deceased.find(item => item.id === c.deceasedId);
            return (d && d.gsk === session.assignedGsk) || c.gsk === session.assignedGsk;
        }
        return true;
    });

    // Metrics calculations
    const totalDeceased = filteredDeceased.length;
    const activeCases = filteredDeceased.filter(d => d.status === "Active").length;
    const totalCollections = filteredContribs.reduce((sum, c) => sum + Number(c.amount), 0);
    const avgCollection = totalDeceased > 0 ? (totalCollections / totalDeceased) : 0;

    document.getElementById("mort-total-deceased").innerText = totalDeceased;
    document.getElementById("mort-active-cases").innerText = activeCases;
    document.getElementById("mort-total-collections").innerText = formatCurrency(totalCollections);
    document.getElementById("mort-avg-collection").innerText = formatCurrency(avgCollection);

    // Populate Overview Table
    const tbody = document.getElementById("mortuary-overview-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (filteredDeceased.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No deceased records available.</td></tr>`;
        return;
    }

    filteredDeceased.forEach(d => {
        // Calculate total contributions for this deceased
        const caseContributions = contributions.filter(c => c.deceasedId === d.id);
        const caseTotal = caseContributions.reduce((sum, c) => sum + Number(c.amount), 0);
        
        const badgeClass = d.status === "Active" ? "badge-warning" : "badge-success";
        const statusLabel = d.status === "Active" ? "Collecting" : "Closed";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${d.name}</strong></td>
            <td>${d.gsk}</td>
            <td>${formatDate(d.dateOfDeath)}</td>
            <td>
                <span style="font-size:13px; font-weight:600;">${d.contactPerson}</span><br>
                <span style="font-size:11px; color:var(--text-secondary);">${d.contactPhone || ''}</span>
            </td>
            <td><strong>${formatCurrency(caseTotal)}</strong></td>
            <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
        `;
        tbody.appendChild(tr);
    });
}


// ==================== 2. MANAGE DECEASED REGISTRY (CRUD) ====================

// Render Folder Tabs for Deceased Directory
function renderMortuaryFolderTabs() {
    const container = document.getElementById("mortuary-folder-tabs");
    if (!container) return;
    
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const hiddenSelect = document.getElementById("deceased-filter-gsk");
    
    // Administrators and Secretaries see all folders
    // Leaders only see their own
    let options = [];
    if (session.role === "Administrator" || session.role === "Secretary" || session.role === "Admin" || session.role === "Parishioner") {
        GSK_LIST.forEach(gsk => options.push({ label: gsk, value: gsk }));
        // If no filter is currently set, default to the first GSK so a tab is active
        if (hiddenSelect && !hiddenSelect.value && options.length > 0) {
            hiddenSelect.value = options[0].value;
        }
    } else if (session.role === "GskLeader") {
        options = [{ label: session.assignedGsk, value: session.assignedGsk }];
        if (hiddenSelect) hiddenSelect.value = session.assignedGsk; // Default to their GSK
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
                renderMortuaryFolderTabs();
                // Re-render table
                renderDeceasedTable();
            }
        };
        
        container.appendChild(btn);
    });
    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

function renderDeceasedTable() {
    const deceased = getDB("deceased");
    const tbody = document.getElementById("deceased-table-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    const query = document.getElementById("deceased-search").value.toLowerCase();
    const gskFilter = document.getElementById("deceased-filter-gsk").value;
    const statusFilter = document.getElementById("deceased-filter-status").value;

    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");

    const filtered = deceased.filter(d => {
        if (session.role === "GskLeader" && d.gsk !== session.assignedGsk) {
            return false;
        }
        const matchesSearch = d.name.toLowerCase().includes(query) || d.contactPerson.toLowerCase().includes(query);
        const matchesGsk = gskFilter === "" || d.gsk === gskFilter;
        const matchesStatus = statusFilter === "" || d.status === statusFilter;
        return matchesSearch && matchesGsk && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">No records matching search.</td></tr>`;
        return;
    }

    filtered.forEach(d => {
        const badgeClass = d.status === "Active" ? "badge-warning" : "badge-success";
        const statusLabel = d.status === "Active" ? "Active" : "Closed";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${d.name}</strong></td>
            <td>${d.age} yrs old</td>
            <td>${d.gsk}</td>
            <td>${formatDate(d.dateOfDeath)}</td>
            <td>${d.burialDate ? formatDate(d.burialDate) : 'Pending'}</td>
            <td>
                <span style="font-size:13px;">${d.contactPerson}</span><br>
                <span style="font-size:11px; color:var(--text-muted);">${d.contactPhone || ''}</span>
            </td>
            <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary); text-transform: none; font-family: monospace; font-weight: 600;">@${d.submittedBy || 'maryjoy'}</span></td>
            <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
            <td>
                <button class="btn btn-secondary btn-icon edit-btn" onclick="openEditDeceasedModal('${d.id}')" title="Edit Record">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="btn btn-danger btn-icon delete-btn" onclick="deleteDeceasedRecord('${d.id}')" title="Delete Record">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

function openAddDeceasedModal() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied: Parishioners cannot add records.");
        return;
    }

    document.getElementById("deceased-modal-title").innerText = "Add Deceased Record";
    document.getElementById("deceased-id").value = "";
    document.getElementById("deceased-form").reset();
    
    document.getElementById("dec-dod").value = getLocalISODate();
    
    populateGSKDropdowns();

    // Populate Member dropdown select
    const members = getDB("members");
    const memberSelect = document.getElementById("dec-member-select");
    if (memberSelect) {
        memberSelect.innerHTML = `<option value="">-- Choose Member from Registry --</option>`;
        let filteredMembers = members.filter(m => {
            if (session.role === "GskLeader" && session.assignedGsk && session.assignedGsk !== "All") {
                const mGsk = (m.gsk || "").toLowerCase().trim();
                const aGsk = (session.assignedGsk || "").toLowerCase().trim();
                return mGsk === aGsk || mGsk.includes(aGsk) || aGsk.includes(mGsk);
            }
            return true;
        }).sort((a, b) => a.name.localeCompare(b.name));
        
        if (filteredMembers.length === 0) {
            filteredMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));
        }

        filteredMembers.forEach(m => {
            memberSelect.innerHTML += `<option value="${m.id}">${m.name} (${m.gsk})</option>`;
        });
    }

    const gskSelect = document.getElementById("dec-gsk");
    if (session.role === "GskLeader" && gskSelect) {
        gskSelect.value = session.assignedGsk;
        gskSelect.disabled = true;
    } else if (gskSelect) {
        gskSelect.disabled = false;
    }

    openModal("deceased-modal");
}

function openEditDeceasedModal(id) {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied: Parishioners cannot edit records.");
        return;
    }

    const deceased = getDB("deceased");
    const d = deceased.find(item => item.id === id);
    if (!d) return;

    document.getElementById("deceased-modal-title").innerText = "Edit Deceased Record";
    document.getElementById("deceased-id").value = d.id;
    
    // Populate and set Member dropdown selection
    const members = getDB("members");
    const memberSelect = document.getElementById("dec-member-select");
    if (memberSelect) {
        memberSelect.innerHTML = `<option value="">-- Choose Member from Registry --</option>`;
        let filteredMembers = members.filter(m => {
            if (session.role === "GskLeader" && session.assignedGsk && session.assignedGsk !== "All") {
                const mGsk = (m.gsk || "").toLowerCase().trim();
                const aGsk = (session.assignedGsk || "").toLowerCase().trim();
                return mGsk === aGsk || mGsk.includes(aGsk) || aGsk.includes(mGsk);
            }
            return true;
        }).sort((a, b) => a.name.localeCompare(b.name));
        
        if (filteredMembers.length === 0) {
            filteredMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));
        }

        filteredMembers.forEach(m => {
            memberSelect.innerHTML += `<option value="${m.id}">${m.name} (${m.gsk})</option>`;
        });

        // Set selected value
        const matched = members.find(m => m.name === d.name);
        if (matched) {
            memberSelect.value = matched.id;
        } else {
            memberSelect.value = "";
        }
    }

    document.getElementById("dec-age").value = d.age;
    document.getElementById("dec-dod").value = d.dateOfDeath;
    document.getElementById("dec-burial").value = d.burialDate || "";
    document.getElementById("dec-contact-person").value = d.contactPerson;
    document.getElementById("dec-contact-phone").value = d.contactPhone || "";
    document.getElementById("dec-status").value = d.status || "Active";

    populateGSKDropdowns();
    const gskSelect = document.getElementById("dec-gsk");
    if (gskSelect) {
        gskSelect.value = d.gsk;
        if (session.role === "GskLeader") {
            gskSelect.disabled = true;
        } else {
            gskSelect.disabled = false;
        }
    }

    openModal("deceased-modal");
}

function saveDeceasedRecord(e) {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied.");
        return;
    }

    const id = document.getElementById("deceased-id").value;
    
    // Read member select instead of text input
    const memberSelect = document.getElementById("dec-member-select");
    const memberId = memberSelect ? memberSelect.value : "";
    if (!memberId) {
        alert("Please select a member.");
        return;
    }

    const members = getDB("members");
    const member = members.find(m => m.id === memberId);
    if (!member) {
        alert("Selected member not found.");
        return;
    }

    const name = member.name;
    const age = Number(document.getElementById("dec-age").value);
    const gsk = session.role === "GskLeader" ? session.assignedGsk : document.getElementById("dec-gsk").value;
    const dateOfDeath = document.getElementById("dec-dod").value;
    const burialDate = document.getElementById("dec-burial").value;
    const contactPerson = document.getElementById("dec-contact-person").value.trim();
    const contactPhone = document.getElementById("dec-contact-phone").value.trim();
    const status = document.getElementById("dec-status").value;

    const deceased = getDB("deceased");
    const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";

    // Auto-update member status to "Inactive" (since they are deceased)
    member.status = "Inactive";
    saveDB("members", members);
    if (typeof renderMembersTable === "function") renderMembersTable();
    if (typeof renderLeaderMembers === "function") renderLeaderMembers();

    if (id) {
        // Edit Mode
        const index = deceased.findIndex(item => item.id === id);
        if (index !== -1) {
            const oldRecord = deceased[index];
            deceased[index] = { ...oldRecord, name, age, gsk, dateOfDeath, burialDate, contactPerson, contactPhone, status, submittedBy: oldRecord.submittedBy || activeUser };
            saveDB("deceased", deceased);
            addSystemLog("EDIT_DECEASED", "MORTUARY", `Updated deceased profile of ${name}`, activeUser);
            showToast("Deceased record updated.");
        }
    } else {
        // Add Mode
        const newRecord = {
            id: "dec_" + Date.now(),
            name,
            age,
            gsk,
            dateOfDeath,
            burialDate,
            contactPerson,
            contactPhone,
            status,
            submittedBy: activeUser
        };
        deceased.push(newRecord);
        saveDB("deceased", deceased);
        addSystemLog("ADD_DECEASED", "MORTUARY", `Registered deceased record: ${name}`, activeUser);
        showToast("Deceased record added successfully.");
    }

    closeModal("deceased-modal");
    renderDeceasedTable();
    updateMainDashboardStats();
    
    // Trigger global storage event to force cross-tab sync and re-render current view
    window.dispatchEvent(new Event('storage'));
}

function deleteDeceasedRecord(id) {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role !== "Administrator" && session.role !== "Secretary" && session.role !== "Admin") {
        alert("Access Denied: Only Administrators or Secretaries are allowed to delete deceased records.");
        return;
    }

    const deceased = getDB("deceased");
    const d = deceased.find(item => item.id === id);
    if (!d) return;

    if (confirm(`Are you sure you want to delete the record of ${d.name}? All associated contributions will also be permanently deleted.`)) {
        // Delete deceased
        const updatedDeceased = deceased.filter(item => item.id !== id);
        saveDB("deceased", updatedDeceased);

        // Delete associated contributions
        const contributions = getDB("mortuary_contributions");
        const updatedContribs = contributions.filter(c => c.deceasedId !== id);
        saveDB("mortuary_contributions", updatedContribs);

        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        addSystemLog("DELETE_DECEASED", "MORTUARY", `Deleted deceased record of ${d.name} and related contributions`, activeUser);
        showToast("Deceased record deleted.", "warning");

        renderDeceasedTable();
        updateMainDashboardStats();
        
        // Trigger global storage event to force cross-tab sync and re-render current view
        window.dispatchEvent(new Event('storage'));
    }
}


// ==================== 3. MORTUARY CONTRIBUTION MANAGEMENT ====================

function renderMortuaryContributionsView() {
    const deceased = getDB("deceased");
    const contributions = getDB("mortuary_contributions");
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const sessionUser = (session.username || "").toLowerCase().trim();
    const sessionEmail = (session.email || "").toLowerCase().trim();

    // Populate active cases dropdown in Record Contribution Form
    const deceasedSelect = document.getElementById("mort-deceased-select");
    if (deceasedSelect) {
        deceasedSelect.innerHTML = `<option value="">-- Choose Deceased Case --</option>`;
        
        // Sort active cases, filter by GSK for GSK Leaders
        const activeCasesList = deceased.filter(d => {
            if (session.role === "GskLeader" && d.gsk !== session.assignedGsk) {
                return false;
            }
            return d.status === "Active";
        }).sort((a,b) => a.name.localeCompare(b.name));
        
        activeCasesList.forEach(d => {
            deceasedSelect.innerHTML += `<option value="${d.id}">${d.name} (${d.gsk})</option>`;
        });
    }

    // Populate Contributor Member dropdown
    if (typeof window.populateMemberDropdown === "function") {
        window.populateMemberDropdown("mort-member-select");
    }

    // Populate Contributor GSK dropdown
    populateGSKDropdowns();
    const cGskSelect = document.getElementById("mort-gsk-select");
    if (cGskSelect) {
        if (session.role === "GskLeader") {
            cGskSelect.value = session.assignedGsk;
            cGskSelect.disabled = true;
        } else {
            cGskSelect.disabled = false;
        }
    }

    const yearFilter = document.getElementById("mort-filter-year") ? document.getElementById("mort-filter-year").value : "All";
    const monthFilter = document.getElementById("mort-filter-month") ? document.getElementById("mort-filter-month").value : "All";

    // Filter contributions list based on role and date filters (safe local date parser)
    const filteredContribs = contributions.filter(c => {
        if (session.role === "GskLeader") {
            const d = deceased.find(item => item.id === c.deceasedId);
            if (!(d && d.gsk === session.assignedGsk) && c.gsk !== session.assignedGsk) {
                return false;
            }
        }
        return matchesPeriodFilter(c.date, yearFilter, monthFilter);
    });

    // Renders Recent Mortuary list (Latest 5) from filtered list
    const recentList = document.getElementById("mort-recent-list");
    if (recentList) {
        recentList.innerHTML = "";
        
        const sortedContribs = [...filteredContribs].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        if (sortedContribs.length === 0) {
            recentList.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">No contributions recorded.</div>`;
        } else {
            sortedContribs.forEach(c => {
                const decPerson = deceased.find(d => d.id === c.deceasedId) || { name: "Deceased" };
                recentList.innerHTML += `
                    <div class="recent-item">
                        <div class="recent-details">
                            <h4>${c.contributorName}</h4>
                            <p>Assistance for: ${decPerson.name} &bull; ${formatDate(c.date)}</p>
                        </div>
                        <div class="recent-amount plus">${formatCurrency(c.amount)}</div>
                    </div>
                `;
            });
        }
    }

    // Render Full History Log Table from filtered list
    const tbody = document.getElementById("mort-history-body");
    if (tbody) {
        tbody.innerHTML = "";
        
        const sortedAll = [...filteredContribs].sort((a,b) => parseLocalDate(b.date) - parseLocalDate(a.date));

        // Build period label for empty message
        const monthNamesMort = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        let periodLabelMort = "";
        if (yearFilter !== "All" && monthFilter !== "All") periodLabelMort = ` for ${monthNamesMort[Number(monthFilter)]} ${yearFilter}`;
        else if (yearFilter !== "All") periodLabelMort = ` for ${yearFilter}`;
        else if (monthFilter !== "All") periodLabelMort = ` for ${monthNamesMort[Number(monthFilter)]}`;

        if (sortedAll.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding: 20px;">No contributions found${periodLabelMort}.</td></tr>`;
        } else {
            sortedAll.forEach(c => {
                const tr = document.createElement("tr");
                const formattedSubmittedAt = c.submittedAt ? new Date(c.submittedAt).toLocaleString() : 'N/A';
                tr.innerHTML = `
                    <td><strong>${c.contributorName}</strong></td>
                    <td><strong>${formatCurrency(c.amount)}</strong></td>
                    <td>${formatDate(c.date)}</td>
                    <td>${c.gsk || 'No GSK'}</td>
                    <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary); text-transform: none; font-family: monospace; font-weight: 600;">@${c.submittedBy || 'maryjoy'}</span></td>
                    <td>${formattedSubmittedAt}</td>
                    <td class="leader-only">
                        <button class="btn btn-danger btn-icon" onclick="deleteMortuaryContribution('${c.id}')" title="Delete Contribution">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
        else if (window.lucide) lucide.createIcons();
    }
}

function recordMortuaryContribution(e) {
    e.preventDefault();
    const memberSelect = document.getElementById("mort-member-select");
    const memberId = memberSelect ? memberSelect.value : "";
    const amountInput = document.getElementById("mort-amount");
    const amount = amountInput ? Number(amountInput.value) : 0;
    const dateInput = document.getElementById("mort-date");
    const date = dateInput && dateInput.value ? dateInput.value : getLocalISODate();

    if (!memberId || isNaN(amount) || amount <= 0) {
        alert("Please select a contributor member and enter a valid positive amount.");
        return;
    }

    const members = getDB("members", []);
    const member = members.find(m => m.id === memberId);
    if (!member) {
        alert("Selected member not found.");
        return;
    }

    const deceased = getDB("deceased", []);
    const activeDeceased = deceased.find(d => d.gsk === member.gsk && d.status === "Active");
    
    let deceasedId = "";
    let deceasedName = "General Assistance";
    
    if (activeDeceased) {
        deceasedId = activeDeceased.id;
        deceasedName = activeDeceased.name;
    } else {
        const gskDeceased = deceased.filter(d => d.gsk === member.gsk);
        if (gskDeceased.length > 0) {
            gskDeceased.sort((a, b) => new Date(b.dateOfDeath) - new Date(a.dateOfDeath));
            deceasedId = gskDeceased[0].id;
            deceasedName = gskDeceased[0].name;
        }
    }

    const contributions = getDB("mortuary_contributions", []);
    const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
    const newContrib = {
        id: "mc_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        deceasedId,
        memberId,
        contributorName: member.name,
        gsk: member.gsk,
        amount,
        date,
        submittedBy: activeUser,
        submittedAt: new Date().toISOString(),
        status: "Submitted"
    };

    contributions.push(newContrib);
    saveDB("mortuary_contributions", contributions);
    if (window.MortuaryDB && window.MortuaryDB.add) {
        window.MortuaryDB.add(newContrib);
    }

    addSystemLog("RECORD_MORTUARY_CONTRIBUTION", "MORTUARY", `Recorded condolence contribution of ${formatCurrency(amount)} from ${member.name} for ${deceasedName}`, activeUser);
    showToast(`Condolence contribution of ${formatCurrency(amount)} recorded successfully.`);

    // Reset form inputs
    if (memberSelect) memberSelect.value = "";
    if (amountInput) amountInput.value = "";
    if (dateInput) dateInput.value = getLocalISODate();

    renderMortuaryContributionsView();
    if (typeof renderMortuaryOverview === "function") renderMortuaryOverview();
    if (typeof renderMortuaryReportsView === "function") renderMortuaryReportsView();
    if (typeof renderMemberContributionsReport === "function") renderMemberContributionsReport();
    if (typeof renderLeaderMortuary === "function") renderLeaderMortuary();
    if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
    updateMainDashboardStats();
    if (typeof renderAdminMonthlyRecords === "function") renderAdminMonthlyRecords();
    
    // Trigger global storage event to force cross-tab sync and re-render current view
    window.dispatchEvent(new Event('storage'));
}

function deleteMortuaryContribution(id) {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    if (session.role === "Parishioner") {
        alert("Permission Denied: Parishioners cannot undo records.");
        return;
    }

    const contributions = getDB("mortuary_contributions", []);
    const c = contributions.find(item => item.id === id);
    if (!c) return;

    // Check GSK Leader permission
    if (session.role === "GskLeader") {
        const deceased = getDB("deceased", []);
        const d = deceased.find(item => item.id === c.deceasedId);
        const isCaseInGsk = d && d.gsk === session.assignedGsk;
        const isContributorInGsk = c.gsk === session.assignedGsk;
        if (!isCaseInGsk && !isContributorInGsk) {
            alert("Access Denied: You can only delete contributions within your assigned GSK group.");
            return;
        }
    }

    if (confirm(`Are you sure you want to delete this mortuary contribution record (${formatCurrency(c.amount)})?`)) {
        // 1. Remove ONLY the selected record
        const updated = contributions.filter(item => item.id !== id);
        saveDB("mortuary_contributions", updated);
        if (window.MortuaryDB && window.MortuaryDB.delete) {
            window.MortuaryDB.delete(id);
        }

        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        addSystemLog("DELETE_MORTUARY_CONTRIBUTION", "MORTUARY", `Deleted condolence contribution of ${formatCurrency(c.amount)} from ${c.contributorName}`, activeUser);
        showToast("Contribution record removed.", "warning");

        // 2. Automatically recalculate all totals and re-render views
        if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView();
        if (typeof renderMortuaryOverview === "function") renderMortuaryOverview();
        if (typeof renderMortuaryReportsView === "function") renderMortuaryReportsView();
        if (typeof renderMemberContributionsReport === "function") renderMemberContributionsReport();
        if (typeof renderLeaderMortuary === "function") renderLeaderMortuary();
        if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
        if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
        if (typeof renderAdminMonthlyRecords === "function") renderAdminMonthlyRecords();
        
        // 3. Trigger global storage event to force cross-tab sync and re-render current view
        window.dispatchEvent(new Event('storage'));
    }
}


// ==================== 4. MORTUARY FINANCIAL REPORTS ====================

function renderMortuaryReportsView() {
    const deceased = getDB("deceased");
    const contributions = getDB("mortuary_contributions");
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");

    // Filter based on leader's GSK
    const filteredDeceased = deceased.filter(d => {
        if (session.role === "GskLeader" && d.gsk !== session.assignedGsk) {
            return false;
        }
        return true;
    });

    const yearFilter = document.getElementById("mort-filter-year") ? document.getElementById("mort-filter-year").value : "All";
    const monthFilter = document.getElementById("mort-filter-month") ? document.getElementById("mort-filter-month").value : "All";

    const filteredContribs = contributions.filter(c => {
        if (session.role === "GskLeader") {
            const d = deceased.find(item => item.id === c.deceasedId);
            if (!(d && d.gsk === session.assignedGsk) && c.gsk !== session.assignedGsk) {
                return false;
            }
        }

        if (!matchesPeriodFilter(c.date, yearFilter, monthFilter)) return false;
        return true;
    });

    // Financial calculations
    let disbursedTotal = 0;
    let onholdTotal = 0;

    filteredDeceased.forEach(d => {
        const caseContributions = filteredContribs.filter(c => c.deceasedId === d.id);
        const caseSum = caseContributions.reduce((sum, c) => sum + Number(c.amount), 0);

        if (d.status === "Closed") {
            disbursedTotal += caseSum;
        } else {
            onholdTotal += caseSum;
        }
    });

    document.getElementById("mort-disbursed-total").innerText = formatCurrency(disbursedTotal);
    document.getElementById("mort-onhold-total").innerText = formatCurrency(onholdTotal);

    // Render Chart: Support collections per Deceased record
    renderMortuaryChart(filteredDeceased, filteredContribs);
    
    // Update dashboard stats (to catch dash-mortuary-collections and others)
    if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
}

function renderMortuaryChart(deceased, contributions) {
    const ctx = document.getElementById("mortuaryChart");
    if (!ctx) return;

    // Grab labels (deceased names) and calculate their sum totals
    const labels = deceased.map(d => d.name);
    const chartData = deceased.map(d => {
        const caseContribs = contributions.filter(c => c.deceasedId === d.id);
        return caseContribs.reduce((sum, c) => sum + Number(c.amount), 0);
    });

    if (mortuaryChart) {
        mortuaryChart.destroy();
    }

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
    const textColor = isDark ? "#94a3b8" : "#64748b";

    mortuaryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Collected Assistance (₱)',
                data: chartData,
                backgroundColor: 'rgba(239, 68, 68, 0.75)', // Rose / Red Accent
                borderColor: '#ef4444',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor, font: { family: 'Outfit' } } }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Outfit' } },
                    beginAtZero: true
                },
                y: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Outfit' } }
                }
            }
        }
    });
}

// ==================== GSK LEADER MORTUARY PANEL ====================

function initLeaderMortuaryModule() {
    const leaderMortForm = document.getElementById("leader-record-mort-form");
    if (leaderMortForm && !leaderMortForm.dataset.initialized) {
        leaderMortForm.dataset.initialized = "true";
        leaderMortForm.addEventListener("submit", saveLeaderMortuaryContribution);
    }

    const leaderMortSearch = document.getElementById("leader-mort-search");
    if (leaderMortSearch) {
        leaderMortSearch.addEventListener("input", renderLeaderMortuary);
    }

    const leaderRepMortSearch = document.getElementById("leader-rep-mort-search");
    if (leaderRepMortSearch) {
        leaderRepMortSearch.addEventListener("input", function() {
            if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
        });
    }

    const leaderMortDate = document.getElementById("leader-mort-date");
    if (leaderMortDate) {
        leaderMortDate.value = getLocalISODate();
    }

    if (typeof renderLeaderMortuary === "function") {
        renderLeaderMortuary();
    }
}

function renderLeaderMortuary() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const assignedGsk = session.assignedGsk || "";

    const deceased = getDB("deceased", []);
    const contributions = getDB("mortuary_contributions", []);
    const members = getDB("members", []);

    const sessionUser = (session.username || "").toLowerCase().trim();
    const sessionEmail = (session.email || "").toLowerCase().trim();

    // Populate active cases of this GSK
    const select = document.getElementById("leader-mort-deceased-select");
    if (select) {
        select.innerHTML = `<option value="">-- Choose Deceased Case --</option>`;
        const activeDeceasedCases = deceased.filter(d => (assignedGsk === "All" || d.gsk === assignedGsk) && d.status === "Active")
                                            .sort((a, b) => a.name.localeCompare(b.name));
        activeDeceasedCases.forEach(d => {
            select.innerHTML += `<option value="${d.id}">${d.name}</option>`;
        });
    }

    // Populate Contributor Member dropdown strictly with members registered by this leader / in this leader's GSK
    if (typeof window.populateMemberDropdown === "function") {
        window.populateMemberDropdown("leader-mort-member-select");
    }

    const tbody = document.getElementById("leader-mort-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const query = (document.getElementById("leader-mort-search")?.value || "").toLowerCase();

    // Isolated per leader: show mortuary contributions submitted by this specific leader or within leader's GSK
    const filtered = contributions.filter(c => {
        const submitted = (c.submittedBy || "").toLowerCase().trim();
        const isOwner = (submitted && (submitted === sessionUser || submitted === sessionEmail));
        const mGsk = (c.gsk || "").toLowerCase().trim();
        const aGsk = (assignedGsk || "").toLowerCase().trim();
        const isGskMatch = (aGsk && aGsk !== "all" && aGsk !== "" && (mGsk === aGsk || mGsk.includes(aGsk) || aGsk.includes(mGsk)));
        
        const isVisible = isOwner || isGskMatch || assignedGsk === "All" || !assignedGsk || session.role === "Admin" || session.role === "Administrator" || session.role === "Secretary";
        if (!isVisible) return false;

        const d = deceased.find(item => item.id === c.deceasedId);
        const decName = d ? d.name : "General Assistance";
        return (c.contributorName && c.contributorName.toLowerCase().includes(query)) || decName.toLowerCase().includes(query) || (c.gsk && c.gsk.toLowerCase().includes(query));
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Stats
    const totalSum = filtered.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const statVal = document.getElementById("leader-mort-total-val");
    if (statVal) statVal.innerText = formatCurrency(totalSum);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding: 20px;">No mortuary contributions found.</td></tr>`;
        return;
    }

    filtered.forEach(c => {
        const tr = document.createElement("tr");
        const formattedSubmittedAt = c.submittedAt ? new Date(c.submittedAt).toLocaleString() : 'N/A';
        tr.innerHTML = `
            <td><strong>${c.contributorName}</strong></td>
            <td><strong style="color:var(--text-main);">${formatCurrency(c.amount)}</strong></td>
            <td>${formatDate(c.date)}</td>
            <td>${c.gsk || 'No GSK'}</td>
            <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary); text-transform: none; font-family: monospace; font-weight: 600;">@${c.submittedBy || sessionUser}</span></td>
            <td>${formattedSubmittedAt}</td>
            <td>
                <button class="btn btn-secondary btn-icon" onclick="editLeaderMortuary('${c.id}')" title="Edit Record">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteLeaderMortuary('${c.id}')" title="Delete/Correct Record">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

let isSubmittingLeaderMortuary = false;
function saveLeaderMortuaryContribution(e) {
    e.preventDefault();
    if (isSubmittingLeaderMortuary) return;
    isSubmittingLeaderMortuary = true;
    const submitBtn = e.target.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    try {
        const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
        const activeUser = localStorage.getItem("GskActiveUser") || session.username || "maryjoy";

        const memberSelect = document.getElementById("leader-mort-member-select");
        const memberId = memberSelect ? memberSelect.value : "";
        const amountInput = document.getElementById("leader-mort-amount");
        const amount = amountInput ? Number(amountInput.value) : 0;
        const dateInput = document.getElementById("leader-mort-date");
        const date = dateInput && dateInput.value ? dateInput.value : getLocalISODate();

        if (!memberId || isNaN(amount) || amount <= 0) {
            alert("Please select a contributor member and enter a valid positive amount.");
            return;
        }

        const members = getDB("members", []);
        const member = members.find(m => m.id === memberId);
        if (!member) {
            alert("Selected member not found.");
            return;
        }

        const memberGsk = (member && member.gsk) ? member.gsk : (session.assignedGsk || "GSK");

        const deceased = getDB("deceased", []);
        const activeDeceased = deceased.find(d => (d.gsk && d.gsk.toLowerCase() === memberGsk.toLowerCase()) && d.status === "Active");
        
        let deceasedId = "";
        let deceasedName = "General Assistance";
        
        if (activeDeceased) {
            deceasedId = activeDeceased.id;
            deceasedName = activeDeceased.name;
        } else {
            const gskDeceased = deceased.filter(d => d.gsk && d.gsk.toLowerCase() === memberGsk.toLowerCase());
            if (gskDeceased.length > 0) {
                gskDeceased.sort((a, b) => new Date(b.dateOfDeath) - new Date(a.dateOfDeath));
                deceasedId = gskDeceased[0].id;
                deceasedName = gskDeceased[0].name;
            } else if (deceased.length > 0) {
                deceasedId = deceased[0].id;
                deceasedName = deceased[0].name;
            } else {
                deceasedId = "dec_1";
            }
        }

        const contributions = getDB("mortuary_contributions", []);
        const newContrib = {
            id: "mc_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            deceasedId,
            memberId,
            contributorName: member.name,
            gsk: memberGsk,
            amount,
            date,
            submittedBy: activeUser,
            submittedAt: new Date().toISOString(),
            status: "Submitted"
        };

        const existingIdx = contributions.findIndex(c => c.id === newContrib.id);
        if (existingIdx === -1) {
            contributions.unshift(newContrib);
            saveDB("mortuary_contributions", contributions);
        }
        if (window.MortuaryDB && window.MortuaryDB.add) {
            window.MortuaryDB.add(newContrib);
        }

        addSystemLog("RECORD_MORTUARY_CONTRIBUTION", "MORTUARY", `Recorded condolence of ${formatCurrency(amount)} from ${member.name} for ${deceasedName} (GSK Leader Panel)`, activeUser);
        showToast(`Submission Successful! Your contribution record has been submitted successfully.`);

        if (memberSelect) memberSelect.value = "";
        if (amountInput) amountInput.value = "";
        if (dateInput) dateInput.value = getLocalISODate();

        renderLeaderMortuary();
        if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
        if (typeof renderMortuaryOverview === "function") renderMortuaryOverview();
        if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView();
        if (typeof renderMortuaryReportsView === "function") renderMortuaryReportsView();
        if (typeof renderMemberContributionsReport === "function") renderMemberContributionsReport();
        if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
        if (typeof renderAdminMonthlyRecords === "function") renderAdminMonthlyRecords();
        
        // Trigger global storage event to force cross-tab sync and re-render current view
        window.dispatchEvent(new Event('storage'));
    } finally {
        setTimeout(() => {
            isSubmittingLeaderMortuary = false;
            if (submitBtn) submitBtn.disabled = false;
        }, 500);
    }
}

function editLeaderMortuary(id) {
    const contributions = getDB("mortuary_contributions");
    const c = contributions.find(item => item.id === id);
    if (!c) return;
    const amtStr = prompt("Correct Contribution Amount (₱):", c.amount);
    if (amtStr === null) return;
    const amt = Number(amtStr);
    if (isNaN(amt) || amt <= 0) {
        alert("Invalid amount.");
        return;
    }
    
    c.amount = amt;
    saveDB("mortuary_contributions", contributions);
    showToast("Contribution record corrected successfully.");
    renderLeaderMortuary();
    if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
    if (typeof renderMortuaryOverview === "function") renderMortuaryOverview();
    if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView();
    if (typeof renderMortuaryReportsView === "function") renderMortuaryReportsView();
    if (typeof renderMemberContributionsReport === "function") renderMemberContributionsReport();
    updateMainDashboardStats();
    window.dispatchEvent(new Event('storage'));
}

function deleteLeaderMortuary(id) {
    const contributions = getDB("mortuary_contributions", []);
    const c = contributions.find(item => item.id === id);
    if (!c) return;

    if (confirm(`Are you sure you want to delete this mortuary contribution record (${formatCurrency(c.amount)})?`)) {
        // 1. Remove ONLY the selected record
        const updated = contributions.filter(item => item.id !== id);
        saveDB("mortuary_contributions", updated);
        if (window.MortuaryDB && window.MortuaryDB.delete) {
            window.MortuaryDB.delete(id);
        }

        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        addSystemLog("DELETE_MORTUARY_CONTRIBUTION", "MORTUARY", `Deleted condolence contribution of ${formatCurrency(c.amount)} from ${c.contributorName}`, activeUser);
        showToast("Contribution record removed.", "warning");

        // 2. Automatically recalculate all totals and re-render views
        if (typeof renderLeaderMortuary === "function") renderLeaderMortuary();
        if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
        if (typeof renderMortuaryOverview === "function") renderMortuaryOverview();
        if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView();
        if (typeof renderMortuaryReportsView === "function") renderMortuaryReportsView();
        if (typeof renderMemberContributionsReport === "function") renderMemberContributionsReport();
        if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
        if (typeof renderAdminMonthlyRecords === "function") renderAdminMonthlyRecords();
        
        // 3. Trigger global storage event to force cross-tab sync and re-render current view
        window.dispatchEvent(new Event('storage'));
    }
}

// Render function moved to unified view in tithes.js
