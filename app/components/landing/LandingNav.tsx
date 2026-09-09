import Link from "next/link";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { getSessionUserId } from "@/lib/store";

export async function LandingNav() {
  // Showing "Войти" to somebody who is already signed in reads as a bug,
  // so the nav checks the session it already has access to.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const signedIn = Boolean(token && getSessionUserId(token));

  return (
    <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-line">
      <Link href="/" className="font-display text-lg">
        Shoppi
      </Link>
      <div className="hidden md:flex items-center gap-8 text-[12px] uppercase tracking-wide text-stone">
        <Link href="/curators" className="hover:text-ink transition-colors">
          Кураторы
        </Link>
        <Link href="/shoppers" className="hover:text-ink transition-colors">
          Покупателям
        </Link>
        <Link href="/creators" className="hover:text-ink transition-colors">
          Кураторам
        </Link>
        <Link href="/brands" className="hover:text-ink transition-colors">
          Брендам
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {signedIn ? (
          <Link
            href="/dashboard"
            className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-4 py-2.5 hover:opacity-80 transition-opacity"
          >
            Кабинет
          </Link>
        ) : (
          <>
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
          </>
        )}
      </div>
    </nav>
  );
}
