// E4 굿즈·재고 — 상품 목록 + 노출 토글 + 재고 경고. 프론트 W5/W6 노출의 원본.
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminProducts, getAdminStats } from "@/lib/server-api";
import { toggleProductAction } from "@/app/actions/admin";
import AdminShell from "../AdminShell";
import styles from "../admin.module.css";

const num = (n: number) => n.toLocaleString("ko-KR");

export default async function AdminGoods() {
  const me = await requireAdmin();
  const [products, stats] = await Promise.all([
    getAdminProducts(),
    getAdminStats(),
  ]);
  const rows = products ?? [];

  return (
    <AdminShell
      active="goods"
      adminName={me.name}
      pending={stats?.pending_returns ?? 0}
      title="굿즈 · 재고"
    >
      <div className={styles.panel}>
        {rows.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>상품</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>재고</th>
                <th>노출</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const low = p.stock <= p.low_stock_threshold;
                return (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      <span className={styles.tag}>{p.category}</span>
                    </td>
                    <td>{num(p.price)}원</td>
                    <td className={low ? styles.low : undefined}>
                      {p.stock}개{low ? " · 부족" : ""}
                    </td>
                    <td>
                      <form action={toggleProductAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="next" value={p.is_active ? "0" : "1"} />
                        <button
                          type="submit"
                          className={`${styles.toggle} ${p.is_active ? styles.toggleOn : styles.toggleOff}`}
                        >
                          {p.is_active ? "노출 중" : "숨김"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>등록된 상품이 없어요.</p>
        )}
      </div>
    </AdminShell>
  );
}
