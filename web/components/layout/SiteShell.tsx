// 마케팅 페이지 공통 크롬 — Nav + main + Footer.
// (로그인 W9·마이페이지 W10 은 자체 레이아웃이라 이 셸을 쓰지 않는다.)
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
