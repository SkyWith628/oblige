# OBLIGE — ESG 비건 코스메틱 플랫폼

> 공병을 반납하면 가치가 돌아오는 친환경 비건 화장품 플랫폼

## 프로젝트 구조

```
oblige/
├── index.html          메인 웹사이트 (프론트엔드)
├── admin.html          관리자 대시보드
├── database/
│   └── oblige.sql      MySQL 스키마 + 샘플 데이터
├── api/
│   ├── index.php       PHP REST API 라우터
│   ├── config/
│   │   ├── db.example.php   DB 설정 예시
│   │   └── helpers.php      JWT·포인트·알림 헬퍼
│   ├── auth/           회원가입 / 로그인
│   ├── products/       상품 CRUD
│   ├── orders/         장바구니 / 주문
│   ├── returns/        공병 반납 신청·승인
│   ├── points/         포인트 내역
│   ├── refill/         리필 신청
│   ├── campaigns/      ESG 캠페인
│   ├── notifications/  알림
│   ├── user/           마이페이지
│   └── admin/          관리자 API
└── frontend/
    └── src/services/api.ts   TypeScript API 클라이언트
```

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 회원 시스템 | 이메일 가입·로그인, JWT 인증, 등급 자동 산정 |
| 비건 쇼핑몰 | 상품 조회·상세·장바구니·주문 |
| **공병 반납** | 택배/오프라인 반납 신청 → 관리자 검수 → 포인트 지급 |
| 포인트 시스템 | 구매·반납·캠페인 적립, 주문 할인 사용 |
| 회원 등급 | Seed → Leaf → Tree → Forest (반납 수 기준 자동 승급) |
| 리필 시스템 | Tree 등급 이상 공병 리필 신청 |
| ESG 데이터 | 개인별 플라스틱·CO₂ 절감량 계산 |
| 관리자 페이지 | 대시보드·회원·주문·반납·캠페인·ESG 통계 |

## 로컬 실행 (XAMPP 기준)

### 1. DB 생성
```bash
mysql -u root -p < database/oblige.sql
```

### 2. DB 설정
```bash
cp api/config/db.example.php api/config/db.php
# db.php 에서 DB_USER, DB_PASS 수정
```

### 3. 파일 배치
```
C:/xampp/htdocs/oblige/   (Windows)
/Applications/XAMPP/htdocs/oblige/  (Mac)
```

### 4. 접속
- 메인: `http://localhost/oblige/index.html`
- 관리자: `http://localhost/oblige/admin.html`
- API: `http://localhost/oblige/api/`

## GitHub Pages 배포 (프론트엔드만)

```bash
# 저장소 초기화
git init
git remote add origin https://github.com/your-username/oblige.git

# 프론트엔드 파일 커밋
git add index.html admin.html README.md
git commit -m "feat: OBLIGE 메인·관리자 페이지"
git push origin main

# GitHub → Settings → Pages → main 브랜치 선택
```

> **주의:** GitHub Pages는 정적 파일만 호스팅합니다.
> PHP API는 별도 서버(XAMPP 로컬 / Cafe24 호스팅)가 필요합니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | HTML5 · CSS3 · Vanilla JS (API 연동 준비) |
| Backend | PHP 8.x · PDO |
| Database | MySQL 8.x |
| Auth | JWT (HS256) |
| Deploy | GitHub Pages (FE) + Apache/Nginx (BE) |

## DB 테이블 목록

```
users · membership_grades · categories · products · product_images
cart_items · orders · order_items
empty_bottle_returns · return_items
point_transactions · refill_requests
reviews · campaigns · campaign_participants
notifications · admin_logs
+ esg_stats (VIEW)
```

## 관리자 계정

| 항목 | 값 |
|------|-----|
| 이메일 | admin@oblige.kr |
| 비밀번호 | Admin@1234 |

> 운영 환경에서는 반드시 비밀번호를 변경하세요.

---

**Phase 1** 쇼핑몰 + 회원 + 공병반납  
**Phase 2** 포인트 + 등급  
**Phase 3** 리필 시스템  
**Phase 4** ESG 데이터 + 캠페인  
**Phase 5** 결제 API 연동 (추후)
