"use client";
// W3 FAQ 아코디언 — 한 번에 하나만 펼침.
import { useState } from "react";
import styles from "./howitworks.module.css";

const ITEMS = [
  {
    q: "포인트는 언제 적립되나요?",
    a: "스캔이 완료되면 즉시 적립됩니다. 매장 직원 확인이 필요한 경우 최대 24시간 내 반영돼요.",
  },
  {
    q: "한 번에 몇 개까지 반납할 수 있나요?",
    a: "1회 최대 20개까지 반납할 수 있어요. 그 이상은 매장 방문 반납을 권장합니다.",
  },
  {
    q: "앱 없이 웹으로만 가능한가요?",
    a: "네. 웹에서 반납 신청 후 매장·무인 수거함에서 QR로 처리하면 됩니다.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className={styles.faq}>
      {ITEMS.map((it, i) => {
        const isOpen = open === i;
        return (
          <div className={styles.faqItem} key={it.q}>
            <button
              className={styles.faqQ}
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              {it.q}
              <span className={styles.faqSign}>{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && <p className={styles.faqA}>{it.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
