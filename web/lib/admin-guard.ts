// 어드민 라우트 가드 — 미로그인 → /login, 비관리자 → /(홈). 서버 전용.
import "server-only";
import { redirect } from "next/navigation";
import { getMe } from "./server-api";

export async function requireAdmin() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");
  return me;
}
