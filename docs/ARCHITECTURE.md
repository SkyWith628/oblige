# OBLIGE 아키텍처 (v2 — 풀스택 재구성)

> 비건 화장품 + 공병 반납 ESG 플랫폼을 **AI 통합 풀스택**으로 재구성한다.
> 핵심 차별점: 공병 반납을 **컴퓨터 비전(YOLO)** 으로 자동 검증하고, **LLM 에이전트**가 반납을 안내한다.

---

## 1. 기술 스택 (C안)

| 영역 | 기술 | 비고 |
|---|---|---|
| 프론트(Web) | Next.js 15 (App Router) + TypeScript | Vercel 배포 |
| 모바일 | iOS (Swift) | 사진 업로드 **주력 클라이언트** |
| 백엔드 | FastAPI (Python) | 비즈니스 API + AI 추론 라우터 통합 |
| AI 학습 | Ultralytics YOLOv8 + PyTorch (CUDA) | **로컬 RTX 3070(8GB)** 에서 학습 |
| AI 에이전트 | Claude (tool use) | 반납 어시스턴트 |
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
│       ├── routers/      auth, products, orders, returns, points, ai, agent
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

- LLM: Claude (네이티브 tool use)
- 도구: `detect_bottle`(YOLO), `get_user_grade`, `create_return`, `get_points`

---

## 5. 구현 로드맵

| Phase | 내용 | 상태 |
|---|---|---|
| **0** | 모노레포 골격, 문서, gitignore | ✅ 완료 |
| **1** | cosmetic-agent → `ai/` 이주 | ✅ 완료 (train 854/val 239, best.pt 포함) |
| **2** | PostgreSQL 스키마 + Alembic 마이그레이션 | ⬜ |
| **3** | FastAPI 코어 (추론 라우터 `/detect-bottle` 싱글턴 로딩 + auth) | ⬜ |
| **4** | FastAPI 비즈니스 (주문/포인트/반납 트랜잭션) | ⬜ |
| **5** | Next.js 화면 + 사진 업로드 UI | ⬜ |
| **6** | AI 에이전트 (반납 어시스턴트) | ⬜ |
| **7** | Docker Compose 통합 + Vercel/Railway 배포 | ⬜ |

> 비즈니스 로직(주문·포인트·반납 트랜잭션 규칙)의 상세 명세는
> [database-management-design.md](database-management-design.md) 를 따른다.

---

## 6. 모델 현황 (개선 필요)

- 데이터셋: train 854장 / val 239장, 5클래스(토너·앰플·크림·선크림·에센스)
- 현재 성능: **mAP50 약 0.23~0.33 (낮음, PoC 수준)** — 운영 기준(0.6+) 미달
- 개선 계획: 데이터 증강 + 에폭↑ + RTX 3070(GPU) 재학습, 클래스 정의 재검토
- 학습 환경 주의: **PyTorch/ultralytics는 Python 3.11/3.12 가상환경** 사용
  (시스템 Python 3.14는 아직 미지원 가능성)
