# 랜딩 디자인 포팅 — 핸드오프 (다음 세션용)

> **이 파일을 읽는 새 세션에게:** 아래 작업을 이어서 해줘. 반드시 **`~/dev/oblige`에서 시작된 세션**이어야 한다 (OneDrive 아님). 그래야 프리뷰 도구가 동작해 화면을 보며 맞출 수 있다.

---

## 🎯 목표 (한 문장)

새 Next.js 앱의 **랜딩을 옛 정적 사이트와 픽셀 단위로 동일하게** 만든다.
- 옛 정적(타깃) = <https://skywith628.github.io/oblige/> = 저장소 루트 **`index.html`** (1838줄, 자족형 HTML+CSS+JS)

## 🔑 핵심 발견 (왜 "조립"이 아니라 "포팅"인가)

새 앱은 옛 정적을 포팅한 게 **아니라 새로 디자인(W1 와이어프레임)** 한 별개 디자인이다. 같은 브랜드(navy/pink·Pretendard)라 비슷해 보이지만 다르다:

| | 옛 정적 (타깃) | 새 앱 (현재) |
|---|---|---|
| 히어로 | `.hero-orb` 떠다니는 구체 + "Return Beauty, *Refill Value*" | 그리드+글로우 + **3D 스캔 패널** 씬 |
| 히어로 뱃지 | "Vegan · Sustainable · ESG Cosmetics" | "Vegan · Circular · Reward" |
| 핑크 | `#F03E8C` | `#ED218A` |
| 섹션 카피 | "OBLIGE의 순환형 ESG 시스템" 등 | "버려지지 않는 아름다움의 순환" 등 |

→ 그래서 옛 정적의 **CSS·마크업·카피를 새 앱에 옮기는 진짜 포팅**이 필요하다.
→ **허용됨:** `web/app/globals.css` 맨 위 주석에 *"⚠️ 와이어프레임 확정 시 이 파일을 통째로 교체한다"* 라고 명시돼 있다 (placeholder).

## 📂 작업 대상 파일

| 역할 | 경로 |
|---|---|
| **타깃(소스 오브 트루스)** | `index.html` (저장소 루트) — 옛 정적 전체 |
| 랜딩 페이지 | `web/app/page.tsx` (현재 Hero+Marquee+Steps+Products만 씀) |
| 비주얼 레이어(교체 대상) | `web/app/globals.css` |
| 섹션 컴포넌트 | `web/components/sections/` (Hero·MarqueeBar·StepsBand·ProductGrid·PhilosophySection·CycleSection·MembershipTiers·CTASection·StoriesGrid) |
| nav/footer 셸 | `web/components/layout/SiteShell.tsx` |
| 데이터 | `web/lib/mock.ts` (heroStats·cycleSteps·products·stories·membershipTiers) · `web/lib/api.ts` (`getProducts`) |

## 🧭 옛 정적 섹션 순서 (포팅 타깃)

`index.html`의 `<body>` 순서 (정확한 카피·마크업은 그 파일을 직접 읽어 확인):
1. **Hero** — orbs + "Return Beauty, Refill Value" + 뱃지 "Vegan · Sustainable · ESG"
2. **Marquee** — Vegan Beauty · Refill Value · Zero Waste · Cruelty Free · Circular ESG …
3. **브랜드/문제** — "책임 있는 아름다움" / "우리가 바꾸고자 하는 문제"
4. **순환 ESG** — "OBLIGE의 순환형 ESG 시스템"
5. **제품** — "대표 제품 라인업"
6. **공병 반납 방법**
7. **회원 등급 시스템**
8. **CTA** — "지금 시작하세요"
9. **Footer**

## 🛠 포팅 접근법 (권장)

1. **먼저 화면 확보** — `preview_start("web")` → 새 랜딩 스크린샷 + 옛 정적(`index.html` 또는 라이브 URL) 나란히 비교.
2. **비주얼 레이어 교체** — `index.html`의 `<style>`(:root + 전 섹션 CSS)을 `web/app/globals.css` 로 옮긴다 (placeholder 교체). 핑크 `#F03E8C` 등 토큰 정확히.
3. **마크업 재작성** — `index.html`의 `<body>` 섹션을 JSX로 변환해 `page.tsx` + 섹션 컴포넌트에 반영. `class=`→`className=`, 인라인 스타일 객체화.
4. **동적 부분만 새 스택에 연결** — 제품은 `getProducts()`, 로그인/카트는 옛 정적의 인라인 모달 JS 대신 **새 앱의 실제 라우트**(`/login`, `/shop`, `/return`)로. (옛 정적의 JS 모달은 포팅하지 말 것)
5. **섹션 단위로 스크린샷 확인하며 반복** — 한 섹션 옮길 때마다 preview로 옛 정적과 대조.

> ⚠️ 컴포넌트는 마케팅 페이지(`/about`·`/how-it-works`·`/impact`·`/refill`·`/shop`·`/find`)에서도 **공유**된다. 랜딩만 바꾸려다 그 페이지들이 깨지지 않게 주의 (필요하면 랜딩 전용 컴포넌트로 분리).

## ✅ 검증 방법

- `preview_start("web")` (launch.json에 `web` 구성 있음 — cwd `web`, 포트 3000) → `preview_screenshot` 으로 옛/새 대조.
- 빌드 확인: `cd web && npx tsc --noEmit` (타입), `npm run build` (프로덕션).

## 📦 현재 저장소 상태 (2026-06-21 기준)

- **푸시 완료**(origin/main): Claude 에이전트 백엔드(`AGENT_BACKEND` 플래그) + W1(사진검증) + C2(멀티턴) + 스모크 테스트.
- **미커밋(작업트리)** — 커밋 필요:
  - C1 웹 이미지 배선: `web/components/chat/ChatWidget.tsx`, `web/components/chat/ChatWidget.module.css`, `web/app/actions/agent.ts`, `web/lib/server-api.ts`
  - `web/.env.example` (배포 준비)
- git 워크플로: PR 기반(feat/*·fix/*) 또는 main 직접. 커밋 메시지는 한국어 conventional(`feat(api):` 등), **Co-Authored-By 트레일러 없이**.

## 🚀 배포 준비 현황 (참고 — 이번 작업과 별개)

- 타깃: **Vercel(web) + Railway(api+db)**. `docs/DEPLOY.md` 참조. Dockerfile·docker-compose·`web/.env.example` 준비됨.
- **GitHub Pages는 폐기 상태** — 옛 정적에 동결돼 있고 새 스택은 못 올림(정적 전용). 배포는 Vercel/Railway로, 라이브는 새 URL이 됨.
- 실배포는 계정 연결 필요 → 나중에.

## ⚙️ 환경 메모

- **작업 위치: `~/dev/oblige`** (OneDrive 원본은 stale 백업 — 거기서 작업 금지).
- 동기화는 **Git**(GitHub)으로. OneDrive 동기화 이슈 회피.
- api venv: `api/.venv` (Python 3.12, `claude-agent-sdk` 포함). web 의존성 설치됨.
- 모델(`best.pt`)·dataset은 GitHub에 없음(OneDrive/Windows에만). 학습은 집 Windows+RTX 3070에서.
