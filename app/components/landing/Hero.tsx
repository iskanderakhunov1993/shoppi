import Link from "next/link";

type ReceiptItem = {
  title: string;
  price: number;
  curator: string;
};

// Real seed data (lib/seed.ts) — not lorem ipsum. If the seed prices
// ever change, update these three lines alongside them.
const ITEMS: ReceiptItem[] = [
  { title: "Сыворотка с витамином C", price: 2490, curator: "Белла" },
  { title: "Крем для рук, без отдушки", price: 690, curator: "Белла" },
  { title: "Складной нож для кемпинга", price: 4200, curator: "Максим" },
];

function formatPrice(n: number): string {
  return n.toLocaleString("ru-RU");
}

function formatNow(): string {
  const now = new Date();
  const date = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

export function Hero() {
  const total = ITEMS.reduce((sum, item) => sum + item.price, 0);

  return (
    <section
      className="relative px-6 md:px-10 pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden"
      style={{ background: "#141210" }}
    >
      {/* A quiet radial glow behind the receipt — the paper itself is
          the imagery here, not a stock photo. */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, color-mix(in srgb, var(--signal) 18%, transparent), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1200px] mx-auto flex flex-col items-center">
        <div className="receipt-print w-full max-w-[420px]">
          <div className="receipt-zigzag receipt-zigzag-top" aria-hidden="true" />
          <div
            className="px-7 pt-8 pb-6 font-mono"
            style={{ background: "var(--receipt-paper)", color: "var(--receipt-ink)" }}
          >
            <div className="text-center mb-5">
              <div className="font-display text-2xl tracking-tight mb-1">Shoppi</div>
              <div className="text-[11px] opacity-60">ЧЕК № 000142</div>
              <div className="text-[11px] opacity-60">{formatNow()}</div>
            </div>

            <div
              className="pt-4 flex flex-col gap-3"
              style={{ borderTop: "1px dashed var(--receipt-line)" }}
            >
              {ITEMS.map((item) => (
                <div key={item.title} className="flex items-start justify-between gap-3 text-[13px]">
                  <span className="leading-snug">
                    <span className="opacity-60 mr-1.5">1×</span>
                    {item.title}
                  </span>
                  <span className="flex-none tabular-nums text-right">
                    {formatPrice(item.price)} ₽
                    <span className="block text-[10.5px] opacity-60 font-normal">{item.curator}</span>
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-4 pt-4 flex items-baseline justify-between text-[14px] font-medium"
              style={{ borderTop: "1px dashed var(--receipt-line)" }}
            >
              <span>ИТОГО</span>
              <span className="tabular-nums">{formatPrice(total)} ₽</span>
            </div>

            <div className="flex justify-center my-5">
              <div className="signal-stamp">0% АЛГОРИТМА</div>
            </div>

            <p
              className="text-center text-[12px] leading-relaxed opacity-70 pt-4"
              style={{ borderTop: "1px dashed var(--receipt-line)" }}
            >
              Спасибо, что выбираете людей,
              <br />а не алгоритм.
            </p>

            <div className="barcode mt-5" aria-hidden="true" />
            <div className="text-center text-[9.5px] tracking-[0.3em] opacity-60 mt-1.5">
              SHOPPI · RU
            </div>
          </div>
          <div className="receipt-zigzag receipt-zigzag-bottom" aria-hidden="true" />
        </div>

        <p className="font-body text-white/70 text-[15px] md:text-base max-w-md text-center mt-10 mb-8">
          Косметика, мужские товары, инструменты — витрины людей, которым ты
          доверяешь, а не бесконечная лента.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
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
    </section>
  );
}
