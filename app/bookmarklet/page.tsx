"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Reads the product open in the creator's own browser — already past the
// store's bot check as an ordinary visitor, so nothing here is bypassing
// anything — and hands the scraped fields to our dashboard via the URL.
// Wildberries has its own page quirks and gets a dedicated path; every
// other store (Ozon, Яндекс.Маркет, Спортмастер, Stockmann, Poizon, …)
// goes through the generic reader: schema.org Product JSON-LD first
// (what these shops publish for Google Shopping), then Open Graph tags.
// Kept as one unminified function body for readability; wrapped in
// `javascript:` + stringified for the actual bookmarklet href.
function bookmarkletBody(origin: string) {
  return `(function(){
    try {
      var title = "", price = "", imageUrl = "";
      var url = location.href.split("?")[0];
      var meta = function (k) {
        var el = document.querySelector('meta[property="' + k + '"],meta[name="' + k + '"],meta[itemprop="' + k + '"]');
        return el ? (el.getAttribute("content") || "") : "";
      };
      var digits = function (v) { return String(v || "").replace(/[^\\d.,]/g, "").replace(",", ".").split(".")[0]; };

      if (/(^|\\.)wildberries\\.ru$/.test(location.hostname)) {
        var m = document.title.match(/^(.*)\\s\\d+\\s+купить за\\s+([\\d\\s]+)\\s*\\u20bd/);
        title = m ? m[1].trim() : "";
        price = m ? m[2].replace(/\\s/g, "") : "";
        // WB rotates gallery CDN hosts, so match on the article id instead.
        var idMatch = location.pathname.match(/\\/catalog\\/(\\d+)/);
        var articleId = idMatch ? idMatch[1] : "";
        var img = articleId
          ? [].slice.call(document.querySelectorAll("img")).find(function (el) {
              return el.src.indexOf("/" + articleId + "/images/big/1") !== -1;
            })
          : null;
        imageUrl = img ? img.src : "";
      } else {
        var find = function (node) {
          if (!node || typeof node !== "object") return null;
          if (Array.isArray(node)) { for (var i = 0; i < node.length; i++) { var r = find(node[i]); if (r) return r; } return null; }
          var t = node["@type"];
          if (t === "Product" || (Array.isArray(t) && t.indexOf("Product") !== -1)) return node;
          return find(node["@graph"]);
        };
        var scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (var s = 0; s < scripts.length; s++) {
          try {
            var p = find(JSON.parse(scripts[s].textContent));
            if (!p) continue;
            title = title || p.name || "";
            var im = Array.isArray(p.image) ? p.image[0] : p.image;
            imageUrl = imageUrl || (im && (im.url || im)) || "";
            var off = Array.isArray(p.offers) ? p.offers[0] : p.offers;
            if (off) price = price || digits(off.price || off.lowPrice || (off.priceSpecification && off.priceSpecification.price));
          } catch (e) {}
        }
        title = title || meta("og:title") || document.title;
        imageUrl = imageUrl || meta("og:image");
        price = price || digits(meta("product:price:amount") || meta("og:price:amount") || meta("price"));
      }
      imageUrl = String(imageUrl || "").replace(/^\\/\\//, "https://").replace(/^http:/, "https:");
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
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  // React sanitizes any href passed through JSX that starts with
  // "javascript:" — as an XSS precaution it swaps the whole URL for a
  // stub that just throws when clicked, which is exactly what a dragged
  // bookmarklet needs to run. Setting the attribute straight on the DOM
  // node after render sidesteps that diffing/sanitizing pass entirely.
  useEffect(() => {
    if (!origin || !linkRef.current) return;
    linkRef.current.setAttribute("href", `javascript:${encodeURIComponent(bookmarkletBody(origin))}`);
  }, [origin]);

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
          <a
            ref={linkRef}
            href="#"
            onClick={(e) => {
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
