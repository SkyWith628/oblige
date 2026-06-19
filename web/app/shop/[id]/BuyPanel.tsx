"use client";
// W6 구매 패널 — 수량/포인트 사용 + 구매하기(buyAction). 미로그인 시 /login 유도.
import { useActionState, useState } from "react";
import Link from "next/link";
import { buyAction, type BuyState } from "@/app/actions/shop";
import styles from "./detail.module.css";

const INIT: BuyState = {};
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export default function BuyPanel({
  productId,
  price,
  stock,
  balance,
}: {
  productId: number;
  price: number;
  stock: number;
  balance: number | null; // null = 미로그인
}) {
  const [qty, setQty] = useState(1);
  const [usePoint, setUsePoint] = useState(false);
  const [state, formAction, pending] = useActionState(buyAction, INIT);

  const loggedIn = balance !== null;
  const total = price * qty;
  const usedPoint = usePoint && loggedIn ? Math.min(balance, total) : 0;

  if (state.ok) {
    return (
      <div className={styles.success}>
        <h4>✓ 구매가 완료됐어요</h4>
        <p>주문번호 {state.orderNumber}</p>
        <Link className="btn btn-pink" href="/my">
          마이페이지에서 확인 →
        </Link>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <Link className="btn btn-pink btn-lg" href="/login">
        로그인하고 구매하기
      </Link>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="quantity" value={qty} />
      <input type="hidden" name="used_point" value={usedPoint} />

      <div className={styles.qtyRow}>
        <span className={styles.qtyLabel}>수량</span>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="수량 줄이기"
          >
            −
          </button>
          <span className={styles.qtyVal}>{qty}</span>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            disabled={qty >= stock}
            aria-label="수량 늘리기"
          >
            +
          </button>
        </div>
      </div>

      <label className={styles.pointToggle}>
        <input
          type="checkbox"
          checked={usePoint}
          onChange={(e) => setUsePoint(e.target.checked)}
        />
        보유 포인트 사용 {usedPoint > 0 ? `(−${usedPoint.toLocaleString("ko-KR")}P)` : ""}
      </label>

      {state.error && <div className={styles.buyErr}>{state.error}</div>}

      <div className={styles.buyBtns}>
        <button className="btn btn-pink btn-lg" type="submit" disabled={pending}>
          {pending ? "처리 중…" : `${won(total - usedPoint)} 구매하기`}
        </button>
        <button type="button" className={styles.wish} title="준비 중">
          위시리스트
        </button>
      </div>
    </form>
  );
}
