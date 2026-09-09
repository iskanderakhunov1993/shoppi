import Link from "next/link";

export function LandingNav() {
  return (
    <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-line">
      <span className="font-display text-lg">Shoppi</span>
      <div className="hidden md:flex items-center gap-8 text-[12px] uppercase tracking-wide text-stone">
        <a href="#curators" className="hover:text-ink transition-colors">
          Кураторы
        </a>
        <a href="#how" className="hover:text-ink transition-colors">
          Как это устроено
        </a>
        <a href="#brands" className="hover:text-ink transition-colors">
          Брендам
        </a>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors"
        >
          Войти
        </Link>
        <Link
          href="/signup"
          className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-4 py-2.5 hover:opacity-80 transition-opacity"
        >
          Регистрация
        </Link>
      </div>
    </nav>
  );
}
