import Link from "next/link";
import { getDemoCreatorSlug } from "@/lib/seed";

type Column = { title: string; links: { label: string; href: string }[] };

/**
 * Deliberately dark in both themes, the way the reference site does it:
 * the footer is the page's full stop, and one solid dark block reads as
 * intentional rather than as the page simply running out of content.
 */
export async function LandingFooter() {
  const slug = getDemoCreatorSlug();
  const example = slug ? `/${slug}` : "/curators";
  const exampleStats = slug ? `/${slug}/stats` : "/curators";

  const columns: Column[] = [
    {
      title: "Кураторам",
      links: [
        { label: "Обзор", href: "/creators" },
        { label: "Пример витрины", href: example },
        { label: "Пример медиакита", href: exampleStats },
        { label: "Стать куратором", href: "/signup" },
        { label: "Войти в кабинет", href: "/login" },
      ],
    },
    {
      title: "Брендам",
      links: [
        { label: "Обзор", href: "/brands" },
        { label: "Подключить домен", href: "/signup" },
        { label: "Войти в аналитику", href: "/login" },
      ],
    },
    {
      title: "Покупателям",
      links: [
        { label: "Все кураторы", href: "/curators" },
        { label: "Косметика", href: "/category/cosmetics" },
        { label: "Мужские товары", href: "/category/mens" },
        { label: "Одежда", href: "/category/clothing" },
        { label: "Мой вкус", href: "/dashboard" },
      ],
    },
    {
      title: "Разделы",
      links: [
        { label: "Как это устроено", href: "/#how" },
        { label: "По магазину", href: "/#brands-catalog" },
        { label: "Вопросы", href: "/#faq" },
      ],
    },
  ];

  return (
    <footer className="bg-[#0d0d0c] text-white px-6 md:px-10 pt-20 pb-14">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-6">
                {column.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14.5px] text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <Link href="/" className="font-display text-2xl">
            Shoppi
          </Link>
          <p className="text-[13px] text-white/55 mt-3">
            © 2026 Shoppi &nbsp;|&nbsp; Покупай у своих людей, не у алгоритма.
          </p>
        </div>
      </div>
    </footer>
  );
}
