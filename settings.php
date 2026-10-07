<?php
// api/settings.php - System Settings and Secretaries API
require_once __DIR__ . '/config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch Settings
        $stmt = $pdo->query("SELECT * FROM `system_settings` WHERE id = 1 LIMIT 1");
        $settingsRow = $stmt->fetch();
        if (!$settingsRow) {
            $settingsRow = [
                'system_name' => 'FATIMA PARISH',
                'gsk_share' => 20,
                'chapel_share' => 20,
                'parokya_share' => 60,
                'theme' => 'light'
            ];
        } else if ($settingsRow['gsk_share'] == 30 || $settingsRow['parokya_share'] == 50 || ($settingsRow['gsk_share'] + $settingsRow['chapel_share'] + $settingsRow['parokya_share'] != 100)) {
            $settingsRow['gsk_share'] = 20;
            $settingsRow['chapel_share'] = 20;
            $settingsRow['parokya_share'] = 60;
            $uStmt = $pdo->prepare("UPDATE `system_settings` SET gsk_share = 20, chapel_share = 20, parokya_share = 60 WHERE id = 1");
            $uStmt->execute();
        }

        // Fetch Secretaries
        $secStmt = $pdo->query("SELECT id, username, name, role, active FROM `secretaries` ORDER BY created_at ASC");
        $secretaries = $secStmt->fetchAll();
        foreach ($secretaries as &$s) {
            $s['active'] = (bool)$s['active'];
        }

        $formatted = [
            'systemName' => $settingsRow['system_name'],
            'allocations' => [
                'gskShare' => (int)$settingsRow['gsk_share'],
                'chapelShare' => (int)$settingsRow['chapel_share'],
                'parokyaShare' => (int)$settingsRow['parokya_share']
            ],
            'theme' => $settingsRow['theme'],
            'secretaries' => $secretaries
        ];

        jsonSuccess($formatted);
        break;

    case 'POST':
    case 'PUT':
        $data = getRequestData();
        $systemName = $data['systemName'] ?? $data['system_name'] ?? 'FATIMA PARISH';
        $allocations = $data['allocations'] ?? [];
        $gskShare = isset($allocations['gskShare']) ? (int)$allocations['gskShare'] : (int)($data['gskShare'] ?? $data['gsk_share'] ?? 20);
        $chapelShare = isset($allocations['chapelShare']) ? (int)$allocations['chapelShare'] : (int)($data['chapelShare'] ?? $data['chapel_share'] ?? 20);
        $parokyaShare = isset($allocations['parokyaShare']) ? (int)$allocations['parokyaShare'] : (int)($data['parokyaShare'] ?? $data['parokya_share'] ?? 60);
        $theme = $data['theme'] ?? 'light';

        // Update settings in database
        $stmt = $pdo->prepare("INSERT INTO `system_settings` (id, system_name, gsk_share, chapel_share, parokya_share, theme)
            VALUES (1, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE system_name = VALUES(system_name), gsk_share = VALUES(gsk_share), chapel_share = VALUES(chapel_share), parokya_share = VALUES(parokya_share), theme = VALUES(theme)");
        $stmt->execute([$systemName, $gskShare, $chapelShare, $parokyaShare, $theme]);

        // If secretaries list provided, update secretaries table
        if (isset($data['secretaries']) && is_array($data['secretaries'])) {
            foreach ($data['secretaries'] as $sec) {
                $secId = $sec['id'] ?? ('sec_' . time() . '_' . rand(100, 999));
                $secUser = $sec['username'] ?? '';
                $secName = $sec['name'] ?? '';
                $secRole = $sec['role'] ?? 'Secretary';
                $secActive = isset($sec['active']) ? ($sec['active'] ? 1 : 0) : 1;

                if (!empty($secName)) {
                    $secStmt = $pdo->prepare("INSERT INTO `secretaries` (id, username, name, role, active)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE username = VALUES(username), name = VALUES(name), role = VALUES(role), active = VALUES(active)");
                    $secStmt->execute([$secId, $secUser, $secName, $secRole, $secActive]);
                }
            }
        }

        jsonSuccess([
            'systemName' => $systemName,
            'allocations' => [
                'gskShare' => $gskShare,
                'chapelShare' => $chapelShare,
                'parokyaShare' => $parokyaShare
            ],
            'theme' => $theme
        ], "Settings updated successfully.");
        break;

    default:
        jsonError("Method not allowed", 405);
}
