# ⛪ Fatima Parish Management System - Supabase Setup Guide

This guide provides instructions to connect the **Fatima Parish Management System** to a free **Supabase (PostgreSQL)** Cloud Database.

---

## 🌟 Why Supabase?
- **Serverless & Zero Maintenance**: No need for XAMPP, Apache, MySQL, or PHP servers.
- **Universal Access**: The system works anywhere—run it locally by opening `index.html`, or host it on GitHub Pages, Vercel, or Netlify.
- **Live Cloud Sync**: Data entered by GSK Leaders or Admin updates across all devices.
- **Offline Resilient**: If your internet drops, the system automatically uses LocalStorage and syncs with Supabase once reconnected.

---

## 🚀 Quick Setup Instructions (3 Easy Steps)

### Step 1: Create a Free Project on Supabase
1. Go to [supabase.com](https://supabase.com) and click **Start your project** (or sign in with GitHub).
2. Click **New Project**.
3. Fill in the project details:
   - **Name**: `Fatima Parish Management` (or any name you prefer)
   - **Database Password**: Choose a secure password (store it safely)
   - **Region**: Choose the region closest to you (e.g. *Singapore* for the Philippines / Southeast Asia)
4. Click **Create new project** and wait ~1 minute for provisioning.

---

### Step 2: Create the Database Tables (1-Click SQL)
1. In your Supabase Dashboard, click on **SQL Editor** from the left navigation menu.
2. Click **New Query**.
3. Open [`database/supabase_schema.sql`](file:///c:/Users/ay/Desktop/SYSTEM%20ni%20maryjoy/database/supabase_schema.sql) in this project (or click **Copy SQL Schema** in the system's Supabase Settings modal).
4. Paste the entire SQL script into the query editor.
5. Click **Run** (green button at the bottom right).
6. You will see `Success. No rows returned`—all tables, Row Level Security (RLS) policies, and default accounts are now ready!

---

### Step 3: Connect the Fatima Parish System to Supabase
1. In your Supabase Dashboard, go to **Project Settings** (gear icon on bottom left) -> **API**.
2. Copy two values:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **Project API Keys -> `anon` public key** (e.g. `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
3. Open `index.html` in your browser.
4. Click on the **Supabase** badge in the top right header (or navigate to **Settings -> System & System** and click **Configure Supabase**).
5. Paste your **Project URL** and **Public Anon Key**.
6. Click **Test & Save Connection**.
7. The badge will turn green: `🟢 Supabase: Live Cloud`!

---

## 🔄 1-Click Sync Local Data to Supabase
If you already have members, tithes, or deceased records in your local browser storage:
1. Click the **Supabase** badge in the top-right header.
2. Click **Sync Local Data to Supabase**.
3. All local records will be automatically uploaded into your Supabase PostgreSQL tables.

---

## 🔑 Default User Accounts (Pre-configured in Database)

### 1. Secretary Account (Juan Dela Cruz)
| Field | Value |
|---|---|
| **Role** | Secretary |
| **Email / Username** | `sec_juan` *(or `secretary.fatimaparish@gmail.com`)* |
| **Password** | `password123` |
| **Access** | Full system control, all GSK chapters, settings, allocations, user management |

### 2. GSK Leader Accounts
| GSK Chapter | Username / Email | Password |
|---|---|---|
| **GSK San Jose** | `gsk_leader_1` *(or `gsk.sanjose@gmail.com`)* | `leader123` |
| **GSK Santa Maria** | `gsk_leader_2` *(or `gsk.santamaria@gmail.com`)* | `leader123` |
| **GSK San Pedro** | `gsk_leader_3` *(or `gsk.sanpedro@gmail.com`)* | `leader123` |
| **GSK Santo Rosario** | `gsk_leader_4` *(or `gsk.santorosario@gmail.com`)* | `leader123` |

### 3. Parishioner Account
| Field | Value |
|---|---|
| **Full Name** | `Arnel Pineda` *(or any registered active member name)* |
| **Contact Number** | `09171234567` |

---

## 🗄️ Database Table Structure in Supabase

| Table Name | Description |
|---|---|
| `users` | Admin and GSK Leader login accounts with roles and passwords |
| `system_settings` | System name, fund allocation percentages (20% GSK, 20% Chapel, 60% Parish), theme |
| `secretaries` | Registered secretaries and administrative staff |
| `members` | GSK Parishioners directory with contact info, status, and joined dates |
| `tithes` | Tithe contributions linked to members with amounts and remarks |
| `deceased` | Deceased registry for mortuary records and condolence tracking |
| `mortuary_contributions` | Condolence contributions for deceased parish members |
| `chapel_expenses` | Chapel maintenance, utilities, and equipment expense records |
| `gsk_claims` | GSK 20% allocation fund claims |
| `system_logs` | Audit trail and system activity logs |

---

## 💡 Troubleshooting & FAQ

### 1. What if I open the app without internet?
The system will run in **LocalStorage Mode (Offline)** and use local data. Once your device reconnects to the internet, click the Supabase badge to sync.

### 2. Can I host this online on GitHub Pages or Vercel?
Yes! Since the database is hosted in Supabase, you can upload this folder directly to GitHub Pages, Netlify, or Vercel, and anyone on your parish team can access it from any phone or computer without running a server.

### 3. How do I change the database password or view records in Supabase?
In your Supabase Dashboard:
- Click **Table Editor** on the left menu to view, search, edit, or delete any record in real-time.
- Click **Database -> Backups** to view automatic daily backups created by Supabase.
