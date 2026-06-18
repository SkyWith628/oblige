import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

// 디스플레이 세리프 — next/font 로 최적화 로딩, CSS 변수로 노출.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OBLIGE — Responsible Beauty",
  description:
    "비건 화장품을 쓰고 공병을 반납하면 AI가 인식해 포인트로 돌려드립니다. 지속가능한 ESG 코스메틱 플랫폼.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={playfair.variable}>
      <head>
        {/* 본문 폰트 Pretendard — Google Fonts 미제공이라 CDN 로드 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
