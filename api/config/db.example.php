<?php
// db.php 설정 예시 파일 — 실제 db.php로 복사 후 값을 채우세요
// cp api/config/db.example.php api/config/db.php

define('DB_HOST', 'localhost');
define('DB_NAME', 'oblige');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
define('DB_CHAR', 'utf8mb4');

define('JWT_SECRET', 'change_this_to_random_secret_key_minimum_32_chars');
define('JWT_EXPIRE', 3600 * 24 * 7);

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=".DB_CHAR;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}
