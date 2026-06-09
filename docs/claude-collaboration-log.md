# Claude 협업 로그 — OBLIGE 프로젝트

> Claude와 반복적으로 진행한 작업 패턴과 피드백을 기록합니다.
> 향후 같은 작업이 필요할 때 참고하거나, 스킬로 등록할 기준으로 사용합니다.

---

## 반복된 작업 패턴

### 1. iOS Swift ViewController 생성 (3회 이상)

**세션:** iPhone app design in Swift → Empty bottle return button error → Swift project key features

**매번 한 일:**
- UIKit 기반 ViewController 파일 신규 생성
- Supabase Repository 호출 → UI 바인딩
- `async/await` + `Task {}` 패턴으로 비동기 처리
- 크래시 수정 (nil 강제 언래핑 → optional 처리)

**반복 이유:** Swift 파일을 만들 때마다 UIKit 보일러플레이트(viewDidLoad, setupUI, layout) 구조가 거의 동일한데 매번 처음부터 작성함.

**개선 방향:**
- `BaseViewController` 공통 클래스 만들기 → setupUI / bindData 오버라이드 패턴 정립
- Claude에게 요청할 때 "ViewController 추가해줘" 대신 구체적인 기능 흐름(어떤 데이터 → 어떤 화면)을 먼저 정의하고 요청하기

---

### 2. Supabase 백엔드 → 프론트 연동 (2회)

**세션:** iPhone app design in Swift, Empty bottle return button error

**매번 한 일:**
- `supabase.js` / `SupabaseClient.swift`에서 테이블 쿼리 추가
- apiCall 라우터에 새 경로 추가 (JS)
- Repository에 새 메서드 추가 (Swift)

**주의사항 (반복 실수):**
- `product_name` vs `name` 컬럼 명 불일치 → `supabase.js`의 `_mapProduct`에서 매핑 중
- Swift에서 `Codable` 모델의 `CodingKeys`를 빠뜨려 디코딩 실패하는 경우 있었음
- anon key가 `config.js`에 평문 노출 → `.gitignore`에서 `config.js` 제외 확인 필요

---

### 3. 디자인 프리뷰 HTML 생성 (2회)

**파일:** `oblige-design-preview.html`, `oblige-next-wireframe-preview.html`, `oblige-brand-kitsch-preview.html`

**매번 한 일:**
- 단독 실행 가능한 HTML로 디자인 시안 제작
- Tailwind CDN or 인라인 CSS로 스타일링

**문제점:**
- 프리뷰 파일이 루트에 계속 쌓임 → `docs/previews/` 폴더로 정리 필요
- 실제 `index.html`과 디자인이 따로 노는 경우가 생김 → 프리뷰 확정 후 즉시 실제 파일에 반영하는 습관 필요

---

### 4. PHP API → Supabase 마이그레이션 (1회, 큰 작업)

**세션 흔적:** `api/index.php` (PHP 라우터) + `js/supabase.js` (Supabase 레이어) 공존

**현황:**
- PHP 라우터(`api/index.php`)가 아직 남아 있고, JS에서 `apiCall`로 Supabase를 직접 호출하는 구조로 전환 완료
- `Dockerfile`도 남아 있어 PHP 서버 방식과 정적 배포 방식이 혼재

**정리 필요:**
```
현재: index.html → apiCall() → supabase.js → Supabase
과거: index.html → apiCall() → /api/*.php → MySQL
```
PHP 관련 파일(`api/`, `router.php`, `Dockerfile`)은 더 이상 사용하지 않으면 삭제 또는 `archive/` 폴더로 이동할 것.

---

## Claude 협업 피드백

### 잘 된 점

- **DB 설계 논의:** grade_rules 테이블 분리, RPC로 원자적 주문 처리 등 설계 단계에서 Claude와 대화로 결정한 부분이 실제로 탄탄하게 구현됨
- **버그 빠른 수정:** nil 강제 언래핑 크래시처럼 재현 경로가 명확한 버그는 코드 보여주면 빠르게 해결됨

### 개선할 점

- **커밋을 작업 전에 요청하기:** Claude가 파일을 수정한 후 커밋하지 않고 다음 작업으로 넘어가는 경우가 있음 → 작업 완료 후 즉시 커밋 요청하는 습관 필요
- **한 번에 너무 많이 요청하면 품질 저하:** "iOS 앱 전체 만들어줘" 보다 "로그인 화면 → 홈 화면 네비게이션" 처럼 기능 단위로 쪼개서 요청할 때 결과가 더 정확함
- **보안 확인을 Claude에게 맡기지 말 것:** Supabase RLS 설정, anon key 노출 여부는 Claude가 파일만 보고 확인할 수 없음 → Supabase 대시보드에서 직접 확인 필수

---

## 앞으로 Claude에게 요청할 때 유용한 패턴

```
# ViewController 추가 요청 템플릿
- 화면 이름: XXXViewController
- 표시할 데이터: (테이블명, 컬럼)
- 사용자 액션: (버튼 클릭 → 어떤 동작)
- 연결할 Repository: (기존 메서드 or 신규)
- 네비게이션: (push / modal / tab)
```

```
# Supabase 쿼리 추가 요청 템플릿
- 테이블: xxx
- 조건: user_id = 현재 로그인 유저
- 정렬/제한: created_at desc, limit 50
- 반환 형태: (배열 / 단일 객체)
```

---

## 디렉토리 정리 TO-DO

- [ ] `oblige/oblige/` 중복 폴더 제거 (git submodule 또는 실수로 중첩됨)
- [ ] `router.php`, `Dockerfile`, `api/` → PHP 미사용 확정 시 삭제
- [ ] `oblige-*-preview.html` → `docs/previews/` 이동
- [ ] Supabase Dashboard에서 RLS 정책 확인 (admin 테이블 접근 제한)
- [ ] 커밋 히스토리 쌓기 — 기능별 커밋으로 분리
