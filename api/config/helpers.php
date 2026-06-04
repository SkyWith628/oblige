<?php
require_once __DIR__ . '/db.php';

// ── JSON 응답 ──────────────────────────────────────────────
function respond(mixed $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function error(string $msg, int $code = 400): void {
    respond(['error' => $msg], $code);
}

// ── JWT (서명 기반 간단 구현) ──────────────────────────────
function jwt_encode(array $payload): string {
    $header  = base64url(json_encode(['alg'=>'HS256','typ'=>'JWT']));
    $payload['exp'] = time() + JWT_EXPIRE;
    $body    = base64url(json_encode($payload));
    $sig     = base64url(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    return "$header.$body.$sig";
}

function jwt_decode(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $body, $sig] = $parts;
    $expected = base64url(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(base64_decode(strtr($body, '-_', '+/')), true);
    if (!$payload || $payload['exp'] < time()) return null;
    return $payload;
}

function base64url(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

// ── 인증 미들웨어 ──────────────────────────────────────────
function auth_user(): array {
    $h = $_SERVER['HTTP_AUTHORIZATION']
      ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
      ?? '';
    // PHP 내장 서버 / Apache 일부 환경 폴백
    if (!$h && function_exists('getallheaders')) {
        $headers = array_change_key_case(getallheaders(), CASE_LOWER);
        $h = $headers['authorization'] ?? '';
    }
    if (!str_starts_with($h, 'Bearer ')) error('Unauthorized', 401);
    $payload = jwt_decode(substr($h, 7));
    if (!$payload) error('Token expired or invalid', 401);
    return $payload;
}

function auth_admin(): array {
    $user = auth_user();
    if ($user['role'] !== 'ADMIN') error('Forbidden', 403);
    return $user;
}

// ── 포인트 지급/차감 (트랜잭션) ────────────────────────────
function give_point(int $userId, int $amount, string $source, ?int $refId, string $reason): void {
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE users SET total_point = total_point + ? WHERE user_id = ?")
            ->execute([$amount, $userId]);
        $balance = $pdo->prepare("SELECT total_point FROM users WHERE user_id = ?");
        $balance->execute([$userId]);
        $after = (int)$balance->fetchColumn();

        $pdo->prepare("INSERT INTO point_transactions (user_id,point_type,amount,balance_after,source,ref_id,reason)
                       VALUES (?,?,?,?,?,?,?)")
            ->execute([$userId, 'EARN', $amount, $after, $source, $refId, $reason]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function use_point(int $userId, int $amount, string $source, ?int $refId, string $reason): void {
    $pdo = db();
    $row = $pdo->prepare("SELECT total_point FROM users WHERE user_id = ?");
    $row->execute([$userId]);
    $current = (int)$row->fetchColumn();
    if ($current < $amount) error('포인트가 부족합니다');

    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE users SET total_point = total_point - ? WHERE user_id = ?")
            ->execute([$amount, $userId]);
        $after = $current - $amount;
        $pdo->prepare("INSERT INTO point_transactions (user_id,point_type,amount,balance_after,source,ref_id,reason)
                       VALUES (?,?,?,?,?,?,?)")
            ->execute([$userId, 'USE', $amount, $after, $source, $refId, $reason]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// ── 등급 자동 갱신 ─────────────────────────────────────────
function recalc_grade(int $userId): void {
    $pdo = db();
    $stmt = $pdo->prepare("SELECT total_returns FROM users WHERE user_id = ?");
    $stmt->execute([$userId]);
    $returns = (int)$stmt->fetchColumn();

    $grade = $pdo->prepare(
        "SELECT grade_id FROM membership_grades
         WHERE min_return_count <= ? ORDER BY min_return_count DESC LIMIT 1"
    );
    $grade->execute([$returns]);
    $gradeId = (int)$grade->fetchColumn();

    $pdo->prepare("UPDATE users SET grade_id = ? WHERE user_id = ?")
        ->execute([$gradeId, $userId]);
}

// ── 알림 생성 ──────────────────────────────────────────────
function push_notification(int $userId, string $type, string $title, string $msg, ?int $refId = null): void {
    db()->prepare(
        "INSERT INTO notifications (user_id,noti_type,title,message,ref_id) VALUES (?,?,?,?,?)"
    )->execute([$userId, $type, $title, $msg, $refId]);
}

// ── 주문번호 / 반납번호 생성 ───────────────────────────────
function gen_order_number(): string {
    return 'ORD-' . date('Ymd') . '-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
}

function gen_return_number(): string {
    return 'RET-' . date('Ymd') . '-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
}

// ── 요청 바디 파싱 ─────────────────────────────────────────
function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}
