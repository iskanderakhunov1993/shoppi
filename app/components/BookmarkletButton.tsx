"use client";

import { useEffect, useRef } from "react";

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
        // No product markup (Lamoda and other SPA stores): read what the
        // shopper actually sees. og: tags come last — on these sites they're
        // often site-wide defaults (a category name, the store logo).
        var h1 = document.querySelector("h1");
        var h1Text = h1 ? h1.innerText.replace(/\\s+/g, " ").trim() : "";
        var bestImg = "", bestArea = 0;
        [].slice.call(document.images).forEach(function (el) {
          var src = el.currentSrc || el.src || "";
          if (!src || /logo|icon|sprite|avatar|\\.svg/i.test(src)) return;
          if (el.naturalWidth < 200 || el.naturalHeight < 200) return;
          var r = el.getBoundingClientRect();
          var area = r.width * r.height;
          if (area > bestArea) { bestArea = area; bestImg = src; }
        });
        var domPrice = "";
        var ip = document.querySelector('[itemprop="price"]');
        if (ip) domPrice = digits(ip.getAttribute("content") || ip.textContent);
        if (!domPrice) {
          var cands = document.querySelectorAll('[class*="price" i], [data-testid*="price" i]');
          for (var c = 0; c < cands.length; c++) {
            var el = cands[c];
            var OLD = "s, del, [class*='old' i], [class*='was' i], [class*='through' i], [class*='crossed' i]";
            if (el.closest(OLD)) continue;
            var copy = el.cloneNode(true);
            [].slice.call(copy.querySelectorAll(OLD)).forEach(function (o) { o.remove(); });
            var pm = (copy.textContent || "").match(/(\\d[\\d\\s\\u00a0]{0,9})\\s*(₽|руб)/);
            if (pm) { domPrice = pm[1].replace(/[\\s\\u00a0]/g, ""); break; }
          }
        }
        var ogImage = meta("og:image");
        if (/logo|icon/i.test(ogImage)) ogImage = "";
        title = title || h1Text || meta("og:title") || document.title;
        imageUrl = imageUrl || bestImg || ogImage;
        price = price || domPrice || digits(meta("product:price:amount") || meta("og:price:amount") || meta("price"));
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

/**
 * The draggable "Добавить в Shoppi" bookmark. React replaces any JSX href
 * starting with "javascript:" with a throwing stub (XSS guard), so the real
 * href is set on the DOM node after mount, outside React's diffing.
 */
export function BookmarkletButton() {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    linkRef.current?.setAttribute(
      "href",
      `javascript:${encodeURIComponent(bookmarkletBody(window.location.origin))}`
    );
  }, []);

  return (
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
  );
}
