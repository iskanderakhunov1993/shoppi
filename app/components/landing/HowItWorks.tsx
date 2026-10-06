const STEPS = [
  {
    n: "01",
    title: "Блогер добавляет товар",
    body: "То, чем пользуется сам, со ссылкой на магазин.",
  },
  {
    n: "02",
    title: "Вы подписываетесь",
    body: "Рекомендации ваших блогеров собираются в одной ленте.",
  },
  {
    n: "03",
    title: "Покупаете в магазине",
    body: "Ссылка ведёт прямо на товар, без наценки.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="font-display text-2xl md:text-3xl mb-12 max-w-lg">
          Как это работает
        </h2>
        <div className="grid md:grid-cols-3 gap-10 md:gap-0">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={
                i > 0 ? "md:pl-8 md:border-l md:border-dashed md:border-line" : "md:pr-8"
              }
            >
              <span className="font-mono text-3xl text-stone">{step.n}</span>
              <h3 className="text-[15px] font-medium mt-4 mb-2">{step.title}</h3>
              <p className="text-stone text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
