<?php
// GET    /api/cart        장바구니 조회
// POST   /api/cart        상품 추가
// PATCH  /api/cart/:id    수량 변경
// DELETE /api/cart/:id    삭제

$method = $GLOBALS['METHOD'];
$id     = $GLOBALS['ID'];
$u      = auth_user();

match (true) {
    $method === 'GET'    && $id === null => get_cart($u),
    $method === 'POST'   && $id === null => add_cart($u),
    $method === 'PATCH'  && $id !== null => update_cart($u, $id),
    $method === 'DELETE' && $id !== null => delete_cart($u, $id),
    default => error('Not found', 404),
};

function get_cart(array $u): void {
    $stmt = db()->prepare(
        "SELECT ci.cart_item_id, ci.quantity, p.product_id, p.product_name, p.price,
                p.stock, p.is_refillable, p.earn_point,
                (ci.quantity * p.price) AS subtotal,
                (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_main=1 LIMIT 1) AS main_image
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.product_id
         WHERE ci.user_id = ? AND p.is_active = 1
         ORDER BY ci.added_at DESC"
    );
    $stmt->execute([$u['user_id']]);
    $items = $stmt->fetchAll();
    $total = array_sum(array_column($items, 'subtotal'));
    respond(['items' => $items, 'total_price' => $total,
             'shipping_fee' => $total >= 50000 ? 0 : 3000]);
}

function add_cart(array $u): void {
    $b = body();
    if (empty($b['product_id'])) error('product_id 필수');
    $qty = max(1, (int)($b['quantity'] ?? 1));

    $pdo  = db();
    $prod = $pdo->prepare("SELECT stock FROM products WHERE product_id = ? AND is_active = 1");
    $prod->execute([$b['product_id']]);
    $stock = $prod->fetchColumn();
    if ($stock === false) error('상품을 찾을 수 없습니다', 404);
    if ($stock < $qty) error('재고가 부족합니다');

    $pdo->prepare(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)"
    )->execute([$u['user_id'], $b['product_id'], $qty]);

    respond(['message' => '장바구니에 담겼습니다'], 201);
}

function update_cart(array $u, int $cartItemId): void {
    $b   = body();
    $qty = (int)($b['quantity'] ?? 1);
    if ($qty < 1) error('수량은 1 이상이어야 합니다');

    db()->prepare(
        "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ? AND user_id = ?"
    )->execute([$qty, $cartItemId, $u['user_id']]);
    respond(['message' => '수량이 변경되었습니다']);
}

function delete_cart(array $u, int $cartItemId): void {
    db()->prepare(
        "DELETE FROM cart_items WHERE cart_item_id = ? AND user_id = ?"
    )->execute([$cartItemId, $u['user_id']]);
    respond(['message' => '삭제되었습니다']);
}
