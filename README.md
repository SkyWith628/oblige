# OBLIGE — ESG 비건 코스메틱 플랫폼

> 공병을 반납하면 가치가 돌아오는 친환경 비건 화장품 플랫폼

## 🌐 배포 주소

| 서비스 | URL |
|--------|-----|
| 메인 사이트 | `https://본인아이디.github.io/oblige/` |
| 관리자 페이지 | `https://본인아이디.github.io/oblige/admin.html` |
| API 서버 | `https://oblige-api.onrender.com/api/` |

---

## 🚀 배포 방법 (처음 한 번만)

### Step 1 — GitHub 저장소 생성 & 코드 푸시

```bash
cd oblige
git init
git branch -M main
git remote add origin https://github.com/본인아이디/oblige.git

# db.php는 gitignore에 있으므로 자동 제외됨
git add .
git commit -m "feat: OBLIGE 초기 배포"
git push origin main
```

### Step 2 — Render.com PHP 백엔드 배포

1. [render.com](https://render.com) 회원가입 (GitHub 연동)
2. **New → Web Service** 선택
3. GitHub 저장소 `oblige` 연결
4. 설정:
   ```
   Environment : Docker
   Branch      : main
   ```
5. **Environment Variables** 탭에서 추가:
   ```
   DB_HOST     = (Render MySQL 호스트 또는 외부 DB)
   DB_NAME     = oblige
   DB_USER     = (DB 계정)
   DB_PASS     = (DB 비밀번호)
   JWT_SECRET  = (랜덤 32자 이상 문자열)
   ```
6. **Create Web Service** → 배포 URL 복사 (예: `https://oblige-api.onrender.com`)

> **무료 MySQL**: [freemysqlhosting.net](https://www.freemysqlhosting.net) 가입 후 DB 생성  
> DB 생성 후 `database/oblige.sql` 을 phpMyAdmin에서 Import

### Step 3 — GitHub Secrets 등록

GitHub 저장소 → **Settings → Secrets and variables → Actions → New secret**

| Secret 이름 | 값 |
|-------------|-----|
| `RENDER_API_URL` | `https://oblige-api.onrender.com/api` |
| `RENDER_DEPLOY_HOOK` | Render 대시보드 → Settings → Deploy Hook URL |

### Step 4 — GitHub Pages 활성화

GitHub 저장소 → **Settings → Pages**
```
Source: GitHub Actions
```
저장 후 `main` 브랜치에 push하면 자동 배포 시작!

### Step 5 — 이후 자동 배포

```bash
# 코드 수정 후
git add .
git commit -m "fix: 수정 내용"
git push origin main
# → GitHub Actions가 자동으로 Pages + Render 배포
```

---

## 💻 로컬 실행

```bash
# PHP 내장 서버
cd oblige
php -S localhost:8080 router.php

# 접속
open http://localhost:8080/index.html   # 메인
open http://localhost:8080/admin.html  # 관리자
```

**MySQL 설정** (`api/config/db.php`):
```php
define('DB_PASS', '본인_MySQL_비밀번호');
```

---

## 📁 프로젝트 구조

```
oblige/
├── index.html          메인 웹사이트
├── admin.html          관리자 대시보드
├── router.php          PHP 내장 서버용 라우터
├── Dockerfile          Render.com 배포용
├── js/config.js        API URL 설정 (GitHub Actions가 자동 교체)
├── database/
│   └── oblige.sql      MySQL 스키마 + 샘플 데이터
└── api/
    ├── index.php        REST API 라우터
    ├── config/
    │   ├── db.php       DB 연결 (gitignore 제외)
    │   └── helpers.php  JWT·포인트·알림 헬퍼
    ├── auth/            회원가입 / 로그인
    ├── products/        상품 CRUD
    ├── orders/          장바구니 / 주문
    ├── returns/         공병 반납 신청·승인
    ├── points/          포인트 내역
    ├── refill/          리필 신청
    ├── campaigns/       ESG 캠페인
    ├── user/            마이페이지 / ESG 임팩트
    └── admin/           관리자 API + 대시보드
```

---

## 🗄️ DB 테이블 (19개)

```
users · membership_grades · categories · products · product_images
cart_items · orders · order_items
empty_bottle_returns · return_items
point_transactions · refill_requests
reviews · campaigns · campaign_participants
notifications · admin_logs · shipping_addresses
+ esg_stats (VIEW)
```

---

## 🔑 관리자 계정

| 항목 | 값 |
|------|-----|
| 이메일 | `admin@oblige.kr` |
| 비밀번호 | `Admin@1234` |

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | HTML5 · CSS3 · Vanilla JS |
| Backend | PHP 8.2 · PDO |
| Database | MySQL 8.x |
| Auth | JWT (HS256) |
| Deploy (FE) | GitHub Pages + GitHub Actions |
| Deploy (BE) | Render.com (Docker) |
