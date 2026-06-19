// API 클라이언트 — FastAPI(api/) 백엔드와 통신하는 단일 진입점.
// 지금은 목업을 반환하고, 백엔드 완성 시 fetch 구현으로 교체한다.
// 화면 컴포넌트는 mock.ts 가 아니라 항상 이 모듈을 통해 데이터를 받는다.
import type { Product, MembershipTier } from "./types";
import { products as mockProducts, membershipTiers as mockTiers } from "./mock";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

/** 실제 API 호출 사용. 실패 시 get() 이 목업으로 폴백하므로 백엔드 미기동에도 안전. */
const USE_API = true;

async function get<T>(path: string, fallback: T): Promise<T> {
  if (!USE_API) return fallback;
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch {
    // 실패 시 목업으로 폴백 — 개발 중 화면이 깨지지 않게.
    return fallback;
  }
}

// 백엔드 ProductOut(category_id·is_vegan, emoji/tag 없음) → 웹 Product 형태로 매핑.
interface RawProduct {
  id: number;
  category_id: number;
  name: string;
  price: number;
  description?: string | null;
  is_vegan: boolean;
}
const CATEGORY_NAME: Record<number, string> = {
  1: "토너",
  2: "앰플",
  3: "크림",
  4: "선크림",
  5: "리필상품",
  6: "굿즈",
};
const CATEGORY_EMOJI: Record<number, string> = {
  1: "🧴",
  2: "💧",
  3: "🪻",
  4: "☀️",
  5: "♻️",
  6: "🎁",
};

function mapProduct(r: RawProduct): Product {
  return {
    id: String(r.id),
    name: r.name,
    category: CATEGORY_NAME[r.category_id] ?? "굿즈",
    description: r.description ?? "",
    price: r.price,
    emoji: CATEGORY_EMOJI[r.category_id] ?? "🧴",
    vegan: r.is_vegan,
    tag: r.is_vegan ? "VEGAN" : undefined,
  };
}

export async function getProducts(): Promise<Product[]> {
  const raw = await get<RawProduct[] | null>("/api/products", null);
  return raw && raw.length ? raw.map(mapProduct) : mockProducts;
}

export function getMembershipTiers(): Promise<MembershipTier[]> {
  return get<MembershipTier[]>("/api/grades", mockTiers);
}
