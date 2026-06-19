// W1 "3단계면 충분해요" 밴드 — 와이어프레임 핵심 플로우(반납→적립→리필).
import { Fragment } from "react";
import styles from "./StepsBand.module.css";

const STEPS = [
  { n: "1", title: "공병 반납", desc: "수거함·매장에서 스캔" },
  { n: "2", title: "포인트 적립", desc: "공병당 최대 300P" },
  { n: "3", title: "리필 · 굿즈", desc: "포인트로 다시 채우기" },
];

export default function StepsBand() {
  return (
    <section className="cta">
      <div className="wrap center">
        <div className="sec-eye" style={{ justifyContent: "center" }}>
          How it works
        </div>
        <h2 className="sec-title">3단계면 충분해요</h2>
        <div className={styles.grid}>
          {STEPS.map((s, i) => (
            <Fragment key={s.n}>
              <div className={styles.step}>
                <div className={styles.circle}>{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && <div className={styles.arrow}>→</div>}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
