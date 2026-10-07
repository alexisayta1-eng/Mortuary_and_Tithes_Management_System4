<?php
// api/tithes.php - Tithes Tracking and Contributions API
require_once __DIR__ . '/config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $memberId = $_GET['memberId'] ?? null;

        if ($id) {
            $stmt = $pdo->prepare("SELECT id, member_id AS memberId, date, amount, remarks, submitted_by AS submittedBy, created_at AS createdAt FROM `tithes` WHERE id = ?");
            $stmt->execute([$id]);
            $tithe = $stmt->fetch();
            if ($tithe) {
                $tithe['amount'] = (float)$tithe['amount'];
                jsonSuccess($tithe);
            } else {
                jsonError("Tithe record not found", 404);
            }
        } else if ($memberId) {
            $stmt = $pdo->prepare("SELECT id, member_id AS memberId, date, amount, remarks, submitted_by AS submittedBy, created_at AS createdAt FROM `tithes` WHERE member_id = ? ORDER BY date DESC");
            $stmt->execute([$memberId]);
            $tithes = $stmt->fetchAll();
            foreach ($tithes as &$t) { $t['amount'] = (float)$t['amount']; }
            jsonSuccess($tithes);
        } else {
            $stmt = $pdo->query("SELECT id, member_id AS memberId, date, amount, remarks, submitted_by AS submittedBy, created_at AS createdAt FROM `tithes` ORDER BY date DESC");
            $tithes = $stmt->fetchAll();
            foreach ($tithes as &$t) { $t['amount'] = (float)$t['amount']; }
            jsonSuccess($tithes);
        }
        break;

    case 'POST':
        $data = getRequestData();
        $id = $data['id'] ?? ('t_' . time() . '_' . rand(100, 999));
        $memberId = $data['memberId'] ?? $data['member_id'] ?? '';
        $date = $data['date'] ?? date('Y-m-d');
        $amount = (float)($data['amount'] ?? 0);
        $remarks = trim($data['remarks'] ?? '');
        $submittedBy = $data['submittedBy'] ?? $data['submitted_by'] ?? 'maryjoy';

        if (empty($memberId) || $amount <= 0) {
            jsonError("Valid Member and positive contribution amount are required.");
        }

        // Verify member exists
        $mStmt = $pdo->prepare("SELECT id FROM `members` WHERE id = ?");
        $mStmt->execute([$memberId]);
        if (!$mStmt->fetch()) {
            jsonError("Selected Member does not exist in the database.", 404);
        }

        $stmt = $pdo->prepare("INSERT INTO `tithes` (id, member_id, date, amount, remarks, submitted_by) VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE member_id = VALUES(member_id), date = VALUES(date), amount = VALUES(amount), remarks = VALUES(remarks), submitted_by = VALUES(submitted_by)");
        $stmt->execute([$id, $memberId, $date, $amount, $remarks, $submittedBy]);

        jsonSuccess([
            'id' => $id,
            'memberId' => $memberId,
            'date' => $date,
            'amount' => $amount,
            'remarks' => $remarks,
            'submittedBy' => $submittedBy
        ], "Tithe contribution recorded successfully.", 201);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? (getRequestData()['id'] ?? null);
        if (!$id) {
            jsonError("Tithe ID is required for deletion.");
        }

        $stmt = $pdo->prepare("DELETE FROM `tithes` WHERE id = ?");
        $stmt->execute([$id]);

        jsonSuccess(["id" => $id], "Tithe record deleted successfully.");
        break;

    default:
        jsonError("Method not allowed", 405);
}
