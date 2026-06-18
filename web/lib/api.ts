// API 클라이언트 — FastAPI(api/) 백엔드와 통신하는 단일 진입점.
// 지금은 목업을 반환하고, 백엔드 완성 시 fetch 구현으로 교체한다.
// 화면 컴포넌트는 mock.ts 가 아니라 항상 이 모듈을 통해 데이터를 받는다.
import type { Product, MembershipTier } from "./types";
import { products as mockProducts, membershipTiers as mockTiers } from "./mock";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

/** 백엔드 연결 후 이 플래그만 true 로 바꾸면 실제 API 호출로 전환된다. */
const USE_API = false;

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

export function getProducts(): Promise<Product[]> {
  return get<Product[]>("/api/products", mockProducts);
}

export function getMembershipTiers(): Promise<MembershipTier[]> {
  return get<MembershipTier[]>("/api/grades", mockTiers);
}
