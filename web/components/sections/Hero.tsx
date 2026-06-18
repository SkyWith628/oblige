import type { Stat } from "@/lib/types";

export default function Hero({ stats }: { stats: Stat[] }) {
  return (
    <header className="hero">
      <div className="hero-grid-bg" />
      <div className="hero-glow" />
      <div className="hero-in">
        <div>
          <span className="eyebrow">Vegan · Sustainable · ESG</span>
          <h1>
            아름다움은
            <br />
            <em>되돌려주는 것</em>에서
            <br />
            시작됩니다.
          </h1>
          <p>
            비건 화장품을 쓰고, 공병을 반납하면 AI가 알아서 인식해 포인트로
            돌려드립니다. 지구를 해치지 않는 아름다움.
          </p>
          <div className="hero-btns">
            <button className="btn btn-pink btn-lg">제품 둘러보기</button>
            <button className="btn btn-ghost btn-lg hero-ghost">공병 반납하기</button>
          </div>
          <div className="hero-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="n">
                  <b>{s.value}</b>
                </div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="scene" aria-hidden="true">
          <div className="stage">
            <div className="panel p-scan">
              <div className="scan-view">
                <div className="bottle">🧴</div>
                <div className="det-box">
                  <span className="det-tag">토너 공병 · 98%</span>
                </div>
                <div className="scan-line" />
              </div>
              <div className="scan-foot">
                <div>
                  <div className="t">AI 공병 인식</div>
                  <div className="s">사진 한 장으로 자동 적립</div>
                </div>
                <div className="pts">+200P</div>
              </div>
            </div>
            <div className="panel p-grade">
              <div className="pg-top">
                <div className="pg-ic">🍃</div>
                <div>
                  <div className="t">나의 멤버십</div>
                  <div className="s">Leaf · 5,200P</div>
                </div>
              </div>
              <div className="pg-bar">
                <i />
              </div>
              <div className="pg-meta">
                <span>공병 5개</span>
                <span>Tree까지 2개</span>
              </div>
            </div>
            <div className="panel p-chip">
              <span className="e">🌍</span>
              <div>
                <div className="n">3.2t</div>
                <div className="l">함께 절감한 플라스틱</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
