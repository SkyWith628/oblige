// 옛 정적(index.html) 밸류 마퀴 포팅 — Playfair 텍스트가 흐르고, ghost 항목은 아웃라인.
const ITEMS: { label: string; ghost?: boolean }[] = [
  { label: "Vegan Beauty" },
  { label: "Refill Value", ghost: true },
  { label: "Zero Waste" },
  { label: "Cruelty Free", ghost: true },
  { label: "Circular ESG" },
  { label: "Return Beauty", ghost: true },
];

export default function MarqueeBar() {
  // translateX(-50%) 루프 — 동일 세트를 두 번 이어 붙여 끊김 없이 흐르게.
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {loop.map((it, i) => (
          <span key={i} className={`marquee-item${it.ghost ? " ghost" : ""}`}>
            {it.label}
            <span className="dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
