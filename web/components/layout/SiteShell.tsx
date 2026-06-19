// 마케팅 페이지 공통 크롬 — Nav + main + Footer + 하단탭 + 챗 위젯.
// (로그인 W9·마이페이지 W10·어드민은 자체 레이아웃이라 이 셸을 쓰지 않는다.)
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import BottomTab from "@/components/layout/BottomTab";
import ChatWidget from "@/components/chat/ChatWidget";
import { getToken } from "@/lib/session";

export default async function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const loggedIn = Boolean(await getToken());
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
      <BottomTab />
      <ChatWidget loggedIn={loggedIn} />
    </>
  );
}
