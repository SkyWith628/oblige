<?php
// GET  /api/products           목록 (카테고리 필터, 검색)
// GET  /api/products/:id       상세
// POST /api/products           등록 (ADMIN)
// PUT  /api/products/:id       수정 (ADMIN)
// DELETE /api/products/:id     삭제 (ADMIN)

$method = $GLOBALS['METHOD'];
$id     = $GLOBALS['ID'];

match (true) {
    $method === 'GET'    && $id === null => list_products(),
    $method === 'GET'    && $id !== null => get_product($id),
    $method === 'POST'   && $id === null => create_product(),
    $method === 'PUT'    && $id !== null => update_product($id),
    $method === 'DELETE' && $id !== null => delete_product($id),
    default => error('Not found', 404),
};

function list_products(): void {
    $pdo = db();
    $where  = ['p.is_active = 1'];
    $params = [];

    if (!empty($_GET['category_id'])) {
        $where[]  = 'p.category_id = ?';
        $params[] = (int)$_GET['category_id'];
    }
    if (!empty($_GET['is_refillable'])) {
        $where[]  = 'p.is_refillable = 1';
    }
    if (!empty($_GET['is_vegan'])) {
        $where[]  = 'p.is_vegan = 1';
    }
    if (!empty($_GET['q'])) {
        $where[]  = 'p.product_name LIKE ?';
        $params[] = '%' . $_GET['q'] . '%';
    }

    $whereStr = implode(' AND ', $where);
    $stmt = $pdo->prepare(
        "SELECT p.*, c.category_name,
                (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_main = 1 LIMIT 1) AS main_image,
                (SELECT ROUND(AVG(rating),1) FROM reviews WHERE product_id = p.product_id) AS avg_rating,
                (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) AS review_count
         FROM products p
         JOIN categories c ON p.category_id = c.category_id
         WHERE $whereStr
         ORDER BY p.sort_order, p.product_id"
    );
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

function get_product(int $id): void {
    $pdo  = db();
    $stmt = $pdo->prepare(
        "SELECT p.*, c.category_name,
                (SELECT ROUND(AVG(rating),1) FROM reviews WHERE product_id = p.product_id) AS avg_rating,
                (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) AS review_count
         FROM products p
         JOIN categories c ON p.category_id = c.category_id
         WHERE p.product_id = ? AND p.is_active = 1"
    );
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) error('상품을 찾을 수 없습니다', 404);

    // 이미지
    $imgs = $pdo->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC, sort_order");
    $imgs->execute([$id]);
    $product['images'] = $imgs->fetchAll();

    // 최신 리뷰 5개
    $revs = $pdo->prepare(
        "SELECT r.*, u.name AS reviewer_name
         FROM reviews r JOIN users u ON r.user_id = u.user_id
         WHERE r.product_id = ? AND r.is_visible = 1
         ORDER BY r.created_at DESC LIMIT 5"
    );
    $revs->execute([$id]);
    $product['reviews'] = $revs->fetchAll();

    respond($product);
}

function create_product(): void {
    auth_admin();
    $b = body();
    $required = ['category_id','product_name','price'];
    foreach ($required as $f) {
        if (empty($b[$f])) error("$f 은(는) 필수 항목입니다");
    }

    $pdo = db();
    $pdo->prepare(
        "INSERT INTO products (category_id,product_name,price,stock,description,ingredients,
                               usage_guide,is_vegan,is_refillable,return_point,earn_point)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)"
    )->execute([
        $b['category_id'], $b['product_name'], $b['price'],
        $b['stock'] ?? 0, $b['description'] ?? null, $b['ingredients'] ?? null,
        $b['usage_guide'] ?? null,
        $b['is_vegan']      ?? true,
        $b['is_refillable'] ?? false,
        $b['return_point']  ?? 0,
        $b['earn_point']    ?? 0,
    ]);
    respond(['message' => '상품이 등록되었습니다', 'product_id' => (int)$pdo->lastInsertId()], 201);
}

function update_product(int $id): void {
    auth_admin();
    $b   = body();
    $pdo = db();

    $fields = [];
    $vals   = [];
    $allowed = ['product_name','price','stock','description','ingredients',
                'usage_guide','is_vegan','is_refillable','return_point','earn_point',
                'is_active','sort_order','category_id'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $fields[] = "$f = ?";
            $vals[]   = $b[$f];
        }
    }
    if (empty($fields)) error('수정할 항목이 없습니다');
    $vals[] = $id;
    $pdo->prepare("UPDATE products SET " . implode(',', $fields) . " WHERE product_id = ?")
        ->execute($vals);
    respond(['message' => '상품이 수정되었습니다']);
}

function delete_product(int $id): void {
    auth_admin();
    db()->prepare("UPDATE products SET is_active = 0 WHERE product_id = ?")->execute([$id]);
    respond(['message' => '상품이 삭제(비활성화)되었습니다']);
}
