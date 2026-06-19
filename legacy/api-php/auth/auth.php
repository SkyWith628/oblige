<?php
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/me  (토큰 검증)

$action = $GLOBALS['ACTION'] ?? $GLOBALS['SEG'][1] ?? '';

match ([$GLOBALS['METHOD'], $action]) {
    ['POST', 'register'] => register(),
    ['POST', 'login']    => login(),
    ['GET',  'me']       => me(),
    default              => error('Not found', 404),
};

function register(): void {
    $b = body();
    $email    = trim($b['email']    ?? '');
    $password = trim($b['password'] ?? '');
    $name     = trim($b['name']     ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) error('이메일 형식이 올바르지 않습니다');
    if (strlen($password) < 8) error('비밀번호는 8자 이상이어야 합니다');
    if (empty($name)) error('이름을 입력해주세요');

    $pdo = db();
    $dup = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
    $dup->execute([$email]);
    if ($dup->fetch()) error('이미 사용 중인 이메일입니다');

    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    $ins  = $pdo->prepare(
        "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)"
    );
    $ins->execute([$email, $hash, $name]);
    $userId = (int)$pdo->lastInsertId();

    push_notification($userId, 'SYSTEM', 'OBLIGE에 오신 것을 환영합니다!',
        "{$name}님, 지금 첫 공병 반납에 도전해보세요. 🌱");

    respond(['message' => '회원가입이 완료되었습니다', 'user_id' => $userId], 201);
}

function login(): void {
    $b = body();
    $email    = trim($b['email']    ?? '');
    $password = trim($b['password'] ?? '');

    $pdo  = db();
    $stmt = $pdo->prepare(
        "SELECT u.*, g.grade_name, g.grade_icon
         FROM users u
         JOIN membership_grades g ON u.grade_id = g.grade_id
         WHERE u.email = ? AND u.is_active = 1"
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        error('이메일 또는 비밀번호가 올바르지 않습니다', 401);
    }

    $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE user_id = ?")
        ->execute([$user['user_id']]);

    $token = jwt_encode([
        'user_id' => $user['user_id'],
        'email'   => $user['email'],
        'name'    => $user['name'],
        'role'    => $user['role'],
    ]);

    respond([
        'token' => $token,
        'user'  => [
            'user_id'      => $user['user_id'],
            'email'        => $user['email'],
            'name'         => $user['name'],
            'role'         => $user['role'],
            'total_point'  => $user['total_point'],
            'total_returns'=> $user['total_returns'],
            'grade_name'   => $user['grade_name'],
            'grade_icon'   => $user['grade_icon'],
        ],
    ]);
}

function me(): void {
    $u    = auth_user();
    $pdo  = db();
    $stmt = $pdo->prepare(
        "SELECT u.user_id, u.email, u.name, u.phone, u.total_point, u.total_returns, u.role,
                g.grade_name, g.grade_icon, g.point_rate, g.benefit
         FROM users u
         JOIN membership_grades g ON u.grade_id = g.grade_id
         WHERE u.user_id = ?"
    );
    $stmt->execute([$u['user_id']]);
    respond($stmt->fetch());
}
