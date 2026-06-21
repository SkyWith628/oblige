// 옛 정적(index.html #reward) 포팅 — 회원 등급 bento(Seed·Leaf·Tree(featured)·Forest(wide)).
export default function RewardSection() {
  return (
    <section className="reward">
      <div className="wrap">
        <p className="sec-label">Reward Program</p>
        <h2 className="sec-heading">회원 등급 시스템</h2>
        <p className="sec-body">
          공병을 반납할수록 등급이 올라가고, 더 많은 혜택이 주어집니다.
        </p>
        <div className="bento-grid reward-bento">
          <div className="tier-card">
            <div className="tier-icon">🌱</div>
            <div className="tier-name">Seed</div>
            <div className="tier-cond">가입 회원</div>
            <div className="tier-div" />
            <div className="tier-benefit">
              기본 포인트 적립
              <br />
              회원 전용 뉴스레터
            </div>
          </div>

          <div className="tier-card">
            <div className="tier-icon">🍃</div>
            <div className="tier-name">Leaf</div>
            <div className="tier-cond">공병 3개 반납</div>
            <div className="tier-div" />
            <div className="tier-benefit">
              추가 포인트 +10%
              <br />
              신제품 우선 구매
            </div>
          </div>

          <div className="tier-card featured featured-col bento-tall">
            <div className="tier-eyebrow">Most Popular</div>
            <div className="tier-icon">🌳</div>
            <div className="tier-name">Tree</div>
            <div className="tier-cond">공병 7개 반납</div>
            <div className="tier-div" />
            <div className="tier-benefit">
              친환경 굿즈 제공
              <br />
              포인트 +20%
              <br />
              리필 할인 쿠폰
            </div>
          </div>

          <div className="tier-card bento-wide">
            <div className="tier-icon">🌲</div>
            <div>
              <div className="tier-name">Forest</div>
              <div className="tier-cond">공병 15개 이상</div>
              <div className="tier-div" />
              <div className="tier-benefit">
                리필 무료 혜택
                <br />
                한정 상품 우선 제공
                <br />
                앰배서더 자격
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
