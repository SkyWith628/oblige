<?php
// GET  /api/returns           내 반납 목록
// GET  /api/returns/:id       반납 상세
// POST /api/returns           반납 신청
// PATCH /api/returns/:id/approve  관리자 승인
// PATCH /api/returns/:id/reject   관리자 반려
// PATCH /api/returns/:id/status   관리자 상태 변경

$method = $GLOBALS['METHOD'];
$id     = $GLOBALS['ID'];
$action = $GLOBALS['ACTION'];
$u      = auth_user();

match (true) {
    $method === 'GET'   && $id === null            => list_returns($u),
    $method === 'GET'   && $id !== null            => get_return($u, $id),
    $method === 'POST'  && $id === null            => create_return($u),
    $method === 'PATCH' && $action === 'approve'   => approve_return($u, $id),
    $method === 'PATCH' && $action === 'reject'    => reject_return($u, $id),
    $method === 'PATCH' && $action === 'status'    => update_return_status($u, $id),
    default => error('Not found', 404),
};

function list_returns(array $u): void {
    $pdo  = db();
    $where = $u['role'] === 'ADMIN' ? '' : 'WHERE r.user_id = ?';
    $params = $u['role'] === 'ADMIN' ? [] : [$u['user_id']];

    $stmt = $pdo->prepare(
        "SELECT r.return_id, r.return_number, r.return_method, r.return_status,
                r.total_quantity, r.total_point, r.created_at, u.name AS user_name
         FROM empty_bottle_returns r
         JOIN users u ON r.user_id = u.user_id
         $where
         ORDER BY r.created_at DESC"
    );
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

function get_return(array $u, int $id): void {
    $pdo  = db();
    $where = $u['role'] === 'ADMIN' ? 'r.return_id = ?' : 'r.return_id = ? AND r.user_id = ?';
    $params = $u['role'] === 'ADMIN' ? [$id] : [$id, $u['user_id']];

    $stmt = $pdo->prepare(
        "SELECT r.*, u.name AS user_name
         FROM empty_bottle_returns r JOIN users u ON r.user_id = u.user_id
         WHERE $where"
    );
    $stmt->execute($params);
    $ret = $stmt->fetch();
    if (!$ret) error('반납 신청을 찾을 수 없습니다', 404);

    $items = $pdo->prepare(
        "SELECT ri.*, p.product_name
         FROM return_items ri JOIN products p ON ri.product_id = p.product_id
         WHERE ri.return_id = ?"
    );
    $items->execute([$id]);
    $ret['items'] = $items->fetchAll();
    respond($ret);
}

function create_return(array $u): void {
    $b = body();
    if (empty($b['return_method'])) error('반납 방식을 선택해주세요 (DELIVERY/OFFLINE)');
    if (empty($b['items']) || !is_array($b['items'])) error('반납할 상품을 선택해주세요');
    if (!in_array($b['return_method'], ['DELIVERY','OFFLINE'])) error('올바른 반납 방식이 아닙니다');

    $pdo = db();
    $totalQty   = 0;
    $totalPoint = 0;
    $items      = [];

    foreach ($b['items'] as $item) {
        if (empty($item['product_id']) || empty($item['quantity'])) continue;
        $prod = $pdo->prepare(
            "SELECT product_id, product_name, return_point, is_refillable
             FROM products WHERE product_id = ? AND is_active = 1"
        );
        $prod->execute([$item['product_id']]);
        $p = $prod->fetch();
        if (!$p) error("상품 ID {$item['product_id']}를 찾을 수 없습니다");
        if (!$p['return_point']) error("{$p['product_name']}은(는) 공병 반납이 지원되지 않는 상품입니다");

        $qty     = max(1, (int)$item['quantity']);
        $ptEach  = (int)$p['return_point'];
        $subtotal = $ptEach * $qty;
        $totalQty   += $qty;
        $totalPoint += $subtotal;
        $items[] = [
            'product_id'      => $p['product_id'],
            'product_name'    => $p['product_name'],
            'quantity'        => $qty,
            'point_per_bottle'=> $ptEach,
            'subtotal_point'  => $subtotal,
        ];
    }

    if (empty($items)) error('유효한 반납 상품이 없습니다');

    $pdo->beginTransaction();
    try {
        $returnNumber = gen_return_number();
        $pdo->prepare(
            "INSERT INTO empty_bottle_returns
             (user_id, return_number, return_method, total_quantity, total_point)
             VALUES (?,?,?,?,?)"
        )->execute([$u['user_id'], $returnNumber, $b['return_method'], $totalQty, $totalPoint]);
        $returnId = (int)$pdo->lastInsertId();

        foreach ($items as $item) {
            $pdo->prepare(
                "INSERT INTO return_items (return_id,product_id,product_name,quantity,point_per_bottle,subtotal_point)
                 VALUES (?,?,?,?,?,?)"
            )->execute([$returnId, $item['product_id'], $item['product_name'],
                        $item['quantity'], $item['point_per_bottle'], $item['subtotal_point']]);
        }

        $pdo->commit();

        push_notification($u['user_id'], 'RETURN', '공병 반납 신청 완료',
            "반납번호 {$returnNumber} 접수되었습니다. 검수 완료 후 포인트가 지급됩니다.", $returnId);

        respond(['message' => '공병 반납 신청이 완료되었습니다',
                 'return_id'     => $returnId,
                 'return_number' => $returnNumber,
                 'total_quantity' => $totalQty,
                 'expected_point' => $totalPoint], 201);
    } catch (Throwable $e) {
        $pdo->rollBack();
        error('반납 신청 중 오류: ' . $e->getMessage(), 500);
    }
}

function approve_return(array $u, int $id): void {
    auth_admin();
    $pdo  = db();
    $stmt = $pdo->prepare(
        "SELECT r.*, r.user_id FROM empty_bottle_returns r WHERE r.return_id = ?"
    );
    $stmt->execute([$id]);
    $ret = $stmt->fetch();
    if (!$ret) error('반납 신청을 찾을 수 없습니다', 404);
    if ($ret['return_status'] !== 'INSPECTING') error('검수 중 상태에서만 승인 가능합니다');

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            "UPDATE empty_bottle_returns
             SET return_status='APPROVED', approved_by=?, approved_at=NOW()
             WHERE return_id=?"
        )->execute([$u['user_id'], $id]);

        // 포인트 지급
        give_point($ret['user_id'], $ret['total_point'], 'RETURN', $id,
            "공병 반납 포인트 지급 (반납번호: {$ret['return_number']})");

        // 누적 반납 수 업데이트 + 등급 재계산
        $pdo->prepare(
            "UPDATE users SET total_returns = total_returns + ? WHERE user_id = ?"
        )->execute([$ret['total_quantity'], $ret['user_id']]);
        recalc_grade($ret['user_id']);

        $pdo->commit();

        push_notification($ret['user_id'], 'RETURN', '공병 반납이 승인되었습니다',
            "{$ret['total_point']}P 가 적립되었습니다!", $id);
        push_notification($ret['user_id'], 'POINT', '포인트 적립',
            "공병 반납으로 {$ret['total_point']}P 가 적립되었습니다.", $id);

        respond(['message' => '승인 완료 및 포인트가 지급되었습니다']);
    } catch (Throwable $e) {
        $pdo->rollBack();
        error($e->getMessage(), 500);
    }
}

function reject_return(array $u, int $id): void {
    auth_admin();
    $b   = body();
    $pdo = db();

    $stmt = $pdo->prepare("SELECT return_status FROM empty_bottle_returns WHERE return_id = ?");
    $stmt->execute([$id]);
    $status = $stmt->fetchColumn();
    if (!$status) error('반납 신청을 찾을 수 없습니다', 404);
    if ($status === 'APPROVED') error('이미 승인(포인트 지급)된 반납은 반려할 수 없습니다');

    $pdo->prepare(
        "UPDATE empty_bottle_returns SET return_status='REJECTED', admin_memo=? WHERE return_id=?"
    )->execute([$b['memo'] ?? null, $id]);

    $ret = db()->prepare("SELECT user_id FROM empty_bottle_returns WHERE return_id=?");
    $ret->execute([$id]);
    $userId = (int)$ret->fetchColumn();
    push_notification($userId, 'RETURN', '공병 반납이 반려되었습니다',
        '반납 신청이 반려되었습니다. 자세한 내용은 고객센터로 문의해주세요.', $id);

    respond(['message' => '반납이 반려처리 되었습니다']);
}

function update_return_status(array $u, int $id): void {
    auth_admin();
    $b = body();
    $valid = ['REQUESTED','COLLECTING','INSPECTING','APPROVED','REJECTED'];
    if (!in_array($b['status'] ?? '', $valid)) error('올바른 상태값이 아닙니다');
    db()->prepare(
        "UPDATE empty_bottle_returns SET return_status=?, admin_memo=? WHERE return_id=?"
    )->execute([$b['status'], $b['memo'] ?? null, $id]);
    respond(['message' => '상태가 변경되었습니다']);
}
