import Link from "next/link";

export function Hero() {
  return (
    <section className="px-6 md:px-10 pt-20 pb-16 md:pt-28 md:pb-20">
      <div className="max-w-[720px] mx-auto flex flex-col items-center text-center">
        <span className="text-[11px] uppercase tracking-widest text-stone mb-4">
          Кураторы — реальные люди, которые уже купили и советуют
        </span>
        <h1 className="font-display text-[32px] md:text-[44px] leading-[1.1] tracking-tight text-ink">
          Витрины людей, которым ты доверяешь
        </h1>
        <p className="font-body text-stone text-[15px] md:text-base max-w-md mt-4">
          Куратор публикует товар, который правда купил на Wildberries или
          Ozon, — вы переходите к нему напрямую. Косметика, мужские товары,
          инструменты — без бесконечной ленты и алгоритмической накрутки.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link
            href="/signup"
            className="text-[13px] font-semibold uppercase tracking-wide text-paper bg-ink px-6 py-3.5 hover:opacity-85 transition-opacity"
          >
            Я покупатель
          </Link>
          <Link
            href="/signup?role=creator"
            className="text-[13px] font-semibold uppercase tracking-wide text-ink border border-line px-6 py-3.5 hover:border-ink transition-colors"
          >
            Я куратор
          </Link>
        </div>
        <a href="#curators" className="text-stone text-[12.5px] mt-5 underline underline-offset-4 hover:text-ink transition-colors">
          Или просто посмотреть кураторов
        </a>
      </div>
    </section>
  );
}
