<?php
/**
 * Точка входа для API
 * Перенаправляет запросы к соответствующим обработчикам
 */

// Включаем отображение ошибок для разработки
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Получаем путь из URL
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Убираем /api/ из пути
$path = preg_replace('#^/api/#', '', $path);
$path = trim($path, '/');

// Маппинг маршрутов
$routes = [
    'auth' => 'auth.php',
    'births' => 'births.php',
    'children' => 'children.php',
    'dashboard' => 'dashboard.php',
    'organizations' => 'organizations.php',
    'departments' => 'departments.php',
    'doctors' => 'doctors.php',
    'users' => 'users.php',
];

// Находим нужный обработчик
$handler = null;
foreach ($routes as $prefix => $file) {
    if ($path === $prefix || str_starts_with($path, $prefix . '/') || str_starts_with($path, $prefix . '?')) {
        $handler = $file;
        break;
    }
}

if ($handler) {
    require_once __DIR__ . '/' . $handler;
} else {
    http_response_code(404);
    echo json_encode(['error' => true, 'message' => 'Маршрут не найден']);
}
