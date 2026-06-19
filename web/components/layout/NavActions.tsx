// Nav 의 우측 액션 영역 — 로그인 상태에 따라 링크/버튼을 분기.
// 모달 폐기 후 페이지 라우팅 방식이라 클라이언트 상태가 필요 없다 → 서버 컴포넌트.
// 로그아웃은 server action(form)으로 처리하고 logoutAction 내부에서 "/"로 redirect.
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export default function NavActions({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="nav-cta">
      {loggedIn ? (
        <>
          <Link className="btn btn-ghost" href="/my">
            마이페이지
          </Link>
          <form action={logoutAction}>
            <button className="btn btn-ghost" type="submit">
              로그아웃
            </button>
          </form>
        </>
      ) : (
        <>
          <Link className="btn btn-ghost" href="/login">
            로그인
          </Link>
          <Link className="btn btn-pink" href="/how-it-works">
            앱으로 시작
          </Link>
        </>
      )}
    </div>
  );
}
