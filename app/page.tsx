import { seedDemoAccounts, listLandingCreators } from "@/lib/seed";
import { listDistinctBrandDomains } from "@/lib/store";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { Hero } from "@/app/components/landing/Hero";
import { HowItWorks } from "@/app/components/landing/HowItWorks";
import { CuratorGrid } from "@/app/components/landing/CuratorGrid";
import { ShopByCategory } from "@/app/components/landing/ShopByCategory";
import { ShopByBrand } from "@/app/components/landing/ShopByBrand";
import { RoleTeasers } from "@/app/components/landing/RoleTeasers";
import { Faq } from "@/app/components/landing/Faq";
import { LandingFooter } from "@/app/components/landing/LandingFooter";

// Reads mutable in-memory store state (seeded demo creators) on every
// request — must not be statically prerendered at build time.
export const dynamic = "force-dynamic";

export default function Home() {
  seedDemoAccounts();
  const creators = listLandingCreators();
  const domains = listDistinctBrandDomains();

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <CuratorGrid creators={creators} />
      <ShopByCategory />
      <ShopByBrand domains={domains} />
      <RoleTeasers />
      <Faq />
      <LandingFooter />
    </main>
  );
}
