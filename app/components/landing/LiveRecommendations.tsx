import Link from "next/link";
import { listRecentLinks } from "@/lib/store";
import { AdLabel } from "@/app/components/AdLabel";

const MIN_TO_SHOW = 4;

/** The newest real recommendations: the proof that Shoppi is alive. */
export async function LiveRecommendations() {
  const links = (await listRecentLinks({ limit: 12 })).filter((l) => l.imageUrl).slice(0, 8);
  // A half-empty shelf reads as a dead product; better to skip the block.
  if (links.length < MIN_TO_SHOW) return null;

  return (
    <section className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <h2 className="font-display text-4xl md:text-5xl">Сейчас советуют</h2>
          <Link href="/finds" className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors">
            Все рекомендации →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {links.map((link) => (
            <a key={link.id} href={`/r/${link.id}`} className="group flex flex-col">
              <div className="bg-raise h-[200px] md:h-[260px] flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={link.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <span className="text-[13.5px] font-medium leading-snug mt-3 line-clamp-2">{link.title}</span>
              <AdLabel isAd={link.isAd} adInfo={link.adInfo} />
              <span className="text-[12px] text-stone mt-1">
                {link.price ? `${link.price.toLocaleString("ru-RU")} ₽ · ` : ""}советует {link.creatorName}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
