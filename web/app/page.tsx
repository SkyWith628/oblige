import SiteShell from "@/components/layout/SiteShell";
import Hero from "@/components/sections/Hero";
import MarqueeBar from "@/components/sections/MarqueeBar";
import StepsBand from "@/components/sections/StepsBand";
import ProductGrid from "@/components/sections/ProductGrid";
import { getProducts } from "@/lib/api";
import { heroStats } from "@/lib/mock";

// W1 랜딩 — 와이어프레임 구조: 히어로(2 CTA) → 통계밴드 → 3단계 → 포인트로 바꾸는 굿즈.
export default async function Home() {
  const products = await getProducts();

  return (
    <SiteShell>
      <Hero stats={heroStats} />
      <MarqueeBar />
      <StepsBand />
      <ProductGrid
        products={products}
        eyebrow="Reward Goods"
        title="포인트로 바꾸는 굿즈"
        ctaHref="/shop"
        limit={4}
        four
      />
    </SiteShell>
  );
}
