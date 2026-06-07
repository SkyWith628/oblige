# OBLIGE 데이터베이스 연동 및 운영 관리 설계

## 1. 목표

메인 페이지와 관리자 페이지의 기능을 MySQL 데이터베이스를 기준으로 일관되게 운영한다.

- 메인 페이지는 공개 API를 통해 판매 상품, 캠페인, 운영 콘텐츠를 조회한다.
- 로그인 사용자는 장바구니, 주문, 반납, 리필, 캠페인 참여, 포인트 내역을 관리한다.
- 관리자는 회원, 상품, 재고, 주문, 반납, 리필, 캠페인, 메인 콘텐츠를 관리한다.
- 포인트, 재고, 업무 상태 변경은 원장과 이력을 남겨 중복 처리와 데이터 불일치를 방지한다.

## 2. 현재 연결 상태

| 영역 | 현재 상태 | 보완 필요 |
|---|---|---|
| 인증/회원 | 회원가입, 로그인, 내 정보 API 구현 | 관리자 상세 조회, 권한 세분화 |
| 상품 | 목록/상세/등록/수정/비활성화/이미지 구현 | 카테고리 관리, 재고 원장 |
| 장바구니 | API 구현 | 메인 페이지가 로컬 메모리 장바구니를 사용 중 |
| 주문 | API 구현 | 메인 체크아웃 미연결, 상태 이력/취소 재고 복원 |
| 공병 반납 | 신청 및 관리자 승인 구현 | 상태 이력, 중복 포인트 지급 방지 |
| 리필 | 사용자 신청 구현 | 관리자 목록/승인/배송 처리 |
| 캠페인 | 공개 목록/참여 신청 구현 | 관리자 CRUD, 참여 승인/보상 지급 |
| 메인 콘텐츠 | HTML에 고정 | DB 기반 콘텐츠 관리 |
| 관리자 감사 | `admin_logs` 테이블 존재 | 주요 관리자 작업에서 로그 기록 필요 |

## 3. 권한 모델

### 공개 사용자

- 활성 상품/카테고리/캠페인/메인 콘텐츠 조회
- 회원가입 및 로그인

### 로그인 사용자

- 본인의 장바구니, 주문, 반납, 리필, 캠페인 참여, 포인트, 알림 조회 및 처리
- 다른 사용자의 데이터는 조회하거나 수정할 수 없음

### 관리자

- 운영 데이터 전체 조회 및 처리
- 상품/캠페인/콘텐츠 생성과 수정
- 주문/반납/리필/캠페인 참여 상태 변경
- 회원 상태 및 포인트 조정
- 모든 변경 작업을 `admin_logs`에 기록

현재 `ADMIN` 단일 역할을 유지하되, 운영 규모가 커지면 `roles`, `permissions`,
`user_roles` 테이블을 추가해 상품 운영자와 CS 운영자 권한을 분리한다.

## 4. 화면별 DB/API 연결

### 메인 페이지

| 기능 | DB | API |
|---|---|---|
| 히어로/브랜드/리워드 문구 | `site_contents` | `GET /api/content?section=home` |
| 상품 목록/상세 | `products`, `categories`, `product_images`, `reviews` | `GET /api/products`, `GET /api/products/:id` |
| 캠페인 목록/상세 | `campaigns`, `campaign_participants` | `GET /api/campaigns`, `GET /api/campaigns/:id` |
| 장바구니 | `cart_items`, `products` | `GET/POST/PATCH/DELETE /api/cart` |
| 주문 생성/내역/취소 | `orders`, `order_items`, `point_transactions`, `inventory_transactions` | `POST/GET /api/orders`, `PATCH /api/orders/:id/cancel` |
| 반납 신청/내역 | `empty_bottle_returns`, `return_items` | `POST/GET /api/returns` |
| 리필 신청/내역 | `refill_requests` | `POST/GET /api/refill` |
| 내 정보/ESG/포인트 | `users`, `membership_grades`, `point_transactions`, `esg_stats` | `GET /api/user`, `GET /api/user/esg`, `GET /api/points` |
| 캠페인 참여 | `campaign_participants` | `POST /api/campaigns/:id/join` |

메인 페이지의 장바구니와 체크아웃은 현재 브라우저 메모리에만 존재한다. 로그인 후에는
반드시 `/api/cart`를 사용하고, 체크아웃 폼에서 배송지와 사용 포인트를 받아
`POST /api/orders`를 호출하도록 변경한다.

### 관리자 페이지

| 메뉴 | DB | 필요한 관리자 API |
|---|---|---|
| 대시보드 | 집계 쿼리 및 `esg_stats` | `GET /api/admin/dashboard` |
| 회원 관리 | `users`, `membership_grades`, `point_transactions` | 목록/상세/활성 상태/포인트 조정 |
| 상품 관리 | `products`, `categories`, `product_images` | 상품 CRUD, 카테고리 CRUD |
| 재고 관리 | `products.stock`, `inventory_transactions` | 재고 조정 및 원장 조회 |
| 주문 관리 | `orders`, `order_items`, `order_status_histories` | 상세 조회, 상태 변경, 취소/환불 |
| 반납 관리 | `empty_bottle_returns`, `return_items`, `return_status_histories` | 상세 조회, 상태 변경, 승인/반려 |
| 리필 관리 | `refill_requests` | 목록, 승인/반려, 송장, 완료 |
| 캠페인 관리 | `campaigns`, `campaign_participants` | 캠페인 CRUD, 참여 승인/반려 |
| 콘텐츠 관리 | `site_contents` | 메인 콘텐츠 CRUD/게시 |
| 감사 로그 | `admin_logs` | 관리자 작업 조회 |

## 5. 핵심 데이터 규칙

### 주문과 재고

1. 주문 생성 시 상품 행을 잠그고 재고를 검사한다.
2. 주문 상세를 생성한 뒤 재고를 차감한다.
3. 차감 내역을 `inventory_transactions`에 기록한다.
4. 취소/환불 시 한 번만 재고를 복원하고 복원 원장을 기록한다.
5. 허용 상태 전이만 처리한다.

허용 상태 전이:

```text
ORDERED -> PAID -> PREPARING -> SHIPPING -> DELIVERED
ORDERED/PAID -> CANCELLED
PAID/PREPARING/SHIPPING/DELIVERED -> REFUNDED
```

### 포인트

- `point_transactions`가 포인트의 원장이고 `users.total_point`는 조회 성능용 캐시다.
- 지급/차감은 반드시 하나의 DB 트랜잭션으로 처리한다.
- `idempotency_key`를 사용해 반납 승인, 캠페인 승인, 주문 적립의 중복 지급을 막는다.
- 관리자 수동 조정에는 사유를 필수로 입력한다.

### 공병 반납

```text
REQUESTED -> COLLECTING -> INSPECTING -> APPROVED
REQUESTED/COLLECTING/INSPECTING -> REJECTED
```

- `APPROVED` 전환 시에만 포인트 지급, 누적 반납 수 증가, 등급 재계산을 수행한다.
- 승인 처리는 한 트랜잭션에서 실행하고 상태 이력과 관리자 로그를 남긴다.

### 캠페인 참여

- 참여 신청은 사용자당 캠페인별 한 번만 가능하다.
- 관리자가 승인할 때만 보상 포인트를 지급한다.
- `rewarded_at`과 포인트 `idempotency_key`로 중복 지급을 방지한다.

### 메인 콘텐츠

- 콘텐츠는 `content_key`로 식별한다. 예: `home.hero`, `home.brand`, `home.reward`.
- `content_type`과 `metadata_json`으로 배너, 텍스트, 링크, 통계 카드 등을 표현한다.
- 공개 API는 `is_active=1`이고 게시 시간이 유효한 콘텐츠만 반환한다.

## 6. API 응답 원칙

- 성공: `{ "data": ..., "meta": ... }`
- 실패: `{ "error": { "code": "...", "message": "..." } }`
- 목록 API는 `page`, `limit`, `q`, `status`, `sort`를 공통 지원한다.
- 생성은 `201`, 인증 실패는 `401`, 권한 없음은 `403`, 미존재는 `404`,
  상태 충돌은 `409`, 검증 실패는 `422`를 사용한다.

기존 API 응답 형식과의 호환을 위해 응답 래퍼 변경은 마지막 단계에서 진행한다.

## 7. 구현 순서

### 운영 전 필수 수정

현재 코드에는 DB 연동 확대 전에 먼저 수정해야 하는 데이터 무결성 문제가 있다.

- `create_order()`와 `approve_return()`이 트랜잭션 내부에서 `give_point()` 또는
  `use_point()`를 호출한다. 포인트 함수가 다시 트랜잭션을 시작하므로 PDO에서 중첩
  트랜잭션 오류가 발생할 수 있다. 호출자가 시작한 트랜잭션을 공유하도록 포인트
  함수를 변경해야 한다.
- 직접 주문의 `items` 요청은 클라이언트가 보낸 상품명, 가격, 적립 포인트를 신뢰하면
  안 된다. 서버에서 상품 ID 목록을 다시 조회하고 가격, 재고, 적립 포인트를 확정해야 한다.
- 주문 취소는 현재 주문 상태만 변경한다. 재고 복원, 사용 포인트 반환, 구매 적립 포인트
  회수, 상태 이력을 하나의 트랜잭션으로 처리해야 한다.
- 일반 반납 상태 변경 API에서 `APPROVED`로 직접 바꾸면 승인 포인트 지급 절차를 우회한다.
  승인과 반려는 전용 액션으로만 허용해야 한다.
- 관리자 캠페인 등록 화면은 현재 성공 메시지만 표시하고 DB에 저장하지 않는다.
  관리자 캠페인 CRUD API 연결 전에는 운영 기능으로 간주하면 안 된다.

### 1단계: 거래 핵심 연결

- 메인 장바구니를 `/api/cart`에 연결
- 체크아웃 폼과 `POST /api/orders` 연결
- 마이페이지에 주문/반납/포인트 내역 연결
- 재고 원장과 주문/반납 상태 이력 적용

### 2단계: 관리자 운영 완성

- 주문/반납 상세 모달과 상태 전이 검증
- 리필 관리자 API 및 화면 추가
- 캠페인 CRUD와 참여 승인/포인트 지급 구현
- 카테고리 및 재고 조정 기능 추가
- 주요 관리자 처리에 감사 로그 기록

### 3단계: 콘텐츠와 통계

- 메인 콘텐츠 API 및 관리자 콘텐츠 편집 화면 추가
- 캠페인과 메인 섹션을 DB 기반으로 렌더링
- 일별 운영 통계 테이블 또는 집계 작업 추가

## 8. 검증 기준

- 동일 요청 재시도 시 포인트와 재고가 중복 반영되지 않는다.
- 주문, 반납, 리필, 캠페인의 허용되지 않은 상태 전이가 거부된다.
- 모든 관리자 변경 작업에서 담당자, 대상, 변경 전후 값, 시간이 조회된다.
- 비활성 상품과 미게시 콘텐츠는 메인 페이지에 노출되지 않는다.
- 사용자는 본인의 주문과 신청만 조회할 수 있다.
- 관리자 화면의 수치와 원장 합계가 일치한다.
