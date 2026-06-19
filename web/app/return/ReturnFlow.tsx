"use client";
// 공병 반납 신청 흐름 — 사진 업로드→AI 인식(detectAction)→수량 확인→반납 신청(submitReturnAction).
// AI(YOLO) 미배포 시 503 → 수동 수량 입력으로 폴백. 신청은 백엔드 실연동.
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  detectAction,
  submitReturnAction,
  type DetectState,
  type ReturnState,
} from "@/app/actions/return";
import styles from "./return.module.css";

const METHODS = [
  { v: "DELIVERY", l: "택배 반납" },
  { v: "STORE", l: "매장 방문" },
  { v: "KIOSK", l: "무인 수거함" },
];

export default function ReturnFlow({ loggedIn }: { loggedIn: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [method, setMethod] = useState("DELIVERY");
  const [detectState, detectForm, detecting] = useActionState(
    detectAction,
    {} as DetectState,
  );
  const [submitState, submitForm, submitting] = useActionState(
    submitReturnAction,
    {} as ReturnState,
  );

  // AI 인식 결과가 오면 수량 자동 반영
  useEffect(() => {
    if (detectState.total && detectState.total > 0) setCount(detectState.total);
  }, [detectState.total]);

  if (!loggedIn) {
    return (
      <Link className="btn btn-pink btn-lg" href="/login">
        로그인하고 반납 신청하기
      </Link>
    );
  }

  if (submitState.ok) {
    return (
      <div className={styles.done}>
        <div className={styles.doneIc}>✓</div>
        <h3>반납 신청이 접수됐어요</h3>
        <p>
          신청번호 {submitState.returnNumber} · 검수 후 공병당 500P가 적립됩니다.
        </p>
        <Link className="btn btn-pink" href="/my?tab=returns">
          반납 내역 보기 →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.step}>STEP 1 · 사진 업로드</div>
        <form action={detectForm}>
          <label className={styles.drop}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="공병 미리보기" />
            ) : (
              <span>📷 공병 사진을 선택하세요</span>
            )}
            <input
              type="file"
              name="photo"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
          </label>
          <button
            className="btn btn-ghost"
            type="submit"
            disabled={detecting || !preview}
          >
            {detecting ? "인식 중…" : "AI로 공병 인식"}
          </button>
        </form>
        {detectState.unavailable && (
          <p className={styles.notice}>
            ℹ️ AI 인식은 현재 미배포 상태예요(YOLO 모델 미탑재). 아래에서 수량을
            직접 입력해 신청할 수 있어요.
          </p>
        )}
        {detectState.total !== undefined && (
          <p className={styles.detok}>AI 인식 결과: 공병 {detectState.total}개</p>
        )}
        {detectState.error && <p className={styles.err}>{detectState.error}</p>}
      </div>

      <div className={styles.card}>
        <div className={styles.step}>STEP 2 · 반납 신청</div>
        <form action={submitForm}>
          <input
            type="hidden"
            name="ai_detection"
            value={detectState.counts ? JSON.stringify(detectState.counts) : ""}
          />
          <label className={styles.field}>
            공병 수량
            <input
              className={styles.num}
              type="number"
              name="bottle_count"
              min={1}
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <label className={styles.field}>
            반납 방법
            <select
              className={styles.sel}
              name="return_method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {METHODS.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.l}
                </option>
              ))}
            </select>
          </label>
          {submitState.error && <p className={styles.err}>{submitState.error}</p>}
          <button className="btn btn-pink btn-lg" type="submit" disabled={submitting}>
            {submitting ? "신청 중…" : `공병 ${count}개 반납 신청`}
          </button>
        </form>
      </div>
    </div>
  );
}
