import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";
import { listCategoryCovers } from "@/lib/store";

// First tile in the grid gets the tall ShopMy-style "feature" slot
// (row-span-2); grid-flow-dense packs the rest around it. Only kicks in
// once there's enough tiles to actually pack around a hole.
const FEATURE_SLOT = 0;

// Curated covers for categories that don't have a live product cover
// yet — used only as a fallback; once a real product exists in the
// category its actual cover wins. A nicer stand-in than the
// typographic plate, but still not pretending to be live content.
const STATIC_COVERS: Partial<Record<Category, string>> = {
  shoes: "/category-covers/shoes.webp",
  perfume: "/category-covers/perfume.webp",
  makeup: "/category-covers/makeup.webp",
  bags: "/category-covers/bags.webp",
  accessories: "/category-covers/accessories.webp",
  electronics: "/category-covers/electronics.webp",
  books_stationery: "/category-covers/books_stationery.webp",
  clothing: "/category-covers/clothing.webp",
  kitchen: "/category-covers/kitchen.webp",
};

/**
 * The full /categories index, not the landing teaser (ShopByCategory) —
 * every category we have, not just ones with a real product cover yet:
 * a category without live products falls back to a placeholder shot so
 * the catalogue always shows the complete list, not a shrinking subset.
 */
export async function CategoryIndexGrid() {
  const covers = await listCategoryCovers();
  const byCategory = new Map(covers.map((c) => [c.category, c]));
  const shown = CATEGORIES.map((category) => ({
    category,
    imageUrl: byCategory.get(category)?.imageUrl ?? STATIC_COVERS[category],
  }));

  const useFeatured = shown.length >= 5;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-flow-dense auto-rows-[220px] md:auto-rows-[260px] gap-px bg-line border border-line">
      {shown.map(({ category, imageUrl }, i) => {
        const featured = useFeatured && i === FEATURE_SLOT;
        const label = CATEGORY_LABEL[category];
        return (
          <a
            key={category}
            href={`/category/${category}`}
            className={`group bg-paper flex flex-col hover:bg-raise transition-colors ${
              featured ? "row-span-2" : ""
            }`}
          >
            <div className="flex-1 bg-raise overflow-hidden min-h-0 relative">
              {imageUrl ? (
                <div className="w-full h-full p-8 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={`Товар из категории «${label}»`}
                    loading="lazy"
                    decoding="async"
                    className="max-w-full max-h-full object-contain group-hover:scale-[1.04] transition-transform duration-300"
                  />
                </div>
              ) : (
                // No live product yet for this category — a quiet
                // typographic mark instead of a stock photo pretending
                // to be one. The initial sits in the same display face
                // as the category name below it, just large and faint,
                // like an embossed plate rather than a placeholder.
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <span
                    className={`font-display italic text-line leading-none group-hover:text-stone transition-colors ${
                      featured ? "text-[11rem] md:text-[13rem]" : "text-[6rem] md:text-[7rem]"
                    }`}
                  >
                    {label[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="px-5 py-4 flex-none">
              <span className="font-display italic text-[13px] text-stone block mb-0.5">
                {imageUrl ? "Смотреть" : "Скоро"}
              </span>
              <span className={`font-display leading-snug ${featured ? "text-2xl md:text-3xl" : "text-xl"}`}>
                {label}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
