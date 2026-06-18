<?php
// GET /api/points          내 포인트 내역
// GET /api/points/summary  포인트 요약 (잔액 + 통계)

$method = $GLOBALS['METHOD'];
$action = $GLOBALS['ACTION'] ?? $GLOBALS['SEG'][1] ?? '';
$u      = auth_user();

match ([$method, $action]) {
    ['GET', 'summary'] => point_summary($u),
    ['GET', '']        => point_history($u),
    ['GET', null]      => point_history($u),
    default => error('Not found', 404),
};

function point_history(array $u): void {
    $page  = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;

    $stmt = db()->prepare(
        "SELECT pt_id, point_type, amount, balance_after, source, reason, created_at
         FROM point_transactions
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?"
    );
    $stmt->execute([$u['user_id'], $limit, $offset]);

    $count = db()->prepare("SELECT COUNT(*) FROM point_transactions WHERE user_id=?");
    $count->execute([$u['user_id']]);

    respond([
        'data'  => $stmt->fetchAll(),
        'total' => (int)$count->fetchColumn(),
        'page'  => $page,
        'limit' => $limit,
    ]);
}

function point_summary(array $u): void {
    $pdo  = db();
    $user = $pdo->prepare("SELECT total_point FROM users WHERE user_id = ?");
    $user->execute([$u['user_id']]);
    $balance = (int)$user->fetchColumn();

    $earn = $pdo->prepare(
        "SELECT COALESCE(SUM(amount),0) FROM point_transactions WHERE user_id=? AND point_type='EARN'"
    );
    $earn->execute([$u['user_id']]);

    $use = $pdo->prepare(
        "SELECT COALESCE(SUM(amount),0) FROM point_transactions WHERE user_id=? AND point_type='USE'"
    );
    $use->execute([$u['user_id']]);

    respond([
        'balance'     => $balance,
        'total_earned'=> (int)$earn->fetchColumn(),
        'total_used'  => (int)$use->fetchColumn(),
    ]);
}
