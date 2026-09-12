<?php
/**
 * API для управления отделениями
 * Доступ: владелец организации или суперадминистратор
 */
require_once __DIR__ . '/config.php';

$user = requireOwner(); // Только owner или superadmin
$data = getRequestData();
$action = $data['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    getDepartments();
    exit;
}

switch ($action) {
    case 'create':
        createDepartment($data, $user);
        break;
    case 'delete':
        deleteDepartment($data, $user);
        break;
    default:
        jsonError('Неизвестное действие');
}

function getDepartments(): void {
    $db = getDB();
    $orgId = $_GET['organization_id'] ?? null;
    
    if ($orgId) {
        $stmt = $db->prepare('SELECT * FROM departments WHERE organization_id = ? ORDER BY name');
        $stmt->execute([(int)$orgId]);
    } else {
        $stmt = $db->query('SELECT * FROM departments ORDER BY name');
    }
    
    $departments = $stmt->fetchAll();
    
    foreach ($departments as &$dept) {
        $dept['id'] = (int)$dept['id'];
        $dept['organization_id'] = (int)$dept['organization_id'];
    }
    
    jsonResponse($departments);
}

function createDepartment(array $data, array $user): void {
    $orgId = (int)($data['organization_id'] ?? $user['organization_id'] ?? 0);
    $name = trim($data['name'] ?? '');
    
    if (!$orgId || empty($name)) {
        jsonError('Организация и название обязательны');
    }
    
    // Проверяем доступ
    if ($user['role'] !== 'superadmin' && $orgId != $user['organization_id']) {
        jsonError('Нет доступа к этой организации', 403);
    }
    
    $db = getDB();
    $stmt = $db->prepare('INSERT INTO departments (organization_id, name) VALUES (?, ?)');
    $stmt->execute([$orgId, $name]);
    
    jsonResponse(['id' => $db->lastInsertId(), 'message' => 'Отделение создано']);
}

function deleteDepartment(array $data, array $user): void {
    $id = (int)($data['id'] ?? 0);
    
    if (!$id) {
        jsonError('ID не указан');
    }
    
    // Проверяем доступ
    if ($user['role'] !== 'superadmin') {
        $db = getDB();
        $stmt = $db->prepare('SELECT organization_id FROM departments WHERE id = ?');
        $stmt->execute([$id]);
        $dept = $stmt->fetch();
        if (!$dept || $dept['organization_id'] != $user['organization_id']) {
            jsonError('Нет доступа', 403);
        }
    }
    
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM departments WHERE id = ?');
    $stmt->execute([$id]);
    
    jsonResponse(['message' => 'Отделение удалено']);
}
