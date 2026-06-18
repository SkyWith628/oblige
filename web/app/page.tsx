import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import MarqueeBar from "@/components/sections/MarqueeBar";
import PhilosophySection from "@/components/sections/PhilosophySection";
import CycleSection from "@/components/sections/CycleSection";
import ProductGrid from "@/components/sections/ProductGrid";
import StoriesGrid from "@/components/sections/StoriesGrid";
import MembershipTiers from "@/components/sections/MembershipTiers";
import CTASection from "@/components/sections/CTASection";
import { getProducts, getMembershipTiers } from "@/lib/api";
import { heroStats, cycleSteps, stories } from "@/lib/mock";

// 서버 컴포넌트 — 데이터는 api 레이어를 통해 주입(현재는 목업 폴백).
export default async function Home() {
  const [products, tiers] = await Promise.all([
    getProducts(),
    getMembershipTiers(),
  ]);

  return (
    <>
      <Nav />
      <main>
        <Hero stats={heroStats} />
        <MarqueeBar />
        <PhilosophySection />
        <CycleSection steps={cycleSteps} />
        <ProductGrid products={products} />
        <StoriesGrid stories={stories} />
        <MembershipTiers tiers={tiers} />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
