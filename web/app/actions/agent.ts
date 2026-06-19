"use server";
// 반납 어시스턴트 챗 — 클라이언트에서 직접 호출(함수형 Server Action).
import { chatAgent } from "@/lib/server-api";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply?: string;
  unavailable?: boolean;
  error?: string;
}

export async function sendChatAction(
  history: ChatTurn[],
  message: string,
): Promise<ChatResult> {
  const res = await chatAgent(
    message,
    history.map((h) => ({ role: h.role, content: h.content })),
  );
  if (res.unavailable) return { unavailable: true };
  if (!res.ok) return { error: res.error ?? "응답 실패" };
  return { reply: res.reply };
}
