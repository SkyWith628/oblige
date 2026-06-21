import SiteShell from "@/components/layout/SiteShell";
import Hero from "@/components/sections/Hero";
import MarqueeBar from "@/components/sections/MarqueeBar";
import BrandSection from "@/components/sections/BrandSection";
import ProblemSection from "@/components/sections/ProblemSection";
import SolutionSection from "@/components/sections/SolutionSection";
import ProductGrid from "@/components/sections/ProductGrid";
import RecycleSection from "@/components/sections/RecycleSection";
import RewardSection from "@/components/sections/RewardSection";
import CampaignSection from "@/components/sections/CampaignSection";
import FinalCta from "@/components/sections/FinalCta";
import { getProducts } from "@/lib/api";

// 랜딩 — 옛 정적(index.html) 포팅 완료 순서:
// 히어로 → 마퀴 → 브랜드 → 문제 → 순환ESG → 제품 → 반납방법 → 등급 → 캠페인 → CTA.
export default async function Home() {
  const products = await getProducts();

  return (
    <SiteShell>
      <Hero />
      <MarqueeBar />
      <BrandSection />
      <ProblemSection />
      <SolutionSection />
      <ProductGrid
        products={products}
        eyebrow="Vegan Collection"
        title="대표 제품 라인업"
        ctaHref="/shop"
      />
      <RecycleSection />
      <RewardSection />
      <CampaignSection />
      <FinalCta />
    </SiteShell>
  );
}
