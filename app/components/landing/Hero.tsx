import Link from "next/link";

// Real product cut-outs from the category covers: the hero shows what
// Shoppi is about (things people actually bought) before any copy does.
const SHELF = [
  { src: "/category-covers/face_care.webp", label: "Уход за лицом", href: "/category/face_care", lift: "md:-translate-y-6" },
  { src: "/category-covers/makeup.webp", label: "Макияж", href: "/category/makeup", lift: "md:translate-y-4" },
  { src: "/category-covers/shoes.webp", label: "Обувь", href: "/category/shoes", lift: "md:-translate-y-2" },
  { src: "/category-covers/perfume.webp", label: "Парфюмерия", href: "/category/perfume", lift: "md:translate-y-6" },
  { src: "/category-covers/hair_care.webp", label: "Уход за волосами", href: "/category/hair_care", lift: "md:-translate-y-4" },
];

export function Hero() {
  return (
    <section className="px-6 md:px-10 pt-20 pb-14 md:pt-28 md:pb-20 overflow-hidden">
      <div className="max-w-[720px] mx-auto flex flex-col items-center text-center">
        <span className="text-[11px] uppercase tracking-widest text-stone mb-4">
          Shoppi · рекомендации блогеров
        </span>
        <h1 className="font-display text-[34px] md:text-[52px] leading-[1.05] tracking-tight text-ink">
          Покупайте то, что советуют люди, а не реклама
        </h1>
        <p className="font-body text-stone text-[15px] md:text-base max-w-md mt-4">
          Товары из сторис и постов блогеров на одной странице, с ценой и ссылкой на магазин.
          Подпишитесь на тех, кому доверяете.
        </p>

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
            Создать свою витрину
          </Link>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-14 md:mt-20 grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-5">
        {SHELF.map((item, i) => (
          <Link
            key={item.src}
            href={item.href}
            className={`group flex-col gap-2 transition-transform duration-500 ${item.lift} ${i > 2 ? "hidden md:flex" : "flex"}`}
          >
            <div className="bg-raise h-[200px] md:h-[300px] flex items-center justify-center p-5 md:p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                className="max-h-[150px] md:max-h-[230px] max-w-full object-contain group-hover:scale-[1.04] transition-transform duration-300"
              />
            </div>
            <span className="text-[12px] text-stone group-hover:text-ink transition-colors text-center">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
