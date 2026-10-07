// data.js - Universal Supabase & LocalStorage Hybrid Data Engine for Fatima Parish Management System
// High-performance Cloud Database Engine with instant LocalStorage caching and offline fallback.

const DB_PREFIX = "GskSystem_";
window.SupabaseConnected = false;
window.MySQLConnected = false; // Legacy fallback

// Global safe Lucide icons helper
window.safeLucideIcons = function() {
    try {
        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }
    } catch (e) {
        console.warn("Lucide notice:", e);
    }
};

// Helper to get local date string (YYYY-MM-DD)
function getLocalISODate(d = new Date()) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const DEFAULT_SETTINGS = {
    systemName: "FATIMA PARISH",
    allocations: {
        gskShare: 20,      // 20%
        chapelShare: 20,   // 20%
        parokyaShare: 60   // 60%
    },
    secretaries: [
        { id: "sec_1", username: "sec_juan", name: "Juan Dela Cruz (Secretary)", role: "Secretary", active: true, password: "password123", email: "secretary.fatimaparish@gmail.com" }
    ],
    theme: "light"
};

const GSK_LIST = [
    "GSK San Jose",
    "GSK Santa Maria",
    "GSK San Pedro",
    "GSK Santo Rosario"
];

const DEFAULT_MEMBERS = [];

const DEFAULT_DECEASED = [
    { id: "dec_1", name: "Arnel Pineda", age: 78, dateOfDeath: "2026-05-02", burialDate: "2026-05-10", gsk: "GSK San Jose", contactPerson: "Ronaldo Ramos (Son)", contactPhone: "09178887777", status: "Closed", submittedBy: "gsk_leader_1" },
    { id: "dec_2", name: "Gary Valenciano", age: 65, dateOfDeath: "2026-05-18", burialDate: "2026-05-25", gsk: "GSK Santa Maria", contactPerson: "Maria Penduko (Wife)", contactPhone: "09214443333", status: "Active", submittedBy: "gsk_leader_2" },
    { id: "dec_3", name: "Jose Mari Chan", age: 92, dateOfDeath: "2026-05-28", burialDate: "2026-06-05", gsk: "GSK San Pedro", contactPerson: "Baldomero Aguinaldo (Grandson)", contactPhone: "09081112222", status: "Active", submittedBy: "gsk_leader_3" }
];

const DEFAULT_TITHES = [];
const DEFAULT_MORTUARY = [];

const DEFAULT_USERS = [
    { id: "usr_1", name: "GSK Leader (San Jose)",     gsk: "GSK San Jose",     email: "gsk.sanjose@gmail.com",       username: "gsk_leader_1", password: "leader123", role: "GskLeader", status: "Active" },
    { id: "usr_2", name: "GSK Leader (Santa Maria)",  gsk: "GSK Santa Maria",  email: "gsk.santamaria@gmail.com",    username: "gsk_leader_2", password: "leader123", role: "GskLeader", status: "Active" },
    { id: "usr_3", name: "GSK Leader (San Pedro)",    gsk: "GSK San Pedro",    email: "gsk.sanpedro@gmail.com",      username: "gsk_leader_3", password: "leader123", role: "GskLeader", status: "Active" },
    { id: "usr_4", name: "GSK Leader (Santo Rosario)", gsk: "GSK Santo Rosario", email: "gsk.santorosario@gmail.com",   username: "gsk_leader_4", password: "leader123", role: "GskLeader", status: "Active" }
];

function getAllGskGroups() {
    const list = [...GSK_LIST];
    const users = getDB("users", DEFAULT_USERS);
    users.forEach(u => {
        if (u.role === "GskLeader" && u.gsk && u.gsk !== "All" && u.gsk.trim() !== "") {
            if (!list.includes(u.gsk)) {
                list.push(u.gsk);
            }
        }
    });
    return list;
}

// Helper to load data from localStorage (synchronous for instant UI rendering)
function getDB(key, defaultVal = []) {
    try {
        const data = localStorage.getItem(DB_PREFIX + key);
        if (!data) {
            if (key === "members") {
                saveDB("members", []);
                return [];
            }
            if (key === "deceased") {
                saveDB("deceased", DEFAULT_DECEASED);
                return [...DEFAULT_DECEASED];
            }
            if (key === "users") {
                saveDB("users", DEFAULT_USERS);
                return [...DEFAULT_USERS];
            }
            return defaultVal;
        }
        let parsed = JSON.parse(data);
        if (key === "members") {
            if (!Array.isArray(parsed)) {
                saveDB("members", []);
                return [];
            }
            // Auto-filter out legacy sample members
            const sampleMemberIds = ["mem_1", "mem_7", "mem_8", "mem_9", "mem_10"];
            const sampleMemberNames = ["arnel pineda", "martin nievera", "bamboo mañalac", "bamboo maalac", "ely buendia", "moira dela torre"];
            const clean = parsed.filter(m => !sampleMemberIds.includes(m.id) && !sampleMemberNames.includes((m.name || "").toLowerCase().trim()));
            if (clean.length !== parsed.length) {
                saveDB("members", clean);
                return clean;
            }
        }
        if (key === "deceased") {
            if (!Array.isArray(parsed) || parsed.length === 0) {
                saveDB("deceased", DEFAULT_DECEASED);
                return [...DEFAULT_DECEASED];
            }
        }
        if (key === "users") {
            if (!Array.isArray(parsed) || parsed.length === 0) {
                saveDB("users", DEFAULT_USERS);
                return [...DEFAULT_USERS];
            }
        }
        if (key === "settings") {
            if (!parsed.secretaries || !Array.isArray(parsed.secretaries) || parsed.secretaries.length === 0) {
                parsed.secretaries = [
                    { id: "sec_1", username: "sec_juan", name: "Juan Dela Cruz (Secretary)", role: "Secretary", active: true, password: "password123", email: "secretary.fatimaparish@gmail.com" }
                ];
                saveDB("settings", parsed);
            }
        }
        return parsed !== null && parsed !== undefined ? parsed : defaultVal;
    } catch (_) {
        if (key === "members") return [];
        if (key === "deceased") return [...DEFAULT_DECEASED];
        if (key === "users") return [...DEFAULT_USERS];
        return defaultVal;
    }
}

// Helper to save data to localStorage
function saveDB(key, data) {
    try {
        localStorage.setItem(DB_PREFIX + key, JSON.stringify(data));
    } catch (e) {
        console.error("LocalStorage save error:", e);
    }
}

// Universal Member Dropdown Population Engine
window.populateMemberDropdown = function(selectEl, filterGsk = null) {
    if (typeof selectEl === "string") {
        selectEl = document.getElementById(selectEl);
    }
    if (!selectEl) return;

    const currentVal = selectEl.value;
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const sessionRole = session.role || "Admin";
    const assignedGsk = session.assignedGsk || "";
    const sessionUser = (session.username || "").toLowerCase().trim();
    const sessionEmail = (session.email || "").toLowerCase().trim();

    let members = getDB("members", []);
    if (!Array.isArray(members)) {
        members = [];
        saveDB("members", members);
    }

    let activeMembers = members.filter(m => !m.status || m.status.toLowerCase() === "active");

    const targetGsk = filterGsk || ((sessionRole === "GskLeader" || sessionRole === "Leader") ? assignedGsk : null);
    
    let filtered = activeMembers;
    if (targetGsk && targetGsk !== "All" && targetGsk !== "") {
        const normTarget = targetGsk.toLowerCase().trim();
        filtered = activeMembers.filter(m => {
            const mGsk = (m.gsk || "").toLowerCase().trim();
            const sub = (m.submittedBy || "").toLowerCase().trim();
            const isOwner = (sub && (sub === sessionUser || sub === sessionEmail));
            const isGskMatch = (mGsk === normTarget || mGsk.includes(normTarget) || normTarget.includes(mGsk));
            return isOwner || isGskMatch;
        });
        if (filtered.length === 0) {
            filtered = activeMembers;
        }
    }

    filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    let html = `<option value="">-- Choose Member --</option>`;
    filtered.forEach(m => {
        const gskLabel = m.gsk ? ` (${m.gsk})` : '';
        html += `<option value="${m.id}">${m.name}${gskLabel}</option>`;
    });

    selectEl.innerHTML = html;
    if (currentVal && filtered.some(m => m.id === currentVal)) {
        selectEl.value = currentVal;
    }
};

window.populateAllMemberDropdowns = function() {
    const dropdownIds = [
        "leader-mort-member-select",
        "leader-tithe-member-select",
        "mort-member-select",
        "tithe-member-select",
        "dec-member-select"
    ];
    dropdownIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            window.populateMemberDropdown(el);
            if (!el.dataset.listenerAttached) {
                el.dataset.listenerAttached = "true";
                el.addEventListener("focus", function() {
                    if (this.options.length <= 1) {
                        window.populateMemberDropdown(this);
                    }
                });
                el.addEventListener("mousedown", function() {
                    if (this.options.length <= 1) {
                        window.populateMemberDropdown(this);
                    }
                });
            }
        }
    });
};

// System Logging Utility
function addSystemLog(action, category, details, user = "maryjoy") {
    const logs = getDB("logs", []);
    const newLog = {
        id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: user,
        action: action,
        category: category,
        details: details
    };
    logs.unshift(newLog);
    saveDB("logs", logs);

    // Sync to Supabase if connected
    if (window.SupabaseConnected && window.supabaseClient) {
        window.supabaseClient.from("system_logs").insert([{
            id: newLog.id,
            timestamp: newLog.timestamp,
            user: newLog.user,
            action: newLog.action,
            category: newLog.category,
            details: newLog.details
        }]).then(({ error }) => {
            if (error) console.warn("Log Supabase sync notice:", error);
        }).catch(err => console.warn("Log Supabase sync error:", err));
    }
}

// Initialize Database with Local Mock Data if empty
function initDatabase() {
    let currentSettings = getDB("settings", null);
    if (!currentSettings) {
        currentSettings = { ...DEFAULT_SETTINGS };
        saveDB("settings", currentSettings);
    } else {
        // Enforce the required 20% GSK / 20% Chapel / 60% Parokya
        if (!currentSettings.allocations || 
            currentSettings.allocations.gskShare === 30 || 
            currentSettings.allocations.parokyaShare === 50 || 
            currentSettings.allocations.parokyaShare === 40 || 
            (Number(currentSettings.allocations.gskShare) + Number(currentSettings.allocations.chapelShare) + Number(currentSettings.allocations.parokyaShare) !== 100)) {
            currentSettings.allocations = {
                gskShare: 20,
                chapelShare: 20,
                parokyaShare: 60
            };
            saveDB("settings", currentSettings);
        }
        if (currentSettings && currentSettings.secretaries) {
            currentSettings.secretaries = (currentSettings.secretaries || []).filter(s => s.username !== "maryjoy" && s.role !== "Administrator");
            if (currentSettings.secretaries.length === 0) {
                currentSettings.secretaries = [
                    { id: "sec_1", username: "sec_juan", name: "Juan Dela Cruz (Secretary)", role: "Secretary", active: true }
                ];
            }
            saveDB("settings", currentSettings);
        }
    }

    let existingUsers = getDB("users", []);
    // Filter out old administrator accounts
    existingUsers = (existingUsers || []).filter(u => u.id !== "usr_admin" && u.username !== "maryjoy" && u.role !== "Admin" && u.role !== "Administrator");

    const defaultAccounts = [
        { id: "usr_sec",   name: "Juan Dela Cruz (Secretary)", gsk: "All",              email: "secretary.fatimaparish@gmail.com", username: "sec_juan",    password: "password123", role: "Secretary", status: "Active" },
        { id: "usr_1",     name: "GSK Leader (San Jose)",     gsk: "GSK San Jose",     email: "gsk.sanjose@gmail.com",       username: "gsk_leader_1", password: "leader123",   role: "GskLeader", status: "Active" },
        { id: "usr_2",     name: "GSK Leader (Santa Maria)",  gsk: "GSK Santa Maria",  email: "gsk.santamaria@gmail.com",    username: "gsk_leader_2", password: "leader123",   role: "GskLeader", status: "Active" },
        { id: "usr_3",     name: "GSK Leader (San Pedro)",    gsk: "GSK San Pedro",    email: "gsk.sanpedro@gmail.com",      username: "gsk_leader_3", password: "leader123",   role: "GskLeader", status: "Active" },
        { id: "usr_4",     name: "GSK Leader (Santo Rosario)", gsk: "GSK Santo Rosario", email: "gsk.santorosario@gmail.com",   username: "gsk_leader_4", password: "leader123",   role: "GskLeader", status: "Active" }
    ];

    const mergedUsers = [...existingUsers];
    defaultAccounts.forEach(acc => {
        const existingIndex = mergedUsers.findIndex(u => u.id === acc.id || u.username === acc.username);
        if (existingIndex === -1) {
            mergedUsers.push(acc);
        } else {
            const u = mergedUsers[existingIndex];
            mergedUsers[existingIndex] = {
                ...u,
                name: u.name || acc.name,
                email: acc.email,
                gsk: acc.gsk,
                role: u.role || acc.role,
                status: "Active",
                password: acc.password
            };
        }
    });
    saveDB("users", mergedUsers);

    let storedMembers = getDB("members", []);
    const sampleMemberIds = ["mem_1", "mem_7", "mem_8", "mem_9", "mem_10"];
    const sampleMemberNames = ["arnel pineda", "martin nievera", "bamboo mañalac", "bamboo maalac", "ely buendia", "moira dela torre"];
    storedMembers = (storedMembers || []).filter(m => !sampleMemberIds.includes(m.id) && !sampleMemberNames.includes((m.name || "").toLowerCase().trim()));
    saveDB("members", storedMembers);

    let storedDeceased = getDB("deceased", []);
    if (!storedDeceased || storedDeceased.length === 0) {
        storedDeceased = [...DEFAULT_DECEASED];
        saveDB("deceased", storedDeceased);
    }

    // Clean all contribution and transaction records and Deduplicate
    let currentTithes = getDB("tithes", []);
    const seenTitheKeys = new Set();
    const cleanTithes = [];
    currentTithes.forEach(t => {
        const isLegacy = t.id === "t_7" || t.id === "t_10" || t.id === "t_1" || t.id === "t_2" || t.id === "t_3" || t.id === "t_4" || t.id === "t_5" || ["mem_2", "mem_3", "mem_4", "mem_5", "mem_6"].includes(t.memberId);
        const isSampleTithe = (Number(t.amount) === 500 && (t.date === "2026-08-01" || t.date === "2026-08-15" || t.date === "2026-08-10" || t.date === "2026-08-12" || t.date === "2026-08-18")) ||
            ((t.contributorName || '').includes("Martin Nievera") && Number(t.amount) === 500) ||
            ((t.contributorName || '').includes("Arnel Pineda") && Number(t.amount) === 500);
        const isUTestTithe = (Number(t.amount) === 300 && (t.date === "2025-02-06" || (t.date && t.date.includes("2025-02-06")))) ||
            (Number(t.amount) === 200 && (t.date === "2024-04-05" || (t.date && t.date.includes("2024-04-05")))) ||
            (Number(t.amount) === 500 && (t.date === "2024-02-22" || (t.date && t.date.includes("2024-02-22"))));
        const dedupKey = t.id ? t.id : `${t.memberId}_${t.amount}_${t.date}_${t.submittedBy}`;
        if (!isLegacy && !isSampleTithe && !isUTestTithe && !seenTitheKeys.has(dedupKey)) {
            seenTitheKeys.add(dedupKey);
            if (t.id) seenTitheKeys.add(t.id);
            cleanTithes.push(t);
        }
    });
    saveDB("tithes", cleanTithes);

    let currentMort = getDB("mortuary_contributions", []);
    const seenMortKeys = new Set();
    const cleanMort = [];
    currentMort.forEach(m => {
        const isLegacy = m.id === "mc_1" || m.id === "mc_2" || ["mem_2", "mem_3", "mem_4", "mem_5", "mem_6"].includes(m.memberId) || (m.contributorName && m.contributorName.includes("Arnel Pineda") && Number(m.amount) === 100);
        const dedupKey = m.id ? m.id : `${m.memberId}_${m.amount}_${m.date}_${m.submittedBy}`;
        if (!isLegacy && !seenMortKeys.has(dedupKey)) {
            seenMortKeys.add(dedupKey);
            if (m.id) seenMortKeys.add(m.id);
            cleanMort.push(m);
        }
    });
    saveDB("mortuary_contributions", cleanMort);

    saveDB("gsk_claims", []);
    saveDB("chapel_expenses", []);
    localStorage.setItem(DB_PREFIX + "records_purged_to_zero_v10", "true");

    const cleanInitialLogs = [
        { id: "log_init", timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), user: "maryjoy", action: "SYSTEM_INITIALIZE", category: "SETTINGS", details: "System initialized with Fatima Parish structure." }
    ];
    saveDB("logs", cleanInitialLogs);
}

// Initial local storage setup
initDatabase();

// -------------------------------------------------------------
// Supabase Backend Auto-Detection & Synchronization Engine
// -------------------------------------------------------------
window.syncWithSupabase = async function(showToastNotice = false) {
    if (typeof window.updateSupabaseBadge === "function") {
        window.updateSupabaseBadge("checking");
    }

    // Ensure Supabase client is initialized
    if (!window.supabaseClient && window.SupabaseConfig) {
        window.SupabaseConfig.init();
    }

    if (!window.supabaseClient) {
        window.SupabaseConnected = false;
        if (typeof window.updateSupabaseBadge === "function") {
            const isConfigured = window.SupabaseConfig && window.SupabaseConfig.isConfigured();
            window.updateSupabaseBadge(isConfigured ? "offline" : "not_configured");
        }
        if (showToastNotice && typeof showToast === "function") {
            showToast("Supabase not configured. Click the header badge to connect.", "warning");
        }
        return false;
    }

    try {
        const client = window.supabaseClient;

        // Verify live connection
        const testRes = await window.SupabaseConfig.testConnection();
        if (!testRes.success) {
            window.SupabaseConnected = false;
            if (typeof window.updateSupabaseBadge === "function") {
                window.updateSupabaseBadge("offline");
            }
            if (showToastNotice && typeof showToast === "function") {
                showToast("Cannot connect to Supabase: " + (testRes.error || "Network error"), "danger");
            }
            return false;
        }

        window.SupabaseConnected = true;
        if (typeof window.updateSupabaseBadge === "function") {
            window.updateSupabaseBadge("connected", "Live Cloud");
        }

        // Fetch all collections in parallel from Supabase
        const [
            membersRes,
            tithesRes,
            deceasedRes,
            mortRes,
            expRes,
            settingsRes,
            secRes,
            usersRes,
            logsRes
        ] = await Promise.all([
            client.from("members").select("*").order("name", { ascending: true }),
            client.from("tithes").select("*").order("date", { ascending: false }),
            client.from("deceased").select("*").order("date_of_death", { ascending: false }),
            client.from("mortuary_contributions").select("*").order("date", { ascending: false }),
            client.from("chapel_expenses").select("*").order("date", { ascending: false }),
            client.from("system_settings").select("*").limit(1),
            client.from("secretaries").select("*").order("name", { ascending: true }),
            client.from("users").select("*").order("name", { ascending: true }),
            client.from("system_logs").select("*").order("timestamp", { ascending: false }).limit(100)
        ]);

        // 1. Members Sync
        if (!membersRes.error && Array.isArray(membersRes.data)) {
            const mappedMembers = membersRes.data.map(m => ({
                id: m.id,
                gsk: m.gsk,
                name: m.name,
                contact: m.contact,
                status: m.status || "Active",
                joinedDate: m.joined_date,
                submittedBy: m.submitted_by
            }));
            saveDB("members", mappedMembers);
        }

        // 2. Tithes Sync
        if (!tithesRes.error && Array.isArray(tithesRes.data)) {
            const mappedTithes = tithesRes.data.map(t => ({
                id: t.id,
                memberId: t.member_id,
                date: t.date,
                amount: Number(t.amount) || 0,
                remarks: t.remarks,
                submittedBy: t.submitted_by
            }));
            saveDB("tithes", mappedTithes);
        }

        // 3. Deceased Sync
        if (!deceasedRes.error && Array.isArray(deceasedRes.data)) {
            const mappedDeceased = deceasedRes.data.map(d => ({
                id: d.id,
                name: d.name,
                age: d.age ? Number(d.age) : null,
                dateOfDeath: d.date_of_death,
                burialDate: d.burial_date,
                gsk: d.gsk,
                contactPerson: d.contact_person,
                contactPhone: d.contact_phone,
                status: d.status || "Active",
                submittedBy: d.submitted_by
            }));
            saveDB("deceased", mappedDeceased);
        }

        // 4. Mortuary Contributions Sync
        if (!mortRes.error && Array.isArray(mortRes.data)) {
            const mappedMort = mortRes.data.map(m => ({
                id: m.id,
                deceasedId: m.deceased_id,
                memberId: m.member_id,
                contributorName: m.contributor_name,
                amount: Number(m.amount) || 200,
                date: m.date,
                gsk: m.gsk,
                submittedBy: m.submitted_by
            }));
            saveDB("mortuary_contributions", mappedMort);
        }

        // 5. Chapel Expenses Sync
        if (!expRes.error && Array.isArray(expRes.data)) {
            const mappedExp = expRes.data.map(e => ({
                id: e.id,
                gsk: e.gsk,
                amount: Number(e.amount) || 0,
                date: e.date,
                purpose: e.purpose,
                category: e.category,
                item: e.item,
                submittedBy: e.submitted_by
            }));
            saveDB("chapel_expenses", mappedExp);
        }

        // 6. Settings & Secretaries Sync
        if (!settingsRes.error && settingsRes.data && settingsRes.data.length > 0) {
            const s = settingsRes.data[0];
            const secretaries = (!secRes.error && Array.isArray(secRes.data)) ? secRes.data : [];
            const settingsObj = {
                systemName: s.system_name || "FATIMA PARISH",
                allocations: {
                    gskShare: Number(s.gsk_share) || 20,
                    chapelShare: Number(s.chapel_share) || 20,
                    parokyaShare: Number(s.parokya_share) || 60
                },
                secretaries: secretaries.length > 0 ? secretaries : DEFAULT_SETTINGS.secretaries,
                theme: s.theme || "light"
            };
            saveDB("settings", settingsObj);
        }

        // 7. Users Sync
        if (!usersRes.error && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
            saveDB("users", usersRes.data);
        }

        // 8. Logs Sync
        if (!logsRes.error && Array.isArray(logsRes.data) && logsRes.data.length > 0) {
            const mappedLogs = logsRes.data.map(l => ({
                id: l.id,
                timestamp: l.timestamp,
                user: l.user,
                action: l.action,
                category: l.category,
                details: l.details
            }));
            saveDB("logs", mappedLogs);
        }

        if (showToastNotice && typeof showToast === "function") {
            showToast("Successfully synchronized with Supabase Cloud Database!", "success");
        }

        // Refresh all UI views with synced data
        if (typeof renderMembersTable === "function") renderMembersTable();
        if (typeof renderMemberFolderTabs === "function") renderMemberFolderTabs();
        if (typeof renderLeaderTithes === "function") renderLeaderTithes();
        if (typeof renderLeaderMortuary === "function") renderLeaderMortuary();
        if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView();
        if (typeof renderLeaderMembers === "function") renderLeaderMembers();
        if (typeof renderDeceasedTable === "function") renderDeceasedTable();
        if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
        if (typeof renderTitheReports === "function") renderTitheReports();
        if (typeof populateGSKDropdowns === "function") populateGSKDropdowns();
        if (typeof updateMainDashboardStats === "function") updateMainDashboardStats();
        if (typeof renderUserAccounts === "function") renderUserAccounts();

        return true;
    } catch (err) {
        console.warn("Supabase Sync warning:", err);
        window.SupabaseConnected = false;
        if (typeof window.updateSupabaseBadge === "function") {
            window.updateSupabaseBadge("offline");
        }
        return false;
    }
};

// Auto-sync on page load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.syncWithSupabase());
} else {
    setTimeout(() => window.syncWithSupabase(), 100);
}

// -------------------------------------------------------------
// Direct Repositories (Hybrid Supabase Cloud + LocalStorage)
// -------------------------------------------------------------
window.MemberDB = {
    add: async (rec) => {
        if (!rec.id) rec.id = "mem_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        
        // Push to Supabase if connected
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { error } = await window.supabaseClient.from("members").upsert({
                    id: rec.id,
                    gsk: rec.gsk,
                    name: rec.name,
                    contact: rec.contact || null,
                    status: rec.status || "Active",
                    joined_date: rec.joinedDate || rec.joined_date || getLocalISODate(),
                    submitted_by: rec.submittedBy || rec.submitted_by || "maryjoy"
                });
                if (error) console.warn("Supabase member add notice:", error);
            } catch (e) {
                console.warn("Supabase member save failed, using local:", e);
            }
        }

        const items = getDB("members", []);
        const existingIdx = items.findIndex(m => m.id === rec.id);
        if (existingIdx !== -1) {
            items[existingIdx] = rec;
        } else {
            items.unshift(rec);
        }
        saveDB("members", items);
        return rec;
    },
    getAll: async (gsk = null) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                let query = window.supabaseClient.from("members").select("*").order("name", { ascending: true });
                if (gsk && gsk !== "All") query = query.eq("gsk", gsk);
                const { data, error } = await query;
                if (!error && Array.isArray(data)) {
                    const mapped = data.map(m => ({
                        id: m.id,
                        gsk: m.gsk,
                        name: m.name,
                        contact: m.contact,
                        status: m.status || "Active",
                        joinedDate: m.joined_date,
                        submittedBy: m.submitted_by
                    }));
                    if (!gsk || gsk === "All") saveDB("members", mapped);
                    return mapped;
                }
            } catch (e) {
                console.warn("Supabase get members fallback:", e);
            }
        }
        const items = getDB("members", []);
        return gsk && gsk !== "All" ? items.filter(m => m.gsk === gsk) : items;
    },
    get: async (id) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient.from("members").select("*").eq("id", id).single();
                if (!error && data) {
                    return {
                        id: data.id,
                        gsk: data.gsk,
                        name: data.name,
                        contact: data.contact,
                        status: data.status,
                        joinedDate: data.joined_date,
                        submittedBy: data.submitted_by
                    };
                }
            } catch (_) {}
        }
        return getDB("members", []).find(m => m.id === id) || null;
    },
    update: async (rec) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("members").update({
                    gsk: rec.gsk,
                    name: rec.name,
                    contact: rec.contact || null,
                    status: rec.status,
                    joined_date: rec.joinedDate || rec.joined_date,
                    submitted_by: rec.submittedBy || rec.submitted_by
                }).eq("id", rec.id);
            } catch (e) {
                console.warn("Supabase member update fallback:", e);
            }
        }
        const items = getDB("members", []);
        const idx = items.findIndex(m => m.id === rec.id);
        if (idx !== -1) items[idx] = { ...items[idx], ...rec };
        saveDB("members", items);
        return rec;
    },
    delete: async (id) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("members").delete().eq("id", id);
            } catch (e) {
                console.warn("Supabase member delete fallback:", e);
            }
        }
        const items = getDB("members", []).filter(m => m.id !== id);
        saveDB("members", items);
        return true;
    }
};

window.TitheDB = {
    add: async (rec) => {
        if (!rec.id) rec.id = "t_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { error } = await window.supabaseClient.from("tithes").upsert({
                    id: rec.id,
                    member_id: rec.memberId || rec.member_id,
                    date: rec.date || getLocalISODate(),
                    amount: Number(rec.amount) || 0,
                    remarks: rec.remarks || null,
                    submitted_by: rec.submittedBy || rec.submitted_by || "maryjoy"
                });
                if (error) console.warn("Supabase tithe add notice:", error);
            } catch (e) {
                console.warn("Supabase tithe save failed, using local:", e);
            }
        }
        const items = getDB("tithes", []);
        const existingIdx = items.findIndex(t => t.id === rec.id);
        if (existingIdx !== -1) {
            items[existingIdx] = rec;
        } else {
            items.unshift(rec);
        }
        saveDB("tithes", items);
        return rec;
    },
    getAll: async () => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient.from("tithes").select("*").order("date", { ascending: false });
                if (!error && Array.isArray(data)) {
                    const mapped = data.map(t => ({
                        id: t.id,
                        memberId: t.member_id,
                        date: t.date,
                        amount: Number(t.amount) || 0,
                        remarks: t.remarks,
                        submittedBy: t.submitted_by
                    }));
                    saveDB("tithes", mapped);
                    return mapped;
                }
            } catch (_) {}
        }
        return getDB("tithes", []);
    },
    get: async (id) => getDB("tithes", []).find(t => t.id === id) || null,
    delete: async (id) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("tithes").delete().eq("id", id);
            } catch (_) {}
        }
        const items = getDB("tithes", []).filter(t => t.id !== id);
        saveDB("tithes", items);
        return true;
    }
};

window.DeceasedDB = {
    add: async (rec) => {
        if (!rec.id) rec.id = "dec_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { error } = await window.supabaseClient.from("deceased").upsert({
                    id: rec.id,
                    name: rec.name,
                    age: rec.age ? Number(rec.age) : null,
                    date_of_death: rec.dateOfDeath || rec.date_of_death || getLocalISODate(),
                    burial_date: rec.burialDate || rec.burial_date || null,
                    gsk: rec.gsk,
                    contact_person: rec.contactPerson || rec.contact_person || null,
                    contact_phone: rec.contactPhone || rec.contact_phone || null,
                    status: rec.status || "Active",
                    submitted_by: rec.submittedBy || rec.submitted_by || "maryjoy"
                });
                if (error) console.warn("Supabase deceased add notice:", error);
            } catch (e) {
                console.warn("Supabase deceased save failed:", e);
            }
        }
        const items = getDB("deceased", []);
        const existingIdx = items.findIndex(d => d.id === rec.id);
        if (existingIdx !== -1) {
            items[existingIdx] = rec;
        } else {
            items.unshift(rec);
        }
        saveDB("deceased", items);
        return rec;
    },
    getAll: async (gsk = null) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                let query = window.supabaseClient.from("deceased").select("*").order("date_of_death", { ascending: false });
                if (gsk && gsk !== "All") query = query.eq("gsk", gsk);
                const { data, error } = await query;
                if (!error && Array.isArray(data)) {
                    const mapped = data.map(d => ({
                        id: d.id,
                        name: d.name,
                        age: d.age ? Number(d.age) : null,
                        dateOfDeath: d.date_of_death,
                        burialDate: d.burial_date,
                        gsk: d.gsk,
                        contactPerson: d.contact_person,
                        contactPhone: d.contact_phone,
                        status: d.status || "Active",
                        submittedBy: d.submitted_by
                    }));
                    if (!gsk || gsk === "All") saveDB("deceased", mapped);
                    return mapped;
                }
            } catch (_) {}
        }
        const items = getDB("deceased", []);
        return gsk && gsk !== "All" ? items.filter(d => d.gsk === gsk) : items;
    },
    get: async (id) => getDB("deceased", []).find(d => d.id === id) || null,
    update: async (rec) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("deceased").update({
                    name: rec.name,
                    age: rec.age ? Number(rec.age) : null,
                    date_of_death: rec.dateOfDeath || rec.date_of_death,
                    burial_date: rec.burialDate || rec.burial_date,
                    gsk: rec.gsk,
                    contact_person: rec.contactPerson || rec.contact_person,
                    contact_phone: rec.contactPhone || rec.contact_phone,
                    status: rec.status,
                    submitted_by: rec.submittedBy || rec.submitted_by
                }).eq("id", rec.id);
            } catch (_) {}
        }
        const items = getDB("deceased", []);
        const idx = items.findIndex(d => d.id === rec.id);
        if (idx !== -1) items[idx] = { ...items[idx], ...rec };
        saveDB("deceased", items);
        return rec;
    },
    delete: async (id) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("deceased").delete().eq("id", id);
            } catch (_) {}
        }
        const items = getDB("deceased", []).filter(d => d.id !== id);
        saveDB("deceased", items);
        return true;
    }
};

window.MortuaryDB = {
    add: async (rec) => {
        if (!rec.id) rec.id = "mc_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { error } = await window.supabaseClient.from("mortuary_contributions").upsert({
                    id: rec.id,
                    deceased_id: rec.deceasedId || rec.deceased_id,
                    member_id: rec.memberId || rec.member_id || null,
                    contributor_name: rec.contributorName || rec.contributor_name,
                    amount: Number(rec.amount) || 200,
                    date: rec.date || getLocalISODate(),
                    gsk: rec.gsk,
                    submitted_by: rec.submittedBy || rec.submitted_by || "maryjoy"
                });
                if (error) console.warn("Supabase mortuary add notice:", error);
            } catch (e) {
                console.warn("Supabase mortuary save failed:", e);
            }
        }
        const items = getDB("mortuary_contributions", []);
        const existingIdx = items.findIndex(m => m.id === rec.id);
        if (existingIdx !== -1) {
            items[existingIdx] = rec;
        } else {
            items.unshift(rec);
        }
        saveDB("mortuary_contributions", items);
        return rec;
    },
    getAll: async () => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient.from("mortuary_contributions").select("*").order("date", { ascending: false });
                if (!error && Array.isArray(data)) {
                    const mapped = data.map(m => ({
                        id: m.id,
                        deceasedId: m.deceased_id,
                        memberId: m.member_id,
                        contributorName: m.contributor_name,
                        amount: Number(m.amount) || 200,
                        date: m.date,
                        gsk: m.gsk,
                        submittedBy: m.submitted_by
                    }));
                    saveDB("mortuary_contributions", mapped);
                    return mapped;
                }
            } catch (_) {}
        }
        return getDB("mortuary_contributions", []);
    },
    delete: async (id) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("mortuary_contributions").delete().eq("id", id);
            } catch (_) {}
        }
        const items = getDB("mortuary_contributions", []).filter(m => m.id !== id);
        saveDB("mortuary_contributions", items);
        return true;
    }
};

window.ExpenseDB = {
    add: async (rec) => {
        if (!rec.id) rec.id = "exp_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { error } = await window.supabaseClient.from("chapel_expenses").upsert({
                    id: rec.id,
                    gsk: rec.gsk,
                    amount: Number(rec.amount) || 0,
                    date: rec.date || getLocalISODate(),
                    purpose: rec.purpose,
                    category: rec.category,
                    item: rec.item,
                    submitted_by: rec.submittedBy || rec.submitted_by || "maryjoy"
                });
                if (error) console.warn("Supabase expense add notice:", error);
            } catch (e) {
                console.warn("Supabase expense save failed:", e);
            }
        }
        const items = getDB("chapel_expenses", []);
        items.unshift(rec);
        saveDB("chapel_expenses", items);
        return rec;
    },
    getAll: async (gsk = null) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                let query = window.supabaseClient.from("chapel_expenses").select("*").order("date", { ascending: false });
                if (gsk && gsk !== "All") query = query.eq("gsk", gsk);
                const { data, error } = await query;
                if (!error && Array.isArray(data)) {
                    const mapped = data.map(e => ({
                        id: e.id,
                        gsk: e.gsk,
                        amount: Number(e.amount) || 0,
                        date: e.date,
                        purpose: e.purpose,
                        category: e.category,
                        item: e.item,
                        submittedBy: e.submitted_by
                    }));
                    if (!gsk || gsk === "All") saveDB("chapel_expenses", mapped);
                    return mapped;
                }
            } catch (_) {}
        }
        const items = getDB("chapel_expenses", []);
        return gsk && gsk !== "All" ? items.filter(e => e.gsk === gsk) : items;
    },
    delete: async (id) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("chapel_expenses").delete().eq("id", id);
            } catch (_) {}
        }
        const items = getDB("chapel_expenses", []).filter(e => e.id !== id);
        saveDB("chapel_expenses", items);
        return true;
    }
};

window.SettingsDB = {
    get: async () => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient.from("system_settings").select("*").limit(1);
                if (!error && data && data.length > 0) {
                    const s = data[0];
                    const { data: secData } = await window.supabaseClient.from("secretaries").select("*");
                    const settingsObj = {
                        systemName: s.system_name || DEFAULT_SETTINGS.systemName,
                        allocations: {
                            gskShare: Number(s.gsk_share) || 20,
                            chapelShare: Number(s.chapel_share) || 20,
                            parokyaShare: Number(s.parokya_share) || 60
                        },
                        secretaries: Array.isArray(secData) && secData.length > 0 ? secData : DEFAULT_SETTINGS.secretaries,
                        theme: s.theme || "light"
                    };
                    saveDB("settings", settingsObj);
                    return settingsObj;
                }
            } catch (_) {}
        }
        return getDB("settings", DEFAULT_SETTINGS);
    },
    save: async (settings) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("system_settings").upsert({
                    id: 1,
                    system_name: settings.systemName,
                    gsk_share: settings.allocations?.gskShare || 20,
                    chapel_share: settings.allocations?.chapelShare || 20,
                    parokya_share: settings.allocations?.parokyaShare || 60,
                    theme: settings.theme || "light"
                });
            } catch (e) {
                console.warn("Supabase settings save failed:", e);
            }
        }
        saveDB("settings", settings);
        return settings;
    }
};

window.UserDB = {
    getAll: async () => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient.from("users").select("*").order("name", { ascending: true });
                if (!error && Array.isArray(data) && data.length > 0) {
                    saveDB("users", data);
                    return data;
                }
            } catch (_) {}
        }
        return getDB("users", []);
    },
    add: async (user) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("users").upsert({
                    id: user.id,
                    name: user.name,
                    gsk: user.gsk || "All",
                    email: user.email,
                    username: user.username,
                    password: user.password,
                    role: user.role || "GskLeader",
                    status: user.status || "Active"
                });
            } catch (e) {
                console.warn("Supabase user add failed:", e);
            }
        }
        const users = getDB("users", []);
        users.push(user);
        saveDB("users", users);
        return user;
    },
    update: async (user) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("users").update({
                    name: user.name,
                    gsk: user.gsk,
                    email: user.email,
                    username: user.username,
                    password: user.password,
                    status: user.status
                }).eq("id", user.id);
            } catch (_) {}
        }
        const users = getDB("users", []);
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) users[idx] = { ...users[idx], ...user };
        saveDB("users", users);
        return user;
    },
    delete: async (id) => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                await window.supabaseClient.from("users").delete().eq("id", id);
            } catch (_) {}
        }
        const users = getDB("users", []).filter(u => u.id !== id);
        saveDB("users", users);
        return true;
    }
};

window.LogDB = {
    getAll: async () => {
        if (window.SupabaseConnected && window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient.from("system_logs").select("*").order("timestamp", { ascending: false }).limit(100);
                if (!error && Array.isArray(data)) {
                    saveDB("logs", data);
                    return data;
                }
            } catch (_) {}
        }
        return getDB("logs", []);
    },
    add: async (log) => {
        addSystemLog(log.action, log.category, log.details, log.user);
        return log;
    }
};
