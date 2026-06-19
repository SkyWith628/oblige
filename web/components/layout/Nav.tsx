import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { getToken } from "@/lib/session";
import NavActions from "@/components/layout/NavActions";

// 와이어프레임 글로벌 내비게이션 — 실 라우트로 연결.
const LINKS: { label: string; href: string }[] = [
  { label: "브랜드 스토리", href: "/about" },
  { label: "이용 방법", href: "/how-it-works" },
  { label: "수거함 찾기", href: "/find" },
  { label: "굿즈 샵", href: "/shop" },
  { label: "임팩트", href: "/impact" },
];

// 서버 컴포넌트 — 세션 쿠키 유무로 로그인 상태를 NavActions에 전달.
export default async function Nav() {
  const loggedIn = Boolean(await getToken());

  return (
    <nav className="nav">
      <div className="nav-in">
        <Link className="logo-svg" href="/" aria-label="OBLIGE 홈">
          <Logo height={22} />
        </Link>
        <ul className="nav-links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <NavActions loggedIn={loggedIn} />
      </div>
    </nav>
  );
}
