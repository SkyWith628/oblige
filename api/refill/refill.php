<?php
// GET  /api/refill          내 리필 신청 목록
// POST /api/refill          리필 신청

$method = $GLOBALS['METHOD'];
$id     = $GLOBALS['ID'];
$u      = auth_user();

match (true) {
    $method === 'GET'  && $id === null => list_refills($u),
    $method === 'POST' && $id === null => create_refill($u),
    default => error('Not found', 404),
};

function list_refills(array $u): void {
    $stmt = db()->prepare(
        "SELECT rr.*, p.product_name
         FROM refill_requests rr JOIN products p ON rr.product_id=p.product_id
         WHERE rr.user_id=? ORDER BY rr.created_at DESC"
    );
    $stmt->execute([$u['user_id']]);
    respond($stmt->fetchAll());
}

function create_refill(array $u): void {
    $b   = body();
    $pdo = db();

    if (empty($b['product_id'])) error('상품을 선택해주세요');

    // 리필 가능 상품 확인
    $prod = $pdo->prepare("SELECT product_name, is_refillable FROM products WHERE product_id=? AND is_active=1");
    $prod->execute([$b['product_id']]);
    $p = $prod->fetch();
    if (!$p)               error('상품을 찾을 수 없습니다', 404);
    if (!$p['is_refillable']) error('리필이 지원되지 않는 상품입니다');

    // 등급 확인 (Tree 이상만 리필 가능)
    $grade = $pdo->prepare("SELECT g.min_return_count FROM users u JOIN membership_grades g ON u.grade_id=g.grade_id WHERE u.user_id=?");
    $grade->execute([$u['user_id']]);
    $minReturn = (int)$grade->fetchColumn();
    if ($minReturn < 7) error('리필 혜택은 Tree 등급(공병 7개 이상 반납) 이상 회원에게 제공됩니다');

    $pdo->prepare(
        "INSERT INTO refill_requests (user_id,product_id,return_id,refill_amount,shipping_address)
         VALUES (?,?,?,?,?)"
    )->execute([
        $u['user_id'], $b['product_id'],
        $b['return_id']       ?? null,
        $b['refill_amount']   ?? null,
        $b['shipping_address'] ?? null,
    ]);

    push_notification($u['user_id'], 'RETURN', '리필 신청이 완료되었습니다',
        "{$p['product_name']} 리필 신청이 접수되었습니다.");

    respond(['message' => '리필 신청이 완료되었습니다'], 201);
}
