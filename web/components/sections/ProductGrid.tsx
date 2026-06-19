import Link from "next/link";
import type { Product } from "@/lib/types";

function price(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

// W1 "포인트로 바꾸는 굿즈" — 실데이터(getProducts) 그리드. title/ctaHref/limit/four 로 재사용.
export default function ProductGrid({
  products,
  eyebrow = "Best Sellers",
  title = "오늘의 비건 베스트",
  ctaHref = "/shop",
  limit,
  four = false,
}: {
  products: Product[];
  eyebrow?: string;
  title?: string;
  ctaHref?: string;
  limit?: number;
  four?: boolean;
}) {
  const list = limit ? products.slice(0, limit) : products;
  return (
    <section className="products-sec">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <div className="sec-eye">{eyebrow}</div>
            <h2 className="sec-title">{title}</h2>
          </div>
          <Link className="btn btn-ghost" href={ctaHref}>
            전체 보기 →
          </Link>
        </div>
        <div className={`prod-grid${four ? " four" : ""}`}>
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
                  <span className="price">{price(p.price)}</span>
                  <button className="add" aria-label={`${p.name} 담기`}>
                    +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
