import Link from "next/link";

export function Hero() {
  return (
    <section className="relative">
      <div className="relative h-[560px] md:h-[640px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://picsum.photos/seed/shoppi-hero/1600/1000"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Fixed dark scrim for legibility — intentionally not the
            theme-relative ink/paper tokens, which flip meaning in dark
            mode; this overlay must stay dark regardless of site theme. */}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-black/30" />
        <div className="relative h-full flex flex-col justify-end px-6 md:px-10 pb-14 md:pb-20">
          <div className="max-w-[1200px] mx-auto w-full">
          <span className="text-[11px] uppercase tracking-widest text-white/70 mb-4">
            Shoppi
          </span>
          <h1 className="font-display text-white text-4xl md:text-6xl leading-[1.08] mb-5 max-w-2xl">
            Покупай у своих людей, не у алгоритма.
          </h1>
          <p className="text-white/80 text-[15px] md:text-base max-w-md mb-8">
            Косметика, мужские товары, одежда — витрины людей, которым ты
            доверяешь, а не бесконечная лента.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#curators"
              className="text-[13px] font-semibold uppercase tracking-wide text-black bg-white px-6 py-3.5 hover:opacity-85 transition-opacity"
            >
              Смотреть кураторов
            </a>
            <Link
              href="/signup"
              className="text-[13px] font-semibold uppercase tracking-wide text-white border border-white/60 px-6 py-3.5 hover:border-white transition-colors"
            >
              Стать куратором
            </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
