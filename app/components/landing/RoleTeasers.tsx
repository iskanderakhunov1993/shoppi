import Link from "next/link";
import { BRANDS_ENABLED } from "@/lib/featureFlags";

export function RoleTeasers() {
  return (
    <section id="brands" className="border-b border-line px-6 md:px-10">
      <div className={`max-w-[1200px] mx-auto grid ${BRANDS_ENABLED ? "md:grid-cols-2" : ""}`}>
      <div
        className={`py-16 md:py-20 flex flex-col ${BRANDS_ENABLED ? "md:pr-14 md:border-r border-line" : ""}`}
      >
        <span className="text-[11px] uppercase tracking-widest text-stone mb-3">
          Для кураторов
        </span>
        <h2 className="font-display text-2xl md:text-3xl mb-5 max-w-xs">
          Ведите витрину без чужого алгоритма.
        </h2>
        <ul className="text-stone text-sm leading-relaxed flex flex-col gap-2 mb-8">
          <li>— Своя страница вида shoppi.ru/вы</li>
          <li>— Добавляйте товары в один клик по ссылке</li>
          <li>— Видите клики по каждой вещи в реальном времени</li>
        </ul>
        <Link
          href="/signup"
          className="text-[13px] font-semibold uppercase tracking-wide text-paper bg-ink px-6 py-3.5 hover:opacity-80 transition-opacity w-fit mt-auto"
        >
          Стать куратором
        </Link>
      </div>
      {BRANDS_ENABLED && (
        <div className="py-16 md:py-20 md:pl-14 flex flex-col">
          <span className="text-[11px] uppercase tracking-widest text-stone mb-3">
            Для брендов
          </span>
          <h2 className="font-display text-2xl md:text-3xl mb-5 max-w-xs">
            Смотрите, кто вас продвигает.
          </h2>
          <ul className="text-stone text-sm leading-relaxed flex flex-col gap-2 mb-8">
            <li>— Привяжите домен — увидите все ссылки на него</li>
            <li>— Клики по каждому товару, без ручных таблиц</li>
            <li>— Никаких заявок и модерации на старте</li>
          </ul>
          <Link
            href="/signup"
            className="text-[13px] font-semibold uppercase tracking-wide text-ink border border-ink px-6 py-3.5 hover:bg-ink hover:text-paper transition-colors w-fit mt-auto"
          >
            Подключить бренд
          </Link>
        </div>
      )}
      </div>
    </section>
  );
}
