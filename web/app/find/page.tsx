// W4 수거함 찾기 · 지도/매장 — 오프라인 반납을 위한 핵심 도구.
import SiteShell from "@/components/layout/SiteShell";
import FindClient from "./FindClient";

export const metadata = { title: "수거함 찾기 — OBLIGE" };

export default function FindPage() {
  return (
    <SiteShell>
      <section>
        <div className="wrap">
          <div className="sec-eye">Find a drop-off</div>
          <h2 className="sec-title">수거함 찾기</h2>
          <p className="sec-sub" style={{ marginBottom: 28 }}>
            가까운 매장·무인 수거함을 찾아 공병을 반납하세요.
          </p>
          <FindClient />
        </div>
      </section>
    </SiteShell>
  );
}
