import Link from "next/link";
import type { Stat } from "@/lib/types";

export default function Hero({ stats }: { stats: Stat[] }) {
  return (
    <header className="hero">
      <div className="hero-grid-bg" />
      <div className="hero-glow" />
      <div className="hero-in">
        <div>
          <span className="eyebrow">Vegan · Circular · Reward</span>
          <h1>
            공병이 다시
            <br />
            <em>돌아오는</em> 곳
          </h1>
          <p>
            다 쓴 화장품 공병을 반납하면 포인트로 돌려드려요. 모은 포인트로
            리필하고, 굿즈로 바꾸고, 지구도 함께 지켜요.
          </p>
          <div className="hero-btns">
            <Link className="btn btn-pink btn-lg" href="/find">
              공병 반납 시작하기
            </Link>
            <Link className="btn btn-ghost btn-lg hero-ghost" href="/how-it-works">
              작동 방식 보기 →
            </Link>
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
