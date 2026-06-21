import Link from "next/link";

// 옛 정적(index.html #campaign) 포팅 — ESG 캠페인. 카운트업 JS 대신 최종값 정적 표기.
const STATS = [
  { num: "12,400+", label: "누적 공병 반납 수" },
  { num: "3,200+", label: "캠페인 참여 회원" },
  { num: "98%", label: "공병 재활용률" },
  { num: "2.4t", label: "절감된 플라스틱" },
];

const TAGS = ["#OBLIGE공병반납", "#비건코스메틱", "#ESG"];

export default function CampaignSection() {
  return (
    <section className="campaign">
      <div className="wrap camp-inner">
        <div>
          <p className="sec-label">ESG Campaign</p>
          <h2 className="sec-heading">
            함께 만드는
            <br />
            지속가능한 변화
          </h2>
          <p className="sec-body">
            OBLIGE 캠페인에 참여하고, SNS에 인증하면 추가 리워드와 함께 환경
            변화의 주인공이 됩니다.
          </p>
          <div className="camp-stats">
            {STATS.map((s) => (
              <div className="stat-box" key={s.label}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="camp-box">
          <h3>
            공병 반납 챌린지에
            <br />
            참여하세요
          </h3>
          <p>
            SNS에 #OBLIGE공병반납 태그와 함께 인증샷을 올리면 특별 포인트와
            굿즈를 드립니다.
          </p>
          <Link className="btn btn-pink btn-lg" href="/return">
            캠페인 참여하기
          </Link>
          <div className="camp-tags">
            {TAGS.map((t) => (
              <span className="camp-tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
