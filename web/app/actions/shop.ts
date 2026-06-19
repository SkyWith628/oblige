"use server";
// 굿즈 구매 Server Action — 쿠키 토큰으로 /api/orders 생성(서버가 가격·재고·포인트 재검증).
import { createOrder } from "@/lib/server-api";

export interface BuyState {
  ok?: boolean;
  orderNumber?: string;
  error?: string;
}

export async function buyAction(
  _prev: BuyState,
  formData: FormData,
): Promise<BuyState> {
  const productId = Number(formData.get("product_id"));
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  const usedPoint = Math.max(0, Number(formData.get("used_point")) || 0);
  if (!productId) return { error: "상품 정보가 올바르지 않습니다" };

  const res = await createOrder([{ product_id: productId, quantity }], usedPoint);
  if (!res.ok || !res.data) return { error: res.error ?? "구매에 실패했습니다" };
  return { ok: true, orderNumber: res.data.order_number };
}
