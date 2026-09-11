<?php
/**
 * API для работы с записями о родах
 */
require_once __DIR__ . '/config.php';

$user = requireAuth();
$data = getRequestData();
$action = $data['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// GET - получение списка или одной записи
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        getRecord((int)$_GET['id'], $user);
    } else {
        getRecords($user);
    }
    exit;
}

// POST - создание, обновление, удаление
switch ($action) {
    case 'create':
        createRecord($data, $user);
        break;
    case 'update':
        updateRecord($data, $user);
        break;
    case 'delete':
        deleteRecord($data, $user);
        break;
    default:
        jsonError('Неизвестное действие');
}

function getRecords(array $user): void {
    $db = getDB();
    
    $where = [];
    $params = [];
    
    // Фильтр по организации
    if ($user['role'] !== 'superadmin') {
        $where[] = 'br.organization_id = ?';
        $params[] = $user['organization_id'];
    } elseif (isset($_GET['organization_id'])) {
        $where[] = 'br.organization_id = ?';
        $params[] = (int)$_GET['organization_id'];
    }
    
    // Поиск по номеру истории
    if (!empty($_GET['search'])) {
        $where[] = 'br.medical_record_number LIKE ?';
        $params[] = '%' . $_GET['search'] . '%';
    }
    
    // Фильтр по группе Робсона
    if (!empty($_GET['robson_code'])) {
        $where[] = 'br.robson_code = ?';
        $params[] = (int)$_GET['robson_code'];
    }
    
    // Фильтр по методу родоразрешения
    if (isset($_GET['is_cesarean']) && $_GET['is_cesarean'] !== '') {
        $where[] = 'br.is_cesarean = ?';
        $params[] = (int)$_GET['is_cesarean'];
    }
    
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    
    $sql = "SELECT br.*, 
            d.name as department_name,
            doc.full_name as doctor_name
            FROM birth_records br
            LEFT JOIN departments d ON br.admission_department_id = d.id
            LEFT JOIN doctors doc ON br.attending_doctor_id = doc.id
            $whereClause
            ORDER BY br.delivery_date DESC, br.delivery_time DESC
            LIMIT 500";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll();
    
    // Преобразуем булевы поля
    foreach ($records as &$record) {
        $record['is_cesarean'] = (bool)$record['is_cesarean'];
        $record['has_uterine_scar'] = (bool)$record['has_uterine_scar'];
        $record['is_contracted'] = (bool)$record['is_contracted'];
        $record['robson_code'] = (int)$record['robson_code'];
        $record['gestational_age_weeks'] = (int)$record['gestational_age_weeks'];
        $record['previous_cesarean_count'] = (int)$record['previous_cesarean_count'];
        $record['id'] = (int)$record['id'];
        $record['organization_id'] = (int)$record['organization_id'];
    }
    
    jsonResponse($records);
}

function getRecord(int $id, array $user): void {
    $db = getDB();
    
    $sql = "SELECT br.* FROM birth_records br WHERE br.id = ?";
    $params = [$id];
    
    if ($user['role'] !== 'superadmin') {
        $sql .= " AND br.organization_id = ?";
        $params[] = $user['organization_id'];
    }
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $record = $stmt->fetch();
    
    if (!$record) {
        jsonError('Запись не найдена', 404);
    }
    
    // Преобразуем типы
    $record['is_cesarean'] = (bool)$record['is_cesarean'];
    $record['has_uterine_scar'] = (bool)$record['has_uterine_scar'];
    $record['is_contracted'] = (bool)$record['is_contracted'];
    $record['robson_code'] = (int)$record['robson_code'];
    $record['gestational_age_weeks'] = (int)$record['gestational_age_weeks'];
    $record['previous_cesarean_count'] = (int)$record['previous_cesarean_count'];
    $record['id'] = (int)$record['id'];
    $record['organization_id'] = (int)$record['organization_id'];
    if ($record['admission_department_id']) $record['admission_department_id'] = (int)$record['admission_department_id'];
    if ($record['attending_doctor_id']) $record['attending_doctor_id'] = (int)$record['attending_doctor_id'];
    if ($record['pathology_doctor_id']) $record['pathology_doctor_id'] = (int)$record['pathology_doctor_id'];
    
    // Получаем детей
    $stmt = $db->prepare('SELECT * FROM children WHERE birth_record_id = ? ORDER BY order_number');
    $stmt->execute([$id]);
    $children = $stmt->fetchAll();
    
    foreach ($children as &$child) {
        $child['id'] = (int)$child['id'];
        $child['birth_record_id'] = (int)$child['birth_record_id'];
        $child['order_number'] = (int)$child['order_number'];
        if ($child['department_id']) $child['department_id'] = (int)$child['department_id'];
    }
    
    $record['children'] = $children;
    
    jsonResponse($record);
}

function createRecord(array $data, array $user): void {
    $db = getDB();
    
    $orgId = $user['organization_id'] ?? ($data['organization_id'] ?? null);
    if (!$orgId) {
        jsonError('Организация не указана');
    }
    
    $sql = "INSERT INTO birth_records (
        organization_id, medical_record_number, admission_date, admission_time,
        admission_department_id, delivery_date, delivery_time, discharge_date,
        robson_code, is_cesarean, vaginal_delivery_method, gestational_age_weeks,
        attending_doctor_id, pathology_doctor_id, has_uterine_scar,
        previous_cesarean_count, presenting_part, clinical_diagnosis,
        is_contracted, first_stage_duration, second_stage_duration,
        waterless_period_duration, preinduction_method, induction_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $params = [
        $orgId,
        $data['medical_record_number'] ?? '',
        $data['admission_date'] ?? null,
        $data['admission_time'] ?? null,
        $data['admission_department_id'] ?? null,
        $data['delivery_date'] ?? null,
        $data['delivery_time'] ?? null,
        $data['discharge_date'] ?? null,
        $data['robson_code'] ?? 1,
        !empty($data['is_cesarean']) ? 1 : 0,
        $data['vaginal_delivery_method'] ?? '',
        $data['gestational_age_weeks'] ?? 40,
        $data['attending_doctor_id'] ?? null,
        $data['pathology_doctor_id'] ?? null,
        !empty($data['has_uterine_scar']) ? 1 : 0,
        $data['previous_cesarean_count'] ?? 0,
        $data['presenting_part'] ?? '',
        $data['clinical_diagnosis'] ?? '',
        !empty($data['is_contracted']) ? 1 : 0,
        $data['first_stage_duration'] ?? '',
        $data['second_stage_duration'] ?? '',
        $data['waterless_period_duration'] ?? '',
        $data['preinduction_method'] ?? '',
        $data['induction_method'] ?? '',
    ];
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    $id = $db->lastInsertId();
    
    // Сохраняем детей, если есть
    if (!empty($data['children']) && is_array($data['children'])) {
        foreach ($data['children'] as $child) {
            saveChild($db, $id, $child);
        }
    }
    
    jsonResponse(['id' => $id, 'message' => 'Запись создана']);
}

function updateRecord(array $data, array $user): void {
    $db = getDB();
    $id = (int)($data['id'] ?? 0);
    
    if (!$id) {
        jsonError('ID записи не указан');
    }
    
    // Проверяем доступ
    if ($user['role'] !== 'superadmin') {
        $stmt = $db->prepare('SELECT organization_id FROM birth_records WHERE id = ?');
        $stmt->execute([$id]);
        $record = $stmt->fetch();
        if (!$record || $record['organization_id'] != $user['organization_id']) {
            jsonError('Нет доступа к этой записи', 403);
        }
    }
    
    $sql = "UPDATE birth_records SET
        medical_record_number = ?, admission_date = ?, admission_time = ?,
        admission_department_id = ?, delivery_date = ?, delivery_time = ?,
        discharge_date = ?, robson_code = ?, is_cesarean = ?,
        vaginal_delivery_method = ?, gestational_age_weeks = ?,
        attending_doctor_id = ?, pathology_doctor_id = ?,
        has_uterine_scar = ?, previous_cesarean_count = ?,
        presenting_part = ?, clinical_diagnosis = ?,
        is_contracted = ?, first_stage_duration = ?,
        second_stage_duration = ?, waterless_period_duration = ?,
        preinduction_method = ?, induction_method = ?
        WHERE id = ?";
    
    $params = [
        $data['medical_record_number'] ?? '',
        $data['admission_date'] ?? null,
        $data['admission_time'] ?? null,
        $data['admission_department_id'] ?? null,
        $data['delivery_date'] ?? null,
        $data['delivery_time'] ?? null,
        $data['discharge_date'] ?? null,
        $data['robson_code'] ?? 1,
        !empty($data['is_cesarean']) ? 1 : 0,
        $data['vaginal_delivery_method'] ?? '',
        $data['gestational_age_weeks'] ?? 40,
        $data['attending_doctor_id'] ?? null,
        $data['pathology_doctor_id'] ?? null,
        !empty($data['has_uterine_scar']) ? 1 : 0,
        $data['previous_cesarean_count'] ?? 0,
        $data['presenting_part'] ?? '',
        $data['clinical_diagnosis'] ?? '',
        !empty($data['is_contracted']) ? 1 : 0,
        $data['first_stage_duration'] ?? '',
        $data['second_stage_duration'] ?? '',
        $data['waterless_period_duration'] ?? '',
        $data['preinduction_method'] ?? '',
        $data['induction_method'] ?? '',
        $id,
    ];
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    jsonResponse(['message' => 'Запись обновлена']);
}

function deleteRecord(array $data, array $user): void {
    $db = getDB();
    $id = (int)($data['id'] ?? 0);
    
    if (!$id) {
        jsonError('ID записи не указан');
    }
    
    // Проверяем доступ
    if ($user['role'] !== 'superadmin') {
        $stmt = $db->prepare('SELECT organization_id FROM birth_records WHERE id = ?');
        $stmt->execute([$id]);
        $record = $stmt->fetch();
        if (!$record || $record['organization_id'] != $user['organization_id']) {
            jsonError('Нет доступа к этой записи', 403);
        }
    }
    
    $stmt = $db->prepare('DELETE FROM birth_records WHERE id = ?');
    $stmt->execute([$id]);
    
    jsonResponse(['message' => 'Запись удалена']);
}

function saveChild(PDO $db, int $birthRecordId, array $child): void {
    $sql = "INSERT INTO children (
        birth_record_id, birth_date, birth_time, order_number,
        apgar_score, blood_type, rh_factor, diagnosis,
        condition_at_birth, department_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $params = [
        $birthRecordId,
        $child['birth_date'] ?? null,
        $child['birth_time'] ?? null,
        $child['order_number'] ?? 1,
        $child['apgar_score'] ?? '',
        $child['blood_type'] ?? '',
        $child['rh_factor'] ?? '',
        $child['diagnosis'] ?? '',
        $child['condition_at_birth'] ?? 'satisfactory',
        $child['department_id'] ?? null,
    ];
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
}
