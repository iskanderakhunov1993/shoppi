import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { CategoryIndexGrid } from "@/app/components/CategoryIndexGrid";

export const metadata = { title: "Все категории — Shoppi" };

// Tiles are built from live products (covers, counts), so this can't be
// prerendered at build time.
export const dynamic = "force-dynamic";

export default function CategoriesPage() {
  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />
      <section className="px-6 md:px-10 pt-28 md:pt-32 pb-10 md:pb-12">
        <div className="max-w-[1200px] mx-auto flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="font-display italic text-lg text-stone block mb-1">По</span>
            <h1 className="font-display text-4xl md:text-5xl">Категории</h1>
          </div>
          <p className="text-stone text-sm max-w-xs">Уверенно выбирайте лучшее в каждой категории.</p>
        </div>
      </section>
      <div className="px-6 md:px-10 pb-16 md:pb-24 flex-1">
        <div className="max-w-[1200px] mx-auto">
          <CategoryIndexGrid />
        </div>
      </div>
      <LandingFooter />
    </main>
  );
}
