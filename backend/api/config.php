<?php
/**
 * Конфигурация подключения к базе данных
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'robson_stats');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Секретный ключ для генерации токенов
define('JWT_SECRET', 'your-secret-key-change-in-production-' . date('Y'));

// Время жизни сессии (24 часа)
define('SESSION_LIFETIME', 86400);

/**
 * Подключение к базе данных
 */
function getDB(): PDO {
    static $pdo = null;
    
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    
    return $pdo;
}

/**
 * Отправка JSON-ответа
 */
function jsonResponse(mixed $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Отправка ошибки
 */
function jsonError(string $message, int $statusCode = 400): void {
    jsonResponse(['error' => true, 'message' => $message], $statusCode);
}

/**
 * Получение данных из запроса
 */
function getRequestData(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (str_contains($contentType, 'application/json')) {
        $json = file_get_contents('php://input');
        return json_decode($json, true) ?? [];
    }
    
    return array_merge($_POST, $_GET);
}

/**
 * Генерация токена сессии
 */
function generateToken(int $userId): string {
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
    
    $db = getDB();
    $stmt = $db->prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)');
    $stmt->execute([$userId, $token, $expiresAt]);
    
    return $token;
}

/**
 * Проверка токена и получение пользователя
 */
function authenticate(): ?array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (!preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        return null;
    }
    
    $token = $matches[1];
    $db = getDB();
    
    // Проверяем токен
    $stmt = $db->prepare('
        SELECT u.* FROM users u 
        JOIN sessions s ON s.user_id = u.id 
        WHERE s.token = ? AND s.expires_at > NOW()
    ');
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    
    if (!$user) {
        return null;
    }
    
    // Получаем название организации
    if ($user['organization_id']) {
        $stmt = $db->prepare('SELECT name FROM organizations WHERE id = ?');
        $stmt->execute([$user['organization_id']]);
        $org = $stmt->fetch();
        $user['organization_name'] = $org ? $org['name'] : null;
    }
    
    unset($user['password_hash']);
    return $user;
}

/**
 * Требование авторизации
 */
function requireAuth(): array {
    $user = authenticate();
    if (!$user) {
        jsonError('Необходима авторизация', 401);
    }
    return $user;
}

/**
 * Требование роли владельца организации
 */
function requireOwner(): array {
    $user = requireAuth();
    if (!in_array($user['role'], ['owner', 'superadmin'])) {
        jsonError('Недостаточно прав. Требуются права владельца организации', 403);
    }
    return $user;
}

/**
 * Проверка, что пользователь может редактировать (owner или superadmin)
 */
function canEdit($user): bool {
    return in_array($user['role'], ['owner', 'superadmin']);
}

/**
 * Проверка, что пользователь может просматривать (любая роль)
 */
function canView($user): bool {
    return in_array($user['role'], ['owner', 'observer', 'superadmin']);
}

/**
 * Требование роли суперадминистратора
 */
function requireSuperAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'superadmin') {
        jsonError('Недостаточно прав', 403);
    }
    return $user;
}

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
