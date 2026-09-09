"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
          description: "Инструменты, снаряжение и уход — проверенное, а не рекламное.",
        },
        {
          label: "Одежда",
          href: "/category/clothing",
          description: "Вещи, которые кураторы носят сезон за сезоном.",
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
  left: "left-10",
  center: "left-1/2 -translate-x-1/2",
  right: "right-10",
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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menus = buildMenus(demoSlug);

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

  const textColor = overlay ? "text-white" : "text-ink";
  const mutedColor = overlay ? "text-white/75" : "text-stone";

  return (
    <nav
      className={`relative z-30 ${overlay ? "" : "border-b border-line bg-paper"}`}
      onMouseLeave={scheduleClose}
    >
      <div className="flex items-center justify-between px-6 md:px-10 py-5">
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
          {signedIn ? (
            <Link
              href="/dashboard"
              className={`text-[12px] font-semibold uppercase tracking-wide px-4 py-2.5 transition-opacity hover:opacity-80 ${
                overlay ? "bg-white text-black" : "bg-ink text-paper"
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
                  overlay ? "bg-white text-black" : "bg-ink text-paper"
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

      {/* desktop dropdown panel */}
      {menus.map((menu) => (
        <div
          key={menu.key}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className={`hidden md:block absolute top-full mx-6 md:mx-10 ${PANEL_ALIGN[menu.align]} ${
            open === menu.key ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
          } transition-opacity duration-150`}
        >
          <div
            className={`absolute -top-1.5 w-3 h-3 rotate-45 bg-card border-l border-t border-line ${
              ARROW_ALIGN[menu.align]
            }`}
          />
          <div className="relative bg-card border border-line shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] p-8 w-[min(88vw,720px)]">
            <div className="grid grid-cols-3 gap-x-8 gap-y-7">
              {menu.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(null)}
                  className="group block"
                >
                  <span className="font-display text-[17px] text-ink group-hover:underline underline-offset-4">
                    {item.label}
                  </span>
                  <p className="text-stone text-[12.5px] leading-relaxed mt-1.5">
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
