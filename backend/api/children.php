<?php
/**
 * API для работы с записями о детях
 */
require_once __DIR__ . '/config.php';

$user = requireAuth();
$data = getRequestData();
$action = $data['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// GET - получение списка детей
if ($method === 'GET') {
    if (isset($_GET['birth_record_id'])) {
        getChildren((int)$_GET['birth_record_id'], $user);
    } else {
        jsonError('Не указан birth_record_id');
    }
    exit;
}

// POST - создание, обновление, удаление
switch ($action) {
    case 'create':
        createChild($data, $user);
        break;
    case 'update':
        updateChild($data, $user);
        break;
    case 'delete':
        deleteChild($data, $user);
        break;
    default:
        jsonError('Неизвестное действие');
}

function getChildren(int $birthRecordId, array $user): void {
    $db = getDB();
    
    // Проверяем доступ к записи
    if ($user['role'] !== 'superadmin') {
        $stmt = $db->prepare('SELECT organization_id FROM birth_records WHERE id = ?');
        $stmt->execute([$birthRecordId]);
        $record = $stmt->fetch();
        if (!$record || $record['organization_id'] != $user['organization_id']) {
            jsonError('Нет доступа', 403);
        }
    }
    
    $stmt = $db->prepare('SELECT * FROM children WHERE birth_record_id = ? ORDER BY order_number');
    $stmt->execute([$birthRecordId]);
    $children = $stmt->fetchAll();
    
    foreach ($children as &$child) {
        $child['id'] = (int)$child['id'];
        $child['birth_record_id'] = (int)$child['birth_record_id'];
        $child['order_number'] = (int)$child['order_number'];
        if ($child['department_id']) $child['department_id'] = (int)$child['department_id'];
    }
    
    jsonResponse($children);
}

function createChild(array $data, array $user): void {
    $db = getDB();
    $birthRecordId = (int)($data['birth_record_id'] ?? 0);
    
    if (!$birthRecordId) {
        jsonError('Не указан birth_record_id');
    }
    
    // Проверяем доступ
    if ($user['role'] !== 'superadmin') {
        $stmt = $db->prepare('SELECT organization_id FROM birth_records WHERE id = ?');
        $stmt->execute([$birthRecordId]);
        $record = $stmt->fetch();
        if (!$record || $record['organization_id'] != $user['organization_id']) {
            jsonError('Нет доступа', 403);
        }
    }
    
    $sql = "INSERT INTO children (
        birth_record_id, birth_date, birth_time, order_number,
        apgar_score, blood_type, rh_factor, diagnosis,
        condition_at_birth, department_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $params = [
        $birthRecordId,
        $data['birth_date'] ?? null,
        $data['birth_time'] ?? null,
        $data['order_number'] ?? 1,
        $data['apgar_score'] ?? '',
        $data['blood_type'] ?? '',
        $data['rh_factor'] ?? '',
        $data['diagnosis'] ?? '',
        $data['condition_at_birth'] ?? 'satisfactory',
        $data['department_id'] ?? null,
    ];
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    $id = $db->lastInsertId();
    
    // Возвращаем созданную запись
    $stmt = $db->prepare('SELECT * FROM children WHERE id = ?');
    $stmt->execute([$id]);
    $child = $stmt->fetch();
    
    $child['id'] = (int)$child['id'];
    $child['birth_record_id'] = (int)$child['birth_record_id'];
    $child['order_number'] = (int)$child['order_number'];
    if ($child['department_id']) $child['department_id'] = (int)$child['department_id'];
    
    jsonResponse($child);
}

function updateChild(array $data, array $user): void {
    $db = getDB();
    $id = (int)($data['id'] ?? 0);
    
    if (!$id) {
        jsonError('ID не указан');
    }
    
    // Проверяем доступ через birth_record
    if ($user['role'] !== 'superadmin') {
        $stmt = $db->prepare('
            SELECT br.organization_id FROM children c
            JOIN birth_records br ON c.birth_record_id = br.id
            WHERE c.id = ?
        ');
        $stmt->execute([$id]);
        $record = $stmt->fetch();
        if (!$record || $record['organization_id'] != $user['organization_id']) {
            jsonError('Нет доступа', 403);
        }
    }
    
    $sql = "UPDATE children SET
        birth_date = ?, birth_time = ?, order_number = ?,
        apgar_score = ?, blood_type = ?, rh_factor = ?,
        diagnosis = ?, condition_at_birth = ?, department_id = ?
        WHERE id = ?";
    
    $params = [
        $data['birth_date'] ?? null,
        $data['birth_time'] ?? null,
        $data['order_number'] ?? 1,
        $data['apgar_score'] ?? '',
        $data['blood_type'] ?? '',
        $data['rh_factor'] ?? '',
        $data['diagnosis'] ?? '',
        $data['condition_at_birth'] ?? 'satisfactory',
        $data['department_id'] ?? null,
        $id,
    ];
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    jsonResponse(['message' => 'Запись обновлена']);
}

function deleteChild(array $data, array $user): void {
    $db = getDB();
    $id = (int)($data['id'] ?? 0);
    
    if (!$id) {
        jsonError('ID не указан');
    }
    
    // Проверяем доступ
    if ($user['role'] !== 'superadmin') {
        $stmt = $db->prepare('
            SELECT br.organization_id FROM children c
            JOIN birth_records br ON c.birth_record_id = br.id
            WHERE c.id = ?
        ');
        $stmt->execute([$id]);
        $record = $stmt->fetch();
        if (!$record || $record['organization_id'] != $user['organization_id']) {
            jsonError('Нет доступа', 403);
        }
    }
    
    $stmt = $db->prepare('DELETE FROM children WHERE id = ?');
    $stmt->execute([$id]);
    
    jsonResponse(['message' => 'Запись удалена']);
}
