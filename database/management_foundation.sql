-- ============================================================
-- OBLIGE MANAGEMENT FOUNDATION MIGRATION
-- 기존 database/oblige.sql 적용 후 한 번 실행
-- ============================================================

USE oblige;

-- 메인 페이지 및 공용 운영 콘텐츠
CREATE TABLE site_contents (
    content_id     INT AUTO_INCREMENT PRIMARY KEY,
    content_key    VARCHAR(100) NOT NULL UNIQUE,
    section_name   VARCHAR(50) NOT NULL,
    content_type   ENUM('TEXT','HERO','BANNER','CARD','LINK','JSON') NOT NULL DEFAULT 'TEXT',
    title          VARCHAR(200),
    subtitle       VARCHAR(255),
    body           TEXT,
    image_url      VARCHAR(500),
    link_url       VARCHAR(500),
    metadata_json  JSON,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order     INT NOT NULL DEFAULT 0,
    published_at   DATETIME,
    expires_at     DATETIME,
    updated_by     INT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

CREATE INDEX idx_site_contents_public
    ON site_contents(section_name, is_active, sort_order);

-- 재고 증감 원장: products.stock 변경 시 반드시 함께 기록
CREATE TABLE inventory_transactions (
    inventory_tx_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id      INT NOT NULL,
    tx_type         ENUM('INITIAL','ORDER','CANCEL','REFUND','ADJUST','RETURN_TO_STOCK')
                    NOT NULL,
    quantity_delta  INT NOT NULL,
    stock_after     INT NOT NULL,
    reference_type  VARCHAR(30),
    reference_id    INT,
    reason          VARCHAR(255),
    admin_id        INT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (admin_id) REFERENCES users(user_id)
);

CREATE INDEX idx_inventory_product_created
    ON inventory_transactions(product_id, created_at);
CREATE INDEX idx_inventory_reference
    ON inventory_transactions(reference_type, reference_id);

-- 주문 상태 변경 이력
CREATE TABLE order_status_histories (
    history_id  INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT NOT NULL,
    from_status VARCHAR(30),
    to_status   VARCHAR(30) NOT NULL,
    reason      VARCHAR(255),
    changed_by  INT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id)
);

CREATE INDEX idx_order_status_history
    ON order_status_histories(order_id, created_at);

-- 공병 반납 상태 변경 이력
CREATE TABLE return_status_histories (
    history_id  INT AUTO_INCREMENT PRIMARY KEY,
    return_id   INT NOT NULL,
    from_status VARCHAR(30),
    to_status   VARCHAR(30) NOT NULL,
    reason      VARCHAR(255),
    changed_by  INT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES empty_bottle_returns(return_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id)
);

CREATE INDEX idx_return_status_history
    ON return_status_histories(return_id, created_at);

-- 운영에 필요한 추적 컬럼
ALTER TABLE products
    ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 10 AFTER stock;

ALTER TABLE orders
    ADD COLUMN cancel_reason VARCHAR(255) AFTER tracking_number,
    ADD COLUMN cancelled_at DATETIME AFTER cancel_reason,
    ADD COLUMN refunded_at DATETIME AFTER cancelled_at;

ALTER TABLE refill_requests
    ADD COLUMN approved_by INT AFTER admin_memo,
    ADD COLUMN processed_at DATETIME AFTER approved_by,
    ADD CONSTRAINT fk_refill_approved_by FOREIGN KEY (approved_by) REFERENCES users(user_id);

ALTER TABLE campaigns
    ADD COLUMN banner_image_url VARCHAR(500) AFTER content,
    ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE campaign_participants
    ADD COLUMN approved_by INT AFTER admin_memo,
    ADD COLUMN reviewed_at DATETIME AFTER approved_by,
    ADD COLUMN rewarded_at DATETIME AFTER reviewed_at,
    ADD CONSTRAINT fk_campaign_participant_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(user_id);

ALTER TABLE point_transactions
    ADD COLUMN idempotency_key VARCHAR(100) AFTER reason,
    ADD UNIQUE KEY uq_point_idempotency (idempotency_key);

-- 기존 상품 재고를 원장 시작값으로 기록
INSERT INTO inventory_transactions
    (product_id, tx_type, quantity_delta, stock_after, reference_type, reason)
SELECT
    product_id, 'INITIAL', stock, stock, 'MIGRATION', '운영 관리 기반 마이그레이션 초기 재고'
FROM products;

-- 기본 메인 콘텐츠 예시
INSERT INTO site_contents
    (content_key, section_name, content_type, title, subtitle, body, sort_order, published_at)
VALUES
    ('home.hero', 'home', 'HERO', 'Beauty That Returns', '공병을 반납하면 가치가 돌아옵니다.',
     '비건 뷰티와 순환 리워드를 하나의 경험으로 연결합니다.', 10, NOW()),
    ('home.reward', 'home', 'TEXT', 'Return. Reward. Repeat.', '반납할수록 커지는 혜택',
     '공병 반납 포인트와 회원 등급 혜택을 확인하세요.', 20, NOW());
