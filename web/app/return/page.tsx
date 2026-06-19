// 공병 반납 신청 — 사진 업로드(YOLO 인식) + 수량 확인 + 신청.
import Link from "next/link";
import SiteShell from "@/components/layout/SiteShell";
import ReturnFlow from "./ReturnFlow";
import { getToken } from "@/lib/session";

export const metadata = { title: "공병 반납 — OBLIGE" };

export default async function ReturnPage() {
  const loggedIn = Boolean(await getToken());

  return (
    <SiteShell>
      <section>
        <div className="wrap">
          <div className="sec-eye">Return bottles</div>
          <h2 className="sec-title">공병 반납 신청</h2>
          <p className="sec-sub" style={{ marginBottom: 4 }}>
            공병 사진을 올리면 AI가 종류·개수를 인식해요. 신청 후 가까운{" "}
            <Link href="/find" style={{ color: "var(--pink)", fontWeight: 600 }}>
              수거함
            </Link>
            에 투입하면 검수 후 포인트가 적립됩니다.
          </p>
          <ReturnFlow loggedIn={loggedIn} />
        </div>
      </section>
    </SiteShell>
  );
}
