import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { seedDemoAccounts, listLandingCreators } from "@/lib/seed";
import { listDistinctBrandDomains, getSessionUserId, getUserById } from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/auth";
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
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = token ? await getSessionUserId(token) : null;
  if (userId) {
    const user = await getUserById(userId);
    if (user?.role === "shopper") redirect("/finds");
    if (user?.role === "creator") redirect("/dashboard");
  }

  await seedDemoAccounts();
  const creators = await listLandingCreators();
  const domains = BRANDS_ENABLED ? await listDistinctBrandDomains() : [];

  return (
    <main className="flex-1 flex flex-col">
      {/* The bar is fixed, so it rides over the hero rather than sitting
          above it, and stays put once the page scrolls. The hero itself
          is now a plain themed section (no fixed dark backdrop), so the
          nav needs normal theme-aware colors, not the white-on-dark
          overlay treatment. */}
      <LandingNav />
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
