// 도메인 타입 — 디자인과 무관한 레이어. 와이어프레임이 바뀌어도 유지된다.
// API(FastAPI) 응답 형태와 1:1로 맞춘다.

export type GradeKey = "Seed" | "Leaf" | "Tree" | "Forest";

export type ProductTag = "VEGAN" | "BEST" | "NEW";

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  /** 실제 이미지 연동 전 placeholder 이모지 */
  emoji: string;
  tag?: ProductTag;
  vegan: boolean;
}

export interface MembershipTier {
  key: GradeKey;
  emoji: string;
  /** 승급 조건 (예: "공병 3개 반납") */
  condition: string;
  benefits: string[];
  featured?: boolean;
}

export interface CycleStep {
  step: string;
  emoji: string;
  title: string;
  desc: string;
}

export interface Story {
  kicker: string;
  title: string;
  desc?: string;
  /** 배경 placeholder를 가리키는 css 클래스 (s1~s5) */
  variant: string;
  featured?: boolean;
}

export interface Stat {
  value: string;
  label: string;
}
