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

## 엔드포인트 (Phase 3 코어)
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 헬스체크 |
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 (JWT 발급) |
| GET | `/api/auth/me` | 내 정보 (인증 필요) |
| GET | `/api/products` | 상품 목록 |
| GET | `/api/products/{id}` | 상품 상세 |
| POST | `/api/ai/detect-bottle` | 공병 사진 → 종류·개수 탐지 (YOLO) |

## 다음 (Phase 4)
주문/장바구니/공병반납/포인트 트랜잭션 + 관리자 API. Alembic 마이그레이션 도입.
AI 에이전트(반납 어시스턴트)는 Phase 6.
