// 목업 데이터 — API(FastAPI) 연결 전까지 사용하는 placeholder.
// 실제 연결 시 lib/api.ts 가 이 데이터를 fetch 결과로 대체한다.
import type { Product, MembershipTier, CycleStep, Story, Stat } from "./types";

export const heroStats: Stat[] = [
  { value: "12,400", label: "반납된 공병" },
  { value: "100%", label: "비건 인증 제품" },
  { value: "3.2t", label: "절감한 플라스틱" },
];

export const cycleSteps: CycleStep[] = [
  { step: "01", emoji: "🛍️", title: "비건 화장품 구매", desc: "동물 성분 무첨가, 친환경 패키지" },
  { step: "02", emoji: "🫙", title: "공병 준비", desc: "세척 후 반납 가능한 공병" },
  { step: "03", emoji: "📸", title: "AI 인식 & 적립", desc: "사진 한 장으로 자동 포인트" },
  { step: "04", emoji: "🎁", title: "리필 & 리워드", desc: "기준 달성 시 리필·굿즈" },
  { step: "05", emoji: "♻️", title: "재사용·업사이클", desc: "파트너와 협력해 자원 순환" },
];

export const products: Product[] = [
  { id: "p1", name: "그린티 밸런싱 토너", category: "토너", description: "민감 피부 진정 · 200ml 리필 가능", price: 28000, emoji: "🧴", tag: "VEGAN", vegan: true },
  { id: "p2", name: "비타 글로우 앰플", category: "앰플", description: "광채 부스팅 · 30ml 고농축", price: 42000, emoji: "💧", tag: "BEST", vegan: true },
  { id: "p3", name: "시카 리페어 크림", category: "크림", description: "장벽 강화 보습 · 50ml", price: 36000, emoji: "🪻", tag: "VEGAN", vegan: true },
];

export const stories: Story[] = [
  { kicker: "Featured", title: "공병 반납 챌린지\n시즌 2 오픈", desc: "#OBLIGE공병반납 인증하고 한정 굿즈 받기", variant: "s1", featured: true },
  { kicker: "Campaign", title: "리필 스테이션\n전국 확대", variant: "s2" },
  { kicker: "Impact", title: "2026 임팩트\n리포트", variant: "s3" },
  { kicker: "New", title: "비건 선크림\n신제품", variant: "s4" },
  { kicker: "Partner", title: "업사이클링\n파트너십", variant: "s5" },
];

export const membershipTiers: MembershipTier[] = [
  { key: "Seed", emoji: "🌱", condition: "기본", benefits: ["기본 포인트 적립", "회원 전용 뉴스레터"] },
  { key: "Leaf", emoji: "🍃", condition: "공병 3개 반납", benefits: ["포인트 +10%", "신제품 우선 구매"], featured: true },
  { key: "Tree", emoji: "🌳", condition: "공병 7개 반납", benefits: ["친환경 굿즈 제공", "포인트 +20% · 리필 쿠폰"] },
  { key: "Forest", emoji: "🌲", condition: "공병 15개 반납", benefits: ["리필 무료", "한정 상품 · 앰배서더"] },
];
