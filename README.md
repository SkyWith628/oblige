# OBLIGE — Responsible Beauty

> **공병을 반납하고, 지속가능한 아름다움을 채우다.**
> 비건 화장품 구매 · **AI 공병 인식** · 포인트 적립 · 리필 보상까지 연결된 ESG 코스메틱 플랫폼.

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

---

*Vegan · Sustainable · ESG Cosmetics — OBLIGE*
