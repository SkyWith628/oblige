// E2 반납 검수 ★CORE — 상태별 목록 + 승인/반려(실연동: 승인 시 공병당 500P).
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminReturns, getAdminStats } from "@/lib/server-api";
import { approveReturnAction, rejectReturnAction } from "@/app/actions/admin";
import AdminShell from "../AdminShell";
import styles from "../admin.module.css";

const TABS = [
  { k: "REQUESTED", l: "검수 대기" },
  { k: "APPROVED", l: "승인됨" },
  { k: "REJECTED", l: "반려됨" },
];
const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "검수 대기",
  COLLECTING: "수거 중",
  INSPECTING: "검수 중",
  APPROVED: "승인",
  REJECTED: "반려",
};

function statusClass(s: string) {
  if (s === "APPROVED") return styles.stApp;
  if (s === "REJECTED") return styles.stRej;
  return styles.stReq;
}

export default async function AdminReturns({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const me = await requireAdmin();
  const status = (await searchParams).status ?? "REQUESTED";
  const [list, stats] = await Promise.all([
    getAdminReturns(status),
    getAdminStats(),
  ]);
  const rows = list ?? [];

  return (
    <AdminShell
      active="returns"
      adminName={me.name}
      pending={stats?.pending_returns ?? 0}
      title="반납 검수"
    >
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <Link
            key={t.k}
            href={`/admin/returns?status=${t.k}`}
            className={`${styles.tab}${status === t.k ? ` ${styles.tabOn}` : ""}`}
          >
            {t.l}
            {t.k === "REQUESTED" && stats?.pending_returns
              ? ` ${stats.pending_returns}`
              : ""}
          </Link>
        ))}
      </div>

      <div className={styles.panel}>
        {rows.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>신청번호</th>
                <th>회원</th>
                <th>방법</th>
                <th>수량</th>
                <th>예상/적립 P</th>
                <th>상태</th>
                {status === "REQUESTED" && <th>액션</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.return_number}</td>
                  <td>
                    {r.user_name}
                    <br />
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>
                      {r.user_email}
                    </span>
                  </td>
                  <td>{r.return_method}</td>
                  <td>{r.bottle_count}개</td>
                  <td>
                    +{(r.approved_point || r.bottle_count * 500).toLocaleString("ko-KR")}
                  </td>
                  <td>
                    <span className={`${styles.tag} ${statusClass(r.return_status)}`}>
                      {STATUS_LABEL[r.return_status] ?? r.return_status}
                    </span>
                  </td>
                  {status === "REQUESTED" && (
                    <td>
                      <div className={styles.actions}>
                        <form action={approveReturnAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className={styles.approve} type="submit">
                            승인
                          </button>
                        </form>
                        <form action={rejectReturnAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className={styles.reject} type="submit">
                            반려
                          </button>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>해당 상태의 반납이 없어요.</p>
        )}
      </div>
    </AdminShell>
  );
}
