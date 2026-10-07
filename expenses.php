<?php
// api/expenses.php - Chapel Expenses API
require_once __DIR__ . '/config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $gsk = $_GET['gsk'] ?? null;
        if ($gsk && $gsk !== 'All') {
            $stmt = $pdo->prepare("SELECT id, gsk, amount, date, purpose, category, item, submitted_by AS submittedBy FROM `chapel_expenses` WHERE gsk = ? ORDER BY date DESC");
            $stmt->execute([$gsk]);
        } else {
            $stmt = $pdo->query("SELECT id, gsk, amount, date, purpose, category, item, submitted_by AS submittedBy FROM `chapel_expenses` ORDER BY date DESC");
        }
        $expenses = $stmt->fetchAll();
        foreach ($expenses as &$e) { $e['amount'] = (float)$e['amount']; }
        jsonSuccess($expenses);
        break;

    case 'POST':
        $data = getRequestData();
        $id = $data['id'] ?? ('exp_' . time() . '_' . rand(100, 999));
        $gsk = $data['gsk'] ?? '';
        $amount = (float)($data['amount'] ?? 0);
        $date = $data['date'] ?? date('Y-m-d');
        $purpose = trim($data['purpose'] ?? '');
        $category = $data['category'] ?? 'Maintenance';
        $item = $data['item'] ?? 'Other Maintenance Expenses';
        $submittedBy = $data['submittedBy'] ?? $data['submitted_by'] ?? 'maryjoy';

        if (empty($gsk) || $amount <= 0 || empty($purpose)) {
            jsonError("GSK, positive amount, and purpose are required.");
        }

        $stmt = $pdo->prepare("INSERT INTO `chapel_expenses` (id, gsk, amount, date, purpose, category, item, submitted_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE gsk = VALUES(gsk), amount = VALUES(amount), date = VALUES(date), purpose = VALUES(purpose), category = VALUES(category), item = VALUES(item), submitted_by = VALUES(submitted_by)");
        $stmt->execute([$id, $gsk, $amount, $date, $purpose, $category, $item, $submittedBy]);

        jsonSuccess([
            'id' => $id,
            'gsk' => $gsk,
            'amount' => $amount,
            'date' => $date,
            'purpose' => $purpose,
            'category' => $category,
            'item' => $item,
            'submittedBy' => $submittedBy
        ], "Chapel expense recorded successfully.", 201);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? (getRequestData()['id'] ?? null);
        if (!$id) {
            jsonError("Expense ID is required for deletion.");
        }

        $stmt = $pdo->prepare("DELETE FROM `chapel_expenses` WHERE id = ?");
        $stmt->execute([$id]);

        jsonSuccess(["id" => $id], "Chapel expense deleted successfully.");
        break;

    default:
        jsonError("Method not allowed", 405);
}
