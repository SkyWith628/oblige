// W7 리필 구독 안내 — "구독 = 공병 반납 자동화" LTV 페이지. 정적.
import Link from "next/link";
import SiteShell from "@/components/layout/SiteShell";
import styles from "./refill.module.css";

export const metadata = { title: "리필 구독 — OBLIGE" };

const STEPS = [
  { n: "1", t: "주기 선택", d: "월 1회 / 격주" },
  { n: "2", t: "리필 배송", d: "용기 없이 내용물만" },
  { n: "3", t: "공병 반납", d: "동봉 봉투로 +적립" },
];

const PLANS = [
  {
    name: "라이트",
    meta: "월 1회 · 1품목",
    price: "12,900원",
    perk: "반납 시 300P 적립",
    featured: false,
  },
  {
    name: "스탠다드",
    meta: "월 1회 · 2품목",
    price: "22,900원",
    perk: "반납 시 600P + 무료배송",
    featured: true,
  },
  {
    name: "패밀리",
    meta: "격주 · 4품목",
    price: "42,900원",
    perk: "반납 시 1,200P + GOLD 혜택",
    featured: false,
  },
];

export default function RefillPage() {
  return (
    <SiteShell>
      <header className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroIn}>
          <div>
            <span className="eyebrow">Refill Subscription</span>
            <h1>
              다 쓸 때쯤,
              <br />
              알아서 채워드려요
            </h1>
            <p>
              정기 리필을 신청하면 새 용기 대신 리필 패키지가 도착해요. 빈 공병은
              동봉된 봉투로 반납하면 포인트까지 적립.
            </p>
            <Link className="btn btn-pink btn-lg" href="/login">
              구독 시작하기
            </Link>
          </div>
          <div className={styles.ph}>리필 패키지 컷</div>
        </div>
      </header>

      <section>
        <div className="wrap center">
          <div className="sec-eye" style={{ justifyContent: "center" }}>
            How refill works
          </div>
          <h2 className="sec-title">구독이 곧 반납 루프</h2>
          <div className={styles.steps}>
            {STEPS.map((s) => (
              <div className={styles.step} key={s.n}>
                <div className={styles.stepNo}>{s.n}</div>
                <h4>{s.t}</h4>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap center">
          <h2 className="sec-title">플랜 선택</h2>
          <div className={styles.plans}>
            {PLANS.map((p) => (
              <div
                className={`${styles.plan}${p.featured ? ` ${styles.featured}` : ""}`}
                key={p.name}
                style={{ textAlign: "left" }}
              >
                {p.featured && <span className={styles.badge}>인기</span>}
                <div className={styles.planName}>{p.name}</div>
                <div className={styles.planMeta}>{p.meta}</div>
                <div className={styles.planPrice}>
                  {p.price}
                  <span> / 월</span>
                </div>
                <div className={styles.planPerk}>{p.perk}</div>
                <Link
                  className={`btn ${p.featured ? "btn-pink" : "btn-ghost"}`}
                  href="/login"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  구독하기
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
