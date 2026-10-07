<?php
// api/mortuary.php - Mortuary Condolence Contributions API
require_once __DIR__ . '/config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $deceasedId = $_GET['deceasedId'] ?? null;
        if ($deceasedId) {
            $stmt = $pdo->prepare("SELECT id, deceased_id AS deceasedId, member_id AS memberId, contributor_name AS contributorName, amount, date, gsk, submitted_by AS submittedBy FROM `mortuary_contributions` WHERE deceased_id = ? ORDER BY date DESC");
            $stmt->execute([$deceasedId]);
        } else {
            $stmt = $pdo->query("SELECT id, deceased_id AS deceasedId, member_id AS memberId, contributor_name AS contributorName, amount, date, gsk, submitted_by AS submittedBy FROM `mortuary_contributions` ORDER BY date DESC");
        }
        $contributions = $stmt->fetchAll();
        foreach ($contributions as &$c) { $c['amount'] = (float)$c['amount']; }
        jsonSuccess($contributions);
        break;

    case 'POST':
        $data = getRequestData();
        $id = $data['id'] ?? ('mc_' . time() . '_' . rand(100, 999));
        $deceasedId = $data['deceasedId'] ?? $data['deceased_id'] ?? '';
        $memberId = !empty($data['memberId']) ? $data['memberId'] : (!empty($data['member_id']) ? $data['member_id'] : null);
        $contributorName = trim($data['contributorName'] ?? $data['contributor_name'] ?? '');
        $amount = (float)($data['amount'] ?? 200);
        $date = $data['date'] ?? date('Y-m-d');
        $gsk = $data['gsk'] ?? '';
        $submittedBy = $data['submittedBy'] ?? $data['submitted_by'] ?? 'maryjoy';

        if (empty($deceasedId)) {
            $dStmt = $pdo->query("SELECT id FROM `deceased` ORDER BY date_of_death DESC LIMIT 1");
            $dRow = $dStmt ? $dStmt->fetch() : null;
            $deceasedId = $dRow ? $dRow['id'] : 'dec_1';
        }

        if (empty($contributorName) || empty($gsk)) {
            jsonError("Contributor name and GSK are required.");
        }

        $stmt = $pdo->prepare("INSERT INTO `mortuary_contributions` (id, deceased_id, member_id, contributor_name, amount, date, gsk, submitted_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE deceased_id = VALUES(deceased_id), member_id = VALUES(member_id), contributor_name = VALUES(contributor_name), amount = VALUES(amount), date = VALUES(date), gsk = VALUES(gsk), submitted_by = VALUES(submitted_by)");
        $stmt->execute([$id, $deceasedId, $memberId, $contributorName, $amount, $date, $gsk, $submittedBy]);

        jsonSuccess([
            'id' => $id,
            'deceasedId' => $deceasedId,
            'memberId' => $memberId,
            'contributorName' => $contributorName,
            'amount' => $amount,
            'date' => $date,
            'gsk' => $gsk,
            'submittedBy' => $submittedBy
        ], "Mortuary contribution recorded successfully.", 201);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? (getRequestData()['id'] ?? null);
        if (!$id) {
            jsonError("Contribution ID is required for deletion.");
        }

        $stmt = $pdo->prepare("DELETE FROM `mortuary_contributions` WHERE id = ?");
        $stmt->execute([$id]);

        jsonSuccess(["id" => $id], "Mortuary contribution deleted successfully.");
        break;

    default:
        jsonError("Method not allowed", 405);
}
