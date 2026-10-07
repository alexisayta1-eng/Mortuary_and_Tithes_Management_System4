<?php
// api/members.php - GSK Members Directory CRUD API
require_once __DIR__ . '/config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Optional filters: gsk, id
        $id = $_GET['id'] ?? null;
        $gsk = $_GET['gsk'] ?? null;

        if ($id) {
            $stmt = $pdo->prepare("SELECT id, gsk, name, contact, status, joined_date AS joinedDate, submitted_by AS submittedBy FROM `members` WHERE id = ?");
            $stmt->execute([$id]);
            $member = $stmt->fetch();
            if ($member) {
                jsonSuccess($member);
            } else {
                jsonError("Member not found", 404);
            }
        } else {
            if ($gsk && $gsk !== 'All') {
                $stmt = $pdo->prepare("SELECT id, gsk, name, contact, status, joined_date AS joinedDate, submitted_by AS submittedBy FROM `members` WHERE gsk = ? ORDER BY name ASC");
                $stmt->execute([$gsk]);
            } else {
                $stmt = $pdo->query("SELECT id, gsk, name, contact, status, joined_date AS joinedDate, submitted_by AS submittedBy FROM `members` ORDER BY name ASC");
            }
            $members = $stmt->fetchAll();
            jsonSuccess($members);
        }
        break;

    case 'POST':
        $data = getRequestData();
        $id = $data['id'] ?? ('mem_' . time() . '_' . rand(100, 999));
        $gsk = $data['gsk'] ?? '';
        $name = trim($data['name'] ?? '');
        $contact = trim($data['contact'] ?? '');
        $status = $data['status'] ?? 'Active';
        $joinedDate = $data['joinedDate'] ?? $data['joined_date'] ?? date('Y-m-d');
        $submittedBy = $data['submittedBy'] ?? $data['submitted_by'] ?? 'maryjoy';

        if (empty($name) || empty($gsk)) {
            jsonError("Member name and GSK assignment are required.");
        }

        $stmt = $pdo->prepare("INSERT INTO `members` (id, gsk, name, contact, status, joined_date, submitted_by) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE gsk = VALUES(gsk), name = VALUES(name), contact = VALUES(contact), status = VALUES(status), joined_date = VALUES(joined_date), submitted_by = VALUES(submitted_by)");
        $stmt->execute([$id, $gsk, $name, $contact, $status, $joinedDate, $submittedBy]);

        jsonSuccess([
            'id' => $id,
            'gsk' => $gsk,
            'name' => $name,
            'contact' => $contact,
            'status' => $status,
            'joinedDate' => $joinedDate,
            'submittedBy' => $submittedBy
        ], "Member saved successfully.", 201);
        break;

    case 'PUT':
        $data = getRequestData();
        $id = $data['id'] ?? null;
        if (!$id) {
            jsonError("Member ID is required for update.");
        }

        $fields = [];
        $params = [];

        if (isset($data['name'])) { $fields[] = "name = ?"; $params[] = trim($data['name']); }
        if (isset($data['gsk'])) { $fields[] = "gsk = ?"; $params[] = $data['gsk']; }
        if (isset($data['contact'])) { $fields[] = "contact = ?"; $params[] = trim($data['contact']); }
        if (isset($data['status'])) { $fields[] = "status = ?"; $params[] = $data['status']; }
        if (isset($data['joinedDate']) || isset($data['joined_date'])) { 
            $fields[] = "joined_date = ?"; 
            $params[] = $data['joinedDate'] ?? $data['joined_date']; 
        }

        if (empty($fields)) {
            jsonError("No fields to update.");
        }

        $params[] = $id;
        $sql = "UPDATE `members` SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        jsonSuccess($data, "Member updated successfully.");
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? (getRequestData()['id'] ?? null);
        if (!$id) {
            jsonError("Member ID is required for deletion.");
        }

        $stmt = $pdo->prepare("DELETE FROM `members` WHERE id = ?");
        $stmt->execute([$id]);

        jsonSuccess(["id" => $id], "Member deleted successfully.");
        break;

    default:
        jsonError("Method not allowed", 405);
}
