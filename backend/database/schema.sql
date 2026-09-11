-- =====================================================
-- База данных для системы учёта статистики родов
-- Классификация Робсона
-- =====================================================

CREATE DATABASE IF NOT EXISTS robson_stats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE robson_stats;

-- =====================================================
-- Таблица организаций
-- =====================================================
CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- Таблица пользователей
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin', 'user') NOT NULL DEFAULT 'user',
    organization_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    INDEX idx_role (role),
    INDEX idx_organization (organization_id)
) ENGINE=InnoDB;

-- =====================================================
-- Таблица отделений
-- =====================================================
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_organization (organization_id)
) ENGINE=InnoDB;

-- =====================================================
-- Таблица врачей
-- =====================================================
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_organization (organization_id)
) ENGINE=InnoDB;

-- =====================================================
-- Основная таблица - записи о родах
-- =====================================================
CREATE TABLE birth_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    medical_record_number VARCHAR(50) NOT NULL COMMENT 'Номер истории родов',
    
    -- Поступление
    admission_date DATE NULL COMMENT 'Дата поступления',
    admission_time TIME NULL COMMENT 'Время поступления',
    admission_department_id INT NULL COMMENT 'Отделение поступления',
    
    -- Роды
    delivery_date DATE NULL COMMENT 'Дата родов',
    delivery_time TIME NULL COMMENT 'Время родов',
    discharge_date DATE NULL COMMENT 'Дата выписки',
    
    -- Классификация
    robson_code TINYINT NOT NULL DEFAULT 1 COMMENT 'Код по классификации Робсона (1-10)',
    
    -- Метод родоразрешения
    is_cesarean BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Кесарево сечение',
    vaginal_delivery_method ENUM('spontaneous', 'vacuum', 'forceps', '') DEFAULT '' COMMENT 'Метод при естественных родах',
    
    -- Беременность
    gestational_age_weeks TINYINT NOT NULL DEFAULT 40 COMMENT 'Срок беременности в неделях',
    
    -- Врачи
    attending_doctor_id INT NULL COMMENT 'Врач, ведущий роды',
    pathology_doctor_id INT NULL COMMENT 'Врач отделения патологии беременности',
    
    -- Анамнез
    has_uterine_scar BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Наличие рубца на матке',
    previous_cesarean_count TINYINT NOT NULL DEFAULT 0 COMMENT 'Количество предшествующих КС',
    
    -- Предлежание
    presenting_part VARCHAR(100) DEFAULT '' COMMENT 'Предлежащая часть',
    
    -- Диагноз
    clinical_diagnosis TEXT NULL COMMENT 'Полный текст клинического диагноза',
    
    -- Характер родов
    is_contracted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Контрактные роды',
    
    -- Длительность периодов
    first_stage_duration VARCHAR(20) DEFAULT '' COMMENT 'Продолжительность 1-го периода (чч:мм)',
    second_stage_duration VARCHAR(20) DEFAULT '' COMMENT 'Продолжительность 2-го периода (чч:мм)',
    waterless_period_duration VARCHAR(20) DEFAULT '' COMMENT 'Продолжительность безводного периода (чч:мм)',
    
    -- Индукция
    preinduction_method ENUM('mifepristone', 'folley', '') DEFAULT '' COMMENT 'Метод преиндукции',
    induction_method ENUM('mifepristone', 'folley', 'amniotomy', 'oxytocin', '') DEFAULT '' COMMENT 'Метод индукции',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (admission_department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (attending_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    FOREIGN KEY (pathology_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    
    INDEX idx_organization (organization_id),
    INDEX idx_delivery_date (delivery_date),
    INDEX idx_robson (robson_code),
    INDEX idx_medical_record (medical_record_number),
    INDEX idx_cesarean (is_cesarean),
    INDEX idx_vaginal_method (vaginal_delivery_method)
) ENGINE=InnoDB;

-- =====================================================
-- Таблица детей (привязана к записи о родах)
-- =====================================================
CREATE TABLE children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    birth_record_id INT NOT NULL,
    birth_date DATE NULL COMMENT 'Дата родов',
    birth_time TIME NULL COMMENT 'Время родов',
    order_number TINYINT NOT NULL DEFAULT 1 COMMENT 'Порядковый номер при многоплодной беременности',
    apgar_score VARCHAR(20) DEFAULT '' COMMENT 'Оценка по Апгар (1 мин / 5 мин)',
    blood_type ENUM('I', 'II', 'III', 'IV', '') DEFAULT '' COMMENT 'Группа крови',
    rh_factor ENUM('+', '-', '') DEFAULT '' COMMENT 'Резус-фактор',
    diagnosis TEXT NULL COMMENT 'Полный текст клинического диагноза ребёнка',
    condition_at_birth ENUM('satisfactory', 'moderate', 'severe') DEFAULT 'satisfactory' COMMENT 'Состояние при рождении',
    department_id INT NULL COMMENT 'Отделение',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (birth_record_id) REFERENCES birth_records(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_birth_record (birth_record_id)
) ENGINE=InnoDB;

-- =====================================================
-- Таблица сессий (для JWT-подобной авторизации)
-- =====================================================
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================
-- Начальные данные
-- =====================================================

-- Супер-администратор (пароль: admin123)
INSERT INTO users (username, password_hash, role) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uWByw5yW2S', 'superadmin');

-- Пример организации
INSERT INTO organizations (name) VALUES ('Родильный дом №1');

-- Пример отделений
INSERT INTO departments (organization_id, name) VALUES 
(1, 'Приёмное отделение'),
(1, 'Родовое отделение'),
(1, 'Отделение патологии беременности'),
(1, 'Послеродовое отделение'),
(1, 'Отделение новорождённых');

-- Пример врачей
INSERT INTO doctors (organization_id, full_name, specialty) VALUES 
(1, 'Иванова А.П.', 'Акушер-гинеколог'),
(1, 'Петрова М.С.', 'Акушер-гинеколог'),
(1, 'Сидорова Е.В.', 'Акушер-гинеколог');

-- Привязываем организацию к супер-админу для тестирования
UPDATE users SET organization_id = 1 WHERE id = 1;
