// W10 마이페이지 — 로그인 후 허브(서버 컴포넌트). 미로그인 시 /login redirect.
// 사이드바 탭(?tab=)으로 대시보드/주문/반납/포인트 섹션 전환.
import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/layout/Nav";
import BottomTab from "@/components/layout/BottomTab";
import { getMypageData, logoutAction } from "@/app/actions/auth";
import { getMyOrders } from "@/lib/server-api";
import styles from "./my.module.css";

const GRADE_EMOJI: Record<string, string> = {
  Seed: "🌱",
  Sprout: "🌿",
  Leaf: "🍃",
  Tree: "🌳",
  Forest: "🌲",
  Gold: "🏆",
};

const ORDER_STATUS: Record<string, string> = {
  ORDERED: "주문완료",
  PAID: "결제완료",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "취소",
};

const NAV = [
  { key: "dashboard", label: "대시보드", href: "/my" },
  { key: "orders", label: "주문 내역", href: "/my?tab=orders" },
  { key: "returns", label: "반납 내역", href: "/my?tab=returns" },
  { key: "points", label: "포인트", href: "/my?tab=points" },
];

const BARS = [40, 56, 48, 72, 60, 88]; // 월별 추이 placeholder(집계 엔드포인트 미존재)
const num = (n: number) => n.toLocaleString("ko-KR");

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab = (await searchParams).tab ?? "dashboard";
  const data = await getMypageData();
  if (!data) redirect("/login");

  const u = data.user;
  const returnsCount = u.bottle_return_count ?? 0;
  const nextAt =
    returnsCount < 3 ? 3 : returnsCount < 7 ? 7 : returnsCount < 15 ? 15 : null;
  const progress = nextAt
    ? Math.min(100, Math.round((returnsCount / nextAt) * 100))
    : 100;
  const co2 = (returnsCount * 0.12).toFixed(1);
  const emoji = GRADE_EMOJI[u.grade] ?? "🌱";

  const orders = tab === "orders" ? (await getMyOrders()) ?? [] : [];

  return (
    <>
      <Nav />
      <div className={styles.layout}>
        <aside className={styles.side}>
          {NAV.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className={`${styles.sideItem}${tab === n.key ? ` ${styles.active}` : ""}`}
            >
              {n.label}
            </Link>
          ))}
          <Link href="/refill" className={styles.sideItem}>
            리필 구독
          </Link>
          <div className={styles.sideSep} />
          <form action={logoutAction}>
            <button className={styles.sideItem} type="submit">
              로그아웃
            </button>
          </form>
        </aside>

        <main className={styles.content}>
          <div className="mypage-body">
            <div className={styles.greet}>
              <div className="mp-avatar">{emoji}</div>
              <div>
                <h1>안녕하세요, {u.name}님 👋</h1>
                <span className={styles.gradeBadge}>
                  {emoji} {u.grade}
                </span>
              </div>
            </div>

            {tab === "dashboard" && (
              <>
                <div className="mp-stats">
                  <div className="mp-stat">
                    <div className="mp-stat-num" style={{ color: "var(--pink)" }}>
                      {num(u.total_point)}P
                    </div>
                    <div className="mp-stat-lbl">사용 가능 포인트</div>
                  </div>
                  <div className="mp-stat">
                    <div className="mp-stat-num">{returnsCount}개</div>
                    <div className="mp-stat-lbl">누적 반납 공병</div>
                  </div>
                  <div className="mp-stat">
                    <div className="mp-stat-num">{co2}kg</div>
                    <div className="mp-stat-lbl">CO₂ 절감</div>
                  </div>
                </div>

                {nextAt ? (
                  <>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
                      다음 등급까지 공병 <strong>{nextAt - returnsCount}개</strong> 남음 ·{" "}
                      {returnsCount}/{nextAt}
                    </div>
                    <div className="esg-bar">
                      <div className="esg-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--success)", fontWeight: 700 }}>
                    🌲 최고 등급 달성!
                  </p>
                )}

                <div className={styles.panel}>
                  <div className={styles.panelTitle}>월별 반납 추이</div>
                  <div className={styles.bars}>
                    {BARS.map((h, i) => (
                      <div className={styles.barCol} key={i}>
                        <div className={styles.bar} style={{ height: `${h}%` }} />
                        <span className={styles.barLbl}>{i + 1}월</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === "orders" && (
              <div className={styles.panel}>
                <div className={styles.panelTitle}>주문 내역</div>
                {orders.length ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>주문번호</th>
                        <th>날짜</th>
                        <th>상태</th>
                        <th>결제금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td>{o.order_number}</td>
                          <td>{o.created_at.slice(0, 10)}</td>
                          <td>{ORDER_STATUS[o.order_status] ?? o.order_status}</td>
                          <td>{num(o.final_price)}원</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.empty}>아직 주문이 없어요. 굿즈 샵을 둘러보세요.</p>
                )}
              </div>
            )}

            {tab === "returns" && (
              <div className={styles.panel}>
                <div className={styles.panelTitle}>반납 내역</div>
                {data.returns.length ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>반납번호</th>
                        <th>날짜</th>
                        <th>수량</th>
                        <th>적립</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.returns.map((r) => (
                        <tr key={r.id}>
                          <td>{r.return_number}</td>
                          <td>{r.created_at.slice(0, 10)}</td>
                          <td>{r.bottle_count}개</td>
                          <td className={styles.plus}>+{num(r.approved_point)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.empty}>아직 반납 내역이 없어요. 공병을 반납해 보세요.</p>
                )}
              </div>
            )}

            {tab === "points" && (
              <div className={styles.panel}>
                <div className={styles.panelTitle}>포인트 내역</div>
                {data.points.length ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>날짜</th>
                        <th>내역</th>
                        <th>포인트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.points.map((p) => (
                        <tr key={p.id}>
                          <td>{p.created_at.slice(0, 10)}</td>
                          <td>{p.reason ?? p.tx_type}</td>
                          <td className={p.point_change >= 0 ? styles.plus : styles.minus}>
                            {p.point_change >= 0 ? "+" : ""}
                            {num(p.point_change)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.empty}>아직 포인트 내역이 없어요.</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomTab />
    </>
  );
}
