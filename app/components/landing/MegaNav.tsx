"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/app/components/ThemeToggle";

type Item = { label: string; href: string; description: string };
type Menu = { key: string; label: string; align: "left" | "center" | "right"; items: Item[] };

function buildMenus(demoSlug?: string): Menu[] {
  const example = demoSlug ? `/${demoSlug}` : "/curators";
  const exampleStats = demoSlug ? `/${demoSlug}/stats` : "/curators";

  return [
    {
      key: "shoppers",
      label: "Покупателям",
      align: "left",
      items: [
        {
          label: "По куратору",
          href: "/curators",
          description: "Витрины людей, чьему вкусу вы доверяете, а не лента алгоритма.",
        },
        {
          label: "По магазину",
          href: "/#brands-catalog",
          description: "Сайты, куда чаще всего ведут ссылки кураторов.",
        },
        {
          label: "Мой вкус",
          href: "/dashboard",
          description: "Товары, которые вы сохранили, чтобы вернуться к ним позже.",
        },
        {
          label: "Косметика",
          href: "/category/cosmetics",
          description: "Уход и декоративная косметика от всех кураторов сразу.",
        },
        {
          label: "Мужские товары",
          href: "/category/mens",
          description: "Снаряжение и уход — проверенное, а не рекламное.",
        },
        {
          label: "Одежда",
          href: "/category/clothing",
          description: "Вещи, которые кураторы носят сезон за сезоном.",
        },
        {
          label: "Инструменты",
          href: "/category/tools",
          description: "То, что реально стоит в мастерской, а не пылится в коробке.",
        },
      ],
    },
    {
      key: "creators",
      label: "Кураторам",
      align: "center",
      items: [
        {
          label: "Обзор",
          href: "/creators",
          description: "Зачем вести витрину и что она даёт вам и вашей аудитории.",
        },
        {
          label: "Как это устроено",
          href: "/#how",
          description: "Три шага от вашей находки до перехода подписчика.",
        },
        {
          label: "Пример витрины",
          href: example,
          description: "Живая страница куратора — ровно то, что получите вы.",
        },
        {
          label: "Пример медиакита",
          href: exampleStats,
          description: "Страница со статистикой, которую можно показать рекламодателю.",
        },
        {
          label: "Стать куратором",
          href: "/signup",
          description: "Регистрация открыта всем — без заявки и модерации.",
        },
      ],
    },
    {
      key: "brands",
      label: "Брендам",
      align: "right",
      items: [
        {
          label: "Обзор",
          href: "/brands",
          description: "Кто из кураторов уже ссылается на ваши товары.",
        },
        {
          label: "Привязка по артикулу",
          href: "/brands",
          description: "На маркетплейсе домен общий, поэтому товары ищутся по артикулу.",
        },
        {
          label: "Живые переходы",
          href: "/brands",
          description: "Превью мессенджеров отделены от настоящих читателей.",
        },
        {
          label: "Подключить домен",
          href: "/signup",
          description: "Укажите свои артикулы и увидите первые данные сразу.",
        },
        {
          label: "Войти в аналитику",
          href: "/login",
          description: "Кабинет с переходами по каждому вашему товару.",
        },
      ],
    },
  ];
}

const PANEL_ALIGN: Record<Menu["align"], string> = {
  left: "left-0",
  center: "left-1/2 -translate-x-1/2",
  right: "right-0",
};

const ARROW_ALIGN: Record<Menu["align"], string> = {
  left: "left-14",
  center: "left-1/2 -translate-x-1/2",
  right: "right-14",
};

export function MegaNav({
  signedIn,
  demoSlug,
  overlay = false,
}: {
  signedIn: boolean;
  demoSlug?: string;
  overlay?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const menus = buildMenus(demoSlug);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  // The bar rides over the hero photo at the top of the page, then takes
  // on a solid background once it starts covering ordinary content.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A small delay keeps the panel from flickering shut while the pointer
  // travels from the trigger down into it.
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const transparent = overlay && !scrolled && !open && !mobileOpen;
  const textColor = transparent ? "text-white" : "text-ink";
  const mutedColor = transparent ? "text-white/75" : "text-stone";

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        transparent ? "bg-transparent" : "bg-paper/95 backdrop-blur-md border-b border-line"
      }`}
      onMouseLeave={scheduleClose}
    >
      <div className="px-6 md:px-10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between py-5">
        <Link href="/" className={`font-display text-lg ${textColor}`}>
          Shoppi
        </Link>

        {/* desktop triggers */}
        <div className="hidden md:flex items-center gap-8">
          {menus.map((menu) => (
            <button
              key={menu.key}
              type="button"
              aria-expanded={open === menu.key}
              onMouseEnter={() => {
                cancelClose();
                setOpen(menu.key);
              }}
              onFocus={() => setOpen(menu.key)}
              onClick={() => setOpen((v) => (v === menu.key ? null : menu.key))}
              className={`flex items-center gap-1.5 text-[13px] tracking-wide transition-opacity cursor-pointer ${
                open === menu.key ? textColor : mutedColor
              } hover:${textColor}`}
            >
              {menu.label}
              <svg
                width="9"
                height="6"
                viewBox="0 0 9 6"
                fill="none"
                aria-hidden="true"
                className={`transition-transform ${open === menu.key ? "rotate-180" : ""}`}
              >
                <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {searchOpen ? (
            <form onSubmit={submitSearch} className="hidden sm:flex items-center">
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setSearchOpen(false)}
                placeholder="Товары и кураторы"
                className={`text-[13px] w-48 px-3 py-1.5 border-b bg-transparent outline-none ${
                  transparent ? "border-white text-white placeholder:text-white/60" : "border-ink text-ink placeholder:text-stone"
                }`}
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Поиск"
              className={`hidden sm:flex items-center justify-center w-7 h-7 ${mutedColor} hover:${textColor} transition-colors cursor-pointer`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <ThemeToggle className={`${mutedColor} hover:${textColor}`} />
          {signedIn ? (
            <Link
              href="/dashboard"
              className={`text-[12px] font-semibold uppercase tracking-wide px-4 py-2.5 transition-opacity hover:opacity-80 ${
                transparent ? "bg-white text-black" : "bg-ink text-paper"
              }`}
            >
              Кабинет
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`hidden sm:inline text-[12px] uppercase tracking-wide ${mutedColor} hover:${textColor} transition-colors`}
              >
                Войти
              </Link>
              <Link
                href="/signup"
                className={`text-[12px] font-semibold uppercase tracking-wide px-4 py-2.5 transition-opacity hover:opacity-80 ${
                  transparent ? "bg-white text-black" : "bg-ink text-paper"
                }`}
              >
                Регистрация
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Меню"
            aria-expanded={mobileOpen}
            className={`md:hidden flex flex-col gap-[5px] p-1 cursor-pointer ${textColor}`}
          >
            <span className="block w-5 h-px bg-current" />
            <span className="block w-5 h-px bg-current" />
          </button>
        </div>
        </div>
      </div>

      {/* desktop dropdown panel */}
      {menus.map((menu) => (
        <div
          key={menu.key}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className={`hidden md:block absolute top-full mt-1 mx-6 md:mx-10 ${PANEL_ALIGN[menu.align]} ${
            open === menu.key ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
          } transition-opacity duration-150`}
        >
          <div
            className={`absolute -top-[7px] w-3.5 h-3.5 rotate-45 bg-card rounded-[2px] ${
              ARROW_ALIGN[menu.align]
            }`}
          />
          <div className="relative bg-card rounded-2xl shadow-[0_28px_70px_-24px_rgba(0,0,0,0.45)] px-12 py-11 w-[min(92vw,940px)]">
            <div className="grid grid-cols-3 gap-x-14 gap-y-10">
              {menu.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(null)}
                  className="group block"
                >
                  <span className="font-display text-[19px] text-ink group-hover:underline underline-offset-[5px]">
                    {item.label}
                  </span>
                  <p className="text-stone text-[13.5px] leading-[1.6] mt-2.5">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* mobile stacked menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-card border-y border-line px-6 py-6 flex flex-col gap-7 max-h-[70vh] overflow-y-auto">
          {menus.map((menu) => (
            <div key={menu.key}>
              <div className="text-[11px] uppercase tracking-widest text-stone mb-3">
                {menu.label}
              </div>
              <div className="flex flex-col gap-2.5">
                {menu.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-ink text-[15px]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {!signedIn && (
            <Link href="/login" onClick={() => setMobileOpen(false)} className="text-ink text-[15px]">
              Войти
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
