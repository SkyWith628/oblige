// W8 임팩트 리포트 · 공개 — 누적 수치 + 추이 + 일상 단위 환산.
// 집계 엔드포인트가 아직 없어 수치는 정적(추후 /api 집계 연동 예정).
import SiteShell from "@/components/layout/SiteShell";
import styles from "./impact.module.css";

export const metadata = { title: "임팩트 리포트 — OBLIGE" };

const STATS = [
  { n: "128,400", l: "반납 공병" },
  { n: "4.8t", l: "플라스틱 절감" },
  { n: "7.2t", l: "CO₂ 절감" },
];
const BARS = [44, 52, 60, 58, 74, 92]; // 1~6월 추이 placeholder
const CONVERT = [
  { n: "96만 개", l: "플라스틱 빨대 환산" },
  { n: "1,440그루", l: "소나무 연간 흡수량" },
  { n: "68%", l: "평균 재활용률" },
];

export default function ImpactPage() {
  return (
    <SiteShell>
      <header className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="wrap">
          <div className="sec-eye pink" style={{ justifyContent: "center" }}>
            Impact Report
          </div>
          <h2 className="sec-title" style={{ color: "#fff" }}>
            2026 누적 임팩트 · 실시간
          </h2>
          <div className={styles.bigStats}>
            {STATS.map((s) => (
              <div key={s.l}>
                <div className={styles.bigNum}>{s.n}</div>
                <div className={styles.bigLbl}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section>
        <div className="wrap center">
          <div className="sec-eye" style={{ justifyContent: "center" }}>
            Monthly
          </div>
          <h2 className="sec-title">월별 반납 추이</h2>
          <div className={styles.bars}>
            {BARS.map((h, i) => (
              <div className={styles.barCol} key={i}>
                <div className={styles.bar} style={{ height: `${h}%` }} />
                <span className={styles.barLbl}>{i + 1}월</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className={styles.convert}>
            {CONVERT.map((c) => (
              <div className={styles.card} key={c.l}>
                <div className={styles.n}>{c.n}</div>
                <div className={styles.l}>{c.l}</div>
              </div>
            ))}
          </div>
          <p className={styles.note}>
            📊 모든 수치는 분기별 외부 검증을 거칩니다. 산정 기준과 원자료는
            투명성 리포트에서 다운로드할 수 있어요.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
