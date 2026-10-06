import Link from "next/link";
import { countLinksByCreator, listLinksByCreator, type Creator } from "@/lib/store";
import { placeholderAvatar } from "@/lib/avatar";
import { CATEGORY_LABEL } from "@/lib/categories";
import { FollowButton } from "@/app/components/FollowButton";
import { plural, rub, shopLabel, Strike } from "./shared";

/** A real storefront in miniature, so "blogger recommends" is shown, not explained. */
async function StorefrontPreview({ creators }: { creators: Creator[] }) {
  for (const creator of creators) {
    const picks = (await listLinksByCreator(creator.id, { limit: 12 })).filter((l) => l.imageUrl).slice(0, 3);
    if (picks.length < 2) continue;
    const total = await countLinksByCreator(creator.id);
    const topics = [...new Set(picks.map((l) => CATEGORY_LABEL[l.category]))].slice(0, 2).join(", ").toLowerCase();

    return (
      <div>
        <div className="bg-card rounded-[30px] p-5 md:p-6 shadow-[0_30px_60px_-30px_rgba(40,30,80,.25)]">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creator.avatarUrl || placeholderAvatar(creator.slug)}
              alt=""
              className="w-16 h-16 rounded-full object-cover bg-raise flex-none"
            />
            <Link href={`/${creator.slug}`} className="min-w-0">
              <b className="block font-display text-xl tracking-[-0.03em] truncate">{creator.displayName}</b>
              <small className="text-stone text-sm">{topics}</small>
            </Link>
            <span className="ml-auto flex-none">
              <span className="lv4-follow"><FollowButton creatorId={creator.id} compact /></span>
            </span>
          </div>
          <div className="flex justify-between text-[13px] text-stone mt-5 mb-1">
            <b className="text-acc uppercase tracking-[0.06em] text-xs font-semibold">Рекомендует</b>
            <span>{plural(total, ["товар", "товара", "товаров"])}</span>
          </div>
          {picks.map((link) => (
            <a key={link.id} href={`/r/${link.id}`} className="grid grid-cols-[72px_1fr_auto] gap-4 items-center py-3 border-t border-line group">
              <div className="w-[72px] h-[72px] bg-paper rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={link.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-[15px] font-medium leading-snug line-clamp-2 group-hover:underline">{link.title}</span>
              <span className="text-right font-semibold whitespace-nowrap">
                {link.price ? rub(link.price) : ""}
                <small className="block text-xs text-stone font-normal">{shopLabel(link)}</small>
              </span>
            </a>
          ))}
        </div>
        <p className="text-center text-[13px] text-stone mt-4">Так выглядит витрина блогера на Shoppi</p>
      </div>
    );
  }
  return null;
}

export async function HeroV4({ creators }: { creators: Creator[] }) {
  const preview = await StorefrontPreview({ creators });
  return (
    <header className="px-5 md:px-10 pt-24 md:pt-32 pb-6">
      <div className={`max-w-[1180px] mx-auto grid gap-14 items-center ${preview ? "lg:grid-cols-[1.05fr_.95fr]" : ""}`}>
        <div>
          <h1 className="font-display text-[34px] md:text-[56px] leading-[1.06] tracking-[-0.045em] max-w-[16ch]">
            Покупайте то, что советуют люди, а не <Strike>реклама</Strike>
          </h1>
          <p className="text-stone text-[17px] md:text-lg leading-relaxed mt-6 max-w-[44ch]">
            У каждого блогера на Shoppi своя витрина: товары, которыми он пользуется сам, с ценой и ссылкой на
            магазин. Подпишитесь на тех, кому доверяете.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-8">
            <Link href="/finds" className="lv4-btn">Смотреть рекомендации</Link>
            <Link href="/signup?role=creator" className="lv4-btn lv4-btn-o">Создать свою витрину</Link>
          </div>
        </div>
        {preview}
      </div>
    </header>
  );
}
