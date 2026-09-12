<?php
/**
 * API для управления организациями
 * Доступ: только суперадминистратор
 */
require_once __DIR__ . '/config.php';

$user = requireSuperAdmin();
$data = getRequestData();
$action = $data['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    getOrganizations();
    exit;
}

switch ($action) {
    case 'create':
        createOrganization($data, $user);
        break;
    case 'update':
        updateOrganization($data);
        break;
    case 'delete':
        deleteOrganization($data);
        break;
    case 'assign_owner':
        assignOwner($data, $user);
        break;
    default:
        jsonError('Неизвестное действие');
}

function getOrganizations(): void {
    $db = getDB();
    
    // Получаем организации с информацией о владельце
    $stmt = $db->query('
        SELECT o.*, u.username as owner_username, u.id as owner_id
        FROM organizations o
        LEFT JOIN users u ON u.organization_id = o.id AND u.role = "owner"
        ORDER BY o.name
    ');
    $orgs = $stmt->fetchAll();
    
    foreach ($orgs as &$org) {
        $org['id'] = (int)$org['id'];
        if ($org['owner_id']) $org['owner_id'] = (int)$org['owner_id'];
        
        // Считаем записи
        $stmt2 = $db->prepare('SELECT COUNT(*) as cnt FROM birth_records WHERE organization_id = ?');
        $stmt2->execute([$org['id']]);
        $org['records_count'] = (int)$stmt2->fetch()['cnt'];
    }
    
    jsonResponse($orgs);
}

function createOrganization(array $data, array $user): void {
    $name = trim($data['name'] ?? '');
    
    if (empty($name)) {
        jsonError('Название организации обязательно');
    }
    
    $db = getDB();
    $stmt = $db->prepare('INSERT INTO organizations (name) VALUES (?)');
    $stmt->execute([$name]);
    
    $orgId = $db->lastInsertId();
    
    // Если указан владелец, создаём его сразу
    if (!empty($data['owner_username']) && !empty($data['owner_password'])) {
        $ownerUsername = trim($data['owner_username']);
        $ownerPassword = $data['owner_password'];
        
        if (strlen($ownerPassword) < 6) {
            jsonError('Пароль владельца должен быть не менее 6 символов');
        }
        
        // Проверяем уникальность
        $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$ownerUsername]);
        if ($stmt->fetch()) {
            jsonError('Пользователь с таким логином уже существует');
        }
        
        $hash = password_hash($ownerPassword, PASSWORD_BCRYPT);
        $stmt = $db->prepare('INSERT INTO users (username, password_hash, role, organization_id, created_by) VALUES (?, ?, "owner", ?, ?)');
        $stmt->execute([$ownerUsername, $hash, $orgId, $user['id']]);
    }
    
    jsonResponse(['id' => $orgId, 'message' => 'Организация создана']);
}

function updateOrganization(array $data): void {
    $id = (int)($data['id'] ?? 0);
    $name = trim($data['name'] ?? '');
    
    if (!$id || empty($name)) {
        jsonError('ID и название обязательны');
    }
    
    $db = getDB();
    $stmt = $db->prepare('UPDATE organizations SET name = ? WHERE id = ?');
    $stmt->execute([$name, $id]);
    
    jsonResponse(['message' => 'Организация обновлена']);
}

function deleteOrganization(array $data): void {
    $id = (int)($data['id'] ?? 0);
    
    if (!$id) {
        jsonError('ID не указан');
    }
    
    $db = getDB();
    
    // При удалении организации, пользователи становятся без организации
    $stmt = $db->prepare('UPDATE users SET organization_id = NULL WHERE organization_id = ?');
    $stmt->execute([$id]);
    
    $stmt = $db->prepare('DELETE FROM organizations WHERE id = ?');
    $stmt->execute([$id]);
    
    jsonResponse(['message' => 'Организация удалена']);
}

function assignOwner(array $data, array $currentUser): void {
    $orgId = (int)($data['organization_id'] ?? 0);
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    
    if (!$orgId || empty($username) || empty($password)) {
        jsonError('Организация, логин и пароль обязательны');
    }
    
    if (strlen($password) < 6) {
        jsonError('Пароль должен быть не менее 6 символов');
    }
    
    $db = getDB();
    
    // Проверяем, что организация существует
    $stmt = $db->prepare('SELECT id FROM organizations WHERE id = ?');
    $stmt->execute([$orgId]);
    if (!$stmt->fetch()) {
        jsonError('Организация не найдена', 404);
    }
    
    // Проверяем, нет ли уже владельца
    $stmt = $db->prepare('SELECT id, username FROM users WHERE organization_id = ? AND role = "owner"');
    $stmt->execute([$orgId]);
    $existingOwner = $stmt->fetch();
    
    if ($existingOwner) {
        jsonError('У организации уже есть владелец: ' . $existingOwner['username'] . '. Сначала удалите текущего владельца.');
    }
    
    // Проверяем уникальность логина
    $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        jsonError('Пользователь с таким логином уже существует');
    }
    
    // Создаём владельца
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare('INSERT INTO users (username, password_hash, role, organization_id, created_by) VALUES (?, ?, "owner", ?, ?)');
    $stmt->execute([$username, $hash, $orgId, $currentUser['id']]);
    
    jsonResponse(['id' => $db->lastInsertId(), 'message' => 'Владелец назначен']);
}
