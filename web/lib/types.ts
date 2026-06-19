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
  /** 재고 (상세/구매 수량 상한). 목데이터는 미지정. */
  stock?: number;
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

// ── 어드민 콘솔 ────────────────────────────────────────
export interface AdminStats {
  pending_returns: number;
  members: number;
  total_returns: number;
  issued_points: number;
}

export interface AdminReturn {
  id: number;
  return_number: string;
  bottle_count: number;
  return_method: string;
  return_status: string;
  approved_point: number;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  user_grade: string | null;
}

export interface AdminProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  grade: string;
  total_point: number;
  bottle_return_count: number;
  is_active: boolean;
  created_at: string;
}

/** POST /api/ai/detect-bottle → DetectResult */
export interface DetectResult {
  detections: { label: string; confidence: number; box: number[] }[];
  counts: Record<string, number>;
  total: number;
}

/** OrderItemOut */
export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/** POST/GET /api/orders → OrderOut */
export interface Order {
  id: number;
  order_number: string;
  total_price: number;
  used_point: number;
  earned_point: number;
  shipping_fee: number;
  final_price: number;
  order_status: string;
  delivery_address: string | null;
  tracking_number: string | null;
  created_at: string;
  items: OrderItem[];
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
