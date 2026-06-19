// E1 운영 대시보드 — KPI + 최근 반납 신청.
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminStats, getAdminReturns } from "@/lib/server-api";
import AdminShell from "./AdminShell";
import styles from "./admin.module.css";

const num = (n: number) => n.toLocaleString("ko-KR");

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
  if (s === "REQUESTED") return styles.stReq;
  return styles.tag;
}

export default async function AdminDashboard() {
  const me = await requireAdmin();
  const [stats, recent] = await Promise.all([
    getAdminStats(),
    getAdminReturns(),
  ]);
  const s = stats ?? {
    pending_returns: 0,
    members: 0,
    total_returns: 0,
    issued_points: 0,
  };
  const recentList = (recent ?? []).slice(0, 8);

  return (
    <AdminShell
      active="dashboard"
      adminName={me.name}
      pending={s.pending_returns}
      title="대시보드"
    >
      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <div className={styles.kpiNum}>{num(s.total_returns)}</div>
          <div className={styles.kpiLbl}>누적 반납</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiNum}>{num(s.members)}</div>
          <div className={styles.kpiLbl}>회원 수</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiNum}>{num(s.issued_points)}</div>
          <div className={styles.kpiLbl}>발행 포인트</div>
        </div>
        <div className={`${styles.kpi} ${styles.alert}`}>
          <div className={styles.kpiNum}>{num(s.pending_returns)}</div>
          <div className={styles.kpiLbl}>검수 대기</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelTitle}>최근 반납 신청</div>
        {recentList.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>신청번호</th>
                <th>회원</th>
                <th>수량</th>
                <th>상태</th>
                <th>일시</th>
              </tr>
            </thead>
            <tbody>
              {recentList.map((r) => (
                <tr key={r.id}>
                  <td>{r.return_number}</td>
                  <td>
                    {r.user_name}
                    {r.user_grade ? ` · ${r.user_grade}` : ""}
                  </td>
                  <td>{r.bottle_count}개</td>
                  <td>
                    <span className={`${styles.tag} ${statusClass(r.return_status)}`}>
                      {STATUS_LABEL[r.return_status] ?? r.return_status}
                    </span>
                  </td>
                  <td>{r.created_at.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>아직 반납 신청이 없어요.</p>
        )}
      </div>
    </AdminShell>
  );
}
