import type { Creator } from "@/lib/store";

const SEEDS: Record<string, string> = {
  Белла: "shoppi-bella",
  Максим: "shoppi-maxim",
  Соня: "shoppi-sonya",
};

export function CuratorGrid({ creators }: { creators: Creator[] }) {
  return (
    <section id="curators" className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-stone">
              По куратору
            </span>
            <h2 className="font-display text-4xl md:text-5xl mt-2">Куратор</h2>
          </div>
          <p className="text-stone text-sm max-w-xs">
            Инсайдерский доступ к любимым и проверенным находкам ваших любимых
            тейстмейкеров.
          </p>
        </div>

        {creators.length === 0 ? (
          <p className="font-display italic text-stone">Пока нет опубликованных витрин.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-px bg-line">
            {creators.map((creator) => (
              <a
                key={creator.id}
                href={`/${creator.slug}`}
                className="group bg-paper flex flex-col hover:opacity-90 transition-opacity"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://picsum.photos/seed/${SEEDS[creator.displayName] ?? creator.slug}/500/620`}
                    alt={creator.displayName}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="font-display text-lg mb-1">{creator.displayName}</div>
                  {creator.bio && (
                    <p className="font-display italic text-[13.5px] text-stone leading-snug">
                      {creator.bio}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
