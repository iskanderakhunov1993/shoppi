import Link from "next/link";

export function FinalCta() {
  return (
    <section className="px-6 md:px-10 py-20 md:py-28 border-b border-line text-center">
      <h2 className="font-display text-3xl md:text-5xl max-w-xl mx-auto leading-tight">
        Найдите блогеров, которым доверяете
      </h2>
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        <Link
          href="/finds"
          className="text-[13px] font-semibold uppercase tracking-wide text-paper bg-ink px-6 py-3.5 hover:opacity-85 transition-opacity"
        >
          Смотреть рекомендации
        </Link>
        <Link
          href="/signup?role=creator"
          className="text-[13px] font-semibold uppercase tracking-wide text-ink border border-line px-6 py-3.5 hover:border-ink transition-colors"
        >
          Создать витрину
        </Link>
      </div>
    </section>
  );
}
