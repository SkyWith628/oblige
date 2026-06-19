<?php
// GET   /api/notifications        알림 목록
// PATCH /api/notifications/:id    읽음 처리
// PATCH /api/notifications/read-all 전체 읽음

$method = $GLOBALS['METHOD'];
$id     = $GLOBALS['ID'];
$action = $GLOBALS['ACTION'] ?? $GLOBALS['SEG'][1] ?? '';
$u      = auth_user();

match (true) {
    $method === 'GET'   && $id === null             => list_notifications($u),
    $method === 'PATCH' && $action === 'read-all'   => read_all($u),
    $method === 'PATCH' && $id !== null             => mark_read($u, $id),
    default => error('Not found', 404),
};

function list_notifications(array $u): void {
    $stmt = db()->prepare(
        "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30"
    );
    $stmt->execute([$u['user_id']]);
    $items = $stmt->fetchAll();

    $unread = db()->prepare("SELECT COUNT(*) FROM notifications WHERE user_id=? AND is_read=0");
    $unread->execute([$u['user_id']]);

    respond(['items' => $items, 'unread_count' => (int)$unread->fetchColumn()]);
}

function mark_read(array $u, int $id): void {
    db()->prepare("UPDATE notifications SET is_read=1 WHERE notification_id=? AND user_id=?")
        ->execute([$id, $u['user_id']]);
    respond(['message' => '읽음 처리되었습니다']);
}

function read_all(array $u): void {
    db()->prepare("UPDATE notifications SET is_read=1 WHERE user_id=?")
        ->execute([$u['user_id']]);
    respond(['message' => '모두 읽음 처리되었습니다']);
}
