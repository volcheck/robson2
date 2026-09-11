<?php
/**
 * API для управления пользователями
 */
require_once __DIR__ . '/config.php';

$user = requireAdmin();
$data = getRequestData();
$action = $data['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    getUsers($user);
    exit;
}

switch ($action) {
    case 'create':
        createUser($data, $user);
        break;
    case 'delete':
        deleteUser($data, $user);
        break;
    default:
        jsonError('Неизвестное действие');
}

function getUsers(array $currentUser): void {
    $db = getDB();
    
    if ($currentUser['role'] === 'superadmin') {
        if (isset($_GET['organization_id'])) {
            $stmt = $db->prepare('SELECT id, username, role, organization_id, created_at FROM users WHERE organization_id = ? ORDER BY username');
            $stmt->execute([(int)$_GET['organization_id']]);
        } else {
            $stmt = $db->query('SELECT id, username, role, organization_id, created_at FROM users ORDER BY username');
        }
    } else {
        $stmt = $db->prepare('SELECT id, username, role, organization_id, created_at FROM users WHERE organization_id = ? ORDER BY username');
        $stmt->execute([$currentUser['organization_id']]);
    }
    
    $users = $stmt->fetchAll();
    
    foreach ($users as &$u) {
        $u['id'] = (int)$u['id'];
        if ($u['organization_id']) $u['organization_id'] = (int)$u['organization_id'];
    }
    
    jsonResponse($users);
}

function createUser(array $data, array $currentUser): void {
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'user';
    $orgId = $data['organization_id'] ?? $currentUser['organization_id'] ?? null;
    
    if (empty($username) || empty($password)) {
        jsonError('Логин и пароль обязательны');
    }
    
    if (strlen($password) < 6) {
        jsonError('Пароль должен быть не менее 6 символов');
    }
    
    // Только суперадмин может создавать суперадминов
    if ($role === 'superadmin' && $currentUser['role'] !== 'superadmin') {
        jsonError('Недостаточно прав для создания суперадминистратора', 403);
    }
    
    // Проверяем уникальность логина
    $db = getDB();
    $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        jsonError('Пользователь с таким логином уже существует');
    }
    
    $hash = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $db->prepare('INSERT INTO users (username, password_hash, role, organization_id) VALUES (?, ?, ?, ?)');
    $stmt->execute([$username, $hash, $role, $orgId]);
    
    jsonResponse(['id' => $db->lastInsertId(), 'message' => 'Пользователь создан']);
}

function deleteUser(array $data, array $currentUser): void {
    $id = (int)($data['id'] ?? 0);
    
    if (!$id) {
        jsonError('ID не указан');
    }
    
    // Нельзя удалить себя
    if ($id === $currentUser['id']) {
        jsonError('Нельзя удалить свою учётную запись');
    }
    
    // Проверяем доступ
    if ($currentUser['role'] !== 'superadmin') {
        $db = getDB();
        $stmt = $db->prepare('SELECT organization_id, role FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $target = $stmt->fetch();
        
        if (!$target) {
            jsonError('Пользователь не найден', 404);
        }
        
        if ($target['organization_id'] != $currentUser['organization_id']) {
            jsonError('Нет доступа', 403);
        }
        
        // Админ не может удалить другого админа или суперадмина
        if (in_array($target['role'], ['admin', 'superadmin']) && $currentUser['role'] !== 'superadmin') {
            jsonError('Недостаточно прав', 403);
        }
    }
    
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    
    jsonResponse(['message' => 'Пользователь удалён']);
}
