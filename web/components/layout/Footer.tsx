import Link from "next/link";
import Logo from "@/components/ui/Logo";

// 내부 라우트는 Link, 미구현(약관/고객센터)은 placeholder.
const COLS: { h: string; items: { label: string; href: string }[] }[] = [
  {
    h: "서비스",
    items: [
      { label: "브랜드 스토리", href: "/about" },
      { label: "이용 방법", href: "/how-it-works" },
      { label: "수거함 찾기", href: "/find" },
    ],
  },
  {
    h: "리워드",
    items: [
      { label: "굿즈 샵", href: "/shop" },
      { label: "리필 구독", href: "/refill" },
      { label: "임팩트", href: "/impact" },
      { label: "마이페이지", href: "/my" },
    ],
  },
  {
    h: "고객",
    items: [
      { label: "회사소개", href: "#" },
      { label: "이용약관", href: "#" },
      { label: "개인정보처리방침", href: "#" },
      { label: "고객센터", href: "#" },
    ],
  },
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
              {c.items.map((i) =>
                i.href === "#" ? (
                  <a href="#" key={i.label}>
                    {i.label}
                  </a>
                ) : (
                  <Link href={i.href} key={i.label}>
                    {i.label}
                  </Link>
                ),
              )}
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
