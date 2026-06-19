<?php
// GET  /api/campaigns           캠페인 목록
// GET  /api/campaigns/:id       캠페인 상세
// POST /api/campaigns/:id/join  참여 신청

$method = $GLOBALS['METHOD'];
$id     = $GLOBALS['ID'];
$action = $GLOBALS['ACTION'];

match (true) {
    $method === 'GET'  && $id === null          => list_campaigns(),
    $method === 'GET'  && $id !== null          => get_campaign($id),
    $method === 'POST' && $action === 'join'    => join_campaign($id),
    default => error('Not found', 404),
};

function list_campaigns(): void {
    $stmt = db()->prepare(
        "SELECT c.*, (SELECT COUNT(*) FROM campaign_participants WHERE campaign_id=c.campaign_id) AS participant_count
         FROM campaigns c WHERE c.is_active=1 AND c.end_date >= CURDATE()
         ORDER BY c.start_date DESC"
    );
    $stmt->execute();
    respond($stmt->fetchAll());
}

function get_campaign(int $id): void {
    $stmt = db()->prepare("SELECT * FROM campaigns WHERE campaign_id=?");
    $stmt->execute([$id]);
    $c = $stmt->fetch();
    if (!$c) error('캠페인을 찾을 수 없습니다', 404);

    $cnt = db()->prepare("SELECT COUNT(*) FROM campaign_participants WHERE campaign_id=?");
    $cnt->execute([$id]);
    $c['participant_count'] = (int)$cnt->fetchColumn();
    respond($c);
}

function join_campaign(int $id): void {
    $u  = auth_user();
    $b  = body();
    $pdo = db();

    $c = $pdo->prepare("SELECT * FROM campaigns WHERE campaign_id=? AND is_active=1 AND end_date>=CURDATE()");
    $c->execute([$id]);
    $camp = $c->fetch();
    if (!$camp) error('참여 가능한 캠페인을 찾을 수 없습니다', 404);

    try {
        $pdo->prepare(
            "INSERT INTO campaign_participants (campaign_id,user_id,sns_url,image_url)
             VALUES (?,?,?,?)"
        )->execute([$id, $u['user_id'], $b['sns_url'] ?? null, $b['image_url'] ?? null]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') error('이미 참여한 캠페인입니다');
        throw $e;
    }

    push_notification($u['user_id'], 'CAMPAIGN', '캠페인 참여 신청 완료',
        "'{$camp['title']}' 참여 신청이 접수되었습니다. 승인 후 {$camp['reward_point']}P 가 적립됩니다.", $id);

    respond(['message' => '캠페인 참여 신청이 완료되었습니다. 승인 후 포인트가 지급됩니다.'], 201);
}
