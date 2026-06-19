// W6 굿즈 상세 — 보유 포인트 vs 가격을 나란히, 구매(주문) 실연동.
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteShell from "@/components/layout/SiteShell";
import BuyPanel from "./BuyPanel";
import { getProduct, getProducts } from "@/lib/api";
import { getBalance } from "@/lib/server-api";
import styles from "./detail.module.css";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, balance, all] = await Promise.all([
    getProduct(id),
    getBalance(),
    getProducts(),
  ]);
  if (!product) notFound();

  const stock = product.stock ?? 99;
  const related = all.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <SiteShell>
      <section>
        <div className="wrap">
          <div className={styles.crumb}>
            <Link href="/shop">굿즈 샵</Link> / {product.category} / {product.name}
          </div>

          <div className={styles.top}>
            <div className={styles.media}>{product.emoji}</div>

            <div>
              <span className={styles.cat}>{product.category}</span>
              <span className={styles.stock}>재고 {stock}개</span>
              <h1 className={styles.name}>{product.name}</h1>
              <div>
                <span className={styles.price}>{won(product.price)}</span>
                {balance !== null && (
                  <span className={styles.balance}>
                    보유 <b>{balance.balance.toLocaleString("ko-KR")}P</b>
                  </span>
                )}
              </div>
              <p className={styles.desc}>{product.description}</p>

              <BuyPanel
                productId={Number(product.id)}
                price={product.price}
                stock={stock}
                balance={balance ? balance.balance : null}
              />
            </div>
          </div>

          <div className={styles.tabs}>
            <span className={`${styles.tab} ${styles.tabActive}`}>상세 정보</span>
            <span className={styles.tab}>교환·배송 안내</span>
            <span className={styles.tab}>리뷰</span>
          </div>
          <div className={styles.tabBody}>
            재활용 소재를 일부 활용한 친환경 제품이에요. OBLIGE 공병 회수 공정에서
            나온 자원으로 만들어집니다. 주문 후 평균 2~3일 내 배송되며, 빈 공병은
            동봉 봉투로 반납하면 추가 포인트가 적립됩니다.
          </div>

          {related.length > 0 && (
            <>
              <h2 className="sec-title" style={{ fontSize: 28, marginTop: 64 }}>
                함께 구매하면 좋아요
              </h2>
              <div className="prod-grid" style={{ marginTop: 28 }}>
                {related.map((p) => (
                  <Link className="card" key={p.id} href={`/shop/${p.id}`}>
                    <div className="card-img">
                      <span className="em">{p.emoji}</span>
                    </div>
                    <div className="card-body">
                      <div className="cat">{p.category}</div>
                      <h4>{p.name}</h4>
                      <div className="card-foot">
                        <span className="price">{won(p.price)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
