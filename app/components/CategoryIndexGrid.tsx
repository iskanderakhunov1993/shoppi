import { CATEGORIES, CATEGORY_LABEL } from "@/lib/categories";
import { listCategoryCovers } from "@/lib/store";

/**
 * The full /categories index, not the landing teaser (ShopByCategory) —
 * same data, different card: a contained product shot on a neutral card
 * instead of a cropped full-bleed photo, closer to a shelf of products
 * than a magazine spread.
 */
export async function CategoryIndexGrid() {
  const covers = await listCategoryCovers();
  const byCategory = new Map(covers.map((c) => [c.category, c]));
  const shown = CATEGORIES.flatMap((slug) => {
    const cover = byCategory.get(slug);
    return cover ? [cover] : [];
  });

  if (shown.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-line border border-line">
      {shown.map(({ category, imageUrl }) => (
        <a
          key={category}
          href={`/category/${category}`}
          className="group bg-paper flex flex-col hover:bg-raise transition-colors"
        >
          <div className="aspect-square bg-raise p-8 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`Товар из категории «${CATEGORY_LABEL[category]}»`}
              loading="lazy"
              decoding="async"
              className="max-w-full max-h-full object-contain group-hover:scale-[1.04] transition-transform duration-300"
            />
          </div>
          <div className="px-5 py-4">
            <span className="font-display italic text-[13px] text-stone block mb-0.5">Смотреть</span>
            <span className="font-display text-xl leading-snug">{CATEGORY_LABEL[category]}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
