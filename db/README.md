# OBLIGE DB — PostgreSQL

FastAPI 백엔드용 **단일 정본 스키마**. 기준: [../docs/database-management-design.md](../docs/database-management-design.md)

기존 `../database/`(Supabase·MySQL 분기 자산)를 통합·정리해 새로 작성했다.
인증/인가와 비즈니스 트랜잭션은 FastAPI(`api/`)가 담당하므로 RLS·DB 비즈니스 함수는 두지 않는다.

## 파일
| 파일 | 역할 |
|---|---|
| `schema.sql` | 전체 테이블·인덱스·제약·트리거 + 기준 데이터(등급·카테고리·콘텐츠) |
| `seed.sql` | 개발용 샘플 데이터 (상품·캠페인). 운영 제외 |

## 실행

```bash
# Docker (권장) — 최초 기동 시 schema.sql → seed.sql 자동 적용
docker compose up -d db
# 관리 GUI: http://localhost:8080 (adminer)

# 또는 로컬 psql 직접 적용
psql "postgresql://oblige:oblige_dev@localhost:5432/oblige" -f db/schema.sql
psql "postgresql://oblige:oblige_dev@localhost:5432/oblige" -f db/seed.sql
```

> ⚠️ 현재 이 PC에는 Docker/PostgreSQL이 설치돼 있지 않다. Docker Desktop 설치 후 위 명령으로 검증한다.

## 핵심 설계

- **`users`** — FastAPI 인증(email + bcrypt `password_hash`). Supabase `profiles` 대체.
- **상태값은 영문 enum + CHECK**. 전이 규칙은 FastAPI 서비스에서 검증:
  - 주문: `ORDERED → PAID → PREPARING → SHIPPING → DELIVERED` / `… → CANCELLED|REFUNDED`
  - 반납: `REQUESTED → COLLECTING → INSPECTING → APPROVED` / `… → REJECTED`
- **원장 분리** — `point_transactions`(포인트), `inventory_transactions`(재고)가 원장.
  `users.total_point`·`products.stock`은 조회용 캐시.
- **중복 지급 방지** — `point_transactions.idempotency_key` UNIQUE.
- **상태 이력** — `order_status_histories`, `return_status_histories`.
- **AI 연동** — `empty_bottle_returns.photo_urls`(사진) + `ai_detection` jsonb(YOLO 결과).
- **감사 로그** — `admin_logs`에 관리자 변경 전/후 기록.

## 다음 (Phase 3)
SQLAlchemy 모델을 `api/app/models/`에 정의하고, Alembic 초기 마이그레이션으로 이 스키마를 가져와 관리 전환한다. 관리자 계정은 FastAPI 시드 스크립트(bcrypt 해시)로 생성.
