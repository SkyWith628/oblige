import type { CycleStep } from "@/lib/types";

export default function CycleSection({ steps }: { steps: CycleStep[] }) {
  return (
    <section>
      <div className="wrap center">
        <div className="sec-eye">Circular System</div>
        <h2 className="sec-title">버려지지 않는 아름다움의 순환</h2>
        <p className="sec-sub">
          구매부터 반납, 리필, 업사이클링까지 — OBLIGE의 5단계 ESG 순환 시스템.
        </p>
        <div className="cycle-grid">
          {steps.map((s) => (
            <div className="cyc" key={s.step}>
              <div className="step">{s.step}</div>
              <div className="em">{s.emoji}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
