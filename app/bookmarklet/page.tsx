"use client";

import Link from "next/link";
import { BookmarkletButton } from "@/app/components/BookmarkletButton";

export default function BookmarkletPage() {
  return (
    <main className="flex-1 px-6 md:px-10 py-16 md:py-20">
      <div className="max-w-[640px] mx-auto flex flex-col gap-8">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-stone">Shoppi</span>
          <h1 className="font-display text-3xl md:text-4xl mt-2 mb-3">Добавить товар из любого магазина в один клик</h1>
          <p className="text-stone text-sm leading-relaxed">
            Магазины блокируют автоматические запросы к своим страницам, поэтому подтянуть
            название, фото и цену с сервера по вставленной ссылке получается не всегда. Но если открыть
            товар в собственном браузере — как обычный покупатель — и нажать эту кнопку, она
            прочитает данные прямо со страницы и откроет форму добавления товара уже заполненной.
          </p>
          <p className="text-stone text-[12.5px] mt-3">
            Работает на Wildberries, Ozon, Lamoda, Poizon, Яндекс Маркете, Спортмастере, Stockmann и
            большинстве других интернет-магазинов.
          </p>
        </div>

        <div className="border border-line p-6 flex flex-col items-center gap-4 bg-card">
          <BookmarkletButton />
          <p className="text-[12.5px] text-stone text-center">
            Перетащите эту кнопку на панель закладок вашего браузера (обычно видна прямо под
            адресной строкой — если её не видно, включите «Показать панель закладок» в настройках
            браузера).
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Как этим пользоваться</h2>
          <ol className="text-stone text-sm leading-relaxed flex flex-col gap-2 list-decimal pl-5">
            <li>Перетащите кнопку выше в закладки браузера (один раз).</li>
            <li>Откройте в магазине страницу товара, который хотите добавить.</li>
            <li>Нажмите на кнопку в закладках — откроется новая вкладка с кабинетом Shoppi.</li>
            <li>Название, фото и цена уже будут в форме — проверьте и нажмите «Добавить».</li>
          </ol>
          <p className="text-stone text-sm leading-relaxed">
            Если какое-то поле не подтянулось — магазин его не отдаёт на странице. Допишите его
            вручную перед сохранением.
          </p>
        </section>

        <Link href="/dashboard?tab=products" className="text-sm underline underline-offset-4 w-fit">
          В кабинет
        </Link>
      </div>
    </main>
  );
}
