-- ============================================================
--  OBLIGE DATABASE SCHEMA
--  ESG 리워드 플랫폼 + 비건 코스메틱 쇼핑몰 + 공병 회수 시스템
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+09:00';

CREATE DATABASE IF NOT EXISTS oblige
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE oblige;

-- ============================================================
--  1. 회원 등급 (먼저 생성 — users FK 참조)
-- ============================================================
CREATE TABLE membership_grades (
    grade_id    INT AUTO_INCREMENT PRIMARY KEY,
    grade_name  VARCHAR(20)  NOT NULL,           -- Seed / Leaf / Tree / Forest
    grade_icon  VARCHAR(10)  NOT NULL DEFAULT '🌱',
    min_return_count INT NOT NULL DEFAULT 0,     -- 최소 반납 누적 수
    point_rate  DECIMAL(4,2) NOT NULL DEFAULT 1.00, -- 포인트 적립 배율
    benefit     VARCHAR(255),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO membership_grades (grade_name, grade_icon, min_return_count, point_rate, benefit) VALUES
('Seed',   '🌱',  0,  1.00, '기본 포인트 적립, 회원 전용 뉴스레터'),
('Leaf',   '🍃',  3,  1.10, '추가 포인트 +10%, 신제품 우선 구매'),
('Tree',   '🌳',  7,  1.20, '친환경 굿즈 제공, 포인트 +20%, 리필 할인 쿠폰'),
('Forest', '🌲', 15,  1.30, '리필 무료 혜택, 한정 상품 우선 제공, 앰배서더 자격');

-- ============================================================
--  2. 회원
-- ============================================================
CREATE TABLE users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    email          VARCHAR(100) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    name           VARCHAR(50)  NOT NULL,
    phone          VARCHAR(20),
    grade_id       INT NOT NULL DEFAULT 1,
    total_point    INT NOT NULL DEFAULT 0,        -- 현재 보유 포인트 (캐시)
    total_returns  INT NOT NULL DEFAULT 0,        -- 누적 반납 공병 수 (캐시)
    role           ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at  DATETIME,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_id) REFERENCES membership_grades(grade_id)
);

-- 인덱스
CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_grade   ON users(grade_id);
CREATE INDEX idx_users_role    ON users(role);

-- ============================================================
--  3. 배송지 (다중 배송지 지원)
-- ============================================================
CREATE TABLE shipping_addresses (
    address_id     INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    label          VARCHAR(50) DEFAULT '기본배송지', -- 집 / 회사 등
    receiver_name  VARCHAR(50) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    zipcode        VARCHAR(10),
    address        VARCHAR(255) NOT NULL,
    detail_address VARCHAR(255),
    is_default     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_addr_user ON shipping_addresses(user_id);

-- ============================================================
--  4. 카테고리
-- ============================================================
CREATE TABLE categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    sort_order    INT NOT NULL DEFAULT 0
);

INSERT INTO categories (category_name, sort_order) VALUES
('토너',     1),
('앰플',     2),
('크림',     3),
('리필상품', 4),
('굿즈',     5);

-- ============================================================
--  5. 상품
-- ============================================================
CREATE TABLE products (
    product_id    INT AUTO_INCREMENT PRIMARY KEY,
    category_id   INT NOT NULL,
    product_name  VARCHAR(100) NOT NULL,
    price         INT NOT NULL,
    stock         INT NOT NULL DEFAULT 0,
    description   TEXT,
    ingredients   TEXT,
    usage_guide   TEXT,
    is_vegan      BOOLEAN NOT NULL DEFAULT TRUE,
    is_refillable BOOLEAN NOT NULL DEFAULT FALSE,
    return_point  INT NOT NULL DEFAULT 0,    -- 공병 반납 시 지급 포인트
    earn_point    INT NOT NULL DEFAULT 0,    -- 구매 시 적립 포인트
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order    INT NOT NULL DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active   ON products(is_active);

INSERT INTO products (category_id, product_name, price, stock, description, is_vegan, is_refillable, return_point, earn_point) VALUES
(1, 'OBLIGE Calm Toner',    38000, 100, '비건 성분으로 피부 결을 정돈하는 토너',          TRUE, TRUE,  500, 380),
(2, 'OBLIGE Glow Ampoule',  45000,  80, '비타민C 유도체 함유 비건 앰플',                   TRUE, TRUE,  700, 450),
(3, 'OBLIGE Barrier Cream', 42000,  90, '세라마이드 3종 함유 비건 장벽 크림',              TRUE, TRUE,  600, 420),
(4, 'OBLIGE Refill Set',    29000,  50, '기존 공병 보유 회원 전용 리필 패키지 (20% 할인)', TRUE, FALSE, 0,   290),
(5, 'OBLIGE ECO Pouch',     15000, 200,'재생 원단으로 제작한 친환경 파우치 굿즈',          TRUE, FALSE, 0,   150);

-- ============================================================
--  6. 상품 이미지
-- ============================================================
CREATE TABLE product_images (
    image_id   INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url  VARCHAR(500) NOT NULL,
    is_main    BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE INDEX idx_prod_images ON product_images(product_id);

-- ============================================================
--  7. 장바구니
-- ============================================================
CREATE TABLE cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    product_id   INT NOT NULL,
    quantity     INT NOT NULL DEFAULT 1,
    added_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cart (user_id, product_id),
    FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- ============================================================
--  8. 주문
-- ============================================================
CREATE TABLE orders (
    order_id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,
    order_number     VARCHAR(30) NOT NULL UNIQUE,  -- ORD-20260602-000001
    total_price      INT NOT NULL,
    used_point       INT NOT NULL DEFAULT 0,
    shipping_fee     INT NOT NULL DEFAULT 3000,
    final_price      INT NOT NULL,
    order_status     ENUM('ORDERED','PAID','PREPARING','SHIPPING','DELIVERED','CANCELLED','REFUNDED')
                     NOT NULL DEFAULT 'ORDERED',
    receiver_name    VARCHAR(50) NOT NULL,
    receiver_phone   VARCHAR(20) NOT NULL,
    zipcode          VARCHAR(10),
    shipping_address VARCHAR(255) NOT NULL,
    detail_address   VARCHAR(255),
    delivery_memo    VARCHAR(255),
    tracking_number  VARCHAR(50),
    paid_at          DATETIME,
    shipped_at       DATETIME,
    delivered_at     DATETIME,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_orders_user   ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ============================================================
--  9. 주문 상세
-- ============================================================
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT NOT NULL,
    product_id    INT NOT NULL,
    product_name  VARCHAR(100) NOT NULL,  -- 주문 시점 이름 스냅샷
    price         INT NOT NULL,            -- 주문 시점 가격 스냅샷
    quantity      INT NOT NULL,
    earn_point    INT NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id)   REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
--  10. 공병 반납 신청 (OBLIGE 핵심)
-- ============================================================
CREATE TABLE empty_bottle_returns (
    return_id     INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    return_number VARCHAR(30) NOT NULL UNIQUE,   -- RET-20260602-000001
    return_method ENUM('DELIVERY','OFFLINE') NOT NULL,
    return_status ENUM('REQUESTED','COLLECTING','INSPECTING','APPROVED','REJECTED')
                  NOT NULL DEFAULT 'REQUESTED',
    total_quantity INT NOT NULL DEFAULT 0,
    total_point    INT NOT NULL DEFAULT 0,
    admin_memo     TEXT,
    approved_by    INT,                          -- admin user_id
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    approved_at    DATETIME,
    FOREIGN KEY (user_id)     REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

CREATE INDEX idx_returns_user   ON empty_bottle_returns(user_id);
CREATE INDEX idx_returns_status ON empty_bottle_returns(return_status);

-- ============================================================
--  11. 공병 반납 상세
-- ============================================================
CREATE TABLE return_items (
    return_item_id  INT AUTO_INCREMENT PRIMARY KEY,
    return_id       INT NOT NULL,
    product_id      INT NOT NULL,
    product_name    VARCHAR(100) NOT NULL,
    quantity        INT NOT NULL,
    point_per_bottle INT NOT NULL,
    subtotal_point  INT NOT NULL,
    FOREIGN KEY (return_id)   REFERENCES empty_bottle_returns(return_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)  REFERENCES products(product_id)
);

CREATE INDEX idx_return_items ON return_items(return_id);

-- ============================================================
--  12. 포인트 내역
-- ============================================================
CREATE TABLE point_transactions (
    pt_id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    point_type   ENUM('EARN','USE') NOT NULL,
    amount       INT NOT NULL,
    balance_after INT NOT NULL,              -- 거래 후 잔액 스냅샷
    source       ENUM('ORDER','RETURN','CAMPAIGN','REVIEW','EVENT','REFILL','ADMIN')
                 NOT NULL,
    ref_id       INT,                        -- 관련 order_id / return_id 등
    reason       VARCHAR(255),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_pt_user   ON point_transactions(user_id);
CREATE INDEX idx_pt_source ON point_transactions(source);

-- ============================================================
--  13. 리필 신청
-- ============================================================
CREATE TABLE refill_requests (
    refill_id     INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    product_id    INT NOT NULL,
    return_id     INT,                        -- 연결된 공병 반납 건
    refill_status ENUM('REQUESTED','APPROVED','SHIPPING','COMPLETED','REJECTED')
                  NOT NULL DEFAULT 'REQUESTED',
    refill_amount VARCHAR(50),               -- 용량 (예: 50ml)
    shipping_address VARCHAR(255),
    tracking_number  VARCHAR(50),
    admin_memo    TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (return_id) REFERENCES empty_bottle_returns(return_id)
);

CREATE INDEX idx_refill_user ON refill_requests(user_id);

-- ============================================================
--  14. 리뷰
-- ============================================================
CREATE TABLE reviews (
    review_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    product_id  INT NOT NULL,
    order_id    INT,                          -- 구매 인증 리뷰
    rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content     TEXT,
    image_url   VARCHAR(500),
    earn_point  INT NOT NULL DEFAULT 50,      -- 리뷰 작성 적립 포인트
    is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (order_id)   REFERENCES orders(order_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user    ON reviews(user_id);

-- ============================================================
--  15. 캠페인
-- ============================================================
CREATE TABLE campaigns (
    campaign_id  INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(100) NOT NULL,
    content      TEXT,
    reward_point INT NOT NULL DEFAULT 0,
    mission_desc VARCHAR(255),               -- 미션 설명 (예: SNS 인증샷 업로드)
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO campaigns (title, content, reward_point, mission_desc, start_date, end_date) VALUES
('#OBLIGE공병반납 챌린지', 'SNS에 공병 반납 인증샷을 올리고 포인트를 받으세요!',
 300, 'SNS에 #OBLIGE공병반납 태그와 함께 인증샷 업로드', '2026-06-01', '2026-08-31'),
('비건 뷰티 일기 챌린지', '비건 뷰티 루틴을 기록하고 공유하세요.',
 200, '인스타그램 또는 블로그에 비건 뷰티 루틴 공유', '2026-06-01', '2026-07-31');

-- ============================================================
--  16. 캠페인 참여
-- ============================================================
CREATE TABLE campaign_participants (
    participant_id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id    INT NOT NULL,
    user_id        INT NOT NULL,
    sns_url        VARCHAR(500),
    image_url      VARCHAR(500),
    status         ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    admin_memo     TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_campaign_user (campaign_id, user_id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),
    FOREIGN KEY (user_id)     REFERENCES users(user_id)
);

-- ============================================================
--  17. 알림
-- ============================================================
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    noti_type       ENUM('ORDER','SHIPPING','RETURN','POINT','GRADE','CAMPAIGN','SYSTEM')
                    NOT NULL,
    title           VARCHAR(100) NOT NULL,
    message         TEXT NOT NULL,
    ref_id          INT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_noti_user   ON notifications(user_id);
CREATE INDEX idx_noti_unread ON notifications(user_id, is_read);

-- ============================================================
--  18. 관리자 액션 로그 (감사 추적)
-- ============================================================
CREATE TABLE admin_logs (
    log_id      INT AUTO_INCREMENT PRIMARY KEY,
    admin_id    INT NOT NULL,
    action      VARCHAR(100) NOT NULL,        -- 예: APPROVE_RETURN, UPDATE_STOCK
    target_type VARCHAR(50),                  -- 예: return, order, user
    target_id   INT,
    detail      TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(user_id)
);

CREATE INDEX idx_admin_logs ON admin_logs(admin_id, created_at);

-- ============================================================
--  19. ESG 통계 뷰 (집계용)
-- ============================================================
CREATE VIEW esg_stats AS
SELECT
    u.user_id,
    u.name,
    u.total_returns                              AS total_bottles,
    ROUND(u.total_returns * 0.05, 2)             AS plastic_kg_saved,   -- 공병 1개 = 약 50g
    ROUND(u.total_returns * 0.12, 2)             AS co2_kg_saved,       -- 공병 1개 = 약 120g CO2 절감 추산
    u.total_point,
    g.grade_name
FROM users u
JOIN membership_grades g ON u.grade_id = g.grade_id
WHERE u.role = 'USER';

-- ============================================================
--  20. 샘플 관리자 계정
--  비밀번호: Admin@1234  (bcrypt hash)
-- ============================================================
INSERT INTO users (email, password_hash, name, phone, grade_id, role) VALUES
('admin@oblige.kr',
 '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMXNDnSHYuN1mHEWKqV4rGkZ7K',
 'OBLIGE 관리자', '010-0000-0000', 1, 'ADMIN');
