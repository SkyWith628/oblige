// E5 수거함·매장 — 거점 목록 + 적재율. 정적 데이터(백엔드 거점 테이블 미구현).
// 여기 등록된 거점이 프론트 W4 지도/리스트에 노출되는 구조(추후 DB 연동).
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminStats } from "@/lib/server-api";
import { locations } from "@/lib/data/locations";
import AdminShell from "../AdminShell";
import styles from "../admin.module.css";

function fillState(rate: number) {
  if (rate >= 100) return { label: "점검", color: "var(--pink)" };
  if (rate >= 80) return { label: "수거 요망", color: "#F59E0B" };
  return { label: "정상", color: "var(--success)" };
}

export default async function AdminLocations() {
  const me = await requireAdmin();
  const stats = await getAdminStats();

  return (
    <AdminShell
      active="locations"
      adminName={me.name}
      pending={stats?.pending_returns ?? 0}
      title={`수거함 · 매장 · 운영 ${locations.length}곳`}
    >
      <div className={styles.panel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>거점</th>
              <th>타입</th>
              <th>운영시간</th>
              <th>적재율</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => {
              const st = fillState(l.fillRate);
              return (
                <tr key={l.id}>
                  <td>
                    {l.name}
                    <br />
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>
                      {l.address}
                    </span>
                  </td>
                  <td>
                    <span className={styles.tag}>{l.type}</span>
                  </td>
                  <td>{l.hours}</td>
                  <td>
                    <div className={styles.fillWrap}>
                      <div className={styles.fillBar}>
                        <div
                          className={styles.fillVal}
                          style={{ width: `${l.fillRate}%`, background: st.color }}
                        />
                      </div>
                      {l.fillRate}%
                    </div>
                  </td>
                  <td>
                    <span className={styles.tag} style={{ color: st.color }}>
                      {st.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className={styles.empty} style={{ textAlign: "left", paddingBottom: 0 }}>
          ℹ️ 거점 데이터는 현재 정적입니다. 백엔드 거점 테이블 연동 시 등록/편집과
          실시간 적재율이 반영됩니다.
        </p>
      </div>
    </AdminShell>
  );
}
