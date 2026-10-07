// settings.js - General Configuration, Allocations, Secretaries and Backups

function initSettingsModule() {
    // Sliders event listeners
    const gskSlider = document.getElementById("alloc-gsk");
    const chapelSlider = document.getElementById("alloc-chapel");
    const parokyaSlider = document.getElementById("alloc-parokya");

    if (gskSlider && chapelSlider && parokyaSlider) {
        gskSlider.addEventListener("input", updateAllocationValues);
        chapelSlider.addEventListener("input", updateAllocationValues);
        parokyaSlider.addEventListener("input", updateAllocationValues);
    }

    // Config form submit listener
    const configForm = document.getElementById("settings-config-form");
    if (configForm) {
        configForm.addEventListener("submit", saveSettingsConfig);
    }

    // Secretary creation form
    const secForm = document.getElementById("secretary-form");
    if (secForm) {
        secForm.addEventListener("submit", createSecretaryAccount);
    }

    // User account creation form
    const userForm = document.getElementById("user-form");
    if (userForm) {
        userForm.addEventListener("submit", saveUserAccount);
    }

}

// ==================== 1. ALLOCATION SLIDERS & CONFIGS ====================

function renderSettingsView() {
    let settings = getDB("settings", DEFAULT_SETTINGS);
    if (!settings.allocations || settings.allocations.gskShare === 30 || settings.allocations.parokyaShare === 50 || settings.allocations.parokyaShare === 40 || (Number(settings.allocations.gskShare) + Number(settings.allocations.chapelShare) + Number(settings.allocations.parokyaShare) !== 100)) {
        settings.allocations = { gskShare: 20, chapelShare: 20, parokyaShare: 60 };
        saveDB("settings", settings);
    }
    
    // Set system name value
    const nameEl = document.getElementById("settings-system-name");
    if (nameEl) nameEl.value = settings.systemName || DEFAULT_SETTINGS.systemName;

    // Load shares percentages
    const allocations = settings.allocations || DEFAULT_SETTINGS.allocations;
    const gskSlider = document.getElementById("alloc-gsk");
    const chapelSlider = document.getElementById("alloc-chapel");
    const parokyaSlider = document.getElementById("alloc-parokya");
    if (gskSlider) gskSlider.value = allocations.gskShare;
    if (chapelSlider) chapelSlider.value = allocations.chapelShare;
    if (parokyaSlider) parokyaSlider.value = allocations.parokyaShare;

    // Trigger update values labels and check validation
    updateAllocationValues();

    // Render Secretaries List Table
    renderSecretariesTable();
}

function updateAllocationValues() {
    const gskEl = document.getElementById("alloc-gsk");
    const chapelEl = document.getElementById("alloc-chapel");
    const parokyaEl = document.getElementById("alloc-parokya");
    if (!gskEl || !chapelEl || !parokyaEl) return;

    const gskVal = Number(gskEl.value || 0);
    const chapelVal = Number(chapelEl.value || 0);
    const parokyaVal = Number(parokyaEl.value || 0);

    // Update text labels
    const valGsk = document.getElementById("val-gsk");
    const valChapel = document.getElementById("val-chapel");
    const valParokya = document.getElementById("val-parokya");

    if (valGsk) valGsk.innerText = `${gskVal}%`;
    if (valChapel) valChapel.innerText = `${chapelVal}%`;
    if (valParokya) valParokya.innerText = `${parokyaVal}%`;

    // Sum validation check (must equal 100%)
    const sum = gskVal + chapelVal + parokyaVal;
    const errorCard = document.getElementById("allocations-error");
    const saveBtn = document.getElementById("save-allocations-btn");
    const sumSpan = document.getElementById("allocations-current-sum");

    if (sum !== 100) {
        if (sumSpan) sumSpan.innerText = sum;
        if (errorCard) errorCard.style.display = "block";
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = "0.5";
            saveBtn.style.cursor = "not-allowed";
        }
    } else {
        if (errorCard) errorCard.style.display = "none";
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = "1";
            saveBtn.style.cursor = "pointer";
        }
    }
}

function saveSettingsConfig(e) {
    e.preventDefault();
    const systemName = document.getElementById("settings-system-name").value.trim();
    
    const gskShare = Number(document.getElementById("alloc-gsk").value);
    const chapelShare = Number(document.getElementById("alloc-chapel").value);
    const parokyaShare = Number(document.getElementById("alloc-parokya").value);

    const sum = gskShare + chapelShare + parokyaShare;
    if (sum !== 100) {
        alert("Sum of allocations must equal 100%");
        return;
    }

    const settings = getDB("settings", DEFAULT_SETTINGS);
    settings.systemName = systemName;
    settings.allocations = { gskShare, chapelShare, parokyaShare };

    saveDB("settings", settings);

    // Sync with Supabase Cloud backend if connected
    if (window.SettingsDB && window.SettingsDB.save) {
        window.SettingsDB.save(settings).catch(err => console.warn("Settings Supabase sync error:", err));
    }

    // Update UI headers
    const brandEl = document.getElementById("brand-system-name");
    if (brandEl) brandEl.innerText = systemName.split(" - ")[0];
    
    const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
    addSystemLog("UPDATE_SETTINGS", "SETTINGS", `Updated allocations settings (GSK: ${gskShare}%, Chapel: ${chapelShare}%, Parish: ${parokyaShare}%) and System name`, activeUser);
    showToast("Settings configuration saved successfully.");

    // Trigger instant recalculations of all allocations
    if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
    if (typeof renderChapelFinancialDashboard === "function") renderChapelFinancialDashboard();
    if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();
    if (typeof renderTitheReports === "function") renderTitheReports();
    if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
    window.dispatchEvent(new Event('storage'));
}


// ==================== 2. SECRETARIES USER ACCOUNTS ====================

function renderSecretariesTable() {
    const settings = getDB("settings", DEFAULT_SETTINGS);
    const secretaries = settings.secretaries || [];
    const tbody = document.getElementById("secretaries-table-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (secretaries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No secretary accounts.</td></tr>`;
        return;
    }

    secretaries.forEach(sec => {
        const isMainAdmin = sec.username === "sec_juan";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>@${sec.username}</strong></td>
            <td>${sec.name}</td>
            <td>
                ${isMainAdmin ? `<span class="badge badge-info">Main Secretary</span>` : 
                `<button class="btn btn-danger btn-icon" onclick="deleteSecretaryAccount('${sec.id}')" title="Delete Account">
                    <i data-lucide="trash-2"></i>
                </button>`}
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

function openAddSecretaryModal() {
    document.getElementById("secretary-form").reset();
    openModal("secretary-modal");
}

function createSecretaryAccount(e) {
    e.preventDefault();
    const username = document.getElementById("sec-username").value.trim().toLowerCase();
    const name = document.getElementById("sec-display-name").value.trim();

    const settings = getDB("settings", DEFAULT_SETTINGS);
    const secretaries = settings.secretaries || [];

    // Validation
    const exists = secretaries.some(sec => sec.username === username);
    if (exists) {
        alert("This username already exists.");
        return;
    }

    const newSec = {
        id: "sec_" + Date.now(),
        username,
        name,
        role: "Secretary",
        active: true
    };

    secretaries.push(newSec);
    settings.secretaries = secretaries;
    saveDB("settings", settings);

    const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
    addSystemLog("ADD_SECRETARY", "SETTINGS", `Created secretary account for @${username}`, activeUser);
    showToast(`Account @${username} created.`);

    closeModal("secretary-modal");
    renderSecretariesTable();
}

function deleteSecretaryAccount(id) {
    const settings = getDB("settings", DEFAULT_SETTINGS);
    const secretaries = settings.secretaries || [];
    const sec = secretaries.find(item => item.id === id);
    if (!sec) return;

    if (confirm(`Are you sure you want to delete the account for @${sec.username}?`)) {
        const updated = secretaries.filter(item => item.id !== id);
        settings.secretaries = updated;
        saveDB("settings", settings);

        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        addSystemLog("DELETE_SECRETARY", "SETTINGS", `Deleted secretary account @${sec.username}`, activeUser);
        showToast("Secretary account deleted.", "warning");

        renderSecretariesTable();
    }
}


// ==================== 3. BACKUP & RESTORE ====================

function exportBackupData() {
    const keys = ["settings", "members", "tithes", "deceased", "mortuary_contributions", "logs"];
    const backupObj = {};

    keys.forEach(k => {
        backupObj[k] = getDB(k);
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const dateStamp = getLocalISODate();
    downloadAnchor.setAttribute("download", `gsk_parish_backup_${dateStamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
    addSystemLog("EXPORT_BACKUP", "SETTINGS", "Exported database backup JSON file", activeUser);
    showToast("Backup file downloaded.");
}

function importBackupData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            const requiredKeys = ["settings", "members", "tithes", "deceased", "mortuary_contributions", "logs"];
            
            // Check if file is valid
            const isValid = requiredKeys.every(k => parsed.hasOwnProperty(k));
            if (!isValid) {
                alert("Invalid backup file format. Missing core datasets.");
                return;
            }

            // Restore records
            requiredKeys.forEach(k => {
                saveDB(k, parsed[k]);
            });

            const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
            addSystemLog("IMPORT_BACKUP", "SETTINGS", "Restored database from JSON backup file", activeUser);
            showToast("Database restored successfully.");

            // Clear input selection
            event.target.value = "";

            // Reload workspace page contents
            location.reload();

        } catch (err) {
            alert("Error parsing JSON backup file: " + err.message);
        }
    };
    reader.readAsText(file);
}

// ==================== 4. USER ACCOUNTS (GSK LEADERS) ====================

function renderUserAccounts() {
    const users = getDB("users", []);
    const tbody = document.getElementById("admin-users-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No user accounts found.</td></tr>`;
        return;
    }

    users.forEach(user => {
        if (user.role !== "GskLeader") return; // Only display Leaders here
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${user.name}</strong></td>
            <td>
                <div>${user.email}</div>
                <div style="font-size: 11px; color: var(--text-muted);">@${user.username}</div>
            </td>
            <td>
                <span class="badge ${user.status === 'Active' ? 'badge-success' : 'badge-danger'}">
                    ${user.status}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-icon" onclick="editUserAccount('${user.id}')" title="Edit Account">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="btn btn-secondary btn-icon" onclick="toggleUserStatus('${user.id}')" title="${user.status === 'Active' ? 'Deactivate' : 'Activate'}">
                    <i data-lucide="${user.status === 'Active' ? 'power-off' : 'power'}"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteUserAccount('${user.id}')" title="Delete Account">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (typeof window.safeLucideIcons === "function") window.safeLucideIcons();
    else if (window.lucide) lucide.createIcons();
}

function openAddUserModal() {
    const form = document.getElementById("user-form");
    if (form) form.reset();
    document.getElementById("user-id").value = "";
    document.getElementById("user-modal-title").innerText = "Leader Account Information Form";
    if (typeof populateGSKDropdowns === "function") populateGSKDropdowns();
    openModal("user-modal");
}

function editUserAccount(id) {
    const users = getDB("users", []);
    const user = users.find(u => u.id === id);
    if (!user) return;

    document.getElementById("user-id").value = user.id;
    document.getElementById("user-name").value = user.name;
    if (typeof populateGSKDropdowns === "function") populateGSKDropdowns();
    const gskEl = document.getElementById("user-gsk"); if (gskEl) gskEl.value = user.gsk;
    document.getElementById("user-email").value = user.email;
    const userEl = document.getElementById("user-username"); if (userEl) userEl.value = user.username || "";
    document.getElementById("user-password").value = user.password;
    document.getElementById("user-confirm-password").value = user.password;

    document.getElementById("user-modal-title").innerText = "Edit GSK Leader Account";
    openModal("user-modal");
}

function saveUserAccount(e) {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const activeUser = localStorage.getItem("GskActiveUser") || session.username || "maryjoy";

    const id = document.getElementById("user-id").value;
    const name = document.getElementById("user-name").value.trim();
    const email = document.getElementById("user-email").value.trim();
    const password = document.getElementById("user-password").value;
    const confirmPassword = document.getElementById("user-confirm-password").value;
    const status = "Active";

    // 1. Validation of all required fields
    if (!name) {
        alert("Please enter full name.");
        return;
    }

    if (!email) {
        alert("Please enter email address.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (!password) {
        alert("Please enter password.");
        return;
    }

    if (!confirmPassword) {
        alert("Please confirm your password.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // 2. Email uniqueness validation
    let users = getDB("users", []);
    const emailNormalized = email.toLowerCase().trim();

    const existingEmail = users.find(u => u.id !== id && (u.email || "").toLowerCase().trim() === emailNormalized);
    if (existingEmail || emailNormalized === "maryjoydayondon27@gmail.com" || emailNormalized === "secretary@gmail.com" || emailNormalized === "secretary@fatimaparish.org") {
        alert("Email already exists.");
        return;
    }

    // 3. Resolve GSK assignment
    const gskEl = document.getElementById("user-gsk");
    let gsk = "";
    if (gskEl && gskEl.value) {
        gsk = gskEl.value;
    } else {
        const lower = (email + " " + name).toLowerCase();
        if (lower.includes("santa maria") || lower.includes("santamaria")) gsk = "GSK Santa Maria";
        else if (lower.includes("san pedro") || lower.includes("sanpedro")) gsk = "GSK San Pedro";
        else if (lower.includes("santo rosario") || lower.includes("santorosario")) gsk = "GSK Santo Rosario";
        else if (lower.includes("san jose") || lower.includes("sanjose")) gsk = "GSK San Jose";
        else gsk = name.trim();
    }

    // 4. Resolve Username
    const userEl = document.getElementById("user-username");
    let username = userEl ? userEl.value.trim() : "";
    if (!username) {
        const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
        username = emailPrefix || (name.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(10 + Math.random() * 90));
    }

    // Ensure unique username
    let finalUsername = username;
    let counter = 1;
    while (users.some(u => u.id !== id && (u.username || "").toLowerCase() === finalUsername.toLowerCase())) {
        finalUsername = username + counter;
        counter++;
    }
    username = finalUsername;

    // 5. Save or Update Record
    if (id) {
        // Edit existing account
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            const currentStatus = users[index].status || "Active";
            users[index] = { ...users[index], name, gsk, email, username, password, status: currentStatus };
            saveDB("users", users);
            if (window.UserDB && window.UserDB.update) {
                window.UserDB.update(users[index]);
            }
            addSystemLog("EDIT_LEADER", "SETTINGS", `Updated leader account for ${name} (${gsk})`, activeUser);
            showToast("Account updated successfully.");
        }
    } else {
        // Create completely fresh, independent leader account with ZERO records
        const newUser = {
            id: "usr_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            name,
            gsk,
            email,
            username,
            password,
            status,
            role: "GskLeader"
        };
        users.push(newUser);
        saveDB("users", users);
        if (window.UserDB && window.UserDB.add) {
            window.UserDB.add(newUser);
        }

        addSystemLog("CREATE_LEADER", "SETTINGS", `Created new GSK Leader account for ${name} (${gsk})`, activeUser);
        showToast("Leader account created successfully.");
    }

    closeModal("user-modal");
    const userForm = document.getElementById("user-form");
    if (userForm) userForm.reset();
    renderUserAccounts();
    if (typeof renderMembersTable === "function") renderMembersTable();
    if (typeof renderMemberFolderTabs === "function") renderMemberFolderTabs();
    if (typeof populateGSKDropdowns === "function") populateGSKDropdowns();
    window.dispatchEvent(new Event('storage'));
}

function deleteUserAccount(id) {
    let users = getDB("users", []);
    const u = users.find(item => item.id === id);
    if (!u) return;

    if (confirm(`Are you sure you want to permanently delete the account for ${u.name}? All data belonging specifically to this account will be removed.`)) {
        const name = u.name;
        const gsk = u.gsk || "";
        const username = (u.username || "").toLowerCase().trim();
        const email = (u.email || "").toLowerCase().trim();

        // 1. Remove user
        users = users.filter(user => user.id !== id);
        saveDB("users", users);
        if (window.UserDB && window.UserDB.delete) {
            window.UserDB.delete(id);
        }

        // 2. Cascade delete ONLY members belonging specifically to this leader
        let members = getDB("members", []);
        const membersToDelete = members.filter(m => {
            const sub = (m.submittedBy || "").toLowerCase().trim();
            const isSubmittedByThisLeader = (sub && (sub === username || sub === email));
            const isLeaderCustomGsk = (gsk && !GSK_LIST.includes(gsk) && m.gsk === gsk);
            return isSubmittedByThisLeader || isLeaderCustomGsk;
        });

        const deletedMemberIds = new Set(membersToDelete.map(m => m.id));

        if (membersToDelete.length > 0) {
            members = members.filter(m => !deletedMemberIds.has(m.id));
            saveDB("members", members);
            if (window.MemberDB && window.MemberDB.delete) {
                membersToDelete.forEach(m => window.MemberDB.delete(m.id));
            }
        }

        // 3. Cascade delete Tithes belonging specifically to this leader or its members
        let tithes = getDB("tithes", []);
        const tithesToDelete = tithes.filter(t => {
            const sub = (t.submittedBy || "").toLowerCase().trim();
            const isOwner = (sub && (sub === username || sub === email));
            const isMemberTithe = deletedMemberIds.has(t.memberId);
            return isOwner || isMemberTithe;
        });

        if (tithesToDelete.length > 0) {
            tithes = tithes.filter(t => {
                const sub = (t.submittedBy || "").toLowerCase().trim();
                const isOwner = (sub && (sub === username || sub === email));
                const isMemberTithe = deletedMemberIds.has(t.memberId);
                return !isOwner && !isMemberTithe;
            });
            saveDB("tithes", tithes);
            if (window.TitheDB && window.TitheDB.delete) {
                tithesToDelete.forEach(t => window.TitheDB.delete(t.id));
            }
        }

        // 4. Cascade delete Mortuary contributions belonging specifically to this leader or its members
        let mortuary = getDB("mortuary_contributions", []);
        const mortToDelete = mortuary.filter(c => {
            const sub = (c.submittedBy || "").toLowerCase().trim();
            const isOwner = (sub && (sub === username || sub === email));
            const isMemberMort = deletedMemberIds.has(c.memberId);
            return isOwner || isMemberMort;
        });

        if (mortToDelete.length > 0) {
            mortuary = mortuary.filter(c => {
                const sub = (c.submittedBy || "").toLowerCase().trim();
                const isOwner = (sub && (sub === username || sub === email));
                const isMemberMort = deletedMemberIds.has(c.memberId);
                return !isOwner && !isMemberMort;
            });
            saveDB("mortuary_contributions", mortuary);
            if (window.MortuaryDB && window.MortuaryDB.delete) {
                mortToDelete.forEach(c => window.MortuaryDB.delete(c.id));
            }
        }

        // 5. Cascade delete claims belonging specifically to this leader
        let claims = getDB("gsk_claims", []);
        const claimsToDelete = claims.filter(c => {
            const claimedBy = (c.claimedBy || "").toLowerCase().trim();
            const isOwner = (claimedBy && (claimedBy === username || claimedBy === email));
            const isCustomGsk = (gsk && !GSK_LIST.includes(gsk) && c.gskName === gsk);
            return isOwner || isCustomGsk;
        });

        if (claimsToDelete.length > 0) {
            claims = claims.filter(c => {
                const claimedBy = (c.claimedBy || "").toLowerCase().trim();
                const isOwner = (claimedBy && (claimedBy === username || claimedBy === email));
                const isCustomGsk = (gsk && !GSK_LIST.includes(gsk) && c.gskName === gsk);
                return !isOwner && !isCustomGsk;
            });
            saveDB("gsk_claims", claims);
        }

        const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
        addSystemLog("DELETE_LEADER", "SETTINGS", `Deleted leader account for ${name} and associated records`, activeUser);
        showToast("Account and related records deleted successfully.", "warning");

        // 6. Automatically recalculate all totals and re-render all views
        renderUserAccounts();
        if (typeof renderMembersTable === "function") renderMembersTable();
        if (typeof renderMemberFolderTabs === "function") renderMemberFolderTabs();
        if (typeof populateGSKDropdowns === "function") populateGSKDropdowns();
        if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
        if (typeof renderTitheReports === "function") renderTitheReports();
        if (typeof renderChapelFinancialDashboard === "function") renderChapelFinancialDashboard();
        if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();
        if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView();
        if (typeof renderMortuaryReportsView === "function") renderMortuaryReportsView();
        if (typeof renderMortuaryOverview === "function") renderMortuaryOverview();
        if (typeof renderMemberContributionsReport === "function") renderMemberContributionsReport();
        if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
        if (typeof renderAdminMonthlyRecords === "function") renderAdminMonthlyRecords();
        window.dispatchEvent(new Event('storage'));
    }
}

function toggleUserStatus(id) {
    let users = getDB("users", []);
    const user = users.find(u => u.id === id);
    if (!user) return;

    user.status = user.status === "Active" ? "Inactive" : "Active";
    saveDB("users", users);
    if (window.UserDB && window.UserDB.update) {
        window.UserDB.update(user);
    }
    const activeUser = localStorage.getItem("GskActiveUser") || "maryjoy";
    addSystemLog("TOGGLE_USER_STATUS", "SETTINGS", `Changed status of ${user.name} to ${user.status}`, activeUser);
    showToast(`Account is now ${user.status}.`);
    renderUserAccounts();
    window.dispatchEvent(new Event('storage'));
}



// ==================== 4. DANGER ZONE ====================

function resetSystemRecords() {
    if (confirm("Are you sure you want to RESET all records to default mock data? All your current additions will be lost!")) {
        localStorage.clear();
        initDatabase();
        showToast("System reset to default mock records.", "warning");
        
        // Reload system views
        setTimeout(() => {
            location.reload();
        }, 800);
    }
}

function wipeAllData() {
    if (confirm("🚨 WARNING: Are you sure you want to WIPE all records? This will delete all members, contributions, and logs, leaving the database empty!")) {
        saveDB("members", []);
        saveDB("tithes", []);
        saveDB("deceased", []);
        saveDB("mortuary_contributions", []);
        saveDB("chapel_expenses", []);
        saveDB("gsk_claims", []);
        saveDB("logs", []);
        
        if (window.SupabaseConnected && window.supabaseClient) {
            window.supabaseClient.from("members").delete().neq("id", "0").then(() => {});
            window.supabaseClient.from("tithes").delete().neq("id", "0").then(() => {});
            window.supabaseClient.from("mortuary_contributions").delete().neq("id", "0").then(() => {});
            window.supabaseClient.from("chapel_expenses").delete().neq("id", "0").then(() => {});
            window.supabaseClient.from("gsk_claims").delete().neq("id", "0").then(() => {});
        }

        const settings = getDB("settings", DEFAULT_SETTINGS);
        settings.secretaries = [
            { id: "sec_1", username: "sec_juan", name: "Juan Dela Cruz (Secretary)", role: "Secretary", active: true }
        ];
        saveDB("settings", settings);

        const activeUser = localStorage.getItem("GskActiveUser") || "sec_juan";
        addSystemLog("WIPE_DATABASE", "SETTINGS", "Wiped all database structures and records", activeUser);
        showToast("All database tables wiped clean.", "danger");

        setTimeout(() => {
            location.reload();
        }, 800);
    }
}
