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
import { BRANDS_ENABLED } from "@/lib/featureFlags";

// Reads mutable in-memory store state (seeded demo creators) on every
// request — must not be statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  await seedDemoAccounts();
  const creators = await listLandingCreators();
  const domains = await listDistinctBrandDomains();

  return (
    <main className="flex-1 flex flex-col">
      {/* The bar is fixed, so it rides over the hero rather than sitting
          above it, and stays put once the page scrolls. */}
      <LandingNav overlay />
      <Hero />
      <HowItWorks />
      <CuratorGrid creators={creators} />
      <ShopByCategory />
      {BRANDS_ENABLED && <ShopByBrand domains={domains} />}
      <RoleTeasers />
      <Faq />
      <LandingFooter />
    </main>
  );
}
