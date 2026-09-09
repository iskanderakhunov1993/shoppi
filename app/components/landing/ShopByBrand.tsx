import Link from "next/link";

export function ShopByBrand({
  domains,
}: {
  domains: { domain: string; linkCount: number }[];
}) {
  if (domains.length === 0) return null;

  return (
    <section id="brands-catalog" className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="font-display italic text-lg text-stone block mb-1">По</span>
            <h2 className="font-display text-4xl md:text-5xl">Магазину</h2>
          </div>
          <p className="text-stone text-sm max-w-xs">
            Сайты, куда чаще всего ведут ссылки кураторов — не партнёрства, а
            то, где они реально покупают.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line">
          {domains.map((d) => (
            <div
              key={d.domain}
              className="relative aspect-square overflow-hidden flex items-end"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/shoppi-brand-${d.domain}/500/500`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
              <div className="relative p-4">
                <div className="text-white font-medium text-sm">{d.domain}</div>
                <div className="text-white/70 text-[11px]">
                  {d.linkCount} {d.linkCount === 1 ? "ссылка" : "ссылки"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/brands"
          className="inline-block mt-8 text-[13px] font-semibold uppercase tracking-wide text-paper bg-ink px-6 py-3.5 hover:opacity-80 transition-opacity"
        >
          Подключить свой домен
        </Link>
      </div>
    </section>
  );
}
