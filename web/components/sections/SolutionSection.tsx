// 옛 정적(index.html #solution) 포팅 — 순환형 ESG 5단계.
const STEPS = [
  { n: "1", title: "비건 화장품 구매", desc: "동물 성분 무첨가, 친환경 패키지 제품 구매" },
  { n: "2", title: "공병 준비", desc: "세척 후 반납 가능한 OBLIGE 공병 준비" },
  { n: "3", title: "공병 반납 & 포인트", desc: "오프라인 수거함 또는 택배 반납 후 즉시 적립" },
  { n: "4", title: "리필 혜택 & 리워드", desc: "기준 달성 시 본품 리필 또는 굿즈 제공" },
  { n: "5", title: "재사용 & 업사이클링", desc: "수거 공병은 리사이클링 파트너와 협력 처리" },
];

export default function SolutionSection() {
  return (
    <section className="solution">
      <div className="wrap">
        <p className="sec-label">How It Works</p>
        <h2 className="sec-heading">OBLIGE의 순환형 ESG 시스템</h2>
        <p className="sec-body">
          구매부터 반납, 리필, 업사이클링까지 — 모든 단계가 연결된 순환 구조.
        </p>
        <div className="cycle-steps">
          <div className="cycle-line">
            <div className="cycle-line-fill" />
          </div>
          {STEPS.map((s) => (
            <div className="cycle-step" key={s.n}>
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
