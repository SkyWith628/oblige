const ITEMS = [
  ["크루얼티 프리", "Cruelty Free"],
  ["리필 가능", "Refillable"],
  ["재활용 패키지", "Recyclable"],
  ["탄소 절감", "Low Carbon"],
];

export default function MarqueeBar() {
  // 끊김 없는 흐름을 위해 두 번 반복
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="marq" aria-hidden="true">
      {loop.map(([ko, en], i) => (
        <span key={i}>
          {ko} <b>{en}</b>
        </span>
      ))}
    </div>
  );
}
