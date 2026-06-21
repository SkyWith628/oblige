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

// 멀티파트 입력: message(필수) + history(JSON) + image(선택, File).
// 파일 업로드는 이 코드베이스 관례대로 FormData 로 받는다 (detectAction 과 동일).
export async function sendChatAction(formData: FormData): Promise<ChatResult> {
  const message = String(formData.get("message") ?? "");
  let history: ChatTurn[] = [];
  const raw = formData.get("history");
  if (typeof raw === "string" && raw) {
    try {
      history = JSON.parse(raw) as ChatTurn[];
    } catch {
      history = [];
    }
  }
  const img = formData.get("image");
  const image = img instanceof File && img.size > 0 ? img : null;

  const res = await chatAgent(
    message,
    history.map((h) => ({ role: h.role, content: h.content })),
    image,
  );
  if (res.unavailable) return { unavailable: true };
  if (!res.ok) return { error: res.error ?? "응답 실패" };
  return { reply: res.reply };
}
