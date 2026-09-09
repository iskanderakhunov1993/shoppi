import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 text-center">
      <div className="max-w-lg flex flex-col items-center gap-6">
        <div className="text-[11px] uppercase tracking-widest text-stone">MyShop</div>
        <h1 className="font-display text-4xl leading-tight">
          Покупай у своих людей, не у алгоритма.
        </h1>
        <p className="text-stone text-sm">
          Витрина куратора: косметика, мужские товары, одежда — рекомендации людей,
          которым доверяешь.
        </p>
        <Link
          href="/signup"
          className="font-body text-[13px] font-semibold uppercase tracking-wide text-paper bg-ink px-6 py-3.5 hover:opacity-80 transition-opacity"
        >
          Создать витрину
        </Link>
      </div>
    </main>
  );
}
