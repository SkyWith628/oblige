import type { Metadata } from "next";
import { Cormorant_Garamond, Playfair_Display } from "next/font/google";
import "./globals.css";

// 라틴 디스플레이 세리프 — 럭셔리 뷰티 톤의 고대비 가라몬드.
// (한글 세리프는 Nanum Myeongjo 를 <head> CDN 으로 로드 — Korean 서브셋은 next/font 보다 CDN 이 안전)
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// 히어로 디스플레이 세리프 — 옛 정적(index.html)의 헤드라인 서체. 묵직한 900 웨이트.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
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
    <html lang="ko" className={`${cormorant.variable} ${playfair.variable}`}>
      <head>
        {/* 본문 폰트 Pretendard — Google Fonts 미제공이라 CDN 로드 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        {/* 한글 디스플레이 세리프 — 아모레퍼시픽 아리따부리(Arita Buri, 명조) · 실제 대기업 코퍼레이션 서체 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/fonts-archive/AritaBuri/AritaBuri.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
