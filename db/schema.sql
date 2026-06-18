-- ============================================================
--  OBLIGE — PostgreSQL Schema (FastAPI 백엔드용 단일 정본)
--  기준: docs/database-management-design.md
--  인증/인가·비즈니스 트랜잭션은 FastAPI(api/)가 담당 → RLS·DB함수 없음.
--
--  적용:  psql "$DATABASE_URL" -f db/schema.sql
--  (Phase 3에서 Alembic 초기 마이그레이션으로 이 스키마를 관리 전환)
-- ============================================================

-- ── 확장 / 공통 트리거 ────────────────────────────────────
create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============================================================
--  1. 회원 / 등급
-- ============================================================

-- 등급 규칙 (기준 변경 시 여기만 수정)
create table if not exists membership_grades (
  grade            text primary key,
  grade_icon       text not null default '🌱',
  min_return_count integer not null default 0,
  point_rate       numeric(4,2) not null default 1.00,
  benefit          text
);
insert into membership_grades values
  ('Seed',   '🌱',  0,  1.00, '기본 포인트 적립, 회원 전용 뉴스레터'),
  ('Leaf',   '🍃',  3,  1.10, '추가 포인트 +10%, 신제품 우선 구매'),
  ('Tree',   '🌳',  7,  1.20, '친환경 굿즈 제공, 포인트 +20%, 리필 할인 쿠폰'),
  ('Forest', '🌲', 15,  1.30, '리필 무료 혜택, 한정 상품 우선 제공, 앰배서더 자격')
on conflict (grade) do nothing;

-- 회원 (FastAPI 인증: 이메일 + bcrypt 해시)
create table if not exists users (
  id                  bigint generated always as identity primary key,
  email               text not null unique,
  password_hash       text not null,
  name                text not null default '회원',
  phone               text,
  role                text not null default 'user' check (role in ('user','admin')),
  grade               text not null default 'Seed' references membership_grades(grade),
  total_point         integer not null default 0 check (total_point >= 0),  -- 조회 캐시. 원장은 point_transactions
  bottle_return_count integer not null default 0 check (bottle_return_count >= 0),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();

-- 배송지
create table if not exists shipping_addresses (
  id             bigint generated always as identity primary key,
  user_id        bigint not null references users on delete cascade,
  label          text default '기본배송지',
  receiver_name  text not null,
  receiver_phone text not null,
  zipcode        text,
  address        text not null,
  detail_address text,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists idx_shipping_user on shipping_addresses(user_id);

-- ============================================================
--  2. 상품 / 카테고리 / 재고
-- ============================================================

create table if not exists categories (
  id         bigint generated always as identity primary key,
  name       text not null unique,
  sort_order integer not null default 0
);
insert into categories (name, sort_order) values
  ('토너',1),('앰플',2),('크림',3),('선크림',4),('리필상품',5),('굿즈',6)
on conflict (name) do nothing;

create table if not exists products (
  id                  bigint generated always as identity primary key,
  category_id         bigint not null references categories,
  name                text not null,
  price               integer not null check (price >= 0),
  stock               integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 10,
  description         text,
  ingredients         text,
  usage_guide         text,
  is_vegan            boolean not null default true,
  is_refillable       boolean not null default false,
  return_point        integer not null default 0,   -- 공병 반납 시 지급 포인트(상품 기준)
  earn_point          integer not null default 0,   -- 구매 적립 포인트
  is_active           boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_active   on products(is_active);
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

create table if not exists product_images (
  id           bigint generated always as identity primary key,
  product_id   bigint not null references products on delete cascade,
  image_url    text not null,
  storage_path text,
  is_main      boolean not null default false,
  sort_order   integer not null default 0
);
create index if not exists idx_product_images_product on product_images(product_id);

-- 재고 증감 원장: products.stock 변경 시 항상 함께 기록
create table if not exists inventory_transactions (
  id             bigint generated always as identity primary key,
  product_id     bigint not null references products,
  tx_type        text not null check (tx_type in
                   ('INITIAL','ORDER','CANCEL','REFUND','ADJUST','RETURN_TO_STOCK')),
  quantity_delta integer not null,
  stock_after    integer not null,
  reference_type text,            -- 'orders' | 'returns' | 'manual' ...
  reference_id   bigint,
  reason         text,
  admin_id       bigint references users,
  created_at     timestamptz not null default now()
);
create index if not exists idx_inventory_product on inventory_transactions(product_id, created_at);
create index if not exists idx_inventory_ref     on inventory_transactions(reference_type, reference_id);

-- ============================================================
--  3. 장바구니 / 주문
-- ============================================================

create table if not exists cart_items (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users on delete cascade,
  product_id bigint not null references products on delete cascade,
  quantity   integer not null default 1 check (quantity > 0),
  added_at   timestamptz not null default now(),
  unique(user_id, product_id)
);
create index if not exists idx_cart_user on cart_items(user_id);

create sequence if not exists order_seq;
-- 상태 전이: ORDERED -> PAID -> PREPARING -> SHIPPING -> DELIVERED
--            ORDERED/PAID -> CANCELLED
--            PAID/PREPARING/SHIPPING/DELIVERED -> REFUNDED   (FastAPI 서비스에서 검증)
create table if not exists orders (
  id               bigint generated always as identity primary key,
  order_number     text not null unique
                   default 'OB-' || to_char(now(),'YYYYMMDD') || '-' ||
                            lpad(nextval('order_seq')::text,4,'0'),
  user_id          bigint not null references users,
  total_price      integer not null check (total_price >= 0),
  used_point       integer not null default 0 check (used_point >= 0),
  earned_point     integer not null default 0 check (earned_point >= 0),
  shipping_fee     integer not null default 0,
  final_price      integer generated always as (total_price - used_point + shipping_fee) stored,
  order_status     text not null default 'ORDERED' check (order_status in
                     ('ORDERED','PAID','PREPARING','SHIPPING','DELIVERED','CANCELLED','REFUNDED')),
  delivery_address text,
  tracking_number  text,
  cancel_reason    text,
  cancelled_at     timestamptz,
  refunded_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_orders_user   on orders(user_id);
create index if not exists idx_orders_status on orders(order_status);
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

create table if not exists order_items (
  id         bigint generated always as identity primary key,
  order_id   bigint not null references orders on delete cascade,
  product_id bigint not null references products,
  product_name text not null,                 -- 주문 시점 스냅샷
  quantity   integer not null check (quantity > 0),
  unit_price integer not null,                -- 주문 시점 스냅샷
  subtotal   integer generated always as (unit_price * quantity) stored
);
create index if not exists idx_order_items_order on order_items(order_id);

create table if not exists order_status_histories (
  id          bigint generated always as identity primary key,
  order_id    bigint not null references orders on delete cascade,
  from_status text,
  to_status   text not null,
  reason      text,
  changed_by  bigint references users,
  created_at  timestamptz not null default now()
);
create index if not exists idx_order_status_hist on order_status_histories(order_id, created_at);

-- ============================================================
--  4. 공병 반납 (AI 인식)
-- ============================================================
create sequence if not exists return_seq;
-- 상태 전이: REQUESTED -> COLLECTING -> INSPECTING -> APPROVED
--            REQUESTED/COLLECTING/INSPECTING -> REJECTED
--            APPROVED 전환 시에만 포인트 지급 + 등급 재계산 (FastAPI 서비스)
create table if not exists empty_bottle_returns (
  id              bigint generated always as identity primary key,
  return_number   text not null unique
                  default 'RET-' || to_char(now(),'YYYYMMDD') || '-' ||
                           lpad(nextval('return_seq')::text,4,'0'),
  user_id         bigint not null references users,
  bottle_count    integer not null check (bottle_count > 0),
  return_method   text not null default 'DELIVERY' check (return_method in ('DELIVERY','DROPBOX')),
  photo_urls      text[] not null default '{}',     -- 사용자가 올린 공병 사진
  ai_detection    jsonb,                             -- YOLO 결과: [{type, count, confidence}] + 요약
  return_status   text not null default 'REQUESTED' check (return_status in
                    ('REQUESTED','COLLECTING','INSPECTING','APPROVED','REJECTED')),
  approved_point  integer not null default 0,
  inspection_memo text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_returns_user   on empty_bottle_returns(user_id);
create index if not exists idx_returns_status on empty_bottle_returns(return_status);
create trigger trg_returns_updated before update on empty_bottle_returns
  for each row execute function set_updated_at();

create table if not exists return_status_histories (
  id          bigint generated always as identity primary key,
  return_id   bigint not null references empty_bottle_returns on delete cascade,
  from_status text,
  to_status   text not null,
  reason      text,
  changed_by  bigint references users,
  created_at  timestamptz not null default now()
);
create index if not exists idx_return_status_hist on return_status_histories(return_id, created_at);

-- ============================================================
--  5. 리필 / 리뷰
-- ============================================================
create table if not exists refill_requests (
  id               bigint generated always as identity primary key,
  user_id          bigint not null references users,
  product_id       bigint not null references products,
  refill_amount    integer not null,
  used_point       integer not null default 0,
  status           text not null default 'REQUESTED' check (status in
                     ('REQUESTED','APPROVED','REJECTED','SHIPPING','COMPLETED')),
  shipping_address text,
  admin_memo       text,
  approved_by      bigint references users,
  tracking_number  text,
  processed_at     timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists idx_refill_user on refill_requests(user_id);

create table if not exists reviews (
  id         bigint generated always as identity primary key,
  product_id bigint not null references products on delete cascade,
  user_id    bigint not null references users on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  content    text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique(product_id, user_id)
);

-- ============================================================
--  6. 포인트 원장
-- ============================================================
-- users.total_point 는 조회용 캐시. 이 테이블이 원장.
-- idempotency_key 로 반납 승인/캠페인 승인/주문 적립의 중복 지급 차단.
create table if not exists point_transactions (
  id              bigint generated always as identity primary key,
  user_id         bigint not null references users,
  point_change    integer not null,             -- 양수=적립, 음수=차감
  balance_after   integer not null,
  tx_type         text not null check (tx_type in ('EARN','USE','ADJUST')),
  reason          text,
  idempotency_key text unique,
  ref_table       text,
  ref_id          bigint,
  admin_id        bigint references users,       -- 수동 조정 시
  created_at      timestamptz not null default now()
);
create index if not exists idx_point_tx_user on point_transactions(user_id, created_at desc);

-- ============================================================
--  7. 캠페인
-- ============================================================
create table if not exists campaigns (
  id               bigint generated always as identity primary key,
  title            text not null,
  mission_desc     text,
  reward_point     integer not null default 0,
  content          text,
  banner_image_url text,
  start_date       date,
  end_date         date,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_campaigns_updated before update on campaigns
  for each row execute function set_updated_at();

-- 참여: 사용자당 캠페인별 1회. 승인 시에만 보상 지급(rewarded_at + point idempotency_key).
create table if not exists campaign_participants (
  id          bigint generated always as identity primary key,
  campaign_id bigint not null references campaigns on delete cascade,
  user_id     bigint not null references users on delete cascade,
  sns_url     text,
  status      text not null default 'JOINED' check (status in ('JOINED','APPROVED','REJECTED')),
  admin_memo  text,
  approved_by bigint references users,
  reviewed_at timestamptz,
  rewarded_at timestamptz,
  joined_at   timestamptz not null default now(),
  unique(campaign_id, user_id)
);

-- ============================================================
--  8. 운영 콘텐츠 / 알림 / 감사 로그
-- ============================================================
create table if not exists site_contents (
  id            bigint generated always as identity primary key,
  content_key   text not null unique,            -- 'home.hero', 'home.reward' ...
  section_name  text not null,
  content_type  text not null default 'TEXT' check (content_type in
                  ('TEXT','HERO','BANNER','CARD','LINK','JSON')),
  title         text,
  subtitle      text,
  body          text,
  image_url     text,
  link_url      text,
  metadata_json jsonb,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  published_at  timestamptz,
  expires_at    timestamptz,
  updated_by    bigint references users,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_site_contents_public on site_contents(section_name, is_active, sort_order);
create trigger trg_site_contents_updated before update on site_contents
  for each row execute function set_updated_at();

insert into site_contents (content_key, section_name, content_type, title, subtitle, body, sort_order, published_at)
values
  ('home.hero', 'home', 'HERO', 'Beauty That Returns', '공병을 반납하면 가치가 돌아옵니다.',
   '비건 뷰티와 순환 리워드를 하나의 경험으로 연결합니다.', 10, now()),
  ('home.reward', 'home', 'TEXT', 'Return. Reward. Repeat.', '반납할수록 커지는 혜택',
   '공병 반납 포인트와 회원 등급 혜택을 확인하세요.', 20, now())
on conflict (content_key) do nothing;

create table if not exists notifications (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users on delete cascade,
  title      text not null,
  message    text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id, is_read);

-- 관리자 작업 감사 로그
create table if not exists admin_logs (
  id          bigint generated always as identity primary key,
  admin_id    bigint not null references users,
  action      text not null,            -- 'product.update', 'return.approve' ...
  target_type text,
  target_id   bigint,
  before_json jsonb,
  after_json  jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_admin_logs on admin_logs(admin_id, created_at desc);
