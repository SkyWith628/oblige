import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { getToken } from "@/lib/session";
import NavActions from "@/components/layout/NavActions";

const LINKS = ["브랜드", "제품", "공병 반납", "멤버십", "캠페인"];

// 서버 컴포넌트 — 세션 쿠키 유무로 로그인 상태를 NavActions(클라이언트)에 전달.
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
            <li key={l}>
              <a href="#">{l}</a>
            </li>
          ))}
        </ul>
        <NavActions loggedIn={loggedIn} />
      </div>
    </nav>
  );
}
