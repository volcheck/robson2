<?php
/**
 * API авторизации
 */
require_once __DIR__ . '/config.php';

$data = getRequestData();
$action = $data['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin($data);
        break;
    case 'change_password':
        handleChangePassword($data);
        break;
    default:
        jsonError('Неизвестное действие');
}

function handleLogin(array $data): void {
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        jsonError('Логин и пароль обязательны');
    }
    
    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonError('Неверный логин или пароль', 401);
    }
    
    // Генерируем токен
    $token = generateToken($user['id']);
    
    // Получаем название организации
    $orgName = null;
    if ($user['organization_id']) {
        $stmt = $db->prepare('SELECT name FROM organizations WHERE id = ?');
        $stmt->execute([$user['organization_id']]);
        $org = $stmt->fetch();
        $orgName = $org ? $org['name'] : null;
    }
    
    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'organization_id' => $user['organization_id'],
            'organization_name' => $orgName,
        ]
    ]);
}

function handleChangePassword(array $data): void {
    $user = requireAuth();
    
    $oldPassword = $data['old_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';
    
    if (empty($oldPassword) || empty($newPassword)) {
        jsonError('Все поля обязательны');
    }
    
    if (strlen($newPassword) < 6) {
        jsonError('Пароль должен быть не менее 6 символов');
    }
    
    $db = getDB();
    $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();
    
    if (!password_verify($oldPassword, $row['password_hash'])) {
        jsonError('Неверный текущий пароль');
    }
    
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $stmt->execute([$hash, $user['id']]);
    
    jsonResponse(['message' => 'Пароль успешно изменён']);
}
