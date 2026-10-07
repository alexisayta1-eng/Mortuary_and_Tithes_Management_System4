// js/supabase-config.js - Supabase Client Configuration & Sync Manager
// Provides seamless Cloud Database connectivity, Real-time sync, and LocalStorage caching.

(function() {
    const STORAGE_KEY = "GskSupabaseConfig";
    
    // Default fallback configuration (pre-configured with live Supabase project)
    const DEFAULT_CONFIG = {
        url: "https://yaieyekmiiiwprgfrcdm.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaWV5ZWttaWlpd3ByZ2ZyY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTc3NTcsImV4cCI6MjEwNTAzMzc1N30.BGqtCMyqS26lom-q4cvuzF0tccK5Ot7stsy1blmL9KA",
        connected: true
    };

    window.SupabaseConfig = {
        get: function() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.url && parsed.anonKey) {
                        return { ...DEFAULT_CONFIG, ...parsed };
                    }
                }
            } catch (e) {
                console.warn("Error reading Supabase config:", e);
            }
            return { ...DEFAULT_CONFIG };
        },

        save: function(url, anonKey) {
            const cleanUrl = (url || "").trim().replace(/\/+$/, "");
            const cleanKey = (anonKey || "").trim();
            const config = {
                url: cleanUrl,
                anonKey: cleanKey,
                connected: false
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            return this.init();
        },

        init: function() {
            const config = this.get();
            window.supabaseClient = null;
            window.SupabaseConnected = false;

            if (config.url && config.anonKey && window.supabase && typeof window.supabase.createClient === "function") {
                try {
                    window.supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
                        auth: { persistSession: false }
                    });
                    return window.supabaseClient;
                } catch (err) {
                    console.error("Failed to initialize Supabase client:", err);
                }
            }
            return null;
        },

        isConfigured: function() {
            const config = this.get();
            return Boolean(config.url && config.anonKey);
        },

        testConnection: async function(overrideUrl = null, overrideKey = null) {
            const config = this.get();
            const url = (overrideUrl !== null ? overrideUrl : config.url || "").trim().replace(/\/+$/, "");
            const key = (overrideKey !== null ? overrideKey : config.anonKey || "").trim();

            if (!url || !key) {
                return { success: false, error: "Please enter both Supabase Project URL and Public Anon Key." };
            }

            if (!window.supabase || typeof window.supabase.createClient !== "function") {
                return { success: false, error: "Supabase JS library not loaded. Check internet connection." };
            }

            try {
                const client = window.supabase.createClient(url, key, { auth: { persistSession: false } });
                // Test query on system_settings or users
                const { data, error } = await client.from("system_settings").select("id, system_name").limit(1);
                
                if (error) {
                    // Check if table missing error (42P01)
                    if (error.code === "42P01" || error.message.includes("does not exist") || error.message.includes("relation")) {
                        return {
                            success: false,
                            tablesMissing: true,
                            error: "Connected to Supabase project, but database tables are not yet created! Run database/supabase_schema.sql in your Supabase SQL Editor."
                        };
                    }
                    return { success: false, error: error.message || "Database request failed." };
                }

                return { success: true, data: data };
            } catch (err) {
                return { success: false, error: err.message || "Connection failed. Check your network or URL." };
            }
        }
    };

    // Auto-init on load
    window.SupabaseConfig.init();
})();

// -------------------------------------------------------------
// UI Helpers for Supabase Status & Modal (Header badges removed)
// -------------------------------------------------------------
window.updateSupabaseBadge = function(status, extraText) {
    // Completely remove any badges from the header
    document.querySelectorAll("#supabase-status-badge, #mysql-status-badge").forEach(el => el.remove());

    const settingsBadge = document.getElementById("settings-supabase-badge");
    if (settingsBadge) {
        if (status === "connected") {
            settingsBadge.className = "badge badge-success";
            settingsBadge.innerText = "Connected (Live Cloud)";
        } else if (status === "checking") {
            settingsBadge.className = "badge badge-info";
            settingsBadge.innerText = "Connecting...";
        } else {
            settingsBadge.className = "badge badge-warning";
            settingsBadge.innerText = "Offline / Local Storage";
        }
    }
};

window.openSupabaseModal = function() {
    const modal = document.getElementById("supabase-config-modal");
    if (!modal) return;

    const config = window.SupabaseConfig.get();
    const urlInput = document.getElementById("sb-modal-url");
    const keyInput = document.getElementById("sb-modal-key");
    const statusMsg = document.getElementById("sb-modal-status-msg");

    if (urlInput) urlInput.value = config.url || "";
    if (keyInput) keyInput.value = config.anonKey || "";
    if (statusMsg) {
        if (window.SupabaseConnected) {
            statusMsg.innerHTML = `<div style="color: #059669; font-weight: 600; display: flex; align-items: center; gap: 6px;"><i data-lucide="check-circle" style="width:16px;height:16px;"></i> Active Live Cloud Connection to Supabase</div>`;
        } else if (!config.url || !config.anonKey) {
            statusMsg.innerHTML = `<div style="color: #D97706; font-size: 12px;">Enter your Supabase Project URL and Anon Key to activate real-time cloud sync.</div>`;
        } else {
            statusMsg.innerHTML = `<div style="color: #DC2626; font-size: 12px;">Disconnected. Click 'Test & Save' below to re-verify connection.</div>`;
        }
    }

    if (typeof openModal === "function") {
        openModal("supabase-config-modal");
    } else {
        modal.classList.add("active");
        modal.style.display = "flex";
    }

    if (window.lucide && typeof lucide.createIcons === "function") {
        lucide.createIcons();
    }
};

window.closeSupabaseModal = function() {
    const modal = document.getElementById("supabase-config-modal");
    if (!modal) return;
    if (typeof closeModal === "function") {
        closeModal("supabase-config-modal");
    } else {
        modal.classList.remove("active");
        modal.style.display = "none";
    }
};

window.saveAndTestSupabaseConfig = async function() {
    const urlInput = document.getElementById("sb-modal-url");
    const keyInput = document.getElementById("sb-modal-key");
    const statusMsg = document.getElementById("sb-modal-status-msg");
    const testBtn = document.getElementById("sb-modal-save-btn");

    const url = urlInput ? urlInput.value.trim() : "";
    const key = keyInput ? keyInput.value.trim() : "";

    if (!url || !key) {
        if (statusMsg) {
            statusMsg.innerHTML = `<div style="color: #DC2626; font-size: 12px;">Please fill in both Project URL and Public Anon Key.</div>`;
        }
        return;
    }

    if (testBtn) {
        testBtn.disabled = true;
        testBtn.innerHTML = `<span>Testing Connection...</span>`;
    }
    if (statusMsg) {
        statusMsg.innerHTML = `<div style="color: #2563EB; font-size: 12px;">Testing connection to ${url}...</div>`;
    }

    const testRes = await window.SupabaseConfig.testConnection(url, key);

    if (testBtn) {
        testBtn.disabled = false;
        testBtn.innerHTML = `<i data-lucide="check"></i> <span>Test & Save Connection</span>`;
        if (window.lucide) lucide.createIcons();
    }

    if (testRes.success) {
        window.SupabaseConfig.save(url, key);
        window.SupabaseConnected = true;
        window.updateSupabaseBadge("connected", "Live Cloud");
        
        if (statusMsg) {
            statusMsg.innerHTML = `<div style="color: #059669; font-weight: 600; font-size: 13px;">Connected Successfully to Supabase! Syncing data...</div>`;
        }
        if (typeof showToast === "function") {
            showToast("Connected to Supabase Cloud Database!", "success");
        }

        // Pull latest data or offer sync
        if (typeof window.syncWithSupabase === "function") {
            await window.syncWithSupabase(true);
        }

        setTimeout(() => {
            window.closeSupabaseModal();
        }, 1200);
    } else {
        window.SupabaseConnected = false;
        window.updateSupabaseBadge("offline");
        
        if (testRes.tablesMissing) {
            if (statusMsg) {
                statusMsg.innerHTML = `<div style="color: #D97706; font-size: 12px; line-height: 1.4;">
                    <strong>Connected to project, but tables are missing!</strong><br>
                    Please copy the SQL schema and run it in the Supabase SQL Editor.
                </div>`;
            }
        } else {
            if (statusMsg) {
                statusMsg.innerHTML = `<div style="color: #DC2626; font-size: 12px;">Error: ${testRes.error}</div>`;
            }
        }
    }
};

window.copySupabaseSQLSchema = function() {
    const schema = `-- ====================================================================
-- Fatima Parish Management System - Supabase (PostgreSQL) Database Schema
-- Run this complete SQL script in your Supabase SQL Editor:
-- Supabase Dashboard -> Project -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Create Users Table (Administrators and GSK Leaders)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gsk TEXT NOT NULL DEFAULT 'All',
    email TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'GskLeader',
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    system_name TEXT NOT NULL DEFAULT 'FATIMA PARISH',
    gsk_share INT NOT NULL DEFAULT 20,
    chapel_share INT NOT NULL DEFAULT 20,
    parokya_share INT NOT NULL DEFAULT 60,
    theme TEXT NOT NULL DEFAULT 'light',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Secretaries Table
CREATE TABLE IF NOT EXISTS public.secretaries (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Secretary',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Members Table (GSK Directory)
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    gsk TEXT NOT NULL,
    name TEXT NOT NULL,
    contact TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    submitted_by TEXT DEFAULT 'maryjoy',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Tithes Contributions Table
CREATE TABLE IF NOT EXISTS public.tithes (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    remarks TEXT,
    submitted_by TEXT DEFAULT 'maryjoy',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Deceased Registry Table
CREATE TABLE IF NOT EXISTS public.deceased (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INT,
    date_of_death DATE NOT NULL,
    burial_date DATE,
    gsk TEXT NOT NULL,
    contact_person TEXT,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    submitted_by TEXT DEFAULT 'maryjoy',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Mortuary (Condolence) Contributions Table
CREATE TABLE IF NOT EXISTS public.mortuary_contributions (
    id TEXT PRIMARY KEY,
    deceased_id TEXT NOT NULL REFERENCES public.deceased(id) ON DELETE CASCADE,
    member_id TEXT,
    contributor_name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 200.00,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    gsk TEXT NOT NULL,
    submitted_by TEXT DEFAULT 'maryjoy',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Chapel Expenses Table
CREATE TABLE IF NOT EXISTS public.chapel_expenses (
    id TEXT PRIMARY KEY,
    gsk TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    purpose TEXT NOT NULL,
    category TEXT NOT NULL,
    item TEXT NOT NULL,
    submitted_by TEXT DEFAULT 'maryjoy',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create GSK Claims Table
CREATE TABLE IF NOT EXISTS public.gsk_claims (
    id TEXT PRIMARY KEY,
    gsk_name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    claimed_by TEXT DEFAULT 'maryjoy',
    status TEXT NOT NULL DEFAULT 'Approved',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create System Audit Logs Table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    "user" TEXT NOT NULL DEFAULT 'maryjoy',
    action TEXT NOT NULL,
    category TEXT NOT NULL,
    details TEXT
);

-- Enable RLS Policies for full anonymous client access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to users" ON public.users;
CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to system_settings" ON public.system_settings;
CREATE POLICY "Allow public access to system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.secretaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to secretaries" ON public.secretaries;
CREATE POLICY "Allow public access to secretaries" ON public.secretaries FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to members" ON public.members;
CREATE POLICY "Allow public access to members" ON public.members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.tithes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to tithes" ON public.tithes;
CREATE POLICY "Allow public access to tithes" ON public.tithes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.deceased ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to deceased" ON public.deceased;
CREATE POLICY "Allow public access to deceased" ON public.deceased FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mortuary_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to mortuary_contributions" ON public.mortuary_contributions;
CREATE POLICY "Allow public access to mortuary_contributions" ON public.mortuary_contributions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.chapel_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to chapel_expenses" ON public.chapel_expenses;
CREATE POLICY "Allow public access to chapel_expenses" ON public.chapel_expenses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.gsk_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to gsk_claims" ON public.gsk_claims;
CREATE POLICY "Allow public access to gsk_claims" ON public.gsk_claims FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to system_logs" ON public.system_logs;
CREATE POLICY "Allow public access to system_logs" ON public.system_logs FOR ALL USING (true) WITH CHECK (true);

-- Seed Default Data
INSERT INTO public.users (id, name, gsk, email, username, password, role, status) VALUES
('usr_sec', 'Juan Dela Cruz (Secretary)', 'All', 'secretary.fatimaparish@gmail.com', 'sec_juan', 'password123', 'Secretary', 'Active'),
('usr_1', 'GSK Leader (San Jose)', 'GSK San Jose', 'gsk.sanjose@gmail.com', 'gsk_leader_1', 'leader123', 'GskLeader', 'Active'),
('usr_2', 'GSK Leader (Santa Maria)', 'GSK Santa Maria', 'gsk.santamaria@gmail.com', 'gsk_leader_2', 'leader123', 'GskLeader', 'Active'),
('usr_3', 'GSK Leader (San Pedro)', 'GSK San Pedro', 'gsk.sanpedro@gmail.com', 'gsk_leader_3', 'leader123', 'GskLeader', 'Active'),
('usr_4', 'GSK Leader (Santo Rosario)', 'GSK Santo Rosario', 'gsk.santorosario@gmail.com', 'gsk_leader_4', 'leader123', 'GskLeader', 'Active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password;

INSERT INTO public.system_settings (id, system_name, gsk_share, chapel_share, parokya_share, theme) VALUES
(1, 'FATIMA PARISH', 20, 20, 60, 'light')
ON CONFLICT (id) DO UPDATE SET system_name = EXCLUDED.system_name;

INSERT INTO public.secretaries (id, username, name, role, active) VALUES
('sec_1', 'sec_juan', 'Juan Dela Cruz (Secretary)', 'Secretary', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
`;

    navigator.clipboard.writeText(schema).then(() => {
        if (typeof showToast === "function") {
            showToast("Supabase SQL Schema copied to clipboard!", "success");
        } else {
            alert("SQL Schema copied to clipboard! Paste into your Supabase SQL Editor.");
        }
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
        alert("Failed to copy automatically. Please open database/supabase_schema.sql to copy the SQL.");
    });
};

window.pushLocalDataToSupabase = async function() {
    if (!window.supabaseClient) {
        alert("Supabase is not connected. Please enter and save your Supabase URL & Anon Key first.");
        return;
    }

    const pushBtn = document.getElementById("sb-modal-push-btn");
    if (pushBtn) {
        pushBtn.disabled = true;
        pushBtn.innerText = "Syncing Local Data to Supabase...";
    }

    try {
        const client = window.supabaseClient;

        // 1. Settings
        const settings = getDB("settings", null);
        if (settings) {
            await client.from("system_settings").upsert({
                id: 1,
                system_name: settings.systemName || "FATIMA PARISH",
                gsk_share: settings.allocations?.gskShare || 20,
                chapel_share: settings.allocations?.chapelShare || 20,
                parokya_share: settings.allocations?.parokyaShare || 60,
                theme: settings.theme || "light"
            });
            if (Array.isArray(settings.secretaries)) {
                for (const sec of settings.secretaries) {
                    await client.from("secretaries").upsert({
                        id: sec.id,
                        username: sec.username,
                        name: sec.name,
                        role: sec.role || "Secretary",
                        active: sec.active !== false
                    });
                }
            }
        }

        // 2. Users
        const users = getDB("users", []);
        if (users.length > 0) {
            for (const u of users) {
                await client.from("users").upsert({
                    id: u.id,
                    name: u.name,
                    gsk: u.gsk || "All",
                    email: u.email,
                    username: u.username,
                    password: u.password,
                    role: u.role || "GskLeader",
                    status: u.status || "Active"
                });
            }
        }

        // 3. Members
        const members = getDB("members", []);
        if (members.length > 0) {
            for (const m of members) {
                await client.from("members").upsert({
                    id: m.id,
                    gsk: m.gsk,
                    name: m.name,
                    contact: m.contact || null,
                    status: m.status || "Active",
                    joined_date: m.joinedDate || m.joined_date || getLocalISODate(),
                    submitted_by: m.submittedBy || m.submitted_by || "maryjoy"
                });
            }
        }

        // 4. Tithes
        const tithes = getDB("tithes", []);
        if (tithes.length > 0) {
            for (const t of tithes) {
                await client.from("tithes").upsert({
                    id: t.id,
                    member_id: t.memberId || t.member_id,
                    date: t.date || getLocalISODate(),
                    amount: Number(t.amount) || 0,
                    remarks: t.remarks || null,
                    submitted_by: t.submittedBy || t.submitted_by || "maryjoy"
                });
            }
        }

        // 5. Deceased
        const deceased = getDB("deceased", []);
        if (deceased.length > 0) {
            for (const d of deceased) {
                await client.from("deceased").upsert({
                    id: d.id,
                    name: d.name,
                    age: d.age ? Number(d.age) : null,
                    date_of_death: d.dateOfDeath || d.date_of_death || getLocalISODate(),
                    burial_date: d.burialDate || d.burial_date || null,
                    gsk: d.gsk,
                    contact_person: d.contactPerson || d.contact_person || null,
                    contact_phone: d.contactPhone || d.contact_phone || null,
                    status: d.status || "Active",
                    submitted_by: d.submittedBy || d.submitted_by || "maryjoy"
                });
            }
        }

        // 6. Mortuary
        const mort = getDB("mortuary_contributions", []);
        if (mort.length > 0) {
            for (const mc of mort) {
                await client.from("mortuary_contributions").upsert({
                    id: mc.id,
                    deceased_id: mc.deceasedId || mc.deceased_id,
                    member_id: mc.memberId || mc.member_id || null,
                    contributor_name: mc.contributorName || mc.contributor_name,
                    amount: Number(mc.amount) || 200,
                    date: mc.date || getLocalISODate(),
                    gsk: mc.gsk,
                    submitted_by: mc.submittedBy || mc.submitted_by || "maryjoy"
                });
            }
        }

        // 7. Chapel Expenses
        const expenses = getDB("chapel_expenses", []);
        if (expenses.length > 0) {
            for (const exp of expenses) {
                await client.from("chapel_expenses").upsert({
                    id: exp.id,
                    gsk: exp.gsk,
                    amount: Number(exp.amount) || 0,
                    date: exp.date || getLocalISODate(),
                    purpose: exp.purpose,
                    category: exp.category,
                    item: exp.item,
                    submitted_by: exp.submittedBy || exp.submitted_by || "maryjoy"
                });
            }
        }

        // 8. GSK Claims
        const claims = getDB("gsk_claims", []);
        if (claims.length > 0) {
            for (const cl of claims) {
                await client.from("gsk_claims").upsert({
                    id: cl.id,
                    gsk_name: cl.gskName || cl.gsk_name,
                    amount: Number(cl.amount) || 0,
                    date: cl.date || getLocalISODate(),
                    claimed_by: cl.claimedBy || cl.claimed_by || "maryjoy",
                    status: cl.status || "Approved"
                });
            }
        }

        // 9. System Logs
        const logs = getDB("logs", []);
        if (logs.length > 0) {
            for (const log of logs.slice(0, 30)) {
                await client.from("system_logs").upsert({
                    id: log.id,
                    timestamp: log.timestamp || new Date().toISOString(),
                    user: log.user || "maryjoy",
                    action: log.action,
                    category: log.category,
                    details: log.details
                });
            }
        }

        if (typeof showToast === "function") {
            showToast("All local records successfully pushed to Supabase Cloud Database!", "success");
        } else {
            alert("All local data has been successfully uploaded to Supabase!");
        }
    } catch (err) {
        console.error("Push to Supabase failed:", err);
        alert("Failed to upload all records: " + err.message);
    } finally {
        if (pushBtn) {
            pushBtn.disabled = false;
            pushBtn.innerHTML = `<i data-lucide="cloud-upload"></i> <span>Sync Local Data to Supabase</span>`;
            if (window.lucide) lucide.createIcons();
        }
    }
};
