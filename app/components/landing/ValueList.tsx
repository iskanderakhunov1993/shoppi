export function ValueList({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: { title: string; body: string }[];
}) {
  return (
    <section className="px-6 md:px-10 py-16 md:py-24 border-b border-line">
      <div className="max-w-5xl mx-auto">
        <span className="text-[11px] uppercase tracking-widest text-stone">{eyebrow}</span>
        <h2 className="font-display text-2xl md:text-3xl mt-3 mb-12 max-w-lg">{title}</h2>
        <div className="grid md:grid-cols-3 gap-10 md:gap-8">
          {items.map((item, i) => (
            <div key={item.title}>
              <span className="font-display text-3xl text-stone">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[15px] font-medium mt-4 mb-2">{item.title}</h3>
              <p className="text-stone text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
