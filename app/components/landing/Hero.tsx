import Link from "next/link";

// Real product cut-outs from the category covers: the hero shows what
// Shoppi is about (things people actually bought) before any copy does.
const SHELF = [
  { src: "/category-covers/face_care.webp", alt: "Сыворотка для лица", lift: "md:-translate-y-6" },
  { src: "/category-covers/makeup.webp", alt: "Тушь для ресниц", lift: "md:translate-y-4" },
  { src: "/category-covers/shoes.webp", alt: "Кроссовки", lift: "md:-translate-y-2" },
  { src: "/category-covers/perfume.webp", alt: "Парфюм", lift: "md:translate-y-6" },
  { src: "/category-covers/hair_care.webp", alt: "Шампунь", lift: "md:-translate-y-4" },
];

export function Hero() {
  return (
    <section className="px-6 md:px-10 pt-20 pb-14 md:pt-28 md:pb-20 overflow-hidden">
      <div className="max-w-[720px] mx-auto flex flex-col items-center text-center">
        <h1 className="font-display text-[34px] md:text-[52px] leading-[1.05] tracking-tight text-ink">
          Витрины людей, которым ты доверяешь
        </h1>
        <p className="font-body text-stone text-[15px] md:text-base max-w-sm mt-4">
          Находки креаторов с Wildberries и Ozon — то, что они купили сами.
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
            Я креатор
          </Link>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-14 md:mt-20 grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-5" aria-hidden="true">
        {SHELF.map((item, i) => (
          <div
            key={item.src}
            className={`bg-raise h-[200px] md:h-[300px] flex items-center justify-center p-5 md:p-8 transition-transform duration-500 ${item.lift} ${
              i > 2 ? "hidden md:flex" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.alt} className="max-h-[150px] md:max-h-[230px] max-w-full object-contain" />
          </div>
        ))}
      </div>
    </section>
  );
}
