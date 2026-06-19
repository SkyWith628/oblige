<?php
// GET  /api/orders          내 주문 목록
// GET  /api/orders/:id      주문 상세
// POST /api/orders          주문 생성
// PATCH /api/orders/:id/cancel  주문 취소

$method = $GLOBALS['METHOD'];
$id     = $GLOBALS['ID'];
$action = $GLOBALS['ACTION'];
$u      = auth_user();

match (true) {
    $method === 'GET'   && $id === null          => list_orders($u),
    $method === 'GET'   && $id !== null          => get_order($u, $id),
    $method === 'POST'  && $id === null          => create_order($u),
    $method === 'PATCH' && $action === 'cancel'  => cancel_order($u, $id),
    default => error('Not found', 404),
};

function list_orders(array $u): void {
    $stmt = db()->prepare(
        "SELECT o.order_id, o.order_number, o.final_price, o.order_status,
                o.created_at, COUNT(oi.order_item_id) AS item_count
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         WHERE o.user_id = ?
         GROUP BY o.order_id
         ORDER BY o.created_at DESC"
    );
    $stmt->execute([$u['user_id']]);
    respond($stmt->fetchAll());
}

function get_order(array $u, int $id): void {
    $pdo  = db();
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_id = ? AND user_id = ?");
    $stmt->execute([$id, $u['user_id']]);
    $order = $stmt->fetch();
    if (!$order) error('주문을 찾을 수 없습니다', 404);

    $items = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $items->execute([$id]);
    $order['items'] = $items->fetchAll();
    respond($order);
}

function create_order(array $u): void {
    $b  = body();
    $pdo = db();

    // 장바구니에서 가져오거나 직접 items 지정
    if (!empty($b['from_cart'])) {
        $stmt = $pdo->prepare(
            "SELECT ci.quantity, p.product_id, p.product_name, p.price,
                    p.stock, p.earn_point
             FROM cart_items ci JOIN products p ON ci.product_id = p.product_id
             WHERE ci.user_id = ? AND p.is_active = 1"
        );
        $stmt->execute([$u['user_id']]);
        $items = $stmt->fetchAll();
    } else {
        // 클라이언트 요청에서 product_id·quantity만 받고, 가격/포인트는 DB에서 조회
        $rawItems = $b['items'] ?? [];
        if (empty($rawItems)) error('주문할 상품이 없습니다');
        $items = [];
        foreach ($rawItems as $raw) {
            $pid = (int)($raw['product_id'] ?? 0);
            $qty = max(1, (int)($raw['quantity'] ?? 1));
            if (!$pid) continue;
            $s = $pdo->prepare(
                "SELECT product_id, product_name, price, stock, earn_point
                 FROM products WHERE product_id = ? AND is_active = 1"
            );
            $s->execute([$pid]);
            $p = $s->fetch();
            if (!$p) error("상품 ID {$pid}를 찾을 수 없습니다");
            $p['quantity'] = $qty;
            $items[] = $p;
        }
    }

    if (empty($items)) error('주문할 상품이 없습니다');

    $totalPrice = 0;
    foreach ($items as &$item) {
        if ($item['stock'] < $item['quantity']) error("{$item['product_name']} 재고가 부족합니다");
        $item['subtotal'] = $item['price'] * $item['quantity'];
        $totalPrice += $item['subtotal'];
    }

    $usedPoint  = min((int)($b['used_point'] ?? 0), $totalPrice);
    $shippingFee = $totalPrice >= 50000 ? 0 : 3000;
    $finalPrice = $totalPrice - $usedPoint + $shippingFee;

    if ($usedPoint > 0) {
        $pu = $pdo->prepare("SELECT total_point FROM users WHERE user_id = ?");
        $pu->execute([$u['user_id']]);
        if ((int)$pu->fetchColumn() < $usedPoint) error('보유 포인트가 부족합니다');
    }

    $pdo->beginTransaction();
    try {
        // 트랜잭션 내 재고 재확인 (FOR UPDATE로 동시 요청 차단)
        foreach ($items as $item) {
            $lock = $pdo->prepare(
                "SELECT stock FROM products WHERE product_id = ? AND is_active = 1 FOR UPDATE"
            );
            $lock->execute([$item['product_id']]);
            $stock = (int)$lock->fetchColumn();
            if ($stock < $item['quantity']) {
                $pdo->rollBack();
                error("{$item['product_name']} 재고가 부족합니다");
            }
        }

        // 포인트 잔액 재확인 (FOR UPDATE로 동시 차감 방지)
        if ($usedPoint > 0) {
            $plock = $pdo->prepare("SELECT total_point FROM users WHERE user_id = ? FOR UPDATE");
            $plock->execute([$u['user_id']]);
            if ((int)$plock->fetchColumn() < $usedPoint) {
                $pdo->rollBack();
                error('보유 포인트가 부족합니다');
            }
        }

        $orderNumber = gen_order_number();
        $pdo->prepare(
            "INSERT INTO orders (user_id,order_number,total_price,used_point,shipping_fee,
                                 final_price,receiver_name,receiver_phone,zipcode,
                                 shipping_address,detail_address,delivery_memo)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
        )->execute([
            $u['user_id'], $orderNumber, $totalPrice, $usedPoint, $shippingFee,
            $finalPrice, $b['receiver_name'], $b['receiver_phone'],
            $b['zipcode'] ?? '', $b['shipping_address'], $b['detail_address'] ?? '',
            $b['delivery_memo'] ?? '',
        ]);
        $orderId = (int)$pdo->lastInsertId();

        $totalEarnPoint = 0;
        foreach ($items as $item) {
            $pdo->prepare(
                "INSERT INTO order_items (order_id,product_id,product_name,price,quantity,earn_point)
                 VALUES (?,?,?,?,?,?)"
            )->execute([$orderId, $item['product_id'], $item['product_name'],
                        $item['price'], $item['quantity'], $item['earn_point'] * $item['quantity']]);

            // 재고 차감
            $pdo->prepare("UPDATE products SET stock = stock - ? WHERE product_id = ?")
                ->execute([$item['quantity'], $item['product_id']]);

            $totalEarnPoint += $item['earn_point'] * $item['quantity'];
        }

        // 포인트 사용
        if ($usedPoint > 0) {
            use_point($u['user_id'], $usedPoint, 'ORDER', $orderId, '주문 포인트 사용');
        }

        // 구매 포인트 적립
        if ($totalEarnPoint > 0) {
            give_point($u['user_id'], $totalEarnPoint, 'ORDER', $orderId, '상품 구매 적립');
        }

        // 장바구니 비우기
        if (!empty($b['from_cart'])) {
            $pdo->prepare("DELETE FROM cart_items WHERE user_id = ?")->execute([$u['user_id']]);
        }

        $pdo->commit();

        push_notification($u['user_id'], 'ORDER', '주문이 완료되었습니다',
            "주문번호 {$orderNumber} 가 접수되었습니다.", $orderId);

        respond(['message' => '주문이 완료되었습니다',
                 'order_id' => $orderId, 'order_number' => $orderNumber,
                 'final_price' => $finalPrice], 201);
    } catch (Throwable $e) {
        $pdo->rollBack();
        error('주문 처리 중 오류가 발생했습니다: ' . $e->getMessage(), 500);
    }
}

function cancel_order(array $u, int $id): void {
    $pdo  = db();
    $stmt = $pdo->prepare(
        "SELECT order_status FROM orders WHERE order_id = ? AND user_id = ?"
    );
    $stmt->execute([$id, $u['user_id']]);
    $status = $stmt->fetchColumn();

    if (!$status) error('주문을 찾을 수 없습니다', 404);
    if (!in_array($status, ['ORDERED','PAID'])) error('취소할 수 없는 주문 상태입니다');

    $pdo->prepare("UPDATE orders SET order_status='CANCELLED' WHERE order_id=?")->execute([$id]);
    push_notification($u['user_id'], 'ORDER', '주문이 취소되었습니다', "주문 #{$id} 가 취소되었습니다.", $id);
    respond(['message' => '주문이 취소되었습니다']);
}
