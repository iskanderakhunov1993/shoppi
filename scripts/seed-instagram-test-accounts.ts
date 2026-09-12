/**
 * One-off: adds 5 test creator accounts with Instagram/TikTok handles
 * filled in, for testing the social-icons feature on the storefront
 * header. Fake people, clearly test-only emails — not meant to look
 * like real curators, just to exercise the UI with real data flowing
 * through the real code path (seedCreatorAccount -> updateCreator).
 *
 * Run with: node --experimental-strip-types --env-file=.env.local scripts/seed-instagram-test-accounts.ts
 */
import { seedCreatorAccount } from "../lib/seed.ts";
import { getCreatorByUserId, updateCreator, getUserByEmail } from "../lib/store.ts";

const ACCOUNTS = [
  {
    email: "test-ig-nika@shoppi-test.dev",
    name: "Ника",
    bio: "Уход за кожей и волосами — тестирую сама, пишу честно.",
    instagram: "nika.test.picks",
    tiktok: "nikatestpicks",
    products: [
      { title: "Тестовая сыворотка", category: "cosmetics" as const, url: "https://www.wildberries.ru/catalog/900000001/detail.aspx", price: 1200 },
    ],
  },
  {
    email: "test-ig-oleg@shoppi-test.dev",
    name: "Олег",
    bio: "Инструменты и снаряжение для дачи и гаража.",
    instagram: "oleg.test.tools",
    tiktok: undefined,
    products: [
      { title: "Тестовый шуруповёрт", category: "tools" as const, url: "https://www.wildberries.ru/catalog/900000002/detail.aspx", price: 3400 },
    ],
  },
  {
    email: "test-ig-dasha@shoppi-test.dev",
    name: "Даша",
    bio: "Базовый гардероб без лишнего — вещи на сезон вперёд.",
    instagram: "dasha.test.style",
    tiktok: "dashatestwear",
    products: [
      { title: "Тестовое пальто", category: "clothing" as const, url: "https://www.wildberries.ru/catalog/900000003/detail.aspx", price: 5600 },
    ],
  },
  {
    email: "test-ig-pavel@shoppi-test.dev",
    name: "Павел",
    bio: "Мужской гардероб и аксессуары, ничего показного.",
    instagram: "pavel.test.wear",
    tiktok: undefined,
    products: [
      { title: "Тестовый ремень", category: "mens" as const, url: "https://www.wildberries.ru/catalog/900000004/detail.aspx", price: 1900 },
    ],
  },
  {
    email: "test-ig-katya@shoppi-test.dev",
    name: "Катя",
    bio: "Декоративная косметика — проверяю стойкость сама.",
    instagram: "katya.test.makeup",
    tiktok: "katyatestmakeup",
    products: [
      { title: "Тестовая тушь", category: "cosmetics" as const, url: "https://www.wildberries.ru/catalog/900000005/detail.aspx", price: 890 },
    ],
  },
];

async function main() {
  for (const acc of ACCOUNTS) {
    const existing = await getUserByEmail(acc.email);
    if (existing) {
      console.log(`Уже есть: ${acc.email}, пропускаю создание, но обновлю соцсети.`);
    }
    const creator = await seedCreatorAccount(acc.email, acc.name, acc.bio, acc.products);
    if (!creator) {
      console.error(`Не удалось создать/найти куратора для ${acc.email}`);
      continue;
    }
    await updateCreator(creator.id, {
      instagramHandle: acc.instagram,
      tiktokHandle: acc.tiktok,
    });
    const updated = await getCreatorByUserId((await getUserByEmail(acc.email))!.id);
    console.log(`OK: ${acc.name} -> /${updated?.slug} (instagram: ${updated?.instagramHandle ?? "—"}, tiktok: ${updated?.tiktokHandle ?? "—"})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
