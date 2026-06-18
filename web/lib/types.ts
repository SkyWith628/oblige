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

// ── 인증/마이페이지 (FastAPI 스키마와 1:1) ──────────────────

/** GET /api/auth/me → UserOut */
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  grade: string;
  total_point: number;
  bottle_return_count: number;
}

/** GET /api/points/balance */
export interface Balance {
  balance: number;
  grade: string;
}

/** GET /api/points → PointTxOut[] */
export interface PointTx {
  id: number;
  point_change: number;
  balance_after: number;
  tx_type: string;
  reason: string | null;
  created_at: string;
}

/** GET /api/returns → ReturnOut[] */
export interface Return {
  id: number;
  return_number: string;
  bottle_count: number;
  return_method: string;
  photo_urls: string[];
  ai_detection: Record<string, unknown> | null;
  return_status: string;
  approved_point: number;
  created_at: string;
}
