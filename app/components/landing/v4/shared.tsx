import type { ReactNode } from "react";
import type { Link as ShopLink } from "@/lib/store";

const MARKETPLACES: Record<string, string> = {
  wildberries: "Wildberries",
  ozon: "Ozon",
  yandexmarket: "Яндекс Маркет",
  sportmaster: "Спортмастер",
  stockmann: "Стокманн",
  poizon: "Poizon",
};

/** "Wildberries", "Ozon" or the shop's own domain for any other store. */
export function shopLabel(link: Pick<ShopLink, "marketplace" | "targetUrl">): string {
  if (link.marketplace && MARKETPLACES[link.marketplace]) return MARKETPLACES[link.marketplace];
  try {
    return new URL(link.targetUrl).hostname.replace(/^www\./, "");
  } catch {
    return "магазин";
  }
}

export const rub = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

export function Section({ id, title, more, children, className = "" }: {
  id?: string;
  title?: string;
  more?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`px-5 md:px-10 py-20 md:py-28 ${className}`}>
      <div className="max-w-[1180px] mx-auto">
        {title && (
          <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
            <h2 className="font-display text-[30px] md:text-[46px] leading-[1.08] tracking-[-0.04em] max-w-[18ch]">{title}</h2>
            {more && (
              <a href={more.href} className="text-sm font-medium border-b border-current pb-0.5 hover:text-acc transition-colors">
                {more.label}
              </a>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** The signature: a violet line strikes the word through once it's on screen. */
export function Strike({ children }: { children: ReactNode }) {
  return <s className="lv4-strike">{children}</s>;
}

const PLURAL = new Intl.PluralRules("ru");
/** plural(5, ["товар", "товара", "товаров"]) → "5 товаров" */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const f = PLURAL.select(n);
  return `${n} ${f === "one" ? one : f === "few" ? few : many}`;
}
