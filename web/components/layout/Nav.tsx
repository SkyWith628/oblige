import Logo from "@/components/ui/Logo";

const LINKS = ["브랜드", "제품", "공병 반납", "멤버십", "캠페인"];

export default function Nav() {
  return (
    <nav className="nav">
      <div className="nav-in">
        <a className="logo-svg" href="#" aria-label="OBLIGE 홈">
          <Logo height={22} />
        </a>
        <ul className="nav-links">
          {LINKS.map((l) => (
            <li key={l}>
              <a href="#">{l}</a>
            </li>
          ))}
        </ul>
        <div className="nav-cta">
          <button className="btn btn-ghost">로그인</button>
          <button className="btn btn-pink">시작하기</button>
        </div>
      </div>
    </nav>
  );
}
