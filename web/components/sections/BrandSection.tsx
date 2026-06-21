import Logo from "@/components/ui/Logo";

// 옛 정적(index.html #brand) 포팅 — 브랜드 스토리: 네이비 타일 + 워드마크 + 키워드 핀.
const TAGS = ["Clean", "Vegan", "Refill", "Responsibility", "Sustainable"];

export default function BrandSection() {
  return (
    <section className="brand">
      <div className="wrap brand-in">
        <div className="brand-visual">
          <Logo height={80} variant="white" />
        </div>
        <div>
          <p className="sec-label">Brand Story</p>
          <h2 className="sec-heading">
            책임 있는
            <br />
            아름다움을 제안하다
          </h2>
          <p className="sec-body">
            OBLIGE는 사회적 책임과 지속가능한 소비를 의미하는 브랜드입니다.
            화장품 공병을 회수·재사이클링하는 친환경 비건 코스메틱 플랫폼으로,
            아름다움이 지구에 빚지지 않는 세상을 만들어갑니다.
          </p>
          <div className="brand-tags">
            {TAGS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
