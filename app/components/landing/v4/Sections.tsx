import Link from "next/link";
import { countLinksByCreator, listLinksByCreator, listRecentLinks, type Creator } from "@/lib/store";
import { placeholderAvatar } from "@/lib/avatar";
import { CATEGORY_LABEL, VISIBLE_CATEGORIES, type Category } from "@/lib/categories";
import { STATIC_COVERS } from "@/app/components/CategoryIndexGrid";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { FollowButton } from "@/app/components/FollowButton";
import { AdLabel } from "@/app/components/AdLabel";
import { BRANDS_ENABLED } from "@/lib/featureFlags";
import { plural, rub, Section, shopLabel, Strike } from "./shared";

export async function LiveRecommendationsV4() {
  const links = (await listRecentLinks({ limit: 16 })).filter((l) => l.imageUrl).slice(0, 8);
  // A half-empty shelf reads as a dead product; better to skip the block.
  if (links.length < 4) return null;
  return (
    <Section id="rec" title="Сейчас советуют" more={{ href: "/finds", label: "Все рекомендации →" }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {links.map((link) => (
          <div key={link.id} className="bg-card rounded-[22px] p-3 md:p-3.5 flex flex-col gap-2.5">
            <Link href={`/${link.creatorSlug}`} className="flex items-center gap-2.5 text-[13px] text-stone">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={link.creatorAvatarUrl || placeholderAvatar(link.creatorSlug)} alt="" className="w-8 h-8 rounded-full object-cover bg-raise" />
              <span className="leading-tight min-w-0"><b className="block text-ink font-semibold text-sm truncate">{link.creatorName}</b>рекомендует</span>
            </Link>
            <div className="relative h-[150px] md:h-[200px] bg-paper rounded-2xl overflow-hidden">
              <a href={`/r/${link.id}`} className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={link.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
              </a>
              <span className="absolute top-2 right-2"><FavoriteButton linkId={link.id} variant="overlay" /></span>
            </div>
            <a href={`/r/${link.id}`} className="text-[15px] font-medium leading-snug line-clamp-2 hover:underline">{link.title}</a>
            <AdLabel isAd={link.isAd} adInfo={link.adInfo} />
            <div className="mt-auto flex justify-between items-center text-[13px] text-stone">
              <span className="truncate">{shopLabel(link)}</span>
              {link.price ? <b className="text-ink font-semibold text-sm">{rub(link.price)}</b> : null}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

const STEPS = [
  { who: "Блогер", title: "Добавляет товар", body: "То, чем пользуется сам, со ссылкой на магазин." },
  { who: "Вы", title: "Подписываетесь", body: "Рекомендации ваших блогеров собираются в одной ленте." },
  { who: "Магазин", title: "Покупаете там же", body: "Ссылка ведёт прямо на товар. Цена та же, что в магазине." },
];

export function HowItWorksV4() {
  return (
    <Section id="how" title="Как это работает" className="bg-card">
      <div className="grid md:grid-cols-3 gap-3 md:gap-4">
        {STEPS.map((s) => (
          <div key={s.who} className="bg-paper rounded-3xl p-7">
            <span className="text-xs uppercase tracking-[0.08em] font-semibold text-acc">{s.who}</span>
            <h3 className="font-display text-[22px] leading-tight tracking-[-0.03em] mt-3.5 mb-2">{s.title}</h3>
            <p className="text-stone leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export async function BloggersV4({ creators }: { creators: Creator[] }) {
  const cards = (
    await Promise.all(
      creators.slice(0, 6).map(async (c) => ({
        creator: c,
        shelf: (await listLinksByCreator(c.id, { limit: 12 })).filter((l) => l.imageUrl).slice(0, 3),
        total: await countLinksByCreator(c.id),
      }))
    )
  ).filter((c) => c.shelf.length > 0);
  if (cards.length === 0) return null;

  return (
    <Section id="bloggers" title="Блогеры" more={{ href: "/curators", label: "Все блогеры →" }}>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {cards.map(({ creator, shelf, total }) => (
          <div key={creator.id} className="bg-card rounded-[26px] p-5 flex flex-col gap-4">
            <Link href={`/${creator.slug}`} className="flex items-center gap-3.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={creator.avatarUrl || placeholderAvatar(creator.slug)} alt="" className="w-14 h-14 rounded-full object-cover bg-raise" />
              <span className="min-w-0">
                <b className="block font-semibold text-[17px] truncate group-hover:underline">{creator.displayName}</b>
                <small className="text-stone text-[13px]">
                  {(creator.categories ?? []).slice(0, 3).map((c) => CATEGORY_LABEL[c].toLowerCase()).join(", ") || "витрина блогера"}
                </small>
              </span>
            </Link>
            <Link href={`/${creator.slug}`} className="grid grid-cols-3 gap-2" aria-label={`Витрина: ${creator.displayName}`}>
              {shelf.map((l) => (
                <div key={l.id} className="aspect-square bg-paper rounded-2xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
            </Link>
            <div className="flex justify-between items-center text-[13px] text-stone">
              <span>{plural(total, ["рекомендация", "рекомендации", "рекомендаций"])}</span>
              <span className="lv4-follow"><FollowButton creatorId={creator.id} compact /></span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

const FEATURED: Category[] = ["face_care", "makeup", "hair_care", "shoes", "perfume", "bags", "household", "electronics"];

export function CategoriesV4() {
  const shown = FEATURED.filter((c) => VISIBLE_CATEGORIES.includes(c) && STATIC_COVERS[c]);
  return (
    <Section id="cats" title="Категории" more={{ href: "/categories", label: "Все категории →" }} className="pt-0 md:pt-0">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {shown.map((c) => (
          <a key={c} href={`/category/${c}`} className="bg-card rounded-[22px] p-4 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
            <div className="h-[120px] md:h-[140px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={STATIC_COVERS[c]} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
            </div>
            <span className="font-medium">{CATEGORY_LABEL[c]}</span>
          </a>
        ))}
      </div>
    </Section>
  );
}

export function ForBloggersV4() {
  return (
    <Section id="forb" className="pt-0 md:pt-0">
      <div className="bg-[#17151C] text-white rounded-[32px] p-7 md:p-14 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="font-display text-[28px] md:text-[42px] leading-[1.08] tracking-[-0.04em]">
            Ведёте блог? Соберите рекомендации на одной странице
          </h2>
          <ul className="mt-7 mb-8 grid gap-3.5 text-[#D9D6E2]">
            {[
              "Одна ссылка для шапки профиля",
              "Товар добавляется по ссылке из любого магазина",
              "Видно, сколько живых людей перешло к товару",
              "Медиакит с цифрами переходов, чтобы показать брендам",
            ].map((t) => (
              <li key={t} className="flex gap-3 leading-snug">
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[#7B63FF] mt-2 flex-none" />
                {t}
              </li>
            ))}
          </ul>
          <Link href="/signup?role=creator" className="lv4-btn bg-white! text-[#17151C]!">Создать витрину бесплатно</Link>
        </div>
        <div className="bg-[#221F2A] rounded-3xl p-5" aria-label="Пример: как добавить товар">
          <span className="text-xs uppercase tracking-[0.08em] font-semibold text-[#9A96A6]">Ссылка на товар</span>
          <div className="mt-2.5 bg-[#2C2935] rounded-xl px-3.5 py-3 text-sm text-[#CFCBD8] truncate">https://brand-shop.ru/catalog/shampoo</div>
          <div className="mt-3.5 bg-white text-[#17151C] rounded-2xl p-3 grid grid-cols-[72px_1fr] gap-3.5 items-center">
            <div className="w-[72px] h-[72px] bg-[#F6F5F8] rounded-xl p-2 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/category-covers/hair_care.webp" alt="" className="max-h-full max-w-full object-contain" />
            </div>
            <span className="leading-snug"><b className="block font-medium">Шампунь для окрашенных волос</b><small className="text-[#75717F]">добавлено на витрину</small></span>
          </div>
          <p className="mt-3.5 text-[13px] text-[#9A96A6]">Вставили ссылку, проверили карточку, товар на витрине.</p>
        </div>
      </div>
    </Section>
  );
}

const FAQ = [
  { q: "Это бесплатно?", a: "Да, для покупателей и блогеров." },
  { q: "Где я покупаю товар?", a: "В магазине, где блогер его нашёл: на маркетплейсе, сайте бренда или в любом другом. Shoppi не принимает оплату." },
  { q: "Почему этим советам можно верить?", a: "Блогеры добавляют то, чем пользуются сами. Рекламные товары помечены." },
  { q: "Как создать витрину?", a: "Зарегистрируйтесь и вставьте ссылку на первый товар. Заявку подавать не нужно." },
  ...(BRANDS_ENABLED ? [{ q: "Что видит бренд?", a: "Все ссылки блогеров на его товары и число живых переходов по каждой." }] : []),
];

export function FaqV4() {
  return (
    <Section id="faq" className="pt-0 md:pt-0">
      <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-10 items-start">
        <h2 className="font-display text-[30px] md:text-[46px] leading-[1.08] tracking-[-0.04em]">Вопросы</h2>
        <div className="grid gap-2.5">
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0} className="lv4-faq bg-card rounded-[18px] px-5 py-4.5">
              <summary className="flex justify-between gap-4 font-medium text-[17px] cursor-pointer list-none">{f.q}</summary>
              <p className="mt-2.5 text-stone leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function FinalV4() {
  return (
    <section className="px-5 md:px-10 py-24 md:py-32 text-center">
      <h2 className="font-display text-[32px] md:text-[64px] leading-[1.06] tracking-[-0.045em] max-w-[16ch] mx-auto">
        Меньше <Strike>рекламы</Strike>, больше советов от людей
      </h2>
      <div className="flex flex-wrap justify-center gap-2.5 mt-8">
        <Link href="/finds" className="lv4-btn">Смотреть рекомендации</Link>
        <Link href="/signup?role=creator" className="lv4-btn lv4-btn-o">Создать витрину</Link>
      </div>
    </section>
  );
}
