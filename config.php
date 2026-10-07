<?php
// api/config.php - MySQL Database Connection and Initialization Helper

// Allow CORS for local development and requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Configuration (Reads environment variables on Cloud/Render or falls back to local XAMPP)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
define('DB_NAME', getenv('DB_NAME') ?: 'fatima_parish_db');
define('DB_PORT', getenv('DB_PORT') ?: '3306');

/**
 * Get PDO Database Connection
 * Auto-creates the database and tables if they don't exist yet.
 */
function getDBConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        // 1. Try connecting directly to the specified database (Standard on Cloud / Render & Local)
        $dsnWithDb = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsnWithDb, DB_USER, DB_PASS, $options);
        
        // Ensure tables exist
        ensureTablesExist($pdo);
        return $pdo;
    } catch (PDOException $eDirect) {
        // 2. If database doesn't exist yet (e.g. fresh local XAMPP setup), try auto-creating it
        try {
            $dsnWithoutDb = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
            $tempPdo = new PDO($dsnWithoutDb, DB_USER, DB_PASS, $options);
            $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            
            $pdo = new PDO($dsnWithDb, DB_USER, DB_PASS, $options);
            ensureTablesExist($pdo);
            return $pdo;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "error" => "Database connection failed: " . $e->getMessage(),
                "hint" => "Check your DB_HOST, DB_NAME, DB_USER, DB_PASS, and DB_PORT settings."
            ]);
            exit();
        }
    }
}

/**
 * Ensure all tables and seed data exist
 */
function ensureTablesExist($pdo) {
    // Check if users table exists
    $check = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
    if ($check) {
        return; // Tables already set up
    }

    // Auto-create tables from schema
    $schemaFile = __DIR__ . '/../database/fatima_parish_db.sql';
    if (file_exists($schemaFile)) {
        $sql = file_get_contents($schemaFile);
        $pdo->exec($sql);
    }
}

/**
 * Helper to get JSON input payload from request body
 */
function getRequestData() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}

/**
 * Helper to return standard JSON success response
 */
function jsonSuccess($data = null, $message = "Success", $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        "success" => true,
        "message" => $message,
        "data" => $data
    ]);
    exit();
}

/**
 * Helper to return standard JSON error response
 */
function jsonError($message = "An error occurred", $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        "success" => false,
        "error" => $message
    ]);
    exit();
}
