// W3 이용 방법 · 공병 반납 가이드 — 행동 장벽 제거가 목표.
import Link from "next/link";
import SiteShell from "@/components/layout/SiteShell";
import Faq from "./Faq";
import styles from "./howitworks.module.css";

export const metadata = { title: "이용 방법 — OBLIGE" };

const STEPS = [
  { no: "STEP 1", t: "반납 신청", d: "앱·웹에서 반납할 공병 선택" },
  { no: "STEP 2", t: "매장·수거함 방문", d: "가까운 거점에 공병 투입" },
  { no: "STEP 3", t: "QR·바코드 스캔", d: "공병 인식 후 수량 확인" },
  { no: "STEP 4", t: "포인트 적립", d: "즉시 +300P 적립 완료" },
];

const CAN = [
  "스킨 / 토너 / 로션 공병",
  "클렌징 · 세럼 펌프 용기",
  "라벨 부착된 OBLIGE 제품",
];
const CANNOT = [
  "내용물이 남은 용기",
  "파손 · 오염이 심한 용기",
  "타 브랜드 일부 제품",
];

export default function HowItWorksPage() {
  return (
    <SiteShell>
      <section className={styles.head}>
        <div className="wrap center">
          <div className="sec-eye" style={{ justifyContent: "center" }}>
            How it works
          </div>
          <h2 className="sec-title">공병 반납, 이렇게 진행돼요</h2>
          <p className="sec-sub" style={{ margin: "18px auto 0" }}>
            앱이 없어도 웹에서 신청하고 매장에서 반납할 수 있어요.
          </p>
          <div className={styles.steps}>
            {STEPS.map((s) => (
              <div className={styles.step} key={s.no}>
                <div className={styles.stepNo}>{s.no}</div>
                <h4>{s.t}</h4>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className={styles.lists}>
            <div className={`${styles.listCard} ${styles.ok}`}>
              <h4>✓ 반납 가능</h4>
              <ul>
                {CAN.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className={`${styles.listCard} ${styles.no}`}>
              <h4>✕ 반납 불가</h4>
              <ul>
                {CANNOT.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap center">
          <div className="sec-eye" style={{ justifyContent: "center" }}>
            FAQ
          </div>
          <h2 className="sec-title">자주 묻는 질문</h2>
          <Faq />
          <div style={{ marginTop: 44 }}>
            <Link className="btn btn-pink btn-lg" href="/find">
              가까운 수거함 찾기 →
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
