import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="px-6 md:px-10 py-14">
      <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-10 mb-12">
        <div>
          <h4 className="text-[11px] uppercase tracking-widest text-stone mb-4">Кураторам</h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/signup" className="hover:underline underline-offset-4">Стать куратором</Link></li>
            <li><Link href="/login" className="hover:underline underline-offset-4">Войти в кабинет</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] uppercase tracking-widest text-stone mb-4">Брендам</h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/signup" className="hover:underline underline-offset-4">Подключить домен</Link></li>
            <li><Link href="/login" className="hover:underline underline-offset-4">Войти в аналитику</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] uppercase tracking-widest text-stone mb-4">Шопперам</h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li><a href="#curators" className="hover:underline underline-offset-4">Все кураторы</a></li>
            <li><Link href="/login" className="hover:underline underline-offset-4">Мой вкус</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-5xl mx-auto pt-6 border-t border-line flex flex-col sm:flex-row justify-between gap-2 text-[12px] text-stone">
        <span>© Shoppi, 2026</span>
        <span>Покупай у своих людей, не у алгоритма.</span>
      </div>
    </footer>
  );
}
