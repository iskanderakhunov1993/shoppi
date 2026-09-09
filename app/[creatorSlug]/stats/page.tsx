import { notFound } from "next/navigation";
import { seedDemoAccounts } from "@/lib/seed";
import {
  countClicksForLinks,
  creatorClickStats,
  getCreatorBySlug,
  listLinksByCreator,
} from "@/lib/store";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { placeholderAvatar } from "@/lib/avatar";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

export default async function MediaKitPage({
  params,
}: {
  params: Promise<{ creatorSlug: string }>;
}) {
  const { creatorSlug } = await params;
  seedDemoAccounts();

  const creator = getCreatorBySlug(creatorSlug);
  if (!creator) notFound();

  const stats = creatorClickStats(creator.id);
  const links = listLinksByCreator(creator.id);
  const counts = countClicksForLinks(links.map((l) => l.id));

  const top = links
    .map((l) => ({ ...l, human: counts.get(l.id)?.human ?? 0 }))
    .sort((a, b) => b.human - a.human)
    .slice(0, 8);

  const byCategory = new Map<string, number>();
  for (const l of links) {
    byCategory.set(l.category, (byCategory.get(l.category) ?? 0) + (counts.get(l.id)?.human ?? 0));
  }
  const categoryRows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  const peak = Math.max(1, ...stats.byDay.map((d) => d.human));
  const botShare = stats.total > 0 ? Math.round(((stats.total - stats.human) / stats.total) * 100) : 0;

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />

      <section className="px-6 md:px-10 pt-32 pb-12 border-b border-line">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-5 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creator.avatarUrl || placeholderAvatar(creator.slug)}
              alt={creator.displayName}
              className="w-20 h-20 rounded-full object-cover bg-raise flex-none"
            />
            <div>
              <span className="text-[11px] uppercase tracking-widest text-stone">Медиакит</span>
              <h1 className="font-display text-4xl md:text-5xl mt-1">{creator.displayName}</h1>
            </div>
          </div>
          {creator.bio && <p className="text-stone text-sm max-w-lg">{creator.bio}</p>}
          <a
            href={`/${creator.slug}`}
            className="inline-block mt-4 text-[12px] uppercase tracking-wide border border-line px-4 py-2.5 hover:border-ink transition-colors"
          >
            Открыть витрину
          </a>
        </div>
      </section>

      <section className="px-6 md:px-10 py-12 border-b border-line">
        <div className="max-w-[1200px] mx-auto grid sm:grid-cols-3 gap-8">
          <div>
            <div className="text-[42px] font-display leading-none">{stats.human}</div>
            <div className="text-[11px] uppercase tracking-wider text-stone mt-2">
              живых переходов за 30 дней
            </div>
          </div>
          <div>
            <div className="text-[42px] font-display leading-none text-stone">{stats.total}</div>
            <div className="text-[11px] uppercase tracking-wider text-stone mt-2">
              всего переходов, включая превью
            </div>
          </div>
          <div>
            <div className="text-[42px] font-display leading-none">{links.length}</div>
            <div className="text-[11px] uppercase tracking-wider text-stone mt-2">
              товаров на витрине
            </div>
          </div>
        </div>
        <p className="max-w-[1200px] mx-auto text-stone text-[12.5px] mt-8 leading-relaxed">
          {botShare}% переходов — автоматические запросы мессенджеров и поисковых роботов за
          превью ссылки. Они исключены из «живых»: показывать их как читателей было бы нечестно
          по отношению к рекламодателю.
        </p>
      </section>

      {stats.byDay.length > 0 && (
        <section className="px-6 md:px-10 py-12 border-b border-line">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-[11px] uppercase tracking-wider text-stone mb-6">
              Живые переходы по дням
            </h2>
            <div className="flex items-end gap-[3px] h-40 overflow-x-auto">
              {stats.byDay.map((d) => (
                <div key={d.day} className="flex-1 min-w-[6px] flex flex-col justify-end h-full group relative">
                  <div
                    className="bg-ink w-full transition-opacity group-hover:opacity-60"
                    style={{ height: `${Math.max(2, (d.human / peak) * 100)}%` }}
                  />
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-stone opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {d.day.slice(5)} · {d.human}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-stone mt-3">
              <span>{stats.byDay[0]?.day}</span>
              <span>пик за день: {peak}</span>
              <span>{stats.byDay[stats.byDay.length - 1]?.day}</span>
            </div>
          </div>
        </section>
      )}

      <section className="px-6 md:px-10 py-12">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-[11px] uppercase tracking-wider text-stone mb-5">
              Что кликают чаще всего
            </h2>
            {top.length === 0 ? (
              <p className="font-display italic text-stone">Пока нет данных.</p>
            ) : (
              <ul className="flex flex-col">
                {top.map((l) => (
                  <li
                    key={l.id}
                    className="flex justify-between items-baseline gap-4 py-3 border-b border-line last:border-b-0"
                  >
                    <span className="text-[13.5px]">{l.title}</span>
                    <span className="text-[15px] font-medium tabular-nums">{l.human}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-[11px] uppercase tracking-wider text-stone mb-5">По категориям</h2>
            <ul className="flex flex-col">
              {categoryRows.map(([cat, count]) => (
                <li
                  key={cat}
                  className="flex justify-between items-baseline gap-4 py-3 border-b border-line last:border-b-0"
                >
                  <span className="text-[13.5px]">{CATEGORY_LABEL[cat] ?? cat}</span>
                  <span className="text-[15px] font-medium tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
