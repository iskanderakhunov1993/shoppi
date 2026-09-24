import type { ReactNode } from "react";
import type { Creator } from "@/lib/store";
import { placeholderAvatar } from "@/lib/avatar";

// Positions (within each run of 10) that get a 2×2 tile: one leading the
// run on the left, one later in it that dense packing lands on the right.
const FEATURED_SLOTS = new Set([0, 7]);

/**
 * Editorial mosaic of creator portraits with the name set over the photo,
 * mixing 2×2 feature tiles with single ones. Feature tiles only kick in
 * once there are enough creators to pack around them — with a handful,
 * a 2×2 tile would just leave holes in the grid.
 */
export function CreatorMosaic({
  creators,
  actions,
}: {
  creators: Creator[];
  actions?: (creator: Creator) => ReactNode;
}) {
  const useFeatured = creators.length >= 5;
  const cols =
    creators.length === 1
      ? "grid-cols-1 max-w-sm mx-auto"
      : creators.length === 2
        ? "grid-cols-2 max-w-2xl mx-auto"
        : creators.length === 3
          ? "grid-cols-2 md:grid-cols-3"
          : "grid-cols-2 md:grid-cols-4";

  return (
    <div className={`grid ${cols} grid-flow-dense auto-rows-[220px] md:auto-rows-[260px] gap-1.5`}>
      {creators.map((creator, i) => {
        const featured = useFeatured && FEATURED_SLOTS.has(i % 10);
        return (
          <div
            key={creator.id}
            className={`group relative overflow-hidden bg-raise ${featured ? "col-span-2 row-span-2" : ""}`}
          >
            <a href={`/${creator.slug}`} className="absolute inset-0" aria-label={creator.displayName}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creator.avatarUrl || placeholderAvatar(creator.slug)}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div
                className={`absolute inset-x-0 bottom-0 p-4 md:p-5 text-white ${
                  featured ? "md:p-8" : "text-right"
                }`}
              >
                <span className={`font-display italic block ${featured ? "text-base md:text-xl" : "text-[11px]"}`}>
                  Креатор
                </span>
                <span
                  className={`font-display block leading-[1.05] [overflow-wrap:anywhere] ${
                    featured ? "text-3xl md:text-5xl" : "text-lg md:text-xl"
                  }`}
                >
                  {creator.displayName}
                </span>
              </div>
            </a>
            {actions && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-paper/90 rounded-full p-1">
                {actions(creator)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
