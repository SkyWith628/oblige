# OBLIGE — Responsible Beauty

> **공병을 반납하고, 지속가능한 아름다움을 채우다.**
> 비건 화장품 구매 · **AI 공병 인식** · 포인트 적립 · 리필 보상까지 연결된 ESG 코스메틱 플랫폼.

📅 **개발 기간:** 2026.05 ~ (진행 중)

[![CI](https://github.com/SkyWith628/oblige/actions/workflows/ci.yml/badge.svg)](https://github.com/SkyWith628/oblige/actions/workflows/ci.yml)

비건 화장품을 쓰고 공병을 반납하면 **YOLO 모델이 사진으로 종류·개수를 인식**해 포인트로 돌려주고,
**LLM 반납 어시스턴트**가 반납을 안내하는 풀스택 ESG 플랫폼.

---

## 🧱 아키텍처 (모노레포)

```
[사용자/iOS] → web(Next.js) → api(FastAPI) → db(PostgreSQL)
                                  │
                            ai(YOLOv8 공병 인식) · Claude 반납 어시스턴트
```

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 16 (App Router) · TypeScript |
| Mobile | iOS (Swift) — 사진 업로드 주력 |
| Backend | FastAPI (Python 3.12) · SQLAlchemy · JWT/bcrypt |
| Database | PostgreSQL 16 |
| AI 비전 | Ultralytics YOLOv8 (공병 인식) |
| AI 에이전트 | Claude (`claude-opus-4-8`, tool use) |
| 배포 | Vercel(web) + Railway(api+db) |
| DevOps | Docker Compose · GitHub Actions |

> 설계 상세: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · 배포: [docs/DEPLOY.md](docs/DEPLOY.md) · DB: [docs/database-management-design.md](docs/database-management-design.md)

## 🔧 기술적 도전과 해결  `🚧 개발 중`

- **거래 정합성** — 주문·포인트·재고를 FastAPI 서비스 계층의 **단일 트랜잭션**으로 처리. 행 잠금(`SELECT FOR UPDATE`) + 서버 측 가격·재고 재확정 + **멱등키**로 중복 지급·동시성 충돌을 차단 (실거래 통합 테스트 22/22 통과).
- **신뢰 경계를 서버에** — 가격·적립·등급 계산을 클라이언트가 아닌 **서버에서 재확정**해 포인트·재고가 조작되지 않도록 설계.
- **원장 분리** — `point_transactions`·`inventory_transactions`를 원장으로 두고, `total_point`·`stock`은 조회용 캐시로 분리해 추적성과 무결성 확보.
- **인증/권한** — Supabase 의존을 걷어내고 FastAPI에서 **JWT + bcrypt**로 직접 인증, 관리자 권한을 앱 계층에서 분리.
- **AI 통합** — 공병 인식을 추론 서비스로 분리(모델 싱글턴 로딩), **학습(GPU)/서빙(CPU) 분리**. 반납 어시스턴트는 Claude가 탐지·등급조회·반납신청을 도구로 호출.

## 📁 디렉토리

```
oblige/
├── web/        Next.js 프론트엔드 (디자인-무관 레이어 분리)
├── api/        FastAPI — auth·products·cart·orders·returns·points·ai·agent
│   ├── app/    core(config·db·security) · models · routers · services
│   └── scripts/verify_phase4.py  거래 통합 테스트
├── ai/         YOLOv8 공병 인식 (크롤러·라벨러·데이터셋·학습)
├── db/         PostgreSQL schema.sql · seed.sql
├── ios/        iOS 앱
├── docs/       설계·배포 문서
├── legacy/     이전 PHP 백엔드 (보관)
└── docker-compose.yml
```

## 🚀 로컬 실행

```bash
# 1) 풀스택 (Docker)
docker compose up -d --build
#   web http://localhost:3000 · api http://localhost:8000/docs

# 2) 개별 실행
#   DB:  docker compose up -d db   (또는 로컬 PostgreSQL)
#   API: cd api && py -3.12 -m venv .venv && .venv\Scripts\activate
#        pip install -r requirements.txt && uvicorn app.main:app --reload
#   web: cd web && npm install && npm run dev
```

AI 추론(`/api/ai/*`)은 `pip install ultralytics`, 반납 어시스턴트(`/api/agent/chat`)는 `.env`에 `ANTHROPIC_API_KEY` 필요.

## ♻️ 순환형 ESG 시스템

```
비건 화장품 구매 → 공병 준비 → AI 인식 & 포인트 적립 → 리필 혜택 → 재사용·업사이클
```

| 등급 | 조건 | 혜택 |
|------|------|------|
| 🌱 Seed | 기본 | 기본 적립 |
| 🍃 Leaf | 공병 3개 | 포인트 +10% |
| 🌳 Tree | 공병 7개 | 굿즈 · +20% · 리필 쿠폰 |
| 🌲 Forest | 공병 15개 | 리필 무료 · 앰배서더 |

## 🔌 주요 API (17개 엔드포인트)

`auth(가입/로그인/내정보)` · `products` · `cart` · `orders(생성·취소, 재고·포인트 원장)` ·
`returns(반납 신청·관리자 승인)` · `points` · `ai/detect-bottle(YOLO)` · `agent/chat(반납 어시스턴트)`

핵심 규칙: 서버 측 가격·재고 재확정 · 멱등키 중복지급 방지 · 상태 전이 검증 · 원장 분리(포인트·재고).

## 🔑 관리자 계정

관리자 계정은 가입 후 `users.role`을 `admin`으로 설정합니다.
(보안상 자격증명은 README에 기재하지 않으며, 환경별로 별도 관리합니다.)

---

*Vegan · Sustainable · ESG Cosmetics — OBLIGE*
