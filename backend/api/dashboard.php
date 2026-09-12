<?php
/**
 * API для дашборда
 */
require_once __DIR__ . '/config.php';

$user = requireAuth();

$orgId = $_GET['organization_id'] ?? $user['organization_id'] ?? null;

$db = getDB();

$where = '';
$params = [];

if ($orgId && $user['role'] !== 'superadmin') {
    $where = 'AND organization_id = ?';
    $params[] = $orgId;
} elseif ($orgId && $user['role'] === 'superadmin') {
    $where = 'AND organization_id = ?';
    $params[] = $orgId;
}

// 1. За прошедшие сутки (с 8:00 позавчера до 8:00 вчера)
$yesterdayStart = date('Y-m-d 08:00:00', strtotime('-2 days'));
$yesterdayEnd = date('Y-m-d 08:00:00', strtotime('-1 day'));

$sql = "SELECT 
    COUNT(*) as total,
    SUM(is_cesarean = 1) as cesarean,
    SUM(vaginal_delivery_method = 'vacuum') as vacuum
    FROM birth_records 
    WHERE CONCAT(delivery_date, ' ', COALESCE(delivery_time, '00:00:00')) >= ? 
    AND CONCAT(delivery_date, ' ', COALESCE(delivery_time, '23:59:59')) < ?
    $where";

$stmt = $db->prepare($sql);
$stmt->execute(array_merge([$yesterdayStart, $yesterdayEnd], $params));
$yesterday = $stmt->fetch();

// 2. За неделю (с понедельника текущей недели)
$monday = date('Y-m-d', strtotime('monday this week'));
$weekStart = $monday . ' 00:00:00';
$now = date('Y-m-d H:i:s');

$sql = "SELECT 
    COUNT(*) as total,
    SUM(is_cesarean = 1) as cesarean,
    SUM(vaginal_delivery_method = 'vacuum') as vacuum
    FROM birth_records 
    WHERE delivery_date >= ?
    AND delivery_date <= ?
    $where";

$stmt = $db->prepare($sql);
$stmt->execute(array_merge([$monday, date('Y-m-d')], $params));
$week = $stmt->fetch();

// 3. С начала месяца
$monthStart = date('Y-m-01');

$sql = "SELECT 
    COUNT(*) as total,
    SUM(is_cesarean = 1) as cesarean,
    SUM(vaginal_delivery_method = 'vacuum') as vacuum
    FROM birth_records 
    WHERE delivery_date >= ?
    AND delivery_date <= ?
    $where";

$stmt = $db->prepare($sql);
$stmt->execute(array_merge([$monthStart, date('Y-m-d')], $params));
$month = $stmt->fetch();

jsonResponse([
    'yesterday' => [
        'total' => (int)$yesterday['total'],
        'cesarean' => (int)$yesterday['cesarean'],
        'vacuum' => (int)$yesterday['vacuum'],
    ],
    'week' => [
        'total' => (int)$week['total'],
        'cesarean' => (int)$week['cesarean'],
        'vacuum' => (int)$week['vacuum'],
    ],
    'month' => [
        'total' => (int)$month['total'],
        'cesarean' => (int)$month['cesarean'],
        'vacuum' => (int)$month['vacuum'],
    ],
]);
