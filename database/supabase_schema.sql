-- ============================================================
--  OBLIGE — Supabase (PostgreSQL) Schema
--  Supabase SQL Editor 에 전체 붙여넣기 후 Run
-- ============================================================

-- ── 0. 확장 ──────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── 1. 공통 updated_at 트리거 ─────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ── 2. 등급 규칙 (기준 바뀌면 여기만 수정) ────────────────
create table if not exists grade_rules (
  grade           text primary key,
  grade_icon      text not null default '🌱',
  min_return_count integer not null default 0,
  point_rate      numeric(4,2) not null default 1.00,
  benefit         text
);
insert into grade_rules values
  ('Seed',   '🌱',  0,  1.00, '기본 포인트 적립, 회원 전용 뉴스레터'),
  ('Leaf',   '🍃',  3,  1.10, '추가 포인트 +10%, 신제품 우선 구매'),
  ('Tree',   '🌳',  7,  1.20, '친환경 굿즈 제공, 포인트 +20%, 리필 할인 쿠폰'),
  ('Forest', '🌲', 15,  1.30, '리필 무료 혜택, 한정 상품 우선 제공, 앰배서더 자격')
on conflict (grade) do nothing;

-- ── 3. 회원 프로필 ─────────────────────────────────────────
create table if not exists profiles (
  id                  uuid primary key references auth.users on delete cascade,
  name                text not null default '회원',
  phone               text,
  role                text not null default 'user' check (role in ('user','admin')),
  grade               text not null default 'Seed' references grade_rules(grade),
  point               integer not null default 0 check (point >= 0),
  bottle_return_count integer not null default 0 check (bottle_return_count >= 0),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_profiles_updated
  before update on profiles for each row execute function set_updated_at();

-- 회원가입 시 프로필 자동 생성
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', '회원'))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 4. 배송지 ──────────────────────────────────────────────
create table if not exists shipping_addresses (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references profiles on delete cascade,
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

-- ── 5. 카테고리 ────────────────────────────────────────────
create table if not exists categories (
  id         bigint generated always as identity primary key,
  name       text not null,
  sort_order integer not null default 0
);
insert into categories (name, sort_order) values
  ('토너',1),('앰플',2),('크림',3),('리필상품',4),('굿즈',5)
on conflict do nothing;

-- ── 6. 상품 ────────────────────────────────────────────────
create table if not exists products (
  id            bigint generated always as identity primary key,
  category_id   bigint not null references categories,
  name          text not null,
  price         integer not null check (price >= 0),
  stock         integer not null default 0 check (stock >= 0),
  description   text,
  ingredients   text,
  usage_guide   text,
  is_vegan      boolean not null default true,
  is_refillable boolean not null default false,
  return_point  integer not null default 0,
  earn_point    integer not null default 0,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_active   on products(is_active);
create trigger trg_products_updated
  before update on products for each row execute function set_updated_at();

-- 샘플 상품 (없으면 삽입)
insert into products (category_id, name, price, stock, description, is_vegan, is_refillable, return_point, earn_point)
select c.id, '오블리제 칼밍 토너', 38000, 50, '자연 유래 성분으로 피부 자극을 최소화한 비건 토너', true, true, 500, 380
from categories c where c.name = '토너' limit 1
on conflict do nothing;

insert into products (category_id, name, price, stock, description, is_vegan, is_refillable, return_point, earn_point)
select c.id, '오블리제 비건 앰플', 52000, 30, '농축 비건 성분으로 피부 탄력과 수분을 동시에 케어', true, true, 700, 520
from categories c where c.name = '앰플' limit 1
on conflict do nothing;

insert into products (category_id, name, price, stock, description, is_vegan, is_refillable, return_point, earn_point)
select c.id, '오블리제 ECO 크림', 45000, 40, '리필 가능한 친환경 용기에 담긴 깊은 보습 크림', true, true, 600, 450
from categories c where c.name = '크림' limit 1
on conflict do nothing;

-- ── 7. 상품 이미지 ─────────────────────────────────────────
create table if not exists product_images (
  id           bigint generated always as identity primary key,
  product_id   bigint not null references products on delete cascade,
  image_url    text not null,
  storage_path text,            -- Supabase Storage 경로 (삭제 시 사용)
  is_main      boolean not null default false,
  sort_order   integer not null default 0
);
create index if not exists idx_product_images_product on product_images(product_id);

-- ── 8. 장바구니 ────────────────────────────────────────────
create table if not exists cart_items (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references profiles on delete cascade,
  product_id bigint not null references products on delete cascade,
  quantity   integer not null default 1 check (quantity > 0),
  added_at   timestamptz not null default now(),
  unique(user_id, product_id)
);
create index if not exists idx_cart_user on cart_items(user_id);

-- ── 9. 주문 ────────────────────────────────────────────────
create sequence if not exists order_seq;

create table if not exists orders (
  id               bigint generated always as identity primary key,
  order_number     text not null unique
                   default 'OB-' || to_char(now(),'YYYYMMDD') || '-' ||
                            lpad(nextval('order_seq')::text,4,'0'),
  user_id          uuid not null references profiles,
  total_price      integer not null check (total_price >= 0),
  used_point       integer not null default 0 check (used_point >= 0),
  shipping_fee     integer not null default 0,
  final_price      integer generated always as (total_price - used_point + shipping_fee) stored,
  order_status     text not null default '결제완료',
  delivery_address text,
  tracking_number  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_orders_user on orders(user_id);
create trigger trg_orders_updated
  before update on orders for each row execute function set_updated_at();

create table if not exists order_items (
  id         bigint generated always as identity primary key,
  order_id   bigint not null references orders on delete cascade,
  product_id bigint not null references products,
  quantity   integer not null check (quantity > 0),
  unit_price integer not null,
  subtotal   integer generated always as (unit_price * quantity) stored
);
create index if not exists idx_order_items_order on order_items(order_id);

-- ── 10. 공병 반납 ──────────────────────────────────────────
create sequence if not exists return_seq;

create table if not exists bottle_returns (
  id               bigint generated always as identity primary key,
  return_number    text not null unique
                   default 'RET-' || to_char(now(),'YYYYMMDD') || '-' ||
                            lpad(nextval('return_seq')::text,4,'0'),
  user_id          uuid not null references profiles,
  bottle_count     integer not null check (bottle_count > 0),
  bottle_type      text not null default '일반 화장품 용기',
  return_method    text not null default 'DELIVERY',
  photo_urls       text[] not null default '{}',
  return_status    text not null default '신청접수',
  approved_point   integer not null default 0,
  inspection_memo  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_returns_user   on bottle_returns(user_id);
create index if not exists idx_returns_status on bottle_returns(return_status);
create trigger trg_bottle_returns_updated
  before update on bottle_returns for each row execute function set_updated_at();

-- ── 11. 포인트 로그 ────────────────────────────────────────
create table if not exists point_logs (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references profiles,
  point_change integer not null,
  balance      integer not null,
  log_type     text not null,   -- '적립' | '차감'
  reason       text,
  ref_table    text,
  ref_id       bigint,
  created_at   timestamptz not null default now()
);
create index if not exists idx_point_logs_user on point_logs(user_id, created_at desc);

-- ── 12. 리필 신청 ──────────────────────────────────────────
create table if not exists refill_requests (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references profiles,
  product_id      bigint not null references products,
  refill_amount   integer not null,
  used_point      integer not null default 0,
  status          text not null default '신청완료',
  shipping_address text,
  created_at      timestamptz not null default now()
);

-- ── 13. 리뷰 ───────────────────────────────────────────────
create table if not exists reviews (
  id         bigint generated always as identity primary key,
  product_id bigint not null references products on delete cascade,
  user_id    uuid not null references profiles on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  content    text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique(product_id, user_id)
);

-- ── 14. 캠페인 ─────────────────────────────────────────────
create table if not exists campaigns (
  id            bigint generated always as identity primary key,
  title         text not null,
  mission_desc  text,
  reward_point  integer not null default 0,
  content       text,
  start_date    date,
  end_date      date,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists campaign_participants (
  id          bigint generated always as identity primary key,
  campaign_id bigint not null references campaigns on delete cascade,
  user_id     uuid not null references profiles on delete cascade,
  sns_url     text,
  joined_at   timestamptz not null default now(),
  unique(campaign_id, user_id)
);

-- ── 15. 알림 ───────────────────────────────────────────────
create table if not exists notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references profiles on delete cascade,
  title      text not null,
  message    text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id);

-- ============================================================
--  RLS (Row Level Security)
-- ============================================================
alter table profiles             enable row level security;
alter table shipping_addresses   enable row level security;
alter table cart_items           enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table bottle_returns       enable row level security;
alter table point_logs           enable row level security;
alter table refill_requests      enable row level security;
alter table reviews              enable row level security;
alter table campaign_participants enable row level security;
alter table notifications        enable row level security;
-- products, product_images, categories, campaigns: 공개 읽기
alter table products             enable row level security;
alter table product_images       enable row level security;
alter table categories           enable row level security;
alter table campaigns            enable row level security;
alter table grade_rules          enable row level security;

-- 관리자 확인 헬퍼
create or replace function is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- grade_rules (전체 공개)
create policy "grade_rules_public_read" on grade_rules for select using (true);

-- categories (전체 공개)
create policy "categories_public_read" on categories for select using (true);

-- products (활성 상품은 전체 공개, 관리자만 CRUD)
create policy "products_public_read"  on products for select using (is_active = true or is_admin());
create policy "products_admin_insert" on products for insert with check (is_admin());
create policy "products_admin_update" on products for update using (is_admin());
create policy "products_admin_delete" on products for delete using (is_admin());

-- product_images (전체 공개 읽기)
create policy "product_images_public_read"  on product_images for select using (true);
create policy "product_images_admin_write"  on product_images for insert with check (is_admin());
create policy "product_images_admin_update" on product_images for update using (is_admin());
create policy "product_images_admin_delete" on product_images for delete using (is_admin());

-- profiles
create policy "profiles_own_read"   on profiles for select using (auth.uid() = id or is_admin());
create policy "profiles_own_update" on profiles for update using (auth.uid() = id);
create policy "profiles_admin_all"  on profiles for all using (is_admin());

-- shipping_addresses
create policy "shipping_own" on shipping_addresses for all using (auth.uid() = user_id);

-- cart_items
create policy "cart_own" on cart_items for all using (auth.uid() = user_id);

-- orders
create policy "orders_own_read"   on orders for select using (auth.uid() = user_id or is_admin());
create policy "orders_own_insert" on orders for insert with check (auth.uid() = user_id);
create policy "orders_admin_update" on orders for update using (is_admin());

-- order_items
create policy "order_items_own" on order_items for select
  using (exists(select 1 from orders where id = order_id and (user_id = auth.uid() or is_admin())));
create policy "order_items_insert" on order_items for insert with check (
  exists(select 1 from orders where id = order_id and user_id = auth.uid())
);

-- bottle_returns
create policy "returns_own_read"   on bottle_returns for select using (auth.uid() = user_id or is_admin());
create policy "returns_own_insert" on bottle_returns for insert with check (auth.uid() = user_id);
create policy "returns_admin_all"  on bottle_returns for all using (is_admin());

-- point_logs
create policy "point_logs_own"   on point_logs for select using (auth.uid() = user_id or is_admin());
create policy "point_logs_insert" on point_logs for insert with check (true); -- DB 함수에서만 insert

-- refill_requests
create policy "refill_own" on refill_requests for all using (auth.uid() = user_id);

-- reviews
create policy "reviews_public_read"  on reviews for select using (is_visible = true or is_admin());
create policy "reviews_own_insert"   on reviews for insert with check (auth.uid() = user_id);

-- campaigns (공개 읽기)
create policy "campaigns_public_read" on campaigns for select using (true);
create policy "campaigns_admin_write" on campaigns for insert with check (is_admin());

-- campaign_participants
create policy "camp_participants_own" on campaign_participants for all using (auth.uid() = user_id);

-- notifications
create policy "notifications_own" on notifications for all using (auth.uid() = user_id);

-- ============================================================
--  DB 함수 (비즈니스 로직)
-- ============================================================

-- ① 주문 생성 (재고·포인트 원자적 처리)
create or replace function create_order_fn(
  p_items          jsonb,     -- [{product_id, quantity}]
  p_used_point     integer  default 0,
  p_delivery_addr  text     default null
) returns bigint language plpgsql security definer as $$
declare
  v_user_id   uuid := auth.uid();
  v_order_id  bigint;
  v_total     integer := 0;
  v_item      jsonb;
  v_product   products%rowtype;
  v_shipping  integer;
  v_balance   integer;
begin
  if v_user_id is null then raise exception '로그인이 필요합니다'; end if;

  select point into v_balance from profiles where id = v_user_id for update;
  if p_used_point > v_balance then
    raise exception '포인트 잔액 부족 (보유: %, 요청: %)', v_balance, p_used_point;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product
    from products where id = (v_item->>'product_id')::bigint for update;
    if not found then raise exception '상품을 찾을 수 없습니다'; end if;
    if v_product.stock < (v_item->>'quantity')::integer then
      raise exception '재고 부족: %', v_product.name;
    end if;
    v_total := v_total + v_product.price * (v_item->>'quantity')::integer;
  end loop;

  v_shipping := case when v_total >= 50000 then 0 else 3000 end;

  insert into orders (user_id, total_price, used_point, shipping_fee, delivery_address)
  values (v_user_id, v_total, p_used_point, v_shipping, p_delivery_addr)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products where id = (v_item->>'product_id')::bigint;
    insert into order_items (order_id, product_id, quantity, unit_price)
    values (v_order_id, v_product.id, (v_item->>'quantity')::integer, v_product.price);
    update products set stock = stock - (v_item->>'quantity')::integer where id = v_product.id;
  end loop;

  if p_used_point > 0 then
    update profiles set point = point - p_used_point where id = v_user_id;
    insert into point_logs (user_id, point_change, balance, log_type, reason, ref_table, ref_id)
    values (v_user_id, -p_used_point, v_balance - p_used_point, '차감', '주문 포인트 사용', 'orders', v_order_id);
  end if;

  delete from cart_items where user_id = v_user_id;
  return v_order_id;
end; $$;

-- ② 공병 반납 승인 (포인트 지급 + 등급 자동 갱신)
create or replace function approve_bottle_return(
  p_return_id bigint,
  p_point     integer default null
) returns void language plpgsql security definer as $$
declare
  v_return  bottle_returns%rowtype;
  v_reward  integer;
  v_balance integer;
  v_cnt     integer;
  v_grade   text;
begin
  if not is_admin() then raise exception '관리자 권한이 필요합니다'; end if;

  select * into v_return from bottle_returns
  where id = p_return_id for update;
  if not found then raise exception '반납 신청을 찾을 수 없습니다'; end if;

  v_reward := coalesce(p_point, v_return.bottle_count * 500);

  update profiles
  set point               = point + v_reward,
      bottle_return_count = bottle_return_count + v_return.bottle_count
  where id = v_return.user_id
  returning point, bottle_return_count into v_balance, v_cnt;

  select grade into v_grade from grade_rules
  where min_return_count <= v_cnt
  order by min_return_count desc limit 1;
  update profiles set grade = v_grade where id = v_return.user_id;

  update bottle_returns
  set return_status  = '포인트지급완료',
      approved_point = v_reward,
      updated_at     = now()
  where id = p_return_id;

  insert into point_logs (user_id, point_change, balance, log_type, reason, ref_table, ref_id)
  values (v_return.user_id, v_reward, v_balance, '적립', '공병 반납 승인', 'bottle_returns', p_return_id);
end; $$;

-- ③ 관리자 대시보드 통계
create or replace function get_dashboard_stats()
returns jsonb language plpgsql security definer as $$
declare result jsonb;
begin
  if not is_admin() then raise exception '관리자 권한이 필요합니다'; end if;
  select jsonb_build_object(
    'total_users',        (select count(*) from profiles where role = 'user'),
    'new_users_today',    (select count(*) from profiles where created_at::date = current_date and role = 'user'),
    'total_orders',       (select count(*) from orders),
    'total_revenue',      (select coalesce(sum(final_price),0) from orders where order_status != '취소'),
    'approved_returns',   (select count(*) from bottle_returns where return_status = '포인트지급완료'),
    'total_bottles',      (select coalesce(sum(bottle_count),0) from bottle_returns where return_status = '포인트지급완료'),
    'pending_inspections',(select count(*) from bottle_returns where return_status = '신청접수'),
    'total_points_issued',(select coalesce(sum(point_change),0) from point_logs where log_type = '적립'),
    'plastic_kg_saved',   round((select coalesce(sum(bottle_count),0) from bottle_returns where return_status = '포인트지급완료') * 0.05, 2),
    'grade_distribution', (
      select coalesce(jsonb_agg(
        jsonb_build_object('grade', g.grade, 'grade_icon', gr.grade_icon, 'cnt', g.cnt)
        order by gr.min_return_count desc
      ), '[]'::jsonb)
      from (select grade, count(*) cnt from profiles where role = 'user' group by grade) g
      join grade_rules gr on gr.grade = g.grade
    )
  ) into result;
  return result;
end; $$;

-- ============================================================
--  Storage 버킷 안내
--  Supabase Dashboard → Storage → New Bucket 에서 생성:
--    버킷명: products   / Public: ON
--    버킷명: returns    / Public: OFF (관리자만)
-- ============================================================
