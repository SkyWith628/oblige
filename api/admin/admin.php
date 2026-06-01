<?php
// 관리자 전용 API
// GET  /api/admin/dashboard    통계 대시보드
// GET  /api/admin/users        회원 목록
// PATCH /api/admin/users/:id   회원 상태/포인트 수정
// GET  /api/admin/returns      반납 목록 (전체)
// GET  /api/admin/orders       주문 목록 (전체)
// PATCH /api/admin/orders/:id/status  주문 상태 변경

$method = $GLOBALS['METHOD'];
$seg    = $GLOBALS['SEG'];     // ['admin', resource, id?, action?]
$res    = $seg[1] ?? '';
$id     = isset($seg[2]) && is_numeric($seg[2]) ? (int)$seg[2] : null;
$action = $id !== null ? ($seg[3] ?? null) : null;

auth_admin();

match (true) {
    $res === 'dashboard'                          => dashboard(),
    $res === 'users'  && $method === 'GET'  && $id === null => list_users(),
    $res === 'users'  && $method === 'PATCH' && $id !== null => update_user($id),
    $res === 'returns' && $method === 'GET'       => admin_returns(),
    $res === 'orders'  && $method === 'GET'       => admin_orders(),
    $res === 'orders'  && $method === 'PATCH' && $action === 'status' => change_order_status($id),
    default => error('Not found', 404),
};

function dashboard(): void {
    $pdo = db();

    $stats = [];

    // 회원
    $r = $pdo->query("SELECT COUNT(*) FROM users WHERE role='USER'");
    $stats['total_users'] = (int)$r->fetchColumn();

    $r = $pdo->query("SELECT COUNT(*) FROM users WHERE role='USER' AND DATE(created_at)=CURDATE()");
    $stats['new_users_today'] = (int)$r->fetchColumn();

    // 주문
    $r = $pdo->query("SELECT COUNT(*), COALESCE(SUM(final_price),0) FROM orders WHERE order_status NOT IN ('CANCELLED','REFUNDED')");
    [$cnt, $revenue] = $r->fetch(PDO::FETCH_NUM);
    $stats['total_orders']  = (int)$cnt;
    $stats['total_revenue'] = (int)$revenue;

    $r = $pdo->query("SELECT COALESCE(SUM(final_price),0) FROM orders WHERE DATE(created_at)=CURDATE() AND order_status NOT IN ('CANCELLED','REFUNDED')");
    $stats['revenue_today'] = (int)$r->fetchColumn();

    // 공병 반납
    $r = $pdo->query("SELECT COUNT(*), COALESCE(SUM(total_quantity),0) FROM empty_bottle_returns WHERE return_status='APPROVED'");
    [$rcnt, $rqty] = $r->fetch(PDO::FETCH_NUM);
    $stats['approved_returns']   = (int)$rcnt;
    $stats['total_bottles']      = (int)$rqty;
    $stats['plastic_kg_saved']   = round($rqty * 0.05, 2);

    $r = $pdo->query("SELECT COUNT(*) FROM empty_bottle_returns WHERE return_status='INSPECTING'");
    $stats['pending_inspections'] = (int)$r->fetchColumn();

    // 포인트
    $r = $pdo->query("SELECT COALESCE(SUM(amount),0) FROM point_transactions WHERE point_type='EARN'");
    $stats['total_points_issued'] = (int)$r->fetchColumn();

    $r = $pdo->query("SELECT COALESCE(SUM(amount),0) FROM point_transactions WHERE point_type='USE'");
    $stats['total_points_used'] = (int)$r->fetchColumn();

    // 등급 분포
    $r = $pdo->query(
        "SELECT g.grade_name, COUNT(u.user_id) AS cnt
         FROM membership_grades g
         LEFT JOIN users u ON u.grade_id = g.grade_id AND u.role='USER'
         GROUP BY g.grade_id ORDER BY g.grade_id"
    );
    $stats['grade_distribution'] = $r->fetchAll();

    respond($stats);
}

function list_users(): void {
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = 20;
    $offset = ($page - 1) * $limit;
    $q      = $_GET['q'] ?? '';

    $where  = $q ? "WHERE u.email LIKE ? OR u.name LIKE ?" : "";
    $params = $q ? ["%$q%", "%$q%", $limit, $offset] : [$limit, $offset];

    $stmt = db()->prepare(
        "SELECT u.user_id, u.email, u.name, u.phone, u.total_point, u.total_returns,
                u.role, u.is_active, u.created_at, g.grade_name
         FROM users u JOIN membership_grades g ON u.grade_id=g.grade_id
         $where
         ORDER BY u.created_at DESC LIMIT ? OFFSET ?"
    );
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

function update_user(int $id): void {
    $b   = body();
    $pdo = db();

    if (array_key_exists('is_active', $b)) {
        $pdo->prepare("UPDATE users SET is_active=? WHERE user_id=?")->execute([$b['is_active'], $id]);
    }
    if (array_key_exists('point_adjust', $b) && (int)$b['point_adjust'] !== 0) {
        $adj = (int)$b['point_adjust'];
        if ($adj > 0) {
            give_point($id, $adj, 'ADMIN', null, $b['reason'] ?? '관리자 포인트 지급');
        } else {
            use_point($id, abs($adj), 'ADMIN', null, $b['reason'] ?? '관리자 포인트 차감');
        }
    }
    respond(['message' => '회원 정보가 수정되었습니다']);
}

function admin_returns(): void {
    $status = $_GET['status'] ?? '';
    $where  = $status ? "WHERE r.return_status = ?" : "";
    $params = $status ? [$status] : [];

    $stmt = db()->prepare(
        "SELECT r.*, u.name AS user_name, u.email
         FROM empty_bottle_returns r JOIN users u ON r.user_id=u.user_id
         $where ORDER BY r.created_at DESC LIMIT 50"
    );
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

function admin_orders(): void {
    $status = $_GET['status'] ?? '';
    $where  = $status ? "WHERE o.order_status = ?" : "";
    $params = $status ? [$status] : [];

    $stmt = db()->prepare(
        "SELECT o.*, u.name AS user_name, u.email
         FROM orders o JOIN users u ON o.user_id=u.user_id
         $where ORDER BY o.created_at DESC LIMIT 50"
    );
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

function change_order_status(int $id): void {
    $b      = body();
    $valid  = ['ORDERED','PAID','PREPARING','SHIPPING','DELIVERED','CANCELLED','REFUNDED'];
    $status = $b['status'] ?? '';
    if (!in_array($status, $valid)) error('올바른 상태값이 아닙니다');

    $pdo = db();
    $extra = '';
    $params = [$status];

    if ($status === 'PAID')      { $extra = ', paid_at = NOW()'; }
    if ($status === 'SHIPPING')  { $extra = ', shipped_at = NOW()'; if (!empty($b['tracking_number'])) { $extra .= ', tracking_number = ?'; $params[] = $b['tracking_number']; } }
    if ($status === 'DELIVERED') { $extra = ', delivered_at = NOW()'; }

    $params[] = $id;
    $pdo->prepare("UPDATE orders SET order_status=? $extra WHERE order_id=?")->execute($params);

    // 배송 시작 알림
    $ord = $pdo->prepare("SELECT user_id, order_number FROM orders WHERE order_id=?");
    $ord->execute([$id]);
    $o = $ord->fetch();
    if ($o && $status === 'SHIPPING') {
        push_notification($o['user_id'], 'SHIPPING', '배송이 시작되었습니다',
            "주문 {$o['order_number']} 배송이 출발했습니다.", $id);
    }

    respond(['message' => '주문 상태가 변경되었습니다']);
}
