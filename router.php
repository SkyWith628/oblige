<?php
// PHP 내장 서버용 라우터
// 사용법: php -S localhost:8080 router.php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// /api/* 요청 → api/index.php로 라우팅 (정적 파일 체크보다 먼저!)
if (str_starts_with($uri, '/api')) {
    require __DIR__ . '/api/index.php';
    return true;
}

// 정적 파일 (html, css, js, 이미지 등) → 그냥 서빙
if ($uri !== '/' && file_exists(__DIR__ . $uri) && is_file(__DIR__ . $uri)) {
    return false;
}

// 그 외 → index.html
require __DIR__ . '/index.html';
