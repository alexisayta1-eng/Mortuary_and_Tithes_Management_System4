<?php
// api/logs.php - System Audit Trail Logs API
require_once __DIR__ . '/config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT id, timestamp, user, action, category, details FROM `system_logs` ORDER BY timestamp DESC LIMIT 200");
        $logs = $stmt->fetchAll();
        jsonSuccess($logs);
        break;

    case 'POST':
        $data = getRequestData();
        $id = $data['id'] ?? ('log_' . time() . '_' . rand(100, 999));
        $timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');
        $user = $data['user'] ?? 'maryjoy';
        $action = $data['action'] ?? 'SYSTEM_EVENT';
        $category = $data['category'] ?? 'GENERAL';
        $details = $data['details'] ?? '';

        $stmt = $pdo->prepare("INSERT INTO `system_logs` (id, timestamp, user, action, category, details) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $timestamp, $user, $action, $category, $details]);

        jsonSuccess([
            'id' => $id,
            'timestamp' => $timestamp,
            'user' => $user,
            'action' => $action,
            'category' => $category,
            'details' => $details
        ], "Log recorded.", 201);
        break;

    default:
        jsonError("Method not allowed", 405);
}
