// 서버 전용 FastAPI 클라이언트 (BFF).
// 브라우저는 FastAPI를 직접 부르지 않는다 — 항상 Next 서버를 경유한다.
// 인증 호출은 쿠키의 JWT를 읽어 Authorization: Bearer 로 변환해 붙인다.
import "server-only";
import { getToken } from "./session";
import type { User, Balance, PointTx, Return, Order, DetectResult } from "./types";

// 서버↔서버 호출이므로 내부 주소 우선. (NEXT_PUBLIC_* 는 클라이언트 노출용이라 폴백으로만)
const API_BASE =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "http://localhost:8000";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

/** FastAPI 에러 응답({detail})에서 메시지를 뽑는다. */
async function detail(res: Response, fallback: string): Promise<string> {
  try {
    const j = await res.json();
    if (typeof j?.detail === "string") return j.detail;
    if (Array.isArray(j?.detail)) return j.detail[0]?.msg ?? fallback;
  } catch {
    /* ignore */
  }
  return fallback;
}

/** 로그인 — OAuth2 표준이라 form-urlencoded(username=이메일). 성공 시 토큰 반환. */
export async function login(
  email: string,
  password: string,
): Promise<AuthResult & { token?: string }> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    return { ok: false, error: await detail(res, "로그인에 실패했습니다") };
  }
  const data = (await res.json()) as { access_token: string };
  return { ok: true, token: data.access_token };
}

/** 회원가입 — JSON. 성공 시 ok:true (로그인은 별도로 수행). */
export async function register(
  email: string,
  password: string,
  name: string,
): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
    cache: "no-store",
  });
  if (!res.ok) {
    return { ok: false, error: await detail(res, "회원가입에 실패했습니다") };
  }
  return { ok: true };
}

/** 인증이 필요한 GET — 쿠키 토큰을 Bearer로 변환. 토큰 없으면 null. */
async function authedGet<T>(path: string): Promise<T | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export const getMe = () => authedGet<User>("/api/auth/me");
export const getBalance = () => authedGet<Balance>("/api/points/balance");
export const getPointHistory = () => authedGet<PointTx[]>("/api/points");
export const getMyReturns = () => authedGet<Return[]>("/api/returns");
export const getMyOrders = () => authedGet<Order[]>("/api/orders");

/** 인증이 필요한 POST(JSON). 토큰 없으면 ok:false. */
async function authedPost<T>(
  path: string,
  body: unknown,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const token = await getToken();
  if (!token) return { ok: false, error: "로그인이 필요합니다" };
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, error: await detail(res, "요청에 실패했습니다") };
  return { ok: true, data: (await res.json()) as T };
}

/** 주문 생성 — items[{product_id, quantity}], 포인트 사용액, 배송지. */
export function createOrder(
  items: { product_id: number; quantity: number }[],
  usedPoint = 0,
  deliveryAddress?: string,
) {
  return authedPost<Order>("/api/orders", {
    items,
    used_point: usedPoint,
    delivery_address: deliveryAddress ?? null,
  });
}

/** 공병 반납 신청 — REQUESTED 상태 생성, 관리자 승인 시 공병당 포인트 적립. */
export function createReturn(
  bottleCount: number,
  aiDetection: Record<string, unknown> | null = null,
  returnMethod = "DELIVERY",
) {
  return authedPost<Return>("/api/returns", {
    bottle_count: bottleCount,
    return_method: returnMethod,
    photo_urls: [],
    ai_detection: aiDetection,
  });
}

/** YOLO 공병 인식 — 인증 불필요(multipart). 모델 미배포 시 503 → unavailable. */
export async function detectBottle(
  file: File,
): Promise<{ ok: boolean; data?: DetectResult; unavailable?: boolean; error?: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/api/ai/detect-bottle`, {
    method: "POST",
    body: fd,
    cache: "no-store",
  });
  if (res.status === 503) {
    return { ok: false, unavailable: true, error: await detail(res, "AI 인식 미가동") };
  }
  if (!res.ok) return { ok: false, error: await detail(res, "공병 인식에 실패했습니다") };
  return { ok: true, data: (await res.json()) as DetectResult };
}
