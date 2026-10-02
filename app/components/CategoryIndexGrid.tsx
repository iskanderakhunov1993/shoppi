import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";
import { listCategoryCovers } from "@/lib/store";
import { pluralizeProducts } from "@/lib/plural";

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
  tools: "/category-covers/tools.webp",
  pets: "/category-covers/pets.webp",
  health: "/category-covers/health.webp",
};

export type CategoryGridVariant = 1 | 2 | 3;

/**
 * The full /categories index. Every tile is ONE surface (image and label
 * share a background) instead of a grey photo block stacked on a white
 * strip. Three treatments are live behind ?v=1|2|3 while we pick one.
 */
export async function CategoryIndexGrid({ variant = 1 }: { variant?: CategoryGridVariant }) {
  const covers = await listCategoryCovers();
  const byCategory = new Map(covers.map((c) => [c.category, c]));
  const shown = CATEGORIES.map((category) => ({
    category,
    imageUrl: byCategory.get(category)?.imageUrl ?? STATIC_COVERS[category],
    count: byCategory.get(category)?.count ?? 0,
  }));

  const useFeatured = shown.length >= 5;

  const gridClass =
    variant === 1
      ? "gap-1.5"
      : "gap-px bg-line border border-line";

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-flow-dense auto-rows-[220px] md:auto-rows-[260px] ${gridClass}`}
    >
      {shown.map(({ category, imageUrl, count }, i) => {
        const featured = useFeatured && i === FEATURE_SLOT;
        const label = CATEGORY_LABEL[category];

        const picture = imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Товар из категории «${label}»`}
            loading="lazy"
            decoding="async"
            className="max-w-full max-h-full object-contain group-hover:scale-[1.04] transition-transform duration-300"
          />
        ) : (
          <span
            aria-hidden="true"
            className={`font-display italic text-line leading-none group-hover:text-stone transition-colors ${
              featured ? "text-[11rem] md:text-[13rem]" : "text-[6rem] md:text-[7rem]"
            }`}
          >
            {label[0]}
          </span>
        );

        const span = featured ? "row-span-2" : "";

        if (variant === 2) {
          return (
            <a
              key={category}
              href={`/category/${category}`}
              className={`group bg-paper hover:bg-raise transition-colors flex flex-col ${span}`}
            >
              <div className="flex-1 min-h-0 p-8 flex items-center justify-center">{picture}</div>
              <div className="px-5 pb-4 pt-1 flex items-baseline justify-between gap-3">
                <span className={`font-display leading-snug ${featured ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`}>
                  {label}
                </span>
                <span className="text-[12px] text-stone whitespace-nowrap">
                  {count > 0 ? `${count} ${pluralizeProducts(count)}` : imageUrl ? "Смотреть" : "Скоро"}
                </span>
              </div>
            </a>
          );
        }

        if (variant === 3) {
          return (
            <a
              key={category}
              href={`/category/${category}`}
              className={`group bg-paper hover:bg-raise transition-colors flex flex-col ${span}`}
            >
              <div className="px-5 pt-5">
                <span className={`font-display leading-[1.1] block ${featured ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}`}>
                  {label}
                </span>
                <span className="font-display italic text-[13px] text-stone block mt-1 group-hover:text-ink transition-colors">
                  {imageUrl ? "Смотреть →" : "Скоро"}
                </span>
              </div>
              <div className="flex-1 min-h-0 p-5 flex items-end justify-end">{picture}</div>
            </a>
          );
        }

        return (
          <a
            key={category}
            href={`/category/${category}`}
            className={`group bg-raise flex flex-col items-center text-center ${span}`}
          >
            <div className="flex-1 min-h-0 w-full p-8 pb-3 flex items-center justify-center">{picture}</div>
            <div className="pb-5 px-3">
              <span className="font-display italic text-[13px] text-stone block mb-0.5">
                {imageUrl ? "Смотреть" : "Скоро"}
              </span>
              <span className={`font-display leading-snug ${featured ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`}>
                {label}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
