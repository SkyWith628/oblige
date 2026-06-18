// 세션(JWT) 쿠키 관리 — BFF 패턴의 핵심.
// FastAPI가 발급한 access_token 을 httpOnly 쿠키에 저장한다.
// httpOnly: 클라이언트 JS(document.cookie)가 못 읽음 → XSS로 토큰 탈취 방어.
// server-only: 이 모듈이 실수로 클라이언트 번들에 섞이면 빌드 에러로 막는다.
import "server-only";
import { cookies } from "next/headers";

const COOKIE = "oblige_session";
// FastAPI ACCESS_TOKEN_EXPIRE_MINUTES(기본 1440=24h)와 맞춘다.
const MAX_AGE = 60 * 60 * 24;

/** 로그인 성공 시 토큰을 쿠키에 심는다. (Next 16: cookies()는 async) */
export async function setSession(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

/** 현재 요청의 토큰을 읽는다. 없으면 null. */
export async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

/** 로그아웃 — 쿠키 삭제. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
