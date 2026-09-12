import { notFound } from "next/navigation";
import { seedDemoAccounts } from "@/lib/seed";
import { listLinksByCategory, getCreatorById, type Link as ShopLink } from "@/lib/store";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { EmptyState } from "@/app/components/EmptyState";
import { CATEGORY_LABEL, isCategory, type Category } from "@/lib/categories";

export const dynamic = "force-dynamic";

const CATEGORY_SEED: Record<Category, string> = {
  cosmetics: "shoppi-cat-cosmetics",
  mens: "shoppi-cat-mens",
  clothing: "shoppi-cat-clothing",
  tools: "shoppi-cat-tools",
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategory(category)) notFound();

  await seedDemoAccounts();
  const links: ShopLink[] = await listLinksByCategory(category);
  const creatorsById = new Map(
    await Promise.all(
      [...new Set(links.map((l) => l.creatorId))].map(
        async (id) => [id, await getCreatorById(id)] as const
      )
    )
  );

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav overlay />

      <div className="relative h-[280px] md:h-[340px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://picsum.photos/seed/${CATEGORY_SEED[category]}/1600/700`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-black/20" />
        <div className="relative h-full flex flex-col justify-end px-6 md:px-10 pb-10">
          <div className="max-w-[1200px] mx-auto w-full">
          <span className="text-[11px] uppercase tracking-widest text-white/70 mb-2 font-display italic">
            По категории
          </span>
          <h1 className="font-display text-white text-4xl md:text-6xl">
            {CATEGORY_LABEL[category]}
          </h1>
          </div>
        </div>
      </div>

      <section className="px-6 md:px-10 py-14 md:py-16">
        <div className="max-w-[1200px] mx-auto">
          {links.length === 0 ? (
            <EmptyState title="В этой категории пока нет опубликованных товаров." />
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-px bg-line">
              {links.map((link) => {
                const creator = creatorsById.get(link.creatorId);
                return (
                  <a
                    key={link.id}
                    href={`/r/${link.id}`}
                    className="group bg-paper flex flex-col hover:opacity-90 transition-opacity"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          link.imageUrl ??
                          `https://picsum.photos/seed/${link.id}/400/300`
                        }
                        alt={link.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5">
                      <div className="text-sm font-medium leading-snug mb-1">{link.title}</div>
                      {creator && (
                        <span className="text-[11px] text-stone">от {creator.displayName}</span>
                      )}
                      {link.price && (
                        <div className="text-[13.5px] text-stone mt-2">
                          {link.price.toLocaleString("ru-RU")} ₽
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
