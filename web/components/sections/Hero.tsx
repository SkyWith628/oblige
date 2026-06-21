import Link from "next/link";

// 옛 정적(index.html) Hero 포팅 — orbs 배경 + 세리프 타이틀 "Return Beauty, Refill Value."
// 동적 부분(버튼)은 옛 정적의 인라인 모달 대신 새 앱의 실제 라우트로 연결.
export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-orb hero-orb1" />
        <div className="hero-orb hero-orb2" />
        <div className="hero-orb hero-orb3" />
      </div>
      <span className="hero-watermark" aria-hidden="true">
        OBLIGE
      </span>

      <div className="hero-in">
        <div className="hero-inner">
          <span className="hero-badge">Vegan · Sustainable · ESG Cosmetics</span>
          <h1>
            Return Beauty,
            <br />
            <em>Refill Value.</em>
          </h1>
          <p>
            공병을 반납하고, 지속가능한 아름다움을 채우다.
            <br />
            비건 화장품 구매 · 공병 반납 · 포인트 적립 · 리필 보상까지 연결된 ESG
            코스메틱 플랫폼.
          </p>
          <div className="hero-btns">
            <Link className="btn btn-pink btn-lg" href="/return">
              공병 반납하기
            </Link>
            <Link className="btn btn-ghost btn-lg hero-ghost" href="/shop">
              비건 제품 보러가기
            </Link>
            <Link className="btn btn-ghost btn-lg hero-ghost" href="/about">
              OBLIGE 소개
            </Link>
          </div>
        </div>
      </div>

      <div className="scroll-hint" aria-hidden="true">
        <div className="scroll-line" />
        <span>SCROLL</span>
      </div>
    </header>
  );
}
