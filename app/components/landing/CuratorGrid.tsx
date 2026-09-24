import type { Creator } from "@/lib/store";
import { CreatorMosaic } from "@/app/components/CreatorMosaic";

export function CuratorGrid({ creators }: { creators: Creator[] }) {
  return (
    <section id="curators" className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-stone">
              По креатору
            </span>
            <h2 className="font-display text-4xl md:text-5xl mt-2">Креаторы</h2>
          </div>
          <p className="text-stone text-sm max-w-xs">
            Люди, чьему вкусу вы доверяете больше, чем ленте алгоритма.
          </p>
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
