import { LandingNav } from "@/app/components/landing/LandingNav";
import { RoleHero } from "@/app/components/landing/RoleHero";
import { ValueList } from "@/app/components/landing/ValueList";
import { LandingFooter } from "@/app/components/landing/LandingFooter";

const ITEMS = [
  {
    title: "Своя витрина",
    body: "Публичная страница вида shoppi.ru/вы — добавляйте товары и делитесь одной ссылкой.",
  },
  {
    title: "Ссылка в один клик",
    body: "Вставьте любую ссылку на товар, укажите категорию — Shoppi сам обернёт её и начнёт считать переходы.",
  },
  {
    title: "Клики в реальном времени",
    body: "В кабинете видно, сколько раз перешли по каждой вещи — без ручных таблиц и догадок.",
  },
];

export default function CreatorsPage() {
  return (
    <main className="flex-1 flex flex-col">
      <LandingNav overlay />
      <RoleHero
        eyebrow="Для кураторов"
        titlePrefix="Твой вкус —"
        titleEmphasis="теперь"
        titleSuffix="витрина."
        subhead="Публикуйте то, что реально выбрали сами — без чужого алгоритма между вами и вашей аудиторией."
        ctaLabel="Стать куратором"
        ctaHref="/signup"
        imageSeed="shoppi-creators"
      />
      <ValueList eyebrow="Что вы получаете" title="Инструменты куратора" items={ITEMS} />
      <section className="px-6 md:px-10 py-14 text-center">
        <p className="text-stone text-sm max-w-md mx-auto mb-2">
          Регистрация открыта всем — без заявки и модерации.
        </p>
      </section>
      <LandingFooter />
    </main>
  );
}
