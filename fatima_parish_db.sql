-- ==========================================================
-- Fatima Parish Management System - MySQL Database Schema
-- Database: fatima_parish_db
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `fatima_parish_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fatima_parish_db`;

-- ----------------------------------------------------------
-- 1. Users Table (Administrators and GSK Leaders)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `gsk` VARCHAR(100) NOT NULL DEFAULT 'All',
    `email` VARCHAR(150) NOT NULL,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'GskLeader',
    `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. System Settings Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` INT NOT NULL PRIMARY KEY DEFAULT 1,
    `system_name` VARCHAR(150) NOT NULL DEFAULT 'FATIMA PARISH',
    `gsk_share` INT NOT NULL DEFAULT 20,
    `chapel_share` INT NOT NULL DEFAULT 20,
    `parokya_share` INT NOT NULL DEFAULT 60,
    `theme` VARCHAR(20) NOT NULL DEFAULT 'light',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. Secretaries Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `secretaries` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'Secretary',
    `active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. Members Table (GSK Directory)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `members` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `gsk` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `contact` VARCHAR(50) DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
    `joined_date` DATE NOT NULL,
    `submitted_by` VARCHAR(50) DEFAULT 'maryjoy',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5. Tithes Contributions Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tithes` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `member_id` VARCHAR(50) NOT NULL,
    `date` DATE NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `remarks` TEXT DEFAULT NULL,
    `submitted_by` VARCHAR(50) DEFAULT 'maryjoy',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. Deceased Registry Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deceased` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `age` INT DEFAULT NULL,
    `date_of_death` DATE NOT NULL,
    `burial_date` DATE DEFAULT NULL,
    `gsk` VARCHAR(100) NOT NULL,
    `contact_person` VARCHAR(100) DEFAULT NULL,
    `contact_phone` VARCHAR(50) DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
    `submitted_by` VARCHAR(50) DEFAULT 'maryjoy',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 7. Mortuary (Condolence) Contributions Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mortuary_contributions` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `deceased_id` VARCHAR(50) NOT NULL,
    `member_id` VARCHAR(50) DEFAULT NULL,
    `contributor_name` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL DEFAULT 200.00,
    `date` DATE NOT NULL,
    `gsk` VARCHAR(100) NOT NULL,
    `submitted_by` VARCHAR(50) DEFAULT 'maryjoy',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`deceased_id`) REFERENCES `deceased`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 8. Chapel Expenses Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chapel_expenses` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `gsk` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `date` DATE NOT NULL,
    `purpose` TEXT NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `item` VARCHAR(100) NOT NULL,
    `submitted_by` VARCHAR(50) DEFAULT 'maryjoy',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 9. System Logs Table (Audit Trail)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_logs` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `user` VARCHAR(50) NOT NULL DEFAULT 'maryjoy',
    `action` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `details` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- SEED INITIAL DATA
-- ==========================================================

-- 1. Insert Default Users
INSERT INTO `users` (`id`, `name`, `gsk`, `email`, `username`, `password`, `role`, `status`) VALUES
('usr_sec', 'Juan Dela Cruz (Secretary)', 'All', 'secretary.fatimaparish@gmail.com', 'sec_juan', 'password123', 'Secretary', 'Active'),
('usr_1', 'GSK Leader (San Jose)', 'GSK San Jose', 'gsk.sanjose@gmail.com', 'gsk_leader_1', 'leader123', 'GskLeader', 'Active'),
('usr_2', 'GSK Leader (Santa Maria)', 'GSK Santa Maria', 'gsk.santamaria@gmail.com', 'gsk_leader_2', 'leader123', 'GskLeader', 'Active'),
('usr_3', 'GSK Leader (San Pedro)', 'GSK San Pedro', 'gsk.sanpedro@gmail.com', 'gsk_leader_3', 'leader123', 'GskLeader', 'Active'),
('usr_4', 'GSK Leader (Santo Rosario)', 'GSK Santo Rosario', 'gsk.santorosario@gmail.com', 'gsk_leader_4', 'leader123', 'GskLeader', 'Active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `email`=VALUES(`email`), `password`=VALUES(`password`);

-- 2. Insert Default Settings
INSERT INTO `system_settings` (`id`, `system_name`, `gsk_share`, `chapel_share`, `parokya_share`, `theme`) VALUES
(1, 'FATIMA PARISH', 20, 20, 60, 'light')
ON DUPLICATE KEY UPDATE `system_name`=VALUES(`system_name`);

-- 3. Insert Default Secretaries
INSERT INTO `secretaries` (`id`, `username`, `name`, `role`, `active`) VALUES
('sec_1', 'sec_juan', 'Juan Dela Cruz (Secretary)', 'Secretary', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. Members Table (Starts Clean at 0 Records)
-- Records are added dynamically via GSK Leader or Admin submissions.

-- 5. Tithes Table (Starts Clean at 0 Records)
-- Records are added dynamically via GSK Leader submissions.

-- 6. Insert Initial Deceased Records
INSERT INTO `deceased` (`id`, `name`, `age`, `date_of_death`, `burial_date`, `gsk`, `contact_person`, `contact_phone`, `status`, `submitted_by`) VALUES
('dec_1', 'Arnel Pineda', 78, '2026-05-02', '2026-05-10', 'GSK San Jose', 'Ronaldo Ramos (Son)', '09178887777', 'Closed', 'gsk_leader_1'),
('dec_2', 'Gary Valenciano', 65, '2026-05-18', '2026-05-25', 'GSK Santa Maria', 'Maria Penduko (Wife)', '09214443333', 'Active', 'gsk_leader_2'),
('dec_3', 'Jose Mari Chan', 92, '2026-05-28', '2026-06-05', 'GSK San Pedro', 'Baldomero Aguinaldo (Grandson)', '09081112222', 'Active', 'gsk_leader_3')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 7. Mortuary Contributions Table (Starts Clean at 0 Records)
-- Records are added dynamically via GSK Leader submissions.

-- 8. Chapel Expenses Table (Starts Clean at 0 Records)
-- Records are added dynamically via Secretary / Admin panel.

-- 9. Insert Initial System Logs
INSERT INTO `system_logs` (`id`, `timestamp`, `user`, `action`, `category`, `details`) VALUES
('log_init', '2026-05-23 10:00:00', 'maryjoy', 'SYSTEM_INITIALIZE', 'SETTINGS', 'System initialized with Fatima Parish structure in MySQL.')
ON DUPLICATE KEY UPDATE `action`=VALUES(`action`);
