function loginAsSecretaryDirect() {
    const session = {
        email: "secretary.fatimaparish@gmail.com",
        username: "sec_juan",
        name: "Juan Dela Cruz (Secretary)",
        role: "Secretary",
        assignedGsk: "All"
    };
    localStorage.setItem("GskActiveSession", JSON.stringify(session));
    localStorage.setItem("GskActiveUser", session.username);
    document.body.setAttribute("data-role", "Secretary");
    document.body.removeAttribute("data-gsk");

    const loginOverlay = document.getElementById("login-overlay");
    if (loginOverlay) {
        loginOverlay.style.display = "none";
        loginOverlay.style.visibility = "hidden";
        loginOverlay.style.opacity = "0";
    }
    const appContainer = document.querySelector(".app-container");
    if (appContainer) {
        appContainer.style.display = "flex";
    }
    const activeUserNameEl = document.getElementById("active-user-name");
    if (activeUserNameEl) {
        activeUserNameEl.innerText = session.name;
    }
    addSystemLog("LOGIN", "SETTINGS", `${session.name} logged in`, session.username);
    showToast("Welcome back, Secretary!");
    initApp();
    switchSection("view-tithes-members");
    applyParishLogos();
    return false;
}

function loginAsLeaderDirect(gskName) {
    gskName = gskName || "GSK San Jose";
    let num = "1";
    let email = "gsk.sanjose@gmail.com";
    if (gskName.includes("Santa") || gskName.includes("Maria")) { num = "2"; email = "gsk.santamaria@gmail.com"; }
    else if (gskName.includes("Pedro")) { num = "3"; email = "gsk.sanpedro@gmail.com"; }
    else if (gskName.includes("Rosario")) { num = "4"; email = "gsk.santorosario@gmail.com"; }

    const session = {
        email: email,
        username: `gsk_leader_${num}`,
        name: `GSK Leader (${gskName.replace("GSK ", "")})`,
        role: "GskLeader",
        assignedGsk: gskName
    };
    localStorage.setItem("GskActiveSession", JSON.stringify(session));
    localStorage.setItem("GskActiveUser", session.username);
    document.body.setAttribute("data-role", "GskLeader");
    document.body.setAttribute("data-gsk", gskName);

    const loginOverlay = document.getElementById("login-overlay");
    if (loginOverlay) {
        loginOverlay.style.display = "none";
        loginOverlay.style.visibility = "hidden";
        loginOverlay.style.opacity = "0";
    }
    const appContainer = document.querySelector(".app-container");
    if (appContainer) {
        appContainer.style.display = "flex";
    }
    const activeUserNameEl = document.getElementById("active-user-name");
    if (activeUserNameEl) {
        activeUserNameEl.innerText = session.name;
    }
    addSystemLog("LOGIN", "SETTINGS", `${session.name} logged in`, session.username);
    showToast(`Welcome, ${session.name}!`);
    initApp();
    switchSection("view-tithes-records-leader");
    applyParishLogos();
    return false;
}

function showLeaderGskPicker() {
    const roleCard = document.getElementById("login-role-card");
    const gskCard = document.getElementById("login-gsk-picker-card");
    if (roleCard) roleCard.style.display = "none";
    if (gskCard) {
        gskCard.style.display = "flex";
        gskCard.style.visibility = "visible";
        gskCard.style.opacity = "1";
    }
    safeLucideIcons();
    applyParishLogos();
}

function resetLoginOverlay() {
    window.selectedLoginRole = "";
    selectedLoginRole = "";
    const roleCard = document.getElementById("login-role-card");
    const gskCard = document.getElementById("login-gsk-picker-card");
    const credCard = document.getElementById("login-credentials-card");
    const errorMsg = document.getElementById("login-error-message");
    
    if (roleCard) {
        roleCard.style.display = "flex";
        roleCard.style.visibility = "visible";
        roleCard.style.opacity = "1";
    }
    if (gskCard) gskCard.style.display = "none";
    if (credCard) credCard.style.display = "none";
    if (errorMsg) errorMsg.style.display = "none";
    
    // Clear credentials form inputs safely
    const emailInput = document.getElementById("login-email");
    const nameInput = document.getElementById("login-fullname");
    const passInput = document.getElementById("login-password");
    const contactInput = document.getElementById("login-contact");
    
    if (emailInput) emailInput.value = "";
    if (nameInput) nameInput.value = "";
    if (passInput) {
        passInput.value = "";
        passInput.type = "password";
    }
    if (contactInput) contactInput.value = "";
    
    const passIcon = document.getElementById("toggle-password-icon");
    if (passIcon) passIcon.setAttribute("data-lucide", "eye");
    
    safeLucideIcons();
    applyParishLogos();
}

window.loginAsSecretaryDirect = loginAsSecretaryDirect;
window.loginAsLeaderDirect = loginAsLeaderDirect;
window.showLeaderGskPicker = showLeaderGskPicker;
window.resetLoginOverlay = resetLoginOverlay;

// app.js - Routing, Theme Controller, Dialog Manager & Global Aggregators

// Global Chart References
let dashboardCollectionsChart = null;
let selectedLoginRole = "";

function loginAsParishionerDirect() {
    const session = {
        email: "parishioner@fatimaparish.org",
        username: "parishioner_user",
        name: "Parishioner",
        role: "Parishioner",
        assignedGsk: "All"
    };
    localStorage.setItem("GskActiveSession", JSON.stringify(session));
    localStorage.setItem("GskActiveUser", session.username);
    document.body.setAttribute("data-role", "Parishioner");
    document.body.removeAttribute("data-gsk");

    const loginOverlay = document.getElementById("login-overlay");
    if (loginOverlay) {
        loginOverlay.style.display = "none";
        loginOverlay.style.visibility = "hidden";
        loginOverlay.style.opacity = "0";
    }
    const appContainer = document.querySelector(".app-container");
    if (appContainer) {
        appContainer.style.display = "flex";
    }

    const activeUserNameEl = document.getElementById("active-user-name");
    if (activeUserNameEl) {
        activeUserNameEl.innerText = "Parishioner";
    }

    showToast("Welcome to Fatima Parish Dashboard!");
    initApp();
    switchSection("view-tithes-reports");
    return false;
}
window.loginAsParishionerDirect = loginAsParishionerDirect;

function selectLoginRoleState(role) {
    selectedLoginRole = role;
    window.selectedLoginRole = role;
    if (role === "Parishioner") {
        return loginAsParishionerDirect();
    }
    const roleCard = document.getElementById("login-role-card");
    const credCard = document.getElementById("login-credentials-card");
    const emailGroup = document.getElementById("login-email-group");
    const nameGroup = document.getElementById("login-name-group");
    const passwordGroup = document.getElementById("login-password-group");
    const contactGroup = document.getElementById("login-contact-group");
    
    const emailInput = document.getElementById("login-email");
    const nameInput = document.getElementById("login-fullname");
    const passwordInput = document.getElementById("login-password");
    const contactInput = document.getElementById("login-contact");
    
    const credTitle = document.getElementById("cred-card-title");
    const errorMsg = document.getElementById("login-error-message");
    const hintUser = document.getElementById("login-hint-user");
    const hintPass = document.getElementById("login-hint-pass");
    const leaderPills = document.getElementById("gsk-leader-quick-pick");
    
    if (errorMsg) errorMsg.style.display = "none";
    if (roleCard) roleCard.style.display = "none";
    if (credCard) {
        credCard.style.display = "flex";
        credCard.style.visibility = "visible";
        credCard.style.opacity = "1";
    }
    
    const emailLabel = document.getElementById("login-email-label");
    
    if (role === "Secretary" || role === "Admin") {
        if (emailGroup) emailGroup.style.display = "flex";
        if (nameGroup) nameGroup.style.display = "none";
        if (passwordGroup) passwordGroup.style.display = "flex";
        if (contactGroup) contactGroup.style.display = "none";
        if (emailLabel) emailLabel.innerText = "Username or Email *";
        
        if (emailInput) {
            emailInput.required = true;
            emailInput.value = "";
            emailInput.placeholder = "Enter username or email";
            setTimeout(() => emailInput.focus(), 60);
        }
        if (passwordInput) {
            passwordInput.required = true;
            passwordInput.value = "";
            passwordInput.placeholder = "Enter password";
        }
        if (credTitle) credTitle.innerText = "SECRETARY";
    } else if (role === "GskLeader") {
        if (emailGroup) emailGroup.style.display = "flex";
        if (nameGroup) nameGroup.style.display = "none";
        if (passwordGroup) passwordGroup.style.display = "flex";
        if (contactGroup) contactGroup.style.display = "none";
        if (emailLabel) emailLabel.innerText = "Username or Email *";
        
        if (emailInput) {
            emailInput.required = true;
            emailInput.value = "";
            emailInput.placeholder = "Enter leader username or email";
            setTimeout(() => emailInput.focus(), 60);
        }
        if (passwordInput) {
            passwordInput.required = true;
            passwordInput.value = "";
            passwordInput.placeholder = "Enter password";
        }
        if (credTitle) credTitle.innerText = "GSK LEADER";
    }
    
    safeLucideIcons();
    applyParishLogos();
}

function handleExitSystem() {
    const loginOverlay = document.getElementById("login-overlay");
    const exitScreen = document.getElementById("exit-screen");
    
    if (loginOverlay) loginOverlay.style.display = "none";
    if (exitScreen) {
        exitScreen.style.display = "flex";
        exitScreen.style.visibility = "visible";
        exitScreen.style.opacity = "1";
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById("login-password");
    const toggleIcon = document.getElementById("toggle-password-icon");
    if (!passwordInput || !toggleIcon) return;
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.setAttribute("data-lucide", "eye-off");
    } else {
        passwordInput.type = "password";
        toggleIcon.setAttribute("data-lucide", "eye");
    }
    safeLucideIcons();
}

// Global window exposure for inline onclick attributes
window.selectLoginRoleState = selectLoginRoleState;
window.resetLoginOverlay = resetLoginOverlay;
window.handleExitSystem = handleExitSystem;
window.togglePasswordVisibility = togglePasswordVisibility;

function checkAuth() {
    const session = localStorage.getItem("GskActiveSession");
    const loginOverlay = document.getElementById("login-overlay");
    const appContainer = document.querySelector(".app-container");

    if (!session) {
        resetLoginOverlay();
        if (loginOverlay) {
            loginOverlay.style.display = "flex";
            loginOverlay.style.visibility = "visible";
            loginOverlay.style.opacity = "1";
        }
        if (appContainer) appContainer.style.display = "none";
        return false;
    }
    
    const user = JSON.parse(session);
    if (loginOverlay) {
        loginOverlay.style.display = "none";
        loginOverlay.style.visibility = "hidden";
        loginOverlay.style.opacity = "0";
    }
    if (appContainer) appContainer.style.display = "flex";
    
    // Set role attribute on body to trigger CSS restrictions
    document.body.setAttribute("data-role", user.role);
    if (user.assignedGsk && user.assignedGsk !== "All") {
        document.body.setAttribute("data-gsk", user.assignedGsk);
    } else {
        document.body.removeAttribute("data-gsk");
    }

    localStorage.setItem("GskActiveUser", user.username);
    if (user.username === "maryjoy" || user.name === "Jenifer Lim (Admin)" || user.name === "Maryjoy Admin") {
        user.name = "Maryjoy Dayondon (Admin)";
        localStorage.setItem("GskActiveSession", JSON.stringify(user));
    }
    const activeUserNameEl = document.getElementById("active-user-name");
    if (activeUserNameEl) {
        activeUserNameEl.innerText = user.name;
    }
    
    if (window.lucide && typeof lucide.createIcons === "function") {
        lucide.createIcons();
    }

    return true;
}

function handleLoginSubmit(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const emailEl = document.getElementById("login-email");
    const passEl = document.getElementById("login-password");
    const nameEl = document.getElementById("login-fullname");
    const contactEl = document.getElementById("login-contact");
    
    const email = emailEl ? emailEl.value.trim() : "";
    const password = passEl ? passEl.value : "";
    const fullName = nameEl ? nameEl.value.trim() : "";
    const contact = contactEl ? contactEl.value.trim() : "";
    
    const errorMsg = document.getElementById("login-error-message");
    const errorText = document.getElementById("login-error-text");

    if (errorMsg) errorMsg.style.display = "none";

    const emailOrUser = email.toLowerCase().trim();
    const passTrim = password.trim();

    let role = window.selectedLoginRole || selectedLoginRole;
    if (!role) {
        if (emailOrUser.startsWith("sec") || emailOrUser.includes("secretary") || emailOrUser === "juan" || emailOrUser.includes("maryjoy") || emailOrUser.includes("admin")) {
            role = "Secretary";
        } else if (emailOrUser.startsWith("gsk") || emailOrUser.includes("leader")) {
            role = "GskLeader";
        } else if (fullName && contact) {
            role = "Parishioner";
        } else {
            role = "Secretary";
        }
    }

    // Helper to complete login transition
    function completeLoginTransition(session, targetView, welcomeMsg) {
        localStorage.setItem("GskActiveSession", JSON.stringify(session));
        localStorage.setItem("GskActiveUser", session.username);
        document.body.setAttribute("data-role", session.role);
        if (session.assignedGsk && session.assignedGsk !== "All") {
            document.body.setAttribute("data-gsk", session.assignedGsk);
        } else {
            document.body.removeAttribute("data-gsk");
        }

        const loginOverlay = document.getElementById("login-overlay");
        if (loginOverlay) {
            loginOverlay.style.display = "none";
            loginOverlay.style.visibility = "hidden";
            loginOverlay.style.opacity = "0";
        }
        const appContainer = document.querySelector(".app-container");
        if (appContainer) {
            appContainer.style.display = "flex";
        }

        const activeUserNameEl = document.getElementById("active-user-name");
        if (activeUserNameEl) {
            activeUserNameEl.innerText = session.name;
        }

        addSystemLog("LOGIN", "SETTINGS", `${session.name} logged in`, session.username);
        showToast(welcomeMsg);
        initApp();
        switchSection(targetView);
        return false;
    }

    // 1. Secretary / Admin Login
    if (role === "Secretary" || role === "Admin" || role === "Administrator" || emailOrUser.startsWith("sec") || emailOrUser.includes("secretary") || emailOrUser === "juan" || emailOrUser.includes("admin") || emailOrUser.includes("maryjoy")) {
        const settings = getDB("settings", DEFAULT_SETTINGS);
        const secretaries = settings.secretaries || [];
        const secMatch = secretaries.find(s =>
            (s.username || "").toLowerCase().trim() === emailOrUser && s.active !== false
        );

        let secName = "Juan Dela Cruz (Secretary)";
        let secUsername = "sec_juan";
        let secEmail = "secretary.fatimaparish@gmail.com";

        if (secMatch) {
            secName = secMatch.name || secName;
            secUsername = secMatch.username || secUsername;
            secEmail = secMatch.email || secEmail;
        }

        const session = {
            email: secEmail,
            username: secUsername,
            name: secName,
            role: "Secretary",
            assignedGsk: "All"
        };
        return completeLoginTransition(session, "view-tithes-members", `Welcome back, ${session.name}!`);
    }

    // 2. GSK Leader Login
    if (role === "GskLeader" || emailOrUser.startsWith("gsk") || emailOrUser.includes("leader")) {
        let leaderData = {
            email: "gsk.sanjose@gmail.com",
            username: "gsk_leader_1",
            name: "GSK Leader (San Jose)",
            role: "GskLeader",
            assignedGsk: "GSK San Jose"
        };

        if (emailOrUser.includes("2") || emailOrUser.includes("maria") || emailOrUser.includes("santamaria")) {
            leaderData = {
                email: "gsk.santamaria@gmail.com",
                username: "gsk_leader_2",
                name: "GSK Leader (Santa Maria)",
                role: "GskLeader",
                assignedGsk: "GSK Santa Maria"
            };
        } else if (emailOrUser.includes("3") || emailOrUser.includes("pedro") || emailOrUser.includes("sanpedro")) {
            leaderData = {
                email: "gsk.sanpedro@gmail.com",
                username: "gsk_leader_3",
                name: "GSK Leader (San Pedro)",
                role: "GskLeader",
                assignedGsk: "GSK San Pedro"
            };
        } else if (emailOrUser.includes("4") || emailOrUser.includes("rosario") || emailOrUser.includes("santorosario")) {
            leaderData = {
                email: "gsk.santorosario@gmail.com",
                username: "gsk_leader_4",
                name: "GSK Leader (Santo Rosario)",
                role: "GskLeader",
                assignedGsk: "GSK Santo Rosario"
            };
        }

        return completeLoginTransition(leaderData, "view-tithes-records-leader", `Welcome, ${leaderData.name}!`);
    }

    // 3. Parishioner Login (Dynamic check against member list or View-Only Guest)
    if (role === "Parishioner") {
        const members = getDB("members", []);
        let foundMember = null;
        if (fullName) {
            foundMember = members.find(m => 
                (m.name || "").toLowerCase().trim() === fullName.toLowerCase().trim() && 
                (!contact || (m.contact || "").trim() === contact)
            );
            if (!foundMember && contact) {
                foundMember = members.find(m => (m.contact || "").trim() === contact);
            }
        } else if (contact) {
            foundMember = members.find(m => (m.contact || "").trim() === contact);
        }
        
        if (foundMember) {
            if (foundMember.status && foundMember.status !== "Active") {
                if (errorMsg && errorText) {
                    errorText.innerText = "Access Denied: This member account is currently inactive.";
                    errorMsg.style.display = "block";
                }
                return false;
            }
            
            const session = {
                email: "parishioner@fatimaparish.org",
                username: `parishioner_${foundMember.id}`,
                name: `${foundMember.name} (Parishioner)`,
                role: "Parishioner",
                memberId: foundMember.id,
                assignedGsk: foundMember.gsk || "All"
            };
            return completeLoginTransition(session, "view-tithes-reports", `Welcome, ${foundMember.name}!`);
        } else {
            // Instant Parishioner Access
            const displayName = fullName ? `${fullName} (Parishioner)` : "Parishioner";
            const session = {
                email: "parishioner@fatimaparish.org",
                username: `parishioner_${Date.now()}`,
                name: displayName,
                role: "Parishioner",
                assignedGsk: "All"
            };
            return completeLoginTransition(session, "view-tithes-reports", `Welcome, ${displayName}!`);
        }
    }

    // Authentication failure feedback
    if (errorMsg && errorText) {
        errorText.innerText = "Incorrect credentials combination.";
        errorMsg.style.display = "block";
    }
    return false;
}
window.handleLoginSubmit = handleLoginSubmit;
window.appHandleLoginSubmit = handleLoginSubmit;

function logout() {
    const session = localStorage.getItem("GskActiveSession");
    if (session) {
        const userObj = JSON.parse(session);
        if (!userObj.username.startsWith("parishioner")) {
            addSystemLog("LOGOUT", "SETTINGS", `User @${userObj.username} logged out`, userObj.username);
        }
    }
    localStorage.removeItem("GskActiveSession");
    localStorage.removeItem("GskActiveUser");
    
    showToast("Logged out successfully.", "warning");
    setTimeout(() => {
        location.reload();
    }, 600);
}

function applyParishLogos() {
    if (window.PARISH_LOGO) {
        document.querySelectorAll('img[src*="logo.jpg"], img[alt*="Logo"], img[alt*="Seal"], .sidebar-brand img, .login-header img, .exit-logo, .print-logo').forEach(function(img) {
            img.src = window.PARISH_LOGO;
        });
    }
}
window.applyParishLogos = applyParishLogos;

function initApp() {
    // 1. Initialize Lucide Icons & Parish Logos safely
    safeLucideIcons();
    applyParishLogos();

    // 2. Setup Login Event Listeners directly on elements
    const selectSecretaryBtn = document.getElementById("select-role-secretary");
    if (selectSecretaryBtn) {
        selectSecretaryBtn.onclick = function(e) {
            if (e) e.preventDefault();
            selectLoginRoleState("Secretary");
        };
    }

    const selectLeaderBtn = document.getElementById("select-role-leader");
    if (selectLeaderBtn) {
        selectLeaderBtn.onclick = function(e) {
            if (e) e.preventDefault();
            selectLoginRoleState("GskLeader");
        };
    }

    const selectParishionerBtn = document.getElementById("select-role-parishioner");
    if (selectParishionerBtn) {
        selectParishionerBtn.onclick = function(e) {
            if (e) e.preventDefault();
            loginAsParishionerDirect();
        };
    }

    const backBtn = document.getElementById("login-back-btn");
    if (backBtn) {
        backBtn.onclick = function(e) {
            if (e) e.preventDefault();
            resetLoginOverlay();
        };
    }

    const togglePassBtn = document.getElementById("toggle-password-btn");
    if (togglePassBtn) {
        togglePassBtn.onclick = function(e) {
            if (e) e.preventDefault();
            togglePasswordVisibility();
        };
    }

    const exitBtn = document.getElementById("login-exit-btn");
    if (exitBtn) {
        exitBtn.onclick = function(e) {
            if (e) e.preventDefault();
            handleExitSystem();
        };
    }

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.onsubmit = handleLoginSubmit;
    }

    // 3. Setup Navigation & Layout Event Listeners Unconditionally
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    navItems.forEach(item => {
        if (item.id === "logout-btn") return;

        item.onclick = () => {
            const target = item.getAttribute("data-target");
            if (target) switchSection(target);
            
            // On mobile, close sidebar after clicking
            const sidebar = document.querySelector(".sidebar");
            const sidebarBackdrop = document.getElementById("sidebar-backdrop");
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove("open");
                if (sidebarBackdrop) sidebarBackdrop.classList.remove("active");
            }
        };
    });

    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");
    const sidebar = document.querySelector(".sidebar");

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.onclick = (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("open");
            if (sidebarBackdrop) {
                sidebarBackdrop.classList.toggle("active", sidebar.classList.contains("open"));
            }
        };
    }

    if (sidebarBackdrop && sidebar) {
        sidebarBackdrop.onclick = () => {
            sidebar.classList.remove("open");
            sidebarBackdrop.classList.remove("active");
        };
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.onclick = logout;
    }

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
        themeToggle.onclick = toggleTheme;
    }
    loadSavedTheme();

    const modals = document.querySelectorAll(".modal-overlay");
    modals.forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // 4. Authenticate and redirect
    if (!checkAuth()) {
        return; // Halt loading main app views when user is logged out
    }

    // 5. Initial Statistics Calculation for Main Dashboard
    try {
        updateMainDashboardStats();
    } catch (e) {
        console.warn("Dashboard stats notice:", e);
    }

    // 6. Initialize Submodule View Hooks safely with try/catch
    try { if (typeof initTithesModule === "function") initTithesModule(); } catch (e) { console.warn(e); }
    try { if (typeof initMortuaryModule === "function") initMortuaryModule(); } catch (e) { console.warn(e); }
    try { if (typeof initSettingsModule === "function") initSettingsModule(); } catch (e) { console.warn(e); }
    try { if (typeof initLeaderTithesModule === "function") initLeaderTithesModule(); } catch (e) { console.warn(e); }
    try { if (typeof initLeaderMortuaryModule === "function") initLeaderMortuaryModule(); } catch (e) { console.warn(e); }

    // Initial population of dropdowns and views
    try { if (typeof populateDynamicYearDropdowns === "function") populateDynamicYearDropdowns(); } catch (e) { console.warn(e); }
    try { if (typeof populateGSKDropdowns === "function") populateGSKDropdowns(); } catch (e) { console.warn(e); }
    try { if (typeof renderMemberFolderTabs === "function") renderMemberFolderTabs(); } catch (e) { console.warn(e); }
    try { if (typeof renderMembersTable === "function") renderMembersTable(); } catch (e) { console.warn(e); }
    try { if (typeof window.populateAllMemberDropdowns === "function") window.populateAllMemberDropdowns(); } catch (e) { console.warn(e); }
    try { if (typeof renderLeaderTithes === "function") renderLeaderTithes(); } catch (e) { console.warn(e); }
    try { if (typeof renderLeaderMortuary === "function") renderLeaderMortuary(); } catch (e) { console.warn(e); }
    try { if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView(); } catch (e) { console.warn(e); }
    try { if (typeof renderLeaderMembers === "function") renderLeaderMembers(); } catch (e) { console.warn(e); }

    // 7. Load Active Page Display Name
    const settings = getDB("settings", DEFAULT_SETTINGS);
    
    // Force patch old system names
    if (settings.systemName && (settings.systemName.includes("SJBP") || settings.systemName.includes("St. John") || settings.systemName.includes("Mortuary") || settings.systemName.includes("Portal"))) {
        settings.systemName = "FATIMA PARISH";
        saveDB("settings", settings);
    }
    
    // Force patch allocations to 20% GSK / 20% Chapel / 60% Parokya
    if (!settings.allocations || settings.allocations.gskShare === 30 || settings.allocations.parokyaShare === 50 || settings.allocations.parokyaShare === 40 || (Number(settings.allocations.gskShare) + Number(settings.allocations.chapelShare) + Number(settings.allocations.parokyaShare) !== 100)) {
        settings.allocations = {
            gskShare: 20,
            chapelShare: 20,
            parokyaShare: 60
        };
        saveDB("settings", settings);
    }
    
    const systemName = settings.systemName || DEFAULT_SETTINGS.systemName;
    const brandName = document.getElementById("brand-system-name");
    if (brandName) {
        brandName.innerText = systemName.split(" - ")[0];
    }

    // 9b. Activate the proper default view based on user role
    const activeSessionStr = localStorage.getItem("GskActiveSession");
    if (activeSessionStr) {
        try {
            const activeUser = JSON.parse(activeSessionStr);
            const currentActiveView = document.querySelector(".view-section.active-view");
            if (!currentActiveView || currentActiveView.id === "view-tithes-members" || currentActiveView.id === "view-dashboard") {
                if (activeUser.role === "GskLeader") {
                    switchSection("view-tithes-records-leader");
                } else if (activeUser.role === "Parishioner") {
                    switchSection("view-tithes-reports");
                } else {
                    switchSection("view-tithes-members");
                }
            } else {
                switchSection(currentActiveView.id);
            }
        } catch (_) {}
    }

    // 10. Real-Time Sync across multiple tabs/windows
    window.addEventListener("storage", function(e) {
        // If any of our app's LocalStorage keys change in another window
        if (e.key && e.key.startsWith("GskSystem_")) {
            // Automatically recount dashboard stats based on updated data
            updateMainDashboardStats();
            
            // Automatically re-render the currently active section
            const activeSection = document.querySelector(".view-section.active-view");
            if (activeSection) {
                triggerSectionLoader(activeSection.id);
            }
        }
    });
}

// Single Page Navigation Controller
function switchSection(sectionId) {
    // 1. Verify Role Permissions for target view
    const sessionStr = localStorage.getItem("GskActiveSession");
    if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.role === "Parishioner") {
            const forbidden = [
                "view-tithes-funds", "view-tithes-settings", "view-mortuary-contributions", "view-mortuary-reports",
                "view-tithes-records-leader", "view-mortuary-records-leader", "view-members-leader", "view-reports-leader", "view-admin-users"
            ];
            if (forbidden.includes(sectionId) || !sectionId || sectionId === "view-dashboard") {
                switchSection("view-tithes-reports");
                return;
            }
        } else if (session.role === "GskLeader") {
            const forbidden = [
                "view-tithes-members", "view-tithes-funds", "view-tithes-reports", "view-tithes-settings",
                "view-mortuary-overview", "view-mortuary-records", "view-mortuary-contributions", "view-mortuary-reports", "view-admin-users"
            ];
            if (forbidden.includes(sectionId) || !sectionId || sectionId === "view-dashboard") {
                switchSection("view-tithes-records-leader");
                return;
            }
        } else if (session.role === "Secretary" || session.role === "Administrator" || session.role === "Admin") {
            const forbidden = [
                "view-tithes-records-leader", "view-mortuary-records-leader", "view-members-leader", "view-reports-leader"
            ];
            if (forbidden.includes(sectionId) || !sectionId || sectionId === "view-dashboard") {
                switchSection("view-tithes-members");
                return;
            }
        }
    }

    // Deactivate all sections
    const sections = document.querySelectorAll(".view-section");
    sections.forEach(sec => sec.classList.remove("active-view"));

    // Activate selected section
    const activeSec = document.getElementById(sectionId);
    if (activeSec) {
        activeSec.classList.add("active-view");
    }

    // Update Nav active styling
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    navItems.forEach(item => {
        if (item.getAttribute("data-target") === sectionId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Update Top Header Information
    updateHeaderTitle(sectionId);

    // Call Section-specific loaders
    triggerSectionLoader(sectionId);

    // Ensure icons and logos are refreshed
    safeLucideIcons();
    applyParishLogos();
}

function updateHeaderTitle(sectionId) {
    const pageTitle = document.getElementById("current-page-title");
    const pageDesc = document.getElementById("current-page-desc");

    const sessionStr = localStorage.getItem("GskActiveSession");
    let isParishioner = false;
    let isSecretary = false;
    let isLeader = false;
    if (sessionStr) {
        try {
            const s = JSON.parse(sessionStr);
            if (s.role === "Parishioner") isParishioner = true;
            if (s.role === "Secretary") isSecretary = true;
            if (s.role === "GskLeader") isLeader = true;
        } catch (_) {}
    }

    if (isParishioner && sectionId === "view-tithes-reports") {
        if (pageTitle) pageTitle.innerText = "Parishioner Dashboard";
        if (pageDesc) pageDesc.innerText = "View parish financial transparency summaries, monthly reports, and contribution records.";
        return;
    }

    if (isSecretary && sectionId === "view-tithes-members") {
        if (pageTitle) pageTitle.innerText = "Secretary Dashboard";
        if (pageDesc) pageDesc.innerText = "Manage parish members, tithes records, and general overview.";
        return;
    }

    if (isLeader && sectionId === "view-tithes-records-leader") {
        if (pageTitle) pageTitle.innerText = "GSK Leader Dashboard";
        if (pageDesc) pageDesc.innerText = "View, search, and record Tithes and Mortuary contributions for your assigned GSK.";
        return;
    }

    const titles = {

        "view-tithes-members": { title: "Overview & Member Management", desc: "View total GSK counts, manage members list, active status and review histories." },
        "view-tithes-funds": { title: "Manage Tithes", desc: "Record tithes and manage percentages allocations (GSK, Chapel, and Parokya Shares)." },
        "view-tithes-reports": { title: "Reports & Financial History", desc: "Explore transaction ledgers, analytics, logs and export statements." },
        "view-admin-users": { title: "Account Directory", desc: "Create, edit, and manage GSK Leader access accounts." },
        "view-tithes-settings": { title: "Settings & Configurations", desc: "Manage general properties, percentage rules, secretary permissions, and backups." },
        "view-mortuary-overview": { title: "Mortuary Overview", desc: "Summaries of active contributions and deceased profiles." },
        "view-mortuary-records": { title: "Manage Deceased Records", desc: "Registry directory of all deceased members and assistance cases." },
        "view-mortuary-contributions": { title: "Mortuary Contributions", desc: "Record and review contributions towards active mortuary assistances." },
        "view-mortuary-reports": { title: "Mortuary Reports & Analytics", desc: "Track financial statements and payout balances for mortuary support." },
        "view-tithes-records-leader": { title: "Financial Records", desc: "View, search, and record Tithes and Mortuary contributions for your assigned GSK." },
        "view-mortuary-records-leader": { title: "Mortuary Records", desc: "View, search, and record mortuary contributions for your assigned GSK." },
        "view-members-leader": { title: "Members Management", desc: "Add, edit, and manage members in your assigned GSK." },
        "view-reports-leader": { title: "Reports History", desc: "View transaction histories and total collections for your assigned GSK." }
    };

    if (titles[sectionId]) {
        if (pageTitle) pageTitle.innerText = titles[sectionId].title;
        if (pageDesc) pageDesc.innerText = titles[sectionId].desc;
    }
}

// Router/Controller hook to load data dynamically on tab switch
function triggerSectionLoader(sectionId) {
    if (typeof window.populateAllMemberDropdowns === "function") {
        window.populateAllMemberDropdowns();
    }
    switch (sectionId) {
        case "view-dashboard":
            updateMainDashboardStats();
            break;
        case "view-tithes-members":
            if (typeof renderMemberFolderTabs === "function") renderMemberFolderTabs();
            if (typeof renderMembersTable === "function") renderMembersTable();
            if (typeof populateGSKDropdowns === "function") populateGSKDropdowns();
            break;
        case "view-tithes-funds":
            if (typeof renderTitheFundDetails === "function") renderTitheFundDetails();
            break;
        case "view-tithes-reports":
            if (typeof renderTitheReports === "function") renderTitheReports();
            break;
        case "view-tithes-settings":
            if (typeof renderSettingsView === "function") renderSettingsView();
            break;
        case "view-admin-users":
            if (typeof renderUserAccounts === "function") renderUserAccounts();
            if (typeof populateGSKDropdowns === "function") populateGSKDropdowns();
            break;
        case "view-mortuary-overview":
            if (typeof renderMortuaryOverview === "function") renderMortuaryOverview();
            break;
        case "view-mortuary-records":
            if (typeof renderMortuaryFolderTabs === "function") renderMortuaryFolderTabs();
            if (typeof renderDeceasedTable === "function") renderDeceasedTable();
            break;
        case "view-mortuary-contributions":
            if (typeof renderMortuaryContributionsView === "function") renderMortuaryContributionsView();
            break;
        case "view-mortuary-reports":
            if (typeof renderMortuaryReportsView === "function") renderMortuaryReportsView();
            break;
        case "view-tithes-records-leader":
            if (typeof renderLeaderTithes === "function") renderLeaderTithes();
            if (typeof renderLeaderMortuary === "function") renderLeaderMortuary();
            break;
        case "view-mortuary-records-leader":
            if (typeof renderLeaderMortuary === "function") renderLeaderMortuary();
            break;
        case "view-members-leader":
            if (typeof renderLeaderMembers === "function") renderLeaderMembers();
            if (typeof populateGSKDropdowns === "function") populateGSKDropdowns();
            break;
        case "view-reports-leader":
            if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
            break;
    }
}

// ==================== STATS AGGREGATOR ====================
// ==================== STATS AGGREGATOR ====================
function updateMainDashboardStats() {
    const members = getDB("members");
    const tithes = getDB("tithes");
    const deceased = getDB("deceased");
    const mortuaryContributions = getDB("mortuary_contributions");
    const logs = getDB("logs");

    let filteredMembers = [...members];
    let filteredTithes = [...tithes];
    let filteredDeceased = [...deceased];
    let filteredMortuary = [...mortuaryContributions];
    let filteredLogs = [...logs];
    
    const sessionStr = localStorage.getItem("GskActiveSession");
    let activeRole = "Secretary";
    let assignedGsk = "All";
    let activeName = "";

    if (sessionStr) {
        const session = JSON.parse(sessionStr);
        activeRole = session.role;
        assignedGsk = session.assignedGsk || "All";
        activeName = session.name;

        if (activeRole === "GskLeader") {
            const sessionUser = (session.username || "").toLowerCase().trim();
            const sessionEmail = (session.email || "").toLowerCase().trim();
            const aGsk = (assignedGsk || "").toLowerCase().trim();

            filteredMembers = members.filter(m => {
                const sub = (m.submittedBy || "").toLowerCase().trim();
                const mGsk = (m.gsk || "").toLowerCase().trim();
                return (sub && (sub === sessionUser || sub === sessionEmail)) || (aGsk && aGsk !== "all" && (mGsk === aGsk || mGsk.includes(aGsk)));
            });
            filteredDeceased = deceased.filter(d => d.gsk === assignedGsk || assignedGsk === "All");
            
            filteredTithes = tithes.filter(t => {
                const sub = (t.submittedBy || "").toLowerCase().trim();
                const member = members.find(m => m.id === t.memberId);
                const mGsk = (member && member.gsk ? member.gsk : (t.gsk || "")).toLowerCase().trim();
                return (sub && (sub === sessionUser || sub === sessionEmail)) || (aGsk && aGsk !== "all" && (mGsk === aGsk || mGsk.includes(aGsk)));
            });
            
            filteredMortuary = mortuaryContributions.filter(c => {
                const sub = (c.submittedBy || "").toLowerCase().trim();
                const mGsk = (c.gsk || "").toLowerCase().trim();
                return (sub && (sub === sessionUser || sub === sessionEmail)) || (aGsk && aGsk !== "all" && (mGsk === aGsk || mGsk.includes(aGsk)));
            });
            
            filteredLogs = logs.filter(log => log.user === session.username || (sessionUser && (log.user || "").toLowerCase() === sessionUser));
        } else if (activeRole === "Parishioner") {
            filteredMembers = [...members];
            filteredDeceased = [...deceased];
            filteredTithes = [...tithes];
            filteredMortuary = [...mortuaryContributions];
            filteredLogs = []; // Parishioners do not see activity logs
        }
    }

    // Removed global UI Year/Month filters from Main Dashboard Stats.
    // Dashboard must always show the all-time Grand Totals.

    // 1. Calculate stats
    const activeMembersCount = filteredMembers.filter(m => m.status === "Active").length;
    
    // Total Tithes amount
    const totalTithes = filteredTithes.reduce((sum, item) => sum + Number(item.amount), 0);
    // Total Mortuary amount
    const totalMortuary = filteredMortuary.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalCollections = totalTithes + totalMortuary;

    // Display counts


    const dashActiveMembersEl = document.getElementById("dash-active-members");
    if (dashActiveMembersEl) dashActiveMembersEl.innerText = activeMembersCount;

    const dashTithesCollectionsEl = document.getElementById("dash-tithes-collections");
    if (dashTithesCollectionsEl) dashTithesCollectionsEl.innerText = formatCurrency(totalTithes);

    const dashMortuaryCollectionsEl = document.getElementById("dash-mortuary-collections");
    if (dashMortuaryCollectionsEl) dashMortuaryCollectionsEl.innerText = formatCurrency(totalMortuary);

    // ============================================
    // MAIN DASHBOARD TITHES ALLOCATIONS SUMMARY
    // ============================================
    const settings = getDB("settings", DEFAULT_SETTINGS);
    const allocations = settings.allocations || DEFAULT_SETTINGS.allocations;

    const mainDashTithesTotal = document.getElementById("main-dash-tithes-total");
    if (mainDashTithesTotal) mainDashTithesTotal.innerText = formatCurrency(totalTithes);

    const chapelShare = totalTithes * (allocations.chapelShare / 100);
    const gskShare = totalTithes * (allocations.gskShare / 100);
    const parishShare = totalTithes * (allocations.parokyaShare / 100);

    const mainDashChapelShare = document.getElementById("main-dash-chapel-share");
    if (mainDashChapelShare) mainDashChapelShare.innerText = formatCurrency(chapelShare);
    const chapelLabel = document.getElementById("main-dash-chapel-label");
    if (chapelLabel) chapelLabel.innerText = `Chapel Share (${allocations.chapelShare}%)`;

    const mainDashGskShare = document.getElementById("main-dash-gsk-share");
    if (mainDashGskShare) mainDashGskShare.innerText = formatCurrency(gskShare);
    const gskLabel = document.getElementById("main-dash-gsk-label");
    if (gskLabel) gskLabel.innerText = `GSK Share (${allocations.gskShare}%)`;

    const mainDashParishShare = document.getElementById("main-dash-parish-share");
    if (mainDashParishShare) mainDashParishShare.innerText = formatCurrency(parishShare);
    const parishLabel = document.getElementById("main-dash-parish-label");
    if (parishLabel) parishLabel.innerText = `Parish Share (${allocations.parokyaShare}%)`;

    // GSK Share Breakdown
    const mainDashGskBreakdown = document.getElementById("main-dash-gsk-breakdown");
    if (mainDashGskBreakdown) {
        mainDashGskBreakdown.innerHTML = "";
        const allGroups = typeof getAllGskGroups === "function" ? getAllGskGroups() : GSK_LIST;
        const perGskShare = allGroups.length > 0 ? (gskShare / allGroups.length) : 0;
        allGroups.forEach(gskName => {
            mainDashGskBreakdown.innerHTML += `
                <tr>
                    <td><strong>${gskName}</strong></td>
                    <td><strong style="color:var(--primary);">${formatCurrency(perGskShare)}</strong></td>
                </tr>
            `;
        });
    }

    // 2. Load Recent Activity Logs (top 5)
    const recentActivitiesContainer = document.getElementById("dashboard-recent-activities");
    if (recentActivitiesContainer) {
        recentActivitiesContainer.innerHTML = "";
        
        const recentLogs = filteredLogs.slice(0, 5);
        if (recentLogs.length === 0) {
            recentActivitiesContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">No recent logs.</div>`;
        } else {
            recentLogs.forEach(log => {
                const dateStr = formatDate(log.timestamp);
                
                // Map actions to visual details
                let icon = "info";
                let typeClass = "info";

                if (log.action.includes("TITHE")) {
                    icon = "coins";
                    typeClass = "primary";
                } else if (log.action.includes("MORTUARY") || log.action.includes("DECEASED")) {
                    icon = "heart-off";
                    typeClass = "danger";
                } else if (log.action.includes("MEMBER")) {
                    icon = "user";
                    typeClass = "success";
                } else if (log.action.includes("SETTING")) {
                    icon = "sliders-horizontal";
                    typeClass = "warning";
                }

                const recentItem = document.createElement("div");
                recentItem.className = "recent-item";
                recentItem.innerHTML = `
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="stat-icon ${typeClass}" style="width:36px; height:36px; font-size:16px;">
                            <i data-lucide="${icon}"></i>
                        </div>
                        <div class="recent-details">
                            <h4>${log.details}</h4>
                            <p>${dateStr} &bull; by @${log.user}</p>
                        </div>
                    </div>
                `;
                recentActivitiesContainer.appendChild(recentItem);
            });
            safeLucideIcons();
        }
    }

    // 2b. Load Monitoring Dashboard (if Admin or Secretary)
    if (activeRole === "Administrator" || activeRole === "Secretary" || activeRole === "Admin") {
        initAdminMonitoringDashboard();
    }

    // 2c. Synchronize Chapel & GSK Dashboards
    if (typeof renderChapelFinancialDashboard === "function") renderChapelFinancialDashboard();
    if (typeof renderGskFinancialDashboard === "function") renderGskFinancialDashboard();
}

// Chart.js Collections Overview Render
function renderDashboardCollectionsChart(tithes, mortuaryContributions) {
    const ctx = document.getElementById("dashboardCollectionsChart");
    if (!ctx) return;

    // Aggregate monthly data for 2026
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const titheData = Array(12).fill(0);
    const mortuaryData = Array(12).fill(0);

    // Populate Tithes by month
    tithes.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === 2026) {
            titheData[d.getMonth()] += Number(t.amount);
        }
    });

    // Populate Mortuary by month
    mortuaryContributions.forEach(mc => {
        const d = new Date(mc.date);
        if (d.getFullYear() === 2026) {
            mortuaryData[d.getMonth()] += Number(mc.amount);
        }
    });

    // Destroy chart if already exists to redraw fresh
    if (dashboardCollectionsChart) {
        dashboardCollectionsChart.destroy();
    }

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
    const textColor = isDark ? "#94a3b8" : "#64748b";

    dashboardCollectionsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Tithes Collections (â‚±)',
                    data: titheData,
                    backgroundColor: 'rgba(99, 102, 241, 0.75)', // Indigo
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Mortuary Collections (â‚±)',
                    data: mortuaryData,
                    backgroundColor: 'rgba(16, 185, 129, 0.75)', // Emerald
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor, font: { family: 'Outfit', size: 12 } }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Outfit' } },
                    beginAtZero: true
                }
            }
        }
    });
}

// ==================== THEME CONTROLLER ====================
function toggleTheme() {
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    
    htmlEl.setAttribute("data-theme", newTheme);
    
    // Save to settings db
    const settings = getDB("settings", DEFAULT_SETTINGS);
    settings.theme = newTheme;
    saveDB("settings", settings);

    // Update toggle button icon
    updateThemeIcon(newTheme);

    // Refresh active chart views to adapt to colors
    const activeSection = document.querySelector(".view-section.active-view");
    if (activeSection) {
        triggerSectionLoader(activeSection.id);
    }
}

function loadSavedTheme() {
    const settings = getDB("settings", DEFAULT_SETTINGS);
    const savedTheme = settings.theme || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById("theme-icon");
    if (!icon) return;
    if (theme === "dark") {
        icon.setAttribute("data-lucide", "moon");
    } else {
        icon.setAttribute("data-lucide", "sun");
    }
    safeLucideIcons();
}

// ==================== DIALOG/MODALS UTILITY ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active-modal");
        
        // Disable scroll on body
        document.body.style.overflow = "hidden";
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active-modal");
        // Restore scroll on body
        document.body.style.overflow = "";
    }
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = "check-circle";
    if (type === "danger") icon = "alert-circle";
    if (type === "warning") icon = "alert-triangle";

    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    safeLucideIcons();

    // Auto remove after 3.5s
    setTimeout(() => {
        toast.style.transition = "all 0.3s ease";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px)";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

// ==================== FORMATTERS ====================
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(isoString) {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function getSubmitterDetails(username) {
    if (username === "sec_juan") {
        return { name: "Juan Dela Cruz (Secretary)", gsk: "Parish Office" };
    }
    const settings = getDB("settings");
    const secretaries = settings.secretaries || [];
    const sec = secretaries.find(s => s.username === username);
    if (sec) {
        return { name: sec.name, gsk: "Parish Office" };
    }
    if (username === "gsk_leader_1") {
        return { name: "GSK San Jose Leader", gsk: "GSK San Jose" };
    }
    if (username === "gsk_leader_2") {
        return { name: "GSK Santa Maria Leader", gsk: "GSK Santa Maria" };
    }
    if (username === "gsk_leader_3") {
        return { name: "GSK San Pedro Leader", gsk: "GSK San Pedro" };
    }
    if (username === "gsk_leader_4") {
        return { name: "GSK Santo Rosario Leader", gsk: "GSK Santo Rosario" };
    }
    return { name: username || "System", gsk: "All" };
}

// ==================== ADMIN MONITORING DASHBOARD ====================

// ==================== ADMIN MONITORING DASHBOARD ====================

let currentAdminMonitoringMonth = null;
let currentAdminActiveGsk = null;

function initAdminMonitoringDashboard() {
    const container = document.getElementById("admin-month-buttons-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const currentYear = new Date().getFullYear();
    const tithes = getDB("tithes", []);
    const mortuary = getDB("mortuary_contributions", []);
    const yearsSet = new Set();
    for (let y = 2020; y <= Math.max(2030, currentYear + 4); y++) {
        yearsSet.add(y);
    }
    const extractYear = (dateStr) => {
        if (!dateStr) return;
        const d = (typeof parseLocalDate === "function") ? parseLocalDate(dateStr) : new Date(dateStr);
        if (!isNaN(d.getFullYear()) && d.getFullYear() > 1900) yearsSet.add(d.getFullYear());
    };
    tithes.forEach(t => extractYear(t.date || t.submittedAt));
    mortuary.forEach(m => extractYear(m.date || m.submittedAt));
    const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
    
    const selectHtml = `
        <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;">
            <label for="admin-year-dropdown" class="sr-only">Filter Monitoring by Year</label>
            <select id="admin-year-dropdown" class="form-control" style="max-width: 130px; border: 2px solid var(--primary); font-weight: bold; color: var(--primary);" aria-label="Filter Monitoring by Year" title="Filter by Year">
                ${sortedYears.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join("")}
            </select>
            <label for="admin-month-dropdown" class="sr-only">Filter Monitoring by Month</label>
            <select id="admin-month-dropdown" class="form-control" style="max-width: 300px; border: 2px solid var(--primary); font-weight: bold; color: var(--primary);" aria-label="Filter Monitoring by Month" title="Filter by Month">
                <option value="">-- Select Period to Monitor --</option>
                <option value="ALL">All Months (Entire Year)</option>
                ${months.map((month, index) => `<option value="${index + 1}">${month}</option>`).join("")}
            </select>
        </div>
    `;
    
    container.innerHTML = selectHtml;

    const yearDropdown = document.getElementById("admin-year-dropdown");
    const monthDropdown = document.getElementById("admin-month-dropdown");

    const updateView = () => {
        const selectedMonthVal = monthDropdown.value;
        const selectedYearVal = yearDropdown.value;
        currentAdminActiveGsk = null; // Reset active GSK on month change
        
        if (selectedMonthVal === "ALL") {
            currentAdminMonitoringMonth = "ALL";
            document.getElementById("admin-monitoring-selected-month").innerText = "Entire Year " + selectedYearVal + " Records";
            renderAdminMonthlyRecords();
        } else if (selectedMonthVal) {
            currentAdminMonitoringMonth = parseInt(selectedMonthVal, 10);
            const monthName = months[currentAdminMonitoringMonth - 1];
            document.getElementById("admin-monitoring-selected-month").innerText = monthName + " " + selectedYearVal + " Records";
            renderAdminMonthlyRecords();
        } else {
            currentAdminMonitoringMonth = null;
            const view = document.getElementById("admin-gsk-monitoring-view");
            if (view) view.style.display = "none";
        }
    };

    yearDropdown.addEventListener("change", updateView);
    monthDropdown.addEventListener("change", updateView);

    // Event listeners for search
    const searchInput = document.getElementById("admin-monitoring-search");
    if (searchInput && !searchInput.dataset.hasListener) {
        searchInput.addEventListener("input", () => {
            // Re-render the tables for the active GSK if search changes
            if (currentAdminActiveGsk) {
                renderAdminGskTables(currentAdminActiveGsk);
            }
        });
        searchInput.dataset.hasListener = "true";
    }
}

// Store the filtered datasets globally for the current month view
let globalFilteredTithes = [];
let globalFilteredMortuary = [];

function renderAdminMonthlyRecords() {
    const view = document.getElementById("admin-gsk-monitoring-view");
    if (!view || !currentAdminMonitoringMonth) return;

    view.style.display = "block";

    const tithes = getDB("tithes");
    const mortuary = getDB("mortuary_contributions");
    const members = getDB("members");

    // Helper to extract month and year
    const getMonthFromDate = (dateString) => {
        if (!dateString) return -1;
        return new Date(dateString).getMonth() + 1;
    };
    const getYearFromDate = (dateString) => {
        if (!dateString) return -1;
        return new Date(dateString).getFullYear();
    };

    const targetYear = parseInt(document.getElementById("admin-year-dropdown").value, 10);

    // Filter by Month & Year ONLY
    globalFilteredTithes = tithes.filter(t => {
        const recordYear = getYearFromDate(t.submittedAt || t.date);
        if (recordYear !== targetYear) return false;
        if (currentAdminMonitoringMonth !== "ALL") {
            const recordMonth = getMonthFromDate(t.submittedAt || t.date);
            if (recordMonth !== currentAdminMonitoringMonth) return false;
        }
        return true;
    }).sort((a, b) => new Date(b.submittedAt || b.date) - new Date(a.submittedAt || a.date));

    globalFilteredMortuary = mortuary.filter(m => {
        const recordYear = getYearFromDate(m.submittedAt || m.date);
        if (recordYear !== targetYear) return false;
        if (currentAdminMonitoringMonth !== "ALL") {
            const recordMonth = getMonthFromDate(m.submittedAt || m.date);
            if (recordMonth !== currentAdminMonitoringMonth) return false;
        }
        return true;
    }).sort((a, b) => new Date(b.submittedAt || b.date) - new Date(a.submittedAt || a.date));

    // Find which GSKs actually have records this month
    const getMemberDetails = (memberId) => members.find(m => m.id === memberId) || { gsk: "Unknown", name: "Unknown Member" };
    
    const submittedGsks = new Set();
    globalFilteredTithes.forEach(t => {
        const mem = getMemberDetails(t.memberId);
        const gskVal = (mem && mem.gsk !== "Unknown") ? mem.gsk : (t.gsk || "");
        if (gskVal) submittedGsks.add(gskVal);
    });
    globalFilteredMortuary.forEach(m => {
        const mem = getMemberDetails(m.memberId);
        const gskVal = (mem && mem.gsk !== "Unknown") ? mem.gsk : (m.gsk || "");
        if (gskVal) submittedGsks.add(gskVal);
    });

    const gskButtonsContainer = document.getElementById("admin-monitoring-gsk-buttons-container");
    const gskSectionsContainer = document.getElementById("admin-monitoring-gsk-sections");
    
    gskButtonsContainer.innerHTML = "";
    gskSectionsContainer.innerHTML = "";

    if (submittedGsks.size === 0) {
        gskSectionsContainer.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);"><i data-lucide="inbox" style="width:48px; height:48px; margin-bottom:10px;"></i><br><h3>No records found for this period.</h3></div>`;
        safeLucideIcons();
        return;
    }

    // Create buttons for each submitted GSK
    let isFirst = true;
    GSK_LIST.forEach(gsk => {
        if (submittedGsks.has(gsk)) {
            const btn = document.createElement("button");
            btn.className = "btn btn-outline-primary admin-gsk-tab-btn";
            btn.innerHTML = `<i data-lucide="users"></i> ${gsk}`;
            
            btn.onclick = () => {
                document.querySelectorAll(".admin-gsk-tab-btn").forEach(b => {
                    b.classList.remove("btn-primary");
                    b.classList.add("btn-outline-primary");
                });
                btn.classList.remove("btn-outline-primary");
                btn.classList.add("btn-primary");
                
                currentAdminActiveGsk = gsk;
                renderAdminGskTables(gsk);
            };
            
            gskButtonsContainer.appendChild(btn);

            // Auto-click the first button
            if (isFirst) {
                isFirst = false;
                btn.click();
            }
        }
    });
    
    safeLucideIcons();
}

function renderAdminGskTables(gsk) {
    const gskSectionsContainer = document.getElementById("admin-monitoring-gsk-sections");
    if (!gskSectionsContainer) return;
    
    const searchTerm = (document.getElementById("admin-monitoring-search").value || "").toLowerCase();
    const members = getDB("members");

    const getMemberDetails = (memberId) => members.find(m => m.id === memberId) || { name: "Unknown Member", gsk: "Unknown" };

    // Filter the global arrays for the specific GSK & search term
    const filterFn = (record) => {
        const mem = getMemberDetails(record.memberId);
        const recGsk = (mem && mem.gsk !== "Unknown") ? mem.gsk : (record.gsk || "");
        if (recGsk !== gsk) return false;
        
        if (searchTerm) {
            const leaderInfo = getSubmitterDetails(record.submittedBy);
            const memName = (mem && mem.name !== "Unknown Member") ? mem.name : (record.contributorName || "");
            const matchName = memName.toLowerCase().includes(searchTerm);
            const matchLeader = leaderInfo.name.toLowerCase().includes(searchTerm);
            if (!matchName && !matchLeader) return false;
        }
        return true;
    };

    const gskTithes = globalFilteredTithes.filter(filterFn);
    const gskMortuary = globalFilteredMortuary.filter(filterFn);

    gskSectionsContainer.innerHTML = `
        <div style="margin-top: 10px; border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; background: var(--card-bg);">
            <h3 style="color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 10px; margin-bottom: 20px; font-size: 1.5rem;">
                ${gsk} Submissions
            </h3>

            <!-- Tithes Table -->
            <h4 style="margin-top: 10px; margin-bottom: 12px; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                <i data-lucide="coins"></i> Tithes Contributions
            </h4>
            <div class="table-responsive" style="margin-bottom: 30px;">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Member Name</th>
                            <th>Amount</th>
                            <th>Date Submitted</th>
                            <th>Contribution Type</th>
                            <th>Recorded By (GSK Leader)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gskTithes.length === 0 ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No Tithes submissions found.</td></tr>` : 
                            gskTithes.map(t => {
                                const mem = getMemberDetails(t.memberId);
                                const leaderInfo = getSubmitterDetails(t.submittedBy);
                                const displayName = (mem && mem.name !== "Unknown Member") ? mem.name : (t.contributorName || "Member");
                                return `
                                <tr>
                                    <td><strong>${displayName}</strong></td>
                                    <td><strong style="color: var(--primary);">${formatCurrency(t.amount)}</strong></td>
                                    <td style="font-family: monospace; font-size: 0.9em;">${formatDateTime(t.submittedAt || new Date(t.date).toISOString())}</td>
                                    <td><span class="badge badge-info">Tithes</span></td>
                                    <td>${leaderInfo.name}</td>
                                </tr>`;
                            }).join('')
                        }
                    </tbody>
                </table>
            </div>

            <!-- Mortuary Table -->
            <h4 style="margin-bottom: 12px; color: var(--danger); display: flex; align-items: center; gap: 8px;">
                <i data-lucide="heart"></i> Mortuary Contributions
            </h4>
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Member Name</th>
                            <th>Amount</th>
                            <th>Date Submitted</th>
                            <th>Contribution Type</th>
                            <th>Recorded By (GSK Leader)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gskMortuary.length === 0 ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No Mortuary submissions found.</td></tr>` : 
                            gskMortuary.map(m => {
                                const mem = getMemberDetails(m.memberId);
                                const leaderInfo = getSubmitterDetails(m.submittedBy);
                                const displayName = (mem && mem.name !== "Unknown Member") ? mem.name : (m.contributorName || "Member");
                                return `
                                <tr>
                                    <td><strong>${displayName}</strong></td>
                                    <td><strong style="color: var(--danger);">${formatCurrency(m.amount)}</strong></td>
                                    <td style="font-family: monospace; font-size: 0.9em;">${formatDateTime(m.submittedAt || new Date(m.date).toISOString())}</td>
                                    <td><span class="badge badge-danger">Mortuary</span></td>
                                    <td>${leaderInfo.name}</td>
                                </tr>`;
                            }).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;

    safeLucideIcons();
}

// ==================== OFFICIAL PRINT GENERATOR (SECRETARY & GSK LEADER) ====================
function openSecretaryPrintModal() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const isLeader = (session.role === "GskLeader" || session.role === "Leader");
    const modalTitle = document.getElementById("print-modal-title");
    const modalDesc = document.getElementById("print-modal-desc");
    const signatoryLabel = document.getElementById("print-signatory-label");
    const nameInput = document.getElementById("print-signatory-name");
    const scopeSelect = document.getElementById("print-scope-filter");
    const typeSelect = document.getElementById("print-select-type");

    let cleanName = session.name ? session.name.replace(/\s*\(Secretary\)|\s*\(Admin\)|\s*\(Leader\)/gi, "").trim() : "";

    if (isLeader) {
        const leaderGsk = session.assignedGsk || "GSK San Jose";
        if (modalTitle) modalTitle.innerText = "GSK Leader Print & Statement Center";
        if (modalDesc) modalDesc.innerText = `Generate official, print-ready ${leaderGsk} financial records, members directory, and contribution ledgers with Parish letterhead.`;
        if (signatoryLabel) signatoryLabel.innerText = "GSK Leader Name *";
        if (nameInput) nameInput.value = cleanName || "GSK Leader";
        
        if (typeSelect) {
            typeSelect.innerHTML = `
                <option value="leader-financial-records">ðŸ“‘ Official GSK Financial Records (Tithes & Mortuary)</option>
                <option value="leader-members-directory">ðŸ‘¥ Official GSK Members Directory & Status</option>
                <option value="leader-contributions-ledger">ðŸ’° Official GSK Submission History & Verification Ledger</option>
                <option value="current-view">ðŸ–¨ï¸ Print Current Active Screen / Table</option>
            `;
        }

        if (scopeSelect) {
            let matched = false;
            for (let opt of scopeSelect.options) {
                if (opt.value.includes(leaderGsk) || leaderGsk.includes(opt.value) || opt.text.includes(leaderGsk)) {
                    scopeSelect.value = opt.value;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                scopeSelect.value = leaderGsk;
            }
            scopeSelect.disabled = true;
        }
    } else {
        // Secretary / Admin
        if (modalTitle) modalTitle.innerText = "Secretary Print & Statement Center";
        if (modalDesc) modalDesc.innerText = "Generate official, print-ready parish statements and ledgers bearing the Diocese and Our Lady of Fatima Parish header, verification date, and official Secretary & Parish Priest signatures.";
        if (signatoryLabel) signatoryLabel.innerText = "Parish Secretary Name *";
        if (nameInput) nameInput.value = cleanName || "Juan Dela Cruz";

        if (typeSelect) {
            typeSelect.innerHTML = `
                <option value="financial-allocation">ðŸ“‘ Official Financial Allocation Statement (GSK 20%, Chapel 20%, Parish 60%)</option>
                <option value="members-directory">ðŸ‘¥ GSK Members Official Directory & Status</option>
                <option value="contributions-ledger">ðŸ’° Tithes & Mortuary Contributions Ledger</option>
                <option value="chapel-expenses">â›ª Chapel Maintenance & Expenses Statement</option>
                <option value="current-view">ðŸ–¨ï¸ Print Current Active Screen / Table</option>
            `;
        }

        if (scopeSelect) {
            scopeSelect.disabled = false;
            scopeSelect.value = "All";
        }
    }

    openModal("secretary-print-modal");
    if (window.lucide && typeof lucide.createIcons === "function") {
        lucide.createIcons();
    }
}

function closeSecretaryPrintModal() {
    closeModal("secretary-print-modal");
}

function executeSecretaryPrint() {
    const session = JSON.parse(localStorage.getItem("GskActiveSession") || "{}");
    const isLeader = (session.role === "GskLeader" || session.role === "Leader");

    const printType = document.getElementById("print-select-type") ? document.getElementById("print-select-type").value : "financial-allocation";
    const scopeSelect = document.getElementById("print-scope-filter");
    const scope = scopeSelect ? scopeSelect.value : (session.assignedGsk || "All");
    const signatoryName = document.getElementById("print-signatory-name") ? document.getElementById("print-signatory-name").value.trim() : (isLeader ? "GSK Leader" : "Juan Dela Cruz");

    // Update print header metadata elements
    const reportTitleEl = document.getElementById("print-report-title");
    const reportDateEl = document.getElementById("print-meta-date");
    const reportPreparedEl = document.getElementById("print-meta-prepared");
    const reportScopeEl = document.getElementById("print-meta-scope");
    const secretarySignEl = document.getElementById("print-secretary-sign-name");
    const signatoryTitleEl = document.getElementById("print-signatory-title");

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    if (reportDateEl) reportDateEl.innerText = formattedDate;

    if (isLeader) {
        const gskLabel = session.assignedGsk || scope;
        if (reportPreparedEl) reportPreparedEl.innerText = `${signatoryName || "GSK Leader"} (${gskLabel} Leader)`;
        if (reportScopeEl) reportScopeEl.innerText = `${gskLabel} Records`;
        if (secretarySignEl) secretarySignEl.innerText = (signatoryName || "GSK LEADER").toUpperCase();
        if (signatoryTitleEl) signatoryTitleEl.innerText = `${gskLabel} Leader / Prepared By`;
    } else {
        if (reportPreparedEl) reportPreparedEl.innerText = `${signatoryName || "Juan Dela Cruz"} (Parish Secretary)`;
        if (reportScopeEl) reportScopeEl.innerText = scope === "All" ? "Parish & All GSK Communities" : scope;
        if (secretarySignEl) secretarySignEl.innerText = (signatoryName || "JUAN DELA CRUZ").toUpperCase();
        if (signatoryTitleEl) signatoryTitleEl.innerText = `Parish Secretary / Prepared By`;
    }

    // Set Report Title & Switch View depending on print type and role
    if (isLeader) {
        const leaderGsk = session.assignedGsk || scope;
        if (printType === "leader-financial-records" || printType === "financial-allocation") {
            if (reportTitleEl) reportTitleEl.innerText = `OFFICIAL ${leaderGsk.toUpperCase()} FINANCIAL & CONTRIBUTIONS RECORD`;
            switchSection("view-tithes-records-leader");
            if (typeof renderLeaderTithes === "function") renderLeaderTithes();
            if (typeof renderLeaderMortuary === "function") renderLeaderMortuary();
        } else if (printType === "leader-members-directory" || printType === "members-directory") {
            if (reportTitleEl) reportTitleEl.innerText = `OFFICIAL ${leaderGsk.toUpperCase()} MEMBERS DIRECTORY`;
            switchSection("view-members-leader");
            if (typeof renderLeaderMembers === "function") renderLeaderMembers();
        } else if (printType === "leader-contributions-ledger" || printType === "contributions-ledger") {
            if (reportTitleEl) reportTitleEl.innerText = `OFFICIAL ${leaderGsk.toUpperCase()} SUBMISSION HISTORY & VERIFICATION LEDGER`;
            switchSection("view-reports-leader");
            if (typeof renderUnifiedLeaderSubmissions === "function") renderUnifiedLeaderSubmissions();
        } else {
            if (reportTitleEl) {
                const pageTitle = document.getElementById("current-page-title");
                reportTitleEl.innerText = pageTitle ? `${pageTitle.innerText.toUpperCase()} (${leaderGsk.toUpperCase()})` : `OFFICIAL ${leaderGsk.toUpperCase()} REPORT`;
            }
        }
    } else {
        // Secretary
        if (printType === "financial-allocation") {
            if (reportTitleEl) reportTitleEl.innerText = "OFFICIAL FINANCIAL ALLOCATION STATEMENT (GSK 20% / CHAPEL 20% / PARISH 60%)";
            switchSection("view-tithes-funds");
            if (typeof renderTithesOverview === "function") renderTithesOverview();
        } else if (printType === "members-directory") {
            if (reportTitleEl) reportTitleEl.innerText = "OFFICIAL GSK MEMBERS DIRECTORY & STATUS REGISTRY";
            switchSection("view-tithes-members");
            if (typeof renderMembersTable === "function") renderMembersTable();
        } else if (printType === "contributions-ledger") {
            if (reportTitleEl) reportTitleEl.innerText = "OFFICIAL TITHES & MORTUARY CONTRIBUTIONS LEDGER";
            switchSection("view-tithes-reports");
            if (typeof renderTithesReports === "function") renderTithesReports();
        } else if (printType === "chapel-expenses") {
            if (reportTitleEl) reportTitleEl.innerText = "OFFICIAL CHAPEL EXPENSES & MAINTENANCE STATEMENT";
            switchSection("view-tithes-funds");
            if (typeof renderTithesOverview === "function") renderTithesOverview();
        } else {
            if (reportTitleEl) {
                const pageTitle = document.getElementById("current-page-title");
                reportTitleEl.innerText = pageTitle ? pageTitle.innerText.toUpperCase() : "OFFICIAL PARISH REPORT";
            }
        }
    }

    closeSecretaryPrintModal();
    applyParishLogos();

    // Trigger Print after small delay so DOM updates and views are painted
    setTimeout(() => {
        applyParishLogos();
        window.print();
    }, 450);
}

// Attach all core functions to window for global inline accessibility
window.selectLoginRoleState = selectLoginRoleState;
window.resetLoginOverlay = resetLoginOverlay;
window.handleExitSystem = handleExitSystem;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleLoginSubmit = handleLoginSubmit;
window.checkAuth = checkAuth;
window.logout = logout;
window.initApp = initApp;
window.safeLucideIcons = safeLucideIcons;

// Auto-run initApp on load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}


