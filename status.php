<?php
// api/status.php - Health check and MySQL connection status
require_once __DIR__ . '/config.php';

try {
    $pdo = getDBConnection();
    
    // Count records to verify tables
    $userCount = $pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
    $memberCount = $pdo->query("SELECT COUNT(*) FROM `members`")->fetchColumn();
    $titheCount = $pdo->query("SELECT COUNT(*) FROM `tithes`")->fetchColumn();
    
    jsonSuccess([
        "connected" => true,
        "database" => DB_NAME,
        "host" => DB_HOST,
        "counts" => [
            "users" => (int)$userCount,
            "members" => (int)$memberCount,
            "tithes" => (int)$titheCount
        ],
        "server_time" => date("Y-m-d H:i:s")
    ], "MySQL database connected successfully.");
} catch (Exception $e) {
    jsonError("MySQL connection test failed: " . $e->getMessage(), 500);
}
