# OBLIGE 배포 가이드

대상: **Vercel(web)** + **Railway(api + PostgreSQL)**. (기존 GitHub Pages 정적 배포는 폐기)

```
[사용자] → Vercel(web, Next.js) → Railway(api, FastAPI) → Railway(PostgreSQL)
```

## 1. 로컬 풀스택 (Docker)

```bash
docker compose up -d --build
# web http://localhost:3000 · api http://localhost:8000/docs · adminer http://localhost:8080
```
최초 기동 시 `db/schema.sql` → `db/seed.sql` 자동 적용. (현재 PC엔 Docker 미설치 — Docker Desktop 필요)

## 2. Railway — api + DB

1. Railway 프로젝트 생성 → **PostgreSQL** 플러그인 추가 (자동으로 `DATABASE_URL` 제공).
   - Railway는 `postgresql://` 스킴을 주는데 우리는 psycopg3라 `postgresql+psycopg://`가 필요하다.
     이제 **앱(`config.py`)이 부팅 시 자동 보정**하므로 Railway가 준 `DATABASE_URL`을 그대로 써도 된다.
2. **api 서비스** 추가 → GitHub 레포 연결, **Root Directory = `api`** (Dockerfile 자동 감지).
3. 환경변수 설정:
   | 변수 | 값 |
   |---|---|
   | `DATABASE_URL` | Postgres 플러그인이 준 값 그대로 (`postgresql://...` → 앱이 자동 보정) |
   | `JWT_SECRET` | 32바이트 이상 랜덤 문자열 |
   | `CORS_ORIGINS` | `["https://<vercel-도메인>"]` |
   | `GOOGLE_API_KEY` | (에이전트 사용 시) Gemini API 키 — 기본 백엔드가 `gemini`(`AGENT_BACKEND`) |
4. 최초 1회 스키마 적용: Railway Postgres 콘솔에서 `db/schema.sql` 실행 (또는 Phase 3에서 Alembic 도입 후 `alembic upgrade head`).

> AI 추론(`/api/ai/*`)을 쓰려면 api 이미지에 `ultralytics`(+torch, ~2GB)를 추가해야 한다.
> 무거우므로 추론은 별도 서비스로 분리하는 것을 권장.

## 3. Vercel — web

1. Vercel에서 GitHub 레포 임포트 → **Root Directory = `web`** (Next.js 자동 감지).
2. 환경변수: `NEXT_PUBLIC_API_BASE = https://<railway-api-도메인>`.
3. `main` push 시 자동 배포.

> Vercel·Railway 모두 GitHub 연동으로 push 시 자동 배포되므로 별도 배포 CI는 불필요.
> CI(`.github/workflows/ci.yml`)는 **빌드·통합 테스트 검증**만 담당한다.

## 4. CI

`.github/workflows/ci.yml` — push/PR 시:
- `web-build`: Next.js 프로덕션 빌드
- `api-test`: PostgreSQL 서비스 + 스키마 적용 + Phase 4 통합 테스트(22 케이스)
