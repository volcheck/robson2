<?php
/**
 * API для управления пользователями
 * - Суперадминистратор: создаёт организации и назначает владельцев
 * - Владелец: создаёт наблюдателей своей организации
 * - Наблюдатель: нет доступа
 */
require_once __DIR__ . '/config.php';

$user = requireAuth();
$data = getRequestData();
$action = $data['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Наблюдатель не может управлять пользователями
if ($user['role'] === 'observer') {
    jsonError('Недостаточно прав', 403);
}

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
        // Суперадмин видит всех пользователей
        if (isset($_GET['organization_id'])) {
            $stmt = $db->prepare('SELECT id, username, role, organization_id, created_at FROM users WHERE organization_id = ? ORDER BY username');
            $stmt->execute([(int)$_GET['organization_id']]);
        } else {
            $stmt = $db->query('SELECT id, username, role, organization_id, created_at FROM users ORDER BY username');
        }
    } else {
        // Владелец видит только пользователей своей организации
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
    $role = $data['role'] ?? 'observer';
    $orgId = $data['organization_id'] ?? $currentUser['organization_id'] ?? null;
    
    if (empty($username) || empty($password)) {
        jsonError('Логин и пароль обязательны');
    }
    
    if (strlen($password) < 6) {
        jsonError('Пароль должен быть не менее 6 символов');
    }
    
    // Проверка прав на создание ролей
    if ($currentUser['role'] === 'owner') {
        // Владелец может создавать только наблюдателей
        if ($role !== 'observer') {
            jsonError('Владелец может создавать только наблюдателей', 403);
        }
        // И только для своей организации
        if ($orgId != $currentUser['organization_id']) {
            jsonError('Нет доступа к этой организации', 403);
        }
    }
    
    if ($currentUser['role'] === 'superadmin') {
        // Суперадмин может создавать только владельцев (наблюдателей создаёт владелец)
        if ($role !== 'owner') {
            jsonError('Суперадминистратор создаёт только владельцев организаций', 403);
        }
    }
    
    // Проверяем уникальность логина
    $db = getDB();
    $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        jsonError('Пользователь с таким логином уже существует');
    }
    
    // Проверяем, что у организации ещё нет владельца (если создаём владельца)
    if ($role === 'owner' && $orgId) {
        $stmt = $db->prepare('SELECT id, username FROM users WHERE organization_id = ? AND role = "owner"');
        $stmt->execute([$orgId]);
        $existingOwner = $stmt->fetch();
        if ($existingOwner) {
            jsonError('У организации уже есть владелец: ' . $existingOwner['username']);
        }
    }
    
    $hash = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $db->prepare('INSERT INTO users (username, password_hash, role, organization_id, created_by) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$username, $hash, $role, $orgId, $currentUser['id']]);
    
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
    
    // Нельзя удалить суперадмина
    $db = getDB();
    $stmt = $db->prepare('SELECT role, organization_id FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $target = $stmt->fetch();
    
    if (!$target) {
        jsonError('Пользователь не найден', 404);
    }
    
    if ($target['role'] === 'superadmin') {
        jsonError('Нельзя удалить суперадминистратора', 403);
    }
    
    // Проверяем доступ
    if ($currentUser['role'] === 'owner') {
        // Владелец может удалять только наблюдателей своей организации
        if ($target['role'] !== 'observer') {
            jsonError('Владелец может удалять только наблюдателей', 403);
        }
        if ($target['organization_id'] != $currentUser['organization_id']) {
            jsonError('Нет доступа', 403);
        }
    }
    
    $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    
    jsonResponse(['message' => 'Пользователь удалён']);
}
