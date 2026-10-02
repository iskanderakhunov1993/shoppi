import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";
import { listCategoryCovers } from "@/lib/store";

// Bento rhythm like ShopMy: a tall tile first, one big 2x2 in the middle,
// another tall one near the end. With 19 categories on 4 columns that is
// exactly 24 cells (6 full rows), so grid-flow-dense leaves no holes.
const BENTO: Record<number, { span: string; size: "tall" | "big" }> = {
  0: { span: "row-span-2", size: "tall" },
  7: { span: "col-span-2 row-span-2", size: "big" },
  14: { span: "row-span-2", size: "tall" },
};

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

/**
 * The full /categories index. Each tile is one surface (image and label
 * share a background); a few are larger for a bento rhythm.
 */
export async function CategoryIndexGrid() {
  const covers = await listCategoryCovers();
  const byCategory = new Map(covers.map((c) => [c.category, c]));
  const shown = CATEGORIES.map((category) => ({
    category,
    imageUrl: byCategory.get(category)?.imageUrl ?? STATIC_COVERS[category],
  }));

  const useBento = shown.length === 19;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-flow-dense auto-rows-[200px] md:auto-rows-[250px] gap-1.5">
      {shown.map(({ category, imageUrl }, i) => {
        const bento = useBento ? BENTO[i] : undefined;
        const label = CATEGORY_LABEL[category];
        const big = bento?.size === "big";
        const tall = bento?.size === "tall";

        return (
          <a
            key={category}
            href={`/category/${category}`}
            className={`group bg-raise flex flex-col items-center text-center ${bento?.span ?? ""}`}
          >
            <div className={`flex-1 min-h-0 w-full flex items-center justify-center pb-3 ${big ? "p-12" : "p-8"}`}>
              {imageUrl ? (
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
                    big ? "text-[14rem]" : tall ? "text-[11rem]" : "text-[6rem] md:text-[7rem]"
                  }`}
                >
                  {label[0]}
                </span>
              )}
            </div>
            <div className="pb-5 px-3">
              <span className="font-display italic text-[13px] text-stone block mb-0.5">
                {imageUrl ? "Смотреть" : "Скоро"}
              </span>
              <span
                className={`font-display leading-snug ${
                  big ? "text-3xl md:text-4xl" : tall ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
                }`}
              >
                {label}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
