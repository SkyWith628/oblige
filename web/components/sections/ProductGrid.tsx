import type { Product } from "@/lib/types";

function price(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <section className="products-sec">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <div className="sec-eye">Best Sellers</div>
            <h2 className="sec-title">오늘의 비건 베스트</h2>
          </div>
          <button className="btn btn-ghost">전체 보기 →</button>
        </div>
        <div className="prod-grid">
          {products.map((p) => (
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
                  <button className="add" aria-label={`${p.name} 장바구니 담기`}>
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
