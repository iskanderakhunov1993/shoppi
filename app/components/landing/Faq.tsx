import { BRANDS_ENABLED } from "@/lib/featureFlags";

const ALL_ITEMS = [
  {
    q: "Регистрация платная?",
    a: BRANDS_ENABLED
      ? "Нет. Аккаунт покупателя, креатора или бренда бесплатный."
      : "Нет. Аккаунт покупателя и креатора бесплатный.",
  },
  {
    q: "Где я покупаю товар?",
    a: "На Wildberries или Ozon: ссылка ведёт прямо на страницу товара.",
  },
  {
    q: "Как стать креатором?",
    a: "Зарегистрироваться и добавить первую ссылку. Без заявок и отбора.",
  },
  {
    brandOnly: true,
    q: "Что видит бренд?",
    a: "Все ссылки креаторов, ведущие на домен, который бренд указал при регистрации, и число кликов по каждой.",
  },
];

const ITEMS = ALL_ITEMS.filter((item) => BRANDS_ENABLED || !("brandOnly" in item));

export function Faq() {
  return (
    <section id="faq" className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="font-display text-2xl md:text-3xl mb-10">Вопросы</h2>
        <div className="grid md:grid-cols-2 md:gap-x-14">
          {ITEMS.map((item, i) => (
            <div
              key={item.q}
              className={`py-6 max-w-[46ch] border-line ${i > 0 ? "border-t" : ""} ${
                i >= 2 ? "md:border-t" : "md:border-t-0"
              }`}
            >
              <h3 className="text-[15px] font-medium mb-2">{item.q}</h3>
              <p className="text-stone text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
