const CATEGORIES = [
  { slug: "cosmetics", label: "Косметика", seed: "shoppi-tile-cosmetics" },
  { slug: "mens", label: "Мужские товары", seed: "shoppi-tile-mens" },
  { slug: "clothing", label: "Одежда", seed: "shoppi-tile-clothing" },
] as const;

export function ShopByCategory() {
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-line">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group bg-paper flex flex-col hover:opacity-90 transition-opacity"
            >
              <div className="aspect-[4/3] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/${cat.seed}/500/400`}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <div className="px-4 py-5 text-center">
                <span className="font-display italic text-xs text-stone block mb-0.5">
                  Смотреть
                </span>
                <span className="font-display text-lg">{cat.label}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
