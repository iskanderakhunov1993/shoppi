import type { Creator } from "@/lib/store";
import { CreatorMosaic } from "@/app/components/CreatorMosaic";

export function CuratorGrid({ creators }: { creators: Creator[] }) {
  return (
    <section id="curators" className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">Креаторы</h2>
          </div>
          <a href="/curators" className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors">
            Все креаторы →
          </a>
        </div>

        {creators.length === 0 ? (
          <p className="font-display italic text-stone">Пока нет опубликованных витрин.</p>
        ) : (
          <CreatorMosaic creators={creators} />
        )}
      </div>
    </section>
  );
}
