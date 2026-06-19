// E3 회원 관리 — 회원 목록(읽기 전용).
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminUsers, getAdminStats } from "@/lib/server-api";
import AdminShell from "../AdminShell";
import styles from "../admin.module.css";

const num = (n: number) => n.toLocaleString("ko-KR");

export default async function AdminMembers() {
  const me = await requireAdmin();
  const [users, stats] = await Promise.all([getAdminUsers(), getAdminStats()]);
  const rows = users ?? [];

  return (
    <AdminShell
      active="members"
      adminName={me.name}
      pending={stats?.pending_returns ?? 0}
      title={`회원 관리 · 총 ${num(rows.length)}명`}
    >
      <div className={styles.panel}>
        {rows.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>회원</th>
                <th>등급</th>
                <th>가입일</th>
                <th>누적 공병</th>
                <th>포인트</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.name}
                    <br />
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>
                      {u.email}
                    </span>
                  </td>
                  <td>
                    <span className={styles.tag}>{u.grade}</span>
                  </td>
                  <td>{u.created_at.slice(0, 10)}</td>
                  <td>{u.bottle_return_count}개</td>
                  <td>{num(u.total_point)}P</td>
                  <td>
                    <span className={`${styles.tag} ${u.is_active ? styles.stApp : styles.stRej}`}>
                      {u.is_active ? "활성" : "휴면"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>회원이 없어요.</p>
        )}
      </div>
    </AdminShell>
  );
}
