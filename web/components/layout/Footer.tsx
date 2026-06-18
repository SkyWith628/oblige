import Logo from "@/components/ui/Logo";

const COLS = [
  { h: "제품", items: ["토너", "앰플", "크림", "선크림"] },
  { h: "ESG", items: ["공병 반납", "멤버십", "캠페인", "임팩트 리포트"] },
  { h: "고객", items: ["마이페이지", "주문 조회", "문의하기", "FAQ"] },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <span className="logo-svg foot-logo">
              <Logo height={24} variant="white" />
            </span>
            <p>비건·지속가능·ESG 코스메틱. 공병을 반납하고 지속가능한 아름다움을 채웁니다.</p>
          </div>
          {COLS.map((c) => (
            <div className="foot-col" key={c.h}>
              <h5>{c.h}</h5>
              {c.items.map((i) => (
                <a href="#" key={i}>
                  {i}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="foot-bottom">
          <span>© 2026 OBLIGE. All rights reserved.</span>
          <span>Vegan · Sustainable · ESG Cosmetics</span>
        </div>
      </div>
    </footer>
  );
}
