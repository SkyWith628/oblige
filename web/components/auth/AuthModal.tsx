"use client";
// 로그인/회원가입 모달 — 구 index.html 의 #auth-overlay 디자인을 그대로 이식.
// 폼은 Server Action(useActionState)으로 제출, 성공 시 onSuccess()로 닫고 새로고침.
import { useActionState, useEffect, useState } from "react";
import { loginAction, registerAction, type FormState } from "@/app/actions/auth";

const INIT: FormState = {};

export default function AuthModal({
  open,
  initialTab = "login",
  onClose,
  onSuccess,
}: {
  open: boolean;
  initialTab?: "login" | "register";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [prevOpen, setPrevOpen] = useState(open);
  // 모달이 열리는 순간 요청된 탭으로 초기화 — effect 내 setState 대신 '렌더 중 조정'(React 권장 패턴)
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setTab(initialTab);
  }

  const action = tab === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, INIT);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <div
      className={`overlay${open ? " open" : ""}`}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <div className="auth-body">
          <div style={{ marginBottom: 8 }}>
            <div className="nav-logo" style={{ fontSize: 20 }}>
              OBLI<span style={{ color: "var(--pink)" }}>GE</span>
            </div>
          </div>
          <div className="auth-tabs">
            <button
              className={`auth-tab${tab === "login" ? " active" : ""}`}
              onClick={() => setTab("login")}
            >
              로그인
            </button>
            <button
              className={`auth-tab${tab === "register" ? " active" : ""}`}
              onClick={() => setTab("register")}
            >
              회원가입
            </button>
          </div>

          {/* tab 변경 시 폼/상태 초기화를 위해 key 부여 */}
          <form action={formAction} key={tab}>
            {tab === "register" && (
              <div className="form-group">
                <label className="form-label">이름</label>
                <input className="form-input" name="name" type="text" placeholder="홍길동" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input
                className="form-input"
                name="email"
                type="email"
                required
                placeholder="email@example.com"
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
                placeholder="비밀번호"
              />
            </div>
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

          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "var(--muted)",
              marginTop: 16,
            }}
          >
            {tab === "login" ? (
              <>
                계정이 없으신가요?{" "}
                <a className="auth-link" onClick={() => setTab("register")}>
                  회원가입
                </a>
              </>
            ) : (
              <>
                이미 회원이신가요?{" "}
                <a className="auth-link" onClick={() => setTab("login")}>
                  로그인
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
