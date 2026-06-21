// 옛 정적(index.html PROBLEM) 포팅 — 통계 강조 bento 그리드.
type Card = {
  accent?: boolean;
  wide?: boolean;
  stat?: string;
  statLabel?: string;
  icon: string;
  title: string;
  desc: string;
};

const CARDS: Card[] = [
  {
    accent: true,
    wide: true,
    stat: "140억+",
    statLabel: "매년 버려지는 화장품 용기 수",
    icon: "🧴",
    title: "플라스틱 용기 증가",
    desc: "매년 수십억 개의 화장품 플라스틱 용기가 환경에 버려지고 있습니다.",
  },
  {
    icon: "📦",
    title: "과대포장 · 단기 소비",
    desc: "불필요한 패키징과 빠른 소비 사이클이 폐기물을 가속화합니다.",
  },
  {
    icon: "♻️",
    title: "복합 소재 재활용 어려움",
    desc: "다양한 소재 결합 용기는 일반 재활용 과정에서 걸러지지 않습니다.",
  },
  {
    accent: true,
    wide: true,
    stat: "72%",
    statLabel: "동물 유래 원료 사용 비율 (글로벌)",
    icon: "🌱",
    title: "원료 · 생산 환경 부담",
    desc: "동물 성분과 화학 원료가 생태계에 미치는 부정적 영향을 줄여야 합니다.",
  },
];

export default function ProblemSection() {
  return (
    <section>
      <div className="wrap">
        <p className="sec-label">Why OBLIGE</p>
        <h2 className="sec-heading">우리가 바꾸고자 하는 문제</h2>
        <div className="bento-grid problem-bento">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className={`bento-card${c.wide ? " bento-wide" : ""}${
                c.accent ? " accent" : ""
              }`}
            >
              {c.stat && <span className="bento-stat">{c.stat}</span>}
              {c.statLabel && (
                <span className="bento-stat-label">{c.statLabel}</span>
              )}
              <span className="bento-icon">{c.icon}</span>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
