const ITEMS = [
  {
    q: "Регистрация платная?",
    a: "Нет. Аккаунт шоппера, куратора или бренда бесплатный.",
  },
  {
    q: "Как считаются клики?",
    a: "Каждая ссылка на витрине обёрнута в shoppi.ru/r/… — переход по ней логируется и сразу ведёт на товар.",
  },
  {
    q: "Нужно ли проходить отбор, чтобы стать куратором?",
    a: "Пока нет — регистрация открыта всем, без заявки и модерации.",
  },
  {
    q: "Что видит бренд?",
    a: "Все ссылки кураторов, ведущие на домен, который бренд указал при регистрации, и число кликов по каждой.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-[1200px] mx-auto">
        <span className="text-[11px] uppercase tracking-widest text-stone">Вопросы</span>
        <h2 className="font-display text-2xl md:text-3xl mt-3 mb-10">Коротко о главном</h2>
        <div className="flex flex-col">
          {ITEMS.map((item) => (
            <div key={item.q} className="py-6 border-t border-line first:border-t-0">
              <h3 className="text-[15px] font-medium mb-2">{item.q}</h3>
              <p className="text-stone text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
