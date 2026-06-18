import type { MembershipTier } from "@/lib/types";

export default function MembershipTiers({ tiers }: { tiers: MembershipTier[] }) {
  return (
    <section className="tiers">
      <div className="wrap center">
        <div className="sec-eye pink">Membership</div>
        <h2 className="sec-title">반납할수록 오르는 등급</h2>
        <p className="sec-sub light">
          공병을 반납할수록 등급이 올라가고, 더 많은 혜택이 주어집니다.
        </p>
        <div className="tier-grid">
          {tiers.map((t) => (
            <div className={`tier${t.featured ? " feat" : ""}`} key={t.key}>
              <div className="em">{t.emoji}</div>
              <h4>{t.key}</h4>
              <div className="cond">{t.condition}</div>
              <ul>
                {t.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
