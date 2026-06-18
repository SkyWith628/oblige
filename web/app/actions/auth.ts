"use server";
// 인증 Server Actions (모달용) — 폼 제출이 서버에서 실행돼 자격증명이 클라이언트에 안 남는다.
// 구 사이트가 모달 기반이므로 redirect 대신 결과({ok|error})를 반환하고,
// 성공 후 닫기/새로고침은 클라이언트가 처리한다.
import { login, register, getMe, getPointHistory, getMyReturns } from "@/lib/server-api";
import { setSession, clearSession } from "@/lib/session";
import type { User, PointTx, Return } from "@/lib/types";

export interface FormState {
  ok?: boolean;
  error?: string;
}

function read(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = read(formData, "email");
  const password = read(formData, "password");
  if (!email || !password) return { error: "이메일과 비밀번호를 입력하세요" };

  const res = await login(email, password);
  if (!res.ok || !res.token) return { error: res.error ?? "로그인 실패" };

  await setSession(res.token);
  return { ok: true };
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = read(formData, "email");
  const password = read(formData, "password");
  const name = read(formData, "name") || "회원";
  if (!email || !password) return { error: "이메일과 비밀번호를 입력하세요" };
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다" };

  const reg = await register(email, password, name);
  if (!reg.ok) return { error: reg.error ?? "회원가입 실패" };

  // 가입 직후 자동 로그인.
  const res = await login(email, password);
  if (!res.ok || !res.token) {
    return { error: "가입은 됐지만 자동 로그인에 실패했습니다. 로그인해 주세요." };
  }
  await setSession(res.token);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await clearSession();
}

export interface MypageData {
  user: User;
  points: PointTx[];
  returns: Return[];
}

/** 마이페이지 모달이 열릴 때 호출 — 쿠키 토큰으로 인증 데이터 조회. 미로그인 시 null. */
export async function getMypageData(): Promise<MypageData | null> {
  const [user, points, returns] = await Promise.all([
    getMe(),
    getPointHistory(),
    getMyReturns(),
  ]);
  if (!user) return null;
  return { user, points: points ?? [], returns: returns ?? [] };
}
