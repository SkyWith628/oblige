"use client";
// W5 굿즈 샵 — 클라이언트 필터(카테고리/정렬). 그리드는 props 로 받은 실데이터.
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import styles from "./shop.module.css";

type Sort = "popular" | "low" | "high";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function ShopClient({ products }: { products: Product[] }) {
  const categories = useMemo(
    () => ["전체", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );
  const [cat, setCat] = useState("전체");
  const [sort, setSort] = useState<Sort>("popular");

  const list = useMemo(() => {
    let r = cat === "전체" ? products : products.filter((p) => p.category === cat);
    if (sort === "low") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "high") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [products, cat, sort]);

  return (
    <div className={styles.layout}>
      <aside className={styles.filters}>
        <div className={styles.filterGroup}>
          <div className={styles.filterTitle}>카테고리</div>
          {categories.map((c) => (
            <button
              key={c}
              className={`${styles.chip}${c === cat ? ` ${styles.chipOn}` : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          <div className={styles.filterTitle}>정렬</div>
          <select
            className={styles.sort}
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="popular">인기순</option>
            <option value="low">가격 낮은순</option>
            <option value="high">가격 높은순</option>
          </select>
        </div>
      </aside>

      <div>
        <div className={styles.count}>{list.length}개 상품</div>
        {list.length ? (
          <div className="prod-grid">
            {list.map((p) => (
              <article className="card" key={p.id}>
                <div className="card-img">
                  <span className="em">{p.emoji}</span>
                  {p.tag && (
                    <span className={`tag${p.tag === "VEGAN" ? " vegan" : ""}`}>
                      {p.tag}
                    </span>
                  )}
                </div>
                <div className="card-body">
                  <div className="cat">{p.category}</div>
                  <h4>{p.name}</h4>
                  <div className="desc">{p.description}</div>
                  <div className="card-foot">
                    <span className="price">{won(p.price)}</span>
                    <button className="add" aria-label={`${p.name} 담기`}>
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>해당 조건의 상품이 없어요.</p>
        )}
      </div>
    </div>
  );
}
