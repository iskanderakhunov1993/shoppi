import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE } from "@/lib/auth";
import { getSessionUserId, getUserById } from "@/lib/store";
import { FUNNEL, funnelCounts, topCreators } from "@/lib/events";

export const dynamic = "force-dynamic";
export const metadata = { title: "Воронка — Shoppi", robots: { index: false } };

// Comma-separated list in the ADMIN_EMAILS env var; unset means nobody.
function isAdmin(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

const PERIODS = [7, 30] as const;

export default async function FunnelPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = token ? await getSessionUserId(token) : null;
  const user = userId ? await getUserById(userId) : undefined;
  // 404 rather than 403: don't advertise that the page exists.
  if (!user || !isAdmin(user.email)) notFound();

  const { days: rawDays } = await searchParams;
  const days = PERIODS.includes(Number(rawDays) as 7 | 30) ? Number(rawDays) : 7;
  const [counts, creators] = await Promise.all([funnelCounts(days), topCreators(days)]);
  const top = counts.storefront_view || 0;
  const digestSent = counts.digest_sent || 0;
  const digestClicks = counts.digest_click || 0;

  return (
    <main className="flex-1 px-8 py-10 max-w-4xl w-full mx-auto flex flex-col gap-10">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-stone">Админка</div>
          <h1 className="font-display text-3xl">Воронка</h1>
        </div>
        <nav className="flex gap-2" aria-label="Период">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin/funnel?days=${p}`}
              aria-current={p === days ? "page" : undefined}
              className={`text-[12px] uppercase tracking-wide px-3 py-2 border transition-colors ${
                p === days ? "border-ink text-ink" : "border-line text-stone hover:border-ink hover:text-ink"
              }`}
            >
              {p} дней
            </Link>
          ))}
        </nav>
      </header>

      <section>
        <h2 className="text-[11px] uppercase tracking-wider text-stone mb-4">Уникальные люди по шагам</h2>
        <ol className="flex flex-col">
          {FUNNEL.map((step) => {
            const n = counts[step.name] || 0;
            const pct = top > 0 ? Math.round((n / top) * 100) : 0;
            return (
              <li key={step.name} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 py-3 border-b border-line">
                <span className="text-[14px]">{step.label}</span>
                <span className="text-[14px] tabular-nums text-right">
                  {n.toLocaleString("ru-RU")}
                  {step.name !== "storefront_view" && top > 0 && <span className="text-stone ml-2">{pct}%</span>}
                </span>
                <div className="col-span-2 h-1.5 bg-raise">
                  <div className="h-full bg-ink" style={{ width: `${top > 0 ? Math.max(pct, n > 0 ? 1 : 0) : 0}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
        <p className="text-stone text-[12px] mt-3">
          Процент считается от тех, кто открыл витрину. Человек — это аккаунт, а без входа — браузер и IP.
        </p>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-wider text-stone mb-4">Еженедельное письмо</h2>
        <p className="text-[14px]">
          Отправлено {digestSent.toLocaleString("ru-RU")}, перешли по товару из письма {digestClicks.toLocaleString("ru-RU")}
          {digestSent > 0 && <span className="text-stone"> ({Math.round((digestClicks / digestSent) * 100)}%)</span>}
        </p>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-wider text-stone mb-4">Креаторы</h2>
        {creators.length === 0 ? (
          <p className="text-stone text-[14px]">За этот период событий нет.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px] tabular-nums">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-stone">
                  <th className="py-2 font-normal">Креатор</th>
                  <th className="py-2 font-normal text-right">Просмотры</th>
                  <th className="py-2 font-normal text-right">Переходы</th>
                  <th className="py-2 font-normal text-right">Сохранения</th>
                  <th className="py-2 font-normal text-right">Подписки</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((c) => (
                  <tr key={c.slug} className="border-t border-line">
                    <td className="py-2.5">
                      <Link href={`/${c.slug}`} className="hover:underline">{c.display_name}</Link>
                    </td>
                    <td className="py-2.5 text-right">{c.views}</td>
                    <td className="py-2.5 text-right">{c.clicks}</td>
                    <td className="py-2.5 text-right">{c.saves}</td>
                    <td className="py-2.5 text-right">{c.follows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
