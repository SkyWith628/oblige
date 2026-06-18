"use client";
// Nav 의 인터랙티브 영역 — 로그인/마이페이지 버튼 + 모달 상태 관리.
// 로그인 상태(loggedIn)는 서버(쿠키)에서 받아오고, 모달 성공/로그아웃 후
// router.refresh()로 서버 컴포넌트(Nav)를 다시 그려 상태를 갱신한다.
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import MypageModal from "@/components/auth/MypageModal";

export default function NavActions({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [mpOpen, setMpOpen] = useState(false);

  function openAuth(tab: "login" | "register" = "login") {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  return (
    <>
      <div className="nav-cta">
        {loggedIn ? (
          <button className="btn btn-ghost" onClick={() => setMpOpen(true)}>
            마이페이지
          </button>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={() => openAuth("login")}>
              로그인
            </button>
            <button className="btn btn-pink" onClick={() => openAuth("register")}>
              시작하기
            </button>
          </>
        )}
      </div>

      <AuthModal
        open={authOpen}
        initialTab={authTab}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          router.refresh();
        }}
      />
      <MypageModal
        open={mpOpen}
        onClose={() => setMpOpen(false)}
        onLogout={() => {
          setMpOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
