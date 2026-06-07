# OBLIGE — Responsible Beauty

> **공병을 반납하고, 지속가능한 아름다움을 채우다.**  
> 비건 화장품 구매 · 공병 반납 · 포인트 적립 · 리필 보상까지 연결된 ESG 코스메틱 플랫폼.

[![Deploy](https://github.com/SkyWith628/oblige/actions/workflows/deploy.yml/badge.svg)](https://github.com/SkyWith628/oblige/actions/workflows/deploy.yml)

---

## 🌐 서비스 주소

| 서비스 | URL |
|--------|-----|
| 메인 사이트 | [skywith628.github.io/oblige](https://skywith628.github.io/oblige/) |
| 관리자 페이지 | [skywith628.github.io/oblige/admin.html](https://skywith628.github.io/oblige/admin.html) |

---

## ♻️ OBLIGE 순환형 ESG 시스템

```
비건 화장품 구매 → 공병 준비 → 공병 반납 & 포인트 적립
       ↑                                    ↓
  리필 혜택 & 리워드  ←  재사용 & 업사이클링 파트너 처리
```

| 단계 | 내용 |
|------|------|
| 1️⃣ 비건 화장품 구매 | 동물 성분 무첨가, 친환경 패키지 제품 |
| 2️⃣ 공병 준비 | 세척 후 반납 가능한 OBLIGE 공병 |
| 3️⃣ 공병 반납 & 포인트 | 오프라인 수거함 또는 택배 반납 후 즉시 적립 |
| 4️⃣ 리필 혜택 & 리워드 | 기준 달성 시 본품 리필 또는 친환경 굿즈 제공 |
| 5️⃣ 재사용 & 업사이클링 | 수거 공병은 리사이클링 파트너와 협력 처리 |

---

## 🌱 멤버십 등급

공병을 반납할수록 등급이 올라가고, 더 많은 혜택이 주어집니다.

| 등급 | 조건 | 혜택 |
|------|------|------|
| 🌱 Seed | 기본 | 기본 포인트 적립, 회원 전용 뉴스레터 |
| 🍃 Leaf | 공병 3개 반납 | 추가 포인트 +10%, 신제품 우선 구매 |
| 🌳 Tree | 공병 7개 반납 | 친환경 굿즈 제공, 포인트 +20%, 리필 할인 쿠폰 |
| 🌲 Forest | 공병 15개 반납 | 리필 무료 혜택, 한정 상품 우선 제공, 앰배서더 자격 |

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | HTML5 · CSS3 · Vanilla JS |
| Backend & Auth | [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage) |
| 배포 | GitHub Pages + GitHub Actions |
| 이미지 스토리지 | Supabase Storage |

---

## 📁 프로젝트 구조

```
oblige/
├── index.html              메인 웹사이트
├── admin.html              관리자 대시보드
├── js/
│   ├── config.js           Supabase URL/KEY (Actions가 자동 주입)
│   └── supabase.js         Supabase SDK + apiCall 호환 레이어
├── assets/
│   ├── logo-brand.svg
│   └── logo-nav.svg
├── database/
│   └── supabase_schema.sql Supabase SQL Editor용 전체 스키마
├── figma-plugin/           Figma 디자인 연동 플러그인
└── .github/workflows/
    └── deploy.yml          GitHub Pages 자동 배포
```

---

## 🗄️ DB 테이블

```
profiles · grade_rules · categories
products · product_images
cart_items · orders · order_items
bottle_returns · refill_requests
point_logs · campaigns · campaign_participants
notifications · reviews · shipping_addresses
```

---

## 🚀 배포 방법

### 1. Supabase 프로젝트 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. **SQL Editor** → `database/supabase_schema.sql` 전체 붙여넣기 후 **Run**
3. **Storage** → `products` 버킷 생성 (Public ON)

### 2. GitHub Secrets 등록

GitHub 저장소 → **Settings → Secrets and variables → Actions**

| Secret | 값 위치 |
|--------|---------|
| `SUPABASE_URL` | Supabase 대시보드 → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | 같은 페이지 → anon public 키 |

### 3. GitHub Pages 활성화

GitHub 저장소 → **Settings → Pages → Source: GitHub Actions**

이후 `main` 브랜치에 push하면 자동 배포됩니다.

---

## 🔑 관리자 계정

| 항목 | 값 |
|------|-----|
| 이메일 | `admin@oblige.kr` |
| 비밀번호 | `Admin@1234` |

> ⚠️ 운영 환경에서는 반드시 비밀번호를 변경하세요.

---

## 💻 로컬 실행

```bash
# 정적 파일 서버 실행
npx serve -l 3000 .

# 접속
open http://localhost:3000/index.html   # 메인
open http://localhost:3000/admin.html  # 관리자
```

`js/config.js`의 `REPLACE_SUPABASE_URL`, `REPLACE_SUPABASE_ANON_KEY`를  
실제 Supabase 프로젝트 값으로 교체하면 로컬에서도 실제 DB와 연동됩니다.

---

*Vegan · Sustainable · ESG Cosmetics — OBLIGE*
