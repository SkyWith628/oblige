<?php
// GET    /api/products                목록 (카테고리 필터, 검색)
// GET    /api/products/:id            상세
// POST   /api/products                등록 (ADMIN)
// PUT    /api/products/:id            수정 (ADMIN)
// DELETE /api/products/:id            삭제 (ADMIN)
// POST   /api/products/:id/images     이미지 업로드 (ADMIN, multipart)
// DELETE /api/products/:id/images/:imgId  이미지 삭제 (ADMIN)

$method = $GLOBALS['METHOD'];
$id     = $GLOBALS['ID'];
$action = $GLOBALS['ACTION'];
$seg    = $GLOBALS['SEG'];

// PATCH /api/products/:id/images/:imgId/main  대표 이미지 변경
$imgId  = isset($seg[3]) ? (int)$seg[3] : 0;
$imgAct = $seg[4] ?? null;   // 'main'

match (true) {
    $method === 'GET'    && $id === null => list_products(),
    $method === 'GET'    && $id !== null && $action === null => get_product($id),
    $method === 'POST'   && $id === null => create_product(),
    $method === 'PUT'    && $id !== null && $action === null => update_product($id),
    $method === 'DELETE' && $id !== null && $action === null => delete_product($id),
    $method === 'POST'   && $id !== null && $action === 'images' => upload_image($id),
    $method === 'DELETE' && $id !== null && $action === 'images' && $imgId > 0 => delete_image($id, $imgId),
    $method === 'PATCH'  && $id !== null && $action === 'images' && $imgId > 0 && $imgAct === 'main' => set_main_image($id, $imgId),
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
        (int)$b['category_id'],
        $b['product_name'],
        (int)$b['price'],
        (int)($b['stock'] ?? 0),
        $b['description'] ?? null,
        $b['ingredients'] ?? null,
        $b['usage_guide'] ?? null,
        $b['is_vegan']      === false ? 0 : 1,
        $b['is_refillable'] === false ? 0 : ($b['is_refillable'] ? 1 : 0),
        (int)($b['return_point'] ?? 0),
        (int)($b['earn_point']   ?? 0),
    ]);
    respond(['message' => '상품이 등록되었습니다', 'product_id' => (int)$pdo->lastInsertId()], 201);
}

function update_product(int $id): void {
    auth_admin();
    $b   = body();
    $pdo = db();

    $fields = [];
    $vals   = [];
    $intFields  = ['price','stock','return_point','earn_point','is_active','sort_order','category_id'];
    $boolFields = ['is_vegan','is_refillable'];
    $allowed = ['product_name','price','stock','description','ingredients',
                'usage_guide','is_vegan','is_refillable','return_point','earn_point',
                'is_active','sort_order','category_id'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $fields[] = "$f = ?";
            if (in_array($f, $boolFields)) {
                $vals[] = $b[$f] ? 1 : 0;
            } elseif (in_array($f, $intFields)) {
                $vals[] = (int)$b[$f];
            } else {
                $vals[] = $b[$f];
            }
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

function upload_image(int $productId): void {
    auth_admin();
    if (empty($_FILES['image'])) error('이미지 파일이 없습니다');

    $file    = $_FILES['image'];
    $allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    $finfo   = finfo_open(FILEINFO_MIME_TYPE);
    $mime    = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, $allowed)) error('JPG, PNG, WEBP, GIF만 업로드 가능합니다');
    if ($file['size'] > 5 * 1024 * 1024)   error('파일 크기는 5MB 이하여야 합니다');

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'product_' . $productId . '_' . uniqid() . '.' . strtolower($ext);
    $uploadDir = __DIR__ . '/../../uploads/products/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $savePath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $savePath)) error('파일 저장에 실패했습니다');

    $imageUrl = '/uploads/products/' . $filename;
    $pdo      = db();

    // 첫 번째 이미지면 메인으로 설정
    $cnt = $pdo->prepare("SELECT COUNT(*) FROM product_images WHERE product_id = ?");
    $cnt->execute([$productId]);
    $isMain = ($cnt->fetchColumn() == 0) ? 1 : 0;

    $pdo->prepare("INSERT INTO product_images (product_id, image_url, is_main, sort_order) VALUES (?,?,?,?)")
        ->execute([$productId, $imageUrl, $isMain, $isMain ? 0 : 99]);

    respond([
        'message'  => '이미지가 업로드되었습니다',
        'image_id' => (int)$pdo->lastInsertId(),
        'image_url'=> $imageUrl,
        'is_main'  => (bool)$isMain,
    ], 201);
}

function delete_image(int $productId, int $imageId): void {
    auth_admin();
    $pdo  = db();
    $stmt = $pdo->prepare("SELECT * FROM product_images WHERE image_id = ? AND product_id = ?");
    $stmt->execute([$imageId, $productId]);
    $img = $stmt->fetch();
    if (!$img) error('이미지를 찾을 수 없습니다', 404);

    // 파일 삭제
    $filePath = __DIR__ . '/../../' . ltrim($img['image_url'], '/');
    if (file_exists($filePath)) unlink($filePath);

    $pdo->prepare("DELETE FROM product_images WHERE image_id = ?")->execute([$imageId]);

    // 삭제된 게 메인이면 다음 이미지를 메인으로
    if ($img['is_main']) {
        $pdo->prepare("UPDATE product_images SET is_main = 1 WHERE product_id = ? ORDER BY sort_order LIMIT 1")
            ->execute([$productId]);
    }
    respond(['message' => '이미지가 삭제되었습니다']);
}

// PATCH /api/products/:id/images/:imgId/main — 대표 이미지 변경
function set_main_image(int $productId, int $imageId): void {
    auth_admin();
    $pdo = db();

    // 해당 이미지가 이 상품 것인지 확인
    $check = $pdo->prepare("SELECT image_id FROM product_images WHERE image_id = ? AND product_id = ?");
    $check->execute([$imageId, $productId]);
    if (!$check->fetch()) error('이미지를 찾을 수 없습니다', 404);

    // 기존 대표 해제 후 새 대표 지정 (트랜잭션)
    $pdo->beginTransaction();
    $pdo->prepare("UPDATE product_images SET is_main = 0 WHERE product_id = ?")->execute([$productId]);
    $pdo->prepare("UPDATE product_images SET is_main = 1 WHERE image_id = ?")->execute([$imageId]);
    $pdo->commit();

    respond(['message' => '대표 이미지가 변경되었습니다', 'image_id' => $imageId]);
}
