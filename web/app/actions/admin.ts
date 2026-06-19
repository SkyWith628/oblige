"use server";
// 어드민 반납 검수 액션 — 승인/반려 후 목록·대시보드 재검증.
import { revalidatePath } from "next/cache";
import {
  approveReturn,
  rejectReturn,
  updateAdminProduct,
} from "@/lib/server-api";

export async function approveReturnAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (id) await approveReturn(id);
  revalidatePath("/admin/returns");
  revalidatePath("/admin");
}

export async function rejectReturnAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (id) await rejectReturn(id);
  revalidatePath("/admin/returns");
  revalidatePath("/admin");
}

/** E4 상품 노출 토글. */
export async function toggleProductAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const next = formData.get("next") === "1";
  if (id) await updateAdminProduct(id, { is_active: next });
  revalidatePath("/admin/goods");
}
