#!/bin/bash
# Скрипт установки системы учёта статистики родов (классификация Робсона)
# Для Ubuntu 20.04+ / 22.04+

set -e

echo "========================================="
echo " Установка системы Классификация Робсона"
echo "========================================="

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
   echo "Этот скрипт должен быть запущен с правами root (sudo)"
   exit 1
fi

echo -e "${YELLOW}[1/7] Установка зависимостей...${NC}"
apt update
apt install -y apache2 php8.1 php8.1-mysql php8.1-mbstring php8.1-xml \
    mysql-server nodejs npm

# Включение модулей Apache
a2enmod rewrite
a2enmod headers

echo -e "${YELLOW}[2/7] Настройка MySQL...${NC}"
echo "Введите пароль для root пользователя MySQL:"
read -s MYSQL_ROOT_PASS

mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASS}';"

echo -e "${YELLOW}[3/7] Создание базы данных...${NC}"
mysql -u root -p${MYSQL_ROOT_PASS} < backend/database/schema.sql

echo -e "${YELLOW}[4/7] Настройка конфигурации PHP...${NC}"
read -p "Имя пользователя MySQL [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -p "Имя базы данных [robson_stats]: " DB_NAME
DB_NAME=${DB_NAME:-robson_stats}

read -p "Пароль MySQL: " -s DB_PASS
echo ""

# Обновляем конфиг
cat > backend/api/config.php << PHPEOF
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', '${DB_NAME}');
define('DB_USER', '${DB_USER}');
define('DB_PASS', '${DB_PASS}');
define('DB_CHARSET', 'utf8mb4');
define('JWT_SECRET', '$(openssl rand -hex 32)');
define('SESSION_LIFETIME', 86400);

function getDB(): PDO {
    static \$pdo = null;
    if (\$pdo === null) {
        \$dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
        \$pdo = new PDO(\$dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return \$pdo;
}

function jsonResponse(mixed \$data, int \$statusCode = 200): void {
    http_response_code(\$statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(\$data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string \$message, int \$statusCode = 400): void {
    jsonResponse(['error' => true, 'message' => \$message], \$statusCode);
}

function getRequestData(): array {
    \$contentType = \$_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains(\$contentType, 'application/json')) {
        \$json = file_get_contents('php://input');
        return json_decode(\$json, true) ?? [];
    }
    return array_merge(\$_POST, \$_GET);
}

function generateToken(int \$userId): string {
    \$token = bin2hex(random_bytes(32));
    \$expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
    \$db = getDB();
    \$stmt = \$db->prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)');
    \$stmt->execute([\$userId, \$token, \$expiresAt]);
    return \$token;
}

function authenticate(): ?array {
    \$authHeader = \$_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/', \$authHeader, \$matches)) return null;
    \$token = \$matches[1];
    \$db = getDB();
    \$stmt = \$db->prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > NOW()');
    \$stmt->execute([\$token]);
    \$user = \$stmt->fetch();
    if (!\$user) return null;
    if (\$user['organization_id']) {
        \$stmt = \$db->prepare('SELECT name FROM organizations WHERE id = ?');
        \$stmt->execute([\$user['organization_id']]);
        \$org = \$stmt->fetch();
        \$user['organization_name'] = \$org ? \$org['name'] : null;
    }
    unset(\$user['password_hash']);
    return \$user;
}

function requireAuth(): array {
    \$user = authenticate();
    if (!\$user) jsonError('Необходима авторизация', 401);
    return \$user;
}

function requireAdmin(): array {
    \$user = requireAuth();
    if (!in_array(\$user['role'], ['admin', 'superadmin'])) jsonError('Недостаточно прав', 403);
    return \$user;
}

function requireSuperAdmin(): array {
    \$user = requireAuth();
    if (\$user['role'] !== 'superadmin') jsonError('Недостаточно прав', 403);
    return \$user;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
PHPEOF

echo -e "${YELLOW}[5/7] Сборка фронтенда...${NC}"
npm install
npm run build

echo -e "${YELLOW}[6/7] Развёртывание файлов...${NC}"
mkdir -p /var/www/robson
cp -r dist/* /var/www/robson/
cp -r backend/api /var/www/robson/api
chown -R www-data:www-data /var/www/robson
chmod -R 755 /var/www/robson
chmod -R 750 /var/www/robson/api

echo -e "${YELLOW}[7/7] Настройка Apache...${NC}"
cat > /etc/apache2/sites-available/robson.conf << APACHEEOF
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/robson
    
    <Directory /var/www/robson>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    <Directory /var/www/robson/api>
        Options -Indexes
        AllowOverride All
        Require all granted
        <FilesMatch \.php$>
            SetHandler application/x-httpd-php
        </FilesMatch>
    </Directory>
    
    Alias /api /var/www/robson/api
    
    ErrorLog \${APACHE_LOG_DIR}/robson_error.log
    CustomLog \${APACHE_LOG_DIR}/robson_access.log combined
</VirtualHost>
APACHEEOF

a2ensite robson
systemctl reload apache2

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN} Установка завершена успешно!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Доступ к системе: http://$(hostname -I | awk '{print $1}')/"
echo ""
echo "Учётные данные по умолчанию:"
echo "  Логин: admin"
echo "  Пароль: admin123"
echo ""
echo -e "${YELLOW}ВАЖНО: Смените пароль после первого входа!${NC}"
echo ""
