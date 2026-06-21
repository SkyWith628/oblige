"use client";
// 반납 어시스턴트 플로팅 챗 — /api/agent/chat(Gemini, tool use) 연동.
// 미로그인 → 로그인 유도, 503(GOOGLE_API_KEY 미설정) → "준비 중" 안내.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sendChatAction, type ChatTurn } from "@/app/actions/agent";
import styles from "./ChatWidget.module.css";

// 화면 표시용 — ChatTurn 에 "사진 첨부" 표시 플래그를 더한다.
type Msg = ChatTurn & { image?: boolean };

const GREETING: Msg = {
  role: "assistant",
  content: "안녕하세요! 공병 반납·포인트·등급에 대해 무엇이든 물어보세요 🌿\n공병 사진을 첨부하면 바로 확인해 드려요 📷",
};

export default function ChatWidget({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight);
  }, [messages, loading, note]);

  function clearImage() {
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send() {
    const text = input.trim();
    if ((!text && !image) || loading) return;
    setInput("");
    setNote(null);
    const history = messages;
    const sentImage = image;
    const shown = text || "이 공병 사진 확인해줘";
    setMessages((m) => [...m, { role: "user", content: shown, image: !!sentImage }]);
    clearImage();
    setLoading(true);

    const fd = new FormData();
    fd.append("message", shown);
    fd.append(
      "history",
      JSON.stringify(history.map((h) => ({ role: h.role, content: h.content }))),
    );
    if (sentImage) fd.append("image", sentImage);

    const res = await sendChatAction(fd);
    setLoading(false);
    if (res.unavailable) {
      setNote("어시스턴트는 준비 중이에요 (서버에 LLM 키/로그인 설정 시 활성화).");
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
                {m.image && "📷 "}
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

          {image && (
            <div className={styles.attachChip}>
              <span className={styles.attachName}>📷 {image.name}</span>
              <button onClick={clearImage} aria-label="첨부 취소">
                ✕
              </button>
            </div>
          )}

          <div className={styles.inputRow}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
            <button
              className={styles.attach}
              onClick={() => fileRef.current?.click()}
              disabled={!loggedIn || loading}
              aria-label="공병 사진 첨부"
            >
              📷
            </button>
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
