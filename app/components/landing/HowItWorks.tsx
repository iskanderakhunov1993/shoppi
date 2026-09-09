const STEPS = [
  {
    n: "01",
    title: "Куратор публикует находку",
    body: "Добавляет товар, который правда купил и советует — с категорией и своей ссылкой.",
  },
  {
    n: "02",
    title: "Вы переходите за покупкой",
    body: "Каждая ссылка на витрине ведёт напрямую к товару — без лишних шагов и рекламы.",
  },
  {
    n: "03",
    title: "Видно, что сработало",
    body: "Клики считаются автоматически — куратор и бренд видят, что реально интересно.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-5xl mx-auto">
        <span className="text-[11px] uppercase tracking-widest text-stone">
          Как это устроено
        </span>
        <h2 className="font-display text-2xl md:text-3xl mt-3 mb-12 max-w-lg">
          Три шага от находки куратора до вашей покупки.
        </h2>
        <div className="grid md:grid-cols-3 gap-10 md:gap-8">
          {STEPS.map((step) => (
            <div key={step.n}>
              <span className="font-display text-3xl text-stone">{step.n}</span>
              <h3 className="text-[15px] font-medium mt-4 mb-2">{step.title}</h3>
              <p className="text-stone text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
