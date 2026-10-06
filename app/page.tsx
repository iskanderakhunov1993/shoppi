import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Onest, Unbounded } from "next/font/google";
import { seedDemoAccounts, listLandingCreators } from "@/lib/seed";
import { getCreatorByUserId, getSessionUserId, getUserById } from "@/lib/store";
import { homePathFor } from "@/lib/landing";
import { SESSION_COOKIE } from "@/lib/auth";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { Reveal } from "@/app/components/Reveal";
import { HeroV4 } from "@/app/components/landing/v4/Hero";
import {
  BloggersV4,
  CategoriesV4,
  FaqV4,
  FinalV4,
  ForBloggersV4,
  HowItWorksV4,
  LiveRecommendationsV4,
} from "@/app/components/landing/v4/Sections";

// The landing's own type pair; everything else in the product keeps
// Playfair + Inter (see .lv4 in globals.css).
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin", "cyrillic"], weight: ["400", "500"] });
const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

// Reads live creators and links on every request — must not be
// statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = token ? await getSessionUserId(token) : null;
  if (userId) {
    const user = await getUserById(userId);
    if (user?.role === "shopper") redirect("/finds");
    if (user?.role === "creator") {
      redirect(homePathFor(user, await getCreatorByUserId(userId)));
    }
  }

  await seedDemoAccounts();
  const creators = await listLandingCreators();

  return (
    <main className={`lv4 ${unbounded.variable} ${onest.variable} flex-1 flex flex-col`}>
      <LandingNav />
      <HeroV4 creators={creators} />
      <Reveal><LiveRecommendationsV4 /></Reveal>
      <Reveal><HowItWorksV4 /></Reveal>
      <Reveal><BloggersV4 creators={creators} /></Reveal>
      <Reveal><CategoriesV4 /></Reveal>
      <Reveal><ForBloggersV4 /></Reveal>
      <Reveal><FaqV4 /></Reveal>
      <FinalV4 />
      <LandingFooter />
    </main>
  );
}
