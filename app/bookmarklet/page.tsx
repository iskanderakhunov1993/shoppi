"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Reads the product open in the creator's own browser — already past
// Wildberries' bot check as an ordinary visitor, so nothing here is
// bypassing anything — and hands the scraped fields to our dashboard via
// the URL. Kept as one unminified function body for readability; wrapped
// in `javascript:` + stringified for the actual bookmarklet href.
function bookmarkletBody(origin: string) {
  return `(function(){
    try {
      if (!/(^|\\.)wildberries\\.ru$/.test(location.hostname)) {
        alert("Откройте страницу товара на wildberries.ru и запустите букмарклет там.");
        return;
      }
      var t = document.title;
      var m = t.match(/^(.*)\\s\\d+\\s+купить за\\s+([\\d\\s]+)\\s*\\u20bd/);
      var title = m ? m[1].trim() : "";
      var price = m ? m[2].replace(/\\s/g, "") : "";
      var img = document.querySelector('img[src*="wbbasket.ru"][src*="/images/big/1"]');
      var imageUrl = img ? img.src.replace(/^http:/, "https:") : "";
      var url = location.href.split("?")[0];
      if (!title) {
        alert("Не нашли название товара на странице — попробуйте перезагрузить её и подождать пару секунд.");
        return;
      }
      var p = new URLSearchParams({ prefill: "1", title: title, price: price, imageUrl: imageUrl, targetUrl: url });
      window.open(${JSON.stringify(origin)} + "/dashboard?tab=products&" + p.toString(), "_blank");
    } catch (e) {
      alert("Не получилось прочитать страницу: " + e.message);
    }
  })();`;
}

export default function BookmarkletPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const href = origin ? `javascript:${encodeURIComponent(bookmarkletBody(origin))}` : undefined;

  return (
    <main className="flex-1 px-6 md:px-10 py-16 md:py-20">
      <div className="max-w-[640px] mx-auto flex flex-col gap-8">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-stone">Shoppi</span>
          <h1 className="font-display text-3xl md:text-4xl mt-2 mb-3">Добавить товар с Wildberries в один клик</h1>
          <p className="text-stone text-sm leading-relaxed">
            Wildberries блокирует автоматические запросы к своим страницам, поэтому подтянуть
            название, фото и цену с сервера напрямую по вставленной ссылке нельзя. Но если открыть
            товар в собственном браузере — как обычный покупатель — и нажать эту кнопку, она
            прочитает данные прямо со страницы и откроет форму добавления товара уже заполненной.
          </p>
        </div>

        <div className="border border-line p-6 flex flex-col items-center gap-4 bg-card">
          <a
            href={href}
            onClick={(e) => {
              if (!href) return;
              e.preventDefault();
              alert("Перетащите эту кнопку на панель закладок браузера, а не нажимайте на неё.");
            }}
            className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-3 cursor-grab active:cursor-grabbing select-none"
          >
            Добавить в Shoppi
          </a>
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
            <li>Откройте на wildberries.ru страницу товара, который хотите добавить.</li>
            <li>Нажмите на кнопку в закладках — откроется новая вкладка с кабинетом Shoppi.</li>
            <li>Название, фото и цена уже будут в форме — проверьте и нажмите «Добавить».</li>
          </ol>
          <p className="text-stone text-sm leading-relaxed">
            Для Ozon и других сайтов пока так не получится — они блокируют такие подсказки жёстче
            (капча). Для них по-прежнему нужно вставить ссылку и заполнить название, фото и цену
            вручную.
          </p>
        </section>

        <Link href="/dashboard?tab=products" className="text-sm underline underline-offset-4 w-fit">
          В кабинет
        </Link>
      </div>
    </main>
  );
}
