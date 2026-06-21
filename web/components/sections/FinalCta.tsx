import Link from "next/link";

// 옛 정적(index.html #cta) 포팅 — 풀블리드 네이비 마감 CTA. 모달 대신 실제 라우트.
export default function FinalCta() {
  return (
    <section className="cta-section">
      <div className="wrap">
        <p className="sec-label">Join OBLIGE</p>
        <h2 className="sec-heading">지금 시작하세요</h2>
        <p className="sec-body">
          비건 화장품을 구매하고, 공병을 반납하고, 포인트를 적립하세요.
        </p>
        <div className="cta-btns">
          <Link className="btn btn-pink btn-lg" href="/login">
            회원가입 하기
          </Link>
          <Link className="btn btn-ghost btn-lg hero-ghost" href="/return">
            공병 반납 신청
          </Link>
        </div>
      </div>
    </section>
  );
}
