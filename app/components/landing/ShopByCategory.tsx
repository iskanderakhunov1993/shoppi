import Link from "next/link";
import { CATEGORY_LABEL, VISIBLE_CATEGORIES } from "@/lib/categories";
import { listCategoryCovers } from "@/lib/store";
import { STATIC_COVERS } from "@/app/components/CategoryIndexGrid";

// Curated shots first: they are clean cut-outs on the tile colour, while
// live covers are whatever photo the first product happened to have.
const FEATURED = ["face_care", "makeup", "hair_care", "shoes", "perfume", "bags", "household", "electronics"] as const;

export async function ShopByCategory() {
  const covers = await listCategoryCovers();
  const live = new Map(covers.map((c) => [c.category, c.imageUrl]));
  const shown = FEATURED.filter((c) => VISIBLE_CATEGORIES.includes(c))
    .map((category) => ({ category, imageUrl: STATIC_COVERS[category] ?? live.get(category) }))
    .filter((c): c is { category: (typeof FEATURED)[number]; imageUrl: string } => Boolean(c.imageUrl));

  if (shown.length === 0) return null;

  return (
    <section className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <h2 className="font-display text-4xl md:text-5xl">Категории</h2>
          <Link href="/categories" className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors">
            Все категории →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {shown.map(({ category, imageUrl }) => (
            <a key={category} href={`/category/${category}`} className="group bg-raise flex flex-col items-center text-center">
              <div className="h-[170px] md:h-[240px] w-full flex items-center justify-center p-6 md:p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="max-h-[120px] md:max-h-[180px] max-w-full object-contain group-hover:scale-[1.05] transition-transform duration-300"
                />
              </div>
              <span className="font-display text-lg md:text-xl pb-5">{CATEGORY_LABEL[category]}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
