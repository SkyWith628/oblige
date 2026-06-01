<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config/helpers.php';

// ── 라우터 ─────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = preg_replace('#^/api#', '', $uri); // /api 프리픽스 제거
$seg    = explode('/', trim($uri, '/'));      // ['auth','login']

$resource = $seg[0] ?? '';
$id       = isset($seg[1]) && is_numeric($seg[1]) ? (int)$seg[1] : null;
$action   = $id !== null ? ($seg[2] ?? null) : ($seg[1] ?? null);

$routes = [
    'auth'          => 'auth/auth.php',
    'products'      => 'products/products.php',
    'cart'          => 'orders/cart.php',
    'orders'        => 'orders/orders.php',
    'returns'       => 'returns/returns.php',
    'points'        => 'points/points.php',
    'refill'        => 'refill/refill.php',
    'campaigns'     => 'campaigns/campaigns.php',
    'notifications' => 'notifications/notifications.php',
    'user'          => 'user/user.php',
    'admin'         => 'admin/admin.php',
];

if (!array_key_exists($resource, $routes)) {
    respond(['message' => 'OBLIGE API v1.0', 'status' => 'ok']);
}

$GLOBALS['METHOD'] = $method;
$GLOBALS['ID']     = $id;
$GLOBALS['ACTION'] = $action;
$GLOBALS['SEG']    = $seg;

require_once __DIR__ . '/' . $routes[$resource];
