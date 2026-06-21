import Link from "next/link";

// 옛 정적(index.html #recycle) 포팅 — 공병 반납 방법 2단(설명 + 5스텝 흐름).
const STEPS = [
  { n: "1", title: "공병 준비", desc: "사용한 OBLIGE 화장품 공병을 깨끗하게 세척하여 준비합니다." },
  { n: "2", title: "반납 신청", desc: "웹사이트에서 공병 반납 신청을 진행합니다. 제품명과 수량을 입력하세요." },
  { n: "3", title: "반납 방법 선택", desc: "오프라인 수거함 직접 반납 또는 택배 발송 중 선택합니다." },
  { n: "4", title: "검수 후 포인트 지급", desc: "수거 후 검수 완료 시 영업일 기준 3일 이내 포인트가 지급됩니다." },
  { n: "5", title: "리필 혜택 또는 굿즈 리워드", desc: "기준 충족 시 본품 내용물 리필 혜택 또는 친환경 굿즈를 받을 수 있습니다." },
];

export default function RecycleSection() {
  return (
    <section className="recycle">
      <div className="wrap recycle-grid">
        <div>
          <p className="sec-label">Empty Bottle Return</p>
          <h2 className="sec-heading">공병 반납 방법</h2>
          <p className="sec-body">
            사용한 OBLIGE 공병을 반납하면 포인트가 적립되고, 지구가 조금 더
            깨끗해집니다.
          </p>
          <div style={{ display: "flex", gap: 16, marginTop: 36, flexWrap: "wrap" }}>
            <Link className="btn btn-pink btn-lg" href="/return">
              공병 반납 신청하기
            </Link>
            <Link className="btn btn-ghost btn-lg" href="/my">
              내 반납 내역
            </Link>
          </div>
        </div>
        <div className="recycle-flow">
          {STEPS.map((s) => (
            <div className="r-step" key={s.n}>
              <div className="r-num">{s.n}</div>
              <div className="r-text">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
