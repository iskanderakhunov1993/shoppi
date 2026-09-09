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
      {/* The nav sits on top of the hero photo, as on the reference site,
          so it needs the hero's own dark scrim behind it rather than a
          separate bar above it. */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0">
          <LandingNav overlay />
        </div>
        <Hero />
      </div>
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
