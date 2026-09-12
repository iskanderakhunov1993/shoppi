/**
 * One-off: adds a handful of extra creator accounts beyond the three demo
 * ones, so the catalog has more than Белла/Максим/Соня to browse.
 * Run with: node --experimental-strip-types scripts/seed-extra-creators.ts
 */
import { seedCreatorAccount } from "../lib/seed.ts";

async function main() {
  await seedCreatorAccount(
    "landing-vera@shoppi.dev",
    "Вера",
    "Скандинавский минимализм в доме и на себе — покупаю редко, но на годы.",
    [
      {
        title: "Плед из шерсти мериноса",
        category: "clothing",
        url: "https://www.wildberries.ru/catalog/198234561/detail.aspx",
        image: "https://picsum.photos/seed/shoppi-vera-pled/600/450",
        price: 6900,
      },
      {
        title: "Керамическая кружка ручной работы",
        category: "clothing",
        url: "https://www.ozon.ru/product/keramika-2384710/",
        image: "https://picsum.photos/seed/shoppi-vera-mug/600/450",
        price: 1450,
      },
    ]
  );

  await seedCreatorAccount(
    "landing-artem@shoppi.dev",
    "Артём",
    "Бег, велосипед, восстановление — снаряжение, которое реально использую каждую неделю.",
    [
      {
        title: "Компрессионные гетры для бега",
        category: "mens",
        url: "https://www.wildberries.ru/catalog/205871234/detail.aspx",
        image: "https://picsum.photos/seed/shoppi-artem-getry/600/450",
        price: 1890,
      },
      {
        title: "Массажный ролл для восстановления",
        category: "mens",
        url: "https://www.ozon.ru/product/rolik-massazh-3021984/",
        image: "https://picsum.photos/seed/shoppi-artem-roll/600/450",
        price: 2490,
      },
    ]
  );

  await seedCreatorAccount(
    "landing-liza@shoppi.dev",
    "Лиза",
    "Уход за кожей после 30 — состав важнее упаковки, тестирую всё на себе минимум месяц.",
    [
      {
        title: "Ретинол-сыворотка 0.3%",
        category: "cosmetics",
        url: "https://www.wildberries.ru/catalog/211456789/detail.aspx",
        image: "https://picsum.photos/seed/shoppi-liza-retinol/600/450",
        price: 1790,
      },
      {
        title: "Солнцезащитный крем SPF 50 без белого следа",
        category: "cosmetics",
        url: "https://www.ozon.ru/product/spf-krem-4192837/",
        image: "https://picsum.photos/seed/shoppi-liza-spf/600/450",
        price: 990,
      },
    ]
  );

  await seedCreatorAccount(
    "landing-oleg@shoppi.dev",
    "Олег",
    "Классика в мужском гардеробе — рубашки, обувь и ремни, которые не выйдут из моды через сезон.",
    [
      {
        title: "Рубашка из плотного хлопка, белая",
        category: "clothing",
        url: "https://www.wildberries.ru/catalog/187654321/detail.aspx",
        image: "https://picsum.photos/seed/shoppi-oleg-shirt/600/450",
        price: 3490,
      },
      {
        title: "Кожаные дерби, коричневые",
        category: "clothing",
        url: "https://www.ozon.ru/product/derbi-koja-5623741/",
        image: "https://picsum.photos/seed/shoppi-oleg-shoes/600/450",
        price: 8900,
      },
    ]
  );

  console.log("Готово: добавлены Вера, Артём, Лиза, Олег (если их ещё не было).");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
