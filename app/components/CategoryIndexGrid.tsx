import { CATEGORIES, CATEGORY_LABEL } from "@/lib/categories";
import { listCategoryCovers } from "@/lib/store";

// First tile in the grid gets the tall ShopMy-style "feature" slot
// (row-span-2); grid-flow-dense packs the rest around it. Only kicks in
// once there's enough tiles to actually pack around a hole.
const FEATURE_SLOT = 0;

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
    imageUrl: byCategory.get(category)?.imageUrl ?? `https://picsum.photos/seed/shoppi-cat-${category}/600/600`,
  }));

  const useFeatured = shown.length >= 5;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-flow-dense auto-rows-[220px] md:auto-rows-[260px] gap-px bg-line border border-line">
      {shown.map(({ category, imageUrl }, i) => {
        const featured = useFeatured && i === FEATURE_SLOT;
        return (
          <a
            key={category}
            href={`/category/${category}`}
            className={`group bg-paper flex flex-col hover:bg-raise transition-colors ${
              featured ? "row-span-2" : ""
            }`}
          >
            <div className="flex-1 bg-raise p-8 flex items-center justify-center overflow-hidden min-h-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Товар из категории «${CATEGORY_LABEL[category]}»`}
                loading="lazy"
                decoding="async"
                className="max-w-full max-h-full object-contain group-hover:scale-[1.04] transition-transform duration-300"
              />
            </div>
            <div className="px-5 py-4 flex-none">
              <span className="font-display italic text-[13px] text-stone block mb-0.5">Смотреть</span>
              <span className={`font-display leading-snug ${featured ? "text-2xl md:text-3xl" : "text-xl"}`}>
                {CATEGORY_LABEL[category]}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
