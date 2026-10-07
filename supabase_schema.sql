-- ====================================================================
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

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enables anonymous public API keys to perform full read/write operations
-- ====================================================================

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

-- ====================================================================
-- REALTIME REPLICATION (Optional - enable live broadcasts)
-- ====================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.members, 
            public.tithes, 
            public.deceased, 
            public.mortuary_contributions, 
            public.chapel_expenses, 
            public.gsk_claims, 
            public.system_settings, 
            public.users, 
            public.system_logs;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already added or publication missing
END $$;

-- ====================================================================
-- SEED INITIAL DATA
-- ====================================================================

-- 1. Insert Default Users
INSERT INTO public.users (id, name, gsk, email, username, password, role, status) VALUES
('usr_sec', 'Juan Dela Cruz (Secretary)', 'All', 'secretary.fatimaparish@gmail.com', 'sec_juan', 'password123', 'Secretary', 'Active'),
('usr_1', 'GSK Leader (San Jose)', 'GSK San Jose', 'gsk.sanjose@gmail.com', 'gsk_leader_1', 'leader123', 'GskLeader', 'Active'),
('usr_2', 'GSK Leader (Santa Maria)', 'GSK Santa Maria', 'gsk.santamaria@gmail.com', 'gsk_leader_2', 'leader123', 'GskLeader', 'Active'),
('usr_3', 'GSK Leader (San Pedro)', 'GSK San Pedro', 'gsk.sanpedro@gmail.com', 'gsk_leader_3', 'leader123', 'GskLeader', 'Active'),
('usr_4', 'GSK Leader (Santo Rosario)', 'GSK Santo Rosario', 'gsk.santorosario@gmail.com', 'gsk_leader_4', 'leader123', 'GskLeader', 'Active')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    email = EXCLUDED.email, 
    password = EXCLUDED.password;

-- 2. Insert Default Settings
INSERT INTO public.system_settings (id, system_name, gsk_share, chapel_share, parokya_share, theme) VALUES
(1, 'FATIMA PARISH', 20, 20, 60, 'light')
ON CONFLICT (id) DO UPDATE SET 
    system_name = EXCLUDED.system_name;

-- 3. Insert Default Secretaries
INSERT INTO public.secretaries (id, username, name, role, active) VALUES
('sec_1', 'sec_juan', 'Juan Dela Cruz (Secretary)', 'Secretary', TRUE)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name;

-- 4. Insert Initial Deceased Registry
INSERT INTO public.deceased (id, name, age, date_of_death, burial_date, gsk, contact_person, contact_phone, status, submitted_by) VALUES
('dec_1', 'Arnel Pineda', 78, '2026-05-02', '2026-05-10', 'GSK San Jose', 'Ronaldo Ramos (Son)', '09178887777', 'Closed', 'gsk_leader_1'),
('dec_2', 'Gary Valenciano', 65, '2026-05-18', '2026-05-25', 'GSK Santa Maria', 'Maria Penduko (Wife)', '09214443333', 'Active', 'gsk_leader_2'),
('dec_3', 'Jose Mari Chan', 92, '2026-05-28', '2026-06-05', 'GSK San Pedro', 'Baldomero Aguinaldo (Grandson)', '09081112222', 'Active', 'gsk_leader_3')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name;

-- 5. Insert Initial System Log
INSERT INTO public.system_logs (id, timestamp, "user", action, category, details) VALUES
('log_init', timezone('utc'::text, now()), 'maryjoy', 'SYSTEM_INITIALIZE', 'SETTINGS', 'System initialized with Fatima Parish structure in Supabase PostgreSQL.')
ON CONFLICT (id) DO NOTHING;
