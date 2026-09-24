import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { ShopByCategory } from "@/app/components/landing/ShopByCategory";

export const metadata = { title: "Все категории — Shoppi" };

// Tiles are built from live products (covers, counts), so this can't be
// prerendered at build time.
export const dynamic = "force-dynamic";

export default function CategoriesPage() {
  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />
      <div className="pt-20 md:pt-24 flex-1">
        <ShopByCategory />
      </div>
      <LandingFooter />
    </main>
  );
}
