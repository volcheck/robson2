<?php
/**
 * API для управления организациями
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
        createOrganization($data);
        break;
    case 'update':
        updateOrganization($data);
        break;
    default:
        jsonError('Неизвестное действие');
}

function getOrganizations(): void {
    $db = getDB();
    $stmt = $db->query('SELECT * FROM organizations ORDER BY name');
    $orgs = $stmt->fetchAll();
    
    foreach ($orgs as &$org) {
        $org['id'] = (int)$org['id'];
    }
    
    jsonResponse($orgs);
}

function createOrganization(array $data): void {
    $name = trim($data['name'] ?? '');
    
    if (empty($name)) {
        jsonError('Название организации обязательно');
    }
    
    $db = getDB();
    $stmt = $db->prepare('INSERT INTO organizations (name) VALUES (?)');
    $stmt->execute([$name]);
    
    jsonResponse(['id' => $db->lastInsertId(), 'message' => 'Организация создана']);
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
