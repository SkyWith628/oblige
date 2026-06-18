-- ============================================================
--  OBLIGE — 개발용 시드 데이터 (선택)
--  schema.sql 적용 후 실행. 운영 DB에는 넣지 않는다.
--  관리자 계정은 password_hash(bcrypt) 가 필요하므로 FastAPI 시드 스크립트로 생성한다.
-- ============================================================

-- 샘플 상품 (카테고리명으로 연결)
insert into products (category_id, name, price, stock, description, is_vegan, is_refillable, return_point, earn_point)
select c.id, '오블리제 칼밍 토너', 38000, 50, '자연 유래 성분으로 자극을 최소화한 비건 토너', true, true, 500, 380
from categories c where c.name = '토너'
on conflict do nothing;

insert into products (category_id, name, price, stock, description, is_vegan, is_refillable, return_point, earn_point)
select c.id, '오블리제 비건 앰플', 52000, 30, '농축 비건 성분으로 탄력과 수분을 동시에 케어', true, true, 700, 520
from categories c where c.name = '앰플'
on conflict do nothing;

insert into products (category_id, name, price, stock, description, is_vegan, is_refillable, return_point, earn_point)
select c.id, '오블리제 ECO 크림', 45000, 40, '리필 가능한 친환경 용기에 담긴 깊은 보습 크림', true, true, 600, 450
from categories c where c.name = '크림'
on conflict do nothing;

-- 샘플 캠페인
insert into campaigns (title, mission_desc, reward_point, start_date, end_date)
values ('공병 반납 챌린지 시즌 2', 'SNS에 #OBLIGE공병반납 인증', 1000, current_date, current_date + 30)
on conflict do nothing;
