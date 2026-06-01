<?php
// GET    /api/user/mypage          마이페이지 종합
// GET    /api/user/esg             내 ESG 임팩트
// PUT    /api/user/profile         개인정보 수정
// PUT    /api/user/password        비밀번호 변경
// DELETE /api/user                 탈퇴
// GET    /api/user/addresses       배송지 목록
// POST   /api/user/addresses       배송지 추가
// DELETE /api/user/addresses/:id   배송지 삭제

$method = $GLOBALS['METHOD'];
$seg    = $GLOBALS['SEG'];
$res    = $seg[1] ?? '';
$id     = isset($seg[2]) && is_numeric($seg[2]) ? (int)$seg[2] : null;
$u      = auth_user();

match (true) {
    $res === 'mypage'     && $method === 'GET'    => mypage($u),
    $res === 'esg'        && $method === 'GET'    => esg_impact($u),
    $res === 'profile'    && $method === 'PUT'    => update_profile($u),
    $res === 'password'   && $method === 'PUT'    => change_password($u),
    $res === 'addresses'  && $method === 'GET'    => list_addresses($u),
    $res === 'addresses'  && $method === 'POST'   => add_address($u),
    $res === 'addresses'  && $method === 'DELETE' && $id !== null => delete_address($u, $id),
    $method === 'DELETE'  && $res === ''          => withdraw($u),
    default => error('Not found', 404),
};

function mypage(array $u): void {
    $pdo  = db();
    $uid  = $u['user_id'];

    // 기본 정보
    $info = $pdo->prepare(
        "SELECT u.user_id, u.name, u.email, u.phone, u.total_point, u.total_returns,
                g.grade_name, g.grade_icon, g.point_rate, g.benefit,
                (SELECT grade_name FROM membership_grades WHERE min_return_count > u.total_returns ORDER BY min_return_count LIMIT 1) AS next_grade,
                (SELECT min_return_count FROM membership_grades WHERE min_return_count > u.total_returns ORDER BY min_return_count LIMIT 1) AS next_grade_at
         FROM users u JOIN membership_grades g ON u.grade_id=g.grade_id
         WHERE u.user_id=?"
    );
    $info->execute([$uid]);
    $user = $info->fetch();

    // 최근 주문 3건
    $orders = $pdo->prepare(
        "SELECT order_id, order_number, final_price, order_status, created_at
         FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 3"
    );
    $orders->execute([$uid]);
    $user['recent_orders'] = $orders->fetchAll();

    // 최근 반납 3건
    $rets = $pdo->prepare(
        "SELECT return_id, return_number, return_status, total_quantity, total_point, created_at
         FROM empty_bottle_returns WHERE user_id=? ORDER BY created_at DESC LIMIT 3"
    );
    $rets->execute([$uid]);
    $user['recent_returns'] = $rets->fetchAll();

    // 캠페인 참여 수
    $camp = $pdo->prepare("SELECT COUNT(*) FROM campaign_participants WHERE user_id=?");
    $camp->execute([$uid]);
    $user['campaign_count'] = (int)$camp->fetchColumn();

    respond($user);
}

function esg_impact(array $u): void {
    $pdo  = db();
    $stmt = $pdo->prepare("SELECT total_returns FROM users WHERE user_id=?");
    $stmt->execute([$u['user_id']]);
    $total = (int)$stmt->fetchColumn();

    respond([
        'total_bottles'     => $total,
        'plastic_kg_saved'  => round($total * 0.05, 2),
        'co2_kg_saved'      => round($total * 0.12, 2),
        'message'           => $total > 0
            ? "당신은 지금까지 플라스틱 " . round($total * 0.05, 2) . "kg 를 절감했습니다 🌱"
            : "첫 공병을 반납하고 환경 임팩트를 만들어 보세요!",
    ]);
}

function update_profile(array $u): void {
    $b  = body();
    $allowed = ['name','phone'];
    $fields  = [];
    $vals    = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $fields[] = "$f = ?";
            $vals[]   = $b[$f];
        }
    }
    if (empty($fields)) error('수정할 항목이 없습니다');
    $vals[] = $u['user_id'];
    db()->prepare("UPDATE users SET " . implode(',', $fields) . " WHERE user_id=?")->execute($vals);
    respond(['message' => '프로필이 수정되었습니다']);
}

function change_password(array $u): void {
    $b    = body();
    $pdo  = db();
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE user_id=?");
    $stmt->execute([$u['user_id']]);
    $hash = $stmt->fetchColumn();

    if (!password_verify($b['current_password'] ?? '', $hash)) error('현재 비밀번호가 올바르지 않습니다');
    if (strlen($b['new_password'] ?? '') < 8) error('새 비밀번호는 8자 이상이어야 합니다');

    $pdo->prepare("UPDATE users SET password_hash=? WHERE user_id=?")
        ->execute([password_hash($b['new_password'], PASSWORD_BCRYPT, ['cost'=>12]), $u['user_id']]);
    respond(['message' => '비밀번호가 변경되었습니다']);
}

function list_addresses(array $u): void {
    $stmt = db()->prepare("SELECT * FROM shipping_addresses WHERE user_id=? ORDER BY is_default DESC");
    $stmt->execute([$u['user_id']]);
    respond($stmt->fetchAll());
}

function add_address(array $u): void {
    $b = body();
    if (empty($b['receiver_name']) || empty($b['address'])) error('받는 분 이름과 주소는 필수입니다');

    $pdo = db();
    if (!empty($b['is_default'])) {
        $pdo->prepare("UPDATE shipping_addresses SET is_default=0 WHERE user_id=?")->execute([$u['user_id']]);
    }
    $pdo->prepare(
        "INSERT INTO shipping_addresses (user_id,label,receiver_name,receiver_phone,zipcode,address,detail_address,is_default)
         VALUES (?,?,?,?,?,?,?,?)"
    )->execute([
        $u['user_id'], $b['label'] ?? '배송지',
        $b['receiver_name'], $b['receiver_phone'] ?? '',
        $b['zipcode'] ?? '', $b['address'], $b['detail_address'] ?? '',
        !empty($b['is_default']),
    ]);
    respond(['message' => '배송지가 추가되었습니다'], 201);
}

function delete_address(array $u, int $id): void {
    db()->prepare("DELETE FROM shipping_addresses WHERE address_id=? AND user_id=?")
        ->execute([$id, $u['user_id']]);
    respond(['message' => '배송지가 삭제되었습니다']);
}

function withdraw(array $u): void {
    $b = body();
    $pdo = db();
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE user_id=?");
    $stmt->execute([$u['user_id']]);
    if (!password_verify($b['password'] ?? '', $stmt->fetchColumn())) {
        error('비밀번호가 올바르지 않습니다');
    }
    $pdo->prepare("UPDATE users SET is_active=0, email=CONCAT(email,'_withdrew_',NOW()) WHERE user_id=?")
        ->execute([$u['user_id']]);
    respond(['message' => '탈퇴 처리되었습니다']);
}
