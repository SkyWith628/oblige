"use client";
// 모바일 하단 탭바 — 홈/샵/반납/MY. 데스크탑에선 CSS로 숨김.
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/shop", label: "샵", icon: "🛍️" },
  { href: "/return", label: "반납", icon: "📷" },
  { href: "/my", label: "MY", icon: "👤" },
];

export default function BottomTab() {
  const path = usePathname();
  return (
    <nav className="btab">
      {TABS.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`btab-item${active ? " active" : ""}`}
          >
            <span className="btab-ic">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
