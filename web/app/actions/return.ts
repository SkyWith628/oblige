"use server";
// 공병 반납 Server Actions — YOLO 인식(detect) + 반납 신청(submit).
import { detectBottle, createReturn } from "@/lib/server-api";
import type { DetectResult } from "@/lib/types";

export interface DetectState {
  total?: number;
  counts?: Record<string, number>;
  unavailable?: boolean;
  error?: string;
}

export async function detectAction(
  _prev: DetectState,
  formData: FormData,
): Promise<DetectState> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "사진을 선택해 주세요" };
  }
  const res = await detectBottle(file);
  if (res.unavailable) return { unavailable: true };
  if (!res.ok || !res.data) return { error: res.error ?? "인식 실패" };
  const d: DetectResult = res.data;
  return { total: d.total, counts: d.counts };
}

export interface ReturnState {
  ok?: boolean;
  returnNumber?: string;
  point?: number;
  error?: string;
}

export async function submitReturnAction(
  _prev: ReturnState,
  formData: FormData,
): Promise<ReturnState> {
  const bottleCount = Math.max(1, Number(formData.get("bottle_count")) || 1);
  const method = String(formData.get("return_method") || "DELIVERY");
  const aiRaw = String(formData.get("ai_detection") || "");
  let ai: Record<string, unknown> | null = null;
  if (aiRaw) {
    try {
      ai = JSON.parse(aiRaw);
    } catch {
      ai = null;
    }
  }

  const res = await createReturn(bottleCount, ai, method);
  if (!res.ok || !res.data) return { error: res.error ?? "반납 신청에 실패했습니다" };
  return { ok: true, returnNumber: res.data.return_number };
}
