"use client";
// 반납 어시스턴트 플로팅 챗 — /api/agent/chat(Gemini, tool use) 연동.
// 미로그인 → 로그인 유도, 503(GOOGLE_API_KEY 미설정) → "준비 중" 안내.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sendChatAction, type ChatTurn } from "@/app/actions/agent";
import styles from "./ChatWidget.module.css";

const GREETING: ChatTurn = {
  role: "assistant",
  content: "안녕하세요! 공병 반납·포인트·등급에 대해 무엇이든 물어보세요 🌿",
};

export default function ChatWidget({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight);
  }, [messages, loading, note]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setNote(null);
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    const res = await sendChatAction(history, text);
    setLoading(false);
    if (res.unavailable) {
      setNote("어시스턴트는 준비 중이에요 (서버에 GOOGLE_API_KEY 설정 시 활성화).");
      return;
    }
    if (res.error) {
      setNote(res.error);
      return;
    }
    setMessages((m) => [...m, { role: "assistant", content: res.reply ?? "" }]);
  }

  return (
    <>
      {!open && (
        <button
          className={styles.fab}
          onClick={() => setOpen(true)}
          aria-label="반납 어시스턴트 열기"
        >
          💬
        </button>
      )}

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div>
              <div className={styles.title}>반납 어시스턴트</div>
              <div className={styles.sub}>공병 반납·포인트 도우미</div>
            </div>
            <button
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          <div className={styles.body} ref={bodyRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`${styles.msg} ${m.role === "user" ? styles.user : styles.bot}`}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className={styles.typing}>입력 중…</div>}
            {!loggedIn && (
              <div className={styles.note}>
                <Link href="/login">로그인</Link> 후 이용할 수 있어요.
              </div>
            )}
            {note && <div className={styles.note}>{note}</div>}
          </div>

          <div className={styles.inputRow}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder={loggedIn ? "메시지를 입력하세요" : "로그인이 필요해요"}
              disabled={!loggedIn || loading}
            />
            <button
              className={styles.send}
              onClick={send}
              disabled={!loggedIn || loading}
              aria-label="전송"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
