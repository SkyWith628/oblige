# OBLIGE API — FastAPI 백엔드

비즈니스 API + AI 공병 인식 추론. (기존 PHP 백엔드는 `../legacy/api-php/`)

## 구조
```
api/app/
├── main.py            FastAPI 앱 + CORS + 라우터 등록 + /health
├── core/
│   ├── config.py      환경변수 설정 (pydantic-settings)
│   ├── db.py          SQLAlchemy 엔진/세션 + Base
│   └── security.py    bcrypt 해시 + JWT
├── models.py          ORM 모델 (db/schema.sql 매핑, 코어 슬라이스)
├── schemas.py         Pydantic 입출력 스펙
├── deps.py            현재 사용자/관리자 의존성
├── routers/           auth · products · ai
└── services/
    └── inference.py   YOLO 싱글턴 추론 (ultralytics lazy import)
```

## 실행 (Python 3.12 권장 — 3.14 미지원 라이브러리 있음)
```bash
cd api
py -3.12 -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env          # 값 수정

uvicorn app.main:app --reload   # http://localhost:8000
# 문서: http://localhost:8000/docs
```

> DB 연동 엔드포인트(auth·products)는 PostgreSQL이 떠 있어야 동작한다
> (`docker compose up -d db`). `/health`, `/docs` 는 DB 없이도 응답.

## 엔드포인트
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 헬스체크 |
| POST | `/api/auth/register` · `login` | 회원가입 / 로그인(JWT) |
| GET | `/api/auth/me` | 내 정보 |
| GET | `/api/products` · `/{id}` | 상품 목록 / 상세 |
| GET·POST | `/api/cart` | 장바구니 조회 / 담기 |
| PATCH·DELETE | `/api/cart/{id}` | 수량 변경 / 삭제 |
| POST | `/api/orders` | 주문 생성 (서버 가격·재고 재확정, 포인트·재고 원장) |
| GET | `/api/orders` · `/{id}` | 내 주문 / 상세 |
| POST | `/api/orders/{id}/cancel` | 취소 (재고 복원·포인트 환급/회수) |
| POST·GET | `/api/returns` | 공병 반납 신청 / 내 신청 |
| PATCH | `/api/returns/{id}/status` | (관리자) 상태 전이, APPROVED 시 포인트·등급 |
| GET | `/api/points` · `/balance` | 포인트 내역 / 잔액 |
| POST | `/api/ai/detect-bottle` | 공병 사진 → 종류·개수 탐지 (YOLO) |

## 비즈니스 규칙 (services/)
- 포인트·재고 헬퍼는 commit하지 않고 호출자 트랜잭션 공유 (중첩 트랜잭션 방지)
- 주문 생성: 행 잠금 + 서버 가격 재확정 + 재고 차감·원장 + 멱등 적립
- 멱등키(`order:{id}:earn` 등)로 중복 지급 차단, 상태 전이 검증(`transitions.py`)

## 다음 (Phase 5/6)
Next.js(web) 연동 · AI 에이전트(반납 어시스턴트). DB 기동 후 Alembic 도입.
