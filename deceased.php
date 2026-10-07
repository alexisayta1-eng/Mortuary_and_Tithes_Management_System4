<?php
// api/deceased.php - Deceased Registry CRUD API
require_once __DIR__ . '/config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $gsk = $_GET['gsk'] ?? null;

        if ($id) {
            $stmt = $pdo->prepare("SELECT id, name, age, date_of_death AS dateOfDeath, burial_date AS burialDate, gsk, contact_person AS contactPerson, contact_phone AS contactPhone, status, submitted_by AS submittedBy FROM `deceased` WHERE id = ?");
            $stmt->execute([$id]);
            $item = $stmt->fetch();
            if ($item) {
                $item['age'] = $item['age'] ? (int)$item['age'] : null;
                jsonSuccess($item);
            } else {
                jsonError("Deceased record not found", 404);
            }
        } else {
            if ($gsk && $gsk !== 'All') {
                $stmt = $pdo->prepare("SELECT id, name, age, date_of_death AS dateOfDeath, burial_date AS burialDate, gsk, contact_person AS contactPerson, contact_phone AS contactPhone, status, submitted_by AS submittedBy FROM `deceased` WHERE gsk = ? ORDER BY date_of_death DESC");
                $stmt->execute([$gsk]);
            } else {
                $stmt = $pdo->query("SELECT id, name, age, date_of_death AS dateOfDeath, burial_date AS burialDate, gsk, contact_person AS contactPerson, contact_phone AS contactPhone, status, submitted_by AS submittedBy FROM `deceased` ORDER BY date_of_death DESC");
            }
            $items = $stmt->fetchAll();
            foreach ($items as &$i) { $i['age'] = $i['age'] ? (int)$i['age'] : null; }
            jsonSuccess($items);
        }
        break;

    case 'POST':
        $data = getRequestData();
        $id = $data['id'] ?? ('dec_' . time() . '_' . rand(100, 999));
        $name = trim($data['name'] ?? '');
        $age = !empty($data['age']) ? (int)$data['age'] : null;
        $dateOfDeath = $data['dateOfDeath'] ?? $data['date_of_death'] ?? date('Y-m-d');
        $burialDate = !empty($data['burialDate']) ? $data['burialDate'] : (!empty($data['burial_date']) ? $data['burial_date'] : null);
        $gsk = $data['gsk'] ?? '';
        $contactPerson = trim($data['contactPerson'] ?? $data['contact_person'] ?? '');
        $contactPhone = trim($data['contactPhone'] ?? $data['contact_phone'] ?? '');
        $status = $data['status'] ?? 'Active';
        $submittedBy = $data['submittedBy'] ?? $data['submitted_by'] ?? 'maryjoy';

        if (empty($name) || empty($gsk) || empty($dateOfDeath)) {
            jsonError("Name, GSK, and Date of Death are required.");
        }

        $stmt = $pdo->prepare("INSERT INTO `deceased` (id, name, age, date_of_death, burial_date, gsk, contact_person, contact_phone, status, submitted_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name = VALUES(name), age = VALUES(age), date_of_death = VALUES(date_of_death), burial_date = VALUES(burial_date), gsk = VALUES(gsk), contact_person = VALUES(contact_person), contact_phone = VALUES(contact_phone), status = VALUES(status), submitted_by = VALUES(submitted_by)");
        $stmt->execute([$id, $name, $age, $dateOfDeath, $burialDate, $gsk, $contactPerson, $contactPhone, $status, $submittedBy]);

        jsonSuccess([
            'id' => $id,
            'name' => $name,
            'age' => $age,
            'dateOfDeath' => $dateOfDeath,
            'burialDate' => $burialDate,
            'gsk' => $gsk,
            'contactPerson' => $contactPerson,
            'contactPhone' => $contactPhone,
            'status' => $status,
            'submittedBy' => $submittedBy
        ], "Deceased record saved successfully.", 201);
        break;

    case 'PUT':
        $data = getRequestData();
        $id = $data['id'] ?? null;
        if (!$id) {
            jsonError("Record ID is required for update.");
        }

        $fields = [];
        $params = [];

        if (isset($data['name'])) { $fields[] = "name = ?"; $params[] = trim($data['name']); }
        if (isset($data['age'])) { $fields[] = "age = ?"; $params[] = (int)$data['age']; }
        if (isset($data['dateOfDeath']) || isset($data['date_of_death'])) { $fields[] = "date_of_death = ?"; $params[] = $data['dateOfDeath'] ?? $data['date_of_death']; }
        if (isset($data['burialDate']) || isset($data['burial_date'])) { $fields[] = "burial_date = ?"; $params[] = $data['burialDate'] ?? $data['burial_date']; }
        if (isset($data['gsk'])) { $fields[] = "gsk = ?"; $params[] = $data['gsk']; }
        if (isset($data['contactPerson']) || isset($data['contact_person'])) { $fields[] = "contact_person = ?"; $params[] = trim($data['contactPerson'] ?? $data['contact_person']); }
        if (isset($data['contactPhone']) || isset($data['contact_phone'])) { $fields[] = "contact_phone = ?"; $params[] = trim($data['contactPhone'] ?? $data['contact_phone']); }
        if (isset($data['status'])) { $fields[] = "status = ?"; $params[] = $data['status']; }

        if (empty($fields)) {
            jsonError("No fields to update.");
        }

        $params[] = $id;
        $sql = "UPDATE `deceased` SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        jsonSuccess($data, "Deceased record updated successfully.");
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? (getRequestData()['id'] ?? null);
        if (!$id) {
            jsonError("Record ID is required for deletion.");
        }

        $stmt = $pdo->prepare("DELETE FROM `deceased` WHERE id = ?");
        $stmt->execute([$id]);

        jsonSuccess(["id" => $id], "Deceased record deleted successfully.");
        break;

    default:
        jsonError("Method not allowed", 405);
}
