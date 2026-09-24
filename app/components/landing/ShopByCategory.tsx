import { CATEGORIES, CATEGORY_LABEL } from "@/lib/categories";
import { listCategoryCovers } from "@/lib/store";
import { pluralizeProducts } from "@/lib/plural";

export async function ShopByCategory() {
  const covers = await listCategoryCovers();
  const byCategory = new Map(covers.map((c) => [c.category, c]));
  // Catalogue order, not popularity order, so tiles don't reshuffle as
  // click counts move; empty categories are left out entirely.
  const shown = CATEGORIES.flatMap((slug) => {
    const cover = byCategory.get(slug);
    return cover ? [cover] : [];
  });

  if (shown.length === 0) return null;

  return (
    <section className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="font-display italic text-lg text-stone block mb-1">По</span>
            <h2 className="font-display text-4xl md:text-5xl">Категории</h2>
          </div>
          <p className="text-stone text-sm max-w-xs">
            Уверенно выбирайте лучшее в каждой категории.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shown.map(({ category, count, imageUrl }) => (
            <a
              key={category}
              href={`/category/${category}`}
              className="group flex flex-col hover:opacity-90 transition-opacity"
            >
              <div className="aspect-[4/5] overflow-hidden bg-raise">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <div className="pt-3">
                <span className="font-display text-lg leading-snug block">{CATEGORY_LABEL[category]}</span>
                <span className="text-[12px] text-stone">
                  {count} {pluralizeProducts(count)}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
