# ⛪ Fatima Parish Management System - MySQL Setup Guide

This guide provides instructions to connect and run the **Fatima Parish Management System** with a **MySQL Database** using **XAMPP** (Apache & MySQL).

---

## 📋 System Requirements
- **XAMPP** (or WampServer / Laragon) with:
  - **Apache** Web Server
  - **MySQL / MariaDB** (Port 3306)
  - **PHP 7.4+** or **PHP 8.x** (with `pdo_mysql` enabled)
- A modern web browser (Google Chrome, Microsoft Edge, Firefox, Brave)

---

## 🚀 Quick Setup Instructions (3 Easy Steps)

### Step 1: Start XAMPP Services
1. Open the **XAMPP Control Panel**.
2. Click **Start** for **Apache**.
3. Click **Start** for **MySQL**.
   *(Both modules should turn green).*

---

### Step 2: Set Up the Project in XAMPP
Choose **Option A** (Recommended) or **Option B**:

#### Option A: Copy to `htdocs` (Standard)
1. Copy or move the entire folder `SYSTEM ni maryjoy` to:
   ```
   C:\xampp\htdocs\SYSTEM ni maryjoy
   ```
2. Open your browser and navigate to:
   ```
   http://localhost/SYSTEM%20ni%20maryjoy/
   ```

#### Option B: Run via PHP Built-in Server
1. Open a terminal / command prompt inside the project folder:
   ```powershell
   cd "C:\Users\ay\Desktop\SYSTEM ni maryjoy"
   php -S localhost:8000
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

---

### Step 3: Database Initialization (Automatic or via phpMyAdmin)

#### 🔹 Method 1: Automatic Auto-Init (Instant)
The system's backend (`api/config.php`) **automatically creates the database `fatima_parish_db` and all tables** on your first visit when Apache and MySQL are running!

#### 🔹 Method 2: Manual Import via phpMyAdmin (Optional)
If you want to view or import the database manually:
1. Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin) in your browser.
2. Click on **New** on the left sidebar.
3. Name the database: `fatima_parish_db` and click **Create**.
4. Select `fatima_parish_db` in the sidebar and click the **Import** tab at the top.
5. Click **Choose File** and select:
   ```
   database/fatima_parish_db.sql
   ```
6. Scroll down and click **Import** (or **Go**).

---

## 🔑 Default Login Credentials

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

## 🗄️ Database Architecture (`fatima_parish_db`)

| Table Name | Description |
|---|---|
| `users` | Admin and GSK Leader login accounts with roles and passwords |
| `members` | GSK Parishioners directory with contact, status, and joined dates |
| `tithes` | Tithe contributions linked to members with amounts and remarks |
| `deceased` | Deceased registry for mortuary records and condolence tracking |
| `mortuary_contributions` | Condolence contributions for deceased parish members |
| `chapel_expenses` | Chapel maintenance, utilities, and equipment expense records |
| `system_settings` | Parish name, fund allocation percentages (GSK, Chapel, Parish) |
| `secretaries` | Registered secretaries and staff permissions |
| `system_logs` | Audit trail and system activity logs |

---

## 🌐 REST API Endpoints Overview

All backend endpoints are located in `/api/`:

| Endpoint | Methods | Description |
|---|---|---|
| `/api/status.php` | `GET` | Health check & MySQL connection verification |
| `/api/auth.php` | `POST` | User authentication (Admin, Leader, Parishioner) |
| `/api/members.php` | `GET, POST, PUT, DELETE` | GSK Members CRUD operations |
| `/api/tithes.php` | `GET, POST, DELETE` | Tithes contributions CRUD |
| `/api/deceased.php` | `GET, POST, PUT, DELETE` | Deceased registry CRUD |
| `/api/mortuary.php` | `GET, POST, DELETE` | Condolence contributions CRUD |
| `/api/expenses.php` | `GET, POST, DELETE` | Chapel expenses CRUD |
| `/api/settings.php` | `GET, POST, PUT` | System configurations & shares |
| `/api/users.php` | `GET, POST, PUT, DELETE` | User accounts CRUD |
| `/api/logs.php` | `GET, POST` | System audit trail logs |

---

## ⚙️ Customizing MySQL Credentials

If your MySQL uses a custom password or port, edit [`api/config.php`](file:///c:/Users/ay/Desktop/SYSTEM%20ni%20maryjoy/api/config.php):
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');            // Enter your MySQL root password here if set
define('DB_NAME', 'fatima_parish_db');
define('DB_PORT', '3306');
```

---

## 💡 Visual Connection Status
When you load the application, check the top-right header:
- `🟢 MySQL: fatima_parish_db` → Live connection to MySQL is active!
- `🟡 LocalStorage Mode (Offline)` → Running offline or directly opened as a local file.
