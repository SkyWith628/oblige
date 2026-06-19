"use client";
// W9 로그인 / 회원가입 페이지 — 모달을 대체하는 전용 라우트.
// 폼은 Server Action(useActionState)으로 제출, 성공 시 /my 로 이동.
import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, registerAction, type FormState } from "@/app/actions/auth";
import styles from "./login.module.css";

const INIT: FormState = {};
const SOCIAL = ["카카오", "네이버", "Apple"];

// 로그인/회원가입 성공 시 이동은 Server Action 내부 redirect("/my") 가 처리한다.
export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const action = tab === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, INIT);

  return (
    <main className={styles.split}>
      <aside className={styles.brand}>
        <div className={styles.brandGlow} />
        <div className={styles.brandInner}>
          <Link href="/" className={styles.eyebrow}>
            OBLIGE
          </Link>
          <h1 className={styles.brandTitle}>
            공병이 다시
            <br />
            돌아오는 곳
          </h1>
          <p className={styles.brandText}>
            가입하면 첫 반납에 보너스 500P를 드려요. 포인트로 리필하고 굿즈로
            바꿔보세요.
          </p>
          <span className={styles.bonus}>🎁 첫 반납 보너스 +500P</span>
        </div>
        <span className={styles.copy}>© 2026 OBLIGE</span>
      </aside>

      <section className={styles.formSide}>
        <div className={styles.formCard}>
          <div className="auth-body">
            <div className={styles.brandMark}>
              OBLI<span style={{ color: "var(--pink)" }}>GE</span>
            </div>
            <div className="auth-tabs">
              <button
                className={`auth-tab${tab === "login" ? " active" : ""}`}
                onClick={() => setTab("login")}
                type="button"
              >
                로그인
              </button>
              <button
                className={`auth-tab${tab === "register" ? " active" : ""}`}
                onClick={() => setTab("register")}
                type="button"
              >
                회원가입
              </button>
            </div>

            {/* tab 변경 시 폼/상태 초기화를 위해 key 부여 */}
            <form action={formAction} key={tab}>
              {tab === "register" && (
                <div className="form-group">
                  <label className="form-label">이름</label>
                  <input
                    className="form-input"
                    name="name"
                    type="text"
                    placeholder="홍길동"
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">이메일</label>
                <input
                  className="form-input"
                  name="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  비밀번호{tab === "register" ? " (8자 이상)" : ""}
                </label>
                <input
                  className="form-input"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                />
              </div>

              {tab === "login" && (
                <div className={styles.options}>
                  <label className={styles.remember}>
                    <input type="checkbox" name="remember" defaultChecked />
                    로그인 유지
                  </label>
                  <span className={styles.forgot}>비밀번호 찾기</span>
                </div>
              )}

              {state?.error && <div className="form-err">{state.error}</div>}
              <button className="auth-submit" type="submit" disabled={pending}>
                {pending ? (
                  <span className="btn-spinner" aria-label="처리 중" />
                ) : tab === "login" ? (
                  "로그인"
                ) : (
                  "회원가입"
                )}
              </button>
            </form>

            <div className={styles.divider}>또는</div>
            <div className={styles.socialBtns}>
              {SOCIAL.map((s) => (
                <button
                  key={s}
                  className={styles.socialBtn}
                  type="button"
                  disabled
                  title="준비 중"
                >
                  {s}
                </button>
              ))}
            </div>

            <p className={styles.switchRow}>
              {tab === "login" ? (
                <>
                  계정이 없으신가요?{" "}
                  <button onClick={() => setTab("register")} type="button">
                    회원가입
                  </button>
                </>
              ) : (
                <>
                  이미 회원이신가요?{" "}
                  <button onClick={() => setTab("login")} type="button">
                    로그인
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
