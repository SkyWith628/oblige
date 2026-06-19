// 어드민 공통 크롬 — 네이비 사이드바 + 콘텐츠 헤더.
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import styles from "./admin.module.css";

const NAV = [
  { key: "dashboard", label: "대시보드", href: "/admin" },
  { key: "returns", label: "반납 검수", href: "/admin/returns" },
  { key: "members", label: "회원 관리", href: "/admin/members" },
  { key: "goods", label: "굿즈 · 재고", href: "/admin/goods" },
  { key: "locations", label: "수거함 · 매장", href: "/admin/locations" },
];

export default function AdminShell({
  active,
  adminName,
  pending = 0,
  title,
  children,
}: {
  active: string;
  adminName: string;
  pending?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <div className={styles.brand}>
          OBLI<span>GE</span> ops
        </div>
        <div className={styles.opsLabel}>Operations</div>
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            className={`${styles.navItem}${active === n.key ? ` ${styles.navOn}` : ""}`}
          >
            {n.label}
            {n.key === "returns" && pending > 0 && (
              <span className={styles.badge}>{pending}</span>
            )}
          </Link>
        ))}
        <form action={logoutAction} className={styles.logout}>
          <button className={styles.navItem} type="submit" style={{ width: "100%" }}>
            로그아웃
          </button>
        </form>
      </aside>

      <main className={styles.main}>
        <div className={styles.head}>
          <div className={styles.title}>{title}</div>
          <div className={styles.who}>운영자 · {adminName}</div>
        </div>
        {children}
      </main>
    </div>
  );
}
