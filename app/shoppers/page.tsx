import { seedDemoAccounts, listLandingCreators } from "@/lib/seed";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { RoleHero } from "@/app/components/landing/RoleHero";
import { ValueList } from "@/app/components/landing/ValueList";
import { CuratorGrid } from "@/app/components/landing/CuratorGrid";
import { LandingFooter } from "@/app/components/landing/LandingFooter";

export const dynamic = "force-dynamic";

const ITEMS = [
  {
    title: "Витрины, не лента",
    body: "Заходишь к конкретному куратору и видишь только то, что он выбрал — без рекламы и бесконечного скролла.",
  },
  {
    title: "Сохраняй в «Мой вкус»",
    body: "Понравившийся товар можно сохранить одной кнопкой и вернуться к нему позже из своего кабинета.",
  },
  {
    title: "Прямая ссылка на товар",
    body: "Каждая карточка ведёт напрямую к покупке — без посредников и лишних переходов.",
  },
];

export default function ShoppersPage() {
  seedDemoAccounts();
  const creators = listLandingCreators();

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />
      <RoleHero
        eyebrow="Для покупателей"
        titlePrefix="Место, чтобы"
        titleEmphasis="выбирать,"
        titleSuffix="а не листать."
        subhead="Косметика, мужские товары, одежда — только то, что советуют люди, которым ты доверяешь."
        ctaLabel="Смотреть кураторов"
        ctaHref="#curators"
        imageSeed="shoppi-shoppers"
      />
      <ValueList eyebrow="Что вы получаете" title="Покупки без алгоритма" items={ITEMS} />
      <CuratorGrid creators={creators} />
      <LandingFooter />
    </main>
  );
}
