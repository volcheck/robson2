<?php
/**
 * API для управления врачами
 * Доступ: владелец организации или суперадминистратор
 */
require_once __DIR__ . '/config.php';

$user = requireOwner(); // Только owner или superadmin
$data = getRequestData();
$action = $data['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    getDoctors();
    exit;
}

switch ($action) {
    case 'create':
        createDoctor($data, $user);
        break;
    case 'delete':
        deleteDoctor($data, $user);
        break;
    default:
        jsonError('Неизвестное действие');
}

function getDoctors(): void {
    $db = getDB();
    $orgId = $_GET['organization_id'] ?? null;
    
    if ($orgId) {
        $stmt = $db->prepare('SELECT * FROM doctors WHERE organization_id = ? ORDER BY full_name');
        $stmt->execute([(int)$orgId]);
    } else {
        $stmt = $db->query('SELECT * FROM doctors ORDER BY full_name');
    }
    
    $doctors = $stmt->fetchAll();
    
    foreach ($doctors as &$doc) {
        $doc['id'] = (int)$doc['id'];
        $doc['organization_id'] = (int)$doc['organization_id'];
    }
    
    jsonResponse($doctors);
}

function createDoctor(array $data, array $user): void {
    $orgId = (int)($data['organization_id'] ?? $user['organization_id'] ?? 0);
    $fullName = trim($data['full_name'] ?? '');
    $specialty = trim($data['specialty'] ?? '');
    
    if (!$orgId || empty($fullName)) {
        jsonError('Организация и ФИО обязательны');
    }
    
    // Проверяем доступ
    if ($user['role'] !== 'superadmin' && $orgId != $user['organization_id']) {
        jsonError('Нет доступа к этой организации', 403);
    }
    
    $db = getDB();
    $stmt = $db->prepare('INSERT INTO doctors (organization_id, full_name, specialty) VALUES (?, ?, ?)');
    $stmt->execute([$orgId, $fullName, $specialty]);
    
    jsonResponse(['id' => $db->lastInsertId(), 'message' => 'Врач добавлен']);
}

function deleteDoctor(array $data, array $user): void {
    $id = (int)($data['id'] ?? 0);
    
    if (!$id) {
        jsonError('ID не указан');
    }
    
    // Проверяем доступ
    if ($user['role'] !== 'superadmin') {
        $db = getDB();
        $stmt = $db->prepare('SELECT organization_id FROM doctors WHERE id = ?');
        $stmt->execute([$id]);
        $doc = $stmt->fetch();
        if (!$doc || $doc['organization_id'] != $user['organization_id']) {
            jsonError('Нет доступа', 403);
        }
    }
    
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM doctors WHERE id = ?');
    $stmt->execute([$id]);
    
    jsonResponse(['message' => 'Врач удалён']);
}
