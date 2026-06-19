"use client";
// 모바일 Nav — 햄버거 토글 + 드롭다운 메뉴(데스크탑에선 CSS로 숨김).
import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

const LINKS = [
  { label: "브랜드 스토리", href: "/about" },
  { label: "이용 방법", href: "/how-it-works" },
  { label: "수거함 찾기", href: "/find" },
  { label: "굿즈 샵", href: "/shop" },
  { label: "임팩트", href: "/impact" },
];

export default function MobileMenu({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mnav">
      <button
        className={`mnav-burger${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="메뉴"
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="mnav-panel" onClick={() => setOpen(false)}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <div className="mnav-sep" />
          {loggedIn ? (
            <>
              <Link href="/my">마이페이지</Link>
              <form action={logoutAction}>
                <button type="submit" className="mnav-logout">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">로그인</Link>
              <Link href="/refill" className="mnav-cta">
                앱으로 시작
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
