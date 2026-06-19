// W5 리워드 굿즈 샵 — 실데이터(getProducts) + 로그인 시 보유 포인트(getBalance).
import SiteShell from "@/components/layout/SiteShell";
import ShopClient from "./ShopClient";
import { getProducts } from "@/lib/api";
import { getBalance } from "@/lib/server-api";
import styles from "./shop.module.css";

export const metadata = { title: "굿즈 샵 — OBLIGE" };

export default async function ShopPage() {
  const [products, balance] = await Promise.all([getProducts(), getBalance()]);

  return (
    <SiteShell>
      <section>
        <div className="wrap">
          <div className={styles.head}>
            <div>
              <div className="sec-eye">Reward Goods</div>
              <h2 className="sec-title">굿즈 샵</h2>
              <p className="sec-sub">모은 포인트로 친환경 굿즈를 교환하세요.</p>
            </div>
            {balance ? (
              <span className={styles.point}>
                내 포인트 <b>{balance.balance.toLocaleString("ko-KR")}P</b>
              </span>
            ) : null}
          </div>
          <ShopClient products={products} />
        </div>
      </section>
    </SiteShell>
  );
}
