import { seedDemoAccounts } from "@/lib/seed";
import { listDistinctBrandDomains } from "@/lib/store";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { RoleHero } from "@/app/components/landing/RoleHero";
import { ValueList } from "@/app/components/landing/ValueList";
import { ShopByBrand } from "@/app/components/landing/ShopByBrand";
import { LandingFooter } from "@/app/components/landing/LandingFooter";

export const dynamic = "force-dynamic";

const ITEMS = [
  {
    title: "Привяжите домен",
    body: "Укажите свой домен при регистрации, и Shoppi найдёт все ссылки блогеров, ведущие на него.",
  },
  {
    title: "Клики без таблиц",
    body: "В кабинете сразу видно, какой товар и сколько раз кликнули: по каждой ссылке отдельно.",
  },
  {
    title: "Без заявок и отбора",
    body: "Регистрация открыта сразу. Не нужно ждать одобрения, чтобы увидеть первые данные.",
  },
];

export default async function BrandsPage() {
  await seedDemoAccounts();
  const domains = await listDistinctBrandDomains();

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav overlay />
      <RoleHero
        eyebrow="Для брендов"
        titlePrefix="Никто не продвигает продукт"
        titleEmphasis="так,"
        titleSuffix="как люди, которые его любят."
        subhead="Смотрите, кто из блогеров уже ссылается на ваш домен, и сколько кликов это приносит."
        ctaLabel="Подключить домен"
        ctaHref="/signup?role=brand"
        imageSeed="shoppi-brands"
      />
      <ValueList title="Аналитика без усилий" items={ITEMS} />
      <ShopByBrand domains={domains} />
      <LandingFooter />
    </main>
  );
}
