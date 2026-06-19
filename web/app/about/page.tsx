// W2 브랜드 스토리 · About — "왜 이걸 해야 하나"에 답하는 설득 페이지.
import Link from "next/link";
import SiteShell from "@/components/layout/SiteShell";
import PhilosophySection from "@/components/sections/PhilosophySection";
import styles from "./about.module.css";

export const metadata = { title: "브랜드 스토리 — OBLIGE" };

const VALUES = [
  { em: "🌱", t: "비건 포뮬러", d: "동물성 원료·동물실험 없는 제품만 다룹니다." },
  { em: "♻️", t: "자원 순환", d: "반납→세척→리필로 공병의 수명을 늘립니다." },
  { em: "📊", t: "투명한 임팩트", d: "모든 절감 수치를 리포트로 공개합니다." },
];

export default function AboutPage() {
  return (
    <SiteShell>
      <header className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroIn}>
          <div>
            <span className="eyebrow">Our Mission</span>
            <h1>
              버려지던 공병을
              <br />
              다시 쓸모 있게 만듭니다
            </h1>
            <p>
              화장품 한 통을 다 쓰면 공병은 대부분 일반 쓰레기가 돼요. OBLIGE는
              그 공병을 회수해 세척·리필·재활용으로 되돌리는 순환 구조를
              만듭니다.
            </p>
          </div>
          <div className={styles.ph}>공정 / 수거 현장컷</div>
        </div>
      </header>

      <PhilosophySection />

      <section>
        <div className="wrap center">
          <div className="sec-eye" style={{ justifyContent: "center" }}>
            What we stand for
          </div>
          <h2 className="sec-title">반납이 곧 참여입니다</h2>
          <p className="sec-sub" style={{ margin: "18px auto 0" }}>
            공병 하나가 모이면 새 플라스틱을 덜 만들고, 그만큼 탄소도 줄어요.
            회수량·재활용률·탄소 절감량을 모두 공개합니다.
          </p>
          <div className={styles.values}>
            {VALUES.map((v) => (
              <div className={styles.value} key={v.t}>
                <div className={styles.em}>{v.em}</div>
                <h4>{v.t}</h4>
                <p>{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <div className={styles.goal}>
            <h2>2027년까지 누적 공병 100만 개 회수</h2>
            <p>당신의 공병 하나가 이 약속의 일부가 됩니다.</p>
            <Link className={`btn btn-lg ${styles.goalBtn}`} href="/login">
              지금 동참하기
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
