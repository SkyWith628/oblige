# OBLIGE 아키텍처 (v2 — 풀스택 재구성)

> 비건 화장품 + 공병 반납 ESG 플랫폼을 **AI 통합 풀스택**으로 재구성한다.
> 핵심 차별점: 공병 반납을 **컴퓨터 비전(YOLO)** 으로 자동 검증하고, **LLM 에이전트**가 반납을 안내한다.

---

## 1. 기술 스택 (C안)

| 영역 | 기술 | 비고 |
|---|---|---|
| 프론트(Web) | Next.js 16 (App Router) + TypeScript | BFF·httpOnly 쿠키 인증, Vercel 배포 |
| 모바일 | iOS (Swift) | 사진 업로드 **주력 클라이언트** |
| 백엔드 | FastAPI (Python) | 비즈니스 API + AI 추론 라우터 통합 |
| AI 학습 | Ultralytics YOLOv8 + PyTorch (CUDA) | **로컬 RTX 3070(8GB)** 에서 학습 |
| AI 에이전트 | tool-use LLM — Gemini 2.5 Flash(임시), 원설계 Claude | 반납 어시스턴트 |
| DB | PostgreSQL | Railway 호스팅 |
| 배포 | Vercel(web) + Railway(api+db) | 영구 배포 |
| 컨테이너 | Docker Compose (web·api·db 3개) | 추론은 api 내부 라우터 |

### 핵심 원칙: 학습과 서빙의 분리
- **학습(Training)** — 로컬 GPU(RTX 3070)에서 수행, `best.pt` 산출.
- **서빙(Serving)** — 클라우드는 GPU 없음 → **CPU 추론**. yolov8n은 경량이라 CPU로 충분.
- 로컬에서 학습한 가중치(`best.pt`)만 배포한다. (MLOps: GPU 학습 / CPU 서빙 분리)

---

## 2. 목표 디렉토리 구조

```
oblige/
├── web/                  Next.js (메인·관리자·마이페이지)
├── api/                  FastAPI
│   └── app/
│       ├── routers/      auth, products, cart, orders, returns, points, ai, agent, admin
│       ├── models/       Pydantic 스키마
│       ├── services/     비즈니스 로직 (트랜잭션 규칙)
│       └── core/         config, security, db 세션
├── ai/                   ← cosmetic-agent 이주 (YOLO 학습 파이프라인 + 데이터셋 + 모델)
│   ├── crawler/          이미지 수집 (Bing/Naver)
│   ├── labeler/          라벨링 UI (Flask)
│   ├── dataset/          공병 데이터셋 (5클래스)
│   ├── runs/             학습 결과
│   └── main.py           crawl → label → prepare → train CLI
├── db/                   PostgreSQL 스키마 + Alembic 마이그레이션
├── ios/                  iOS 앱 (Swift)
├── docs/                 설계 문서
├── legacy/               (Phase 3 이후) 기존 PHP·HTML 보관
└── docker-compose.yml
```

> **현재 상태:** 기존 PHP `api/`, `index.html`, `admin.html`, `frontend/`, `supabase/`,
> `figma-plugin/` 은 **보존 중**. FastAPI `api/` 와 Next.js `web/` 가 완성되는
> Phase 3·5에서 `legacy/` 로 이동한다.

---

## 3. 핵심 데이터 흐름 — 공병 반납 검증

```
[iOS/Web] 사용자가 공병 사진 업로드
   │
   ▼
[FastAPI] POST /api/ai/detect-bottle
   │   YOLO 모델(싱글턴, 서버 시작 시 1회 로드)로 추론 (CPU)
   ▼
공병 종류·개수·신뢰도 탐지
   │
   ▼
검증 통과 → 포인트 자동 지급 (PostgreSQL 트랜잭션, idempotency_key로 중복 방지)
   │
   ▼
등급 재계산 (Seed → Leaf → Tree → Forest)
```

## 4. AI 에이전트 — 반납 어시스턴트

비전 + LLM 융합. 에이전트가 YOLO 탐지를 **도구(tool)** 로 호출한다.

```
사용자: "이거 반납돼요?" + 사진
   → 에이전트가 detect_bottle 도구 호출
   → "토너 공병 3개네요. Leaf 등급까지 공병 1개 남았어요. 반납 신청할까요?"
   → 사용자 확인 시 create_return 도구 호출 → 반납 신청 + 포인트
```

- LLM: Gemini 2.5 Flash (임시 운용) — 원설계는 Claude 네이티브 tool use, `agent.py` 내부만 교체
- 도구: `detect_bottle`(YOLO), `get_membership_status`, `create_return`
- 웹은 전 페이지 플로팅 챗 위젯(`ChatWidget`)으로 노출, `GOOGLE_API_KEY` 미설정 시 503 폴백

---

## 5. 구현 로드맵

| Phase | 내용 | 상태 |
|---|---|---|
| **0** | 모노레포 골격, 문서, gitignore | ✅ 완료 |
| **1** | cosmetic-agent → `ai/` 이주 | ✅ 완료 (train 854/val 239, best.pt 포함) |
| **2** | PostgreSQL 스키마 (db/schema.sql) — 분기 통합 | ✅ 완료 (PG16 적용 검증, 21테이블) |
| **3** | FastAPI 코어 (auth + products + `/detect-bottle` 싱글턴) | ✅ 완료 (uvicorn 검증) |
| **4** | FastAPI 비즈니스 (주문/포인트/반납 트랜잭션) | ✅ 완료 (실거래 통합테스트 22/22 통과) |
| **5** | Next.js 화면(와이어프레임 IA) + 사진 업로드 UI | ✅ 완료 (웹 W1~W10·모바일·어드민 E1~E5, 실연동 e2e) |
| **6** | AI 에이전트 (반납 어시스턴트, tool use) | ✅ 코드 완료 (현재 Gemini, 실대화는 GOOGLE_API_KEY 필요) |
| **7** | Docker Compose(web+api+db) + CI + Vercel/Railway 배포 구성 | ✅ 구성 완료 (실배포는 Docker/계정 필요) |

### Phase 5 상세 — 웹 표면 (와이어프레임 적용)
- **페이지 기반 IA**(모달 인증 폐기): 마케팅 8 + 계정 3(로그인/마이페이지/반납) + 어드민 5 라우트.
- **인증 = BFF**: JWT를 httpOnly 쿠키로, Server Action으로 로그인/가입(성공 시 `redirect("/my")`)·로그아웃.
- **어드민 콘솔**: `require_admin`(role=admin) 가드 + `api/app/routers/admin.py`(집계·반납검수·회원·굿즈).
  반납 검수 승인 = `REQUESTED→INSPECTING→APPROVED` 전이 체이닝(공병당 500P 지급·등급 재계산).
- **반응형**: 920px 이하 햄버거 Nav + 하단 탭바.
- 데이터는 BFF(`web/lib/server-api.ts`) 경유 실연동, 미구현 영역(거점·임팩트 집계·`/api/grades`)만 정적/목.

> 비즈니스 로직(주문·포인트·반납 트랜잭션 규칙)의 상세 명세는
> [database-management-design.md](database-management-design.md) 를 따른다.

---

## 6. 모델 현황 (개선 필요)

- 데이터셋: train 854장 / val 239장, 5클래스(토너·앰플·크림·선크림·에센스)
- 현재 성능: **mAP50 약 0.23~0.33 (낮음, PoC 수준)** — 운영 기준(0.6+) 미달
- 개선 계획: 데이터 증강 + 에폭↑ + RTX 3070(GPU) 재학습, 클래스 정의 재검토
- 학습 환경 주의: **PyTorch/ultralytics는 Python 3.11/3.12 가상환경** 사용
  (시스템 Python 3.14는 아직 미지원 가능성)
