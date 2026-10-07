<?php
// api/users.php - User Accounts Management API (Admin & GSK Leaders)
require_once __DIR__ . '/config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("SELECT id, name, gsk, email, username, password, role, status, created_at AS createdAt FROM `users` WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            if ($user) {
                jsonSuccess($user);
            } else {
                jsonError("User not found", 404);
            }
        } else {
            $stmt = $pdo->query("SELECT id, name, gsk, email, username, password, role, status, created_at AS createdAt FROM `users` ORDER BY role ASC, name ASC");
            $users = $stmt->fetchAll();
            jsonSuccess($users);
        }
        break;

    case 'POST':
        $data = getRequestData();
        $id = $data['id'] ?? ('usr_' . time() . '_' . rand(100, 999));
        $name = trim($data['name'] ?? '');
        $gsk = $data['gsk'] ?? 'All';
        $email = trim($data['email'] ?? '');
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? 'password123');
        $role = $data['role'] ?? 'GskLeader';
        $status = $data['status'] ?? 'Active';

        if (empty($name) || empty($username)) {
            jsonError("Name and Username are required.");
        }

        if (!empty($email)) {
            $checkStmt = $pdo->prepare("SELECT id FROM `users` WHERE LOWER(email) = LOWER(?) AND id != ?");
            $checkStmt->execute([$email, $id]);
            if ($checkStmt->fetch()) {
                jsonError("Email already exists.", 400);
            }
        }

        $stmt = $pdo->prepare("INSERT INTO `users` (id, name, gsk, email, username, password, role, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name = VALUES(name), gsk = VALUES(gsk), email = VALUES(email), password = VALUES(password), role = VALUES(role), status = VALUES(status)");
        $stmt->execute([$id, $name, $gsk, $email, $username, $password, $role, $status]);

        jsonSuccess([
            'id' => $id,
            'name' => $name,
            'gsk' => $gsk,
            'email' => $email,
            'username' => $username,
            'role' => $role,
            'status' => $status
        ], "User account created/saved successfully.", 201);
        break;

    case 'PUT':
        $data = getRequestData();
        $id = $data['id'] ?? null;
        if (!$id) {
            jsonError("User ID is required for update.");
        }

        $fields = [];
        $params = [];

        if (isset($data['name'])) { $fields[] = "name = ?"; $params[] = trim($data['name']); }
        if (isset($data['gsk'])) { $fields[] = "gsk = ?"; $params[] = $data['gsk']; }
        if (isset($data['email'])) { $fields[] = "email = ?"; $params[] = trim($data['email']); }
        if (isset($data['username'])) { $fields[] = "username = ?"; $params[] = trim($data['username']); }
        if (!empty($data['password'])) { $fields[] = "password = ?"; $params[] = trim($data['password']); }
        if (isset($data['role'])) { $fields[] = "role = ?"; $params[] = $data['role']; }
        if (isset($data['status'])) { $fields[] = "status = ?"; $params[] = $data['status']; }

        if (empty($fields)) {
            jsonError("No fields to update.");
        }

        $params[] = $id;
        $sql = "UPDATE `users` SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        jsonSuccess($data, "User account updated successfully.");
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? (getRequestData()['id'] ?? null);
        if (!$id) {
            jsonError("User ID is required for deletion.");
        }

        $stmt = $pdo->prepare("DELETE FROM `users` WHERE id = ?");
        $stmt->execute([$id]);

        jsonSuccess(["id" => $id], "User account deleted successfully.");
        break;

    default:
        jsonError("Method not allowed", 405);
}
